export default async function ({ addon, console, msg }) {
  const nav = await addon.tab.waitForElement(".sub-nav.tabs");

  const tab = nav.appendChild(document.createElement("button")),
    img = tab.appendChild(document.createElement("img")),
    span = tab.appendChild(document.createElement("span")),
    user = document.querySelector('[name="q"]').value.trim(),
    valid = /^[\w-]{2,30}$/g.test(user);
  tab.type = "button";
  tab.classList.add("sa-search-profile-btn");
  tab.setAttribute("role", "tab");
  tab.setAttribute("aria-selected", false);
  tab.tabIndex = -1; // unselected tabs should only be focusable using arrow keys
  img.src = addon.self.dir + "/user.svg";
  img.className = "tab-icon sa-search-profile-icon";
  span.innerText = msg("profile");
  addon.tab.displayNoneWhileDisabled(tab);

  const setInvalidUsername = () => {
    tab.disabled = true;
    tab.title = msg("invalid-username", { username: user });
  };

  // Check if a valid username is entered
  if (valid) {
    tab.addEventListener("click", () => {
      location = `/users/${user}/`;
    });
    fetch(`https://api.scratch.mit.edu/users/${user}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.code == "NotFound") {
          setInvalidUsername();
        } else if (!data.code) {
          span.innerText = "@" + data.username;
          img.src = data.profile.images["32x32"];
          img.onload = () => img.classList.add("sa-search-profile-profilepic");
        }
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
    setInvalidUsername();
  }
}
