export default async function ({ addon, msg, global, console }) {
  await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/sortable.min.js");
  window.paper = await addon.tab.traps.getPaper();
  let layersEl;
  let toggled = false;

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    console.log(detail.action.type, detail);
    if (!toggled) return;
    if ("scratch-paint/view/UPDATE_VIEW_BOUNDS" === detail.action.type) {
      updateLayers();
    }
    if ("scratch-paint/select/CHANGE_SELECTED_ITEMS" === detail.action.type) {
      console.log(paper.project);
    }
  });

  function removeLayers() {
    while (layersEl.firstChild) {
      layersEl.removeChild(layersEl.lastChild);
    }
  }

  function updateLayers() {
    const parent = paper.project.layers[2];
    if (!parent || parent.children.length === 0) return;

    removeLayers();

    for (const layer of parent.children.slice(0, -1)) {
      const layerEl = layersEl.appendChild(document.createElement("div"));
      layerEl.className = "layer";
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", layer.bounds.width + "px");
      svg.setAttribute("height", layer.bounds.height + "px");
      const g = layer.exportSVG();
      g.style.transform = "translate(" + -layer.bounds.x + "px, " + -layer.bounds.y + "px)";
      svg.appendChild(g);
      const url = "data:image/svg+xml;base64," + btoa(new XMLSerializer().serializeToString(svg));
      layerEl.style.backgroundImage = "url(" + url + ")";

      layerEl.addEventListener("click", () => {
        console.log("e?", layer);
        addon.tab.redux.dispatch({
          type: "scratch-paint/select/CHANGE_SELECTED_ITEMS",
          selectedItems: [],
        });
        addon.tab.redux.dispatch({
          type: "scratch-paint/select/CHANGE_SELECTED_ITEMS",
          selectedItems: [layer],
          bitmapMode: false,
        });
      });
    }

    new window.Sortable(layersEl, {
      animation: 300,
      onUpdate: (event) => {
        // console.log(layers[event.newIndex]);
        parent.insertChild(event.newIndex, parent.children[event.oldIndex]);
        // layers[event.newIndex].insertChild(layers[event.oldIndex], 0);
        // event.newIndex, event.oldIndex
      },
    });
  }

  while (true) {
    const zoomControls = await addon.tab.waitForElement("[class^='paint-editor_zoom-controls']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/navigation/ACTIVATE_TAB", "scratch-gui/mode/SET_PLAYER"],
      reduxCondition: (state) => state.scratchGui.editorTab.activeTabIndex === 1 && !state.scratchGui.mode.isPlayerOnly,
    });
    toggled = false;

    const wrapper = document.querySelector("[class^=asset-panel_wrapper]");
    layersEl = wrapper.appendChild(document.createElement("div"));
    layersEl.className = "layers";

    const group = zoomControls.appendChild(document.createElement("div"));
    group.className = addon.tab.scratchClass("button-group_button-group");

    const button = group.appendChild(document.createElement("span"));
    button.className = addon.tab.scratchClass("button_button", "paint-editor_button-group-button", {
      others: "paint-layers-icon",
    });
    button.role = "button";
    button.addEventListener("click", () => {
      toggled = !toggled;
      if (toggled) {
        button.classList.add("selected");
        updateLayers(layersEl);
      } else {
        button.classList.remove("selected");
        removeLayers(layersEl);
      }
    });

    const image = button.appendChild(document.createElement("img"));
    image.alt = "Layers";
    image.className = addon.tab.scratchClass("paint-editor_button-group-button-icon");
    image.draggable = false;
    image.src = "/static/assets/acc6c29b5eee67bc6b2aa85854d9bb3a.svg";
  }
}
