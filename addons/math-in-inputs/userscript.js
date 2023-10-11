export default async function ({ addon }) {
  /* I 100% stole this part of the code from "editor-number-arrow-keys"
     Right now it only works for the sprite properties because those are the only ones that actually
     allow the operators to be typed into them, not sure how to get around this :( */
  const isSupportedElement = (el) => {
    if (el.classList.contains("blocklyHtmlInput")) return true;
    else if (el.matches(".mediaRecorderPopupContent input[type=number]")) {
      // Number inputs in `mediarecorder` addon modal
      return true;
    } else if (el.className.includes("input_input-form_")) {
      if (el.matches("[class*=sprite-info_sprite-info_] [class*=input_input-small_]")) {
        // Sprite X/Y coordinates, size and direction (excludes sprite name)
        return true;
      } else if (el.matches("[class*=paint-editor_editor-container-top_] input[type=number]")) {
        // Number inputs in costume editor (note that browsers already provide up/down clickable buttons for these)
        return true;
      } else return false;
    }
    return false;
  };

  const operators = ["*", "/", "+", "-"];
  function parseMath(value) {
    let containsMath = false;
    for (var i = 0; i < operators.length; i++) {
      if (value.includes(operators[i])) {
        containsMath = true;
        break;
      }
    }
    let mathParts = value.split(operators[i]);
    if (containsMath && mathParts.length == 2) {
      let returnValue = "";
      if (operators[i] === "*") {
        returnValue = mathParts[0] * mathParts[1];
      } else if (operators[i] === "/") {
        returnValue = mathParts[0] / mathParts[1];
      } else if (operators[i] === "+") {
        returnValue = mathParts[0] * 1 + mathParts[1] * 1;
      } else {
        returnValue = mathParts[0] - mathParts[1];
      }
      return returnValue;
    } else {
      return value;
    }
  }
  document.body.addEventListener("keydown", (e) => {
    if (addon.self.disabled) return;
    if (!isSupportedElement(e.target)) return;
    if (e.key !== "Enter") return;
    if (!e.target.value) return;

    const newValue = parseMath(e.target.value);
    Object.getOwnPropertyDescriptor(e.target.constructor.prototype, "value").set.call(e.target, newValue.toString());
    e.target.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
