---
layout: post
title: |
  (Neo)vim の markdown-preview.nvim で最新の Mermaid を使う方法
author: sano
excerpt: Updating the mermaid version of markdown-preview.nvim
tags: memo
category: memo
assets: /assets/2025-02-08-how-to-update-markdown-preview-nvim/
extra-classname: frame-image
image: assets/2025-02-08-how-to-update-markdown-preview-nvim/front.png
---

(Neo)vim で markdown を編集する際に便利なのが，
[markdown-preview.nvim](https://github.com/iamcco/markdown-preview.nvim) です．
リアルタイムで markdown を HTML に変換し，ブラウザでプレビューできるため，
技術ドキュメントの執筆やブログの下書きなどに重宝します．

ただし，このプラグインが内部で使用しているライブラリは，
必ずしも最新のものではありません．

例えば，
[Mermaid](https://github.com/mermaid-js/mermaid)
を使ってフローチャートやシーケンス図を描画できる機能がありますが，
2025 年 2 月 8 日時点での `Mermaid` の最新版は 11 であるのに対し，
`markdown-preview.nvim` では 10 のままとなっています．

これにより，`mermaid@11` で追加された新機能や拡張構文が利用できません．

そこで，`markdown-preview.nvim` で `Mermaid` を最新版に更新する方法について解説します．

# `Mermaid` のバージョンを更新するには？

結論から言うと，
`markdown-preview.nvim` の
`Mermaid` の JavaScript コードは
[app/\_static](https://github.com/iamcco/markdown-preview.nvim/tree/master/app/_static)
に格納されているようです．

この中に
[mermaid.min.js](https://github.com/iamcco/markdown-preview.nvim/blob/master/app/_static/mermaid.min.js)
があるので，これを最新版に置き換えれば `mermaid@11` が利用可能になります．

# 手動ビルドを試みるも失敗

`Mermaid` の最新版の JavaScript コードを得るために私が最初に試したのは，
公式リポジトリから `Mermaid` のソースコードを取得し，
手動でビルドする方法でした．

```bash
git clone https://github.com/mermaid-js/mermaid.git
cd mermaid
npm install .
npm run build
```

しかし，残念なことに `npm install .` の段階で以下のようなエラーが発生しました．

```bash
npm error code ERESOLVE
npm error ERESOLVE unable to resolve dependency tree
npm error
npm error While resolving: mermaid-monorepo@10.2.4
npm error Could not resolve dependency:
npm error peer cypress@"^4.5.0" from cypress-image-snapshot@4.0.1
```

どうやら依存関係の不整合によって `npm` のインストールが失敗しているようです．
`--force` や `--legacy-peer-deps` を試しましたが，
最終的にビルドは成功しませんでした．．．

なんか，`npm` でのインストールが一発でうまく行くことってないんですよね．私の場合．
パソコン難しい．

# 解決策：CDN から `mermaid.min.js` を取得する

手動ビルドがうまくいかないので，別の方法として `Mermaid` の JavaScript コードを
**CDN から直接ダウンロードする** 方法を選びました．

`Mermaid` は[オンラインで CDN を介して使用可能](https://mermaid.js.org/config/usage.html)です．
つまり，最新の `mermaid.min.js` を直接取得できるということです．

以下のコマンドで最新版をダウンロードできます．

```bash
wget https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js
```

ダウンロードした `mermaid.min.js` を
[app/\_static/mermaid.min.js](https://github.com/iamcco/markdown-preview.nvim/tree/master/app/_static/mermaid.min.js)
に上書きすれば，`markdown-preview.nvim` で最新版の `Mermaid` を利用できるようになります．

恐らくこれが一番手っ取り早いでしょう．

もちろん私はセキュリティリスクとかの責任は全く負うつもりありませんので，
自己責任でお願いしますね．
まぁ公式だし大丈夫と思いますが．

# 実際どうするか

`markdown-preview.nvim` に直接コミットしても良いですが，
ここではより簡易に，
リポジトリを fork してそれを使う方法を提示します．

Step 1.
[markdown-preview.nvim](https://github.com/iamcco/markdown-preview.nvim)
を Fork する．
ご参考までに私が Fork したものは以下にあります：
[https://github.com/sano-jin/markdown-preview.nvim](https://github.com/sano-jin/markdown-preview.nvim)

Step 2.
[app/\_static/mermaid.min.js](https://github.com/iamcco/markdown-preview.nvim/tree/master/app/_static/mermaid.min.js)
を最新化する．

```bash
git clone git@github.com:your-github-username/markdown-preview.nvim.git
cd markdown-preview.nvim/app/_static/
wget https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js
git add --all && git commit -m updated && git push
```

Step 3.
(Neo)vim のプラグインとして Fork 版の `markdown-preview.nvim` をインストール．
私は [Lazy](https://github.com/folke/lazy.nvim) を使っているので，
以下のようになります．

```lua
{
    "your-github-username/markdown-preview.nvim",
    cmd = { "MarkdownPreviewToggle", "MarkdownPreview", "MarkdownPreviewStop" },
    ft = { "markdown" },
    build = function() vim.fn["mkdp#util#install"]() end,
}
```

おっと最後に……，
(Neo)vim で `Lazy` を使ってパッケージを管理している場合は，
`:Lazy update` を忘れずに．

```
:Lazy update
```

これにより，`markdown-preview.nvim` のキャッシュが更新され，
変更が反映されます．

# まとめ

- `markdown-preview.nvim` で `Mermaid` を最新版にするには，
  [`app/_static/mermaid.min.js`](https://github.com/iamcco/markdown-preview.nvim/tree/master/app/_static/mermaid.min.js)
  を更新する必要がある．
- `Mermaid` の最新化は，
  恐らく CDN から `mermaid.min.js` を取得するのが一番手っ取り早い．
- 本家にコミットしてももちろん良いと思うけど，
  Fork してしまうのが手っ取り早いかも．

「正しいやり方」ではまぁないと思いますが……，
この方法を使えば，最新の `Mermaid` の機能を `markdown-preview.nvim` で活用できます．
ぜひ試してみてください．
