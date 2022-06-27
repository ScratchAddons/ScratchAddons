const t=t=>class extends t{constructor(){super(),this.constructor.__saveInitialPropertyValues.call(this),this.constructor.__initProperties.call(this)}connectedCallback(){super.connectedCallback&&super.connectedCallback(),this.constructor.__setInitialPropertyValues.call(this)}static __saveInitialPropertyValues(){this.__initialPropertyValues=new Map,(this.constructor.observedProperties||[]).map((t=>this.__initialPropertyValues.set(t,this[t])))}static __setInitialPropertyValues(){this.__initialPropertyValues.forEach(((t,e)=>{void 0!==t&&(this[e]=t)}))}static __initProperties(){this.constructor.__propertyAccessors={};(this.constructor.observedProperties||[]).map((t=>this.constructor.__initProperty.call(this,t)))}static __initProperty(t){this.constructor.__propertyAccessors[t]=this.__getPropertyDescriptor(this,t),Object.defineProperty(this,t,{set(e){this.constructor.__setProperty.call(this,t,e)},get(){return this.constructor.__getProperty.call(this,t)}})}static __getProperty(t){const e=this.constructor.__propertyAccessors[t]||{};return e.get?e.get.call(this,t):this[`#${t}`]}static __setProperty(t,e){const r=this.constructor.__propertyAccessors[t]||{},i=this[t];r.set?r.set.call(this,e):this[`#${t}`]=e,this.constructor.__propertyValueChanged.call(this,t,i,this[t])}static __propertyValueChanged(t,e,r){if(e!==r){try{if(JSON.stringify(e)===JSON.stringify(r))return}catch(t){}this.propertyChangedCallback&&this.propertyChangedCallback(t,e,r)}}__getPropertyDescriptor(t,e){if(t)return Object.getOwnPropertyDescriptor(t,e)||this.__getPropertyDescriptor(Object.getPrototypeOf(t),e)}},e=t=>class extends t{static get observedAttributes(){const t=[],e=this.DOMProperties||[];for(let r in e)t.push((this.propertyAttributeNames||{})[e[r]]||e[r].toLowerCase());return t}attributeChangedCallback(t,e,r){if(e===r)return;const i=this.constructor.__getPropertyNameByAttributeName.call(this,t);i&&this.constructor.__setDOMProperty.call(this,i,this[i],r)}static __getPropertyNameByAttributeName(t){const e=this.constructor.propertyAttributeNames;for(let r in e)if(e[r]===t)return r;const r=this.constructor.DOMProperties||[];for(let e in r)if(r[e].toLowerCase()===t)return r[e]}static __setDOMProperty(t,e,r){const i=(this.constructor.propertyFromAttributeConverters||{})[t];i&&(r=i.call(this,e,r)),this[t]=r}},r=t=>class extends t{connectedCallback(){for(var t in super.connectedCallback(),this.constructor.reflectedProperties){const e=this.constructor.reflectedProperties[t],r=this.constructor.__getAttributeNameByPropertyName.call(this,e);this.constructor.__setDOMAttribute.call(this,r,e,this[e])}}propertyChangedCallback(t,e,r){if(super.propertyChangedCallback&&super.propertyChangedCallback(t,e,r),!this.isConnected)return;if(!(-1!==(this.constructor.reflectedProperties||{}).indexOf(t)))return;const i=this.constructor.__getAttributeNameByPropertyName.call(this,t);this.constructor.__setDOMAttribute.call(this,i,t,r)}static __setDOMAttribute(t,e,r){const i=(this.constructor.propertyToAttributeConverters||{})[e];if(i&&(r=i.call(this,r)),null==r)return this.removeAttribute(t);this.setAttribute(t,r)}static __getAttributeNameByPropertyName(t){const e=this.constructor.reflectedProperties||[],r=this.constructor.propertyAttributeNames||{};if(-1===e.indexOf(t))return;return r[t]||t.toLowerCase()}},i=i=>class extends(r(e(t(i)))){static get properties(){return{}}static get observedProperties(){return Object.keys(this.__getFilteredProperties.call(this,"observe",!0))}static get DOMProperties(){return Object.keys(this.__getFilteredProperties.call(this,"DOM",!0))}static get reflectedProperties(){return Object.keys(this.__getFilteredProperties.call(this,"reflect",!0))}static get propertyChangedHandlers(){return this.__getPropertyValues.call(this,"changedHandler")}static get propertyAttributeNames(){const t={},e=this.properties;for(let r in e)t[r]=e[r].attributeName||r.toLowerCase();return t}static get propertyToAttributeConverters(){return this.__getPropertyValues.call(this,"toAttributeConverter")}static get propertyFromAttributeConverters(){return this.__getPropertyValues.call(this,"fromAttributeConverter")}static __getFilteredProperties(t,e){const r={},i=this.properties;for(let n in i)i[n][t]===e&&(r[n]=i[n]);return r}static __getPropertyValues(t){const e={},r=this.properties;for(let i in r)e[i]=r[i][t];return e}},n=t=>class extends t{propertyChangedCallback(t,e,r){super.propertyChangedCallback&&super.propertyChangedCallback(t,e,r),this.constructor.__callPropertyHandlers.call(this,t,e,r)}static __callPropertyHandlers(t,e,r){const i=(this.constructor.propertyChangedHandlers||{})[t];if(i&&i.constructor)if("Function"===i.constructor.name)i.call(this,e,r);else if("String"===i.constructor.name&&this[i])return this[i].call(this,e,r)}},s=t=>class extends t{propertiesChangedCallback(t,e,r){super.propertiesChangedCallback&&super.propertiesChangedCallback(t,e,r),this.constructor.__callMultiPropertyHandlers.call(this,t)}static __callMultiPropertyHandlers(t){const e=new Map,r=this.constructor.propertiesChangedHandlers||{};for(let i in t)for(let n in r){const s=r[n];-1!==s.indexOf(t[i])&&e.set(n,s)}e.forEach(((t,e)=>this[e].call(this,...t.map((t=>this[t])))))}static get propertiesChangedHandlers(){return{}}},o=t=>class extends t{propertyChangedCallback(t,e,r){super.propertyChangedCallback&&super.propertyChangedCallback(t,e,r),this.__changedProperties||(this.__changedProperties=new Map),this.constructor.__addChangedProperty.call(this,t,e)}static __addChangedProperty(t,e){this.__changedProperties.has(t)||this.__changedProperties.set(t,e),window.requestAnimationFrame(this.constructor.__invokeCallback.bind(this))}static __invokeCallback(){if(0===this.__changedProperties.size)return;const t={},e={};this.__changedProperties.forEach(((e,r)=>t[r]=e)),this.__changedProperties.forEach(((t,r)=>e[r]=this[r]));const r=Object.keys(t);this.__changedProperties.clear(),this.propertiesChangedCallback&&this.propertiesChangedCallback(r,t,e)}};function a(t,e){(function(t){return"string"==typeof t&&-1!==t.indexOf(".")&&1===parseFloat(t)})(t)&&(t="100%");var r=function(t){return"string"==typeof t&&-1!==t.indexOf("%")}(t);return t=360===e?t:Math.min(e,Math.max(0,parseFloat(t))),r&&(t=parseInt(String(t*e),10)/100),Math.abs(t-e)<1e-6?1:t=360===e?(t<0?t%e+e:t%e)/parseFloat(String(e)):t%e/parseFloat(String(e))}function l(t){return Math.min(1,Math.max(0,t))}function h(t){return t=parseFloat(t),(isNaN(t)||t<0||t>1)&&(t=1),t}function c(t){return t<=1?100*Number(t)+"%":t}function u(t){return 1===t.length?"0"+t:String(t)}function d(t,e,r){t=a(t,255),e=a(e,255),r=a(r,255);var i=Math.max(t,e,r),n=Math.min(t,e,r),s=0,o=0,l=(i+n)/2;if(i===n)o=0,s=0;else{var h=i-n;switch(o=l>.5?h/(2-i-n):h/(i+n),i){case t:s=(e-r)/h+(e<r?6:0);break;case e:s=(r-t)/h+2;break;case r:s=(t-e)/h+4}s/=6}return{h:s,s:o,l:l}}function p(t,e,r){return r<0&&(r+=1),r>1&&(r-=1),r<1/6?t+6*r*(e-t):r<.5?e:r<2/3?t+(e-t)*(2/3-r)*6:t}function g(t,e,r){t=a(t,255),e=a(e,255),r=a(r,255);var i=Math.max(t,e,r),n=Math.min(t,e,r),s=0,o=i,l=i-n,h=0===i?0:l/i;if(i===n)s=0;else{switch(i){case t:s=(e-r)/l+(e<r?6:0);break;case e:s=(r-t)/l+2;break;case r:s=(t-e)/l+4}s/=6}return{h:s,s:h,v:o}}function f(t,e,r,i){var n=[u(Math.round(t).toString(16)),u(Math.round(e).toString(16)),u(Math.round(r).toString(16))];return i&&n[0].startsWith(n[0].charAt(1))&&n[1].startsWith(n[1].charAt(1))&&n[2].startsWith(n[2].charAt(1))?n[0].charAt(0)+n[1].charAt(0)+n[2].charAt(0):n.join("")}function b(t){return m(t)/255}function m(t){return parseInt(t,16)}var v={aliceblue:"#f0f8ff",antiquewhite:"#faebd7",aqua:"#00ffff",aquamarine:"#7fffd4",azure:"#f0ffff",beige:"#f5f5dc",bisque:"#ffe4c4",black:"#000000",blanchedalmond:"#ffebcd",blue:"#0000ff",blueviolet:"#8a2be2",brown:"#a52a2a",burlywood:"#deb887",cadetblue:"#5f9ea0",chartreuse:"#7fff00",chocolate:"#d2691e",coral:"#ff7f50",cornflowerblue:"#6495ed",cornsilk:"#fff8dc",crimson:"#dc143c",cyan:"#00ffff",darkblue:"#00008b",darkcyan:"#008b8b",darkgoldenrod:"#b8860b",darkgray:"#a9a9a9",darkgreen:"#006400",darkgrey:"#a9a9a9",darkkhaki:"#bdb76b",darkmagenta:"#8b008b",darkolivegreen:"#556b2f",darkorange:"#ff8c00",darkorchid:"#9932cc",darkred:"#8b0000",darksalmon:"#e9967a",darkseagreen:"#8fbc8f",darkslateblue:"#483d8b",darkslategray:"#2f4f4f",darkslategrey:"#2f4f4f",darkturquoise:"#00ced1",darkviolet:"#9400d3",deeppink:"#ff1493",deepskyblue:"#00bfff",dimgray:"#696969",dimgrey:"#696969",dodgerblue:"#1e90ff",firebrick:"#b22222",floralwhite:"#fffaf0",forestgreen:"#228b22",fuchsia:"#ff00ff",gainsboro:"#dcdcdc",ghostwhite:"#f8f8ff",goldenrod:"#daa520",gold:"#ffd700",gray:"#808080",green:"#008000",greenyellow:"#adff2f",grey:"#808080",honeydew:"#f0fff0",hotpink:"#ff69b4",indianred:"#cd5c5c",indigo:"#4b0082",ivory:"#fffff0",khaki:"#f0e68c",lavenderblush:"#fff0f5",lavender:"#e6e6fa",lawngreen:"#7cfc00",lemonchiffon:"#fffacd",lightblue:"#add8e6",lightcoral:"#f08080",lightcyan:"#e0ffff",lightgoldenrodyellow:"#fafad2",lightgray:"#d3d3d3",lightgreen:"#90ee90",lightgrey:"#d3d3d3",lightpink:"#ffb6c1",lightsalmon:"#ffa07a",lightseagreen:"#20b2aa",lightskyblue:"#87cefa",lightslategray:"#778899",lightslategrey:"#778899",lightsteelblue:"#b0c4de",lightyellow:"#ffffe0",lime:"#00ff00",limegreen:"#32cd32",linen:"#faf0e6",magenta:"#ff00ff",maroon:"#800000",mediumaquamarine:"#66cdaa",mediumblue:"#0000cd",mediumorchid:"#ba55d3",mediumpurple:"#9370db",mediumseagreen:"#3cb371",mediumslateblue:"#7b68ee",mediumspringgreen:"#00fa9a",mediumturquoise:"#48d1cc",mediumvioletred:"#c71585",midnightblue:"#191970",mintcream:"#f5fffa",mistyrose:"#ffe4e1",moccasin:"#ffe4b5",navajowhite:"#ffdead",navy:"#000080",oldlace:"#fdf5e6",olive:"#808000",olivedrab:"#6b8e23",orange:"#ffa500",orangered:"#ff4500",orchid:"#da70d6",palegoldenrod:"#eee8aa",palegreen:"#98fb98",paleturquoise:"#afeeee",palevioletred:"#db7093",papayawhip:"#ffefd5",peachpuff:"#ffdab9",peru:"#cd853f",pink:"#ffc0cb",plum:"#dda0dd",powderblue:"#b0e0e6",purple:"#800080",rebeccapurple:"#663399",red:"#ff0000",rosybrown:"#bc8f8f",royalblue:"#4169e1",saddlebrown:"#8b4513",salmon:"#fa8072",sandybrown:"#f4a460",seagreen:"#2e8b57",seashell:"#fff5ee",sienna:"#a0522d",silver:"#c0c0c0",skyblue:"#87ceeb",slateblue:"#6a5acd",slategray:"#708090",slategrey:"#708090",snow:"#fffafa",springgreen:"#00ff7f",steelblue:"#4682b4",tan:"#d2b48c",teal:"#008080",thistle:"#d8bfd8",tomato:"#ff6347",turquoise:"#40e0d0",violet:"#ee82ee",wheat:"#f5deb3",white:"#ffffff",whitesmoke:"#f5f5f5",yellow:"#ffff00",yellowgreen:"#9acd32"};function y(t){var e,r,i,n={r:0,g:0,b:0},s=1,o=null,l=null,u=null,d=!1,g=!1;return"string"==typeof t&&(t=function(t){if(0===(t=t.trim().toLowerCase()).length)return!1;var e=!1;if(v[t])t=v[t],e=!0;else if("transparent"===t)return{r:0,g:0,b:0,a:0,format:"name"};var r=A.rgb.exec(t);if(r)return{r:r[1],g:r[2],b:r[3]};if(r=A.rgba.exec(t))return{r:r[1],g:r[2],b:r[3],a:r[4]};if(r=A.hsl.exec(t))return{h:r[1],s:r[2],l:r[3]};if(r=A.hsla.exec(t))return{h:r[1],s:r[2],l:r[3],a:r[4]};if(r=A.hsv.exec(t))return{h:r[1],s:r[2],v:r[3]};if(r=A.hsva.exec(t))return{h:r[1],s:r[2],v:r[3],a:r[4]};if(r=A.hex8.exec(t))return{r:m(r[1]),g:m(r[2]),b:m(r[3]),a:b(r[4]),format:e?"name":"hex8"};if(r=A.hex6.exec(t))return{r:m(r[1]),g:m(r[2]),b:m(r[3]),format:e?"name":"hex"};if(r=A.hex4.exec(t))return{r:m(r[1]+r[1]),g:m(r[2]+r[2]),b:m(r[3]+r[3]),a:b(r[4]+r[4]),format:e?"name":"hex8"};if(r=A.hex3.exec(t))return{r:m(r[1]+r[1]),g:m(r[2]+r[2]),b:m(r[3]+r[3]),format:e?"name":"hex"};return!1}(t)),"object"==typeof t&&(k(t.r)&&k(t.g)&&k(t.b)?(e=t.r,r=t.g,i=t.b,n={r:255*a(e,255),g:255*a(r,255),b:255*a(i,255)},d=!0,g="%"===String(t.r).substr(-1)?"prgb":"rgb"):k(t.h)&&k(t.s)&&k(t.v)?(o=c(t.s),l=c(t.v),n=function(t,e,r){t=6*a(t,360),e=a(e,100),r=a(r,100);var i=Math.floor(t),n=t-i,s=r*(1-e),o=r*(1-n*e),l=r*(1-(1-n)*e),h=i%6;return{r:255*[r,o,s,s,l,r][h],g:255*[l,r,r,o,s,s][h],b:255*[s,s,l,r,r,o][h]}}(t.h,o,l),d=!0,g="hsv"):k(t.h)&&k(t.s)&&k(t.l)&&(o=c(t.s),u=c(t.l),n=function(t,e,r){var i,n,s;if(t=a(t,360),e=a(e,100),r=a(r,100),0===e)n=r,s=r,i=r;else{var o=r<.5?r*(1+e):r+e-r*e,l=2*r-o;i=p(l,o,t+1/3),n=p(l,o,t),s=p(l,o,t-1/3)}return{r:255*i,g:255*n,b:255*s}}(t.h,o,u),d=!0,g="hsl"),Object.prototype.hasOwnProperty.call(t,"a")&&(s=t.a)),s=h(s),{ok:d,format:t.format||g,r:Math.min(255,Math.max(n.r,0)),g:Math.min(255,Math.max(n.g,0)),b:Math.min(255,Math.max(n.b,0)),a:s}}var _="(?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?)",x="[\\s|\\(]+("+_+")[,|\\s]+("+_+")[,|\\s]+("+_+")\\s*\\)?",w="[\\s|\\(]+("+_+")[,|\\s]+("+_+")[,|\\s]+("+_+")[,|\\s]+("+_+")\\s*\\)?",A={CSS_UNIT:new RegExp(_),rgb:new RegExp("rgb"+x),rgba:new RegExp("rgba"+w),hsl:new RegExp("hsl"+x),hsla:new RegExp("hsla"+w),hsv:new RegExp("hsv"+x),hsva:new RegExp("hsva"+w),hex3:/^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex6:/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,hex4:/^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex8:/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/};function k(t){return Boolean(A.CSS_UNIT.exec(String(t)))}var C=function(){function t(e,r){var i;if(void 0===e&&(e=""),void 0===r&&(r={}),e instanceof t)return e;"number"==typeof e&&(e=function(t){return{r:t>>16,g:(65280&t)>>8,b:255&t}}(e)),this.originalInput=e;var n=y(e);this.originalInput=e,this.r=n.r,this.g=n.g,this.b=n.b,this.a=n.a,this.roundA=Math.round(100*this.a)/100,this.format=null!==(i=r.format)&&void 0!==i?i:n.format,this.gradientType=r.gradientType,this.r<1&&(this.r=Math.round(this.r)),this.g<1&&(this.g=Math.round(this.g)),this.b<1&&(this.b=Math.round(this.b)),this.isValid=n.ok}return t.prototype.isDark=function(){return this.getBrightness()<128},t.prototype.isLight=function(){return!this.isDark()},t.prototype.getBrightness=function(){var t=this.toRgb();return(299*t.r+587*t.g+114*t.b)/1e3},t.prototype.getLuminance=function(){var t=this.toRgb(),e=t.r/255,r=t.g/255,i=t.b/255;return.2126*(e<=.03928?e/12.92:Math.pow((e+.055)/1.055,2.4))+.7152*(r<=.03928?r/12.92:Math.pow((r+.055)/1.055,2.4))+.0722*(i<=.03928?i/12.92:Math.pow((i+.055)/1.055,2.4))},t.prototype.getAlpha=function(){return this.a},t.prototype.setAlpha=function(t){return this.a=h(t),this.roundA=Math.round(100*this.a)/100,this},t.prototype.toHsv=function(){var t=g(this.r,this.g,this.b);return{h:360*t.h,s:t.s,v:t.v,a:this.a}},t.prototype.toHsvString=function(){var t=g(this.r,this.g,this.b),e=Math.round(360*t.h),r=Math.round(100*t.s),i=Math.round(100*t.v);return 1===this.a?"hsv("+e+", "+r+"%, "+i+"%)":"hsva("+e+", "+r+"%, "+i+"%, "+this.roundA+")"},t.prototype.toHsl=function(){var t=d(this.r,this.g,this.b);return{h:360*t.h,s:t.s,l:t.l,a:this.a}},t.prototype.toHslString=function(){var t=d(this.r,this.g,this.b),e=Math.round(360*t.h),r=Math.round(100*t.s),i=Math.round(100*t.l);return 1===this.a?"hsl("+e+", "+r+"%, "+i+"%)":"hsla("+e+", "+r+"%, "+i+"%, "+this.roundA+")"},t.prototype.toHex=function(t){return void 0===t&&(t=!1),f(this.r,this.g,this.b,t)},t.prototype.toHexString=function(t){return void 0===t&&(t=!1),"#"+this.toHex(t)},t.prototype.toHex8=function(t){return void 0===t&&(t=!1),function(t,e,r,i,n){var s,o=[u(Math.round(t).toString(16)),u(Math.round(e).toString(16)),u(Math.round(r).toString(16)),u((s=i,Math.round(255*parseFloat(s)).toString(16)))];return n&&o[0].startsWith(o[0].charAt(1))&&o[1].startsWith(o[1].charAt(1))&&o[2].startsWith(o[2].charAt(1))&&o[3].startsWith(o[3].charAt(1))?o[0].charAt(0)+o[1].charAt(0)+o[2].charAt(0)+o[3].charAt(0):o.join("")}(this.r,this.g,this.b,this.a,t)},t.prototype.toHex8String=function(t){return void 0===t&&(t=!1),"#"+this.toHex8(t)},t.prototype.toRgb=function(){return{r:Math.round(this.r),g:Math.round(this.g),b:Math.round(this.b),a:this.a}},t.prototype.toRgbString=function(){var t=Math.round(this.r),e=Math.round(this.g),r=Math.round(this.b);return 1===this.a?"rgb("+t+", "+e+", "+r+")":"rgba("+t+", "+e+", "+r+", "+this.roundA+")"},t.prototype.toPercentageRgb=function(){var t=function(t){return Math.round(100*a(t,255))+"%"};return{r:t(this.r),g:t(this.g),b:t(this.b),a:this.a}},t.prototype.toPercentageRgbString=function(){var t=function(t){return Math.round(100*a(t,255))};return 1===this.a?"rgb("+t(this.r)+"%, "+t(this.g)+"%, "+t(this.b)+"%)":"rgba("+t(this.r)+"%, "+t(this.g)+"%, "+t(this.b)+"%, "+this.roundA+")"},t.prototype.toName=function(){if(0===this.a)return"transparent";if(this.a<1)return!1;for(var t="#"+f(this.r,this.g,this.b,!1),e=0,r=Object.entries(v);e<r.length;e++){var i=r[e],n=i[0];if(t===i[1])return n}return!1},t.prototype.toString=function(t){var e=Boolean(t);t=null!=t?t:this.format;var r=!1,i=this.a<1&&this.a>=0;return e||!i||!t.startsWith("hex")&&"name"!==t?("rgb"===t&&(r=this.toRgbString()),"prgb"===t&&(r=this.toPercentageRgbString()),"hex"!==t&&"hex6"!==t||(r=this.toHexString()),"hex3"===t&&(r=this.toHexString(!0)),"hex4"===t&&(r=this.toHex8String(!0)),"hex8"===t&&(r=this.toHex8String()),"name"===t&&(r=this.toName()),"hsl"===t&&(r=this.toHslString()),"hsv"===t&&(r=this.toHsvString()),r||this.toHexString()):"name"===t&&0===this.a?this.toName():this.toRgbString()},t.prototype.toNumber=function(){return(Math.round(this.r)<<16)+(Math.round(this.g)<<8)+Math.round(this.b)},t.prototype.clone=function(){return new t(this.toString())},t.prototype.lighten=function(e){void 0===e&&(e=10);var r=this.toHsl();return r.l+=e/100,r.l=l(r.l),new t(r)},t.prototype.brighten=function(e){void 0===e&&(e=10);var r=this.toRgb();return r.r=Math.max(0,Math.min(255,r.r-Math.round(-e/100*255))),r.g=Math.max(0,Math.min(255,r.g-Math.round(-e/100*255))),r.b=Math.max(0,Math.min(255,r.b-Math.round(-e/100*255))),new t(r)},t.prototype.darken=function(e){void 0===e&&(e=10);var r=this.toHsl();return r.l-=e/100,r.l=l(r.l),new t(r)},t.prototype.tint=function(t){return void 0===t&&(t=10),this.mix("white",t)},t.prototype.shade=function(t){return void 0===t&&(t=10),this.mix("black",t)},t.prototype.desaturate=function(e){void 0===e&&(e=10);var r=this.toHsl();return r.s-=e/100,r.s=l(r.s),new t(r)},t.prototype.saturate=function(e){void 0===e&&(e=10);var r=this.toHsl();return r.s+=e/100,r.s=l(r.s),new t(r)},t.prototype.greyscale=function(){return this.desaturate(100)},t.prototype.spin=function(e){var r=this.toHsl(),i=(r.h+e)%360;return r.h=i<0?360+i:i,new t(r)},t.prototype.mix=function(e,r){void 0===r&&(r=50);var i=this.toRgb(),n=new t(e).toRgb(),s=r/100;return new t({r:(n.r-i.r)*s+i.r,g:(n.g-i.g)*s+i.g,b:(n.b-i.b)*s+i.b,a:(n.a-i.a)*s+i.a})},t.prototype.analogous=function(e,r){void 0===e&&(e=6),void 0===r&&(r=30);var i=this.toHsl(),n=360/r,s=[this];for(i.h=(i.h-(n*e>>1)+720)%360;--e;)i.h=(i.h+n)%360,s.push(new t(i));return s},t.prototype.complement=function(){var e=this.toHsl();return e.h=(e.h+180)%360,new t(e)},t.prototype.monochromatic=function(e){void 0===e&&(e=6);for(var r=this.toHsv(),i=r.h,n=r.s,s=r.v,o=[],a=1/e;e--;)o.push(new t({h:i,s:n,v:s})),s=(s+a)%1;return o},t.prototype.splitcomplement=function(){var e=this.toHsl(),r=e.h;return[this,new t({h:(r+72)%360,s:e.s,l:e.l}),new t({h:(r+216)%360,s:e.s,l:e.l})]},t.prototype.onBackground=function(e){var r=this.toRgb(),i=new t(e).toRgb();return new t({r:i.r+(r.r-i.r)*r.a,g:i.g+(r.g-i.g)*r.a,b:i.b+(r.b-i.b)*r.a})},t.prototype.triad=function(){return this.polyad(3)},t.prototype.tetrad=function(){return this.polyad(4)},t.prototype.polyad=function(e){for(var r=this.toHsl(),i=r.h,n=[this],s=360/e,o=1;o<e;o++)n.push(new t({h:(i+o*s)%360,s:r.s,l:r.l}));return n},t.prototype.equals=function(e){return this.toRgbString()===new t(e).toRgbString()},t}();
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
 */const S="undefined"!=typeof window&&null!=window.customElements&&void 0!==window.customElements.polyfillWrapFlushCallback,$=(t,e,r=null)=>{for(;e!==r;){const r=e.nextSibling;t.removeChild(e),e=r}},M=`{{lit-${String(Math.random()).slice(2)}}}`,P=`\x3c!--${M}--\x3e`,F=new RegExp(`${M}|${P}`);class N{constructor(t,e){this.parts=[],this.element=e;const r=[],i=[],n=document.createTreeWalker(e.content,133,null,!1);let s=0,o=-1,a=0;const{strings:l,values:{length:h}}=t;for(;a<h;){const t=n.nextNode();if(null!==t){if(o++,1===t.nodeType){if(t.hasAttributes()){const e=t.attributes,{length:r}=e;let i=0;for(let t=0;t<r;t++)D(e[t].name,"$lit$")&&i++;for(;i-- >0;){const e=l[a],r=I.exec(e)[2],i=r.toLowerCase()+"$lit$",n=t.getAttribute(i);t.removeAttribute(i);const s=n.split(F);this.parts.push({type:"attribute",index:o,name:r,strings:s}),a+=s.length-1}}"TEMPLATE"===t.tagName&&(i.push(t),n.currentNode=t.content)}else if(3===t.nodeType){const e=t.data;if(e.indexOf(M)>=0){const i=t.parentNode,n=e.split(F),s=n.length-1;for(let e=0;e<s;e++){let r,s=n[e];if(""===s)r=H();else{const t=I.exec(s);null!==t&&D(t[2],"$lit$")&&(s=s.slice(0,t.index)+t[1]+t[2].slice(0,-"$lit$".length)+t[3]),r=document.createTextNode(s)}i.insertBefore(r,t),this.parts.push({type:"node",index:++o})}""===n[s]?(i.insertBefore(H(),t),r.push(t)):t.data=n[s],a+=s}}else if(8===t.nodeType)if(t.data===M){const e=t.parentNode;null!==t.previousSibling&&o!==s||(o++,e.insertBefore(H(),t)),s=o,this.parts.push({type:"node",index:o}),null===t.nextSibling?t.data="":(r.push(t),o--),a++}else{let e=-1;for(;-1!==(e=t.data.indexOf(M,e+1));)this.parts.push({type:"node",index:-1}),a++}}else n.currentNode=i.pop()}for(const t of r)t.parentNode.removeChild(t)}}const D=(t,e)=>{const r=t.length-e.length;return r>=0&&t.slice(r)===e},E=t=>-1!==t.index,H=()=>document.createComment(""),I=/([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;function O(t,e){const{element:{content:r},parts:i}=t,n=document.createTreeWalker(r,133,null,!1);let s=R(i),o=i[s],a=-1,l=0;const h=[];let c=null;for(;n.nextNode();){a++;const t=n.currentNode;for(t.previousSibling===c&&(c=null),e.has(t)&&(h.push(t),null===c&&(c=t)),null!==c&&l++;void 0!==o&&o.index===a;)o.index=null!==c?-1:o.index-l,s=R(i,s),o=i[s]}h.forEach((t=>t.parentNode.removeChild(t)))}const V=t=>{let e=11===t.nodeType?0:1;const r=document.createTreeWalker(t,133,null,!1);for(;r.nextNode();)e++;return e},R=(t,e=-1)=>{for(let r=e+1;r<t.length;r++){const e=t[r];if(E(e))return r}return-1};
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
const T=new WeakMap,L=t=>"function"==typeof t&&T.has(t),q={},B={};
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
class j{constructor(t,e,r){this.__parts=[],this.template=t,this.processor=e,this.options=r}update(t){let e=0;for(const r of this.__parts)void 0!==r&&r.setValue(t[e]),e++;for(const t of this.__parts)void 0!==t&&t.commit()}_clone(){const t=S?this.template.element.content.cloneNode(!0):document.importNode(this.template.element.content,!0),e=[],r=this.template.parts,i=document.createTreeWalker(t,133,null,!1);let n,s=0,o=0,a=i.nextNode();for(;s<r.length;)if(n=r[s],E(n)){for(;o<n.index;)o++,"TEMPLATE"===a.nodeName&&(e.push(a),i.currentNode=a.content),null===(a=i.nextNode())&&(i.currentNode=e.pop(),a=i.nextNode());if("node"===n.type){const t=this.processor.handleTextExpression(this.options);t.insertAfterNode(a.previousSibling),this.__parts.push(t)}else this.__parts.push(...this.processor.handleAttributeExpressions(a,n.name,n.strings,this.options));s++}else this.__parts.push(void 0),s++;return S&&(document.adoptNode(t),customElements.upgrade(t)),t}}
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
 */const z=window.trustedTypes&&trustedTypes.createPolicy("lit-html",{createHTML:t=>t}),W=` ${M} `;class K{constructor(t,e,r,i){this.strings=t,this.values=e,this.type=r,this.processor=i}getHTML(){const t=this.strings.length-1;let e="",r=!1;for(let i=0;i<t;i++){const t=this.strings[i],n=t.lastIndexOf("\x3c!--");r=(n>-1||r)&&-1===t.indexOf("--\x3e",n+1);const s=I.exec(t);e+=null===s?t+(r?W:P):t.substr(0,s.index)+s[1]+s[2]+"$lit$"+s[3]+M}return e+=this.strings[t],e}getTemplateElement(){const t=document.createElement("template");let e=this.getHTML();return void 0!==z&&(e=z.createHTML(e)),t.innerHTML=e,t}}
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
 */const U=t=>null===t||!("object"==typeof t||"function"==typeof t),G=t=>Array.isArray(t)||!(!t||!t[Symbol.iterator]);class J{constructor(t,e,r){this.dirty=!0,this.element=t,this.name=e,this.strings=r,this.parts=[];for(let t=0;t<r.length-1;t++)this.parts[t]=this._createPart()}_createPart(){return new X(this)}_getValue(){const t=this.strings,e=t.length-1,r=this.parts;if(1===e&&""===t[0]&&""===t[1]){const t=r[0].value;if("symbol"==typeof t)return String(t);if("string"==typeof t||!G(t))return t}let i="";for(let n=0;n<e;n++){i+=t[n];const e=r[n];if(void 0!==e){const t=e.value;if(U(t)||!G(t))i+="string"==typeof t?t:String(t);else for(const e of t)i+="string"==typeof e?e:String(e)}}return i+=t[e],i}commit(){this.dirty&&(this.dirty=!1,this.element.setAttribute(this.name,this._getValue()))}}class X{constructor(t){this.value=void 0,this.committer=t}setValue(t){t===q||U(t)&&t===this.value||(this.value=t,L(t)||(this.committer.dirty=!0))}commit(){for(;L(this.value);){const t=this.value;this.value=q,t(this)}this.value!==q&&this.committer.commit()}}class Y{constructor(t){this.value=void 0,this.__pendingValue=void 0,this.options=t}appendInto(t){this.startNode=t.appendChild(H()),this.endNode=t.appendChild(H())}insertAfterNode(t){this.startNode=t,this.endNode=t.nextSibling}appendIntoPart(t){t.__insert(this.startNode=H()),t.__insert(this.endNode=H())}insertAfterPart(t){t.__insert(this.startNode=H()),this.endNode=t.endNode,t.endNode=this.startNode}setValue(t){this.__pendingValue=t}commit(){if(null===this.startNode.parentNode)return;for(;L(this.__pendingValue);){const t=this.__pendingValue;this.__pendingValue=q,t(this)}const t=this.__pendingValue;t!==q&&(U(t)?t!==this.value&&this.__commitText(t):t instanceof K?this.__commitTemplateResult(t):t instanceof Node?this.__commitNode(t):G(t)?this.__commitIterable(t):t===B?(this.value=B,this.clear()):this.__commitText(t))}__insert(t){this.endNode.parentNode.insertBefore(t,this.endNode)}__commitNode(t){this.value!==t&&(this.clear(),this.__insert(t),this.value=t)}__commitText(t){const e=this.startNode.nextSibling,r="string"==typeof(t=null==t?"":t)?t:String(t);e===this.endNode.previousSibling&&3===e.nodeType?e.data=r:this.__commitNode(document.createTextNode(r)),this.value=t}__commitTemplateResult(t){const e=this.options.templateFactory(t);if(this.value instanceof j&&this.value.template===e)this.value.update(t.values);else{const r=new j(e,t.processor,this.options),i=r._clone();r.update(t.values),this.__commitNode(i),this.value=r}}__commitIterable(t){Array.isArray(this.value)||(this.value=[],this.clear());const e=this.value;let r,i=0;for(const n of t)r=e[i],void 0===r&&(r=new Y(this.options),e.push(r),0===i?r.appendIntoPart(this):r.insertAfterPart(e[i-1])),r.setValue(n),r.commit(),i++;i<e.length&&(e.length=i,this.clear(r&&r.endNode))}clear(t=this.startNode){$(this.startNode.parentNode,t.nextSibling,this.endNode)}}class Q{constructor(t,e,r){if(this.value=void 0,this.__pendingValue=void 0,2!==r.length||""!==r[0]||""!==r[1])throw new Error("Boolean attributes can only contain a single expression");this.element=t,this.name=e,this.strings=r}setValue(t){this.__pendingValue=t}commit(){for(;L(this.__pendingValue);){const t=this.__pendingValue;this.__pendingValue=q,t(this)}if(this.__pendingValue===q)return;const t=!!this.__pendingValue;this.value!==t&&(t?this.element.setAttribute(this.name,""):this.element.removeAttribute(this.name),this.value=t),this.__pendingValue=q}}class Z extends J{constructor(t,e,r){super(t,e,r),this.single=2===r.length&&""===r[0]&&""===r[1]}_createPart(){return new tt(this)}_getValue(){return this.single?this.parts[0].value:super._getValue()}commit(){this.dirty&&(this.dirty=!1,this.element[this.name]=this._getValue())}}class tt extends X{}let et=!1;(()=>{try{const t={get capture(){return et=!0,!1}};window.addEventListener("test",t,t),window.removeEventListener("test",t,t)}catch(t){}})();class rt{constructor(t,e,r){this.value=void 0,this.__pendingValue=void 0,this.element=t,this.eventName=e,this.eventContext=r,this.__boundHandleEvent=t=>this.handleEvent(t)}setValue(t){this.__pendingValue=t}commit(){for(;L(this.__pendingValue);){const t=this.__pendingValue;this.__pendingValue=q,t(this)}if(this.__pendingValue===q)return;const t=this.__pendingValue,e=this.value,r=null==t||null!=e&&(t.capture!==e.capture||t.once!==e.once||t.passive!==e.passive),i=null!=t&&(null==e||r);r&&this.element.removeEventListener(this.eventName,this.__boundHandleEvent,this.__options),i&&(this.__options=it(t),this.element.addEventListener(this.eventName,this.__boundHandleEvent,this.__options)),this.value=t,this.__pendingValue=q}handleEvent(t){"function"==typeof this.value?this.value.call(this.eventContext||this.element,t):this.value.handleEvent(t)}}const it=t=>t&&(et?{capture:t.capture,passive:t.passive,once:t.once}:t.capture)
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
 */;function nt(t){let e=st.get(t.type);void 0===e&&(e={stringsArray:new WeakMap,keyString:new Map},st.set(t.type,e));let r=e.stringsArray.get(t.strings);if(void 0!==r)return r;const i=t.strings.join(M);return r=e.keyString.get(i),void 0===r&&(r=new N(t,t.getTemplateElement()),e.keyString.set(i,r)),e.stringsArray.set(t.strings,r),r}const st=new Map,ot=new WeakMap;
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
 */const at=new
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
class{handleAttributeExpressions(t,e,r,i){const n=e[0];if("."===n){return new Z(t,e.slice(1),r).parts}if("@"===n)return[new rt(t,e.slice(1),i.eventContext)];if("?"===n)return[new Q(t,e.slice(1),r)];return new J(t,e,r).parts}handleTextExpression(t){return new Y(t)}};
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
 */"undefined"!=typeof window&&(window.litHtmlVersions||(window.litHtmlVersions=[])).push("1.4.1");const lt=(t,...e)=>new K(t,e,"html",at)
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
 */,ht=(t,e)=>`${t}--${e}`;let ct=!0;void 0===window.ShadyCSS?ct=!1:void 0===window.ShadyCSS.prepareTemplateDom&&(console.warn("Incompatible ShadyCSS version detected. Please update to at least @webcomponents/webcomponentsjs@2.0.2 and @webcomponents/shadycss@1.3.1."),ct=!1);const ut=t=>e=>{const r=ht(e.type,t);let i=st.get(r);void 0===i&&(i={stringsArray:new WeakMap,keyString:new Map},st.set(r,i));let n=i.stringsArray.get(e.strings);if(void 0!==n)return n;const s=e.strings.join(M);if(n=i.keyString.get(s),void 0===n){const r=e.getTemplateElement();ct&&window.ShadyCSS.prepareTemplateDom(r,t),n=new N(e,r),i.keyString.set(s,n)}return i.stringsArray.set(e.strings,n),n},dt=["html","svg"],pt=new Set,gt=(t,e,r)=>{pt.add(t);const i=r?r.element:document.createElement("template"),n=e.querySelectorAll("style"),{length:s}=n;if(0===s)return void window.ShadyCSS.prepareTemplateStyles(i,t);const o=document.createElement("style");for(let t=0;t<s;t++){const e=n[t];e.parentNode.removeChild(e),o.textContent+=e.textContent}(t=>{dt.forEach((e=>{const r=st.get(ht(e,t));void 0!==r&&r.keyString.forEach((t=>{const{element:{content:e}}=t,r=new Set;Array.from(e.querySelectorAll("style")).forEach((t=>{r.add(t)})),O(t,r)}))}))})(t);const a=i.content;r?function(t,e,r=null){const{element:{content:i},parts:n}=t;if(null==r)return void i.appendChild(e);const s=document.createTreeWalker(i,133,null,!1);let o=R(n),a=0,l=-1;for(;s.nextNode();)for(l++,s.currentNode===r&&(a=V(e),r.parentNode.insertBefore(e,r));-1!==o&&n[o].index===l;){if(a>0){for(;-1!==o;)n[o].index+=a,o=R(n,o);return}o=R(n,o)}}(r,o,a.firstChild):a.insertBefore(o,a.firstChild),window.ShadyCSS.prepareTemplateStyles(i,t);const l=a.querySelector("style");if(window.ShadyCSS.nativeShadow&&null!==l)e.insertBefore(l.cloneNode(!0),e.firstChild);else if(r){a.insertBefore(o,a.firstChild);const t=new Set;t.add(o),O(r,t)}},ft=(t,e,r)=>{if(!r||"object"!=typeof r||!r.scopeName)throw new Error("The `scopeName` option is required.");const i=r.scopeName,n=ot.has(e),s=ct&&11===e.nodeType&&!!e.host,o=s&&!pt.has(i),a=o?document.createDocumentFragment():e;if(((t,e,r)=>{let i=ot.get(e);void 0===i&&($(e,e.firstChild),ot.set(e,i=new Y(Object.assign({templateFactory:nt},r))),i.appendInto(e)),i.setValue(t),i.commit()})(t,a,Object.assign({templateFactory:ut(i)},r)),o){const t=ot.get(a);ot.delete(a);const r=t.value instanceof j?t.value.template:void 0;gt(i,a,r),$(e,e.firstChild),e.appendChild(a),ot.set(e,t)}!n&&s&&window.ShadyCSS.styleElement(e.host)},bt={fromAttribute:(t,e)=>""===e,toAttribute:t=>{if(t)return""}},mt={fromAttribute:(t,e)=>t||e?""===e?null:e?Number(e):e:t,toAttribute:t=>{if(!isNaN(t))return t}},vt={fromAttribute:(t,e)=>t||e?e?String(e):e:t,toAttribute:t=>{if(""!==t)return t}};class yt extends(i(HTMLElement)){static get properties(){return{accept:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:vt.fromAttribute,toAttributeConverter:vt.toAttribute},accessKey:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:vt.fromAttribute,toAttributeConverter:vt.toAttribute},alt:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:vt.fromAttribute,toAttributeConverter:vt.toAttribute},autocomplete:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:bt.fromAttribute,toAttributeConverter:bt.toAttribute},autofocus:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:bt.fromAttribute,toAttributeConverter:bt.toAttribute},capture:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:vt.fromAttribute,toAttributeConverter:vt.toAttribute},checked:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:bt.fromAttribute,toAttributeConverter:bt.toAttribute},dirname:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:vt.fromAttribute,toAttributeConverter:vt.toAttribute},disabled:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:bt.fromAttribute,toAttributeConverter:bt.toAttribute},height:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:mt.fromAttribute,toAttributeConverter:mt.toAttribute},inputmode:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:vt.fromAttribute,toAttributeConverter:vt.toAttribute},max:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:mt.fromAttribute,toAttributeConverter:mt.toAttribute},maxlength:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:mt.fromAttribute,toAttributeConverter:mt.toAttribute},name:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:vt.fromAttribute,toAttributeConverter:vt.toAttribute},min:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:mt.fromAttribute,toAttributeConverter:mt.toAttribute},minlength:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:mt.fromAttribute,toAttributeConverter:mt.toAttribute},multiple:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:bt.fromAttribute,toAttributeConverter:bt.toAttribute},pattern:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:vt.fromAttribute,toAttributeConverter:vt.toAttribute},placeholder:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:vt.fromAttribute,toAttributeConverter:vt.toAttribute},readonly:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:bt.fromAttribute,toAttributeConverter:bt.toAttribute},required:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:bt.fromAttribute,toAttributeConverter:bt.toAttribute},size:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:mt.fromAttribute,toAttributeConverter:mt.toAttribute},src:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:vt.fromAttribute,toAttributeConverter:vt.toAttribute},step:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:mt.fromAttribute,toAttributeConverter:mt.toAttribute},width:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:mt.fromAttribute,toAttributeConverter:mt.toAttribute},tabIndex:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:mt.fromAttribute,toAttributeConverter:mt.toAttribute},type:{observe:!0,DOM:!0,reflect:!0,fromAttributeConverter:vt.fromAttribute,toAttributeConverter:vt.toAttribute},value:{observe:!0,DOM:!0,fromAttributeConverter:vt.fromAttribute,toAttributeConverter:vt.toAttribute},__elementFocused:{observe:!0}}}constructor(){super();const t=document.createElement("input");this.accept=t.accept,this.accessKey=t.accessKey,this.alt=t.alt,this.autocomplete=t.autocomplete,this.autofocus=t.autofocus,this.capture=t.capture,this.checked=t.checked,this.dirname=t.dirname,this.disabled=t.disabled,this.height=t.height,this.inputmode=t.inputmode,this.max=t.max,this.maxlength=t.maxlength,this.min=t.min,this.minlength=t.minlength,this.multiple=t.multiple,this.name=t.name,this.pattern=t.pattern,this.placeholder=t.placeholder,this.readonly=t.readonly,this.required=t.required,this.size=t.size,this.src=t.src,this.step=t.step,this.tabIndex=t.tabIndex,this.width=t.width,this.type=t.type,this.value=t.value,this.__elementFocused=!1,this.attachShadow({mode:"open",delegatesFocus:this.__delegatesFocus}),this.render(),this.__delegatesFocus||this.addEventListener("focus",(()=>this.$element.focus()))}propertyChangedCallback(t,e,r){super.propertyChangedCallback(t,e,r),this.render()}get styles(){return lt`
      <style>
        :host { outline: none }

        input:invalid {
          border: 1px solid red;
        }
      </style>
    `}get template(){return lt`
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
      @focus="${()=>this.__elementFocused=!0}"
      @blur="${()=>this.__elementFocused=!1}"
      @input="${this.__handleInput}"
      @change="${this.__handleChange}"
      >
    `}render(){!0!==this.__elementFocused&&window.requestAnimationFrame((()=>{ft(this.template,this.shadowRoot,{eventContext:this,scopeName:this.localName})}))}get accessKey(){return this._accessKey}set accessKey(t){this._accessKey=t}get list(){return this.$element.list}get tabIndex(){return!0===this.disabled?-1:this._tabIndex}set tabIndex(t){this._tabIndex=parseInt(t)}get validationMessage(){return this.$element.validationMessage}get validity(){return this.$element.validity}get willValidate(){return this.$element.willValidate}checkValidity(){return this.$element.checkValidity()}reportValidity(){return this.$element.reportValidity()}select(){return this.$element.select()}setCustomValidity(t){this.$element.setCustomValidity(t)}setRangeText(){this.$element.setRangeText(...arguments)}setSelectionRange(){this.$element.setSelectionRange(...arguments)}stepDown(){this.$element.stepDown(),this.value=this.$element.value}stepUp(){this.$element.stepUp(),this.value=this.$element.value}get $element(){return this.shadowRoot&&this.shadowRoot.querySelector("input")||{}}get __delegatesFocus(){const t=document.createElement("div");return t.attachShadow({mode:"open",delegatesFocus:!0}),t.shadowRoot.delegatesFocus||!1}__handleInput(t){this.value=t.target.value,this.checked=t.target.checked}__handleChange(t){this.value=t.target.value,this.checked=t.target.checked,this.dispatchEvent(new CustomEvent("change",{bubbles:!0,composed:!0}))}}const _t=t=>{!function(){if(!0===window.__focusVisiblePolyFillReady)return;window.addEventListener("keydown",(t=>window.__focusVisiblePolyFillLastKeyDown=t.key)),window.addEventListener("mousedown",(()=>window.__focusVisiblePolyFillLastKeyDown=null)),window.addEventListener("pointerdown",(()=>window.__focusVisiblePolyFillLastKeyDown=null)),window.addEventListener("touchdown",(()=>window.__focusVisiblePolyFillLastKeyDown=null)),window.__focusVisiblePolyFillReady=!0}(),t.addEventListener("focus",xt.bind(t)),t.addEventListener("blur",kt.bind(t))};function xt(){if("Tab"===window.__focusVisiblePolyFillLastKeyDown)return wt.call(this);At.call(this)}function wt(){this.classList.add("focus-visible")}function At(){this.classList.remove("focus-visible")}function kt(){At.call(this)}class Ct extends(n(yt)){static get properties(){return{...super.properties,label:{observe:!0,changedHandler:"_labelChanged"}}}get styles(){return lt`
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
    `}get _thumbStyles(){return"\n      height: 14px;\n      width: 14px;\n      background: transparent;\n      border: 2px solid white;\n      box-shadow: 0 0 2px rgba(0,0,0,0.4), inset 0 0 2px rgba(0,0,0,0.4);\n      border-radius: 50%;\n      box-sizing: border-box;\n      content: '';\n    "}get _trackStyles(){return"\n      height: 100%;\n      width: 100%;\n      background: transparent;\n    "}constructor(){super(),_t(this)}connectedCallback(){super.connectedCallback&&super.connectedCallback(),window.requestAnimationFrame((()=>{this._labelChanged(),this.$element.addEventListener("change",this._handleChange.bind(this))}))}disconnectedCallback(){super.disconnectedCallback&&super.disconnectedCallback(),this.$element.removeEventListener("change",this._handleChange.bind(this))}get type(){return"range"}_labelChanged(){this.$element.setAttribute&&this.$element.setAttribute("aria-label",this.label)}_handleChange(t){const e=document.createEvent("CustomEvent");e.initCustomEvent("change",t.bubbles,t.cancelable,t.detail),this.dispatchEvent(e)}}window.customElements.define("color-picker-slider",Ct);class St extends(s(o(n(i(HTMLElement))))){static get properties(){return{value:{observe:!0,DOM:!0,changedHandler:"_valueChanged"},no_alpha:{observe:!1,DOM:!0,changedHandler:"_noAlphaChanged"},formats:{observe:!0,DOM:!0,fromAttributeConverter:function(t,e){return e.replace(/\s+/g,"").split(",")},changedHandler:"_formatsChanged"},selectedFormat:{observe:!0,DOM:!0,changedHandler:"_selectedFormatChanged"},_pointerDown:{observe:!0},_sliderDown:{observe:!0}}}get value(){if(this.color)return"hex"===this.selectedFormat?this.color.toHexString():"hex8"===this.selectedFormat?this.color.toHex8String():"hsl"===this.selectedFormat?this.color.toHslString():"hsv"===this.selectedFormat?this.color.toHsvString():this.color.toRgbString()}set value(t){this["#value"]=new C(t)}get color(){return this["#value"]}set formats(t){if("Array"!==t.constructor.name)return;const e=[];for(var r in t)-1!==this.supportedFormats.indexOf(t[r])&&e.push(t[r]);this["#formats"]=[...e]}get supportedFormats(){return["hex","hex8","rgb","hsv","hsl"]}get selectedFormat(){return this["#selectedFormat"]}set selectedFormat(t){-1!==(this.formats||[]).indexOf(t)&&(this["#selectedFormat"]=t)}get hsv(){return this.color.toHsv()}get alpha(){return this.color.getAlpha()}set alpha(t){const e=this.color;this.color.setAlpha(t),this.propertyChangedCallback("value",e,this.color)}get hex(){return this.color.toHex()}get hex8(){return this.color.toHex8()}get rgb(){return this.color.toRgb()}get hsl(){return this.color.toHsl()}get _gridGradient(){return"hsl"===this.selectedFormat?"linear-gradient(to bottom, hsl(0, 0%, 100%) 0%, hsla(0, 0%, 100%, 0) 50%, hsla(0, 0%, 0%, 0) 50%, hsl(0, 0%, 0%) 100%), linear-gradient(to right, hsl(0, 0%, 50%) 0%, hsla(0, 0%, 50%, 0) 100%)":"linear-gradient(rgba(0,0,0,0) 0%, #000 100%), linear-gradient(to left, rgba(255,255,255,0) 0%, #fff 100%)"}constructor(){super(),this.attachShadow({mode:"open"}),this.value={h:0,s:1,v:1},this.selectedFormat="rgb",this._pointerDown=!1,this._sliderDown=!1,this.formats=this.supportedFormats,this.no_alpha=this.getAttribute("no_alpha"),window.addEventListener("mouseup",this._handleMouseup.bind(this),!1),window.addEventListener("mousemove",this._handleMousemove.bind(this),!1),_t(this._$grid),this._valueChanged(),this.shadowRoot.querySelectorAll("input, select").forEach((t=>_t(t)))}connectedCallback(){super.connectedCallback(),this.selectedFormat=this.color.format,this._valueChanged()}propertyChangedCallback(t,e,r){super.propertyChangedCallback(t,e,r),ft(this.template,this.shadowRoot,{eventContext:this,scopeName:this.localName})}static get propertiesChangedHandlers(){return{_notifyChanges:["value","_pointerDown","_sliderDown"]}}get template(){return lt`

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
          justify-content: center;
          margin-right: 8px;
        }

        color-picker-slider {
          position: relative;
        }

        color-picker-slider + color-picker-slider {
          margin-top: 8px;
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
          flex-grow: 1;
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
          flex: 1 0 0;
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
          aria-label="change saturation and ${"hsl"===this.selectedFormat?"light":"value"}"
          aria-valuemin="0"
          aria-valuemax="1.00"
          aria-orientation="vertical"
          aria-valuetext="saturation ${this.hsv.s.toFixed(2)} ${"hsl"===this.selectedFormat?`light ${this.hsl.l.toFixed(2)}`:`value ${this.hsv.v.toFixed(2)}`}"
          @mousedown="${this._handleMousedown}"
          @keydown="${this._handleGridKeydown}"
        ><div class="overlay"><div class="thumb"></div></div></section>

        <section id="sliderInput">
          <div id="sliders">
            <color-picker-slider tabindex="0" .label="${"change hue"}" id="hueInput" .value="${this.hsv.h}" min="0" max="359" step="1" data-scheme="hsv" data-key="h" @input="${this._handleHueSliderInput}" @change="${this._handleHueSliderInput}" @mousedown="${()=>this._sliderDown=!0}" @mouseup="${()=>this._sliderDown=!1}"></color-picker-slider>
            <color-picker-slider tabindex="0" .label="${"change alpha"}" id="alphaInput" class="absbefore absafter checkerboard" ?hidden="${"true"==this.no_alpha}" .value="${100*this.alpha}" min="0" max="100" step="1" @input="${this._handleAlphaSliderInput}" @change="${this._handleAlphaSliderInput}" @mousedown="${()=>this._sliderDown=!0}" @mouseup="${()=>this._sliderDown=!1}"></color-picker-slider>
          </div>
          <div id="colorSteel" class="checkerboard absbefore">
            <div class="inner"></div>
          </div>
        </section>

        <section id="textInput">

          <select aria-label="select color scheme" .selectedIndex="${(this.formats||[]).indexOf(this.selectedFormat)}" @change="${this._handleSelectChange}" @input="${t=>t.stopPropagation()}">
            ${(this.formats||[]).map((t=>lt`
              <option .value="${t}">${t.toUpperCase()}</option>
            `))}
          </select>

          <div ?hidden="${"hsv"!==this.selectedFormat}" class="color-input">
            <label data-name="h"><input aria-label="change hue" type="number" .value="${Math.round(this.hsv.h)}" min="0" max="359" step="1" data-scheme="hsv", data-key="h" @input="${this._handleInput}"></label>
            <label data-name="s"><input aria-label="change saturation" type="number" .value="${Math.round(100*this.hsv.s)}" min="0" max="100" step="1" data-scheme="hsv", data-key="s" @input="${this._handleInput}"></label>
            <label data-name="v"><input aria-label="change value / brightness" type="number" .value="${Math.round(100*this.hsv.v)}" min="0" max="100" step="1" data-scheme="hsv", data-key="v" @input="${this._handleInput}"></label>
            <label ?hidden="${"true"==this.no_alpha}" data-name="%"><input aria-label="change alpha" type="number" .value="${Math.round(100*this.alpha)}" min="0" max="100" step="1" data-scheme="alpha" @input="${this._handleAlphaInput}"></label>
          </div>

          <div ?hidden="${"hsl"!==this.selectedFormat}" class="color-input">
            <label data-name="h"><input aria-label="change hue" type="number" .value="${Math.round(this.hsl.h)}" min="0" max="359" step="1" data-scheme="hsl", data-key="h" @input="${this._handleInput}"></label>
            <label data-name="s"><input aria-label="change saturation" type="number" .value="${Math.round(100*this.hsl.s)}" min="0" max="100" step="1" data-scheme="hsl", data-key="s" @input="${this._handleInput}"></label>
            <label data-name="l"><input aria-label="change light" type="number" .value="${Math.round(100*this.hsl.l)}" min="0" max="100" step="1" data-scheme="hsl", data-key="l" @input="${this._handleInput}"></label>
            <label ?hidden="${"true"==this.no_alpha}" data-name="%"><input aria-label="change alpha" type="number" .value="${Math.round(100*this.alpha)}" min="0" max="100" step="1" data-scheme="alpha" @input="${this._handleAlphaInput}"></label>
          </div>

          <div ?hidden="${"rgb"!==this.selectedFormat}" class="color-input">
            <label data-name="r"><input aria-label="change red" type="number" .value="${this.rgb.r}" min="0" max="255" step="1" data-scheme="rgb", data-key="r" @input="${this._handleInput}"></label>
            <label data-name="g"><input aria-label="change green" type="number" .value="${this.rgb.g}" min="0" max="255" step="1" data-scheme="rgb", data-key="g" @input="${this._handleInput}"></label>
            <label data-name="b"><input aria-label="change blue" type="number" .value="${this.rgb.b}" min="0" max="255" step="1" data-scheme="rgb", data-key="b" @input="${this._handleInput}"></label>
            <label ?hidden="${"true"==this.no_alpha}" data-name="%"><input aria-label="change alpha" type="number" .value="${Math.round(100*this.alpha)}" min="0" max="100" step="1" data-scheme="alpha" @input="${this._handleAlphaInput}"></label>
          </div>

          <div ?hidden="${"hex"!==this.selectedFormat}" class="color-input">
            <label data-name="#"><input aria-label="change hex" type="text" .value="${this.hex}" data-scheme="hex" maxlength="6" @change="${this._handleInput}" @input="${t=>t.stopPropagation()}"></label>
            <label ?hidden="${"true"==this.no_alpha}" data-name="%"><input aria-label="change alpha" type="number" .value="${Math.round(100*this.alpha)}" min="0" max="100" step="1" data-scheme="alpha" @input="${this._handleAlphaInput}"></label>
          </div>

          <div ?hidden="${"hex8"!==this.selectedFormat}" class="color-input">
          <label data-name="#"><input aria-label="change hex8" type="text" .value="${this.hex8}" data-scheme="hex8" maxlength="8" @change="${this._handleInput}" @input="${t=>t.stopPropagation()}"></label>
          </div>

        </section>
      </div>
    `}_handleInput(t){t.stopPropagation();const e=t.target.dataset.scheme,r=t.target.dataset.key,i=t.target.value;let n=this[e];r?n[r]=Math.round(i):n=i,this.value=n}_handleHueSliderInput(t){this._handleInput(t),this.propertyChangedCallback("value")}_handleAlphaSliderInput(t){t.stopPropagation(),this.alpha=t.target.value/100}_handleAlphaInput(t){t.stopPropagation(),this.alpha=t.target.value/100}_handleSelectChange(t){this.selectedFormat=t.target.value}_handleMouseup(){this._pointerDown=!1}_handleMousemove(t){if(!this._pointerDown)return;const{x:e,y:r}=this.getBoundingClientRect(),i=Math.round(t.clientX-e),n=Math.round(t.clientY-r),s=Math.min(Math.max(i/this._$grid.offsetWidth,0),1),o=1-Math.min(Math.max(n/this._$grid.offsetHeight,0),1);"hsl"===this.selectedFormat?this.value={...this.color.toHsl(),s:s,l:o}:this.value={...this.color.toHsv(),s:s,v:o}}_handleMousedown(t){this._pointerDown=!0,this._handleMousemove(t)}_handleGridKeydown(t){if(-1===["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End","PageUp","PageDown"].indexOf(t.key))return;t.preventDefault();const e=this.color.toHsl(),r=this.color.toHsv();return t.key.indexOf()&&"ArrowLeft"===t.key?this.value="hsl"===this.selectedFormat?{...e,s:e.s-.01}:{...r,s:r.s-.01}:"ArrowRight"===t.key?this.value="hsl"===this.selectedFormat?{...e,s:e.s+.01}:{...r,s:r.s+.01}:"ArrowUp"===t.key?this.value="hsl"===this.selectedFormat?{...e,l:e.l+.01}:{...r,v:r.v+.01}:"ArrowDown"===t.key?this.value="hsl"===this.selectedFormat?{...e,l:e.l-.01}:{...r,v:r.v-.01}:"Home"===t.key?this.value="hsl"===this.selectedFormat?{...e,s:e.s-.1}:{...r,s:r.s-.1}:"End"===t.key?this.value="hsl"===this.selectedFormat?{...e,s:e.s+.1}:{...r,s:r.s+.1}:"PageUp"===t.key?this.value="hsl"===this.selectedFormat?{...e,l:e.l+.1}:{...r,v:r.v+.1}:"PageDown"===t.key?this.value="hsl"===this.selectedFormat?{...e,l:e.l-.1}:{...r,v:r.v-.1}:void 0}_valueChanged(){this._setGridThumbPosition(),this._setHighlightColors(),this._setColorSteelColor(),this._setAlphaSliderBackground()}_setColorSteelColor(){this._$container&&this._setCSSProperty("background",this.color.toRgbString(),this._$colorSteel.querySelector(".inner"))}_setAlphaSliderBackground(){this._$container&&this._setCSSProperty("--color-picker-alpha-slider-background",this._alphaSliderBackground,this._$container)}get _gridBackground(){return new C({h:this.shadowRoot.querySelector("#hueInput").value,s:1,v:1}).toRgbString()}get _alphaSliderBackground(){const t=new C(this.value);return`linear-gradient(to right, ${t.setAlpha(0).toRgbString()} 0%, ${t.setAlpha(1).toRgbString()} 100%)`}_formatsChanged(){-1===this.formats.indexOf(this.selectedFormat)&&(this.selectedFormat=this.formats[0])}_noAlphaChanged(){this.no_alpha=this.getAttribute("no_alpha")}_selectedFormatChanged(){this._setCSSProperty("background",this._gridGradient,this._$grid.querySelector(".overlay")),this._setGridThumbPosition()}_notifyChanges(){if(this._pointerDown||this._sliderDown)return this._dispatchValue("input");this._dispatchValue("change")}_dispatchValue(t){this.dispatchEvent(new CustomEvent(t,{detail:{value:this.value}}))}_setGridThumbPosition(){if(!this._$grid)return;const t="hsl"===this.selectedFormat?this.hsl.s:this.hsv.s,e="hsl"===this.selectedFormat?this.hsl.l:this.hsv.v,r=this._$grid.offsetWidth*t,i=this._$grid.offsetHeight*(1-e);this._setCSSProperty("transform",`translate(${r}px, ${i}px)`,this._$grid.querySelector(".thumb")),this._setCSSProperty("background",this._gridBackground,this._$grid)}_setHighlightColors(){if(!this._$container)return;const t=new C(window.getComputedStyle(this._$container).backgroundColor),e=t.isLight()?"darken":"brighten";this._setCSSProperty("--bg-color--20",t[e]()[e]().toRgbString(),this._$container),this._setCSSProperty("--bg-color--60",t[e]()[e]()[e]()[e]()[e]()[e]().toRgbString(),this._$container)}_setCSSProperty(t,e,r=this){r&&(r.style.setProperty(t,e),window.ShadyCSS&&window.ShadyCSS.styleSubtree(r,{[t]:e}))}get _thumbStyles(){return(new Ct)._thumbStyles}get _$container(){return this.shadowRoot.querySelector("#container")}get _$grid(){return this.shadowRoot.querySelector("#gridInput")}get _$colorSteel(){return this.shadowRoot.querySelector("#colorSteel")}}window.customElements.define("color-picker",St);
