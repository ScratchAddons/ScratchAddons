export default async function ({ console }) {
    const categories = document.querySelectorAll('[id^="category_body_"]');
    for (let i = 0; i < categories.length; i++) {
      let categoryBody = categories[i];

      let categoryNumber = categoryBody.id.split("_").pop();
      if (!shouldCollapseCategory(categoryNumber))
        break;
      
      let categoryContent = categoryBody.querySelector(".box-content");
      categoryContent.style.display = "none";

      let categoryHead = categoryBody.querySelector(`.box-head`);
      categoryHead.classList.add("collapsed");
      
      let categoryName = categoryHead.innerText.split("\n")[1]; // This is exclusively for debug purposes
      console.log(`Category ${categoryName}(#${categoryNumber}) should be hidden`);
    }

    function shouldCollapseCategory(catNumber) {
      let cookieName = `category_body_${catNumber}`;
      return document.cookie.includes(`${cookieName}=collapsed;`);
    }
  }
  