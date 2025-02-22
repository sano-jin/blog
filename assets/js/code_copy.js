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
    heading.insertBefore(linkIcon, heading.firstChild);

    linkIcon.addEventListener("click", () => {
      const url = `${location.href}#${heading.id}`;
      window.navigator.clipboard.writeText(url);
    });
  }
};

window.onload = () => {
  addCodeBlocks();
  addHeadingLinks();
};
