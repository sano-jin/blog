---
layout: post
title: CamlImages の使い方
author: sano
excerpt: How to use CamlImages?
tags: memo
category: memo
assets: /assets/2024-10-24-how-to-use-camlimages/
extra-classname: frame-image
image: assets/2024-10-24-how-to-use-camlimages/front.png
---

OCaml で画像処理を行いたい．

[CamlImages](https://opam.ocaml.org/packages/camlimages/)
というライブラリがあり，
おそらくはこれが標準的に用いられているようなので，
これを試してみた．

OCaml の標準的なビルドツールである，
[Dune](https://dune.readthedocs.io/en/stable/index.html)
を用いている．

# Dune で初期サンプルコードを作る

適当なディレクトリを作っておく．

```bash
mkdir test_camlimages
cd test_camlimages
```

Dune で main.ml 等を作る[^1]．

```bash
dune init exec main
```

[^1]: main である必要はなく，例えば test_camlimages などでも良い．

`_build` ディレクトリと，
`dune` ファイルと，
`main.ml` ファイルができるはず．

`main.ml` の中身は以下のようになっている
（コメントの `(* main.ml *)` は後から付け足した）．

```ocaml
(* main.ml *)

let () = print_endline "Hello, World!"
```

早いこと実行したいが，
何故か dune-project ファイルがないとうまく動かないので，
作ってやる．

```bash
$ echo "(lang dune 3.0)" > dune-project
```

dune を使って実行してやると，`Hellow, World!` が出力できる．

```bash
$ dune exec ./main.exe
Hello, World!
```

```bash
$ opam install camlimages
```

```lisp
;; dune
(executable
 (public_name raytracing)
 (name main)
 (libraries
   core
   raytracing
   camlimages.core
   camlimages.png
   camlimages.jpeg
   ))
```

```ocaml
(* main.ml *)

let () =
  let width = int_of_string Sys.argv.(1)
  and length = int_of_string Sys.argv.(2)
  and name = Sys.argv.(3)
  and black = { Color.r = 0; g = 0; b = 0 }
  and white = { Color.r = 255; g = 255; b = 255 } in
  let image = Rgb24.make width length black in
  for i = 0 to width - 1 do
    for j = 0 to (length / 2) - 1 do
      Rgb24.set image i j white
    done
  done;
  Png.save name [] (Images.Rgb24 image)
```
