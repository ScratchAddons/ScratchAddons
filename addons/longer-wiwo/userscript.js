/* global $ */
// $ is global jQuery instance on scratchr2 pages

/**
 * @param {import("../types").UserscriptUtilities} param0
 */
export default async function ({ msg }) {
  const status = $('textarea[name="status"]');
  const left = $("#status-chars-left").parent();

  // remove scratch's event listeners
  status.off("input");
  status.off("focusin");
  status.off("focusout");

  status.on("input focusin", () => {
    left[0].innerText = msg("left", {
      number: 255 - status[0].value.length,
    }); // set "blank chars left"
  });
  status.on("focusin", () => {
    left.show();
  });
  status.on("focusout", () => {
    left.hide();
  });

  if (status[0]) status[0].maxLength = 255; // disallow more than 255 chars
}
