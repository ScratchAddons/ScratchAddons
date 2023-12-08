export default async function ({ addon, console, msg }) {
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
    [msg("promotion")]: "mod-become-manager", // Note: this also includes transfer (see below)
  };
  // Declare the active array, and either get it from localStorage or set it to every class in filter.
  // The 'active' array holds the list of the classes of the messages that are shown.
  let active = JSON.parse(localStorage.getItem("scratchAddonsMessageFiltersSettings")) || Object.values(filter);

  // Migration: auto-enable mod-become-host when updating.
  if (!localStorage.getItem("scratchAddonsMessageFiltersSupportsHost")) {
    active.push("mod-become-host");
    localStorage.setItem("scratchAddonsMessageFiltersSettings", JSON.stringify(active));
    localStorage.setItem("scratchAddonsMessageFiltersSupportsHost", "true");
  }
  // Create the checkbox element, which is the container for the message filtering div.
  let container = document.createElement("div");
  container.classList.add("filter-container");

  let heading = document.createElement("h4");
  heading.appendChild(document.createTextNode(msg("messages")));

  container.appendChild(heading);

  let checkboxes = document.createElement("div");
  checkboxes.classList.add("checkboxes");
  container.appendChild(checkboxes);

  // Get all the keys of the filter object
  let keys = Object.keys(filter);
  for (let i = 0; i < keys.length; i++) {
    // And iterate over them adding a checkbox and label each time.

    // Create the label.
    let label = document.createElement("label");
    // input_container
    label.classList.add("input_label");

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
    label.appendChild(inp);

    // Set the label's [for] attribute so that onclick it changes the input.
    label.setAttribute("for", String.fromCharCode(97 + i));
    // Set the label's text to the object key of filter with the 1st letter transformed to upperCase.
    label.appendChild(document.createTextNode(keys[i]));
    // Add the label to the checkboxes div.
    checkboxes.appendChild(label);
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
      //Assume that the message is hidden, to fix classes that are not included in the filters.
      message.style.display = "none";
      for (let j = 0; j < classes.length; j++) {
        const className = classes[j] === "mod-become-host" ? "mod-become-manager" : classes[j];
        // For each CLASS of the message test if the active array includes it and display or hide it.
        //If the active array has nothing show all messages
        if (active.includes(className) || active.length === 0) {
          // Increment the count variable if the message is showing.
          count++;
          message.style.display = "list-item";
        } else {
          //Was broken because of this. This hides the current message if the active class is not found in the active filters. This can be worked around by assuming that the message is hidden then showing it when necessary.
          //message.style.display = "none";
        }
      }
    }
    // Set the localStorage item.
    localStorage.setItem("scratchAddonsMessageFiltersSettings", JSON.stringify(active));
    // Log how many messages are showing.
    console.log(`${count} messages showing.`);
    // Load more messages if there are less than 40 (1 page).
    if (count < 40) {
      console.log("Loading more messages...");
      // Click the load more button.
      document.querySelector(".messages-social-loadmore").click();
    }
  }
  // Add the checkboxes element.
  document.querySelector(".messages-social-title").appendChild(container);
  // Handle first page of messages.
  update();
  // Update when more messages are loaded.
  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", (e) => {
    if (e.detail.action.type === "SET_MESSAGES") {
      // Timeout because messages aren't rendered yet when the event is triggered
      setTimeout(update, 0);
    }
  });
}
