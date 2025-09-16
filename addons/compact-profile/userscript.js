export default async function ({ addon }) {
  function groupSliders() {
    const boxes = Array.from(document.querySelectorAll(".box.slider-carousel-container"));
    const order = ["shared", "favorites", "studios-following", "studios-curating", "following", "followers"];
    const orderedBoxes = [];
    order.forEach(id => {
      const box = boxes.find(el => el.querySelector(`#${id}`));
      if (box) orderedBoxes.push(box);
    });
    for (let i = 0; i < orderedBoxes.length - 1; i += 2) {
      const left = orderedBoxes[i];
      const right = orderedBoxes[i + 1];
      const parent = document.createElement("div");
      parent.className = "sa-slider-flex-wrapper";
      left.parentNode.insertBefore(parent, left);
      parent.appendChild(left);
      parent.appendChild(right);
    }
  }
  groupSliders();
}
