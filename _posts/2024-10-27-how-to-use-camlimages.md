---
layout: post
title: "OCaml で画像処理をしてみる：CamlImages の使い方"
author: sano
excerpt: "How to use CamlImagesimage for image processing in OCaml?"
tags: memo
category: memo
assets: /assets/2024-10-27-how-to-use-camlimages/
extra-classname: frame-image
image: assets/2024-10-27-how-to-use-camlimages/front.png
---

![demo]({{ site.baseurl }}{{ page.assets }}front.png)

OCaml で画像処理を行いたい．

OCaml で画像を扱うためには，
[CamlImages](https://opam.ocaml.org/packages/camlimages/)
というライブラリがあり，
おそらくはこれが標準的に用いられているようなので，
これを試してみた．

[(stack**overflow**) How to read a bitmap in OCAML?](https://stackoverflow.com/questions/612886/how-to-read-a-bitmap-in-ocaml)
にあった，上下が白黒で分かれている四角を PNG で保存するコードを動かしてみる．

# CamlImages の使い方

**Step 1.**
まずは Dune で OCaml の初期テンプレートを作る．
このやり方は
[Dune を使って OCaml コードのテンプレートを作る方法]({{ site.baseurl }}/2024/10/26/how-to-create-a-ocaml-code-template)
に書いたので，
適宜参照されたし．

要約すると，以下のようにして，
すぐに実行可能な main.ml ファイルを作ることができる．

```bash
$ mkdir test_camlimages
$ cd test_camlimages
$ dune init exec main
$ echo "(lang dune 3.0)" > dune-project
```

これで，`_build` ディレクトリと，
`main.ml`, `dune`, `dune-project` ファイルができる．

**Step 2.**
CamlImages をインストールする．

```bash
$ opam install camlimages
```

**Step 3.**
`dune` ファイルの依存関係に
`camlimages.core`,
`camlimages.png`
を追加してやる．

```lisp
;; dune
(executable
 (name main)
 (libraries
   camlimages.core
   camlimages.png
   ))
```

**Step 4.**
`main.ml` ファイルに例えば以下のようなコードを書く．
これはプログラム呼び出し時にコマンドラインから幅と高さと保存するファイル名を取得し，
その幅と高さで上部を白，下部を黒色で塗った四角をそのファイル名で PNG で保存するコード[^1]．

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

**Step 5.**
`main.ml` を実行すると，PNG 画像が保存できる．

```bash
$ dune exec ./main.exe 100 100 output.png
```

保存された output.png は以下のようになる．

![demo]({{ site.baseurl }}{{ page.assets }}output.png)

ハッピー．

# 参考

1. [(stack**overflow**) How to read a bitmap in OCAML?](https://stackoverflow.com/questions/612886/how-to-read-a-bitmap-in-ocaml)

   今回動かしているのは，ここに提示されていたコードほぼそのままである．
   ただし，stackoverflow 上のものは，レコード black/white を作る際に
   `Color.Rgb.r` のようにしてフィールドを指定していたが，
   最新の CamlImages ではそれではコンパイルが通らず，
   `Color.r` のようにする必要があった．

   あと，dune の依存関係に何を追加すれば良いのか，かなり悩んだ．
   CamlImages のコア機能は `camlimages.core` で提供されているようだ．
   当初はそれが `camlimages` でインクルードできるものかと思って，そのように指定していた．
   当然コンパイルは通らず，かなりの時間を費やしてしまった．

   そういったこともあり，とりあえず最低限動かすところまで，補足しておいた．

[^1]:
    [(stack**overflow**) How to read a bitmap in OCAML?](https://stackoverflow.com/questions/612886/how-to-read-a-bitmap-in-ocaml)
    ここに提示されていたコードほぼそのまま．
