export default async ({ addon, console, msg }) => {
  const { redux } = addon.tab;
  const vm = addon.tab.traps.vm;
  let reactInternalKey = "";
  while (true) {
    const ctxMenu = await addon.tab.waitForElement(
      "div[class*='asset-panel_wrapper'] div[class*='sprite-selector-item_sprite-selector-item_'] > nav.react-contextmenu",
      {
        markAsSeen: true,
        reduxCondition: (state) => {
          const { mode, editorTab } = state.scratchGui;
          return !mode.isPlayerOnly && (editorTab.activeTabIndex === 1 || editorTab.activeTabIndex === 2);
        },
        reduxEvents: [
          "scratch-gui/mode/SET_PLAYER",
          "fontsLoaded/SET_FONTS_LOADED",
          "scratch-gui/locales/SELECT_LOCALE",
          "scratch-gui/navigation/ACTIVATE_TAB",
          "scratch-gui/targets/UPDATE_TARGET_LIST",
        ],
      }
    );
    const isCostume = !!ctxMenu.closest("#react-tabs-3");
    const assetItem = ctxMenu.parentNode.parentNode;
    if (!reactInternalKey)
      reactInternalKey = Object.keys(assetItem).find((key) => key.startsWith("__reactInternalInstance$"));
    const stateNode = assetItem[reactInternalKey].child.stateNode;
    const target = vm.editingTarget;

    const createButton = ({ className, name, isDangerous = false }, cb) => {
      const classes = ["context-menu_menu-item"];
      if (isDangerous) classes.push("context-menu_menu-item-danger");
      const item = Object.assign(document.createElement("div"), {
        className: addon.tab.scratchClass(...classes, {
          others: ["react-contextmenu-item", className],
        }),
        title: msg("added-by-sa"),
      });
      item.append(Object.assign(document.createElement("span"), { textContent: name }));
      item.addEventListener("click", () => {
        window.dispatchEvent(
          new CustomEvent("REACT_CONTEXTMENU_HIDE", {
            detail: {
              type: "REACT_CONTEXTMENU_HIDE",
            },
          })
        );
        cb();
      });
      return item;
    };

    const exportButton = ctxMenu.children[1];

    const moveToTopBtn = createButton(
      {
        className: "sa-asset-ctx-menu-move-to-top",
        name: msg("move-to-top"),
      },
      () => {
        if (isCostume) {
          target.reorderCostume(stateNode.props.index, 0);
        } else {
          target.reorderSound(stateNode.props.index, 0);
        }
        // Yes you can use React internals but it's harder to access
        queueMicrotask(() => ctxMenu.parentNode.click());
      }
    );
    addon.tab.displayNoneWhileDisabled(moveToTopBtn, {
      display: "var(--sa-asset-ctx-menu-display, block)",
    });
    exportButton.after(moveToTopBtn);

    const moveToBottomBtn = createButton(
      {
        className: "sa-asset-ctx-menu-move-to-bottom",
        name: msg("move-to-bottom"),
      },
      () => {
        if (isCostume) {
          target.reorderCostume(stateNode.props.index, Infinity);
        } else {
          target.reorderSound(stateNode.props.index, Infinity);
        }
        queueMicrotask(() => ctxMenu.parentNode.click());
      }
    );
    addon.tab.displayNoneWhileDisabled(moveToBottomBtn, {
      display: "var(--sa-asset-ctx-menu-display, block)",
    });
    exportButton.after(moveToBottomBtn);

    if (!isCostume) {
      // There must be at least one costume
      const deleteAllBtn = createButton(
        {
          className: "sa-asset-ctx-menu-delete-all",
          name: msg("delete-all"),
          isDangerous: true,
        },
        () => {
          if (confirm(msg("delete-all-sounds-confirm"))) {
            const sounds = [...target.sprite.sounds];
            target.sprite.sounds.length = 0;
            vm.emitTargetsUpdate();
            vm.runtime.emitProjectChanged();
            redux.dispatch({
              type: "scratch-gui/restore-deletion/RESTORE_UPDATE",
              state: {
                restoreFun: () => {
                  // Skip decoding done in vm.addSound - all sounds are already decoded
                  // We can't skip unused name check in RenderedTarget.addSound though
                  // target is alive - otherwise restoreFun is overwritten
                  sounds.forEach((sound) => target.addSound(sound));
                  vm.emitTargetsUpdate();
                },
                deletedItem: "Sound",
              },
            });
          }
        }
      );
      addon.tab.displayNoneWhileDisabled(deleteAllBtn, {
        display: "var(--sa-asset-ctx-menu-display, block)",
      });
      ctxMenu.append(deleteAllBtn);
    }

    const deleteOthersBtn = createButton(
      {
        className: "sa-asset-ctx-menu-delete-others",
        name: msg("delete-others"),
        isDangerous: true,
      },
      () => {
        const existing = isCostume ? target.sprite.costumes : target.sprite.sounds;
        if (existing.length < 2) return;
        const type = isCostume ? (target.isStage ? "backdrops" : "costumes") : "sounds";
        if (
          confirm(
            msg("delete-others-confirm", {
              type: msg(type, { num: existing.length - 1 }), // one asset remains
            })
          )
        ) {
          const index = stateNode.props.index;
          // Used to (try to) keep order when restoring
          const indexBefore = existing.slice(0, index);
          const indexAfter = existing.slice(index + 1);
          const toBeKept = existing[index];
          if (isCostume) {
            target.sprite.costumes[0] = toBeKept;
            target.sprite.costumes.length = 1;
            // It is important to do this on all clones to prevent crash.
            target.sprite.clones.forEach((t) => t.setCostume(0));
            redux.dispatch({
              type: "scratch-gui/restore-deletion/RESTORE_UPDATE",
              state: {
                restoreFun: () => {
                  indexBefore.forEach((costume) => target.addCostume(costume, 0));
                  indexAfter.forEach((costume) => target.addCostume(costume));
                  vm.emitTargetsUpdate();
                  vm.runtime.emitProjectChanged();
                },
                deletedItem: "Costume",
              },
            });
          } else {
            // Sounds
            target.sprite.sounds[0] = toBeKept;
            target.sprite.sounds.length = 1;
            redux.dispatch({
              type: "scratch-gui/restore-deletion/RESTORE_UPDATE",
              state: {
                restoreFun: () => {
                  indexBefore.forEach((sound) => target.addSound(sound, 0));
                  indexAfter.forEach((sound) => target.addSound(sound));
                  vm.emitTargetsUpdate();
                  vm.runtime.emitProjectChanged();
                },
                deletedItem: "Sound",
              },
            });
          }
          vm.emitTargetsUpdate();
          vm.runtime.emitProjectChanged();
        }
      }
    );
    addon.tab.displayNoneWhileDisabled(deleteOthersBtn, {
      display: "var(--sa-asset-ctx-menu-display, block)",
    });
    ctxMenu.append(deleteOthersBtn);
  }
};
