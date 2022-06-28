export default async function ({ addon, global, console, msg }) {
  const vm = addon.tab.traps.vm;

  const manager = document.createElement("div");
  manager.id = "sa-layer-manager";
  manager.classList.add(addon.tab.scratchClass("asset-panel_wrapper"), "sa-layer-manager");
  addon.tab.displayNoneWhileDisabled(manager, { display: "block" });

  const layerTab = document.createElement("li");
  addon.tab.displayNoneWhileDisabled(layerTab, { display: "flex" });
  layerTab.classList.add(addon.tab.scratchClass("react-tabs_react-tabs__tab"), addon.tab.scratchClass("gui_tab"));
  // Cannot use number due to conflict after leaving and re-entering editor
  layerTab.id = "react-tabs-sa-layer-manager";

  const layerTabIcon = document.createElement("img");
  layerTabIcon.draggable = false;
  layerTabIcon.style.marginRight = "0.5rem";
  layerTabIcon.style.width = "1em";
  layerTabIcon.src = addon.self.dir + "/icon.svg";

  const layerTabText = document.createElement("span");
  layerTabText.innerText = "Layers";

  layerTab.appendChild(layerTabIcon);
  layerTab.appendChild(layerTabText);

  layerTab.addEventListener("click", (e) => {
    addon.tab.redux.dispatch({ type: "scratch-gui/navigation/ACTIVATE_TAB", activeTabIndex: 4 });
  });

  function setVisible(visible) {
    if (visible) {
      layerTab.classList.add(
        addon.tab.scratchClass("react-tabs_react-tabs__tab--selected"),
        addon.tab.scratchClass("gui_is-selected")
      );
      const contentArea = document.querySelector("[class^=gui_tabs]");
      contentArea.insertAdjacentElement("beforeend", manager);
      const layerBody = document.getElementById("sa-layer-manager");

      while (layerBody.firstChild) {
        layerBody.removeChild(layerBody.firstChild);
      }

      let targets = vm.runtime.targets;

      let sortedTargets = [];
      let layers = [];
      for (let i=0;i<targets.length;i++) {
        layers.push(targets[i].getLayerOrder());
      }

      let x = 0;
      for (let i=0;i<layers.length;i++) {
        x = layers.indexOf(i);
        sortedTargets.push(targets[x]);
      }
      
      for (let z=sortedTargets.length;z>0;z--) {
        let i = z-1;
        if (!sortedTargets[i].isOriginal) {
          if (addon.settings.get("clone_vis") === true) {
            let layer = document.createElement('div');
            layer.className = "layer";
            layer.id = "layer-manager-" + sortedTargets[i].getLayerOrder();

            let layerNum = document.createElement('p');
            layerNum.className = "layer-id";
            layerNum.innerText = sortedTargets[i].getLayerOrder();

            let spriteName = document.createElement('p');
            spriteName.className = "sprite-name";
            spriteName.id = "sprite-name-" + i;
            if (!sortedTargets[i].isOriginal) {
              spriteName.innerText = msg("clone", {clone: sortedTargets[i].getName()});
            } else {
              spriteName.innerText = sortedTargets[i].getName();
            }

            let buttons = document.createElement('div');
            buttons.className = "function-buttons";

            let button = document.createElement('button');
            button.className = i;
            button.id = 'up-'+i;
            
            let img = document.createElement('img');
            img.src = 'https://scratch.mit.edu/static/assets/cc0065f74161f7e7859b31796aaa3345.svg';
            
            button.appendChild(img);
            buttons.appendChild(button);

            button = document.createElement('button');
            button.className = i;
            button.id = 'allup-'+i;
            
            img = document.createElement('img');
            img.src = 'https://scratch.mit.edu/static/assets/abdb9221f6fe3367ae1d899e2352d2e3.svg';
            
            button.appendChild(img);
            buttons.appendChild(button);
            
            button = document.createElement('button');
            button.className = i;
            button.id = 'down-'+i;
            
            img = document.createElement('img');
            img.src = 'https://scratch.mit.edu/static/assets/c4379c5eb21b7cf9b9c94055dde0b582.svg';
            
            button.appendChild(img);
            buttons.appendChild(button);

            button = document.createElement('button');
            button.className = i;
            button.id = 'alldown-'+i;
            
            img = document.createElement('img');
            img.src = 'https://scratch.mit.edu/static/assets/f3cd3bde88a384bf6757c9f30508cdd6.svg';
            
            button.appendChild(img);
            buttons.appendChild(button);
            
            layerBody.appendChild(layer);
            layer = document.getElementById("layer-manager-" + sortedTargets[i].getLayerOrder());
            layer.appendChild(layerNum);
            layer.appendChild(spriteName);
            if (sortedTargets[i].getLayerOrder() != 0) {
              layer.appendChild(buttons);
            }
          }
        } else {
          let layer = document.createElement('div');
          layer.className = "layer";
          layer.id = "layer-manager-" + sortedTargets[i].getLayerOrder();

          let layerNum = document.createElement('p');
          layerNum.className = "layer-id";
          layerNum.innerHTML = sortedTargets[i].getLayerOrder();

          let spriteName = document.createElement('p');
          spriteName.className = "sprite-name";
          spriteName.id = "sprite-name-" + i;
          if (!sortedTargets[i].isOriginal) {
            spriteName.innerHTML = msg("clone", { clone: sortedTargets[i].getName() });
          } else {
            spriteName.innerHTML = sortedTargets[i].getName();
          }

          let buttons = document.createElement('div');
          buttons.className = "function-buttons";
          buttons.innerHTML =
            "<button id='up-" +
            i +
            "' class='" +
            i +
            "'><img src='https://scratch.mit.edu/static/assets/cc0065f74161f7e7859b31796aaa3345.svg'></button><button id='allup-" +
            i +
            "' class='" +
            i +
            "'><img src='https://scratch.mit.edu/static/assets/abdb9221f6fe3367ae1d899e2352d2e3.svg'></button><button id='down-" +
            i +
            "' class='" +
            i +
            "'><img src='https://scratch.mit.edu/static/assets/c4379c5eb21b7cf9b9c94055dde0b582.svg'></button><button id='alldown-" +
            i +
            "' class='" +
            i +
            "'><img src='https://scratch.mit.edu/static/assets/f3cd3bde88a384bf6757c9f30508cdd6.svg'></button>";

          layerBody.appendChild(layer);
          layer = document.getElementById("layer-manager-" + sortedTargets[i].getLayerOrder());
          layer.appendChild(layerNum);
          layer.appendChild(spriteName);
          if (sortedTargets[i].getLayerOrder() != 0) {
            layer.appendChild(buttons);
          }
        }

        let input = document.getElementsByClassName('sprite-info_sprite-input_17wjb');
        input[0].addEventListener("change", function() {
          setVisible(true);
        });
      }

      document.getElementById('down-1').disabled = true;
      let length = sortedTargets.length - 1;
      document.getElementById('up-'+length).disabled = true;
      document.getElementById('alldown-1').disabled = true;
      document.getElementById('allup-'+length).disabled = true;

      for (let x=sortedTargets.length-1;x>0;x--) {
        let temp_id = "up-" + x;
        let button = document.getElementById(temp_id);
        if (!sortedTargets[x].isOriginal) {
          if (addon.settings.get("clone_vis") === true) {
            button.addEventListener("click", forward);
          }
        } else {
          button.addEventListener("click", forward);
        }

        function forward(evt) {
          sortedTargets[parseInt(evt.currentTarget.className)].goForwardLayers(1);
          setVisible(true);
        }

        temp_id = "down-" + x;
        button = document.getElementById(temp_id);
        if (!sortedTargets[x].isOriginal) {
          if (addon.settings.get("clone_vis") === true) {
            button.addEventListener("click", backward);
          }
        } else {
          button.addEventListener("click", backward);
        }

        function backward(evt) {
          sortedTargets[parseInt(evt.currentTarget.className)].goBackwardLayers(1);
          setVisible(true);
        }

        temp_id = "allup-" + x;
        button = document.getElementById(temp_id);
        if (!sortedTargets[x].isOriginal) {
          if (addon.settings.get("clone_vis") === true) {
            button.addEventListener("click", front);
          }
        } else {
          button.addEventListener("click", front);
        }

        function front(evt) {
          sortedTargets[parseInt(evt.currentTarget.className)].goToFront();
          setVisible(true);
        }

        temp_id = "alldown-" + x;
        button = document.getElementById(temp_id);
        if (!sortedTargets[x].isOriginal) {
          if (addon.settings.get("clone_vis") === true) {
            button.addEventListener("click", back);
          }
        } else {
          button.addEventListener("click", back);
        }

        function back(evt) {
          sortedTargets[parseInt(evt.currentTarget.className)].goToBack();
          setVisible(true);
        }
      }
    } else {
      layerTab.classList.remove(
        addon.tab.scratchClass("react-tabs_react-tabs__tab--selected"),
        addon.tab.scratchClass("gui_is-selected")
      );
      manager.remove();
    }
  }

  addon.tab.redux.initialize();
  addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
    if (detail.action.type === "scratch-gui/navigation/ACTIVATE_TAB") {
      setVisible(detail.action.activeTabIndex === 4);
    } else if (detail.action.type === "scratch-gui/mode/SET_PLAYER") {
      if (!detail.action.isPlayerOnly && addon.tab.redux.state.scratchGui.editorTab.activeTabIndex === 4) {
        // DOM doesn't actually exist yet
        queueMicrotask(() => setVisible(true));
      }
    }
  });

  addon.self.addEventListener("disabled", () => {
    if (addon.tab.redux.state.scratchGui.editorTab.activeTabIndex === 4) {
      addon.tab.redux.dispatch({ type: "scratch-gui/navigation/ACTIVATE_TAB", activeTabIndex: 2 });
    }
  });

  while (true) {
    await addon.tab.waitForElement("[class^='react-tabs_react-tabs__tab-list']", {
      markAsSeen: true,
      reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
      reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
    });
    addon.tab.appendToSharedSpace({ space: "afterSoundTab", element: layerTab, order: 4 });
  }
}
