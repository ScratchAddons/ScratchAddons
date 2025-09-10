export default async function ({ addon, console }) {
  const sliders = Array.from(document.querySelectorAll(".box.slider-carousel-container"))
    .filter(el => !el.dataset.compacted);

  for (let i = 0; i < sliders.length; i += 2) {
    const left = sliders[i];
    const right = sliders[i + 1];
    if (!left) break;

    const wrapper = document.createElement("div");
    wrapper.className = "sa-compact-wrapper";

    left.dataset.compacted = "true";
    wrapper.appendChild(left);

    if (right) {
      right.dataset.compacted = "true";
      wrapper.appendChild(right);
    }

    const parent = left.parentNode;
    if (parent) {
      parent.insertBefore(wrapper, right ? right.nextSibling : left.nextSibling);
    }
  }
}
