import getWhatsHappeningData from "../full-signature/load-happen.js";

export default async function ({ addon, console, msg }) {
  // Load activity-li from Scratch API. Thanks to full-signature/happen.js
  let fetched = [];
  let displayedFetch = [];
  let dataLoaded = 0;
  let fetchList = [];
  do {
    fetchList = await getWhatsHappeningData({ addon, console, dataLoaded });
    if (fetched != fetchList) fetched.push.apply(fetched, fetchList);
    dataLoaded += 40;
  } while (fetchList.length != 0);

  let container = document.querySelector(".activity-ul").appendChild(document.createElement("div"));
  displayedFetch = fetched;
  await addon.tab.redux.dispatch({ type: "SET_ROWS", rowType: "activity", rows: displayedFetch });
  document.querySelector(".activity-ul").appendChild(container);

  let types = [];
  for (let i = 0; i < fetched.length; i++) {
    // become-curator and become-ownerstudio is the same category
    if (fetched[i].type == "becomecurator" || fetched[i].type == "becomeownerstudio")
      fetched[i].type = "studiopromotion";
    document.querySelectorAll(".activity-li")[i].classList.add("sa-" + fetched[i].type);
  }

  // Define list that contains all types and translations
  const filter = {
    [msg("share")]: "sa-shareproject",
    [msg("studio")]: "sa-studiopromotion",
    [msg("love")]: "sa-loveproject",
    [msg("followstudio")]: "sa-followstudio",
    [msg("favorite")]: "sa-favoriteproject",
    [msg("followuser")]: "sa-followuser",
    [msg("remix")]: "sa-remixproject",
  };

  // Create menu where user can select options
  let settings = document.createElement("div");
  settings.classList.add("sa-filter-container");

  // Define header title
  let heading = document.createElement("h4");
  heading.appendChild(document.createTextNode(msg("messages")));
  settings.appendChild(heading);

  // Create triangle with svg
  var svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  var polygonElement = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  svgElement.appendChild(polygonElement);
  polygonElement.setAttribute("points", "12.5 80, 25 100, 0 100");
  svgElement.classList.add("sa-whats-happening-icon");
  document.querySelector("div.box.activity").querySelector("h5").appendChild(svgElement);
  var boxHeader = document.querySelector("div.box-header");
  svgElement.classList.add("rotate");

  // Create no messages warnings
  var messagesList = document.querySelector(".activity-ul");
  var noMessages = document.createElement("div");
  noMessages.classList.add("sa-no-messages");
  noMessages.innerText = msg("no-messages");
  noMessages.style.display = "none";
  messagesList.appendChild(noMessages);

  // On click: open setting page, and rotate svg
  svgElement.addEventListener("click", function (e) {
    if (svgElement.classList.contains("rotate")) {
      svgElement.classList.remove("rotate");
      boxHeader.style.height = "auto";
      messagesList.style.height = 336 - document.querySelector(".box-header").clientHeight + "px";
    } else {
      svgElement.classList.add("rotate");
      boxHeader.style.height = "20px";
      messagesList.style.height = "300px";
    }
  });

  // Thanks to message-filter addon!

  // Create checkboxes element
  let checkboxes = document.createElement("div");
  checkboxes.classList.add("checkboxes");
  settings.appendChild(checkboxes);
  boxHeader.appendChild(settings);

  let active = JSON.parse(localStorage.getItem("scratchAddonsWhatsHappeningFilterSettings")) || Object.values(filter);
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
    label.appendChild(inp);

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

    // Set the label's [for] attribute so that onclick it changes the input.
    label.setAttribute("for", String.fromCharCode(97 + i));
    // Set the label's text to the object key of filter with the 1st letter transformed to upperCase.
    label.appendChild(document.createTextNode(keys[i]));
    // Add the label to the checkboxes div.
    checkboxes.appendChild(label);
  }

  let count = 0;
  function update() {
    count = 0;
    let messages = document.querySelectorAll(".activity-li");
    for (let i = 0; i < messages.length; i++) {
      // Iterate over them and set display to "none" or "list-item" respectively.

      // Get the current message being iterated over.
      let message = messages[i];
      // Get the classes of that message
      let classes = message.classList;
      //Assume that the message is hidden, to fix classes that are not included in the filters.
      message.style.display = "none";
      for (let j = 0; j < classes.length; j++) {
        const className = classes[j];
        // For each CLASS of the message test if the active array includes it and display or hide it.
        //If the active array has nothing show all messages
        if (active.includes(classes[j]) || active.length === 0) {
          // Increment the count variable if the message is showing.
          count++;
          message.style.display = "flex";
        }
      }
    }
    // Set the localStorage item.
    localStorage.setItem("scratchAddonsWhatsHappeningFilterSettings", JSON.stringify(active));
    // Show noMessages info if count is equals to 0

    if (count == 0) {
      noMessages.style.display = "block";
    } else {
      noMessages.style.display = "none";
    }
  }

  // Hide specific elements on load
  update();
}
