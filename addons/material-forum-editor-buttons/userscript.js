export default async function ({ addon, console, msg }) {
    setIconStyle(addon.settings.get("iconStyle"));

    // All buttons in the forum toolbar, including the options on dropdown menus.
    let buttons = document.querySelectorAll(".markItUpHeader .markItUpButton");

    buttons.forEach(button => {
        // This span contains the icon.
        let span = document.createElement("span");

        span.textContent = getIconName(button, 1);
        span.classList.add("materialIcon");
        span.id = "buttonIcon";

        // The <a> link tag inside the button.
        let buttonLink = button.getElementsByTagName("a")[0];

        if (isDropMenuOption(button)) {
            // Option inside a dropdown menu.
            button.prepend(span);
        }
        else {
            // Regular button, not a dropdown menu option.
            buttonLink.childNodes[0].remove(); // Remove the text inside the button, which otherwise interferes with the icon span.
            buttonLink.prepend(span); // Add the span before all the other children of the butten (required for the dropdown menus).
        }

        // Adds the expand arrow to dropdown menus.
        if (button.classList.contains("markItUpDropMenu")) {
            span = document.createElement("span"); // This span contains the expand arrow.

            // Adds a "subDropMenuExpandButton" or "dropMenuExpandButton" class. This is required for the emoji menu, which has sub-dropdowns.
            // The main dropdown buttons get arrows pointing downwards, the sub dropdown buttons get arrows pointing to the right.
            span.classList.add("materialIcon", `${isDropMenuOption(button) ? "subD" : "d"}ropMenuExpandButton`);
            span.textContent = getIconName(span, 1);

            buttonLink.prepend(span);
        }
    });
}

function setIconStyle (style) {
    // The icon font needs a value of 1 for filled icons and 0 for outlined - basically a boolean.
    document.querySelector(":root").style.setProperty("--filledMaterialIcons", style === "fill" ? 1 : 0);
}

// Checks if a button is an option inside a dropdown menu.
function isDropMenuOption(button) {
    return button.parentElement.parentElement.classList.contains("markItUpDropMenu");
}

// This function gets the name of the icon glyph based on the element's class.
// If the first class it checks doesn't have a match on the switch statement, it tries the next class.
// If no class names match and the class name is empty, a question mark icon is returned.
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
        case "markItUpButton17": // image uploader
            return "file_upload";
        case "sa-forum-toolbar-color":
            return "format_color_fill";
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