// Variable Manager's code from Jeffalo and GarboMuffin helped so much with the tabs on this ext! Big thanks to them.
import MakerJs from "../../libraries/thirdparty/cs/maker.js";
import * as opentype from "../../libraries/thirdparty/cs/opentype.min.mjs";
import "../../libraries/thirdparty/cs/bezier.js";

var App = /** @class */ (function () {
    function App() {
        var _this = this;
        let renderTimeout;
        this.renderCurrent = function () {
            clearTimeout(renderTimeout);
            renderTimeout = setTimeout(function () {
            _this.errorDisplay.innerHTML = '';
            var size = parseFloat(_this.sizeInput.value) || 100;
            _this.render(
                _this.selectFamily.selectedIndex,
                _this.selectVariant.selectedIndex,
                _this.textInput.value,
                size,
                _this.unionCheckbox.checked,
                _this.filledCheckbox.checked,
                _this.kerningCheckbox.checked,
                _this.separateCheckbox.checked,
                parseFloat(_this.bezierAccuracy.value) || undefined,
                _this.selectUnits.value,
                _this.fillInput.value,
                _this.strokeInput.value,
                _this.strokeWidthInput.value,
                _this.strokeNonScalingCheckbox.checked,
                _this.fillRuleInput.value
            );
            }, 100);
        };
        this.loadVariants = function () {
            _this.selectVariant.options.length = 0;
            var f = _this.fontList.items[_this.selectFamily.selectedIndex];
            var v = f.variants.forEach(function (v) { return _this.addOption(_this.selectVariant, v); });
            _this.renderCurrent();
        }
        this.downloadSvg = function () {
            var SvgFile = window.btoa(_this.outputTextarea.value);
            _this.downloadButton.href = 'data:image/svg+xml;base64,' + SvgFile;
            _this.downloadButton.download = _this.textInput.value;
        };
        this.downloadDxf = function () {
            var dxfFile = window.btoa(_this.renderDiv.getAttribute('data-dxf'));
            _this.dxfButton.href = 'data:application/dxf;base64,' + dxfFile;
            _this.dxfButton.download = _this.textInput.value + '.dxf';
        };
        this.copyToClipboard = function () {
            _this.outputTextarea.select();
            document.execCommand('copy');
            _this.copyToClipboardBtn.innerText = 'copied';
            setTimeout(function () {
                _this.copyToClipboardBtn.innerText = 'copy to clipboard';
            }, 2000);
        };
        this.copyString = function (string) {
            _this.dummy.value = string;
            _this.dummy.type = 'text';
            _this.dummy.select();
            document.execCommand('copy');
            _this.dummy.type = 'hidden';
        };
        this.readUploadedFile = function (event) {
            const aw = function (thisArg, _arguments, P, generator) {
                return new (P || (P = Promise))(function (resolve, reject) {
                    function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
                    function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
                    function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
                    step((generator = generator.apply(thisArg, _arguments || [])).next());
                });
            }; return aw(_this, void 0, void 0, function () {
                var element, buffer;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            element = event.currentTarget;
                            if (!(element.files.length === 0)) return [3 /*break*/, 1];
                            this.customFont = undefined;
                            return [3 /*break*/, 3];
                        case 1: return [4 /*yield*/, element.files[0].arrayBuffer()];
                        case 2:
                            buffer = _a.sent();
                            this.customFont = opentype.parse(buffer);
                            _a.label = 3;
                        case 3:
                            this.renderCurrent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        this.removeUploadedFont = function () {
            _this.fileUpload.value = null;
            _this.customFont = undefined;
            _this.renderCurrent();
        };
    }
    App.prototype.init = function (elements) {
        var _this = this;
        this.errorDisplay = elements.errorDisplay;
        this.fileUpload = elements.fileUpload;
        this.fileUploadRemove = elements.fileUploadRemove;
        this.selectFamily = elements.selectFamily;
        this.selectVariant = elements.selectVariant;
        this.unionCheckbox = elements.unionCheckbox;
        this.filledCheckbox = elements.filledCheckbox;
        this.kerningCheckbox = elements.kerningCheckbox;
        this.separateCheckbox = elements.separateCheckbox;
        this.textInput = elements.textInput;
        this.bezierAccuracy = elements.bezierAccuracy;
        this.selectUnits = elements.selectUnits;
        this.sizeInput = elements.sizeInput;
        this.renderDiv = elements.renderDiv;
        this.outputTextarea = elements.outputTextarea;
        this.downloadButton = elements.downloadButton;
        this.dxfButton = elements.dxfButton;
        this.copyToClipboardBtn = elements.copyToClipboardBtn;
        this.dummy = elements.dummy;
        this.fillInput = elements.fillInput;
        this.strokeInput = elements.strokeInput;
        this.strokeWidthInput = elements.strokeWidthInput;
        this.strokeNonScalingCheckbox = elements.strokeNonScalingCheckbox;
        this.fillRuleInput = elements.fillRuleInput;

        Object.values({
            unitType: {
                "Centimeter": "cm",
                "Foot": "foot",
                "Inch": "inch",
                "Meter": "m",
                "Millimeter": "mm"
            }
        }.unitType).forEach(function (unit) {
            _this.addOption(_this.selectUnits, unit);
        });
    };
    App.prototype.handleEvents = function () {
        this.fileUpload.onchange = this.readUploadedFile;
        this.fileUploadRemove.onclick = this.removeUploadedFont;
        this.selectFamily.onchange = this.loadVariants;
        this.selectVariant.onchange =
            this.textInput.oninput =
            this.sizeInput.oninput =
            this.unionCheckbox.onchange =
            this.filledCheckbox.onchange =
            this.kerningCheckbox.onchange =
            this.separateCheckbox.onchange =
            this.bezierAccuracy.oninput =
            this.selectUnits.onchange =
            this.fillInput.oninput =
            this.strokeInput.oninput =
            this.strokeWidthInput.oninput =
            this.strokeNonScalingCheckbox.onchange =
            this.fillRuleInput.onchange =
            this.renderCurrent;
        this.copyToClipboardBtn.onclick = this.copyToClipboard;
        this.downloadButton.onclick = this.downloadSvg;
    };
    App.prototype.$ = function (selector) {
        return document.querySelector(selector);
    };
    App.prototype.addOption = function (select, optionText) {
        var option = document.createElement('option');
        option.text = optionText;
        option.value = optionText;
        select.options.add(option);
    };
    App.prototype.getGoogleFonts = (apiKey, app) => {
        const xhr = new XMLHttpRequest();
        xhr.open('get', 'https://www.googleapis.com/webfonts/v1/webfonts?key=' + apiKey, true);
        var _this = app;
        xhr.onloadend = () => {
            _this.fontList = JSON.parse(xhr.responseText);
            _this.fontList.items.forEach(font => _this.addOption(_this.selectFamily, font.family));
            _this.loadVariants();

            _this.handleEvents();

            _this.renderCurrent();
        };
        xhr.send();
    }
    App.prototype.render = function (fontIndex, variantIndex, text, size, union, filled, kerning, separate, bezierAccuracy, units, fill, stroke, strokeWidth, strokeNonScaling, fillRule) {
        var _this = this;
        var f = this.fontList.items[fontIndex];
        var v = f.variants[variantIndex];
        var url = f.files[v].replace('http:', 'https:');
        if (this.customFont) {
            this.callMakerJs(this.customFont, text, size, union, filled, kerning, separate, bezierAccuracy, units, fill, stroke, strokeWidth, strokeNonScaling, fillRule);
        }
        else {
            fetch(url)
                .then(res => res.arrayBuffer())
                .then(buffer => {
                    var font = opentype.parse(buffer);
                    _this.callMakerJs(font, text, size, union, filled, kerning, separate, bezierAccuracy, units, fill, stroke, strokeWidth, strokeNonScaling, fillRule);
                }).catch(err => {
                    console.error(err);
                    _this.errorDisplay.innerHTML = err.toString();
                });
        }
    };
    App.prototype.callMakerJs = function (font, text, size, union, filled, kerning, separate, bezierAccuracy, units, fill, stroke, strokeWidth, strokeNonScaling, fillRule) {
        var textModel = new MakerJs.models.Text(font, text, size, union, false, bezierAccuracy, { kerning: kerning });
        if (separate) {
            for (var i in textModel.models) {
                textModel.models[i].layer = i;
            }
        }
        var svg = MakerJs.exporter.toSVG(textModel, {
            fill: filled ? fill : undefined,
            stroke: stroke || undefined,
            strokeWidth: strokeWidth || undefined,
            fillRule: fillRule || undefined,
            scalingStroke: !strokeNonScaling,
        });
        var dxf = MakerJs.exporter.toDXF(textModel, { units: units, usePOLYLINE: true });
        this.renderDiv.innerHTML = svg;
        this.renderDiv.setAttribute('data-dxf', dxf);
        this.outputTextarea.value = svg;
    };
    return App;
}());

export default async function ({ addon, console, msg }) {
    const vm = addon.tab.traps.vm;

    let preventUpdate = false;
    function addTabContent(holder) {
        // coloris not needed
        // const scripts = [
        // { src: "https://cdn.jsdelivr.net/gh/mdbassit/Coloris@latest/dist/coloris.min.js", type: "text/javascript" }
        // ];

        // const link = document.createElement("link");
        // link.rel = "stylesheet";
        // link.href = "https://cdn.jsdelivr.net/gh/mdbassit/Coloris@latest/dist/coloris.min.css";
        // holder.appendChild(link);

        // scripts.forEach(({ src, type }) => {
        //     const script = document.createElement("script");
        //     script.src = src;
        //     script.type = type;
        //     holder.appendChild(script);
        // });
        const createElement = (tag, options = {}) => {
            const element = document.createElement(tag);
            Object.entries(options).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'innerHTML') {
                    element.innerHTML = value;
                } else {
                    element.setAttribute(key, value);
                }
            });
            return element;
        };

        holder.classList.add('sa-svg-maker-content');

        const errorDisplay = createElement('div', { id: 'sa-svg-maker-error-display' });
        holder.appendChild(errorDisplay);

        const createInputHolder = (labelText, inputElement, hidden = false) => {
            const inputHolder = createElement('div', { className: `sa-svg-maker-input-holder ${hidden ? "sa-svg-maker-hidden" : ''}` });
            const label = createElement('label', { innerHTML: labelText });
            label.appendChild(inputElement);
            inputHolder.appendChild(label);
            return inputHolder;
        };

        const title = createElement('h2', { innerHTML: 'Font to SVG' });
        holder.appendChild(title);

        const heading1 = createElement('h3', { innerHTML: 'Font Selection' });
        holder.appendChild(heading1);

        const fontSelect = createElement('select', { id: 'sa-svg-maker-font-select', className: 'sa-svg-maker-input' });
        holder.appendChild(createInputHolder('Google Font:', fontSelect));

        const fontUpload = createElement('input', { id: 'sa-svg-maker-font-upload', type: 'file', className: 'sa-svg-maker-input' });
        const fontUploadRemove = createElement('button', { id: 'sa-svg-maker-font-upload-remove', className: 'sa-svg-maker-input', innerHTML: 'Remove' });
        const uploadHolder = createElement('div', { className: 'sa-svg-maker-input-holder' });
        uploadHolder.appendChild(fontUpload);
        uploadHolder.appendChild(fontUploadRemove);
        holder.appendChild(uploadHolder);

        const heading2 = createElement('h3', { innerHTML: 'Text Options' });
        holder.appendChild(heading2);

        const fontVariant = createElement('select', { id: 'sa-svg-maker-font-variant', className: 'sa-svg-maker-input' });
        holder.appendChild(createInputHolder(`${msg('variant')}:`, fontVariant));
        const inputSize = createElement('input', { id: 'sa-svg-maker-input-size', type: 'number', value: '60', className: 'sa-svg-maker-input sa-svg-maker-input-size' });
        holder.appendChild(createInputHolder(`${msg('size')}:`, inputSize));

        const inputText = createElement('input', { id: 'sa-svg-maker-input-text', type: 'text', value: 'Scratch', className: 'sa-svg-maker-input sa-svg-maker-input-text' });
        holder.appendChild(createInputHolder(`${msg('text')}:`, inputText));

        const heading3 = createElement('h3', { innerHTML: 'SVG Options' });
        holder.appendChild(heading3);

        const inputFilled = createElement('input', { id: 'sa-svg-maker-input-filled', type: 'checkbox', checked: true, className: 'sa-svg-maker-input' });
        holder.appendChild(createInputHolder(`${msg('fill')}:`, inputFilled));

        const inputSeparate = createElement('input', { id: 'sa-svg-maker-input-separate', type: 'checkbox', checked: true, className: 'sa-svg-maker-input' });
        holder.appendChild(createInputHolder(`${msg('seperatecharacters')}:`, inputSeparate));

        const inputBezierAccuracy = createElement('input', { hidden: true, id: 'sa-svg-maker-input-bezier-accuracy', type: 'text', placeholder: 'auto', className: 'sa-svg-maker-input' });
        holder.appendChild(createInputHolder(`${msg('bezieraccuracy')}:`, inputBezierAccuracy, true));
        const inputUnion = createElement('input', { hidden: true, id: 'sa-svg-maker-input-union', type: 'checkbox', className: 'sa-svg-maker-input' });
        holder.appendChild(createInputHolder('Union:', inputUnion, true));
        const inputKerning = createElement('input', { hidden: true, id: 'sa-svg-maker-input-kerning', type: 'checkbox', checked: true, className: 'sa-svg-maker-input' });
        holder.appendChild(createInputHolder('Kerning:', inputKerning, true));
        const dxfUnits = createElement('select', { hidden: true, id: 'sa-svg-maker-dxf-units', className: 'sa-svg-maker-input' });
        holder.appendChild(createInputHolder('Dxf Units:', dxfUnits, true));
        const inputStrokeNonScaling = createElement('input', { id: 'sa-svg-maker-input-stroke-non-scaling', type: 'checkbox', checked: true, className: 'sa-svg-maker-input sa-svg-maker-input-stroke-non-scaling' });
        holder.appendChild(createInputHolder(`${msg('nonscalingoutline')}:`, inputStrokeNonScaling));
        const fillRule = createElement('select', { id: 'sa-svg-maker-input-fill-rule', className: 'sa-svg-maker-input' });
        fillRule.appendChild(createElement('option', { value: 'evenodd', innerHTML: 'evenodd' }));
        fillRule.appendChild(createElement('option', { value: 'nonzero', innerHTML: 'nonzero' }));
        holder.appendChild(createInputHolder('Fill Rule:', fillRule, true));

        const heading4 = createElement('h3', { innerHTML: 'Render Options' });
        holder.appendChild(heading4);

        const inputFill = createElement('input', { id: 'sa-svg-maker-input-fill', type: 'color', value: '#fff', className: 'sa-svg-maker-input sa-svg-maker-input-fill' });
        holder.appendChild(createInputHolder(`${msg('fill')}:`, inputFill));

        const inputStroke = createElement('input', { id: 'sa-svg-maker-input-stroke', type: 'color', value: '#fff', className: 'sa-svg-maker-input sa-svg-maker-input-stroke' });
        holder.appendChild(createInputHolder(`${msg('outline')}:`, inputStroke));

        const inputStrokeWidth = createElement('input', { id: 'sa-svg-maker-input-stroke-width', type: 'text', value: '0mm', className: 'sa-svg-maker-input sa-svg-maker-input-stroke-width' });
        holder.appendChild(createInputHolder(`${msg('outlinewidth')}:`, inputStrokeWidth));

        const svgRender = createElement('div', { id: 'sa-svg-maker-svg-render' });
        holder.appendChild(svgRender);

        const outputTextarea = createElement('textarea', { id: 'sa-svg-maker-output-svg', className: 'sa-svg-maker-hidden', readonly: '' });

        const copyToClipboardBtn = createElement('button', { id: 'sa-svg-maker-copy-to-clipboard-btn', className: 'sa-svg-maker-btn sa-svg-maker sa-svg-maker-hidden', innerHTML: 'Copy to Clipboard' });
        const downloadBtn = createElement('a', { id: 'sa-svg-maker-download-btn', className: 'sa-svg-maker-btn', innerHTML: `${msg('save')}` });
        const createLinkBtn = createElement('a', { id: 'sa-svg-maker-create-link', className: 'sa-svg-maker-btn sa-svg-maker-hidden', innerHTML: 'Create Link' });
        const dxfBtn = createElement('a', { id: 'sa-svg-maker-dxf-btn', className: 'sa-svg-maker-btn sa-svg-maker-hidden', innerHTML: 'Download Dxf' });

        const buttonsContainer = createElement('div', { className: 'sa-svg-maker-buttons-container' });
        buttonsContainer.append(copyToClipboardBtn, downloadBtn, createLinkBtn, dxfBtn);

        const textareaContainer = createElement('div', { className: 'sa-svg-maker-textarea-container' });
        textareaContainer.append(outputTextarea, buttonsContainer);
        holder.appendChild(textareaContainer);

        const dummy = createElement('input', { id: 'sa-svg-maker-dummy', type: 'hidden', name: 'dummy' });
        holder.appendChild(dummy);
        var app = new App();
        app.init({
            errorDisplay,
            fileUpload: fontUpload,
            fileUploadRemove: fontUploadRemove,
            selectFamily: fontSelect,
            selectVariant: fontVariant,
            unionCheckbox: inputUnion,
            filledCheckbox: inputFilled,
            kerningCheckbox: inputKerning,
            separateCheckbox: inputSeparate,
            textInput: inputText,
            bezierAccuracy: inputBezierAccuracy,
            selectUnits: dxfUnits,
            sizeInput: inputSize,
            renderDiv: svgRender,
            outputTextarea,
            downloadButton: downloadBtn,
            dxfButton: dxfBtn,
            copyToClipboardBtn,
            dummy,
            fillInput: inputFill,
            strokeInput: inputStroke,
            strokeWidthInput: inputStrokeWidth,
            strokeNonScalingCheckbox: inputStrokeNonScaling,
            fillRuleInput: fillRule
        });
        app.getGoogleFonts('AIzaSyAOES8EmKhuJEnsn9kS1XKBpxxp-TgN8Jc', app); // comes from the orginal font2svg website, been in use for years
        app.handleEvents();
    }

    const svgmaker = document.createElement("div");
    svgmaker.classList.add(addon.tab.scratchClass("asset-panel_wrapper"), "sa-svg-maker");
    addTabContent(svgmaker);

    const svgTab = document.createElement("li");
    addon.tab.displayNoneWhileDisabled(svgTab);
    svgTab.classList.add(
        addon.tab.scratchClass("react-tabs_react-tabs__tab"),
        addon.tab.scratchClass("gui_tab")
    );
    svgTab.id = "react-tabs-sa-svg-maker";

    const svgTabIcon = document.createElement("img");
    svgTabIcon.draggable = false;
    svgTabIcon.src = addon.self.dir + "/tab-icon.svg";

    const svgTabText = document.createElement("span");
    svgTabText.innerText = msg("fonts");

    svgTab.appendChild(svgTabIcon);
    svgTab.appendChild(svgTabText);
    svgTab.addEventListener("click", (e) => {
        addon.tab.redux.dispatch({ type: "scratch-gui/navigation/ACTIVATE_TAB", activeTabIndex: 4 });
    });

    function setVisible(visible) {
        if (visible) {
            svgTab.classList.add(
                addon.tab.scratchClass("react-tabs_react-tabs__tab--selected"),
                addon.tab.scratchClass("gui_is-selected")
            );
            const contentArea = document.querySelector("[class^=gui_tabs]");
            contentArea.insertAdjacentElement("beforeend", svgmaker);
        } else {
            svgTab.classList.remove(
                addon.tab.scratchClass("react-tabs_react-tabs__tab--selected"),
                addon.tab.scratchClass("gui_is-selected")
            );
            svgmaker.remove();
        }
    }

    addon.tab.redux.initialize();
    addon.tab.redux.addEventListener("statechanged", ({ detail }) => {
        if (detail.action.type === "scratch-gui/navigation/ACTIVATE_TAB") {
            const svgMakerWasSelected = document.body.contains(svgmaker);
            const switchedToSvgMaker = detail.action.activeTabIndex === 4;

            if (svgMakerWasSelected && !switchedToSvgMaker) {
                queueMicrotask(() => window.dispatchEvent(new Event("resize")));
            }

            setVisible(switchedToSvgMaker);
        } else if (detail.action.type === "scratch-gui/mode/SET_PLAYER") {
            if (!detail.action.isPlayerOnly && addon.tab.redux.state.scratchGui.editorTab.activeTabIndex === 4) {
                // DOM doesn't actually exist yet
                queueMicrotask(() => setVisible(true));
            }
        }
    });

    addon.self.addEventListener("disabled", () => {
        if (addon.tab.redux.state.scratchGui.editorTab.activeTabIndex === 4) {
            addon.tab.redux.dispatch({ type: "scratch-gui/navigation/ACTIVATE_TAB", activeTabIndex: 2 });
        }
    });

    while (true) {
        await addon.tab.waitForElement("[class^='react-tabs_react-tabs__tab-list']", {
            markAsSeen: true,
            reduxEvents: ["scratch-gui/mode/SET_PLAYER", "fontsLoaded/SET_FONTS_LOADED", "scratch-gui/locales/SELECT_LOCALE"],
            reduxCondition: (state) => !state.scratchGui.mode.isPlayerOnly,
        });
        addon.tab.appendToSharedSpace({ space: "afterSoundTab", element: svgTab, order: 4 });
    }
}
