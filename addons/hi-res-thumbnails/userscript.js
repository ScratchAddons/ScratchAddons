export default async function ({ addon, console }) {
  main: while (true) {
    const image = await addon.tab.waitForElement("img", {
      markAsSeen: true,
    });

    const lazy = image.classList.contains("lazy");
    let src = lazy ? image.dataset.original : image.src;

    // Don't process data: URLs, since these are never thumbnails to be upsized,
    // and can be lengthy strings - which really does cause issues when it comes
    // to the cdn2 regex!
    if (src.startsWith("data:")) continue;

    // If the image is from uploads.scratch.mit.edu, reformat src so it looks
    // like a cdn2 URL.
    if (/^https?:\/\/uploads\.scratch\.mit\.edu\//.test(src)) {
      const id = src.match(/[0-9]+/);
      if (src.includes("projects")) {
        // Project thumbnails are always 480x360.
        src = `//cdn2.scratch.mit.edu/get_image/project/${id}_480x360.png`;
      } else if (src.includes("users")) {
        // Max user avatar size is 500x500.
        src = `//cdn2.scratch.mit.edu/get_image/user/${id}_500x500.png`;
      } else if (src.includes("galleries")) {
        // Max studio thumbnail size is 500x500.
        src = `//cdn2.scratch.mit.edu/get_image/gallery/${id}_500x500.png`;
      }
    }

    let width, height, newSrc;

    const cdn2 = src.match(/(.*\/get_image\/.*?\/[0-9]+?_)([0-9]+?)x([0-9]+?)(\.[a-z]+)/);

    if (cdn2) {
      width = cdn2[2];
      height = cdn2[3];
    } else {
      continue main;
    }

    [width, height] = resizeToScreenRes(width, height, image);
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

  function resizeToScreenRes(width, height, image) {
    // Note this returns values in CSS pixel units, i.e. it doesn't take into
    // account browser scaling or high-DPI screens. That's good, because we
    // want to leave the actual resolution-increase factor completely up to
    // the addon user/settings!
    let { width: widthRect, height: heightRect } = image.getBoundingClientRect();

    // If we've only got partial or no apparent displayed dimensions, and
    // width/height HTML attributes are provided, fall back to those. For some
    // reason, these attributes don't seem to always apply to the displayed
    // image the instant it is added to the page DOM.
    if (!widthRect || !heightRect) {
      if (image.hasAttribute("width") && image.hasAttribute("height")) {
        widthRect = +image.getAttribute("width");
        heightRect = +image.getAttribute("height");
      }
    }

    // It's possible that the Scratch site is deliberately loading an image at
    // a greater resolution than it displays at - because with dynamic layout,
    // if the screen (window) resizes, the image may later be displayed larger.
    //
    // If there's an arbitrarily determined "maximum" size for this image, we
    // should use that as the target dimensions instead. (Unless it's
    // incidentally smaller, in which case, fall back to the greater [rendered]
    // dimensions.)

    let widthMax, heightMax;

    if (image.classList.contains("studio-project-image")) {
      // Studio project tiles are largest on (somewhat) thinner screens, since
      // fewer columns are displayed.
      widthMax = 347;
      heightMax = 260;
    }

    // Use greater of scales across both axes to choose the dimension which
    // needs the most scaling and to maintain the ratio between the rendered and
    // loaded dimensions.
    let scale = Math.max(widthRect / width, heightRect / height);

    // Calculate scale for "maximum" dimensions, and use it instead - but only
    // if it's greater than the actual scale. Theoretically, max possible
    // always be >= actual, but if Scratch CSS changes and this addon is
    // outdated, it's better to prefer the actual displayed dimensions as the
    // basis we apply the resolution multiplier to later.
    if (widthMax) {
      const scaleMax = Math.max(widthMax / width, heightMax / height);
      scale = Math.max(scale, scaleMax);
    }

    return [width * scale, height * scale];
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
