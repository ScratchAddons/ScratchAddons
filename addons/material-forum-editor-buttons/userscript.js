export default async function ({ addon, console, msg }) {
    let style = addon.settings.get("style") + "";

    let buttons = document.getElementsByClassName("markItUpButton");
    
    buttons.forEach(button => {
        console.log(button.innerHTML)
    });
  }