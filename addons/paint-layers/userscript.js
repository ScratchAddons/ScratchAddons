export default async function ({ addon, msg, global, console }) {
  await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/sortable.min.js");
  window.paper = await addon.tab.traps.getPaper();
  let currentBounds;
  let layersPanelEl;
  let layersEl;
  let toggled = false;

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    console.log(detail.action.type, detail);
    if (!toggled) return;
    if ("scratch-paint/view/UPDATE_VIEW_BOUNDS" === detail.action.type) {
      // Check if the bounds were actually updated
      let newBounds = detail.action.viewBounds.values;
      if (newBounds.every((e, i) => e === currentBounds[i])) {
        updateLayers();
        updateLayerPanelHeight();
      } else {
        currentBounds = addon.tab.redux.state.scratchPaint.viewBounds.values;
        forceCanvasSizeRefresh();
      }
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

  // Makes Paper trigger a canvas size update by faking a browser window resize
  // If a more direct way to refresh the canvas size is available, feel free to replace this
  function forceCanvasSizeRefresh() {
    window.dispatchEvent(new Event("resize"));
    addon.tab.redux.dispatch({
      type: "scratch-paint/view/UPDATE_VIEW_BOUNDS",
      viewBounds: paper.view.matrix,
    });
  }

  // Makes the layer panel match the height of the "controls container" (tool ribbon, canvas, and zoom controls)
  // Scratch's flexbox implementation is so cursed that this is the only reasonable solution I could come to
  function updateLayerPanelHeight() {
    let controlsContainer = document.querySelector("[class^='paint-editor_controls-container_'");
    layersPanelEl.style.height = getComputedStyle(controlsContainer).height;
  }

  while (true) {
    const zoomControls = await addon.tab.waitForElement("[class^='paint-editor_zoom-controls']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/navigation/ACTIVATE_TAB", "scratch-gui/mode/SET_PLAYER"],
      reduxCondition: (state) => state.scratchGui.editorTab.activeTabIndex === 1 && !state.scratchGui.mode.isPlayerOnly,
    });
    toggled = false;

    const wrapper = document.querySelector("[class^=paint-editor_top-align-row_]");
    layersPanelEl = wrapper.appendChild(document.createElement("div"));
    layersPanelEl.className = "paint-layers-panel hidden";
    currentBounds = addon.tab.redux.state.scratchPaint.viewBounds.values;
    updateLayerPanelHeight();

    layersEl = layersPanelEl.appendChild(document.createElement("div"));
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
        layersPanelEl.classList.remove("hidden");
        updateLayers(layersEl);
      } else {
        button.classList.remove("selected");
        layersPanelEl.classList.add("hidden");
        removeLayers(layersEl);
      }
      forceCanvasSizeRefresh();
    });

    const image = button.appendChild(document.createElement("img"));
    image.alt = "Layers";
    image.className = addon.tab.scratchClass("paint-editor_button-group-button-icon");
    image.draggable = false;
    image.src = "/static/assets/acc6c29b5eee67bc6b2aa85854d9bb3a.svg";
  }
}
