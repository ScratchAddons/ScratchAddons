import { setSnapFrom, setSnapTo, snapOn, snapFrom, snapTo, toggle, threshold, setThreshold } from "./state.js";

/** @type {import("../../addon-api/content-script/typedef").UserscriptUtilities} */
export function initUI({ addon, msg }) {
  const createGroup = () => {
    const el = document.createElement("div");
    el.className = "sa-paint-snap-group";
    return el;
  };
  const createSeperator = () => {
    const el = document.createElement("div");
    el.className = "sa-paint-snap-settings-seperator";
    return el;
  };

  const createButton = ({ useButtonTag } = {}) => {
    const el = document.createElement(useButtonTag ? "button" : "span");
    el.className = "sa-paint-snap-button";
    el.setAttribute("role", "button");
    return el;
  };

  const createButtonImage = (name) => {
    const el = document.createElement("img");
    el.className = "sa-paint-snap-image";
    el.draggable = false;
    el.src = addon.self.dir + "/icons/" + name + ".svg";
    return el;
  };

  const controlsGroup = createGroup();
  addon.tab.displayNoneWhileDisabled(controlsGroup, {
    display: "flex",
  });

  const settingPageWrapper = document.createElement("div");
  settingPageWrapper.className = "sa-paint-snap-settings-wrapper";
  controlsGroup.appendChild(settingPageWrapper);

  const settingsPage = document.createElement("div");
  settingsPage.className = "sa-paint-snap-settings";
  settingPageWrapper.appendChild(settingsPage);

  //todo msg
  const SVG_NS = "http://www.w3.org/2000/svg";
  const settingsTip = document.createElementNS(SVG_NS, "svg");
  settingsTip.setAttribute("class", "sa-paint-snap-settings-tip");
  settingsTip.setAttribute("width", "14");
  settingsTip.setAttribute("height", "7");
  const settingsTipShape = document.createElementNS(SVG_NS, "polygon");
  settingsTipShape.setAttribute("class", "sa-paint-snap-settings-polygon");
  settingsTipShape.setAttribute("points", "0,0 7,7, 14,0");
  settingsTip.appendChild(settingsTipShape);
  settingsPage.appendChild(settingsTip);

  const toggleButton = createButton();
  toggleButton.addEventListener("click", () => {
    toggle(!snapOn);
    toggleButton.dataset.enabled = snapOn;
  });
  toggleButton.title = msg("toggle");
  toggleButton.appendChild(createButtonImage("snap"));
  toggleButton.dataset.enabled = snapOn;
  controlsGroup.appendChild(toggleButton);

  const settingButton = createButton();
  settingButton.addEventListener("click", () => setSettingsOpen(!areSettingsOpen()));
  settingButton.title = msg("settings");
  settingButton.appendChild(createButtonImage("settings"));
  controlsGroup.appendChild(settingButton);

  const setSettingsOpen = (open) => {
    settingButton.dataset.enabled = open;
    settingsPage.dataset.visible = open;
  };
  const areSettingsOpen = () => settingsPage.dataset.visible === "true";

  const createToggle = (button1Text, button2Text, defaultValue, onChange = () => {}) => {
    const values = [button1Text, button2Text];
    const group = createGroup();
    const button1 = createButton({ useButtonTag: true });
    const button2 = createButton({ useButtonTag: true });

    button1.appendChild(document.createTextNode(msg(button1Text)));
    button2.appendChild(document.createTextNode(msg(button2Text)));

    const setSelectedButton = (button, e, suppress = false) => {
      button1.dataset.enabled = !!button;
      button2.dataset.enabled = !button;
      if (!suppress) onChange(values[button]);
    };

    setSelectedButton(1 - values.indexOf(defaultValue), null, true);

    button1.addEventListener("click", setSelectedButton.bind(button1, 1));
    button2.addEventListener("click", setSelectedButton.bind(button2, 0));

    group.append(button1, button2);

    return group;
  };
  const createNumberInput = (defaultValue, onChange = () => {}, min = -Infinity, max = Infinity, step = 1) => {
    const group = createGroup();
    const filler = document.createElement("div");
    filler.style.width = "20px";

    const valueButton = createButton();
    valueButton.appendChild(filler);
    const valueInput = document.createElement("input");
    valueInput.className = "sa-paint-snap-settings-input";
    valueInput.type = "number";
    valueInput.step = step;
    valueInput.min = min;
    valueInput.max = max;
    valueInput.value = defaultValue;
    valueInput.addEventListener("input", () => {
      if (valueInput.value > max) valueInput.value = max;
      if (valueInput.value < min) valueInput.value = min;
      onChange(valueInput.value);
    });
    valueInput.addEventListener("blur", () => {
      if (!valueInput.value) valueInput.value = "0";
    });
    valueButton.appendChild(valueInput);

    const decrementButton = createButton();
    decrementButton.appendChild(createButtonImage("decrement"));
    decrementButton.addEventListener("click", () => {
      if (valueInput.value > min) {
        valueInput.value = Number(valueInput.value) - 1;
        onChange(Number(valueInput.value) + 1);
      }
    });

    const incrementButton = createButton();
    incrementButton.appendChild(createButtonImage("increment"));
    incrementButton.addEventListener("click", () => {
      if (valueInput.value < max) {
        valueInput.value = Number(valueInput.value) + 1;
        onChange(Number(valueInput.value) + 1);
      }
    });

    group.append(decrementButton, valueButton, incrementButton);

    return group;
  };

  const createSettingWithLabel = (label, settingElem) => {
    const container = document.createElement("label");
    container.className = "sa-paint-snap-settings-line";

    const labelElem = document.createElement("div");
    labelElem.className = "sa-paint-snap-settings-label";
    labelElem.textContent = label;
    container.append(labelElem, settingElem);

    return container;
  };

  const createSection = (title, ...settingElems) => {
    const sectionContainer = document.createElement("div");
    sectionContainer.className = "sa-paint-snap-settings-section";

    const titleElem = document.createElement("span");
    titleElem.appendChild(document.createTextNode(title));
    titleElem.className = "sa-paint-snap-settings-section-title";
    sectionContainer.appendChild(titleElem);

    sectionContainer.append(...settingElems);

    return sectionContainer;
  };

  const threshSetting = createSettingWithLabel(
    msg("threshold"),
    createNumberInput(
      threshold,
      (value) => {
        setThreshold(value);
      },
      4,
      50,
      1
    )
  );

  const toOnOff = (bool) => (bool ? "on" : "off");
  const toBool = (onOff) => !!["on", "off"].indexOf(onOff);
  const toggleParams = (defaultValue, onChange = () => {}) => [
    "off",
    "on",
    toOnOff(defaultValue),
    (value) => onChange(toBool(value)),
  ];
  const createSnapToSetting = (forPoint) =>
    createSettingWithLabel(
      msg(forPoint),
      createToggle(
        ...toggleParams(snapTo[forPoint], (enabled) => {
          setSnapTo(forPoint, enabled);
        })
      )
    );
  const snapToSection = createSection(
    msg("snapTo"),
    createSnapToSetting("pageCenter"),
    createSnapToSetting("pageEdges"),
    createSnapToSetting("pageCorners"),
    createSnapToSetting("objectCenters"),
    createSnapToSetting("objectEdges"),
    createSnapToSetting("objectCorners")
  );

  const createSnapFromSetting = (forPoint) =>
    createSettingWithLabel(
      msg(forPoint),
      createToggle(
        ...toggleParams(snapFrom[forPoint], (enabled) => {
          setSnapFrom(forPoint, enabled);
        })
      )
    );

  const snapFromSection = createSection(
    msg("snapFrom"),
    createSnapFromSetting("boxCenter"),
    createSnapFromSetting("boxCorners"),
    createSnapFromSetting("boxEdgeCenters")
  );

  settingsPage.append(threshSetting, createSeperator(), snapToSection, createSeperator(), snapFromSection);

  const controlsLoop = async () => {
    let hasRunOnce = false;
    while (true) {
      const canvasControls = await addon.tab.waitForElement("[class^='paint-editor_canvas-controls']", {
        markAsSeen: true,
        reduxEvents: [
          "scratch-gui/navigation/ACTIVATE_TAB",
          "scratch-gui/mode/SET_PLAYER",
          "fontsLoaded/SET_FONTS_LOADED",
          "scratch-gui/locales/SELECT_LOCALE",
          "scratch-gui/targets/UPDATE_TARGET_LIST",
        ],
        reduxCondition: (state) =>
          state.scratchGui.editorTab.activeTabIndex === 1 && !state.scratchGui.mode.isPlayerOnly,
      });
      const zoomControlsContainer = canvasControls.querySelector("[class^='paint-editor_zoom-controls']");
      addon.tab.appendToSharedSpace({
        space: "paintEditorZoomControls",
        element: controlsGroup,
        order: 2,
      });

      if (!hasRunOnce) {
        hasRunOnce = true;
        const groupClass = zoomControlsContainer.firstChild.className;
        const buttonClass = zoomControlsContainer.firstChild.firstChild.className;
        const imageClass = zoomControlsContainer.firstChild.firstChild.firstChild.className;
        for (const el of document.querySelectorAll(".sa-paint-snap-group")) {
          el.className += " " + groupClass;
        }
        for (const el of document.querySelectorAll(".sa-paint-snap-button")) {
          el.className += " " + buttonClass;
        }
        for (const el of document.querySelectorAll(".sa-paint-snap-image")) {
          el.className += " " + imageClass;
        }
      }
    }
  };
  controlsLoop();
}
