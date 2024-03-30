---
layout: post
title: SATySFi で図をページ下部に配置する
excerpt: I created a package to allow SATySFi to have floating boxes at the bottom of pages.
tags: satysfi
category: SATySFi
author: sano
githuburl: https://github.com/sano-jin/satysfi-footnote-scheme-ext/blob/main/
assets: /assets/2024-03-30-satysfi-footnote-scheme-ext/
extra-classname: frame-image
---

[SATySFi](https://github.com/gfngfn/SATySFi) で図をページ下部に配置できるようにするパッケージを作ったので，
その使い方と実装について説明したい．

GitHub repo: [sano-jin/satysfi-footnote-scheme-ext](https://github.com/sano-jin/satysfi-footnote-scheme-ext)

![Demo image.]({{ site.baseurl }}{{ page.assets }}demo.png)
このようにページ下部に図を挿入できる．

# 背景

2024 年 3 月現在，私の調べた限り，SATySFi で図をページ下部に挿入することが可能なクラスファイルなどは提供されていなかった．

> [【随時更新】SATySFi ベストプラクティスまとめ#図の挿入](https://zenn.dev/monaqa/articles/2022-04-27-satysfi-bestpractice#図の挿入) <br/>
> LaTeX の `figure` 環境の指定位置でいう bottom (`b`) や page (`p`) に相当する機能を提供するクラスファイルは現在存在しないと思われます。
>
> - bottom は原理的には可能と思われます。探したらあるかもしれません。

確かに論文だと図はページ上部に配置することが多い気がするので実用上問題ないのかも知れないが，
個人的には特に個人用のメモだと図を引用したページの下部に図が配置されている方が見やすい気がする．
「原理的には可能と思われる」ということなので，自作してみた．

# デモの動かし方

`demo` ディレクトリにデモファイルを用意した．
ただし，[satysfi-base](https://github.com/nyuichi/satysfi-base) を利用しているので，これを事前にインストールしておく必要がある．

```bash
git clone https://github.com/sano-jin/satysfi-footnote-scheme-ext.git
cd satysfi-footnote-scheme-ext

# satysfi-base を利用しているので，base のインストールが必要．
opam install satysfi-base
satyrographos install

cd demo
satysfi sample.saty # sample.pdf が生成される．
```

この出力結果は [demo/sample.pdf]({{ page.githuburl }}demo/sample.pdf) となる．

![Sample image.]({{ site.baseurl }}{{ page.assets }}sample.png){: width="500" }

## What is satysfi-footnote-scheme-ext?

このパッケージは
[footnote-scheme.satyh](https://github.com/gfngfn/SATySFi/blob/master/lib-satysfi/dist/packages/footnote-scheme.satyh)
の拡張版であり，
footnote を活用して図をページ下部に配置することを可能にする．
footnote-scheme.satyh の後方互換性がある（ことを意図して作った[^1]）ので，
単に footnote-scheme.satyh の代わりにこのパッケージを用いるようにすれば良い．

このパッケージの `FootnoteScheme` モジュールが公開している field は

- `val initialize : unit -> unit`
- `val start-page : unit -> unit`
- `val main : context -> (int -> inline-boxes) -> (int -> block-boxes) -> inline-boxes`
- `val main-no-number : context -> (unit -> inline-boxes) -> (unit -> block-boxes) -> inline-boxes`
- (new) `val add-float-bottom : block-boxes -> inline-boxes`

であり，`add-float-bottom` が追加で新たに公開している field である．
（図を footnote の最上部に配置するために，
本来の footnote は一旦退避させておくなど，
他の関数も内部的にはかなり色々追加の処理をしている．）

## 使い方

1. footnote-scheme-ext.satyh を install する．
   現在まだ satyrographos に登録していないので，
   [src/footnote-scheme-ext.satyh]({{ page.githuburl }}src/footnote-scheme-ext.satyh) を手動でコピーしてきて手元に置いてやる必要がある．
   また，satysfi-base を利用しているので，これもインストールしてやる必要がある．
2. footnote-scheme.satyh の代わりに，
   このパッケージ footnote-scheme-ext.satyh を import/require する．
3. ページ下部に配置したい `float-box: block-text` がある場合は，
   `FootnoteScheme.add-float-bottom float-box` としてやる．
4. `FootnoteScheme.initialize`, `FootnoteScheme.start-page` などは，
   従来の footnote-scheme.satyh と同じように呼び出してやる必要がある．

[^1]: バグっていて違う挙動になる可能性はある．．．

## 使用例

[stdjareport.satyh](https://github.com/gfngfn/SATySFi/tree/master/lib-satysfi/dist/packages/stdjareport.satyh)
の `\figure` コマンドを改造して，top/bottom の指定ができるようにしたいとする．

1. satysfi-base をインストール．
   ```bash
   opam install satysfi-base
   satyrographos install
   ```
2. このパッケージ `footnote-scheme-ext` をインストール．
   とりあえずは
   [src/footnote-scheme-ext.satyh]({{ page.githuburl }}src/footnote-scheme-ext.satyh) を手動でコピーしてきて手元に置いてやる必要がある．
3. `stdjareport.sath` で `@require: footnote-scheme` の代わりに `@import: footnote-scheme-ext` する．
   ```
   @import: footnote-scheme-ext
   ```
4. まず `stdjareport.satyh` において，float box の position の型を定義しておく．
   ```
   type floatpos =
     | FloatPosTop
     | FloatPosBottom
   ```
5. `\figure` コマンドが `floatpos` を引数に取れるように型を変更する．
   ```
   direct \figure : [string?; floatpos?; inline-text; block-text] inline-cmd
   ```
6. `\figure` コマンド内部において，`floatpos` で `FloatPosBottom` を指定されたときは
   `FootnoteScheme.add-float-bottom` するようにする．
   ```
   % パラメータ floatpos を新たに追加．
   let-inline ctx \figure ?:labelopt ?:floatpos caption inner =
     ...
     let bb-inner = ... in
       match floatpos with
       | Some(FloatPosBottom) ->
           % FloatPosBottom を指定されたときは footnote-scheme-ext の関数を用いてページ下部に配置する．
           FootnoteScheme.add-float-bottom bb-inner
       | _ ->
         hook-page-break (fun pbinfo _ -> (
           let () = display-message (`register `# ^ (arabic pbinfo#page-number)) in
           ref-float-boxes <- (pbinfo#page-number, bb-inner) :: !ref-float-boxes
         ))
   ```
7. ユーザに `FloatPosBottom` などのように書かせるのが手間なら，
   [easytable](https://github.com/monaqa/satysfi-easytable) などのように
   alias 用のコマンドを作っておく．
   例えば以下のようにすることで，
   ユーザは `open FloatPosAlias in` をすれば，
   `` \figure ?:(`label`) ?:(b) {This is a caption} <...> ``
   のようにして使うことができる．
   ```
   module FloatPosAlias : sig
     val t : floatpos
     val b : floatpos
   end = struct
     let t = FloatPosTop
     let b = FloatPosBottom
   end
   ```

これらの改造を施した stdjareport.satyh が，
[demo/stdjareport.satyh]({{page.githuburl}}demo/stdjareport.satyh) である．

`diff` をとった結果を以下に貼っておく．

```diff
10,11c10
< @import: ../src/footnote-scheme-ext
< % @require: footnote-scheme-ext/footnote-scheme-ext
---
> @require: footnote-scheme
13,15d11
< type floatpos =
<   | FloatPosTop
<   | FloatPosBottom
17,24d12
< module FloatPosAlias : sig
<   val t : floatpos
<   val b : floatpos
< end = struct
<   let t = FloatPosTop
<   let b = FloatPosBottom
< end
<
59c47
<   direct \figure : [string?; floatpos?; inline-text; block-text] inline-cmd
---
>   direct \figure : [string?; inline-text; block-text] inline-cmd
176,177c164
<   % パラメータ floatpos を新たに追加．
<   let-inline ctx \figure ?:labelopt ?:floatpos caption inner =
---
>   let-inline ctx \figure ?:labelopt caption inner =
198,206c185,188
<       match floatpos with
<       | Some(FloatPosBottom) ->
<           % FloatPosBottom を指定されたときは footnote-scheme-ext の関数を用いてページ下部に配置する．
<           FootnoteScheme.add-float-bottom bb-inner
<       | _ ->
<         hook-page-break (fun pbinfo _ -> (
<           let () = display-message (`register `# ^ (arabic pbinfo#page-number)) in
<           ref-float-boxes <- (pbinfo#page-number, bb-inner) :: !ref-float-boxes
<         ))
---
>       hook-page-break (fun pbinfo _ -> (
>         let () = display-message (`register `# ^ (arabic pbinfo#page-number)) in
>         ref-float-boxes <- (pbinfo#page-number, bb-inner) :: !ref-float-boxes
>       ))
```

[demo/local.satyh]({{page.githuburl}}demo/local.satyh) 及び
[demo/satysfi-logo.jpg]({{page.githuburl}}demo/satysfi-logo.jpg) は，
[SATySFi の公式デモのもの](https://github.com/gfngfn/SATySFi/blob/master/demo)
をそのままコピーしてきて配置している．

# 開発者向けメモ

このパッケージの実装方針やハマったことなどをまとめておく．

以下の草稿及び実装内では，
Cross Reference のことを「レジスタ」と呼んでいる．[^1]

[^1]:
    これは単に作者（私）が間違えて覚えてしまい，その方が自分にとって自然になってしまったため．
    恐らく `register-cross-reference` から連想して間違えて覚えてしまったものと思われる．
    そのうち修正するかも知れないし，しないかも知れない．．．

## コンパイル方法など

satysfi-base を利用しているので，base のインストールが必要．
出来れば最新版を pin して活用した方が良さそう．

```bash
# 出来れば最新版を pin する．
# 最新版でないと直っていないバグがあったり仕様が少し変わっているため．
opam pin add "git+https://github.com/nyuichi/satysfi-base.git"
opam install satysfi-base
satyrographos install
```

レジスタを活用しまくるパッケージの開発にあたって，aux ファイルがあると挙動が変わることがある．
Aux ファイルはまずは削除して，コンパイルして望み通りの結果になるか確かめる必要がある．

```bash
rm sample.satysfi-aux; satysfi sample.saty | tee output.log
```

デバッグ用に継続的にコンパイルするために，
fswatch でファイルを監視する bash スクリプトを書いたので，
fswatch をインストール済みであれば以下のようにして使うこともできる．

```bash
./watch sample.saty
```

## 実装方針

本パッケージは，footnote を活用して図をページ下部に配置する．
図を footnote の最上部に配置するために，
本来の footnote は一旦退避させておき，
そのページの中の最後の図を挿入するタイミングで退避させた footnotes も挿入する．

今回使用しているレジスタは以下の三つ．
全てに prefix `__footnote-scheme-ext:` をつけている．

- `__footnote-scheme-ext:fig-map:<figure number>` → `<page number> <footnote-num>`
- `__footnote-scheme-ext:footnote-map:<footnote number>` → `<page number>`
- `__footnote-scheme-ext:fig-num` → `<maximum figure number>`

実装においては figure という名前にしているが，実際には float 環境を意味している．[^2]

実装の詳細．

- Figure には figure number と footnote number を両方振る．
- Figure を挿入しようとするときは hook-page-break で，
  その figure を挿入しようとしたページ番号を取得し，
  その figure の番号と footnote number とともにレジスタに記録する．
  - レジスタ: `__footnote-scheme-ext:fig-map:<figure number> → <page number> <footnote-num>`
- footnote を挿入しようとしているときも hook-page-break で，
  その footnote を挿入しようとしたページ番号を取得し，
  レジスタに記録する．
  - レジスタ: `__footnote-scheme-ext:footnote-map:<footnote number> → <page number>`
- 冒頭でレジスタから読み出してきて以下の関数を定義する．
  - (a) figure num が与えられたときにその figure がそのページで一番最後かを判定する関数．
    `is-last-fig: <figure number> -> bool`
    - レジスタ: `__footnote-scheme-ext:fig-map:<figure number> → <page number> <footnote-num>` を参照する．
    - 最初は全ての figure が自分が一番最後だと思うような実装にする．
      未定義の場合，default は常に true を返す．
  - (b) footnote num が与えられたときに，
    「これから挿入しようとしているページに figure がない，または既に全ての figure を挿入した後である」
    かを判定する関数を定義する．
    `is-no-more-fig: <footnote number> -> bool`
    - レジスタ `__footnote-scheme-ext:footnote-map:<footnote number> → <page number>` を参照する．
    - 最初は figure がないと思うような実装にする．
      未定義の場合，default は常に true を返す．
- figure が与えられたとき．
  - figure-num-ref から自分の figure num を取得．
  - この際，figure num の最大値をレジスタ `__footnote-scheme-ext:figure-num` に記録しておく．
  - 自分自身は普通に add-footnote していく．
  - `is-last-fig` を参照して，自分が一番最後なら footenotes-ref を flush する．
  - hook-page-break を行う（前述参照）
- footnote が与えられたとき．
  - footnote-num-ref から自分の footnote num を取得．
  - `is-no-more-fig` を参照して，
    true なら 普通に add-footnote していく．
    false なら footnote-ref に退避させる．
  - hook-page-break を行う（前述参照）

[^2]: 数値の float 型と紛らわしいと思ったため．

## ハマったこと

satysfi はレジスタの値が更新されている場合は全てを再評価するのではなく，
あくまで document のみ再評価するように見える．

従って，パッケージ側も再評価して欲しいなら，
initialize などの関数内で再評価して欲しい関数を呼び出しておいた上で，
その initialize などの関数をユーザにきちんと呼び出してもらうという運用にする必要がある．

## その他の失敗に終わった試みなど

FigBox モジュールを使って絶対座標で挿入する．
レジスタに footnote の高さを記録しておき，text-height をそれに応じて変える？
text-height は footnote も含んだ高さなので，やはり footnote の方が上に来てしまうか．

- figure の高さをレジスタに登録する．
- footnote の横線を描画する際に，その上に figure の分のスペースを空けておく．
- figure の座標は footnote の座標に合わせて配置する．
  footnote の横線を描画する際に，その座標をレジスタに記録しておく．
  これができなさそう．
  - hook で渡される point は恐らくその hook が呼び出されたポイント．
  - hook を呼び出して仕舞えば良いのでは？
    - ダメだった．
