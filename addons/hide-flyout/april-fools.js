const MARCH_31TH = 1743379200; // GMT March 31, 2025 12:00:00 AM
const APRIL_3RD = 1743638400; // GMT April 3, 2025 12:00:00 AM

export const isScratchAprilFools25 = async (redux) => {
  const now = Date.now() / 1000;
  if (now > APRIL_3RD) return false;

  if (document.readyState !== "complete") {
    // data-category-tweaks-v2
    await new Promise((resolve) => window.addEventListener("load", () => resolve(), { once: true }));
  }

  let isAprilFools = false;
  if (!redux.state && now < APRIL_3RD && now > MARCH_31TH) isAprilFools = true;
  else {
    await redux.waitForState((state) => state.session?.session?.flags);
    isAprilFools = Object.entries(redux.state.session.session.flags).some(
      ([k, v]) => k.includes("normal") && v === true
    );
  }
  return isAprilFools;
};
