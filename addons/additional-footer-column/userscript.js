export default async function ({ addon }) {
  const isScratchr2 = addon.tab.clientVersion === "scratchr2";
  const tagNames = {
    footerLocation: isScratchr2 ? "#footer .footer-col" : "#footer .lists",
    categoryName: isScratchr2 ? "li" : "dl",
    titleName: isScratchr2 ? "h4" : "dt",
    wrapperName: isScratchr2 ? "ul" : "div",
    linkName: isScratchr2 ? "li" : "dd",
  };

  const category = document.createElement(tagNames.categoryName);
  category.id = "sa-additional-footer-column";
  document.querySelector(tagNames.footerLocation).appendChild(category);

  const updateFooter = () => {
    if (![null, "projectPage"].includes(addon.tab.editorMode)) {
      return;
    }
    [...category.children].forEach((child) => child.remove());
    const title = document.createElement(tagNames.titleName);
    title.textContent = addon.settings.get("category-title");
    category.appendChild(title);
    const wrapper = document.createElement(tagNames.wrapperName);
    addon.settings.get("items").forEach(({ name, url }) => {
      const item = document.createElement(tagNames.linkName);
      const link = document.createElement("a");
      link.href = url;
      link.textContent = name;
      item.appendChild(link);
      wrapper.appendChild(item);
    });
    category.appendChild(wrapper);
  };
  updateFooter();

  addon.self.addEventListener("disabled", () => {
    category.style.display = "none";
  });
  addon.self.addEventListener("reenabled", () => {
    category.style.display = "";
  });
  addon.settings.addEventListener("change", updateFooter);
  addon.tab.addEventListener("urlChange", updateFooter);
}
