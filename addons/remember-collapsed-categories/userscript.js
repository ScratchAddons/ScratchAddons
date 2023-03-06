export default async function ({ console, addon }) {
  while (true) {
    const categoryBody = await addon.tab.waitForElement('[id^="category_body_"]', {
      markAsSeen: true,
    });
    console.log(`Found category ${categoryBody.id}`);

    let categoryCollapse = categoryBody.querySelector(".toggle");
    categoryCollapse.addEventListener("click", event => {
      event.preventDefault();
      let categoryHead = event.target.parentElement;
      if (categoryHead.classList.contains("sa-collapsed")) {
        categoryHead.classList.remove("sa-collapsed");
        console.log(`${categoryHead.id.split("_")[2]} is being opened`);
        return;
      } else {
        categoryHead.classList.add("sa-collapsed");
        extendCategoryCookieExistenceLength(categoryNumber);
      }
    });

    let categoryNumber = categoryBody.id.split("_").pop();
    if (!shouldCollapseCategory(categoryNumber)) {
      removeCategoryCookie(categoryNumber);
      continue;
    }
    extendCategoryCookieExistenceLength(categoryNumber);

    let categoryContent = categoryBody.querySelector(".box-content");
    categoryContent.style.display = "none";

    let categoryHead = categoryBody.querySelector(`.box-head h4`);
    categoryHead.classList.add("collapsed");
    categoryHead.classList.add("sa-collapsed");

    let categoryName = categoryHead.innerText.split("\n")[1]; // This is exclusively for debug purposes
    console.log(`Category ${categoryName}(#${categoryNumber}) should be hidden`);
  }

  function shouldCollapseCategory(categoryNumber) {
    let cookieName = `category_body_${categoryNumber}`;
    let storedInCookie = document.cookie.includes(`${cookieName}=collapsed`);
    return storedInCookie;
  }

  function extendCategoryCookieExistenceLength(categoryNumber) {
    let cookieName = `category_body_${categoryNumber}`;
    console.log(`Extending ${cookieName} for an extra 30 days`);
    document.cookie = `${cookieName}=collapsed;max-age=${30 * 24 * 60 * 60}`;
  }

  function removeCategoryCookie(categoryNumber) {
    let cookieName = `category_body_${categoryNumber}`;
    console.log(`Removing ${cookieName} due to the category being closed.`);
    document.cookie = `${cookieName}=;max-age=0;`;
  }
}
