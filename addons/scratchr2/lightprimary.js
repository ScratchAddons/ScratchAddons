function testLightprimary(hex) {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  if (r * 0.299 + g * 0.587 + b * 0.114 > 150) {
    // https://stackoverflow.com/a/3943023
    document.documentElement.style.setProperty("--scratchr2-primaryColor-isLight", 1);
  } else {
    document.documentElement.style.setProperty("--scratchr2-primaryColor-isLight", 0);
  }
}

export default async function ({ addon, console }) {
  testLightprimary(addon.settings.get("primaryColor"));
  addon.settings.addEventListener("change", function () {
    testLightprimary(addon.settings.get("primaryColor"));
  });
}
