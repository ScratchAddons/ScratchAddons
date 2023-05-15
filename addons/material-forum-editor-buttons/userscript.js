export default async function ({ addon, console, msg }) {
        // All buttons in the forum toolbar, including the options on dropdown menus.
    let buttons = document.querySelectorAll(".markItUpHeader ul > .markItUpButton");

    buttons.forEach(button => {
        button.querySelector("A").setAttribute("iconName", getIconName(button, 1));
    });
}

// This function gets the name of the icon glyph based on the element's class.
// If the first class it checks doesn't have a match on the switch statement, it tries the next class.
// If no class names match and the class name is empty, a question mark icon is returned.
function getIconName(element, classIndex) {
    switch (element.classList[classIndex]) {
        case "markItUpButton1":
            return "format_bold";
        case "markItUpButton2":
            return "format_italic";
        case "markItUpButton3":
            return "format_underlined";
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
            return "devices";
        // case "markItUpButton14": // (emoji dropdown menu)
        //     return "";
        case "markItUpButton15":
            return "mop";
        case "markItUpButton16":
            return "visibility";
        case "markItUpButton17": // image uploader
            return "file_upload";
        case "sa-forum-toolbar-color":
            return "palette";
        case "sa-forum-toolbar-center":
            return "format_align_center"
        case "sa-forum-toolbar-code":
            return "code";
        case undefined:
            return "question_mark";
        default:
            return getIconName(element, ++classIndex);
    }
}