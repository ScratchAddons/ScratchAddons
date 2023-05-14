export default async function ({ addon, console, msg }) {
    let style = addon.settings.get("style") + "";
    document.querySelector(":root").style.setProperty("--filledMaterialIcons", style === "fill" ? 1 : 0);

    let buttons = document.querySelectorAll(".markItUpHeader .markItUpButton");

    buttons.forEach(button => {
        let span = document.createElement("span");
        span.textContent = getIconName(button, 1);
        span.classList.add("materialIcon");
        span.id = "buttonIcon";

        let aElement = button.getElementsByTagName("a")[0];

        if (!isDropMenuOption(button)) {
            aElement.childNodes[0].remove();
            aElement.prepend(span);
        }
        else {
            button.prepend(span);
        }

        if (button.classList.contains("markItUpDropMenu")) {
            span = document.createElement("span");
            span.classList.add("materialIcon", `${isDropMenuOption(button) ? "subD" : "d"}ropMenuExpandButton`);
            span.textContent = getIconName(span, 1);

            aElement.prepend(span);
        }
    });
}

function isDropMenuOption(button) {
    return button.parentElement.parentElement.classList.contains("markItUpDropMenu");
}

function isEmojiOption(button) {
    return button.parentElement.parentElement.classList.contains("markItUpButton12");
}

function getIconName(element, classIndex) {
    switch (element.classList[classIndex]) {
        case "dropMenuExpandButton":
            return "expand_more";
        case "subDropMenuExpandButton":
            return "chevron_right";
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
        case "markItUpButton7-1":
            return "text_increase";
        case "markItUpButton7-2":
            return "text_decrease";
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
        // case "markItUpButton14": // (emoji dropdown menu)
        //     return "";
        case "markItUpButton15":
            return "mop";
        case "markItUpButton16":
            return "visibility";
        case "sa-forum-toolbar-color":
            return "format_color_fill";
        case "sa-forum-toolbar-center":
            return "format_align_center"
        case "sa-forum-toolbar-code":
            return "code";
        case "markItUpDropMenu":
            console.log("not found, increasing index");
            return getIconName(element, ++classIndex);
        default:
            console.log("default :(");
            return "question_mark";
    }
}