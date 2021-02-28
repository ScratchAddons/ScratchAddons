//When the page loads add the icons.
export default async function ({ addon, global, console }) {
  while (true) {
    const tabs = await addon.tab.waitForElement(".scratchCategoryMenu", {
      markAsSeen: true,
    });
    console.log("Debug for block pallete icons: block pallete loaded.");
    //Load iconify from their CDN.
    await addon.tab.loadScript(addon.self.lib + "/iconify.min.js");
    console.log("Debug for block pallete icons: iconify loaded");
    do_da_icons();

    /**
     * Adds icons to the block pallette.
     * @example
     * do_da_icons()
     * @returns {undefined}
     */
    function do_da_icons() {
      /**
       * An array of iconify icons for the categories.
       */
      let icons = [
        "ic:twotone-motion-photos-on",
        "ant-design:eye-filled",
        "fluent:speaker-1-24-filled",
        "typcn:warning",
        "entypo:switch",
        "jam:layers-f",
        "mdi:function",
        "fluent:number-symbol-16-filled",
        "clarity:block-line",
      ];
      try {
        //For each .scratchCategoryItemBubble add an icon
        document.querySelectorAll(".scratchCategoryItemBubble").forEach((item, i) => {
          //Make the padding a little bigger to fit the icons.
          item.style.padding = "11px";
          //Position it relative so that absolute positioning will be relative to the bubble.
		  item.style.position = "relative";
		  add(icons[i]);
        });
      } catch (e) {
        console.error("Debug for block pallete icons: Error: " + e.stack);
      }
      function add(icon) {
        let k = document.createElement("span");
        k.classList.add("iconify");
        k.setAttribute("style", "top: 15%; color: white; left: 15%; position: absolute; font-size: 17px");
        k.setAttribute("data-icon", icon);
      }
    }
  }
}
