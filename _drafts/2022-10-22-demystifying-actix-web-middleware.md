---
layout: post
title: Actix Web ミドルウェアの謎解き
excerpt: Demystifying Actix Web Middleware
author: sano
---

<https://imfeld.dev/writing/actix-web-middleware>

これを超適当に日本語訳する．

> 自分に分かれば良いやと言う感じ．かなり意訳しています．

---

2021-06-07 に書いたよ．

[Ergo task orchestrator](https://github.com/dimfeld/ergo) のサイドプロジェクトでは，
バックエンドを全て Rust で書いています．
他のどんな本物のプロジェクトと同じように，
**ミドルウェア** をちょっと書く必要があります．
Actix Web のための簡単なサンプルはたくさんありますが，
それらをちゃんと理解するためにはもう少し努力が必要でした．

Javascript のミドルウェアは，
多くの場合，
一つの関数だけを書けば大丈夫です．
正確な構文はフレームワークによって異なりますが，
通常は次のようなものです．

```javascript
async function middleware(request, response, next) {
  try {
    let session = request.cookies["sid"];
    if (session) {
      req.user = await getUser(session);
    }
  } catch (e) {
    return next(e);
  }

  next();
}

app.use(middleware);
```

対して，
Rust の他の多くのものと同様に，
Actix Web のミドルウェアはかなり複雑です．
Transform や Service の実装が必要だし，
上記の JavaScript の例での `user` オブジェクトのように，
後で追加のデータを取り出したいときには，
FromRequest を実装する extractor も必要かも．

Actix は，お助けマン wrap_fn を提供しています．
これは，JS の例のようなクロージャだけのミドルウェアなら作ることができます．
でも，そうでない場合は仕方がない．．．
フードの下で何が起こっているかを見ていこう．

> この記事では，
> `actix-web` 4.0 で使われている，
> `actix-service` version 2 のミドルウェアの trait を使っています．
> `actix-web` 3 との主な違いは，
> `Transform` trait が，
> 以前は関連型 (associated type) `Transform::Request` 型を持っていましたが，
> 現在は，`Transform<S, Req>` のように型パラメータを持っているという点です．
> 実務では，これはほとんど違いがありません．

**で，**
`Transform` と `Service`，
そして `Extractor` が必要なわけですが，
これらはどのように組み合わされるのでしょうか？
多くのミドルウェアでは，
複雑な部分のほとんどは定型文だったりします．
でも，その定型文が実際に何をしているのかを理解することは役に立ちます．
まず，
一歩下がって，
`Service` が何を表しているのか，
より一般的に理解しましょう．

# `Service` Trait

Actix の `Service` は，
リクエストを受け取って，レスポンスを返す，あらゆるものを表しています．
例えば，HTTP です．
これは，route handler と ミドルウェア を含みます．
でも，`Service` は HTTP だけにしか対応していないわけではないです．

> This Service trait is identical to the Service traits in the hyper and tower crates.
> I hope that eventually they will all merge together to pull the trait from a single crate,
> which will make it easier to create middleware that supports multiple frameworks.

Service trait の中身を見てみよう．
本物のコードはたくさんコメントが書いてあるけど，
見やすくするために消しといたよ．

```rust
pub trait Service<Req> {
    /// Responses given by the service.
    type Response;

    /// Errors produced by the service when polling readiness or executing call.
    type Error;

    /// The future response value.
    type Future: Future<Output = Result<Self::Response, Self::Error>>;

    /// Returns `Ready` when the service is able to process requests.
    fn poll_ready(&self, ctx: &mut task::Context<'_>) -> Poll<Result<(), Self::Error>>;

    /// Process the request and return the response asynchronously.
    fn call(&self, req: Req) -> Self::Future;
}
```

actix-web のミドルウェアでは，
`Response` は常に必ず `actix_web::dev::ServiceResponcse` で，
`Error` は必ず `actix_web::Error` になっています．

Axctix は，service が呼び出されても大丈夫になるかをチェックするのに，
`poll_ready` を呼びます．
これは，例えば，その service が同時に呼び出される回数を制限する必要がある時とかに，
役に立つかも．
大抵は，この関数を自前で実装する必要はないです．
`actix-wervice` version 2 は，
wrap[^1] された service にこの関数を渡すための
`forward_ready!` マクロを用意してくれています．

**本当の** 機能は，`call` 関数が提供してくれています．
これは，JavaScript の例題とそんなに変わりません．
必要に応じてリクエストオブジェクトとレスポンスオブジェクトをチェックしたり，
更新したり，
必要に応じてラップされたサービスを呼び出したりすることができます．
JavaScript のスタイルと異なる点は主に 3 つあります．

1. JavaScript のほとんどのフレームワークでは，
   レスポンスオブジェクトはすでに存在していて，ミドルウェアに渡されます．
   対して，ここでは，レスポンスオブジェクトは，
   ラップされた service によって作られます．
2. Error はフツーの Rust 風に扱われます：
   ラップされた service を呼び出すための `next` 関数をオーバーロードするのではなくて，
   `Result::Err` を返します．
3. Rust は強い静的型付けなので，
   余計なデータをリクエストに勝手にくっつけることはできません．
   その代わりに，Actix は **extension** （拡張）と言うものがあって，
   これを使って追加のデータを，後で取り出せるように，リクエストにくっつけられます．
   この例を後で見せます．

[^1]: 何に？

# The Transform Trait

さて，
`Service` の仕組みがある程度わかったところで，
`Transform` の出番はどこでしょうか？
抽象的には，
サービスを別のサービスで包んで「変換」するのですが，
私たちの場合は factory と考えた方が分かりやすいでしょう．
`Transform` の実装の唯一の仕事は，
他のサービスをラップする新しいミドルウェアのインスタンスを作成することです．

Transform にはいくつかの関連する型がありますが，
これらはほとんどが作成されたミドルウェア Service の型と同じものを記述しています．
唯一新しい型は InitError で，
ミドルウェアのインスタンスを作成する際に発生する可能性のあるエラーがあればそれを示しています．

```rust
pub trait Transform<S, Req> {
    /// Responses produced by the service.
    type Response;

    /// Errors produced by the service.
    type Error;

    /// The `TransformService` value created by this factory
    type Transform: Service<Req, Response = Self::Response, Error = Self::Error>;

    /// Errors produced while building a transform service.
    type InitError;

    /// The future response value.
    type Future: Future<Output = Result<Self::Transform, Self::InitError>>;

    /// Creates and returns a new Transform component, asynchronously
    fn new_transform(&self, service: S) -> Self::Future;
}
```
