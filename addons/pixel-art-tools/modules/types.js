/**
 * @typedef {object} PixelArtSize
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {object} PixelArtPalette
 * @property {string} id
 * @property {string} name
 * @property {string[]} colors
 */

/**
 * Shared mutable state passed between pixel-art-tools modules.
 * DOM references start as null and are filled in lazily as Scratch mounts the paint editor UI.
 * @typedef {object} PixelArtState
 * @property {boolean} enabled
 * @property {boolean} pixelModeDesired
 * @property {string[]} palette
 * @property {number} selectedPaletteIndex
 * @property {number} editingPaletteIndex
 * @property {PixelArtSize} pendingSize
 * @property {PixelArtSize} lastSafeSize
 * @property {boolean} restoreSafeSizePending
 * @property {HTMLElement | null} brushButtons
 * @property {HTMLElement | null} controlsGroup
 * @property {HTMLElement | null} sizeControls
 * @property {HTMLElement | null} palettePanel
 * @property {HTMLElement | null} paletteGrid
 * @property {HTMLSelectElement | null} paletteDropdown
 * @property {HTMLInputElement | null} widthInput
 * @property {HTMLInputElement | null} heightInput
 * @property {HTMLElement | null} pixelGridOriginal
 * @property {HTMLElement | null} pixelGridOverlay
 * @property {number} pixelCheckerboardSize
 * @property {HTMLElement | null} paletteNotice
 * @property {HTMLElement | null} paletteMessage
 * @property {HTMLButtonElement | null} toggleButton
 * @property {HTMLElement | null} animationPanel
 * @property {PixelArtPalette[]} [projectPalettes]
 * @property {string | null} [selectedPaletteId]
 * @property {Promise<HTMLElement> | null} [palettePanelReady]
 * @property {(() => void) | null} [teardownVmTargetsListener]
 * @property {boolean} [updateImageActive]
 */

export {};
