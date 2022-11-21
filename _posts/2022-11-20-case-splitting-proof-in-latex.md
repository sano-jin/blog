---
layout: post
title: 場合分けの証明を LaTeX で書く
excerpt: Case splitting proof in LaTeX
author: sano
tags: latex
category: LaTeX
---

帰納法とかを使った場合分けの証明を，
LaTeX で書くときの方法．

# 結論から言うと， **description 環境** を使えば良い．

こんな感じ．

```latex
\begin{description}
  \item[Case {\(E = []\)}]\mbox{}\\
    \(E[e_1] = e_1\) and
    \(E[e_2] = e_2\).
    Therefore,
    \(\tau = \tau'\) and
    \(E[e_2]: \tau\).

  \item[Case {\(E = \lambda x: \tau. E'\)}]\mbox{}\\
    foobar
\end{description}
```

これで，こんな感じに出力されるはず（イメージ）．

> - Case \\(E = []\\)
>   - \\(E[e_1] = e_1\\) and
>     \\(E[e_2] = e_2\\).
>     Therefore,
>     \\(\tau = \tau'\\) and
>     \\(E[e_2]: \tau\\).
> - Case \\(E = \lambda x: \tau. E'\\)
>   - foobar

# 補足説明

```latex
  \item[Case {\(E = []\)}]\mbox{}\\
```

のように，
`\\`
を書いているのは，
場合分けの条件を書いた後に改行したいから．

ただし，単に

```latex
  \item[Case {\(E = []\)}]\\
```

と書くと，エラーが出る．
`\\` の前に「なんか」ないといけないから，らしい（理解不足）．
なので，`\mbox{}` と書いておく．

数式を `{`, `}` で囲っているのは，数式中で `]` が出てきた時のためである．
もし `{`, `}` で囲わないと，

```latex
  \item[Case {\(E = []\)}]\mbox{}\\
```

は，`\item[Case \(E = []` まで到達して，`]` を発見したので，
`\item[...]` の `]` だと認識して，そこまでで無理やり閉じようとする．
しかし，`\(E = [` は `\(` で始めた数式をきちんと閉じられていないために，
「`$` が足りないよー」と言うエラーを吐いてしまう．

# とは言え，ちょっと面倒くさい

わざわざ

```latex
  \item[Case {\(E = []\)}]\mbox{}\\
```

みたいに，ダラダラ書くのはちょっと面倒なので，
こんな感じで定義しておく．

```latex
\newcommand{\case}[1]{\item[Case {#1}]\mbox{}\\}}
```

そうすると，こんな感じで書ける．

```latex
\begin{description}
  \case{\(E = []\)}
    \(E[e_1] = e_1\) and
    \(E[e_2] = e_2\).
    Therefore,
    \(\tau = \tau'\) and
    \(E[e_2]: \tau\).

  \case{\(E = \lambda x: \tau. E'\)}
    foobar
\end{description}
```

ハッピー．
