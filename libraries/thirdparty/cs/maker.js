/*
__________________________________________________________________________________________________________________________________________
 __________________________________________________________________________________________________________________________________________
  ________/\\\\____________/\\\\_____/\\\\\\\\\_____/\\\________/\\\__/\\\\\\\\\\\\\\\__/\\\\\\\\\\\________________________________________
   _______\/\\\\\\________/\\\\\\___/\\\\/////\\\\__\/\\\_____/\\\//__\/\\\///////////__\/\\\///////\\\_______________/\\\___________________
    _______\/\\\//\\\____/\\\//\\\__/\\\/____\///\\\_\/\\\__/\\\//_____\/\\\_____________\/\\\_____\/\\\______________\///____________________
     _______\/\\\\///\\\/\\\/_\/\\\_\/\\\_______\/\\\_\/\\\\\\//\\\_____\/\\\\\\\\\\\_____\/\\\\\\\\\\\/________________/\\\__/\\\\\\\\\\______
      _______\/\\\__\///\\\/___\/\\\_\/\\\\\\\\\\\\\\\_\/\\\//_\//\\\____\/\\\///////______\/\\\//////\\\_______________\/\\\_\/\\\//////_______
       _______\/\\\____\///_____\/\\\_\/\\\/////////\\\_\/\\\____\//\\\___\/\\\_____________\/\\\____\//\\\______________\/\\\_\/\\\\\\\\\\______
        _______\/\\\_____________\/\\\_\/\\\_______\/\\\_\/\\\_____\//\\\__\/\\\_____________\/\\\_____\//\\\_________/\\_\/\\\_\////////\\\______
         _______\/\\\_____________\/\\\_\/\\\_______\/\\\_\/\\\______\//\\\_\/\\\\\\\\\\\\\\\_\/\\\______\//\\\__/\\\_\//\\\\\\___/\\\\\\\\\\______
          _______\///______________\///__\///________\///__\///________\///__\///////////////__\///________\///__\///___\//////___\//////////_______
           __________________________________________________________________________________________________________________________________________
            __________________________________________________________________________________________________________________________________________

Maker.js
https://github.com/Microsoft/maker.js

Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.

*/

var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/clone/clone.js
var require_clone = __commonJS({
  "node_modules/clone/clone.js"(exports2, module2) {
    var clone2 = (function() {
      "use strict";
      function clone3(parent, circular, depth, prototype) {
        var filter;
        if (typeof circular === "object") {
          depth = circular.depth;
          prototype = circular.prototype;
          filter = circular.filter;
          circular = circular.circular;
        }
        var allParents = [];
        var allChildren = [];
        var useBuffer = typeof Buffer != "undefined";
        if (typeof circular == "undefined")
          circular = true;
        if (typeof depth == "undefined")
          depth = Infinity;
        function _clone(parent2, depth2) {
          if (parent2 === null)
            return null;
          if (depth2 == 0)
            return parent2;
          var child;
          var proto;
          if (typeof parent2 != "object") {
            return parent2;
          }
          if (clone3.__isArray(parent2)) {
            child = [];
          } else if (clone3.__isRegExp(parent2)) {
            child = new RegExp(parent2.source, __getRegExpFlags(parent2));
            if (parent2.lastIndex) child.lastIndex = parent2.lastIndex;
          } else if (clone3.__isDate(parent2)) {
            child = new Date(parent2.getTime());
          } else if (useBuffer && Buffer.isBuffer(parent2)) {
            if (Buffer.allocUnsafe) {
              child = Buffer.allocUnsafe(parent2.length);
            } else {
              child = new Buffer(parent2.length);
            }
            parent2.copy(child);
            return child;
          } else {
            if (typeof prototype == "undefined") {
              proto = Object.getPrototypeOf(parent2);
              child = Object.create(proto);
            } else {
              child = Object.create(prototype);
              proto = prototype;
            }
          }
          if (circular) {
            var index = allParents.indexOf(parent2);
            if (index != -1) {
              return allChildren[index];
            }
            allParents.push(parent2);
            allChildren.push(child);
          }
          for (var i in parent2) {
            var attrs;
            if (proto) {
              attrs = Object.getOwnPropertyDescriptor(proto, i);
            }
            if (attrs && attrs.set == null) {
              continue;
            }
            child[i] = _clone(parent2[i], depth2 - 1);
          }
          return child;
        }
        return _clone(parent, depth);
      }
      clone3.clonePrototype = function clonePrototype(parent) {
        if (parent === null)
          return null;
        var c = function() {
        };
        c.prototype = parent;
        return new c();
      };
      function __objToStr(o) {
        return Object.prototype.toString.call(o);
      }
      ;
      clone3.__objToStr = __objToStr;
      function __isDate(o) {
        return typeof o === "object" && __objToStr(o) === "[object Date]";
      }
      ;
      clone3.__isDate = __isDate;
      function __isArray(o) {
        return typeof o === "object" && __objToStr(o) === "[object Array]";
      }
      ;
      clone3.__isArray = __isArray;
      function __isRegExp(o) {
        return typeof o === "object" && __objToStr(o) === "[object RegExp]";
      }
      ;
      clone3.__isRegExp = __isRegExp;
      function __getRegExpFlags(re) {
        var flags = "";
        if (re.global) flags += "g";
        if (re.ignoreCase) flags += "i";
        if (re.multiline) flags += "m";
        return flags;
      }
      ;
      clone3.__getRegExpFlags = __getRegExpFlags;
      return clone3;
    })();
    if (typeof module2 === "object" && module2.exports) {
      module2.exports = clone2;
    }
  }
});

// node_modules/kdbush/kdbush.js
var require_kdbush = __commonJS({
  "node_modules/kdbush/kdbush.js"(exports2, module2) {
    (function(global, factory) {
      typeof exports2 === "object" && typeof module2 !== "undefined" ? module2.exports = factory() : typeof define === "function" && define.amd ? define(factory) : global.kdbush = factory();
    })(exports2, (function() {
      "use strict";
      function sortKD(ids, coords, nodeSize, left, right, depth) {
        if (right - left <= nodeSize) return;
        var m = Math.floor((left + right) / 2);
        select(ids, coords, m, left, right, depth % 2);
        sortKD(ids, coords, nodeSize, left, m - 1, depth + 1);
        sortKD(ids, coords, nodeSize, m + 1, right, depth + 1);
      }
      function select(ids, coords, k, left, right, inc) {
        while (right > left) {
          if (right - left > 600) {
            var n = right - left + 1;
            var m = k - left + 1;
            var z = Math.log(n);
            var s = 0.5 * Math.exp(2 * z / 3);
            var sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
            var newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
            var newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
            select(ids, coords, k, newLeft, newRight, inc);
          }
          var t = coords[2 * k + inc];
          var i = left;
          var j = right;
          swapItem(ids, coords, left, k);
          if (coords[2 * right + inc] > t) swapItem(ids, coords, left, right);
          while (i < j) {
            swapItem(ids, coords, i, j);
            i++;
            j--;
            while (coords[2 * i + inc] < t) i++;
            while (coords[2 * j + inc] > t) j--;
          }
          if (coords[2 * left + inc] === t) swapItem(ids, coords, left, j);
          else {
            j++;
            swapItem(ids, coords, j, right);
          }
          if (j <= k) left = j + 1;
          if (k <= j) right = j - 1;
        }
      }
      function swapItem(ids, coords, i, j) {
        swap(ids, i, j);
        swap(coords, 2 * i, 2 * j);
        swap(coords, 2 * i + 1, 2 * j + 1);
      }
      function swap(arr, i, j) {
        var tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      function range(ids, coords, minX, minY, maxX, maxY, nodeSize) {
        var stack = [0, ids.length - 1, 0];
        var result = [];
        var x, y;
        while (stack.length) {
          var axis = stack.pop();
          var right = stack.pop();
          var left = stack.pop();
          if (right - left <= nodeSize) {
            for (var i = left; i <= right; i++) {
              x = coords[2 * i];
              y = coords[2 * i + 1];
              if (x >= minX && x <= maxX && y >= minY && y <= maxY) result.push(ids[i]);
            }
            continue;
          }
          var m = Math.floor((left + right) / 2);
          x = coords[2 * m];
          y = coords[2 * m + 1];
          if (x >= minX && x <= maxX && y >= minY && y <= maxY) result.push(ids[m]);
          var nextAxis = (axis + 1) % 2;
          if (axis === 0 ? minX <= x : minY <= y) {
            stack.push(left);
            stack.push(m - 1);
            stack.push(nextAxis);
          }
          if (axis === 0 ? maxX >= x : maxY >= y) {
            stack.push(m + 1);
            stack.push(right);
            stack.push(nextAxis);
          }
        }
        return result;
      }
      function within(ids, coords, qx, qy, r, nodeSize) {
        var stack = [0, ids.length - 1, 0];
        var result = [];
        var r2 = r * r;
        while (stack.length) {
          var axis = stack.pop();
          var right = stack.pop();
          var left = stack.pop();
          if (right - left <= nodeSize) {
            for (var i = left; i <= right; i++) {
              if (sqDist(coords[2 * i], coords[2 * i + 1], qx, qy) <= r2) result.push(ids[i]);
            }
            continue;
          }
          var m = Math.floor((left + right) / 2);
          var x = coords[2 * m];
          var y = coords[2 * m + 1];
          if (sqDist(x, y, qx, qy) <= r2) result.push(ids[m]);
          var nextAxis = (axis + 1) % 2;
          if (axis === 0 ? qx - r <= x : qy - r <= y) {
            stack.push(left);
            stack.push(m - 1);
            stack.push(nextAxis);
          }
          if (axis === 0 ? qx + r >= x : qy + r >= y) {
            stack.push(m + 1);
            stack.push(right);
            stack.push(nextAxis);
          }
        }
        return result;
      }
      function sqDist(ax, ay, bx, by) {
        var dx = ax - bx;
        var dy = ay - by;
        return dx * dx + dy * dy;
      }
      function kdbush(points, getX, getY, nodeSize, ArrayType) {
        return new KDBush(points, getX, getY, nodeSize, ArrayType);
      }
      function KDBush(points, getX, getY, nodeSize, ArrayType) {
        getX = getX || defaultGetX;
        getY = getY || defaultGetY;
        ArrayType = ArrayType || Array;
        this.nodeSize = nodeSize || 64;
        this.points = points;
        this.ids = new ArrayType(points.length);
        this.coords = new ArrayType(points.length * 2);
        for (var i = 0; i < points.length; i++) {
          this.ids[i] = i;
          this.coords[2 * i] = getX(points[i]);
          this.coords[2 * i + 1] = getY(points[i]);
        }
        sortKD(this.ids, this.coords, this.nodeSize, 0, this.ids.length - 1, 0);
      }
      KDBush.prototype = {
        range: function(minX, minY, maxX, maxY) {
          return range(this.ids, this.coords, minX, minY, maxX, maxY, this.nodeSize);
        },
        within: function(x, y, r) {
          return within(this.ids, this.coords, x, y, r, this.nodeSize);
        }
      };
      function defaultGetX(p) {
        return p[0];
      }
      function defaultGetY(p) {
        return p[1];
      }
      return kdbush;
    }));
  }
});

// node_modules/graham_scan/graham_scan.min.js
var require_graham_scan_min = __commonJS({
  "node_modules/graham_scan/graham_scan.min.js"(exports2, module2) {
    function ConvexHullGrahamScan() {
      this.anchorPoint = void 0, this.reverse = false, this.points = [];
    }
    ConvexHullGrahamScan.prototype = { constructor: ConvexHullGrahamScan, Point: function(n, t) {
      this.x = n, this.y = t;
    }, _findPolarAngle: function(n, t) {
      var i, o, h = 57.295779513082;
      if (!n || !t) return 0;
      if (i = t.x - n.x, o = t.y - n.y, 0 == i && 0 == o) return 0;
      var r = Math.atan2(o, i) * h;
      return this.reverse ? 0 >= r && (r += 360) : r >= 0 && (r += 360), r;
    }, addPoint: function(n, t) {
      return void 0 === this.anchorPoint ? void (this.anchorPoint = new this.Point(n, t)) : this.anchorPoint.y > t && this.anchorPoint.x > n || this.anchorPoint.y === t && this.anchorPoint.x > n || this.anchorPoint.y > t && this.anchorPoint.x === n ? (this.points.push(new this.Point(this.anchorPoint.x, this.anchorPoint.y)), void (this.anchorPoint = new this.Point(n, t))) : void this.points.push(new this.Point(n, t));
    }, _sortPoints: function() {
      var n = this;
      return this.points.sort(function(t, i) {
        var o = n._findPolarAngle(n.anchorPoint, t), h = n._findPolarAngle(n.anchorPoint, i);
        return h > o ? -1 : o > h ? 1 : 0;
      });
    }, _checkPoints: function(n, t, i) {
      var o, h = this._findPolarAngle(n, t), r = this._findPolarAngle(n, i);
      return h > r ? (o = h - r, !(o > 180)) : r > h ? (o = r - h, o > 180) : true;
    }, getHull: function() {
      var n, t, i = [];
      if (this.reverse = this.points.every(function(n2) {
        return n2.x < 0 && n2.y < 0;
      }), n = this._sortPoints(), t = n.length, 3 > t) return n.unshift(this.anchorPoint), n;
      for (i.push(n.shift(), n.shift()); ; ) {
        var o, h, r;
        if (i.push(n.shift()), o = i[i.length - 3], h = i[i.length - 2], r = i[i.length - 1], this._checkPoints(o, h, r) && i.splice(i.length - 2, 1), 0 == n.length) {
          if (t == i.length) {
            var e = this.anchorPoint;
            return i = i.filter(function(n2) {
              return !!n2;
            }), i.some(function(n2) {
              return n2.x == e.x && n2.y == e.y;
            }) || i.unshift(this.anchorPoint), i;
          }
          n = i, t = n.length, i = [], i.push(n.shift(), n.shift());
        }
      }
    } }, "function" == typeof define && define.amd && define(function() {
      return ConvexHullGrahamScan;
    }), "undefined" != typeof module2 && (module2.exports = ConvexHullGrahamScan);
  }
});

// node_modules/bezier-js/lib/utils.js
var require_utils = __commonJS({
  "node_modules/bezier-js/lib/utils.js"(exports2, module2) {
    (function() {
      "use strict";
      var abs = Math.abs, cos = Math.cos, sin = Math.sin, acos = Math.acos, atan2 = Math.atan2, sqrt = Math.sqrt, pow = Math.pow, crt = function(v) {
        return v < 0 ? -pow(-v, 1 / 3) : pow(v, 1 / 3);
      }, pi = Math.PI, tau = 2 * pi, quart = pi / 2, epsilon = 1e-6, nMax = Number.MAX_SAFE_INTEGER || 9007199254740991, nMin = Number.MIN_SAFE_INTEGER || -9007199254740991, ZERO = { x: 0, y: 0, z: 0 };
      var utils = {
        // Legendre-Gauss abscissae with n=24 (x_i values, defined at i=n as the roots of the nth order Legendre polynomial Pn(x))
        Tvalues: [
          -0.06405689286260563,
          0.06405689286260563,
          -0.1911188674736163,
          0.1911188674736163,
          -0.3150426796961634,
          0.3150426796961634,
          -0.4337935076260451,
          0.4337935076260451,
          -0.5454214713888396,
          0.5454214713888396,
          -0.6480936519369755,
          0.6480936519369755,
          -0.7401241915785544,
          0.7401241915785544,
          -0.820001985973903,
          0.820001985973903,
          -0.8864155270044011,
          0.8864155270044011,
          -0.9382745520027328,
          0.9382745520027328,
          -0.9747285559713095,
          0.9747285559713095,
          -0.9951872199970213,
          0.9951872199970213
        ],
        // Legendre-Gauss weights with n=24 (w_i values, defined by a function linked to in the Bezier primer article)
        Cvalues: [
          0.12793819534675216,
          0.12793819534675216,
          0.1258374563468283,
          0.1258374563468283,
          0.12167047292780339,
          0.12167047292780339,
          0.1155056680537256,
          0.1155056680537256,
          0.10744427011596563,
          0.10744427011596563,
          0.09761865210411388,
          0.09761865210411388,
          0.08619016153195327,
          0.08619016153195327,
          0.0733464814110803,
          0.0733464814110803,
          0.05929858491543678,
          0.05929858491543678,
          0.04427743881741981,
          0.04427743881741981,
          0.028531388628933663,
          0.028531388628933663,
          0.0123412297999872,
          0.0123412297999872
        ],
        arcfn: function(t, derivativeFn) {
          var d = derivativeFn(t);
          var l = d.x * d.x + d.y * d.y;
          if (typeof d.z !== "undefined") {
            l += d.z * d.z;
          }
          return sqrt(l);
        },
        compute: function(t, points, _3d) {
          if (t === 0) {
            return points[0];
          }
          var order = points.length - 1;
          if (t === 1) {
            return points[order];
          }
          var p = points;
          var mt = 1 - t;
          if (order === 0) {
            return points[0];
          }
          if (order === 1) {
            ret = {
              x: mt * p[0].x + t * p[1].x,
              y: mt * p[0].y + t * p[1].y
            };
            if (_3d) {
              ret.z = mt * p[0].z + t * p[1].z;
            }
            return ret;
          }
          if (order < 4) {
            var mt2 = mt * mt, t2 = t * t, a, b, c, d = 0;
            if (order === 2) {
              p = [p[0], p[1], p[2], ZERO];
              a = mt2;
              b = mt * t * 2;
              c = t2;
            } else if (order === 3) {
              a = mt2 * mt;
              b = mt2 * t * 3;
              c = mt * t2 * 3;
              d = t * t2;
            }
            var ret = {
              x: a * p[0].x + b * p[1].x + c * p[2].x + d * p[3].x,
              y: a * p[0].y + b * p[1].y + c * p[2].y + d * p[3].y
            };
            if (_3d) {
              ret.z = a * p[0].z + b * p[1].z + c * p[2].z + d * p[3].z;
            }
            return ret;
          }
          var dCpts = JSON.parse(JSON.stringify(points));
          while (dCpts.length > 1) {
            for (var i = 0; i < dCpts.length - 1; i++) {
              dCpts[i] = {
                x: dCpts[i].x + (dCpts[i + 1].x - dCpts[i].x) * t,
                y: dCpts[i].y + (dCpts[i + 1].y - dCpts[i].y) * t
              };
              if (typeof dCpts[i].z !== "undefined") {
                dCpts[i] = dCpts[i].z + (dCpts[i + 1].z - dCpts[i].z) * t;
              }
            }
            dCpts.splice(dCpts.length - 1, 1);
          }
          return dCpts[0];
        },
        computeWithRatios: function(t, points, ratios, _3d) {
          var mt = 1 - t, r = ratios, p = points, d;
          var f1 = r[0], f2 = r[1], f3 = r[2], f4 = r[3];
          f1 *= mt;
          f2 *= t;
          if (p.length === 2) {
            d = f1 + f2;
            return {
              x: (f1 * p[0].x + f2 * p[1].x) / d,
              y: (f1 * p[0].y + f2 * p[1].y) / d,
              z: !_3d ? false : (f1 * p[0].z + f2 * p[1].z) / d
            };
          }
          f1 *= mt;
          f2 *= 2 * mt;
          f3 *= t * t;
          if (p.length === 3) {
            d = f1 + f2 + f3;
            return {
              x: (f1 * p[0].x + f2 * p[1].x + f3 * p[2].x) / d,
              y: (f1 * p[0].y + f2 * p[1].y + f3 * p[2].y) / d,
              z: !_3d ? false : (f1 * p[0].z + f2 * p[1].z + f3 * p[2].z) / d
            };
          }
          f1 *= mt;
          f2 *= 1.5 * mt;
          f3 *= 3 * mt;
          f4 *= t * t * t;
          if (p.length === 4) {
            d = f1 + f2 + f3 + f4;
            return {
              x: (f1 * p[0].x + f2 * p[1].x + f3 * p[2].x + f4 * p[3].x) / d,
              y: (f1 * p[0].y + f2 * p[1].y + f3 * p[2].y + f4 * p[3].y) / d,
              z: !_3d ? false : (f1 * p[0].z + f2 * p[1].z + f3 * p[2].z + f4 * p[3].z) / d
            };
          }
        },
        derive: function(points, _3d) {
          var dpoints = [];
          for (var p = points, d = p.length, c = d - 1; d > 1; d--, c--) {
            var list = [];
            for (var j = 0, dpt; j < c; j++) {
              dpt = {
                x: c * (p[j + 1].x - p[j].x),
                y: c * (p[j + 1].y - p[j].y)
              };
              if (_3d) {
                dpt.z = c * (p[j + 1].z - p[j].z);
              }
              list.push(dpt);
            }
            dpoints.push(list);
            p = list;
          }
          return dpoints;
        },
        between: function(v, m, M) {
          return m <= v && v <= M || utils.approximately(v, m) || utils.approximately(v, M);
        },
        approximately: function(a, b, precision) {
          return abs(a - b) <= (precision || epsilon);
        },
        length: function(derivativeFn) {
          var z = 0.5, sum = 0, len = utils.Tvalues.length, i, t;
          for (i = 0; i < len; i++) {
            t = z * utils.Tvalues[i] + z;
            sum += utils.Cvalues[i] * utils.arcfn(t, derivativeFn);
          }
          return z * sum;
        },
        map: function(v, ds, de, ts, te) {
          var d1 = de - ds, d2 = te - ts, v2 = v - ds, r = v2 / d1;
          return ts + d2 * r;
        },
        lerp: function(r, v1, v2) {
          var ret = {
            x: v1.x + r * (v2.x - v1.x),
            y: v1.y + r * (v2.y - v1.y)
          };
          if (!!v1.z && !!v2.z) {
            ret.z = v1.z + r * (v2.z - v1.z);
          }
          return ret;
        },
        pointToString: function(p) {
          var s = p.x + "/" + p.y;
          if (typeof p.z !== "undefined") {
            s += "/" + p.z;
          }
          return s;
        },
        pointsToString: function(points) {
          return "[" + points.map(utils.pointToString).join(", ") + "]";
        },
        copy: function(obj) {
          return JSON.parse(JSON.stringify(obj));
        },
        angle: function(o, v1, v2) {
          var dx1 = v1.x - o.x, dy1 = v1.y - o.y, dx2 = v2.x - o.x, dy2 = v2.y - o.y, cross = dx1 * dy2 - dy1 * dx2, dot = dx1 * dx2 + dy1 * dy2;
          return atan2(cross, dot);
        },
        // round as string, to avoid rounding errors
        round: function(v, d) {
          var s = "" + v;
          var pos = s.indexOf(".");
          return parseFloat(s.substring(0, pos + 1 + d));
        },
        dist: function(p1, p2) {
          var dx = p1.x - p2.x, dy = p1.y - p2.y;
          return sqrt(dx * dx + dy * dy);
        },
        closest: function(LUT, point) {
          var mdist = pow(2, 63), mpos, d;
          LUT.forEach(function(p, idx) {
            d = utils.dist(point, p);
            if (d < mdist) {
              mdist = d;
              mpos = idx;
            }
          });
          return { mdist, mpos };
        },
        abcratio: function(t, n) {
          if (n !== 2 && n !== 3) {
            return false;
          }
          if (typeof t === "undefined") {
            t = 0.5;
          } else if (t === 0 || t === 1) {
            return t;
          }
          var bottom = pow(t, n) + pow(1 - t, n), top = bottom - 1;
          return abs(top / bottom);
        },
        projectionratio: function(t, n) {
          if (n !== 2 && n !== 3) {
            return false;
          }
          if (typeof t === "undefined") {
            t = 0.5;
          } else if (t === 0 || t === 1) {
            return t;
          }
          var top = pow(1 - t, n), bottom = pow(t, n) + top;
          return top / bottom;
        },
        lli8: function(x1, y1, x2, y2, x3, y3, x4, y4) {
          var nx = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4), ny = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4), d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
          if (d == 0) {
            return false;
          }
          return { x: nx / d, y: ny / d };
        },
        lli4: function(p1, p2, p3, p4) {
          var x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y, x3 = p3.x, y3 = p3.y, x4 = p4.x, y4 = p4.y;
          return utils.lli8(x1, y1, x2, y2, x3, y3, x4, y4);
        },
        lli: function(v1, v2) {
          return utils.lli4(v1, v1.c, v2, v2.c);
        },
        makeline: function(p1, p2) {
          var Bezier2 = require_bezier();
          var x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y, dx = (x2 - x1) / 3, dy = (y2 - y1) / 3;
          return new Bezier2(
            x1,
            y1,
            x1 + dx,
            y1 + dy,
            x1 + 2 * dx,
            y1 + 2 * dy,
            x2,
            y2
          );
        },
        findbbox: function(sections) {
          var mx = nMax, my = nMax, MX = nMin, MY = nMin;
          sections.forEach(function(s) {
            var bbox = s.bbox();
            if (mx > bbox.x.min) mx = bbox.x.min;
            if (my > bbox.y.min) my = bbox.y.min;
            if (MX < bbox.x.max) MX = bbox.x.max;
            if (MY < bbox.y.max) MY = bbox.y.max;
          });
          return {
            x: { min: mx, mid: (mx + MX) / 2, max: MX, size: MX - mx },
            y: { min: my, mid: (my + MY) / 2, max: MY, size: MY - my }
          };
        },
        shapeintersections: function(s1, bbox1, s2, bbox2, curveIntersectionThreshold) {
          if (!utils.bboxoverlap(bbox1, bbox2)) return [];
          var intersections = [];
          var a1 = [s1.startcap, s1.forward, s1.back, s1.endcap];
          var a2 = [s2.startcap, s2.forward, s2.back, s2.endcap];
          a1.forEach(function(l1) {
            if (l1.virtual) return;
            a2.forEach(function(l2) {
              if (l2.virtual) return;
              var iss = l1.intersects(l2, curveIntersectionThreshold);
              if (iss.length > 0) {
                iss.c1 = l1;
                iss.c2 = l2;
                iss.s1 = s1;
                iss.s2 = s2;
                intersections.push(iss);
              }
            });
          });
          return intersections;
        },
        makeshape: function(forward, back, curveIntersectionThreshold) {
          var bpl = back.points.length;
          var fpl = forward.points.length;
          var start = utils.makeline(back.points[bpl - 1], forward.points[0]);
          var end = utils.makeline(forward.points[fpl - 1], back.points[0]);
          var shape = {
            startcap: start,
            forward,
            back,
            endcap: end,
            bbox: utils.findbbox([start, forward, back, end])
          };
          var self = utils;
          shape.intersections = function(s2) {
            return self.shapeintersections(
              shape,
              shape.bbox,
              s2,
              s2.bbox,
              curveIntersectionThreshold
            );
          };
          return shape;
        },
        getminmax: function(curve, d, list) {
          if (!list) return { min: 0, max: 0 };
          var min = nMax, max = nMin, t, c;
          if (list.indexOf(0) === -1) {
            list = [0].concat(list);
          }
          if (list.indexOf(1) === -1) {
            list.push(1);
          }
          for (var i = 0, len = list.length; i < len; i++) {
            t = list[i];
            c = curve.get(t);
            if (c[d] < min) {
              min = c[d];
            }
            if (c[d] > max) {
              max = c[d];
            }
          }
          return { min, mid: (min + max) / 2, max, size: max - min };
        },
        align: function(points, line) {
          var tx = line.p1.x, ty = line.p1.y, a = -atan2(line.p2.y - ty, line.p2.x - tx), d = function(v) {
            return {
              x: (v.x - tx) * cos(a) - (v.y - ty) * sin(a),
              y: (v.x - tx) * sin(a) + (v.y - ty) * cos(a)
            };
          };
          return points.map(d);
        },
        roots: function(points, line) {
          line = line || { p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 } };
          var order = points.length - 1;
          var p = utils.align(points, line);
          var reduce = function(t2) {
            return 0 <= t2 && t2 <= 1;
          };
          if (order === 2) {
            var a = p[0].y, b = p[1].y, c = p[2].y, d = a - 2 * b + c;
            if (d !== 0) {
              var m1 = -sqrt(b * b - a * c), m2 = -a + b, v1 = -(m1 + m2) / d, v2 = -(-m1 + m2) / d;
              return [v1, v2].filter(reduce);
            } else if (b !== c && d === 0) {
              return [(2 * b - c) / (2 * b - 2 * c)].filter(reduce);
            }
            return [];
          }
          var pa = p[0].y, pb = p[1].y, pc = p[2].y, pd = p[3].y, d = -pa + 3 * pb - 3 * pc + pd, a = 3 * pa - 6 * pb + 3 * pc, b = -3 * pa + 3 * pb, c = pa;
          if (utils.approximately(d, 0)) {
            if (utils.approximately(a, 0)) {
              if (utils.approximately(b, 0)) {
                return [];
              }
              return [-c / b].filter(reduce);
            }
            var q = sqrt(b * b - 4 * a * c), a2 = 2 * a;
            return [(q - b) / a2, (-b - q) / a2].filter(reduce);
          }
          a /= d;
          b /= d;
          c /= d;
          var p = (3 * b - a * a) / 3, p3 = p / 3, q = (2 * a * a * a - 9 * a * b + 27 * c) / 27, q2 = q / 2, discriminant = q2 * q2 + p3 * p3 * p3, u1, v1, x1, x2, x3;
          if (discriminant < 0) {
            var mp3 = -p / 3, mp33 = mp3 * mp3 * mp3, r = sqrt(mp33), t = -q / (2 * r), cosphi = t < -1 ? -1 : t > 1 ? 1 : t, phi = acos(cosphi), crtr = crt(r), t1 = 2 * crtr;
            x1 = t1 * cos(phi / 3) - a / 3;
            x2 = t1 * cos((phi + tau) / 3) - a / 3;
            x3 = t1 * cos((phi + 2 * tau) / 3) - a / 3;
            return [x1, x2, x3].filter(reduce);
          } else if (discriminant === 0) {
            u1 = q2 < 0 ? crt(-q2) : -crt(q2);
            x1 = 2 * u1 - a / 3;
            x2 = -u1 - a / 3;
            return [x1, x2].filter(reduce);
          } else {
            var sd = sqrt(discriminant);
            u1 = crt(-q2 + sd);
            v1 = crt(q2 + sd);
            return [u1 - v1 - a / 3].filter(reduce);
          }
        },
        droots: function(p) {
          if (p.length === 3) {
            var a = p[0], b = p[1], c = p[2], d = a - 2 * b + c;
            if (d !== 0) {
              var m1 = -sqrt(b * b - a * c), m2 = -a + b, v1 = -(m1 + m2) / d, v2 = -(-m1 + m2) / d;
              return [v1, v2];
            } else if (b !== c && d === 0) {
              return [(2 * b - c) / (2 * (b - c))];
            }
            return [];
          }
          if (p.length === 2) {
            var a = p[0], b = p[1];
            if (a !== b) {
              return [a / (a - b)];
            }
            return [];
          }
        },
        curvature: function(t, points, _3d, kOnly) {
          var dpoints = utils.derive(points);
          var d1 = dpoints[0];
          var d2 = dpoints[1];
          var num, dnm, adk, dk, k = 0, r = 0;
          var d = utils.compute(t, d1);
          var dd = utils.compute(t, d2);
          var qdsum = d.x * d.x + d.y * d.y;
          if (_3d) {
            num = sqrt(
              pow(d.y * dd.z - dd.y * d.z, 2) + pow(d.z * dd.x - dd.z * d.x, 2) + pow(d.x * dd.y - dd.x * d.y, 2)
            );
            dnm = pow(qdsum + d.z * d.z, 3 / 2);
          } else {
            num = d.x * dd.y - d.y * dd.x;
            dnm = pow(qdsum, 3 / 2);
          }
          if (num === 0 || dnm === 0) {
            return { k: 0, r: 0 };
          }
          k = num / dnm;
          r = dnm / num;
          if (!kOnly) {
            var pk = utils.curvature(t - 1e-3, points, _3d, true).k;
            var nk = utils.curvature(t + 1e-3, points, _3d, true).k;
            dk = (nk - k + (k - pk)) / 2;
            adk = (abs(nk - k) + abs(k - pk)) / 2;
          }
          return { k, r, dk, adk };
        },
        inflections: function(points) {
          if (points.length < 4) return [];
          var p = utils.align(points, { p1: points[0], p2: points.slice(-1)[0] }), a = p[2].x * p[1].y, b = p[3].x * p[1].y, c = p[1].x * p[2].y, d = p[3].x * p[2].y, v1 = 18 * (-3 * a + 2 * b + 3 * c - d), v2 = 18 * (3 * a - b - 3 * c), v3 = 18 * (c - a);
          if (utils.approximately(v1, 0)) {
            if (!utils.approximately(v2, 0)) {
              var t = -v3 / v2;
              if (0 <= t && t <= 1) return [t];
            }
            return [];
          }
          var trm = v2 * v2 - 4 * v1 * v3, sq = Math.sqrt(trm), d = 2 * v1;
          if (utils.approximately(d, 0)) return [];
          return [(sq - v2) / d, -(v2 + sq) / d].filter(function(r) {
            return 0 <= r && r <= 1;
          });
        },
        bboxoverlap: function(b1, b2) {
          var dims = ["x", "y"], len = dims.length, i, dim, l, t, d;
          for (i = 0; i < len; i++) {
            dim = dims[i];
            l = b1[dim].mid;
            t = b2[dim].mid;
            d = (b1[dim].size + b2[dim].size) / 2;
            if (abs(l - t) >= d) return false;
          }
          return true;
        },
        expandbox: function(bbox, _bbox) {
          if (_bbox.x.min < bbox.x.min) {
            bbox.x.min = _bbox.x.min;
          }
          if (_bbox.y.min < bbox.y.min) {
            bbox.y.min = _bbox.y.min;
          }
          if (_bbox.z && _bbox.z.min < bbox.z.min) {
            bbox.z.min = _bbox.z.min;
          }
          if (_bbox.x.max > bbox.x.max) {
            bbox.x.max = _bbox.x.max;
          }
          if (_bbox.y.max > bbox.y.max) {
            bbox.y.max = _bbox.y.max;
          }
          if (_bbox.z && _bbox.z.max > bbox.z.max) {
            bbox.z.max = _bbox.z.max;
          }
          bbox.x.mid = (bbox.x.min + bbox.x.max) / 2;
          bbox.y.mid = (bbox.y.min + bbox.y.max) / 2;
          if (bbox.z) {
            bbox.z.mid = (bbox.z.min + bbox.z.max) / 2;
          }
          bbox.x.size = bbox.x.max - bbox.x.min;
          bbox.y.size = bbox.y.max - bbox.y.min;
          if (bbox.z) {
            bbox.z.size = bbox.z.max - bbox.z.min;
          }
        },
        pairiteration: function(c1, c2, curveIntersectionThreshold) {
          var c1b = c1.bbox(), c2b = c2.bbox(), r = 1e5, threshold = curveIntersectionThreshold || 0.5;
          if (c1b.x.size + c1b.y.size < threshold && c2b.x.size + c2b.y.size < threshold) {
            return [
              (r * (c1._t1 + c1._t2) / 2 | 0) / r + "/" + (r * (c2._t1 + c2._t2) / 2 | 0) / r
            ];
          }
          var cc1 = c1.split(0.5), cc2 = c2.split(0.5), pairs = [
            { left: cc1.left, right: cc2.left },
            { left: cc1.left, right: cc2.right },
            { left: cc1.right, right: cc2.right },
            { left: cc1.right, right: cc2.left }
          ];
          pairs = pairs.filter(function(pair) {
            return utils.bboxoverlap(pair.left.bbox(), pair.right.bbox());
          });
          var results = [];
          if (pairs.length === 0) return results;
          pairs.forEach(function(pair) {
            results = results.concat(
              utils.pairiteration(pair.left, pair.right, threshold)
            );
          });
          results = results.filter(function(v, i) {
            return results.indexOf(v) === i;
          });
          return results;
        },
        getccenter: function(p1, p2, p3) {
          var dx1 = p2.x - p1.x, dy1 = p2.y - p1.y, dx2 = p3.x - p2.x, dy2 = p3.y - p2.y;
          var dx1p = dx1 * cos(quart) - dy1 * sin(quart), dy1p = dx1 * sin(quart) + dy1 * cos(quart), dx2p = dx2 * cos(quart) - dy2 * sin(quart), dy2p = dx2 * sin(quart) + dy2 * cos(quart);
          var mx1 = (p1.x + p2.x) / 2, my1 = (p1.y + p2.y) / 2, mx2 = (p2.x + p3.x) / 2, my2 = (p2.y + p3.y) / 2;
          var mx1n = mx1 + dx1p, my1n = my1 + dy1p, mx2n = mx2 + dx2p, my2n = my2 + dy2p;
          var arc = utils.lli8(mx1, my1, mx1n, my1n, mx2, my2, mx2n, my2n), r = utils.dist(arc, p1), s = atan2(p1.y - arc.y, p1.x - arc.x), m = atan2(p2.y - arc.y, p2.x - arc.x), e = atan2(p3.y - arc.y, p3.x - arc.x), _;
          if (s < e) {
            if (s > m || m > e) {
              s += tau;
            }
            if (s > e) {
              _ = e;
              e = s;
              s = _;
            }
          } else {
            if (e < m && m < s) {
              _ = e;
              e = s;
              s = _;
            } else {
              e += tau;
            }
          }
          arc.s = s;
          arc.e = e;
          arc.r = r;
          return arc;
        },
        numberSort: function(a, b) {
          return a - b;
        }
      };
      module2.exports = utils;
    })();
  }
});

// node_modules/bezier-js/lib/poly-bezier.js
var require_poly_bezier = __commonJS({
  "node_modules/bezier-js/lib/poly-bezier.js"(exports2, module2) {
    (function() {
      "use strict";
      var utils = require_utils();
      var PolyBezier = function(curves) {
        this.curves = [];
        this._3d = false;
        if (!!curves) {
          this.curves = curves;
          this._3d = this.curves[0]._3d;
        }
      };
      PolyBezier.prototype = {
        valueOf: function() {
          return this.toString();
        },
        toString: function() {
          return "[" + this.curves.map(function(curve) {
            return utils.pointsToString(curve.points);
          }).join(", ") + "]";
        },
        addCurve: function(curve) {
          this.curves.push(curve);
          this._3d = this._3d || curve._3d;
        },
        length: function() {
          return this.curves.map(function(v) {
            return v.length();
          }).reduce(function(a, b) {
            return a + b;
          });
        },
        curve: function(idx) {
          return this.curves[idx];
        },
        bbox: function() {
          var c = this.curves;
          var bbox = c[0].bbox();
          for (var i = 1; i < c.length; i++) {
            utils.expandbox(bbox, c[i].bbox());
          }
          return bbox;
        },
        offset: function(d) {
          var offset = [];
          this.curves.forEach(function(v) {
            offset = offset.concat(v.offset(d));
          });
          return new PolyBezier(offset);
        }
      };
      module2.exports = PolyBezier;
    })();
  }
});

// node_modules/bezier-js/lib/normalise-svg.js
var require_normalise_svg = __commonJS({
  "node_modules/bezier-js/lib/normalise-svg.js"(exports2, module2) {
    function normalizePath(d) {
      d = d.replace(/,/g, " ").replace(/-/g, " - ").replace(/-\s+/g, "-").replace(/([a-zA-Z])/g, " $1 ");
      var instructions = d.replace(/([a-zA-Z])\s?/g, "|$1").split("|"), instructionLength = instructions.length, i, instruction, op, lop, args = [], alen, a, sx = 0, sy = 0, x = 0, y = 0, cx = 0, cy = 0, cx2 = 0, cy2 = 0, normalized = "";
      for (i = 1; i < instructionLength; i++) {
        instruction = instructions[i];
        op = instruction.substring(0, 1);
        lop = op.toLowerCase();
        args = instruction.replace(op, "").trim().split(" ");
        args = args.filter(function(v) {
          return v !== "";
        }).map(parseFloat);
        alen = args.length;
        if (lop === "m") {
          normalized += "M ";
          if (op === "m") {
            x += args[0];
            y += args[1];
          } else {
            x = args[0];
            y = args[1];
          }
          sx = x;
          sy = y;
          normalized += x + " " + y + " ";
          if (alen > 2) {
            for (a = 0; a < alen; a += 2) {
              if (op === "m") {
                x += args[a];
                y += args[a + 1];
              } else {
                x = args[a];
                y = args[a + 1];
              }
              normalized += ["L", x, y, ""].join(" ");
            }
          }
        } else if (lop === "l") {
          for (a = 0; a < alen; a += 2) {
            if (op === "l") {
              x += args[a];
              y += args[a + 1];
            } else {
              x = args[a];
              y = args[a + 1];
            }
            normalized += ["L", x, y, ""].join(" ");
          }
        } else if (lop === "h") {
          for (a = 0; a < alen; a++) {
            if (op === "h") {
              x += args[a];
            } else {
              x = args[a];
            }
            normalized += ["L", x, y, ""].join(" ");
          }
        } else if (lop === "v") {
          for (a = 0; a < alen; a++) {
            if (op === "v") {
              y += args[a];
            } else {
              y = args[a];
            }
            normalized += ["L", x, y, ""].join(" ");
          }
        } else if (lop === "q") {
          for (a = 0; a < alen; a += 4) {
            if (op === "q") {
              cx = x + args[a];
              cy = y + args[a + 1];
              x += args[a + 2];
              y += args[a + 3];
            } else {
              cx = args[a];
              cy = args[a + 1];
              x = args[a + 2];
              y = args[a + 3];
            }
            normalized += ["Q", cx, cy, x, y, ""].join(" ");
          }
        } else if (lop === "t") {
          for (a = 0; a < alen; a += 2) {
            cx = x + (x - cx);
            cy = y + (y - cy);
            if (op === "t") {
              x += args[a];
              y += args[a + 1];
            } else {
              x = args[a];
              y = args[a + 1];
            }
            normalized += ["Q", cx, cy, x, y, ""].join(" ");
          }
        } else if (lop === "c") {
          for (a = 0; a < alen; a += 6) {
            if (op === "c") {
              cx = x + args[a];
              cy = y + args[a + 1];
              cx2 = x + args[a + 2];
              cy2 = y + args[a + 3];
              x += args[a + 4];
              y += args[a + 5];
            } else {
              cx = args[a];
              cy = args[a + 1];
              cx2 = args[a + 2];
              cy2 = args[a + 3];
              x = args[a + 4];
              y = args[a + 5];
            }
            normalized += ["C", cx, cy, cx2, cy2, x, y, ""].join(" ");
          }
        } else if (lop === "s") {
          for (a = 0; a < alen; a += 4) {
            cx = x + (x - cx2);
            cy = y + (y - cy2);
            if (op === "s") {
              cx2 = x + args[a];
              cy2 = y + args[a + 1];
              x += args[a + 2];
              y += args[a + 3];
            } else {
              cx2 = args[a];
              cy2 = args[a + 1];
              x = args[a + 2];
              y = args[a + 3];
            }
            normalized += ["C", cx, cy, cx2, cy2, x, y, ""].join(" ");
          }
        } else if (lop === "z") {
          normalized += "Z ";
          x = sx;
          y = sy;
        }
      }
      return normalized.trim();
    }
    module2.exports = normalizePath;
  }
});

// node_modules/bezier-js/lib/svg-to-beziers.js
var require_svg_to_beziers = __commonJS({
  "node_modules/bezier-js/lib/svg-to-beziers.js"(exports2, module2) {
    var normalise = require_normalise_svg();
    var M = { x: false, y: false };
    function makeBezier(Bezier2, term, values) {
      if (term === "Z") return;
      if (term === "M") {
        M = { x: values[0], y: values[1] };
        return;
      }
      var cvalues = [false, M.x, M.y].concat(values);
      var PreboundConstructor = Bezier2.bind.apply(Bezier2, cvalues);
      var curve = new PreboundConstructor();
      var last = values.slice(-2);
      M = { x: last[0], y: last[1] };
      return curve;
    }
    function convertPath(Bezier2, d) {
      var terms = normalise(d).split(" "), term, matcher = new RegExp("[MLCQZ]", ""), segment, values, segments = [], ARGS = { "C": 6, "Q": 4, "L": 2, "M": 2 };
      while (terms.length) {
        term = terms.splice(0, 1)[0];
        if (matcher.test(term)) {
          values = terms.splice(0, ARGS[term]).map(parseFloat);
          segment = makeBezier(Bezier2, term, values);
          if (segment) segments.push(segment);
        }
      }
      return new Bezier2.PolyBezier(segments);
    }
    module2.exports = convertPath;
  }
});

// node_modules/bezier-js/lib/bezier.js
var require_bezier = __commonJS({
  "node_modules/bezier-js/lib/bezier.js"(exports2, module2) {
    (function() {
      "use strict";
      var abs = Math.abs, min = Math.min, max = Math.max, cos = Math.cos, sin = Math.sin, acos = Math.acos, sqrt = Math.sqrt, pi = Math.PI, ZERO = { x: 0, y: 0, z: 0 };
      var utils = require_utils();
      var PolyBezier = require_poly_bezier();
      var Bezier2 = function(coords) {
        var args = coords && coords.forEach ? coords : [].slice.call(arguments);
        var coordlen = false;
        if (typeof args[0] === "object") {
          coordlen = args.length;
          var newargs = [];
          args.forEach(function(point2) {
            ["x", "y", "z"].forEach(function(d) {
              if (typeof point2[d] !== "undefined") {
                newargs.push(point2[d]);
              }
            });
          });
          args = newargs;
        }
        var higher = false;
        var len = args.length;
        if (coordlen) {
          if (coordlen > 4) {
            if (arguments.length !== 1) {
              throw new Error(
                "Only new Bezier(point[]) is accepted for 4th and higher order curves"
              );
            }
            higher = true;
          }
        } else {
          if (len !== 6 && len !== 8 && len !== 9 && len !== 12) {
            if (arguments.length !== 1) {
              throw new Error(
                "Only new Bezier(point[]) is accepted for 4th and higher order curves"
              );
            }
          }
        }
        var _3d = !higher && (len === 9 || len === 12) || coords && coords[0] && typeof coords[0].z !== "undefined";
        this._3d = _3d;
        var points = [];
        for (var idx = 0, step = _3d ? 3 : 2; idx < len; idx += step) {
          var point = {
            x: args[idx],
            y: args[idx + 1]
          };
          if (_3d) {
            point.z = args[idx + 2];
          }
          points.push(point);
        }
        this.order = points.length - 1;
        this.points = points;
        var dims = ["x", "y"];
        if (_3d) dims.push("z");
        this.dims = dims;
        this.dimlen = dims.length;
        (function(curve) {
          var order = curve.order;
          var points2 = curve.points;
          var a = utils.align(points2, { p1: points2[0], p2: points2[order] });
          for (var i = 0; i < a.length; i++) {
            if (abs(a[i].y) > 1e-4) {
              curve._linear = false;
              return;
            }
          }
          curve._linear = true;
        })(this);
        this._t1 = 0;
        this._t2 = 1;
        this.update();
      };
      var svgToBeziers = require_svg_to_beziers();
      Bezier2.SVGtoBeziers = function(d) {
        return svgToBeziers(Bezier2, d);
      };
      function getABC(n, S, B, E, t) {
        if (typeof t === "undefined") {
          t = 0.5;
        }
        var u = utils.projectionratio(t, n), um = 1 - u, C = {
          x: u * S.x + um * E.x,
          y: u * S.y + um * E.y
        }, s = utils.abcratio(t, n), A = {
          x: B.x + (B.x - C.x) / s,
          y: B.y + (B.y - C.y) / s
        };
        return { A, B, C };
      }
      Bezier2.quadraticFromPoints = function(p1, p2, p3, t) {
        if (typeof t === "undefined") {
          t = 0.5;
        }
        if (t === 0) {
          return new Bezier2(p2, p2, p3);
        }
        if (t === 1) {
          return new Bezier2(p1, p2, p2);
        }
        var abc = getABC(2, p1, p2, p3, t);
        return new Bezier2(p1, abc.A, p3);
      };
      Bezier2.cubicFromPoints = function(S, B, E, t, d1) {
        if (typeof t === "undefined") {
          t = 0.5;
        }
        var abc = getABC(3, S, B, E, t);
        if (typeof d1 === "undefined") {
          d1 = utils.dist(B, abc.C);
        }
        var d2 = d1 * (1 - t) / t;
        var selen = utils.dist(S, E), lx = (E.x - S.x) / selen, ly = (E.y - S.y) / selen, bx1 = d1 * lx, by1 = d1 * ly, bx2 = d2 * lx, by2 = d2 * ly;
        var e1 = { x: B.x - bx1, y: B.y - by1 }, e2 = { x: B.x + bx2, y: B.y + by2 }, A = abc.A, v1 = { x: A.x + (e1.x - A.x) / (1 - t), y: A.y + (e1.y - A.y) / (1 - t) }, v2 = { x: A.x + (e2.x - A.x) / t, y: A.y + (e2.y - A.y) / t }, nc1 = { x: S.x + (v1.x - S.x) / t, y: S.y + (v1.y - S.y) / t }, nc2 = {
          x: E.x + (v2.x - E.x) / (1 - t),
          y: E.y + (v2.y - E.y) / (1 - t)
        };
        return new Bezier2(S, nc1, nc2, E);
      };
      var getUtils = function() {
        return utils;
      };
      Bezier2.getUtils = getUtils;
      Bezier2.PolyBezier = PolyBezier;
      Bezier2.prototype = {
        getUtils,
        valueOf: function() {
          return this.toString();
        },
        toString: function() {
          return utils.pointsToString(this.points);
        },
        toSVG: function(relative) {
          if (this._3d) return false;
          var p = this.points, x = p[0].x, y = p[0].y, s = ["M", x, y, this.order === 2 ? "Q" : "C"];
          for (var i = 1, last = p.length; i < last; i++) {
            s.push(p[i].x);
            s.push(p[i].y);
          }
          return s.join(" ");
        },
        setRatios: function(ratios) {
          if (ratios.length !== this.points.length) {
            throw new Error("incorrect number of ratio values");
          }
          this.ratios = ratios;
          this._lut = [];
        },
        verify: function() {
          var print = this.coordDigest();
          if (print !== this._print) {
            this._print = print;
            this.update();
          }
        },
        coordDigest: function() {
          return this.points.map(function(c, pos) {
            return "" + pos + c.x + c.y + (c.z ? c.z : 0);
          }).join("");
        },
        update: function(newprint) {
          this._lut = [];
          this.dpoints = utils.derive(this.points, this._3d);
          this.computedirection();
        },
        computedirection: function() {
          var points = this.points;
          var angle = utils.angle(points[0], points[this.order], points[1]);
          this.clockwise = angle > 0;
        },
        length: function() {
          return utils.length(this.derivative.bind(this));
        },
        _lut: [],
        getLUT: function(steps) {
          this.verify();
          steps = steps || 100;
          if (this._lut.length === steps) {
            return this._lut;
          }
          this._lut = [];
          steps--;
          for (var t = 0; t <= steps; t++) {
            this._lut.push(this.compute(t / steps));
          }
          return this._lut;
        },
        on: function(point, error) {
          error = error || 5;
          var lut = this.getLUT(), hits = [], c, t = 0;
          for (var i = 0; i < lut.length; i++) {
            c = lut[i];
            if (utils.dist(c, point) < error) {
              hits.push(c);
              t += i / lut.length;
            }
          }
          if (!hits.length) return false;
          return t /= hits.length;
        },
        project: function(point) {
          var LUT = this.getLUT(), l = LUT.length - 1, closest = utils.closest(LUT, point), mdist = closest.mdist, mpos = closest.mpos;
          var ft, t, p, d, t1 = (mpos - 1) / l, t2 = (mpos + 1) / l, step = 0.1 / l;
          mdist += 1;
          for (t = t1, ft = t; t < t2 + step; t += step) {
            p = this.compute(t);
            d = utils.dist(point, p);
            if (d < mdist) {
              mdist = d;
              ft = t;
            }
          }
          p = this.compute(ft);
          p.t = ft;
          p.d = mdist;
          return p;
        },
        get: function(t) {
          return this.compute(t);
        },
        point: function(idx) {
          return this.points[idx];
        },
        compute: function(t) {
          if (this.ratios) return utils.computeWithRatios(t, this.points, this.ratios, this._3d);
          return utils.compute(t, this.points, this._3d, this.ratios);
        },
        raise: function() {
          var p = this.points, np = [p[0]], i, k = p.length, pi2, pim;
          for (var i = 1; i < k; i++) {
            pi2 = p[i];
            pim = p[i - 1];
            np[i] = {
              x: (k - i) / k * pi2.x + i / k * pim.x,
              y: (k - i) / k * pi2.y + i / k * pim.y
            };
          }
          np[k] = p[k - 1];
          return new Bezier2(np);
        },
        derivative: function(t) {
          var mt = 1 - t, a, b, c = 0, p = this.dpoints[0];
          if (this.order === 2) {
            p = [p[0], p[1], ZERO];
            a = mt;
            b = t;
          }
          if (this.order === 3) {
            a = mt * mt;
            b = mt * t * 2;
            c = t * t;
          }
          var ret = {
            x: a * p[0].x + b * p[1].x + c * p[2].x,
            y: a * p[0].y + b * p[1].y + c * p[2].y
          };
          if (this._3d) {
            ret.z = a * p[0].z + b * p[1].z + c * p[2].z;
          }
          return ret;
        },
        curvature: function(t) {
          return utils.curvature(t, this.points, this._3d);
        },
        inflections: function() {
          return utils.inflections(this.points);
        },
        normal: function(t) {
          return this._3d ? this.__normal3(t) : this.__normal2(t);
        },
        __normal2: function(t) {
          var d = this.derivative(t);
          var q = sqrt(d.x * d.x + d.y * d.y);
          return { x: -d.y / q, y: d.x / q };
        },
        __normal3: function(t) {
          var r1 = this.derivative(t), r2 = this.derivative(t + 0.01), q1 = sqrt(r1.x * r1.x + r1.y * r1.y + r1.z * r1.z), q2 = sqrt(r2.x * r2.x + r2.y * r2.y + r2.z * r2.z);
          r1.x /= q1;
          r1.y /= q1;
          r1.z /= q1;
          r2.x /= q2;
          r2.y /= q2;
          r2.z /= q2;
          var c = {
            x: r2.y * r1.z - r2.z * r1.y,
            y: r2.z * r1.x - r2.x * r1.z,
            z: r2.x * r1.y - r2.y * r1.x
          };
          var m = sqrt(c.x * c.x + c.y * c.y + c.z * c.z);
          c.x /= m;
          c.y /= m;
          c.z /= m;
          var R = [
            c.x * c.x,
            c.x * c.y - c.z,
            c.x * c.z + c.y,
            c.x * c.y + c.z,
            c.y * c.y,
            c.y * c.z - c.x,
            c.x * c.z - c.y,
            c.y * c.z + c.x,
            c.z * c.z
          ];
          var n = {
            x: R[0] * r1.x + R[1] * r1.y + R[2] * r1.z,
            y: R[3] * r1.x + R[4] * r1.y + R[5] * r1.z,
            z: R[6] * r1.x + R[7] * r1.y + R[8] * r1.z
          };
          return n;
        },
        hull: function(t) {
          var p = this.points, _p = [], pt, q = [], idx = 0, i = 0, l = 0;
          q[idx++] = p[0];
          q[idx++] = p[1];
          q[idx++] = p[2];
          if (this.order === 3) {
            q[idx++] = p[3];
          }
          while (p.length > 1) {
            _p = [];
            for (i = 0, l = p.length - 1; i < l; i++) {
              pt = utils.lerp(t, p[i], p[i + 1]);
              q[idx++] = pt;
              _p.push(pt);
            }
            p = _p;
          }
          return q;
        },
        split: function(t1, t2) {
          if (t1 === 0 && !!t2) {
            return this.split(t2).left;
          }
          if (t2 === 1) {
            return this.split(t1).right;
          }
          var q = this.hull(t1);
          var result = {
            left: this.order === 2 ? new Bezier2([q[0], q[3], q[5]]) : new Bezier2([q[0], q[4], q[7], q[9]]),
            right: this.order === 2 ? new Bezier2([q[5], q[4], q[2]]) : new Bezier2([q[9], q[8], q[6], q[3]]),
            span: q
          };
          result.left._t1 = utils.map(0, 0, 1, this._t1, this._t2);
          result.left._t2 = utils.map(t1, 0, 1, this._t1, this._t2);
          result.right._t1 = utils.map(t1, 0, 1, this._t1, this._t2);
          result.right._t2 = utils.map(1, 0, 1, this._t1, this._t2);
          if (!t2) {
            return result;
          }
          t2 = utils.map(t2, t1, 1, 0, 1);
          var subsplit = result.right.split(t2);
          return subsplit.left;
        },
        extrema: function() {
          var dims = this.dims, result = {}, roots = [], p, mfn;
          dims.forEach(
            function(dim) {
              mfn = function(v) {
                return v[dim];
              };
              p = this.dpoints[0].map(mfn);
              result[dim] = utils.droots(p);
              if (this.order === 3) {
                p = this.dpoints[1].map(mfn);
                result[dim] = result[dim].concat(utils.droots(p));
              }
              result[dim] = result[dim].filter(function(t) {
                return t >= 0 && t <= 1;
              });
              roots = roots.concat(result[dim].sort(utils.numberSort));
            }.bind(this)
          );
          roots = roots.sort(utils.numberSort).filter(function(v, idx) {
            return roots.indexOf(v) === idx;
          });
          result.values = roots;
          return result;
        },
        bbox: function() {
          var extrema = this.extrema(), result = {};
          this.dims.forEach(
            function(d) {
              result[d] = utils.getminmax(this, d, extrema[d]);
            }.bind(this)
          );
          return result;
        },
        overlaps: function(curve) {
          var lbbox = this.bbox(), tbbox = curve.bbox();
          return utils.bboxoverlap(lbbox, tbbox);
        },
        offset: function(t, d) {
          if (typeof d !== "undefined") {
            var c = this.get(t);
            var n = this.normal(t);
            var ret = {
              c,
              n,
              x: c.x + n.x * d,
              y: c.y + n.y * d
            };
            if (this._3d) {
              ret.z = c.z + n.z * d;
            }
            return ret;
          }
          if (this._linear) {
            var nv = this.normal(0);
            var coords = this.points.map(function(p) {
              var ret2 = {
                x: p.x + t * nv.x,
                y: p.y + t * nv.y
              };
              if (p.z && n.z) {
                ret2.z = p.z + t * nv.z;
              }
              return ret2;
            });
            return [new Bezier2(coords)];
          }
          var reduced = this.reduce();
          return reduced.map(function(s) {
            if (s._linear) {
              return s.offset(t)[0];
            }
            return s.scale(t);
          });
        },
        simple: function() {
          if (this.order === 3) {
            var a1 = utils.angle(this.points[0], this.points[3], this.points[1]);
            var a2 = utils.angle(this.points[0], this.points[3], this.points[2]);
            if (a1 > 0 && a2 < 0 || a1 < 0 && a2 > 0) return false;
          }
          var n1 = this.normal(0);
          var n2 = this.normal(1);
          var s = n1.x * n2.x + n1.y * n2.y;
          if (this._3d) {
            s += n1.z * n2.z;
          }
          var angle = abs(acos(s));
          return angle < pi / 3;
        },
        reduce: function() {
          var i, t1 = 0, t2 = 0, step = 0.01, segment, pass1 = [], pass2 = [];
          var extrema = this.extrema().values;
          if (extrema.indexOf(0) === -1) {
            extrema = [0].concat(extrema);
          }
          if (extrema.indexOf(1) === -1) {
            extrema.push(1);
          }
          for (t1 = extrema[0], i = 1; i < extrema.length; i++) {
            t2 = extrema[i];
            segment = this.split(t1, t2);
            segment._t1 = t1;
            segment._t2 = t2;
            pass1.push(segment);
            t1 = t2;
          }
          pass1.forEach(function(p1) {
            t1 = 0;
            t2 = 0;
            while (t2 <= 1) {
              for (t2 = t1 + step; t2 <= 1 + step; t2 += step) {
                segment = p1.split(t1, t2);
                if (!segment.simple()) {
                  t2 -= step;
                  if (abs(t1 - t2) < step) {
                    return [];
                  }
                  segment = p1.split(t1, t2);
                  segment._t1 = utils.map(t1, 0, 1, p1._t1, p1._t2);
                  segment._t2 = utils.map(t2, 0, 1, p1._t1, p1._t2);
                  pass2.push(segment);
                  t1 = t2;
                  break;
                }
              }
            }
            if (t1 < 1) {
              segment = p1.split(t1, 1);
              segment._t1 = utils.map(t1, 0, 1, p1._t1, p1._t2);
              segment._t2 = p1._t2;
              pass2.push(segment);
            }
          });
          return pass2;
        },
        scale: function(d) {
          var order = this.order;
          var distanceFn = false;
          if (typeof d === "function") {
            distanceFn = d;
          }
          if (distanceFn && order === 2) {
            return this.raise().scale(distanceFn);
          }
          var clockwise = this.clockwise;
          var r1 = distanceFn ? distanceFn(0) : d;
          var r2 = distanceFn ? distanceFn(1) : d;
          var v = [this.offset(0, 10), this.offset(1, 10)];
          var o = utils.lli4(v[0], v[0].c, v[1], v[1].c);
          if (!o) {
            throw new Error("cannot scale this curve. Try reducing it first.");
          }
          var points = this.points, np = [];
          [0, 1].forEach(
            function(t) {
              var p = np[t * order] = utils.copy(points[t * order]);
              p.x += (t ? r2 : r1) * v[t].n.x;
              p.y += (t ? r2 : r1) * v[t].n.y;
            }.bind(this)
          );
          if (!distanceFn) {
            [0, 1].forEach(
              function(t) {
                if (this.order === 2 && !!t) return;
                var p = np[t * order];
                var d2 = this.derivative(t);
                var p2 = { x: p.x + d2.x, y: p.y + d2.y };
                np[t + 1] = utils.lli4(p, p2, o, points[t + 1]);
              }.bind(this)
            );
            return new Bezier2(np);
          }
          [0, 1].forEach(
            function(t) {
              if (this.order === 2 && !!t) return;
              var p = points[t + 1];
              var ov = {
                x: p.x - o.x,
                y: p.y - o.y
              };
              var rc = distanceFn ? distanceFn((t + 1) / order) : d;
              if (distanceFn && !clockwise) rc = -rc;
              var m = sqrt(ov.x * ov.x + ov.y * ov.y);
              ov.x /= m;
              ov.y /= m;
              np[t + 1] = {
                x: p.x + rc * ov.x,
                y: p.y + rc * ov.y
              };
            }.bind(this)
          );
          return new Bezier2(np);
        },
        outline: function(d1, d2, d3, d4) {
          d2 = typeof d2 === "undefined" ? d1 : d2;
          var reduced = this.reduce(), len = reduced.length, fcurves = [], bcurves = [], p, alen = 0, tlen = this.length();
          var graduated = typeof d3 !== "undefined" && typeof d4 !== "undefined";
          function linearDistanceFunction(s, e, tlen2, alen2, slen2) {
            return function(v) {
              var f1 = alen2 / tlen2, f2 = (alen2 + slen2) / tlen2, d = e - s;
              return utils.map(v, 0, 1, s + f1 * d, s + f2 * d);
            };
          }
          reduced.forEach(function(segment) {
            slen = segment.length();
            if (graduated) {
              fcurves.push(
                segment.scale(linearDistanceFunction(d1, d3, tlen, alen, slen))
              );
              bcurves.push(
                segment.scale(linearDistanceFunction(-d2, -d4, tlen, alen, slen))
              );
            } else {
              fcurves.push(segment.scale(d1));
              bcurves.push(segment.scale(-d2));
            }
            alen += slen;
          });
          bcurves = bcurves.map(function(s) {
            p = s.points;
            if (p[3]) {
              s.points = [p[3], p[2], p[1], p[0]];
            } else {
              s.points = [p[2], p[1], p[0]];
            }
            return s;
          }).reverse();
          var fs = fcurves[0].points[0], fe = fcurves[len - 1].points[fcurves[len - 1].points.length - 1], bs = bcurves[len - 1].points[bcurves[len - 1].points.length - 1], be = bcurves[0].points[0], ls = utils.makeline(bs, fs), le = utils.makeline(fe, be), segments = [ls].concat(fcurves).concat([le]).concat(bcurves), slen = segments.length;
          return new PolyBezier(segments);
        },
        outlineshapes: function(d1, d2, curveIntersectionThreshold) {
          d2 = d2 || d1;
          var outline = this.outline(d1, d2).curves;
          var shapes = [];
          for (var i = 1, len = outline.length; i < len / 2; i++) {
            var shape = utils.makeshape(
              outline[i],
              outline[len - i],
              curveIntersectionThreshold
            );
            shape.startcap.virtual = i > 1;
            shape.endcap.virtual = i < len / 2 - 1;
            shapes.push(shape);
          }
          return shapes;
        },
        intersects: function(curve, curveIntersectionThreshold) {
          if (!curve) return this.selfintersects(curveIntersectionThreshold);
          if (curve.p1 && curve.p2) {
            return this.lineIntersects(curve);
          }
          if (curve instanceof Bezier2) {
            curve = curve.reduce();
          }
          return this.curveintersects(
            this.reduce(),
            curve,
            curveIntersectionThreshold
          );
        },
        lineIntersects: function(line) {
          var mx = min(line.p1.x, line.p2.x), my = min(line.p1.y, line.p2.y), MX = max(line.p1.x, line.p2.x), MY = max(line.p1.y, line.p2.y), self = this;
          return utils.roots(this.points, line).filter(function(t) {
            var p = self.get(t);
            return utils.between(p.x, mx, MX) && utils.between(p.y, my, MY);
          });
        },
        selfintersects: function(curveIntersectionThreshold) {
          var reduced = this.reduce();
          var i, len = reduced.length - 2, results = [], result, left, right;
          for (i = 0; i < len; i++) {
            left = reduced.slice(i, i + 1);
            right = reduced.slice(i + 2);
            result = this.curveintersects(left, right, curveIntersectionThreshold);
            results = results.concat(result);
          }
          return results;
        },
        curveintersects: function(c1, c2, curveIntersectionThreshold) {
          var pairs = [];
          c1.forEach(function(l) {
            c2.forEach(function(r) {
              if (l.overlaps(r)) {
                pairs.push({ left: l, right: r });
              }
            });
          });
          var intersections = [];
          pairs.forEach(function(pair) {
            var result = utils.pairiteration(
              pair.left,
              pair.right,
              curveIntersectionThreshold
            );
            if (result.length > 0) {
              intersections = intersections.concat(result);
            }
          });
          return intersections;
        },
        arcs: function(errorThreshold) {
          errorThreshold = errorThreshold || 0.5;
          var circles = [];
          return this._iterate(errorThreshold, circles);
        },
        _error: function(pc, np1, s, e) {
          var q = (e - s) / 4, c1 = this.get(s + q), c2 = this.get(e - q), ref = utils.dist(pc, np1), d1 = utils.dist(pc, c1), d2 = utils.dist(pc, c2);
          return abs(d1 - ref) + abs(d2 - ref);
        },
        _iterate: function(errorThreshold, circles) {
          var t_s = 0, t_e = 1, safety;
          do {
            safety = 0;
            t_e = 1;
            var np1 = this.get(t_s), np2, np3, arc, prev_arc;
            var curr_good = false, prev_good = false, done;
            var t_m = t_e, prev_e = 1, step = 0;
            do {
              prev_good = curr_good;
              prev_arc = arc;
              t_m = (t_s + t_e) / 2;
              step++;
              np2 = this.get(t_m);
              np3 = this.get(t_e);
              arc = utils.getccenter(np1, np2, np3);
              arc.interval = {
                start: t_s,
                end: t_e
              };
              var error = this._error(arc, np1, t_s, t_e);
              curr_good = error <= errorThreshold;
              done = prev_good && !curr_good;
              if (!done) prev_e = t_e;
              if (curr_good) {
                if (t_e >= 1) {
                  arc.interval.end = prev_e = 1;
                  prev_arc = arc;
                  if (t_e > 1) {
                    var d = {
                      x: arc.x + arc.r * cos(arc.e),
                      y: arc.y + arc.r * sin(arc.e)
                    };
                    arc.e += utils.angle({ x: arc.x, y: arc.y }, d, this.get(1));
                  }
                  break;
                }
                t_e = t_e + (t_e - t_s) / 2;
              } else {
                t_e = t_m;
              }
            } while (!done && safety++ < 100);
            if (safety >= 100) {
              break;
            }
            prev_arc = prev_arc ? prev_arc : arc;
            circles.push(prev_arc);
            t_s = prev_e;
          } while (t_e < 1);
          return circles;
        }
      };
      module2.exports = Bezier2;
    })();
  }
});

// node_modules/bezier-js/index.js
var require_bezier_js = __commonJS({
  "node_modules/bezier-js/index.js"(exports2, module2) {
    module2.exports = require_bezier();
  }
});

// dist/index.js
var require_index = __commonJS({
  "dist/index.js"(exports, module) {
    var MakerJs;
    (function(MakerJs) {
      MakerJs.version = "debug";
      MakerJs.environmentTypes = {
        BrowserUI: "browser",
        NodeJs: "node",
        WebWorker: "worker",
        Unknown: "unknown"
      };
      var EPSILON = Number.EPSILON || Math.pow(2, -52);
      function tryEval(name) {
        try {
          var value = eval(name);
          return value;
        } catch (e) {
        }
        return;
      }
      function detectEnvironment() {
        if (tryEval("WorkerGlobalScope") && tryEval("self")) {
          return MakerJs.environmentTypes.WebWorker;
        }
        if (tryEval("window") && tryEval("document")) {
          return MakerJs.environmentTypes.BrowserUI;
        }
        if (tryEval("global") && tryEval("process")) {
          return MakerJs.environmentTypes.NodeJs;
        }
        return MakerJs.environmentTypes.Unknown;
      }
      MakerJs.environment = detectEnvironment();
      MakerJs.unitType = {
        Centimeter: "cm",
        Foot: "foot",
        Inch: "inch",
        Meter: "m",
        Millimeter: "mm"
      };
      function split(s, char) {
        var p = s.indexOf(char);
        if (p < 0) {
          return [s];
        } else if (p > 0) {
          return [s.substr(0, p), s.substr(p + 1)];
        } else {
          return ["", s];
        }
      }
      function splitDecimal(n) {
        var s = n.toString();
        if (s.indexOf("e") > 0) {
          s = n.toFixed(20).match(/.*[^(0+$)]/)[0];
        }
        return split(s, ".");
      }
      MakerJs.splitDecimal = splitDecimal;
      function round(n, accuracy) {
        if (accuracy === void 0) {
          accuracy = 1e-7;
        }
        if (n % 1 === 0)
          return n;
        var temp = 1 / accuracy;
        return Math.round((n + EPSILON) * temp) / temp;
      }
      MakerJs.round = round;
      function createRouteKey(route) {
        var converted = [];
        for (var i = 0; i < route.length; i++) {
          var element = route[i];
          var newElement;
          if (i % 2 === 0) {
            newElement = (i > 0 ? "." : "") + element;
          } else {
            newElement = JSON.stringify([element]);
          }
          converted.push(newElement);
        }
        return converted.join("");
      }
      MakerJs.createRouteKey = createRouteKey;
      function travel(modelContext, route) {
        if (!modelContext || !route)
          return null;
        var routeArray;
        if (Array.isArray(route)) {
          routeArray = route;
        } else {
          routeArray = JSON.parse(route);
        }
        var props = routeArray.slice();
        var ref = modelContext;
        var origin = modelContext.origin || [0, 0];
        while (props.length) {
          var prop = props.shift();
          ref = ref[prop];
          if (!ref)
            return null;
          if (ref.origin && props.length) {
            origin = MakerJs.point.add(origin, ref.origin);
          }
        }
        return {
          result: ref,
          offset: origin
        };
      }
      MakerJs.travel = travel;
      var clone = require_clone();
      function cloneObject(objectToClone) {
        return clone(objectToClone);
      }
      MakerJs.cloneObject = cloneObject;
      function extendObject(target, other) {
        if (target && other) {
          for (var key in other) {
            if (typeof other[key] !== "undefined") {
              target[key] = other[key];
            }
          }
        }
        return target;
      }
      MakerJs.extendObject = extendObject;
      function isFunction(value2) {
        return typeof value2 === "function";
      }
      MakerJs.isFunction = isFunction;
      function isNumber(value2) {
        return typeof value2 === "number";
      }
      MakerJs.isNumber = isNumber;
      function isObject(value2) {
        return typeof value2 === "object";
      }
      MakerJs.isObject = isObject;
      function isPoint(item) {
        return item && Array.isArray(item) && item.length == 2 && isNumber(item[0]) && isNumber(item[1]);
      }
      MakerJs.isPoint = isPoint;
      function isPath(item) {
        return item && item.type && isPoint(item.origin);
      }
      MakerJs.isPath = isPath;
      function isPathLine(item) {
        return isPath(item) && item.type == MakerJs.pathType.Line && isPoint(item.end);
      }
      MakerJs.isPathLine = isPathLine;
      function isPathCircle(item) {
        return isPath(item) && item.type == MakerJs.pathType.Circle && isNumber(item.radius);
      }
      MakerJs.isPathCircle = isPathCircle;
      function isPathArc(item) {
        return isPath(item) && item.type == MakerJs.pathType.Arc && isNumber(item.radius) && isNumber(item.startAngle) && isNumber(item.endAngle);
      }
      MakerJs.isPathArc = isPathArc;
      function isPathArcInBezierCurve(item) {
        return isPathArc(item) && isObject(item.bezierData) && isNumber(item.bezierData.startT) && isNumber(item.bezierData.endT);
      }
      MakerJs.isPathArcInBezierCurve = isPathArcInBezierCurve;
      MakerJs.pathType = {
        Line: "line",
        Circle: "circle",
        Arc: "arc",
        BezierSeed: "bezier-seed"
      };
      function isModel(item) {
        return item && (item.paths || item.models);
      }
      MakerJs.isModel = isModel;
      function isChain(item) {
        var x = item;
        return x && x.links && Array.isArray(x.links) && isNumber(x.pathLength);
      }
      MakerJs.isChain = isChain;
      var Cascade = (
        /** @class */
        (function() {
          function Cascade2(_module, $initial) {
            this._module = _module;
            this.$initial = $initial;
            for (var methodName in this._module)
              this._shadow(methodName);
            this.$result = $initial;
          }
          Cascade2.prototype._shadow = function(methodName) {
            var _this = this;
            this[methodName] = function() {
              return _this._apply(_this._module[methodName], arguments);
            };
          };
          Cascade2.prototype._apply = function(fn, carriedArguments) {
            var args = [].slice.call(carriedArguments);
            args.unshift(this.$result);
            this.$result = fn.apply(void 0, args);
            return this;
          };
          Cascade2.prototype.$reset = function() {
            this.$result = this.$initial;
            return this;
          };
          return Cascade2;
        })()
      );
      function $(context) {
        if (isModel(context)) {
          return new Cascade(MakerJs.model, context);
        } else if (isPath(context)) {
          return new Cascade(MakerJs.path, context);
        } else if (isPoint(context)) {
          return new Cascade(MakerJs.point, context);
        }
      }
      MakerJs.$ = $;
    })(MakerJs || (MakerJs = {}));
    module.exports = MakerJs;
    var MakerJs;
    (function(MakerJs2) {
      var angle;
      (function(angle2) {
        function getFractionalPart(n) {
          return MakerJs2.splitDecimal(n)[1];
        }
        function setFractionalPart(n, fractionalPart) {
          if (fractionalPart) {
            return +(MakerJs2.splitDecimal(n)[0] + "." + fractionalPart);
          } else {
            return n;
          }
        }
        function copyFractionalPart(src, dest) {
          if (src < 0 && dest < 0 || src > 0 && dest > 0) {
            return setFractionalPart(dest, getFractionalPart(src));
          }
          return dest;
        }
        function noRevolutions(angleInDegrees) {
          var revolutions = Math.floor(angleInDegrees / 360);
          if (revolutions === 0)
            return angleInDegrees;
          var a = angleInDegrees - 360 * revolutions;
          return copyFractionalPart(angleInDegrees, a);
        }
        angle2.noRevolutions = noRevolutions;
        function toRadians(angleInDegrees) {
          return noRevolutions(angleInDegrees) * Math.PI / 180;
        }
        angle2.toRadians = toRadians;
        function toDegrees(angleInRadians) {
          return angleInRadians * 180 / Math.PI;
        }
        angle2.toDegrees = toDegrees;
        function ofArcEnd(arc) {
          if (arc.endAngle < arc.startAngle) {
            var revolutions = Math.ceil((arc.startAngle - arc.endAngle) / 360);
            var a = revolutions * 360 + arc.endAngle;
            return copyFractionalPart(arc.endAngle, a);
          }
          return arc.endAngle;
        }
        angle2.ofArcEnd = ofArcEnd;
        function ofArcMiddle(arc, ratio) {
          if (ratio === void 0) {
            ratio = 0.5;
          }
          return arc.startAngle + ofArcSpan(arc) * ratio;
        }
        angle2.ofArcMiddle = ofArcMiddle;
        function ofArcSpan(arc) {
          var endAngle = angle2.ofArcEnd(arc);
          var a = endAngle - arc.startAngle;
          if (MakerJs2.round(a) > 360) {
            return noRevolutions(a);
          } else {
            return a;
          }
        }
        angle2.ofArcSpan = ofArcSpan;
        function ofLineInDegrees(line) {
          return noRevolutions(toDegrees(ofPointInRadians(line.origin, line.end)));
        }
        angle2.ofLineInDegrees = ofLineInDegrees;
        function ofPointInDegrees(origin, pointToFindAngle) {
          return toDegrees(ofPointInRadians(origin, pointToFindAngle));
        }
        angle2.ofPointInDegrees = ofPointInDegrees;
        function ofPointInRadians(origin, pointToFindAngle) {
          var d = MakerJs2.point.subtract(pointToFindAngle, origin);
          var x = d[0];
          var y = d[1];
          return Math.atan2(-y, -x) + Math.PI;
        }
        angle2.ofPointInRadians = ofPointInRadians;
        function mirror(angleInDegrees, mirrorX, mirrorY) {
          if (mirrorY) {
            angleInDegrees = 360 - angleInDegrees;
          }
          if (mirrorX) {
            angleInDegrees = (angleInDegrees < 180 ? 180 : 540) - angleInDegrees;
          }
          return angleInDegrees;
        }
        angle2.mirror = mirror;
        var linkLineMap = {};
        linkLineMap[MakerJs2.pathType.Arc] = function(arc, first, reversed) {
          var fromEnd = first != reversed;
          var angleToRotate = fromEnd ? arc.endAngle - 90 : arc.startAngle + 90;
          var origin = MakerJs2.point.fromArc(arc)[fromEnd ? 1 : 0];
          var end = MakerJs2.point.rotate(MakerJs2.point.add(origin, [arc.radius, 0]), angleToRotate, origin);
          return new MakerJs2.paths.Line(first ? [end, origin] : [origin, end]);
        };
        linkLineMap[MakerJs2.pathType.Line] = function(line, first, reversed) {
          return reversed ? new MakerJs2.paths.Line(line.end, line.origin) : line;
        };
        function getLinkLine(chainLink, first) {
          if (chainLink) {
            var p = chainLink.walkedPath.pathContext;
            var fn = linkLineMap[p.type];
            if (fn) {
              return fn(p, first, chainLink.reversed);
            }
          }
        }
        function ofChainLinkJoint(linkA, linkB) {
          if (arguments.length < 2)
            return null;
          var linkLines = [linkA, linkB].map(function(link, i) {
            return getLinkLine(link, i === 0);
          });
          var result = noRevolutions(ofLineInDegrees(linkLines[1]) - ofLineInDegrees(linkLines[0]));
          if (result > 180)
            result -= 360;
          return result;
        }
        angle2.ofChainLinkJoint = ofChainLinkJoint;
      })(angle = MakerJs2.angle || (MakerJs2.angle = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var point;
      (function(point2) {
        function add(a, b, subtract2) {
          var newPoint = clone2(a);
          if (!b)
            return newPoint;
          for (var i = 2; i--; ) {
            if (subtract2) {
              newPoint[i] -= b[i];
            } else {
              newPoint[i] += b[i];
            }
          }
          return newPoint;
        }
        point2.add = add;
        function average(a, b) {
          function avg(i) {
            return (a[i] + b[i]) / 2;
          }
          return [avg(0), avg(1)];
        }
        point2.average = average;
        function clone2(pointToClone) {
          if (!pointToClone)
            return point2.zero();
          return [pointToClone[0], pointToClone[1]];
        }
        point2.clone = clone2;
        function closest(referencePoint, pointOptions) {
          var smallest = {
            index: 0,
            distance: -1
          };
          for (var i = 0; i < pointOptions.length; i++) {
            var distance = MakerJs2.measure.pointDistance(referencePoint, pointOptions[i]);
            if (smallest.distance == -1 || distance < smallest.distance) {
              smallest.distance = distance;
              smallest.index = i;
            }
          }
          return pointOptions[smallest.index];
        }
        point2.closest = closest;
        var zero_cos = {};
        zero_cos[Math.PI / 2] = true;
        zero_cos[3 * Math.PI / 2] = true;
        var zero_sin = {};
        zero_sin[Math.PI] = true;
        zero_sin[2 * Math.PI] = true;
        function fromPolar(angleInRadians, radius) {
          return [
            angleInRadians in zero_cos ? 0 : MakerJs2.round(radius * Math.cos(angleInRadians)),
            angleInRadians in zero_sin ? 0 : MakerJs2.round(radius * Math.sin(angleInRadians))
          ];
        }
        point2.fromPolar = fromPolar;
        function fromAngleOnCircle(angleInDegrees, circle) {
          return add(circle.origin, fromPolar(MakerJs2.angle.toRadians(angleInDegrees), circle.radius));
        }
        point2.fromAngleOnCircle = fromAngleOnCircle;
        function fromArc(arc) {
          return [fromAngleOnCircle(arc.startAngle, arc), fromAngleOnCircle(arc.endAngle, arc)];
        }
        point2.fromArc = fromArc;
        var pathEndsMap = {};
        pathEndsMap[MakerJs2.pathType.Arc] = function(arc) {
          return point2.fromArc(arc);
        };
        pathEndsMap[MakerJs2.pathType.Line] = function(line) {
          return [line.origin, line.end];
        };
        pathEndsMap[MakerJs2.pathType.BezierSeed] = pathEndsMap[MakerJs2.pathType.Line];
        function fromPathEnds(pathContext, pathOffset) {
          var result = null;
          var fn = pathEndsMap[pathContext.type];
          if (fn) {
            result = fn(pathContext);
            if (pathOffset) {
              result = result.map(function(p) {
                return add(p, pathOffset);
              });
            }
          }
          return result;
        }
        point2.fromPathEnds = fromPathEnds;
        function verticalIntersectionPoint(verticalLine, nonVerticalSlope) {
          var x = verticalLine.origin[0];
          var y = nonVerticalSlope.slope * x + nonVerticalSlope.yIntercept;
          return [x, y];
        }
        function fromSlopeIntersection(lineA, lineB, options) {
          if (options === void 0) {
            options = {};
          }
          var slopeA = MakerJs2.measure.lineSlope(lineA);
          var slopeB = MakerJs2.measure.lineSlope(lineB);
          if (MakerJs2.measure.isSlopeParallel(slopeA, slopeB)) {
            if (MakerJs2.measure.isSlopeEqual(slopeA, slopeB)) {
              options.out_AreOverlapped = MakerJs2.measure.isLineOverlapping(lineA, lineB, options.excludeTangents);
            }
            return null;
          }
          var pointOfIntersection;
          if (!slopeA.hasSlope) {
            pointOfIntersection = verticalIntersectionPoint(lineA, slopeB);
          } else if (!slopeB.hasSlope) {
            pointOfIntersection = verticalIntersectionPoint(lineB, slopeA);
          } else {
            var x = (slopeB.yIntercept - slopeA.yIntercept) / (slopeA.slope - slopeB.slope);
            var y = slopeA.slope * x + slopeA.yIntercept;
            pointOfIntersection = [x, y];
          }
          return pointOfIntersection;
        }
        point2.fromSlopeIntersection = fromSlopeIntersection;
        function midCircle(circle, midAngle) {
          return point2.add(circle.origin, point2.fromPolar(MakerJs2.angle.toRadians(midAngle), circle.radius));
        }
        var middleMap = {};
        middleMap[MakerJs2.pathType.Arc] = function(arc, ratio) {
          var midAngle = MakerJs2.angle.ofArcMiddle(arc, ratio);
          return midCircle(arc, midAngle);
        };
        middleMap[MakerJs2.pathType.Circle] = function(circle, ratio) {
          return midCircle(circle, 360 * ratio);
        };
        middleMap[MakerJs2.pathType.Line] = function(line, ratio) {
          function ration(a, b) {
            return a + (b - a) * ratio;
          }
          ;
          return [
            ration(line.origin[0], line.end[0]),
            ration(line.origin[1], line.end[1])
          ];
        };
        middleMap[MakerJs2.pathType.BezierSeed] = function(seed, ratio) {
          return MakerJs2.models.BezierCurve.computePoint(seed, ratio);
        };
        function middle(pathContext, ratio) {
          if (ratio === void 0) {
            ratio = 0.5;
          }
          var midPoint = null;
          var fn = middleMap[pathContext.type];
          if (fn) {
            midPoint = fn(pathContext, ratio);
          }
          return midPoint;
        }
        point2.middle = middle;
        function mirror(pointToMirror, mirrorX, mirrorY) {
          var p = clone2(pointToMirror);
          if (mirrorX) {
            p[0] = -p[0];
          }
          if (mirrorY) {
            p[1] = -p[1];
          }
          return p;
        }
        point2.mirror = mirror;
        function rounded(pointContext, accuracy) {
          return [MakerJs2.round(pointContext[0], accuracy), MakerJs2.round(pointContext[1], accuracy)];
        }
        point2.rounded = rounded;
        function rotate(pointToRotate, angleInDegrees, rotationOrigin) {
          if (rotationOrigin === void 0) {
            rotationOrigin = [0, 0];
          }
          var pointAngleInRadians = MakerJs2.angle.ofPointInRadians(rotationOrigin, pointToRotate);
          var d = MakerJs2.measure.pointDistance(rotationOrigin, pointToRotate);
          var rotatedPoint = fromPolar(pointAngleInRadians + MakerJs2.angle.toRadians(angleInDegrees), d);
          return add(rotationOrigin, rotatedPoint);
        }
        point2.rotate = rotate;
        function scale(pointToScale, scaleValue) {
          var p = clone2(pointToScale);
          for (var i = 2; i--; ) {
            p[i] *= scaleValue;
          }
          return p;
        }
        point2.scale = scale;
        function distort(pointToDistort, scaleX, scaleY) {
          return [pointToDistort[0] * scaleX, pointToDistort[1] * scaleY];
        }
        point2.distort = distort;
        function subtract(a, b) {
          return add(a, b, true);
        }
        point2.subtract = subtract;
        function zero() {
          return [0, 0];
        }
        point2.zero = zero;
      })(point = MakerJs2.point || (MakerJs2.point = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var path;
      (function(path2) {
        function addTo(childPath, parentModel, pathId, overwrite) {
          if (overwrite === void 0) {
            overwrite = false;
          }
          MakerJs2.model.addPath(parentModel, childPath, pathId, overwrite);
          return childPath;
        }
        path2.addTo = addTo;
        function copyLayer(pathA, pathB) {
          if (pathA && pathB && typeof pathA.layer !== "undefined") {
            pathB.layer = pathA.layer;
          }
          if (pathA && pathB && "bezierData" in pathA) {
            pathB.bezierData = pathA.bezierData;
          }
        }
        var copyPropsMap = {};
        copyPropsMap[MakerJs2.pathType.Circle] = function(srcCircle, destCircle, offset) {
          destCircle.radius = srcCircle.radius;
        };
        copyPropsMap[MakerJs2.pathType.Arc] = function(srcArc, destArc, offset) {
          copyPropsMap[MakerJs2.pathType.Circle](srcArc, destArc, offset);
          destArc.startAngle = srcArc.startAngle;
          destArc.endAngle = srcArc.endAngle;
        };
        copyPropsMap[MakerJs2.pathType.Line] = function(srcLine, destLine, offset) {
          destLine.end = MakerJs2.point.add(srcLine.end, offset);
        };
        copyPropsMap[MakerJs2.pathType.BezierSeed] = function(srcSeed, destSeed, offset) {
          copyPropsMap[MakerJs2.pathType.Line](srcSeed, destSeed, offset);
          destSeed.controls = srcSeed.controls.map(function(p) {
            return MakerJs2.point.add(p, offset);
          });
        };
        function clone2(pathToClone, offset) {
          var result = { type: pathToClone.type, origin: MakerJs2.point.add(pathToClone.origin, offset) };
          var fn = copyPropsMap[pathToClone.type];
          if (fn) {
            fn(pathToClone, result, offset);
          }
          copyLayer(pathToClone, result);
          return result;
        }
        path2.clone = clone2;
        function copyProps(srcPath, destPath) {
          var fn = copyPropsMap[srcPath.type];
          if (fn) {
            destPath.origin = MakerJs2.point.clone(srcPath.origin);
            fn(srcPath, destPath);
          }
          copyLayer(srcPath, destPath);
          return srcPath;
        }
        path2.copyProps = copyProps;
        var mirrorMap = {};
        mirrorMap[MakerJs2.pathType.Line] = function(line, origin, mirrorX, mirrorY) {
          return new MakerJs2.paths.Line(origin, MakerJs2.point.mirror(line.end, mirrorX, mirrorY));
        };
        mirrorMap[MakerJs2.pathType.Circle] = function(circle, origin, mirrorX, mirrorY) {
          return new MakerJs2.paths.Circle(origin, circle.radius);
        };
        mirrorMap[MakerJs2.pathType.Arc] = function(arc, origin, mirrorX, mirrorY) {
          var startAngle = MakerJs2.angle.mirror(arc.startAngle, mirrorX, mirrorY);
          var endAngle = MakerJs2.angle.mirror(MakerJs2.angle.ofArcEnd(arc), mirrorX, mirrorY);
          var xor = mirrorX != mirrorY;
          return new MakerJs2.paths.Arc(origin, arc.radius, xor ? endAngle : startAngle, xor ? startAngle : endAngle);
        };
        mirrorMap[MakerJs2.pathType.BezierSeed] = function(seed, origin, mirrorX, mirrorY) {
          var mirrored = mirrorMap[MakerJs2.pathType.Line](seed, origin, mirrorX, mirrorY);
          mirrored.type = MakerJs2.pathType.BezierSeed;
          mirrored.controls = seed.controls.map(function(c) {
            return MakerJs2.point.mirror(c, mirrorX, mirrorY);
          });
          return mirrored;
        };
        function layer(pathContext, layer2) {
          pathContext.layer = layer2;
          return pathContext;
        }
        path2.layer = layer;
        function mirror(pathToMirror, mirrorX, mirrorY) {
          var newPath = null;
          if (pathToMirror) {
            var origin = MakerJs2.point.mirror(pathToMirror.origin, mirrorX, mirrorY);
            var fn = mirrorMap[pathToMirror.type];
            if (fn) {
              newPath = fn(pathToMirror, origin, mirrorX, mirrorY);
            }
          }
          copyLayer(pathToMirror, newPath);
          return newPath;
        }
        path2.mirror = mirror;
        var moveMap = {};
        moveMap[MakerJs2.pathType.Line] = function(line, origin) {
          var delta = MakerJs2.point.subtract(line.end, line.origin);
          line.end = MakerJs2.point.add(origin, delta);
        };
        function move(pathToMove, origin) {
          if (pathToMove) {
            var fn = moveMap[pathToMove.type];
            if (fn) {
              fn(pathToMove, origin);
            }
            pathToMove.origin = origin;
          }
          return pathToMove;
        }
        path2.move = move;
        var moveRelativeMap = {};
        moveRelativeMap[MakerJs2.pathType.Line] = function(line, delta, subtract) {
          line.end = MakerJs2.point.add(line.end, delta, subtract);
        };
        moveRelativeMap[MakerJs2.pathType.BezierSeed] = function(seed, delta, subtract) {
          moveRelativeMap[MakerJs2.pathType.Line](seed, delta, subtract);
          seed.controls = seed.controls.map(function(c) {
            return MakerJs2.point.add(c, delta, subtract);
          });
        };
        function moveRelative(pathToMove, delta, subtract) {
          if (pathToMove && delta) {
            pathToMove.origin = MakerJs2.point.add(pathToMove.origin, delta, subtract);
            var fn = moveRelativeMap[pathToMove.type];
            if (fn) {
              fn(pathToMove, delta, subtract);
            }
          }
          return pathToMove;
        }
        path2.moveRelative = moveRelative;
        function moveTemporary(pathsToMove, deltas, task) {
          var subtract = false;
          function move2(pathToOffset, i) {
            if (deltas[i]) {
              moveRelative(pathToOffset, deltas[i], subtract);
            }
          }
          pathsToMove.map(move2);
          task();
          subtract = true;
          pathsToMove.map(move2);
        }
        path2.moveTemporary = moveTemporary;
        var rotateMap = {};
        rotateMap[MakerJs2.pathType.Line] = function(line, angleInDegrees, rotationOrigin) {
          line.end = MakerJs2.point.rotate(line.end, angleInDegrees, rotationOrigin);
        };
        rotateMap[MakerJs2.pathType.Arc] = function(arc, angleInDegrees, rotationOrigin) {
          arc.startAngle = MakerJs2.angle.noRevolutions(arc.startAngle + angleInDegrees);
          arc.endAngle = MakerJs2.angle.noRevolutions(arc.endAngle + angleInDegrees);
        };
        rotateMap[MakerJs2.pathType.BezierSeed] = function(seed, angleInDegrees, rotationOrigin) {
          rotateMap[MakerJs2.pathType.Line](seed, angleInDegrees, rotationOrigin);
          seed.controls = seed.controls.map(function(c) {
            return MakerJs2.point.rotate(c, angleInDegrees, rotationOrigin);
          });
        };
        function rotate(pathToRotate, angleInDegrees, rotationOrigin) {
          if (rotationOrigin === void 0) {
            rotationOrigin = [0, 0];
          }
          if (!pathToRotate || !angleInDegrees)
            return pathToRotate;
          pathToRotate.origin = MakerJs2.point.rotate(pathToRotate.origin, angleInDegrees, rotationOrigin);
          var fn = rotateMap[pathToRotate.type];
          if (fn) {
            fn(pathToRotate, angleInDegrees, rotationOrigin);
          }
          return pathToRotate;
        }
        path2.rotate = rotate;
        var scaleMap = {};
        scaleMap[MakerJs2.pathType.Line] = function(line, scaleValue) {
          line.end = MakerJs2.point.scale(line.end, scaleValue);
        };
        scaleMap[MakerJs2.pathType.BezierSeed] = function(seed, scaleValue) {
          scaleMap[MakerJs2.pathType.Line](seed, scaleValue);
          seed.controls = seed.controls.map(function(c) {
            return MakerJs2.point.scale(c, scaleValue);
          });
        };
        scaleMap[MakerJs2.pathType.Circle] = function(circle, scaleValue) {
          circle.radius *= scaleValue;
        };
        scaleMap[MakerJs2.pathType.Arc] = scaleMap[MakerJs2.pathType.Circle];
        function scale(pathToScale, scaleValue) {
          if (!pathToScale || scaleValue === 1 || !scaleValue)
            return pathToScale;
          pathToScale.origin = MakerJs2.point.scale(pathToScale.origin, scaleValue);
          var fn = scaleMap[pathToScale.type];
          if (fn) {
            fn(pathToScale, scaleValue);
          }
          return pathToScale;
        }
        path2.scale = scale;
        var distortMap = {};
        distortMap[MakerJs2.pathType.Arc] = function(arc, scaleX, scaleY) {
          return new MakerJs2.models.EllipticArc(arc, scaleX, scaleY);
        };
        distortMap[MakerJs2.pathType.Circle] = function(circle, scaleX, scaleY) {
          var ellipse = new MakerJs2.models.Ellipse(circle.radius * scaleX, circle.radius * scaleY);
          ellipse.origin = MakerJs2.point.distort(circle.origin, scaleX, scaleY);
          return ellipse;
        };
        distortMap[MakerJs2.pathType.Line] = function(line, scaleX, scaleY) {
          return new MakerJs2.paths.Line([line.origin, line.end].map(function(p) {
            return MakerJs2.point.distort(p, scaleX, scaleY);
          }));
        };
        distortMap[MakerJs2.pathType.BezierSeed] = function(seed, scaleX, scaleY) {
          var d = MakerJs2.point.distort;
          return {
            type: MakerJs2.pathType.BezierSeed,
            origin: d(seed.origin, scaleX, scaleY),
            controls: seed.controls.map(function(c) {
              return d(c, scaleX, scaleY);
            }),
            end: d(seed.end, scaleX, scaleY)
          };
        };
        function distort(pathToDistort, scaleX, scaleY) {
          if (!pathToDistort || !scaleX || !scaleY)
            return null;
          var fn = distortMap[pathToDistort.type];
          if (fn) {
            var distorted = fn(pathToDistort, scaleX, scaleY);
            if (typeof pathToDistort.layer !== "undefined") {
              distorted.layer = pathToDistort.layer;
            }
            return distorted;
          }
          return null;
        }
        path2.distort = distort;
        function converge(lineA, lineB, useOriginA, useOriginB) {
          var p = MakerJs2.point.fromSlopeIntersection(lineA, lineB);
          if (p) {
            let setPoint2 = function(line, useOrigin2) {
              var setP;
              if (useOrigin2) {
                setP = line.origin;
              } else {
                setP = line.end;
              }
              setP[0] = p[0];
              setP[1] = p[1];
            };
            var setPoint = setPoint2;
            var lines = [lineA, lineB];
            var useOrigin = [useOriginA, useOriginB];
            if (arguments.length === 2) {
              lines.forEach(function(line, i) {
                useOrigin[i] = MakerJs2.point.closest(p, [line.origin, line.end]) === line.origin;
              });
            }
            lines.forEach(function(line, i) {
              setPoint2(line, useOrigin[i]);
            });
          }
          return p;
        }
        path2.converge = converge;
        var alterMap = {};
        alterMap[MakerJs2.pathType.Arc] = function(arc, pathLength, distance, useOrigin) {
          var span = MakerJs2.angle.ofArcSpan(arc);
          var delta = (pathLength + distance) * span / pathLength - span;
          if (useOrigin) {
            arc.startAngle -= delta;
          } else {
            arc.endAngle += delta;
          }
        };
        alterMap[MakerJs2.pathType.Circle] = function(circle, pathLength, distance, useOrigin) {
          circle.radius *= (pathLength + distance) / pathLength;
        };
        alterMap[MakerJs2.pathType.Line] = function(line, pathLength, distance, useOrigin) {
          var delta = MakerJs2.point.scale(MakerJs2.point.subtract(line.end, line.origin), distance / pathLength);
          if (useOrigin) {
            line.origin = MakerJs2.point.subtract(line.origin, delta);
          } else {
            line.end = MakerJs2.point.add(line.end, delta);
          }
        };
        function alterLength(pathToAlter, distance, useOrigin) {
          if (useOrigin === void 0) {
            useOrigin = false;
          }
          if (!pathToAlter || !distance)
            return null;
          var fn = alterMap[pathToAlter.type];
          if (fn) {
            var pathLength = MakerJs2.measure.pathLength(pathToAlter);
            if (!pathLength || -distance >= pathLength)
              return null;
            fn(pathToAlter, pathLength, distance, useOrigin);
            return pathToAlter;
          }
          return null;
        }
        path2.alterLength = alterLength;
        function toPoints(pathContext, numberOfPoints) {
          if (numberOfPoints == 1) {
            return [MakerJs2.point.middle(pathContext)];
          }
          var points = [];
          var base = numberOfPoints;
          if (pathContext.type != MakerJs2.pathType.Circle)
            base--;
          for (var i = 0; i < numberOfPoints; i++) {
            points.push(MakerJs2.point.middle(pathContext, i / base));
          }
          return points;
        }
        path2.toPoints = toPoints;
        var numberOfKeyPointsMap = {};
        numberOfKeyPointsMap[MakerJs2.pathType.Line] = function(line) {
          return 2;
        };
        numberOfKeyPointsMap[MakerJs2.pathType.Circle] = function(circle, maxPointDistance) {
          var len = MakerJs2.measure.pathLength(circle);
          if (!len)
            return 0;
          maxPointDistance = maxPointDistance || len;
          return Math.max(8, Math.ceil(len / (maxPointDistance || len)));
        };
        numberOfKeyPointsMap[MakerJs2.pathType.Arc] = function(arc, maxPointDistance) {
          var len = MakerJs2.measure.pathLength(arc);
          if (!len)
            return 0;
          var minPoints = Math.ceil(MakerJs2.angle.ofArcSpan(arc) / 45) + 1;
          return Math.max(minPoints, Math.ceil(len / (maxPointDistance || len)));
        };
        function toKeyPoints(pathContext, maxArcFacet) {
          if (pathContext.type == MakerJs2.pathType.BezierSeed) {
            var curve = new MakerJs2.models.BezierCurve(pathContext);
            var curveKeyPoints;
            MakerJs2.model.findChains(curve, function(chains, loose, layer2) {
              if (chains.length == 1) {
                var c = chains[0];
                switch (c.links[0].walkedPath.pathId) {
                  case "arc_0":
                  case "line_0":
                    break;
                  default:
                    MakerJs2.chain.reverse(c);
                }
                curveKeyPoints = MakerJs2.chain.toKeyPoints(c);
              } else if (loose.length === 1) {
                curveKeyPoints = toKeyPoints(loose[0].pathContext);
              }
            });
            return curveKeyPoints;
          } else {
            var fn = numberOfKeyPointsMap[pathContext.type];
            if (fn) {
              var numberOfKeyPoints = fn(pathContext, maxArcFacet);
              if (numberOfKeyPoints) {
                return toPoints(pathContext, numberOfKeyPoints);
              }
            }
          }
          return [];
        }
        path2.toKeyPoints = toKeyPoints;
        function center(pathToCenter) {
          var m = MakerJs2.measure.pathExtents(pathToCenter);
          var c = MakerJs2.point.average(m.high, m.low);
          var o = MakerJs2.point.subtract(pathToCenter.origin || [0, 0], c);
          move(pathToCenter, o);
          return pathToCenter;
        }
        path2.center = center;
        function zero(pathToZero) {
          var m = MakerJs2.measure.pathExtents(pathToZero);
          var z = MakerJs2.point.subtract(pathToZero.origin || [0, 0], m.low);
          move(pathToZero, z);
          return pathToZero;
        }
        path2.zero = zero;
      })(path = MakerJs2.path || (MakerJs2.path = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var path;
      (function(path_1) {
        var breakPathFunctionMap = {};
        breakPathFunctionMap[MakerJs2.pathType.Arc] = function(arc, pointOfBreak) {
          var angleAtBreakPoint = MakerJs2.angle.ofPointInDegrees(arc.origin, pointOfBreak);
          if (MakerJs2.measure.isAngleEqual(angleAtBreakPoint, arc.startAngle) || MakerJs2.measure.isAngleEqual(angleAtBreakPoint, arc.endAngle)) {
            return null;
          }
          function getAngleStrictlyBetweenArcAngles() {
            var startAngle = MakerJs2.angle.noRevolutions(arc.startAngle);
            var endAngle = startAngle + MakerJs2.angle.ofArcEnd(arc) - arc.startAngle;
            var tries = [0, 1, -1];
            for (var i = 0; i < tries.length; i++) {
              var add = 360 * tries[i];
              if (MakerJs2.measure.isBetween(angleAtBreakPoint + add, startAngle, endAngle, true)) {
                return arc.startAngle + angleAtBreakPoint + add - startAngle;
              }
            }
            return null;
          }
          var angleAtBreakPointBetween = getAngleStrictlyBetweenArcAngles();
          if (angleAtBreakPointBetween == null) {
            return null;
          }
          var savedEndAngle = arc.endAngle;
          arc.endAngle = angleAtBreakPointBetween;
          var copy = MakerJs2.cloneObject(arc);
          copy.startAngle = angleAtBreakPointBetween;
          copy.endAngle = savedEndAngle;
          return copy;
        };
        breakPathFunctionMap[MakerJs2.pathType.Circle] = function(circle, pointOfBreak) {
          circle.type = MakerJs2.pathType.Arc;
          var arc = circle;
          var angleAtBreakPoint = MakerJs2.angle.ofPointInDegrees(circle.origin, pointOfBreak);
          arc.startAngle = angleAtBreakPoint;
          arc.endAngle = angleAtBreakPoint + 360;
          return null;
        };
        breakPathFunctionMap[MakerJs2.pathType.Line] = function(line, pointOfBreak) {
          if (!MakerJs2.measure.isBetweenPoints(pointOfBreak, line, true)) {
            return null;
          }
          var savedEndPoint = line.end;
          line.end = pointOfBreak;
          var copy = MakerJs2.cloneObject(line);
          copy.origin = pointOfBreak;
          copy.end = savedEndPoint;
          return copy;
        };
        function breakAtPoint(pathToBreak, pointOfBreak) {
          if (pathToBreak && pointOfBreak) {
            var fn = breakPathFunctionMap[pathToBreak.type];
            if (fn) {
              var result = fn(pathToBreak, pointOfBreak);
              if (result && "layer" in pathToBreak) {
                result.layer = pathToBreak.layer;
              }
              return result;
            }
          }
          return null;
        }
        path_1.breakAtPoint = breakAtPoint;
      })(path = MakerJs2.path || (MakerJs2.path = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var paths;
      (function(paths2) {
        var Arc = (
          /** @class */
          /* @__PURE__ */ (function() {
            function Arc2() {
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
              }
              var _a, _b;
              function getSpan(origin) {
                var startAngle = MakerJs2.angle.ofPointInDegrees(origin, args[clockwise ? 1 : 0]);
                var endAngle = MakerJs2.angle.ofPointInDegrees(origin, args[clockwise ? 0 : 1]);
                if (endAngle < startAngle) {
                  endAngle += 360;
                }
                return {
                  origin,
                  startAngle,
                  endAngle,
                  size: endAngle - startAngle
                };
              }
              switch (args.length) {
                case 5:
                  var pointA = args[0];
                  var pointB = args[1];
                  this.radius = args[2];
                  var largeArc = args[3];
                  var clockwise = args[4];
                  var span;
                  var smallestRadius = MakerJs2.measure.pointDistance(pointA, pointB) / 2;
                  if (MakerJs2.round(this.radius - smallestRadius) <= 0) {
                    this.radius = smallestRadius;
                    span = getSpan(MakerJs2.point.average(pointA, pointB));
                  } else {
                    var intersectionPoints = (_b = (_a = MakerJs2.path.intersection(new Circle(pointA, this.radius), new Circle(pointB, this.radius))) === null || _a === void 0 ? void 0 : _a.intersectionPoints) !== null && _b !== void 0 ? _b : [pointA, pointB];
                    var spans = [];
                    for (var i = intersectionPoints.length; i--; ) {
                      span = getSpan(intersectionPoints[i]);
                      if (spans.length == 0 || span.size > spans[0].size) {
                        spans.push(span);
                      } else {
                        spans.unshift(span);
                      }
                    }
                    var index = largeArc ? 1 : 0;
                    span = spans[index];
                  }
                  this.origin = span.origin;
                  this.startAngle = span.startAngle;
                  this.endAngle = span.endAngle;
                  break;
                case 4:
                  this.origin = args[0];
                  this.radius = args[1];
                  this.startAngle = args[2];
                  this.endAngle = args[3];
                  break;
                case 3:
                  if (MakerJs2.isPoint(args[2])) {
                    Circle.apply(this, args);
                    var angles = [];
                    for (var i_1 = 0; i_1 < 3; i_1++) {
                      angles.push(MakerJs2.angle.ofPointInDegrees(this.origin, args[i_1]));
                    }
                    this.startAngle = angles[0];
                    this.endAngle = angles[2];
                    if (!MakerJs2.measure.isBetweenArcAngles(angles[1], this, false)) {
                      this.startAngle = angles[2];
                      this.endAngle = angles[0];
                    }
                    break;
                  }
                //fall through to below if 2 points
                case 2:
                  var clockwise = args[2];
                  Circle.call(this, args[0], args[1]);
                  this.startAngle = MakerJs2.angle.ofPointInDegrees(this.origin, args[clockwise ? 1 : 0]);
                  this.endAngle = MakerJs2.angle.ofPointInDegrees(this.origin, args[clockwise ? 0 : 1]);
                  break;
              }
              this.type = MakerJs2.pathType.Arc;
            }
            return Arc2;
          })()
        );
        paths2.Arc = Arc;
        var Circle = (
          /** @class */
          /* @__PURE__ */ (function() {
            function Circle2() {
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
              }
              this.type = MakerJs2.pathType.Circle;
              switch (args.length) {
                case 1:
                  this.origin = [0, 0];
                  this.radius = args[0];
                  break;
                case 2:
                  if (MakerJs2.isNumber(args[1])) {
                    this.origin = args[0];
                    this.radius = args[1];
                  } else {
                    this.origin = MakerJs2.point.average(args[0], args[1]);
                    this.radius = MakerJs2.measure.pointDistance(this.origin, args[0]);
                  }
                  break;
                default:
                  var lines = [
                    new Line(args[0], args[1]),
                    new Line(args[1], args[2])
                  ];
                  var perpendiculars = [];
                  for (var i = 2; i--; ) {
                    var midpoint = MakerJs2.point.middle(lines[i]);
                    perpendiculars.push(MakerJs2.path.rotate(lines[i], 90, midpoint));
                  }
                  var origin = MakerJs2.point.fromSlopeIntersection(perpendiculars[0], perpendiculars[1]);
                  if (origin) {
                    this.origin = origin;
                    this.radius = MakerJs2.measure.pointDistance(this.origin, args[0]);
                  } else {
                    throw "invalid parameters - attempted to construct a circle from 3 points on a line: " + JSON.stringify(args);
                  }
                  break;
              }
            }
            return Circle2;
          })()
        );
        paths2.Circle = Circle;
        var Line = (
          /** @class */
          /* @__PURE__ */ (function() {
            function Line2() {
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
              }
              this.type = MakerJs2.pathType.Line;
              switch (args.length) {
                case 1:
                  var points = args[0];
                  this.origin = points[0];
                  this.end = points[1];
                  break;
                case 2:
                  this.origin = args[0];
                  this.end = args[1];
                  break;
              }
            }
            return Line2;
          })()
        );
        paths2.Line = Line;
        var Chord = (
          /** @class */
          /* @__PURE__ */ (function() {
            function Chord2(arc) {
              var arcPoints = MakerJs2.point.fromArc(arc);
              this.type = MakerJs2.pathType.Line;
              this.origin = arcPoints[0];
              this.end = arcPoints[1];
            }
            return Chord2;
          })()
        );
        paths2.Chord = Chord;
        var Parallel = (
          /** @class */
          /* @__PURE__ */ (function() {
            function Parallel2(toLine, distance, nearPoint) {
              this.type = MakerJs2.pathType.Line;
              this.origin = MakerJs2.point.clone(toLine.origin);
              this.end = MakerJs2.point.clone(toLine.end);
              var angleOfLine = MakerJs2.angle.ofLineInDegrees(this);
              function getNewOrigin(offsetAngle) {
                var origin = MakerJs2.point.add(toLine.origin, MakerJs2.point.fromPolar(MakerJs2.angle.toRadians(angleOfLine + offsetAngle), distance));
                return {
                  origin,
                  nearness: MakerJs2.measure.pointDistance(origin, nearPoint)
                };
              }
              var newOrigins = [getNewOrigin(-90), getNewOrigin(90)];
              var newOrigin = newOrigins[0].nearness < newOrigins[1].nearness ? newOrigins[0].origin : newOrigins[1].origin;
              MakerJs2.path.move(this, newOrigin);
            }
            return Parallel2;
          })()
        );
        paths2.Parallel = Parallel;
      })(paths = MakerJs2.paths || (MakerJs2.paths = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var model;
      (function(model2) {
        function addCaption(modelContext, text, leftAnchorPoint, rightAnchorPoint) {
          if (!leftAnchorPoint) {
            leftAnchorPoint = MakerJs2.point.zero();
          }
          if (!rightAnchorPoint) {
            rightAnchorPoint = MakerJs2.point.clone(leftAnchorPoint);
          }
          modelContext.caption = { text, anchor: new MakerJs2.paths.Line(leftAnchorPoint, rightAnchorPoint) };
          return modelContext;
        }
        model2.addCaption = addCaption;
        function addPath(modelContext, pathContext, pathId, overWrite) {
          if (overWrite === void 0) {
            overWrite = false;
          }
          var id = overWrite ? pathId : getSimilarPathId(modelContext, pathId);
          modelContext.paths = modelContext.paths || {};
          modelContext.paths[id] = pathContext;
          return modelContext;
        }
        model2.addPath = addPath;
        function addModel(parentModel, childModel, childModelId, overWrite) {
          if (overWrite === void 0) {
            overWrite = false;
          }
          var id = overWrite ? childModelId : getSimilarModelId(parentModel, childModelId);
          parentModel.models = parentModel.models || {};
          parentModel.models[id] = childModel;
          return parentModel;
        }
        model2.addModel = addModel;
        function addTo(childModel, parentModel, childModelId, overWrite) {
          if (overWrite === void 0) {
            overWrite = false;
          }
          addModel(parentModel, childModel, childModelId, overWrite);
          return childModel;
        }
        model2.addTo = addTo;
        function clone2(modelToClone) {
          return MakerJs2.cloneObject(modelToClone);
        }
        model2.clone = clone2;
        function countChildModels(modelContext) {
          var count = 0;
          if (modelContext.models) {
            for (var id in modelContext.models) {
              count++;
            }
          }
          return count;
        }
        model2.countChildModels = countChildModels;
        function getAllCaptionsOffset(modelContext) {
          var captions = [];
          function tryAddCaption(m, offset, layer2) {
            if (m.caption) {
              captions.push({ text: m.caption.text, anchor: MakerJs2.path.clone(m.caption.anchor, MakerJs2.point.add(m.origin, offset)), layer: m.caption.anchor.layer || layer2 });
            }
          }
          tryAddCaption(modelContext, modelContext.origin, modelContext.layer);
          model2.walk(modelContext, {
            afterChildWalk: function(wm) {
              return tryAddCaption(wm.childModel, wm.offset, wm.layer);
            }
          });
          return captions;
        }
        model2.getAllCaptionsOffset = getAllCaptionsOffset;
        function getSimilarId(map, id) {
          if (!map)
            return id;
          var i = 0;
          var newId = id;
          while (newId in map) {
            i++;
            newId = [id, i].join("_");
          }
          return newId;
        }
        function getSimilarModelId(modelContext, modelId) {
          return getSimilarId(modelContext.models, modelId);
        }
        model2.getSimilarModelId = getSimilarModelId;
        function getSimilarPathId(modelContext, pathId) {
          return getSimilarId(modelContext.paths, pathId);
        }
        model2.getSimilarPathId = getSimilarPathId;
        function layer(modelContext, layer2) {
          modelContext.layer = layer2;
          return modelContext;
        }
        model2.layer = layer;
        function originate(modelToOriginate, origin) {
          function innerOriginate(m, o) {
            if (!m)
              return;
            var newOrigin = MakerJs2.point.add(m.origin, o);
            if (m.type === MakerJs2.models.BezierCurve.typeName) {
              MakerJs2.path.moveRelative(m.seed, newOrigin);
            }
            if (m.paths) {
              for (var id in m.paths) {
                MakerJs2.path.moveRelative(m.paths[id], newOrigin);
              }
            }
            if (m.models) {
              for (var id in m.models) {
                innerOriginate(m.models[id], newOrigin);
              }
            }
            if (m.caption) {
              MakerJs2.path.moveRelative(m.caption.anchor, newOrigin);
            }
            m.origin = MakerJs2.point.zero();
          }
          innerOriginate(modelToOriginate, origin ? MakerJs2.point.subtract([0, 0], origin) : [0, 0]);
          if (origin) {
            modelToOriginate.origin = origin;
          }
          return modelToOriginate;
        }
        model2.originate = originate;
        function center(modelToCenter, centerX, centerY) {
          if (centerX === void 0) {
            centerX = true;
          }
          if (centerY === void 0) {
            centerY = true;
          }
          var m = MakerJs2.measure.modelExtents(modelToCenter);
          var o = modelToCenter.origin || [0, 0];
          if (centerX)
            o[0] -= m.center[0];
          if (centerY)
            o[1] -= m.center[1];
          modelToCenter.origin = o;
          return modelToCenter;
        }
        model2.center = center;
        function mirror(modelToMirror, mirrorX, mirrorY) {
          var newModel = {};
          if (!modelToMirror)
            return null;
          if (modelToMirror.origin) {
            newModel.origin = MakerJs2.point.mirror(modelToMirror.origin, mirrorX, mirrorY);
          }
          if (modelToMirror.type) {
            newModel.type = modelToMirror.type;
          }
          if ("layer" in modelToMirror) {
            newModel.layer = modelToMirror.layer;
          }
          if (modelToMirror.units) {
            newModel.units = modelToMirror.units;
          }
          if (modelToMirror.type === MakerJs2.models.BezierCurve.typeName) {
            newModel.type = MakerJs2.models.BezierCurve.typeName;
            newModel.seed = MakerJs2.path.mirror(modelToMirror.seed, mirrorX, mirrorY);
          }
          if (modelToMirror.paths) {
            newModel.paths = {};
            for (var id in modelToMirror.paths) {
              var pathToMirror = modelToMirror.paths[id];
              if (!pathToMirror)
                continue;
              var pathMirrored = MakerJs2.path.mirror(pathToMirror, mirrorX, mirrorY);
              if (!pathMirrored)
                continue;
              newModel.paths[id] = pathMirrored;
            }
          }
          if (modelToMirror.models) {
            newModel.models = {};
            for (var id in modelToMirror.models) {
              var childModelToMirror = modelToMirror.models[id];
              if (!childModelToMirror)
                continue;
              var childModelMirrored = mirror(childModelToMirror, mirrorX, mirrorY);
              if (!childModelMirrored)
                continue;
              newModel.models[id] = childModelMirrored;
            }
          }
          if (modelToMirror.caption) {
            newModel.caption = MakerJs2.cloneObject(modelToMirror.caption);
            newModel.caption.anchor = MakerJs2.path.mirror(modelToMirror.caption.anchor, mirrorX, mirrorY);
          }
          return newModel;
        }
        model2.mirror = mirror;
        function move(modelToMove, origin) {
          modelToMove.origin = MakerJs2.point.clone(origin);
          return modelToMove;
        }
        model2.move = move;
        function moveRelative(modelToMove, delta) {
          if (modelToMove) {
            modelToMove.origin = MakerJs2.point.add(modelToMove.origin || MakerJs2.point.zero(), delta);
          }
          return modelToMove;
        }
        model2.moveRelative = moveRelative;
        function prefixPathIds(modelToPrefix, prefix) {
          var walkedPaths = [];
          walk(modelToPrefix, {
            onPath: function(walkedPath2) {
              walkedPaths.push(walkedPath2);
            }
          });
          for (var i = 0; i < walkedPaths.length; i++) {
            var walkedPath = walkedPaths[i];
            delete walkedPath.modelContext.paths[walkedPath.pathId];
            walkedPath.modelContext.paths[prefix + walkedPath.pathId] = walkedPath.pathContext;
          }
          return modelToPrefix;
        }
        model2.prefixPathIds = prefixPathIds;
        function rotate(modelToRotate, angleInDegrees, rotationOrigin) {
          if (rotationOrigin === void 0) {
            rotationOrigin = [0, 0];
          }
          if (!modelToRotate || !angleInDegrees)
            return modelToRotate;
          var offsetOrigin = MakerJs2.point.subtract(rotationOrigin, modelToRotate.origin);
          if (modelToRotate.type === MakerJs2.models.BezierCurve.typeName) {
            MakerJs2.path.rotate(modelToRotate.seed, angleInDegrees, offsetOrigin);
          }
          if (modelToRotate.paths) {
            for (var id in modelToRotate.paths) {
              MakerJs2.path.rotate(modelToRotate.paths[id], angleInDegrees, offsetOrigin);
            }
          }
          if (modelToRotate.models) {
            for (var id in modelToRotate.models) {
              rotate(modelToRotate.models[id], angleInDegrees, offsetOrigin);
            }
          }
          if (modelToRotate.caption) {
            MakerJs2.path.rotate(modelToRotate.caption.anchor, angleInDegrees, offsetOrigin);
          }
          return modelToRotate;
        }
        model2.rotate = rotate;
        function scale(modelToScale, scaleValue, scaleOrigin) {
          if (scaleOrigin === void 0) {
            scaleOrigin = false;
          }
          if (scaleOrigin && modelToScale.origin) {
            modelToScale.origin = MakerJs2.point.scale(modelToScale.origin, scaleValue);
          }
          if (modelToScale.type === MakerJs2.models.BezierCurve.typeName) {
            MakerJs2.path.scale(modelToScale.seed, scaleValue);
          }
          if (modelToScale.paths) {
            for (var id in modelToScale.paths) {
              MakerJs2.path.scale(modelToScale.paths[id], scaleValue);
            }
          }
          if (modelToScale.models) {
            for (var id in modelToScale.models) {
              scale(modelToScale.models[id], scaleValue, true);
            }
          }
          if (modelToScale.caption) {
            MakerJs2.path.scale(modelToScale.caption.anchor, scaleValue);
          }
          return modelToScale;
        }
        model2.scale = scale;
        function addDistortedPath(parentModel, pathToDistort, pathId, layer2, scaleX, scaleY, bezierAccuracy) {
          var distortedPath = MakerJs2.path.distort(pathToDistort, scaleX, scaleY);
          layer2 = layer2 || pathToDistort.layer;
          if (layer2) {
            distortedPath.layer = layer2;
          }
          if (MakerJs2.isPath(distortedPath)) {
            if (distortedPath.type === MakerJs2.pathType.BezierSeed) {
              var curve = new MakerJs2.models.BezierCurve(distortedPath, bezierAccuracy);
              addModel(parentModel, curve, pathId);
            } else {
              addPath(parentModel, distortedPath, pathId);
            }
          } else {
            addModel(parentModel, distortedPath, pathId);
          }
        }
        function distort(modelToDistort, scaleX, scaleY, scaleOrigin, bezierAccuracy) {
          if (scaleOrigin === void 0) {
            scaleOrigin = false;
          }
          var distorted = {};
          if (modelToDistort.layer) {
            distorted.layer = modelToDistort.layer;
          }
          if (scaleOrigin && modelToDistort.origin) {
            distorted.origin = MakerJs2.point.distort(modelToDistort.origin, scaleX, scaleY);
          }
          if (modelToDistort.type === MakerJs2.models.BezierCurve.typeName) {
            var b = modelToDistort;
            var bezierPartsByLayer = MakerJs2.models.BezierCurve.getBezierSeeds(b, { byLayers: true, pointMatchingDistance: bezierAccuracy });
            var _loop_1 = function(layer_12) {
              var pathArray = bezierPartsByLayer[layer_12];
              pathArray.forEach(function(p, i) {
                addDistortedPath(distorted, p, i.toString(), layer_12, scaleX, scaleY, bezierAccuracy);
              });
            };
            for (var layer_1 in bezierPartsByLayer) {
              _loop_1(layer_1);
            }
          } else if (modelToDistort.paths) {
            for (var pathId in modelToDistort.paths) {
              var pathToDistort = modelToDistort.paths[pathId];
              addDistortedPath(distorted, pathToDistort, pathId, null, scaleX, scaleY, bezierAccuracy);
            }
          }
          if (modelToDistort.models) {
            for (var childId in modelToDistort.models) {
              var childModel = modelToDistort.models[childId];
              var distortedChild = distort(childModel, scaleX, scaleY, true, bezierAccuracy);
              addModel(distorted, distortedChild, childId);
            }
          }
          if (modelToDistort.caption) {
            distorted.caption = MakerJs2.cloneObject(modelToDistort.caption);
            distorted.caption.anchor = MakerJs2.path.distort(modelToDistort.caption.anchor, scaleX, scaleY);
          }
          return distorted;
        }
        model2.distort = distort;
        function convertUnits(modeltoConvert, destUnitType) {
          if (modeltoConvert.units && MakerJs2.units.isValidUnit(modeltoConvert.units) && MakerJs2.units.isValidUnit(destUnitType)) {
            var ratio = MakerJs2.units.conversionScale(modeltoConvert.units, destUnitType);
            if (ratio != 1) {
              scale(modeltoConvert, ratio);
              modeltoConvert.units = destUnitType;
            }
          }
          return modeltoConvert;
        }
        model2.convertUnits = convertUnits;
        function walkPaths(modelContext, callback) {
          if (modelContext.paths) {
            for (var pathId in modelContext.paths) {
              if (!modelContext.paths[pathId])
                continue;
              callback(modelContext, pathId, modelContext.paths[pathId]);
            }
          }
          if (modelContext.models) {
            for (var id in modelContext.models) {
              if (!modelContext.models[id])
                continue;
              walkPaths(modelContext.models[id], callback);
            }
          }
        }
        model2.walkPaths = walkPaths;
        function walk(modelContext, options) {
          if (!modelContext)
            return;
          function walkRecursive(modelContext2, layer2, offset, route, routeKey) {
            var newOffset = MakerJs2.point.add(modelContext2.origin, offset);
            layer2 = layer2 != void 0 ? layer2 : "";
            if (modelContext2.paths) {
              for (var pathId in modelContext2.paths) {
                var pathContext = modelContext2.paths[pathId];
                if (!pathContext)
                  continue;
                var walkedPath = {
                  modelContext: modelContext2,
                  layer: pathContext.layer != void 0 ? pathContext.layer : layer2,
                  offset: newOffset,
                  pathContext,
                  pathId,
                  route: route.concat(["paths", pathId]),
                  routeKey: routeKey + (routeKey ? "." : "") + "paths" + JSON.stringify([pathId])
                };
                if (options.onPath)
                  options.onPath(walkedPath);
              }
            }
            if (modelContext2.models) {
              for (var modelId in modelContext2.models) {
                var childModel = modelContext2.models[modelId];
                if (!childModel)
                  continue;
                var walkedModel = {
                  parentModel: modelContext2,
                  layer: childModel.layer != void 0 ? childModel.layer : layer2,
                  offset: newOffset,
                  route: route.concat(["models", modelId]),
                  routeKey: routeKey + (routeKey ? "." : "") + "models" + JSON.stringify([modelId]),
                  childId: modelId,
                  childModel
                };
                if (options.beforeChildWalk) {
                  if (!options.beforeChildWalk(walkedModel))
                    continue;
                }
                walkRecursive(walkedModel.childModel, walkedModel.layer, newOffset, walkedModel.route, walkedModel.routeKey);
                if (options.afterChildWalk) {
                  options.afterChildWalk(walkedModel);
                }
              }
            }
          }
          walkRecursive(modelContext, modelContext.layer, [0, 0], [], "");
          return modelContext;
        }
        model2.walk = walk;
        function zero(modelToZero, zeroX, zeroY) {
          if (zeroX === void 0) {
            zeroX = true;
          }
          if (zeroY === void 0) {
            zeroY = true;
          }
          var m = MakerJs2.measure.modelExtents(modelToZero);
          var z = modelToZero.origin || [0, 0];
          if (zeroX)
            z[0] -= m.low[0];
          if (zeroY)
            z[1] -= m.low[1];
          modelToZero.origin = z;
          return modelToZero;
        }
        model2.zero = zero;
      })(model = MakerJs2.model || (MakerJs2.model = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var model;
      (function(model2) {
        function getNonZeroSegments(pathToSegment, breakPoint) {
          var segment1 = MakerJs2.cloneObject(pathToSegment);
          if (!segment1)
            return null;
          var segment2 = MakerJs2.path.breakAtPoint(segment1, breakPoint);
          if (segment2) {
            var segments = [segment1, segment2];
            for (var i = 2; i--; ) {
              if (MakerJs2.round(MakerJs2.measure.pathLength(segments[i]), 1e-4) == 0) {
                return null;
              }
            }
            return segments;
          } else if (pathToSegment.type == MakerJs2.pathType.Circle) {
            return [segment1];
          }
          return null;
        }
        function getPointsOnPath(points, onPath, popOptions) {
          var endpointsOnPath = [];
          points.forEach(function(p) {
            if (MakerJs2.measure.isPointOnPath(p, onPath, 1e-5, null, popOptions)) {
              endpointsOnPath.push(p);
            }
          });
          return endpointsOnPath;
        }
        function breakAlongForeignPath(crossedPath, overlappedSegments, foreignWalkedPath) {
          var foreignPath = foreignWalkedPath.pathContext;
          var segments = crossedPath.segments;
          if (MakerJs2.measure.isPathEqual(segments[0].absolutePath, foreignPath, 1e-4, null, foreignWalkedPath.offset)) {
            segments[0].overlapped = true;
            segments[0].duplicate = true;
            overlappedSegments.push(segments[0]);
            return;
          }
          var popOptions = {};
          var options = { path1Offset: crossedPath.offset, path2Offset: foreignWalkedPath.offset };
          var foreignIntersection = MakerJs2.path.intersection(crossedPath.pathContext, foreignPath, options);
          var intersectionPoints = foreignIntersection ? foreignIntersection.intersectionPoints : null;
          var foreignPathEndPoints = MakerJs2.point.fromPathEnds(foreignPath, foreignWalkedPath.offset) || [];
          for (var i = 0; i < segments.length; i++) {
            var pointsOfInterest = intersectionPoints ? foreignPathEndPoints.concat(intersectionPoints) : foreignPathEndPoints;
            var pointsToCheck = getPointsOnPath(pointsOfInterest, segments[i].absolutePath, popOptions);
            if (options.out_AreOverlapped) {
              segments[i].overlapped = true;
              overlappedSegments.push(segments[i]);
            }
            if (pointsToCheck.length > 0) {
              var subSegments = null;
              var p = 0;
              while (!subSegments && p < pointsToCheck.length) {
                subSegments = getNonZeroSegments(segments[i].absolutePath, pointsToCheck[p]);
                p++;
              }
              if (subSegments) {
                crossedPath.broken = true;
                segments[i].absolutePath = subSegments[0];
                if (subSegments[1]) {
                  var newSegment = {
                    absolutePath: subSegments[1],
                    pathId: segments[0].pathId,
                    overlapped: segments[i].overlapped,
                    uniqueForeignIntersectionPoints: []
                  };
                  if (segments[i].overlapped) {
                    overlappedSegments.push(newSegment);
                  }
                  segments.push(newSegment);
                }
                i--;
              }
            }
          }
        }
        function isPathInsideModel(pathContext, modelContext, pathOffset, farPoint, measureAtlas) {
          var options = {
            farPoint,
            measureAtlas
          };
          var p = MakerJs2.point.add(MakerJs2.point.middle(pathContext), pathOffset);
          return MakerJs2.measure.isPointInsideModel(p, modelContext, options);
        }
        model2.isPathInsideModel = isPathInsideModel;
        function breakPathsAtIntersections(modelToBreak, modelToIntersect) {
          var modelToBreakAtlas = new MakerJs2.measure.Atlas(modelToBreak);
          modelToBreakAtlas.measureModels();
          var modelToIntersectAtlas;
          if (!modelToIntersect) {
            modelToIntersect = modelToBreak;
            modelToIntersectAtlas = modelToBreakAtlas;
          } else {
            modelToIntersectAtlas = new MakerJs2.measure.Atlas(modelToIntersect);
            modelToIntersectAtlas.measureModels();
          }
          ;
          breakAllPathsAtIntersections(modelToBreak, modelToIntersect || modelToBreak, false, modelToBreakAtlas, modelToIntersectAtlas);
          return modelToBreak;
        }
        model2.breakPathsAtIntersections = breakPathsAtIntersections;
        function breakAllPathsAtIntersections(modelToBreak, modelToIntersect, checkIsInside, modelToBreakAtlas, modelToIntersectAtlas, farPoint) {
          var crossedPaths = [];
          var overlappedSegments = [];
          var walkModelToBreakOptions = {
            onPath: function(outerWalkedPath) {
              var segment = {
                absolutePath: MakerJs2.path.clone(outerWalkedPath.pathContext, outerWalkedPath.offset),
                pathId: outerWalkedPath.pathId,
                overlapped: false,
                uniqueForeignIntersectionPoints: []
              };
              var thisPath = outerWalkedPath;
              thisPath.broken = false;
              thisPath.segments = [segment];
              var walkModelToIntersectOptions = {
                onPath: function(innerWalkedPath) {
                  if (outerWalkedPath.pathContext !== innerWalkedPath.pathContext && MakerJs2.measure.isMeasurementOverlapping(modelToBreakAtlas.pathMap[outerWalkedPath.routeKey], modelToIntersectAtlas.pathMap[innerWalkedPath.routeKey])) {
                    breakAlongForeignPath(thisPath, overlappedSegments, innerWalkedPath);
                  }
                },
                beforeChildWalk: function(innerWalkedModel) {
                  var innerModelMeasurement = modelToIntersectAtlas.modelMap[innerWalkedModel.routeKey];
                  return innerModelMeasurement && MakerJs2.measure.isMeasurementOverlapping(modelToBreakAtlas.pathMap[outerWalkedPath.routeKey], innerModelMeasurement);
                }
              };
              model2.walk(modelToIntersect, walkModelToIntersectOptions);
              if (checkIsInside) {
                for (var i = 0; i < thisPath.segments.length; i++) {
                  var p = MakerJs2.point.middle(thisPath.segments[i].absolutePath);
                  var pointInsideOptions = { measureAtlas: modelToIntersectAtlas, farPoint };
                  thisPath.segments[i].isInside = MakerJs2.measure.isPointInsideModel(p, modelToIntersect, pointInsideOptions);
                  thisPath.segments[i].uniqueForeignIntersectionPoints = pointInsideOptions.out_intersectionPoints;
                }
              }
              crossedPaths.push(thisPath);
            }
          };
          model2.walk(modelToBreak, walkModelToBreakOptions);
          return { crossedPaths, overlappedSegments };
        }
        function checkForEqualOverlaps(crossedPathsA, crossedPathsB, pointMatchingDistance) {
          function compareSegments(segment1, segment2) {
            if (MakerJs2.measure.isPathEqual(segment1.absolutePath, segment2.absolutePath, pointMatchingDistance)) {
              segment1.duplicate = segment2.duplicate = true;
            }
          }
          function compareAll(segment) {
            for (var i2 = 0; i2 < crossedPathsB.length; i2++) {
              compareSegments(crossedPathsB[i2], segment);
            }
          }
          for (var i = 0; i < crossedPathsA.length; i++) {
            compareAll(crossedPathsA[i]);
          }
        }
        function addOrDeleteSegments(crossedPath, includeInside, includeOutside, keepDuplicates, atlas, trackDeleted) {
          function addSegment(modelContext, pathIdBase, segment) {
            var id = model2.getSimilarPathId(modelContext, pathIdBase);
            var newRouteKey = id == pathIdBase ? crossedPath.routeKey : MakerJs2.createRouteKey(crossedPath.route.slice(0, -1).concat([id]));
            segment.addedPath = MakerJs2.cloneObject(crossedPath.pathContext);
            segment.addedPath.type = segment.absolutePath.type;
            MakerJs2.path.copyProps(segment.absolutePath, segment.addedPath);
            MakerJs2.path.moveRelative(segment.addedPath, crossedPath.offset, true);
            modelContext.paths[id] = segment.addedPath;
            if (crossedPath.broken) {
              var measurement = MakerJs2.measure.pathExtents(segment.absolutePath);
              atlas.pathMap[newRouteKey] = measurement;
              atlas.modelsMeasured = false;
            } else {
              atlas.pathMap[newRouteKey] = savedMeasurement;
            }
          }
          function checkAddSegment(modelContext, pathIdBase, segment) {
            if (segment.isInside && includeInside || !segment.isInside && includeOutside) {
              addSegment(modelContext, pathIdBase, segment);
            } else {
              atlas.modelsMeasured = false;
              trackDeleted(segment.absolutePath, crossedPath.routeKey, "segment is " + (segment.isInside ? "inside" : "outside") + " intersectionPoints=" + JSON.stringify(segment.uniqueForeignIntersectionPoints));
            }
          }
          var savedMeasurement = atlas.pathMap[crossedPath.routeKey];
          delete crossedPath.modelContext.paths[crossedPath.pathId];
          delete atlas.pathMap[crossedPath.routeKey];
          for (var i = 0; i < crossedPath.segments.length; i++) {
            if (crossedPath.segments[i].duplicate) {
              if (keepDuplicates) {
                addSegment(crossedPath.modelContext, crossedPath.pathId, crossedPath.segments[i]);
              } else {
                trackDeleted(crossedPath.segments[i].absolutePath, crossedPath.routeKey, "segment is duplicate");
              }
            } else {
              checkAddSegment(crossedPath.modelContext, crossedPath.pathId, crossedPath.segments[i]);
            }
          }
        }
        function combine(modelA, modelB, includeAInsideB, includeAOutsideB, includeBInsideA, includeBOutsideA, options) {
          if (includeAInsideB === void 0) {
            includeAInsideB = false;
          }
          if (includeAOutsideB === void 0) {
            includeAOutsideB = true;
          }
          if (includeBInsideA === void 0) {
            includeBInsideA = false;
          }
          if (includeBOutsideA === void 0) {
            includeBOutsideA = true;
          }
          var opts = {
            trimDeadEnds: true,
            pointMatchingDistance: 5e-3,
            out_deleted: [{ paths: {} }, { paths: {} }]
          };
          MakerJs2.extendObject(opts, options);
          opts.measureA = opts.measureA || new MakerJs2.measure.Atlas(modelA);
          opts.measureB = opts.measureB || new MakerJs2.measure.Atlas(modelB);
          opts.measureA.measureModels();
          opts.measureB.measureModels();
          if (!opts.farPoint) {
            var measureBoth = MakerJs2.measure.increase(MakerJs2.measure.increase({ high: [null, null], low: [null, null] }, opts.measureA.modelMap[""]), opts.measureB.modelMap[""]);
            opts.farPoint = MakerJs2.point.add(measureBoth.high, [1, 1]);
          }
          var pathsA = breakAllPathsAtIntersections(modelA, modelB, true, opts.measureA, opts.measureB, opts.farPoint);
          var pathsB = breakAllPathsAtIntersections(modelB, modelA, true, opts.measureB, opts.measureA, opts.farPoint);
          checkForEqualOverlaps(pathsA.overlappedSegments, pathsB.overlappedSegments, opts.pointMatchingDistance);
          function trackDeleted(which, deletedPath, routeKey, reason) {
            model2.addPath(opts.out_deleted[which], deletedPath, "deleted");
            var p = deletedPath;
            p.reason = reason;
            p.routeKey = routeKey;
          }
          for (var i = 0; i < pathsA.crossedPaths.length; i++) {
            addOrDeleteSegments(pathsA.crossedPaths[i], includeAInsideB, includeAOutsideB, true, opts.measureA, function(p, id, reason) {
              return trackDeleted(0, p, id, reason);
            });
          }
          for (var i = 0; i < pathsB.crossedPaths.length; i++) {
            addOrDeleteSegments(pathsB.crossedPaths[i], includeBInsideA, includeBOutsideA, false, opts.measureB, function(p, id, reason) {
              return trackDeleted(1, p, id, reason);
            });
          }
          var result = { models: { a: modelA, b: modelB } };
          if (opts.trimDeadEnds) {
            var shouldKeep;
            if (!includeAInsideB && !includeBInsideA) {
              shouldKeep = function(walkedPath) {
                for (var i2 = 0; i2 < pathsA.overlappedSegments.length; i2++) {
                  if (pathsA.overlappedSegments[i2].duplicate && walkedPath.pathContext === pathsA.overlappedSegments[i2].addedPath) {
                    return false;
                  }
                }
                return true;
              };
            }
            model2.removeDeadEnds(result, null, shouldKeep, function(wp, reason) {
              var which = wp.route[1] === "a" ? 0 : 1;
              trackDeleted(which, wp.pathContext, wp.routeKey, reason);
            });
          }
          MakerJs2.extendObject(options, opts);
          return result;
        }
        model2.combine = combine;
        function combineIntersection(modelA, modelB) {
          return combine(modelA, modelB, true, false, true, false);
        }
        model2.combineIntersection = combineIntersection;
        function combineSubtraction(modelA, modelB) {
          return combine(modelA, modelB, false, true, true, false);
        }
        model2.combineSubtraction = combineSubtraction;
        function combineUnion(modelA, modelB) {
          return combine(modelA, modelB, false, true, false, true);
        }
        model2.combineUnion = combineUnion;
      })(model = MakerJs2.model || (MakerJs2.model = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var Collector = (
        /** @class */
        (function() {
          function Collector2(comparer) {
            this.comparer = comparer;
            this.collections = [];
          }
          Collector2.prototype.addItemToCollection = function(key, item) {
            var found = this.findCollection(key);
            if (found) {
              found.push(item);
            } else {
              var collection = { key, items: [item] };
              this.collections.push(collection);
            }
          };
          Collector2.prototype.findCollection = function(key, action) {
            for (var i = 0; i < this.collections.length; i++) {
              var collection = this.collections[i];
              if (this.comparer(key, collection.key)) {
                if (action) {
                  action(i);
                }
                return collection.items;
              }
            }
            return null;
          };
          Collector2.prototype.removeCollection = function(key) {
            var _this = this;
            if (this.findCollection(key, function(index) {
              _this.collections.splice(index, 1);
            })) {
              return true;
            }
            return false;
          };
          Collector2.prototype.removeItemFromCollection = function(key, item) {
            var collection = this.findCollection(key);
            if (!collection)
              return;
            for (var i = 0; i < collection.length; i++) {
              if (collection[i] === item) {
                collection.splice(i, 1);
                return true;
              }
            }
            return false;
          };
          Collector2.prototype.getCollectionsOfMultiple = function(cb) {
            for (var i = 0; i < this.collections.length; i++) {
              var collection = this.collections[i];
              if (collection.items.length > 1) {
                cb(collection.key, collection.items);
              }
            }
          };
          return Collector2;
        })()
      );
      MakerJs2.Collector = Collector;
      var _kdbush = require_kdbush();
      var kdbush = _kdbush["default"] || _kdbush;
      var PointGraph = (
        /** @class */
        (function() {
          function PointGraph2() {
            this.reset();
          }
          PointGraph2.prototype.reset = function() {
            this.insertedCount = 0;
            this.graph = {};
            this.index = {};
            this.merged = {};
            this.values = [];
          };
          PointGraph2.prototype.insertValue = function(value2) {
            this.values.push(value2);
            return this.values.length - 1;
          };
          PointGraph2.prototype.insertValueIdAtPoint = function(valueId, p) {
            var x = p[0], y = p[1];
            if (!this.graph[x]) {
              this.graph[x] = {};
            }
            var pgx = this.graph[x];
            var existed = y in pgx;
            var el;
            var pointId;
            if (!existed) {
              pgx[y] = pointId = this.insertedCount++;
              el = {
                pointId,
                point: p,
                valueIds: [valueId]
              };
              this.index[pointId] = el;
            } else {
              pointId = pgx[y];
              if (pointId in this.merged) {
                pointId = this.merged[pointId];
              }
              el = this.index[pointId];
              el.valueIds.push(valueId);
            }
            return { existed, pointId };
          };
          PointGraph2.prototype.mergePoints = function(withinDistance) {
            var _this = this;
            var points = [];
            var kEls = [];
            for (var pointId in this.index) {
              var el = this.index[pointId];
              var p = el.point;
              el.kdId = points.length;
              points.push(p);
              kEls.push(el);
            }
            this.kdbush = kdbush(points);
            var _loop_2 = function(pointId2) {
              if (pointId2 in this_1.merged)
                return "continue";
              var el2 = this_1.index[pointId2];
              var mergeIds = this_1.kdbush.within(el2.point[0], el2.point[1], withinDistance);
              mergeIds.forEach(function(kdId) {
                if (kdId === el2.kdId)
                  return;
                _this.mergeIndexElements(el2, kEls[kdId]);
              });
            };
            var this_1 = this;
            for (var pointId in this.index) {
              _loop_2(pointId);
            }
          };
          PointGraph2.prototype.mergeNearestSinglePoints = function(withinDistance) {
            var _this = this;
            var singles = [];
            for (var pointId in this.index) {
              var el = this.index[pointId];
              if (el.valueIds.length === 1) {
                singles.push(el);
              }
            }
            this.kdbush = kdbush(singles.map(function(el2) {
              return el2.point;
            }));
            singles.forEach(function(el2) {
              if (el2.pointId in _this.merged)
                return;
              var mergeIds = _this.kdbush.within(el2.point[0], el2.point[1], withinDistance);
              var byDistance = [];
              mergeIds.forEach(function(i2) {
                var other2 = singles[i2];
                if (other2.pointId === el2.pointId)
                  return;
                byDistance.push({ el: other2, distance: MakerJs2.measure.pointDistance(other2.point, el2.point) });
              });
              byDistance.sort(function(a, b) {
                return a.distance - b.distance;
              });
              for (var i = 0; i < byDistance.length; i++) {
                var other = byDistance[i].el;
                if (other.pointId in _this.merged)
                  continue;
                if (other.merged && other.merged.length > 0) {
                  _this.mergeIndexElements(other, el2);
                } else {
                  _this.mergeIndexElements(el2, other);
                }
                return;
              }
            });
          };
          PointGraph2.prototype.mergeIndexElements = function(keep, remove) {
            keep.merged = keep.merged || [];
            keep.merged.push(remove.pointId);
            this.merged[remove.pointId] = keep.pointId;
            keep.valueIds.push.apply(keep.valueIds, remove.valueIds);
            delete this.index[remove.pointId];
            return keep.pointId;
          };
          PointGraph2.prototype.forEachPoint = function(cb) {
            var _this = this;
            for (var pointId = 0; pointId < this.insertedCount; pointId++) {
              var el = this.index[pointId];
              if (!el)
                continue;
              var length_1 = el.valueIds.length;
              if (length_1 > 0) {
                cb(el.point, el.valueIds.map(function(i) {
                  return _this.values[i];
                }), pointId, el);
              }
            }
          };
          PointGraph2.prototype.getIdOfPoint = function(p) {
            var px = this.graph[p[0]];
            if (px) {
              var pointId = px[p[1]];
              if (pointId >= 0) {
                if (pointId in this.merged) {
                  return this.merged[pointId];
                } else {
                  return pointId;
                }
              }
            }
          };
          PointGraph2.prototype.getElementAtPoint = function(p) {
            var pointId = this.getIdOfPoint(p);
            if (pointId >= 0) {
              return this.index[pointId];
            }
          };
          return PointGraph2;
        })()
      );
      MakerJs2.PointGraph = PointGraph;
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var model;
      (function(model2) {
        function checkForOverlaps(refPaths, isOverlapping, overlapUnion) {
          var currIndex = 0;
          do {
            var root = refPaths[currIndex];
            do {
              var overlaps = false;
              for (var i = currIndex + 1; i < refPaths.length; i++) {
                var arcRef = refPaths[i];
                overlaps = isOverlapping(root.pathContext, arcRef.pathContext, false);
                if (overlaps) {
                  overlapUnion(root.pathContext, arcRef.pathContext);
                  delete arcRef.modelContext.paths[arcRef.pathId];
                  refPaths.splice(i, 1);
                  break;
                }
              }
            } while (overlaps);
            currIndex++;
          } while (currIndex < refPaths.length);
        }
        function simplify(modelToSimplify, options) {
          function compareCircles(circleA, circleB) {
            if (Math.abs(circleA.radius - circleB.radius) <= opts.scalarMatchingDistance) {
              var distance = MakerJs2.measure.pointDistance(circleA.origin, circleB.origin);
              return distance <= opts.pointMatchingDistance;
            }
            return false;
          }
          var similarArcs = new MakerJs2.Collector(compareCircles);
          var similarCircles = new MakerJs2.Collector(compareCircles);
          var similarLines = new MakerJs2.Collector(MakerJs2.measure.isSlopeEqual);
          var map = {};
          map[MakerJs2.pathType.Arc] = function(arcRef) {
            similarArcs.addItemToCollection(arcRef.pathContext, arcRef);
          };
          map[MakerJs2.pathType.Circle] = function(circleRef) {
            similarCircles.addItemToCollection(circleRef.pathContext, circleRef);
          };
          map[MakerJs2.pathType.Line] = function(lineRef) {
            var slope = MakerJs2.measure.lineSlope(lineRef.pathContext);
            similarLines.addItemToCollection(slope, lineRef);
          };
          var opts = {
            scalarMatchingDistance: 1e-3,
            pointMatchingDistance: 5e-3
          };
          MakerJs2.extendObject(opts, options);
          var walkOptions = {
            onPath: function(walkedPath) {
              var fn = map[walkedPath.pathContext.type];
              if (fn) {
                fn(walkedPath);
              }
            }
          };
          model2.walk(modelToSimplify, walkOptions);
          similarArcs.getCollectionsOfMultiple(function(key, arcRefs) {
            checkForOverlaps(arcRefs, MakerJs2.measure.isArcOverlapping, function(arcA, arcB) {
              var aEndsInB = MakerJs2.measure.isBetweenArcAngles(arcA.endAngle, arcB, false);
              var bEndsInA = MakerJs2.measure.isBetweenArcAngles(arcB.endAngle, arcA, false);
              if (aEndsInB && bEndsInA) {
                arcA.endAngle = arcA.startAngle + 360;
                return;
              }
              var ordered = aEndsInB ? [arcA, arcB] : [arcB, arcA];
              arcA.startAngle = MakerJs2.angle.noRevolutions(ordered[0].startAngle);
              arcA.endAngle = ordered[1].endAngle;
            });
          });
          similarCircles.getCollectionsOfMultiple(function(key, circleRefs) {
            for (var i = 1; i < circleRefs.length; i++) {
              var circleRef = circleRefs[i];
              delete circleRef.modelContext.paths[circleRef.pathId];
            }
          });
          similarLines.getCollectionsOfMultiple(function(slope, arcRefs) {
            checkForOverlaps(arcRefs, MakerJs2.measure.isLineOverlapping, function(lineA, lineB) {
              var box = { paths: { lineA, lineB } };
              var m = MakerJs2.measure.modelExtents(box);
              if (!slope.hasSlope) {
                lineA.origin[1] = m.low[1];
                lineA.end[1] = m.high[1];
              } else {
                if (slope.slope < 0) {
                  lineA.origin = [m.low[0], m.high[1]];
                  lineA.end = [m.high[0], m.low[1]];
                } else if (slope.slope > 0) {
                  lineA.origin = m.low;
                  lineA.end = m.high;
                } else {
                  lineA.origin[0] = m.low[0];
                  lineA.end[0] = m.high[0];
                }
              }
            });
          });
          return modelToSimplify;
        }
        model2.simplify = simplify;
      })(model = MakerJs2.model || (MakerJs2.model = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var path;
      (function(path2) {
        var map = {};
        map[MakerJs2.pathType.Arc] = function(arc, expansion, isolateCaps) {
          return new MakerJs2.models.OvalArc(arc.startAngle, arc.endAngle, arc.radius, expansion, false, isolateCaps);
        };
        map[MakerJs2.pathType.Circle] = function(circle, expansion, isolateCaps) {
          return new MakerJs2.models.Ring(circle.radius + expansion, circle.radius - expansion);
        };
        map[MakerJs2.pathType.Line] = function(line, expansion, isolateCaps) {
          return new MakerJs2.models.Slot(line.origin, line.end, expansion, isolateCaps);
        };
        function expand(pathToExpand, expansion, isolateCaps) {
          if (!pathToExpand)
            return null;
          var result = null;
          var fn = map[pathToExpand.type];
          if (fn) {
            result = fn(pathToExpand, expansion, isolateCaps);
            result.origin = pathToExpand.origin;
          }
          return result;
        }
        path2.expand = expand;
        function straighten(arc, bevel, prefix, close) {
          var arcSpan = MakerJs2.angle.ofArcSpan(arc);
          var joints = 1;
          if (arcSpan >= 270) {
            joints = 4;
          } else if (arcSpan > 180) {
            joints = 3;
          } else if (arcSpan > 150 || bevel) {
            joints = 2;
          }
          var jointAngleInRadians = MakerJs2.angle.toRadians(arcSpan / joints);
          var circumscribedRadius = MakerJs2.models.Polygon.circumscribedRadius(arc.radius, jointAngleInRadians);
          var ends = MakerJs2.point.fromArc(arc);
          var points = [MakerJs2.point.subtract(ends[0], arc.origin)];
          var a = MakerJs2.angle.toRadians(arc.startAngle) + jointAngleInRadians / 2;
          for (var i = 0; i < joints; i++) {
            points.push(MakerJs2.point.fromPolar(a, circumscribedRadius));
            a += jointAngleInRadians;
          }
          points.push(MakerJs2.point.subtract(ends[1], arc.origin));
          var result = new MakerJs2.models.ConnectTheDots(close, points);
          result.origin = arc.origin;
          if (typeof prefix === "string" && prefix.length) {
            MakerJs2.model.prefixPathIds(result, prefix);
          }
          return result;
        }
        path2.straighten = straighten;
      })(path = MakerJs2.path || (MakerJs2.path = {}));
    })(MakerJs || (MakerJs = {}));
    (function(MakerJs2) {
      var model;
      (function(model2) {
        function expandPaths(modelToExpand, distance, joints, combineOptions) {
          if (joints === void 0) {
            joints = 0;
          }
          if (combineOptions === void 0) {
            combineOptions = {};
          }
          if (distance <= 0)
            return null;
          var result = {
            models: {
              expansions: { models: {} },
              caps: { models: {} }
            }
          };
          var first = true;
          var lastFarPoint = combineOptions.farPoint;
          var walkOptions = {
            onPath: function(walkedPath) {
              if (combineOptions.pointMatchingDistance && MakerJs2.measure.pathLength(walkedPath.pathContext) < combineOptions.pointMatchingDistance)
                return;
              var expandedPathModel = MakerJs2.path.expand(walkedPath.pathContext, distance, true);
              if (expandedPathModel) {
                model2.moveRelative(expandedPathModel, walkedPath.offset);
                var newId = model2.getSimilarModelId(result.models["expansions"], walkedPath.pathId);
                model2.prefixPathIds(expandedPathModel, walkedPath.pathId + "_");
                model2.originate(expandedPathModel);
                if (!first) {
                  model2.combine(result, expandedPathModel, false, true, false, true, combineOptions);
                  combineOptions.measureA.modelsMeasured = false;
                  lastFarPoint = combineOptions.farPoint;
                  delete combineOptions.farPoint;
                  delete combineOptions.measureB;
                }
                result.models["expansions"].models[newId] = expandedPathModel;
                if (expandedPathModel.models) {
                  var caps = expandedPathModel.models["Caps"];
                  if (caps) {
                    delete expandedPathModel.models["Caps"];
                    result.models["caps"].models[newId] = caps;
                  }
                }
                first = false;
              }
            }
          };
          model2.walk(modelToExpand, walkOptions);
          if (joints) {
            var roundCaps = result.models["caps"];
            var straightCaps = { models: {} };
            result.models["straightcaps"] = straightCaps;
            model2.simplify(roundCaps);
            for (var id in roundCaps.models) {
              straightCaps.models[id] = { models: {} };
              model2.walk(roundCaps.models[id], {
                onPath: function(walkedPath) {
                  var arc = walkedPath.pathContext;
                  var straightened = MakerJs2.path.straighten(arc, joints == 2, walkedPath.pathId + "_", true);
                  model2.combine(result, straightened, false, true, false, true, combineOptions);
                  combineOptions.measureA.modelsMeasured = false;
                  lastFarPoint = combineOptions.farPoint;
                  delete combineOptions.farPoint;
                  delete combineOptions.measureB;
                  straightCaps.models[id].models[walkedPath.pathId] = straightened;
                  delete walkedPath.modelContext.paths[walkedPath.pathId];
                }
              });
            }
            delete result.models["caps"];
          }
          combineOptions.farPoint = lastFarPoint;
          return result;
        }
        model2.expandPaths = expandPaths;
        function getEndlessChains(modelContext) {
          var endlessChains = [];
          model2.findChains(modelContext, function(chains, loose, layer) {
            endlessChains = chains.filter(function(chain) {
              return chain.endless;
            });
          });
          return endlessChains;
        }
        function getClosedGeometries(modelContext) {
          var endlessChains = getEndlessChains(modelContext);
          if (endlessChains.length == 0)
            return null;
          var closed = { models: {} };
          endlessChains.forEach(function(c, i) {
            closed.models[i] = MakerJs2.chain.toNewModel(c);
          });
          return closed;
        }
        function outline(modelToOutline, distance, joints, inside, options) {
          if (joints === void 0) {
            joints = 0;
          }
          if (inside === void 0) {
            inside = false;
          }
          if (options === void 0) {
            options = {};
          }
          var expanded = expandPaths(modelToOutline, distance, joints, options);
          if (!expanded)
            return null;
          var closed = getClosedGeometries(modelToOutline);
          if (closed) {
            var childCount = 0;
            var result = { models: {} };
            var chains = getEndlessChains(expanded);
            chains.forEach(function(c) {
              var wp = c.links[0].walkedPath;
              var isInside = MakerJs2.measure.isPointInsideModel(MakerJs2.point.middle(wp.pathContext), closed, wp.offset);
              if (inside && isInside || !inside && !isInside) {
                result.models[childCount++] = MakerJs2.chain.toNewModel(c);
              }
              ;
            });
            return result;
          } else {
            return expanded;
          }
        }
        model2.outline = outline;
      })(model = MakerJs2.model || (MakerJs2.model = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var units;
      (function(units2) {
        var base = MakerJs2.unitType.Millimeter;
        function init() {
          addBaseConversion(MakerJs2.unitType.Centimeter, 10);
          addBaseConversion(MakerJs2.unitType.Meter, 1e3);
          addBaseConversion(MakerJs2.unitType.Inch, 25.4);
          addBaseConversion(MakerJs2.unitType.Foot, 25.4 * 12);
        }
        var table;
        function addConversion(srcUnitType, destUnitType, value2) {
          function row(unitType) {
            if (!table[unitType]) {
              table[unitType] = {};
            }
            return table[unitType];
          }
          row(srcUnitType)[destUnitType] = value2;
          row(destUnitType)[srcUnitType] = 1 / value2;
        }
        function addBaseConversion(destUnitType, value2) {
          addConversion(destUnitType, base, value2);
        }
        function conversionScale(srcUnitType, destUnitType) {
          if (srcUnitType == destUnitType) {
            return 1;
          }
          if (!table) {
            table = {};
            init();
          }
          if (!table[srcUnitType][destUnitType]) {
            addConversion(srcUnitType, destUnitType, table[srcUnitType][base] * table[base][destUnitType]);
          }
          return table[srcUnitType] && table[srcUnitType][destUnitType];
        }
        units2.conversionScale = conversionScale;
        function isValidUnit(tryUnit) {
          for (var id in MakerJs2.unitType) {
            if (MakerJs2.unitType[id] == tryUnit) {
              return true;
            }
          }
          return false;
        }
        units2.isValidUnit = isValidUnit;
      })(units = MakerJs2.units || (MakerJs2.units = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var measure;
      (function(measure2) {
        function isAngleEqual(angleA, angleB, accuracy) {
          if (accuracy === void 0) {
            accuracy = 1e-4;
          }
          var a = MakerJs2.angle.noRevolutions(angleA);
          var b = MakerJs2.angle.noRevolutions(angleB);
          var d = MakerJs2.angle.noRevolutions(MakerJs2.round(b - a, accuracy));
          return d == 0;
        }
        measure2.isAngleEqual = isAngleEqual;
        var pathAreEqualMap = {};
        pathAreEqualMap[MakerJs2.pathType.Line] = function(lineA, lineB, withinPointDistance) {
          return isPointEqual(lineA.origin, lineB.origin, withinPointDistance) && isPointEqual(lineA.end, lineB.end, withinPointDistance) || isPointEqual(lineA.origin, lineB.end, withinPointDistance) && isPointEqual(lineA.end, lineB.origin, withinPointDistance);
        };
        pathAreEqualMap[MakerJs2.pathType.Circle] = function(circleA, circleB, withinPointDistance) {
          return isPointEqual(circleA.origin, circleB.origin, withinPointDistance) && circleA.radius == circleB.radius;
        };
        pathAreEqualMap[MakerJs2.pathType.Arc] = function(arcA, arcB, withinPointDistance) {
          return pathAreEqualMap[MakerJs2.pathType.Circle](arcA, arcB, withinPointDistance) && isAngleEqual(arcA.startAngle, arcB.startAngle) && isAngleEqual(arcA.endAngle, arcB.endAngle);
        };
        function isPathEqual(pathA, pathB, withinPointDistance, pathAOffset, pathBOffset) {
          var result = false;
          if (pathA.type == pathB.type) {
            var fn = pathAreEqualMap[pathA.type];
            if (fn) {
              let getResult2 = function() {
                result = fn(pathA, pathB, withinPointDistance);
              };
              var getResult = getResult2;
              if (pathAOffset || pathBOffset) {
                MakerJs2.path.moveTemporary([pathA, pathB], [pathAOffset, pathBOffset], getResult2);
              } else {
                getResult2();
              }
            }
          }
          return result;
        }
        measure2.isPathEqual = isPathEqual;
        function isPointEqual(a, b, withinDistance) {
          if (!withinDistance) {
            return MakerJs2.round(a[0] - b[0]) == 0 && MakerJs2.round(a[1] - b[1]) == 0;
          } else {
            if (!a || !b)
              return false;
            var distance = measure2.pointDistance(a, b);
            return distance <= withinDistance;
          }
        }
        measure2.isPointEqual = isPointEqual;
        function isPointDistinct(pointToCheck, pointArray, withinDistance) {
          for (var i = 0; i < pointArray.length; i++) {
            if (isPointEqual(pointArray[i], pointToCheck, withinDistance)) {
              return false;
            }
          }
          return true;
        }
        measure2.isPointDistinct = isPointDistinct;
        function isPointOnSlope(p, slope, withinDistance) {
          if (withinDistance === void 0) {
            withinDistance = 0;
          }
          if (slope.hasSlope) {
            return Math.abs(p[1] - (slope.slope * p[0] + slope.yIntercept)) <= withinDistance;
          } else {
            return Math.abs(p[0] - slope.line.origin[0]) <= withinDistance;
          }
        }
        measure2.isPointOnSlope = isPointOnSlope;
        function isPointOnCircle(p, circle, withinDistance) {
          if (withinDistance === void 0) {
            withinDistance = 0;
          }
          var d = Math.abs(measure2.pointDistance(p, circle.origin) - circle.radius);
          return d <= withinDistance;
        }
        measure2.isPointOnCircle = isPointOnCircle;
        var onPathMap = {};
        onPathMap[MakerJs2.pathType.Circle] = function(p, circle, withinDistance) {
          return isPointOnCircle(p, circle, withinDistance);
        };
        onPathMap[MakerJs2.pathType.Arc] = function(p, arc, withinDistance) {
          if (onPathMap[MakerJs2.pathType.Circle](p, arc, withinDistance)) {
            var a = MakerJs2.angle.ofPointInDegrees(arc.origin, p);
            return measure2.isBetweenArcAngles(a, arc, false);
          }
          return false;
        };
        onPathMap[MakerJs2.pathType.Line] = function(p, line, withinDistance, options) {
          var slope = options && options.cachedLineSlope || measure2.lineSlope(line);
          if (options && !options.cachedLineSlope) {
            options.cachedLineSlope = slope;
          }
          return isPointOnSlope(p, slope, withinDistance) && measure2.isBetweenPoints(p, line, false);
        };
        function isPointOnPath(pointToCheck, onPath, withinDistance, pathOffset, options) {
          if (withinDistance === void 0) {
            withinDistance = 0;
          }
          var fn = onPathMap[onPath.type];
          if (fn) {
            var offsetPath = pathOffset ? MakerJs2.path.clone(onPath, pathOffset) : onPath;
            return fn(pointToCheck, offsetPath, withinDistance, options);
          }
          return false;
        }
        measure2.isPointOnPath = isPointOnPath;
        function isSlopeEqual(slopeA, slopeB) {
          if (!isSlopeParallel(slopeA, slopeB))
            return false;
          if (!slopeA.hasSlope && !slopeB.hasSlope) {
            return MakerJs2.round(slopeA.line.origin[0] - slopeB.line.origin[0]) == 0;
          }
          var slopes = [slopeA, slopeB];
          var angles = slopes.map(function(s) {
            return MakerJs2.angle.toDegrees(Math.atan(s.slope));
          });
          var lines = slopes.map(function(s) {
            return MakerJs2.path.clone(s.line);
          });
          var origin = lines[0].origin;
          lines.forEach(function(l, i) {
            return MakerJs2.path.rotate(l, -angles[i], origin);
          });
          var averageYs = lines.map(function(l) {
            return (l.origin[1] + l.end[1]) / 2;
          });
          return MakerJs2.round(averageYs[0] - averageYs[1], 1e-5) == 0;
        }
        measure2.isSlopeEqual = isSlopeEqual;
        function isSlopeParallel(slopeA, slopeB) {
          if (!slopeA.hasSlope && !slopeB.hasSlope) {
            return true;
          }
          if (slopeA.hasSlope && slopeB.hasSlope && MakerJs2.round(slopeA.slope - slopeB.slope, 1e-5) == 0) {
            return true;
          }
          return false;
        }
        measure2.isSlopeParallel = isSlopeParallel;
      })(measure = MakerJs2.measure || (MakerJs2.measure = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var measure;
      (function(measure2) {
        function increase(baseMeasure, addMeasure, augmentBaseMeasure) {
          function getExtreme(basePoint, newPoint, fn) {
            if (!newPoint)
              return;
            for (var i = 2; i--; ) {
              if (newPoint[i] == null)
                continue;
              if (basePoint[i] == null) {
                basePoint[i] = newPoint[i];
              } else {
                basePoint[i] = fn(basePoint[i], newPoint[i]);
              }
            }
          }
          if (addMeasure) {
            getExtreme(baseMeasure.low, addMeasure.low, Math.min);
            getExtreme(baseMeasure.high, addMeasure.high, Math.max);
          }
          if (augmentBaseMeasure) {
            augment(baseMeasure);
          }
          return baseMeasure;
        }
        measure2.increase = increase;
        function isArcConcaveTowardsPoint(arc, towardsPoint) {
          if (pointDistance(arc.origin, towardsPoint) <= arc.radius) {
            return true;
          }
          var midPointToNearPoint = new MakerJs2.paths.Line(MakerJs2.point.middle(arc), towardsPoint);
          var options = {};
          var intersectionPoint = MakerJs2.path.intersection(midPointToNearPoint, new MakerJs2.paths.Chord(arc), options);
          if (intersectionPoint || options.out_AreOverlapped) {
            return true;
          }
          return false;
        }
        measure2.isArcConcaveTowardsPoint = isArcConcaveTowardsPoint;
        function isArcOverlapping(arcA, arcB, excludeTangents) {
          return isArcSpanOverlapping(arcA, arcB, excludeTangents);
        }
        measure2.isArcOverlapping = isArcOverlapping;
        function isArcSpanOverlapping(arcA, arcB, excludeTangents) {
          var pointsOfIntersection = [];
          function checkAngles(a, b) {
            function checkAngle(n) {
              return isBetweenArcAngles(n, a, excludeTangents);
            }
            return checkAngle(b.startAngle) || checkAngle(b.endAngle);
          }
          return checkAngles(arcA, arcB) || checkAngles(arcB, arcA) || arcA.startAngle == arcB.startAngle && arcA.endAngle == arcB.endAngle;
        }
        measure2.isArcSpanOverlapping = isArcSpanOverlapping;
        function isBetween(valueInQuestion, limitA, limitB, exclusive) {
          if (exclusive) {
            return Math.min(limitA, limitB) < valueInQuestion && valueInQuestion < Math.max(limitA, limitB);
          } else {
            return Math.min(limitA, limitB) <= valueInQuestion && valueInQuestion <= Math.max(limitA, limitB);
          }
        }
        measure2.isBetween = isBetween;
        function isBetweenArcAngles(angleInQuestion, arc, exclusive) {
          var startAngle = MakerJs2.angle.noRevolutions(arc.startAngle);
          var span = MakerJs2.angle.ofArcSpan(arc);
          var endAngle = startAngle + span;
          angleInQuestion = MakerJs2.angle.noRevolutions(angleInQuestion);
          return isBetween(angleInQuestion, startAngle, endAngle, exclusive) || isBetween(angleInQuestion, startAngle + 360, endAngle + 360, exclusive) || isBetween(angleInQuestion, startAngle - 360, endAngle - 360, exclusive);
        }
        measure2.isBetweenArcAngles = isBetweenArcAngles;
        function isBetweenPoints(pointInQuestion, line, exclusive) {
          var oneDimension = false;
          for (var i = 2; i--; ) {
            if (MakerJs2.round(line.origin[i] - line.end[i], 1e-6) == 0) {
              if (oneDimension)
                return false;
              oneDimension = true;
              continue;
            }
            var origin_value = MakerJs2.round(line.origin[i]);
            var end_value = MakerJs2.round(line.end[i]);
            if (!isBetween(MakerJs2.round(pointInQuestion[i]), origin_value, end_value, exclusive))
              return false;
          }
          return true;
        }
        measure2.isBetweenPoints = isBetweenPoints;
        function isBezierSeedLinear(seed, exclusive) {
          var slope = lineSlope(seed);
          for (var i = 0; i < seed.controls.length; i++) {
            if (!measure2.isPointOnSlope(seed.controls[i], slope)) {
              if (!exclusive)
                return false;
              if (isBetweenPoints(seed.controls[i], seed, false))
                return false;
            }
          }
          return true;
        }
        measure2.isBezierSeedLinear = isBezierSeedLinear;
        var graham_scan = require_graham_scan_min();
        function serializePoint(p) {
          return p.join(",");
        }
        function isChainClockwise(chainContext, out_result) {
          if (!chainContext.endless || chainContext.links.length === 1) {
            return null;
          }
          var keyPoints = MakerJs2.chain.toKeyPoints(chainContext);
          return isPointArrayClockwise(keyPoints, out_result);
        }
        measure2.isChainClockwise = isChainClockwise;
        function isPointArrayClockwise(points, out_result) {
          var convexHull = new graham_scan();
          var pointsInOrder = [];
          function add(endPoint) {
            convexHull.addPoint(endPoint[0], endPoint[1]);
            pointsInOrder.push(serializePoint(endPoint));
          }
          points.forEach(add);
          var hull = convexHull.getHull();
          var hullPoints = hull.slice(0, 3).map(function(p) {
            return serializePoint([p.x, p.y]);
          });
          var ordered = [];
          pointsInOrder.forEach(function(p) {
            if (~hullPoints.indexOf(p))
              ordered.push(p);
          });
          switch (ordered.indexOf(hullPoints[1])) {
            case 0:
              ordered.unshift(ordered.pop());
              break;
            case 2:
              ordered.push(ordered.shift());
              break;
          }
          if (out_result) {
            out_result.hullPoints = hull.map(function(p) {
              return [p.x, p.y];
            });
            out_result.keyPoints = points;
          }
          return hullPoints[0] != ordered[0];
        }
        measure2.isPointArrayClockwise = isPointArrayClockwise;
        function isLineOverlapping(lineA, lineB, excludeTangents) {
          var pointsOfIntersection = [];
          function checkPoints(index, a, b) {
            function checkPoint(p) {
              return isBetweenPoints(p, a, excludeTangents);
            }
            return checkPoint(b.origin) || checkPoint(b.end);
          }
          return checkPoints(0, lineA, lineB) || checkPoints(1, lineB, lineA);
        }
        measure2.isLineOverlapping = isLineOverlapping;
        function isMeasurementOverlapping(measureA, measureB) {
          for (var i = 2; i--; ) {
            if (!(MakerJs2.round(measureA.low[i] - measureB.high[i]) <= 0 && MakerJs2.round(measureA.high[i] - measureB.low[i]) >= 0))
              return false;
          }
          return true;
        }
        measure2.isMeasurementOverlapping = isMeasurementOverlapping;
        function lineSlope(line) {
          var dx = line.end[0] - line.origin[0];
          if (MakerJs2.round(dx, 1e-6) == 0) {
            return {
              line,
              hasSlope: false
            };
          }
          var dy = line.end[1] - line.origin[1];
          var slope = dy / dx;
          var yIntercept = line.origin[1] - slope * line.origin[0];
          return {
            line,
            hasSlope: true,
            slope,
            yIntercept
          };
        }
        measure2.lineSlope = lineSlope;
        function pointDistance(a, b) {
          var dx = b[0] - a[0];
          var dy = b[1] - a[1];
          return Math.sqrt(dx * dx + dy * dy);
        }
        measure2.pointDistance = pointDistance;
        function getExtremePoint(a, b, fn) {
          return [
            fn(a[0], b[0]),
            fn(a[1], b[1])
          ];
        }
        var pathExtentsMap = {};
        pathExtentsMap[MakerJs2.pathType.Line] = function(line) {
          return {
            low: getExtremePoint(line.origin, line.end, Math.min),
            high: getExtremePoint(line.origin, line.end, Math.max)
          };
        };
        pathExtentsMap[MakerJs2.pathType.Circle] = function(circle) {
          var r = circle.radius;
          return {
            low: MakerJs2.point.add(circle.origin, [-r, -r]),
            high: MakerJs2.point.add(circle.origin, [r, r])
          };
        };
        pathExtentsMap[MakerJs2.pathType.Arc] = function(arc) {
          var r = arc.radius;
          var arcPoints = MakerJs2.point.fromArc(arc);
          function extremeAngle(xyAngle, value2, fn) {
            var extremePoint = getExtremePoint(arcPoints[0], arcPoints[1], fn);
            for (var i = 2; i--; ) {
              if (isBetweenArcAngles(xyAngle[i], arc, false)) {
                extremePoint[i] = value2 + arc.origin[i];
              }
            }
            return extremePoint;
          }
          return {
            low: extremeAngle([180, 270], -r, Math.min),
            high: extremeAngle([360, 90], r, Math.max)
          };
        };
        function pathExtents(pathToMeasure, addOffset) {
          if (pathToMeasure) {
            var fn = pathExtentsMap[pathToMeasure.type];
            if (fn) {
              var m = fn(pathToMeasure);
              if (addOffset) {
                m.high = MakerJs2.point.add(m.high, addOffset);
                m.low = MakerJs2.point.add(m.low, addOffset);
              }
              return m;
            }
          }
          return { low: null, high: null };
        }
        measure2.pathExtents = pathExtents;
        var pathLengthMap = {};
        pathLengthMap[MakerJs2.pathType.Line] = function(line) {
          return pointDistance(line.origin, line.end);
        };
        pathLengthMap[MakerJs2.pathType.Circle] = function(circle) {
          return 2 * Math.PI * circle.radius;
        };
        pathLengthMap[MakerJs2.pathType.Arc] = function(arc) {
          var value2 = pathLengthMap[MakerJs2.pathType.Circle](arc);
          var pct = MakerJs2.angle.ofArcSpan(arc) / 360;
          value2 *= pct;
          return value2;
        };
        pathLengthMap[MakerJs2.pathType.BezierSeed] = function(seed) {
          return MakerJs2.models.BezierCurve.computeLength(seed);
        };
        function pathLength(pathToMeasure) {
          if (pathToMeasure) {
            var fn = pathLengthMap[pathToMeasure.type];
            if (fn) {
              return fn(pathToMeasure);
            }
          }
          return 0;
        }
        measure2.pathLength = pathLength;
        function modelPathLength(modelToMeasure) {
          var total = 0;
          MakerJs2.model.walk(modelToMeasure, {
            onPath: function(walkedPath) {
              total += pathLength(walkedPath.pathContext);
            }
          });
          return total;
        }
        measure2.modelPathLength = modelPathLength;
        function cloneMeasure(measureToclone) {
          return {
            high: MakerJs2.point.clone(measureToclone.high),
            low: MakerJs2.point.clone(measureToclone.low)
          };
        }
        function modelExtents(modelToMeasure, atlas) {
          function increaseParentModel(childRoute, childMeasurement) {
            if (!childMeasurement)
              return;
            var parentRoute = childRoute.slice(0, -2);
            var parentRouteKey = MakerJs2.createRouteKey(parentRoute);
            if (!(parentRouteKey in atlas.modelMap)) {
              atlas.modelMap[parentRouteKey] = cloneMeasure(childMeasurement);
            } else {
              increase(atlas.modelMap[parentRouteKey], childMeasurement);
            }
          }
          if (!atlas)
            atlas = new Atlas(modelToMeasure);
          var walkOptions = {
            onPath: function(walkedPath) {
              if (!(walkedPath.routeKey in atlas.pathMap)) {
                atlas.pathMap[walkedPath.routeKey] = pathExtents(walkedPath.pathContext, walkedPath.offset);
              }
              increaseParentModel(walkedPath.route, atlas.pathMap[walkedPath.routeKey]);
            },
            afterChildWalk: function(walkedModel) {
              increaseParentModel(walkedModel.route, atlas.modelMap[walkedModel.routeKey]);
            }
          };
          MakerJs2.model.walk(modelToMeasure, walkOptions);
          atlas.modelsMeasured = true;
          var m = atlas.modelMap[""];
          if (m) {
            return augment(m);
          }
          return null;
        }
        measure2.modelExtents = modelExtents;
        function augment(measureToAugment) {
          var m = measureToAugment;
          m.center = MakerJs2.point.average(m.high, m.low);
          m.width = m.high[0] - m.low[0];
          m.height = m.high[1] - m.low[1];
          return m;
        }
        measure2.augment = augment;
        var Atlas = (
          /** @class */
          (function() {
            function Atlas2(modelContext) {
              this.modelContext = modelContext;
              this.modelsMeasured = false;
              this.modelMap = {};
              this.pathMap = {};
            }
            Atlas2.prototype.measureModels = function() {
              if (!this.modelsMeasured) {
                modelExtents(this.modelContext, this);
              }
            };
            return Atlas2;
          })()
        );
        measure2.Atlas = Atlas;
        function loopIndex(base, i) {
          if (i >= base)
            return i - base;
          if (i < 0)
            return i + base;
          return i;
        }
        function yAtX(slope, x) {
          return slope.slope * x + slope.yIntercept;
        }
        function pointOnSlopeAtX(line, x) {
          var slope = lineSlope(line);
          return [x, yAtX(slope, x)];
        }
        function isCircular(bounds) {
          for (var i = 1; i < 3; i++) {
            if (!measure2.isPointEqual(bounds[0].center, bounds[i].center, 1e-6) || !(MakerJs2.round(bounds[0].width - bounds[i].width) === 0)) {
              return false;
            }
          }
          return true;
        }
        function getAngledBounds(index, modelToMeasure, rotateModel, rotatePaths) {
          MakerJs2.model.rotate(modelToMeasure, rotateModel);
          var m = modelExtents(modelToMeasure);
          var result = {
            index,
            rotation: rotatePaths,
            center: MakerJs2.point.rotate(m.center, rotatePaths),
            //model is sideways, so width is based on Y, height is based on X
            width: m.height,
            height: m.width,
            bottom: new MakerJs2.paths.Line(m.low, [m.high[0], m.low[1]]),
            middle: new MakerJs2.paths.Line([m.low[0], m.center[1]], [m.high[0], m.center[1]]),
            top: new MakerJs2.paths.Line(m.high, [m.low[0], m.high[1]])
          };
          [result.top, result.middle, result.bottom].forEach(function(line) {
            return MakerJs2.path.rotate(line, rotatePaths);
          });
          return result;
        }
        function hexSolution(lines, bounds) {
          var tip = lines[1].origin;
          var tipX = tip[0];
          var left = lines[3].origin[0];
          var right = lines[0].origin[0];
          var altRight = tipX - right;
          if (right - left > 2 * altRight)
            return null;
          var altLeft = (tipX - left) / 3;
          if (altRight < altLeft)
            return null;
          var altitudeViaSide = Math.min(altLeft, altRight);
          var radiusViaSide = MakerJs2.solvers.equilateralSide(altitudeViaSide);
          var peakPoints = [MakerJs2.point.fromSlopeIntersection(lines[1], lines[2]), MakerJs2.point.fromSlopeIntersection(lines[4], lines[5])];
          var peakRadii = peakPoints.map(function(p) {
            return Math.abs(p[1] - tip[1]);
          });
          var peakNum = peakRadii[0] > peakRadii[1] ? 0 : 1;
          var radiusViaPeak = peakRadii[peakNum];
          if (radiusViaPeak > radiusViaSide) {
            var altitudeViaPeak = MakerJs2.solvers.equilateralAltitude(radiusViaPeak);
            var peakX = tipX - 2 * altitudeViaPeak;
            if (right > peakX + altitudeViaPeak)
              return null;
            if (left < peakX - altitudeViaPeak)
              return null;
            var leftGap = left - peakX + altitudeViaPeak;
            var peakGap = 2 * altitudeViaPeak - bounds[peakNum + 1].width;
            var minHalfGap = Math.min(leftGap, peakGap) / 2;
            return {
              origin: pointOnSlopeAtX(bounds[2 - peakNum].middle, peakX + minHalfGap),
              radius: radiusViaPeak,
              type: "peak " + peakNum
            };
          } else {
            return {
              origin: [tipX - 2 * altitudeViaSide, tip[1]],
              radius: radiusViaSide,
              type: "side"
            };
          }
        }
        function boundingHexagon(modelToMeasure) {
          var clone2 = MakerJs2.cloneObject(modelToMeasure);
          MakerJs2.model.originate(clone2);
          var originalMeasure = modelExtents(clone2);
          var bounds = [];
          var scratch = { paths: {} };
          MakerJs2.model.center(clone2);
          function result(radius, origin, notes) {
            return {
              radius,
              paths: new MakerJs2.models.Polygon(6, radius, 30).paths,
              origin: MakerJs2.point.add(origin, originalMeasure.center),
              //models: { scratch: scratch },
              notes
            };
          }
          var boundRotations = [[90, -90], [-60, -30], [-60, 30]];
          while (boundRotations.length) {
            var rotation = boundRotations.shift();
            var bound = getAngledBounds(bounds.length, clone2, rotation[0], rotation[1]);
            var side = MakerJs2.solvers.equilateralSide(bound.width / 2);
            if (side >= bound.height) {
              return result(side, bound.center, "solved by bound " + bounds.length);
            }
            bounds.push(bound);
          }
          if (isCircular(bounds)) {
            return result(MakerJs2.solvers.equilateralSide(bounds[0].width / 2), bounds[0].center, "solved as circular");
          }
          var perimeters = bounds.map(function(b) {
            return b.top;
          }).concat(bounds.map(function(b) {
            return b.bottom;
          }));
          perimeters.forEach(function(p2, i2) {
            scratch.paths[i2] = p2;
            MakerJs2.path.converge(perimeters[loopIndex(6, i2 + 2)], p2, true);
          });
          bounds.forEach(function(b, i2) {
            scratch.paths["m" + i2] = b.middle;
          });
          var boundCopy = bounds.slice();
          var solution;
          for (var i = 0; i < 6; i++) {
            if (i > 0) {
              perimeters.push(perimeters.shift());
              boundCopy.push(boundCopy.shift());
              MakerJs2.model.rotate(scratch, -60);
            }
            var s = hexSolution(perimeters, boundCopy);
            if (s) {
              if (!solution || s.radius < solution.radius) {
                solution = s;
                solution.index = i;
              }
            }
          }
          var p = MakerJs2.point.rotate(solution.origin, solution.index * 60);
          return result(solution.radius, p, "solved by " + solution.index + " as " + solution.type);
        }
        measure2.boundingHexagon = boundingHexagon;
        function addUniquePoints(pointArray, pointsToAdd) {
          var added = 0;
          pointsToAdd.forEach(function(p) {
            if (!measure2.isPointDistinct(p, pointArray, 1e-8))
              return;
            pointArray.push(p);
            added++;
          });
          return added;
        }
        function getFarPoint(modelContext, farPoint, measureAtlas) {
          if (farPoint)
            return farPoint;
          var high = modelExtents(modelContext).high;
          if (high) {
            return MakerJs2.point.add(high, [1, 1]);
          }
          return [7654321, 1234567];
        }
        function isPointInsideModel(pointToCheck, modelContext, options) {
          if (options === void 0) {
            options = {};
          }
          if (!options.farPoint) {
            options.farPoint = getFarPoint(modelContext, options.farPoint, options.measureAtlas);
          }
          options.out_intersectionPoints = [];
          var isInside;
          var lineToFarPoint = new MakerJs2.paths.Line(pointToCheck, options.farPoint);
          var measureFarPoint = pathExtents(lineToFarPoint);
          var walkOptions = {
            onPath: function(walkedPath) {
              if (options.measureAtlas && !isMeasurementOverlapping(measureFarPoint, options.measureAtlas.pathMap[walkedPath.routeKey])) {
                return;
              }
              var intersectOptions = { path2Offset: walkedPath.offset };
              var farInt = MakerJs2.path.intersection(lineToFarPoint, walkedPath.pathContext, intersectOptions);
              if (farInt) {
                var added = addUniquePoints(options.out_intersectionPoints, farInt.intersectionPoints);
                if (added % 2 == 1) {
                  isInside = !!!isInside;
                }
              }
            },
            beforeChildWalk: function(innerWalkedModel) {
              if (!options.measureAtlas) {
                return true;
              }
              var innerModelMeasurement = options.measureAtlas.modelMap[innerWalkedModel.routeKey];
              return innerModelMeasurement && isMeasurementOverlapping(measureFarPoint, innerModelMeasurement);
            }
          };
          MakerJs2.model.walk(modelContext, walkOptions);
          return !!isInside;
        }
        measure2.isPointInsideModel = isPointInsideModel;
      })(measure = MakerJs2.measure || (MakerJs2.measure = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var exporter;
      (function(exporter2) {
        function toJson(itemToExport, options) {
          if (options === void 0) {
            options = {};
          }
          function replacer(key, value2) {
            if (MakerJs2.isNumber(value2)) {
              var newValue = MakerJs2.round(value2, options.accuracy);
              return newValue;
            }
            if (MakerJs2.isPoint(value2)) {
              var newPoint = MakerJs2.point.rounded(value2, options.accuracy);
              return newPoint;
            }
            return value2;
          }
          return JSON.stringify(itemToExport, options.accuracy && replacer, options.indentation);
        }
        exporter2.toJson = toJson;
        function tryGetModelUnits(itemToExport) {
          if (MakerJs2.isModel(itemToExport)) {
            return itemToExport.units;
          }
        }
        exporter2.tryGetModelUnits = tryGetModelUnits;
        exporter2.colors = {
          black: 0,
          red: 1,
          yellow: 2,
          lime: 3,
          aqua: 4,
          blue: 5,
          fuchsia: 6,
          white: 7,
          gray: 9,
          maroon: 14,
          orange: 30,
          olive: 58,
          green: 94,
          teal: 134,
          navy: 174,
          purple: 214,
          silver: 254
        };
      })(exporter = MakerJs2.exporter || (MakerJs2.exporter = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var importer;
      (function(importer2) {
        function parseNumericList(s) {
          var result = [];
          var re = /-?(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
          var matches;
          while ((matches = re.exec(s)) !== null) {
            if (matches.index === re.lastIndex) {
              re.lastIndex++;
            }
            if (matches[0] !== "")
              result.push(parseFloat(matches[0]));
          }
          return result;
        }
        importer2.parseNumericList = parseNumericList;
      })(importer = MakerJs2.importer || (MakerJs2.importer = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var exporter;
      (function(exporter2) {
        function toDXF(itemToExport, options) {
          if (options === void 0) {
            options = {};
          }
          var opts = {
            fontSize: 9
          };
          var layerIds = [];
          var doc = {
            entities: [],
            header: {},
            tables: {}
          };
          MakerJs2.extendObject(opts, options);
          if (MakerJs2.isModel(itemToExport)) {
            var modelToExport = itemToExport;
            if (modelToExport.exporterOptions) {
              MakerJs2.extendObject(opts, modelToExport.exporterOptions["toDXF"]);
            }
          }
          function colorLayerOptions(layer) {
            if (opts.layerOptions && opts.layerOptions[layer])
              return opts.layerOptions[layer];
            if (layer in exporter2.colors) {
              return {
                color: exporter2.colors[layer]
              };
            }
          }
          function defaultLayer(pathContext, parentLayer) {
            var layerId = pathContext && pathContext.layer || parentLayer || "0";
            if (layerIds.indexOf(layerId) < 0) {
              layerIds.push(layerId);
            }
            return layerId;
          }
          var map = {};
          map[MakerJs2.pathType.Line] = function(line, offset, layer) {
            var lineEntity = {
              type: "LINE",
              layer: defaultLayer(line, layer),
              vertices: [
                {
                  x: MakerJs2.round(line.origin[0] + offset[0], opts.accuracy),
                  y: MakerJs2.round(line.origin[1] + offset[1], opts.accuracy)
                },
                {
                  x: MakerJs2.round(line.end[0] + offset[0], opts.accuracy),
                  y: MakerJs2.round(line.end[1] + offset[1], opts.accuracy)
                }
              ]
            };
            return lineEntity;
          };
          map[MakerJs2.pathType.Circle] = function(circle, offset, layer) {
            var circleEntity = {
              type: "CIRCLE",
              layer: defaultLayer(circle, layer),
              center: {
                x: MakerJs2.round(circle.origin[0] + offset[0], opts.accuracy),
                y: MakerJs2.round(circle.origin[1] + offset[1], opts.accuracy)
              },
              radius: MakerJs2.round(circle.radius, opts.accuracy)
            };
            return circleEntity;
          };
          map[MakerJs2.pathType.Arc] = function(arc, offset, layer) {
            var arcEntity = {
              type: "ARC",
              layer: defaultLayer(arc, layer),
              center: {
                x: MakerJs2.round(arc.origin[0] + offset[0], opts.accuracy),
                y: MakerJs2.round(arc.origin[1] + offset[1], opts.accuracy)
              },
              radius: MakerJs2.round(arc.radius, opts.accuracy),
              startAngle: MakerJs2.round(arc.startAngle, opts.accuracy),
              endAngle: MakerJs2.round(arc.endAngle, opts.accuracy)
            };
            return arcEntity;
          };
          function appendVertex(v, layer, bulge) {
            var vertex = {
              type: "VERTEX",
              layer: defaultLayer(null, layer),
              x: MakerJs2.round(v[0], opts.accuracy),
              y: MakerJs2.round(v[1], opts.accuracy),
              bulge
            };
            return vertex;
          }
          function polyline(c) {
            var polylineEntity = {
              type: "POLYLINE",
              layer: defaultLayer(null, c.layer),
              shape: c.chain.endless,
              vertices: []
            };
            c.chain.links.forEach(function(link, i) {
              var bulge;
              if (link.walkedPath.pathContext.type === MakerJs2.pathType.Arc) {
                var arc = link.walkedPath.pathContext;
                bulge = MakerJs2.round(Math.tan(MakerJs2.angle.toRadians(MakerJs2.angle.ofArcSpan(arc)) / 4), opts.accuracy);
                if (link.reversed) {
                  bulge *= -1;
                }
              }
              var vertex = link.endPoints[link.reversed ? 1 : 0];
              polylineEntity.vertices.push(appendVertex(vertex, c.layer, bulge));
            });
            if (!c.chain.endless) {
              var lastLink = c.chain.links[c.chain.links.length - 1];
              var endPoint = lastLink.endPoints[lastLink.reversed ? 0 : 1];
              polylineEntity.vertices.push(appendVertex(endPoint, c.layer));
            }
            return polylineEntity;
          }
          function text(caption) {
            var layerId = defaultLayer(null, caption.layer);
            var layerOptions = colorLayerOptions(layerId);
            var center = MakerJs2.point.middle(caption.anchor);
            var textEntity = {
              type: "TEXT",
              startPoint: appendVertex(center, null),
              endPoint: appendVertex(center, null),
              layer: layerId,
              textHeight: layerOptions && layerOptions.fontSize || opts.fontSize,
              text: caption.text,
              halign: 4,
              valign: 0,
              rotation: MakerJs2.angle.ofPointInDegrees(caption.anchor.origin, caption.anchor.end)
            };
            return textEntity;
          }
          function layerOut(layerId, layerColor) {
            var layerEntity = {
              name: layerId,
              color: layerColor
            };
            return layerEntity;
          }
          function lineTypesOut() {
            var lineStyleTable = {
              lineTypes: {
                "CONTINUOUS": {
                  name: "CONTINUOUS",
                  description: "______",
                  patternLength: 0
                }
              }
            };
            var tableName = "lineType";
            doc.tables[tableName] = lineStyleTable;
          }
          function layersOut() {
            var layerTable = {
              layers: {}
            };
            layerIds.forEach(function(layerId) {
              var layerOptions = colorLayerOptions(layerId);
              if (layerOptions) {
                layerTable.layers[layerId] = layerOut(layerId, layerOptions.color);
              }
            });
            var tableName = "layer";
            doc.tables[tableName] = layerTable;
          }
          function header() {
            if (opts.units) {
              var units2 = dxfUnit[opts.units];
              doc.header["$INSUNITS"] = units2;
            }
          }
          function entities(walkedPaths2, chains, captions) {
            var entityArray = doc.entities;
            entityArray.push.apply(entityArray, chains.map(polyline));
            walkedPaths2.forEach(function(walkedPath) {
              var fn = map[walkedPath.pathContext.type];
              if (fn) {
                var entity = fn(walkedPath.pathContext, walkedPath.offset, walkedPath.layer);
                entityArray.push(entity);
              }
            });
            entityArray.push.apply(entityArray, captions.map(text));
          }
          if (!opts.units) {
            var units = exporter2.tryGetModelUnits(itemToExport);
            if (units) {
              opts.units = units;
            }
          }
          MakerJs2.extendObject(options, opts);
          var chainsOnLayers = [];
          var walkedPaths = [];
          if (opts.usePOLYLINE) {
            var cb = function(chains, loose, layer) {
              chains.forEach(function(c) {
                if (c.endless && c.links.length === 1 && c.links[0].walkedPath.pathContext.type === MakerJs2.pathType.Circle) {
                  walkedPaths.push(c.links[0].walkedPath);
                  return;
                }
                var chainOnLayer = { chain: c, layer };
                chainsOnLayers.push(chainOnLayer);
              });
              walkedPaths.push.apply(walkedPaths, loose);
            };
            MakerJs2.model.findChains(modelToExport, cb, { byLayers: true, pointMatchingDistance: opts.pointMatchingDistance });
          } else {
            var walkOptions = {
              onPath: function(walkedPath) {
                walkedPaths.push(walkedPath);
              }
            };
            MakerJs2.model.walk(modelToExport, walkOptions);
          }
          entities(walkedPaths, chainsOnLayers, MakerJs2.model.getAllCaptionsOffset(modelToExport));
          header();
          lineTypesOut();
          layersOut();
          return outputDocument(doc);
        }
        exporter2.toDXF = toDXF;
        function outputDocument(doc) {
          var dxf = [];
          function append() {
            var values = [];
            for (var _i = 0; _i < arguments.length; _i++) {
              values[_i] = arguments[_i];
            }
            dxf.push.apply(dxf, values);
          }
          var map = {};
          map["LINE"] = function(line) {
            append("0", "LINE", "8", line.layer, "10", line.vertices[0].x, "20", line.vertices[0].y, "11", line.vertices[1].x, "21", line.vertices[1].y);
          };
          map["CIRCLE"] = function(circle) {
            append("0", "CIRCLE", "8", circle.layer, "10", circle.center.x, "20", circle.center.y, "40", circle.radius);
          };
          map["ARC"] = function(arc) {
            append("0", "ARC", "8", arc.layer, "10", arc.center.x, "20", arc.center.y, "40", arc.radius, "50", arc.startAngle, "51", arc.endAngle);
          };
          map["VERTEX"] = function(vertex) {
            append("0", "VERTEX", "8", vertex.layer, "10", vertex.x, "20", vertex.y);
            if (vertex.bulge !== void 0) {
              append("42", vertex.bulge);
            }
          };
          map["POLYLINE"] = function(polyline) {
            append("0", "POLYLINE", "8", polyline.layer, "66", 1, "70", polyline.shape ? 1 : 0);
            polyline.vertices.forEach(function(vertex) {
              return map["VERTEX"](vertex);
            });
            append("0", "SEQEND");
          };
          map["TEXT"] = function(text) {
            append("0", "TEXT", "10", text.startPoint.x, "20", text.startPoint.y, "11", text.endPoint.x, "21", text.endPoint.y, "40", text.textHeight, "1", text.text, "50", text.rotation, "8", text.layer, "72", text.halign, "73", text.valign);
          };
          function section(sectionFn) {
            append("0", "SECTION");
            sectionFn();
            append("0", "ENDSEC");
          }
          function table(fn) {
            append("0", "TABLE");
            fn();
            append("0", "ENDTAB");
          }
          function tables() {
            append("2", "TABLES");
            table(lineTypesOut);
            table(layersOut);
          }
          function layerOut(layer) {
            append("0", "LAYER", "2", layer.name, "70", "0", "62", layer.color, "6", "CONTINUOUS");
          }
          function lineTypeOut(lineType) {
            append(
              "0",
              "LTYPE",
              "72",
              //72 Alignment code; value is always 65, the ASCII code for A
              "65",
              "70",
              "64",
              "2",
              lineType.name,
              "3",
              lineType.description,
              "73",
              "0",
              "40",
              lineType.patternLength
            );
          }
          function lineTypesOut() {
            var lineTypeTableName = "lineType";
            var lineTypeTable = doc.tables[lineTypeTableName];
            append("2", "LTYPE");
            for (var lineTypeId in lineTypeTable.lineTypes) {
              var lineType = lineTypeTable.lineTypes[lineTypeId];
              lineTypeOut(lineType);
            }
          }
          function layersOut() {
            var layerTableName = "layer";
            var layerTable = doc.tables[layerTableName];
            append("2", "LAYER");
            for (var layerId in layerTable.layers) {
              var layer = layerTable.layers[layerId];
              layerOut(layer);
            }
          }
          function header() {
            append("2", "HEADER");
            for (var key in doc.header) {
              var value2 = doc.header[key];
              append("9", key, "70", value2);
            }
          }
          function entities(entityArray) {
            append("2", "ENTITIES");
            entityArray.forEach(function(entity) {
              var fn = map[entity.type];
              if (fn) {
                fn(entity);
              }
            });
          }
          section(header);
          section(tables);
          section(function() {
            return entities(doc.entities);
          });
          append("0", "EOF");
          return dxf.join("\n");
        }
        var dxfUnit = {};
        dxfUnit[""] = 0;
        dxfUnit[MakerJs2.unitType.Inch] = 1;
        dxfUnit[MakerJs2.unitType.Foot] = 2;
        dxfUnit[MakerJs2.unitType.Millimeter] = 4;
        dxfUnit[MakerJs2.unitType.Centimeter] = 5;
        dxfUnit[MakerJs2.unitType.Meter] = 6;
      })(exporter = MakerJs2.exporter || (MakerJs2.exporter = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var solvers;
      (function(solvers2) {
        var equilateral = Math.sqrt(3) / 2;
        function equilateralAltitude(sideLength) {
          return sideLength * equilateral;
        }
        solvers2.equilateralAltitude = equilateralAltitude;
        function equilateralSide(altitude) {
          return altitude / equilateral;
        }
        solvers2.equilateralSide = equilateralSide;
        function solveTriangleSSS(lengthA, lengthB, lengthC) {
          return MakerJs2.angle.toDegrees(Math.acos((lengthB * lengthB + lengthC * lengthC - lengthA * lengthA) / (2 * lengthB * lengthC)));
        }
        solvers2.solveTriangleSSS = solveTriangleSSS;
        function solveTriangleASA(oppositeAngleInDegrees, lengthOfSideBetweenAngles, otherAngleInDegrees) {
          var angleOppositeSide = 180 - oppositeAngleInDegrees - otherAngleInDegrees;
          return lengthOfSideBetweenAngles * Math.sin(MakerJs2.angle.toRadians(oppositeAngleInDegrees)) / Math.sin(MakerJs2.angle.toRadians(angleOppositeSide));
        }
        solvers2.solveTriangleASA = solveTriangleASA;
        function circleTangentAngles(a, b, inner) {
          if (inner === void 0) {
            inner = false;
          }
          var connect = new MakerJs2.paths.Line(a.origin, b.origin);
          var distance = MakerJs2.measure.pointDistance(a.origin, b.origin);
          if (a.radius >= distance + b.radius || b.radius >= distance + a.radius)
            return null;
          if (inner && a.radius + b.radius >= distance)
            return null;
          var tangentAngles;
          if (!inner && MakerJs2.round(a.radius - b.radius) == 0) {
            tangentAngles = [90, 270];
          } else {
            var d2 = distance / 2;
            var between = new MakerJs2.paths.Circle([d2, 0], d2);
            var diff = new MakerJs2.paths.Circle(a.radius > b.radius ? [0, 0] : [distance, 0], inner ? a.radius + b.radius : Math.abs(a.radius - b.radius));
            var int = MakerJs2.path.intersection(diff, between);
            if (!int || !int.path1Angles)
              return null;
            tangentAngles = int.path1Angles;
          }
          var connectAngle = MakerJs2.angle.ofLineInDegrees(connect);
          return tangentAngles.map(function(a2) {
            return MakerJs2.angle.noRevolutions(a2 + connectAngle);
          });
        }
        solvers2.circleTangentAngles = circleTangentAngles;
      })(solvers = MakerJs2.solvers || (MakerJs2.solvers = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var path;
      (function(path2) {
        var map = {};
        map[MakerJs2.pathType.Arc] = {};
        map[MakerJs2.pathType.Circle] = {};
        map[MakerJs2.pathType.Line] = {};
        map[MakerJs2.pathType.Arc][MakerJs2.pathType.Arc] = function(arc1, arc2, options, swapOffsets) {
          var result = null;
          moveTemp([arc1, arc2], options, swapOffsets, function() {
            var angles = circleToCircle(arc1, arc2, options);
            if (angles) {
              var arc1Angles = getAnglesWithinArc(angles[0], arc1, options);
              var arc2Angles = getAnglesWithinArc(angles[1], arc2, options);
              if (arc1Angles && arc2Angles) {
                if (arc1Angles.length === 1 || arc2Angles.length === 1) {
                  for (var i1 = 0; i1 < arc1Angles.length; i1++) {
                    for (var i2 = 0; i2 < arc2Angles.length; i2++) {
                      var p1 = MakerJs2.point.fromAngleOnCircle(arc1Angles[i1], arc1);
                      var p2 = MakerJs2.point.fromAngleOnCircle(arc2Angles[i2], arc2);
                      if (MakerJs2.measure.isPointEqual(p1, p2, 1e-4)) {
                        result = {
                          intersectionPoints: [p1],
                          path1Angles: [arc1Angles[i1]],
                          path2Angles: [arc2Angles[i2]]
                        };
                        return;
                      }
                    }
                  }
                } else {
                  result = {
                    intersectionPoints: pointsFromAnglesOnCircle(arc1Angles, arc1),
                    path1Angles: arc1Angles,
                    path2Angles: arc2Angles
                  };
                }
              }
            } else {
              if (options.out_AreOverlapped) {
                options.out_AreOverlapped = MakerJs2.measure.isArcOverlapping(arc1, arc2, options.excludeTangents);
              }
            }
          });
          return result;
        };
        map[MakerJs2.pathType.Arc][MakerJs2.pathType.Circle] = function(arc, circle, options, swapOffsets) {
          var result = null;
          moveTemp([arc, circle], options, swapOffsets, function() {
            var angles = circleToCircle(arc, circle, options);
            if (angles) {
              var arcAngles = getAnglesWithinArc(angles[0], arc, options);
              if (arcAngles) {
                var circleAngles;
                if (arcAngles.length == 2) {
                  circleAngles = angles[1];
                } else {
                  var index = findCorrespondingAngleIndex(angles[0], arcAngles[0]);
                  circleAngles = [angles[1][index]];
                }
                result = {
                  intersectionPoints: pointsFromAnglesOnCircle(arcAngles, arc),
                  path1Angles: arcAngles,
                  path2Angles: circleAngles
                };
              }
            }
          });
          return result;
        };
        map[MakerJs2.pathType.Arc][MakerJs2.pathType.Line] = function(arc, line, options, swapOffsets) {
          var result = null;
          moveTemp([arc, line], options, swapOffsets, function() {
            var angles = lineToCircle(line, arc, options);
            if (angles) {
              var arcAngles = getAnglesWithinArc(angles, arc, options);
              if (arcAngles) {
                result = {
                  intersectionPoints: pointsFromAnglesOnCircle(arcAngles, arc),
                  path1Angles: arcAngles
                };
              }
            }
          });
          return result;
        };
        map[MakerJs2.pathType.Circle][MakerJs2.pathType.Arc] = function(circle, arc, options) {
          var result = map[MakerJs2.pathType.Arc][MakerJs2.pathType.Circle](arc, circle, options, true);
          if (result) {
            return swapAngles(result);
          }
          return null;
        };
        map[MakerJs2.pathType.Circle][MakerJs2.pathType.Circle] = function(circle1, circle2, options, swapOffsets) {
          var result = null;
          moveTemp([circle1, circle2], options, swapOffsets, function() {
            var angles = circleToCircle(circle1, circle2, options);
            if (angles) {
              result = {
                intersectionPoints: pointsFromAnglesOnCircle(angles[0], circle1),
                path1Angles: angles[0],
                path2Angles: angles[1]
              };
            }
          });
          return result;
        };
        map[MakerJs2.pathType.Circle][MakerJs2.pathType.Line] = function(circle, line, options, swapOffsets) {
          var result = null;
          moveTemp([circle, line], options, swapOffsets, function() {
            var angles = lineToCircle(line, circle, options);
            if (angles) {
              result = {
                intersectionPoints: pointsFromAnglesOnCircle(angles, circle),
                path1Angles: angles
              };
            }
          });
          return result;
        };
        map[MakerJs2.pathType.Line][MakerJs2.pathType.Arc] = function(line, arc, options) {
          var result = map[MakerJs2.pathType.Arc][MakerJs2.pathType.Line](arc, line, options, true);
          if (result) {
            return swapAngles(result);
          }
          return null;
        };
        map[MakerJs2.pathType.Line][MakerJs2.pathType.Circle] = function(line, circle, options) {
          var result = map[MakerJs2.pathType.Circle][MakerJs2.pathType.Line](circle, line, options, true);
          if (result) {
            return swapAngles(result);
          }
          return null;
        };
        map[MakerJs2.pathType.Line][MakerJs2.pathType.Line] = function(line1, line2, options, swapOffsets) {
          var result = null;
          moveTemp([line1, line2], options, swapOffsets, function() {
            var intersectionPoint = MakerJs2.point.fromSlopeIntersection(line1, line2, options);
            if (intersectionPoint) {
              if (MakerJs2.measure.isBetweenPoints(intersectionPoint, line1, options.excludeTangents) && MakerJs2.measure.isBetweenPoints(intersectionPoint, line2, options.excludeTangents)) {
                result = {
                  intersectionPoints: [intersectionPoint]
                };
              }
            }
          });
          return result;
        };
        function moveTemp(pathsToOffset, options, swapOffsets, task) {
          var offsets = swapOffsets ? [options.path2Offset, options.path1Offset] : [options.path1Offset, options.path2Offset];
          path2.moveTemporary(pathsToOffset, offsets, task);
        }
        ;
        function swapAngles(result) {
          var temp = result.path1Angles;
          if (result.path2Angles) {
            result.path1Angles = result.path2Angles;
          } else {
            delete result.path1Angles;
          }
          if (temp) {
            result.path2Angles = temp;
          }
          return result;
        }
        function intersection(path1, path22, options) {
          if (options === void 0) {
            options = {};
          }
          if (path1 && path22) {
            var fn = map[path1.type][path22.type];
            if (fn) {
              return fn(path1, path22, options);
            }
          }
          return null;
        }
        path2.intersection = intersection;
        function findCorrespondingAngleIndex(circleAngles, arcAngle) {
          for (var i = 2; i--; ) {
            if (circleAngles[i] === arcAngle)
              return i;
          }
        }
        function pointsFromAnglesOnCircle(anglesInDegrees, circle) {
          var result = [];
          for (var i = 0; i < anglesInDegrees.length; i++) {
            result.push(MakerJs2.point.fromAngleOnCircle(anglesInDegrees[i], circle));
          }
          return result;
        }
        function getAnglesWithinArc(angles, arc, options) {
          if (!angles)
            return null;
          var anglesWithinArc = [];
          for (var i = 0; i < angles.length; i++) {
            if (MakerJs2.measure.isBetweenArcAngles(angles[i], arc, options.excludeTangents)) {
              anglesWithinArc.push(angles[i]);
            }
          }
          if (anglesWithinArc.length == 0)
            return null;
          return anglesWithinArc;
        }
        function lineToCircle(line, circle, options) {
          var radius = MakerJs2.round(circle.radius);
          if (circle.radius <= 0) {
            return null;
          }
          var clonedLine = new MakerJs2.paths.Line(MakerJs2.point.subtract(line.origin, circle.origin), MakerJs2.point.subtract(line.end, circle.origin));
          var lineAngleNormal = MakerJs2.angle.ofLineInDegrees(line);
          var lineAngle = lineAngleNormal >= 180 ? lineAngleNormal - 360 : lineAngleNormal;
          path2.rotate(clonedLine, -lineAngle, MakerJs2.point.zero());
          function unRotate(resultAngle) {
            var unrotated = resultAngle + lineAngle;
            return MakerJs2.round(MakerJs2.angle.noRevolutions(unrotated));
          }
          var lineY = MakerJs2.round(clonedLine.origin[1]);
          var lineYabs = Math.abs(lineY);
          if (lineYabs > radius) {
            return null;
          }
          var anglesOfIntersection = [];
          if (lineYabs == radius) {
            if (options.excludeTangents) {
              return null;
            }
            anglesOfIntersection.push(unRotate(lineY > 0 ? 90 : 270));
          } else {
            let intersectionBetweenEndpoints2 = function(x, angleOfX) {
              if (MakerJs2.measure.isBetween(MakerJs2.round(x), MakerJs2.round(clonedLine.origin[0]), MakerJs2.round(clonedLine.end[0]), options.excludeTangents)) {
                anglesOfIntersection.push(unRotate(angleOfX));
              }
            };
            var intersectionBetweenEndpoints = intersectionBetweenEndpoints2;
            var intersectRadians = Math.asin(lineY / radius);
            var intersectDegrees = MakerJs2.angle.toDegrees(intersectRadians);
            var intersectX = Math.cos(intersectRadians) * radius;
            intersectionBetweenEndpoints2(-intersectX, 180 - intersectDegrees);
            intersectionBetweenEndpoints2(intersectX, intersectDegrees);
          }
          if (anglesOfIntersection.length > 0) {
            return anglesOfIntersection;
          }
          return null;
        }
        function circleToCircle(circle1, circle2, options) {
          if (circle1.radius <= 0 || circle2.radius <= 0) {
            return null;
          }
          if (circle1.radius == circle2.radius && MakerJs2.measure.isPointEqual(circle1.origin, circle2.origin, 1e-4)) {
            options.out_AreOverlapped = true;
            return null;
          }
          var offset = MakerJs2.point.subtract(MakerJs2.point.zero(), circle1.origin);
          var c1 = new MakerJs2.paths.Circle(MakerJs2.point.zero(), circle1.radius);
          var c2 = new MakerJs2.paths.Circle(MakerJs2.point.subtract(circle2.origin, circle1.origin), circle2.radius);
          var c2Angle = MakerJs2.angle.ofPointInDegrees(MakerJs2.point.zero(), c2.origin);
          path2.rotate(c2, -c2Angle, MakerJs2.point.zero());
          function unRotate(resultAngle) {
            var unrotated = resultAngle + c2Angle;
            return MakerJs2.angle.noRevolutions(unrotated);
          }
          var x = c2.origin[0];
          if (MakerJs2.round(c2.radius - x - c1.radius) == 0) {
            if (options.excludeTangents) {
              return null;
            }
            return [[unRotate(180)], [unRotate(180)]];
          }
          if (MakerJs2.round(c2.radius + x - c1.radius) == 0) {
            if (options.excludeTangents) {
              return null;
            }
            return [[unRotate(0)], [unRotate(0)]];
          }
          if (MakerJs2.round(x - c2.radius - c1.radius) == 0) {
            if (options.excludeTangents) {
              return null;
            }
            return [[unRotate(0)], [unRotate(180)]];
          }
          if (MakerJs2.round(x - c2.radius) > c1.radius) {
            return null;
          }
          if (MakerJs2.round(x + c2.radius) < c1.radius) {
            return null;
          }
          if (MakerJs2.round(x - c2.radius) < -c1.radius) {
            return null;
          }
          function bothAngles(oneAngle) {
            return [unRotate(oneAngle), unRotate(MakerJs2.angle.mirror(oneAngle, false, true))];
          }
          var c1IntersectionAngle = MakerJs2.solvers.solveTriangleSSS(c2.radius, c1.radius, x);
          var c2IntersectionAngle = MakerJs2.solvers.solveTriangleSSS(c1.radius, x, c2.radius);
          return [bothAngles(c1IntersectionAngle), bothAngles(180 - c2IntersectionAngle)];
        }
      })(path = MakerJs2.path || (MakerJs2.path = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var path;
      (function(path2) {
        var propertyNamesMap = {};
        propertyNamesMap[MakerJs2.pathType.Arc] = function(arc) {
          return ["startAngle", "endAngle"];
        };
        propertyNamesMap[MakerJs2.pathType.Line] = function(line) {
          return ["origin", "end"];
        };
        function getPointProperties(pathToInspect) {
          var points = MakerJs2.point.fromPathEnds(pathToInspect);
          if (points) {
            let pointProperty2 = function(index) {
              return { point: points[index], propertyName: propertyNames[index] };
            };
            var pointProperty = pointProperty2;
            var propertyNames = null;
            var fn = propertyNamesMap[pathToInspect.type];
            if (fn) {
              propertyNames = fn(pathToInspect);
              return [pointProperty2(0), pointProperty2(1)];
            }
          }
          return null;
        }
        function getMatchingPointProperties(pathA, pathB, options) {
          var pathAProperties = getPointProperties(pathA);
          var pathBProperties = getPointProperties(pathB);
          var result = null;
          function makeMatch(pathContext, pointProperties, index) {
            return {
              path: pathContext,
              isStart: index == 0,
              propertyName: pointProperties[index].propertyName,
              point: pointProperties[index].point,
              oppositePoint: pointProperties[1 - index].point
            };
          }
          function check(iA, iB) {
            if (MakerJs2.measure.isPointEqual(pathAProperties[iA].point, pathBProperties[iB].point, 1e-4)) {
              result = [
                makeMatch(pathA, pathAProperties, iA),
                makeMatch(pathB, pathBProperties, iB)
              ];
              return true;
            }
            return false;
          }
          check(0, 0) || check(0, 1) || check(1, 0) || check(1, 1);
          return result;
        }
        function populateShardPointsFromReferenceCircle(filletRadius, center, properties, options) {
          var referenceCircle = new MakerJs2.paths.Circle(center, filletRadius);
          for (var i = 0; i < 2; i++) {
            var circleIntersection = path2.intersection(referenceCircle, properties[i].path);
            if (!circleIntersection) {
              return false;
            }
            properties[i].shardPoint = circleIntersection.intersectionPoints[0];
            if (MakerJs2.measure.isPointEqual(properties[i].point, circleIntersection.intersectionPoints[0], 1e-4)) {
              if (circleIntersection.intersectionPoints.length > 1) {
                properties[i].shardPoint = circleIntersection.intersectionPoints[1];
              } else {
                return false;
              }
            }
          }
          return true;
        }
        function cloneAndBreakPath(pathToShard, shardPoint) {
          var shardStart = path2.clone(pathToShard);
          var shardEnd = path2.breakAtPoint(shardStart, shardPoint);
          return [shardStart, shardEnd];
        }
        var guidePathMap = {};
        guidePathMap[MakerJs2.pathType.Arc] = function(arc, filletRadius, nearPoint, shardPoint, isStart) {
          var guideRadius = arc.radius;
          var guideArcShard = cloneAndBreakPath(arc, shardPoint)[isStart ? 0 : 1];
          if (guideArcShard) {
            if (MakerJs2.measure.isArcConcaveTowardsPoint(guideArcShard, nearPoint)) {
              guideRadius -= filletRadius;
            } else {
              guideRadius += filletRadius;
            }
            if (MakerJs2.round(guideRadius) <= 0)
              return null;
            return new MakerJs2.paths.Arc(arc.origin, guideRadius, arc.startAngle, arc.endAngle);
          }
          return null;
        };
        guidePathMap[MakerJs2.pathType.Line] = function(line, filletRadius, nearPoint, shardPoint, isStart) {
          return new MakerJs2.paths.Parallel(line, filletRadius, nearPoint);
        };
        function getGuidePath(context, filletRadius, nearPoint) {
          var result = null;
          var fn = guidePathMap[context.path.type];
          if (fn) {
            result = fn(context.path, filletRadius, nearPoint, context.shardPoint, context.isStart);
          }
          return result;
        }
        var filletResultMap = {};
        filletResultMap[MakerJs2.pathType.Arc] = function(arc, propertyName, filletRadius, filletCenter) {
          var guideLine = new MakerJs2.paths.Line(arc.origin, filletCenter);
          var guideLineAngle = MakerJs2.angle.ofLineInDegrees(guideLine);
          var filletAngle = guideLineAngle;
          if (!MakerJs2.measure.isArcConcaveTowardsPoint(arc, filletCenter)) {
            filletAngle += 180;
          }
          return {
            filletAngle: MakerJs2.angle.noRevolutions(filletAngle),
            clipPath: function() {
              arc[propertyName] = guideLineAngle;
            }
          };
        };
        filletResultMap[MakerJs2.pathType.Line] = function(line, propertyName, filletRadius, filletCenter) {
          var guideLine = new MakerJs2.paths.Line([0, 0], [0, 1]);
          var lineAngle = MakerJs2.angle.ofLineInDegrees(line);
          path2.rotate(guideLine, lineAngle, [0, 0]);
          path2.moveRelative(guideLine, filletCenter);
          var intersectionPoint = MakerJs2.point.fromSlopeIntersection(line, guideLine);
          if (intersectionPoint) {
            return {
              filletAngle: MakerJs2.angle.ofPointInDegrees(filletCenter, intersectionPoint),
              clipPath: function() {
                line[propertyName] = intersectionPoint;
              }
            };
          }
          return null;
        };
        function getFilletResult(context, filletRadius, filletCenter) {
          var result = null;
          var fn = filletResultMap[context.path.type];
          if (fn) {
            result = fn(context.path, context.propertyName, filletRadius, filletCenter);
          }
          if (!testFilletResult(context, result)) {
            result = null;
          }
          return result;
        }
        function getDogboneResult(context, filletCenter) {
          var result = {
            filletAngle: MakerJs2.angle.ofPointInDegrees(filletCenter, context.shardPoint),
            clipPath: function() {
              context.path[context.propertyName] = context.shardPoint;
            }
          };
          if (!testFilletResult(context, result)) {
            result = null;
          }
          return result;
        }
        function testFilletResult(context, result) {
          var test = false;
          if (result) {
            var originalValue = context.path[context.propertyName];
            result.clipPath();
            if (MakerJs2.measure.pathLength(context.path) > 0) {
              test = true;
            }
            context.path[context.propertyName] = originalValue;
          }
          return test;
        }
        function getLineRatio(lines) {
          var totalLength = 0;
          var lengths = [];
          for (var i = 0; i < lines.length; i++) {
            var length = MakerJs2.measure.pathLength(lines[i]);
            lengths.push(length);
            totalLength += length;
          }
          return lengths[0] / totalLength;
        }
        function dogbone(lineA, lineB, filletRadius, options) {
          if (MakerJs2.isPathLine(lineA) && MakerJs2.isPathLine(lineB) && filletRadius && filletRadius > 0) {
            var opts = {
              pointMatchingDistance: 5e-3
            };
            MakerJs2.extendObject(opts, options);
            var commonProperty = getMatchingPointProperties(lineA, lineB, options);
            if (commonProperty) {
              var ratio = getLineRatio([lineA, lineB]);
              var span = new MakerJs2.paths.Line(commonProperty[0].oppositePoint, commonProperty[1].oppositePoint);
              var midRatioPoint = MakerJs2.point.middle(span, ratio);
              var bisectionAngle = MakerJs2.angle.ofPointInDegrees(commonProperty[0].point, midRatioPoint);
              var center = MakerJs2.point.add(commonProperty[0].point, MakerJs2.point.fromPolar(MakerJs2.angle.toRadians(bisectionAngle), filletRadius));
              if (!populateShardPointsFromReferenceCircle(filletRadius, center, commonProperty, opts)) {
                return null;
              }
              var results = [];
              for (var i = 0; i < 2; i++) {
                var result = getDogboneResult(commonProperty[i], center);
                if (!result) {
                  return null;
                }
                results.push(result);
              }
              var filletArc = new MakerJs2.paths.Arc(center, filletRadius, results[0].filletAngle, results[1].filletAngle);
              if (MakerJs2.round(MakerJs2.angle.noRevolutions(MakerJs2.angle.ofArcMiddle(filletArc))) == MakerJs2.round(bisectionAngle)) {
                filletArc.startAngle = results[1].filletAngle;
                filletArc.endAngle = results[0].filletAngle;
              }
              results[0].clipPath();
              results[1].clipPath();
              return filletArc;
            }
          }
          return null;
        }
        path2.dogbone = dogbone;
        function fillet(pathA, pathB, filletRadius, options) {
          if (pathA && pathB && filletRadius && filletRadius > 0) {
            var opts = {
              pointMatchingDistance: 5e-3
            };
            MakerJs2.extendObject(opts, options);
            var commonProperty = getMatchingPointProperties(pathA, pathB, options);
            if (commonProperty) {
              if (!populateShardPointsFromReferenceCircle(filletRadius, commonProperty[0].point, commonProperty, opts)) {
                return null;
              }
              var guidePaths = [];
              for (var i = 0; i < 2; i++) {
                var otherPathShardPoint = commonProperty[1 - i].shardPoint;
                if (!otherPathShardPoint) {
                  return null;
                }
                var guidePath = getGuidePath(commonProperty[i], filletRadius, otherPathShardPoint);
                guidePaths.push(guidePath);
              }
              var intersectionPoint = path2.intersection(guidePaths[0], guidePaths[1]);
              if (intersectionPoint) {
                var center;
                if (intersectionPoint.intersectionPoints.length == 1) {
                  center = intersectionPoint.intersectionPoints[0];
                } else {
                  center = MakerJs2.point.closest(commonProperty[0].point, intersectionPoint.intersectionPoints);
                }
                var results = [];
                for (var i = 0; i < 2; i++) {
                  var result = getFilletResult(commonProperty[i], filletRadius, center);
                  if (!result) {
                    return null;
                  }
                  results.push(result);
                }
                if (MakerJs2.round(results[0].filletAngle - results[1].filletAngle) == 0)
                  return null;
                var filletArc = new MakerJs2.paths.Arc(center, filletRadius, results[0].filletAngle, results[1].filletAngle);
                var filletSpan = MakerJs2.angle.ofArcSpan(filletArc);
                if (filletSpan == 180) {
                  return null;
                }
                if (filletSpan > 180) {
                  filletArc.startAngle = results[1].filletAngle;
                  filletArc.endAngle = results[0].filletAngle;
                }
                results[0].clipPath();
                results[1].clipPath();
                return filletArc;
              }
            }
          }
          return null;
        }
        path2.fillet = fillet;
      })(path = MakerJs2.path || (MakerJs2.path = {}));
    })(MakerJs || (MakerJs = {}));
    (function(MakerJs2) {
      var chain;
      (function(chain2) {
        function dogbone(chainToFillet, filletSpec) {
          return chainFillet(false, chainToFillet, filletSpec);
        }
        chain2.dogbone = dogbone;
        function fillet(chainToFillet, filletSpec) {
          return chainFillet(true, chainToFillet, filletSpec);
        }
        chain2.fillet = fillet;
        function chainFillet(traditional, chainToFillet, filletSpec) {
          var result = { paths: {} };
          var added = 0;
          var links = chainToFillet.links;
          function add(i1, i2) {
            var p1 = links[i1].walkedPath, p2 = links[i2].walkedPath;
            if (p1.modelContext === p2.modelContext && p1.modelContext.type == MakerJs2.models.BezierCurve.typeName)
              return;
            MakerJs2.path.moveTemporary([p1.pathContext, p2.pathContext], [p1.offset, p2.offset], function() {
              var filletRadius;
              if (MakerJs2.isObject(filletSpec)) {
                var a = MakerJs2.angle.ofChainLinkJoint(links[i1], links[i2]);
                if (MakerJs2.round(a) === 0)
                  return;
                filletRadius = a > 0 ? filletSpec.left : filletSpec.right;
              } else {
                filletRadius = filletSpec;
              }
              if (!filletRadius || filletRadius < 0)
                return;
              var filletArc;
              if (traditional) {
                filletArc = MakerJs2.path.fillet(p1.pathContext, p2.pathContext, filletRadius);
              } else {
                filletArc = MakerJs2.path.dogbone(p1.pathContext, p2.pathContext, filletRadius);
              }
              if (filletArc) {
                result.paths["fillet" + added] = filletArc;
                added++;
              }
            });
          }
          for (var i = 1; i < links.length; i++) {
            add(i - 1, i);
          }
          if (chainToFillet.endless) {
            add(i - 1, 0);
          }
          if (!added)
            return null;
          return result;
        }
      })(chain = MakerJs2.chain || (MakerJs2.chain = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var kit;
      (function(kit2) {
        function construct(ctor, args) {
          function F() {
            return ctor.apply(this, args);
          }
          F.prototype = ctor.prototype;
          return new F();
        }
        kit2.construct = construct;
        function getParameterValues(ctor) {
          var parameters = [];
          var metaParams = ctor.metaParameters;
          if (metaParams) {
            for (var i = 0; i < metaParams.length; i++) {
              var value2 = metaParams[i].value;
              if (Array.isArray(value2)) {
                value2 = value2[0];
              }
              parameters.push(value2);
            }
          }
          return parameters;
        }
        kit2.getParameterValues = getParameterValues;
      })(kit = MakerJs2.kit || (MakerJs2.kit = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var model;
      (function(model2) {
        function getOpposedLink(linkedPaths, pathContext) {
          if (linkedPaths[0].walkedPath.pathContext === pathContext) {
            return linkedPaths[1];
          }
          return linkedPaths[0];
        }
        function followLinks(pointGraph, chainFound, chainNotFound) {
          function followLink(currLink, chain, firstLink) {
            while (currLink) {
              chain.links.push(currLink);
              chain.pathLength += currLink.pathLength;
              var next = currLink.reversed ? 0 : 1;
              var nextPoint = currLink.endPoints[next];
              var nextEl = pointGraph.getElementAtPoint(nextPoint);
              if (!nextEl || nextEl.valueIds.length === 0) {
                break;
              }
              var items = nextEl.valueIds.map(function(valueIndex) {
                return pointGraph.values[valueIndex];
              });
              var nextLink = getOpposedLink(items, currLink.walkedPath.pathContext);
              nextEl.valueIds.splice(0, 2);
              if (!nextLink) {
                break;
              }
              if (nextLink.walkedPath.pathContext === firstLink.walkedPath.pathContext) {
                if (chain.links.length > 1) {
                  chain.endless = true;
                }
                break;
              }
              currLink = nextLink;
            }
          }
          pointGraph.forEachPoint(function(p, values, pointId, el) {
            if (el.valueIds.length > 0) {
              var chain = {
                links: [],
                pathLength: 0
              };
              followLink(values[0], chain, values[0]);
              if (chain.endless) {
                chainFound(chain, false);
              } else {
                chain.links.reverse();
                var firstLink = chain.links[0];
                chain.links.map(function(link) {
                  link.reversed = !link.reversed;
                });
                chain.pathLength -= chain.links[chain.links.length - 1].pathLength;
                var currLink = chain.links.pop();
                followLink(currLink, chain, firstLink);
                if (chain.links.length > 1) {
                  chainFound(chain, true);
                } else {
                  chainNotFound(chain.links[0].walkedPath);
                }
              }
            }
          });
        }
        function findSingleChain(modelContext) {
          var singleChain = null;
          findChains(modelContext, function(chains, loose, layer) {
            singleChain = chains[0];
          }, { byLayers: false });
          return singleChain;
        }
        model2.findSingleChain = findSingleChain;
        function linkEndpoint(link, beginning) {
          var index = beginning === link.reversed ? 1 : 0;
          return link.endPoints[index];
        }
        function findChains(modelContext) {
          var args = [];
          for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
          }
          var options;
          var callback;
          switch (args.length) {
            case 1:
              if (typeof args[0] === "function") {
                callback = args[0];
              } else {
                options = args[0];
              }
              break;
            case 2:
              callback = args[0];
              options = args[1];
              break;
          }
          var opts = {
            pointMatchingDistance: 5e-3
          };
          MakerJs2.extendObject(opts, options);
          var pointGraphsByLayer = {};
          var chainsByLayer = {};
          var ignored = {};
          var walkOptions = {
            onPath: function(walkedPath) {
              var layer = opts.byLayers ? walkedPath.layer : "";
              if (!pointGraphsByLayer[layer]) {
                pointGraphsByLayer[layer] = new MakerJs2.PointGraph();
              }
              var pointGraph = pointGraphsByLayer[layer];
              var pathLength = MakerJs2.measure.pathLength(walkedPath.pathContext);
              if (walkedPath.pathContext.type === MakerJs2.pathType.Circle || walkedPath.pathContext.type === MakerJs2.pathType.Arc && MakerJs2.round(MakerJs2.angle.ofArcSpan(walkedPath.pathContext) - 360) === 0 || walkedPath.pathContext.type === MakerJs2.pathType.BezierSeed && MakerJs2.measure.isPointEqual(walkedPath.pathContext.origin, walkedPath.pathContext.end, opts.pointMatchingDistance)) {
                var chain = {
                  links: [{
                    walkedPath,
                    reversed: null,
                    endPoints: null,
                    pathLength
                  }],
                  endless: true,
                  pathLength
                };
                if (!chainsByLayer[layer]) {
                  chainsByLayer[layer] = [];
                }
                chainsByLayer[layer].push(chain);
              } else {
                if (pathLength < opts.pointMatchingDistance / 5) {
                  if (!ignored[layer]) {
                    ignored[layer] = [];
                  }
                  ignored[layer].push(walkedPath);
                  return;
                }
                var endPoints = MakerJs2.point.fromPathEnds(walkedPath.pathContext, walkedPath.offset);
                for (var i = 0; i < 2; i++) {
                  var link = {
                    walkedPath,
                    endPoints,
                    reversed: i != 0,
                    pathLength
                  };
                  var valueId = pointGraph.insertValue(link);
                  pointGraph.insertValueIdAtPoint(valueId, endPoints[i]);
                }
              }
            }
          };
          if (opts.shallow) {
            walkOptions.beforeChildWalk = function() {
              return false;
            };
          }
          var beziers;
          if (opts.unifyBeziers) {
            beziers = getBezierModels(modelContext);
            swapBezierPathsWithSeeds(beziers, true, opts.pointMatchingDistance);
          }
          model2.walk(modelContext, walkOptions);
          var _loop_3 = function(layer_22) {
            var pointGraph = pointGraphsByLayer[layer_22];
            pointGraph.mergeNearestSinglePoints(opts.pointMatchingDistance);
            loose = [];
            if (!chainsByLayer[layer_22]) {
              chainsByLayer[layer_22] = [];
            }
            followLinks(pointGraph, function(chain, checkEndless) {
              if (checkEndless) {
                chain.endless = MakerJs2.measure.isPointEqual(linkEndpoint(chain.links[0], true), linkEndpoint(chain.links[chain.links.length - 1], false), opts.pointMatchingDistance);
              } else {
                chain.endless = !!chain.endless;
              }
              chainsByLayer[layer_22].push(chain);
            }, function(walkedPath) {
              loose.push(walkedPath);
            });
            chainsByLayer[layer_22].sort(function(a, b) {
              return b.pathLength - a.pathLength;
            });
            if (opts.contain) {
              containChainsOptions = MakerJs2.isObject(opts.contain) ? opts.contain : { alternateDirection: false };
              containedChains = getContainment(chainsByLayer[layer_22], containChainsOptions);
              chainsByLayer[layer_22] = containedChains;
            }
            if (callback)
              callback(chainsByLayer[layer_22], loose, layer_22, ignored[layer_22]);
          };
          var loose, containChainsOptions, containedChains;
          for (var layer_2 in pointGraphsByLayer) {
            _loop_3(layer_2);
          }
          if (beziers) {
            swapBezierPathsWithSeeds(beziers, false, opts.pointMatchingDistance);
          }
          if (opts.byLayers) {
            return chainsByLayer;
          } else {
            return chainsByLayer[""];
          }
        }
        model2.findChains = findChains;
        function getContainment(allChains, opts) {
          var chainsAsModels = allChains.map(function(c) {
            return MakerJs2.chain.toNewModel(c);
          });
          var parents = [];
          allChains.forEach(function(chainContext, i1) {
            if (!chainContext.endless)
              return;
            var wp = chainContext.links[0].walkedPath;
            var firstPath = MakerJs2.path.clone(wp.pathContext, wp.offset);
            allChains.forEach(function(otherChain, i2) {
              if (chainContext === otherChain)
                return;
              if (!otherChain.endless)
                return;
              if (MakerJs2.measure.isPointInsideModel(MakerJs2.point.middle(firstPath), chainsAsModels[i2])) {
                parents[i1] = otherChain;
              }
            });
          });
          var result = [];
          allChains.forEach(function(chainContext, i) {
            var parent = parents[i];
            if (!parent) {
              result.push(chainContext);
            } else {
              if (!parent.contains) {
                parent.contains = [];
              }
              parent.contains.push(chainContext);
            }
          });
          if (opts.alternateDirection) {
            let alternate2 = function(chains, shouldBeClockwise) {
              chains.forEach(function(chainContext, i) {
                var isClockwise = MakerJs2.measure.isChainClockwise(chainContext);
                if (isClockwise !== null) {
                  if (!isClockwise && shouldBeClockwise || isClockwise && !shouldBeClockwise) {
                    MakerJs2.chain.reverse(chainContext);
                  }
                }
                if (chainContext.contains) {
                  alternate2(chainContext.contains, !shouldBeClockwise);
                }
              });
            };
            var alternate = alternate2;
            alternate2(result, true);
          }
          return result;
        }
        function getBezierModels(modelContext) {
          var beziers = [];
          function checkIsBezier(wm) {
            if (wm.childModel.type === MakerJs2.models.BezierCurve.typeName) {
              beziers.push(wm);
            }
          }
          var options = {
            beforeChildWalk: function(walkedModel) {
              checkIsBezier(walkedModel);
              return true;
            }
          };
          var rootModel = {
            childId: "",
            childModel: modelContext,
            layer: modelContext.layer,
            offset: modelContext.origin,
            parentModel: null,
            route: [],
            routeKey: ""
          };
          checkIsBezier(rootModel);
          model2.walk(modelContext, options);
          return beziers;
        }
        function swapBezierPathsWithSeeds(beziers, swap, pointMatchingDistance) {
          var tempKey = "tempPaths";
          var tempLayerKey = "tempLayer";
          beziers.forEach(function(wm) {
            var b = wm.childModel;
            if (swap) {
              if (wm.layer != void 0 && wm.layer !== "") {
                b[tempLayerKey] = b.layer;
                b.layer = wm.layer;
              }
              var bezierPartsByLayer = MakerJs2.models.BezierCurve.getBezierSeeds(b, { byLayers: true, pointMatchingDistance });
              for (var layer in bezierPartsByLayer) {
                var bezierSeeds = bezierPartsByLayer[layer];
                if (bezierSeeds.length > 0) {
                  b[tempKey] = b.paths;
                  var newPaths = {};
                  bezierSeeds.forEach(function(seed, i) {
                    seed.layer = layer;
                    newPaths["seed_" + i] = seed;
                  });
                  b.paths = newPaths;
                }
              }
            } else {
              if (tempKey in b) {
                b.paths = b[tempKey];
                delete b[tempKey];
              }
              if (tempLayerKey in b) {
                if (b[tempLayerKey] == void 0) {
                  delete b.layer;
                } else {
                  b.layer = b[tempLayerKey];
                }
                delete b[tempLayerKey];
              }
            }
          });
        }
      })(model = MakerJs2.model || (MakerJs2.model = {}));
    })(MakerJs || (MakerJs = {}));
    (function(MakerJs2) {
      var chain;
      (function(chain2) {
        function cycle(chainContext, amount) {
          if (amount === void 0) {
            amount = 1;
          }
          if (!chainContext.endless)
            return;
          var n = Math.abs(amount);
          for (var i = 0; i < n; i++) {
            if (amount < 0) {
              chainContext.links.push(chainContext.links.shift());
            } else {
              chainContext.links.unshift(chainContext.links.pop());
            }
          }
          return chainContext;
        }
        chain2.cycle = cycle;
        function reverse(chainContext) {
          chainContext.links.reverse();
          chainContext.links.forEach(function(link) {
            return link.reversed = !link.reversed;
          });
          return chainContext;
        }
        chain2.reverse = reverse;
        function startAt(chainContext, routeKey) {
          if (!chainContext.endless)
            return;
          var index = -1;
          for (var i = 0; i < chainContext.links.length; i++) {
            if (chainContext.links[i].walkedPath.routeKey == routeKey) {
              index = i;
              break;
            }
          }
          if (index > 0) {
            cycle(chainContext, index);
          }
          return chainContext;
        }
        chain2.startAt = startAt;
        function toNewModel(chainContext, detachFromOldModel) {
          if (detachFromOldModel === void 0) {
            detachFromOldModel = false;
          }
          var result = { paths: {} };
          for (var i = 0; i < chainContext.links.length; i++) {
            var wp = chainContext.links[i].walkedPath;
            if (wp.pathContext.type === MakerJs2.pathType.BezierSeed) {
              if (detachFromOldModel) {
                delete wp.modelContext.paths[wp.pathId];
              }
              if (!result.models) {
                result.models = {};
              }
              var modelId = MakerJs2.model.getSimilarModelId(result, wp.pathId);
              result.models[modelId] = MakerJs2.model.moveRelative(new MakerJs2.models.BezierCurve(wp.pathContext), wp.offset);
            } else {
              var newPath;
              if (detachFromOldModel) {
                newPath = wp.pathContext;
                delete wp.modelContext.paths[wp.pathId];
              } else {
                newPath = MakerJs2.path.clone(wp.pathContext);
              }
              var pathId = MakerJs2.model.getSimilarPathId(result, wp.pathId);
              result.paths[pathId] = MakerJs2.path.moveRelative(newPath, wp.offset);
            }
          }
          return result;
        }
        chain2.toNewModel = toNewModel;
        function removeDuplicateEnds(endless, points) {
          if (!endless || points.length < 2)
            return;
          if (MakerJs2.measure.isPointEqual(points[0], points[points.length - 1], 1e-5)) {
            points.pop();
          }
        }
        function toPoints(chainContext, distanceOrDistances, maxPoints) {
          var result = [];
          var di = 0;
          var t = 0;
          var distanceArray;
          if (Array.isArray(distanceOrDistances)) {
            distanceArray = distanceOrDistances;
          }
          for (var i = 0; i < chainContext.links.length; i++) {
            var link = chainContext.links[i];
            var wp = link.walkedPath;
            var len = link.pathLength;
            while (MakerJs2.round(len - t) > 0) {
              var r = t / len;
              if (link.reversed) {
                r = 1 - r;
              }
              result.push(MakerJs2.point.add(MakerJs2.point.middle(wp.pathContext, r), wp.offset));
              if (maxPoints && result.length >= maxPoints)
                return result;
              var distance;
              if (distanceArray) {
                distance = distanceArray[di];
                di++;
                if (di > distanceArray.length) {
                  return result;
                }
              } else {
                distance = distanceOrDistances;
              }
              t += distance;
            }
            t -= len;
          }
          removeDuplicateEnds(chainContext.endless, result);
          return result;
        }
        chain2.toPoints = toPoints;
        function toKeyPoints(chainContext, maxArcFacet) {
          var result = [];
          for (var i = 0; i < chainContext.links.length; i++) {
            var link = chainContext.links[i];
            var wp = link.walkedPath;
            var keyPoints = MakerJs2.path.toKeyPoints(wp.pathContext, maxArcFacet);
            if (keyPoints.length > 0) {
              if (link.reversed) {
                keyPoints.reverse();
              }
              if (i > 0) {
                keyPoints.shift();
              }
              var offsetPathPoints = keyPoints.map(function(p) {
                return MakerJs2.point.add(p, wp.offset);
              });
              result.push.apply(result, offsetPathPoints);
            }
          }
          removeDuplicateEnds(chainContext.endless, result);
          return result;
        }
        chain2.toKeyPoints = toKeyPoints;
      })(chain = MakerJs2.chain || (MakerJs2.chain = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var model;
      (function(model2) {
        var DeadEndFinder = (
          /** @class */
          (function() {
            function DeadEndFinder2(modelContext, options) {
              this.modelContext = modelContext;
              this.options = options;
              this.pointMap = new MakerJs2.PointGraph();
              this.list = [];
              this.removed = [];
              this.ordinals = {};
              this.load();
            }
            DeadEndFinder2.prototype.load = function() {
              var _this = this;
              var walkOptions = {
                onPath: function(walkedPath) {
                  var endPoints = MakerJs2.point.fromPathEnds(walkedPath.pathContext, walkedPath.offset);
                  if (!endPoints)
                    return;
                  var pathRef = walkedPath;
                  pathRef.endPoints = endPoints;
                  var valueId = _this.pointMap.insertValue(pathRef);
                  for (var i = 2; i--; ) {
                    _this.pointMap.insertValueIdAtPoint(valueId, endPoints[i]);
                  }
                }
              };
              model2.walk(this.modelContext, walkOptions);
              if (this.options.pointMatchingDistance) {
                this.pointMap.mergePoints(this.options.pointMatchingDistance);
              }
            };
            DeadEndFinder2.prototype.findDeadEnds = function() {
              var _this = this;
              var i = 0;
              this.pointMap.forEachPoint(function(p, values, pointId, el) {
                _this.ordinals[pointId] = i++;
                _this.list.push(el);
              });
              i = 0;
              var _loop_4 = function() {
                var el = this_2.list[i];
                if (el.valueIds.length === 1) {
                  this_2.removePath(el, el.valueIds[0], i);
                } else if (this_2.options.keep && el.valueIds.length % 2) {
                  el.valueIds.forEach(function(valueId) {
                    var value2 = _this.pointMap.values[valueId];
                    if (!_this.options.keep(value2)) {
                      _this.removePath(el, valueId, i);
                    }
                  });
                }
                i++;
              };
              var this_2 = this;
              while (i < this.list.length) {
                _loop_4();
              }
              return this.removed;
            };
            DeadEndFinder2.prototype.removePath = function(el, valueId, current) {
              var value2 = this.pointMap.values[valueId];
              var otherPointId = this.getOtherPointId(value2.endPoints, el.pointId);
              var otherElement = this.pointMap.index[otherPointId];
              this.removed.push(value2);
              this.removeValue(el, valueId);
              this.removeValue(otherElement, valueId);
              if (otherElement.valueIds.length > 0) {
                this.appendQueue(otherElement, current);
              }
            };
            DeadEndFinder2.prototype.removeValue = function(el, valueId) {
              var pos = el.valueIds.indexOf(valueId);
              if (pos >= 0) {
                el.valueIds.splice(pos, 1);
              }
            };
            DeadEndFinder2.prototype.appendQueue = function(el, current) {
              var otherOrdinal = this.ordinals[el.pointId];
              if (otherOrdinal < current) {
                this.list[otherOrdinal] = null;
                this.list.push(el);
                this.ordinals[el.pointId] = this.list.length;
              }
            };
            DeadEndFinder2.prototype.getOtherPointId = function(endPoints, pointId) {
              for (var i = 0; i < endPoints.length; i++) {
                var id = this.pointMap.getIdOfPoint(endPoints[i]);
                if (pointId !== id) {
                  return id;
                }
              }
            };
            return DeadEndFinder2;
          })()
        );
        function removeDeadEnds(modelContext, pointMatchingDistance, keep, trackDeleted) {
          var options = {
            pointMatchingDistance: pointMatchingDistance || 5e-3,
            keep
          };
          var deadEndFinder = new DeadEndFinder(modelContext, options);
          var removed = deadEndFinder.findDeadEnds();
          if (removed.length < deadEndFinder.pointMap.values.length) {
            removed.forEach(function(wp) {
              trackDeleted(wp, "dead end");
              delete wp.modelContext.paths[wp.pathId];
            });
          }
          return modelContext;
        }
        model2.removeDeadEnds = removeDeadEnds;
      })(model = MakerJs2.model || (MakerJs2.model = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var exporter;
      (function(exporter2) {
        var XmlTag = (
          /** @class */
          (function() {
            function XmlTag2(name2, attrs) {
              this.name = name2;
              this.attrs = attrs;
              this.innerText = "";
            }
            XmlTag2.escapeString = function(value2) {
              var escape = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;"
              };
              for (var code in escape) {
                value2 = value2.split(code).join(escape[code]);
              }
              return value2;
            };
            XmlTag2.prototype.getOpeningTag = function(selfClose) {
              var attrs = "";
              function outputAttr(attrName, attrValue) {
                if (attrValue == null || typeof attrValue === "undefined")
                  return;
                if (Array.isArray(attrValue) || typeof attrValue === "object") {
                  attrValue = JSON.stringify(attrValue);
                }
                if (typeof attrValue === "string") {
                  attrValue = XmlTag2.escapeString(attrValue);
                }
                attrs += " " + attrName + '="' + attrValue + '"';
              }
              for (var name2 in this.attrs) {
                outputAttr(name2, this.attrs[name2]);
              }
              return "<" + this.name + attrs + (selfClose ? "/" : "") + ">";
            };
            XmlTag2.prototype.getInnerText = function() {
              if (this.innerTextEscaped) {
                return this.innerText;
              } else {
                return XmlTag2.escapeString(this.innerText);
              }
            };
            XmlTag2.prototype.getClosingTag = function() {
              return "</" + this.name + ">";
            };
            XmlTag2.prototype.toString = function() {
              var selfClose = !this.innerText;
              if (selfClose && !this.closingTags) {
                return this.getOpeningTag(true);
              } else {
                return this.getOpeningTag(false) + this.getInnerText() + this.getClosingTag();
              }
            };
            return XmlTag2;
          })()
        );
        exporter2.XmlTag = XmlTag;
      })(exporter = MakerJs2.exporter || (MakerJs2.exporter = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var exporter;
      (function(exporter2) {
        function wrap(prefix, content, condition) {
          if (condition) {
            return prefix + "(" + content + ")";
          } else {
            return content;
          }
        }
        function facetSizeToResolution(arcOrCircle, facetSize) {
          if (!facetSize)
            return;
          var circle = new MakerJs2.paths.Circle([0, 0], arcOrCircle.radius);
          var length = MakerJs2.measure.pathLength(circle);
          if (!length)
            return;
          return Math.ceil(length / facetSize);
        }
        function chainToJscadScript(chainContext, facetSize, accuracy) {
          var head = "";
          var tail = "";
          var first = true;
          var exit = false;
          var reverseTail = false;
          var beginMap = {};
          beginMap[MakerJs2.pathType.Circle] = function(circle, link2) {
            var circleOptions = {
              center: MakerJs2.point.rounded(MakerJs2.point.add(circle.origin, link2.walkedPath.offset), accuracy),
              radius: MakerJs2.round(circle.radius, accuracy),
              resolution: facetSizeToResolution(circle, facetSize)
            };
            head = wrap("CAG.circle", JSON.stringify(circleOptions), true);
            exit = true;
          };
          beginMap[MakerJs2.pathType.Line] = function(line, link2) {
            var points = link2.endPoints.map(function(p) {
              return MakerJs2.point.rounded(p, accuracy);
            });
            if (link2.reversed) {
              points.reverse();
            }
            head = wrap("new CSG.Path2D", JSON.stringify(points), true);
          };
          beginMap[MakerJs2.pathType.Arc] = function(arc, link2) {
            var endAngle = MakerJs2.angle.ofArcEnd(arc);
            if (link2.reversed) {
              reverseTail = true;
            }
            var arcOptions = {
              center: MakerJs2.point.rounded(MakerJs2.point.add(arc.origin, link2.walkedPath.offset), accuracy),
              radius: MakerJs2.round(arc.radius, accuracy),
              startangle: MakerJs2.round(arc.startAngle, accuracy),
              endangle: MakerJs2.round(endAngle, accuracy),
              resolution: facetSizeToResolution(arc, facetSize)
            };
            head = wrap("new CSG.Path2D.arc", JSON.stringify(arcOptions), true);
          };
          var appendMap = {};
          appendMap[MakerJs2.pathType.Line] = function(line, link2) {
            var reverse = reverseTail != link2.reversed;
            var endPoint = MakerJs2.point.rounded(link2.endPoints[reverse ? 0 : 1], accuracy);
            append(wrap(".appendPoint", JSON.stringify(endPoint), true));
          };
          appendMap[MakerJs2.pathType.Arc] = function(arc, link2) {
            var reverse = reverseTail != link2.reversed;
            var endAngle = MakerJs2.angle.ofArcEnd(arc);
            var arcOptions = {
              radius: MakerJs2.round(arc.radius, accuracy),
              clockwise: reverse,
              large: Math.abs(endAngle - arc.startAngle) > 180,
              resolution: facetSizeToResolution(arc, facetSize)
            };
            var endPoint = MakerJs2.point.rounded(link2.endPoints[reverse ? 0 : 1], accuracy);
            append(wrap(".appendArc", JSON.stringify(endPoint) + "," + JSON.stringify(arcOptions), true));
          };
          function append(s) {
            if (reverseTail) {
              tail = s + tail;
            } else {
              tail += s;
            }
          }
          for (var i = 0; i < chainContext.links.length; i++) {
            var link = chainContext.links[i];
            var pathContext = link.walkedPath.pathContext;
            var fn = first ? beginMap[pathContext.type] : appendMap[pathContext.type];
            if (fn) {
              fn(pathContext, link);
            }
            if (exit) {
              return head;
            }
            first = false;
          }
          return head + tail + ".close().innerToCAG()";
        }
        function makePhasedCallback(originalCb, phaseStart, phaseSpan) {
          return function statusCallback(status) {
            originalCb && originalCb({ progress: phaseStart + status.progress * phaseSpan / 100 });
          };
        }
        function toJscadCAG(jscadCAG, modelToExport, jsCadCagOptions) {
          function chainToJscadCag(c, maxArcFacet) {
            var keyPoints = MakerJs2.chain.toKeyPoints(c, maxArcFacet);
            keyPoints.push(keyPoints[0]);
            return jscadCAG.fromPoints(keyPoints);
          }
          function jscadCagUnion(augend, addend) {
            return augend.union(addend);
          }
          function jscadCagSubtraction(minuend, subtrahend) {
            return minuend.subtract(subtrahend);
          }
          return convertChainsTo2D(chainToJscadCag, jscadCagUnion, jscadCagSubtraction, modelToExport, jsCadCagOptions);
        }
        exporter2.toJscadCAG = toJscadCAG;
        function convertChainsTo2D(convertToT, union, subtraction, modelToExport, jsCadCagOptions) {
          if (jsCadCagOptions === void 0) {
            jsCadCagOptions = {};
          }
          var adds = {};
          var status = { total: 0, complete: 0 };
          function unionize(phaseStart, phaseSpan, arr) {
            var result = arr.shift();
            arr.forEach(function(el) {
              return result = union(result, el);
            });
            status.complete++;
            jsCadCagOptions.statusCallback && jsCadCagOptions.statusCallback({ progress: phaseStart + phaseSpan * status.complete / status.total });
            return result;
          }
          function subtractChains(layerId2, cs) {
            var subtracts = [];
            cs.forEach(function(c) {
              if (!c.endless)
                return;
              if (c.contains) {
                addChains(layerId2, c.contains);
              }
              status.total++;
              subtracts.unshift(convertToT(c, jsCadCagOptions.maxArcFacet));
            });
            return subtracts;
          }
          function addChains(layerId2, cs) {
            cs.forEach(function(c) {
              if (!c.endless)
                return;
              var add = { cag: convertToT(c, jsCadCagOptions.maxArcFacet), subtracts: [] };
              if (c.contains) {
                var subtracts = subtractChains(layerId2, c.contains);
                if (subtracts.length > 0) {
                  add.subtracts.push(subtracts);
                }
              }
              status.total++;
              if (!(layerId2 in adds)) {
                adds[layerId2] = [];
              }
              adds[layerId2].unshift(add);
            });
          }
          var options = {
            pointMatchingDistance: jsCadCagOptions.pointMatchingDistance,
            byLayers: jsCadCagOptions.byLayers,
            contain: true
          };
          jsCadCagOptions.statusCallback && jsCadCagOptions.statusCallback({ progress: 25 });
          var chainsResult = MakerJs2.model.findChains(modelToExport, options);
          if (Array.isArray(chainsResult)) {
            addChains("", chainsResult);
          } else {
            for (var layerId in chainsResult) {
              addChains(layerId, chainsResult[layerId]);
            }
          }
          jsCadCagOptions.statusCallback && jsCadCagOptions.statusCallback({ progress: 50 });
          var closedCount = 0;
          for (var layerId in adds) {
            closedCount += adds[layerId].length;
          }
          if (closedCount === 0) {
            jsCadCagOptions.statusCallback && jsCadCagOptions.statusCallback({ progress: 100 });
            throw "No closed geometries found.";
          }
          var resultMap = {};
          for (var layerId in adds) {
            var flatAdds = adds[layerId].map(function(add) {
              var result = add.cag;
              add.subtracts.forEach(function(subtract) {
                var union2 = unionize(50, 50, subtract);
                result = subtraction(result, union2);
              });
              return result;
            });
            resultMap[layerId] = unionize(50, 50, flatAdds);
          }
          jsCadCagOptions.statusCallback && jsCadCagOptions.statusCallback({ progress: 100 });
          return options.byLayers ? resultMap : resultMap[""];
        }
        function toJscadCSG(jscadCAG, modelToExport, options) {
          function to2D(opts) {
            return toJscadCAG(jscadCAG, modelToExport, opts);
          }
          function to3D(cag, extrude, z) {
            var csg = cag.extrude({ offset: [0, 0, extrude] });
            if (z) {
              csg = csg.translate([0, 0, z]);
            }
            return csg;
          }
          function union3D(augend, addend) {
            return augend.union(addend);
          }
          return convert2Dto3D(to2D, to3D, union3D, modelToExport, options);
        }
        exporter2.toJscadCSG = toJscadCSG;
        function convert2Dto3D(to2D, to3D, union3D, modelToExport, options) {
          if (options === void 0) {
            options = {};
          }
          var originalCb = options.statusCallback;
          function getDefinedNumber(a, b) {
            if (MakerJs2.isNumber(a))
              return a;
            return b;
          }
          if (modelToExport.exporterOptions) {
            MakerJs2.extendObject(options, modelToExport.exporterOptions["toJscadCSG"]);
          }
          options.byLayers = options.byLayers || options.layerOptions && true;
          options.statusCallback = makePhasedCallback(originalCb, 0, 50);
          var result2D = to2D(options);
          var csgs = [];
          if (options.byLayers) {
            for (var layerId in result2D) {
              var layerOptions = options.layerOptions[layerId];
              var csg = to3D(result2D[layerId], layerOptions.extrude || options.extrude, getDefinedNumber(layerOptions.z, options.z));
              csgs.push(csg);
            }
          } else {
            var csg = to3D(result2D, options.extrude, options.z);
            csgs.push(csg);
          }
          options.statusCallback = makePhasedCallback(originalCb, 50, 100);
          var status = { total: csgs.length - 1, complete: 0 };
          var result = csgs.shift();
          csgs.forEach(function(el, i) {
            result = union3D(result, el);
            status.complete++;
            options.statusCallback({ progress: status.complete / status.total });
          });
          return result;
        }
        function toJscadScript(modelToExport, options) {
          if (options === void 0) {
            options = {};
          }
          function _chainToJscadScript(c, maxArcFacet) {
            return wrap2(chainToJscadScript(c, maxArcFacet, options.accuracy));
          }
          function scriptUnion(augend, addend) {
            return augend + ".union(".concat(addend, ")");
          }
          function scriptSubtraction(minuend, subtrahend) {
            return minuend + ".subtract(".concat(subtrahend, ")");
          }
          function to2D(opts) {
            return convertChainsTo2D(_chainToJscadScript, scriptUnion, scriptSubtraction, modelToExport, options);
          }
          function to3D(cag, extrude, z) {
            var csg = cag + ".extrude({ offset: [0, 0, ".concat(extrude, "] })");
            if (z) {
              csg = csg + ".translate([0, 0, ".concat(z, "])");
            }
            return csg;
          }
          function wrap2(s) {
            return "".concat(nl).concat(indent).concat(s).concat(nl);
          }
          var indent = new Array((options.indent || 0) + 1).join(" ");
          var nl = options.indent ? "\n" : "";
          var result = convert2Dto3D(to2D, to3D, scriptUnion, modelToExport, options).trim();
          return "function ".concat(options.functionName || "main", "(){").concat(wrap2("return ".concat(result, ";")), "}").concat(nl);
        }
        exporter2.toJscadScript = toJscadScript;
        function toJscadSTL(CAG, stlSerializer, modelToExport, options) {
          var originalCb = options.statusCallback;
          options.statusCallback = makePhasedCallback(originalCb, 0, 50);
          var csg = toJscadCSG(CAG, modelToExport, options);
          return stlSerializer.serialize(csg, { binary: false, statusCallback: makePhasedCallback(originalCb, 50, 50) });
        }
        exporter2.toJscadSTL = toJscadSTL;
      })(exporter = MakerJs2.exporter || (MakerJs2.exporter = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var exporter;
      (function(exporter2) {
        function toPDF(doc, modelToExport, options) {
          if (!modelToExport)
            return;
          var opts = {
            fontName: "Courier",
            fontSize: 9,
            origin: [0, 0],
            stroke: "#000"
          };
          MakerJs2.extendObject(opts, options);
          var scale = 1;
          var exportUnits = opts.units || modelToExport.units;
          if (exportUnits) {
            scale = MakerJs2.units.conversionScale(exportUnits, MakerJs2.unitType.Inch);
          } else {
            scale = 1 / 100;
          }
          scale *= 72;
          var scaledModel = MakerJs2.model.scale(MakerJs2.cloneObject(modelToExport), scale);
          var size = MakerJs2.measure.modelExtents(scaledModel);
          var left = -size.low[0];
          var offset = [left, size.high[1]];
          offset = MakerJs2.point.add(offset, opts.origin);
          MakerJs2.model.findChains(scaledModel, function(chains, loose, layer) {
            function single(walkedPath) {
              var pathData = exporter2.pathToSVGPathData(walkedPath.pathContext, walkedPath.offset, offset);
              doc.path(pathData).stroke(opts.stroke);
            }
            chains.map(function(chain) {
              if (chain.links.length > 1) {
                var pathData = exporter2.chainToSVGPathData(chain, offset);
                doc.path(pathData).stroke(opts.stroke);
              } else {
                var walkedPath = chain.links[0].walkedPath;
                if (walkedPath.pathContext.type === MakerJs2.pathType.Circle) {
                  var fixedPath;
                  MakerJs2.path.moveTemporary([walkedPath.pathContext], [walkedPath.offset], function() {
                    fixedPath = MakerJs2.path.mirror(walkedPath.pathContext, false, true);
                  });
                  MakerJs2.path.moveRelative(fixedPath, offset);
                  doc.circle(fixedPath.origin[0], fixedPath.origin[1], walkedPath.pathContext.radius).stroke(opts.stroke);
                } else {
                  single(walkedPath);
                }
              }
            });
            loose.map(single);
          }, { byLayers: false });
          doc.font(opts.fontName).fontSize(opts.fontSize);
          MakerJs2.model.getAllCaptionsOffset(scaledModel).forEach(function(caption) {
            var a = MakerJs2.angle.ofLineInDegrees(caption.anchor);
            var anchor = MakerJs2.path.mirror(caption.anchor, false, true);
            MakerJs2.path.moveRelative(anchor, offset);
            var text = caption.text;
            var textCenter = [doc.widthOfString(text) / 2, doc.heightOfString(text) / 2];
            var center = MakerJs2.point.middle(anchor);
            var textOffset = MakerJs2.point.subtract(center, textCenter);
            doc.rotate(-a, { origin: center });
            doc.text(text, textOffset[0], textOffset[1]);
            doc.rotate(a, { origin: center });
          });
        }
        exporter2.toPDF = toPDF;
      })(exporter = MakerJs2.exporter || (MakerJs2.exporter = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var exporter;
      (function(exporter2) {
        var chainLinkToPathDataMap = {};
        chainLinkToPathDataMap[MakerJs2.pathType.Arc] = function(arc, endPoint, reversed, d, accuracy) {
          d.push("A");
          svgArcData(d, arc.radius, endPoint, accuracy, MakerJs2.angle.ofArcSpan(arc) > 180, reversed ? arc.startAngle > arc.endAngle : arc.startAngle < arc.endAngle);
        };
        chainLinkToPathDataMap[MakerJs2.pathType.Line] = function(line, endPoint, reversed, d, accuracy) {
          d.push("L", MakerJs2.round(endPoint[0], accuracy), MakerJs2.round(endPoint[1], accuracy));
        };
        chainLinkToPathDataMap[MakerJs2.pathType.BezierSeed] = function(seed, endPoint, reversed, d, accuracy) {
          svgBezierData(d, seed, accuracy, reversed);
        };
        function svgCoords(p) {
          return MakerJs2.point.mirror(p, false, true);
        }
        function correctArc(arc) {
          var arcSpan = MakerJs2.angle.ofArcSpan(arc);
          arc.startAngle = MakerJs2.angle.noRevolutions(arc.startAngle);
          arc.endAngle = arc.startAngle + arcSpan;
        }
        function chainToSVGPathData(chain, offset, accuracy) {
          function offsetPoint(p) {
            return MakerJs2.point.add(p, offset);
          }
          var first = chain.links[0];
          var firstPoint = offsetPoint(svgCoords(first.endPoints[first.reversed ? 1 : 0]));
          var d = ["M", MakerJs2.round(firstPoint[0], accuracy), MakerJs2.round(firstPoint[1], accuracy)];
          for (var i = 0; i < chain.links.length; i++) {
            var link = chain.links[i];
            var pathContext = link.walkedPath.pathContext;
            var fn = chainLinkToPathDataMap[pathContext.type];
            if (fn) {
              var fixedPath;
              MakerJs2.path.moveTemporary([pathContext], [link.walkedPath.offset], function() {
                fixedPath = MakerJs2.path.mirror(pathContext, false, true);
              });
              MakerJs2.path.moveRelative(fixedPath, offset);
              fn(fixedPath, offsetPoint(svgCoords(link.endPoints[link.reversed ? 0 : 1])), link.reversed, d, accuracy);
            }
          }
          if (chain.endless) {
            d.push("Z");
          }
          return d.join(" ");
        }
        exporter2.chainToSVGPathData = chainToSVGPathData;
        function startSvgPathData(start, d, accuracy) {
          return ["M", MakerJs2.round(start[0], accuracy), MakerJs2.round(start[1], accuracy)].concat(d);
        }
        var svgPathDataMap = {};
        svgPathDataMap[MakerJs2.pathType.Line] = function(line, accuracy) {
          return startSvgPathData(line.origin, MakerJs2.point.rounded(line.end, accuracy), accuracy);
        };
        svgPathDataMap[MakerJs2.pathType.Circle] = function(circle, accuracy, clockwiseCircle) {
          return startSvgPathData(circle.origin, svgCircleData(circle.radius, accuracy, clockwiseCircle), accuracy);
        };
        svgPathDataMap[MakerJs2.pathType.Arc] = function(arc, accuracy) {
          correctArc(arc);
          var arcPoints = MakerJs2.point.fromArc(arc);
          if (MakerJs2.measure.isPointEqual(arcPoints[0], arcPoints[1])) {
            return svgPathDataMap[MakerJs2.pathType.Circle](arc, accuracy);
          } else {
            var d = ["A"];
            svgArcData(d, arc.radius, arcPoints[1], accuracy, MakerJs2.angle.ofArcSpan(arc) > 180, arc.startAngle > arc.endAngle);
            return startSvgPathData(arcPoints[0], d, accuracy);
          }
        };
        svgPathDataMap[MakerJs2.pathType.BezierSeed] = function(seed, accuracy) {
          var d = [];
          svgBezierData(d, seed, accuracy);
          return startSvgPathData(seed.origin, d, accuracy);
        };
        function pathToSVGPathData(pathToExport, pathOffset, exportOffset, accuracy, clockwiseCircle) {
          var fn = svgPathDataMap[pathToExport.type];
          if (fn) {
            var fixedPath;
            MakerJs2.path.moveTemporary([pathToExport], [pathOffset], function() {
              fixedPath = MakerJs2.path.mirror(pathToExport, false, true);
            });
            MakerJs2.path.moveRelative(fixedPath, exportOffset);
            var d = fn(fixedPath, accuracy, clockwiseCircle);
            return d.join(" ");
          }
          return "";
        }
        exporter2.pathToSVGPathData = pathToSVGPathData;
        function getPathDataByLayer(modelToExport, offset, options, accuracy) {
          var pathDataByLayer = {};
          options.unifyBeziers = true;
          MakerJs2.model.findChains(modelToExport, function(chains, loose, layer) {
            function single(walkedPath, clockwise) {
              var pathData = pathToSVGPathData(walkedPath.pathContext, walkedPath.offset, offset, accuracy, clockwise);
              pathDataByLayer[layer].push(pathData);
            }
            pathDataByLayer[layer] = [];
            function doChains(cs, clockwise) {
              cs.forEach(function(chain) {
                if (chain.links.length > 1) {
                  var pathData = chainToSVGPathData(chain, offset, accuracy);
                  pathDataByLayer[layer].push(pathData);
                } else {
                  single(chain.links[0].walkedPath, clockwise);
                }
                if (chain.contains) {
                  doChains(chain.contains, !clockwise);
                }
              });
            }
            doChains(chains, true);
            loose.forEach(function(wp) {
              return single(wp);
            });
          }, options);
          return pathDataByLayer;
        }
        function toSVGPathData(modelToExport) {
          var args = [];
          for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
          }
          var options = {
            fillRule: "evenodd"
          };
          if (typeof args[0] === "boolean") {
            options.byLayers = args[0];
            options.origin = args[1];
            options.accuracy = args[2];
          } else if (MakerJs2.isObject(args[0])) {
            MakerJs2.extendObject(options, args[0]);
          }
          var findChainsOptions = {
            byLayers: options.byLayers,
            contain: false
          };
          if (options.fillRule === "nonzero") {
            findChainsOptions.contain = {
              alternateDirection: true
            };
          }
          var size = MakerJs2.measure.modelExtents(modelToExport);
          if (!options.origin) {
            options.origin = [-size.low[0], size.high[1]];
          }
          var pathDataArrayByLayer = getPathDataByLayer(modelToExport, options.origin, findChainsOptions, options.accuracy);
          var pathDataStringByLayer = {};
          for (var layer in pathDataArrayByLayer) {
            pathDataStringByLayer[layer] = pathDataArrayByLayer[layer].join(" ");
          }
          return findChainsOptions.byLayers ? pathDataStringByLayer : pathDataStringByLayer[""];
        }
        exporter2.toSVGPathData = toSVGPathData;
        function toSVG(itemToExport, options) {
          function append(value2, layer, forcePush) {
            if (forcePush === void 0) {
              forcePush = false;
            }
            if (!forcePush && typeof layer == "string" && layer.length > 0) {
              if (!(layer in layers)) {
                layers[layer] = [];
              }
              layers[layer].push(value2);
            } else {
              elements.push(value2);
            }
          }
          function cssStyle(elOpts) {
            var a = [];
            function push(name2, val) {
              if (val === void 0)
                return;
              a.push(name2 + ":" + val);
            }
            push("stroke", elOpts.stroke);
            push("stroke-width", elOpts.strokeWidth);
            push("fill", elOpts.fill);
            return a.join(";");
          }
          function addSvgAttrs(attrs2, elOpts) {
            if (!elOpts)
              return;
            MakerJs2.extendObject(attrs2, {
              "stroke": elOpts.stroke,
              "stroke-width": elOpts.strokeWidth,
              "fill": elOpts.fill,
              "style": elOpts.cssStyle || cssStyle(elOpts),
              "class": elOpts.className
            });
          }
          function colorLayerOptions(layer) {
            if (opts.layerOptions && opts.layerOptions[layer])
              return opts.layerOptions[layer];
            if (layer in exporter2.colors) {
              return {
                stroke: layer
              };
            }
          }
          function createElement(tagname, attrs2, layer, innerText, forcePush) {
            if (innerText === void 0) {
              innerText = null;
            }
            if (forcePush === void 0) {
              forcePush = false;
            }
            if (tagname !== "text") {
              addSvgAttrs(attrs2, colorLayerOptions(layer));
            }
            if (!opts.scalingStroke) {
              attrs2["vector-effect"] = "non-scaling-stroke";
            }
            var tag = new exporter2.XmlTag(tagname, attrs2);
            tag.closingTags = opts.closingTags;
            if (innerText) {
              tag.innerText = innerText;
            }
            append(tag.toString(), layer, forcePush);
          }
          function fixPoint(pointToFix) {
            var pointMirroredY = svgCoords(pointToFix);
            return MakerJs2.point.scale(pointMirroredY, opts.scale);
          }
          function fixPath(pathToFix, origin) {
            var mirrorY = MakerJs2.path.mirror(pathToFix, false, true);
            return MakerJs2.path.moveRelative(MakerJs2.path.scale(mirrorY, opts.scale), origin);
          }
          var opts = {
            accuracy: 1e-3,
            annotate: false,
            origin: null,
            scale: 1,
            stroke: "#000",
            strokeLineCap: "round",
            strokeWidth: "0.25mm",
            fill: "none",
            fillRule: "evenodd",
            fontSize: "9pt",
            useSvgPathOnly: true,
            viewBox: true
          };
          MakerJs2.extendObject(opts, options);
          var modelToExport;
          var itemToExportIsModel = MakerJs2.isModel(itemToExport);
          if (itemToExportIsModel) {
            modelToExport = itemToExport;
            if (modelToExport.exporterOptions) {
              MakerJs2.extendObject(opts, modelToExport.exporterOptions["toSVG"]);
            }
          }
          var elements = [];
          var layers = {};
          if (itemToExportIsModel) {
            modelToExport = itemToExport;
          } else if (Array.isArray(itemToExport)) {
            var pathMap = {};
            itemToExport.forEach(function(p, i2) {
              pathMap[i2] = p;
            });
            modelToExport = { paths: pathMap };
          } else if (MakerJs2.isPath(itemToExport)) {
            modelToExport = { paths: { modelToMeasure: itemToExport } };
          }
          var size = MakerJs2.measure.modelExtents(modelToExport);
          var captions = MakerJs2.model.getAllCaptionsOffset(modelToExport);
          captions.forEach(function(caption) {
            MakerJs2.measure.increase(size, MakerJs2.measure.pathExtents(caption.anchor), true);
          });
          if (!opts.units) {
            var unitSystem = exporter2.tryGetModelUnits(itemToExport);
            if (unitSystem) {
              opts.units = unitSystem;
            }
          }
          var useSvgUnit = exporter2.svgUnit[opts.units];
          if (useSvgUnit && opts.viewBox) {
            opts.scale *= useSvgUnit.scaleConversion;
          }
          if (size && !opts.origin) {
            var left = -size.low[0] * opts.scale;
            opts.origin = [left, size.high[1] * opts.scale];
          }
          MakerJs2.extendObject(options, opts);
          var svgAttrs = {};
          if (size && opts.viewBox) {
            var width = MakerJs2.round(size.width * opts.scale, opts.accuracy);
            var height = MakerJs2.round(size.height * opts.scale, opts.accuracy);
            var viewBox = [0, 0, width, height];
            var unit = useSvgUnit ? useSvgUnit.svgUnitType : "";
            svgAttrs = {
              width: width + unit,
              height: height + unit,
              viewBox: viewBox.join(" ")
            };
          }
          svgAttrs["xmlns"] = "http://www.w3.org/2000/svg";
          var svgTag = new exporter2.XmlTag("svg", MakerJs2.extendObject(svgAttrs, opts.svgAttrs));
          append(svgTag.getOpeningTag(false));
          var groupAttrs = {
            id: "svgGroup",
            "stroke-linecap": opts.strokeLineCap,
            "fill-rule": opts.fillRule,
            "font-size": opts.fontSize
          };
          addSvgAttrs(groupAttrs, opts);
          var svgGroup = new exporter2.XmlTag("g", groupAttrs);
          append(svgGroup.getOpeningTag(false));
          if (opts.useSvgPathOnly) {
            var findChainsOptions = {
              byLayers: true
            };
            if (opts.fillRule === "nonzero") {
              findChainsOptions.contain = {
                alternateDirection: true
              };
            }
            var pathDataByLayer = getPathDataByLayer(modelToExport, opts.origin, findChainsOptions, opts.accuracy);
            for (var layerId1 in pathDataByLayer) {
              var pathData = pathDataByLayer[layerId1].join(" ");
              var attrs = { "d": pathData };
              if (layerId1.length > 0) {
                attrs["id"] = layerId1;
              }
              createElement("path", attrs, layerId1, null, true);
            }
          } else {
            let drawText2 = function(id, textPoint, layer) {
              createElement("text", {
                "id": id + "_text",
                "x": MakerJs2.round(textPoint[0], opts.accuracy),
                "y": MakerJs2.round(textPoint[1], opts.accuracy)
              }, layer, id);
            }, drawPath2 = function(id, x, y, d, layer, route, textPoint, annotate, flow) {
              createElement("path", {
                "id": id,
                "data-route": route,
                "d": ["M", MakerJs2.round(x, opts.accuracy), MakerJs2.round(y, opts.accuracy)].concat(d).join(" ")
              }, layer);
              if (annotate) {
                drawText2(id, textPoint, layer);
              }
            }, circleInPaths2 = function(id, center, radius, layer, route, annotate, flow) {
              var d = svgCircleData(radius, opts.accuracy);
              drawPath2(id, center[0], center[1], d, layer, route, center, annotate, flow);
            }, addFlowMarks2 = function(flow, layer, origin, end, endAngle) {
              var className = "flow";
              map[MakerJs2.pathType.Circle]("", new MakerJs2.paths.Circle(origin, flow.size / 2), layer, className, null, false, null);
              var arrowEnd = [-1 * flow.size, flow.size / 2];
              var arrowLines = [arrowEnd, MakerJs2.point.mirror(arrowEnd, false, true)].map(function(p) {
                return new MakerJs2.paths.Line(MakerJs2.point.add(MakerJs2.point.rotate(p, endAngle), end), end);
              });
              arrowLines.forEach(function(a) {
                return map[MakerJs2.pathType.Line]("", a, layer, className, null, false, null);
              });
            }, beginModel2 = function(id, modelContext) {
              modelGroup.attrs = { id };
              append(modelGroup.getOpeningTag(false), modelContext.layer);
            }, endModel2 = function(modelContext) {
              append(modelGroup.getClosingTag(), modelContext.layer);
            };
            var drawText = drawText2, drawPath = drawPath2, circleInPaths = circleInPaths2, addFlowMarks = addFlowMarks2, beginModel = beginModel2, endModel = endModel2;
            var map = {};
            map[MakerJs2.pathType.Line] = function(id, line, layer, className, route, annotate, flow) {
              var start = line.origin;
              var end = line.end;
              createElement("line", {
                "id": id,
                "class": className,
                "data-route": route,
                "x1": MakerJs2.round(start[0], opts.accuracy),
                "y1": MakerJs2.round(start[1], opts.accuracy),
                "x2": MakerJs2.round(end[0], opts.accuracy),
                "y2": MakerJs2.round(end[1], opts.accuracy)
              }, layer);
              if (annotate) {
                drawText2(id, MakerJs2.point.middle(line), layer);
              }
              if (flow) {
                addFlowMarks2(flow, layer, line.origin, line.end, MakerJs2.angle.ofLineInDegrees(line));
              }
            };
            map[MakerJs2.pathType.Circle] = function(id, circle, layer, className, route, annotate, flow) {
              var center = circle.origin;
              createElement("circle", {
                "id": id,
                "class": className,
                "data-route": route,
                "r": circle.radius,
                "cx": MakerJs2.round(center[0], opts.accuracy),
                "cy": MakerJs2.round(center[1], opts.accuracy)
              }, layer);
              if (annotate) {
                drawText2(id, center, layer);
              }
            };
            map[MakerJs2.pathType.Arc] = function(id, arc, layer, className, route, annotate, flow) {
              correctArc(arc);
              var arcPoints = MakerJs2.point.fromArc(arc);
              if (MakerJs2.measure.isPointEqual(arcPoints[0], arcPoints[1])) {
                circleInPaths2(id, arc.origin, arc.radius, layer, route, annotate, flow);
              } else {
                var d = ["A"];
                svgArcData(d, arc.radius, arcPoints[1], opts.accuracy, MakerJs2.angle.ofArcSpan(arc) > 180, arc.startAngle > arc.endAngle);
                drawPath2(id, arcPoints[0][0], arcPoints[0][1], d, layer, route, MakerJs2.point.middle(arc), annotate, flow);
                if (flow) {
                  addFlowMarks2(flow, layer, arcPoints[1], arcPoints[0], MakerJs2.angle.noRevolutions(arc.startAngle - 90));
                }
              }
            };
            map[MakerJs2.pathType.BezierSeed] = function(id, seed, layer, className, route, annotate, flow) {
              var d = [];
              svgBezierData(d, seed, opts.accuracy);
              drawPath2(id, seed.origin[0], seed.origin[1], d, layer, route, MakerJs2.point.middle(seed), annotate, flow);
            };
            var modelGroup = new exporter2.XmlTag("g");
            var walkOptions = {
              beforeChildWalk: function(walkedModel) {
                beginModel2(walkedModel.childId, walkedModel.childModel);
                return true;
              },
              onPath: function(walkedPath) {
                var fn = map[walkedPath.pathContext.type];
                if (fn) {
                  var offset = MakerJs2.point.add(fixPoint(walkedPath.offset), opts.origin);
                  fn(walkedPath.pathId, fixPath(walkedPath.pathContext, offset), walkedPath.layer, null, walkedPath.route, opts.annotate, opts.flow);
                }
              },
              afterChildWalk: function(walkedModel) {
                endModel2(walkedModel.childModel);
              }
            };
            beginModel2("0", modelToExport);
            MakerJs2.model.walk(modelToExport, walkOptions);
            for (var layerId2 in layers) {
              var layerGroup = new exporter2.XmlTag("g", { id: layerId2 });
              addSvgAttrs(layerGroup.attrs, colorLayerOptions(layerId2));
              for (var i = 0; i < layers[layerId2].length; i++) {
                layerGroup.innerText += layers[layerId2][i];
              }
              layerGroup.innerTextEscaped = true;
              append(layerGroup.toString());
            }
            endModel2(modelToExport);
          }
          var captionTags = captions.map(function(caption) {
            var anchor = fixPath(caption.anchor, opts.origin);
            var center = MakerJs2.point.rounded(MakerJs2.point.middle(anchor), opts.accuracy);
            var tag = new exporter2.XmlTag("text", {
              "alignment-baseline": "middle",
              "text-anchor": "middle",
              "transform": "rotate(".concat(MakerJs2.angle.ofLineInDegrees(anchor), ",").concat(center[0], ",").concat(center[1], ")"),
              "x": center[0],
              "y": center[1]
            });
            addSvgAttrs(tag.attrs, colorLayerOptions(caption.layer));
            tag.innerText = caption.text;
            return tag.toString();
          });
          if (captionTags.length) {
            var captionGroup = new exporter2.XmlTag("g", { "id": "captions" });
            addSvgAttrs(captionGroup.attrs, colorLayerOptions(captionGroup.attrs.id));
            captionGroup.innerText = captionTags.join("");
            captionGroup.innerTextEscaped = true;
            append(captionGroup.toString());
          }
          append(svgGroup.getClosingTag());
          append(svgTag.getClosingTag());
          return elements.join("");
        }
        exporter2.toSVG = toSVG;
        function svgCircleData(radius, accuracy, clockwiseCircle) {
          var r = MakerJs2.round(radius, accuracy);
          var d = ["m", -r, 0];
          function halfCircle(sign) {
            d.push("a");
            svgArcData(d, r, [2 * r * sign, 0], accuracy, false, !clockwiseCircle);
          }
          halfCircle(1);
          halfCircle(-1);
          d.push("z");
          return d;
        }
        function svgBezierData(d, seed, accuracy, reversed) {
          if (seed.controls.length === 1) {
            d.push("Q", MakerJs2.round(seed.controls[0][0], accuracy), MakerJs2.round(seed.controls[0][1], accuracy));
          } else {
            var controls = reversed ? [seed.controls[1], seed.controls[0]] : seed.controls;
            d.push("C", MakerJs2.round(controls[0][0], accuracy), MakerJs2.round(controls[0][1], accuracy), MakerJs2.round(controls[1][0], accuracy), MakerJs2.round(controls[1][1], accuracy));
          }
          var final = reversed ? seed.origin : seed.end;
          d.push(MakerJs2.round(final[0], accuracy), MakerJs2.round(final[1], accuracy));
        }
        function svgArcData(d, radius, endPoint, accuracy, largeArc, increasing) {
          var r = MakerJs2.round(radius, accuracy);
          var end = endPoint;
          d.push(r, r);
          d.push(0);
          d.push(largeArc ? 1 : 0);
          d.push(increasing ? 0 : 1);
          d.push(MakerJs2.round(end[0], accuracy), MakerJs2.round(end[1], accuracy));
        }
        exporter2.svgUnit = {};
        exporter2.svgUnit[MakerJs2.unitType.Inch] = { svgUnitType: "in", scaleConversion: 1 };
        exporter2.svgUnit[MakerJs2.unitType.Millimeter] = { svgUnitType: "mm", scaleConversion: 1 };
        exporter2.svgUnit[MakerJs2.unitType.Centimeter] = { svgUnitType: "cm", scaleConversion: 1 };
        exporter2.svgUnit[MakerJs2.unitType.Foot] = { svgUnitType: "in", scaleConversion: 12 };
        exporter2.svgUnit[MakerJs2.unitType.Meter] = { svgUnitType: "cm", scaleConversion: 100 };
      })(exporter = MakerJs2.exporter || (MakerJs2.exporter = {}));
    })(MakerJs || (MakerJs = {}));
    (function(MakerJs2) {
      var importer;
      (function(importer2) {
        function fromSVGPathData(pathData, options) {
          if (options === void 0) {
            options = {};
          }
          var result = {};
          function addPath(p) {
            if (!result.paths) {
              result.paths = {};
            }
            result.paths["p_" + ++pathCount] = p;
          }
          function addModel(m) {
            if (!result.models) {
              result.models = {};
            }
            result.models["p_" + ++pathCount] = m;
          }
          function getPoint(cmd, offset, from) {
            if (offset === void 0) {
              offset = 0;
            }
            if (from === void 0) {
              from = cmd.from;
            }
            if (offset < 0) {
              offset = offset + cmd.data.length;
            }
            var p = MakerJs2.point.mirror([cmd.data[0 + offset], cmd.data[1 + offset]], false, true);
            if (cmd.absolute) {
              return p;
            } else {
              return MakerJs2.point.add(p, from);
            }
          }
          function lineTo(cmd, end) {
            if (!MakerJs2.measure.isPointEqual(cmd.from, end)) {
              addPath(new MakerJs2.paths.Line(cmd.from, end));
            }
            return end;
          }
          var map = {};
          map["M"] = function(cmd) {
            firstPoint = getPoint(cmd);
            if (cmd.data.length > 2) {
              cmd.from = firstPoint;
              for (var a = 2; a < cmd.data.length; a = a + 2) {
                cmd.from = lineTo(cmd, getPoint(cmd, a));
              }
              return cmd.from;
            } else
              return firstPoint;
          };
          map["Z"] = function(cmd) {
            return lineTo(cmd, firstPoint);
          };
          map["H"] = function(cmd) {
            var end = MakerJs2.point.clone(cmd.from);
            if (cmd.absolute) {
              end[0] = cmd.data[0];
            } else {
              end[0] += cmd.data[0];
            }
            return lineTo(cmd, end);
          };
          map["V"] = function(cmd) {
            var end = MakerJs2.point.clone(cmd.from);
            if (cmd.absolute) {
              end[1] = -cmd.data[0];
            } else {
              end[1] -= cmd.data[0];
            }
            return lineTo(cmd, end);
          };
          map["L"] = function(cmd) {
            var end;
            for (var a = 0; a < cmd.data.length; a = a + 2) {
              end = getPoint(cmd, a);
              cmd.from = lineTo(cmd, end);
            }
            return cmd.from;
          };
          map["A"] = function(cmd) {
            var rx;
            var ry;
            var rotation;
            var large;
            var decreasing;
            var end;
            var elliptic;
            var xAxis;
            var arc;
            var scaleUp;
            var e;
            for (var a = 0; a < cmd.data.length; a = a + 7) {
              rx = cmd.data[0 + a];
              ry = cmd.data[1 + a];
              rotation = cmd.data[2 + a];
              large = cmd.data[3 + a] === 1;
              decreasing = cmd.data[4 + a] === 1;
              end = getPoint(cmd, 5 + a);
              elliptic = rx !== ry;
              xAxis = new MakerJs2.paths.Line(cmd.from, MakerJs2.point.rotate(end, rotation, cmd.from));
              if (elliptic) {
                xAxis = MakerJs2.path.distort(xAxis, 1, rx / ry);
              }
              arc = new MakerJs2.paths.Arc(xAxis.origin, xAxis.end, rx, large, decreasing);
              if (elliptic) {
                if (rx < arc.radius) {
                  scaleUp = arc.radius / rx;
                  rx *= scaleUp;
                  ry *= scaleUp;
                }
                e = new MakerJs2.models.EllipticArc(arc, 1, ry / rx, options.bezierAccuracy);
                MakerJs2.model.rotate(e, -rotation, cmd.from);
                addModel(e);
              } else {
                MakerJs2.path.rotate(arc, -rotation, cmd.from);
                addPath(arc);
              }
              cmd.from = end;
            }
            return end;
          };
          map["C"] = function(cmd) {
            var control1;
            var control2;
            var start = cmd.from;
            var end;
            for (var a = 0; a < cmd.data.length; a = a + 6) {
              cmd.from = start;
              control1 = getPoint(cmd, 0 + a, start);
              control2 = getPoint(cmd, 2 + a, start);
              end = getPoint(cmd, 4 + a, start);
              addModel(new MakerJs2.models.BezierCurve(start, control1, control2, end, options.bezierAccuracy));
              start = end;
            }
            return end;
          };
          map["S"] = function(cmd) {
            var control1;
            var prevControl2;
            var control2;
            var start = cmd.from;
            var end;
            if (cmd.prev.command === "C" || cmd.prev.command === "S") {
              prevControl2 = getPoint(cmd.prev, -4);
            } else {
              prevControl2 = cmd.from;
            }
            for (var a = 0; a < cmd.data.length; a = a + 4) {
              cmd.from = start;
              control1 = MakerJs2.point.rotate(prevControl2, 180, start);
              control2 = getPoint(cmd, 0 + a);
              end = getPoint(cmd, 2 + a);
              addModel(new MakerJs2.models.BezierCurve(start, control1, control2, end, options.bezierAccuracy));
              start = end;
              prevControl2 = control2;
            }
            return end;
          };
          map["Q"] = function(cmd) {
            var control;
            var start = cmd.from;
            var end;
            for (var a = 0; a < cmd.data.length; a = a + 4) {
              cmd.from = start;
              control = getPoint(cmd, 0 + a);
              end = getPoint(cmd, 2 + a);
              addModel(new MakerJs2.models.BezierCurve(start, control, end, options.bezierAccuracy));
              start = end;
            }
            return end;
          };
          map["T"] = function(cmd) {
            var control;
            var prevControl;
            var end;
            if (cmd.prev.command === "Q") {
              prevControl = getPoint(cmd.prev, -4);
              control = MakerJs2.point.rotate(prevControl, 180, cmd.from);
            } else if (cmd.prev.command === "T") {
              cmd.prev.absolute = true;
              control = getPoint(cmd.prev, -2);
            } else {
              control = cmd.from;
            }
            for (var a = 0; a < cmd.data.length; a = a + 2) {
              end = getPoint(cmd, 0 + a);
              addModel(new MakerJs2.models.BezierCurve(cmd.from, control, end, options.bezierAccuracy));
              cmd.from = end;
              control = MakerJs2.point.rotate(control, 180, cmd.from);
            }
            var p = MakerJs2.point.mirror(control, false, true);
            cmd.data.push.apply(cmd.data, p);
            return end;
          };
          var firstPoint = [0, 0];
          var currPoint = [0, 0];
          var pathCount = 0;
          var prevCommand;
          var regexpCommands = /([achlmqstvz])([0-9e\.,\+-\s]*)/ig;
          var commandMatches;
          while ((commandMatches = regexpCommands.exec(pathData)) !== null) {
            if (commandMatches.index === regexpCommands.lastIndex) {
              regexpCommands.lastIndex++;
            }
            var command = commandMatches[1];
            var dataString = commandMatches[2];
            var currCmd = {
              command: command.toUpperCase(),
              data: [],
              from: currPoint,
              prev: prevCommand
            };
            if (command === currCmd.command) {
              currCmd.absolute = true;
            }
            currCmd.data = importer2.parseNumericList(dataString);
            var fn = map[currCmd.command];
            if (fn) {
              currPoint = fn(currCmd);
            }
            prevCommand = currCmd;
          }
          return result;
        }
        importer2.fromSVGPathData = fromSVGPathData;
      })(importer = MakerJs2.importer || (MakerJs2.importer = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var layout;
      (function(layout2) {
        function getChildPlacement(parentModel, baseline) {
          var atlas = new MakerJs2.measure.Atlas(parentModel);
          var measureParent = MakerJs2.measure.modelExtents(parentModel, atlas);
          var parentTop = measureParent.high[1];
          var cpa = [];
          var xMap = {};
          var walkOptions = {
            beforeChildWalk: function(context) {
              var child = context.childModel;
              var m = atlas.modelMap[context.routeKey];
              if (!m)
                return;
              var childMeasure = MakerJs2.measure.augment(m);
              MakerJs2.model.originate(child, [childMeasure.center[0], parentTop * baseline]);
              var x = child.origin[0] - measureParent.low[0];
              xMap[context.childId] = x;
              var xRatio = x / measureParent.width;
              cpa.push({ childId: context.childId, xRatio });
              return false;
            }
          };
          MakerJs2.model.walk(parentModel, walkOptions);
          cpa.sort(function(a, b) {
            return a.xRatio - b.xRatio;
          });
          var first = cpa[0];
          var last = cpa[cpa.length - 1];
          if (cpa.length > 1) {
            var min = first.xRatio;
            var max = last.xRatio;
            var span = max - min;
            cpa.forEach(function(cp) {
              return cp.xRatio = (cp.xRatio - min) / span;
            });
          }
          return {
            cpa,
            firstX: xMap[first.childId],
            lastX: measureParent.width - xMap[last.childId]
          };
        }
        function moveAndRotate(parentModel, cpa, rotate) {
          cpa.forEach(function(cp) {
            var child = parentModel.models[cp.childId];
            child.origin = cp.origin;
            if (rotate)
              MakerJs2.model.rotate(child, cp.angle, cp.origin);
          });
        }
        var onPathMap = {};
        onPathMap[MakerJs2.pathType.Arc] = function(arc, reversed, cpa) {
          var arcSpan = MakerJs2.angle.ofArcSpan(arc);
          cpa.forEach(function(p) {
            return p.angle = reversed ? arc.endAngle - p.xRatio * arcSpan - 90 : arc.startAngle + p.xRatio * arcSpan + 90;
          });
        };
        onPathMap[MakerJs2.pathType.Line] = function(line, reversed, cpa) {
          var lineAngle = MakerJs2.angle.ofLineInDegrees(line);
          cpa.forEach(function(p) {
            return p.angle = lineAngle;
          });
        };
        function childrenOnPath(parentModel, onPath, baseline, reversed, contain, rotate) {
          if (baseline === void 0) {
            baseline = 0;
          }
          if (reversed === void 0) {
            reversed = false;
          }
          if (contain === void 0) {
            contain = false;
          }
          if (rotate === void 0) {
            rotate = true;
          }
          var result = getChildPlacement(parentModel, baseline);
          var cpa = result.cpa;
          var chosenPath = onPath;
          if (contain && cpa.length > 1) {
            var onPathLength = MakerJs2.measure.pathLength(onPath);
            if (result.firstX + result.lastX < onPathLength) {
              chosenPath = MakerJs2.path.clone(onPath);
              MakerJs2.path.alterLength(chosenPath, -result.firstX, true);
              MakerJs2.path.alterLength(chosenPath, -result.lastX);
            }
          }
          cpa.forEach(function(p) {
            return p.origin = MakerJs2.point.middle(chosenPath, reversed ? 1 - p.xRatio : p.xRatio);
          });
          var fn = onPathMap[chosenPath.type];
          if (fn) {
            fn(chosenPath, reversed, cpa);
          }
          moveAndRotate(parentModel, cpa, rotate);
          return parentModel;
        }
        layout2.childrenOnPath = childrenOnPath;
        function miterAngles(points, offsetAngle) {
          var arc = new MakerJs2.paths.Arc([0, 0], 0, 0, 0);
          return points.map(function(p, i) {
            var a;
            if (i === 0) {
              a = MakerJs2.angle.ofPointInDegrees(p, points[i + 1]) + 90;
            } else if (i === points.length - 1) {
              a = MakerJs2.angle.ofPointInDegrees(points[i - 1], p) + 90;
            } else {
              arc.origin = p;
              arc.startAngle = MakerJs2.angle.ofPointInDegrees(p, points[i + 1]);
              arc.endAngle = MakerJs2.angle.ofPointInDegrees(p, points[i - 1]);
              a = MakerJs2.angle.ofArcMiddle(arc);
            }
            return a + offsetAngle;
          });
        }
        function childrenOnChain(parentModel, onChain, baseline, reversed, contain, rotated) {
          if (baseline === void 0) {
            baseline = 0;
          }
          if (reversed === void 0) {
            reversed = false;
          }
          if (contain === void 0) {
            contain = false;
          }
          if (rotated === void 0) {
            rotated = true;
          }
          var result = getChildPlacement(parentModel, baseline);
          var cpa = result.cpa;
          var chainLength = onChain.pathLength;
          var points;
          if (cpa.length > 1) {
            if (contain)
              chainLength -= result.firstX + result.lastX;
            var absolutes = cpa.map(function(cp) {
              return (reversed ? 1 - cp.xRatio : cp.xRatio) * chainLength;
            });
            var relatives;
            if (reversed)
              absolutes.reverse();
            relatives = absolutes.map(function(ab, i) {
              return Math.abs(ab - (i == 0 ? 0 : absolutes[i - 1]));
            });
            if (contain) {
              relatives[0] += reversed ? result.lastX : result.firstX;
            } else {
              relatives.shift();
            }
            points = MakerJs2.chain.toPoints(onChain, relatives);
            if (points.length < cpa.length) {
              var endLink = onChain.links[onChain.links.length - 1];
              points.push(endLink.endPoints[endLink.reversed ? 0 : 1]);
            }
            if (contain)
              points.shift();
          } else {
            points = MakerJs2.chain.toPoints(onChain, 0.5 * chainLength);
            points.length = 2;
            points.push(onChain.links[onChain.links.length - 1].endPoints[onChain.links[onChain.links.length - 1].reversed ? 0 : 1]);
          }
          if (reversed)
            points.reverse();
          var angles = miterAngles(points, -90);
          if (cpa.length > 1) {
            cpa.forEach(function(cp, i) {
              cp.angle = angles[i];
              cp.origin = points[i];
            });
          } else {
            cpa[0].angle = angles[1];
            cpa[0].origin = points[1];
          }
          moveAndRotate(parentModel, cpa, rotated);
          return parentModel;
        }
        layout2.childrenOnChain = childrenOnChain;
        function cloneToRadial(itemToClone, count, angleInDegrees, rotationOrigin) {
          var result = {};
          var add;
          var rotateFn;
          if (MakerJs2.isModel(itemToClone)) {
            add = result.models = {};
            rotateFn = MakerJs2.model.rotate;
          } else {
            add = result.paths = {};
            rotateFn = MakerJs2.path.rotate;
          }
          for (var i = 0; i < count; i++) {
            add[i] = rotateFn(MakerJs2.cloneObject(itemToClone), i * angleInDegrees, rotationOrigin);
          }
          return result;
        }
        layout2.cloneToRadial = cloneToRadial;
        function cloneTo(dimension, itemToClone, count, margin) {
          var result = {};
          var add;
          var measureFn;
          var moveFn;
          if (MakerJs2.isModel(itemToClone)) {
            measureFn = MakerJs2.measure.modelExtents;
            add = result.models = {};
            moveFn = MakerJs2.model.move;
          } else {
            measureFn = MakerJs2.measure.pathExtents;
            add = result.paths = {};
            moveFn = MakerJs2.path.move;
          }
          var m = measureFn(itemToClone);
          var size = m.high[dimension] - m.low[dimension];
          for (var i = 0; i < count; i++) {
            var origin = [0, 0];
            origin[dimension] = i * (size + margin);
            add[i] = moveFn(MakerJs2.cloneObject(itemToClone), origin);
          }
          return result;
        }
        function cloneToColumn(itemToClone, count, margin) {
          if (margin === void 0) {
            margin = 0;
          }
          return cloneTo(1, itemToClone, count, margin);
        }
        layout2.cloneToColumn = cloneToColumn;
        function cloneToRow(itemToClone, count, margin) {
          if (margin === void 0) {
            margin = 0;
          }
          return cloneTo(0, itemToClone, count, margin);
        }
        layout2.cloneToRow = cloneToRow;
        function cloneToGrid(itemToClone, xCount, yCount, margin) {
          var margins = getMargins(margin);
          return cloneToColumn(cloneToRow(itemToClone, xCount, margins[0]), yCount, margins[1]);
        }
        layout2.cloneToGrid = cloneToGrid;
        function getMargins(margin) {
          if (Array.isArray(margin)) {
            return margin;
          } else {
            return [margin, margin];
          }
        }
        function cloneToAlternatingRows(itemToClone, xCount, yCount, spacingFn) {
          var modelToMeasure;
          if (MakerJs2.isModel(itemToClone)) {
            modelToMeasure = itemToClone;
          } else {
            modelToMeasure = { paths: { "0": itemToClone } };
          }
          var spacing = spacingFn(modelToMeasure);
          var result = { models: {} };
          for (var i = 0; i < yCount; i++) {
            var i2 = i % 2;
            result.models[i] = MakerJs2.model.move(cloneToRow(itemToClone, xCount + i2, spacing.xMargin), [i2 * spacing.x, i * spacing.y]);
          }
          return result;
        }
        function cloneToBrick(itemToClone, xCount, yCount, margin) {
          var margins = getMargins(margin);
          function spacing(modelToMeasure) {
            var m = MakerJs2.measure.modelExtents(modelToMeasure);
            var xMargin = margins[0] || 0;
            var yMargin = margins[1] || 0;
            return { x: (m.width + xMargin) / -2, y: m.height + yMargin, xMargin };
          }
          return cloneToAlternatingRows(itemToClone, xCount, yCount, spacing);
        }
        layout2.cloneToBrick = cloneToBrick;
        function cloneToHoneycomb(itemToClone, xCount, yCount, margin) {
          if (margin === void 0) {
            margin = 0;
          }
          function spacing(modelToMeasure) {
            var hex = MakerJs2.measure.boundingHexagon(modelToMeasure);
            var width = 2 * MakerJs2.solvers.equilateralAltitude(hex.radius);
            var s = width + margin;
            return { x: s / -2, y: MakerJs2.solvers.equilateralAltitude(s), xMargin: margin };
          }
          return cloneToAlternatingRows(itemToClone, xCount, yCount, spacing);
        }
        layout2.cloneToHoneycomb = cloneToHoneycomb;
      })(layout = MakerJs2.layout || (MakerJs2.layout = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var models;
      (function(models2) {
        var hasLib = false;
        function ensureBezierLib() {
          if (hasLib)
            return;
          try {
            var lib = Bezier.prototype;
            hasLib = true;
          } catch (e) {
            throw "Bezier library not found. If you are using Node, try running 'npm install' or if you are in the browser, download http://pomax.github.io/bezierjs/bezier.js to your website and add a script tag.";
          }
        }
        var scratch;
        function getScratch(seed) {
          var points = [seed.origin];
          points.push.apply(points, seed.controls);
          points.push(seed.end);
          var bezierJsPoints = points.map(function(p) {
            var bp = {
              x: p[0],
              y: p[1]
            };
            return bp;
          });
          if (!scratch) {
            ensureBezierLib();
            scratch = new Bezier(bezierJsPoints);
          } else {
            Bezier.apply(scratch, bezierJsPoints);
          }
          return scratch;
        }
        function BezierToSeed(b, range) {
          var points = b.points.map(getIPoint);
          var seed = new BezierSeed(points);
          if (range) {
            seed.parentRange = range;
          }
          return seed;
        }
        function seedToBezier(seed) {
          var coords = [];
          coords.push.apply(coords, seed.origin);
          coords.push.apply(coords, seed.controls[0]);
          if (seed.controls.length > 1) {
            coords.push.apply(coords, seed.controls[1]);
          }
          coords.push.apply(coords, seed.end);
          ensureBezierLib();
          return new Bezier(coords);
        }
        function getExtrema(b) {
          var extrema = b.extrema().values.map(function(m) {
            return MakerJs2.round(m);
          }).filter(function(value2, index, self) {
            return self.indexOf(value2) === index;
          }).sort();
          if (extrema.length === 0)
            return [0, 1];
          if (extrema[0] !== 0) {
            extrema.unshift(0);
          }
          if (extrema[extrema.length - 1] !== 1) {
            extrema.push(1);
          }
          return extrema;
        }
        function getIPoint(p) {
          return [p.x, p.y];
        }
        var TPoint = (
          /** @class */
          /* @__PURE__ */ (function() {
            function TPoint2(b, t, offset) {
              this.t = t;
              this.point = MakerJs2.point.add(getIPoint(b.get(t)), offset);
            }
            return TPoint2;
          })()
        );
        function getError(b, startT, endT, arc, arcReversed) {
          var tSpan = endT - startT;
          function m(ratio) {
            var t = startT + tSpan * ratio;
            var bp = getIPoint(b.get(t));
            var ap = MakerJs2.point.middle(arc, arcReversed ? 1 - ratio : ratio);
            return MakerJs2.measure.pointDistance(ap, bp);
          }
          return m(0.25) + m(0.75);
        }
        function getLargestArc(b, startT, endT, accuracy) {
          var arc, lastGoodArc;
          var start = new TPoint(b, startT);
          var end = new TPoint(b, endT);
          var upper = end;
          var lower = start;
          var count = 0;
          var test = upper;
          var reversed;
          while (count < 100) {
            var middle = getIPoint(b.get((start.t + test.t) / 2));
            try {
              arc = new MakerJs2.paths.Arc(start.point, middle, test.point);
            } catch (e) {
              if (lastGoodArc) {
                return lastGoodArc;
              } else {
                break;
              }
            }
            if (reversed === void 0) {
              reversed = MakerJs2.measure.isPointEqual(start.point, MakerJs2.point.fromAngleOnCircle(arc.endAngle, arc));
            }
            var error = getError(b, startT, test.t, arc, reversed);
            if (error <= accuracy) {
              arc.bezierData = {
                startT,
                endT: test.t
              };
              lower = test;
              lastGoodArc = arc;
            } else {
              upper = test;
            }
            if (lower.t === upper.t || lastGoodArc && lastGoodArc !== arc && MakerJs2.angle.ofArcSpan(arc) - MakerJs2.angle.ofArcSpan(lastGoodArc) < 0.5) {
              return lastGoodArc;
            }
            count++;
            test = new TPoint(b, (lower.t + upper.t) / 2);
          }
          var line = new MakerJs2.paths.Line(start.point, test.point);
          line.bezierData = {
            startT,
            endT: test.t
          };
          return line;
        }
        function getArcs(bc, b, accuracy, startT, endT, base) {
          var added = 0;
          var arc;
          while (startT < endT) {
            arc = getLargestArc(b, startT, endT, accuracy);
            startT = arc.bezierData.endT;
            var len = MakerJs2.measure.pathLength(arc);
            if (len < 1e-4) {
              continue;
            }
            bc.paths[arc.type + "_" + (base + added)] = arc;
            added++;
          }
          return added;
        }
        function getActualBezierRange(curve, arc, endpoints, offset, pointMatchingDistance) {
          var b = getScratch(curve.seed);
          var tPoints = [arc.bezierData.startT, arc.bezierData.endT].map(function(t) {
            return new TPoint(b, t, offset);
          });
          var ends = endpoints.slice();
          var endpointDistancetoStart = ends.map(function(e) {
            return MakerJs2.measure.pointDistance(e, tPoints[0].point);
          });
          if (endpointDistancetoStart[0] > endpointDistancetoStart[1])
            ends.reverse();
          for (var i = 2; i--; ) {
            if (!MakerJs2.measure.isPointEqual(ends[i], tPoints[i].point, pointMatchingDistance)) {
              return null;
            }
          }
          return arc.bezierData;
        }
        function getChainBezierRange(curve, c, layer, addToLayer, pointMatchingDistance) {
          var endLinks = [c.links[0], c.links[c.links.length - 1]];
          if (endLinks[0].walkedPath.pathContext.bezierData.startT > endLinks[1].walkedPath.pathContext.bezierData.startT) {
            MakerJs2.chain.reverse(c);
            endLinks.reverse();
          }
          var actualBezierRanges = endLinks.map(function(endLink) {
            return getActualBezierRange(curve, endLink.walkedPath.pathContext, endLink.endPoints, endLink.walkedPath.offset, pointMatchingDistance);
          });
          var result = {
            startT: actualBezierRanges[0] ? actualBezierRanges[0].startT : null,
            endT: actualBezierRanges[1] ? actualBezierRanges[1].endT : null
          };
          if (result.startT !== null && result.endT !== null) {
            return result;
          } else if (c.links.length > 2) {
            if (result.startT === null) {
              addToLayer(c.links[0].walkedPath.pathContext, layer, true);
              result.startT = c.links[1].walkedPath.pathContext.bezierData.startT;
            }
            if (result.endT === null) {
              addToLayer(c.links[c.links.length - 1].walkedPath.pathContext, layer, true);
              result.endT = c.links[c.links.length - 2].walkedPath.pathContext.bezierData.endT;
            }
            return result;
          }
          return null;
        }
        var BezierSeed = (
          /** @class */
          /* @__PURE__ */ (function() {
            function BezierSeed2() {
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
              }
              this.type = MakerJs2.pathType.BezierSeed;
              switch (args.length) {
                case 1:
                  var points = args[0];
                  this.origin = points[0];
                  if (points.length === 3) {
                    this.controls = [points[1]];
                    this.end = points[2];
                  } else if (points.length === 4) {
                    this.controls = [points[1], points[2]];
                    this.end = points[3];
                  } else {
                    this.end = points[1];
                  }
                  break;
                case 3:
                  if (Array.isArray(args[1])) {
                    this.controls = args[1];
                  } else {
                    this.controls = [args[1]];
                  }
                  this.end = args[2];
                  break;
                case 4:
                  this.controls = [args[1], args[2]];
                  this.end = args[3];
                  break;
              }
            }
            return BezierSeed2;
          })()
        );
        var BezierCurve = (
          /** @class */
          (function() {
            function BezierCurve2() {
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
              }
              this.type = BezierCurve2.typeName;
              var isArrayArg0 = Array.isArray(args[0]);
              switch (args.length) {
                case 2:
                  if (isArrayArg0) {
                    this.accuracy = args[1];
                  } else {
                    this.seed = args[0];
                    this.accuracy = args[1];
                    break;
                  }
                //fall through to point array
                case 1:
                  if (isArrayArg0) {
                    var points = args[0];
                    this.seed = new BezierSeed(points);
                  } else {
                    this.seed = args[0];
                  }
                  break;
                default:
                  switch (args.length) {
                    case 4:
                      if (MakerJs2.isPoint(args[3])) {
                        this.seed = new BezierSeed(args);
                        break;
                      } else {
                        this.accuracy = args[3];
                      }
                    case 3:
                      if (isArrayArg0) {
                        this.seed = new BezierSeed(args.slice(0, 3));
                      }
                      break;
                    case 5:
                      this.accuracy = args[4];
                      this.seed = new BezierSeed(args.slice(0, 4));
                      break;
                  }
                  break;
              }
              this.paths = {};
              if (MakerJs2.measure.isBezierSeedLinear(this.seed)) {
                var line = new MakerJs2.paths.Line(MakerJs2.point.clone(this.seed.origin), MakerJs2.point.clone(this.seed.end));
                line.bezierData = {
                  startT: 0,
                  endT: 1
                };
                this.paths = {
                  "0": line
                };
                return;
              }
              var b = seedToBezier(this.seed);
              var extrema = getExtrema(b);
              this.paths = {};
              if (!this.accuracy) {
                var len = b.length();
                this.accuracy = len / 100;
              }
              var count = 0;
              for (var i = 1; i < extrema.length; i++) {
                var extremaSpan = extrema[i] - extrema[i - 1];
                count += getArcs(this, b, this.accuracy * extremaSpan, extrema[i - 1], extrema[i], count);
              }
            }
            BezierCurve2.getBezierSeeds = function(curve, options) {
              if (options === void 0) {
                options = {};
              }
              options.shallow = true;
              options.unifyBeziers = false;
              var seedsByLayer = {};
              var addToLayer = function(pathToAdd, layer, clone2) {
                if (clone2 === void 0) {
                  clone2 = false;
                }
                if (!seedsByLayer[layer]) {
                  seedsByLayer[layer] = [];
                }
                seedsByLayer[layer].push(clone2 ? MakerJs2.path.clone(pathToAdd) : pathToAdd);
              };
              MakerJs2.model.findChains(curve, function(chains, loose, layer) {
                chains.forEach(function(c) {
                  var range = getChainBezierRange(curve, c, layer, addToLayer, options.pointMatchingDistance);
                  if (range) {
                    var b = getScratch(curve.seed);
                    var piece = b.split(range.startT, range.endT);
                    addToLayer(BezierToSeed(piece), layer);
                  } else {
                    c.links.forEach(function(link) {
                      return addToLayer(link.walkedPath.pathContext, layer, true);
                    });
                  }
                });
                loose.forEach(function(wp) {
                  if (wp.pathContext.type === MakerJs2.pathType.Line) {
                    return addToLayer(wp.pathContext, layer, true);
                  }
                  var range = getActualBezierRange(curve, wp.pathContext, MakerJs2.point.fromPathEnds(wp.pathContext), wp.offset, options.pointMatchingDistance);
                  if (range) {
                    var b = getScratch(curve.seed);
                    var piece = b.split(range.startT, range.endT);
                    addToLayer(BezierToSeed(piece), layer);
                  } else {
                    addToLayer(wp.pathContext, layer, true);
                  }
                });
              }, options);
              if (options.byLayers) {
                return seedsByLayer;
              } else {
                return seedsByLayer[""];
              }
            };
            BezierCurve2.computeLength = function(seed) {
              var b = seedToBezier(seed);
              return b.length();
            };
            BezierCurve2.computePoint = function(seed, t) {
              var s = getScratch(seed);
              var computedPoint = s.compute(t);
              return getIPoint(computedPoint);
            };
            BezierCurve2.typeName = "BezierCurve";
            return BezierCurve2;
          })()
        );
        models2.BezierCurve = BezierCurve;
        BezierCurve.metaParameters = [
          {
            title: "points",
            type: "select",
            value: [
              [[100, 0], [-80, -60], [100, 220], [100, 60]],
              [[0, 0], [100, 0], [100, 100]],
              [[0, 0], [20, 0], [80, 100], [100, 100]]
            ]
          }
        ];
      })(models = MakerJs2.models || (MakerJs2.models = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var models;
      (function(models2) {
        var maxBezierArcspan = 45;
        function controlYForCircularCubic(arcSpanInRadians) {
          return 4 * (Math.tan(arcSpanInRadians / 4) / 3);
        }
        function controlPointsForCircularCubic(arc) {
          var arcSpan = MakerJs2.angle.ofArcSpan(arc);
          var y = controlYForCircularCubic(MakerJs2.angle.toRadians(arcSpan));
          var c1 = [arc.radius, arc.radius * y];
          var c2 = MakerJs2.point.rotate(MakerJs2.point.mirror(c1, false, true), arcSpan, [0, 0]);
          return [c1, c2].map(function(p) {
            return MakerJs2.point.add(arc.origin, MakerJs2.point.rotate(p, arc.startAngle, [0, 0]));
          });
        }
        function bezierSeedFromArc(arc) {
          var span = MakerJs2.angle.ofArcSpan(arc);
          if (span <= 90) {
            var endPoints = MakerJs2.point.fromPathEnds(arc);
            var controls = controlPointsForCircularCubic(arc);
            return {
              type: MakerJs2.pathType.BezierSeed,
              origin: endPoints[0],
              controls,
              end: endPoints[1]
            };
          }
          return null;
        }
        var Ellipse = (
          /** @class */
          /* @__PURE__ */ (function() {
            function Ellipse2() {
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
              }
              var _this = this;
              this.models = {};
              var n = 360 / maxBezierArcspan;
              var accuracy;
              var isPointArgs0 = MakerJs2.isPoint(args[0]);
              var realArgs = function(numArgs) {
                switch (numArgs) {
                  case 2:
                    if (isPointArgs0) {
                      _this.origin = args[0];
                    }
                    break;
                  case 3:
                    _this.origin = args[0];
                    break;
                  case 4:
                    _this.origin = [args[0], args[1]];
                    break;
                }
                var a = 360 / n;
                var arc = new MakerJs2.paths.Arc([0, 0], 1, 0, a);
                for (var i = 0; i < n; i++) {
                  var seed = bezierSeedFromArc(arc);
                  switch (numArgs) {
                    case 1:
                      seed = MakerJs2.path.scale(seed, args[0]);
                      break;
                    case 2:
                      if (isPointArgs0) {
                        seed = MakerJs2.path.scale(seed, args[1]);
                      } else {
                        seed = MakerJs2.path.distort(seed, args[0], args[1]);
                      }
                      break;
                    case 3:
                      seed = MakerJs2.path.distort(seed, args[1], args[2]);
                      break;
                    case 4:
                      seed = MakerJs2.path.distort(seed, args[2], args[3]);
                      break;
                  }
                  _this.models["Curve_" + (1 + i)] = new models2.BezierCurve(seed, accuracy);
                  arc.startAngle += a;
                  arc.endAngle += a;
                }
              };
              switch (args.length) {
                case 2:
                  realArgs(2);
                  break;
                case 3:
                  if (isPointArgs0) {
                    realArgs(3);
                  } else {
                    accuracy = args[2];
                    realArgs(2);
                  }
                  break;
                case 4:
                  if (isPointArgs0) {
                    accuracy = args[3];
                    realArgs(3);
                  } else {
                    realArgs(4);
                  }
                  break;
                case 5:
                  accuracy = args[4];
                  realArgs(4);
                  break;
              }
            }
            return Ellipse2;
          })()
        );
        models2.Ellipse = Ellipse;
        Ellipse.metaParameters = [
          { title: "radiusX", type: "range", min: 1, max: 50, value: 50 },
          { title: "radiusY", type: "range", min: 1, max: 50, value: 25 }
        ];
        var EllipticArc = (
          /** @class */
          /* @__PURE__ */ (function() {
            function EllipticArc2() {
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
              }
              this.models = {};
              var arc;
              var accuracy;
              var distortX;
              var distortY;
              if (MakerJs2.isPathArc(args[0])) {
                arc = args[0];
                distortX = args[1];
                distortY = args[2];
                accuracy = args[3];
              } else {
                arc = new MakerJs2.paths.Arc([0, 0], 1, args[0], args[1]);
                distortX = args[2];
                distortY = args[3];
                accuracy = args[4];
              }
              var span = MakerJs2.angle.ofArcSpan(arc);
              var count = Math.ceil(span / maxBezierArcspan);
              var subSpan = span / count;
              var subArc = MakerJs2.path.clone(arc);
              for (var i = 0; i < count; i++) {
                subArc.startAngle = arc.startAngle + i * subSpan;
                subArc.endAngle = subArc.startAngle + subSpan;
                var seed = bezierSeedFromArc(subArc);
                seed = MakerJs2.path.distort(seed, distortX, distortY);
                this.models["Curve_" + (1 + i)] = new models2.BezierCurve(seed, accuracy);
              }
            }
            return EllipticArc2;
          })()
        );
        models2.EllipticArc = EllipticArc;
        EllipticArc.metaParameters = [
          { title: "startAngle", type: "range", min: 0, max: 90, value: 0 },
          { title: "endAngle", type: "range", min: 90, max: 360, value: 180 },
          { title: "radiusX", type: "range", min: 1, max: 50, value: 50 },
          { title: "radiusY", type: "range", min: 1, max: 50, value: 25 }
        ];
      })(models = MakerJs2.models || (MakerJs2.models = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var models;
      (function(models2) {
        function getPoints(arg) {
          var coords;
          if (Array.isArray(arg)) {
            if (MakerJs2.isPoint(arg[0])) {
              return arg;
            }
            coords = arg;
          } else {
            coords = MakerJs2.importer.parseNumericList(arg);
          }
          var points = [];
          for (var i = 0; i < coords.length; i += 2) {
            points.push([coords[i], coords[i + 1]]);
          }
          return points;
        }
        var ConnectTheDots = (
          /** @class */
          /* @__PURE__ */ (function() {
            function ConnectTheDots2() {
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
              }
              var _this = this;
              this.paths = {};
              var isClosed;
              var points;
              switch (args.length) {
                case 1:
                  isClosed = true;
                  points = getPoints(args[0]);
                  break;
                case 2:
                  isClosed = args[0];
                  points = getPoints(args[1]);
                  break;
              }
              var connect = function(a, b, skipZeroDistance) {
                if (skipZeroDistance === void 0) {
                  skipZeroDistance = false;
                }
                if (skipZeroDistance && MakerJs2.measure.pointDistance(points[a], points[b]) == 0)
                  return;
                _this.paths["ShapeLine" + i] = new MakerJs2.paths.Line(points[a], points[b]);
              };
              for (var i = 1; i < points.length; i++) {
                connect(i - 1, i);
              }
              if (isClosed && points.length > 2) {
                connect(points.length - 1, 0, true);
              }
            }
            return ConnectTheDots2;
          })()
        );
        models2.ConnectTheDots = ConnectTheDots;
        ConnectTheDots.metaParameters = [
          { title: "closed", type: "bool", value: true },
          {
            title: "points",
            type: "select",
            value: [
              [[0, 0], [40, 40], [60, 20], [100, 100], [60, 60], [40, 80]],
              [[0, 0], [100, 0], [50, 87]],
              [-10, 0, 10, 0, 0, 20],
              "-10 0 10 0 0 20"
            ]
          }
        ];
      })(models = MakerJs2.models || (MakerJs2.models = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var models;
      (function(models2) {
        var Polygon = (
          /** @class */
          (function() {
            function Polygon2(numberOfSides, radius, firstCornerAngleInDegrees, circumscribed) {
              this.paths = {};
              this.paths = new models2.ConnectTheDots(true, Polygon2.getPoints(numberOfSides, radius, firstCornerAngleInDegrees, circumscribed)).paths;
            }
            Polygon2.circumscribedRadius = function(radius, angleInRadians) {
              return radius / Math.cos(angleInRadians / 2);
            };
            Polygon2.getPoints = function(numberOfSides, radius, firstCornerAngleInDegrees, circumscribed) {
              if (firstCornerAngleInDegrees === void 0) {
                firstCornerAngleInDegrees = 0;
              }
              if (circumscribed === void 0) {
                circumscribed = false;
              }
              var points = [];
              var a1 = MakerJs2.angle.toRadians(firstCornerAngleInDegrees);
              var a = 2 * Math.PI / numberOfSides;
              if (circumscribed) {
                radius = Polygon2.circumscribedRadius(radius, a);
              }
              for (var i = 0; i < numberOfSides; i++) {
                points.push(MakerJs2.point.fromPolar(a * i + a1, radius));
              }
              return points;
            };
            return Polygon2;
          })()
        );
        models2.Polygon = Polygon;
        Polygon.metaParameters = [
          { title: "number of sides", type: "range", min: 3, max: 24, value: 6 },
          { title: "radius", type: "range", min: 1, max: 100, value: 50 },
          { title: "offset angle", type: "range", min: 0, max: 180, value: 0 },
          { title: "radius on flats (vs radius on vertexes)", type: "bool", value: false }
        ];
      })(models = MakerJs2.models || (MakerJs2.models = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var models;
      (function(models2) {
        var Holes = (
          /** @class */
          /* @__PURE__ */ (function() {
            function Holes2(holeRadius, points, ids) {
              this.paths = {};
              for (var i = 0; i < points.length; i++) {
                var id = ids ? ids[i] : i.toString();
                this.paths[id] = new MakerJs2.paths.Circle(points[i], holeRadius);
              }
            }
            return Holes2;
          })()
        );
        models2.Holes = Holes;
        Holes.metaParameters = [
          { title: "holeRadius", type: "range", min: 0.1, max: 10, step: 0.1, value: 1 },
          {
            title: "points",
            type: "select",
            value: [
              [[0, 0], [10, 10], [20, 20], [30, 30], [40, 40], [50, 50], [60, 60], [70, 70], [80, 80]],
              [[0, 0], [0, 25], [0, 50], [0, 75], [0, 100], [25, 50], [50, 50], [75, 50], [100, 100], [100, 75], [100, 50], [100, 25], [100, 0]]
            ]
          }
        ];
      })(models = MakerJs2.models || (MakerJs2.models = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var models;
      (function(models2) {
        var BoltCircle = (
          /** @class */
          /* @__PURE__ */ (function() {
            function BoltCircle2(boltRadius, holeRadius, boltCount, firstBoltAngleInDegrees) {
              if (firstBoltAngleInDegrees === void 0) {
                firstBoltAngleInDegrees = 0;
              }
              this.paths = {};
              var points = models2.Polygon.getPoints(boltCount, boltRadius, firstBoltAngleInDegrees);
              var ids = points.map(function(p, i) {
                return "bolt " + i;
              });
              this.paths = new models2.Holes(holeRadius, points, ids).paths;
            }
            return BoltCircle2;
          })()
        );
        models2.BoltCircle = BoltCircle;
        BoltCircle.metaParameters = [
          { title: "bolt circle radius", type: "range", min: 1, max: 100, value: 50 },
          { title: "hole radius", type: "range", min: 1, max: 50, value: 5 },
          { title: "bolt count", type: "range", min: 3, max: 24, value: 12 },
          { title: "offset angle", type: "range", min: 0, max: 180, value: 0 }
        ];
      })(models = MakerJs2.models || (MakerJs2.models = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var models;
      (function(models2) {
        var BoltRectangle = (
          /** @class */
          /* @__PURE__ */ (function() {
            function BoltRectangle2(width, height, holeRadius) {
              this.paths = {};
              var points = [[0, 0], [width, 0], [width, height], [0, height]];
              var ids = ["BottomLeft_bolt", "BottomRight_bolt", "TopRight_bolt", "TopLeft_bolt"];
              this.paths = new models2.Holes(holeRadius, points, ids).paths;
            }
            return BoltRectangle2;
          })()
        );
        models2.BoltRectangle = BoltRectangle;
        BoltRectangle.metaParameters = [
          { title: "width", type: "range", min: 1, max: 100, value: 100 },
          { title: "height", type: "range", min: 1, max: 100, value: 50 },
          { title: "hole radius", type: "range", min: 1, max: 50, value: 5 }
        ];
      })(models = MakerJs2.models || (MakerJs2.models = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var models;
      (function(models2) {
        var Dogbone = (
          /** @class */
          /* @__PURE__ */ (function() {
            function Dogbone2(width, height, radius, style, bottomless) {
              if (style === void 0) {
                style = 0;
              }
              if (bottomless === void 0) {
                bottomless = false;
              }
              this.paths = {};
              var maxSide = Math.min(height, width) / 2;
              var maxRadius;
              switch (style) {
                case -1:
                //horizontal
                case 1:
                  maxRadius = maxSide / 2;
                  break;
                case 0:
                //equal
                default:
                  maxRadius = maxSide * Math.SQRT2 / 2;
                  break;
              }
              radius = Math.min(radius, maxRadius);
              var ax;
              var ay;
              var lx;
              var ly;
              var apexes;
              switch (style) {
                case -1:
                  ax = 0;
                  ay = radius;
                  lx = 0;
                  ly = radius * 2;
                  apexes = [180, 0, 0, 180];
                  break;
                case 1:
                  ax = radius;
                  ay = 0;
                  lx = radius * 2;
                  ly = 0;
                  apexes = [270, 270, 90, 90];
                  break;
                case 0:
                default:
                  ax = ay = radius / Math.SQRT2;
                  lx = ly = ax * 2;
                  apexes = [225, 315, 45, 135];
                  break;
              }
              if (bottomless) {
                this.paths["Left"] = new MakerJs2.paths.Line([0, 0], [0, height - ly]);
                this.paths["Right"] = new MakerJs2.paths.Line([width, 0], [width, height - ly]);
              } else {
                this.paths["Left"] = new MakerJs2.paths.Line([0, ly], [0, height - ly]);
                this.paths["Right"] = new MakerJs2.paths.Line([width, ly], [width, height - ly]);
                this.paths["Bottom"] = new MakerJs2.paths.Line([lx, 0], [width - lx, 0]);
                this.paths["BottomLeft"] = new MakerJs2.paths.Arc([ax, ay], radius, apexes[0] - 90, apexes[0] + 90);
                this.paths["BottomRight"] = new MakerJs2.paths.Arc([width - ax, ay], radius, apexes[1] - 90, apexes[1] + 90);
              }
              this.paths["TopRight"] = new MakerJs2.paths.Arc([width - ax, height - ay], radius, apexes[2] - 90, apexes[2] + 90);
              this.paths["TopLeft"] = new MakerJs2.paths.Arc([ax, height - ay], radius, apexes[3] - 90, apexes[3] + 90);
              this.paths["Top"] = new MakerJs2.paths.Line([lx, height], [width - lx, height]);
            }
            return Dogbone2;
          })()
        );
        models2.Dogbone = Dogbone;
        Dogbone.metaParameters = [
          { title: "width", type: "range", min: 1, max: 100, value: 50 },
          { title: "height", type: "range", min: 1, max: 100, value: 100 },
          { title: "radius", type: "range", min: 0, max: 50, value: 5 },
          { title: "style", type: "select", value: [0, 1, -1] },
          { title: "bottomless", type: "bool", value: false }
        ];
      })(models = MakerJs2.models || (MakerJs2.models = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var models;
      (function(models2) {
        var Dome = (
          /** @class */
          /* @__PURE__ */ (function() {
            function Dome2(width, height, radius, bottomless) {
              this.paths = {};
              var w2 = width / 2;
              if (radius < 0)
                radius = 0;
              if (radius === void 0)
                radius = w2;
              radius = Math.min(radius, w2);
              radius = Math.min(radius, height);
              var wt = Math.max(w2 - radius, 0);
              var hr = Math.max(height - radius, 0);
              if (!bottomless) {
                this.paths["Bottom"] = new MakerJs2.paths.Line([-w2, 0], [w2, 0]);
              }
              if (hr) {
                this.paths["Left"] = new MakerJs2.paths.Line([-w2, 0], [-w2, hr]);
                this.paths["Right"] = new MakerJs2.paths.Line([w2, 0], [w2, hr]);
              }
              if (radius > 0) {
                this.paths["TopLeft"] = new MakerJs2.paths.Arc([-wt, hr], radius, 90, 180);
                this.paths["TopRight"] = new MakerJs2.paths.Arc([wt, hr], radius, 0, 90);
              }
              if (wt) {
                this.paths["Top"] = new MakerJs2.paths.Line([-wt, height], [wt, height]);
              }
            }
            return Dome2;
          })()
        );
        models2.Dome = Dome;
        Dome.metaParameters = [
          { title: "width", type: "range", min: 1, max: 100, value: 50 },
          { title: "height", type: "range", min: 1, max: 100, value: 100 },
          { title: "radius", type: "range", min: 0, max: 50, value: 25 },
          { title: "bottomless", type: "bool", value: false }
        ];
      })(models = MakerJs2.models || (MakerJs2.models = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var models;
      (function(models2) {
        var RoundRectangle = (
          /** @class */
          /* @__PURE__ */ (function() {
            function RoundRectangle2() {
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
              }
              this.paths = {};
              var width;
              var height;
              var radius = 0;
              switch (args.length) {
                case 3:
                  width = args[0];
                  height = args[1];
                  radius = args[2];
                  break;
                case 2:
                  radius = args[1];
                //fall through to 1
                case 1:
                  var m = MakerJs2.measure.modelExtents(args[0]);
                  this.origin = MakerJs2.point.subtract(m.low, [radius, radius]);
                  width = m.high[0] - m.low[0] + 2 * radius;
                  height = m.high[1] - m.low[1] + 2 * radius;
                  break;
              }
              var maxRadius = Math.min(height, width) / 2;
              radius = Math.min(radius, maxRadius);
              var wr = width - radius;
              var hr = height - radius;
              if (radius > 0) {
                this.paths["BottomLeft"] = new MakerJs2.paths.Arc([radius, radius], radius, 180, 270);
                this.paths["BottomRight"] = new MakerJs2.paths.Arc([wr, radius], radius, 270, 0);
                this.paths["TopRight"] = new MakerJs2.paths.Arc([wr, hr], radius, 0, 90);
                this.paths["TopLeft"] = new MakerJs2.paths.Arc([radius, hr], radius, 90, 180);
              }
              if (wr - radius > 0) {
                this.paths["Bottom"] = new MakerJs2.paths.Line([radius, 0], [wr, 0]);
                this.paths["Top"] = new MakerJs2.paths.Line([wr, height], [radius, height]);
              }
              if (hr - radius > 0) {
                this.paths["Right"] = new MakerJs2.paths.Line([width, radius], [width, hr]);
                this.paths["Left"] = new MakerJs2.paths.Line([0, hr], [0, radius]);
              }
            }
            return RoundRectangle2;
          })()
        );
        models2.RoundRectangle = RoundRectangle;
        RoundRectangle.metaParameters = [
          { title: "width", type: "range", min: 1, max: 100, value: 50 },
          { title: "height", type: "range", min: 1, max: 100, value: 100 },
          { title: "radius", type: "range", min: 0, max: 50, value: 11 }
        ];
      })(models = MakerJs2.models || (MakerJs2.models = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var models;
      (function(models2) {
        var Oval = (
          /** @class */
          /* @__PURE__ */ (function() {
            function Oval2(width, height) {
              this.paths = {};
              this.paths = new models2.RoundRectangle(width, height, Math.min(height / 2, width / 2)).paths;
            }
            return Oval2;
          })()
        );
        models2.Oval = Oval;
        Oval.metaParameters = [
          { title: "width", type: "range", min: 1, max: 100, value: 50 },
          { title: "height", type: "range", min: 1, max: 100, value: 100 }
        ];
      })(models = MakerJs2.models || (MakerJs2.models = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var models;
      (function(models2) {
        var OvalArc = (
          /** @class */
          /* @__PURE__ */ (function() {
            function OvalArc2(startAngle, endAngle, sweepRadius, slotRadius, selfIntersect, isolateCaps) {
              if (selfIntersect === void 0) {
                selfIntersect = false;
              }
              if (isolateCaps === void 0) {
                isolateCaps = false;
              }
              var _this = this;
              this.paths = {};
              var capRoot;
              if (isolateCaps) {
                capRoot = { models: {} };
                this.models = { "Caps": capRoot };
              }
              if (slotRadius <= 0 || sweepRadius <= 0)
                return;
              startAngle = MakerJs2.angle.noRevolutions(startAngle);
              endAngle = MakerJs2.angle.noRevolutions(endAngle);
              if (MakerJs2.round(startAngle - endAngle) == 0)
                return;
              if (endAngle < startAngle)
                endAngle += 360;
              var addCap = function(id, tiltAngle, offsetStartAngle, offsetEndAngle) {
                var capModel;
                if (isolateCaps) {
                  capModel = { paths: {} };
                  capRoot.models[id] = capModel;
                } else {
                  capModel = _this;
                }
                return capModel.paths[id] = new MakerJs2.paths.Arc(MakerJs2.point.fromPolar(MakerJs2.angle.toRadians(tiltAngle), sweepRadius), slotRadius, tiltAngle + offsetStartAngle, tiltAngle + offsetEndAngle);
              };
              var addSweep = function(id, offsetRadius) {
                return _this.paths[id] = new MakerJs2.paths.Arc([0, 0], sweepRadius + offsetRadius, startAngle, endAngle);
              };
              addSweep("Outer", slotRadius);
              var hasInner = sweepRadius - slotRadius > 0;
              if (hasInner) {
                addSweep("Inner", -slotRadius);
              }
              var caps = [];
              caps.push(addCap("StartCap", startAngle, 180, 0));
              caps.push(addCap("EndCap", endAngle, 0, 180));
              var d = MakerJs2.measure.pointDistance(caps[0].origin, caps[1].origin);
              if (d / 2 < slotRadius) {
                var int = MakerJs2.path.intersection(caps[0], caps[1]);
                if (int) {
                  if (!hasInner || !selfIntersect) {
                    caps[0].startAngle = int.path1Angles[0];
                    caps[1].endAngle = int.path2Angles[0];
                  }
                  if (!selfIntersect && hasInner && int.intersectionPoints.length == 2) {
                    addCap("StartCap2", startAngle, 180, 0).endAngle = int.path1Angles[1];
                    addCap("EndCap2", endAngle, 0, 180).startAngle = int.path2Angles[1] + 360;
                  }
                }
              }
            }
            return OvalArc2;
          })()
        );
        models2.OvalArc = OvalArc;
        OvalArc.metaParameters = [
          { title: "start angle", type: "range", min: -360, max: 360, step: 1, value: 180 },
          { title: "end angle", type: "range", min: -360, max: 360, step: 1, value: 0 },
          { title: "sweep", type: "range", min: 0, max: 100, step: 1, value: 50 },
          { title: "radius", type: "range", min: 0, max: 100, step: 1, value: 15 },
          { title: "self intersect", type: "bool", value: false }
        ];
      })(models = MakerJs2.models || (MakerJs2.models = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var models;
      (function(models2) {
        var Rectangle = (
          /** @class */
          /* @__PURE__ */ (function() {
            function Rectangle2() {
              var args = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
              }
              this.paths = {};
              var width;
              var height;
              if (args.length === 2 && !MakerJs2.isObject(args[0])) {
                width = args[0];
                height = args[1];
              } else {
                var margin = 0;
                var m;
                if (MakerJs2.isModel(args[0])) {
                  m = MakerJs2.measure.modelExtents(args[0]);
                  if (args.length === 2) {
                    margin = args[1];
                  }
                } else {
                  m = args[0];
                }
                this.origin = MakerJs2.point.subtract(m.low, [margin, margin]);
                width = m.high[0] - m.low[0] + 2 * margin;
                height = m.high[1] - m.low[1] + 2 * margin;
              }
              this.paths = new models2.ConnectTheDots(true, [[0, 0], [width, 0], [width, height], [0, height]]).paths;
            }
            return Rectangle2;
          })()
        );
        models2.Rectangle = Rectangle;
        Rectangle.metaParameters = [
          { title: "width", type: "range", min: 1, max: 100, value: 50 },
          { title: "height", type: "range", min: 1, max: 100, value: 100 }
        ];
      })(models = MakerJs2.models || (MakerJs2.models = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var models;
      (function(models2) {
        var Ring = (
          /** @class */
          /* @__PURE__ */ (function() {
            function Ring2(outerRadius, innerRadius) {
              this.paths = {};
              var radii = {
                "Ring_outer": outerRadius,
                "Ring_inner": innerRadius
              };
              for (var id in radii) {
                var r = radii[id];
                if (r === void 0 || r <= 0)
                  continue;
                this.paths[id] = new MakerJs2.paths.Circle(MakerJs2.point.zero(), r);
              }
            }
            return Ring2;
          })()
        );
        models2.Ring = Ring;
        Ring.metaParameters = [
          { title: "outer radius", type: "range", min: 0, max: 100, step: 1, value: 50 },
          { title: "inner radius", type: "range", min: 0, max: 100, step: 1, value: 20 }
        ];
      })(models = MakerJs2.models || (MakerJs2.models = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var models;
      (function(models2) {
        var Belt = (
          /** @class */
          /* @__PURE__ */ (function() {
            function Belt2(leftRadius, distance, rightRadius) {
              this.paths = {};
              var left = new MakerJs2.paths.Arc([0, 0], leftRadius, 0, 360);
              var right = new MakerJs2.paths.Arc([distance, 0], rightRadius, 0, 360);
              var angles = MakerJs2.solvers.circleTangentAngles(left, right);
              if (!angles) {
                this.paths["Belt"] = new MakerJs2.paths.Circle(Math.max(leftRadius, rightRadius));
              } else {
                angles = angles.sort(function(a, b) {
                  return a - b;
                });
                left.startAngle = angles[0];
                left.endAngle = angles[1];
                right.startAngle = angles[1];
                right.endAngle = angles[0];
                this.paths["Left"] = left;
                this.paths["Right"] = right;
                this.paths["Top"] = new MakerJs2.paths.Line(MakerJs2.point.fromAngleOnCircle(angles[0], left), MakerJs2.point.fromAngleOnCircle(angles[0], right));
                this.paths["Bottom"] = new MakerJs2.paths.Line(MakerJs2.point.fromAngleOnCircle(angles[1], left), MakerJs2.point.fromAngleOnCircle(angles[1], right));
              }
            }
            return Belt2;
          })()
        );
        models2.Belt = Belt;
        Belt.metaParameters = [
          { title: "left radius", type: "range", min: 0, max: 100, value: 30 },
          { title: "distance between centers", type: "range", min: 0, max: 100, value: 50 },
          { title: "right radius", type: "range", min: 0, max: 100, value: 15 }
        ];
      })(models = MakerJs2.models || (MakerJs2.models = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var models;
      (function(models2) {
        var SCurve = (
          /** @class */
          /* @__PURE__ */ (function() {
            function SCurve2(width, height) {
              this.paths = {};
              function findRadius(x, y) {
                return x + (y * y - x * x) / (2 * x);
              }
              var h2 = height / 2;
              var w2 = width / 2;
              var radius;
              var startAngle;
              var endAngle;
              var arcOrigin;
              if (width > height) {
                radius = findRadius(h2, w2);
                startAngle = 270;
                endAngle = 360 - MakerJs2.angle.toDegrees(Math.acos(w2 / radius));
                arcOrigin = [0, radius];
              } else {
                radius = findRadius(w2, h2);
                startAngle = 180 - MakerJs2.angle.toDegrees(Math.asin(h2 / radius));
                endAngle = 180;
                arcOrigin = [radius, 0];
              }
              var curve = new MakerJs2.paths.Arc(arcOrigin, radius, startAngle, endAngle);
              this.paths["curve_start"] = curve;
              this.paths["curve_end"] = MakerJs2.path.moveRelative(MakerJs2.path.mirror(curve, true, true), [width, height]);
            }
            return SCurve2;
          })()
        );
        models2.SCurve = SCurve;
        SCurve.metaParameters = [
          { title: "width", type: "range", min: 1, max: 100, value: 50 },
          { title: "height", type: "range", min: 1, max: 100, value: 100 }
        ];
      })(models = MakerJs2.models || (MakerJs2.models = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var models;
      (function(models2) {
        var Slot = (
          /** @class */
          /* @__PURE__ */ (function() {
            function Slot2(origin, endPoint, radius, isolateCaps) {
              if (isolateCaps === void 0) {
                isolateCaps = false;
              }
              var _this = this;
              this.paths = {};
              var capRoot;
              if (isolateCaps) {
                capRoot = { models: {} };
                this.models = { "Caps": capRoot };
              }
              var addCap = function(id, capPath) {
                var capModel;
                if (isolateCaps) {
                  capModel = { paths: {} };
                  capRoot.models[id] = capModel;
                } else {
                  capModel = _this;
                }
                capModel.paths[id] = capPath;
              };
              var a = MakerJs2.angle.ofPointInDegrees(origin, endPoint);
              var len = MakerJs2.measure.pointDistance(origin, endPoint);
              this.paths["Top"] = new MakerJs2.paths.Line([0, radius], [len, radius]);
              this.paths["Bottom"] = new MakerJs2.paths.Line([0, -radius], [len, -radius]);
              addCap("StartCap", new MakerJs2.paths.Arc([0, 0], radius, 90, 270));
              addCap("EndCap", new MakerJs2.paths.Arc([len, 0], radius, 270, 90));
              MakerJs2.model.rotate(this, a, [0, 0]);
              this.origin = origin;
            }
            return Slot2;
          })()
        );
        models2.Slot = Slot;
        Slot.metaParameters = [
          {
            title: "origin",
            type: "select",
            value: [
              [0, 0],
              [10, 0],
              [10, 10]
            ]
          },
          {
            title: "end",
            type: "select",
            value: [
              [80, 0],
              [0, 30],
              [10, 30]
            ]
          },
          { title: "radius", type: "range", min: 1, max: 50, value: 10 }
        ];
      })(models = MakerJs2.models || (MakerJs2.models = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var models;
      (function(models2) {
        var Square = (
          /** @class */
          /* @__PURE__ */ (function() {
            function Square2(side) {
              this.paths = {};
              this.paths = new models2.Rectangle(side, side).paths;
            }
            return Square2;
          })()
        );
        models2.Square = Square;
        Square.metaParameters = [
          { title: "side", type: "range", min: 1, max: 100, value: 100 }
        ];
      })(models = MakerJs2.models || (MakerJs2.models = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var models;
      (function(models2) {
        var Star = (
          /** @class */
          (function() {
            function Star2(numberOfPoints, outerRadius, innerRadius, skipPoints) {
              if (skipPoints === void 0) {
                skipPoints = 2;
              }
              this.paths = {};
              if (!innerRadius) {
                innerRadius = outerRadius * Star2.InnerRadiusRatio(numberOfPoints, skipPoints);
              }
              var outerPoints = models2.Polygon.getPoints(numberOfPoints, outerRadius);
              var innerPoints = models2.Polygon.getPoints(numberOfPoints, innerRadius, 180 / numberOfPoints);
              var allPoints = [];
              for (var i = 0; i < numberOfPoints; i++) {
                allPoints.push(outerPoints[i]);
                allPoints.push(innerPoints[i]);
              }
              var model = new models2.ConnectTheDots(true, allPoints);
              this.paths = model.paths;
              delete model.paths;
            }
            Star2.InnerRadiusRatio = function(numberOfPoints, skipPoints) {
              if (numberOfPoints > 0 && skipPoints > 1 && skipPoints < numberOfPoints / 2) {
                return Math.cos(Math.PI * skipPoints / numberOfPoints) / Math.cos(Math.PI * (skipPoints - 1) / numberOfPoints);
              }
              return 0;
            };
            return Star2;
          })()
        );
        models2.Star = Star;
        Star.metaParameters = [
          { title: "number of sides", type: "range", min: 3, max: 24, value: 8 },
          { title: "outer radius", type: "range", min: 1, max: 100, value: 50 },
          { title: "inner radius", type: "range", min: 0, max: 100, value: 15 },
          { title: "skip points (when inner radius is zero)", type: "range", min: 0, max: 12, value: 2 }
        ];
      })(models = MakerJs2.models || (MakerJs2.models = {}));
    })(MakerJs || (MakerJs = {}));
    var MakerJs;
    (function(MakerJs2) {
      var models;
      (function(models2) {
        var Text = (
          /** @class */
          (function() {
            function Text2(font, text, fontSize, combine, centerCharacterOrigin, bezierAccuracy, opentypeOptions) {
              if (combine === void 0) {
                combine = false;
              }
              if (centerCharacterOrigin === void 0) {
                centerCharacterOrigin = false;
              }
              var _this = this;
              this.models = {};
              var charIndex = 0;
              var prevDeleted;
              var prevChar;
              var cb = function(glyph, x, y, _fontSize, options) {
                var charModel = Text2.glyphToModel(glyph, _fontSize, bezierAccuracy);
                charModel.origin = [x, 0];
                if (centerCharacterOrigin && (charModel.paths || charModel.models)) {
                  var m = MakerJs2.measure.modelExtents(charModel);
                  if (m) {
                    var w = m.high[0] - m.low[0];
                    MakerJs2.model.originate(charModel, [m.low[0] + w / 2, 0]);
                  }
                }
                if (combine && charIndex > 0) {
                  var combineOptions = {};
                  var prev;
                  if (prevDeleted) {
                    prev = {
                      models: {
                        deleted: prevDeleted,
                        char: prevChar
                      }
                    };
                  } else {
                    prev = prevChar;
                  }
                  MakerJs2.model.combine(prev, charModel, false, true, false, true, combineOptions);
                  prevDeleted = combineOptions.out_deleted[1];
                }
                _this.models[charIndex] = charModel;
                charIndex++;
                prevChar = charModel;
              };
              font.forEachGlyph(text, 0, 0, fontSize, opentypeOptions, cb);
            }
            Text2.glyphToModel = function(glyph, fontSize, bezierAccuracy) {
              var charModel = {};
              var firstPoint;
              var currPoint;
              var pathCount = 0;
              function addPath(p2) {
                if (!charModel.paths) {
                  charModel.paths = {};
                }
                charModel.paths["p_" + ++pathCount] = p2;
              }
              function addModel(m) {
                if (!charModel.models) {
                  charModel.models = {};
                }
                charModel.models["p_" + ++pathCount] = m;
              }
              var p = glyph.getPath(0, 0, fontSize);
              p.commands.map(function(command, i) {
                var points = [[command.x, command.y], [command.x1, command.y1], [command.x2, command.y2]].map(function(p2) {
                  if (p2[0] !== void 0) {
                    return MakerJs2.point.mirror(p2, false, true);
                  }
                });
                switch (command.type) {
                  case "M":
                    firstPoint = points[0];
                    break;
                  case "Z":
                    points[0] = firstPoint;
                  //fall through to line
                  case "L":
                    if (!MakerJs2.measure.isPointEqual(currPoint, points[0])) {
                      addPath(new MakerJs2.paths.Line(currPoint, points[0]));
                    }
                    break;
                  case "C":
                    addModel(new models2.BezierCurve(currPoint, points[1], points[2], points[0], bezierAccuracy));
                    break;
                  case "Q":
                    addModel(new models2.BezierCurve(currPoint, points[1], points[0], bezierAccuracy));
                    break;
                }
                currPoint = points[0];
              });
              return charModel;
            };
            return Text2;
          })()
        );
        models2.Text = Text;
        Text.metaParameters = [
          { title: "font", type: "font", value: "*" },
          { title: "text", type: "text", value: "Hello" },
          { title: "font size", type: "range", min: 10, max: 200, value: 72 },
          { title: "combine", type: "bool", value: false },
          { title: "center character origin", type: "bool", value: false }
        ];
      })(models = MakerJs2.models || (MakerJs2.models = {}));
    })(MakerJs || (MakerJs = {}));
    MakerJs.version = "0.18.1";
    var Bezier = require_bezier_js();
  }
});
export default require_index();
