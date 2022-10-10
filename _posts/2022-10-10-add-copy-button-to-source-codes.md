---
layout: post
title: Jekyll でソースコードに copy ボタンをつける
author: sano
---

copy するのに，どのみち javascript を使う．
なので，copy 用のボタンも javascript で生成してしまうことにした．

Jekyll の default がどうなっているのかはあまり自信がないのだが，
少なくとも，このテーマでは，
ソースコードは以下のような html として出力される．

```html
<div class="highlighter-rouge">
  <div class="highlight">
    <pre class="highlight">
      <code>
        Here comes some source codes...
      </code>
    </pre>
    <div class="copy-code-button">Copy</div>
  </div>
</div>
```

`pre` の外側に `div.highlight` が来るようだ．

なので，以下のような javascript を書いた．

```javascript
window.onload = () => {
  const codeBlocks = document.querySelectorAll("div.highlight");

  codeBlocks.forEach((codeBlock) => {
    const copyCodeButton = document.createElement("div");
    const note = document.createTextNode("Copy");
    copyCodeButton.appendChild(note);
    copyCodeButton.classList.add("copy-code-button");

    codeBlock.appendChild(copyCodeButton);
    const code = codeBlock.innerText;

    copyCodeButton.addEventListener("click", () => {
      window.navigator.clipboard.writeText(code);
      copyCodeButton.classList.add("fa-check");

      setTimeout(() => {
        copyCodeButton.classList.remove("fa-check");
      }, 2000);
    });
  });
};
```

これで，`div.highlight` に copy 用のボタンをつけることができる．

この javascript は

```javascript
copyCodeButton.classList.add("fa-check");
```

とかで，
copy ボタンを押して 2 秒（2000ms）以内は
`fa-check` というクラスがつくようになっている．

こういう css (sass) を書いた．
色はちょっと違う（面倒なので，black とかにしちゃった）．

```css
.highlight {
  position: relative;
}

.copy-code-button {
  background: white;
  cursor: pointer;
  font-size: 1rem;
  padding: 4px 8px;
  font-weight: 900;
  color: black;
  top: 10px !important;
  right: 10px !important;
  position: absolute;
  border: none;
  display: none;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
}

.highlight:hover .copy-code-button {
  display: block;
}

.copy-code-button.fa-check {
  display: block;
  background: blue;
  color: white;
}
```

# 参考にしたもの

<https://www.aleksandrhovhannisyan.com/blog/how-to-add-a-copy-to-clipboard-button-to-your-jekyll-blog/>

<https://www.swiftcryptollc.com/2021/11/11/add-jekyll-copy/>

# TODO:

- directory 構成とかもうちょっと補足する．
- なんか色々参考にしたはずなので，きちんと引用しておく．
