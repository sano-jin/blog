---
layout: post
title: LaTeX で数式に色をつける
excerpt: Color math expressions in LaTeX
tags: latex
category: LaTeX
author: sano
---

数式と地の文の見分けをつきやすくしたい．

結論から言うと，
こんな感じで，`\[`, `\(`
を再定義して，色をつけることにした．

```tex
\makeatletter

% color display style math equiations.
\let\olddisplaym@thbegin\[
	\let\olddisplaym@thend\]
\renewcommand{\[}{\olddisplaym@thbegin\begingroup\color{blue}}
\renewcommand{\]}{\endgroup\olddisplaym@thend}

% color inline math equations.
\let\oldinlinem@thbegin\(
\let\oldinlinem@thend\)
\renewcommand{\(}{\oldinlinem@thbegin\begingroup\color{blue}}
\renewcommand{\)}{\endgroup\oldinlinem@thend}

\makeatother
```

`\begingroup` とかは，これがないと謎の空行が生まれたりした（なんで？？？）ので，入れた．
latex なんもわからん．．．

参考にしようと思って色々調べたけど，
「何が起きるかわからないよ！おすすめはしないよ！」みたいな感じなので，やめた．

- <https://tex.stackexchange.com/questions/211780/how-put-color-in-all-math-mode>
- <https://tex.stackexchange.com/questions/100263/everymath-and-author-color>

実は `\begin{equation}` とかには対応していなかったり，
まぁ色々物足りなくなることもあるかも知れない．

が，
そもそも自分用にちょっと見やすくしたいだけなので，
当分はこれで良かろうと思ってる．

もっと良いやり方があったら教えてください．
