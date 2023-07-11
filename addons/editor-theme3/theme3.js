import { removeAlpha, multiply, brighten, alphaBlend } from "../../libraries/common/cs/text-color.esm.js";

const dataUriRegex = new RegExp("^data:image/svg\\+xml;base64,([A-Za-z0-9+/=]*)$");
const extensionsCategory = {
  id: null,
  settingId: "Pen-color",
  colorId: "pen",
};
const saCategory = {
  settingId: "sa-color",
  colorId: "sa",
};
const categories = [
  {
    id: "motion",
    settingId: "motion-color",
    colorId: "motion",
  },
  {
    id: "looks",
    settingId: "looks-color",
    colorId: "looks",
  },
  {
    id: "sound",
    settingId: "sounds-color",
    colorId: "sounds",
  },
  {
    id: "events",
    settingId: "events-color",
    colorId: "event",
  },
  {
    id: "control",
    settingId: "control-color",
    colorId: "control",
  },
  {
    id: "sensing",
    settingId: "sensing-color",
    colorId: "sensing",
  },
  {
    id: "operators",
    settingId: "operators-color",
    colorId: "operators",
  },
  {
    id: "variables",
    settingId: "data-color",
    colorId: "data",
  },
  {
    id: "lists",
    settingId: "data-lists-color",
    colorId: "data_lists",
  },
  {
    id: "myBlocks",
    settingId: "custom-color",
    colorId: "more",
  },
  extensionsCategory,
  saCategory,
];

// From scratch-blocks/media/dropdown-arrow.svg
const arrowPath =
  "M6.36,7.79a1.43,1.43,0,0,1-1-.42L1.42,3.45a1.44,1.44,0,0,1,0-2c0.56-.56,9.31-0.56,9.87,0a1.44,1.44,0,0,1,0,2L7.37,7.37A1.43,1.43,0,0,1,6.36,7.79Z";
const arrowShadowPath =
  "M12.71,2.44A2.41,2.41,0,0,1,12,4.16L8.08,8.08a2.45,2.45,0,0,1-3.45,0L0.72,4.16A2.42,2.42,0,0,1,0,2.44,2.48,2.48,0,0,1,.71.71C1,0.47,1.43,0,6.36,0S11.75,0.46,12,.71A2.44,2.44,0,0,1,12.71,2.44Z";
const arrowShadowColor = "#231f20";

export default async function ({ addon, console, msg }) {
  const Blockly = await addon.tab.traps.getBlockly();

  const originalColors = JSON.parse(JSON.stringify(Blockly.Colours));
  originalColors.sa = {
    primary: "#29beb8",
    secondary: "#3aa8a4",
    tertiary: "#3aa8a4",
  };

  let textModeSetting = addon.settings.get("text");
  const textMode = () => {
    if (addon.self.disabled) {
      return originalColors.text === "#000000" ? "black" : "white";
    }
    return textModeSetting;
  };
  const isColoredTextMode = () => textMode() === "colorOnWhite" || textMode() === "colorOnBlack";

  const primaryColor = (category) => {
    if (addon.self.disabled) return originalColors[category.colorId].primary;
    // Colored on white: can't use #ffffff because of editor-dark-mode dropdown div handling
    if (textMode() === "colorOnWhite") return "#feffff";
    if (textMode() === "colorOnBlack") return "#282828";
    return addon.settings.get(category.settingId);
  };
  const secondaryColor = (category) => {
    if (addon.self.disabled) return originalColors[category.colorId].secondary;
    if (isColoredTextMode())
      return alphaBlend(primaryColor(category), multiply(addon.settings.get(category.settingId), { a: 0.15 }));
    if (textMode() === "black") return brighten(addon.settings.get(category.settingId), { r: 0.6, g: 0.6, b: 0.6 });
    return multiply(addon.settings.get(category.settingId), { r: 0.9, g: 0.9, b: 0.9 });
  };
  const tertiaryColor = (category) => {
    if (addon.self.disabled) return originalColors[category.colorId].tertiary;
    if (isColoredTextMode()) return addon.settings.get(category.settingId);
    if (textMode() === "black") return multiply(addon.settings.get(category.settingId), { r: 0.65, g: 0.65, b: 0.65 });
    return multiply(addon.settings.get(category.settingId), { r: 0.8, g: 0.8, b: 0.8 });
  };
  const fieldBackground = (category) => {
    // Background color for open dropdowns and (in some textModes) Boolean inputs
    // The argument can be a block, field, or category
    if (category instanceof Blockly.Block || category instanceof Blockly.Field) {
      const block = category instanceof Blockly.Block ? category : category.sourceBlock_;
      if (isColoredTextMode() || textMode() === "black") {
        let primary;
        if (block.isShadow() && block.getParent()) primary = block.getParent().getColour();
        else primary = block.getColour();
        if (isColoredTextMode()) return alphaBlend(primary, multiply(block.getColourTertiary(), { a: 0.25 }));
        else return brighten(primary, { r: 0.4, g: 0.4, b: 0.4 });
      }
      return block.getColourTertiary();
    }
    if (isColoredTextMode())
      return alphaBlend(primaryColor(category), multiply(addon.settings.get(category.settingId), { a: 0.25 }));
    if (textMode() === "black") return brighten(primaryColor(category), { r: 0.4, g: 0.4, b: 0.4 });
    return tertiaryColor(category);
  };
  const textColor = (field) => {
    if (addon.self.disabled) return originalColors.text;
    if (textMode() === "white") return "#ffffff";
    if (textMode() === "black") return "#000000";
    if (field) return field.sourceBlock_.getColourTertiary();
    return "#000000";
  };
  const uncoloredTextColor = () => {
    return {
      white: "#ffffff",
      black: "#000000",
      colorOnWhite: "#000000",
      colorOnBlack: "#ffffff",
    }[textMode()];
  };
  const otherColor = (settingId, colorId) => {
    if (addon.self.disabled) return originalColors[colorId];
    return addon.settings.get(settingId);
  };
  const useBlackIcons = () => {
    return {
      white: false,
      black: true,
      colorOnWhite: true,
      colorOnBlack: false,
    }[textMode()];
  };
  const iconPath = () => `${addon.self.dir}/icons/${useBlackIcons() ? "black_text" : "white_text"}`;

  const makeDropdownArrow = (color) => {
    const arrow = Blockly.utils.createSvgElement("g");
    arrow.appendChild(
      Blockly.utils.createSvgElement("path", {
        d: arrowShadowPath,
        fill: arrowShadowColor,
        "fill-opacity": 0.1,
        transform: "translate(0, 1.6)",
      })
    );
    arrow.appendChild(
      Blockly.utils.createSvgElement("path", {
        d: arrowPath,
        fill: color,
        transform: "translate(0, 1.6)",
      })
    );
    return arrow;
  };

  // Blockly doesn't handle colors with transparency
  const oldBlockMakeColor = Blockly.Block.prototype.makeColour_;
  Blockly.Block.prototype.makeColour_ = function (color) {
    if (typeof color === "string" && /^#(?:[0-9A-Za-z]{2}){3,4}$/.test(color)) return color;
    return oldBlockMakeColor(color);
  };

  const oldCategoryCreateDom = Blockly.Toolbox.Category.prototype.createDom;
  Blockly.Toolbox.Category.prototype.createDom = function () {
    // Category bubbles
    if (this.iconURI_) {
      if (addon.self.disabled) return oldCategoryCreateDom.call(this);
      if (!["sa-blocks", "videoSensing", "text2speech"].includes(this.id_)) return oldCategoryCreateDom.call(this);

      const match = dataUriRegex.exec(this.iconURI_);
      if (match) {
        const oldSvg = atob(match[1]);
        const category = this.id_ === "sa-blocks" ? saCategory : extensionsCategory;
        const newColor = textMode() === "white" ? primaryColor(category) : tertiaryColor(category);
        if (newColor) {
          const newSvg = oldSvg.replace(/#29beb8|#229487|#0ebd8c/gi, newColor);
          this.iconURI_ = `data:image/svg+xml;base64,${btoa(newSvg)}`;
        }
      }
    }
    oldCategoryCreateDom.call(this);
    if (this.iconURI_) return;
    const category = categories.find((item) => item.id === this.id_);
    if (!category) return;
    this.bubble_.style.backgroundColor = isColoredTextMode() ? fieldBackground(category) : primaryColor(category);
    this.bubble_.style.borderColor = tertiaryColor(category);
  };

  const oldBlockSetColour = Blockly.Block.prototype.setColour;
  Blockly.Block.prototype.setColour = function (colour, colourSecondary, colourTertiary) {
    // Extension blocks (color is set by VM)
    if (colour.toLowerCase() === originalColors.pen.primary.toLowerCase()) {
      colour = primaryColor(extensionsCategory);
      colourSecondary = secondaryColor(extensionsCategory);
      colourTertiary = tertiaryColor(extensionsCategory);
    }
    return oldBlockSetColour.call(this, colour, colourSecondary, colourTertiary);
  };

  const oldBlockUpdateColour = Blockly.BlockSvg.prototype.updateColour;
  Blockly.BlockSvg.prototype.updateColour = function () {
    oldBlockUpdateColour.call(this);
    // Boolean inputs
    if (isColoredTextMode()) {
      for (const input of this.inputList) {
        if (input.outlinePath) {
          input.outlinePath.setAttribute("fill", fieldBackground(this));
        }
      }
    }
  };

  const oldBlockShowContextMenu = Blockly.BlockSvg.prototype.showContextMenu_;
  Blockly.BlockSvg.prototype.showContextMenu_ = function (e) {
    Blockly.WidgetDiv.DIV.style.setProperty("--editorTheme3-hoveredItem", fieldBackground(this));
    return oldBlockShowContextMenu.call(this, e);
  };

  const oldFieldLabelInit = Blockly.FieldLabel.prototype.init;
  Blockly.FieldLabel.prototype.init = function () {
    // Labels
    oldFieldLabelInit.call(this);
    this.textElement_.style.fill = textColor(this);
  };

  const oldFieldTextInputInit = Blockly.FieldTextInput.prototype.init;
  Blockly.FieldTextInput.prototype.init = function () {
    // Text inputs
    oldFieldTextInputInit.call(this);
    if (this.sourceBlock_.isShadow()) return;
    // Labels in custom block editor
    this.box_.setAttribute("fill", fieldBackground(this));
  };

  const oldFieldImageSetValue = Blockly.FieldImage.prototype.setValue;
  Blockly.FieldImage.prototype.setValue = function (src) {
    // Icons
    if ((src.startsWith("data:") || src.includes("static/assets")) && this.sourceBlock_) {
      // Extension icon
      const iconsToReplace = ["music", "pen", "text2speech", "translate", "videoSensing"];
      const extensionId = this.sourceBlock_.type.split("_")[0];
      if (iconsToReplace.includes(extensionId)) {
        if (extensionId === "translate" && !useBlackIcons()) src = `${iconPath()}/extensions/translate.png`;
        else src = `${iconPath()}/extensions/${extensionId}.svg`;
      }
    } else {
      const iconsToReplace = ["repeat.svg", "rotate-left.svg", "rotate-right.svg"];
      const iconName = src.split("/").at(-1);
      if (iconsToReplace.includes(iconName)) {
        src = `${iconPath()}/${iconName}`;
      }
    }
    return oldFieldImageSetValue.call(this, src);
  };

  const oldFieldDropdownInit = Blockly.FieldDropdown.prototype.init;
  Blockly.FieldDropdown.prototype.init = function () {
    // Dropdowns
    oldFieldDropdownInit.call(this);
    this.textElement_.style.setProperty("fill", textColor(this), "important");
    this.arrow_.remove();
    this.arrow_ = makeDropdownArrow(textColor(this));
    // Redraw arrow
    const text = this.text_;
    this.text_ = null;
    this.setText(text);
  };

  const oldFieldDropdownShowEditor = Blockly.FieldDropdown.prototype.showEditor_;
  Blockly.FieldDropdown.prototype.showEditor_ = function () {
    oldFieldDropdownShowEditor.call(this);

    // Open dropdowns
    if (!this.disableColourChange_) {
      if (this.sourceBlock_.isShadow()) {
        this.sourceBlock_.setShadowColour(fieldBackground(this));
      } else if (this.box_) {
        this.box_.setAttribute("fill", fieldBackground(this));
      }
    }

    // Dropdown menus
    let primaryColor;
    if (this.sourceBlock_.isShadow() && this.sourceBlock_.getParent())
      primaryColor = this.sourceBlock_.getParent().getColour();
    else primaryColor = this.sourceBlock_.getColour();
    Blockly.DropDownDiv.DIV_.style.backgroundColor = removeAlpha(primaryColor);
    if (isColoredTextMode()) {
      Blockly.DropDownDiv.getContentDiv().style.setProperty("--editorTheme3-hoveredItem", fieldBackground(this));
    } else {
      Blockly.DropDownDiv.getContentDiv().style.removeProperty("--editorTheme3-hoveredItem");
    }
  };

  const oldFieldVariableInit = Blockly.FieldVariable.prototype.init;
  Blockly.FieldVariable.prototype.init = function () {
    // Variable dropdowns
    oldFieldVariableInit.call(this);
    this.textElement_.style.setProperty("fill", textColor(this), "important");
  };

  const oldFieldVariableGetterInit = Blockly.FieldVariableGetter.prototype.init;
  Blockly.FieldVariableGetter.prototype.init = function () {
    // Variable reporters
    oldFieldVariableGetterInit.call(this);
    this.textElement_.style.fill = textColor(this);
  };

  const oldFieldNoteAddOctaveButton = Blockly.FieldNote.prototype.addOctaveButton_;
  Blockly.FieldNote.prototype.addOctaveButton_ = function (...args) {
    // Octave buttons in "play note" dropdown
    const group = oldFieldNoteAddOctaveButton.call(this, ...args);
    group
      .querySelector("image")
      .setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", `${iconPath()}/arrow_button.svg`);
    return group;
  };

  // Matrix inputs
  const oldFieldMatrixInit = Blockly.FieldMatrix.prototype.init;
  Blockly.FieldMatrix.prototype.init = function () {
    oldFieldMatrixInit.call(this);
    const arrowTransform = this.arrow_.getAttribute("transform");
    this.arrow_.remove();
    this.arrow_ = makeDropdownArrow(textColor(this));
    this.arrow_.setAttribute("transform", arrowTransform);
    this.arrow_.style.cursor = "default";
    this.fieldGroup_.appendChild(this.arrow_);
  };
  const oldFieldMatrixShowEditor = Blockly.FieldMatrix.prototype.showEditor_;
  Blockly.FieldMatrix.prototype.showEditor_ = function () {
    oldFieldMatrixShowEditor.call(this);
    let primaryColor;
    if (this.sourceBlock_.isShadow() && this.sourceBlock_.getParent())
      primaryColor = this.sourceBlock_.getParent().getColour();
    else primaryColor = this.sourceBlock_.getColour();
    Blockly.DropDownDiv.DIV_.style.backgroundColor = removeAlpha(primaryColor);
  };
  const oldFieldMatrixUpdateMatrix = Blockly.FieldMatrix.prototype.updateMatrix_;
  Blockly.FieldMatrix.prototype.updateMatrix_ = function () {
    oldFieldMatrixUpdateMatrix.call(this);
    for (let i = 0; i < this.matrix_.length; i++) {
      if (this.matrix_[i] !== "0") {
        this.fillMatrixNode_(this.ledButtons_, i, uncoloredTextColor());
        this.fillMatrixNode_(this.ledThumbNodes_, i, uncoloredTextColor());
      }
    }
  };
  const oldFieldMatrixCreateButton = Blockly.FieldMatrix.prototype.createButton_;
  Blockly.FieldMatrix.prototype.createButton_ = function (fill) {
    if (fill === "#FFFFFF") fill = uncoloredTextColor();
    return oldFieldMatrixCreateButton.call(this, fill);
  };

  const oldFieldVerticalSeparatorInit = Blockly.FieldVerticalSeparator.prototype.init;
  Blockly.FieldVerticalSeparator.prototype.init = function () {
    // Vertical line between extension icon and block label
    oldFieldVerticalSeparatorInit.call(this);
    if (isColoredTextMode() || textMode() === "black")
      this.lineElement_.setAttribute("stroke", this.sourceBlock_.getColourTertiary());
  };

  const updateColors = () => {
    const vm = addon.tab.traps.vm;

    textModeSetting = addon.settings.get("text");

    for (const category of categories) {
      // CSS variables are used for compatibility with other addons
      const prefix = `--editorTheme3-${category.colorId}`;
      for (const [name, value] of Object.entries({
        primary: primaryColor(category),
        secondary: secondaryColor(category),
        tertiary: tertiaryColor(category),
        field: fieldBackground(category),
      })) {
        document.documentElement.style.setProperty(`${prefix}-${name}`, value);
      }

      // Update Blockly.Colours
      if (!Blockly.Colours[category.colorId]) continue;
      Blockly.Colours[category.colorId].primary = primaryColor(category);
      Blockly.Colours[category.colorId].secondary = secondaryColor(category);
      Blockly.Colours[category.colorId].tertiary = tertiaryColor(category);
    }
    addon.tab.setCustomBlockColor({
      color: primaryColor(saCategory),
      secondaryColor: secondaryColor(saCategory),
      tertiaryColor: tertiaryColor(saCategory),
    });
    Blockly.Colours.textField = otherColor("input-color", "textField");
    if (textMode() === "colorOnWhite") Blockly.Colours.fieldShadow = "rgba(0, 0, 0, 0.15)";
    else Blockly.Colours.fieldShadow = originalColors.fieldShadow;

    const workspace = Blockly.getMainWorkspace();
    const flyout = workspace.getFlyout();
    const toolbox = workspace.getToolbox();

    // Reload toolbox
    if (vm.editingTarget) {
      vm.emitWorkspaceUpdate();
    }
    if (!flyout || !toolbox) return;
    const flyoutWorkspace = flyout.getWorkspace();
    Blockly.Xml.clearWorkspaceAndLoadFromXml(Blockly.Xml.workspaceToDom(flyoutWorkspace), flyoutWorkspace);
    toolbox.populate_(workspace.options.languageTree);
    workspace.toolboxRefreshEnabled_ = true;
  };

  updateColors();
  addon.settings.addEventListener("change", updateColors);
  addon.self.addEventListener("disabled", updateColors);
  addon.self.addEventListener("reenabled", updateColors);

  /* inject() and overrideColours() are called when a new Blockly instance is created,
     which usually happens when changing the Scratch theme, language, or editor mode.
     They will also be called when the Make a Block modal is opened. */
  const oldInject = Blockly.inject;
  Blockly.inject = function (...args) {
    const workspace = oldInject.call(this, ...args);
    /* Scratch doesn't pass color options to inject() when creating a custom block
       editing workspace, so we don't need to call updateColors() in that case.
       The custom block workspace doesn't have a toolbox. */
    if (workspace.getToolbox()) updateColors();
    return workspace;
  };
  Blockly.inject.bindDocumentEvents_ = oldInject.bindDocumentEvents_;
  Blockly.inject.loadSounds_ = oldInject.loadSounds_;
  Blockly.Colours.overrideColours = function (newColors) {
    if (!newColors) return;
    Object.assign(originalColors, newColors);
  };

  while (true) {
    const colorModeSubmenu = await addon.tab.waitForElement(
      "[class*=menu-bar_menu-bar-menu_] > ul > li:nth-child(2) ul",
      {
        markAsSeen: true,
        reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
      }
    );
    // We're running in the new version of the editor that includes this menu.

    colorModeSubmenu.addEventListener(
      "click",
      (e) => {
        if (addon.self.disabled) return;
        if (!e.target.closest(".sa-colormode-submenu")) {
          // Something went wrong with the code below this event listener
          return;
        }
        if (e.target.closest(".sa-theme3-link")) {
          window.open("https://scratch.mit.edu/scratch-addons-extension/settings#addon-editor-theme3");
          e.stopPropagation();
          return;
        }
        e.stopPropagation();
      },
      { capture: true }
    );

    const elementToClone = colorModeSubmenu.querySelector("[class*=settings-menu_selected_]").closest("li");

    const SA_ICON_URL = addon.self.dir + "../../../images/cs/icon.svg";

    const managedBySa = elementToClone.cloneNode(true);
    addon.tab.displayNoneWhileDisabled(managedBySa, { display: "block" });
    managedBySa.classList.add("sa-theme3-managed");
    managedBySa.querySelector("div span").textContent = msg("/global/meta/managedBySa");
    managedBySa.querySelector("img[class*=settings-menu_icon_]").src = SA_ICON_URL;

    const addonSettingsLink = elementToClone.cloneNode(true);
    addon.tab.displayNoneWhileDisabled(addonSettingsLink, { display: "block" });
    addonSettingsLink.classList.add("sa-theme3-link");
    addonSettingsLink.classList.add(addon.tab.scratchClass("menu_menu-section") || "_");
    addonSettingsLink.querySelector("div span").textContent = msg("/global/meta/addonSettings");
    addonSettingsLink.querySelector("img[class*=settings-menu_icon_]").src = SA_ICON_URL;
    const addonSettingsImg = document.createElement("img");
    addonSettingsImg.classList.add("sa-theme3-new-tab");
    addonSettingsImg.src = addon.self.dir + "/open-link.svg";
    addonSettingsLink.querySelector("div").appendChild(addonSettingsImg);

    colorModeSubmenu.classList.add("sa-colormode-submenu");
    colorModeSubmenu.appendChild(managedBySa);
    colorModeSubmenu.appendChild(addonSettingsLink);
  }
}
