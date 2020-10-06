
export default async function ({ addon, global, console }) {

// Set up DOM variables for different pages
  if (window.location.href.includes("/topic/create") {
  var submitButton = document.querySelector("button.button")[0],
  textarea = document.querySelector("#id_body"),
  form = document.querySelector("#post");
  }
  submitButton.type = "button"; // Stops the button from submitting the post request before we've converted all the markdown
  
  submitButton.addEventListener("click", (event) => {
    textarea.innerText = translateMarkdownToHTML(textarea.innerText);
    form.submit();
  }
  
  function markdownToHTML(markdown) {
    return markdown;
  }
  function bbcodeToMarkdown(bbcode) {
    return bbcode;
  }
}

// To be continued...
