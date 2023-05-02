export default async function ({ addon, console, msg }) {
  const nav = await addon.tab.waitForElement(".sub-nav.tabs");

  const tab = nav.appendChild(document.createElement("button")),
    img = tab.appendChild(document.createElement("img")),
    span = tab.appendChild(document.createElement("span")),
    user = document.querySelector('[name="q"]').value.trim(),
    valid = /^[\w-]{3,20}$/g.test(user);
  tab.type = "button";
  tab.role = "tab";
  tab.tabIndex = -1; // unselected tabs should only be focusable using arrow keys
  tab.ariaSelected = false;
  img.src = addon.self.dir + "/user.svg";
  img.className = "tab-icon";
  span.innerText = msg("profile");
  addon.tab.displayNoneWhileDisabled(tab);

  // Check if a valid username is entered
  if (valid) {
    tab.addEventListener("click", () => {
      location = `/users/${user}/`;
    });
    nav.addEventListener("keydown", (event) => {
      // Keyboard navigation
      // Modified code from scratch-www/src/components/tabs/tabs.jsx
      if (!["ArrowLeft", "ArrowRight", "Home", "End", "Enter", " "].includes(event.key)) {
        return;
      }
      const tabElements = Array.from(nav.children);
      const focusedIndex = tabElements.findIndex((el) => el === document.activeElement);
      if (focusedIndex === -1) return;
      event.preventDefault();
      // Disable Scratch's event listener, which is set on the parent element
      event.stopPropagation();
      if (event.key === "ArrowLeft") {
        let nextIndex;
        if (focusedIndex === 0) {
          nextIndex = tabElements.length - 1;
        } else {
          nextIndex = focusedIndex - 1;
        }
        tabElements[nextIndex].focus();
      } else if (event.key === "ArrowRight") {
        let nextIndex;
        if (focusedIndex === tabElements.length - 1) {
          nextIndex = 0;
        } else {
          nextIndex = focusedIndex + 1;
        }
        tabElements[nextIndex].focus();
      } else if (event.key === "Home") {
        tabElements[0].focus();
      } else if (event.key === "End") {
        tabElements.at(-1).focus();
      } else if (event.key === "Enter" || event.key === " ") {
        tabElements[focusedIndex].click();
      }
    });
  } else {
    tab.disabled = true;
    tab.title = msg("invalid-username", { username: user });
  }
}
