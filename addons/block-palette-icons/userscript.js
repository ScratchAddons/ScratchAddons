//When the page loads add the icons.
export default async function ({ addon, global, console }) {
  while (true) {
    await addon.tab.waitForElement(".scratchCategoryMenu", {
      markAsSeen: true,
    });

    /*
     * An array of iconify icons for the categories.
     */
    let icons = [
      "motion_icon",
      "looks_icon",
      "sound_icon",
      "events_icon",
      "control_icon",
      "sensing_icon",
      "operators_icon",
      "variables_icon",
      "block_icon",
    ];
    if (document.querySelector(".scratchCategoryId-lists")) icons.splice(8, 0, "list_icon");
    //For each .scratchCategoryItemBubble add an icon
    document.querySelectorAll(".scratchCategoryItemBubble").forEach((item, i) => {
      let k = document.createElement("img");
      k.src = `${addon.self.dir}/icons/${icons[i]}.svg`;
      k.id = "sa-category-icon";
      addon.tab.displayNoneWhileDisabled(k);

      item.appendChild(k);
    });
  }
}
