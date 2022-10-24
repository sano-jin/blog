---
layout: post
title: Drawing figures in latex
tags: latex
author: sano
category: Random note
---

latex 資料に図を入れようと丸一日もがいていたが，
結局 tikz が最強なのかという最悪な（？）結論を導き出すだけに終わった．．．

draw.io とかを使おうと思ったが，
どう出力したとしても．．．

# svg ?

svg を出力させて，
inkscape を使ってそれを pdf と tex に分解して tex に include するところまでやった．

が，結局文字に数式や typewriter 体を使いたくなるために，
画像編集ツール上で latex するハメに（まぁこれはしょうがない）

しかし，`\texttt` という単語はそこそこ文字数があるために，
図形に収まらないケースが多い

文字サイズを極限まで小さくすると対応できそうな感じだったが，
人間には読めない感じになってしまった

what you see is what you get かも知れないが，what you see ができない．．．

あと，図の大きさによって線の太さが変わってしまうのが気になってしまう（クソォ）

# png ?

png で出力させると，数式が打てない．

あばばばば
