const ObservedProperties = (SuperClass) => class extends SuperClass {

  constructor() {
    super();
    this.constructor.__saveInitialPropertyValues.call(this);
    this.constructor.__initProperties.call(this);
  }

  connectedCallback() {
    super.connectedCallback && super.connectedCallback();
    this.constructor.__setInitialPropertyValues.call(this);
  }

  static __saveInitialPropertyValues() {
    this.__initialPropertyValues = new Map();
    (this.constructor.observedProperties || []).map(propName => this.__initialPropertyValues.set(propName, this[propName]));
  }

  static __setInitialPropertyValues() {
    this.__initialPropertyValues.forEach((val, propName) => {
      if(val !== undefined) this[propName] = val;
    });
  }

  static __initProperties() {
    this.constructor.__propertyAccessors = {};
    const observedProps = this.constructor.observedProperties || [];
    observedProps.map(propName => this.constructor.__initProperty.call(this, propName));
  }

  static __initProperty(propName) {
    this.constructor.__propertyAccessors[propName] = this.__getPropertyDescriptor(this, propName);
    Object.defineProperty(this, propName, {
      set(val) { this.constructor.__setProperty.call(this, propName, val); },
      get() { return this.constructor.__getProperty.call(this, propName); },
    });
  }

  static __getProperty(propName) {
    const customAccessors = this.constructor.__propertyAccessors[propName] || {};
    if(customAccessors.get) return customAccessors.get.call(this, propName);
    return this[`#${propName}`];
  }

  static __setProperty(propName, newValue) {
    const customAccessors = this.constructor.__propertyAccessors[propName] || {};
    const oldValue = this[propName];
    if(customAccessors.set) customAccessors.set.call(this, newValue);
    else this[`#${propName}`] = newValue;
    this.constructor.__propertyValueChanged.call(this, propName, oldValue, this[propName]);
  }
  
  static __propertyValueChanged(propName, oldValue, newValue) {
    if(oldValue === newValue) return;
    try { if(JSON.stringify(oldValue) === JSON.stringify(newValue)) return; } catch(e) {}    this.propertyChangedCallback && this.propertyChangedCallback(propName, oldValue, newValue);
  }

  __getPropertyDescriptor(obj, key) {
    if(!obj) return;
    return Object.getOwnPropertyDescriptor(obj, key) || this.__getPropertyDescriptor(Object.getPrototypeOf(obj), key)
  }

};

const DOMProperties = (SuperClass) => class extends SuperClass {

  static get observedAttributes() {
    const observedAttributes = [];
    const DOMProps = this.DOMProperties || [];
    for(let i in DOMProps) observedAttributes.push((this.propertyAttributeNames || {})[DOMProps[i]] || DOMProps[i].toLowerCase());
    return observedAttributes;
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    if(oldValue === newValue) return;
    const propName = this.constructor.__getPropertyNameByAttributeName.call(this, attrName);
    if(!propName) return;
    this.constructor.__setDOMProperty.call(this, propName, this[propName], newValue);
  }

  static __getPropertyNameByAttributeName(attrName) {
    const attributeNames = this.constructor.propertyAttributeNames;
    for(let propName in attributeNames) if(attributeNames[propName] === attrName) return propName;
    const DOMPropertyNames = this.constructor.DOMProperties || [];
    for(let i in DOMPropertyNames) if(DOMPropertyNames[i].toLowerCase() === attrName) return DOMPropertyNames[i];
  }

  static __setDOMProperty(propName, oldValue, newValue) {
    const converters = this.constructor.propertyFromAttributeConverters || {};
    const converter = converters[propName];
    if(converter) newValue = converter.call(this, oldValue, newValue);
    this[propName] = newValue;
  }

};

const ReflectedProperties = (SuperClass) => class extends SuperClass {

  connectedCallback() {
    super.connectedCallback();
    for(var i in this.constructor.reflectedProperties) {
      const propName = this.constructor.reflectedProperties[i];
      const attrName = this.constructor.__getAttributeNameByPropertyName.call(this, propName);
      this.constructor.__setDOMAttribute.call(this, attrName, propName, this[propName]);
    }
  }

  propertyChangedCallback(propName, oldValue, newValue) {
    super.propertyChangedCallback && super.propertyChangedCallback(propName, oldValue, newValue);
    if(!this.isConnected) return;

    const reflectedProps = this.constructor.reflectedProperties || {};
    const attrReflects = reflectedProps.indexOf(propName) !== -1;
    if(!attrReflects) return;
    
    const attrName = this.constructor.__getAttributeNameByPropertyName.call(this, propName);
    this.constructor.__setDOMAttribute.call(this, attrName, propName, newValue);
  }

  static __setDOMAttribute(attrName, propName, value) {
    const converters = this.constructor.propertyToAttributeConverters || {};
    const converter = converters[propName];
    if(converter) value = converter.call(this, value);
    if(value === null || value === undefined) return this.removeAttribute(attrName);
    this.setAttribute(attrName, value);
  }

  static __getAttributeNameByPropertyName(propName) {
    const reflectedProps = this.constructor.reflectedProperties || [];
    const attrNames = this.constructor.propertyAttributeNames || {};
    if(reflectedProps.indexOf(propName) === -1) return;
    const attrName = attrNames[propName] || propName.toLowerCase();
    return attrName;
  }

};

const Properties = (SuperClass) => class extends ReflectedProperties(DOMProperties(ObservedProperties(SuperClass))) {

  static get properties() { return {}; }

  static get observedProperties() {
    return Object.keys(this.__getFilteredProperties.call(this, 'observe', true));
  }

  static get DOMProperties() {
    return Object.keys(this.__getFilteredProperties.call(this, 'DOM', true));
  }

  static get reflectedProperties() {
    return Object.keys(this.__getFilteredProperties.call(this, 'reflect', true));
  }

  static get propertyChangedHandlers() {
    return this.__getPropertyValues.call(this, 'changedHandler');
  }

  static get propertyAttributeNames() {
    const propValues = {};
    const props = this.properties;
    for(let propName in props) propValues[propName] = props[propName]['attributeName'] || propName.toLowerCase();
    return propValues;
  }

  static get propertyToAttributeConverters() {
    return this.__getPropertyValues.call(this, 'toAttributeConverter');
  }

  static get propertyFromAttributeConverters() {
    return this.__getPropertyValues.call(this, 'fromAttributeConverter');
  }

  static __getFilteredProperties(key, value) {
    const filteredProps = {};
    const props = this.properties;
    for(let propName in props) if(props[propName][key] === value) filteredProps[propName] = props[propName];
    return filteredProps;
  }

  static __getPropertyValues(key) {
    const propValues = {};
    const props = this.properties;
    for(let propName in props) propValues[propName] = props[propName][key];
    return propValues;
  }

};

const PropertyChangedHandler = (SuperClass) => class extends SuperClass {
  
  propertyChangedCallback(propName, oldValue, newValue) {
    super.propertyChangedCallback && super.propertyChangedCallback(propName, oldValue, newValue);
    this.constructor.__callPropertyHandlers.call(this, propName, oldValue, newValue);
  }

  static __callPropertyHandlers(propName, oldValue, newValue) {
    const handlers = this.constructor.propertyChangedHandlers || {};
    const handler = handlers[propName];
    if(!handler || !handler.constructor) return;
    if(handler.constructor.name === 'Function') handler.call(this, oldValue, newValue);
    else if(handler.constructor.name === 'String' && this[handler]) return this[handler].call(this, oldValue, newValue);
  }
   
};

const PropertiesChangedHandler = (SuperClass) => class extends SuperClass {
  
  propertiesChangedCallback(propNames, oldValues, newValues) {
    super.propertiesChangedCallback && super.propertiesChangedCallback(propNames, oldValues, newValues);
    this.constructor.__callMultiPropertyHandlers.call(this, propNames);
  }

  static __callMultiPropertyHandlers(propNames) {
    const callMethods = new Map();
    const handlers = this.constructor.propertiesChangedHandlers || {};
    for(let i in propNames) {
      for(let methodName in handlers) {
        const handlerPropNames = handlers[methodName];
        if(handlerPropNames.indexOf(propNames[i]) !== -1) callMethods.set(methodName, handlerPropNames);
      }
    }
    callMethods.forEach((props, methodName) => this[methodName].call(this, ...[...props.map(propName => this[propName])]));
  }

  static get propertiesChangedHandlers() { return {}; }

};

const PropertiesChangedCallback = (SuperClass) => class extends SuperClass {
  
  propertyChangedCallback(propName, oldValue, newValue) {
    super.propertyChangedCallback && super.propertyChangedCallback(propName, oldValue, newValue);
    if(!this.__changedProperties) this.__changedProperties = new Map();
    this.constructor.__addChangedProperty.call(this, propName, oldValue);
  }

  static __addChangedProperty(propName, oldValue) {
    if(!this.__changedProperties.has(propName)) this.__changedProperties.set(propName, oldValue);
    window.requestAnimationFrame(this.constructor.__invokeCallback.bind(this));
  }

  static __invokeCallback() {
    if(this.__changedProperties.size === 0) return;
    const oldValues = {};
    const newValues = {};
    this.__changedProperties.forEach((oldValue, propName) => oldValues[propName] = oldValue);
    this.__changedProperties.forEach((oldValue, propName) => newValues[propName] = this[propName]);
    const propNames = Object.keys(oldValues);

    this.__changedProperties.clear();
    this.propertiesChangedCallback && this.propertiesChangedCallback(propNames, oldValues, newValues);
  }

};

function bound01(n, max) {
    if (isOnePointZero(n)) {
        n = '100%';
    }
    var processPercent = isPercentage(n);
    n = max === 360 ? n : Math.min(max, Math.max(0, parseFloat(n)));
    if (processPercent) {
        n = parseInt(String(n * max), 10) / 100;
    }
    if (Math.abs(n - max) < 0.000001) {
        return 1;
    }
    if (max === 360) {
        n = (n < 0 ? (n % max) + max : n % max) / parseFloat(String(max));
    }
    else {
        n = (n % max) / parseFloat(String(max));
    }
    return n;
}
function clamp01(val) {
    return Math.min(1, Math.max(0, val));
}
function isOnePointZero(n) {
    return typeof n === 'string' && n.includes('.') && parseFloat(n) === 1;
}
function isPercentage(n) {
    return typeof n === 'string' && n.includes('%');
}
function boundAlpha(a) {
    a = parseFloat(a);
    if (isNaN(a) || a < 0 || a > 1) {
        a = 1;
    }
    return a;
}
function convertToPercentage(n) {
    if (n <= 1) {
        return Number(n) * 100 + "%";
    }
    return n;
}
function pad2(c) {
    return c.length === 1 ? '0' + c : String(c);
}

function rgbToRgb(r, g, b) {
    return {
        r: bound01(r, 255) * 255,
        g: bound01(g, 255) * 255,
        b: bound01(b, 255) * 255,
    };
}
function rgbToHsl(r, g, b) {
    r = bound01(r, 255);
    g = bound01(g, 255);
    b = bound01(b, 255);
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h = 0;
    var s = 0;
    var l = (max + min) / 2;
    if (max === min) {
        s = 0;
        h = 0;
    }
    else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = ((g - b) / d) + (g < b ? 6 : 0);
                break;
            case g:
                h = ((b - r) / d) + 2;
                break;
            case b:
                h = ((r - g) / d) + 4;
                break;
        }
        h /= 6;
    }
    return { h: h, s: s, l: l };
}
function hue2rgb(p, q, t) {
    if (t < 0) {
        t += 1;
    }
    if (t > 1) {
        t -= 1;
    }
    if (t < 1 / 6) {
        return p + ((q - p) * (6 * t));
    }
    if (t < 1 / 2) {
        return q;
    }
    if (t < 2 / 3) {
        return p + ((q - p) * ((2 / 3) - t) * 6);
    }
    return p;
}
function hslToRgb(h, s, l) {
    var r;
    var g;
    var b;
    h = bound01(h, 360);
    s = bound01(s, 100);
    l = bound01(l, 100);
    if (s === 0) {
        g = l;
        b = l;
        r = l;
    }
    else {
        var q = l < 0.5 ? (l * (1 + s)) : (l + s - (l * s));
        var p = (2 * l) - q;
        r = hue2rgb(p, q, h + (1 / 3));
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - (1 / 3));
    }
    return { r: r * 255, g: g * 255, b: b * 255 };
}
function rgbToHsv(r, g, b) {
    r = bound01(r, 255);
    g = bound01(g, 255);
    b = bound01(b, 255);
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h = 0;
    var v = max;
    var d = max - min;
    var s = max === 0 ? 0 : d / max;
    if (max === min) {
        h = 0;
    }
    else {
        switch (max) {
            case r:
                h = ((g - b) / d) + (g < b ? 6 : 0);
                break;
            case g:
                h = ((b - r) / d) + 2;
                break;
            case b:
                h = ((r - g) / d) + 4;
                break;
        }
        h /= 6;
    }
    return { h: h, s: s, v: v };
}
function hsvToRgb(h, s, v) {
    h = bound01(h, 360) * 6;
    s = bound01(s, 100);
    v = bound01(v, 100);
    var i = Math.floor(h);
    var f = h - i;
    var p = v * (1 - s);
    var q = v * (1 - (f * s));
    var t = v * (1 - ((1 - f) * s));
    var mod = i % 6;
    var r = [v, q, p, p, t, v][mod];
    var g = [t, v, v, q, p, p][mod];
    var b = [p, p, t, v, v, q][mod];
    return { r: r * 255, g: g * 255, b: b * 255 };
}
function rgbToHex(r, g, b, allow3Char) {
    var hex = [
        pad2(Math.round(r).toString(16)),
        pad2(Math.round(g).toString(16)),
        pad2(Math.round(b).toString(16)),
    ];
    if (allow3Char &&
        hex[0].startsWith(hex[0].charAt(1)) &&
        hex[1].startsWith(hex[1].charAt(1)) &&
        hex[2].startsWith(hex[2].charAt(1))) {
        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
    }
    return hex.join('');
}
function rgbaToHex(r, g, b, a, allow4Char) {
    var hex = [
        pad2(Math.round(r).toString(16)),
        pad2(Math.round(g).toString(16)),
        pad2(Math.round(b).toString(16)),
        pad2(convertDecimalToHex(a)),
    ];
    if (allow4Char &&
        hex[0].startsWith(hex[0].charAt(1)) &&
        hex[1].startsWith(hex[1].charAt(1)) &&
        hex[2].startsWith(hex[2].charAt(1)) &&
        hex[3].startsWith(hex[3].charAt(1))) {
        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0) + hex[3].charAt(0);
    }
    return hex.join('');
}
function convertDecimalToHex(d) {
    return Math.round(parseFloat(d) * 255).toString(16);
}
function convertHexToDecimal(h) {
    return parseIntFromHex(h) / 255;
}
function parseIntFromHex(val) {
    return parseInt(val, 16);
}

var names = {
    aliceblue: '#f0f8ff',
    antiquewhite: '#faebd7',
    aqua: '#00ffff',
    aquamarine: '#7fffd4',
    azure: '#f0ffff',
    beige: '#f5f5dc',
    bisque: '#ffe4c4',
    black: '#000000',
    blanchedalmond: '#ffebcd',
    blue: '#0000ff',
    blueviolet: '#8a2be2',
    brown: '#a52a2a',
    burlywood: '#deb887',
    cadetblue: '#5f9ea0',
    chartreuse: '#7fff00',
    chocolate: '#d2691e',
    coral: '#ff7f50',
    cornflowerblue: '#6495ed',
    cornsilk: '#fff8dc',
    crimson: '#dc143c',
    cyan: '#00ffff',
    darkblue: '#00008b',
    darkcyan: '#008b8b',
    darkgoldenrod: '#b8860b',
    darkgray: '#a9a9a9',
    darkgreen: '#006400',
    darkgrey: '#a9a9a9',
    darkkhaki: '#bdb76b',
    darkmagenta: '#8b008b',
    darkolivegreen: '#556b2f',
    darkorange: '#ff8c00',
    darkorchid: '#9932cc',
    darkred: '#8b0000',
    darksalmon: '#e9967a',
    darkseagreen: '#8fbc8f',
    darkslateblue: '#483d8b',
    darkslategray: '#2f4f4f',
    darkslategrey: '#2f4f4f',
    darkturquoise: '#00ced1',
    darkviolet: '#9400d3',
    deeppink: '#ff1493',
    deepskyblue: '#00bfff',
    dimgray: '#696969',
    dimgrey: '#696969',
    dodgerblue: '#1e90ff',
    firebrick: '#b22222',
    floralwhite: '#fffaf0',
    forestgreen: '#228b22',
    fuchsia: '#ff00ff',
    gainsboro: '#dcdcdc',
    ghostwhite: '#f8f8ff',
    gold: '#ffd700',
    goldenrod: '#daa520',
    gray: '#808080',
    green: '#008000',
    greenyellow: '#adff2f',
    grey: '#808080',
    honeydew: '#f0fff0',
    hotpink: '#ff69b4',
    indianred: '#cd5c5c',
    indigo: '#4b0082',
    ivory: '#fffff0',
    khaki: '#f0e68c',
    lavender: '#e6e6fa',
    lavenderblush: '#fff0f5',
    lawngreen: '#7cfc00',
    lemonchiffon: '#fffacd',
    lightblue: '#add8e6',
    lightcoral: '#f08080',
    lightcyan: '#e0ffff',
    lightgoldenrodyellow: '#fafad2',
    lightgray: '#d3d3d3',
    lightgreen: '#90ee90',
    lightgrey: '#d3d3d3',
    lightpink: '#ffb6c1',
    lightsalmon: '#ffa07a',
    lightseagreen: '#20b2aa',
    lightskyblue: '#87cefa',
    lightslategray: '#778899',
    lightslategrey: '#778899',
    lightsteelblue: '#b0c4de',
    lightyellow: '#ffffe0',
    lime: '#00ff00',
    limegreen: '#32cd32',
    linen: '#faf0e6',
    magenta: '#ff00ff',
    maroon: '#800000',
    mediumaquamarine: '#66cdaa',
    mediumblue: '#0000cd',
    mediumorchid: '#ba55d3',
    mediumpurple: '#9370db',
    mediumseagreen: '#3cb371',
    mediumslateblue: '#7b68ee',
    mediumspringgreen: '#00fa9a',
    mediumturquoise: '#48d1cc',
    mediumvioletred: '#c71585',
    midnightblue: '#191970',
    mintcream: '#f5fffa',
    mistyrose: '#ffe4e1',
    moccasin: '#ffe4b5',
    navajowhite: '#ffdead',
    navy: '#000080',
    oldlace: '#fdf5e6',
    olive: '#808000',
    olivedrab: '#6b8e23',
    orange: '#ffa500',
    orangered: '#ff4500',
    orchid: '#da70d6',
    palegoldenrod: '#eee8aa',
    palegreen: '#98fb98',
    paleturquoise: '#afeeee',
    palevioletred: '#db7093',
    papayawhip: '#ffefd5',
    peachpuff: '#ffdab9',
    peru: '#cd853f',
    pink: '#ffc0cb',
    plum: '#dda0dd',
    powderblue: '#b0e0e6',
    purple: '#800080',
    rebeccapurple: '#663399',
    red: '#ff0000',
    rosybrown: '#bc8f8f',
    royalblue: '#4169e1',
    saddlebrown: '#8b4513',
    salmon: '#fa8072',
    sandybrown: '#f4a460',
    seagreen: '#2e8b57',
    seashell: '#fff5ee',
    sienna: '#a0522d',
    silver: '#c0c0c0',
    skyblue: '#87ceeb',
    slateblue: '#6a5acd',
    slategray: '#708090',
    slategrey: '#708090',
    snow: '#fffafa',
    springgreen: '#00ff7f',
    steelblue: '#4682b4',
    tan: '#d2b48c',
    teal: '#008080',
    thistle: '#d8bfd8',
    tomato: '#ff6347',
    turquoise: '#40e0d0',
    violet: '#ee82ee',
    wheat: '#f5deb3',
    white: '#ffffff',
    whitesmoke: '#f5f5f5',
    yellow: '#ffff00',
    yellowgreen: '#9acd32',
};

function inputToRGB(color) {
    var rgb = { r: 0, g: 0, b: 0 };
    var a = 1;
    var s = null;
    var v = null;
    var l = null;
    var ok = false;
    var format = false;
    if (typeof color === 'string') {
        color = stringInputToObject(color);
    }
    if (typeof color === 'object') {
        if (isValidCSSUnit(color.r) && isValidCSSUnit(color.g) && isValidCSSUnit(color.b)) {
            rgb = rgbToRgb(color.r, color.g, color.b);
            ok = true;
            format = String(color.r).substr(-1) === '%' ? 'prgb' : 'rgb';
        }
        else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.v)) {
            s = convertToPercentage(color.s);
            v = convertToPercentage(color.v);
            rgb = hsvToRgb(color.h, s, v);
            ok = true;
            format = 'hsv';
        }
        else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.l)) {
            s = convertToPercentage(color.s);
            l = convertToPercentage(color.l);
            rgb = hslToRgb(color.h, s, l);
            ok = true;
            format = 'hsl';
        }
        if (Object.prototype.hasOwnProperty.call(color, 'a')) {
            a = color.a;
        }
    }
    a = boundAlpha(a);
    return {
        ok: ok,
        format: color.format || format,
        r: Math.min(255, Math.max(rgb.r, 0)),
        g: Math.min(255, Math.max(rgb.g, 0)),
        b: Math.min(255, Math.max(rgb.b, 0)),
        a: a,
    };
}
var CSS_INTEGER = '[-\\+]?\\d+%?';
var CSS_NUMBER = '[-\\+]?\\d*\\.\\d+%?';
var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";
var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
var matchers = {
    CSS_UNIT: new RegExp(CSS_UNIT),
    rgb: new RegExp('rgb' + PERMISSIVE_MATCH3),
    rgba: new RegExp('rgba' + PERMISSIVE_MATCH4),
    hsl: new RegExp('hsl' + PERMISSIVE_MATCH3),
    hsla: new RegExp('hsla' + PERMISSIVE_MATCH4),
    hsv: new RegExp('hsv' + PERMISSIVE_MATCH3),
    hsva: new RegExp('hsva' + PERMISSIVE_MATCH4),
    hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
    hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
    hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
    hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
};
function stringInputToObject(color) {
    color = color.trim().toLowerCase();
    if (color.length === 0) {
        return false;
    }
    var named = false;
    if (names[color]) {
        color = names[color];
        named = true;
    }
    else if (color === 'transparent') {
        return { r: 0, g: 0, b: 0, a: 0, format: 'name' };
    }
    var match = matchers.rgb.exec(color);
    if (match) {
        return { r: match[1], g: match[2], b: match[3] };
    }
    match = matchers.rgba.exec(color);
    if (match) {
        return { r: match[1], g: match[2], b: match[3], a: match[4] };
    }
    match = matchers.hsl.exec(color);
    if (match) {
        return { h: match[1], s: match[2], l: match[3] };
    }
    match = matchers.hsla.exec(color);
    if (match) {
        return { h: match[1], s: match[2], l: match[3], a: match[4] };
    }
    match = matchers.hsv.exec(color);
    if (match) {
        return { h: match[1], s: match[2], v: match[3] };
    }
    match = matchers.hsva.exec(color);
    if (match) {
        return { h: match[1], s: match[2], v: match[3], a: match[4] };
    }
    match = matchers.hex8.exec(color);
    if (match) {
        return {
            r: parseIntFromHex(match[1]),
            g: parseIntFromHex(match[2]),
            b: parseIntFromHex(match[3]),
            a: convertHexToDecimal(match[4]),
            format: named ? 'name' : 'hex8',
        };
    }
    match = matchers.hex6.exec(color);
    if (match) {
        return {
            r: parseIntFromHex(match[1]),
            g: parseIntFromHex(match[2]),
            b: parseIntFromHex(match[3]),
            format: named ? 'name' : 'hex',
        };
    }
    match = matchers.hex4.exec(color);
    if (match) {
        return {
            r: parseIntFromHex(match[1] + match[1]),
            g: parseIntFromHex(match[2] + match[2]),
            b: parseIntFromHex(match[3] + match[3]),
            a: convertHexToDecimal(match[4] + match[4]),
            format: named ? 'name' : 'hex8',
        };
    }
    match = matchers.hex3.exec(color);
    if (match) {
        return {
            r: parseIntFromHex(match[1] + match[1]),
            g: parseIntFromHex(match[2] + match[2]),
            b: parseIntFromHex(match[3] + match[3]),
            format: named ? 'name' : 'hex',
        };
    }
    return false;
}
function isValidCSSUnit(color) {
    return Boolean(matchers.CSS_UNIT.exec(String(color)));
}

var TinyColor = (function () {
    function TinyColor(color, opts) {
        if (color === void 0) { color = ''; }
        if (opts === void 0) { opts = {}; }
        var _a;
        if (color instanceof TinyColor) {
            return color;
        }
        this.originalInput = color;
        var rgb = inputToRGB(color);
        this.originalInput = color;
        this.r = rgb.r;
        this.g = rgb.g;
        this.b = rgb.b;
        this.a = rgb.a;
        this.roundA = Math.round(100 * this.a) / 100;
        this.format = (_a = opts.format) !== null && _a !== void 0 ? _a : rgb.format;
        this.gradientType = opts.gradientType;
        if (this.r < 1) {
            this.r = Math.round(this.r);
        }
        if (this.g < 1) {
            this.g = Math.round(this.g);
        }
        if (this.b < 1) {
            this.b = Math.round(this.b);
        }
        this.isValid = rgb.ok;
    }
    TinyColor.prototype.isDark = function () {
        return this.getBrightness() < 128;
    };
    TinyColor.prototype.isLight = function () {
        return !this.isDark();
    };
    TinyColor.prototype.getBrightness = function () {
        var rgb = this.toRgb();
        return ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000;
    };
    TinyColor.prototype.getLuminance = function () {
        var rgb = this.toRgb();
        var R;
        var G;
        var B;
        var RsRGB = rgb.r / 255;
        var GsRGB = rgb.g / 255;
        var BsRGB = rgb.b / 255;
        if (RsRGB <= 0.03928) {
            R = RsRGB / 12.92;
        }
        else {
            R = Math.pow(((RsRGB + 0.055) / 1.055), 2.4);
        }
        if (GsRGB <= 0.03928) {
            G = GsRGB / 12.92;
        }
        else {
            G = Math.pow(((GsRGB + 0.055) / 1.055), 2.4);
        }
        if (BsRGB <= 0.03928) {
            B = BsRGB / 12.92;
        }
        else {
            B = Math.pow(((BsRGB + 0.055) / 1.055), 2.4);
        }
        return (0.2126 * R) + (0.7152 * G) + (0.0722 * B);
    };
    TinyColor.prototype.getAlpha = function () {
        return this.a;
    };
    TinyColor.prototype.setAlpha = function (alpha) {
        this.a = boundAlpha(alpha);
        this.roundA = Math.round(100 * this.a) / 100;
        return this;
    };
    TinyColor.prototype.toHsv = function () {
        var hsv = rgbToHsv(this.r, this.g, this.b);
        return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this.a };
    };
    TinyColor.prototype.toHsvString = function () {
        var hsv = rgbToHsv(this.r, this.g, this.b);
        var h = Math.round(hsv.h * 360);
        var s = Math.round(hsv.s * 100);
        var v = Math.round(hsv.v * 100);
        return this.a === 1 ? "hsv(" + h + ", " + s + "%, " + v + "%)" : "hsva(" + h + ", " + s + "%, " + v + "%, " + this.roundA + ")";
    };
    TinyColor.prototype.toHsl = function () {
        var hsl = rgbToHsl(this.r, this.g, this.b);
        return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: this.a };
    };
    TinyColor.prototype.toHslString = function () {
        var hsl = rgbToHsl(this.r, this.g, this.b);
        var h = Math.round(hsl.h * 360);
        var s = Math.round(hsl.s * 100);
        var l = Math.round(hsl.l * 100);
        return this.a === 1 ? "hsl(" + h + ", " + s + "%, " + l + "%)" : "hsla(" + h + ", " + s + "%, " + l + "%, " + this.roundA + ")";
    };
    TinyColor.prototype.toHex = function (allow3Char) {
        if (allow3Char === void 0) { allow3Char = false; }
        return rgbToHex(this.r, this.g, this.b, allow3Char);
    };
    TinyColor.prototype.toHexString = function (allow3Char) {
        if (allow3Char === void 0) { allow3Char = false; }
        return '#' + this.toHex(allow3Char);
    };
    TinyColor.prototype.toHex8 = function (allow4Char) {
        if (allow4Char === void 0) { allow4Char = false; }
        return rgbaToHex(this.r, this.g, this.b, this.a, allow4Char);
    };
    TinyColor.prototype.toHex8String = function (allow4Char) {
        if (allow4Char === void 0) { allow4Char = false; }
        return '#' + this.toHex8(allow4Char);
    };
    TinyColor.prototype.toRgb = function () {
        return {
            r: Math.round(this.r),
            g: Math.round(this.g),
            b: Math.round(this.b),
            a: this.a,
        };
    };
    TinyColor.prototype.toRgbString = function () {
        var r = Math.round(this.r);
        var g = Math.round(this.g);
        var b = Math.round(this.b);
        return this.a === 1 ? "rgb(" + r + ", " + g + ", " + b + ")" : "rgba(" + r + ", " + g + ", " + b + ", " + this.roundA + ")";
    };
    TinyColor.prototype.toPercentageRgb = function () {
        var fmt = function (x) { return Math.round(bound01(x, 255) * 100) + "%"; };
        return {
            r: fmt(this.r),
            g: fmt(this.g),
            b: fmt(this.b),
            a: this.a,
        };
    };
    TinyColor.prototype.toPercentageRgbString = function () {
        var rnd = function (x) { return Math.round(bound01(x, 255) * 100); };
        return this.a === 1 ?
            "rgb(" + rnd(this.r) + "%, " + rnd(this.g) + "%, " + rnd(this.b) + "%)" :
            "rgba(" + rnd(this.r) + "%, " + rnd(this.g) + "%, " + rnd(this.b) + "%, " + this.roundA + ")";
    };
    TinyColor.prototype.toName = function () {
        if (this.a === 0) {
            return 'transparent';
        }
        if (this.a < 1) {
            return false;
        }
        var hex = '#' + rgbToHex(this.r, this.g, this.b, false);
        for (var _i = 0, _a = Object.keys(names); _i < _a.length; _i++) {
            var key = _a[_i];
            if (names[key] === hex) {
                return key;
            }
        }
        return false;
    };
    TinyColor.prototype.toString = function (format) {
        var formatSet = Boolean(format);
        format = format !== null && format !== void 0 ? format : this.format;
        var formattedString = false;
        var hasAlpha = this.a < 1 && this.a >= 0;
        var needsAlphaFormat = !formatSet && hasAlpha && (format.startsWith('hex') || format === 'name');
        if (needsAlphaFormat) {
            if (format === 'name' && this.a === 0) {
                return this.toName();
            }
            return this.toRgbString();
        }
        if (format === 'rgb') {
            formattedString = this.toRgbString();
        }
        if (format === 'prgb') {
            formattedString = this.toPercentageRgbString();
        }
        if (format === 'hex' || format === 'hex6') {
            formattedString = this.toHexString();
        }
        if (format === 'hex3') {
            formattedString = this.toHexString(true);
        }
        if (format === 'hex4') {
            formattedString = this.toHex8String(true);
        }
        if (format === 'hex8') {
            formattedString = this.toHex8String();
        }
        if (format === 'name') {
            formattedString = this.toName();
        }
        if (format === 'hsl') {
            formattedString = this.toHslString();
        }
        if (format === 'hsv') {
            formattedString = this.toHsvString();
        }
        return formattedString || this.toHexString();
    };
    TinyColor.prototype.clone = function () {
        return new TinyColor(this.toString());
    };
    TinyColor.prototype.lighten = function (amount) {
        if (amount === void 0) { amount = 10; }
        var hsl = this.toHsl();
        hsl.l += amount / 100;
        hsl.l = clamp01(hsl.l);
        return new TinyColor(hsl);
    };
    TinyColor.prototype.brighten = function (amount) {
        if (amount === void 0) { amount = 10; }
        var rgb = this.toRgb();
        rgb.r = Math.max(0, Math.min(255, rgb.r - Math.round(255 * -(amount / 100))));
        rgb.g = Math.max(0, Math.min(255, rgb.g - Math.round(255 * -(amount / 100))));
        rgb.b = Math.max(0, Math.min(255, rgb.b - Math.round(255 * -(amount / 100))));
        return new TinyColor(rgb);
    };
    TinyColor.prototype.darken = function (amount) {
        if (amount === void 0) { amount = 10; }
        var hsl = this.toHsl();
        hsl.l -= amount / 100;
        hsl.l = clamp01(hsl.l);
        return new TinyColor(hsl);
    };
    TinyColor.prototype.tint = function (amount) {
        if (amount === void 0) { amount = 10; }
        return this.mix('white', amount);
    };
    TinyColor.prototype.shade = function (amount) {
        if (amount === void 0) { amount = 10; }
        return this.mix('black', amount);
    };
    TinyColor.prototype.desaturate = function (amount) {
        if (amount === void 0) { amount = 10; }
        var hsl = this.toHsl();
        hsl.s -= amount / 100;
        hsl.s = clamp01(hsl.s);
        return new TinyColor(hsl);
    };
    TinyColor.prototype.saturate = function (amount) {
        if (amount === void 0) { amount = 10; }
        var hsl = this.toHsl();
        hsl.s += amount / 100;
        hsl.s = clamp01(hsl.s);
        return new TinyColor(hsl);
    };
    TinyColor.prototype.greyscale = function () {
        return this.desaturate(100);
    };
    TinyColor.prototype.spin = function (amount) {
        var hsl = this.toHsl();
        var hue = (hsl.h + amount) % 360;
        hsl.h = hue < 0 ? 360 + hue : hue;
        return new TinyColor(hsl);
    };
    TinyColor.prototype.mix = function (color, amount) {
        if (amount === void 0) { amount = 50; }
        var rgb1 = this.toRgb();
        var rgb2 = new TinyColor(color).toRgb();
        var p = amount / 100;
        var rgba = {
            r: ((rgb2.r - rgb1.r) * p) + rgb1.r,
            g: ((rgb2.g - rgb1.g) * p) + rgb1.g,
            b: ((rgb2.b - rgb1.b) * p) + rgb1.b,
            a: ((rgb2.a - rgb1.a) * p) + rgb1.a,
        };
        return new TinyColor(rgba);
    };
    TinyColor.prototype.analogous = function (results, slices) {
        if (results === void 0) { results = 6; }
        if (slices === void 0) { slices = 30; }
        var hsl = this.toHsl();
        var part = 360 / slices;
        var ret = [this];
        for (hsl.h = (hsl.h - ((part * results) >> 1) + 720) % 360; --results;) {
            hsl.h = (hsl.h + part) % 360;
            ret.push(new TinyColor(hsl));
        }
        return ret;
    };
    TinyColor.prototype.complement = function () {
        var hsl = this.toHsl();
        hsl.h = (hsl.h + 180) % 360;
        return new TinyColor(hsl);
    };
    TinyColor.prototype.monochromatic = function (results) {
        if (results === void 0) { results = 6; }
        var hsv = this.toHsv();
        var h = hsv.h;
        var s = hsv.s;
        var v = hsv.v;
        var res = [];
        var modification = 1 / results;
        while (results--) {
            res.push(new TinyColor({ h: h, s: s, v: v }));
            v = (v + modification) % 1;
        }
        return res;
    };
    TinyColor.prototype.splitcomplement = function () {
        var hsl = this.toHsl();
        var h = hsl.h;
        return [
            this,
            new TinyColor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l }),
            new TinyColor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l }),
        ];
    };
    TinyColor.prototype.triad = function () {
        return this.polyad(3);
    };
    TinyColor.prototype.tetrad = function () {
        return this.polyad(4);
    };
    TinyColor.prototype.polyad = function (n) {
        var hsl = this.toHsl();
        var h = hsl.h;
        var result = [this];
        var increment = 360 / n;
        for (var i = 1; i < n; i++) {
            result.push(new TinyColor({ h: (h + (i * increment)) % 360, s: hsl.s, l: hsl.l }));
        }
        return result;
    };
    TinyColor.prototype.equals = function (color) {
        return this.toRgbString() === new TinyColor(color).toRgbString();
    };
    return TinyColor;
}());

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * True if the custom elements polyfill is in use.
 */
const isCEPolyfill = typeof window !== 'undefined' &&
    window.customElements != null &&
    window.customElements.polyfillWrapFlushCallback !==
        undefined;
/**
 * Removes nodes, starting from `start` (inclusive) to `end` (exclusive), from
 * `container`.
 */
const removeNodes = (container, start, end = null) => {
    while (start !== end) {
        const n = start.nextSibling;
        container.removeChild(start);
        start = n;
    }
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * An expression marker with embedded unique key to avoid collision with
 * possible text in templates.
 */
const marker = `{{lit-${String(Math.random()).slice(2)}}}`;
/**
 * An expression marker used text-positions, multi-binding attributes, and
 * attributes with markup-like text values.
 */
const nodeMarker = `<!--${marker}-->`;
const markerRegex = new RegExp(`${marker}|${nodeMarker}`);
/**
 * Suffix appended to all bound attribute names.
 */
const boundAttributeSuffix = '$lit$';
/**
 * An updatable Template that tracks the location of dynamic parts.
 */
class Template {
    constructor(result, element) {
        this.parts = [];
        this.element = element;
        const nodesToRemove = [];
        const stack = [];
        // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
        const walker = document.createTreeWalker(element.content, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
        // Keeps track of the last index associated with a part. We try to delete
        // unnecessary nodes, but we never want to associate two different parts
        // to the same index. They must have a constant node between.
        let lastPartIndex = 0;
        let index = -1;
        let partIndex = 0;
        const { strings, values: { length } } = result;
        while (partIndex < length) {
            const node = walker.nextNode();
            if (node === null) {
                // We've exhausted the content inside a nested template element.
                // Because we still have parts (the outer for-loop), we know:
                // - There is a template in the stack
                // - The walker will find a nextNode outside the template
                walker.currentNode = stack.pop();
                continue;
            }
            index++;
            if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
                if (node.hasAttributes()) {
                    const attributes = node.attributes;
                    const { length } = attributes;
                    // Per
                    // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
                    // attributes are not guaranteed to be returned in document order.
                    // In particular, Edge/IE can return them out of order, so we cannot
                    // assume a correspondence between part index and attribute index.
                    let count = 0;
                    for (let i = 0; i < length; i++) {
                        if (endsWith(attributes[i].name, boundAttributeSuffix)) {
                            count++;
                        }
                    }
                    while (count-- > 0) {
                        // Get the template literal section leading up to the first
                        // expression in this attribute
                        const stringForPart = strings[partIndex];
                        // Find the attribute name
                        const name = lastAttributeNameRegex.exec(stringForPart)[2];
                        // Find the corresponding attribute
                        // All bound attributes have had a suffix added in
                        // TemplateResult#getHTML to opt out of special attribute
                        // handling. To look up the attribute value we also need to add
                        // the suffix.
                        const attributeLookupName = name.toLowerCase() + boundAttributeSuffix;
                        const attributeValue = node.getAttribute(attributeLookupName);
                        node.removeAttribute(attributeLookupName);
                        const statics = attributeValue.split(markerRegex);
                        this.parts.push({ type: 'attribute', index, name, strings: statics });
                        partIndex += statics.length - 1;
                    }
                }
                if (node.tagName === 'TEMPLATE') {
                    stack.push(node);
                    walker.currentNode = node.content;
                }
            }
            else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
                const data = node.data;
                if (data.indexOf(marker) >= 0) {
                    const parent = node.parentNode;
                    const strings = data.split(markerRegex);
                    const lastIndex = strings.length - 1;
                    // Generate a new text node for each literal section
                    // These nodes are also used as the markers for node parts
                    for (let i = 0; i < lastIndex; i++) {
                        let insert;
                        let s = strings[i];
                        if (s === '') {
                            insert = createMarker();
                        }
                        else {
                            const match = lastAttributeNameRegex.exec(s);
                            if (match !== null && endsWith(match[2], boundAttributeSuffix)) {
                                s = s.slice(0, match.index) + match[1] +
                                    match[2].slice(0, -boundAttributeSuffix.length) + match[3];
                            }
                            insert = document.createTextNode(s);
                        }
                        parent.insertBefore(insert, node);
                        this.parts.push({ type: 'node', index: ++index });
                    }
                    // If there's no text, we must insert a comment to mark our place.
                    // Else, we can trust it will stick around after cloning.
                    if (strings[lastIndex] === '') {
                        parent.insertBefore(createMarker(), node);
                        nodesToRemove.push(node);
                    }
                    else {
                        node.data = strings[lastIndex];
                    }
                    // We have a part for each match found
                    partIndex += lastIndex;
                }
            }
            else if (node.nodeType === 8 /* Node.COMMENT_NODE */) {
                if (node.data === marker) {
                    const parent = node.parentNode;
                    // Add a new marker node to be the startNode of the Part if any of
                    // the following are true:
                    //  * We don't have a previousSibling
                    //  * The previousSibling is already the start of a previous part
                    if (node.previousSibling === null || index === lastPartIndex) {
                        index++;
                        parent.insertBefore(createMarker(), node);
                    }
                    lastPartIndex = index;
                    this.parts.push({ type: 'node', index });
                    // If we don't have a nextSibling, keep this node so we have an end.
                    // Else, we can remove it to save future costs.
                    if (node.nextSibling === null) {
                        node.data = '';
                    }
                    else {
                        nodesToRemove.push(node);
                        index--;
                    }
                    partIndex++;
                }
                else {
                    let i = -1;
                    while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
                        // Comment node has a binding marker inside, make an inactive part
                        // The binding won't work, but subsequent bindings will
                        // TODO (justinfagnani): consider whether it's even worth it to
                        // make bindings in comments work
                        this.parts.push({ type: 'node', index: -1 });
                        partIndex++;
                    }
                }
            }
        }
        // Remove text binding nodes after the walk to not disturb the TreeWalker
        for (const n of nodesToRemove) {
            n.parentNode.removeChild(n);
        }
    }
}
const endsWith = (str, suffix) => {
    const index = str.length - suffix.length;
    return index >= 0 && str.slice(index) === suffix;
};
const isTemplatePartActive = (part) => part.index !== -1;
// Allows `document.createComment('')` to be renamed for a
// small manual size-savings.
const createMarker = () => document.createComment('');
/**
 * This regex extracts the attribute name preceding an attribute-position
 * expression. It does this by matching the syntax allowed for attributes
 * against the string literal directly preceding the expression, assuming that
 * the expression is in an attribute-value position.
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#elements-attributes
 *
 * " \x09\x0a\x0c\x0d" are HTML space characters:
 * https://www.w3.org/TR/html5/infrastructure.html#space-characters
 *
 * "\0-\x1F\x7F-\x9F" are Unicode control characters, which includes every
 * space character except " ".
 *
 * So an attribute is:
 *  * The name: any character except a control character, space character, ('),
 *    ("), ">", "=", or "/"
 *  * Followed by zero or more space characters
 *  * Followed by "="
 *  * Followed by zero or more space characters
 *  * Followed by:
 *    * Any character except space, ('), ("), "<", ">", "=", (`), or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */
const lastAttributeNameRegex =
// eslint-disable-next-line no-control-regex
/([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const walkerNodeFilter = 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */;
/**
 * Removes the list of nodes from a Template safely. In addition to removing
 * nodes from the Template, the Template part indices are updated to match
 * the mutated Template DOM.
 *
 * As the template is walked the removal state is tracked and
 * part indices are adjusted as needed.
 *
 * div
 *   div#1 (remove) <-- start removing (removing node is div#1)
 *     div
 *       div#2 (remove)  <-- continue removing (removing node is still div#1)
 *         div
 * div <-- stop removing since previous sibling is the removing node (div#1,
 * removed 4 nodes)
 */
function removeNodesFromTemplate(template, nodesToRemove) {
    const { element: { content }, parts } = template;
    const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
    let partIndex = nextActiveIndexInTemplateParts(parts);
    let part = parts[partIndex];
    let nodeIndex = -1;
    let removeCount = 0;
    const nodesToRemoveInTemplate = [];
    let currentRemovingNode = null;
    while (walker.nextNode()) {
        nodeIndex++;
        const node = walker.currentNode;
        // End removal if stepped past the removing node
        if (node.previousSibling === currentRemovingNode) {
            currentRemovingNode = null;
        }
        // A node to remove was found in the template
        if (nodesToRemove.has(node)) {
            nodesToRemoveInTemplate.push(node);
            // Track node we're removing
            if (currentRemovingNode === null) {
                currentRemovingNode = node;
            }
        }
        // When removing, increment count by which to adjust subsequent part indices
        if (currentRemovingNode !== null) {
            removeCount++;
        }
        while (part !== undefined && part.index === nodeIndex) {
            // If part is in a removed node deactivate it by setting index to -1 or
            // adjust the index as needed.
            part.index = currentRemovingNode !== null ? -1 : part.index - removeCount;
            // go to the next active part.
            partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
            part = parts[partIndex];
        }
    }
    nodesToRemoveInTemplate.forEach((n) => n.parentNode.removeChild(n));
}
const countNodes = (node) => {
    let count = (node.nodeType === 11 /* Node.DOCUMENT_FRAGMENT_NODE */) ? 0 : 1;
    const walker = document.createTreeWalker(node, walkerNodeFilter, null, false);
    while (walker.nextNode()) {
        count++;
    }
    return count;
};
const nextActiveIndexInTemplateParts = (parts, startIndex = -1) => {
    for (let i = startIndex + 1; i < parts.length; i++) {
        const part = parts[i];
        if (isTemplatePartActive(part)) {
            return i;
        }
    }
    return -1;
};
/**
 * Inserts the given node into the Template, optionally before the given
 * refNode. In addition to inserting the node into the Template, the Template
 * part indices are updated to match the mutated Template DOM.
 */
function insertNodeIntoTemplate(template, node, refNode = null) {
    const { element: { content }, parts } = template;
    // If there's no refNode, then put node at end of template.
    // No part indices need to be shifted in this case.
    if (refNode === null || refNode === undefined) {
        content.appendChild(node);
        return;
    }
    const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
    let partIndex = nextActiveIndexInTemplateParts(parts);
    let insertCount = 0;
    let walkerIndex = -1;
    while (walker.nextNode()) {
        walkerIndex++;
        const walkerNode = walker.currentNode;
        if (walkerNode === refNode) {
            insertCount = countNodes(node);
            refNode.parentNode.insertBefore(node, refNode);
        }
        while (partIndex !== -1 && parts[partIndex].index === walkerIndex) {
            // If we've inserted the node, simply adjust all subsequent parts
            if (insertCount > 0) {
                while (partIndex !== -1) {
                    parts[partIndex].index += insertCount;
                    partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
                }
                return;
            }
            partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
        }
    }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const directives = new WeakMap();
const isDirective = (o) => {
    return typeof o === 'function' && directives.has(o);
};

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
const noChange = {};
/**
 * A sentinel value that signals a NodePart to fully clear its content.
 */
const nothing = {};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * An instance of a `Template` that can be attached to the DOM and updated
 * with new values.
 */
class TemplateInstance {
    constructor(template, processor, options) {
        this.__parts = [];
        this.template = template;
        this.processor = processor;
        this.options = options;
    }
    update(values) {
        let i = 0;
        for (const part of this.__parts) {
            if (part !== undefined) {
                part.setValue(values[i]);
            }
            i++;
        }
        for (const part of this.__parts) {
            if (part !== undefined) {
                part.commit();
            }
        }
    }
    _clone() {
        // There are a number of steps in the lifecycle of a template instance's
        // DOM fragment:
        //  1. Clone - create the instance fragment
        //  2. Adopt - adopt into the main document
        //  3. Process - find part markers and create parts
        //  4. Upgrade - upgrade custom elements
        //  5. Update - set node, attribute, property, etc., values
        //  6. Connect - connect to the document. Optional and outside of this
        //     method.
        //
        // We have a few constraints on the ordering of these steps:
        //  * We need to upgrade before updating, so that property values will pass
        //    through any property setters.
        //  * We would like to process before upgrading so that we're sure that the
        //    cloned fragment is inert and not disturbed by self-modifying DOM.
        //  * We want custom elements to upgrade even in disconnected fragments.
        //
        // Given these constraints, with full custom elements support we would
        // prefer the order: Clone, Process, Adopt, Upgrade, Update, Connect
        //
        // But Safari does not implement CustomElementRegistry#upgrade, so we
        // can not implement that order and still have upgrade-before-update and
        // upgrade disconnected fragments. So we instead sacrifice the
        // process-before-upgrade constraint, since in Custom Elements v1 elements
        // must not modify their light DOM in the constructor. We still have issues
        // when co-existing with CEv0 elements like Polymer 1, and with polyfills
        // that don't strictly adhere to the no-modification rule because shadow
        // DOM, which may be created in the constructor, is emulated by being placed
        // in the light DOM.
        //
        // The resulting order is on native is: Clone, Adopt, Upgrade, Process,
        // Update, Connect. document.importNode() performs Clone, Adopt, and Upgrade
        // in one step.
        //
        // The Custom Elements v1 polyfill supports upgrade(), so the order when
        // polyfilled is the more ideal: Clone, Process, Adopt, Upgrade, Update,
        // Connect.
        const fragment = isCEPolyfill ?
            this.template.element.content.cloneNode(true) :
            document.importNode(this.template.element.content, true);
        const stack = [];
        const parts = this.template.parts;
        // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
        const walker = document.createTreeWalker(fragment, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
        let partIndex = 0;
        let nodeIndex = 0;
        let part;
        let node = walker.nextNode();
        // Loop through all the nodes and parts of a template
        while (partIndex < parts.length) {
            part = parts[partIndex];
            if (!isTemplatePartActive(part)) {
                this.__parts.push(undefined);
                partIndex++;
                continue;
            }
            // Progress the tree walker until we find our next part's node.
            // Note that multiple parts may share the same node (attribute parts
            // on a single element), so this loop may not run at all.
            while (nodeIndex < part.index) {
                nodeIndex++;
                if (node.nodeName === 'TEMPLATE') {
                    stack.push(node);
                    walker.currentNode = node.content;
                }
                if ((node = walker.nextNode()) === null) {
                    // We've exhausted the content inside a nested template element.
                    // Because we still have parts (the outer for-loop), we know:
                    // - There is a template in the stack
                    // - The walker will find a nextNode outside the template
                    walker.currentNode = stack.pop();
                    node = walker.nextNode();
                }
            }
            // We've arrived at our part's node.
            if (part.type === 'node') {
                const part = this.processor.handleTextExpression(this.options);
                part.insertAfterNode(node.previousSibling);
                this.__parts.push(part);
            }
            else {
                this.__parts.push(...this.processor.handleAttributeExpressions(node, part.name, part.strings, this.options));
            }
            partIndex++;
        }
        if (isCEPolyfill) {
            document.adoptNode(fragment);
            customElements.upgrade(fragment);
        }
        return fragment;
    }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * Our TrustedTypePolicy for HTML which is declared using the html template
 * tag function.
 *
 * That HTML is a developer-authored constant, and is parsed with innerHTML
 * before any untrusted expressions have been mixed in. Therefor it is
 * considered safe by construction.
 */
const policy = window.trustedTypes &&
    trustedTypes.createPolicy('lit-html', { createHTML: (s) => s });
const commentMarker = ` ${marker} `;
/**
 * The return type of `html`, which holds a Template and the values from
 * interpolated expressions.
 */
class TemplateResult {
    constructor(strings, values, type, processor) {
        this.strings = strings;
        this.values = values;
        this.type = type;
        this.processor = processor;
    }
    /**
     * Returns a string of HTML used to create a `<template>` element.
     */
    getHTML() {
        const l = this.strings.length - 1;
        let html = '';
        let isCommentBinding = false;
        for (let i = 0; i < l; i++) {
            const s = this.strings[i];
            // For each binding we want to determine the kind of marker to insert
            // into the template source before it's parsed by the browser's HTML
            // parser. The marker type is based on whether the expression is in an
            // attribute, text, or comment position.
            //   * For node-position bindings we insert a comment with the marker
            //     sentinel as its text content, like <!--{{lit-guid}}-->.
            //   * For attribute bindings we insert just the marker sentinel for the
            //     first binding, so that we support unquoted attribute bindings.
            //     Subsequent bindings can use a comment marker because multi-binding
            //     attributes must be quoted.
            //   * For comment bindings we insert just the marker sentinel so we don't
            //     close the comment.
            //
            // The following code scans the template source, but is *not* an HTML
            // parser. We don't need to track the tree structure of the HTML, only
            // whether a binding is inside a comment, and if not, if it appears to be
            // the first binding in an attribute.
            const commentOpen = s.lastIndexOf('<!--');
            // We're in comment position if we have a comment open with no following
            // comment close. Because <-- can appear in an attribute value there can
            // be false positives.
            isCommentBinding = (commentOpen > -1 || isCommentBinding) &&
                s.indexOf('-->', commentOpen + 1) === -1;
            // Check to see if we have an attribute-like sequence preceding the
            // expression. This can match "name=value" like structures in text,
            // comments, and attribute values, so there can be false-positives.
            const attributeMatch = lastAttributeNameRegex.exec(s);
            if (attributeMatch === null) {
                // We're only in this branch if we don't have a attribute-like
                // preceding sequence. For comments, this guards against unusual
                // attribute values like <div foo="<!--${'bar'}">. Cases like
                // <!-- foo=${'bar'}--> are handled correctly in the attribute branch
                // below.
                html += s + (isCommentBinding ? commentMarker : nodeMarker);
            }
            else {
                // For attributes we use just a marker sentinel, and also append a
                // $lit$ suffix to the name to opt-out of attribute-specific parsing
                // that IE and Edge do for style and certain SVG attributes.
                html += s.substr(0, attributeMatch.index) + attributeMatch[1] +
                    attributeMatch[2] + boundAttributeSuffix + attributeMatch[3] +
                    marker;
            }
        }
        html += this.strings[l];
        return html;
    }
    getTemplateElement() {
        const template = document.createElement('template');
        let value = this.getHTML();
        if (policy !== undefined) {
            // this is secure because `this.strings` is a TemplateStringsArray.
            // TODO: validate this when
            // https://github.com/tc39/proposal-array-is-template-object is
            // implemented.
            value = policy.createHTML(value);
        }
        template.innerHTML = value;
        return template;
    }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const isPrimitive = (value) => {
    return (value === null ||
        !(typeof value === 'object' || typeof value === 'function'));
};
const isIterable = (value) => {
    return Array.isArray(value) ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        !!(value && value[Symbol.iterator]);
};
/**
 * Writes attribute values to the DOM for a group of AttributeParts bound to a
 * single attribute. The value is only set once even if there are multiple parts
 * for an attribute.
 */
class AttributeCommitter {
    constructor(element, name, strings) {
        this.dirty = true;
        this.element = element;
        this.name = name;
        this.strings = strings;
        this.parts = [];
        for (let i = 0; i < strings.length - 1; i++) {
            this.parts[i] = this._createPart();
        }
    }
    /**
     * Creates a single part. Override this to create a differnt type of part.
     */
    _createPart() {
        return new AttributePart(this);
    }
    _getValue() {
        const strings = this.strings;
        const l = strings.length - 1;
        const parts = this.parts;
        // If we're assigning an attribute via syntax like:
        //    attr="${foo}"  or  attr=${foo}
        // but not
        //    attr="${foo} ${bar}" or attr="${foo} baz"
        // then we don't want to coerce the attribute value into one long
        // string. Instead we want to just return the value itself directly,
        // so that sanitizeDOMValue can get the actual value rather than
        // String(value)
        // The exception is if v is an array, in which case we do want to smash
        // it together into a string without calling String() on the array.
        //
        // This also allows trusted values (when using TrustedTypes) being
        // assigned to DOM sinks without being stringified in the process.
        if (l === 1 && strings[0] === '' && strings[1] === '') {
            const v = parts[0].value;
            if (typeof v === 'symbol') {
                return String(v);
            }
            if (typeof v === 'string' || !isIterable(v)) {
                return v;
            }
        }
        let text = '';
        for (let i = 0; i < l; i++) {
            text += strings[i];
            const part = parts[i];
            if (part !== undefined) {
                const v = part.value;
                if (isPrimitive(v) || !isIterable(v)) {
                    text += typeof v === 'string' ? v : String(v);
                }
                else {
                    for (const t of v) {
                        text += typeof t === 'string' ? t : String(t);
                    }
                }
            }
        }
        text += strings[l];
        return text;
    }
    commit() {
        if (this.dirty) {
            this.dirty = false;
            this.element.setAttribute(this.name, this._getValue());
        }
    }
}
/**
 * A Part that controls all or part of an attribute value.
 */
class AttributePart {
    constructor(committer) {
        this.value = undefined;
        this.committer = committer;
    }
    setValue(value) {
        if (value !== noChange && (!isPrimitive(value) || value !== this.value)) {
            this.value = value;
            // If the value is a not a directive, dirty the committer so that it'll
            // call setAttribute. If the value is a directive, it'll dirty the
            // committer if it calls setValue().
            if (!isDirective(value)) {
                this.committer.dirty = true;
            }
        }
    }
    commit() {
        while (isDirective(this.value)) {
            const directive = this.value;
            this.value = noChange;
            directive(this);
        }
        if (this.value === noChange) {
            return;
        }
        this.committer.commit();
    }
}
/**
 * A Part that controls a location within a Node tree. Like a Range, NodePart
 * has start and end locations and can set and update the Nodes between those
 * locations.
 *
 * NodeParts support several value types: primitives, Nodes, TemplateResults,
 * as well as arrays and iterables of those types.
 */
class NodePart {
    constructor(options) {
        this.value = undefined;
        this.__pendingValue = undefined;
        this.options = options;
    }
    /**
     * Appends this part into a container.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    appendInto(container) {
        this.startNode = container.appendChild(createMarker());
        this.endNode = container.appendChild(createMarker());
    }
    /**
     * Inserts this part after the `ref` node (between `ref` and `ref`'s next
     * sibling). Both `ref` and its next sibling must be static, unchanging nodes
     * such as those that appear in a literal section of a template.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    insertAfterNode(ref) {
        this.startNode = ref;
        this.endNode = ref.nextSibling;
    }
    /**
     * Appends this part into a parent part.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    appendIntoPart(part) {
        part.__insert(this.startNode = createMarker());
        part.__insert(this.endNode = createMarker());
    }
    /**
     * Inserts this part after the `ref` part.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    insertAfterPart(ref) {
        ref.__insert(this.startNode = createMarker());
        this.endNode = ref.endNode;
        ref.endNode = this.startNode;
    }
    setValue(value) {
        this.__pendingValue = value;
    }
    commit() {
        if (this.startNode.parentNode === null) {
            return;
        }
        while (isDirective(this.__pendingValue)) {
            const directive = this.__pendingValue;
            this.__pendingValue = noChange;
            directive(this);
        }
        const value = this.__pendingValue;
        if (value === noChange) {
            return;
        }
        if (isPrimitive(value)) {
            if (value !== this.value) {
                this.__commitText(value);
            }
        }
        else if (value instanceof TemplateResult) {
            this.__commitTemplateResult(value);
        }
        else if (value instanceof Node) {
            this.__commitNode(value);
        }
        else if (isIterable(value)) {
            this.__commitIterable(value);
        }
        else if (value === nothing) {
            this.value = nothing;
            this.clear();
        }
        else {
            // Fallback, will render the string representation
            this.__commitText(value);
        }
    }
    __insert(node) {
        this.endNode.parentNode.insertBefore(node, this.endNode);
    }
    __commitNode(value) {
        if (this.value === value) {
            return;
        }
        this.clear();
        this.__insert(value);
        this.value = value;
    }
    __commitText(value) {
        const node = this.startNode.nextSibling;
        value = value == null ? '' : value;
        // If `value` isn't already a string, we explicitly convert it here in case
        // it can't be implicitly converted - i.e. it's a symbol.
        const valueAsString = typeof value === 'string' ? value : String(value);
        if (node === this.endNode.previousSibling &&
            node.nodeType === 3 /* Node.TEXT_NODE */) {
            // If we only have a single text node between the markers, we can just
            // set its value, rather than replacing it.
            // TODO(justinfagnani): Can we just check if this.value is primitive?
            node.data = valueAsString;
        }
        else {
            this.__commitNode(document.createTextNode(valueAsString));
        }
        this.value = value;
    }
    __commitTemplateResult(value) {
        const template = this.options.templateFactory(value);
        if (this.value instanceof TemplateInstance &&
            this.value.template === template) {
            this.value.update(value.values);
        }
        else {
            // Make sure we propagate the template processor from the TemplateResult
            // so that we use its syntax extension, etc. The template factory comes
            // from the render function options so that it can control template
            // caching and preprocessing.
            const instance = new TemplateInstance(template, value.processor, this.options);
            const fragment = instance._clone();
            instance.update(value.values);
            this.__commitNode(fragment);
            this.value = instance;
        }
    }
    __commitIterable(value) {
        // For an Iterable, we create a new InstancePart per item, then set its
        // value to the item. This is a little bit of overhead for every item in
        // an Iterable, but it lets us recurse easily and efficiently update Arrays
        // of TemplateResults that will be commonly returned from expressions like:
        // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
        // If _value is an array, then the previous render was of an
        // iterable and _value will contain the NodeParts from the previous
        // render. If _value is not an array, clear this part and make a new
        // array for NodeParts.
        if (!Array.isArray(this.value)) {
            this.value = [];
            this.clear();
        }
        // Lets us keep track of how many items we stamped so we can clear leftover
        // items from a previous render
        const itemParts = this.value;
        let partIndex = 0;
        let itemPart;
        for (const item of value) {
            // Try to reuse an existing part
            itemPart = itemParts[partIndex];
            // If no existing part, create a new one
            if (itemPart === undefined) {
                itemPart = new NodePart(this.options);
                itemParts.push(itemPart);
                if (partIndex === 0) {
                    itemPart.appendIntoPart(this);
                }
                else {
                    itemPart.insertAfterPart(itemParts[partIndex - 1]);
                }
            }
            itemPart.setValue(item);
            itemPart.commit();
            partIndex++;
        }
        if (partIndex < itemParts.length) {
            // Truncate the parts array so _value reflects the current state
            itemParts.length = partIndex;
            this.clear(itemPart && itemPart.endNode);
        }
    }
    clear(startNode = this.startNode) {
        removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
    }
}
/**
 * Implements a boolean attribute, roughly as defined in the HTML
 * specification.
 *
 * If the value is truthy, then the attribute is present with a value of
 * ''. If the value is falsey, the attribute is removed.
 */
class BooleanAttributePart {
    constructor(element, name, strings) {
        this.value = undefined;
        this.__pendingValue = undefined;
        if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
            throw new Error('Boolean attributes can only contain a single expression');
        }
        this.element = element;
        this.name = name;
        this.strings = strings;
    }
    setValue(value) {
        this.__pendingValue = value;
    }
    commit() {
        while (isDirective(this.__pendingValue)) {
            const directive = this.__pendingValue;
            this.__pendingValue = noChange;
            directive(this);
        }
        if (this.__pendingValue === noChange) {
            return;
        }
        const value = !!this.__pendingValue;
        if (this.value !== value) {
            if (value) {
                this.element.setAttribute(this.name, '');
            }
            else {
                this.element.removeAttribute(this.name);
            }
            this.value = value;
        }
        this.__pendingValue = noChange;
    }
}
/**
 * Sets attribute values for PropertyParts, so that the value is only set once
 * even if there are multiple parts for a property.
 *
 * If an expression controls the whole property value, then the value is simply
 * assigned to the property under control. If there are string literals or
 * multiple expressions, then the strings are expressions are interpolated into
 * a string first.
 */
class PropertyCommitter extends AttributeCommitter {
    constructor(element, name, strings) {
        super(element, name, strings);
        this.single =
            (strings.length === 2 && strings[0] === '' && strings[1] === '');
    }
    _createPart() {
        return new PropertyPart(this);
    }
    _getValue() {
        if (this.single) {
            return this.parts[0].value;
        }
        return super._getValue();
    }
    commit() {
        if (this.dirty) {
            this.dirty = false;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.element[this.name] = this._getValue();
        }
    }
}
class PropertyPart extends AttributePart {
}
// Detect event listener options support. If the `capture` property is read
// from the options object, then options are supported. If not, then the third
// argument to add/removeEventListener is interpreted as the boolean capture
// value so we should only pass the `capture` property.
let eventOptionsSupported = false;
// Wrap into an IIFE because MS Edge <= v41 does not support having try/catch
// blocks right into the body of a module
(() => {
    try {
        const options = {
            get capture() {
                eventOptionsSupported = true;
                return false;
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.addEventListener('test', options, options);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.removeEventListener('test', options, options);
    }
    catch (_e) {
        // event options not supported
    }
})();
class EventPart {
    constructor(element, eventName, eventContext) {
        this.value = undefined;
        this.__pendingValue = undefined;
        this.element = element;
        this.eventName = eventName;
        this.eventContext = eventContext;
        this.__boundHandleEvent = (e) => this.handleEvent(e);
    }
    setValue(value) {
        this.__pendingValue = value;
    }
    commit() {
        while (isDirective(this.__pendingValue)) {
            const directive = this.__pendingValue;
            this.__pendingValue = noChange;
            directive(this);
        }
        if (this.__pendingValue === noChange) {
            return;
        }
        const newListener = this.__pendingValue;
        const oldListener = this.value;
        const shouldRemoveListener = newListener == null ||
            oldListener != null &&
                (newListener.capture !== oldListener.capture ||
                    newListener.once !== oldListener.once ||
                    newListener.passive !== oldListener.passive);
        const shouldAddListener = newListener != null && (oldListener == null || shouldRemoveListener);
        if (shouldRemoveListener) {
            this.element.removeEventListener(this.eventName, this.__boundHandleEvent, this.__options);
        }
        if (shouldAddListener) {
            this.__options = getOptions(newListener);
            this.element.addEventListener(this.eventName, this.__boundHandleEvent, this.__options);
        }
        this.value = newListener;
        this.__pendingValue = noChange;
    }
    handleEvent(event) {
        if (typeof this.value === 'function') {
            this.value.call(this.eventContext || this.element, event);
        }
        else {
            this.value.handleEvent(event);
        }
    }
}
// We copy options because of the inconsistent behavior of browsers when reading
// the third argument of add/removeEventListener. IE11 doesn't support options
// at all. Chrome 41 only reads `capture` if the argument is an object.
const getOptions = (o) => o &&
    (eventOptionsSupported ?
        { capture: o.capture, passive: o.passive, once: o.once } :
        o.capture);

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * The default TemplateFactory which caches Templates keyed on
 * result.type and result.strings.
 */
function templateFactory(result) {
    let templateCache = templateCaches.get(result.type);
    if (templateCache === undefined) {
        templateCache = {
            stringsArray: new WeakMap(),
            keyString: new Map()
        };
        templateCaches.set(result.type, templateCache);
    }
    let template = templateCache.stringsArray.get(result.strings);
    if (template !== undefined) {
        return template;
    }
    // If the TemplateStringsArray is new, generate a key from the strings
    // This key is shared between all templates with identical content
    const key = result.strings.join(marker);
    // Check if we already have a Template for this key
    template = templateCache.keyString.get(key);
    if (template === undefined) {
        // If we have not seen this key before, create a new Template
        template = new Template(result, result.getTemplateElement());
        // Cache the Template for this key
        templateCache.keyString.set(key, template);
    }
    // Cache all future queries for this TemplateStringsArray
    templateCache.stringsArray.set(result.strings, template);
    return template;
}
const templateCaches = new Map();

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const parts = new WeakMap();
/**
 * Renders a template result or other value to a container.
 *
 * To update a container with new values, reevaluate the template literal and
 * call `render` with the new result.
 *
 * @param result Any value renderable by NodePart - typically a TemplateResult
 *     created by evaluating a template tag like `html` or `svg`.
 * @param container A DOM parent to render to. The entire contents are either
 *     replaced, or efficiently updated if the same result type was previous
 *     rendered there.
 * @param options RenderOptions for the entire render tree rendered to this
 *     container. Render options must *not* change between renders to the same
 *     container, as those changes will not effect previously rendered DOM.
 */
const render$1 = (result, container, options) => {
    let part = parts.get(container);
    if (part === undefined) {
        removeNodes(container, container.firstChild);
        parts.set(container, part = new NodePart(Object.assign({ templateFactory }, options)));
        part.appendInto(container);
    }
    part.setValue(result);
    part.commit();
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * Creates Parts when a template is instantiated.
 */
class DefaultTemplateProcessor {
    /**
     * Create parts for an attribute-position binding, given the event, attribute
     * name, and string literals.
     *
     * @param element The element containing the binding
     * @param name  The attribute name
     * @param strings The string literals. There are always at least two strings,
     *   event for fully-controlled bindings with a single expression.
     */
    handleAttributeExpressions(element, name, strings, options) {
        const prefix = name[0];
        if (prefix === '.') {
            const committer = new PropertyCommitter(element, name.slice(1), strings);
            return committer.parts;
        }
        if (prefix === '@') {
            return [new EventPart(element, name.slice(1), options.eventContext)];
        }
        if (prefix === '?') {
            return [new BooleanAttributePart(element, name.slice(1), strings)];
        }
        const committer = new AttributeCommitter(element, name, strings);
        return committer.parts;
    }
    /**
     * Create parts for a text-position binding.
     * @param templateFactory
     */
    handleTextExpression(options) {
        return new NodePart(options);
    }
}
const defaultTemplateProcessor = new DefaultTemplateProcessor();

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for lit-html usage.
// TODO(justinfagnani): inject version number at build time
if (typeof window !== 'undefined') {
    (window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.3.0');
}
/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 */
const html = (strings, ...values) => new TemplateResult(strings, values, 'html', defaultTemplateProcessor);

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// Get a key to lookup in `templateCaches`.
const getTemplateCacheKey = (type, scopeName) => `${type}--${scopeName}`;
let compatibleShadyCSSVersion = true;
if (typeof window.ShadyCSS === 'undefined') {
    compatibleShadyCSSVersion = false;
}
else if (typeof window.ShadyCSS.prepareTemplateDom === 'undefined') {
    console.warn(`Incompatible ShadyCSS version detected. ` +
        `Please update to at least @webcomponents/webcomponentsjs@2.0.2 and ` +
        `@webcomponents/shadycss@1.3.1.`);
    compatibleShadyCSSVersion = false;
}
/**
 * Template factory which scopes template DOM using ShadyCSS.
 * @param scopeName {string}
 */
const shadyTemplateFactory = (scopeName) => (result) => {
    const cacheKey = getTemplateCacheKey(result.type, scopeName);
    let templateCache = templateCaches.get(cacheKey);
    if (templateCache === undefined) {
        templateCache = {
            stringsArray: new WeakMap(),
            keyString: new Map()
        };
        templateCaches.set(cacheKey, templateCache);
    }
    let template = templateCache.stringsArray.get(result.strings);
    if (template !== undefined) {
        return template;
    }
    const key = result.strings.join(marker);
    template = templateCache.keyString.get(key);
    if (template === undefined) {
        const element = result.getTemplateElement();
        if (compatibleShadyCSSVersion) {
            window.ShadyCSS.prepareTemplateDom(element, scopeName);
        }
        template = new Template(result, element);
        templateCache.keyString.set(key, template);
    }
    templateCache.stringsArray.set(result.strings, template);
    return template;
};
const TEMPLATE_TYPES = ['html', 'svg'];
/**
 * Removes all style elements from Templates for the given scopeName.
 */
const removeStylesFromLitTemplates = (scopeName) => {
    TEMPLATE_TYPES.forEach((type) => {
        const templates = templateCaches.get(getTemplateCacheKey(type, scopeName));
        if (templates !== undefined) {
            templates.keyString.forEach((template) => {
                const { element: { content } } = template;
                // IE 11 doesn't support the iterable param Set constructor
                const styles = new Set();
                Array.from(content.querySelectorAll('style')).forEach((s) => {
                    styles.add(s);
                });
                removeNodesFromTemplate(template, styles);
            });
        }
    });
};
const shadyRenderSet = new Set();
/**
 * For the given scope name, ensures that ShadyCSS style scoping is performed.
 * This is done just once per scope name so the fragment and template cannot
 * be modified.
 * (1) extracts styles from the rendered fragment and hands them to ShadyCSS
 * to be scoped and appended to the document
 * (2) removes style elements from all lit-html Templates for this scope name.
 *
 * Note, <style> elements can only be placed into templates for the
 * initial rendering of the scope. If <style> elements are included in templates
 * dynamically rendered to the scope (after the first scope render), they will
 * not be scoped and the <style> will be left in the template and rendered
 * output.
 */
const prepareTemplateStyles = (scopeName, renderedDOM, template) => {
    shadyRenderSet.add(scopeName);
    // If `renderedDOM` is stamped from a Template, then we need to edit that
    // Template's underlying template element. Otherwise, we create one here
    // to give to ShadyCSS, which still requires one while scoping.
    const templateElement = !!template ? template.element : document.createElement('template');
    // Move styles out of rendered DOM and store.
    const styles = renderedDOM.querySelectorAll('style');
    const { length } = styles;
    // If there are no styles, skip unnecessary work
    if (length === 0) {
        // Ensure prepareTemplateStyles is called to support adding
        // styles via `prepareAdoptedCssText` since that requires that
        // `prepareTemplateStyles` is called.
        //
        // ShadyCSS will only update styles containing @apply in the template
        // given to `prepareTemplateStyles`. If no lit Template was given,
        // ShadyCSS will not be able to update uses of @apply in any relevant
        // template. However, this is not a problem because we only create the
        // template for the purpose of supporting `prepareAdoptedCssText`,
        // which doesn't support @apply at all.
        window.ShadyCSS.prepareTemplateStyles(templateElement, scopeName);
        return;
    }
    const condensedStyle = document.createElement('style');
    // Collect styles into a single style. This helps us make sure ShadyCSS
    // manipulations will not prevent us from being able to fix up template
    // part indices.
    // NOTE: collecting styles is inefficient for browsers but ShadyCSS
    // currently does this anyway. When it does not, this should be changed.
    for (let i = 0; i < length; i++) {
        const style = styles[i];
        style.parentNode.removeChild(style);
        condensedStyle.textContent += style.textContent;
    }
    // Remove styles from nested templates in this scope.
    removeStylesFromLitTemplates(scopeName);
    // And then put the condensed style into the "root" template passed in as
    // `template`.
    const content = templateElement.content;
    if (!!template) {
        insertNodeIntoTemplate(template, condensedStyle, content.firstChild);
    }
    else {
        content.insertBefore(condensedStyle, content.firstChild);
    }
    // Note, it's important that ShadyCSS gets the template that `lit-html`
    // will actually render so that it can update the style inside when
    // needed (e.g. @apply native Shadow DOM case).
    window.ShadyCSS.prepareTemplateStyles(templateElement, scopeName);
    const style = content.querySelector('style');
    if (window.ShadyCSS.nativeShadow && style !== null) {
        // When in native Shadow DOM, ensure the style created by ShadyCSS is
        // included in initially rendered output (`renderedDOM`).
        renderedDOM.insertBefore(style.cloneNode(true), renderedDOM.firstChild);
    }
    else if (!!template) {
        // When no style is left in the template, parts will be broken as a
        // result. To fix this, we put back the style node ShadyCSS removed
        // and then tell lit to remove that node from the template.
        // There can be no style in the template in 2 cases (1) when Shady DOM
        // is in use, ShadyCSS removes all styles, (2) when native Shadow DOM
        // is in use ShadyCSS removes the style if it contains no content.
        // NOTE, ShadyCSS creates its own style so we can safely add/remove
        // `condensedStyle` here.
        content.insertBefore(condensedStyle, content.firstChild);
        const removes = new Set();
        removes.add(condensedStyle);
        removeNodesFromTemplate(template, removes);
    }
};
/**
 * Extension to the standard `render` method which supports rendering
 * to ShadowRoots when the ShadyDOM (https://github.com/webcomponents/shadydom)
 * and ShadyCSS (https://github.com/webcomponents/shadycss) polyfills are used
 * or when the webcomponentsjs
 * (https://github.com/webcomponents/webcomponentsjs) polyfill is used.
 *
 * Adds a `scopeName` option which is used to scope element DOM and stylesheets
 * when native ShadowDOM is unavailable. The `scopeName` will be added to
 * the class attribute of all rendered DOM. In addition, any style elements will
 * be automatically re-written with this `scopeName` selector and moved out
 * of the rendered DOM and into the document `<head>`.
 *
 * It is common to use this render method in conjunction with a custom element
 * which renders a shadowRoot. When this is done, typically the element's
 * `localName` should be used as the `scopeName`.
 *
 * In addition to DOM scoping, ShadyCSS also supports a basic shim for css
 * custom properties (needed only on older browsers like IE11) and a shim for
 * a deprecated feature called `@apply` that supports applying a set of css
 * custom properties to a given location.
 *
 * Usage considerations:
 *
 * * Part values in `<style>` elements are only applied the first time a given
 * `scopeName` renders. Subsequent changes to parts in style elements will have
 * no effect. Because of this, parts in style elements should only be used for
 * values that will never change, for example parts that set scope-wide theme
 * values or parts which render shared style elements.
 *
 * * Note, due to a limitation of the ShadyDOM polyfill, rendering in a
 * custom element's `constructor` is not supported. Instead rendering should
 * either done asynchronously, for example at microtask timing (for example
 * `Promise.resolve()`), or be deferred until the first time the element's
 * `connectedCallback` runs.
 *
 * Usage considerations when using shimmed custom properties or `@apply`:
 *
 * * Whenever any dynamic changes are made which affect
 * css custom properties, `ShadyCSS.styleElement(element)` must be called
 * to update the element. There are two cases when this is needed:
 * (1) the element is connected to a new parent, (2) a class is added to the
 * element that causes it to match different custom properties.
 * To address the first case when rendering a custom element, `styleElement`
 * should be called in the element's `connectedCallback`.
 *
 * * Shimmed custom properties may only be defined either for an entire
 * shadowRoot (for example, in a `:host` rule) or via a rule that directly
 * matches an element with a shadowRoot. In other words, instead of flowing from
 * parent to child as do native css custom properties, shimmed custom properties
 * flow only from shadowRoots to nested shadowRoots.
 *
 * * When using `@apply` mixing css shorthand property names with
 * non-shorthand names (for example `border` and `border-width`) is not
 * supported.
 */
const render = (result, container, options) => {
    if (!options || typeof options !== 'object' || !options.scopeName) {
        throw new Error('The `scopeName` option is required.');
    }
    const scopeName = options.scopeName;
    const hasRendered = parts.has(container);
    const needsScoping = compatibleShadyCSSVersion &&
        container.nodeType === 11 /* Node.DOCUMENT_FRAGMENT_NODE */ &&
        !!container.host;
    // Handle first render to a scope specially...
    const firstScopeRender = needsScoping && !shadyRenderSet.has(scopeName);
    // On first scope render, render into a fragment; this cannot be a single
    // fragment that is reused since nested renders can occur synchronously.
    const renderContainer = firstScopeRender ? document.createDocumentFragment() : container;
    render$1(result, renderContainer, Object.assign({ templateFactory: shadyTemplateFactory(scopeName) }, options));
    // When performing first scope render,
    // (1) We've rendered into a fragment so that there's a chance to
    // `prepareTemplateStyles` before sub-elements hit the DOM
    // (which might cause them to render based on a common pattern of
    // rendering in a custom element's `connectedCallback`);
    // (2) Scope the template with ShadyCSS one time only for this scope.
    // (3) Render the fragment into the container and make sure the
    // container knows its `part` is the one we just rendered. This ensures
    // DOM will be re-used on subsequent renders.
    if (firstScopeRender) {
        const part = parts.get(renderContainer);
        parts.delete(renderContainer);
        // ShadyCSS might have style sheets (e.g. from `prepareAdoptedCssText`)
        // that should apply to `renderContainer` even if the rendered value is
        // not a TemplateInstance. However, it will only insert scoped styles
        // into the document if `prepareTemplateStyles` has already been called
        // for the given scope name.
        const template = part.value instanceof TemplateInstance ?
            part.value.template :
            undefined;
        prepareTemplateStyles(scopeName, renderContainer, template);
        removeNodes(container, container.firstChild);
        container.appendChild(renderContainer);
        parts.set(container, part);
    }
    // After elements have hit the DOM, update styling if this is the
    // initial render to this container.
    // This is needed whenever dynamic changes are made so it would be
    // safest to do every render; however, this would regress performance
    // so we leave it up to the user to call `ShadyCSS.styleElement`
    // for dynamic changes.
    if (!hasRendered && needsScoping) {
        window.ShadyCSS.styleElement(container.host);
    }
};

const BooleanFromAttribute = (oldValue, newValue) => {
  if(newValue === '') return true;
  return false;
};

const BooleanToAttribute = (newValue) => {
  if(!newValue) return;
  return '';
};

const NumberFromAttribute = (oldValue, newValue) => {
  if(!oldValue && !newValue) return oldValue;
  if(newValue === '') return null;
  if(!newValue) return newValue;
  return Number(newValue);
};

const NumberToAttribute = (newValue) => {
  if(isNaN(newValue)) return;
  return newValue;
};

const StringFromAttribute = (oldValue, newValue) => {
  if(!oldValue && !newValue) return oldValue;
  if(!newValue) return newValue;
  return String(newValue);
};

const StringToAttribute = (newValue) => {
  if(newValue === '') return;
  return newValue;
};

const BooleanConverter = { fromAttribute: BooleanFromAttribute, toAttribute: BooleanToAttribute };
const NumberConverter = { fromAttribute: NumberFromAttribute, toAttribute: NumberToAttribute };
const StringConverter = { fromAttribute: StringFromAttribute, toAttribute: StringToAttribute };

class HTMLInputElement extends Properties(HTMLElement) {
  
  static get properties() {

    return {

      accept: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: StringConverter.fromAttribute,
        toAttributeConverter: StringConverter.toAttribute,
      },

      accessKey: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: StringConverter.fromAttribute,
        toAttributeConverter: StringConverter.toAttribute,
      },

      alt: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: StringConverter.fromAttribute,
        toAttributeConverter: StringConverter.toAttribute,
      },

      autocomplete: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: BooleanConverter.fromAttribute,
        toAttributeConverter: BooleanConverter.toAttribute,
      },

      autofocus: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: BooleanConverter.fromAttribute,
        toAttributeConverter: BooleanConverter.toAttribute,
      },

      capture: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: StringConverter.fromAttribute,
        toAttributeConverter: StringConverter.toAttribute,
      },

      checked: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: BooleanConverter.fromAttribute,
        toAttributeConverter: BooleanConverter.toAttribute,
      },

      dirname: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: StringConverter.fromAttribute,
        toAttributeConverter: StringConverter.toAttribute,
      },

      disabled: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: BooleanConverter.fromAttribute,
        toAttributeConverter: BooleanConverter.toAttribute,
      },

      height: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: NumberConverter.fromAttribute,
        toAttributeConverter: NumberConverter.toAttribute,
      },

      inputmode: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: StringConverter.fromAttribute,
        toAttributeConverter: StringConverter.toAttribute,
      },

      max: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: NumberConverter.fromAttribute,
        toAttributeConverter: NumberConverter.toAttribute,
      },

      maxlength: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: NumberConverter.fromAttribute,
        toAttributeConverter: NumberConverter.toAttribute,
      },

      name: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: StringConverter.fromAttribute,
        toAttributeConverter: StringConverter.toAttribute,
      },

      min: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: NumberConverter.fromAttribute,
        toAttributeConverter: NumberConverter.toAttribute,
      },

      minlength: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: NumberConverter.fromAttribute,
        toAttributeConverter: NumberConverter.toAttribute,
      },

      multiple: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: BooleanConverter.fromAttribute,
        toAttributeConverter: BooleanConverter.toAttribute,
      },

      pattern: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: StringConverter.fromAttribute,
        toAttributeConverter: StringConverter.toAttribute,
      },

      placeholder: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: StringConverter.fromAttribute,
        toAttributeConverter: StringConverter.toAttribute,
      },

      readonly: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: BooleanConverter.fromAttribute,
        toAttributeConverter: BooleanConverter.toAttribute,
      },

      required: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: BooleanConverter.fromAttribute,
        toAttributeConverter: BooleanConverter.toAttribute,
      },

      size: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: NumberConverter.fromAttribute,
        toAttributeConverter: NumberConverter.toAttribute,
      },

      src: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: StringConverter.fromAttribute,
        toAttributeConverter: StringConverter.toAttribute,
      },

      step: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: NumberConverter.fromAttribute,
        toAttributeConverter: NumberConverter.toAttribute,
      },

      width: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: NumberConverter.fromAttribute,
        toAttributeConverter: NumberConverter.toAttribute,
      },

      tabIndex: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: NumberConverter.fromAttribute,
        toAttributeConverter: NumberConverter.toAttribute,
      },

      type: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: StringConverter.fromAttribute,
        toAttributeConverter: StringConverter.toAttribute,
      },

      value: {
        observe: true,
        DOM: true,
        fromAttributeConverter: StringConverter.fromAttribute,
        toAttributeConverter: StringConverter.toAttribute,
      },

      __elementFocused: {
        observe: true
      }

    };

  }

  constructor() {
    super();

    const $element = document.createElement('input');
    this.accept = $element.accept;
    this.accessKey = $element.accessKey;
    this.alt = $element.alt;
    this.autocomplete = $element.autocomplete;
    this.autofocus = $element.autofocus;
    this.capture = $element.capture;
    this.checked = $element.checked;
    this.dirname = $element.dirname;
    this.disabled = $element.disabled;
    this.height = $element.height;
    this.inputmode = $element.inputmode;
    this.max = $element.max;
    this.maxlength = $element.maxlength;
    this.min = $element.min;
    this.minlength = $element.minlength;
    this.multiple = $element.multiple;
    this.name = $element.name;
    this.pattern = $element.pattern;
    this.placeholder = $element.placeholder;
    this.readonly = $element.readonly;
    this.required = $element.required;
    this.size = $element.size;
    this.src = $element.src;
    this.step = $element.step;
    this.tabIndex = $element.tabIndex;
    this.width = $element.width;
    this.type = $element.type;
    this.value = $element.value;
    this.__elementFocused = false;
    
    this.attachShadow({mode: 'open', delegatesFocus: this.__delegatesFocus});
    this.render();
    if(!this.__delegatesFocus) this.addEventListener('focus', () => this.$element.focus());
  }

  propertyChangedCallback(propName, oldValue, newValue) {
    super.propertyChangedCallback(propName, oldValue, newValue);
    this.render();
  }

  get styles() {
    return html`
      <style>
        :host { outline: none }

        input:invalid {
          border: 1px solid red;
        }
      </style>
    `;
  }

  get template() {
    return html`
      ${this.styles}
      <input
      .accept="${this.accept}"
      .accessKey="${this.accessKey}"
      .alt="${this.alt}"
      ?autocomplete="${this.autocomplete}"
      ?autofocus="${this.autofocus}"
      .capture="${this.capture}"
      ?checked="${this.checked}"
      .dirname="${this.dirname}"
      ?disabled="${this.disabled}"
      .height="${this.height}"
      .inputmode="${this.inputmode}"
      .max="${this.max}"
      .maxlength="${this.maxlength}"
      .min="${this.min}"
      .minlength="${this.minlength}"
      ?multiple="${this.multiple}"
      .name="${this.name}"
      .placeholder="${this.placeholder}"
      ?readonly="${this.readonly}"
      ?required="${this.required}"
      .size="${this.size}"
      .src="${this.src}"
      .step="${this.step}"
      .tabIndex="${this.tabIndex}"
      .width="${this.width}"
      .type="${this.type}"
      .value="${this.value}"
      @focus="${() => this.__elementFocused = true}"
      @blur="${() => this.__elementFocused = false}"
      @input="${this.__handleInput}"
      @change="${this.__handleChange}"
      >
    `;
  }

  render() {
    if(this.__elementFocused===true) return;
    window.requestAnimationFrame(() => {
      render(this.template, this.shadowRoot, {eventContext: this, scopeName: this.localName});
    });
  }

  get accessKey() {
    return this._accessKey;
  }

  set accessKey(val) {
    this._accessKey = val;
  }

  get list() {
    return this.$element.list;
  }

  get tabIndex() {
    return this.disabled === true ? -1 : this._tabIndex;
  }

  set tabIndex(val) {
    this._tabIndex = parseInt(val);
  }

  get validationMessage() {
    return this.$element.validationMessage;
  }

  get validity() {
    return this.$element.validity;
  }

  get willValidate() {
    return this.$element.willValidate;
  }

  checkValidity()	{
    return this.$element.checkValidity();
  }

  reportValidity() {
    return this.$element.reportValidity();
  }

  select() {
    return this.$element.select();
  }

  setCustomValidity(val) {
    this.$element.setCustomValidity(val);
  }

  setRangeText() {
    this.$element.setRangeText(...arguments);
  }

  setSelectionRange() {
    this.$element.setSelectionRange(...arguments);
  }

  stepDown() {
    this.$element.stepDown();
    this.value = this.$element.value;
  }

  stepUp() {
    this.$element.stepUp();
    this.value = this.$element.value;
  }

  get $element() {
    if(!this.shadowRoot) return {};
    return this.shadowRoot.querySelector('input') || {};
  }

  get __delegatesFocus() {
    const _div = document.createElement('div');
    _div.attachShadow({ mode: 'open', delegatesFocus: true });
    return _div.shadowRoot.delegatesFocus || false;
  }
  
  __handleInput(e) {
    this.value = e.target.value;
    this.checked = e.target.checked;
  }

  __handleChange(e) {
    this.value = e.target.value;
    this.checked = e.target.checked;
    this.dispatchEvent(new CustomEvent('change', {bubbles: true, composed: true}));
  }

}

const enableFocusVisible = (selector) => {
  init();
  selector.addEventListener('focus', _handleFocus.bind(selector));
  selector.addEventListener('blur', _handleBlur.bind(selector));
};

function init() {
  if(window.__focusVisiblePolyFillReady === true) return;
  window.addEventListener('keydown', e => window.__focusVisiblePolyFillLastKeyDown = e.key);
  window.addEventListener('mousedown', () => window.__focusVisiblePolyFillLastKeyDown = null);
  window.addEventListener('pointerdown', () => window.__focusVisiblePolyFillLastKeyDown = null);
  window.addEventListener('touchdown', () => window.__focusVisiblePolyFillLastKeyDown = null);
  window.__focusVisiblePolyFillReady = true;
}

function _handleFocus() {
  if(window.__focusVisiblePolyFillLastKeyDown === 'Tab') return addClass.call(this);
  removeClass.call(this);
}

function addClass() {
  this.classList.add('focus-visible');
}

function removeClass() {
  this.classList.remove('focus-visible');
}

function _handleBlur() {
  removeClass.call(this);
}

class ColorPickerSlider extends PropertyChangedHandler(HTMLInputElement) {

  static get properties() {
    return {...super.properties, ...{
      label: {
        observe: true,
        changedHandler: '_labelChanged'
      }
    }};
  }

  /**
   * @private
   */
  get styles() {
    return html`
      <style>

        :host {
          display: block;
          outline: none;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          display: inline-block;
          background: transparent;
          padding: 0;
          border-radius: 10px;
          height: 14px;
          overflow: hidden;
        }

        input[type="range"] {
          -webkit-appearance: none;
          -moz-appearance: none;
          -ms-appearance: none;
          width: 100%;
          height: 100%;
          background: transparent;
          position: relative;
          margin: 0;
          padding: 0;
          font-size: 0;
          outline: none;
          z-index: 1;
        }

        :host(.focus-visible) input {
          outline-color: -webkit-focus-ring-color;
          outline-style: auto;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          ${this._thumbStyles}
        }

        input[type="range"]::-moz-range-thumb {
          -moz-appearance: none;
          ${this._thumbStyles}
        }

        input[type="range"]::-ms-thumb {
          -ms-appearance: none;
          ${this._thumbStyles}
        }

        input[type="range"]::-webkit-slider-runnable-track {
          -webkit-appearance: none;
          ${this._trackStyles}
        }

        input[type="range"]::-moz-range-track {
          -moz-appearance: none;
          ${this._trackStyles}
        }

        input[type="range"]::-ms-track {
          -ms-appearance: none;
          cursor: pointer;
          background: transparent;
          border-color: transparent;
          color: transparent;
          ${this._trackStyles}
        }

        input[type="range"]::-ms-fill-lower {
          background: transparent;
        }

      </style>
    `;
  }

  get _thumbStyles() {
    return `
      height: 14px;
      width: 14px;
      background: transparent;
      border: 2px solid white;
      box-shadow: 0 0 2px rgba(0,0,0,0.4), inset 0 0 2px rgba(0,0,0,0.4);
      border-radius: 50%;
      box-sizing: border-box;
      content: '';
    `;
  }

  get _trackStyles() {
    return `
      height: 100%;
      width: 100%;
      background: transparent;
    `;
  }

  constructor() {
    super();
    enableFocusVisible(this);
  }

  connectedCallback() {
    super.connectedCallback && super.connectedCallback();
    window.requestAnimationFrame(() => {
      this._labelChanged();
      this.$element.addEventListener('change', this._handleChange.bind(this));
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback && super.disconnectedCallback();
    this.$element.removeEventListener('change', this._handleChange.bind(this));
  }

  /**
   * @private
   */
  get type() {
    return 'range';
  }

  _labelChanged() {
    if(!this.$element.setAttribute) return;
    this.$element.setAttribute('aria-label', this.label);
  }

  _handleChange(e) {
    const evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent('change', e.bubbles, e.cancelable, e.detail);
    this.dispatchEvent(evt);
  }
  
}

window.customElements.define('color-picker-slider', ColorPickerSlider);

/**
 * color-picker is a custom Element powered by @bgins TinyColor library.
 * - Supports hex, rgb(a), rrggbbaa/hex8, hsl(a) and hsv/b(a) color schemes.
 * - Fully keyboard accessible
 *
 * ### Tested browsers (older / other browsers may work)
 * - Chrome >= 67
 * - Firefox >= 63
 * - Safari >= 10.1
 * - IE11+
 *
 * [![screenshot.gif](https://i.postimg.cc/T29LHm2m/screenshot.gif)](https://postimg.cc/grx2xxZk)
 *
 * ```html
 * <color-picker
 *  id="picker"
 *  value="#ff0000"
 *  formats="hex,rgb,hsl,hsv,hex8"
 *  selectedformat="hex"
 * ></color-picker>
 * ```
 * ```javascript
 * picker.addEventlistener('input', (e) => console.info('input', e.detail.value))
 * picker.addEventlistener('change', (e) => console.info('change', e.detail.value))
 * ```
 *
 * @element color-picker
 *
 * @fires input
 * @fires change
 *
 * @prop {String} value - color value
 * @attr {String} value
 *
 * @prop {Array} formats - list of visible color schemes
 * @attr {String} formats - comma separated list of listed formats
 *
 * @prop {String} selectedFormat - selected color scheme
 * @attr {String} selectedformat
 *
 * @attr {Boolean} dark - Force dark mode when dark-mode is disabled in browser.
 * @attr {Boolean} light - Force light mode when dark-mode is enabled in browser.
 *
 * @cssprop [--color-picker-background-color] - backround color
 * @cssprop [--color-picker-color] - text color
 *
 */

class ColorPicker extends PropertiesChangedHandler(PropertiesChangedCallback(PropertyChangedHandler(Properties(HTMLElement)))) {

  static get properties() {
    return {

      value: {
        observe: true,
        DOM: true,
        changedHandler: '_valueChanged'
      },
      no_alpha: {
        observe: false,
        DOM: true,
        changedHandler: '_noAlphaChanged'
      },

      formats: {
        observe: true,
        DOM: true,
        fromAttributeConverter: function(oldValue, newValue) {
          return newValue.replace(/\s+/g, '').split(',');
        },
        changedHandler: '_formatsChanged'
      },

      selectedFormat: {
        observe: true,
        DOM: true,
        changedHandler: '_selectedFormatChanged'
      },

      _pointerDown: {
        observe: true
      },

      _sliderDown: {
        observe: true
      }

    };
  }

  get value() {
    if(!this.color) return undefined;
    if(this.selectedFormat === 'hex') return this.color.toHexString();
    if(this.selectedFormat === 'hex8') return this.color.toHex8String();
    if(this.selectedFormat === 'hsl') return this.color.toHslString();
    if(this.selectedFormat === 'hsv') return this.color.toHsvString();
    return this.color.toRgbString();
  }

  set value(val) {
    this['#value'] = new TinyColor(val);
  }

  get color() {
    return this['#value'];
  }

  set formats(val) {
    if(val.constructor.name !== 'Array') return;
    const formats = [];
    for(var i in val) if(this.supportedFormats.indexOf(val[i]) !== -1) formats.push(val[i]);
    this['#formats'] = [...formats];
  }

  get supportedFormats() {
    return ['hex', 'hex8', 'rgb', 'hsv', 'hsl'];
  }

  get selectedFormat() {
    return this['#selectedFormat'];
  }

  set selectedFormat(val) {
    if((this.formats || []).indexOf(val) === -1) return;
    this['#selectedFormat'] = val;
  }

  get hsv() {
    return this.color.toHsv();
  }

  get alpha() {
    return this.color.getAlpha();
  }

  set alpha(alpha) {
    const oldVal = this.color;
    this.color.setAlpha(alpha);
    this.propertyChangedCallback('value', oldVal, this.color);
  }

  get hex() {
    return this.color.toHex();
  }

  get hex8() {
    return this.color.toHex8();
  }

  get rgb() {
    return this.color.toRgb();
  }

  get hsl() {
    return this.color.toHsl();
  }

  get _gridGradient() {
    if(this.selectedFormat === 'hsl') return 'linear-gradient(to bottom, hsl(0, 0%, 100%) 0%, hsla(0, 0%, 100%, 0) 50%, hsla(0, 0%, 0%, 0) 50%, hsl(0, 0%, 0%) 100%), linear-gradient(to right, hsl(0, 0%, 50%) 0%, hsla(0, 0%, 50%, 0) 100%)';
    return 'linear-gradient(rgba(0,0,0,0) 0%, #000 100%), linear-gradient(to left, rgba(255,255,255,0) 0%, #fff 100%)';
  }

  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    
    this.value = {h: 0, s: 1, v: 1};
    this.selectedFormat = 'rgb';
    this._pointerDown = false;
    this._sliderDown = false;
    this.formats = this.supportedFormats;
    this.no_alpha = this.getAttribute('no_alpha');
    window.addEventListener('mouseup', this._handleMouseup.bind(this), false);
    window.addEventListener('mousemove', this._handleMousemove.bind(this), false);
    enableFocusVisible(this._$grid);
    this._valueChanged();
    this.shadowRoot.querySelectorAll('input, select').forEach(item => enableFocusVisible(item));
  }

  connectedCallback() {
    super.connectedCallback();
    this.selectedFormat = this.color.format;
    this._valueChanged();
  }

  /**
   * @private
   */
  propertyChangedCallback(propNames, oldValues, newValues) {
    super.propertyChangedCallback(propNames, oldValues, newValues);
    render(this.template, this.shadowRoot, {eventContext: this, scopeName: this.localName});
  }

  static get propertiesChangedHandlers() {
    return {
      '_notifyChanges': ['value', '_pointerDown', '_sliderDown']
    };
  }

  /**
   * @private
   */
  get template() {
    return html`

      <style>

        *, *:before, *:after {
          box-sizing: border-box;
          font-size: 0;
          font-family: var(--color-picker-font-family);
        }

        :host {
          width: 240px;
          height: 240px;
          display: block;
          --color-picker-background-color: #fff;
          --color-picker-color: #222;
          --color-picker-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
          font-family: var(--color-picker-font-family);
        }

        :host([light]) {
          --color-picker-background-color: #fff;
          --color-picker-color: #222;
        }

        @media (prefers-color-scheme: dark) {
          :host {
            --color-picker-background-color: #222;
            --color-picker-color: #fff;
          }
        }

        :host([dark]) {
          --color-picker-background-color: #222;
          --color-picker-color: #fff;
        }

        #container {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          background-color: var(--color-picker-background-color);
          color: var(--color-picker-color);
        }

        #gridInput {
          width: 100%;
          outline: none;
          flex: 1;
          position: relative;
        }

        #gridInput .overlay {
          width: 100%;
          top: 0;
          left: 0;
          height: 100%;
          pointer-events: none;
          position: absolute;
        }

        #gridInput .overlay .thumb {
          position: absolute;
          margin: -7px;
          pointer-events: none;
          ${this._thumbStyles}
        }

        #gridInput.focus-visible:focus {
          outline-color: -webkit-focus-ring-color;
          outline-style: auto;
        }

        .absbefore:before,
        .absafter:after {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          content: '';
        }

        #sliderInput {
          padding: 8px;
          display: flex;
        }

        #sliders {
          display: flex;
          flex-direction: column;
          flex: 1;
          margin-right: 8px;
        }

        color-picker-slider {
          position: relative;
        }

        color-picker-slider:nth-child(1) {
          margin-bottom: 8px;
        }

        color-picker-slider:after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: inherit;
        }

        #hueInput:after {
          background: linear-gradient(to right, red 0%, #ff0 17%, lime 33%, cyan 50%, blue 66%, #f0f 83%, red 100%);
        }

        #alphaInput:after {
          background: var(--color-picker-alpha-slider-background);
        }

        #alphaInput:before, #alphaInput:after {
          border-radius: inherit;
          pointer-events: none;
        }

        #colorSteel {
          position: relative;
          width: 100%;
          height: 100%;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid var(--bg-color--20);
          margin: auto;
          overflow: hidden;
        }

        .checkerboard:before {
          background: linear-gradient(45deg, #777 25%, transparent 25%), linear-gradient(-45deg, #777 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #777 75%), linear-gradient(-45deg, transparent 75%, #777 75%);
          background-size: 6px 6px;
          background-position: 0 0, 0 3px, 3px -3px, -3px 0px;
        }

        #colorSteel .inner {
          width: 100%;
          height: 100%;
          position: relative;
        }

        input, select {
          border: 1px solid transparent;
          outline: none;
        }

        option {
          color: #222;
          background: var(--color-picker-background-color);
        }

        input:hover, select:hover, input:focus, select:focus {
          border-color: var(--bg-color--20);
        }

        :focus.focus-visible {
          outline-color: -webkit-focus-ring-color;
          outline-style: auto;
        }

        input, select, select * {
          font-size: 12px;
          padding: 3px;
          min-width: 44px;
          color: inherit;
          -moz-appearance: textfield;
          font-family: var(--color-picker-font-family);
        }

        input[type="text"] {
          min-width: 80px;
        }

        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        #textInput {
          padding: 0 8px 8px 8px;
          display: flex;
          /* align-items: center; */
        }

        select, .color-input, .alpha-input {
          flex: 0;
          padding: 0;
        }

        .color-input label, .alpha-input label {
          position: relative;
          display: block;
        }
        
        .color-input label:after, .alpha-input label:after {
          content: attr(data-name);
          font-size: 10px;
          width: 100%;
          text-align: center;
          text-transform: uppercase;
          color: inherit;
          color: var(--bg-color--60);
          display: block;
        }

        select .alpha-input {
          flex: 0;
        }

        select {
          -webkit-appearance: none;
          -moz-appearance: none;
          -ms-appearance: none;
          border-radius: 0;
          background: transparent;
          padding: 3px;
          text-align: center;
          text-align-last: center;
          align-self: flex-start;
          margin: 0;
        }

        select::-ms-expand {
          display: none;
        }

        .color-input {
          flex: 0;
          display: flex;
          justify-content: flex-start;
        }

        input {
          padding: 3px;
          margin: 0;
          flex: 1;
          text-align: center;
          text-align-last: center;
          background: transparent;
          color: inherit;
          text-transform: uppercase;
          width: 100%;
        }

        [hidden] {
          display: none!important;
        }
      </style>

      <div id="container">

        <section
          id="gridInput"
          tabindex="0"
          role="slider"
          aria-label="change saturation and ${this.selectedFormat === 'hsl' ? 'light' : 'value'}"
          aria-valuemin="0"
          aria-valuemax="0.99"
          aria-orientation="vertical"
          aria-valuetext="saturation ${this.hsv.s.toFixed(2)} ${this.selectedFormat === 'hsl' ? `light ${this.hsl.l.toFixed(2)}` : `value ${this.hsv.v.toFixed(2)}`}"
          @mousedown="${this._handleMousedown}"
          @keydown="${this._handleGridKeydown}"
        ><div class="overlay"><div class="thumb"></div></div></section>

        <section id="sliderInput">
          <div id="sliders">
            <color-picker-slider tabindex="0" .label="${'change hue'}" id="hueInput" .value="${this.hsv.h}" min="0" max="359" step="1" data-scheme="hsv" data-key="h" @input="${this._handleHueSliderInput}" @change="${this._handleHueSliderInput}" @mousedown="${() => this._sliderDown = true}" @mouseup="${() => this._sliderDown = false}"></color-picker-slider>
            <color-picker-slider tabindex="0" .label="${'change alpha'}" id="alphaInput" class="absbefore absafter checkerboard" ?hidden="${this.no_alpha == "true"}" .value="${this.alpha * 100}" min="0" max="100" step="1" @input="${this._handleAlphaSliderInput}" @change="${this._handleAlphaSliderInput}" @mousedown="${() => this._sliderDown = true}" @mouseup="${() => this._sliderDown = false}"></color-picker-slider>
          </div>
          <div id="colorSteel" class="checkerboard absbefore">
            <div class="inner"></div>
          </div>
        </section>

        <section id="textInput">

          <select aria-label="select color scheme" .selectedIndex="${(this.formats || []).indexOf(this.selectedFormat)}" @change="${this._handleSelectChange}" @input="${e => e.stopPropagation()}">
            ${(this.formats || []).map(format => html`
              <option .value="${format}">${format.toUpperCase()}</option>
            `)}
          </select>

          <div ?hidden="${this.selectedFormat !== 'hsv'}" class="color-input">
            <label data-name="h"><input aria-label="change hue" type="number" .value="${Math.round(this.hsv.h)}" min="0" max="359" step="1" data-scheme="hsv", data-key="h" @input="${this._handleInput}"></label>
            <label data-name="s"><input aria-label="change saturation" type="number" .value="${Math.round(this.hsv.s * 100)}" min="0" max="100" step="1" data-scheme="hsv", data-key="s" @input="${this._handleInput}"></label>
            <label data-name="v"><input aria-label="change value / brightness" type="number" .value="${Math.round(this.hsv.v * 100)}" min="0" max="100" step="1" data-scheme="hsv", data-key="v" @input="${this._handleInput}"></label>
            <label ?hidden="${this.no_alpha == "true"}" data-name="%"><input aria-label="change alpha" type="number" .value="${Math.round(this.alpha * 100)}" min="0" max="100" step="1" data-scheme="alpha" @input="${this._handleAlphaInput}"></label>
          </div>

          <div ?hidden="${this.selectedFormat !== 'hsl'}" class="color-input">
            <label data-name="h"><input aria-label="change hue" type="number" .value="${Math.round(this.hsl.h)}" min="0" max="359" step="1" data-scheme="hsl", data-key="h" @input="${this._handleInput}"></label>
            <label data-name="s"><input aria-label="change saturation" type="number" .value="${Math.round(this.hsl.s * 100)}" min="0" max="100" step="1" data-scheme="hsl", data-key="s" @input="${this._handleInput}"></label>
            <label data-name="l"><input aria-label="change light" type="number" .value="${Math.round(this.hsl.l * 100)}" min="0" max="100" step="1" data-scheme="hsl", data-key="l" @input="${this._handleInput}"></label>
            <label ?hidden="${this.no_alpha == "true"}" data-name="%"><input aria-label="change alpha" type="number" .value="${Math.round(this.alpha * 100)}" min="0" max="100" step="1" data-scheme="alpha" @input="${this._handleAlphaInput}"></label>
          </div>

          <div ?hidden="${this.selectedFormat !== 'rgb'}" class="color-input">
            <label data-name="r"><input aria-label="change red" type="number" .value="${this.rgb.r}" min="0" max="255" step="1" data-scheme="rgb", data-key="r" @input="${this._handleInput}"></label>
            <label data-name="g"><input aria-label="change green" type="number" .value="${this.rgb.g}" min="0" max="255" step="1" data-scheme="rgb", data-key="g" @input="${this._handleInput}"></label>
            <label data-name="b"><input aria-label="change blue" type="number" .value="${this.rgb.b}" min="0" max="255" step="1" data-scheme="rgb", data-key="b" @input="${this._handleInput}"></label>
            <label ?hidden="${this.no_alpha == "true"}" data-name="%"><input aria-label="change alpha" type="number" .value="${Math.round(this.alpha * 100)}" min="0" max="100" step="1" data-scheme="alpha" @input="${this._handleAlphaInput}"></label>
          </div>

          <div ?hidden="${this.selectedFormat !== 'hex'}" class="color-input">
            <label data-name="#"><input aria-label="change hex" type="text" .value="${this.hex}" data-scheme="hex" maxlength="6" @change="${this._handleInput}" @input="${e => e.stopPropagation()}"></label>
            <label ?hidden="${this.no_alpha == "true"}" data-name="%"><input aria-label="change alpha" type="number" .value="${Math.round(this.alpha * 100)}" min="0" max="100" step="1" data-scheme="alpha" @input="${this._handleAlphaInput}"></label>
          </div>

          <div ?hidden="${this.selectedFormat !== 'hex8'}" class="color-input">
          <label data-name="#"><input aria-label="change hex8" type="text" .value="${this.hex8}" data-scheme="hex8" maxlength="8" @change="${this._handleInput}" @input="${e => e.stopPropagation()}"></label>
          </div>

        </section>
      </div>
    `;
  }


  _handleInput(e) {
    e.stopPropagation();
    const scheme = e.target.dataset.scheme;
    const key = e.target.dataset.key;
    const value = e.target.value;
    let data = this[scheme];
    if(key) data[key] = Math.round(value);
    else data = value;
    this.value = data;
  }

  _handleHueSliderInput(e) {
    this._handleInput(e);
    this.propertyChangedCallback('value');
  }

  _handleAlphaSliderInput(e) {
    e.stopPropagation();
    this.alpha = e.target.value / 100;
  }

  _handleAlphaInput(e) {
    e.stopPropagation();
    this.alpha = e.target.value / 100;
  }

  _handleSelectChange(e) {
    this.selectedFormat = e.target.value;
  }

  _handleMouseup() {
    this._pointerDown = false;
  }

  _handleMousemove(e) {
    if(!this._pointerDown) return;

    const {x, y} = this.getBoundingClientRect();
    const pointerX = Math.round(e.clientX - x);
    const pointerY = Math.round(e.clientY - y);
    const saturation = Math.min(Math.max((pointerX / this._$grid.offsetWidth), 0), 0.99);
    const value = 0.99 - Math.min(Math.max((pointerY / this._$grid.offsetHeight), 0), 0.99);
    
    if(this.selectedFormat === 'hsl') this.value = {...this.color.toHsl(), ...{s: saturation}, ...{l: value}};
    else this.value = {...this.color.toHsv(), ...{s: saturation}, ...{v: value}};
  }

  _handleMousedown(e) {
    this._pointerDown = true;
    this._handleMousemove(e);
  }

  _handleGridKeydown(e) {

    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].indexOf(e.key) === -1) return;
    e.preventDefault();

    const hsl = this.color.toHsl();
    const hsv = this.color.toHsv();

    if(e.key.indexOf())

      if(e.key === 'ArrowLeft') return this.value = (this.selectedFormat === 'hsl') ? {...hsl, ...{s: hsl.s-0.01}} : {...hsv, ...{s: hsv.s-0.01}};
    if(e.key === 'ArrowRight') return this.value = (this.selectedFormat === 'hsl') ? {...hsl, ...{s: hsl.s+0.01}} : {...hsv, ...{s: hsv.s+0.01}};

    if(e.key === 'ArrowUp') return this.value = (this.selectedFormat === 'hsl') ? {...hsl, ...{l: hsl.l+0.01}} : {...hsv, ...{v: hsv.v+0.01}};
    if(e.key === 'ArrowDown') return this.value = (this.selectedFormat === 'hsl') ? {...hsl, ...{l: hsl.l-0.01}} : {...hsv, ...{v: hsv.v-0.01}};

    if(e.key === 'Home') return this.value = (this.selectedFormat === 'hsl') ? {...hsl, ...{s: hsl.s-0.10}} : {...hsv, ...{s: hsv.s-0.10}};
    if(e.key === 'End') return this.value = (this.selectedFormat === 'hsl') ? {...hsl, ...{s: hsl.s+0.10}} : {...hsv, ...{s: hsv.s+0.10}};

    if(e.key === 'PageUp') return this.value = (this.selectedFormat === 'hsl') ? {...hsl, ...{l: hsl.l+0.10}} : {...hsv, ...{v: hsv.v+0.10}};
    if(e.key === 'PageDown') return this.value = (this.selectedFormat === 'hsl') ? {...hsl, ...{l: hsl.l-0.10}} : {...hsv, ...{v: hsv.v-0.10}};
  }

  _valueChanged() {
    this._setGridThumbPosition();
    this._setHighlightColors();
    this._setColorSteelColor();
    this._setAlphaSliderBackground();
  }

  _setColorSteelColor() {
    if(!this._$container) return;
    this._setCSSProperty('background', this.color.toRgbString(), this._$colorSteel.querySelector('.inner'));
  }

  _setAlphaSliderBackground() {
    if(!this._$container) return;
    this._setCSSProperty('--color-picker-alpha-slider-background', this._alphaSliderBackground, this._$container);
  }

  get _gridBackground() {
    return new TinyColor({h: this.shadowRoot.querySelector('#hueInput').value, s: 1, v: 1}).toRgbString();
  }

  get _alphaSliderBackground() {
    const color = new TinyColor(this.value);
    return `linear-gradient(to right, ${color.setAlpha(0).toRgbString()} 0%, ${color.setAlpha(1).toRgbString()} 100%)`;
  }

  _formatsChanged() {
    if(this.formats.indexOf(this.selectedFormat) === -1) this.selectedFormat = this.formats[0];
  }
  _noAlphaChanged() {
    this.no_alpha = this.getAttribute('no_alpha');
  }

  _selectedFormatChanged() {
    this._setCSSProperty('background', this._gridGradient, this._$grid.querySelector('.overlay'));
    this._setGridThumbPosition();
  }

  _notifyChanges() {
    if(this._pointerDown || this._sliderDown) return this._dispatchValue('input');
    this._dispatchValue('change');
  }

  _dispatchValue(eventName) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail: {value: this.value}
    }));
  }

  _setGridThumbPosition() {
    if(!this._$grid) return;
    const saturation = (this.selectedFormat === 'hsl') ? this.hsl.s : this.hsv.s;
    const value = (this.selectedFormat === 'hsl') ? this.hsl.l : this.hsv.v;
    const thumbX = this._$grid.offsetWidth * saturation;
    const thumbY = this._$grid.offsetHeight * (1-value);
    this._setCSSProperty('transform', `translate(${thumbX}px, ${thumbY}px)`, this._$grid.querySelector('.thumb'));
    this._setCSSProperty('background', this._gridBackground, this._$grid);
  }

  _setHighlightColors() {
    if(!this._$container) return;
    const bgColor = new TinyColor(window.getComputedStyle(this._$container).backgroundColor);
    const method = bgColor.isLight() ? 'darken' : 'brighten';
    this._setCSSProperty('--bg-color--20', bgColor[method]()[method]().toRgbString(), this._$container);
    this._setCSSProperty('--bg-color--60', bgColor[method]()[method]()[method]()[method]()[method]()[method]().toRgbString(), this._$container);
  }

  _setCSSProperty(propName, value, selector = this) {
    if(!selector) return;
    selector.style.setProperty(propName, value);
    if(window.ShadyCSS) window.ShadyCSS.styleSubtree(selector, {[propName] : value});
  }

  get _thumbStyles() {
    return new ColorPickerSlider()._thumbStyles;
  }

  get _$container() {
    return this.shadowRoot.querySelector('#container');
  }

  get _$grid() {
    return this.shadowRoot.querySelector('#gridInput');
  }

  get _$colorSteel() {
    return this.shadowRoot.querySelector('#colorSteel');
  }

}

window.customElements.define('color-picker', ColorPicker);
