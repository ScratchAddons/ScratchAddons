//When the page loads add the icons.
export default async function ({ addon, global, console }) {
  while (true) {
    const tabs = await addon.tab.waitForElement(".scratchCategoryMenu", {
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
      //Make the padding a little bigger to fit the icons.
      item.style.padding = "11px";
      //Position it relative so that absolute positioning will be relative to the bubble.
      item.style.position = "relative";
      let k = document.createElement("img");
      k.src = `${addon.self.dir}/icons/${icons[i]}.svg`;
      Object.assign(k.style, {
        filter: "brightness(50000%)",
        top: "50%",
        color: "white",
        left: "50%",
        transform: "translate(-50%, -50%)",
        position: "absolute",
        width: "17px",
        height: "17px"
      })
      item.appendChild(k);
    });
  }
}
