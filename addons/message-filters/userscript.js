export default async function ({ addon, global, console, msg }) {
  // Wait for the select element that is the default message filtering select then remove it.
  await addon.tab.waitForElement(".select", { markAsSeen: true });
  document.querySelector(".select").remove();
  // Wait for the messages to load
  await addon.tab.waitForElement(".messages-social-list", {
    markAsSeen: true,
  });
  // Declare the filter object using dynamic ES6 key syntax.
  // This object has the label as the object key, then the scratch messages page class for that <li> element that correlates.
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
  // Declare the active array, and either get it from localStorage or set it to every class in filter.
  // The 'active' array holds the list of the classes of the messages that are shown.
  let active = JSON.parse(localStorage.getItem("message_preferences")) || Object.keys(filter).map((i) => filter[i]);
  // Create the checkbox element, which is the container for the message filtering div.
  let checkboxes = document.createElement("div");
  // Add a class so I can style it.
  checkboxes.classList.add("checkboxes");
  // Create the <h4> element that says (in english) "I would like to see notifications from:"
  let heading = document.createElement("h4");
  heading.appendChild(document.createTextNode(msg("messages")));
  // Add it to the container.
  checkboxes.appendChild(heading);
  // Get all the keys of the filter object
  let keys = Object.keys(filter);
  for (let i = 0; i < keys.length; i++) {
    // And iterate over them adding a checkbox and label each time.

    // Create the input container div containing the input itself and its respective label.
    let inp_container = document.createElement("div");
    inp_container.classList.add("input_container");
    // Create the checkbox input itself.
    let inp = document.createElement("input");
    inp.type = "checkbox";
    // Set it depending on whether the active array contains its correlating class. (Since it's fetched from localStorage we don't want to show all the checkboxes checked if the user had previously changed something.)
    inp.checked = active.includes(filter[keys[i]]);
    // Set the input's id based on the i variable, this means that the first checkbox has an id of "a", the 2nd, "b" and so on.
    inp.id = String.fromCharCode(97 + i);
    // Give it an attribute that indicates which message it filters.
    inp.setAttribute("data-for", filter[keys[i]]);
    // Listen for
    inp.onchange = () => {
      if (inp.checked) {
        // Add or remove the class that the input correlates to appropriately.
        if (!active.includes(inp.getAttribute("data-for"))) active.push(inp.getAttribute("data-for"));
      } else {
        // Add or remove the class that the input correlates to appropriately.
        if (active.includes(inp.getAttribute("data-for"))) {
          // Remove the input's correlating class if it is unchecked.
          let index = active.indexOf(inp.getAttribute("data-for"));
          if (index > -1) {
            active.splice(index, 1);
          }
        }
      }
      // Update the visible messages
      update();
    };
    // Add the input to the container
    inp_container.appendChild(inp);
    // Create teh label.
    let label = document.createElement("label");
    label.classList.add("input_label");
    // Set the label's [for] attribute so that onclick it changes the input.
    label.setAttribute("for", String.fromCharCode(97 + i));
    // Set the label's text to the object key of filter with the 1st letter transformed to upperCase.
    label.appendChild(document.createTextNode(keys[i].replace(keys[i][0], keys[i][0].toUpperCase())));
    // Add the label to the input container
    inp_container.appendChild(label);
    // Add the input container to the checkboxes div.
    checkboxes.appendChild(inp_container);
  }
  // The count variable indicates how many messages are showing at the moment.
  let count = 0;
  function update() {
    count = 0;
    // Get all of the message elements
    let messages = document.querySelectorAll(".social-message");
    for (let i = 0; i < messages.length; i++) {
      // Iterate over them and set display to "none" or "list-item" respectively.

      // Get the current message being iterated over.
      let message = messages[i];
      // Get the classes of that message
      let classes = message.classList;
      for (let j = 0; j < classes.length; j++) {
        // For each CLASS of the message test if the active array includes it and display or hide it.
        if (active.includes(classes[j]) || active.length === 0) {
          // Increment the count variable if the message is showing.
          count++;
          message.style.display = "list-item";
        } else {
          message.style.display = "none";
        }
      }
    }
    // Set the localStorage item.
    localStorage.setItem("message_preferences", JSON.stringify(active));
    // Log how many messages are showing.
    console.log(`${count} messages showing.`);
  }
  // Add the checkboxes element.
  document.querySelector(".messages-social-title").appendChild(checkboxes);
  // Loop waiting for more messages then load more messages and/or display them appropriately.
  while (true) {
    if (count < 40) {
      console.log("Loading more messages...");
      // Click the load more button.
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
