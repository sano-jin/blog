window.onload = () => {
  const codeBlocks = document.querySelectorAll("div.highlight");
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
      copyCodeButton.classList.remove("fa-copy");
      copyCodeButton.classList.add("fa-check");

      setTimeout(() => {
        copyCodeButton.classList.remove("fa-check");
        copyCodeButton.classList.add("fa-copy");
      }, 2000);
    });
  });
};
