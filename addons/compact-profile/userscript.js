export default async function({ addon }) {
    await addon.tab.waitForElement('.box.slider-carousel-container', { markAsSeen: true });

    const arrangeSliders = () => {
        const sliders = Array.from(document.querySelectorAll('.box.slider-carousel-container'));

        for (let i = 0; i < sliders.length - 1; i += 2) {
            const left = sliders[i];
            const right = sliders[i + 1];

            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.justifyContent = 'space-between';
            wrapper.style.marginBottom = '20px';

            left.style.width = '48%';
            right.style.width = '48%';
            left.style.display = 'block';
            right.style.display = 'block';

            const container = left.parentNode;
            container.insertBefore(wrapper, left);
            wrapper.appendChild(left);
            wrapper.appendChild(right);

            [left, right].forEach(box => {
                const carousel = box.querySelector('.slider-carousel, .sliderCarousel');
                if (carousel) {
                    carousel.style.overflowX = 'auto';
                    carousel.style.scrollBehavior = 'smooth';
                }
            });
        }
    };

    arrangeSliders();

    const observer = new MutationObserver(() => {
        arrangeSliders();
    });

    observer.observe(document.querySelector('#profile') || document.body, { childList: true, subtree: true });
}
