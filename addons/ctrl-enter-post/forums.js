export default async function ({ addon }) {
  let type = location.pathname.split("/")[2];

  let textarea = document.querySelector(type === "settings" ? "#id_signature" : "#id_body");
  let postButton = document.querySelector(type === "topic" ? ".button.grey:nth-child(1)" : "button");

  if (type === "misc") {
    textarea = document.querySelector("#id_reason");
  }

  if (!textarea) return;
  textarea.addEventListener("keydown", (e) => {
    if (!addon.self.disabled && (e.ctrlKey || e.metaKey) && e.key === "Enter") {
      postButton.click();
    }
  });
}
