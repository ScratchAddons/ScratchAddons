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
      "eye_icon",
      "speaker_icon",
      "warning_icon",
      "switch_icon",
      "layers_icon",
      "function_icon",
      "number_icon",
      "block_icon",
    ];
    //For each .scratchCategoryItemBubble add an icon
    document.querySelectorAll(".scratchCategoryItemBubble").forEach((item, i) => {
      //Make the padding a little bigger to fit the icons.
      item.style.padding = "11px";
      //Position it relative so that absolute positioning will be relative to the bubble.
      item.style.position = "relative";
      let k = document.createElement("img");
      k.src = `${addon.self.dir}/icons/${icons[i]}.svg`;
      k.setAttribute("style", "filter: brightness(50000%); top: 50%; color: white; left: 50%; transform: translate(-50%, -50%); position: absolute; width: 17px; height: 17px;");
      item.appendChild(k);
    });
  }
}
