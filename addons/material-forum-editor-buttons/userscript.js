export default async function ({ addon, console, msg }) {
    let style = addon.settings.get("style") + "";

    let buttons = document.querySelectorAll(".markItUpHeader")[0].getElementsByTagName("ul")[0].querySelectorAll(":scope > .markItUpButton");;

    buttons.forEach(button => {
        // console.log(button.innerHTML);

        let span = document.createElement("span");
        span.textContent = getIconName(button, 1);
        span.classList.add("materialIcon");
        span.id = "buttonIcon";

        let aTag = button.getElementsByTagName("a")[0];

        aTag.childNodes[0].remove();
        aTag.appendChild(span);

        if (button.classList.contains("markItUpDropMenu")) {
            span = document.createElement("span");
            span.innerHTML = "expand_more";
            span.classList.add("materialIcon", "dropMenuExpandButton");

            aTag.appendChild(span);
        }
    });
}

function getIconName(button, classIndex) {
    switch (button.classList[classIndex]) {
        case "markItUpButton1":
            return "format_bold";
        case "markItUpButton2":
            return "format_underlined";
        case "markItUpButton3":
            return "format_italic";
        case "markItUpButton4":
            return "strikethrough_s";
        case "markItUpButton5":
            return "add_photo_alternate";
        case "sa-forum-toolbar-link":
        case "markItUpButton6":
            return "add_link";
        case "markItUpButton7":
            return "format_size";
        case "markItUpButton8":
            return "format_list_bulleted";
        case "markItUpButton9":
            return "format_list_numbered";
        case "markItUpButton10":
            return "format_list_bulleted_add";
        case "markItUpButton11":
            return "format_quote";
        case "markItUpButton12":
            return "add_reaction";
        case "markItUpButton13":
            return "computer";
        case "markItUpButton14":
            return "question_mark";
        case "markItUpButton15":
            return "cleaning_services";
        case "markItUpButton16":
            return "spellcheck";
        case "sa-forum-toolbar-color":
            return "format_color_fill";
        case "sa-forum-toolbar-center":
            return "format_align_center"
        case "markItUpDropMenu":
            console.log("not found, increasing index");
            return getIconName(button, ++classIndex);
        default:
            console.log("default :(");
            break;
    }
}