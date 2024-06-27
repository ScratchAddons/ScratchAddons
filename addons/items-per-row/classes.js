function setClasses(setting, value, thresholds) {
  for (let threshold of thresholds.min) {
    const className = `items-per-row-${setting}-min${threshold}`;
    if (value >= threshold) document.body.classList.add(className);
    else document.body.classList.remove(className);
  }
  for (let threshold of thresholds.max) {
    const className = `items-per-row-${setting}-max${threshold}`;
    if (value <= threshold) document.body.classList.add(className);
    else document.body.classList.remove(className);
  }
  if (thresholds.exact) {
    for (let threshold of thresholds.exact) {
      const className = `items-per-row-${setting}-${threshold}`;
      if (value === threshold) document.body.classList.add(className);
      else document.body.classList.remove(className);
    }
  }
}

export default async function ({ addon, console }) {
  await addon.tab.waitForElement("body");
  const updateClasses = () => {
    setClasses("search", addon.settings.get("search"), { min: [5], max: [2], exact: [4] });
    setClasses("studio-projects", addon.settings.get("studioProjects"), { min: [4, 5], max: [] });
    setClasses("studio-curators", addon.settings.get("studioCurators"), { min: [4, 5], max: [2] });
    setClasses("projects", addon.settings.get("projects"), { min: [6, 7], max: [4, 3] });
    setClasses("studios", addon.settings.get("studios"), { min: [6, 7], max: [3] });
    setClasses("users", addon.settings.get("users"), { min: [12, 15], max: [] });
  };
  updateClasses();
  addon.settings.addEventListener("change", () => {
    updateClasses();
    // Handle scratchr2's lazy image loading
    if (addon.tab.clientVersion === "scratchr2") window.dispatchEvent(new Event("scroll"));
  });
}
