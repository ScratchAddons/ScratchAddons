export default async function ({ addon }) {
  while (true) {
    const categoryBody = await addon.tab.waitForElement('[id^="category_body_"]', {
      markAsSeen: true,
    });

    const categoryToggle = categoryBody.querySelector(".toggle");
    categoryToggle.addEventListener("click", (e) => e.preventDefault());

    const categoryNumber = categoryBody.id.split("_").pop();
    if (!shouldCollapseCategory(categoryNumber)) continue;
    extendCategoryCookieExistenceLength(categoryNumber);

    const categoryContent = categoryBody.querySelector(".box-content");
    categoryContent.style.display = "none";

    const categoryHead = categoryBody.querySelector(`.box-head h4`);
    categoryHead.classList.add("collapsed");
  }

  function shouldCollapseCategory(categoryNumber) {
    const cookieName = `category_body_${categoryNumber}`;
    const storedInCookie = document.cookie.includes(`${cookieName}=collapsed`);
    return storedInCookie;
  }

  function extendCategoryCookieExistenceLength(categoryNumber) {
    const cookieName = `category_body_${categoryNumber}`;
    document.cookie = `${cookieName}=collapsed;max-age=${30 * 24 * 60 * 60}`;
  }
}
