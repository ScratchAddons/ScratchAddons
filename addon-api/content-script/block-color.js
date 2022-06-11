let blockCategoryColorProvider = null;

export const setBlockCategoryColorProvider = (provider) => {
  blockCategoryColorProvider = provider;
}

export const getBlockCategoryColors = async (tab, colorId) => {
  if ((typeof blockCategoryColorProvider) === "function")
    return await blockCategoryColorProvider(colorId);
  if (colorId === "sa") {
    const colors = tab.getCustomBlockColor();
    return {
      backgroundPrimary: colors.color,
      backgroundSecondary: colors.secondaryColor,
      backgroundTertiary: colors.tertiaryColor,
      coloredBackgroundPrimary: colors.color,
      coloredBackgroundSecondary: colors.tertiaryColor,
      brightBackground: colors.color,
      text: "#ffffff",
      uncoloredText: "#ffffff",
      coloredText: colors.color,
    };
  }
  const colors = (await tab.traps.getBlockly()).Colours[colorId];
  if (!colors) return null;
  return {
    backgroundPrimary: colors.primary,
    backgroundSecondary: colors.secondary,
    backgroundTertiary: colors.tertiary,
    coloredBackgroundPrimary: colors.primary,
    coloredBackgroundSecondary: colors.tertiary,
    brightBackground: colors.primary,
    text: "#ffffff",
    uncoloredText: "#ffffff",
    coloredText: colors.primary,
  };
}
