export default async function ({ addon, global, console, msg }) {
  await addon.tab.waitForElement(".select", { markAsSeen: true });
  document.querySelector(".select").remove();
  await addon.tab.waitForElement(".messages-social-list", {
    markAsSeen: true,
  });
  const filter = {
    [msg("studio")]: "mod-studio-activity",
    [msg("comment")]: "mod-comment-message",
    [msg("favorite")]: "mod-love-favorite",
    [msg("love")]: "mod-love-project",
    [msg("remix")]: "mod-remix-project",
    [msg("follow")]: "mod-follow-user",
    [msg("invite")]: "mod-curator-invite",
    [msg("forum")]: "mod-forum-activity",
  };
  let lastTime = 1000;
  let active = JSON.parse(localStorage.getItem("message_preferences")) || Object.keys(filter).map((i) => filter[i]);
  let checkboxes = document.createElement("div");
  checkboxes.classList.add("checkboxes");
  let heading = document.createElement("h4");
  heading.appendChild(document.createTextNode(msg("notifications")));
  checkboxes.appendChild(heading);
  let keys = Object.keys(filter);
  for (let i = 0; i < keys.length; i++) {
    let inp_container = document.createElement("div");
    inp_container.classList.add("input_container");
    let inp = document.createElement("input");
    inp.type = "checkbox";
    inp.checked = active.includes(filter[keys[i]]);
    inp.id = String.fromCharCode(97 + i);
    inp.setAttribute("data-for", filter[keys[i]]);
    inp.onchange = () => {
      if (inp.checked) {
        if (!active.includes(inp.getAttribute("data-for"))) active.push(inp.getAttribute("data-for"));
      } else {
        if (active.includes(inp.getAttribute("data-for"))) {
          let index = active.indexOf(inp.getAttribute("data-for"));
          if (index > -1) {
            active.splice(index, 1);
          }
        }
      }
      update();
    };
    inp_container.appendChild(inp);
    let label = document.createElement("label");
    label.classList.add("input_label");
    label.setAttribute("for", String.fromCharCode(97 + i));
    label.appendChild(document.createTextNode(keys[i].replace(keys[i][0], keys[i][0].toUpperCase())));
    inp_container.appendChild(label);
    checkboxes.appendChild(inp_container);
  }
  let count = 0;
  function update() {
    count = 0;
    let messages = document.querySelectorAll(".social-message");
    for (let i = 0; i < messages.length; i++) {
      let message = messages[i];
      let classes = message.classList;
      for (let j = 0; j < classes.length; j++) {
        if (active.includes(classes[j]) || active.length === 0) {
          count++;
          message.style.display = "list-item";
        } else {
          message.style.display = "none";
        }
      }
    }
    localStorage.setItem("message_preferences", JSON.stringify(active));
    console.log(`${count} messages showing.`);
  }
  document.querySelector(".messages-social-title").appendChild(checkboxes);
  while (true) {
    if (count < 40) {
      console.log("Loading more messages...");
      document.querySelector(".messages-social-loadmore").click();
      await addon.tab.waitForElement(".social-message", {
        markAsSeen: true,
      });
    }
    await addon.tab.waitForElement(".social-message", {
      markAsSeen: true,
    });
    update();
  }
}
