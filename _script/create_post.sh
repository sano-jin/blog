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

body="---\nlayout: post\ntitle: $1\nauthor: sano\n---\n\n"
echo -e "$body"

echo -e "$body" >"_drafts/$name"

echo "assets/$d-$title"

echo "_drafts/$name"

lvim "_drafts/$name"

# ---
# layout: post
# title: "ブログ始めました"
# author: sano
# ---
#
#
