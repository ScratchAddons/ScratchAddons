export default async function ({ addon, console }) {
  main: while (true) {
    const image = await addon.tab.waitForElement("img", {
      markAsSeen: true,
    });

    const lazy = image.classList.contains("lazy");
    const src = lazy ? image.dataset.original : image.src;

    let width, height, newSrc;

    const cdn2 = src.match(/(.*\/get_image\/.*?\/[0-9]+?_)([0-9]+?)x([0-9]+?)(\.[a-z]+)/);

    if (cdn2) {
      width = cdn2[2];
      height = cdn2[3];
    } else {
      continue main;
    }

    if (addon.settings.get("fixLowRes"))
      fixLowRes: {
        // Note this returns a value in CSS pixel units, i.e. it doesn't take into
        // account browser scaling or high-DPI screens. That's good, because we
        // want to leave the actual resolution-increase factor completely up to
        // the addon user/settings!
        const rect = image.getBoundingClientRect();

        // Use greater of both scales to choose the dimension which needs the most
        // scaling and to maintain the ratio between the rendered and loaded
        // dimensions.
        const scale = Math.max(rect.width / width, rect.height / height);

        if (scale > 1) {
          width *= scale;
          height *= scale;
        }
      }

    [width, height] = scaleDimensions(width, height);

    if (cdn2) {
      newSrc = cdn2[1] + width + "x" + height + cdn2[4];
    }

    if (lazy) {
      image.dataset.original = newSrc;
    }

    if (image.src) {
      image.src = newSrc;
    }
  }

  function scaleDimensions(width, height) {
    const factor = 0.01 * addon.settings.get("multiplier");

    width *= factor;
    height *= factor;

    width = Math.round(width);
    height = Math.round(height);

    return [width, height];
  }
}
