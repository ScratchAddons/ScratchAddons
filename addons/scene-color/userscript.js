export default async function ({ addon, console }) {

    while (true) {
        await addon.tab.waitForElement('[class*="paint-editor_zoom-controls"]', {
        markAsSeen: true,
    });

    var color = "#111111";
    var color2 = "#1a1a1a";
    var color3 = "#2a2a2a";
    var color4 = "#333333";
    const paper = await addon.tab.traps.getPaper();
    Update()

    const div = document.createElement("div")
    div.classList.add("button-group_button-group_2_h4y")

    div.addEventListener("click", function() {
        if (color == "#111111") {
            color = "white";
            color2 = "white";
            color3 = "white";
            color4 = "white";
        } else {
            color = "#111111";
            color2 = "#1a1a1a";
            color3 = "#2a2a2a";
            color4 = "#333333";
        }
        Update()
    })

    const span = document.createElement("span")
    span.classList.add("button_button_u6SE2", "paint-editor_button-group-button_1I1tm")
    span.role = "button"

    const img = document.createElement("img")
    img.classList.add("paint-editor_button-group-button-icon_10kVn")
    img.src = addon.self.dir + "/icon.svg"
    img.draggable = "false"

    div.appendChild(span)
    span.appendChild(img)
    document.querySelector('[class*="paint-editor_zoom-controls"]').appendChild(div)

    function Update() {
    for (let layer of paper.project.layers) {
        if (layer.data.isBackgroundGuideLayer) {
          layer.vectorBackground._children[0].fillColor = color3;
          layer.vectorBackground._children[1].fillColor = color4;
          layer.vectorBackground._children[1]._children[0].fillColor = color;
          layer.vectorBackground._children[1]._children[1].fillColor = color2;
          layer.bitmapBackground._children[0].fillColor = color;
          layer.bitmapBackground._children[1].fillColor = color2;
        }
    }
}
}}