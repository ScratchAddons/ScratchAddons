export default async function ({ addon, console }) {
  const oldSliderCarousel = $.fn.sliderCarousel;
  $.fn.sliderCarousel = function (...args) {
    if (args[0] === "initTinyScrollbar") {
      // Don't add a second scrollbar
      this.each(function () {
        this.querySelector(".scrollbar").remove();
      });
    }
    return oldSliderCarousel.apply(this, args);
  };
  const updateRows = () => $(".slider-carousel").sliderCarousel();
  addon.self.addEventListener("disabled", updateRows);
  addon.self.addEventListener("reenabled", updateRows);
}
