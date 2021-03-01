export default function({addon,global,console}) {
  await addon.tab.waitForElement(".messages-social-title", {
      markAsSeen: true,
  });
  await addon.tab.waitForElement(".messages-social-loadmore", {
      markAsSeen: true,
  });
  await addon.tab.waitForElement(".messages-social-list", {
      markAsSeen: true,
  });
  let filter = {
      "studio activity": "mod-studio-activity",
      comments: "mod-comment-message",
      "favorites": "mod-love-favorite",
      loves: "mod-love-project",
      remixes: "mod-remix-project",
      follows: "mod-follow-user",
      "studio invites": "mod-curator-invite",
      "forum activity": "mod-forum-activity",
  }
  let active = Object.keys(filter).map((i) => filter[i]);
  let checkboxes = document.createElement("div");
  let heading = document.createElement("h4");
  heading.appendChild(document.createTextNode("I would like to see notifications from:"));
  checkboxes.appendChild(heading);
  let keys = Object.keys(filter);
  for (let i = 0; i < keys.length; i++) {
      let inp_container = document.createElement("div");
      inp_container.classList.add("input_container");
      let inp = document.createElement("input");
      inp.setAttribute("type", "checkbox");
      inp.setAttribute("style", "margin-right: 3px;")
      inp.checked = true;
      inp.id = String.fromCharCode(97 + i);
      inp.setAttribute("data-for", filter[keys[i]])
      setInterval(() => {
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
      }, 50)
      inp_container.appendChild(inp);
      let label = document.createElement("label");
      label.classList.add("input_label");
      label.setAttribute("for", String.fromCharCode(97 + i));
      label.appendChild(document.createTextNode(keys[i].replace(keys[i][0], keys[i][0].toUpperCase())));
      inp_container.appendChild(label);
      inp_container.setAttribute("style", "padding: 5px; width: 49%; display: inline-block;")
      checkboxes.appendChild(inp_container);
  }
  setInterval(() => {
      let messages = document.querySelectorAll(".social-message");
      let count = 0;
      for (let i = 0; i < messages.length; i++) {
          let message = messages[i];
          let classes = message.classList;
          for (let j = 0; j < classes.length; j++) {
              if (active.includes(classes[j]) || active == []) {
                  count++;
                  message.style.display = "list-item";
              } else {
                  message.style.display = "none";
              }
          }
      }
      if (count < 40 && active !== []) {
          document.querySelector(".messages-social-loadmore").click();
      }
      localStorage.setItem("message_preferences", JSON.stringify(active));
  }, 50)
  checkboxes.setAttribute("style", "box-sizing: border-box; padding: 2vw; width: 100%; background: #05f2; display: block; margin: 0 auto; border-radius: 5px; border: 1px solid #05f5;")
  document.querySelector(".messages-social-title").appendChild(checkboxes);
}