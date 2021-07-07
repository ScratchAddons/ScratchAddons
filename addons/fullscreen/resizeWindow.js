export default async function ({ addon, global, console }) {
  function setWidth(selector, offset) {
    let element = document.querySelector(selector);
    element.style.width = `calc((100vh + ${offset}) * 4/3)) !important`;
  }

  function setHeight(selector, offset) {
    let element = document.querySelector(selector);
    element.style.height = `calc(100vh + ${offset}) !important`;
  }

  function refreshStyle() {
    if (!addon.settings.get("hideToolbar")) {
      setWidth('[class*="stage-wrapper_stage-canvas-wrapper"]', -44);
      setWidth('[class*="stage_stage"]', -44);
      setWidth("canvas", -44);
      setWidth('[class*="stage-header_stage-menu-wrapper"]', -44);
      setHeight('[class*="stage-wrapper_stage-canvas-wrapper"]', -44);
      setHeight('[class*="stage_stage"]', -44);
      setHeight("canvas", -44);
    } else {
      setWidth('[class*="stage-wrapper_stage-canvas-wrapper"]', 0);
      setWidth('[class*="stage_stage"]', 0);
      setWidth("canvas", 0);
      setWidth('[class*="stage-header_stage-menu-wrapper"]', 0);
      setHeight('[class*="stage-wrapper_stage-canvas-wrapper"]', 0);
      setHeight('[class*="stage_stage"]', 0);
      setHeight("canvas", 0);
    }
  }

  refreshStyle();

  addon.settings.addEventListener("change", function () {
    refreshStyle();
  });
}
