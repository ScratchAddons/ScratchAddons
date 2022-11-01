export default async function ({ addon, global, console }) {
  const next_button_selector = ".grey.button:not(.small)";
  async function prompt(e) {
    let confirmation = confirm("Would you like to share this project?");
    if (!confirmation) return;
    e.target.parentElement.querySelector(".media-share").click();
  }
  function make(display) { // function that creates the share button
    let share_link = document.createElement("a");
    share_link.href = "#";
    share_link.classList.add("media-share");
    share_link.dataset.control = "share";
    share_link.innerText = display;
    share_link.addEventListener("click", check_shared)
    if (!addon.settings.get("prompt")) return share_link;
    share_link.innerText = "";
    let prompt_link = document.createElement("a");
    prompt_link.href = "#";
    prompt_link.innerText = display;
    prompt_link.addEventListener("click", prompt);
    let container = document.createElement("span");
    container.append(prompt_link, share_link);
    container.classList.add("sa_mystuff_sharing_button");
    return container;
  }
  var next_button = document.querySelector(next_button_selector);
  async function run(runs, elements) { // main script
    let not_shared = document.querySelectorAll(".media-item-content.not-shared .media-action div")[runs];
    if (!not_shared.hasAttribute("data-sa_mystuff_sharing_added"))
      not_shared.appendChild(make("Share"));
    not_shared.dataset.sa_mystuff_sharing_added = 1;
    if (runs + 1 !== elements)
      run(runs + 1, elements);
  }
  async function basics() { // setup for new runs of the script
    await addon.tab.waitForElement(".media-item-content.not-shared");
    let elements = document.querySelectorAll(".media-item-content.not-shared").length;
    next_button = document.querySelector(next_button_selector);
    next_button.addEventListener("click", event)
    addon.tab.addEventListener("urlChange", event);
    run(0, elements);
  }
  function event(wait = 500) {
    console.log("Event Triggered")
    setTimeout(basics, wait); // allows for time to load. And no, I've tried it, addon.waitForElement isn't working for this... for some reason.
  }
  addon.tab.addEventListener("urlChange", event);
  next_button.addEventListener("click", () => event(1500))
  basics();
}
