---
layout: post
title: Pretty printing math formula
author: sano
pagination:
  enabled: true
---

pretty print に関して，実は全く調べたことがない（完全に自己流である）ので，
これを機に調べてみるのも良いのかもしれない．

- pretty print: 冗長な括弧とかを省いて綺麗に (pretty に) 出力すること
- operator precedence: 演算子の優先度
- associativity: 結合性

# 自分のやり方

概要：

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

とりあえず，associativity が none なやつ (tuple とか) は考えないことにする．

```ocaml
type exp =
  | Int of int
  | Div of exp * exp
  | Sub of exp * exp
  | Or of exp * exp
```

こんな感じに定義された式を pretty print しよう．

演算子の結合性を定義しておく．

```ocaml
type assoc = AscLeft | AscRight
```

pretty printer は次のように実装できる．

```ocaml
let rec string_of_exp parent_prec exp =
  let string_of_binop e1 e2 op prec assoc =
    let p1, p2 =
      match assoc with
      | AscLeft -> (prec, succ prec)
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

let string_of_exp = string_of_exp 0
```

以下のようなデータでテストしてみた．

```ocaml
(* Some expressions for the tests *)
let e1 = Sub (Sub (Sub (Int 1, Int 2), Int 3), Int 4)
let e2 = Sub (Sub (Int 1, Sub (Int 2, Int 3)), Int 4)
let e3 = Sub (Sub (Int 1, Int 2), Sub (Int 3, Int 4))
let e4 = Sub (Int 1, Sub (Int 2, Sub (Int 3, Int 4)))
let e5 = Or (Int 1, Sub (Int 2, Sub (Int 3, Int 4)))
let e6 = Or (Sub (Int 1, Int 2), Sub (Int 3, Int 4))
let e7 = Sub (Or (Int 1, Int 2), Sub (Int 3, Int 4))
let e8 = Sub (Or (Int 1, Int 2), Or (Int 3, Int 4))
let e9 = Or (Or (Int 1, Int 2), Or (Int 3, Int 4))
let e10 = Or (Or (Int 1, Int 2), Sub (Int 3, Int 4))
let e11 = Or (Or (Int 1, Int 2), Or (Int 3, Int 4))
let e12 = Div (Sub (Int 1, Int 2), Div (Int 3, Int 4))

(* Test *)
print_string @@ string_of_exp e1;;
```

**TODO: 各例題の解説を書く**

# 実は，

今まであんまりちゃんと考えてこなかった．
結合性を全く気にしていなかった気がする（ヤバい）．

ラムダ式の pretty print も書いたはずだけど，
（application を）どうしていたか（無意識にこれをやっていたのか）は不明．

何というか，体系的にまとめられてたりしないかな（するんだろうな）．
どなたか，良い感じの書籍とかウェブサイトとかあれば教えてください．

ocamlformat の実装を見ろ．とかが短い回答になるのだろうか．．．
