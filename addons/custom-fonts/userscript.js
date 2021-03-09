import Webfont from "./Webfont.js"
export default async function ({ addon, global, console }) {
    //Font Setter
    function setFont() {
        WebFont.load({
            google: {
                families: [addon.settings.get("fontFamily") || "Roboto"],
            },
            active: function () {
                if (document.querySelector("#ScratchAddons-Custom-Fonts-Style")) document.querySelector("#ScratchAddons-Custom-Fonts-Style").remove();

                let s = document.createElement("style");
                s.type = "text/css";
                let css = `* {
    font-family: ${addon.settings.get("fontFamily") || "Roboto"} !important; ${addon.settings.get("bold") ? `
    font-weight: bold !important;` : ""}${addon.settings.get("italic") ? `
    font-style: italic !important;` : ""}
}`;
                if ("textContent" in s) {
                    s.textContent = css;
                } else {
                    s.styleSheet.cssText = css;
                }
                s.id = "ScratchAddons-Custom-Fonts-Style";
                document.head.appendChild(s);
            },
        });
    }
    setFont();
    addon.settings.addEventListener("change", function () {
        try {
            setFont();
        } catch (e) {}
    });
}
