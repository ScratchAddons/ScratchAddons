// util function for selecting a costume or sound asset directly with the react State to avoid needing to simulate a click
export function assetSelect(addon, assetIndex, assetType) {
  const tabIndex = addon.tab.redux.state.scratchGui.editorTab.activeTabIndex;
  const tab = document.querySelectorAll("[class*='gui_tab-panel_']")[tabIndex];

  // `tab` refers to a DOM element inside one of these <TabPanel>:
  // https://github.com/scratchfoundation/scratch-gui/blob/0c46d7b9fce8c767fb8ae01aca4f5472a70d1de8/src/components/gui/gui.jsx#L339-L344
  // The React tree looks like this:
  // <TabPanel>
  //   ... various unimportant DOM ... <-- this is `tab`
  //     <WrappedCostumeTab> - https://github.com/scratchfoundation/scratch-gui/blob/0c46d7b9fce8c767fb8ae01aca4f5472a70d1de8/src/containers/costume-tab.jsx#L380
  //       <Connect> - from react-redux
  //         <InjectIntl> - from react-intl
  //           <ErrorBoundaryHOC> - from Scratch error handling
  //             <CostumeTab>
  // The sound tab is the same just find-and-replace CostumeTab with SoundTab
  // The index of the current costume/sound is stored in CostumeTab/SoundTab's state, so we have to get down there

  // Instead of hardcoding .child.child.child.child ... we'll loop to make this at least a little bit resilient to change
  // CostumeTab and SoundTab both have an onShowImporting prop so we'll stop when we see that
  let reactInternal = tab[addon.tab.traps.getInternalKey(tab)];
  while (reactInternal && !reactInternal.pendingProps.onShowImporting) {
    reactInternal = reactInternal.child;
  }

  if (reactInternal) {
    // overwrite state:
    // https://github.com/scratchfoundation/scratch-gui/blob/0c46d7b9fce8c767fb8ae01aca4f5472a70d1de8/src/containers/costume-tab.jsx#L99
    // https://github.com/scratchfoundation/scratch-gui/blob/0c46d7b9fce8c767fb8ae01aca4f5472a70d1de8/src/containers/sound-tab.jsx#L57
    // delay is needed so that we won't get overridden by componentWillReceiveProps
    setTimeout(() => {
      reactInternal.stateNode.setState({
        [assetType === "costume" ? "selectedCostumeIndex" : "selectedSoundIndex"]: assetIndex,
      });
    });
  }
}

// util function for creating and appending Elements
export function createAndAppendElement(type, parent, attrs = {}) {
  const element = document.createElement(type);
  Object.assign(element, attrs);
  parent.appendChild(element);
  return element;
}
