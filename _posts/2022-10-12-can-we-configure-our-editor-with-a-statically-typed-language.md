---
layout: post
title: 設定ファイルが (OCa)ML なエディタってないのかな？
excerpt: Can we configure our editor with a statically typed language?
tags: random-note
category: Random note
author: sano
---

emacs の shell は正直使い物にならなかった（と勝手に思っている）が，vim だと普通に使えそう．

普通に terminal がそのまま使えるだけだが．

抜けるのは C-d で良さそう

ただ，vim を使い始めた結果 emacs のコマンドが打てなくなってしまっている．

vim の command を打って，アレってなることが非常に多い．

逆も然りだが．

vim に慣れたら vscode debut するしかないのか．

# ところで，

設定ファイルが (OCa)ML なエディタってないのかな．

型付きの関数型言語（強い静的型付け言語）でカスタマイズ可能で．

emacs の elisp は型システムがないので．．．
パッケージを install した時に警告がやたらと出るし，
実際使っている時に未定義変数の参照とかで死ぬことが結構ある．勘弁してくれ〜．

terminal 上で（も）サクサク動いて(e.g. vim) 並行性に優れていて，とにかく起動が早い
と嬉しい．

並列じゃなくても良い．並行．拡張機能を機能させたりとかする前にとにかく表示だけしちゃって，裏で頑張ってくれる感じにしてほしい．

emacs はそもそもあんまり起動は早くないし，並行性がないので拡張するとどんどん起動が遅くなる．．．

vim も ocaml の plugin を入れたらやたらと立ち上がりが遅い．

neovim とかにしてうまいことやれば上手くいったりするのだろうか？

language server とかが使えるってことは，
頑張れば補完機能とかもあるエディタを自作できるってことだろうか．
