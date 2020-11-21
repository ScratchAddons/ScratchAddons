export default async function ({ addon, global, console }) {
  document.body.addEventListener("mousedown", handleClick, true);
}

function handleClick(e) {
  if (e.button !== 2) {
    return;
  }

  const widgetDiv = document.querySelector(".blocklyWidgetDiv");
  if (!widgetDiv) {
    return;
  }

  if (e.target.closest(".blocklyMainBackground") || e.target.closest(".blocklyBubbleCanvas")) {
    widgetDiv.classList.remove("u-contextmenu-colored");
    return;
  }

  const block = e.target.closest(".blocklyDraggable");
  if (!block) {
    return;
  }

  const background = block.querySelector(".blocklyBlockBackground");
  if (!background) {
    return;
  }

  const fill = window.getComputedStyle(background).getPropertyValue("fill");
  if (!fill) {
    return;
  }

  const fillHex = fill.substr(1);
  const rgb = parseInt(fillHex, 16);
  const hsl = rgb2hsl(rgb);
  hsl[2] = Math.max(hsl[2] - 15, 0);
  const border = "hsl(" + hsl[0] + ", " + hsl[1] + "%, " + hsl[2] + "%)";

  widgetDiv.classList.add("u-contextmenu-colored");
  widgetDiv.style.setProperty("--u-contextmenu-bg", fill);
  widgetDiv.style.setProperty("--u-contextmenu-border", border);
}

function rgb2hsl(rgb) {
  const r = ((rgb >> 16) & 0xff) / 0xff;
  const g = ((rgb >> 8) & 0xff) / 0xff;
  const b = (rgb & 0xff) / 0xff;

  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);

  if (min === max) {
    return [0, 0, r * 100];
  }

  const c = max - min;
  const l = (min + max) / 2;
  const s = c / (1 - Math.abs(2 * l - 1));

  var h;
  switch (max) {
    case r:
      h = ((g - b) / c + 6) % 6;
      break;
    case g:
      h = (b - r) / c + 2;
      break;
    case b:
      h = (r - g) / c + 4;
      break;
  }
  h *= 60;

  return [h, s * 100, l * 100];
}
