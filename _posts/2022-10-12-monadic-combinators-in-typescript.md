---
layout: post
title: Monadic combinators in TypeScript
tags: typescript
author: sano
category: TypeScript
---

typescript の Haskell like な関数をまとめたライブラリを発見しました．

有名だったりします？

<https://gcanti.github.io/fp-ts/>

lodash（実はまだ使ったことがない…）の上位互換という感じなのですかね？

ぼくのお目当てはただの合成関数だったのですが，

（typescript でこれに型をつけようとすると，高階関数なので，かなり annotation を書かなければいけなくて面倒だなぁと思っていた）

<https://gcanti.github.io/fp-ts/modules/function.ts.html#pipe>

もちろんちゃんとありました 😆
