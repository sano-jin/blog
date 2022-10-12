---
layout: post
title: Accident with Crontab
author: sano
---

crontab でやらかしました．

crontab は
`crontab`
だけで叩くと
（普通は `crontab -e` とかして，vim で編集する），
標準入力を受け付けることになってしまうっぽい（centos 限定かも）．

`crontab` だけで叩いちゃって，
blank な画面が出てきたので，（慌てて）Ctrl-D した．

Ctrl-D は EOF なので，EOF だけで crontab の設定を上書きしてしまった．

つまり，crontab の設定が真っ白に．．．

log を見てひたすら復旧した．．．

crontab はテキストファイルを git で管理して，
`crontab <テキストファイルの名前>` のようにして，
そのテキストファイルで更新してやるのが良いみたい（？）．

そうすれば，やらかしても git で管理している text file があるのでどうとでもなる．

## Reference
