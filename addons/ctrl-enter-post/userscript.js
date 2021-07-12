export default async function ({ addon }) {
  let type = location.pathname.split("/")[2];

  let textarea = await addon.tab.waitForElement(type == "settings" ? "#id_signature" : "#id_body");
  let postButton = await addon.tab.waitForElement(type == "topic" ? ".button.grey:nth-child(1)" : "button");

  textarea.addEventListener("keyup", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.code == "Enter") {
      postButton.click();
    }
  });
}
