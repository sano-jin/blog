#!/bin/bash
set -eu

echo ">>> build html"
bundle exec jekyll build

echo ">>>> remove public_html in padano"
ssh parmigiano "ssh padano 'rm -rf public_html'"

echo ">>>> remove public_html in parmigiano"
ssh parmigiano "rm -rf public_html"

echo ">>>> scp public_html to parmigiano"
ls public_html
scp -r public_html parmigiano:~/

echo ">>>> scp public_html to padano"
ssh parmigiano "scp -r public_html padano:~/"
