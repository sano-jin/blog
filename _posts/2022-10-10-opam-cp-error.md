---
layout: post
title: opam install で error を吐く
tags: ocaml opam
author: sano
---

表題の通りで，サーバ上に opam をインストールして，
それを使って
`opam install .`
すると，下記のようなエラーを吐く（ことがある）．

```
#=== ERROR while compiling lambda_gt_beta.~dev ================================#
# path        ~/lambda-gt-alpha
# command     /bin/cp -PRp /home/sano/.opam/ocaml/.opam-switch/sources/lambda_gt_beta /home/sano/.opam/ocaml/.opam-switch/build/lambda_gt_beta.~dev
# exit-code   1
# env-file    ~/.opam/log/log-111726-91dc8f.env
# output-file ~/.opam/log/log-111726-91dc8f.out
### output ###
# [...]
# /bin/cp: preserving permissions for ‘/home/sano/.opam/ocaml/.opam-switch/build/lambda_gt_beta.~dev/.git/objects/5d/44b94dee2d2cddc267971f946dce68aa0373fc’: Permission denied
# /bin/cp: preserving permissions for ‘/home/sano/.opam/ocaml/.opam-switch/build/lambda_gt_beta.~dev/.git/objects/93/fe35c087921b5eebee243b342b81125f606eb4’: Permission denied
# /bin/cp: preserving permissions for ‘/home/sano/.opam/ocaml/.opam-switch/build/lambda_gt_beta.~dev/.git/objects/2b/82a72dcaf17c7a2378d2d2b7d27ef962c673fa’: Permission denied
# /bin/cp: preserving permissions for ‘/home/sano/.opam/ocaml/.opam-switch/build/lambda_gt_beta.~dev/.git/objects/29/10412f5b51758d44d39a4910e79a21088ab106’: Permission denied
# /bin/cp: preserving permissions for ‘/home/sano/.opam/ocaml/.opam-switch/build/lambda_gt_beta.~dev/.git/objects/f5/1ed9c9348afa80b7d698978fc03a04372d1426’: Permission denied
# /bin/cp: preserving permissions for ‘/home/sano/.opam/ocaml/.opam-switch/build/lambda_gt_beta.~dev/.git/objects/fe/ad91415edf97f6b278e4dfa66db1fbf7bce734’: Permission denied
# /bin/cp: preserving permissions for ‘/home/sano/.opam/ocaml/.opam-switch/build/lambda_gt_beta.~dev/.git/objects/c2/bc20991e28751e51a41c826e635510d315e611’: Permission denied
# /bin/cp: preserving permissions for ‘/home/sano/.opam/ocaml/.opam-switch/build/lambda_gt_beta.~dev/.git/objects/cb/3f83ae7d001cdfd8a05a1e521d15067b4ecdf1’: Permission denied
# /bin/cp: preserving permissions for ‘/home/sano/.opam/ocaml/.opam-switch/build/lambda_gt_beta.~dev/.git/objects/fa/18a8cad6e2278601407525c220363380da7297’: Permission denied
# /bin/cp: preserving permissions for ‘/home/sano/.opam/ocaml/.opam-switch/build/lambda_gt_beta.~dev/.git/objects/4d/9481ddfaac5ae79214f6012c464d4ffa0725b7’: Permission denied
# /bin/cp: preserving permissions for ‘/home/sano/.opam/ocaml/.opam-switch/build/lambda_gt_beta.~dev/.git/objects/f1/cb51450bf8d8eb4967ef5345e32085f2aa0965’: Permission denied
# /bin/cp: preserving permissions for ‘/home/sano/.opam/ocaml/.opam-switch/build/lambda_gt_beta.~dev/.git/objects/d8/ef3061ff71c9b57cbdda1499e1137f9c703ac9’: Permission denied



<><> Error report <><><><><><><><><><><><><><><><><><><><><><><><><><><><><><><>
┌─ The following actions failed
│ λ build lambda_gt_beta ~dev
│ λ build ocamlbuild     0.14.1
└─
╶─ No changes have been performed

```

どうにも `cp` するための permittion が足りないっぽい．

（アドホックな）解決策としては，
以下のように
`~/.opam` ディレクトリにユーザからの書き込み権限もつけることっぽい
（教えてもらった）．

```bash
chmod -fR u+w ${HOME}/.opam
```

根本的な解決にはなっていない
（このままでは毎回これをやらなくてはいけない）
ので，
何とかできそうな人がいたら教えてください．

ローカルでこういうエラーに遭遇したことはないので，
opam をインストールしたユーザ (sudoer) と，
`opam install .` するユーザが違うことを想定していないということなのだろうか．

うーん．．．
