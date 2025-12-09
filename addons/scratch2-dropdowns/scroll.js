export default async function ({ addon, console }) {
  function execute() {
    console.log("Running dropdown script");
    let dropdown = document.querySelector(".blocklyDropDownDiv");
    let content = dropdown.querySelector(".blocklyDropDownContent");

    if (!dropdown) console.log("Failed to grab dropdown");

    content.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const dir = Math.sign(e.deltaY);
        content.scrollTo({
          top: content.scrollTop + dir * 21.6,
          behavior: "auto",
        });
      },
      { passive: false }
    );

    // add arrows
    const arrowDown = document.createElement("img");
    arrowDown.src = addon.self.dir + "/images/arrow_down.png";
    arrowDown.style.bottom = "0px";
    arrowDown.className = "dropdownArrow";
    dropdown.appendChild(arrowDown);

    const arrowUp = document.createElement("img");
    arrowUp.src = addon.self.dir + "/images/arrow_up.png";
    arrowUp.style.top = "0px";
    arrowUp.className = "dropdownArrow";
    dropdown.appendChild(arrowUp);
    let prev = "none";
    let loop = null;

    function arrowState() {
      // 1: no arrows
      // 2: arrow bottom
      // 3: arrow top and bottom
      // 4: arrow top
      const scrollTop = content.scrollTop;
      const scrollHeight = content.scrollHeight;
      const clientHeight = content.clientHeight;
      const percent = scrollTop / (scrollHeight - clientHeight);

      if (scrollHeight <= clientHeight) return 1;
      if (percent <= 0.02) return 2;
      if (percent >= 0.98) return 4;
      if (percent > 0 && percent < 1) return 3;
    }

    function fixArrows() {
      let state = arrowState();
      if (state === 1) {
        arrowDown.style.display = "none";
        arrowUp.style.display = "none";
      }
      if (state === 2) {
        arrowDown.style.display = "block";
        arrowUp.style.display = "none";
      }
      if (state === 3) {
        arrowDown.style.display = "block";
        arrowUp.style.display = "block";
      }
      if (state === 4) {
        arrowDown.style.display = "none";
        arrowUp.style.display = "block";
      }
    }

    // initial
    fixArrows();
    content.addEventListener("scroll", fixArrows);
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === "attributes" && mutation.attributeName === "style") {
          const now = getComputedStyle(dropdown).display;

          if (now === "block" || now === "none") {
            if (prev !== now) {
              prev = now;
              fixArrows();
              if (now === "block") {
                content.addEventListener("scroll", fixArrows);
              } else if (now === "none") {
                content.removeEventListener("scroll", fixArrows);
              }
            }
          }
        }
      });
    });
    observer.observe(dropdown, {
      attributes: true,
      attributeFilter: ["style"],
      attributeOldValue: true,
    });
  }

  async function waitForDropdown() {
    while (!document.querySelector(".blocklyDropDownDiv")) {
      await new Promise((resolve) => setTimeout(resolve, 50)); // check every 50ms
    }
    execute();
  }
  waitForDropdown();
}
