#!/bin/bash

# https://qiita.com/m-yamashita/items/889c116b92dc0bf4ea7d

set -eux

if [ $# -eq 0 ]; then
    echo "No arguments supplied"
    exit 1
fi

d=$(date +%Y-%m-%d)
title="${1// /-}"
name="$d-$title.md" # 12-30-2017

echo "$name"

echo -e "---\nlayout: post\ntitle: $1\nauthor: sano\n---\n\n" >"_posts/$name"

# ---
# layout: post
# title: "ブログ始めました"
# author: sano
# ---
#
#
