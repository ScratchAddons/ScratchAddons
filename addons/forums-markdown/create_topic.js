// Script for creating topic page
// Because the pages are set out differently so this is easier for me to understand
export default async function ({ addon, global, console }) {

// Set up variables
  var submitButton = document.querySelector("button.button")[0],
  textarea = document.querySelector("#id_body"),
  form = document.querySelector("#post");
  
  submitButton.type = "button"; // Stops the button from submitting the post request before we've converted all the markdown
  
  submitButton.addEventListener("click", (event) => {
    textarea.innerText = translateMarkdownToHTML(textarea.innerText);
    form.submit();
  }
  
  function translateMarkdownToHTML(markdown) {
    return markdown;
  }
}

// To be continued...
