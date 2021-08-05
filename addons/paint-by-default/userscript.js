export default async function ({ addon, console }) {
  const spriteMeta = {
    upload: {
      index: 0,
      tooltip: "gui.spriteSelector.addSpriteFromFile"
    },
    surprise: {
      index: 1,
      tooltip: "gui.spriteSelector.addSpriteFromSurprise"
    },
    paint: {
      index: 2,
      tooltip: "gui.spriteSelector.addSpriteFromPaint"
    },
    library: {
      index: 3,
      tooltip: "gui.spriteSelector.addSpriteFromLibrary"
    }
  };
  const backdropMeta = {
    upload: {
      index: 0,
      tooltip: "gui.stageSelector.addBackdropFromFile"
    },
    surprise: {
      index: 1,
      tooltip: "gui.stageSelector.addBackdropFromSurprise"
    },
    paint: {
      index: 2,
      tooltip: "gui.stageSelector.addBackdropFromPaint"
    },
    library: {
      index: 3,
      tooltip: "gui.spriteSelector.addBackdropFromLibrary"
    }
  };
  const costumeMeta = {
    upload: {
      index: 0,
      tooltip: "gui.costumeTab.addFileCostume"
    },
    surprise: {
      index: 1,
      tooltip: "gui.costumeTab.addSurpriseCostume"
    },
    paint: {
      index: 2,
      tooltip: "gui.costumeTab.addBlankCostume"
    },
    library: {
      index: 3,
      tooltip: "gui.costumeTab.addCostumeFromLibrary"
    }
  };
  const soundMeta = {
    upload: {
      index: 0,
      tooltip: "gui.soundTab.fileUploadSound"
    },
    surprise: {
      index: 1,
      tooltip: "gui.soundTab.surpriseSound"
    },
    record: {
      index: 2,
      tooltip: "gui.soundTab.recordSound"
    },
    library: {
      index: 3,
      tooltip: "gui.soundTab.addSoundFromLibrary"
    }
  };
  const getButtonToClick = (mainButton) => {
    const assetPanelWrapper = mainButton.closest("[class*=asset-panel_wrapper_]");
    if (assetPanelWrapper) {
      if (assetPanelWrapper.querySelector("[class*=sound-editor_editor-container_]")) {
        return soundMeta[addon.settings.get("sound")];
      } else {
        return costumeMeta[addon.settings.get("costume")];
      }
    } else if (mainButton.closest('[class*="target-pane_stage-selector-wrapper"]')) {
      return backdropMeta[addon.settings.get("backdrop")];
    } else {
      return spriteMeta[addon.settings.get("sprite")];
    }
  };
  document.body.addEventListener(
    "click",
    (e) => {
      if (addon.self.disabled) {
        return;
      }
      const mainButton = e.target.closest('[class*="action-menu_main-button_"]');
      if (!mainButton) {
        return;
      }
      e.stopPropagation();
      const moreButtonsElement = mainButton.parentElement.querySelector('[class*="action-menu_more-buttons_"]');
      const moreButtons = moreButtonsElement.children;
      const {index} = getButtonToClick(mainButton);
      // better-img-uploads can add a button at the start, so search "from the end" for compatibility
      const buttonToClick = moreButtons[moreButtons.length - (4 - index)];
      const elementToClick = buttonToClick.querySelector("button");
      elementToClick.click();
    },
    {
      bubble: true,
    }
  );
  document.body.addEventListener(
    "mouseover",
    (e) => {
      const mainButton = e.target.closest('[class*="action-menu_main-button_"]');
      if (!mainButton) {
        return;
      }
      const tooltipElement = mainButton.parentElement.querySelector(".__react_component_tooltip");
      const {tooltip} = getButtonToClick(mainButton);
      const messages = addon.tab.redux.state.locales.messages;
      const translatedTooltip = messages[tooltip];
      if (translatedTooltip) {
        tooltipElement.textContent = translatedTooltip;
        setTimeout(() => {
          tooltipElement.textContent = translatedTooltip;
        });
      }
    },
    {
      bubble: true
    }
  );
}
