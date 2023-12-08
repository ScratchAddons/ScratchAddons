export default async function ({ addon, console }) {
  addon.tab.waitForElement("#navigation .login-item").then(() => {
    addon.tab.waitForElement(".studio-page").then((page) => {
      page.classList.add("sa-oldstudio-logged-out");
      addon.tab.waitForElement("#navigation .account-nav").then(() => {
        /* user signed back in - this is possible without reloading the page */
        addon.tab.waitForElement(".studio-page").then((page) => {
          page.classList.remove("sa-oldstudio-logged-out");
        });
      });
    });
  });
  addon.tab.waitForElement(".studio-follow-button").then((followButton) => {
    followButton.parentElement.classList.add("sa-oldstudio-follow-section");
  });

  // Keep "invite followers" button
  addon.tab.waitForElement("#sa-studio-followers-button").then((realButton) => {
    const button = document.createElement("button");
    button.classList = "button";
    const span = document.createElement("span");
    span.textContent = realButton.textContent;
    button.appendChild(span);
    button.onclick = () => setTimeout(() => realButton.click(), 0);
    addon.tab.displayNoneWhileDisabled(button);
    addon.tab.appendToSharedSpace({ space: "studioCuratorsTab", element: button, order: 0.5 });
    addon.tab.addEventListener("urlChange", (e) => {
      if (location.pathname.split("/")[3] === "curators") {
        addon.tab.displayNoneWhileDisabled(button);
      } else {
        button.style.display = "none";
      }
    });
  });

  // Keep "browse projects" button
  while (true) {
    const realButton = await addon.tab.waitForElement(
      ".studio-adder-section .studio-adder-row button ~ button:not(.sa-pseudobutton)",
      {
        markAsSeen: true,
      }
    );
    const button = document.createElement("button");
    button.classList = "button sa-pseudobutton";
    const span = document.createElement("span");
    span.textContent = realButton.textContent;
    button.appendChild(span);
    button.onclick = () => realButton.click();
    addon.tab.displayNoneWhileDisabled(button);
    document.querySelector(".studio-adder-section .studio-adder-row .studio-adder-vertical-divider").after(button);
  }
}
