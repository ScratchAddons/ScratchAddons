export default async function ({ addon, console }) {
  const oldAnimate = $.fn.animate;
  $.fn.animate = function (style, ...args) {
    if (!addon.self.disabled && style && style.backgroundColor === "pink") {
      // Scratch calls animate({ backgroundColor: "pink" }) to highlight elements
      style.backgroundColor = addon.settings.get("box");
    }
    return oldAnimate.call(this, style, ...args);
  };
}
