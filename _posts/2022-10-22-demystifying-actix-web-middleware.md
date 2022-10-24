---
layout: post
title: "Actix Web ミドルウェアの謎解き"
excerpt: Demystifying Actix Web Middleware
author: sano
tags: rust actix-web middleware web-development
category: Actix-web
---

[Demystifying Actix Web Middleware (Daniel Imfeld)](https://imfeld.dev/writing/actix-web-middleware)
の日本語訳です[^5]．

[^5]:
    意訳している部分が多いです．
    理解が追いついていない部分が（たくさん）あります．
    （助けてください泣）．

---

2021-06-07 に書きました．

[Ergo task orchestrator](https://github.com/dimfeld/ergo) のサイドプロジェクトでは，
バックエンドを全て Rust で書いています．
他の本物のプロジェクトと同じように，
**ミドルウェア** をちょっと書く必要があります．
Actix Web のための簡単なサンプルはたくさんありますが，
それらをちゃんと理解するためにはもう少し努力が必要でした．

JavaScript のミドルウェアは，
多くの場合，
関数を一つ書けば十分です．
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
[Transform](https://docs.rs/actix-web/4.0.0-beta.4/actix_web/dev/trait.Transform.html)
や
[Service](https://docs.rs/actix-web/4.0.0-beta.4/actix_web/dev/trait.Service.html)
の実装が必要だし，
上記の JavaScript の例での `user` オブジェクトのように，
後で追加のデータ（注：ユーザの認証情報とか）を取り出したいときには，
[FromRequest](https://docs.rs/actix-web/4.0.0-beta.4/actix_web/trait.FromRequest.html)
を実装するエクストラクタも必要かも．

Actix は，お助けマン
[wrap_fn](https://docs.rs/actix-web/4.0.0-beta.4/actix_web/struct.Scope.html#method.wrap_fn)
を提供しています．
これは，JavaScript の例のようなクロージャ（注：自由変数を含まない関数）
だけのミドルウェアなら作ることができます．
でも，そうでない場合は仕方がない．．．
水面下で何が起こっているかを見ていきましょう．

> この記事では，
> `actix-web` 4.0 で使われている，
> `actix-service` version 2 のミドルウェアのトレイトを使っています．
> `actix-web` 3 との主な違いは，
> `Transform`トレイトが，
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

# `Service`トレイト

Actix の `Service` は，
リクエストを受け取って，レスポンスを返す，あらゆるものを表しています．
例えば，HTTP です．
これは，ルートハンドラとミドルウェアを含みます．
でも，`Service` は HTTP だけにしか対応していないわけではないです．

ミドルウェアとは，
ある作業を行うとともに，
別の `Service` を呼び出す `Service` の特殊なケースであり，
ミドルウェアの別のレイヤやエンドポイントハンドラである可能性もあります[^3]．

[^3]: which 以降がどこにかかっているのか，自信がない．

> この `Service` トレイトは，
> `hyper` や `tower` のクレートにある `Service` トレイトと同じものです．
> いずれはそれらが統合され，
> 一つのクレートからこのトレイトが扱えるようになり，
> 複数のフレームワークに対応したミドルウェアが作りやすくなることを期待しています．

`Service` トレイトの中身を見てみましょう．
[本物のコード](https://github.com/actix/actix-net/blob/983abec77d3d57e13aaa4773e23befd1643bf914/actix-service/src/lib.rs#L93)
はたくさんコメントが書いてあるけど，
見やすくするために消しておきました．

```rust
pub trait Service<Req> {
    /// Responses given by the service.
    /// Service から返されるレスポンス．
    type Response;

    /// Errors produced by the service when polling readiness or executing call.
    /// service が，読み込みのポーリングや，実行呼び出しの際に発生させるエラー．
    type Error;

    /// The future response value.
    /// 返り値 (future)
    type Future: Future<Output = Result<Self::Response, Self::Error>>;

    /// Returns `Ready` when the service is able to process requests.
    //// Service がリクエストを処理できるなら，`Ready` を返す．
    fn poll_ready(&self, ctx: &mut task::Context<'_>) -> Poll<Result<(), Self::Error>>;

    /// Process the request and return the response asynchronously.
    /// 非同期にリクエストを処理して，レスポンスを返す．
    fn call(&self, req: Req) -> Self::Future;
}
```

actix-web のミドルウェアでは，
`Response` は常に必ず `actix_web::dev::ServiceResponcse` で，
`Error` は必ず `actix_web::Error` になっています．

Axctix は，「service が呼び出されても大丈夫か」をチェックするのに，
`poll_ready` を呼びます．
これは，例えば，
「その service が同時に呼び出される回数を制限する必要がある」時とかに，
役に立つかも．
でも大抵は，この関数を自前で実装する必要はないです．
`actix-wervice` version 2 は，
wrap された service にこの関数を渡すための
`forward_ready!` マクロを用意してくれています．

`call` 関数が，
`Service` トレイトの全ての **本当の** 機能を実現するところです．
これは，JavaScript の例とそんなに変わりません．
Service が呼び出されても大丈夫なら，
リクエストオブジェクトとレスポンスオブジェクトをチェックしたり，
更新したり，
ラップされた service [^1] を呼び出したりすることができます．
JavaScript のスタイルと異なる点は主に 3 つあります．

1. JavaScript のほとんどのフレームワークでは，
   レスポンスオブジェクトはすでに存在していて，ミドルウェアに渡されます．
   対して，ここでは，レスポンスオブジェクトは，
   ラップされた service によって作られます．
2. Error は通常の Rust の方法で処理されます：
   ラップされた service を呼び出すための `next` 関数をオーバーロードするのではなくて，
   `Result::Err` を返します．
3. Rust は強い静的型付けなので，
   余計なデータをリクエストに勝手にくっつけることはできません．
   その代わりに，Actix は **extension** （拡張）と言うものがあって，
   これを使って追加のデータを，後で取り出せるように，リクエストにくっつけられます．
   この例を後で見せます．

[^1]: 何に？

# `Transform` トレイト

さて，
`Service` の仕組みがある程度わかったところで，
`Transform` の出番はどこでしょうか？
抽象的には，
service を別の service で包んで「変換」するのですが，
私たちの場合は factory と考えた方が分かりやすいでしょう．
`Transform` の実装の唯一の仕事は，
他の service をラップする新しいミドルウェアのインスタンスを作成することです．

![img](https://imfeld.dev/images/actix-middleware-transform.svg)
注：Transform が endpoint service を受け取って，
それをラップしたミドルウェアを返している．

`Transform` にはいくつかの関連型がありますが，
これらはほとんどが `Service` の型と同じものを記述しています．
唯一新しい型は `InitError` で，
ミドルウェアのインスタンスを作成する際に発生する可能性のあるエラーがあれば，
それを示しています．

```rust
pub trait Transform<S, Req> {
    /// Responses produced by the service.
    /// service がつくるレスポンスオブジェクト
    type Response;

    /// Errors produced by the service.
    /// service が発生した Error
    type Error;

    /// The `TransformService` value created by this factory
    /// この factory が作る `TransformService` の値（の型）
    type Transform: Service<Req, Response = Self::Response, Error = Self::Error>;

    /// Errors produced while building a transform service.
    /// この transform service を作成する際に発生したエラー
    type InitError;

    /// The future response value.
    /// 返り値 (future)
    type Future: Future<Output = Result<Self::Transform, Self::InitError>>;

    /// Creates and returns a new Transform component, asynchronously
    /// 新しい Transform 要素を非同期的に作って返す
    fn new_transform(&self, service: S) -> Self::Future;
}
```

`new_transform` という関数があります．
これは．
ミドルウェア `Service` の新しいインスタンスを生成します．
作成されたミドルウェアは引数 `service` で渡された service をラップする必要があります．

`new_transform` は `Future` を返すので，
ミドルウェアの作成中にいくつかの非同期処理を行うことができます．
我々は，新しいオブジェクトを作れれば良いだけなので，
`Ready` future 型を使って，
新しいミドルウェアを future の中に包みます．
これは JavaScript の `Promise.resolve` を使って，
`Promise` の中に値を入れるのと同じようなものです．

# ミドルウェアの実装

[Ergo](https://github.com/dimfeld/ergo) の場合，
最初に作ったミドルウェアはユーザーデータを取得する認証器なので，
ここではそれを例にして説明します．

まず，
ミドルウェアの service 構成です．
ミドルウェアにはラップされる service と，
リクエストごとにユーザーを見つけることができるような情報をもつ
`AuthData` オブジェクトが含まれます．

```rust
pub type AuthenticationInfo = Rc<AuthenticationResult>;
pub struct AuthenticateMiddleware<S> {
    auth_data: Rc<AuthData>,
    service: Rc<S>,
}
```

`AuthenticationInfo`は型のエイリアスで，
後でアプリの他の部分から認証情報を利用できるようにするために使用します．
Actix Web では複数のシングルスレッドランタイムを使用しており，
スレッド間でデータを送信することがないため，
ここでは`Arc`ではなく`Rc`を使用することができます．

次に，
ミドルウェアの`Service`の実装です．
型パラメータ `B` は service から返されるボディのタイプを表していて，
`ServiceResponse<B>` のタイプシグネチャに渡します．
今回は特に気にすることはありません．

```rust
impl<S, B> Service<ServiceRequest> for AuthenticateMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    actix_service::forward_ready!(service);
```

この最初の部分の実装は，
ほとんどのミドルウェアでほとんど同じになるでしょう．
前述の `forward_ready` を使って，
`Service::poll_ready` をラップされた service に渡しています．

他の唯一の注目すべき点は，
Future 型に `LocalBoxFuture` を使用していることです．
`async` ブロックが返す opaque future 型[^2]を扱う必要がなく，
`async` ブロックを簡単に使用できるようになります．
`LocalBoxFuture` は `BoxFuture` の非送信 (`Send` しない) 版です．
`Arc` の代わりに `Rc` を使用できるのと同じ原理です．

[^2]: opaque futre type とは？

    - [rust の opaque type](https://rust-lang.github.io/chalk/book/clauses/opaque_types.html)
    - [swift の opaque result type](https://qiita.com/koher/items/338d2f2d0c4731e3508f)

```rust
    fn call(&self, req: ServiceRequest) -> Self::Future {
	// Clone the Rc pointers so we can move them into the async block.
        let srv = self.service.clone();
        let auth_data = self.auth_data.clone();

        async move {
            // Get the session cookie value, if it exists.
            let id = req.get_identity();
            // See if we can match it to a user.
            let auth = auth_data.authenticate(id, &req).await?;
            if let Some(auth) = auth {
                // If we found a user, add it to the request extensions
                // for later retrieval.
                req.extensions_mut()
                  .insert::<AuthenticationInfo>(Rc::new(auth));
            }

            let res = srv.call(req).await?;

            Ok(res)
        }
        .boxed_local()
    }
}
```

このブロックは，
`actix-identity` ミドルウェアが管理するリクエストクッキーからセッション ID を取得し，
それを `AuthData::authenticate` に渡して，
データベースからユーザ情報を取得します．
ユーザが見つかれば，
`extension` API を使ってリクエストに挿入します．
Actix はここで type パラメータの `TypeId` をキーとして使っているので，
後で同じ `AuthenticationInfo` 型を使って取得することになります．

> TODO: `TypeId` とは？

ここでは，
未認証のリクエストに対してエラーを投げることはありません．
認証されたユーザーでなくてはいけないかは，
後のコードで決定します．

次に，
`Transform` を実装した factory オブジェクトを用意します．

```rust
pub struct AuthenticateMiddlewareFactory {
    auth_data: Rc<AuthData>,
}

impl AuthenticateMiddlewareFactory {
    pub fn new(auth_data: AuthData) -> Self {
        AuthenticateMiddlewareFactory {
            auth_data: Rc::new(auth_data),
        }
    }
}

impl<S, B> Transform<S, ServiceRequest> for AuthenticateMiddlewareFactory
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = AuthenticateMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthenticateMiddleware {
            auth_data: self.auth_data.clone(),
            service: Rc::new(service),
        }))
    }
}
```

すでに説明したように，
型はほとんどミドルウェアの service 型に使われるものと一致しており，
`new_transform` はミドルウェアのインスタンスを作成し，
`ready` を使って future にラップします．

最後に，
`wrap` を使ってこれをサーバに追加することができます．

```rust
let authdata = AuthData::new(...);
let identity = actix_identity::IdentityService::new(...);

App::new().service(
  web::scope("/api")
    .wrap(AuthenticateMiddlewareFactory::new(
      authdata.clone()
    ))
    .wrap(identity)
    .wrap(TracingLogger::default())
    .configure(web_app_server::config)
    .configure(tasks::handlers::config)
    .configure(status_server::config)
  )
```

# ユーザ情報の取得

ミドルウェアが組み込まれたので，
ルートハンドラや他のミドルウェア，
あるいはリクエストエクストラクタで使用することができます．

最初の 2 つの方法は，
`req.extensions().get::<AuthenticationInfo>()` というリクエスト拡張 API を使って，
正しい型を持つオブジェクトを探すというものです．
これは，
ミドルウェアから情報を追加するときに使用したのと同じ `TypeId` キーを使用します．

Actix はまた，
リクエストエクストラクタを多用しています．
`Route` ハンドラは一般的に `Data`，
`Path`，
`Json` などの型を使用してリクエストからの情報を公開します．
これらの型はすべて `FromRequest`トレイトを実装しています．
私たちは，
`AuthenticationInfo` を抽出するプロセスを容易にするために，
独自の実装を行うことができます．

```rust
pub struct Authenticated(AuthenticationInfo);

impl FromRequest for Authenticated {
    type Config = ();
    type Error = Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &actix_web::HttpRequest,
            payload: &mut actix_web::dev::Payload) -> Self::Future {

        let value = req.extensions().get::<AuthenticationInfo>().cloned();
        let result = match value {
            Some(v) => Ok(Authenticated(v)),
            None => Err(Error::AuthenticationError),
        };
        ready(result)
    }
}

impl std::ops::Deref for Authenticated {
    type Target = AuthenticationInfo;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
```

この関数も extensions API を利用してユーザー情報を取得し，
`Ready` future の内部で返しています．
また，
エクストラクタ`Authenticated` に埋め込まれた，
`AuthenticationInfo` オブジェクトを簡単に使用できるように，
`Deref` を実装しています．

`Config` 型は少しわかりにくく，
Actix Web のかなり古いバージョンからの遺物のように見えます．
現在，
この型はほとんどユニット型であり，
この型が使用されているいくつかの場所では，
抽出器が使用する関連型をドキュメント化することだけが目的です．
最近の Github の PR では，
完全に削除することが提案されています．
(あなたがこれを読む頃には削除されていて，
私がブログ記事を更新していなかったら，
教えてください！)

> 注：削除されているね．

これでエクストラクタができたので，
任意のハンドラの引数で使うことができます．

```rust
#[put("/tasks/{task_id}")]
async fn write_task_handler(
    task_id: Path<String>,
    app_data: AppStateData,
    payload: Json<SomeObject>,
    req: HttpRequest,
    auth: Authenticated, // <- 【NEW!】認証情報
) -> Result<impl Responder> {
    let org = auth.org_id();
    let user = auth.user_id();
    todo!();
}
```

ここでの素晴らしいボーナスは，
リクエスト抽出器が認証情報を取得し，
さらにユーザーが実際に見つかったことを検証することです．
関数シグネチャにおけるその存在そのものが，
そのエンドポイントへの未認証のリクエストを適切なエラーで失敗させることができます．

私はまた，
`MaybeAuthenticated` 抽出器も実装しました．
これは同様に動作しますが，
常に成功し，
`Option<AuthenticationInfo>` を返します．
これにより，
ログインしているユーザーのために動作をカスタマイズすることができるハンドラが，
匿名ユーザーでも動作するようになります．

```rust
pub struct MaybeAuthenticated(Option<AuthenticationInfo>);

impl FromRequest for MaybeAuthenticated {
    // ... all the same associated types go here
    fn from_request(req: &HttpRequest,
            _payload: &mut actix_web::dev::Payload) -> Self::Future {
        let value = req.extensions().get::<AuthenticationInfo>().cloned();
        ready(Ok(MaybeAuthenticated(value)))
    }
}
```

このコードを書くとき，
難しいのはボイラープレートの目的と何をしているのかを理解することで，
実際にミドルウェアの目的別部分を書いてみると，
最終的にはそれほど複雑なものではありませんでした．
これで理解しやすくなったかな？
