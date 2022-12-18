---
layout: post
title: OCaml の labeled argument は，部分適用できる！
excerpt: Partially applying labeled arguments in OCaml
tags: ocaml
author: sano
category: OCaml
---

OCaml では，labeled argument を持つ関数に対しても，
部分適用できる（curring されている？）
ということに気がつきました．

```ocaml
# let f ~left:l ~right:r = l + r;;
val f : left:int -> right:int -> int = <fun>

# let g = f ~right:2;;
val g : left:int -> int = <fun>

# g ~left:3;;
- : int = 5
```

しかも引数の順番を入れ替えたような部分適用にも対応している．

どういう実装になっているのかはよくわからないけど，
素朴には，全てのパターンに対応しようとすると，
組み合わせの数だけ curring された関数を作らなくてはいけないので，
大量に関数が生成されることになりそう．

例えば 5 引数だったら， 5! = 120 個の関数が生成されることに．．．

実際，どうなっているんだろうなぁ．

<https://github.com/ocaml/ocaml>

ちょっと眺めてみたけど，わからなかった．

---

追記：

もっとテストしてみると，

```ocaml
left:int -> right:int -> int
```

という型と，

```ocaml
right:int -> left:int -> int
```

を区別しているということがわかった．

例えば，以下のようにすると，型エラーになる．

```ocaml
# let f ~left:l ~right:r = (l + r: int);;
val f : left:int -> right:int -> int = <fun>

# let g (f : right:int -> left:int -> int) = f;;
val g : (right:int -> left:int -> int) -> right:int -> left:int -> int = <fun>

# g f;;
Error: This expression has type left:int -> right:int -> int
       but an expression was expected of type right:int -> left:int -> int
```

何でこれで，上のコード（一番最初のコード）が動くのか，
余計によくわからなくなってきた．
