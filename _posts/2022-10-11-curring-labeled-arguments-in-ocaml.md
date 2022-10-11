---
layout: post
title: Curring labeled arguments in OCaml
author: sano
---

OCaml では，labeled argument を持つ関数に対しても，
部分適用できる（curring されている）
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
全てのパターンに対応しようとすると，
組み合わせの数だけ curring された関数を作らなくてはいけないので，
素朴には大量に関数が生成されることになりそう．

例えば 5 引数だったら， 5! = 120 個の関数が生成されることに．．．

実際，どうなっているんだろうなぁ．

<https://github.com/ocaml/ocaml>

ちょっと眺めてみたけど，わからなかった．
