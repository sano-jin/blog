---
layout: post
title: Today's accidents
tags: random-note mysql
author: sano
category: programming-language-systems
---

本日のやらかし．

前提：

> 前日に OCaml の REPL で遊んでいた．

## MySQL を操作しているときに，

なぜか

```
ERROR:
  No query specified
```

と，毎回出る．

非常に鬱陶しい．．．

# 何故だ！

うーん．．．

```sql
select * from stores where store_name = "...";;
```

（簡略化してます）

じぃー．

> いや，流石にあってるだろ．

ググったけど，あんまりそれっぽいものが出てこない．

くぅううう．．．

## お分かりだろうか？

賢いあなたなら，もうわかったかも知れない．

# 答え

末尾に `;` だけではなく，
`;;` をつけていた．

# まとめ

気を付けよう．．．
