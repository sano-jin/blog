---
layout: post
title: Menhir を用いた，エラーハンドリングを適切に行うパーサの実装
excerpt: >
  OCaml のパーサジェネレータ Menhir には，
  エラーハンドリングを宣言的に記述する仕組みがありますが，
  その分かりやすい解説は私の知る限りでは存在しません．
  本稿では Menhir プロジェクト内に用意されたデモを動かしながら，
  その使い方を解説します．
categories: [Programming Language]
author: sano
---

> OCaml のパーサジェネレータ Menhir には，
> エラーハンドリングを宣言的に実装する仕組みがありますが，
> その分かりやすい解説は私の知る限りでは存在しません．
> 本稿では Menhir プロジェクト内に用意されたデモをベースにしたコードを動かしながら，
> その使い方を解説します．

この美しい世界には，
[OCaml という素晴らしいプログラミング言語](https://ocaml.org/about)
が存在します．
この言語は非常に多目的であり，
例えば言語処理系（コンパイラやインタプリタ）を構築することも可能です．
実際，
[OCaml のコンパイラ](https://github.com/ocaml/ocaml)
は OCaml 自身で実装されています．

言語処理系は，ソースコードを読み取り，
機械語などの形式に変換するために，
まずソースコードをトークンの列へ変換する「字句解析」を行い，
次にトークンの列を抽象構文木という木構造へ変換する「構文解析」を行います．

特に，構文解析の実装は，ゼロから自力で行うと非常に骨の折れる作業となります．
そのため，一般的にはパーサジェネレータなどのツールを使用します．
OCaml では，[Menhir という優れたパーサジェネレータ](http://gallium.inria.fr/~fpottier/menhir/)
が利用可能です．
このツールを活用することで，構文解析の実装を手軽に行うことができます．

Menhir には先進的なエラーハンドリングの仕組みがあり，
ユーザが構文的な間違いを含むコードを書いた際に適切なエラーメッセージを出力する機能を，
最小限の手間で実装できます．
ただし，この機能は
[公式ドキュメント](http://gallium.inria.fr/~fpottier/menhir/manual.html)
内では言及されており，
また，
[Menhir の gitlab リポジトリ内にデモとして用意](https://gitlab.inria.fr/fpottier/menhir/-/tree/master/demos/calc-syntax-errors)
されてはいるものの，
分かりやすい解説などは私の知る限りでは提供されていません．

そこで本稿では，
Menhir を用いてエラーハンドリングを含むパーサを生成する方法について，
私が模索した結果を共有し，解説したいと思います．

## サンプルコード及びその動かし方

本稿では
[INRIA が提供している Menhir の公式リポジトリ](https://gitlab.inria.fr/fpottier/menhir/)
内のデモとして提供されている
[`/demo/calc-syntax-errors`](https://gitlab.inria.fr/fpottier/menhir/-/tree/master/demos/calc-syntax-errors)
をベースしたコードを用いて解説します．

Menhir などの必要なライブラリをインストールするために，
[OCaml の package manager である Opam](https://opam.ocaml.org/) が必要です．

このコードは
[dune という OCaml のビルドシステム](https://dune.readthedocs.io/en/stable/)
を用いてビルド，実行します．
dune も Opam を用いてインストールすることができます．
ビルドは以下のようにしてできます．

```bash
git clone https://github.com/sano-jin/menhir-error.git
cd menhir-error
opam install . # 依存するライブラリのインストール
dune build # プロジェクトのビルド
```

以下のようにして，
`examples/calc00.exp` を構文解析してみましょう．[^1]

```bash
dune exec example/calc00.exp
```

[^1]:
    `dune exec` はデフォルトではビルドできているか確認してから実行を行います．
    この際，進捗状況がパーセントとして表示されます．
    この表示が煩わしい場合は，`--no-build` などをつけて，
    `dune exec --no-build -- examples/calc00.cp`
    のようにして実行することで，
    ビルドせずに直接実行することができます．

---

ただし，Menhir 全体はそれなりにサイズの大きいプロジェクトであるため，
取り回しの容易さのために，今回使用するコードを別途別のリポジトリに用意しました．
これらのコードは私が実装したものではなく，
Menhir 開発チームの功績によるものだということを，
断っておきます．
