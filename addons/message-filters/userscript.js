export default async function ({ addon, global, console }) {
  let list = await addon.tab.waitForElement(".messages-social-list", {
    markAsSeen: true,
  });
  document.querySelector(".select").remove();
  let filter = {
    "studio activity": "mod-studio-activity",
    comments: "mod-comment-message",
    favorites: "mod-love-favorite",
    loves: "mod-love-project",
    remixes: "mod-remix-project",
    follows: "mod-follow-user",
    "studio invites": "mod-curator-invite",
    "forum activity": "mod-forum-activity",
  };
  let lastTime = 100;
  let active = Object.keys(filter).map((i) => filter[i]);
  let checkboxes = document.createElement("div");
  checkboxes.classList.add("checkboxes");
  let heading = document.createElement("h4");
  heading.appendChild(document.createTextNode("I would like to see notifications from:"));
  checkboxes.appendChild(heading);
  let keys = Object.keys(filter);
  for (let i = 0; i < keys.length; i++) {
    let inp_container = document.createElement("div");
    inp_container.classList.add("input_container");
    let inp = document.createElement("input");
    inp.type = "checkbox";
    inp.checked = true;
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
  function update() {
    let messages = document.querySelectorAll(".social-message");
    let count = 0;
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
    if (count < 40 && active.length > 0 && Date.now() - lastTime > 50) {
      lastTime = Date.now();
      document.querySelector(".messages-social-loadmore").click();
    }
    localStorage.setItem("message_preferences", JSON.stringify(active));
  }
  document.querySelector(".messages-social-title").appendChild(checkboxes);
  while (true) {
    await addon.tab.waitForElement(".social-message", {
      markAsSeen: true,
    });
    update();
  }
}
