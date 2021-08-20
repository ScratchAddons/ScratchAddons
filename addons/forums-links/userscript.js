export default async ({ addon }) => {
  while (true) {
    const link = await addon.tab.waitForElement("a", {
      markAsSeen: true,
      reduxCondition: (state) => (state.scratchGui ? state.scratchGui.mode.isPlayerOnly : true),
    });

    link.href = decodeURIComponent(link.href);
  }
};
