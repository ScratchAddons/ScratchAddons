// Get all elements with the specified classes
const elementsWithName = document.querySelectorAll(".name");
const elementsWithHeaderText = document.querySelectorAll(".header-text");

// Predefined array of items
const predefinedItems = ["griffpatch", "item2", "item3"];

// Process elements with the "name" class
elementsWithName.forEach((element) => {
  const text = element.textContent;

  // Check if the text contains an asterisk
  if (text.includes("*")) {
    // Create a new image element for the asterisks
    const asteriskImg = document.createElement("img");
    asteriskImg.src = "https://raw.githubusercontent.com/YandeMC/a/main/st.png"; // Replace with the path to the asterisk image
    asteriskImg.style.maxWidth = "1.5%"; // Set maximum width to 100% of the parent element

    // Replace the asterisk with the asterisk image element
    element.innerHTML = text.replace("*", asteriskImg.outerHTML);

    // Check if the text matches an item in the predefined array
    if (predefinedItems.includes(text)) {
      // Create a new image element for matching items
      const matchingImg = document.createElement("img");
      matchingImg.src = "https://raw.githubusercontent.com/YandeMC/a/main/blue.png"; // Replace with the path to the matching image
      matchingImg.style.maxWidth = "1.5%"; // Set maximum width to 100% of the parent element

      // Append the matching image element after the asterisk image element
      element.innerHTML + matchingImg.outerHTML;
    }
  }
});

// Process elements with the "header-text" class
elementsWithHeaderText.forEach((element) => {
  // Find the <h2> element within the current element
  const h2 = element.querySelector("h2");

  // Check if the <h2> element exists
  if (h2 !== null) {
    const text = h2.textContent;

    // Check if the text contains an asterisk
    if (text.includes("*")) {
      // Create a new image element for the asterisks
      const asteriskImg = document.createElement("img");
      asteriskImg.src = "https://raw.githubusercontent.com/YandeMC/a/main/st.png"; // Replace with the path to the asterisk image
      asteriskImg.style.maxWidth = "3.5%"; // Set maximum width to 100% of the parent element

      // Replace the asterisk with the asterisk image element
      h2.innerHTML = text.replace("*", asteriskImg.outerHTML);

      // Check if the text matches an item in the predefined array
      if (predefinedItems.includes(text)) {
        // Create a new image element for matching items
        const matchingImg = document.createElement("img");
        matchingImg.src = "https://raw.githubusercontent.com/YandeMC/a/main/blue.png"; // Replace with the path to the matching image
        matchingImg.style.maxWidth = "3 .5%"; // Set maximum width to 100% of the parent element

        // Append the matching image element after the asterisk image element
        h2.innerHTML + matchingImg.outerHTML;
      }
    }
  }
});
