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
      copyCodeButton.classList.remove("copybtn-copy");
      copyCodeButton.classList.add("copybtn-check");

      setTimeout(() => {
        copyCodeButton.classList.remove("copybtn-check");
        copyCodeButton.classList.add("copybtn-copy");
      }, 2000);
    });
  });
};
