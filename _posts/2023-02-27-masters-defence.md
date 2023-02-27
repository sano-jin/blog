---
layout: post
title: 修論発表
excerpt: Master's Defence
author: sano
tags: random-note
category: Random note
---

少し前ですが，
修論発表がありました．

あんまり大きな声で色々言ってはいけないのかも知れませんが，
どのみち修論自体は正式に公開されるので，
まぁ良いのかな．

修士論文本体は，
そのうち
[ここ](https://waseda.repo.nii.ac.jp/index.php?action=pages_view_main&active_action=repository_view_main_item_snippet&index_id=355&pn=1&count=20&order=7&lang=japanese&page_id=13&block_id=21)
に出てくるはずです．

- TODO: 出てきたら置き換える．

[スライドはこれです．](/materials/sano-masters-defence.pdf)
表紙だけ，twitter のユーザ名を載せるなど，少し変えています．

<object data="/materials/sano-masters-defence.pdf" type="application/pdf" width="100%" height="700px">
  <embed src="/materials/sano-masters-defence.pdf" />
  <p>This browser does not support PDFs. Please download the PDF to view it:
    <a href="/materials/sano-masters-defence.pdf">Download PDF</a>
  </p>
</object>

# 概要

7 分発表，3 分質疑．
と言う感じでした．

国内の大学の中で最短かも知れません．

緩いな〜．

せっかくの機会なので，英語発表の練習に使いました．
まだ国際会議とかで発表した経験がないので．

# 反省点

台本を覚えられなかったので，
印刷して持って行った．

マイクを持ちながら発表しなくてはいけなくて，
かつパソコンの操作に片手が取られるので，
台本を持ちながらマイクを持つ必要があった．

微妙な感じになってしまった．

# 質疑

XX 先生：

- Application は？
  - A. 汎用的です．
- どんなグラフが扱える？
  - A. Lambda GT （プログラミング言語）としては任意のグラフを扱うことができます．
  - A. FGT（型システム）では，全てのグラフを扱うことはできなくて，
    p.3 のリストにあるようなグラフは扱える or 扱えるようにしようとしています．
  - A. 逆に，例えば「任意のグラフ」を定義して型をつけることはできないです．

OO 先生

- 行列は扱えるか？
  - A. メッシュ構造が扱えるかという問いだと理解しました．
  - A. メッシュ構造を扱うことはあまり考えていません．理由は二つあって，
    1. まず，メッシュをわざわざ扱いたい理由があまりない．配列を使えば良いじゃん，となるのでは．
    2. 次に，メッシュのようなデータ構造は，木にリンクを増やしたものと比較して，型をつけるのが難しいからです．
- 指導教員が補足：メッシュのようなデータ構造への型付けは，他の学生が取り組んでいます．
- 補足のコメントももらった．
  - 機械学習とかで，de bruijn graph とかを扱いたいことがある．
  - Haskell でこういうやつが上手く扱えないか，調べたことがあるけど，結局ダメだった．
  - Hashell でも結局 C の行列積の FLI を叩くことになる．
  - これは室屋先生の transparency ... とかがそのまんま答えになりそう（言うかどうか迷った）．

# 感想

仮にめちゃめちゃ頑張って審査をするとしたとしても，
正直なところ，専門外の先生にはちょっと難しいのではと思った．

（今回の教授陣のコメントは的をいていたし，本質的に重要な問いだったと思うが）

つまり，研究の審査は（ある一つの）大学内ではできない（ことがほとんど）のではという感想に至った．
だから博士は論文の本数を重視するんだろうな，と思った．
