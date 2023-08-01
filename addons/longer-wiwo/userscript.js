/* global $ */
// $ is global jQuery instance on scratchr2 pages
export default async function ({ addon, msg }) {
  const status = $('textarea[name="status"]');
  const left = $("#status-chars-left").parent();

  // remove scratch's event listeners
  status.off("input");
  status.off("focusin");
  status.off("focusout");

  status.on("input focusin", () => {
    left[0].innerText = msg("left", {
      number: status[0].maxLength - status[0].value.length,
    }); // set "blank chars left"
  });
  status.on("focusin", () => {
    left.show();
  });
  status.on("focusout", () => {
    left.hide();
  });

  if (status[0]) status[0].maxLength = 255; // disallow more than 255 chars
  addon.self.addEventListener("disabled", () => {
    if (status[0]) status[0].maxLength = 200;
  });
  addon.self.addEventListener("reenabled", () => {
    if (status[0]) status[0].maxLength = 255;
  });
}
