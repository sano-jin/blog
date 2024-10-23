#!/bin/bash

# ./create_post.sh 'タイトル' 
# で今日の日付とタイトルのポストを生成して vim で開く．

# https://qiita.com/m-yamashita/items/889c116b92dc0bf4ea7d

set -eux

d=$(date +%Y-%m-%d)
title=$(echo "$1" | tr '[:upper:]' '[:lower:]')
title="${title// /-}"

name="$d-$title.md" # 12-30-2017
echo "$title"

echo "$name"

# body="---\nlayout: post\ntitle: $1\nauthor: sano\n---\n\n"
# echo -e "$body"
# echo -e "$body" >"_drafts/$name"

{ echo -e "---" ; 
  echo -e "layout: post"; 
  echo -e "title: $1"; 
  echo -e "author: sano"; 
  echo -e "excerpt: $1"; 
  echo -e "tags: memo"; 
  echo -e "category: memo"; 
  echo -e "assets: /assets/$d-$title/"; 
  echo -e "extra-classname: frame-image"; 
  echo -e "image: assets/$d-$title/front.png"; 
  echo -e "---" ; 
} >> "_drafts/$name"

mkdir -p "assets/$d-$title"

echo "_drafts/$name"

lvim "_drafts/$name"

# ---
# layout: post
# title: "ブログ始めました"
# author: sano
# ---
#
#
