---
layout: post
title: Dune を使って OCaml コードのテンプレートを作る
author: sano
excerpt: How to create a OCaml code template using Dune
tags: ocaml
category: OCaml
assets: /assets/2024-10-26-how-to-create-a-ocaml-code-template/
extra-classname: frame-image
image: assets/2024-10-26-how-to-create-a-ocaml-code-template/front.png
---

![demo]({{ site.baseurl }}{{ page.assets }}front.png)

OCaml の標準的なビルドツールである
[Dune](https://dune.readthedocs.io/en/stable/index.html)
を用いて，
OCaml コードの初期テンプレートを作る方法を残しておく．

基本的には project を作るのが推奨されているような気がする．
<br/>
〉[1. Dune でプロジェクトのテンプレートを作る](#1-dune-でプロジェクトのテンプレートを作る)

1 ファイルだけ作って新しいライブラリなどをちょっと試してみるということもできる．
<br/>
〉[2. Dune で 1 ファイルのみからなるテンプレートを作る](#2-dune-で-1-ファイルのみからなるテンプレートを作る)

ライブラリをインストールして呼び出すためには，
dune ファイルの依存関係にインストールしたライブラリを書いておく必要がある．
<br/>
〉[3. ライブラリを追加するには](#3-ライブラリを追加するには)

Dune 自体は，
OCaml のパッケージマネージャである
[Opam](https://opam.ocaml.org/) を用いて，
[以下のように簡単にインストールできる](https://dune.readthedocs.io/en/stable/howto/install-dune.html)．

```bash
$ opam install dune
```

# 1. Dune でプロジェクトのテンプレートを作る

**Step 1.**
適当なディレクトリで，これ一発で OK[^1]．

```bash
$ dune init proj project_name
```

[^1]: プロジェクト名は今回は `project_name` だが，好きなもので良い．

このようなディレクトリができる．

```
project_name
├── _build
│   └── log
├── bin
│   ├── dune
│   └── main.ml
├── dune-project
├── lib
│   └── dune
├── project_name.opam
└── test
    ├── dune
    └── test_project_name.ml
```

`bin/main.ml` の中身は以下のようになっている
（コメントの `(* main.ml *)` は後から付け足した）．

```ocaml
(* main.ml *)

let () = print_endline "Hello, World!"
```

**Step 2.**
実行するには，
ディレクトリに入って
`dune exec`
すれば良い．

```bash
$ cd project_name
$ dune exec project_name
Hello, World!
```

もっとちゃんと知りたくなったら，
[Dune の公式の QuickStart](https://dune.readthedocs.io/en/stable/quick-start.html)
などを見れば良い．

# 2. Dune で 1 ファイルのみからなるテンプレートを作る

プロジェクトをがっつり作らずとも，
1 ファイルだけ作って新しいライブラリなどをちょっと試してみるということもできる．

**Step 1.**
適当なディレクトリを作っておく．

```bash
mkdir test_dune
cd test_dune
```

**Step 2.**
Dune で main.ml を作る[^2]．

```bash
dune init exec main
```

[^2]: main である必要はなく，例えば hello_world などでも良い．

→
`_build` ディレクトリと，
`dune` ファイルと，
`main.ml` ファイルができるはず．

`main.ml` の中身は以下のようになっている
（コメントの `(* main.ml *)` は後から付け足した）．

```ocaml
(* main.ml *)

let () = print_endline "Hello, World!"
```

**Step 3.**
早いこと実行したいが，
何故か dune-project ファイルがないとうまく動かない[^3]ので，
dune-project ファイルを作ってやる．

[^3]:
    `dune init exec` を使うに際して，
    既存のプロジェクトにファイルを追加するのではなく，
    ゼロから単一のファイルからなるテンプレートを作るということが，
    そもそも想定されていないのかも知れない．
    よく分からない．

```bash
$ echo "(lang dune 3.0)" > dune-project
```

**Step 4.**
dune を使って実行してやると，`Hellow, World!` が出力できる．

```bash
$ dune exec ./main.exe
Hello, World!
```

# 3. ライブラリを追加するには

新たにライブラリをインストールして，
それを利用したいなら，
以下のようにする．

**Step 1.**
[Opam](https://opam.ocaml.org/)
を使って目的のライブラリをインストールする．
例えば [Logs](https://github.com/dbuenzli/logs) をインストールするのであれば，
以下のようになる．

```bash
$ opam install logs
```

**Step 2.**
インストールしたライブラリを，
使いたい OCaml コードと同じディレクトリにある
`dune` ファイルの依存関係 `(libraries ...)` に追加する．
`dune` ファイルの初期生成時には，
`(libraries ...)` はないかも知れないが，
なかった場合は自分で追加する．
例えば `logs`, `logs.fmt` を追加するときは，`dune` ファイルは以下のようになる．

```lisp
;; dune
(executable
 (name main)
 (libraries logs logs.fmt)
)
```

**Step 3.**
インストールしたライブラリを OCaml コードから呼び出す．
例えば，`Logs` を用いてログ出力するには，以下のようになる．

```ocaml
(* main.ml *)

let () =
  Logs.set_reporter (Logs_fmt.reporter ());
  Logs.set_level (Some Logs.Info);
  Logs.info (fun m -> m "Hello World! %d" 42);
  (* A log message, "main.exe: [INFO] Hello World! 42", will be printed. *)
```

**Step 4.**
`dune exec` で実行する．

# まとめ

一応
[Dune](https://dune.readthedocs.io/en/stable/quick-start.html)
の公式ページに全部書いてあるので参照されたし．

自分の場合は，公式ページを見てもパッと見ではあんまり頭に入ってこなかったのもあり，
またすぐに忘れそうなので，
こうして簡単にまとめておいた．

どちらかというと自分のためという感じだけど，
もしだれかの役に立ったりとかしたら，ハッピー．
