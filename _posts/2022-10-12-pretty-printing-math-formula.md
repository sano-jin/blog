---
layout: post
title: Pretty printing math formula
author: sano
---

pretty print に関して，実は全く調べたことがない（完全に自己流である）ので，
これを機に調べてみるのも良いのかもしれない．

# 自分のやり方

term と親の term の中置演算子の precedence(priority) を引数に渡して，
term が中置演算子だった場合は自分の precedence が親のよりも低かったら括弧をつける．

左結合の場合は，右の子の term のみ，
pretty printer に渡す自分の precedence を，1 増やして渡す．
none の場合は両方増やして，右結合の場合は左の子のみ増やす．

これは，実は，今まであんまりちゃんと考えてこなかった．
結合性を全く気にしていなかった気がする（ヤバい）．

ラムダ式の pretty print も書いたはずだけど，
（application を）どうしていたか（無意識にこれをやっていたのか）は不明．
