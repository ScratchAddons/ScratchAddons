
export default async function ({ addon, global, console }) {

// Set up DOM variables
  var submitButton = document.querySelector("form#post > button.button")[0],
  textarea = document.querySelector("#id_body"),
  form = document.querySelector("#post"),
  preview = document.querySelector();
  
  submitButton.type = "button"; // Stops the form from submitting the post request before we've converted all the markdown
  
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
