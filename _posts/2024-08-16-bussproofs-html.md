---
layout: post
title: HTML 上で bussproofs スタイルの証明木をレンダリングできるツールを作った
excerpt: I created a bussproofs style proof tree renderer for HTML.
tags: math
category: Math
author: sano
githuburl: https://github.com/sano-jin/satysfi-footnote-scheme-ext/blob/main/
assets: /assets/2024-08-16-bussproofs-html/
extra-classname: frame-image
image: assets/2024-08-16-bussproofs-html/nvim-preview.gif
---

HTML で bussproofs スタイルの証明木を描画する JavaScript エンジンを作りました．

<script type="module">
  import { renderProofTreesOnLoad } from "https://sano-jin.github.io/bussproofs-html/assets/prooftree.js";
  renderProofTreesOnLoad();
</script>

\begin{prooftree}
\AXC{$1 + 2$}
\AXC{$1 + 2 + 3$}
\BIC{$1 + 2$}
\AXC{$1 + 2 + 3$}
\RightLabel{Label}
\BIC{$1 + 2 + 3 + 4$}
\end{prooftree}

<!-- [![Demo image.]({{ site.baseurl }}{{ page.assets }}demo.png)](https://github.com/sano-jin/bussproofs-html) -->

- **✓ 数式**：KaTeX と一緒に使用できる！
- **✓ 簡単**：スクリプトタグを追加するだけで，証明がレンダリングされます．
- **✓ マークダウン**：markdown-preview.nvim との統合も提供されています．
- **✓ スライド**：Marp でも使用できます．

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">I made a bussproofs style proof tree renderer on HTML, which can be used with KaTeX!<br>✓Just add the script tag and your proof will be rendered.<br>✓ Integration with markdown-preview.nvim is provided.<br>✓ Can be used with Marp.<a href="https://t.co/89rw9KHHhL">https://t.co/89rw9KHHhL</a><a href="https://twitter.com/hashtag/bussproofs?src=hash&amp;ref_src=twsrc%5Etfw">#bussproofs</a> <a href="https://twitter.com/hashtag/katex?src=hash&amp;ref_src=twsrc%5Etfw">#katex</a> <a href="https://twitter.com/hashtag/prooftree?src=hash&amp;ref_src=twsrc%5Etfw">#prooftree</a></p>&mdash; sano (@sano_jn) <a href="https://twitter.com/sano_jn/status/1817213245931041033?ref_src=twsrc%5Etfw">July 27, 2024</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

<details class='toc' open>
<summary>目次</summary>
<ul>
<li><a href="#使用方法">使用方法</a><ul>
<li><a href="#html-の場合">HTML の場合</a></li>
<li><a href="#neovim-でマークダウンを編集している場合">Neovim でマークダウンを編集している場合</a></li>
<li><a href="#marp-でスライドを作っている場合">Marp でスライドを作っている場合</a></li>
<li><a href="#vscode-を使っている場合">VSCode を使っている場合</a></li>
</ul>
</li>
<li><a href="#現在の仕様">現在の仕様</a></li>
<li><a href="#設定オプション">設定オプション</a></li>
<li><a href="#開発者向け">開発者向け</a><ul>
<li><a href="#ビルド方法">ビルド方法</a></li>
<li><a href="#ロードマップ">ロードマップ</a></li>
</ul>
</li>
<li><a href="#まとめ">まとめ</a></li>
</ul>
</details>

# 使用方法

このツールを使うのは簡単です．

## HTML の場合

HTML で bussproofs スタイルの証明木を描画するのは簡単です．
HTML に以下の script タグを追加するだけでできます．

```html
<script type="module">
  import { renderProofTreesOnLoad } from "https://sano-jin.github.io/bussproofs-html/assets/prooftree.js";
  renderProofTreesOnLoad();
</script>
```

サンプルの HTML ソースはこちらです:
[demo/sample.html](https://github.com/sano-jin/bussproofs-html/blob/master/demo/sample.html)

これをブラウザで開くと以下のようになります．

![demo]({{ site.baseurl }}{{ page.assets }}html-demo.png)

サンプル HTML ファイルをデプロイしたページはこちらです:
<https://sano-jin.github.io/bussproofs-html/demo/sample.html>

## Neovim でマークダウンを編集している場合

あなたは [Neovim](https://neovim.io/) を使っていますか？
Neovim はマークダウンを編集するのに最適なツール．
[markdown-preview.nvim](https://github.com/iamcco/markdown-preview.nvim)
を使えば，マークダウンをプレビューしながら編集できます．

私は markdown-preview.nvim をフォークし，
この描画エンジンを統合しました．
[こちら](https://github.com/sano-jin/markdown-preview.nvim)
がフォークしたプレビュワーです．

こんな感じで使うことができます．
素晴らしい！

![demo]({{ site.baseurl }}{{ page.assets }}nvim-preview.gif)

もし [Lazy](https://github.com/folke/lazy.nvim) を Neovim のプラグインマネージャーとして使用している場合，
以下を設定に追加するだけでこのプレビュワーを使用できます．

```lua
-- Configuration for the forked previewer
  {
    "sano-jin/markdown-preview.nvim",
    cmd = { "MarkdownPreviewToggle", "MarkdownPreview", "MarkdownPreviewStop" },
    build = "cd app && yarn install",
    init = function()
      vim.g.mkdp_filetypes = { "markdown" }
    end,
    ft = { "markdown" },
  },
```

## Marp でスライドを作っている場合

[Marp](https://marp.app/) はご存知ですか？
Marp はマークダウンからスライドを作ることができる非常に便利なツールです．

Marp では KaTeX を用いることで数式の描画も可能です．
さらに，このツールを使えば，証明木もレンダリングできます．

こんな感じ．
![demo]({{ site.baseurl }}{{ page.assets }}marp-sample-0.png)

Marp でこのツールを使うのは簡単です．
HTML でレンダリングする際のものと同じ script タグを追加するだけで，
このエンジンを使用できます．

例えば以下のようなマークダウンから証明木を含むスライドを作ることができます．

```markdown
---
marp: true
math: katex
paginate: true
footer: https://github.com/sano-jin/bussproofs-html
---

# Marp との統合は簡単です！

ここに証明木があります:
\begin{prooftree}
\AXC{$1 + 2$}
\AXC{$1 + 2 + 3$}
\BIC{$1 + 2$}
\AXC{$1 + 2 + 3$}
\RightLabel{Label}
\BIC{$1 + 2 + 3 + 4$}
\end{prooftree}

<script type="module">
  import { renderProofTreesOnLoad } from "https://sano-jin.github.io/bussproofs-html/assets/prooftree.js";
  renderProofTreesOnLoad();
</script>
```

サンプルの Markdown はこちらです:
[demo/marp-sample.md](https://github.com/sano-jin/bussproofs-html/blob/master/demo/marp-sample.md)

Marp を使って出力したスライド (PDF) はこちらです:
[demo/marp-sample.pdf](https://github.com/sano-jin/bussproofs-html/blob/master/demo/marp-sample.pdf)

## VSCode を使っている場合

私は VSCode に詳しくないので，まだ統合プランを検討していません．

進展があれば，PR を送ってください．

# 現在の仕様

- `p` 要素の直下にある証明木のみが描画されます．
- 現在のところ，ラベルには `\RightLabel` のみ使用可能です．
- Bussproofs のコマンドとして使用できるのは，
  `\AXC`，`\UIC`，`\BIC`，`\TIC`，および `\QuaternaryInfC`のみです．
- `\normalsize`，`\small`，`\footnotesize`，`\scriptsize`，および `\tiny` は無視されます．
- その他の LaTeX コマンドがあった場合はエラーとなります．

> [!NOTE]  
> `bussproofs-html__`で始まる CSS クラス名は予約されています．

もしも他の機能を実装したら，PR を送ってください．

# 設定オプション

証明木のレンダリングの際に，もっとあなたの美的感覚を活かすこともできます．
例えば推論の横線が横に飛び出る長さをゼロにしたいとか．

以下のように定義された `configP` 型を持つオプションを，
`renderProofTreesOnLoad`および`renderProofTrees`に渡すことができます．

```ts
interface configP {
  // 前提条件間の余白（デフォルトは20）．
  marginPremises?: number;

  // 公理と結論の左および右のパディング（デフォルトは20）．
  paddingAxiomConclusion?: number;

  // ラベルの左余白（デフォルトは10）．
  marginLabelLeft?: number;

  // スタイルの適用タイミング：ロード後（nullの場合）または手動で設定したタイムアウト後（数値の場合）（デフォルトはnull）．
  styleOnLoad?: null | number;
}
```

例えば，次のように設定すると，
前提条件間の余白が 100px，
公理と結論の左右のパディングが 0px，
ラベルの左余白が 0px になり，
スタイルは 100 ミリ秒後に適用されます．

```ts
renderProofTreesOnLoad({
  marginPremises: 100,
  paddingAxiomConclusion: 0,
  marginLabelLeft: 0,
  styleOnLoad: 100,
});
```

![demo]({{ site.baseurl }}{{ page.assets }}custom-config.png)

# 開発者向け

このツールはオープンソースで，github で公開しています．

<https://github.com/sano-jin/bussproofs-html>

改善点が見つかりましたか？
PR を送って私を助けてください．

## ビルド方法

開発:

```bash
cd proof-tree
yarn dev
# 表示されたURLにブラウザからアクセス．
```

デプロイ:

```bash
cd proof-tree
yarn build
cd ..
cp proof-tree/dist/index.js docs/assets/prooftree.js
```

## ロードマップ

以下のロードマップがあります．
進展があれば，PR を送ってください．

1. `\LeftLabel`を有効化する．
2. VSCode との統合を追加する．
3. スタイリングプロセスを強化する．
   - このツールでは証明木を美しくスタイルするために二回に分けて描画を行っています．
     まずは証明木の DOM を作り，特にその各ノードの位置などの調整は行わずにレンダリングします．
     次に，証明木の各ノードの幅を取得し，各ノードの位置や推論の横線の長さなどを計算して，
     スタイルを反映させます．
   - 現在，スタイリング（二回目のレンダリング）のタイミングには 2 つのオプションがあります：
     - A: `load`イベント後にスタイルを適用する．
     - B: 証明木の DOM 要素の挿入後，指定されたミリ秒後にスタイルを適用する．
   - (B) DOM 要素の挿入後，指定されたミリ秒後にスタイルを適用するのは，正確なレンダリング時間を予測できないため，堅牢な方法ではありません．レンダリング完了前にスタイルを適用しようとすると，期待通りの結果が得られません．
   - (A) `load`イベント後にスタイルを適用する方法は，私の理解では DOM コンテンツが完全にレンダリングされた後に発生するため，より堅牢な方法です．しかし，markdown-preview.nvim との統合など，いくつかのケースではうまく機能しないようです．より深い理解が必要です．
4. 最初のバージョンをリリースする．

# まとめ

きっと便利だと思うので，是非使ってみてください．

もし改良したら PR を送ってください．
