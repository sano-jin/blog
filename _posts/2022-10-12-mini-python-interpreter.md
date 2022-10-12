---
layout: post
title: Mini python interpreter
excerpt: 一週間でちょっと Python を書いた
author: sano
---

<https://github.com/sano-jin/python-in-ocaml>

ちょっと前の話だが，
一週間でちょっと Python を書いた（動的言語・オブジェクト指向について軽く学習）．

OCaml で，約 1 KLOC．

クラスや例外なども実装したので，あとは「Python を書けば」iterator とかも再現できるはず．

最初は順調だったのだが，
クラスなどを実装したあたりから，参照や評価器の定義（呼び出し）が循環して大変だった．

# TODO

どんな例題がどう動くか．
