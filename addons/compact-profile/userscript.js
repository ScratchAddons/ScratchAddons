export default async function ({ addon }) {
  const allSliders = Array.from(document.querySelectorAll('.box.slider-carousel-container'));
  const parentContainer = allSliders[0]?.parentNode;
  if (!allSliders.length || !parentContainer) return;

  const ordered = [];
  allSliders.forEach(slider => {
    const carousel = slider.querySelector('.slider-carousel');
    if (!carousel) return;
    ordered.push(slider);
  });

  for (let i = 0; i < ordered.length - 1; i += 2) {
    const left = ordered[i];
    const right = ordered[i + 1];

    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'space-between';
    wrapper.style.marginBottom = '20px';

    left.style.width = '48%';
    right.style.width = '48%';
    left.style.display = 'block';
    right.style.display = 'block';

    parentContainer.insertBefore(wrapper, left);
    wrapper.appendChild(left);
    wrapper.appendChild(right);

    [left, right].forEach(box => {
      const carousel = box.querySelector('.slider-carousel');
      if (carousel) {
        carousel.style.overflowX = 'auto';
        carousel.style.scrollBehavior = 'smooth';
      }
    });
  }
};
