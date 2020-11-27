export default async function ({ addon, global, console }) {
  if (!addon.tab.redux.state) return console.warn("Redux is not available!");

  let project;
  let onionLayer;
  let paintLayer;
  let paperCanvas;

  const foundPaper = (_project) => {
    project = _project;
    console.log('project', _project);

    const originalExportSVG = project.exportSVG;
    project.exportSVG = function (...args) {
      onionLayer.remove();
      const ret = originalExportSVG.call(this, ...args);
      this.addLayer(onionLayer);
      return ret;
    };

    // setTimeout(() => {
    // //   const layer = project.activeLayer.clone();
    // //   layer.removeChildren();
    // //   console.log('layer', layer);

    // //   const costume = addon.tab.redux.state.scratchGui.vm.editingTarget.sprite.costumes[0];

    // //   project.importSVG(cat, {
    // //     expandShapes: true,
    // //     onLoad: function(item) {
    // //       item.remove();
    // //       console.log('item', item);
    // //       layer.addChild(item);
    // //     }
    // //   });
    // }, 1000);
  };

  const foundPaperCanvas = (_paperCanvas) => {
    paperCanvas = _paperCanvas;
    console.log('paperCanvas', paperCanvas);

    paintLayer = project.activeLayer;

    onionLayer = project.activeLayer.clone();
    console.log('onionLayer', onionLayer);
    onionLayer.opacity = 0.2;
    onionLayer.data = {};
    onionLayer.locked = true;
    onionLayer.removeChildren();

    const originalInitializeSvg = paperCanvas.initializeSvg;
    paperCanvas.initializeSvg = function (...args) {
      onionLayer.activate();
      originalInitializeSvg.call(this, ...args);
      paintLayer.activate();
      paperCanvas.initializeSvg = originalInitializeSvg;
    };

    updateOnionLayer();    
  };

  const updateOnionLayer = () => {
    const vm = addon.tab.redux.state.scratchGui.vm;
    const costume = vm.editingTarget.sprite.costumes[0];
    const asset = vm.getCostume(0);

    paperCanvas.importSvg(asset, costume.rotationCenterX, costume.rotationCenterY);
  };

  // https://github.com/LLK/paper.js/blob/16d5ff0267e3a0ef647c25e58182a27300afad20/src/item/Project.js#L64-L65
  Object.defineProperty(Object.prototype, '_view', {
    set(value) {
      Object.defineProperty(this, '_view', {
        value: value,
        writable: true
      });
      foundPaper(this);
    }
  });

  Object.defineProperty(Object.prototype, 'queuedImport', {
    set(value) {
      Object.defineProperty(this, 'queuedImport', {
        value: value,
        writable: true
      });
      setTimeout(() => {
        foundPaperCanvas(this);
      }, 1000);
    }
  });
}
