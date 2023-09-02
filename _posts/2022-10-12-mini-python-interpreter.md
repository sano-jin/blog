---
layout: post
title: 一週間で Python を作ってみた！
excerpt: Mini python interpreter
tags: ocaml python programming-language-systems
author: sano
category: [Programming Language]
---

<https://github.com/sano-jin/python-in-ocaml>

ちょっと前の話だが，
一週間でちょっと Python を書いた（動的言語・オブジェクト指向について軽く学習）．

OCaml で，約 1 KLOC．

クラスや例外なども実装したので，あとは「Python を書けば」iterator とかも再現できるはず．

最初は順調だったのだが，
クラスなどを実装したあたりから，参照や評価器の定義（呼び出し）が循環して大変だった．

言語の基本的な機能は大体実装できたので，

あとはライブラリ（まぁリストだけかな）をちょっとだけ付け足して，
（それを呼び出す）list syntax も実装すればかなりそれっぽくなると思う．

off-side rule の parsing
（というか lexing の段階で INDENT, DEDENT token を挟むのだが）
に結構詰まったので，
その辺りはどっかにメモっても良いかも知れない．

ocamllex は（何故か）一度に複数の token を返せない．

However, DEDENT tokens should be inserted possibly one or more times
according to the length of (decreasing) indentation.

# TODO

どんな例題がどう動くか．
