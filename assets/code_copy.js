window.onload = () => {
  // const codeBlocks = document.querySelectorAll("pre");
  const codeBlocks = document.querySelectorAll("div.highlight");
  console.log(codeBlocks);

  codeBlocks.forEach((codeBlock, index) => {
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

  // // copyCodeButton.classList.add("fa-check");
  // // const code = codeBlocks[index].innerText;

  // const copyCodeButtons = document.querySelectorAll(".copy-code-button");
  // copyCodeButtons.forEach((copyCodeButton, index) => {
  //   const code = codeBlocks[index].innerText;

  //   copyCodeButton.addEventListener("click", () => {
  //     window.navigator.clipboard.writeText(code);
  //     copyCodeButton.classList.remove("fa-copy");
  //     copyCodeButton.classList.add("fa-check");

  //     setTimeout(() => {
  //       copyCodeButton.classList.remove("fa-check");
  //       copyCodeButton.classList.add("fa-copy");
  //     }, 2000);
  //   });
  // });
};
