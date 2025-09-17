export default async function ({ addon }) {
  function groupSliders() {
    const allSliders = Array.from(document.querySelectorAll(".box.slider-carousel-container"));
    const parentContainer = allSliders[0]?.parentNode;
    if (!allSliders.length || !parentContainer) return;

    const order = [];
    allSliders.forEach((slider) => {
      const carousel = slider.querySelector(".slider-carousel");
      if (!carousel) return;
      const items = carousel.querySelectorAll("li");
      if (!items.length) return;
      order.push(slider);
    });

    for (let i = 0; i < order.length - 1; i += 2) {
      const left = order[i];
      const right = order[i + 1];

      const flexWrapper = document.createElement("div");
      flexWrapper.style.display = "flex";
      flexWrapper.style.justifyContent = "space-between";
      flexWrapper.style.marginBottom = "20px";

      left.style.width = "48%";
      right.style.width = "48%";
      left.style.display = "block";
      right.style.display = "block";

      parentContainer.insertBefore(flexWrapper, left);
      flexWrapper.appendChild(left);
      flexWrapper.appendChild(right);

      [left, right].forEach((box) => {
        const carousel = box.querySelector(".slider-carousel");
        if (carousel) {
          carousel.style.overflowX = "auto";
          carousel.style.scrollBehavior = "smooth";
        }
      });
    }
  }

  groupSliders();
}
