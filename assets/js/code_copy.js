const addCodeBlocks = () => {
  const codeBlocks = document.querySelectorAll("div.highlight");
  console.log("adding copy buttons to code blocks.");
  console.log(codeBlocks);

  codeBlocks.forEach((codeBlock) => {
    const copyCodeButton = document.createElement("div");
    const note = document.createTextNode("Copy");
    copyCodeButton.appendChild(note);
    copyCodeButton.classList.add("copy-code-button");

    codeBlock.appendChild(copyCodeButton);
    const code = codeBlock.innerText;

    copyCodeButton.addEventListener("click", () => {
      window.navigator.clipboard.writeText(code);
      copyCodeButton.classList.remove("copybtn-copy");
      copyCodeButton.classList.add("copybtn-check");

      setTimeout(() => {
        copyCodeButton.classList.remove("copybtn-check");
        copyCodeButton.classList.add("copybtn-copy");
      }, 2000);
    });
  });
};

const addHeadingLinks = () => {
  console.log("adding links to headings.");
  const headings = document.querySelectorAll("h2[id],h3[id]"); // 1
  const linkContent = "#"; // 2
  for (const heading of headings) {
    // 3
    console.log(heading);
    const linkIcon = document.createElement("a"); // 4
    linkIcon.setAttribute("href", `#${heading.id}`); // 5
    linkIcon.setAttribute("class", "heading-link"); // 5
    linkIcon.innerText = linkContent;
    // linkIcon.innerHTML = linkContent + heading.innerHTML; // 6
    // heading.childNodes[0].replaceWith(linkIcon);
    heading.insertBefore(linkIcon, heading.firstChild);

    // heading.appendChild(linkIcon); // 7
  }
};

// https://qiita.com/aqlwah/items/df4f41d84778c37f4ac8
const sidetoc = () => {
  const contents = document.querySelectorAll(
    ".post-content h2, .post-content h3"
  );
  const toc = document.querySelectorAll(".toc li");

  const wrapper = window; // ラッパー（スクロール領域）

  const contentsPosition = [];
  contents.forEach((content, i) => {
    const startPosition = content.getBoundingClientRect().top + window.scrollY;
    const endPosition = contents.item(i + 1)
      ? contents.item(i + 1).getBoundingClientRect().top + window.scrollY
      : wrapper.scrollHeight;
    contentsPosition.push({ startPosition, endPosition });
  });

  console.log(contentsPosition);

  // スクロール位置に応じてTOCの現在位置を変更する
  const calcCurrentPosition = () => {
    toc.forEach((item, i) => {
      const { startPosition, endPosition } = contentsPosition[i];
      item.classList.remove("active");
      if (window.scrollY + 5 >= startPosition && window.scrollY < endPosition) {
        item.classList.add("active");
      }
    });
  };

  // スクロールイベントリスナを登録
  wrapper.addEventListener("scroll", calcCurrentPosition);
  calcCurrentPosition();
};

window.onload = () => {
  addCodeBlocks();
  addHeadingLinks();
  sidetoc();
};
