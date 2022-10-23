---
layout: post
title: Pretty printing math formula
excerpt: 数式を冗長な括弧を省いて綺麗に表示する．
tags: ocaml programming-language-systems
author: sano
category: programming-language-systems
---

pretty print に関して，実は全く調べたことがない（完全に自己流である）ので，
これを機に調べてみるのも良いのかもしれない．

# Pretty print とは，

冗長な括弧とかを省いて綺麗に (pretty に) 出力すること．

## Operator precedence（演算子の優先度）

`1 + (2 * 3)` は，
`1 + 2 * 3`
と略記できる．

これは `+` よりも，`*` の方が，
operator precedence（演算子の優先度）が高いためである．

足し算と掛け算だけだったら，
小学校の算数でもやったよ！となると思うが，
OCaml（や他のプログラミング言語，数学）では，
もっとたくさん演算子が出てくる．

### 例えば，

OCaml では `@@` という演算子がある [^2]（通称：全てを見通す眼 [^1]）．
これはただの「関数適用」で，実質的には何にもしていない．

ただ，precedence が非常に低い（最低）なので，こんな使い方ができる．

```ocaml
f x @@ g y z
```

これは，ちゃんと括弧を補うと，
`(f x) @@ (f y z)`
になる．
`@@` は，
ただの関数適用であるので，
括弧をつけてしまえば，消して良い．
従って，上記のコードは
`(f x) (g y z)` = `f x (g y z)`
と全く同じである．

要するに，わざわざ行末までを括弧で括るのが面倒な時に
`@@` を使うことができる．

## Operator associativity（演算子の結合性）

`(X op Y) op Z` を
`X op Y op Z`
のように略記できるのを，
「left-associative（左結合的）」という．

例えば，OCaml では（普通の数学でも），引き算は左結合的である．

なので，
`(1 - 2) - 3`
は，わざわざ括弧を書かなくとも，
`1 - 2 - 3`
のように略記できる．

ここで，

```ocaml
1 - (2 - 3)
```

のように書いてあった場合は，
括弧を省くことはできない．

`1 - (2 - 3)`
= `1 - ( - 1 )`
= `2`
だが，
括弧を省いてしまうと
`1 - 2 - 3`
= `(1 - 2) - 3`
= `( -1 ) - 3`
= `-4`
なので， **違う値になってしまう**．

逆に，
`X op (Y op Z)` を
`X op Y op Z`
のように略記できるのを，
「right-associative（右結合的）」という．
OCaml だと，`||` とかが right-associative である．

括弧を略記できない (non-associative) 演算子も存在する．
例えば OCaml の場合だと，`,` がそう．

`(1, 2), 3` （ネストした 2 引数のタプル）は，
`1, 2, 3` （3 引数のタプル）と略記できない．
逆に，
`1, (2, 3)` を
`1, 2, 3` と略記することもできない．

### 演算によっては，結合性を気にしなくて良い

実のところ，足し算は
`(X + Y) + Z` = `X + (Y + Z)` だったりする．
こういう演算を，associative（結合的）であるという．
こういう演算だったら，あんまり深く考えずに括弧を外してしまっても良い．

けど，OCaml では足し算も left-associative な演算子ということになっていたりとかするし，
一応気には留めておいても良いかも（誤差が出る計算とかだとクリティカルな可能性もある）．

## まとめメモ

- pretty print:
  冗長な括弧とかを省いて綺麗に (pretty に) 出力すること．
- operator precedence: 演算子の優先度
- operator associativity: 演算子の結合性

| associativity | 略記の仕方                      |
| ------------- | ------------------------------- |
| left          | `(X op Y) op Z` = `X op Y op Z` |
| right         | `X op (Y op Z)` = `X op Y op Z` |
| non           | 略記できない                    |

# 自分のやり方

> term と親の term の中置演算子の precedence (priority) を引数に渡して，
> term が中置演算子だった場合は自分の precedence が親のよりも低かったら括弧をつける．
>
> 左結合の場合は，右の子の term のみ，
> pretty printer に渡す自分の precedence を，1 増やして渡す．
> none の場合は両方増やして，右結合の場合は左の子のみ増やす．

我らが愛しの OCaml の operator precedence and associativity は，
<https://v2.ocaml.org/manual/expr.html#ss:precedence-and-associativity>
にある．

この表の一番下から数えて何番目かを，
precedence ということにする．

足し算とか掛け算だと結合的なので，
associativity を気にする必要が（あんまり）ない．

引き算とか，割り算とかは結合的じゃないので，
この辺が超クリティカル．

```ocaml
type exp =
  | Int of int
  | Div of exp * exp
  | Sub of exp * exp
  | Or of exp * exp
  | Pair of exp * exp
```

こんな感じに定義された式を pretty print しよう．

演算子の結合性を定義しておく．

```ocaml
type assoc = AscLeft | AscNon | AscRight
```

これを使って，
pretty printer は次のように実装できる．

```ocaml
let rec string_of_exp parent_prec exp =
  let string_of_binop e1 e2 op prec assoc =
    let p1, p2 =
      match assoc with
      | AscLeft -> (prec, succ prec)
      | AscNon -> (succ prec, succ prec)
      | AscRight -> (succ prec, prec)
    in
    let str = string_of_exp p1 e1 ^ op ^ string_of_exp p2 e2 in
    if prec < parent_prec then "(" ^ str ^ ")" else str
  in
  match exp with
  | Int i -> string_of_int i
  | Div (e1, e2) -> string_of_binop e1 e2 " / " 12 AscLeft
  | Sub (e1, e2) -> string_of_binop e1 e2 " - " 11 AscLeft
  | Or (e1, e2) -> string_of_binop e1 e2 " || " 6 AscRight
  | Pair (e1, e2) -> string_of_binop e1 e2 ", " 5 AscNon

let string_of_exp = string_of_exp 0
```

`binop` は binary operator（二項演算子）の略．
`string_of_binop` という関数を定義して，
これを使って二項演算を pretty print している
（OCaml だと，関数の中でも関数を定義できる）．

この 3--8 行目の部分で，
前述のアルゴリズムで，
その演算の引数の pretty print をするのに必要な precedence を計算している．

```ocaml
(* 上記コードの 3--8 行 *)
let p1, p2 =
  match assoc with
  | AscLeft -> (prec, succ prec)
  | AscNon -> (succ prec, succ prec)
  | AscRight -> (succ prec, prec)
in
```

一番外側には括弧は要らないので，
最初に渡す precedence は 0 にして，
`string_of_exp` を再定義 (shaddowing) している．

```ocaml
(* 上記コードの最終行 *)
let string_of_exp = string_of_exp 0
```

簡単だね！

### テスト

以下のようなデータでテストしてみた．

```ocaml
(* Some expressions for the tests *)
let e1 = Sub (Sub (Sub (Int 1, Int 2), Int 3), Int 4)
let e2 = Sub (Sub (Int 1, Sub (Int 2, Int 3)), Int 4)
let e3 = Sub (Sub (Int 1, Int 2), Sub (Int 3, Int 4))
let e4 = Sub (Int 1, Sub (Int 2, Sub (Int 3, Int 4)))
let e5 = Pair (Int 1, Sub (Int 2, Sub (Int 3, Int 4)))
let e6 = Pair (Sub (Int 1, Int 2), Sub (Int 3, Int 4))
let e7 = Sub (Pair (Int 1, Int 2), Sub (Int 3, Int 4))
let e8 = Sub (Pair (Int 1, Int 2), Or (Int 3, Int 4))
let e9 = Or (Pair (Int 1, Int 2), Or (Int 3, Int 4))
let e10 = Or (Pair (Int 1, Int 2), Sub (Int 3, Int 4))
let e11 = Or (Or (Int 1, Int 2), Or (Int 3, Int 4))
let e12 = Div (Sub (Int 1, Int 2), Div (Int 3, Int 4))

(* Test *)
print_string @@ string_of_exp e1;;
```

ソースコードの全体はここにある．

- <https://gist.github.com/sano-jin/cbcfb4fedba4d7d0b26425baa2c80137>

**TODO: 各例題の解説を書く**

# 実は，

今まであんまりちゃんと考えてこなかった．
結合性を全く気にしていなかった気がする（ヤバい）．

ラムダ式の pretty print も書いたはずだけど，
（application を）どうしていたか（無意識にこれをやっていたのか）は不明．

何というか，体系的にまとめられてたりしないかな（するんだろうな）．
どなたか，良い感じの書籍とかウェブサイトとかあれば教えてください．

ocamlformat の実装を見ろ．とかが短い回答になるのだろうか．．．

[^2]: Haskell だと `$`．
[^1]: 元ネタを忘れてしまいましたが，（たぶん）ウソです．
