---
layout: post
title: Eisvogel/Pandoc + Mermaid で日本語の PDF を作る
author: sano
excerpt: Creating a japanese PDF document with Eisvogel/Pandoc + Mermaid.js
tags: memo
category: memo
assets: /assets/2025-02-08-creating-a-japanese-pdf-document-with-eisvogel-pandoc-+-mermaid.js/
# extra-classname: frame-image
# image: assets/2025-02-08-creating-a-japanese-pdf-document-with-eisvogel-pandoc-+-mermaid.js/front.png
---

Markdown から PDF を生成する方法を模索している．
色々な選択肢があるが，
[Pandoc](https://pandoc.org/) を使って
LaTeX を経由して PDF を生成する方法が一般的であり，
かつ柔軟性も高いようだ．

本稿では `Pandoc` を用いた私の PDF ドキュメント作成手法の暫定版を紹介する．

# Eisvogel テーマの適用と日本語出力　

`Pandoc` のデフォルトでも十分に使えるが，
よりデザイン性の高い PDF を作りたい場合には，
[Eisvogel](https://github.com/Wandmalfarbe/pandoc-latex-template) という LaTeX テンプレートを利用すると良い．

これを使うと，見た目がかなり整った PDF を出力できる．
[サンプル例が当該ページに沢山ある](https://github.com/Wandmalfarbe/pandoc-latex-template)ので，
是非見てほしい．

ただし，Eisvogel はデフォルトでは日本語に対応していないため，
設定を追加しないと文字化けしてしまう．
そのため，以下のようなコマンドで対応した．

```bash
pandoc input.md -o output.pdf \
  --pdf-engine=lualatex \
  --template eisvogel \
  -V documentclass=bxjsarticle \
  -V lang=ja \
  -V luatexjapresetoptions=haranoaji \
  -V CJKmainfont=HaranoAjiGothic \
  --from markdown
```

ここでは，`lang=ja` を指定し，日本語フォントとして「原の味フォント」を指定している．
これにより，日本語の Markdown でも問題なく PDF 化できる．

# Eisvogel での `--listings` オプションの問題と対策

Eisvogel ではデフォルトでソースコードのハイライトが適用されるが，
さらに `--listings` オプションを付けると，より洗練されたコードブロックの表示が可能になる．

```bash
pandoc input.md -o output.pdf \
  --pdf-engine=lualatex \
  --template eisvogel \
  -V documentclass=bxjsarticle \
  -V lang=ja \
  -V luatexjapresetoptions=haranoaji \
  -V CJKmainfont=HaranoAjiGothic \
  --from markdown \
  --listings # 追加．
```

ただし，`--listings` を使用すると，
デフォルトのプログラミング言語が `Java` に設定されてしまうようだ．
また，ユーザ定義の `\lstset{language=}` を `header-includes` で指定しても，
Eisvogel の内部で `\lstset` が後から上書きされるため，設定を変更できない．

Eisvogel 内部の `\lstset` は，
現在
[eisvogel-added.latex](https://github.com/Wandmalfarbe/pandoc-latex-template/blob/master/template-multi-file/eisvogel-added.latex)
で設定されている．
トップレベルである
[eisvogel.latex](https://github.com/Wandmalfarbe/pandoc-latex-template/blob/master/template-multi-file/eisvogel.latex)
において，
この `eisvogel-added.latex` は
[2025.02.08 現在 118 行目でインクルードされている](https://github.com/Wandmalfarbe/pandoc-latex-template/blob/d22cbd7c28e24ba7a0e4d0da46ffd6732c57d800/template-multi-file/eisvogel.latex#L118)が，
[header-includes は 98 行目にある](https://github.com/Wandmalfarbe/pandoc-latex-template/blob/d22cbd7c28e24ba7a0e4d0da46ffd6732c57d800/template-multi-file/eisvogel.latex#L98)．

この問題を回避するためには，
Markdown の本文の冒頭で `\lstset{language=}` を直接記述するしかなさそうだ．

```markdown
---
title: Mermaid + Eisvogel/Pandoc で日本語の PDF を作る
---

\lstset{language=}

本文はここから．
```

ちょっと残念な感じだが，
これ以上の方法が思いつかなかった．

# Mermaid の図を PDF に含める

Markdown でフローチャートやシーケンス図を描くために
[Mermaid](https://mermaid.js.org/)
を利用することが多い．
しかし，`Pandoc` は `Mermaid` にネイティブ対応していない．
そのため，
[mermaid-cli](https://github.com/mermaid-js/mermaid-cli)
を使って事前に図をコンパイルするなどの対応をする必要がある※．

※ あとで気づいたのだが，
[mermaid-filter](https://github.com/raghur/mermaid-filter)
なるものがあった．
これを使えば良いだけだったかも知れない．

`mermaid-cli` には `mmdc` というコマンドがあり，
Markdown 内の `mermaid` 記法を解析して，SVG や PDF に変換する機能を持つ．

以下のようにして `Mermaid` の図を PDF に変換できる．

```bash
mmdc --pdfFit -i input.md -o output.md -e pdf
```

ここで，`-e pdf` は出力形式を PDF に指定するオプション．
`--pdfFit` を付けることで，PDF のサイズを図の大きさに合わせる．
このオプションがないと，A4 サイズの PDF の右上に小さな図が配置されてしまう．
多くの場合それは望む挙動ではないだろう．

# PDF 生成用のスクリプト

上記の手順を自動化するために，
私は以下の bash スクリプトを使っている．

```bash
#!/bin/bash
set -eux

# bash thisscript.sh document.md → pdf-document.pdf

input_md="$1"
output_pdf="$(dirname $1)/pdf-$(basename $1 .md).pdf"

echo "converting '$input_md' (markdown) to '$output_pdf' (pdf)"

mkdir -p tmp
cd tmp
mmdc --pdfFit -i "../$input_md" -o template.md -e pdf

pandoc template.md -o "$output_pdf" \
  --pdf-engine=lualatex \
  --template eisvogel \
  -V documentclass=bxjsarticle \
  -V lang=ja \
  -V luatexjapresetoptions=haranoaji \
  -V CJKmainfont=HaranoAjiGothic \
  --from markdown \
  --listings \
  --filter pandoc-latex-environment \
  -V geometry:a4paper,margin=1cm,top=2cm,bottom=2cm,footskip=1.5cm \
  --toc

mv "$output_pdf" ../
```

このスクリプトでは，まず `mmdc` を使って `Mermaid` の図を PDF に変換し，
その後 `Pandoc` を実行して Markdown から PDF を生成している．

# まとめ

- [Eisvogel](https://github.com/Wandmalfarbe/pandoc-latex-template)
  テンプレートを使えば，
  [Pandoc](https://pandoc.org/)
  で高品質な PDF を生成できる．
- ただし，`lang=ja` を指定し，適切なフォント設定をしないと日本語が文字化けする．
- `--listings` を使うとコードブロックの表示が向上するが，
  デフォルトの言語が `Java` になる．
  これを回避するには，本文中で `\lstset{language=}` を記述するしかなさそう．
- `Pandoc` は `Mermaid` にネイティブ対応していないため，
  `Mermaid` を使いたいなら
  [mermaid-cli](https://github.com/mermaid-js/mermaid-cli)
  (`mmdc`) を使って事前にコンパイルするなどの必要がある．

全体として PDF 化に時間がかかるのが難点だが，見た目はかなり良い感じになる．
興味があればぜひ試してみてほしい．
