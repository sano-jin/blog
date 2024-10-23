---
layout: post
title: Logs を用いた OCaml でのログ出力
author: sano
excerpt: "How to use dbuenzli/logs: A logging library in OCaml."
tags: ocaml
category: OCaml
assets: /assets/2024-10-23-logging-in-ocaml/
extra-classname: frame-image
image: assets/2024-10-23-logging-in-ocaml/logs.png
---

コードを書いているときに，
ログ出力したくなる場合がある．

OCaml の場合のログ出力に使うことのできるライブラリとして，以下などがある．

1. **[Async の Log モジュール](https://ocaml.org/p/async_unix/v0.15.0/doc/Async_unix/Log/index.html)**

   [Async](https://opensource.janestreet.com/async/) は
   Jane Street が開発している並行プログラミング用ライブラリ．

   恐らくは OCaml でのウェブ開発などではこれを用いることが多いのではないかと思っている．
   よく知らないけど．

   Async の中には [Log](https://ocaml.org/p/async_unix/v0.15.0/doc/Async_unix/Log/index.html)
   モジュールが存在する．

   Async を用いている場合は，これを使う一択だと思われる．

2. **[Logs (dbuenzli/logs)](https://github.com/dbuenzli/logs)**

   Logs はログ出力ためだけのシンプルなライブラリ．

   Logs のドキュメントは [ここにある](https://erratique.ch/software/logs/doc/Logs/index.html)．

   今回はこちらを使ってみる．

# シンプルな使い方

まず，Logs をインストールする．

```bash
opam install logs
```

ビルドシステムに dune を使っている場合は，
dune ファイルの依存関係に以下のように logs を追加する．

```lisp
;; dune
(executable
 (name main)
 (libraries logs logs.fmt)
)
```

OCaml コードの中では，以下のようにして使うことができる．

```ocaml
(* main.ml *)

let () =
  (* 標準の「reporter」を用いる（カスタム reporter については後で解説する）． *)
  Logs.set_reporter (Logs_fmt.reporter ());

  (* ログ出力のレベルを INFO に設定する（DEBUG などは出力しないようにする）． *)
  Logs.set_level (Some Logs.Info);

  (* INFO レベルのログを出力．Printf モジュールのようにして使うことができる． *)
  Logs.info (fun m -> m "Hello World! %d" 42);
```

このコードを実行すると，以下のようにログが出力できる．

```bash
$ dune exec ./main.exe
main.exe: [INFO] Hello World! 42
```

# タイムスタンプも表示させるには

ログに時刻も表示させるようにしたい．

このためには，カスタム reporter を実装して，それを指定してやれば良い．

時刻の取得などのために，今回は
[Core ライブラリ](https://github.com/janestreet/core) と
[Core_unix](https://github.com/janestreet/core_unix) を用いたので，
まずはそれをインストールしてやる．

（OCaml 標準ライブラリのものを利用しても良い．）

```bash
opam install core
opam install core_unix
```

dune ファイルの依存関係に Core, Core_unix も追加してやる．

```lisp
;; dune
(executable
 (name main)
 (libraries core core_unix logs logs.fmt)
)
```

タイムスタンプを取得する関数と，
カスタム reporter を実装する．

この際に，今回は main.ml にではなく，
util.ml という別ファイルを用意してそこに実装している．

（main.ml に直接実装しても良いが．）

util.ml の実装は以下のようになる．

```ocaml
(* util.ml *)

open Core


(** ログ出力用のタイムスタンプを文字列として返す． *)
let get_timestamp () =
  let now = Core_unix.time () in
  let tm = Core_unix.localtime now in
  let timestamp =
    Format.asprintf "%04d-%02d-%02d %02d:%02d:%02d"
      (tm.Core_unix.tm_year + 1900)
      (tm.Core_unix.tm_mon + 1) tm.Core_unix.tm_mday tm.Core_unix.tm_hour
      tm.Core_unix.tm_min tm.Core_unix.tm_sec
  in
  timestamp

(** タイムスタンプを用いたログ出力のための設定． *)
let reporter () =
  let report _src level ~over k msgf =
    let k _ =
      over ();
      k ()
    in
    msgf @@ fun ?header:_ ?tags:_ fmt ->
    let timestamp = get_timestamp () in
    if Poly.( = ) level Logs.App then
      Format.kfprintf k Format.std_formatter ("@[" ^^ fmt ^^ "@]@.")
    else
      Format.kfprintf k Format.std_formatter
        ("%s [%a] @[" ^^ fmt ^^ "@]@.")
        timestamp Logs.pp_level level
  in
  { Logs.report }
```

カスタム reporter の実装の詳細は余力があるタイミングで調べて拡充する．．．

正直，今は何をやっているのか，全然理解していない．

Logs のドキュメントには
[カスタム reporter の実装サンプルも書いてあり](https://erratique.ch/software/logs/doc/Logs/index.html#ex1)，
こちらを参考に改変したのだが，
このサンプルは Tag という機能？も組み合わせた例になっており，
私には初見ではイマイチ理解できなかった．

カスタム reporter を使うには，
main.ml での reporter の設定を，
以下のようにしてやれば良い．

```ocaml
(* main.ml *)

let () =
  (* カスタム reporter を用いる． *)
  Logs.set_reporter (Util.reporter ());

  Logs.set_level (Some Logs.Info);

  Logs.info (fun m -> m "Hello World! %d" 42);
```

この出力結果は以下のようになる．

```bash
$ dune exec ./main.exe
2024-10-23 21:34:57 [INFO] Hello World! 42
```

ブラーボ．

# 参考

1. **[Logs でログをとる](https://hackmd.io/@anqou/S1WwNaNdi)**

   このブログを先に見つけていたら，本稿は書いてなかったと思うが．．．
   まぁ本稿はタイムスタンプの表示をするサンプルコードを載せたということで．

2. **[OCaml で dolog を使ってログ出力をする](https://qiita.com/yoshihiro503/items/7dd3017f54961aee7d44)**

   どうやら初期設定でタイムスタンプも出してくれるっぽい．
   かなり良さげに見える．これを使うべきだったかもしれない．
