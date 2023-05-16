import {
  _ as xe,
  r as Nt,
  w as F,
  v as Z,
  o as p,
  c as v,
  a,
  t as S,
  b as tt,
  d as Qe,
  e as Gs,
  f as Pn,
  g as Ys,
  h as Xs,
  i as Vs,
  j as P,
  u as Nn,
  F as z,
  k as K,
  l as le,
  m as me,
  n as Ee,
  p as B,
  q as Lt,
  s as be,
  x as as,
  y as nt,
  z as Te,
  A as Ln,
  B as Ks,
  C as Js,
} from "./_plugin-vue_export-helper-eea9dcf6.js";
const qs = (t, e) => {
  const n = document.createElement("a");
  if ((document.body.appendChild(n), navigator.msSaveOrOpenBlob)) {
    navigator.msSaveOrOpenBlob(e, t);
    return;
  }
  if ("download" in HTMLAnchorElement.prototype) {
    const s = window.URL.createObjectURL(e);
    (n.href = s),
      (n.download = t),
      (n.type = e.type),
      n.click(),
      window.setTimeout(() => {
        document.body.removeChild(n), window.URL.revokeObjectURL(s);
      }, 1e3);
  } else {
    let s = window.open("", "_blank");
    const o = new FileReader();
    (o.onloadend = function () {
      (s.location.href = o.result), (s = null);
    }),
      o.readAsDataURL(e);
  }
};
function Qs() {
  if (chrome.runtime.getManifest().version_name.includes("-prerelease")) {
    const n = getComputedStyle(document.documentElement).getPropertyValue("--blue");
    document.documentElement.style.setProperty("--brand-orange", n);
    const s = document.getElementById("favicon");
    s && (s.href = chrome.runtime.getURL("/images/icon-blue.png"));
  }
  const e = document.createElement("link");
  return (
    e.setAttribute("rel", "stylesheet"),
    e.setAttribute("href", chrome.runtime.getURL("/webpages/styles/colors-light.css")),
    e.setAttribute("data-below-vue-components", ""),
    (e.media = "not all"),
    document.head.appendChild(e),
    new Promise((n) => {
      chrome.storage.sync.get(["globalTheme"], ({ globalTheme: s = !1 }) => {
        s === !0 && e.removeAttribute("media");
        let o = s;
        n({
          theme: s,
          setGlobalTheme(i) {
            i !== o &&
              (chrome.storage.sync.set({ globalTheme: i }, () => {
                i === !0 ? e.removeAttribute("media") : (e.media = "not all");
              }),
              (o = i));
          },
        });
      });
    })
  );
}
function Me(t) {
  return Array.isArray ? Array.isArray(t) : cs(t) === "[object Array]";
}
const Zs = 1 / 0;
function eo(t) {
  if (typeof t == "string") return t;
  let e = t + "";
  return e == "0" && 1 / t == -Zs ? "-0" : e;
}
function to(t) {
  return t == null ? "" : eo(t);
}
function ye(t) {
  return typeof t == "string";
}
function ls(t) {
  return typeof t == "number";
}
function no(t) {
  return t === !0 || t === !1 || (so(t) && cs(t) == "[object Boolean]");
}
function ds(t) {
  return typeof t == "object";
}
function so(t) {
  return ds(t) && t !== null;
}
function de(t) {
  return t != null;
}
function Wt(t) {
  return !t.trim().length;
}
function cs(t) {
  return t == null ? (t === void 0 ? "[object Undefined]" : "[object Null]") : Object.prototype.toString.call(t);
}
const oo = "Incorrect 'index' type",
  io = (t) => `Invalid value for key ${t}`,
  ro = (t) => `Pattern length exceeds max of ${t}.`,
  ao = (t) => `Missing ${t} property in key`,
  lo = (t) => `Property 'weight' in key '${t}' must be a positive integer`,
  $n = Object.prototype.hasOwnProperty;
class co {
  constructor(e) {
    (this._keys = []), (this._keyMap = {});
    let n = 0;
    e.forEach((s) => {
      let o = us(s);
      (n += o.weight), this._keys.push(o), (this._keyMap[o.id] = o), (n += o.weight);
    }),
      this._keys.forEach((s) => {
        s.weight /= n;
      });
  }
  get(e) {
    return this._keyMap[e];
  }
  keys() {
    return this._keys;
  }
  toJSON() {
    return JSON.stringify(this._keys);
  }
}
function us(t) {
  let e = null,
    n = null,
    s = null,
    o = 1,
    i = null;
  if (ye(t) || Me(t)) (s = t), (e = Rn(t)), (n = un(t));
  else {
    if (!$n.call(t, "name")) throw new Error(ao("name"));
    const r = t.name;
    if (((s = r), $n.call(t, "weight") && ((o = t.weight), o <= 0))) throw new Error(lo(r));
    (e = Rn(r)), (n = un(r)), (i = t.getFn);
  }
  return { path: e, id: n, weight: o, src: s, getFn: i };
}
function Rn(t) {
  return Me(t) ? t : t.split(".");
}
function un(t) {
  return Me(t) ? t.join(".") : t;
}
function uo(t, e) {
  let n = [],
    s = !1;
  const o = (i, r, d) => {
    if (de(i))
      if (!r[d]) n.push(i);
      else {
        let l = r[d];
        const c = i[l];
        if (!de(c)) return;
        if (d === r.length - 1 && (ye(c) || ls(c) || no(c))) n.push(to(c));
        else if (Me(c)) {
          s = !0;
          for (let g = 0, u = c.length; g < u; g += 1) o(c[g], r, d + 1);
        } else r.length && o(c, r, d + 1);
      }
  };
  return o(t, ye(e) ? e.split(".") : e, 0), s ? n : n[0];
}
const ho = { includeMatches: !1, findAllMatches: !1, minMatchCharLength: 1 },
  go = {
    isCaseSensitive: !1,
    includeScore: !1,
    keys: [],
    shouldSort: !0,
    sortFn: (t, e) => (t.score === e.score ? (t.idx < e.idx ? -1 : 1) : t.score < e.score ? -1 : 1),
  },
  mo = { location: 0, threshold: 0.6, distance: 100 },
  po = { useExtendedSearch: !1, getFn: uo, ignoreLocation: !1, ignoreFieldNorm: !1, fieldNormWeight: 1 };
var I = { ...go, ...ho, ...mo, ...po };
const fo = /[^ ]+/g;
function vo(t = 1, e = 3) {
  const n = new Map(),
    s = Math.pow(10, e);
  return {
    get(o) {
      const i = o.match(fo).length;
      if (n.has(i)) return n.get(i);
      const r = 1 / Math.pow(i, 0.5 * t),
        d = parseFloat(Math.round(r * s) / s);
      return n.set(i, d), d;
    },
    clear() {
      n.clear();
    },
  };
}
class Sn {
  constructor({ getFn: e = I.getFn, fieldNormWeight: n = I.fieldNormWeight } = {}) {
    (this.norm = vo(n, 3)), (this.getFn = e), (this.isCreated = !1), this.setIndexRecords();
  }
  setSources(e = []) {
    this.docs = e;
  }
  setIndexRecords(e = []) {
    this.records = e;
  }
  setKeys(e = []) {
    (this.keys = e),
      (this._keysMap = {}),
      e.forEach((n, s) => {
        this._keysMap[n.id] = s;
      });
  }
  create() {
    this.isCreated ||
      !this.docs.length ||
      ((this.isCreated = !0),
      ye(this.docs[0])
        ? this.docs.forEach((e, n) => {
            this._addString(e, n);
          })
        : this.docs.forEach((e, n) => {
            this._addObject(e, n);
          }),
      this.norm.clear());
  }
  add(e) {
    const n = this.size();
    ye(e) ? this._addString(e, n) : this._addObject(e, n);
  }
  removeAt(e) {
    this.records.splice(e, 1);
    for (let n = e, s = this.size(); n < s; n += 1) this.records[n].i -= 1;
  }
  getValueForItemAtKeyId(e, n) {
    return e[this._keysMap[n]];
  }
  size() {
    return this.records.length;
  }
  _addString(e, n) {
    if (!de(e) || Wt(e)) return;
    let s = { v: e, i: n, n: this.norm.get(e) };
    this.records.push(s);
  }
  _addObject(e, n) {
    let s = { i: n, $: {} };
    this.keys.forEach((o, i) => {
      let r = o.getFn ? o.getFn(e) : this.getFn(e, o.path);
      if (de(r)) {
        if (Me(r)) {
          let d = [];
          const l = [{ nestedArrIndex: -1, value: r }];
          for (; l.length; ) {
            const { nestedArrIndex: c, value: g } = l.pop();
            if (de(g))
              if (ye(g) && !Wt(g)) {
                let u = { v: g, i: c, n: this.norm.get(g) };
                d.push(u);
              } else
                Me(g) &&
                  g.forEach((u, m) => {
                    l.push({ nestedArrIndex: m, value: u });
                  });
          }
          s.$[i] = d;
        } else if (ye(r) && !Wt(r)) {
          let d = { v: r, n: this.norm.get(r) };
          s.$[i] = d;
        }
      }
    }),
      this.records.push(s);
  }
  toJSON() {
    return { keys: this.keys, records: this.records };
  }
}
function hs(t, e, { getFn: n = I.getFn, fieldNormWeight: s = I.fieldNormWeight } = {}) {
  const o = new Sn({ getFn: n, fieldNormWeight: s });
  return o.setKeys(t.map(us)), o.setSources(e), o.create(), o;
}
function bo(t, { getFn: e = I.getFn, fieldNormWeight: n = I.fieldNormWeight } = {}) {
  const { keys: s, records: o } = t,
    i = new Sn({ getFn: e, fieldNormWeight: n });
  return i.setKeys(s), i.setIndexRecords(o), i;
}
function vt(
  t,
  {
    errors: e = 0,
    currentLocation: n = 0,
    expectedLocation: s = 0,
    distance: o = I.distance,
    ignoreLocation: i = I.ignoreLocation,
  } = {}
) {
  const r = e / t.length;
  if (i) return r;
  const d = Math.abs(s - n);
  return o ? r + d / o : d ? 1 : r;
}
function yo(t = [], e = I.minMatchCharLength) {
  let n = [],
    s = -1,
    o = -1,
    i = 0;
  for (let r = t.length; i < r; i += 1) {
    let d = t[i];
    d && s === -1 ? (s = i) : !d && s !== -1 && ((o = i - 1), o - s + 1 >= e && n.push([s, o]), (s = -1));
  }
  return t[i - 1] && i - s >= e && n.push([s, i - 1]), n;
}
const Fe = 32;
function wo(
  t,
  e,
  n,
  {
    location: s = I.location,
    distance: o = I.distance,
    threshold: i = I.threshold,
    findAllMatches: r = I.findAllMatches,
    minMatchCharLength: d = I.minMatchCharLength,
    includeMatches: l = I.includeMatches,
    ignoreLocation: c = I.ignoreLocation,
  } = {}
) {
  if (e.length > Fe) throw new Error(ro(Fe));
  const g = e.length,
    u = t.length,
    m = Math.max(0, Math.min(s, u));
  let h = i,
    f = m;
  const y = d > 1 || l,
    T = y ? Array(u) : [];
  let w;
  for (; (w = t.indexOf(e, f)) > -1; ) {
    let j = vt(e, { currentLocation: w, expectedLocation: m, distance: o, ignoreLocation: c });
    if (((h = Math.min(j, h)), (f = w + g), y)) {
      let ee = 0;
      for (; ee < g; ) (T[w + ee] = 1), (ee += 1);
    }
  }
  f = -1;
  let O = [],
    A = 1,
    R = g + u;
  const X = 1 << (g - 1);
  for (let j = 0; j < g; j += 1) {
    let ee = 0,
      H = R;
    for (; ee < H; )
      vt(e, { errors: j, currentLocation: m + H, expectedLocation: m, distance: o, ignoreLocation: c }) <= h
        ? (ee = H)
        : (R = H),
        (H = Math.floor((R - ee) / 2 + ee));
    R = H;
    let he = Math.max(1, m - H + 1),
      _ = r ? u : Math.min(m + H, u) + g,
      x = Array(_ + 2);
    x[_ + 1] = (1 << j) - 1;
    for (let M = _; M >= he; M -= 1) {
      let L = M - 1,
        W = n[t.charAt(L)];
      if (
        (y && (T[L] = +!!W),
        (x[M] = ((x[M + 1] << 1) | 1) & W),
        j && (x[M] |= ((O[M + 1] | O[M]) << 1) | 1 | O[M + 1]),
        x[M] & X &&
          ((A = vt(e, { errors: j, currentLocation: L, expectedLocation: m, distance: o, ignoreLocation: c })), A <= h))
      ) {
        if (((h = A), (f = L), f <= m)) break;
        he = Math.max(1, 2 * m - f);
      }
    }
    if (vt(e, { errors: j + 1, currentLocation: m, expectedLocation: m, distance: o, ignoreLocation: c }) > h) break;
    O = x;
  }
  const J = { isMatch: f >= 0, score: Math.max(0.001, A) };
  if (y) {
    const j = yo(T, d);
    j.length ? l && (J.indices = j) : (J.isMatch = !1);
  }
  return J;
}
function _o(t) {
  let e = {};
  for (let n = 0, s = t.length; n < s; n += 1) {
    const o = t.charAt(n);
    e[o] = (e[o] || 0) | (1 << (s - n - 1));
  }
  return e;
}
class gs {
  constructor(
    e,
    {
      location: n = I.location,
      threshold: s = I.threshold,
      distance: o = I.distance,
      includeMatches: i = I.includeMatches,
      findAllMatches: r = I.findAllMatches,
      minMatchCharLength: d = I.minMatchCharLength,
      isCaseSensitive: l = I.isCaseSensitive,
      ignoreLocation: c = I.ignoreLocation,
    } = {}
  ) {
    if (
      ((this.options = {
        location: n,
        threshold: s,
        distance: o,
        includeMatches: i,
        findAllMatches: r,
        minMatchCharLength: d,
        isCaseSensitive: l,
        ignoreLocation: c,
      }),
      (this.pattern = l ? e : e.toLowerCase()),
      (this.chunks = []),
      !this.pattern.length)
    )
      return;
    const g = (m, h) => {
        this.chunks.push({ pattern: m, alphabet: _o(m), startIndex: h });
      },
      u = this.pattern.length;
    if (u > Fe) {
      let m = 0;
      const h = u % Fe,
        f = u - h;
      for (; m < f; ) g(this.pattern.substr(m, Fe), m), (m += Fe);
      if (h) {
        const y = u - Fe;
        g(this.pattern.substr(y), y);
      }
    } else g(this.pattern, 0);
  }
  searchIn(e) {
    const { isCaseSensitive: n, includeMatches: s } = this.options;
    if ((n || (e = e.toLowerCase()), this.pattern === e)) {
      let f = { isMatch: !0, score: 0 };
      return s && (f.indices = [[0, e.length - 1]]), f;
    }
    const {
      location: o,
      distance: i,
      threshold: r,
      findAllMatches: d,
      minMatchCharLength: l,
      ignoreLocation: c,
    } = this.options;
    let g = [],
      u = 0,
      m = !1;
    this.chunks.forEach(({ pattern: f, alphabet: y, startIndex: T }) => {
      const {
        isMatch: w,
        score: O,
        indices: A,
      } = wo(e, f, y, {
        location: o + T,
        distance: i,
        threshold: r,
        findAllMatches: d,
        minMatchCharLength: l,
        includeMatches: s,
        ignoreLocation: c,
      });
      w && (m = !0), (u += O), w && A && (g = [...g, ...A]);
    });
    let h = { isMatch: m, score: m ? u / this.chunks.length : 1 };
    return m && s && (h.indices = g), h;
  }
}
class Ne {
  constructor(e) {
    this.pattern = e;
  }
  static isMultiMatch(e) {
    return Fn(e, this.multiRegex);
  }
  static isSingleMatch(e) {
    return Fn(e, this.singleRegex);
  }
  search() {}
}
function Fn(t, e) {
  const n = t.match(e);
  return n ? n[1] : null;
}
class xo extends Ne {
  constructor(e) {
    super(e);
  }
  static get type() {
    return "exact";
  }
  static get multiRegex() {
    return /^="(.*)"$/;
  }
  static get singleRegex() {
    return /^=(.*)$/;
  }
  search(e) {
    const n = e === this.pattern;
    return { isMatch: n, score: n ? 0 : 1, indices: [0, this.pattern.length - 1] };
  }
}
class So extends Ne {
  constructor(e) {
    super(e);
  }
  static get type() {
    return "inverse-exact";
  }
  static get multiRegex() {
    return /^!"(.*)"$/;
  }
  static get singleRegex() {
    return /^!(.*)$/;
  }
  search(e) {
    const s = e.indexOf(this.pattern) === -1;
    return { isMatch: s, score: s ? 0 : 1, indices: [0, e.length - 1] };
  }
}
class Eo extends Ne {
  constructor(e) {
    super(e);
  }
  static get type() {
    return "prefix-exact";
  }
  static get multiRegex() {
    return /^\^"(.*)"$/;
  }
  static get singleRegex() {
    return /^\^(.*)$/;
  }
  search(e) {
    const n = e.startsWith(this.pattern);
    return { isMatch: n, score: n ? 0 : 1, indices: [0, this.pattern.length - 1] };
  }
}
class ko extends Ne {
  constructor(e) {
    super(e);
  }
  static get type() {
    return "inverse-prefix-exact";
  }
  static get multiRegex() {
    return /^!\^"(.*)"$/;
  }
  static get singleRegex() {
    return /^!\^(.*)$/;
  }
  search(e) {
    const n = !e.startsWith(this.pattern);
    return { isMatch: n, score: n ? 0 : 1, indices: [0, e.length - 1] };
  }
}
class Mo extends Ne {
  constructor(e) {
    super(e);
  }
  static get type() {
    return "suffix-exact";
  }
  static get multiRegex() {
    return /^"(.*)"\$$/;
  }
  static get singleRegex() {
    return /^(.*)\$$/;
  }
  search(e) {
    const n = e.endsWith(this.pattern);
    return { isMatch: n, score: n ? 0 : 1, indices: [e.length - this.pattern.length, e.length - 1] };
  }
}
class Io extends Ne {
  constructor(e) {
    super(e);
  }
  static get type() {
    return "inverse-suffix-exact";
  }
  static get multiRegex() {
    return /^!"(.*)"\$$/;
  }
  static get singleRegex() {
    return /^!(.*)\$$/;
  }
  search(e) {
    const n = !e.endsWith(this.pattern);
    return { isMatch: n, score: n ? 0 : 1, indices: [0, e.length - 1] };
  }
}
class ms extends Ne {
  constructor(
    e,
    {
      location: n = I.location,
      threshold: s = I.threshold,
      distance: o = I.distance,
      includeMatches: i = I.includeMatches,
      findAllMatches: r = I.findAllMatches,
      minMatchCharLength: d = I.minMatchCharLength,
      isCaseSensitive: l = I.isCaseSensitive,
      ignoreLocation: c = I.ignoreLocation,
    } = {}
  ) {
    super(e),
      (this._bitapSearch = new gs(e, {
        location: n,
        threshold: s,
        distance: o,
        includeMatches: i,
        findAllMatches: r,
        minMatchCharLength: d,
        isCaseSensitive: l,
        ignoreLocation: c,
      }));
  }
  static get type() {
    return "fuzzy";
  }
  static get multiRegex() {
    return /^"(.*)"$/;
  }
  static get singleRegex() {
    return /^(.*)$/;
  }
  search(e) {
    return this._bitapSearch.searchIn(e);
  }
}
class ps extends Ne {
  constructor(e) {
    super(e);
  }
  static get type() {
    return "include";
  }
  static get multiRegex() {
    return /^'"(.*)"$/;
  }
  static get singleRegex() {
    return /^'(.*)$/;
  }
  search(e) {
    let n = 0,
      s;
    const o = [],
      i = this.pattern.length;
    for (; (s = e.indexOf(this.pattern, n)) > -1; ) (n = s + i), o.push([s, n - 1]);
    const r = !!o.length;
    return { isMatch: r, score: r ? 0 : 1, indices: o };
  }
}
const hn = [xo, ps, Eo, ko, Io, Mo, So, ms],
  jn = hn.length,
  To = / +(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/,
  Co = "|";
function Oo(t, e = {}) {
  return t.split(Co).map((n) => {
    let s = n
        .trim()
        .split(To)
        .filter((i) => i && !!i.trim()),
      o = [];
    for (let i = 0, r = s.length; i < r; i += 1) {
      const d = s[i];
      let l = !1,
        c = -1;
      for (; !l && ++c < jn; ) {
        const g = hn[c];
        let u = g.isMultiMatch(d);
        u && (o.push(new g(u, e)), (l = !0));
      }
      if (!l)
        for (c = -1; ++c < jn; ) {
          const g = hn[c];
          let u = g.isSingleMatch(d);
          if (u) {
            o.push(new g(u, e));
            break;
          }
        }
    }
    return o;
  });
}
const Do = new Set([ms.type, ps.type]);
class Ao {
  constructor(
    e,
    {
      isCaseSensitive: n = I.isCaseSensitive,
      includeMatches: s = I.includeMatches,
      minMatchCharLength: o = I.minMatchCharLength,
      ignoreLocation: i = I.ignoreLocation,
      findAllMatches: r = I.findAllMatches,
      location: d = I.location,
      threshold: l = I.threshold,
      distance: c = I.distance,
    } = {}
  ) {
    (this.query = null),
      (this.options = {
        isCaseSensitive: n,
        includeMatches: s,
        minMatchCharLength: o,
        findAllMatches: r,
        ignoreLocation: i,
        location: d,
        threshold: l,
        distance: c,
      }),
      (this.pattern = n ? e : e.toLowerCase()),
      (this.query = Oo(this.pattern, this.options));
  }
  static condition(e, n) {
    return n.useExtendedSearch;
  }
  searchIn(e) {
    const n = this.query;
    if (!n) return { isMatch: !1, score: 1 };
    const { includeMatches: s, isCaseSensitive: o } = this.options;
    e = o ? e : e.toLowerCase();
    let i = 0,
      r = [],
      d = 0;
    for (let l = 0, c = n.length; l < c; l += 1) {
      const g = n[l];
      (r.length = 0), (i = 0);
      for (let u = 0, m = g.length; u < m; u += 1) {
        const h = g[u],
          { isMatch: f, indices: y, score: T } = h.search(e);
        if (f) {
          if (((i += 1), (d += T), s)) {
            const w = h.constructor.type;
            Do.has(w) ? (r = [...r, ...y]) : r.push(y);
          }
        } else {
          (d = 0), (i = 0), (r.length = 0);
          break;
        }
      }
      if (i) {
        let u = { isMatch: !0, score: d / i };
        return s && (u.indices = r), u;
      }
    }
    return { isMatch: !1, score: 1 };
  }
}
const gn = [];
function Po(...t) {
  gn.push(...t);
}
function mn(t, e) {
  for (let n = 0, s = gn.length; n < s; n += 1) {
    let o = gn[n];
    if (o.condition(t, e)) return new o(t, e);
  }
  return new gs(t, e);
}
const $t = { AND: "$and", OR: "$or" },
  pn = { PATH: "$path", PATTERN: "$val" },
  fn = (t) => !!(t[$t.AND] || t[$t.OR]),
  No = (t) => !!t[pn.PATH],
  Lo = (t) => !Me(t) && ds(t) && !fn(t),
  Bn = (t) => ({ [$t.AND]: Object.keys(t).map((e) => ({ [e]: t[e] })) });
function fs(t, e, { auto: n = !0 } = {}) {
  const s = (o) => {
    let i = Object.keys(o);
    const r = No(o);
    if (!r && i.length > 1 && !fn(o)) return s(Bn(o));
    if (Lo(o)) {
      const l = r ? o[pn.PATH] : i[0],
        c = r ? o[pn.PATTERN] : o[l];
      if (!ye(c)) throw new Error(io(l));
      const g = { keyId: un(l), pattern: c };
      return n && (g.searcher = mn(c, e)), g;
    }
    let d = { children: [], operator: i[0] };
    return (
      i.forEach((l) => {
        const c = o[l];
        Me(c) &&
          c.forEach((g) => {
            d.children.push(s(g));
          });
      }),
      d
    );
  };
  return fn(t) || (t = Bn(t)), s(t);
}
function $o(t, { ignoreFieldNorm: e = I.ignoreFieldNorm }) {
  t.forEach((n) => {
    let s = 1;
    n.matches.forEach(({ key: o, norm: i, score: r }) => {
      const d = o ? o.weight : null;
      s *= Math.pow(r === 0 && d ? Number.EPSILON : r, (d || 1) * (e ? 1 : i));
    }),
      (n.score = s);
  });
}
function Ro(t, e) {
  const n = t.matches;
  (e.matches = []),
    de(n) &&
      n.forEach((s) => {
        if (!de(s.indices) || !s.indices.length) return;
        const { indices: o, value: i } = s;
        let r = { indices: o, value: i };
        s.key && (r.key = s.key.src), s.idx > -1 && (r.refIndex = s.idx), e.matches.push(r);
      });
}
function Fo(t, e) {
  e.score = t.score;
}
function jo(t, e, { includeMatches: n = I.includeMatches, includeScore: s = I.includeScore } = {}) {
  const o = [];
  return (
    n && o.push(Ro),
    s && o.push(Fo),
    t.map((i) => {
      const { idx: r } = i,
        d = { item: e[r], refIndex: r };
      return (
        o.length &&
          o.forEach((l) => {
            l(i, d);
          }),
        d
      );
    })
  );
}
class qe {
  constructor(e, n = {}, s) {
    (this.options = { ...I, ...n }),
      this.options.useExtendedSearch,
      (this._keyStore = new co(this.options.keys)),
      this.setCollection(e, s);
  }
  setCollection(e, n) {
    if (((this._docs = e), n && !(n instanceof Sn))) throw new Error(oo);
    this._myIndex =
      n ||
      hs(this.options.keys, this._docs, { getFn: this.options.getFn, fieldNormWeight: this.options.fieldNormWeight });
  }
  add(e) {
    de(e) && (this._docs.push(e), this._myIndex.add(e));
  }
  remove(e = () => !1) {
    const n = [];
    for (let s = 0, o = this._docs.length; s < o; s += 1) {
      const i = this._docs[s];
      e(i, s) && (this.removeAt(s), (s -= 1), (o -= 1), n.push(i));
    }
    return n;
  }
  removeAt(e) {
    this._docs.splice(e, 1), this._myIndex.removeAt(e);
  }
  getIndex() {
    return this._myIndex;
  }
  search(e, { limit: n = -1 } = {}) {
    const { includeMatches: s, includeScore: o, shouldSort: i, sortFn: r, ignoreFieldNorm: d } = this.options;
    let l = ye(e)
      ? ye(this._docs[0])
        ? this._searchStringList(e)
        : this._searchObjectList(e)
      : this._searchLogical(e);
    return (
      $o(l, { ignoreFieldNorm: d }),
      i && l.sort(r),
      ls(n) && n > -1 && (l = l.slice(0, n)),
      jo(l, this._docs, { includeMatches: s, includeScore: o })
    );
  }
  _searchStringList(e) {
    const n = mn(e, this.options),
      { records: s } = this._myIndex,
      o = [];
    return (
      s.forEach(({ v: i, i: r, n: d }) => {
        if (!de(i)) return;
        const { isMatch: l, score: c, indices: g } = n.searchIn(i);
        l && o.push({ item: i, idx: r, matches: [{ score: c, value: i, norm: d, indices: g }] });
      }),
      o
    );
  }
  _searchLogical(e) {
    const n = fs(e, this.options),
      s = (d, l, c) => {
        if (!d.children) {
          const { keyId: u, searcher: m } = d,
            h = this._findMatches({
              key: this._keyStore.get(u),
              value: this._myIndex.getValueForItemAtKeyId(l, u),
              searcher: m,
            });
          return h && h.length ? [{ idx: c, item: l, matches: h }] : [];
        }
        const g = [];
        for (let u = 0, m = d.children.length; u < m; u += 1) {
          const h = d.children[u],
            f = s(h, l, c);
          if (f.length) g.push(...f);
          else if (d.operator === $t.AND) return [];
        }
        return g;
      },
      o = this._myIndex.records,
      i = {},
      r = [];
    return (
      o.forEach(({ $: d, i: l }) => {
        if (de(d)) {
          let c = s(n, d, l);
          c.length &&
            (i[l] || ((i[l] = { idx: l, item: d, matches: [] }), r.push(i[l])),
            c.forEach(({ matches: g }) => {
              i[l].matches.push(...g);
            }));
        }
      }),
      r
    );
  }
  _searchObjectList(e) {
    const n = mn(e, this.options),
      { keys: s, records: o } = this._myIndex,
      i = [];
    return (
      o.forEach(({ $: r, i: d }) => {
        if (!de(r)) return;
        let l = [];
        s.forEach((c, g) => {
          l.push(...this._findMatches({ key: c, value: r[g], searcher: n }));
        }),
          l.length && i.push({ idx: d, item: r, matches: l });
      }),
      i
    );
  }
  _findMatches({ key: e, value: n, searcher: s }) {
    if (!de(n)) return [];
    let o = [];
    if (Me(n))
      n.forEach(({ v: i, i: r, n: d }) => {
        if (!de(i)) return;
        const { isMatch: l, score: c, indices: g } = s.searchIn(i);
        l && o.push({ score: c, key: e, value: i, idx: r, norm: d, indices: g });
      });
    else {
      const { v: i, n: r } = n,
        { isMatch: d, score: l, indices: c } = s.searchIn(i);
      d && o.push({ score: l, key: e, value: i, norm: r, indices: c });
    }
    return o;
  }
}
qe.version = "6.6.2";
qe.createIndex = hs;
qe.parseIndex = bo;
qe.config = I;
qe.parseQuery = fs;
Po(Ao);
const zn = [
    {
      id: "recentlyUsed",
      name: () => chrome.i18n.getMessage("recentlyUsed"),
      addonIds: [],
      expanded: !0,
      iframeShow: !0,
      fullscreenShow: !1,
    },
    {
      id: "runningOnTab",
      name: () => chrome.i18n.getMessage("runningOnThisPage"),
      addonIds: [],
      expanded: !0,
      iframeShow: !0,
      fullscreenShow: !1,
    },
    { id: "_iframeSearch", name: "", addonIds: [], expanded: !0, iframeShow: !0, fullscreenShow: !1 },
    {
      id: "featuredNew",
      name: () => chrome.i18n.getMessage("featuredNew"),
      addonIds: [],
      expanded: !0,
      iframeShow: !1,
      fullscreenShow: !0,
      customOrder: ["new", "updated"],
    },
    {
      id: "new",
      name: () => chrome.i18n.getMessage("newGroup"),
      addonIds: [],
      get expanded() {
        new URLSearchParams(window.location.search).get("source");
      },
      iframeShow: !1,
      fullscreenShow: !0,
      customOrder: ["new", "updated"],
    },
    {
      id: "enabled",
      name: () => chrome.i18n.getMessage("enabled"),
      addonIds: [],
      expanded: !0,
      iframeShow: !0,
      fullscreenShow: !0,
    },
    {
      id: "recommended",
      name: () => chrome.i18n.getMessage("recommended"),
      addonIds: [],
      expanded: !0,
      iframeShow: !1,
      fullscreenShow: !0,
    },
    {
      id: "featured",
      name: () => chrome.i18n.getMessage("featured"),
      addonIds: [],
      expanded: !0,
      iframeShow: !1,
      fullscreenShow: !0,
    },
    {
      id: "forums",
      name: () => chrome.i18n.getMessage("forums"),
      addonIds: [],
      expanded: !1,
      iframeShow: !1,
      fullscreenShow: !0,
    },
    {
      id: "others",
      name: () => chrome.i18n.getMessage("others"),
      addonIds: [],
      expanded: !0,
      iframeShow: !1,
      fullscreenShow: !0,
    },
    {
      id: "beta",
      name: () => chrome.i18n.getMessage("beta"),
      addonIds: [],
      expanded: !1,
      iframeShow: !1,
      fullscreenShow: !0,
    },
  ],
  Bo = [
    { id: "all", icon: "list", name: chrome.i18n.getMessage("all") },
    { id: "editor", icon: "puzzle", name: chrome.i18n.getMessage("editorFeatures") },
    { id: "codeEditor", parent: "editor", icon: "code", name: chrome.i18n.getMessage("codeEditorFeatures") },
    { id: "costumeEditor", parent: "editor", icon: "brush2", name: chrome.i18n.getMessage("costumeEditorFeatures") },
    { id: "projectPlayer", parent: "editor", icon: "player", name: chrome.i18n.getMessage("projectPlayerFeatures") },
    { id: "editorOthers", parent: "editor", icon: "dots", name: chrome.i18n.getMessage("others") },
    { id: "community", icon: "web", name: chrome.i18n.getMessage("websiteFeatures") },
    {
      id: "projectPage",
      parent: "community",
      icon: "projectpage",
      name: chrome.i18n.getMessage("projectPageFeatures"),
    },
    { id: "profiles", parent: "community", icon: "users", name: chrome.i18n.getMessage("profilesFeatures") },
    { id: "forums", parent: "community", icon: "forum", name: chrome.i18n.getMessage("forums") },
    { id: "communityOthers", parent: "community", icon: "dots", name: chrome.i18n.getMessage("others") },
    { id: "theme", icon: "brush", name: chrome.i18n.getMessage("themes") },
    { id: "themesForEditor", parent: "theme", icon: "puzzle", name: chrome.i18n.getMessage("editorThemes") },
    { id: "themesForWebsite", parent: "theme", icon: "web", name: chrome.i18n.getMessage("websiteThemes") },
    { id: "popup", icon: "popup", name: chrome.i18n.getMessage("popupFeatures"), marginBottom: !0 },
  ],
  zo = {
    name: "",
    description: "",
    tags: [],
    _categories: ["editor"],
    _icon: "editor",
    _displayedAddonId: "",
    _enabled: !0,
    _addonId: "example",
    _groups: ["enabled"],
  },
  vs = [
    { name: "danger", tooltipText: "dangerTooltip", matchName: "danger", color: "darkred", iframeAlwaysShow: !0 },
    { name: "recommended", tooltipText: "recommendedTooltip", matchName: "recommended", color: "blue" },
    { name: "new", matchName: "new", color: "purple" },
    { name: "updated", matchName: "updated", color: "purple" },
    { name: "updatedWithSettings", matchName: "updatedWithSettings", color: "purple" },
    { name: "beta", tooltipText: "betaTooltip", matchName: "beta", color: "red", iframeAlwaysShow: !0 },
    { name: "forums", tooltipText: "forumsTooltip", matchName: "forums", color: "green" },
    { name: "forEditor", matchName: "editor", color: "darkgreen", addonTabShow: { theme: !0 } },
    { name: "forWebsite", matchName: "community", color: "yellow", addonTabShow: { theme: !0 } },
  ],
  Ho = {
    includeScore: !0,
    threshold: 0.35,
    ignoreLocation: !0,
    useExtendedSearch: !0,
    keys: [
      { name: "name", weight: 1 },
      { name: "_addonId", weight: 1 },
      { name: "description", weight: 0.5 },
      { name: "_english.name", weight: 0.8 },
      { name: "_english.description", weight: 0.3 },
      { name: "credits.name", weight: 0.2 },
      { name: "info.text", weight: 0.1 },
    ],
  },
  Hn = [];
function Uo(t) {
  const e = t.split("-")[0];
  return Hn.includes(t) || Hn.includes(e) ? "rtl" : "ltr";
}
function Wo(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var En = { exports: {} };
function kn() {}
kn.prototype = {
  on: function (t, e, n) {
    var s = this.e || (this.e = {});
    return (s[t] || (s[t] = [])).push({ fn: e, ctx: n }), this;
  },
  once: function (t, e, n) {
    var s = this;
    function o() {
      s.off(t, o), e.apply(n, arguments);
    }
    return (o._ = e), this.on(t, o, n);
  },
  emit: function (t) {
    var e = [].slice.call(arguments, 1),
      n = ((this.e || (this.e = {}))[t] || []).slice(),
      s = 0,
      o = n.length;
    for (s; s < o; s++) n[s].fn.apply(n[s].ctx, e);
    return this;
  },
  off: function (t, e) {
    var n = this.e || (this.e = {}),
      s = n[t],
      o = [];
    if (s && e) for (var i = 0, r = s.length; i < r; i++) s[i].fn !== e && s[i].fn._ !== e && o.push(s[i]);
    return o.length ? (n[t] = o) : delete n[t], this;
  },
};
En.exports = kn;
En.exports.TinyEmitter = kn;
var Go = En.exports,
  Yo = Go,
  Xo = new Yo();
const bt = Wo(Xo),
  ht = {
    $on: (...t) => bt.on(...t),
    $once: (...t) => bt.once(...t),
    $off: (...t) => bt.off(...t),
    $emit: (...t) => bt.emit(...t),
  },
  Vo = (t, e) =>
    new Promise((n) => {
      chrome.tabs.query({ currentWindow: !0, active: !0 }, (s) => {
        s[0].id &&
          chrome.tabs.sendMessage(s[0].id, "getRunningAddons", { frameId: 0 }, (o) => {
            chrome.runtime.lastError;
            const i = o ? [...o.userscripts, ...o.userstyles] : [],
              r = o ? o.disabledDynamicAddons : [];
            n({ addonsCurrentlyOnTab: i, addonsPreviouslyOnTab: r });
          });
      });
    }),
  Ko = async (t, e, n) => {
    const s = JSON.parse(t),
      o = promisify(chrome.storage.sync.get.bind(chrome.storage.sync)),
      i = promisify(chrome.storage.sync.set.bind(chrome.storage.sync)),
      { addonSettings: r, addonsEnabled: d } = await o(["addonSettings", "addonsEnabled"]),
      l = {};
    for (const u of Object.keys(s.addons)) {
      const m = s.addons[u],
        h = e.find((T) => T._addonId === u);
      if (!h) continue;
      const y = (h.permissions || []).filter((T) => browserLevelPermissions.includes(T));
      m.enabled && y.length ? (l[u] = y) : (d[u] = m.enabled),
        (r[u] = Object.assign({}, r[u])),
        delete r[u]._version,
        Object.assign(r[u], m.settings);
    }
    handleConfirmClicked && n.removeEventListener("click", handleConfirmClicked, { once: !0 });
    let c = null;
    const g = new Promise((u) => {
      c = u;
    });
    return (
      (handleConfirmClicked = async () => {
        if (((handleConfirmClicked = null), Object.keys(l).length)) {
          const m = await promisify(chrome.permissions.request.bind(chrome.permissions))({
            permissions: Object.values(l).flat(),
          });
          Object.keys(l).forEach((h) => {
            d[h] = m;
          });
        }
        const u = chrome.runtime.getManifest().version_name.endsWith("-prerelease");
        await i({ globalTheme: !!s.core.lightTheme, addonsEnabled: d, addonSettings: minifySettings(r, u ? null : e) }),
          c();
      }),
      n.classList.remove("hidden-button"),
      n.addEventListener("click", handleConfirmClicked, { once: !0 }),
      g
    );
  },
  Un = async () => {
    const e = await promisify(chrome.storage.sync.get.bind(chrome.storage.sync))([
        "globalTheme",
        "addonSettings",
        "addonsEnabled",
      ]),
      n = { core: { lightTheme: e.globalTheme, version: chrome.runtime.getManifest().version_name }, addons: {} };
    for (const s of Object.keys(e.addonsEnabled))
      n.addons[s] = { enabled: e.addonsEnabled[s], settings: e.addonSettings[s] || {} };
    return JSON.stringify(n);
  },
  bs = "/webpagesish/dist/assets/close-79332d50.svg";
const Jo = {
    props: ["isOpen", "title"],
    data() {
      return { canCloseOutside: !1 };
    },
    watch: {
      isOpen(t) {
        t
          ? setTimeout(() => {
              this.canCloseOutside = !0;
            }, 100)
          : (this.canCloseOutside = !1);
      },
    },
    methods: {
      msg(...t) {
        return this.$root.msg(...t);
      },
      clickOutside(t) {
        this.isOpen && this.canCloseOutside && t.isTrusted && (this.isOpen = !1);
      },
    },
  },
  qo = { class: "modal" },
  Qo = { class: "modal-content" },
  Zo = ["title"];
function ei(t, e, n, s, o, i) {
  const r = Nt("click-outside");
  return F(
    (p(),
    v(
      "div",
      qo,
      [
        F(
          (p(),
          v("div", Qo, [
            a("div", null, [
              a(
                "img",
                { onClick: e[0] || (e[0] = (d) => (n.isOpen = !1)), class: "close", title: i.msg("close"), src: bs },
                null,
                8,
                Zo
              ),
              a("h1", null, S(n.title), 1),
            ]),
            tt(t.$slots, "default"),
          ])),
          [[r, i.clickOutside]]
        ),
      ],
      512
    )),
    [[Z, n.isOpen]]
  );
}
const ti = xe(Jo, [["render", ei]]);
function je(t, e, n) {
  return Math.max(e, Math.min(t, n));
}
function se(t, e = 2) {
  return t.toFixed(e).replace(/\.?0+$/, "");
}
function Wn(t) {
  return t.endsWith(".") ? NaN : (((parseFloat(t) % 360) + 360) % 360) / 360;
}
function Gn(t) {
  return se(360 * t);
}
function Xe(t) {
  if (!t.endsWith("%")) return NaN;
  const e = t.substring(0, t.length - 1);
  if (e.endsWith(".")) return NaN;
  const n = parseFloat(e);
  return Number.isNaN(n) ? NaN : je(n, 0, 100) / 100;
}
function yt(t) {
  return se(100 * t) + "%";
}
function Gt(t) {
  if (t.endsWith("%")) return Xe(t);
  if (t.endsWith(".")) return NaN;
  const e = parseFloat(t);
  return Number.isNaN(e) ? NaN : je(e, 0, 255) / 255;
}
function Yt(t) {
  return se(255 * t);
}
function Xt(t) {
  return t.endsWith("%") ? Xe(t) : je(parseFloat(t), 0, 1);
}
function Vt(t) {
  return String(t);
}
const vn = {
  hsl: { h: { to: Gn, from: Wn }, s: { to: yt, from: Xe }, l: { to: yt, from: Xe }, a: { to: Vt, from: Xt } },
  hwb: { h: { to: Gn, from: Wn }, w: { to: yt, from: Xe }, b: { to: yt, from: Xe }, a: { to: Vt, from: Xt } },
  rgb: { r: { to: Yt, from: Gt }, g: { to: Yt, from: Gt }, b: { to: Yt, from: Gt }, a: { to: Vt, from: Xt } },
};
function wt(t) {
  const e = t.replace(/^#/, ""),
    n = [],
    s = e.length > 4 ? 2 : 1;
  for (let i = 0; i < e.length; i += s) {
    const r = e.slice(i, i + s);
    n.push(r.repeat((s % 2) + 1));
  }
  n.length === 3 && n.push("ff");
  const o = n.map((i) => parseInt(i, 16) / 255);
  return { r: o[0], g: o[1], b: o[2], a: o[3] };
}
function Kt(t) {
  const e = t.l < 0.5 ? t.l * (1 + t.s) : t.l + t.s - t.l * t.s,
    n = 2 * t.l - e;
  return { r: Jt(n, e, t.h + 1 / 3), g: Jt(n, e, t.h), b: Jt(n, e, t.h - 1 / 3), a: t.a };
}
function Jt(t, e, n) {
  return (
    n < 0 ? (n += 1) : n > 1 && (n -= 1),
    n < 1 / 6 ? t + 6 * (e - t) * n : n < 0.5 ? e : n < 2 / 3 ? t + (e - t) * (2 / 3 - n) * 6 : t
  );
}
function Ze(t) {
  return { r: qt(5, t), g: qt(3, t), b: qt(1, t), a: t.a };
}
function qt(t, e) {
  const n = (t + 6 * e.h) % 6;
  return e.v - e.v * e.s * Math.max(0, Math.min(n, 4 - n, 1));
}
function ze(t) {
  return { h: t.h, s: t.b === 1 ? 0 : 1 - t.w / (1 - t.b), v: 1 - t.b, a: t.a };
}
function We(t) {
  const e = Math.min(t.r, t.g, t.b),
    n = Math.max(t.r, t.g, t.b);
  let s;
  return (
    (s =
      n === e
        ? 0
        : n === t.r
        ? (0 + (t.g - t.b) / (n - e)) / 6
        : n === t.g
        ? (2 + (t.b - t.r) / (n - e)) / 6
        : (4 + (t.r - t.g) / (n - e)) / 6),
    s < 0 && (s += 1),
    { h: s, w: e, b: 1 - n, a: t.a }
  );
}
function Qt(t) {
  const e = We(t),
    n = e.w,
    s = 1 - e.b,
    o = (s + n) / 2;
  let i;
  return (i = s === 0 || n === 1 ? 0 : (s - o) / Math.min(o, 1 - o)), { h: e.h, s: i, l: o, a: t.a };
}
function _t(t) {
  return (
    "#" +
    Object.values(t)
      .map((e) => {
        const n = 255 * e,
          s = Math.round(n).toString(16);
        return s.length === 1 ? "0" + s : s;
      })
      .join("")
  );
}
const ni = {
  hex: [
    ["hsl", (t) => fe(t, [wt, Qt])],
    ["hsv", (t) => fe(t, [wt, We, ze])],
    ["hwb", (t) => fe(t, [wt, We])],
    ["rgb", wt],
  ],
  hsl: [
    ["hex", (t) => fe(t, [Kt, _t])],
    [
      "hsv",
      function (t) {
        const e = t.l + t.s * Math.min(t.l, 1 - t.l),
          n = e === 0 ? 0 : 2 - (2 * t.l) / e;
        return { h: t.h, s: n, v: e, a: t.a };
      },
    ],
    ["hwb", (t) => fe(t, [Kt, We])],
    ["rgb", Kt],
  ],
  hsv: [
    ["hex", (t) => fe(t, [Ze, _t])],
    [
      "hsl",
      function (t) {
        const e = t.v - (t.v * t.s) / 2,
          n = Math.min(e, 1 - e),
          s = n === 0 ? 0 : (t.v - e) / n;
        return { h: t.h, s, l: e, a: t.a };
      },
    ],
    [
      "hwb",
      function (t) {
        return { h: t.h, w: (1 - t.s) * t.v, b: 1 - t.v, a: t.a };
      },
    ],
    ["rgb", Ze],
  ],
  hwb: [
    ["hex", (t) => fe(t, [ze, Ze, _t])],
    ["hsl", (t) => fe(t, [ze, Ze, Qt])],
    ["hsv", ze],
    ["rgb", (t) => fe(t, [ze, Ze])],
  ],
  rgb: [
    ["hex", _t],
    ["hsl", Qt],
    ["hsv", (t) => fe(t, [We, ze])],
    ["hwb", We],
  ],
};
function fe(t, e) {
  return e.reduce((n, s) => s(n), t);
}
function xt(t) {
  const e = {};
  for (const n in t) e[n] = t[n];
  return e;
}
const si = {
  hex: (t, e) => (e && [5, 9].includes(t.length) ? t.substring(0, t.length - (t.length - 1) / 4) : t),
  hsl: (t, e) => `hsl(${se(360 * t.h)} ${se(100 * t.s)}% ${se(100 * t.l)}%` + (e ? ")" : ` / ${se(t.a)})`),
  hwb: (t, e) => `hwb(${se(360 * t.h)} ${se(100 * t.w)}% ${se(100 * t.b)}%` + (e ? ")" : ` / ${se(t.a)})`),
  rgb: (t, e) => `rgb(${se(255 * t.r)} ${se(255 * t.g)} ${se(255 * t.b)}` + (e ? ")" : ` / ${se(t.a)})`),
};
function Yn(t, e, n) {
  return si[e](t, n);
}
function ys(t) {
  return /^#(?:(?:[A-F0-9]{2}){3,4}|[A-F0-9]{3,4})$/i.test(t);
}
function oi(t) {
  if (typeof t != "string")
    return {
      format: (function (l) {
        return Object.prototype.hasOwnProperty.call(l, "r")
          ? "rgb"
          : Object.prototype.hasOwnProperty.call(l, "w")
          ? "hwb"
          : Object.prototype.hasOwnProperty.call(l, "v")
          ? "hsv"
          : "hsl";
      })(t),
      color: t,
    };
  if (ys(t)) return { format: "hex", color: t };
  if (!t.includes("(")) {
    const d = document.createElement("canvas").getContext("2d");
    d.fillStyle = t;
    const l = d.fillStyle;
    return l === "#000000" && t !== "black" ? null : { format: "hex", color: l };
  }
  const [e, n] = t.split("("),
    s = e.substring(0, 3),
    o = n.replace(/[,/)]/g, " ").replace(/\s+/g, " ").trim().split(" ");
  o.length === 3 && o.push("1");
  const i = (s + "a").split(""),
    r = Object.fromEntries(i.map((d, l) => [d, vn[s][d].from(o[l])]));
  return { format: s, color: r };
}
const Zt = ["hex", "hsl", "hwb", "rgb"],
  ii = ["show", "hide"],
  ri = { class: "vacp-range-input-group" },
  ai = ["for"],
  li = { class: "vacp-range-input-label-text vacp-range-input-label-text--hue" },
  di = ["id", "value"],
  ci = ["for"],
  ui = { class: "vacp-range-input-label-text vacp-range-input-label-text--alpha" },
  hi = ["id", "value"],
  gi = a("span", { class: "vacp-visually-hidden" }, "Copy color", -1),
  mi = a(
    "svg",
    {
      class: "vacp-icon",
      xmlns: "http://www.w3.org/2000/svg",
      "aria-hidden": "true",
      width: "24",
      height: "24",
      viewBox: "0 0 32 32",
    },
    [
      a("path", {
        d: "M25.313 28v-18.688h-14.625v18.688h14.625zM25.313 6.688c1.438 0 2.688 1.188 2.688 2.625v18.688c0 1.438-1.25 2.688-2.688 2.688h-14.625c-1.438 0-2.688-1.25-2.688-2.688v-18.688c0-1.438 1.25-2.625 2.688-2.625h14.625zM21.313 1.313v2.688h-16v18.688h-2.625v-18.688c0-1.438 1.188-2.688 2.625-2.688h16z",
        fill: "currentColor",
      }),
    ],
    -1
  ),
  pi = { class: "vacp-color-inputs" },
  fi = { class: "vacp-color-input-group" },
  vi = ["for"],
  bi = a("span", { class: "vacp-color-input-label-text" }, " Hex ", -1),
  yi = ["id", "value"],
  wi = ["id", "for", "onInput"],
  _i = { class: "vacp-color-input-label-text" },
  xi = ["id", "value", "onInput"],
  Si = a("span", { class: "vacp-visually-hidden" }, "Switch format", -1),
  Ei = a(
    "svg",
    { class: "vacp-icon", "aria-hidden": "true", xmlns: "http://www.w3.org/2000/svg", width: "16", height: "15" },
    [a("path", { d: "M8 15l5-5-1-1-4 2-4-2-1 1zm4-9l1-1-5-5-5 5 1 1 4-2z", fill: "currentColor" })],
    -1
  );
var ws = {
  __name: "ColorPicker",
  props: {
    color: { type: [String, Object], default: "#ffffffff" },
    id: { type: String, default: "color-picker" },
    visibleFormats: {
      type: Array,
      default: () => Zt,
      validator: (t) => t.length > 0 && t.every((e) => Zt.includes(e)),
    },
    defaultFormat: { type: String, default: "hsl", validator: (t) => Zt.includes(t) },
    alphaChannel: { type: String, default: "show", validator: (t) => ii.includes(t) },
  },
  emits: ["color-change"],
  setup(t, { emit: e }) {
    const n = t,
      s = Qe(null),
      o = Qe(null),
      i = Qe(null),
      r = Qe(!1),
      d = Qe(n.visibleFormats.includes(n.defaultFormat) ? n.defaultFormat : n.visibleFormats[0]),
      l = Gs({
        hex: "#ffffffff",
        hsl: { h: 0, s: 0, l: 1, a: 1 },
        hsv: { h: 0, s: 0, v: 1, a: 1 },
        hwb: { h: 0, w: 1, b: 0, a: 1 },
        rgb: { r: 1, g: 1, b: 1, a: 1 },
      }),
      c = Pn(function () {
        const _ = Object.keys(l[d.value]);
        return d.value !== "hex" && n.alphaChannel === "hide" ? _.slice(0, 3) : _;
      }),
      g = Pn(function () {
        return n.alphaChannel === "hide" && [5, 9].includes(l.hex.length)
          ? l.hex.substring(0, l.hex.length - (l.hex.length - 1) / 4)
          : l.hex;
      });
    function u() {
      const _ = (n.visibleFormats.findIndex((x) => x === d.value) + 1) % n.visibleFormats.length;
      d.value = n.visibleFormats[_];
    }
    function m(_) {
      (r.value = !0), y(_);
    }
    function h(_) {
      (r.value = !0), T(_);
    }
    function f() {
      r.value = !1;
    }
    function y(_) {
      _.buttons === 1 && r.value !== !1 && o.value instanceof HTMLElement && w(o.value, _.clientX, _.clientY);
    }
    function T(_) {
      if (r.value === !1 || !(o.value instanceof HTMLElement)) return;
      _.preventDefault();
      const x = _.touches[0];
      w(o.value, x.clientX, x.clientY);
    }
    function w(_, x, C) {
      const M = (function (W, Oe, Se) {
          const Be = W.getBoundingClientRect(),
            An = Oe - Be.left,
            ft = Se - Be.top;
          return { x: je(An / Be.width, 0, 1), y: je(1 - ft / Be.height, 0, 1) };
        })(_, x, C),
        L = xt(l.hsv);
      (L.s = M.x), (L.v = M.y), j("hsv", L);
    }
    function O(_) {
      if (!["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"].includes(_.key)) return;
      _.preventDefault();
      const x = ["ArrowLeft", "ArrowDown"].includes(_.key) ? -1 : 1,
        C = ["ArrowLeft", "ArrowRight"].includes(_.key) ? "s" : "v",
        M = _.shiftKey ? 10 : 1,
        L = l.hsv[C] + x * M * 0.01,
        W = xt(l.hsv);
      (W[C] = je(L, 0, 1)), j("hsv", W);
    }
    function A(_) {
      const x = oi(_);
      x !== null && j(x.format, x.color);
    }
    function R(_, x) {
      const C = _.currentTarget,
        M = xt(l.hsv);
      (M[x] = parseInt(C.value) / parseInt(C.max)), j("hsv", M);
    }
    function X(_) {
      const x = _.target;
      ys(x.value) && j("hex", x.value);
    }
    function J(_, x) {
      const C = _.target,
        M = xt(l[d.value]),
        L = vn[d.value][x].from(C.value);
      Number.isNaN(L) || L === void 0 || ((M[x] = L), j(d.value, M));
    }
    function j(_, x) {
      let C = x;
      if (n.alphaChannel === "hide")
        if (typeof x != "string") (x.a = 1), (C = x);
        else if ([5, 9].includes(x.length)) {
          const M = (x.length - 1) / 4;
          C = x.substring(0, x.length - M) + "f".repeat(M);
        } else [4, 7].includes(x.length) && (C = x + "f".repeat((x.length - 1) / 3));
      if (
        !(function (M, L) {
          if (typeof M == "string" || typeof L == "string") return M === L;
          for (const W in M) if (M[W] !== L[W]) return !1;
          return !0;
        })(l[_], C)
      ) {
        (function (L, W) {
          l[L] = W;
          for (const [Oe, Se] of ni[L]) l[Oe] = Se(l[L]);
        })(_, C);
        const M = (function () {
          const L = n.alphaChannel === "hide",
            W = Yn(l[d.value], d.value, L);
          return { colors: l, cssColor: W };
        })();
        e("color-change", M);
      }
      (function () {
        s.value instanceof HTMLElement &&
          o.value instanceof HTMLElement &&
          i.value instanceof HTMLElement &&
          (s.value.style.setProperty("--vacp-hsl-h", String(l.hsl.h)),
          s.value.style.setProperty("--vacp-hsl-s", String(l.hsl.s)),
          s.value.style.setProperty("--vacp-hsl-l", String(l.hsl.l)),
          s.value.style.setProperty("--vacp-hsl-a", String(l.hsl.a)),
          (o.value.style.position = "relative"),
          (o.value.style.backgroundColor = "hsl(calc(var(--vacp-hsl-h) * 360) 100% 50%)"),
          (o.value.style.backgroundImage =
            "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)"),
          (i.value.style.boxSizing = "border-box"),
          (i.value.style.position = "absolute"),
          (i.value.style.left = 100 * l.hsv.s + "%"),
          (i.value.style.bottom = 100 * l.hsv.v + "%"));
      })();
    }
    async function ee() {
      const _ = l[d.value],
        x = n.alphaChannel === "hide",
        C = Yn(_, d.value, x);
      await window.navigator.clipboard.writeText(C);
    }
    function H(_, x) {
      return vn[_][x].to(l[_][x]);
    }
    function he(_) {
      if (!["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"].includes(_.key) || !_.shiftKey) return;
      const x = _.currentTarget,
        C = parseFloat(x.step),
        M = ["ArrowLeft", "ArrowDown"].includes(_.key) ? -1 : 1,
        L = je(parseFloat(x.value) + M * C * 10, parseInt(x.min), parseInt(x.max));
      x.value = String(L - M * C);
    }
    return (
      Ys(() => n.color, A),
      Xs(function () {
        document.addEventListener("mousemove", y, { passive: !1 }),
          document.addEventListener("touchmove", T, { passive: !1 }),
          document.addEventListener("mouseup", f),
          document.addEventListener("touchend", f),
          A(n.color);
      }),
      Vs(function () {
        document.removeEventListener("mousemove", y),
          document.removeEventListener("touchmove", T),
          document.removeEventListener("mouseup", f),
          document.removeEventListener("touchend", f);
      }),
      (_, x) => (
        p(),
        v(
          "div",
          { ref_key: "colorPicker", ref: s, class: "vacp-color-picker" },
          [
            a(
              "div",
              { ref_key: "colorSpace", ref: o, class: "vacp-color-space", onMousedown: m, onTouchstart: h },
              [
                a(
                  "div",
                  {
                    ref_key: "thumb",
                    ref: i,
                    class: "vacp-color-space-thumb",
                    tabindex: "0",
                    "aria-label": "Color space thumb",
                    onKeydown: O,
                  },
                  null,
                  544
                ),
              ],
              544
            ),
            a("div", ri, [
              a(
                "label",
                { class: "vacp-range-input-label vacp-range-input-label--hue", for: `${t.id}-hue-slider` },
                [
                  a("span", li, [tt(_.$slots, "hue-range-input-label", {}, () => [le("Hue")])]),
                  a(
                    "input",
                    {
                      id: `${t.id}-hue-slider`,
                      class: "vacp-range-input vacp-range-input--hue",
                      value: 360 * l.hsv.h,
                      type: "range",
                      min: "0",
                      max: "360",
                      step: "1",
                      onKeydownPassive: he,
                      onInput: x[0] || (x[0] = (C) => R(C, "h")),
                    },
                    null,
                    40,
                    di
                  ),
                ],
                8,
                ai
              ),
              t.alphaChannel === "show"
                ? (p(),
                  v(
                    "label",
                    {
                      key: 0,
                      class: "vacp-range-input-label vacp-range-input-label--alpha",
                      for: `${t.id}-alpha-slider`,
                    },
                    [
                      a("span", ui, [tt(_.$slots, "alpha-range-input-label", {}, () => [le("Alpha")])]),
                      a(
                        "input",
                        {
                          id: `${t.id}-alpha-slider`,
                          class: "vacp-range-input vacp-range-input--alpha",
                          value: 100 * l.hsv.a,
                          type: "range",
                          min: "0",
                          max: "100",
                          step: "1",
                          onKeydownPassive: he,
                          onInput: x[1] || (x[1] = (C) => R(C, "a")),
                        },
                        null,
                        40,
                        hi
                      ),
                    ],
                    8,
                    ci
                  ))
                : P("v-if", !0),
            ]),
            a("button", { class: "vacp-copy-button", type: "button", onClick: ee }, [
              tt(_.$slots, "copy-button", {}, () => [gi, mi]),
            ]),
            a("div", pi, [
              a("div", fi, [
                d.value === "hex"
                  ? (p(),
                    v(
                      "label",
                      { key: 0, class: "vacp-color-input-label", for: `${t.id}-color-hex` },
                      [
                        bi,
                        a(
                          "input",
                          {
                            id: `${t.id}-color-hex`,
                            class: "vacp-color-input",
                            type: "text",
                            value: Nn(g),
                            onInput: X,
                          },
                          null,
                          40,
                          yi
                        ),
                      ],
                      8,
                      vi
                    ))
                  : (p(!0),
                    v(
                      z,
                      { key: 1 },
                      K(
                        Nn(c),
                        (C) => (
                          p(),
                          v(
                            "label",
                            {
                              id: `${t.id}-color-${d.value}-${C}-label`,
                              key: `${t.id}-color-${d.value}-${C}-label`,
                              class: "vacp-color-input-label",
                              for: `${t.id}-color-${d.value}-${C}`,
                              onInput: (M) => J(M, C),
                            },
                            [
                              a("span", _i, S(C.toUpperCase()), 1),
                              a(
                                "input",
                                {
                                  id: `${t.id}-color-${d.value}-${C}`,
                                  class: "vacp-color-input",
                                  type: "text",
                                  value: H(d.value, C),
                                  onInput: (M) => J(M, C),
                                },
                                null,
                                40,
                                xi
                              ),
                            ],
                            40,
                            wi
                          )
                        )
                      ),
                      128
                    )),
              ]),
              t.visibleFormats.length > 1
                ? (p(),
                  v("button", { key: 0, class: "vacp-format-switch-button", type: "button", onClick: u }, [
                    tt(_.$slots, "format-switch-button", {}, () => [Si, Ei]),
                  ]))
                : P("v-if", !0),
            ]),
          ],
          512
        )
      )
    );
  },
};
(function (t, e) {
  e === void 0 && (e = {});
  var n = e.insertAt;
  if (t && typeof document < "u") {
    var s = document.head || document.getElementsByTagName("head")[0],
      o = document.createElement("style");
    (o.type = "text/css"),
      n === "top" && s.firstChild ? s.insertBefore(o, s.firstChild) : s.appendChild(o),
      o.styleSheet ? (o.styleSheet.cssText = t) : o.appendChild(document.createTextNode(t));
  }
})(
  ".vacp-color-picker{--vacp-color:hsl(calc(var(--vacp-hsl-h)*360) calc(var(--vacp-hsl-s)*100%) calc(var(--vacp-hsl-l)*100%)/var(--vacp-hsl-a));--vacp-focus-color:#19f;--vacp-focus-outline:2px solid var(--vacp-focus-color);--vacp-border-width:1px;--vacp-border-color:#000;--vacp-border:var(--vacp-border-width) solid var(--vacp-border-color);--vacp-color-space-width:300px;--vacp-spacing:6px;grid-gap:var(--vacp-spacing);background-color:#fff;display:grid;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol;font-size:.8em;grid-template-columns:1fr min-content;max-width:var(--vacp-color-space-width);padding:var(--vacp-spacing)}.vacp-color-picker *,.vacp-color-picker :after,.vacp-color-picker :before{box-sizing:border-box}.vacp-color-picker button::-moz-focus-inner{border:none;padding:0}.vacp-color-picker :focus{outline:var(--vacp-focus-outline)}.vacp-color-space{grid-column:1/-1;height:calc(var(--vacp-color-space-width)*.6);overflow:hidden}.vacp-color-space-thumb{--vacp-thumb-size:calc(var(--vacp-spacing)*4);border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 var(--vacp-border-width) var(--vacp-border-color);height:var(--vacp-thumb-size);margin-bottom:calc(var(--vacp-thumb-size)*-1/2);margin-left:calc(var(--vacp-thumb-size)*-1/2);width:var(--vacp-thumb-size)}.vacp-color-space-thumb:focus{box-shadow:0 0 0 var(--vacp-border-width) var(--vacp-border-color),0 0 0 3px var(--vacp-focus-color);outline-color:transparent}.vacp-range-input-label{--vacp-slider-track-width:100%;--vacp-slider-track-height:calc(var(--vacp-spacing)*3);display:block}.vacp-range-input-group{display:flex;flex-direction:column;justify-content:center}.vacp-range-input-group>:not(:first-child){margin-top:var(--vacp-spacing)}.vacp-range-input,.vacp-range-input::-webkit-slider-thumb{-webkit-appearance:none}.vacp-range-input{background:none;border:none;display:block;height:var(--vacp-slider-track-height);margin-bottom:calc(var(--vacp-spacing)/2 + 1px);margin-left:0;margin-right:0;margin-top:calc(var(--vacp-spacing)/2 + 1px);padding:0;width:var(--vacp-slider-track-width)}.vacp-range-input:focus{outline:none}.vacp-range-input::-moz-focus-outer{border:none}.vacp-range-input--alpha{background-color:#fff;background-image:linear-gradient(45deg,#eee 25%,transparent 0,transparent 75%,#eee 0,#eee),linear-gradient(45deg,#eee 25%,transparent 0,transparent 75%,#eee 0,#eee);background-position:0 0,var(--vacp-spacing) var(--vacp-spacing);background-size:calc(var(--vacp-spacing)*2) calc(var(--vacp-spacing)*2)}.vacp-range-input::-moz-range-track{border:var(--vacp-border);box-sizing:content-box;height:var(--vacp-slider-track-height);width:var(--vacp-slider-track-width)}.vacp-range-input::-webkit-slider-runnable-track{border:var(--vacp-border);box-sizing:content-box;height:var(--vacp-slider-track-height);width:var(--vacp-slider-track-width)}.vacp-range-input::-ms-track{border:var(--vacp-border);box-sizing:content-box;height:var(--vacp-slider-track-height);width:var(--vacp-slider-track-width)}.vacp-range-input:focus::-moz-range-track{outline:var(--vacp-focus-outline)}.vacp-range-input:focus::-webkit-slider-runnable-track{outline:var(--vacp-focus-outline)}.vacp-range-input:focus::-ms-track{outline:var(--vacp-focus-outline)}.vacp-range-input--alpha::-moz-range-track{background-image:linear-gradient(to right,transparent,var(--vacp-color))}.vacp-range-input--alpha::-webkit-slider-runnable-track{background-image:linear-gradient(to right,transparent,var(--vacp-color))}.vacp-range-input--alpha::-ms-track{background-image:linear-gradient(to right,transparent,var(--vacp-color))}.vacp-range-input--hue::-moz-range-track{background-image:linear-gradient(90deg,red 0,#ff0 16.66667%,#0f0 33.33333%,#0ff 50%,#00f 66.66667%,#f0f 83.33333%,red 100%)}.vacp-range-input--hue::-webkit-slider-runnable-track{background-image:linear-gradient(90deg,red 0,#ff0 16.66667%,#0f0 33.33333%,#0ff 50%,#00f 66.66667%,#f0f 83.33333%,red 100%)}.vacp-range-input--hue::-ms-track{background-image:linear-gradient(90deg,red 0,#ff0 16.66667%,#0f0 33.33333%,#0ff 50%,#00f 66.66667%,#f0f 83.33333%,red 100%)}.vacp-range-input::-moz-range-thumb{background-color:transparent;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 var(--vacp-border-width) var(--vacp-border-color);box-sizing:content-box;height:var(--vacp-slider-track-height);isolation:isolate;width:var(--vacp-slider-track-height)}.vacp-range-input::-webkit-slider-thumb{background-color:transparent;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 var(--vacp-border-width) var(--vacp-border-color);box-sizing:content-box;height:var(--vacp-slider-track-height);isolation:isolate;margin-top:calc((var(--vacp-spacing)/2)*-1);width:var(--vacp-slider-track-height)}.vacp-range-input::-ms-thumb{background-color:transparent;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 var(--vacp-border-width) var(--vacp-border-color);box-sizing:content-box;height:var(--vacp-slider-track-height);isolation:isolate;margin-top:calc((var(--vacp-spacing)/2)*-1);width:var(--vacp-slider-track-height)}.vacp-copy-button{align-items:center;align-self:center;background-color:#fff;border:var(--vacp-border-width) solid transparent;border-radius:50%;display:flex;height:calc(var(--vacp-spacing)*6);justify-content:center;justify-self:center;overflow:hidden;position:relative;width:calc(var(--vacp-spacing)*6)}.vacp-copy-button:enabled:focus{border-color:var(--vacp-border-color);box-shadow:0 0 0 2px var(--vacp-focus-color);outline:none}.vacp-copy-button:enabled:hover{background-color:#0002}.vacp-color-inputs{align-items:center;display:flex;grid-column:1/-1}.vacp-color-inputs>:not(:first-child){margin-left:var(--vacp-spacing)}.vacp-color-input-group{column-gap:var(--vacp-spacing);display:grid;flex-grow:1;grid-auto-flow:column}.vacp-color-input-label{text-align:center}.vacp-color-input{border:var(--vacp-border);margin:0;margin-top:calc(var(--vacp-spacing)/2);text-align:center;width:100%}.vacp-color-input,.vacp-format-switch-button{background-color:#fff;color:inherit;font:inherit;padding:var(--vacp-spacing)}.vacp-format-switch-button{align-items:center;border:var(--vacp-border-width) solid transparent;border-radius:50%;display:flex;justify-content:center;margin:0}.vacp-format-switch-button:enabled:focus{border-color:var(--vacp-border-color)}.vacp-format-switch-button:enabled:hover{background-color:#0002}.vacp-visually-hidden{clip:rect(0 0 0 0);border:0;height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;white-space:nowrap;width:1px}"
),
  (ws.__file = "src/ColorPicker.vue");
function ki(t, e, n) {
  var s, o, i, r, d;
  e == null && (e = 100);
  function l() {
    var g = Date.now() - r;
    g < e && g >= 0 ? (s = setTimeout(l, e - g)) : ((s = null), n || ((d = t.apply(i, o)), (i = o = null)));
  }
  var c = function () {
    (i = this), (o = arguments), (r = Date.now());
    var g = n && !s;
    return s || (s = setTimeout(l, e)), g && ((d = t.apply(i, o)), (i = o = null)), d;
  };
  return (
    (c.clear = function () {
      s && (clearTimeout(s), (s = null));
    }),
    (c.flush = function () {
      s && ((d = t.apply(i, o)), (i = o = null), clearTimeout(s), (s = null));
    }),
    c
  );
}
const Mi = {
  components: { ColorPicker: ws },
  props: ["addon", "setting", "value", "alphaEnabled"],
  data() {
    return { isOpen: !1, color: this.value, canCloseOutside: !1 };
  },
  watch: {
    color(t) {
      console.log("color changed", t);
    },
  },
  mounted() {
    ht.$on("close-pickers", (t) => {
      if (this.isOpen && this !== t) {
        const e = this.$parent.addon,
          n = this.$parent.setting;
        this.toggle(e, n, !1, { callCloseDropdowns: !1, callClosePickers: !1 });
      }
    });
  },
  methods: {
    toggle(t, e, n = !this.isOpen, { callCloseDropdowns: s = !0, callClosePickers: o = !0 } = {}) {
      (this.isOpen = n),
        (this.opening = !0),
        o && this.$root.closePickers({ isTrusted: !0 }, this, { callCloseDropdowns: !1 }),
        s && this.$root.closeResetDropdowns({ isTrusted: !0 }),
        (this.opening = !1),
        (this.$parent.addonSettings[e.id] = this.color),
        this.$parent.updateSettings(t, { wait: 250, settingId: e.id }),
        (this.canCloseOutside = !1),
        setTimeout(() => {
          this.canCloseOutside = !0;
        }, 0);
    },
    change: ki(function (t) {
      const e = t.colors.hex;
      (this.$parent.addonSettings[this.setting.id] = e),
        this.$parent.updateSettings(this.addon, { wait: 250, settingId: this.setting.id }),
        console.log("change", e),
        (this.color = e);
    }, 250),
  },
};
function Ii(t, e, n, s, o, i) {
  const r = me("ColorPicker");
  return (
    p(),
    v("div", { class: "color-container", key: n.value }, [
      a(
        "button",
        {
          style: Ee({ "background-color": o.color }),
          class: B(["setting-input color", { "action-disabled": !n.addon._enabled, open: o.isOpen }]),
          onClick: e[0] || (e[0] = (d) => i.toggle(n.addon, n.setting)),
        },
        null,
        6
      ),
      F(
        Lt(
          r,
          {
            color: o.color,
            "alpha-channel": n.alphaEnabled ? "show" : "hide",
            id: "picker",
            dir: "ltr",
            onColorChange: i.change,
          },
          null,
          8,
          ["color", "alpha-channel", "onColorChange"]
        ),
        [[Z, o.isOpen]]
      ),
    ])
  );
}
const Ti = xe(Mi, [["render", Ii]]),
  Ht = "/webpagesish/dist/assets/expand-4a280a1f.svg",
  Ci = {
    props: ["enabled", "setting", "presets"],
    data() {
      return { isResetDropdown: !0, isOpen: !1 };
    },
    mounted() {
      ht.$on("close-reset-dropdowns", (t) => {
        this.isOpen && this !== t && (this.isOpen = !1);
      });
    },
    methods: {
      toggle() {
        (this.isOpen = !this.isOpen),
          this.$root.closePickers({ isTrusted: !0 }, null, { callCloseDropdowns: !1 }),
          this.$root.closeResetDropdowns({ isTrusted: !0 }, this);
      },
      resetToDefault() {
        (this.$parent.addonSettings[this.setting.id] = this.setting.default),
          this.$parent.updateSettings(this.addon, { settingId: this.setting.id }),
          this.toggle();
      },
      resetToPreset(t) {
        (this.$parent.addonSettings[this.setting.id] = t.values[this.setting.id]),
          this.$parent.updateSettings(this.addon, { settingId: this.setting.id }),
          this.toggle();
      },
      msg(...t) {
        return this.$root.msg(...t);
      },
    },
  },
  Oi = ["disabled", "title"],
  Di = a("img", { src: Ht, class: "icon-type" }, null, -1),
  Ai = [Di],
  Pi = { key: 0, class: "color-preview" },
  Ni = { key: 1, class: "text-preview" },
  Li = ["onClick"],
  $i = { key: 0, class: "color-preview" },
  Ri = { key: 1, class: "text-preview" };
function Fi(t, e, n, s, o, i) {
  return (
    p(),
    v(
      "div",
      { class: B({ "setting-dropdown": !0, open: o.isOpen }) },
      [
        a(
          "button",
          {
            type: "button",
            class: "large-button clear-button",
            disabled: !n.enabled,
            onClick: e[0] || (e[0] = (...r) => i.toggle && i.toggle(...r)),
            title: i.msg("reset"),
          },
          Ai,
          8,
          Oi
        ),
        a("ul", null, [
          a("li", { onClick: e[1] || (e[1] = (...r) => i.resetToDefault && i.resetToDefault(...r)) }, [
            n.setting.type === "color"
              ? (p(), v("span", Pi, [a("span", { style: Ee({ backgroundColor: n.setting.default }) }, null, 4)]))
              : P("", !0),
            a("span", null, S(i.msg("default")), 1),
            n.setting.type !== "color" ? (p(), v("span", Ni, S(n.setting.default), 1)) : P("", !0),
          ]),
          (p(!0),
          v(
            z,
            null,
            K(
              n.presets,
              (r) => (
                p(),
                v(
                  z,
                  null,
                  [
                    (
                      r.values.hasOwnProperty(n.setting.id) && n.setting.type === "color"
                        ? r.values[n.setting.id].toLowerCase() != n.setting.default.toLowerCase()
                        : r.values[n.setting.id] !== n.setting.default
                    )
                      ? (p(),
                        v(
                          "li",
                          { key: 0, onClick: (d) => i.resetToPreset(r) },
                          [
                            n.setting.type === "color"
                              ? (p(),
                                v("span", $i, [
                                  a("span", { style: Ee({ backgroundColor: r.values[n.setting.id] }) }, null, 4),
                                ]))
                              : P("", !0),
                            a("span", null, S(r.name), 1),
                            n.setting.type !== "color" ? (p(), v("span", Ri, S(r.values[n.setting.id]), 1)) : P("", !0),
                          ],
                          8,
                          Li
                        ))
                      : P("", !0),
                  ],
                  64
                )
              )
            ),
            256
          )),
        ]),
      ],
      2
    )
  );
}
const ji = xe(Ci, [["render", Fi]]);
/**!
 * Sortable 1.15.0
 * @author	RubaXa   <trash@rubaxa.org>
 * @author	owenm    <owen23355@gmail.com>
 * @license MIT
 */ function Xn(t, e) {
  var n = Object.keys(t);
  if (Object.getOwnPropertySymbols) {
    var s = Object.getOwnPropertySymbols(t);
    e &&
      (s = s.filter(function (o) {
        return Object.getOwnPropertyDescriptor(t, o).enumerable;
      })),
      n.push.apply(n, s);
  }
  return n;
}
function _e(t) {
  for (var e = 1; e < arguments.length; e++) {
    var n = arguments[e] != null ? arguments[e] : {};
    e % 2
      ? Xn(Object(n), !0).forEach(function (s) {
          Bi(t, s, n[s]);
        })
      : Object.getOwnPropertyDescriptors
      ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(n))
      : Xn(Object(n)).forEach(function (s) {
          Object.defineProperty(t, s, Object.getOwnPropertyDescriptor(n, s));
        });
  }
  return t;
}
function Ct(t) {
  "@babel/helpers - typeof";
  return (
    typeof Symbol == "function" && typeof Symbol.iterator == "symbol"
      ? (Ct = function (e) {
          return typeof e;
        })
      : (Ct = function (e) {
          return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype
            ? "symbol"
            : typeof e;
        }),
    Ct(t)
  );
}
function Bi(t, e, n) {
  return (
    e in t ? Object.defineProperty(t, e, { value: n, enumerable: !0, configurable: !0, writable: !0 }) : (t[e] = n), t
  );
}
function Ie() {
  return (
    (Ie =
      Object.assign ||
      function (t) {
        for (var e = 1; e < arguments.length; e++) {
          var n = arguments[e];
          for (var s in n) Object.prototype.hasOwnProperty.call(n, s) && (t[s] = n[s]);
        }
        return t;
      }),
    Ie.apply(this, arguments)
  );
}
function zi(t, e) {
  if (t == null) return {};
  var n = {},
    s = Object.keys(t),
    o,
    i;
  for (i = 0; i < s.length; i++) (o = s[i]), !(e.indexOf(o) >= 0) && (n[o] = t[o]);
  return n;
}
function Hi(t, e) {
  if (t == null) return {};
  var n = zi(t, e),
    s,
    o;
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(t);
    for (o = 0; o < i.length; o++)
      (s = i[o]), !(e.indexOf(s) >= 0) && Object.prototype.propertyIsEnumerable.call(t, s) && (n[s] = t[s]);
  }
  return n;
}
var Ui = "1.15.0";
function ke(t) {
  if (typeof window < "u" && window.navigator) return !!navigator.userAgent.match(t);
}
var Ce = ke(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i),
  gt = ke(/Edge/i),
  Vn = ke(/firefox/i),
  at = ke(/safari/i) && !ke(/chrome/i) && !ke(/android/i),
  _s = ke(/iP(ad|od|hone)/i),
  xs = ke(/chrome/i) && ke(/android/i),
  Ss = { capture: !1, passive: !1 };
function $(t, e, n) {
  t.addEventListener(e, n, !Ce && Ss);
}
function N(t, e, n) {
  t.removeEventListener(e, n, !Ce && Ss);
}
function Rt(t, e) {
  if (e) {
    if ((e[0] === ">" && (e = e.substring(1)), t))
      try {
        if (t.matches) return t.matches(e);
        if (t.msMatchesSelector) return t.msMatchesSelector(e);
        if (t.webkitMatchesSelector) return t.webkitMatchesSelector(e);
      } catch {
        return !1;
      }
    return !1;
  }
}
function Wi(t) {
  return t.host && t !== document && t.host.nodeType ? t.host : t.parentNode;
}
function ve(t, e, n, s) {
  if (t) {
    n = n || document;
    do {
      if ((e != null && (e[0] === ">" ? t.parentNode === n && Rt(t, e) : Rt(t, e))) || (s && t === n)) return t;
      if (t === n) break;
    } while ((t = Wi(t)));
  }
  return null;
}
var Kn = /\s+/g;
function re(t, e, n) {
  if (t && e)
    if (t.classList) t.classList[n ? "add" : "remove"](e);
    else {
      var s = (" " + t.className + " ").replace(Kn, " ").replace(" " + e + " ", " ");
      t.className = (s + (n ? " " + e : "")).replace(Kn, " ");
    }
}
function E(t, e, n) {
  var s = t && t.style;
  if (s) {
    if (n === void 0)
      return (
        document.defaultView && document.defaultView.getComputedStyle
          ? (n = document.defaultView.getComputedStyle(t, ""))
          : t.currentStyle && (n = t.currentStyle),
        e === void 0 ? n : n[e]
      );
    !(e in s) && e.indexOf("webkit") === -1 && (e = "-webkit-" + e), (s[e] = n + (typeof n == "string" ? "" : "px"));
  }
}
function Ke(t, e) {
  var n = "";
  if (typeof t == "string") n = t;
  else
    do {
      var s = E(t, "transform");
      s && s !== "none" && (n = s + " " + n);
    } while (!e && (t = t.parentNode));
  var o = window.DOMMatrix || window.WebKitCSSMatrix || window.CSSMatrix || window.MSCSSMatrix;
  return o && new o(n);
}
function Es(t, e, n) {
  if (t) {
    var s = t.getElementsByTagName(e),
      o = 0,
      i = s.length;
    if (n) for (; o < i; o++) n(s[o], o);
    return s;
  }
  return [];
}
function we() {
  var t = document.scrollingElement;
  return t || document.documentElement;
}
function q(t, e, n, s, o) {
  if (!(!t.getBoundingClientRect && t !== window)) {
    var i, r, d, l, c, g, u;
    if (
      (t !== window && t.parentNode && t !== we()
        ? ((i = t.getBoundingClientRect()),
          (r = i.top),
          (d = i.left),
          (l = i.bottom),
          (c = i.right),
          (g = i.height),
          (u = i.width))
        : ((r = 0),
          (d = 0),
          (l = window.innerHeight),
          (c = window.innerWidth),
          (g = window.innerHeight),
          (u = window.innerWidth)),
      (e || n) && t !== window && ((o = o || t.parentNode), !Ce))
    )
      do
        if (o && o.getBoundingClientRect && (E(o, "transform") !== "none" || (n && E(o, "position") !== "static"))) {
          var m = o.getBoundingClientRect();
          (r -= m.top + parseInt(E(o, "border-top-width"))),
            (d -= m.left + parseInt(E(o, "border-left-width"))),
            (l = r + i.height),
            (c = d + i.width);
          break;
        }
      while ((o = o.parentNode));
    if (s && t !== window) {
      var h = Ke(o || t),
        f = h && h.a,
        y = h && h.d;
      h && ((r /= y), (d /= f), (u /= f), (g /= y), (l = r + g), (c = d + u));
    }
    return { top: r, left: d, bottom: l, right: c, width: u, height: g };
  }
}
function Jn(t, e, n) {
  for (var s = Pe(t, !0), o = q(t)[e]; s; ) {
    var i = q(s)[n],
      r = void 0;
    if ((n === "top" || n === "left" ? (r = o >= i) : (r = o <= i), !r)) return s;
    if (s === we()) break;
    s = Pe(s, !1);
  }
  return !1;
}
function Je(t, e, n, s) {
  for (var o = 0, i = 0, r = t.children; i < r.length; ) {
    if (
      r[i].style.display !== "none" &&
      r[i] !== k.ghost &&
      (s || r[i] !== k.dragged) &&
      ve(r[i], n.draggable, t, !1)
    ) {
      if (o === e) return r[i];
      o++;
    }
    i++;
  }
  return null;
}
function Mn(t, e) {
  for (var n = t.lastElementChild; n && (n === k.ghost || E(n, "display") === "none" || (e && !Rt(n, e))); )
    n = n.previousElementSibling;
  return n || null;
}
function ue(t, e) {
  var n = 0;
  if (!t || !t.parentNode) return -1;
  for (; (t = t.previousElementSibling); )
    t.nodeName.toUpperCase() !== "TEMPLATE" && t !== k.clone && (!e || Rt(t, e)) && n++;
  return n;
}
function qn(t) {
  var e = 0,
    n = 0,
    s = we();
  if (t)
    do {
      var o = Ke(t),
        i = o.a,
        r = o.d;
      (e += t.scrollLeft * i), (n += t.scrollTop * r);
    } while (t !== s && (t = t.parentNode));
  return [e, n];
}
function Gi(t, e) {
  for (var n in t)
    if (t.hasOwnProperty(n)) {
      for (var s in e) if (e.hasOwnProperty(s) && e[s] === t[n][s]) return Number(n);
    }
  return -1;
}
function Pe(t, e) {
  if (!t || !t.getBoundingClientRect) return we();
  var n = t,
    s = !1;
  do
    if (n.clientWidth < n.scrollWidth || n.clientHeight < n.scrollHeight) {
      var o = E(n);
      if (
        (n.clientWidth < n.scrollWidth && (o.overflowX == "auto" || o.overflowX == "scroll")) ||
        (n.clientHeight < n.scrollHeight && (o.overflowY == "auto" || o.overflowY == "scroll"))
      ) {
        if (!n.getBoundingClientRect || n === document.body) return we();
        if (s || e) return n;
        s = !0;
      }
    }
  while ((n = n.parentNode));
  return we();
}
function Yi(t, e) {
  if (t && e) for (var n in e) e.hasOwnProperty(n) && (t[n] = e[n]);
  return t;
}
function en(t, e) {
  return (
    Math.round(t.top) === Math.round(e.top) &&
    Math.round(t.left) === Math.round(e.left) &&
    Math.round(t.height) === Math.round(e.height) &&
    Math.round(t.width) === Math.round(e.width)
  );
}
var lt;
function ks(t, e) {
  return function () {
    if (!lt) {
      var n = arguments,
        s = this;
      n.length === 1 ? t.call(s, n[0]) : t.apply(s, n),
        (lt = setTimeout(function () {
          lt = void 0;
        }, e));
    }
  };
}
function Xi() {
  clearTimeout(lt), (lt = void 0);
}
function Ms(t, e, n) {
  (t.scrollLeft += e), (t.scrollTop += n);
}
function Is(t) {
  var e = window.Polymer,
    n = window.jQuery || window.Zepto;
  return e && e.dom ? e.dom(t).cloneNode(!0) : n ? n(t).clone(!0)[0] : t.cloneNode(!0);
}
var ce = "Sortable" + new Date().getTime();
function Vi() {
  var t = [],
    e;
  return {
    captureAnimationState: function () {
      if (((t = []), !!this.options.animation)) {
        var s = [].slice.call(this.el.children);
        s.forEach(function (o) {
          if (!(E(o, "display") === "none" || o === k.ghost)) {
            t.push({ target: o, rect: q(o) });
            var i = _e({}, t[t.length - 1].rect);
            if (o.thisAnimationDuration) {
              var r = Ke(o, !0);
              r && ((i.top -= r.f), (i.left -= r.e));
            }
            o.fromRect = i;
          }
        });
      }
    },
    addAnimationState: function (s) {
      t.push(s);
    },
    removeAnimationState: function (s) {
      t.splice(Gi(t, { target: s }), 1);
    },
    animateAll: function (s) {
      var o = this;
      if (!this.options.animation) {
        clearTimeout(e), typeof s == "function" && s();
        return;
      }
      var i = !1,
        r = 0;
      t.forEach(function (d) {
        var l = 0,
          c = d.target,
          g = c.fromRect,
          u = q(c),
          m = c.prevFromRect,
          h = c.prevToRect,
          f = d.rect,
          y = Ke(c, !0);
        y && ((u.top -= y.f), (u.left -= y.e)),
          (c.toRect = u),
          c.thisAnimationDuration &&
            en(m, u) &&
            !en(g, u) &&
            (f.top - u.top) / (f.left - u.left) === (g.top - u.top) / (g.left - u.left) &&
            (l = Ji(f, m, h, o.options)),
          en(u, g) || ((c.prevFromRect = g), (c.prevToRect = u), l || (l = o.options.animation), o.animate(c, f, u, l)),
          l &&
            ((i = !0),
            (r = Math.max(r, l)),
            clearTimeout(c.animationResetTimer),
            (c.animationResetTimer = setTimeout(function () {
              (c.animationTime = 0),
                (c.prevFromRect = null),
                (c.fromRect = null),
                (c.prevToRect = null),
                (c.thisAnimationDuration = null);
            }, l)),
            (c.thisAnimationDuration = l));
      }),
        clearTimeout(e),
        i
          ? (e = setTimeout(function () {
              typeof s == "function" && s();
            }, r))
          : typeof s == "function" && s(),
        (t = []);
    },
    animate: function (s, o, i, r) {
      if (r) {
        E(s, "transition", ""), E(s, "transform", "");
        var d = Ke(this.el),
          l = d && d.a,
          c = d && d.d,
          g = (o.left - i.left) / (l || 1),
          u = (o.top - i.top) / (c || 1);
        (s.animatingX = !!g),
          (s.animatingY = !!u),
          E(s, "transform", "translate3d(" + g + "px," + u + "px,0)"),
          (this.forRepaintDummy = Ki(s)),
          E(s, "transition", "transform " + r + "ms" + (this.options.easing ? " " + this.options.easing : "")),
          E(s, "transform", "translate3d(0,0,0)"),
          typeof s.animated == "number" && clearTimeout(s.animated),
          (s.animated = setTimeout(function () {
            E(s, "transition", ""), E(s, "transform", ""), (s.animated = !1), (s.animatingX = !1), (s.animatingY = !1);
          }, r));
      }
    },
  };
}
function Ki(t) {
  return t.offsetWidth;
}
function Ji(t, e, n, s) {
  return (
    (Math.sqrt(Math.pow(e.top - t.top, 2) + Math.pow(e.left - t.left, 2)) /
      Math.sqrt(Math.pow(e.top - n.top, 2) + Math.pow(e.left - n.left, 2))) *
    s.animation
  );
}
var He = [],
  tn = { initializeByDefault: !0 },
  mt = {
    mount: function (e) {
      for (var n in tn) tn.hasOwnProperty(n) && !(n in e) && (e[n] = tn[n]);
      He.forEach(function (s) {
        if (s.pluginName === e.pluginName)
          throw "Sortable: Cannot mount plugin ".concat(e.pluginName, " more than once");
      }),
        He.push(e);
    },
    pluginEvent: function (e, n, s) {
      var o = this;
      (this.eventCanceled = !1),
        (s.cancel = function () {
          o.eventCanceled = !0;
        });
      var i = e + "Global";
      He.forEach(function (r) {
        n[r.pluginName] &&
          (n[r.pluginName][i] && n[r.pluginName][i](_e({ sortable: n }, s)),
          n.options[r.pluginName] && n[r.pluginName][e] && n[r.pluginName][e](_e({ sortable: n }, s)));
      });
    },
    initializePlugins: function (e, n, s, o) {
      He.forEach(function (d) {
        var l = d.pluginName;
        if (!(!e.options[l] && !d.initializeByDefault)) {
          var c = new d(e, n, e.options);
          (c.sortable = e), (c.options = e.options), (e[l] = c), Ie(s, c.defaults);
        }
      });
      for (var i in e.options)
        if (e.options.hasOwnProperty(i)) {
          var r = this.modifyOption(e, i, e.options[i]);
          typeof r < "u" && (e.options[i] = r);
        }
    },
    getEventProperties: function (e, n) {
      var s = {};
      return (
        He.forEach(function (o) {
          typeof o.eventProperties == "function" && Ie(s, o.eventProperties.call(n[o.pluginName], e));
        }),
        s
      );
    },
    modifyOption: function (e, n, s) {
      var o;
      return (
        He.forEach(function (i) {
          e[i.pluginName] &&
            i.optionListeners &&
            typeof i.optionListeners[n] == "function" &&
            (o = i.optionListeners[n].call(e[i.pluginName], s));
        }),
        o
      );
    },
  };
function qi(t) {
  var e = t.sortable,
    n = t.rootEl,
    s = t.name,
    o = t.targetEl,
    i = t.cloneEl,
    r = t.toEl,
    d = t.fromEl,
    l = t.oldIndex,
    c = t.newIndex,
    g = t.oldDraggableIndex,
    u = t.newDraggableIndex,
    m = t.originalEvent,
    h = t.putSortable,
    f = t.extraEventProperties;
  if (((e = e || (n && n[ce])), !!e)) {
    var y,
      T = e.options,
      w = "on" + s.charAt(0).toUpperCase() + s.substr(1);
    window.CustomEvent && !Ce && !gt
      ? (y = new CustomEvent(s, { bubbles: !0, cancelable: !0 }))
      : ((y = document.createEvent("Event")), y.initEvent(s, !0, !0)),
      (y.to = r || n),
      (y.from = d || n),
      (y.item = o || n),
      (y.clone = i),
      (y.oldIndex = l),
      (y.newIndex = c),
      (y.oldDraggableIndex = g),
      (y.newDraggableIndex = u),
      (y.originalEvent = m),
      (y.pullMode = h ? h.lastPutMode : void 0);
    var O = _e(_e({}, f), mt.getEventProperties(s, e));
    for (var A in O) y[A] = O[A];
    n && n.dispatchEvent(y), T[w] && T[w].call(e, y);
  }
}
var Qi = ["evt"],
  oe = function (e, n) {
    var s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {},
      o = s.evt,
      i = Hi(s, Qi);
    mt.pluginEvent.bind(k)(
      e,
      n,
      _e(
        {
          dragEl: b,
          parentEl: Y,
          ghostEl: D,
          rootEl: U,
          nextEl: Re,
          lastDownEl: Ot,
          cloneEl: G,
          cloneHidden: Ae,
          dragStarted: st,
          putSortable: Q,
          activeSortable: k.active,
          originalEvent: o,
          oldIndex: Ve,
          oldDraggableIndex: dt,
          newIndex: ae,
          newDraggableIndex: De,
          hideGhostForTarget: Ds,
          unhideGhostForTarget: As,
          cloneNowHidden: function () {
            Ae = !0;
          },
          cloneNowShown: function () {
            Ae = !1;
          },
          dispatchSortableEvent: function (d) {
            ne({ sortable: n, name: d, originalEvent: o });
          },
        },
        i
      )
    );
  };
function ne(t) {
  qi(
    _e(
      {
        putSortable: Q,
        cloneEl: G,
        targetEl: b,
        rootEl: U,
        oldIndex: Ve,
        oldDraggableIndex: dt,
        newIndex: ae,
        newDraggableIndex: De,
      },
      t
    )
  );
}
var b,
  Y,
  D,
  U,
  Re,
  Ot,
  G,
  Ae,
  Ve,
  ae,
  dt,
  De,
  St,
  Q,
  Ge = !1,
  Ft = !1,
  jt = [],
  Le,
  ge,
  nn,
  sn,
  Qn,
  Zn,
  st,
  Ue,
  ct,
  ut = !1,
  Et = !1,
  Dt,
  te,
  on = [],
  bn = !1,
  Bt = [],
  Ut = typeof document < "u",
  kt = _s,
  es = gt || Ce ? "cssFloat" : "float",
  Zi = Ut && !xs && !_s && "draggable" in document.createElement("div"),
  Ts = (function () {
    if (Ut) {
      if (Ce) return !1;
      var t = document.createElement("x");
      return (t.style.cssText = "pointer-events:auto"), t.style.pointerEvents === "auto";
    }
  })(),
  Cs = function (e, n) {
    var s = E(e),
      o =
        parseInt(s.width) -
        parseInt(s.paddingLeft) -
        parseInt(s.paddingRight) -
        parseInt(s.borderLeftWidth) -
        parseInt(s.borderRightWidth),
      i = Je(e, 0, n),
      r = Je(e, 1, n),
      d = i && E(i),
      l = r && E(r),
      c = d && parseInt(d.marginLeft) + parseInt(d.marginRight) + q(i).width,
      g = l && parseInt(l.marginLeft) + parseInt(l.marginRight) + q(r).width;
    if (s.display === "flex")
      return s.flexDirection === "column" || s.flexDirection === "column-reverse" ? "vertical" : "horizontal";
    if (s.display === "grid") return s.gridTemplateColumns.split(" ").length <= 1 ? "vertical" : "horizontal";
    if (i && d.float && d.float !== "none") {
      var u = d.float === "left" ? "left" : "right";
      return r && (l.clear === "both" || l.clear === u) ? "vertical" : "horizontal";
    }
    return i &&
      (d.display === "block" ||
        d.display === "flex" ||
        d.display === "table" ||
        d.display === "grid" ||
        (c >= o && s[es] === "none") ||
        (r && s[es] === "none" && c + g > o))
      ? "vertical"
      : "horizontal";
  },
  er = function (e, n, s) {
    var o = s ? e.left : e.top,
      i = s ? e.right : e.bottom,
      r = s ? e.width : e.height,
      d = s ? n.left : n.top,
      l = s ? n.right : n.bottom,
      c = s ? n.width : n.height;
    return o === d || i === l || o + r / 2 === d + c / 2;
  },
  tr = function (e, n) {
    var s;
    return (
      jt.some(function (o) {
        var i = o[ce].options.emptyInsertThreshold;
        if (!(!i || Mn(o))) {
          var r = q(o),
            d = e >= r.left - i && e <= r.right + i,
            l = n >= r.top - i && n <= r.bottom + i;
          if (d && l) return (s = o);
        }
      }),
      s
    );
  },
  Os = function (e) {
    function n(i, r) {
      return function (d, l, c, g) {
        var u = d.options.group.name && l.options.group.name && d.options.group.name === l.options.group.name;
        if (i == null && (r || u)) return !0;
        if (i == null || i === !1) return !1;
        if (r && i === "clone") return i;
        if (typeof i == "function") return n(i(d, l, c, g), r)(d, l, c, g);
        var m = (r ? d : l).options.group.name;
        return i === !0 || (typeof i == "string" && i === m) || (i.join && i.indexOf(m) > -1);
      };
    }
    var s = {},
      o = e.group;
    (!o || Ct(o) != "object") && (o = { name: o }),
      (s.name = o.name),
      (s.checkPull = n(o.pull, !0)),
      (s.checkPut = n(o.put)),
      (s.revertClone = o.revertClone),
      (e.group = s);
  },
  Ds = function () {
    !Ts && D && E(D, "display", "none");
  },
  As = function () {
    !Ts && D && E(D, "display", "");
  };
Ut &&
  !xs &&
  document.addEventListener(
    "click",
    function (t) {
      if (Ft)
        return (
          t.preventDefault(),
          t.stopPropagation && t.stopPropagation(),
          t.stopImmediatePropagation && t.stopImmediatePropagation(),
          (Ft = !1),
          !1
        );
    },
    !0
  );
var $e = function (e) {
    if (b) {
      e = e.touches ? e.touches[0] : e;
      var n = tr(e.clientX, e.clientY);
      if (n) {
        var s = {};
        for (var o in e) e.hasOwnProperty(o) && (s[o] = e[o]);
        (s.target = s.rootEl = n), (s.preventDefault = void 0), (s.stopPropagation = void 0), n[ce]._onDragOver(s);
      }
    }
  },
  nr = function (e) {
    b && b.parentNode[ce]._isOutsideThisEl(e.target);
  };
function k(t, e) {
  if (!(t && t.nodeType && t.nodeType === 1))
    throw "Sortable: `el` must be an HTMLElement, not ".concat({}.toString.call(t));
  (this.el = t), (this.options = e = Ie({}, e)), (t[ce] = this);
  var n = {
    group: null,
    sort: !0,
    disabled: !1,
    store: null,
    handle: null,
    draggable: /^[uo]l$/i.test(t.nodeName) ? ">li" : ">*",
    swapThreshold: 1,
    invertSwap: !1,
    invertedSwapThreshold: null,
    removeCloneOnHide: !0,
    direction: function () {
      return Cs(t, this.options);
    },
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",
    ignore: "a, img",
    filter: null,
    preventOnFilter: !0,
    animation: 0,
    easing: null,
    setData: function (r, d) {
      r.setData("Text", d.textContent);
    },
    dropBubble: !1,
    dragoverBubble: !1,
    dataIdAttr: "data-id",
    delay: 0,
    delayOnTouchOnly: !1,
    touchStartThreshold: (Number.parseInt ? Number : window).parseInt(window.devicePixelRatio, 10) || 1,
    forceFallback: !1,
    fallbackClass: "sortable-fallback",
    fallbackOnBody: !1,
    fallbackTolerance: 0,
    fallbackOffset: { x: 0, y: 0 },
    supportPointer: k.supportPointer !== !1 && "PointerEvent" in window && !at,
    emptyInsertThreshold: 5,
  };
  mt.initializePlugins(this, t, n);
  for (var s in n) !(s in e) && (e[s] = n[s]);
  Os(e);
  for (var o in this) o.charAt(0) === "_" && typeof this[o] == "function" && (this[o] = this[o].bind(this));
  (this.nativeDraggable = e.forceFallback ? !1 : Zi),
    this.nativeDraggable && (this.options.touchStartThreshold = 1),
    e.supportPointer
      ? $(t, "pointerdown", this._onTapStart)
      : ($(t, "mousedown", this._onTapStart), $(t, "touchstart", this._onTapStart)),
    this.nativeDraggable && ($(t, "dragover", this), $(t, "dragenter", this)),
    jt.push(this.el),
    e.store && e.store.get && this.sort(e.store.get(this) || []),
    Ie(this, Vi());
}
k.prototype = {
  constructor: k,
  _isOutsideThisEl: function (e) {
    !this.el.contains(e) && e !== this.el && (Ue = null);
  },
  _getDirection: function (e, n) {
    return typeof this.options.direction == "function"
      ? this.options.direction.call(this, e, n, b)
      : this.options.direction;
  },
  _onTapStart: function (e) {
    if (e.cancelable) {
      var n = this,
        s = this.el,
        o = this.options,
        i = o.preventOnFilter,
        r = e.type,
        d = (e.touches && e.touches[0]) || (e.pointerType && e.pointerType === "touch" && e),
        l = (d || e).target,
        c = (e.target.shadowRoot && ((e.path && e.path[0]) || (e.composedPath && e.composedPath()[0]))) || l,
        g = o.filter;
      if (
        (cr(s),
        !b &&
          !((/mousedown|pointerdown/.test(r) && e.button !== 0) || o.disabled) &&
          !c.isContentEditable &&
          !(!this.nativeDraggable && at && l && l.tagName.toUpperCase() === "SELECT") &&
          ((l = ve(l, o.draggable, s, !1)), !(l && l.animated) && Ot !== l))
      ) {
        if (((Ve = ue(l)), (dt = ue(l, o.draggable)), typeof g == "function")) {
          if (g.call(this, e, l, this)) {
            ne({ sortable: n, rootEl: c, name: "filter", targetEl: l, toEl: s, fromEl: s }),
              oe("filter", n, { evt: e }),
              i && e.cancelable && e.preventDefault();
            return;
          }
        } else if (
          g &&
          ((g = g.split(",").some(function (u) {
            if (((u = ve(c, u.trim(), s, !1)), u))
              return (
                ne({ sortable: n, rootEl: u, name: "filter", targetEl: l, fromEl: s, toEl: s }),
                oe("filter", n, { evt: e }),
                !0
              );
          })),
          g)
        ) {
          i && e.cancelable && e.preventDefault();
          return;
        }
        (o.handle && !ve(c, o.handle, s, !1)) || this._prepareDragStart(e, d, l);
      }
    }
  },
  _prepareDragStart: function (e, n, s) {
    var o = this,
      i = o.el,
      r = o.options,
      d = i.ownerDocument,
      l;
    if (s && !b && s.parentNode === i) {
      var c = q(s);
      if (
        ((U = i),
        (b = s),
        (Y = b.parentNode),
        (Re = b.nextSibling),
        (Ot = s),
        (St = r.group),
        (k.dragged = b),
        (Le = { target: b, clientX: (n || e).clientX, clientY: (n || e).clientY }),
        (Qn = Le.clientX - c.left),
        (Zn = Le.clientY - c.top),
        (this._lastX = (n || e).clientX),
        (this._lastY = (n || e).clientY),
        (b.style["will-change"] = "all"),
        (l = function () {
          if ((oe("delayEnded", o, { evt: e }), k.eventCanceled)) {
            o._onDrop();
            return;
          }
          o._disableDelayedDragEvents(),
            !Vn && o.nativeDraggable && (b.draggable = !0),
            o._triggerDragStart(e, n),
            ne({ sortable: o, name: "choose", originalEvent: e }),
            re(b, r.chosenClass, !0);
        }),
        r.ignore.split(",").forEach(function (g) {
          Es(b, g.trim(), rn);
        }),
        $(d, "dragover", $e),
        $(d, "mousemove", $e),
        $(d, "touchmove", $e),
        $(d, "mouseup", o._onDrop),
        $(d, "touchend", o._onDrop),
        $(d, "touchcancel", o._onDrop),
        Vn && this.nativeDraggable && ((this.options.touchStartThreshold = 4), (b.draggable = !0)),
        oe("delayStart", this, { evt: e }),
        r.delay && (!r.delayOnTouchOnly || n) && (!this.nativeDraggable || !(gt || Ce)))
      ) {
        if (k.eventCanceled) {
          this._onDrop();
          return;
        }
        $(d, "mouseup", o._disableDelayedDrag),
          $(d, "touchend", o._disableDelayedDrag),
          $(d, "touchcancel", o._disableDelayedDrag),
          $(d, "mousemove", o._delayedDragTouchMoveHandler),
          $(d, "touchmove", o._delayedDragTouchMoveHandler),
          r.supportPointer && $(d, "pointermove", o._delayedDragTouchMoveHandler),
          (o._dragStartTimer = setTimeout(l, r.delay));
      } else l();
    }
  },
  _delayedDragTouchMoveHandler: function (e) {
    var n = e.touches ? e.touches[0] : e;
    Math.max(Math.abs(n.clientX - this._lastX), Math.abs(n.clientY - this._lastY)) >=
      Math.floor(this.options.touchStartThreshold / ((this.nativeDraggable && window.devicePixelRatio) || 1)) &&
      this._disableDelayedDrag();
  },
  _disableDelayedDrag: function () {
    b && rn(b), clearTimeout(this._dragStartTimer), this._disableDelayedDragEvents();
  },
  _disableDelayedDragEvents: function () {
    var e = this.el.ownerDocument;
    N(e, "mouseup", this._disableDelayedDrag),
      N(e, "touchend", this._disableDelayedDrag),
      N(e, "touchcancel", this._disableDelayedDrag),
      N(e, "mousemove", this._delayedDragTouchMoveHandler),
      N(e, "touchmove", this._delayedDragTouchMoveHandler),
      N(e, "pointermove", this._delayedDragTouchMoveHandler);
  },
  _triggerDragStart: function (e, n) {
    (n = n || (e.pointerType == "touch" && e)),
      !this.nativeDraggable || n
        ? this.options.supportPointer
          ? $(document, "pointermove", this._onTouchMove)
          : n
          ? $(document, "touchmove", this._onTouchMove)
          : $(document, "mousemove", this._onTouchMove)
        : ($(b, "dragend", this), $(U, "dragstart", this._onDragStart));
    try {
      document.selection
        ? At(function () {
            document.selection.empty();
          })
        : window.getSelection().removeAllRanges();
    } catch {}
  },
  _dragStarted: function (e, n) {
    if (((Ge = !1), U && b)) {
      oe("dragStarted", this, { evt: n }), this.nativeDraggable && $(document, "dragover", nr);
      var s = this.options;
      !e && re(b, s.dragClass, !1),
        re(b, s.ghostClass, !0),
        (k.active = this),
        e && this._appendGhost(),
        ne({ sortable: this, name: "start", originalEvent: n });
    } else this._nulling();
  },
  _emulateDragOver: function () {
    if (ge) {
      (this._lastX = ge.clientX), (this._lastY = ge.clientY), Ds();
      for (
        var e = document.elementFromPoint(ge.clientX, ge.clientY), n = e;
        e && e.shadowRoot && ((e = e.shadowRoot.elementFromPoint(ge.clientX, ge.clientY)), e !== n);

      )
        n = e;
      if ((b.parentNode[ce]._isOutsideThisEl(e), n))
        do {
          if (n[ce]) {
            var s = void 0;
            if (
              ((s = n[ce]._onDragOver({ clientX: ge.clientX, clientY: ge.clientY, target: e, rootEl: n })),
              s && !this.options.dragoverBubble)
            )
              break;
          }
          e = n;
        } while ((n = n.parentNode));
      As();
    }
  },
  _onTouchMove: function (e) {
    if (Le) {
      var n = this.options,
        s = n.fallbackTolerance,
        o = n.fallbackOffset,
        i = e.touches ? e.touches[0] : e,
        r = D && Ke(D, !0),
        d = D && r && r.a,
        l = D && r && r.d,
        c = kt && te && qn(te),
        g = (i.clientX - Le.clientX + o.x) / (d || 1) + (c ? c[0] - on[0] : 0) / (d || 1),
        u = (i.clientY - Le.clientY + o.y) / (l || 1) + (c ? c[1] - on[1] : 0) / (l || 1);
      if (!k.active && !Ge) {
        if (s && Math.max(Math.abs(i.clientX - this._lastX), Math.abs(i.clientY - this._lastY)) < s) return;
        this._onDragStart(e, !0);
      }
      if (D) {
        r ? ((r.e += g - (nn || 0)), (r.f += u - (sn || 0))) : (r = { a: 1, b: 0, c: 0, d: 1, e: g, f: u });
        var m = "matrix("
          .concat(r.a, ",")
          .concat(r.b, ",")
          .concat(r.c, ",")
          .concat(r.d, ",")
          .concat(r.e, ",")
          .concat(r.f, ")");
        E(D, "webkitTransform", m),
          E(D, "mozTransform", m),
          E(D, "msTransform", m),
          E(D, "transform", m),
          (nn = g),
          (sn = u),
          (ge = i);
      }
      e.cancelable && e.preventDefault();
    }
  },
  _appendGhost: function () {
    if (!D) {
      var e = this.options.fallbackOnBody ? document.body : U,
        n = q(b, !0, kt, !0, e),
        s = this.options;
      if (kt) {
        for (te = e; E(te, "position") === "static" && E(te, "transform") === "none" && te !== document; )
          te = te.parentNode;
        te !== document.body && te !== document.documentElement
          ? (te === document && (te = we()), (n.top += te.scrollTop), (n.left += te.scrollLeft))
          : (te = we()),
          (on = qn(te));
      }
      (D = b.cloneNode(!0)),
        re(D, s.ghostClass, !1),
        re(D, s.fallbackClass, !0),
        re(D, s.dragClass, !0),
        E(D, "transition", ""),
        E(D, "transform", ""),
        E(D, "box-sizing", "border-box"),
        E(D, "margin", 0),
        E(D, "top", n.top),
        E(D, "left", n.left),
        E(D, "width", n.width),
        E(D, "height", n.height),
        E(D, "opacity", "0.8"),
        E(D, "position", kt ? "absolute" : "fixed"),
        E(D, "zIndex", "100000"),
        E(D, "pointerEvents", "none"),
        (k.ghost = D),
        e.appendChild(D),
        E(
          D,
          "transform-origin",
          (Qn / parseInt(D.style.width)) * 100 + "% " + (Zn / parseInt(D.style.height)) * 100 + "%"
        );
    }
  },
  _onDragStart: function (e, n) {
    var s = this,
      o = e.dataTransfer,
      i = s.options;
    if ((oe("dragStart", this, { evt: e }), k.eventCanceled)) {
      this._onDrop();
      return;
    }
    oe("setupClone", this),
      k.eventCanceled ||
        ((G = Is(b)),
        G.removeAttribute("id"),
        (G.draggable = !1),
        (G.style["will-change"] = ""),
        this._hideClone(),
        re(G, this.options.chosenClass, !1),
        (k.clone = G)),
      (s.cloneId = At(function () {
        oe("clone", s),
          !k.eventCanceled &&
            (s.options.removeCloneOnHide || U.insertBefore(G, b), s._hideClone(), ne({ sortable: s, name: "clone" }));
      })),
      !n && re(b, i.dragClass, !0),
      n
        ? ((Ft = !0), (s._loopId = setInterval(s._emulateDragOver, 50)))
        : (N(document, "mouseup", s._onDrop),
          N(document, "touchend", s._onDrop),
          N(document, "touchcancel", s._onDrop),
          o && ((o.effectAllowed = "move"), i.setData && i.setData.call(s, o, b)),
          $(document, "drop", s),
          E(b, "transform", "translateZ(0)")),
      (Ge = !0),
      (s._dragStartId = At(s._dragStarted.bind(s, n, e))),
      $(document, "selectstart", s),
      (st = !0),
      at && E(document.body, "user-select", "none");
  },
  _onDragOver: function (e) {
    var n = this.el,
      s = e.target,
      o,
      i,
      r,
      d = this.options,
      l = d.group,
      c = k.active,
      g = St === l,
      u = d.sort,
      m = Q || c,
      h,
      f = this,
      y = !1;
    if (bn) return;
    function T(Se, Be) {
      oe(
        Se,
        f,
        _e(
          {
            evt: e,
            isOwner: g,
            axis: h ? "vertical" : "horizontal",
            revert: r,
            dragRect: o,
            targetRect: i,
            canSort: u,
            fromSortable: m,
            target: s,
            completed: O,
            onMove: function (ft, Ws) {
              return Mt(U, n, b, o, ft, q(ft), e, Ws);
            },
            changed: A,
          },
          Be
        )
      );
    }
    function w() {
      T("dragOverAnimationCapture"), f.captureAnimationState(), f !== m && m.captureAnimationState();
    }
    function O(Se) {
      return (
        T("dragOverCompleted", { insertion: Se }),
        Se &&
          (g ? c._hideClone() : c._showClone(f),
          f !== m && (re(b, Q ? Q.options.ghostClass : c.options.ghostClass, !1), re(b, d.ghostClass, !0)),
          Q !== f && f !== k.active ? (Q = f) : f === k.active && Q && (Q = null),
          m === f && (f._ignoreWhileAnimating = s),
          f.animateAll(function () {
            T("dragOverAnimationComplete"), (f._ignoreWhileAnimating = null);
          }),
          f !== m && (m.animateAll(), (m._ignoreWhileAnimating = null))),
        ((s === b && !b.animated) || (s === n && !s.animated)) && (Ue = null),
        !d.dragoverBubble && !e.rootEl && s !== document && (b.parentNode[ce]._isOutsideThisEl(e.target), !Se && $e(e)),
        !d.dragoverBubble && e.stopPropagation && e.stopPropagation(),
        (y = !0)
      );
    }
    function A() {
      (ae = ue(b)),
        (De = ue(b, d.draggable)),
        ne({ sortable: f, name: "change", toEl: n, newIndex: ae, newDraggableIndex: De, originalEvent: e });
    }
    if (
      (e.preventDefault !== void 0 && e.cancelable && e.preventDefault(),
      (s = ve(s, d.draggable, n, !0)),
      T("dragOver"),
      k.eventCanceled)
    )
      return y;
    if (b.contains(e.target) || (s.animated && s.animatingX && s.animatingY) || f._ignoreWhileAnimating === s)
      return O(!1);
    if (
      ((Ft = !1),
      c &&
        !d.disabled &&
        (g
          ? u || (r = Y !== U)
          : Q === this || ((this.lastPutMode = St.checkPull(this, c, b, e)) && l.checkPut(this, c, b, e))))
    ) {
      if (((h = this._getDirection(e, s) === "vertical"), (o = q(b)), T("dragOverValid"), k.eventCanceled)) return y;
      if (r)
        return (
          (Y = U),
          w(),
          this._hideClone(),
          T("revert"),
          k.eventCanceled || (Re ? U.insertBefore(b, Re) : U.appendChild(b)),
          O(!0)
        );
      var R = Mn(n, d.draggable);
      if (!R || (rr(e, h, this) && !R.animated)) {
        if (R === b) return O(!1);
        if ((R && n === e.target && (s = R), s && (i = q(s)), Mt(U, n, b, o, s, i, e, !!s) !== !1))
          return w(), R && R.nextSibling ? n.insertBefore(b, R.nextSibling) : n.appendChild(b), (Y = n), A(), O(!0);
      } else if (R && ir(e, h, this)) {
        var X = Je(n, 0, d, !0);
        if (X === b) return O(!1);
        if (((s = X), (i = q(s)), Mt(U, n, b, o, s, i, e, !1) !== !1))
          return w(), n.insertBefore(b, X), (Y = n), A(), O(!0);
      } else if (s.parentNode === n) {
        i = q(s);
        var J = 0,
          j,
          ee = b.parentNode !== n,
          H = !er((b.animated && b.toRect) || o, (s.animated && s.toRect) || i, h),
          he = h ? "top" : "left",
          _ = Jn(s, "top", "top") || Jn(b, "top", "top"),
          x = _ ? _.scrollTop : void 0;
        Ue !== s && ((j = i[he]), (ut = !1), (Et = (!H && d.invertSwap) || ee)),
          (J = ar(
            e,
            s,
            i,
            h,
            H ? 1 : d.swapThreshold,
            d.invertedSwapThreshold == null ? d.swapThreshold : d.invertedSwapThreshold,
            Et,
            Ue === s
          ));
        var C;
        if (J !== 0) {
          var M = ue(b);
          do (M -= J), (C = Y.children[M]);
          while (C && (E(C, "display") === "none" || C === D));
        }
        if (J === 0 || C === s) return O(!1);
        (Ue = s), (ct = J);
        var L = s.nextElementSibling,
          W = !1;
        W = J === 1;
        var Oe = Mt(U, n, b, o, s, i, e, W);
        if (Oe !== !1)
          return (
            (Oe === 1 || Oe === -1) && (W = Oe === 1),
            (bn = !0),
            setTimeout(or, 30),
            w(),
            W && !L ? n.appendChild(b) : s.parentNode.insertBefore(b, W ? L : s),
            _ && Ms(_, 0, x - _.scrollTop),
            (Y = b.parentNode),
            j !== void 0 && !Et && (Dt = Math.abs(j - q(s)[he])),
            A(),
            O(!0)
          );
      }
      if (n.contains(b)) return O(!1);
    }
    return !1;
  },
  _ignoreWhileAnimating: null,
  _offMoveEvents: function () {
    N(document, "mousemove", this._onTouchMove),
      N(document, "touchmove", this._onTouchMove),
      N(document, "pointermove", this._onTouchMove),
      N(document, "dragover", $e),
      N(document, "mousemove", $e),
      N(document, "touchmove", $e);
  },
  _offUpEvents: function () {
    var e = this.el.ownerDocument;
    N(e, "mouseup", this._onDrop),
      N(e, "touchend", this._onDrop),
      N(e, "pointerup", this._onDrop),
      N(e, "touchcancel", this._onDrop),
      N(document, "selectstart", this);
  },
  _onDrop: function (e) {
    var n = this.el,
      s = this.options;
    if (
      ((ae = ue(b)),
      (De = ue(b, s.draggable)),
      oe("drop", this, { evt: e }),
      (Y = b && b.parentNode),
      (ae = ue(b)),
      (De = ue(b, s.draggable)),
      k.eventCanceled)
    ) {
      this._nulling();
      return;
    }
    (Ge = !1),
      (Et = !1),
      (ut = !1),
      clearInterval(this._loopId),
      clearTimeout(this._dragStartTimer),
      yn(this.cloneId),
      yn(this._dragStartId),
      this.nativeDraggable && (N(document, "drop", this), N(n, "dragstart", this._onDragStart)),
      this._offMoveEvents(),
      this._offUpEvents(),
      at && E(document.body, "user-select", ""),
      E(b, "transform", ""),
      e &&
        (st && (e.cancelable && e.preventDefault(), !s.dropBubble && e.stopPropagation()),
        D && D.parentNode && D.parentNode.removeChild(D),
        (U === Y || (Q && Q.lastPutMode !== "clone")) && G && G.parentNode && G.parentNode.removeChild(G),
        b &&
          (this.nativeDraggable && N(b, "dragend", this),
          rn(b),
          (b.style["will-change"] = ""),
          st && !Ge && re(b, Q ? Q.options.ghostClass : this.options.ghostClass, !1),
          re(b, this.options.chosenClass, !1),
          ne({ sortable: this, name: "unchoose", toEl: Y, newIndex: null, newDraggableIndex: null, originalEvent: e }),
          U !== Y
            ? (ae >= 0 &&
                (ne({ rootEl: Y, name: "add", toEl: Y, fromEl: U, originalEvent: e }),
                ne({ sortable: this, name: "remove", toEl: Y, originalEvent: e }),
                ne({ rootEl: Y, name: "sort", toEl: Y, fromEl: U, originalEvent: e }),
                ne({ sortable: this, name: "sort", toEl: Y, originalEvent: e })),
              Q && Q.save())
            : ae !== Ve &&
              ae >= 0 &&
              (ne({ sortable: this, name: "update", toEl: Y, originalEvent: e }),
              ne({ sortable: this, name: "sort", toEl: Y, originalEvent: e })),
          k.active &&
            ((ae == null || ae === -1) && ((ae = Ve), (De = dt)),
            ne({ sortable: this, name: "end", toEl: Y, originalEvent: e }),
            this.save()))),
      this._nulling();
  },
  _nulling: function () {
    oe("nulling", this),
      (U =
        b =
        Y =
        D =
        Re =
        G =
        Ot =
        Ae =
        Le =
        ge =
        st =
        ae =
        De =
        Ve =
        dt =
        Ue =
        ct =
        Q =
        St =
        k.dragged =
        k.ghost =
        k.clone =
        k.active =
          null),
      Bt.forEach(function (e) {
        e.checked = !0;
      }),
      (Bt.length = nn = sn = 0);
  },
  handleEvent: function (e) {
    switch (e.type) {
      case "drop":
      case "dragend":
        this._onDrop(e);
        break;
      case "dragenter":
      case "dragover":
        b && (this._onDragOver(e), sr(e));
        break;
      case "selectstart":
        e.preventDefault();
        break;
    }
  },
  toArray: function () {
    for (var e = [], n, s = this.el.children, o = 0, i = s.length, r = this.options; o < i; o++)
      (n = s[o]), ve(n, r.draggable, this.el, !1) && e.push(n.getAttribute(r.dataIdAttr) || dr(n));
    return e;
  },
  sort: function (e, n) {
    var s = {},
      o = this.el;
    this.toArray().forEach(function (i, r) {
      var d = o.children[r];
      ve(d, this.options.draggable, o, !1) && (s[i] = d);
    }, this),
      n && this.captureAnimationState(),
      e.forEach(function (i) {
        s[i] && (o.removeChild(s[i]), o.appendChild(s[i]));
      }),
      n && this.animateAll();
  },
  save: function () {
    var e = this.options.store;
    e && e.set && e.set(this);
  },
  closest: function (e, n) {
    return ve(e, n || this.options.draggable, this.el, !1);
  },
  option: function (e, n) {
    var s = this.options;
    if (n === void 0) return s[e];
    var o = mt.modifyOption(this, e, n);
    typeof o < "u" ? (s[e] = o) : (s[e] = n), e === "group" && Os(s);
  },
  destroy: function () {
    oe("destroy", this);
    var e = this.el;
    (e[ce] = null),
      N(e, "mousedown", this._onTapStart),
      N(e, "touchstart", this._onTapStart),
      N(e, "pointerdown", this._onTapStart),
      this.nativeDraggable && (N(e, "dragover", this), N(e, "dragenter", this)),
      Array.prototype.forEach.call(e.querySelectorAll("[draggable]"), function (n) {
        n.removeAttribute("draggable");
      }),
      this._onDrop(),
      this._disableDelayedDragEvents(),
      jt.splice(jt.indexOf(this.el), 1),
      (this.el = e = null);
  },
  _hideClone: function () {
    if (!Ae) {
      if ((oe("hideClone", this), k.eventCanceled)) return;
      E(G, "display", "none"), this.options.removeCloneOnHide && G.parentNode && G.parentNode.removeChild(G), (Ae = !0);
    }
  },
  _showClone: function (e) {
    if (e.lastPutMode !== "clone") {
      this._hideClone();
      return;
    }
    if (Ae) {
      if ((oe("showClone", this), k.eventCanceled)) return;
      b.parentNode == U && !this.options.group.revertClone
        ? U.insertBefore(G, b)
        : Re
        ? U.insertBefore(G, Re)
        : U.appendChild(G),
        this.options.group.revertClone && this.animate(b, G),
        E(G, "display", ""),
        (Ae = !1);
    }
  },
};
function sr(t) {
  t.dataTransfer && (t.dataTransfer.dropEffect = "move"), t.cancelable && t.preventDefault();
}
function Mt(t, e, n, s, o, i, r, d) {
  var l,
    c = t[ce],
    g = c.options.onMove,
    u;
  return (
    window.CustomEvent && !Ce && !gt
      ? (l = new CustomEvent("move", { bubbles: !0, cancelable: !0 }))
      : ((l = document.createEvent("Event")), l.initEvent("move", !0, !0)),
    (l.to = e),
    (l.from = t),
    (l.dragged = n),
    (l.draggedRect = s),
    (l.related = o || e),
    (l.relatedRect = i || q(e)),
    (l.willInsertAfter = d),
    (l.originalEvent = r),
    t.dispatchEvent(l),
    g && (u = g.call(c, l, r)),
    u
  );
}
function rn(t) {
  t.draggable = !1;
}
function or() {
  bn = !1;
}
function ir(t, e, n) {
  var s = q(Je(n.el, 0, n.options, !0)),
    o = 10;
  return e
    ? t.clientX < s.left - o || (t.clientY < s.top && t.clientX < s.right)
    : t.clientY < s.top - o || (t.clientY < s.bottom && t.clientX < s.left);
}
function rr(t, e, n) {
  var s = q(Mn(n.el, n.options.draggable)),
    o = 10;
  return e
    ? t.clientX > s.right + o || (t.clientX <= s.right && t.clientY > s.bottom && t.clientX >= s.left)
    : (t.clientX > s.right && t.clientY > s.top) || (t.clientX <= s.right && t.clientY > s.bottom + o);
}
function ar(t, e, n, s, o, i, r, d) {
  var l = s ? t.clientY : t.clientX,
    c = s ? n.height : n.width,
    g = s ? n.top : n.left,
    u = s ? n.bottom : n.right,
    m = !1;
  if (!r) {
    if (d && Dt < c * o) {
      if ((!ut && (ct === 1 ? l > g + (c * i) / 2 : l < u - (c * i) / 2) && (ut = !0), ut)) m = !0;
      else if (ct === 1 ? l < g + Dt : l > u - Dt) return -ct;
    } else if (l > g + (c * (1 - o)) / 2 && l < u - (c * (1 - o)) / 2) return lr(e);
  }
  return (m = m || r), m && (l < g + (c * i) / 2 || l > u - (c * i) / 2) ? (l > g + c / 2 ? 1 : -1) : 0;
}
function lr(t) {
  return ue(b) < ue(t) ? 1 : -1;
}
function dr(t) {
  for (var e = t.tagName + t.className + t.src + t.href + t.textContent, n = e.length, s = 0; n--; )
    s += e.charCodeAt(n);
  return s.toString(36);
}
function cr(t) {
  Bt.length = 0;
  for (var e = t.getElementsByTagName("input"), n = e.length; n--; ) {
    var s = e[n];
    s.checked && Bt.push(s);
  }
}
function At(t) {
  return setTimeout(t, 0);
}
function yn(t) {
  return clearTimeout(t);
}
Ut &&
  $(document, "touchmove", function (t) {
    (k.active || Ge) && t.cancelable && t.preventDefault();
  });
k.utils = {
  on: $,
  off: N,
  css: E,
  find: Es,
  is: function (e, n) {
    return !!ve(e, n, e, !1);
  },
  extend: Yi,
  throttle: ks,
  closest: ve,
  toggleClass: re,
  clone: Is,
  index: ue,
  nextTick: At,
  cancelNextTick: yn,
  detectDirection: Cs,
  getChild: Je,
};
k.get = function (t) {
  return t[ce];
};
k.mount = function () {
  for (var t = arguments.length, e = new Array(t), n = 0; n < t; n++) e[n] = arguments[n];
  e[0].constructor === Array && (e = e[0]),
    e.forEach(function (s) {
      if (!s.prototype || !s.prototype.constructor)
        throw "Sortable: Mounted plugin must be a constructor function, not ".concat({}.toString.call(s));
      s.utils && (k.utils = _e(_e({}, k.utils), s.utils)), mt.mount(s);
    });
};
k.create = function (t, e) {
  return new k(t, e);
};
k.version = Ui;
var V = [],
  ot,
  wn,
  _n = !1,
  an,
  ln,
  zt,
  it;
function ur() {
  function t() {
    this.defaults = {
      scroll: !0,
      forceAutoScrollFallback: !1,
      scrollSensitivity: 30,
      scrollSpeed: 10,
      bubbleScroll: !0,
    };
    for (var e in this) e.charAt(0) === "_" && typeof this[e] == "function" && (this[e] = this[e].bind(this));
  }
  return (
    (t.prototype = {
      dragStarted: function (n) {
        var s = n.originalEvent;
        this.sortable.nativeDraggable
          ? $(document, "dragover", this._handleAutoScroll)
          : this.options.supportPointer
          ? $(document, "pointermove", this._handleFallbackAutoScroll)
          : s.touches
          ? $(document, "touchmove", this._handleFallbackAutoScroll)
          : $(document, "mousemove", this._handleFallbackAutoScroll);
      },
      dragOverCompleted: function (n) {
        var s = n.originalEvent;
        !this.options.dragOverBubble && !s.rootEl && this._handleAutoScroll(s);
      },
      drop: function () {
        this.sortable.nativeDraggable
          ? N(document, "dragover", this._handleAutoScroll)
          : (N(document, "pointermove", this._handleFallbackAutoScroll),
            N(document, "touchmove", this._handleFallbackAutoScroll),
            N(document, "mousemove", this._handleFallbackAutoScroll)),
          ts(),
          Pt(),
          Xi();
      },
      nulling: function () {
        (zt = wn = ot = _n = it = an = ln = null), (V.length = 0);
      },
      _handleFallbackAutoScroll: function (n) {
        this._handleAutoScroll(n, !0);
      },
      _handleAutoScroll: function (n, s) {
        var o = this,
          i = (n.touches ? n.touches[0] : n).clientX,
          r = (n.touches ? n.touches[0] : n).clientY,
          d = document.elementFromPoint(i, r);
        if (((zt = n), s || this.options.forceAutoScrollFallback || gt || Ce || at)) {
          dn(n, this.options, d, s);
          var l = Pe(d, !0);
          _n &&
            (!it || i !== an || r !== ln) &&
            (it && ts(),
            (it = setInterval(function () {
              var c = Pe(document.elementFromPoint(i, r), !0);
              c !== l && ((l = c), Pt()), dn(n, o.options, c, s);
            }, 10)),
            (an = i),
            (ln = r));
        } else {
          if (!this.options.bubbleScroll || Pe(d, !0) === we()) {
            Pt();
            return;
          }
          dn(n, this.options, Pe(d, !1), !1);
        }
      },
    }),
    Ie(t, { pluginName: "scroll", initializeByDefault: !0 })
  );
}
function Pt() {
  V.forEach(function (t) {
    clearInterval(t.pid);
  }),
    (V = []);
}
function ts() {
  clearInterval(it);
}
var dn = ks(function (t, e, n, s) {
    if (e.scroll) {
      var o = (t.touches ? t.touches[0] : t).clientX,
        i = (t.touches ? t.touches[0] : t).clientY,
        r = e.scrollSensitivity,
        d = e.scrollSpeed,
        l = we(),
        c = !1,
        g;
      wn !== n && ((wn = n), Pt(), (ot = e.scroll), (g = e.scrollFn), ot === !0 && (ot = Pe(n, !0)));
      var u = 0,
        m = ot;
      do {
        var h = m,
          f = q(h),
          y = f.top,
          T = f.bottom,
          w = f.left,
          O = f.right,
          A = f.width,
          R = f.height,
          X = void 0,
          J = void 0,
          j = h.scrollWidth,
          ee = h.scrollHeight,
          H = E(h),
          he = h.scrollLeft,
          _ = h.scrollTop;
        h === l
          ? ((X = A < j && (H.overflowX === "auto" || H.overflowX === "scroll" || H.overflowX === "visible")),
            (J = R < ee && (H.overflowY === "auto" || H.overflowY === "scroll" || H.overflowY === "visible")))
          : ((X = A < j && (H.overflowX === "auto" || H.overflowX === "scroll")),
            (J = R < ee && (H.overflowY === "auto" || H.overflowY === "scroll")));
        var x = X && (Math.abs(O - o) <= r && he + A < j) - (Math.abs(w - o) <= r && !!he),
          C = J && (Math.abs(T - i) <= r && _ + R < ee) - (Math.abs(y - i) <= r && !!_);
        if (!V[u]) for (var M = 0; M <= u; M++) V[M] || (V[M] = {});
        (V[u].vx != x || V[u].vy != C || V[u].el !== h) &&
          ((V[u].el = h),
          (V[u].vx = x),
          (V[u].vy = C),
          clearInterval(V[u].pid),
          (x != 0 || C != 0) &&
            ((c = !0),
            (V[u].pid = setInterval(
              function () {
                s && this.layer === 0 && k.active._onTouchMove(zt);
                var L = V[this.layer].vy ? V[this.layer].vy * d : 0,
                  W = V[this.layer].vx ? V[this.layer].vx * d : 0;
                (typeof g == "function" &&
                  g.call(k.dragged.parentNode[ce], W, L, t, zt, V[this.layer].el) !== "continue") ||
                  Ms(V[this.layer].el, W, L);
              }.bind({ layer: u }),
              24
            )))),
          u++;
      } while (e.bubbleScroll && m !== l && (m = Pe(m, !1)));
      _n = c;
    }
  }, 30),
  Ps = function (e) {
    var n = e.originalEvent,
      s = e.putSortable,
      o = e.dragEl,
      i = e.activeSortable,
      r = e.dispatchSortableEvent,
      d = e.hideGhostForTarget,
      l = e.unhideGhostForTarget;
    if (n) {
      var c = s || i;
      d();
      var g = n.changedTouches && n.changedTouches.length ? n.changedTouches[0] : n,
        u = document.elementFromPoint(g.clientX, g.clientY);
      l(), c && !c.el.contains(u) && (r("spill"), this.onSpill({ dragEl: o, putSortable: s }));
    }
  };
function In() {}
In.prototype = {
  startIndex: null,
  dragStart: function (e) {
    var n = e.oldDraggableIndex;
    this.startIndex = n;
  },
  onSpill: function (e) {
    var n = e.dragEl,
      s = e.putSortable;
    this.sortable.captureAnimationState(), s && s.captureAnimationState();
    var o = Je(this.sortable.el, this.startIndex, this.options);
    o ? this.sortable.el.insertBefore(n, o) : this.sortable.el.appendChild(n),
      this.sortable.animateAll(),
      s && s.animateAll();
  },
  drop: Ps,
};
Ie(In, { pluginName: "revertOnSpill" });
function Tn() {}
Tn.prototype = {
  onSpill: function (e) {
    var n = e.dragEl,
      s = e.putSortable,
      o = s || this.sortable;
    o.captureAnimationState(), n.parentNode && n.parentNode.removeChild(n), o.animateAll();
  },
  drop: Ps,
};
Ie(Tn, { pluginName: "removeOnSpill" });
k.mount(new ur());
k.mount(Tn, In);
const hr = "/webpagesish/dist/assets/drag-0ea74a85.svg",
  gr = "/webpagesish/dist/assets/plus-e3bfb6b2.svg",
  Ns = "/webpagesish/dist/assets/undo-5bb0a516.svg";
const mr = {
    components: { Picker: Ti, ResetDropdown: ji },
    props: ["addon", "tableChild", "setting", "addon-settings"],
    data() {
      var t;
      return (
        console.log(this.setting, this.addon),
        {
          rowDropdownOpen: !1,
          noResetDropdown: ["table", "boolean", "select"].includes((t = this.setting) == null ? void 0 : t.type),
        }
      );
    },
    mounted() {
      ht.$on("close-reset-dropdowns", (t) => {
        this.rowDropdownOpen && this !== t && (this.rowDropdownOpen = !1);
      });
    },
    computed: {
      show() {
        return !!(
          !this.setting.if ||
          (this.setting.if.addonEnabled &&
            (Array.isArray(this.setting.if.addonEnabled)
              ? this.setting.if.addonEnabled
              : [this.setting.if.addonEnabled]
            ).some((e) => this.$root.manifestsById[e]._enabled === !0)) ||
          (this.setting.if.settings &&
            Object.keys(this.setting.if.settings).some((e) =>
              (Array.isArray(this.setting.if.settings[e])
                ? this.setting.if.settings[e]
                : [this.setting.if.settings[e]]
              ).some((s) => {
                var o, i;
                return (
                  this.addonSettings[e] === s ||
                  ((i = (o = this.$parent) == null ? void 0 : o.addonSettings) == null ? void 0 : i[e]) === s
                );
              })
            ) === !0)
        );
      },
      showResetDropdown() {
        return (
          !this.tableChild &&
          this.addon.presets &&
          this.addon.presets.some(
            (t) =>
              Object.prototype.hasOwnProperty.call(t.values, this.setting.id) &&
              (this.setting.type === "color"
                ? t.values[this.setting.id].toLowerCase() !== this.setting.default.toLowerCase()
                : t.values[this.setting.id] !== this.setting.default)
          )
        );
      },
      isNewOption() {
        if (!this.addon.latestUpdate) return !1;
        const [t, e, n] = this.$root.version.split("."),
          [s, o, i] = this.addon.latestUpdate.version.split(".");
        return t === s && e === o
          ? !!(this.addon.latestUpdate.newSettings && this.addon.latestUpdate.newSettings.includes(this.setting.id))
          : !1;
      },
    },
    methods: {
      update(t) {
        let e = this.addonSettings[this.setting.id];
        e.splice(t.newIndex, 0, e.splice(t.oldIndex, 1)[0]), this.updateSettings();
      },
      settingsName(t) {
        const e = this.setting.name,
          n = /([\\]*)(@|#)([a-zA-Z0-9.\-\/_]*)/g;
        return e.replace(n, (s) => {
          if (s[0] === "\\") return s.slice(1);
          if (s[0] === "@") return `<img class="inline-icon" src="../../images/icons/${s.split("@")[1]}"/>`;
          if (s[0] === "#") return `<img class="inline-icon" src="../../addons/${t._addonId}/${s.split("#")[1]}"/>`;
        });
      },
      checkValidity(t) {
        let e = t.target;
        this.addonSettings[this.setting.id] = e.validity.valid ? e.value : this.setting.default;
      },
      keySettingKeyDown(t) {
        t.preventDefault(),
          (t.target.value = t.ctrlKey
            ? "Ctrl" +
              (t.shiftKey ? " + Shift" : "") +
              (t.key === "Control" || t.key === "Shift"
                ? ""
                : (t.ctrlKey ? " + " : "") +
                  (t.key.toUpperCase() === t.key
                    ? t.code.includes("Digit")
                      ? t.code.substring(5, t.code.length)
                      : t.key
                    : t.key.toUpperCase()))
            : "");
      },
      keySettingKeyUp(t) {
        t.target.value === "Ctrl" && (t.target.value = ""), this.updateOption(t.target.value);
      },
      getTableSetting(t) {
        return this.setting.row.find((e) => e.id === t);
      },
      deleteTableRow(t) {
        this.addonSettings[this.setting.id].splice(t, 1), this.updateSettings();
      },
      addTableRow(t = {}) {
        const e = Object.assign(
          {},
          this.setting.row.reduce((n, s) => ((n[s.id] = s.default), n), {}),
          t
        );
        this.addonSettings[this.setting.id].push(e),
          this.updateSettings(),
          this.rowDropdownOpen && this.toggleRowDropdown();
      },
      toggleRowDropdown() {
        (this.rowDropdownOpen = !this.rowDropdownOpen),
          this.$root.closePickers({ isTrusted: !0 }, null, { callCloseDropdowns: !1 }),
          this.$root.closeResetDropdowns({ isTrusted: !0 }, this);
      },
      msg(...t) {
        return this.$root.msg(...t);
      },
      updateSettings(...t) {
        t[0] || (t[0] = this.addon), this.$root.updateSettings(...t);
      },
      updateOption(t) {
        (this.addonSettings[this.setting.id] = t), this.updateSettings();
      },
      closePickers(...t) {
        return console.log("hi"), this.$root.closePickers(...t);
      },
      closeResetDropdowns(...t) {
        return this.$root.closeResetDropdowns(...t);
      },
    },
    directives: {
      sortable: {
        mounted: (t, e, n) => {
          console.log(e.instance),
            new k(t, { handle: ".handle", animation: 300, onUpdate: e.value.update, disabled: !e.value.enabled });
        },
      },
    },
  },
  pr = { class: "setting-label-container" },
  fr = ["innerHTML"],
  vr = { key: 0, class: "setting-table" },
  br = { class: "setting-table-list" },
  yr = { class: "setting-table-row" },
  wr = { class: "setting-table-options" },
  _r = ["disabled", "onClick"],
  xr = a("img", { class: "icon-type", src: bs }, null, -1),
  Sr = [xr],
  Er = ["disabled"],
  kr = a("img", { class: "icon-type", src: hr }, null, -1),
  Mr = [kr],
  Ir = { class: "setting-table-row-settings" },
  Tr = ["disabled"],
  Cr = a("img", { class: "icon-type", src: gr }, null, -1),
  Or = [Cr],
  Dr = ["disabled"],
  Ar = a("img", { class: "icon-type", src: Ht }, null, -1),
  Pr = [Ar],
  Nr = ["onClick"],
  Lr = ["disabled"],
  $r = { key: 2, class: "filter-options" },
  Rr = ["onClick"],
  Fr = ["disabled"],
  jr = ["disabled", "min", "max"],
  Br = ["disabled", "placeholder", "maxlength", "minlength", "required"],
  zr = ["disabled", "placeholder"],
  Hr = ["disabled", "title"],
  Ur = a("img", { src: Ns, class: "icon-type" }, null, -1),
  Wr = [Ur];
function Gr(t, e, n, s, o, i) {
  const r = me("addon-tag"),
    d = me("addon-setting", !0),
    l = me("picker"),
    c = me("reset-dropdown"),
    g = Nt("sortable"),
    u = Nt("click-outside");
  return F(
    (p(),
    v(
      "div",
      {
        class: B([
          "addon-setting",
          {
            "boolean-setting": n.setting.type === "boolean",
            "number-setting": n.setting.type === "integer" || n.setting.type === "positive_integer",
          },
        ]),
      },
      [
        a("div", pr, [
          a("div", { class: "setting-label", innerHTML: i.settingsName(n.addon) }, null, 8, fr),
          i.isNewOption ? (p(), be(r, { key: 0, tag: "new" })) : P("", !0),
        ]),
        o.noResetDropdown
          ? (p(),
            v(
              z,
              { key: 0 },
              [
                n.setting.type === "table"
                  ? (p(),
                    v("div", vr, [
                      F(
                        (p(),
                        v("div", br, [
                          (p(!0),
                          v(
                            z,
                            null,
                            K(
                              t.addonSettings[n.setting.id],
                              (m, h) => (
                                p(),
                                v("div", yr, [
                                  a("div", wr, [
                                    a(
                                      "button",
                                      {
                                        disabled: !n.addon._enabled,
                                        class: "addon-buttons",
                                        onClick: (f) => i.deleteTableRow(m),
                                      },
                                      Sr,
                                      8,
                                      _r
                                    ),
                                    a(
                                      "button",
                                      { disabled: !n.addon._enabled, class: "addon-buttons handle" },
                                      Mr,
                                      8,
                                      Er
                                    ),
                                  ]),
                                  a("div", Ir, [
                                    (p(!0),
                                    v(
                                      z,
                                      null,
                                      K(
                                        h,
                                        (f, y) => (
                                          p(),
                                          be(
                                            d,
                                            {
                                              addon: n.addon,
                                              "table-child": !0,
                                              setting: i.getTableSetting(f),
                                              "addon-settings": h,
                                            },
                                            null,
                                            8,
                                            ["addon", "setting", "addon-settings"]
                                          )
                                        )
                                      ),
                                      256
                                    )),
                                  ]),
                                ])
                              )
                            ),
                            256
                          )),
                        ])),
                        [[g, { update: i.update, enabled: n.addon._enabled }]]
                      ),
                      a(
                        "div",
                        { class: B(["addon-split-button setting-table-dropdown", { open: o.rowDropdownOpen }]) },
                        [
                          a(
                            "button",
                            {
                              disabled: !n.addon._enabled,
                              class: "addon-buttons addon-split-button-button",
                              onClick: e[0] || (e[0] = (m) => i.addTableRow()),
                            },
                            Or,
                            8,
                            Tr
                          ),
                          F(
                            (p(),
                            v("div", null, [
                              a(
                                "button",
                                {
                                  disabled: !n.addon._enabled,
                                  class: "addon-buttons addon-split-button-dropdown",
                                  onClick: e[1] || (e[1] = (...m) => i.toggleRowDropdown && i.toggleRowDropdown(...m)),
                                },
                                Pr,
                                8,
                                Dr
                              ),
                              a("ul", null, [
                                (p(!0),
                                v(
                                  z,
                                  null,
                                  K(
                                    n.setting.presets,
                                    (m) => (p(), v("li", { onClick: (h) => i.addTableRow(m.values) }, S(m.name), 9, Nr))
                                  ),
                                  256
                                )),
                              ]),
                            ])),
                            [[u, i.closeResetDropdowns]]
                          ),
                        ],
                        2
                      ),
                    ]))
                  : P("", !0),
                n.setting.type === "boolean"
                  ? F(
                      (p(),
                      v(
                        "input",
                        {
                          key: 1,
                          type: "checkbox",
                          class: "setting-input check",
                          "onUpdate:modelValue": e[2] || (e[2] = (m) => (t.addonSettings[n.setting.id] = m)),
                          onChange: e[3] || (e[3] = (m) => i.updateSettings()),
                          disabled: !n.addon._enabled,
                        },
                        null,
                        40,
                        Lr
                      )),
                      [[as, t.addonSettings[n.setting.id]]]
                    )
                  : P("", !0),
                n.setting.type === "select"
                  ? (p(),
                    v("div", $r, [
                      (p(!0),
                      v(
                        z,
                        null,
                        K(
                          n.setting.potentialValues,
                          (m) => (
                            p(),
                            v(
                              "div",
                              {
                                class: B([
                                  "filter-option",
                                  { sel: t.addonSettings[n.setting.id] === m.id, disabled: !n.addon._enabled },
                                ]),
                                onClick: (h) => i.updateOption(m.id),
                              },
                              S(m.name),
                              11,
                              Rr
                            )
                          )
                        ),
                        256
                      )),
                    ]))
                  : P("", !0),
              ],
              64
            ))
          : (p(),
            v(
              "div",
              { key: 1, class: B(["setting-input-container", { "full-radius": n.tableChild }]) },
              [
                n.setting.type === "positive_integer"
                  ? F(
                      (p(),
                      v(
                        "input",
                        {
                          key: 0,
                          type: "number",
                          class: "setting-input number",
                          "onUpdate:modelValue": e[4] || (e[4] = (m) => (t.addonSettings[n.setting.id] = m)),
                          onChange: e[5] || (e[5] = (m) => i.checkValidity(m) || i.updateSettings()),
                          disabled: !n.addon._enabled,
                          min: "0",
                          number: "",
                        },
                        null,
                        40,
                        Fr
                      )),
                      [[nt, t.addonSettings[n.setting.id]]]
                    )
                  : P("", !0),
                n.setting.type === "integer"
                  ? F(
                      (p(),
                      v(
                        "input",
                        {
                          key: 1,
                          type: "number",
                          class: "setting-input number",
                          "onUpdate:modelValue": e[6] || (e[6] = (m) => (t.addonSettings[n.setting.id] = m)),
                          onChange: e[7] || (e[7] = (m) => i.checkValidity(m) || i.updateSettings()),
                          disabled: !n.addon._enabled,
                          min: n.setting.min,
                          max: n.setting.max,
                          number: "",
                        },
                        null,
                        40,
                        jr
                      )),
                      [[nt, t.addonSettings[n.setting.id]]]
                    )
                  : P("", !0),
                n.setting.type === "string" || n.setting.type === "untranslated"
                  ? F(
                      (p(),
                      v(
                        "input",
                        {
                          key: 2,
                          type: "text",
                          class: "setting-input string",
                          "onUpdate:modelValue": e[8] || (e[8] = (m) => (t.addonSettings[n.setting.id] = m)),
                          onChange: e[9] || (e[9] = (m) => i.checkValidity(m) || i.updateSettings()),
                          disabled: !n.addon._enabled,
                          placeholder: n.setting.default,
                          maxlength: n.setting.max || 100,
                          minlength: n.setting.min || 0,
                          required: !!n.setting.min,
                        },
                        null,
                        40,
                        Br
                      )),
                      [[nt, t.addonSettings[n.setting.id]]]
                    )
                  : P("", !0),
                n.setting.type === "key"
                  ? F(
                      (p(),
                      v(
                        "input",
                        {
                          key: 3,
                          type: "text",
                          class: "setting-input",
                          "onUpdate:modelValue": e[10] || (e[10] = (m) => (t.addonSettings[n.setting.id] = m)),
                          onInput: e[11] || (e[11] = (...m) => i.updateSettings && i.updateSettings(...m)),
                          onKeydown: e[12] || (e[12] = (...m) => i.keySettingKeyDown && i.keySettingKeyDown(...m)),
                          onKeyup: e[13] || (e[13] = (...m) => i.keySettingKeyUp && i.keySettingKeyUp(...m)),
                          disabled: !n.addon._enabled,
                          placeholder: n.setting.default,
                          maxlength: "100",
                          spellcheck: "false",
                        },
                        null,
                        40,
                        zr
                      )),
                      [[nt, t.addonSettings[n.setting.id]]]
                    )
                  : P("", !0),
                n.setting.type === "color"
                  ? F(
                      (p(),
                      be(
                        l,
                        {
                          key: 4,
                          value: t.addonSettings[n.setting.id],
                          setting: n.setting,
                          addon: n.addon,
                          alphaEnabled: n.setting.allowTransparency,
                        },
                        null,
                        8,
                        ["value", "setting", "addon", "alphaEnabled"]
                      )),
                      [[u, i.closePickers]]
                    )
                  : P("", !0),
                i.showResetDropdown
                  ? F(
                      (p(),
                      be(
                        c,
                        { key: 5, setting: n.setting, enabled: n.addon._enabled, presets: n.addon.presets },
                        null,
                        8,
                        ["setting", "enabled", "presets"]
                      )),
                      [[u, i.closeResetDropdowns]]
                    )
                  : P("", !0),
                !n.tableChild && !i.showResetDropdown
                  ? (p(),
                    v(
                      "button",
                      {
                        key: 6,
                        type: "button",
                        class: "large-button clear-button",
                        disabled: !n.addon._enabled,
                        title: i.msg("reset"),
                        onClick: e[14] || (e[14] = (m) => i.updateOption(n.setting.default || "")),
                      },
                      Wr,
                      8,
                      Hr
                    ))
                  : P("", !0),
              ],
              2
            )),
      ],
      2
    )),
    [[Z, i.show]]
  );
}
const Yr = xe(mr, [["render", Gr]]);
const Xr = window.parent !== window,
  Vr = {
    props: ["tag"],
    data() {
      return {};
    },
    computed: {
      tagInfo() {
        return vs.find((t) => t.matchName === this.tag);
      },
      shouldShow() {
        return Xr
          ? this.tagInfo && this.tagInfo.iframeAlwaysShow
          : this.tagInfo && (!this.tagInfo.addonTabShow || this.tagInfo.addonTabShow[this.$root.selectedCategory]);
      },
      tagName() {
        return chrome.i18n.getMessage(this.tagInfo.name);
      },
      tagTooltip() {
        return chrome.i18n.getMessage(this.tagInfo.tooltipText);
      },
    },
  },
  Kr = { key: 0, class: "tooltiptext" };
function Jr(t, e, n, s, o, i) {
  return i.shouldShow
    ? (p(),
      v(
        "div",
        {
          key: 0,
          class: B([
            "badge",
            {
              tooltip: i.tagInfo.tooltipText,
              blue: i.tagInfo.color === "blue",
              yellow: i.tagInfo.color === "yellow",
              red: i.tagInfo.color === "red",
              darkred: i.tagInfo.color === "darkred",
              green: i.tagInfo.color === "green",
              darkgreen: i.tagInfo.color === "darkgreen",
              purple: i.tagInfo.color === "purple",
            },
          ]),
        },
        [le(S(i.tagName) + " ", 1), i.tagInfo.tooltipText ? (p(), v("span", Kr, S(i.tagTooltip), 1)) : P("", !0)],
        2
      ))
    : P("", !0);
}
const qr = xe(Vr, [["render", Jr]]);
function pe(t) {
  return {
    r: parseInt(t.substring(1, 3), 16),
    g: parseInt(t.substring(3, 5), 16),
    b: parseInt(t.substring(5, 7), 16),
    a: t.length >= 9 ? parseInt(t.substring(7, 9), 16) / 255 : 1,
  };
}
function It(t) {
  return (t = Math.round(t).toString(16)), t.length === 1 ? `0${t}` : t;
}
function pt(t) {
  const e = It(t.r),
    n = It(t.g),
    s = It(t.b),
    o = t.a !== void 0 ? It(255 * t.a) : "";
  return `#${e}${n}${s}${o}`;
}
function Ls({ h: t, s: e, v: n }) {
  if (e === 0) return { r: 255 * n, g: 255 * n, b: 255 * n };
  (t %= 360), t < 0 && (t += 360);
  const s = t / 60,
    o = Math.floor(s),
    i = n * (1 - e * (1 - s + o)),
    r = n * (1 - e * (s - o)),
    d = n * (1 - e);
  switch (o) {
    case 0:
      return { r: 255 * n, g: 255 * i, b: 255 * d };
    case 1:
      return { r: 255 * r, g: 255 * n, b: 255 * d };
    case 2:
      return { r: 255 * d, g: 255 * n, b: 255 * i };
    case 3:
      return { r: 255 * d, g: 255 * r, b: 255 * n };
    case 4:
      return { r: 255 * i, g: 255 * d, b: 255 * n };
    case 5:
      return { r: 255 * n, g: 255 * d, b: 255 * r };
  }
}
function rt({ r: t, g: e, b: n }) {
  (t /= 255), (e /= 255), (n /= 255);
  const s = Math.max(t, e, n),
    o = s - Math.min(t, e, n);
  if (o === 0) return { h: 0, s: 0, v: s };
  const i = o / s,
    r = (s - t) / o,
    d = (s - e) / o,
    l = (s - n) / o;
  let c;
  return r ? (d ? l || (c = 4 + d - r) : (c = 2 + r - l)) : (c = l - d), { h: (60 * c) % 360, s: i, v: s };
}
function xn(t) {
  const { r: e, g: n, b: s } = pe(t);
  return e * 0.299 + n * 0.587 + s * 0.114;
}
function Qr(t, e, n, s) {
  return (
    (s = s !== void 0 ? s : 170),
    typeof s != "number" && (s = xn(s)),
    xn(t) > s ? (e !== void 0 ? e : "#575e75") : n !== void 0 ? n : "#ffffff"
  );
}
function Zr(t, e) {
  const { r: n, g: s, b: o, a: i } = pe(t);
  return (
    e.r === void 0 && (e.r = 1),
    e.g === void 0 && (e.g = 1),
    e.b === void 0 && (e.b = 1),
    e.a === void 0 && (e.a = 1),
    pt({ r: e.r * n, g: e.g * s, b: e.b * o, a: e.a * i })
  );
}
function ea(t, e) {
  const { r: n, g: s, b: o, a: i } = pe(t);
  return (
    e.r === void 0 && (e.r = 1),
    e.g === void 0 && (e.g = 1),
    e.b === void 0 && (e.b = 1),
    e.a === void 0 && (e.a = 1),
    pt({
      r: (1 - e.r) * 255 + e.r * n,
      g: (1 - e.g) * 255 + e.g * s,
      b: (1 - e.b) * 255 + e.b * o,
      a: 1 - e.a + e.a * i,
    })
  );
}
function ta(t, e) {
  const { r: n, g: s, b: o } = pe(t),
    { r: i, g: r, b: d, a: l } = pe(e);
  return pt({ r: (1 - l) * n + l * i, g: (1 - l) * s + l * r, b: (1 - l) * o + l * d });
}
function na(t) {
  return t.substring(0, 7);
}
function sa(t, e, n) {
  const s = typeof t == "number" ? t : rt(pe(t)).h,
    o = typeof t != "number" && rt(pe(t)).s === 0 ? 0 : typeof e == "number" ? e : rt(pe(e)).s,
    i = typeof n == "number" ? n : rt(pe(n)).v;
  return pt(Ls({ h: s, s: o, v: i }));
}
function oa(t) {
  const { r: e, g: n, b: s } = pe(t);
  return `url("data:image/svg+xml,
    <svg xmlns='http://www.w3.org/2000/svg'>
      <filter id='recolor'>
        <feColorMatrix color-interpolation-filters='sRGB' values='
          0 0 0 0 ${e / 255}
          0 0 0 0 ${n / 255}
          0 0 0 0 ${s / 255}
          0 0 0 1 0
        '/>
      </filter>
    </svg>#recolor
  ")`
    .split(
      `
`
    )
    .join("");
}
globalThis.__scratchAddonsTextColor = {
  parseHex: pe,
  convertToHex: pt,
  convertFromHsv: Ls,
  convertToHsv: rt,
  brightness: xn,
  textColor: Qr,
  multiply: Zr,
  brighten: ea,
  alphaBlend: ta,
  removeAlpha: na,
  makeHsv: sa,
  recolorFilter: oa,
};
const {
  parseHex: Zc,
  convertToHex: eu,
  convertFromHsv: tu,
  convertToHsv: nu,
  brightness: su,
  textColor: ie,
  multiply: et,
  brighten: ou,
  alphaBlend: ns,
  removeAlpha: iu,
  makeHsv: ss,
  recolorFilter: ru,
} = globalThis.__scratchAddonsTextColor;
const ia = {
    props: ["options", "settings", "hoveredSettingId"],
    data() {
      return {
        tabs: [
          { id: "code", textLength: 4 },
          { id: "costumes", textLength: 8 },
          { id: "sounds", textLength: 6 },
        ],
        selectedTab: "code",
        fullScreenView: !1,
        blockCategories: [
          { primary: "#4c97ff", tertiary: "#3373cc", textLength: [6] },
          { primary: "#9966ff", tertiary: "#774dcb", textLength: [5] },
          { primary: "#cf63cf", tertiary: "#bd42bd", textLength: [5] },
          { primary: "#ffd500", tertiary: "#cc9900", textLength: [6] },
          { primary: "#ffab19", tertiary: "#cf8b17", textLength: [7] },
          { primary: "#5cb1d6", tertiary: "#2e8eb8", textLength: [7] },
          { primary: "#59c059", tertiary: "#389438", textLength: [9] },
          { primary: "#ff8c1a", tertiary: "#db6e00", textLength: [9] },
          { primary: "#ff6680", tertiary: "#ff3355", textLength: [2, 6] },
        ],
        soundEffects: [
          { textLength: [6] },
          { textLength: [6] },
          { textLength: [6] },
          { textLength: [6] },
          { textLength: [4] },
          { textLength: [4, 2] },
          { textLength: [4, 3] },
          { textLength: [7] },
          { textLength: [7] },
        ],
      };
    },
    computed: {
      colors() {
        return {
          primaryText: ie(this.settings.primary),
          menuBarText: ie(this.settings.menuBar),
          accentText: ie(this.settings.accent),
          inputText: ie(this.settings.input),
          categoryMenuText: ie(this.settings.categoryMenu),
          selectorText: ie(this.settings.selector),
          selector2Text: ie(this.settings.selector2),
          pageText: ie(this.settings.page, "rgba(87, 94, 117, 0.75)", "rgba(255, 255, 255, 0.75)"),
          menuBarBorder: ie(this.settings.menuBar, "rgba(0, 0, 0, 0.15)", "rgba(255, 255, 255, 0.15)", 60),
          accentTransparentText: ie(this.settings.accent, "rgba(87, 94, 117, 0.75)", "rgba(255, 255, 255, 0.75)"),
          accentArtboard: this.settings.affectPaper ? this.settings.accent : "#ffffff",
          accentCheckerboard: this.settings.affectPaper
            ? et(
                ie(
                  this.settings.accent,
                  ns(this.settings.accent, et(ss(this.settings.primary, 1, 0.67), { a: 0.15 })),
                  ns(this.settings.accent, et(ss(this.settings.primary, 0.5, 1), { a: 0.15 })),
                  112
                ),
                { a: 0.55 }
              )
            : "#d9e3f28c",
          tabText: ie(this.settings.tab, "rgba(87, 94, 117, 0.75)", "rgba(255, 255, 255, 0.75)"),
          categoryMenuSelection: ie(
            this.settings.categoryMenu,
            "rgba(87, 124, 155, 0.13)",
            "rgba(255, 255, 255, 0.05)"
          ),
          primaryTransparent: et(this.settings.primary, { a: 0.35 }),
          inputTransparent: et(this.settings.input, { a: 0.25 }),
        };
      },
    },
    methods: {
      selectTab(t) {
        (this.selectedTab = t), this.$emit("areahover", "activeTab");
      },
      toggleFullScreenView() {
        this.fullScreenView = !this.fullScreenView;
      },
      cssVariables(t) {
        return Object.entries(t).map(([e, n]) => `${e}: ${n};`).join(`
`);
      },
    },
  },
  ra = ["data-setting-hovered"],
  aa = Te(
    '<div class="edm-logo-placeholder"></div><div class="edm-menu-bar-menu edm-icon-placeholder edm-icon-placeholder-24px"></div><div class="edm-menu-bar-menu edm-text-placeholder" style="--length:4;"></div><div class="edm-menu-bar-menu edm-text-placeholder" style="--length:4;"></div><div class="edm-menu-bar-separator"></div><div class="edm-menu-bar-menu edm-menu-bar-tutorials"><div class="edm-icon-placeholder edm-icon-placeholder-20px"></div><div class="edm-text-placeholder" style="--length:9;"></div></div><div class="edm-menu-bar-separator"></div><div class="edm-menu-bar-input"><div class="edm-text-placeholder" style="--length:8;"></div><div class="edm-text-placeholder" style="--length:1;"></div></div><div class="edm-menu-bar-button edm-menu-bar-share"><div class="edm-text-placeholder" style="--length:5;"></div></div><div class="edm-menu-bar-button"><div class="edm-icon-placeholder edm-icon-placeholder-20px"></div><div class="edm-text-placeholder" style="--length:3;"></div><div class="edm-text-placeholder" style="--length:7;"></div><div class="edm-text-placeholder" style="--length:4;"></div></div><div class="edm-spacer"></div><div class="edm-menu-bar-menu edm-icon-placeholder edm-icon-placeholder-24px"></div><div class="edm-menu-bar-menu"><div class="edm-menu-bar-button edm-avatar-placeholder"></div><div class="edm-text-placeholder" style="--length:10;"></div></div>',
    13
  ),
  la = [aa],
  da = { class: "edm-main" },
  ca = { class: "edm-left" },
  ua = { class: "edm-tabs" },
  ha = ["onMouseenter", "onClick"],
  ga = a("div", { class: "edm-icon-placeholder edm-icon-placeholder-20px" }, null, -1),
  ma = { key: 0, class: "edm-tab-content edm-workspace" },
  pa = { class: "edm-category-label" },
  fa = a("div", { class: "edm-spacer" }, null, -1),
  va = a("div", { class: "edm-icon-placeholder edm-icon-placeholder-24px" }, null, -1),
  ba = [va],
  ya = a(
    "div",
    { class: "edm-asset-image" },
    [a("div", { class: "edm-icon-placeholder edm-icon-placeholder-24px" })],
    -1
  ),
  wa = a("div", { class: "edm-text-placeholder edm-text-placeholder-small", style: { "--length": "7" } }, null, -1),
  _a = [wa],
  xa = a("div", { class: "edm-icon-placeholder edm-icon-placeholder-20px" }, null, -1),
  Sa = [xa],
  Ea = Te(
    '<div class="edm-asset edm-asset"><div class="edm-asset-image"><div class="edm-icon-placeholder edm-icon-placeholder-24px"></div></div><div class="edm-asset-name"><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:5;"></div></div></div><div class="edm-asset edm-asset"><div class="edm-asset-image"><div class="edm-icon-placeholder edm-icon-placeholder-24px"></div></div><div class="edm-asset-name"><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:3;"></div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:1;"></div></div></div>',
    2
  ),
  ka = a("div", { class: "edm-icon-placeholder edm-icon-placeholder-24px" }, null, -1),
  Ma = [ka],
  Ia = { key: 0, class: "edm-asset-editor edm-tool-button-icons-not-affected" },
  Ta = { class: "edm-toolbar" },
  Ca = a("div", { class: "edm-text-placeholder edm-text-placeholder-small", style: { "--length": "7" } }, null, -1),
  Oa = a("div", { class: "edm-text-placeholder edm-text-placeholder-small", style: { "--length": "8" } }, null, -1),
  Da = [Oa],
  Aa = Te(
    '<div><div class="edm-outlined-button edm-outlined-button-first edm-outlined-button-selected"><div class="edm-icon-placeholder edm-icon-placeholder-20px"></div></div><div class="edm-outlined-button edm-outlined-button-last edm-outlined-button-selected"><div class="edm-icon-placeholder edm-icon-placeholder-20px"></div></div></div><div><div class="edm-tool-button"><div class="edm-icon-placeholder edm-icon-placeholder-24px"></div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:6;"></div></div><div class="edm-tool-button"><div class="edm-icon-placeholder edm-icon-placeholder-24px"></div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:8;"></div></div></div><div class="edm-toolbar-separator"></div><div><div class="edm-tool-button"><div class="edm-icon-placeholder edm-icon-placeholder-24px"></div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:7;"></div></div><div class="edm-tool-button"><div class="edm-icon-placeholder edm-icon-placeholder-24px"></div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:8;"></div></div></div><div class="edm-toolbar-separator"></div><div><div class="edm-tool-button"><div class="edm-icon-placeholder edm-icon-placeholder-24px"></div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:5;"></div></div><div class="edm-tool-button"><div class="edm-icon-placeholder edm-icon-placeholder-24px"></div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:4;"></div></div></div>',
    6
  ),
  Pa = { class: "edm-toolbar" },
  Na = a(
    "div",
    null,
    [
      a("div", { class: "edm-text-placeholder edm-text-placeholder-small", style: { "--length": "4" } }),
      a("div", { class: "edm-outlined-button edm-outlined-button-first edm-paint-picker-color" }),
      a("div", { class: "edm-outlined-button edm-outlined-button-last edm-paint-picker-arrow" }),
    ],
    -1
  ),
  La = a("div", { class: "edm-text-placeholder edm-text-placeholder-small", style: { "--length": "7" } }, null, -1),
  $a = a("div", { class: "edm-outlined-button edm-outlined-button-first edm-paint-picker-color" }, null, -1),
  Ra = a("div", { class: "edm-outlined-button edm-outlined-button-last edm-paint-picker-arrow" }, null, -1),
  Fa = a("div", { class: "edm-text-placeholder edm-text-placeholder-small", style: { "--length": "2" } }, null, -1),
  ja = [Fa],
  Ba = Te(
    '<div class="edm-toolbar-separator"></div><div><div class="edm-tool-button"><div class="edm-icon-placeholder edm-icon-placeholder-24px"></div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:4;"></div></div><div class="edm-tool-button"><div class="edm-icon-placeholder edm-icon-placeholder-24px"></div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:5;"></div></div></div><div class="edm-toolbar-separator"></div><div><div class="edm-tool-button"><div class="edm-icon-placeholder edm-icon-placeholder-24px"></div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:6;"></div></div></div><div class="edm-toolbar-separator"></div><div><div class="edm-tool-button"><div class="edm-icon-placeholder edm-icon-placeholder-24px"></div><div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:4;"></div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:10;"></div></div></div><div class="edm-tool-button"><div class="edm-icon-placeholder edm-icon-placeholder-24px"></div><div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:4;"></div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:8;"></div></div></div></div>',
    6
  ),
  za = { class: "edm-paint-bottom" },
  Ha = { class: "edm-paint-tool-column" },
  Ua = a("div", { class: "edm-icon-placeholder edm-icon-placeholder-24px" }, null, -1),
  Wa = [Ua],
  Ga = { class: "edm-paint-tool" },
  Ya = a("div", { class: "edm-icon-placeholder edm-icon-placeholder-24px" }, null, -1),
  Xa = [Ya],
  Va = { class: "edm-paint-tool-column" },
  Ka = { class: "edm-paint-tool" },
  Ja = a("div", { class: "edm-icon-placeholder edm-icon-placeholder-24px" }, null, -1),
  qa = [Ja],
  Qa = { class: "edm-paint-canvas-and-controls" },
  Za = a("div", { class: "edm-paint-canvas" }, null, -1),
  el = { class: "edm-paint-controls" },
  tl = a("div", { class: "edm-icon-placeholder edm-icon-placeholder-20px" }, null, -1),
  nl = a("div", { class: "edm-text-placeholder", style: { "--length": "7" } }, null, -1),
  sl = a("div", { class: "edm-text-placeholder", style: { "--length": "2" } }, null, -1),
  ol = a("div", { class: "edm-text-placeholder", style: { "--length": "6" } }, null, -1),
  il = [tl, nl, sl, ol],
  rl = Te(
    '<div class="edm-paint-zoom"><div class="edm-outlined-button edm-outlined-button-first"><div class="edm-icon-placeholder edm-icon-placeholder-20px"></div></div><div class="edm-outlined-button edm-outlined-button-middle"><div class="edm-icon-placeholder edm-icon-placeholder-20px"></div></div><div class="edm-outlined-button edm-outlined-button-last"><div class="edm-icon-placeholder edm-icon-placeholder-20px"></div></div></div>',
    1
  ),
  al = { key: 1, class: "edm-asset-editor" },
  ll = { class: "edm-toolbar" },
  dl = a("div", { class: "edm-text-placeholder edm-text-placeholder-small", style: { "--length": "5" } }, null, -1),
  cl = a("div", { class: "edm-text-placeholder edm-text-placeholder-small", style: { "--length": "4" } }, null, -1),
  ul = [cl],
  hl = Te(
    '<div><div class="edm-outlined-button edm-outlined-button-first edm-outlined-button-selected"><div class="edm-icon-placeholder edm-icon-placeholder-20px"></div></div><div class="edm-outlined-button edm-outlined-button-last edm-outlined-button-selected"><div class="edm-icon-placeholder edm-icon-placeholder-20px"></div></div></div><div class="edm-toolbar-separator"></div><div><div class="edm-tool-button"><div class="edm-icon-placeholder edm-icon-placeholder-24px"></div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:4;"></div></div></div><div><div class="edm-tool-button"><div class="edm-icon-placeholder edm-icon-placeholder-24px"></div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:5;"></div></div></div><div><div class="edm-tool-button"><div class="edm-icon-placeholder edm-icon-placeholder-24px"></div><div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:4;"></div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:2;"></div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:3;"></div></div></div></div><div class="edm-toolbar-separator"></div><div><div class="edm-tool-button"><div class="edm-icon-placeholder edm-icon-placeholder-24px"></div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:6;"></div></div></div>',
    7
  ),
  gl = a("div", { class: "edm-waveform" }, null, -1),
  ml = { class: "edm-toolbar edm-sound-effects" },
  pl = a("div", { class: "edm-icon-placeholder edm-icon-placeholder-20px" }, null, -1),
  fl = [pl],
  vl = a("div", { class: "edm-toolbar-separator" }, null, -1),
  bl = { class: "edm-tool-button" },
  yl = a("div", { class: "edm-icon-placeholder edm-icon-placeholder-20px" }, null, -1),
  wl = a("div", { class: "edm-text-placeholder", style: { "--length": "8" } }, null, -1),
  _l = [wl],
  xl = { class: "edm-right" },
  Sl = { class: "edm-stage-header" },
  El = a("div", { class: "edm-icon-placeholder edm-icon-placeholder-20px edm-green-flag" }, null, -1),
  kl = a("div", { class: "edm-icon-placeholder edm-icon-placeholder-20px edm-stop-sign" }, null, -1),
  Ml = a("div", { class: "edm-spacer" }, null, -1),
  Il = a("div", { class: "edm-icon-placeholder edm-icon-placeholder-20px" }, null, -1),
  Tl = [Il],
  Cl = a("div", { class: "edm-icon-placeholder edm-icon-placeholder-20px" }, null, -1),
  Ol = [Cl],
  Dl = a("div", { class: "edm-icon-placeholder edm-icon-placeholder-20px" }, null, -1),
  Al = [Dl],
  Pl = { class: "edm-targets" },
  Nl = { class: "edm-sprite-selector" },
  Ll = Te(
    '<div class="edm-sprite-info-row"><div><div class="edm-input"><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:7;"></div></div></div></div><div class="edm-sprite-info-row"><div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:1;"></div><div class="edm-input edm-input-number"><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:1;"></div></div></div><div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:1;"></div><div class="edm-input edm-input-number"><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:1;"></div></div></div></div>',
    2
  ),
  $l = [Ll],
  Rl = { class: "edm-sprite-list" },
  Fl = a(
    "div",
    { class: "edm-asset-image" },
    [a("div", { class: "edm-icon-placeholder edm-icon-placeholder-24px" })],
    -1
  ),
  jl = a("div", { class: "edm-text-placeholder edm-text-placeholder-small", style: { "--length": "7" } }, null, -1),
  Bl = [jl],
  zl = a("div", { class: "edm-icon-placeholder edm-icon-placeholder-20px" }, null, -1),
  Hl = [zl],
  Ul = Te(
    '<div class="edm-asset edm-asset"><div class="edm-asset-image"><div class="edm-icon-placeholder edm-icon-placeholder-24px"></div></div><div class="edm-asset-name"><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:5;"></div></div></div><div class="edm-asset edm-asset"><div class="edm-asset-image"><div class="edm-icon-placeholder edm-icon-placeholder-24px"></div></div><div class="edm-asset-name"><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:3;"></div><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:1;"></div></div></div>',
    2
  ),
  Wl = a("div", { class: "edm-icon-placeholder edm-icon-placeholder-24px" }, null, -1),
  Gl = [Wl],
  Yl = Te(
    '<div class="edm-stage-title"><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:5;"></div></div><div class="edm-stage-image"></div><div class="edm-stage-info"><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:9;"></div></div><div class="edm-stage-info"><div class="edm-text-placeholder edm-text-placeholder-small" style="--length:1;"></div></div>',
    4
  ),
  Xl = a("div", { class: "edm-icon-placeholder edm-icon-placeholder-24px" }, null, -1),
  Vl = [Xl],
  Kl = { class: "edm-fullscreen-controls-inner" },
  Jl = a(
    "div",
    null,
    [
      a("div", { class: "edm-icon-placeholder edm-icon-placeholder-20px edm-green-flag" }),
      a("div", { class: "edm-icon-placeholder edm-icon-placeholder-20px edm-stop-sign" }),
    ],
    -1
  ),
  ql = a("div", { class: "edm-icon-placeholder edm-icon-placeholder-20px" }, null, -1),
  Ql = [ql];
function Zl(t, e, n, s, o, i) {
  return (
    p(),
    v(
      "div",
      {
        role: "presentation",
        class: "edm-preview",
        "data-setting-hovered": n.hoveredSettingId,
        onMouseenter: e[71] || (e[71] = (r) => t.$emit("areahover", "page")),
        onMouseleave: e[72] || (e[72] = (r) => t.$emit("areahover", null)),
        style: Ee(
          i.cssVariables({
            "--page": n.settings.page,
            "--page-text": i.colors.pageText,
            "--primary": n.settings.primary,
            "--primary-transparent": i.colors.primaryTransparent,
            "--primary-text": i.colors.primaryText,
            "--highlightText": n.settings.highlightText,
            "--menuBar": n.settings.menuBar,
            "--menuBar-text": i.colors.menuBarText,
            "--menuBar-border": i.colors.menuBarBorder,
            "--accent": n.settings.accent,
            "--accent-text": i.colors.accentText,
            "--accent-transparentText": i.colors.accentTransparentText,
            "--accent-artboard": i.colors.accentArtboard,
            "--accent-checkerboard": i.colors.accentCheckerboard,
            "--input": n.settings.input,
            "--input-transparent": i.colors.inputTransparent,
            "--input-text": i.colors.inputText,
            "--tab": n.settings.tab,
            "--tab-text": i.colors.tabText,
            "--activeTab": n.settings.activeTab,
            "--workspace": n.settings.workspace,
            "--categoryMenu": n.settings.categoryMenu,
            "--categoryMenu-text": i.colors.categoryMenuText,
            "--categoryMenu-selection": i.colors.categoryMenuSelection,
            "--palette": n.settings.palette,
            "--selector": n.settings.selector,
            "--selector-text": i.colors.selectorText,
            "--selector2": n.settings.selector2,
            "--selector2-text": i.colors.selector2Text,
            "--selectorSelection": n.settings.selectorSelection,
            "--fullscreen": n.settings.fullscreen,
            "--stageHeader": n.settings.stageHeader,
            "--border": n.hoveredSettingId === "border" ? "var(--orange)" : n.settings.border,
          })
        ),
      },
      [
        a(
          "div",
          {
            class: "edm-menu-bar",
            onMouseenter: e[0] || (e[0] = (r) => t.$emit("areahover", "menuBar")),
            onMouseleave: e[1] || (e[1] = (r) => t.$emit("areahover", "page")),
          },
          la,
          32
        ),
        a("div", da, [
          a("div", ca, [
            a("div", ua, [
              (p(!0),
              v(
                z,
                null,
                K(
                  o.tabs,
                  (r) => (
                    p(),
                    v(
                      "div",
                      {
                        class: B(["edm-tab", { "edm-tab-selected": o.selectedTab === r.id }]),
                        onMouseenter: (d) => t.$emit("areahover", o.selectedTab === r.id ? "activeTab" : "tab"),
                        onMouseleave: e[2] || (e[2] = (d) => t.$emit("areahover", "page")),
                        onClick: (d) => i.selectTab(r.id),
                      },
                      [
                        ga,
                        a(
                          "div",
                          { class: "edm-text-placeholder", style: Ee(i.cssVariables({ "--length": r.textLength })) },
                          null,
                          4
                        ),
                      ],
                      42,
                      ha
                    )
                  )
                ),
                256
              )),
            ]),
            o.selectedTab === "code"
              ? (p(),
                v("div", ma, [
                  a(
                    "div",
                    {
                      class: "edm-category-menu",
                      onMouseenter: e[5] || (e[5] = (r) => t.$emit("areahover", "categoryMenu")),
                      onMouseleave: e[6] || (e[6] = (r) => t.$emit("areahover", "page")),
                    },
                    [
                      (p(!0),
                      v(
                        z,
                        null,
                        K(
                          o.blockCategories,
                          (r) => (
                            p(),
                            v(
                              "div",
                              { class: B(["edm-category", { "edm-category-selected": t.$index === 0 }]) },
                              [
                                a(
                                  "div",
                                  {
                                    class: "edm-category-bubble",
                                    style: Ee({ backgroundColor: r.primary, borderColor: r.tertiary }),
                                  },
                                  null,
                                  4
                                ),
                                a("div", pa, [
                                  (p(!0),
                                  v(
                                    z,
                                    null,
                                    K(
                                      r.textLength,
                                      (d) => (
                                        p(),
                                        v(
                                          "div",
                                          {
                                            class: "edm-text-placeholder edm-text-placeholder-small",
                                            style: Ee(i.cssVariables({ "--length": d })),
                                          },
                                          null,
                                          4
                                        )
                                      )
                                    ),
                                    256
                                  )),
                                ]),
                              ],
                              2
                            )
                          )
                        ),
                        256
                      )),
                      fa,
                      a(
                        "div",
                        {
                          class: "edm-add-extension",
                          onMouseenter: e[3] || (e[3] = (r) => t.$emit("areahover", "primary")),
                          onMouseleave: e[4] || (e[4] = (r) => t.$emit("areahover", "categoryMenu")),
                        },
                        ba,
                        32
                      ),
                    ],
                    32
                  ),
                  a(
                    "div",
                    {
                      class: "edm-palette",
                      onMouseenter: e[7] || (e[7] = (r) => t.$emit("areahover", "palette")),
                      onMouseleave: e[8] || (e[8] = (r) => t.$emit("areahover", "page")),
                    },
                    null,
                    32
                  ),
                  a(
                    "div",
                    {
                      class: "edm-workspace-hover-target",
                      onMouseenter: e[9] || (e[9] = (r) => t.$emit("areahover", "workspace")),
                      onMouseleave: e[10] || (e[10] = (r) => t.$emit("areahover", "page")),
                    },
                    null,
                    32
                  ),
                ]))
              : (p(),
                v(
                  "div",
                  {
                    key: 1,
                    class: "edm-tab-content edm-asset-tab",
                    onMouseenter: e[33] || (e[33] = (r) => t.$emit("areahover", "accent")),
                    onMouseleave: e[34] || (e[34] = (r) => t.$emit("areahover", "page")),
                  },
                  [
                    a(
                      "div",
                      {
                        class: B(["edm-asset-list", { "edm-sound-list": o.selectedTab === "sounds" }]),
                        onMouseenter: e[19] || (e[19] = (r) => t.$emit("areahover", "selector2")),
                        onMouseleave: e[20] || (e[20] = (r) => t.$emit("areahover", "accent")),
                      },
                      [
                        a(
                          "div",
                          {
                            class: "edm-asset edm-asset-selected",
                            onMouseenter: e[15] || (e[15] = (r) => t.$emit("areahover", "selectorSelection")),
                            onMouseleave: e[16] || (e[16] = (r) => t.$emit("areahover", "selector2")),
                          },
                          [
                            ya,
                            a(
                              "div",
                              {
                                class: "edm-asset-name",
                                onMouseenter: e[11] || (e[11] = (r) => t.$emit("areahover", "primary")),
                                onMouseleave: e[12] || (e[12] = (r) => t.$emit("areahover", "selectorSelection")),
                              },
                              _a,
                              32
                            ),
                            a(
                              "div",
                              {
                                class: "edm-asset-delete",
                                onMouseenter: e[13] || (e[13] = (r) => t.$emit("areahover", "primary")),
                                onMouseleave: e[14] || (e[14] = (r) => t.$emit("areahover", "selectorSelection")),
                              },
                              Sa,
                              32
                            ),
                          ],
                          32
                        ),
                        Ea,
                        a(
                          "div",
                          {
                            class: "edm-asset-new",
                            onMouseenter: e[17] || (e[17] = (r) => t.$emit("areahover", "primary")),
                            onMouseleave: e[18] || (e[18] = (r) => t.$emit("areahover", "selector2")),
                          },
                          Ma,
                          32
                        ),
                      ],
                      34
                    ),
                    o.selectedTab === "costumes"
                      ? (p(),
                        v("div", Ia, [
                          a("div", Ta, [
                            a("div", null, [
                              Ca,
                              a(
                                "div",
                                {
                                  class: "edm-input",
                                  onMouseenter: e[21] || (e[21] = (r) => t.$emit("areahover", "input")),
                                  onMouseleave: e[22] || (e[22] = (r) => t.$emit("areahover", "accent")),
                                },
                                Da,
                                32
                              ),
                            ]),
                            Aa,
                          ]),
                          a("div", Pa, [
                            Na,
                            a("div", null, [
                              La,
                              $a,
                              Ra,
                              a(
                                "div",
                                {
                                  class: "edm-input edm-input-number",
                                  onMouseenter: e[23] || (e[23] = (r) => t.$emit("areahover", "input")),
                                  onMouseleave: e[24] || (e[24] = (r) => t.$emit("areahover", "accent")),
                                },
                                ja,
                                32
                              ),
                            ]),
                            Ba,
                          ]),
                          a("div", za, [
                            a("div", Ha, [
                              a(
                                "div",
                                {
                                  class: "edm-paint-tool edm-paint-tool-selected",
                                  onMouseenter: e[25] || (e[25] = (r) => t.$emit("areahover", "primary")),
                                  onMouseleave: e[26] || (e[26] = (r) => t.$emit("areahover", "accent")),
                                },
                                Wa,
                                32
                              ),
                              (p(),
                              v(
                                z,
                                null,
                                K([0, 1, 2, 3], (r) => a("div", Ga, Xa)),
                                64
                              )),
                            ]),
                            a("div", Va, [
                              (p(),
                              v(
                                z,
                                null,
                                K([0, 1, 2, 3], (r) => a("div", Ka, qa)),
                                64
                              )),
                            ]),
                            a("div", Qa, [
                              Za,
                              a("div", el, [
                                a(
                                  "div",
                                  {
                                    class: "edm-button",
                                    onMouseenter: e[27] || (e[27] = (r) => t.$emit("areahover", "primary")),
                                    onMouseleave: e[28] || (e[28] = (r) => t.$emit("areahover", "accent")),
                                  },
                                  il,
                                  32
                                ),
                                rl,
                              ]),
                            ]),
                          ]),
                        ]))
                      : P("", !0),
                    o.selectedTab === "sounds"
                      ? (p(),
                        v("div", al, [
                          a("div", ll, [
                            a("div", null, [
                              dl,
                              a(
                                "div",
                                {
                                  class: "edm-input",
                                  onMouseenter: e[29] || (e[29] = (r) => t.$emit("areahover", "input")),
                                  onMouseleave: e[30] || (e[30] = (r) => t.$emit("areahover", "accent")),
                                },
                                ul,
                                32
                              ),
                            ]),
                            hl,
                          ]),
                          gl,
                          a("div", ml, [
                            a("div", null, [
                              a(
                                "div",
                                {
                                  class: "edm-play-button",
                                  onMouseenter: e[31] || (e[31] = (r) => t.$emit("areahover", "primary")),
                                  onMouseleave: e[32] || (e[32] = (r) => t.$emit("areahover", "accent")),
                                },
                                fl,
                                32
                              ),
                            ]),
                            vl,
                            a("div", null, [
                              (p(!0),
                              v(
                                z,
                                null,
                                K(
                                  o.soundEffects,
                                  (r) => (
                                    p(),
                                    v("div", bl, [
                                      yl,
                                      a("div", null, [
                                        (p(!0),
                                        v(
                                          z,
                                          null,
                                          K(
                                            r.textLength,
                                            (d) => (
                                              p(),
                                              v(
                                                "div",
                                                {
                                                  class: "edm-text-placeholder edm-text-placeholder-small",
                                                  style: Ee(i.cssVariables({ "--length": d })),
                                                },
                                                null,
                                                4
                                              )
                                            )
                                          ),
                                          256
                                        )),
                                      ]),
                                    ])
                                  )
                                ),
                                256
                              )),
                            ]),
                          ]),
                        ]))
                      : P("", !0),
                  ],
                  32
                )),
            a(
              "div",
              {
                class: "edm-backpack",
                onMouseenter: e[35] || (e[35] = (r) => t.$emit("areahover", "accent")),
                onMouseleave: e[36] || (e[36] = (r) => t.$emit("areahover", "page")),
              },
              _l,
              32
            ),
          ]),
          a("div", xl, [
            a("div", Sl, [
              El,
              kl,
              Ml,
              a(
                "div",
                {
                  class: "edm-outlined-button edm-outlined-button-first edm-outlined-button-selected",
                  onMouseenter: e[37] || (e[37] = (r) => t.$emit("areahover", "accent")),
                  onMouseleave: e[38] || (e[38] = (r) => t.$emit("areahover", "page")),
                },
                Tl,
                32
              ),
              a(
                "div",
                {
                  class: "edm-outlined-button edm-outlined-button-last edm-outlined-button-unselected",
                  onMouseenter: e[39] || (e[39] = (r) => t.$emit("areahover", "accent")),
                  onMouseleave: e[40] || (e[40] = (r) => t.$emit("areahover", "page")),
                },
                Ol,
                32
              ),
              a(
                "div",
                {
                  class: "edm-outlined-button edm-fullscreen-toggle",
                  onMouseenter: e[41] || (e[41] = (r) => t.$emit("areahover", "accent")),
                  onMouseleave: e[42] || (e[42] = (r) => t.$emit("areahover", "page")),
                  onClick: e[43] || (e[43] = (r) => i.toggleFullScreenView()),
                },
                Al,
                32
              ),
            ]),
            a(
              "div",
              {
                class: "edm-stage",
                onMouseenter: e[44] || (e[44] = (r) => t.$emit("areahover", null)),
                onMouseleave: e[45] || (e[45] = (r) => t.$emit("areahover", "page")),
              },
              null,
              32
            ),
            a("div", Pl, [
              a("div", Nl, [
                a(
                  "div",
                  {
                    class: "edm-sprite-info",
                    onMouseenter: e[46] || (e[46] = (r) => t.$emit("areahover", "accent")),
                    onMouseleave: e[47] || (e[47] = (r) => t.$emit("areahover", "page")),
                  },
                  $l,
                  32
                ),
                a(
                  "div",
                  {
                    class: "edm-sprite-list-container",
                    onMouseenter: e[56] || (e[56] = (r) => t.$emit("areahover", "selector")),
                    onMouseleave: e[57] || (e[57] = (r) => t.$emit("areahover", "page")),
                  },
                  [
                    a("div", Rl, [
                      a(
                        "div",
                        {
                          class: "edm-asset edm-asset-selected",
                          onMouseenter: e[52] || (e[52] = (r) => t.$emit("areahover", "selectorSelection")),
                          onMouseleave: e[53] || (e[53] = (r) => t.$emit("areahover", "selector")),
                        },
                        [
                          Fl,
                          a(
                            "div",
                            {
                              class: "edm-asset-name",
                              onMouseenter: e[48] || (e[48] = (r) => t.$emit("areahover", "primary")),
                              onMouseleave: e[49] || (e[49] = (r) => t.$emit("areahover", "selectorSelection")),
                            },
                            Bl,
                            32
                          ),
                          a(
                            "div",
                            {
                              class: "edm-asset-delete",
                              onMouseenter: e[50] || (e[50] = (r) => t.$emit("areahover", "primary")),
                              onMouseleave: e[51] || (e[51] = (r) => t.$emit("areahover", "selectorSelection")),
                            },
                            Hl,
                            32
                          ),
                        ],
                        32
                      ),
                      Ul,
                    ]),
                    a(
                      "div",
                      {
                        class: "edm-asset-new",
                        onMouseenter: e[54] || (e[54] = (r) => t.$emit("areahover", "primary")),
                        onMouseleave: e[55] || (e[55] = (r) => t.$emit("areahover", "selector")),
                      },
                      Gl,
                      32
                    ),
                  ],
                  32
                ),
              ]),
              a(
                "div",
                {
                  class: "edm-stage-selector",
                  onMouseenter: e[60] || (e[60] = (r) => t.$emit("areahover", "accent")),
                  onMouseleave: e[61] || (e[61] = (r) => t.$emit("areahover", "page")),
                },
                [
                  Yl,
                  a(
                    "div",
                    {
                      class: "edm-asset-new",
                      onMouseenter: e[58] || (e[58] = (r) => t.$emit("areahover", "primary")),
                      onMouseleave: e[59] || (e[59] = (r) => t.$emit("areahover", "accent")),
                    },
                    Vl,
                    32
                  ),
                ],
                32
              ),
            ]),
          ]),
        ]),
        o.fullScreenView
          ? (p(),
            v(
              "div",
              {
                key: 0,
                class: "edm-fullscreen-view",
                onMouseenter: e[69] || (e[69] = (r) => t.$emit("areahover", "fullscreen")),
                onMouseleave: e[70] || (e[70] = (r) => t.$emit("areahover", "page")),
              },
              [
                a(
                  "div",
                  {
                    class: "edm-fullscreen-controls",
                    onMouseenter: e[65] || (e[65] = (r) => t.$emit("areahover", "stageHeader")),
                    onMouseleave: e[66] || (e[66] = (r) => t.$emit("areahover", "fullscreen")),
                  },
                  [
                    a("div", Kl, [
                      Jl,
                      a(
                        "div",
                        {
                          class: "edm-outlined-button edm-fullscreen-toggle",
                          onMouseenter: e[62] || (e[62] = (r) => t.$emit("areahover", "accent")),
                          onMouseleave: e[63] || (e[63] = (r) => t.$emit("areahover", "stageHeader")),
                          onClick: e[64] || (e[64] = (r) => i.toggleFullScreenView()),
                        },
                        Ql,
                        32
                      ),
                    ]),
                  ],
                  32
                ),
                a(
                  "div",
                  {
                    class: "edm-fullscreen-stage",
                    onMouseenter: e[67] || (e[67] = (r) => t.$emit("areahover", null)),
                    onMouseleave: e[68] || (e[68] = (r) => t.$emit("areahover", "fullscreen")),
                  },
                  null,
                  32
                ),
              ],
              32
            ))
          : P("", !0),
      ],
      44,
      ra
    )
  );
}
const ed = xe(ia, [["render", Zl]]);
const Tt = window.parent !== window,
  td = {
    components: { AddonTag: qr, AddonSetting: Yr, EditorDarkMode: ed },
    props: ["addon", "groupId", "groupExpanded", "visible"],
    data() {
      return {
        isIframe: Tt,
        expanded: this.getDefaultExpanded(),
        everExpanded: this.getDefaultExpanded(),
        hoveredSettingId: null,
        highlightedSettingId: null,
      };
    },
    computed: {
      shouldShow() {
        return this.visible && (this.$root.searchInput === "" ? this.groupExpanded : !0);
      },
      addonIconSrc() {
        return `../../images/icons/${
          { editor: "puzzle", community: "web", theme: "brush", easterEgg: "egg-easter", popup: "popup" }[
            this.addon._icon
          ]
        }.svg`;
      },
      addonSettings() {
        return this.$root.addonSettings[this.addon._addonId];
      },
      showUpdateNotice() {
        if (!this.addon.latestUpdate || !this.addon.latestUpdate.temporaryNotice) return !1;
        const [t, e, n] = this.$root.version.split("."),
          [s, o, i] = this.addon.latestUpdate.version.split(".");
        return t === s && e === o;
      },
    },
    methods: {
      getDefaultExpanded() {
        return Tt ? !1 : this.groupId === "enabled";
      },
      devShowAddonIds(t) {
        !this.$root.versionName.endsWith("-prerelease") ||
          !t.ctrlKey ||
          (t.stopPropagation(), Vue.set(this.addon, "_displayedAddonId", this.addon._addonId));
      },
      loadPreset(t) {
        if (window.confirm(chrome.i18n.getMessage("confirmPreset"))) {
          for (const e of Object.keys(t.values)) this.addonSettings[e] = t.values[e];
          this.$root.updateSettings(this.addon), console.log(`Loaded preset ${t.id} for ${this.addon._addonId}`);
        }
      },
      loadDefaults() {
        if (window.confirm(chrome.i18n.getMessage("confirmReset"))) {
          for (const t of this.addon.settings) this.addonSettings[t.id] = JSON.parse(JSON.stringify(t.default));
          this.$root.updateSettings(this.addon), console.log(`Loaded default values for ${this.addon._addonId}`);
        }
      },
      toggleAddonRequest(t) {
        const e = () => {
            t.preventDefault();
            const s = !this.addon._enabled;
            (this.addon._wasEverEnabled = this.addon._enabled || s),
              (this.addon._enabled = s),
              (this.expanded =
                (Tt && !this.expanded && (this.addon.info || []).every((o) => o.type !== "warning")) || t.shiftKey
                  ? !1
                  : s),
              chrome.runtime.sendMessage({ changeEnabledState: { addonId: this.addon._addonId, newState: s } }),
              this.$emit("toggle-addon-request", s);
          },
          n = (this.addon.permissions || []).filter((s) => this.$root.browserLevelPermissions.includes(s));
        (!this.addon._enabled &&
          this.addon.tags.includes("danger") &&
          !confirm(chrome.i18n.getMessage("dangerWarning", [this.addon.name]))) ||
          (!this.addon._enabled && n.length && n.every((o) => this.$root.grantedOptionalPermissions.includes(o)) === !1
            ? Tt
              ? ((this.$root.addonToEnable = this.addon),
                (document.querySelector(".popup").style.animation = "dropDown 0.35s 1"),
                (this.$root.showPopupModal = !0))
              : chrome.permissions.request({ permissions: n }, (o) => {
                  o && (console.log("Permissions granted!"), e());
                })
            : e());
      },
      highlightSetting(t) {
        this.highlightedSettingId = t;
      },
      msg(...t) {
        return this.$root.msg(...t);
      },
    },
    watch: {
      groupId(t) {
        this.expanded = this.getDefaultExpanded();
      },
      searchInput(t) {
        t === "" ? (this.expanded = this.getDefaultExpanded()) : (this.expanded = !1);
      },
      expanded(t) {
        t === !0 && (this.everExpanded = !0);
      },
    },
    mounted() {
      const t = () => {
        location.hash.replace(/^#addon-/, "") === this.addon._addonId && (this.expanded = !0);
      };
      window.addEventListener("hashchange", t, { capture: !1 }), setTimeout(t, 0);
    },
  },
  nd = ["id"],
  sd = { class: "addon-topbar" },
  od = { class: "btn-dropdown" },
  id = { class: "addon-name" },
  rd = ["src"],
  ad = { class: "addon-check" },
  ld = a("img", { src: Ns, class: "icon-type" }, null, -1),
  dd = [ld],
  cd = ["state"],
  ud = { key: 0, class: "addon-settings" },
  hd = { class: "addon-description-full" },
  gd = { key: 0, class: "addon-message addon-update" },
  md = { id: "info" },
  pd = ["src"],
  fd = { key: 1, class: "addon-credits" },
  vd = { key: 0 },
  bd = { href: "{{ credit.link }}", rel: "noreferrer noopener", target: "_blank" },
  yd = { key: 1 },
  wd = { key: 2 },
  _d = { key: 2, class: "addon-license" },
  xd = { target: "_blank", href: "./licenses.html?libraries={{ addon.libraries.join(',') }}" },
  Sd = { class: "setting-label" },
  Ed = { class: "setting-label" },
  kd = { class: "addon-setting" },
  Md = ["disabled", "onClick", "title"],
  Id = { class: "preset-preview" };
function Td(t, e, n, s, o, i) {
  const r = me("addon-tag"),
    d = me("addon-setting");
  return F(
    (p(),
    v(
      "div",
      { class: "addon-body", id: "addon-" + n.addon._addonId },
      [
        a("div", sd, [
          a("div", { class: "clickable-area", onClick: e[1] || (e[1] = (l) => (o.expanded = !o.expanded)) }, [
            a("div", od, [a("img", { src: Ht, alt: "v", class: B({ reverted: o.expanded }) }, null, 2)]),
            a("div", id, [
              a("img", { src: i.addonIconSrc, class: "icon-type" }, null, 8, rd),
              a(
                "span",
                { onClick: e[0] || (e[0] = (...l) => i.devShowAddonIds && i.devShowAddonIds(...l)) },
                S(n.addon._displayedAddonId || n.addon.name),
                1
              ),
            ]),
            (p(!0),
            v(
              z,
              null,
              K(n.addon.tags, (l) => (p(), be(r, { tag: l }, null, 8, ["tag"]))),
              256
            )),
          ]),
          F(a("div", { class: "addon-description", dir: "auto" }, S(n.addon.description), 513), [[Z, !o.expanded]]),
          a("div", ad, [
            n.addon.settings
              ? F(
                  (p(),
                  v(
                    "div",
                    {
                      key: 0,
                      class: "addon-buttons",
                      title: "{{ msg('resetToDefault') }}",
                      onClick: e[2] || (e[2] = (...l) => i.loadDefaults && i.loadDefaults(...l)),
                    },
                    dd,
                    512
                  )),
                  [[Z, o.expanded && n.addon._enabled]]
                )
              : P("", !0),
            a(
              "div",
              {
                class: "switch",
                state: n.addon._enabled ? "on" : "off",
                onClick: e[3] || (e[3] = (...l) => i.toggleAddonRequest && i.toggleAddonRequest(...l)),
              },
              null,
              8,
              cd
            ),
          ]),
        ]),
        o.everExpanded
          ? F(
              (p(),
              v(
                "div",
                ud,
                [
                  a("div", hd, S(n.addon.description), 1),
                  i.showUpdateNotice
                    ? (p(), v("div", gd, [Lt(r, { tag: "new" }), le(" " + S(n.addon.latestUpdate.temporaryNotice), 1)]))
                    : P("", !0),
                  (p(!0),
                  v(
                    z,
                    null,
                    K(
                      n.addon.info,
                      (l) => (
                        p(),
                        v("div", md, [
                          a(
                            "div",
                            { class: B(["addon-message", "addon-" + (l.type || "info")]) },
                            [
                              a(
                                "img",
                                {
                                  src:
                                    "../../images/icons/" +
                                    { warning: "warning.svg", notice: "notice.svg", info: "help.svg" }[
                                      l.type || "info"
                                    ],
                                },
                                null,
                                8,
                                pd
                              ),
                              le(S(l.text), 1),
                            ],
                            2
                          ),
                        ])
                      )
                    ),
                    256
                  )),
                  n.addon.credits
                    ? (p(),
                      v("div", fd, [
                        a("span", null, S(i.msg("creditTo")), 1),
                        (p(!0),
                        v(
                          z,
                          null,
                          K(
                            n.addon.credits,
                            (l) => (
                              p(),
                              v("span", null, [
                                l.link
                                  ? (p(), v("span", vd, [a("a", bd, S(l.name), 1)]))
                                  : (p(), v("span", yd, S(l.name), 1)),
                                l.note ? (p(), v("span", wd, "(" + S(l.note) + ")", 1)) : P("", !0),
                              ])
                            )
                          ),
                          256
                        )),
                      ]))
                    : P("", !0),
                  n.addon.libraries && n.addon.libraries.length
                    ? (p(), v("div", _d, [a("a", xd, S(i.msg("viewLicenses")), 1)]))
                    : P("", !0),
                  n.addon.addonPreview && !o.isIframe
                    ? (p(),
                      v(
                        "div",
                        { key: 3, class: B(["preview-column", [n.addon._enabled ? "" : "disabled"]]) },
                        [
                          a("div", Sd, S(i.msg("preview")), 1),
                          (p(),
                          be(
                            Ln(n.addon.addonPreview.type),
                            {
                              options: n.addon.addonPreview,
                              settings: i.addonSettings,
                              "hovered-setting-id": o.hoveredSettingId,
                              onAreahover: i.highlightSetting,
                            },
                            null,
                            40,
                            ["options", "settings", "hovered-setting-id", "onAreahover"]
                          )),
                        ],
                        2
                      ))
                    : P("", !0),
                  a(
                    "div",
                    { class: B(["settings-column", [n.addon._enabled ? "" : "disabled"]]) },
                    [
                      (p(!0),
                      v(
                        z,
                        null,
                        K(
                          n.addon.settings,
                          (l) => (
                            p(),
                            be(
                              d,
                              {
                                class: B({ "setting-highlighted": o.highlightedSettingId === l.id }),
                                addon: n.addon,
                                setting: l,
                                "addon-settings": i.addonSettings,
                                onMouseenter: (c) => (o.hoveredSettingId = l.id),
                                onMouseleave: e[4] || (e[4] = (c) => (o.hoveredSettingId = null)),
                              },
                              null,
                              8,
                              ["class", "addon", "setting", "addon-settings", "onMouseenter"]
                            )
                          )
                        ),
                        256
                      )),
                    ],
                    2
                  ),
                  n.addon.presets
                    ? (p(),
                      v(
                        "div",
                        { key: 4, class: B(["presets-column", [n.addon._enabled ? "" : "disabled"]]) },
                        [
                          a("div", Ed, S(i.msg("presets")), 1),
                          (p(!0),
                          v(
                            z,
                            null,
                            K(
                              n.addon.presets,
                              (l) => (
                                p(),
                                v("div", kd, [
                                  a(
                                    "button",
                                    {
                                      type: "preset-button",
                                      class: "large-button",
                                      disabled: !n.addon._enabled,
                                      onClick: (c) => i.loadPreset(l),
                                      title: l.description,
                                    },
                                    [
                                      a("span", Id, [
                                        n.addon.presetPreview
                                          ? (p(),
                                            be(
                                              Ln("preview-" + n.addon.presetPreview.type),
                                              {
                                                key: 0,
                                                options: n.addon.presetPreview,
                                                "setting-data": n.addon.settings,
                                                settings: l.values,
                                              },
                                              null,
                                              8,
                                              ["options", "setting-data", "settings"]
                                            ))
                                          : P("", !0),
                                      ]),
                                      a("span", null, S(l.name), 1),
                                    ],
                                    8,
                                    Md
                                  ),
                                ])
                              )
                            ),
                            256
                          )),
                        ],
                        2
                      ))
                    : P("", !0),
                ],
                512
              )),
              [[Z, o.expanded]]
            )
          : P("", !0),
      ],
      8,
      nd
    )),
    [[Z, i.shouldShow]]
  );
}
const Cd = xe(td, [["render", Td]]);
const Od = {
  props: ["group", "shownCount", "marginAbove"],
  data() {
    return {};
  },
  computed: {
    shouldShow() {
      return this.$root.searchInput !== "" ? !1 : this.shownCount > 0;
    },
    manifestsById() {
      return this.$root.manifestsById;
    },
  },
  methods: {
    toggle() {
      this.group.expanded = !this.group.expanded;
    },
  },
};
function Dd(t, e, n, s, o, i) {
  return F(
    (p(),
    v(
      "div",
      {
        class: B(["addon-group", { "margin-above": n.marginAbove }]),
        onClick: e[0] || (e[0] = (...r) => i.toggle && i.toggle(...r)),
      },
      [
        a("img", { src: Ht, alt: "v", class: B({ reverted: n.group.expanded }) }, null, 2),
        le(" " + S(n.group.name()) + " (" + S(n.shownCount) + ") ", 1),
      ],
      2
    )),
    [[Z, i.shouldShow]]
  );
}
const Ad = xe(Od, [["render", Dd]]);
const Pd = {
    props: ["category"],
    data() {
      return { lastClick: 0 };
    },
    computed: {
      selectedCategory() {
        return this.$root.selectedCategory;
      },
      shouldShow() {
        const t = this.$root.categories.filter((e) => e.parent === this.category.parent).map((e) => e.id);
        return !this.category.parent || [this.category.parent, ...t].includes(this.selectedCategory);
      },
    },
    methods: {
      onClick(t) {
        t.stopPropagation(),
          this.selectedCategory === this.category.id && !this.category.parent && Date.now() - this.lastClick > 350
            ? (this.$root.selectedCategory = "all")
            : (this.$root.selectedCategory = this.category.id),
          (this.lastClick = Date.now());
      },
    },
  },
  Nd = ["src"];
function Ld(t, e, n, s, o, i) {
  return F(
    (p(),
    v(
      "div",
      {
        class: B(["category", { sel: n.category.id === i.selectedCategory, hasParent: n.category.parent }]),
        transition: "expand",
        style: Ee({ marginBottom: n.category.marginBottom ? "12px" : 0 }),
        onClick: e[0] || (e[0] = (r) => i.onClick(r)),
      },
      [
        a("img", { src: "../../images/icons/" + n.category.icon + ".svg" }, null, 8, Nd),
        a("span", null, S(n.category.name), 1),
      ],
      6
    )),
    [[Z, i.shouldShow]]
  );
}
const $d = xe(Pd, [["render", Ld]]),
  Rd = "/webpagesish/dist/assets/icon-transparent-b983d863.svg",
  Fd = "/webpagesish/dist/assets/users-d2b011ff.svg",
  Cn = "/webpagesish/dist/assets/popout-d42db7a8.svg",
  $s = "/webpagesish/dist/assets/translate-ed7a05ec.svg",
  jd = "/webpagesish/dist/assets/comment-fc49d526.svg",
  Bd = "/webpagesish/dist/assets/wrench-5ee40620.svg",
  zd = "/webpagesish/dist/assets/left-arrow-1921797b.svg",
  Hd = "/webpagesish/dist/assets/theme-63f4b498.svg",
  Ud = "/webpagesish/dist/assets/import-export-baf6ecd4.svg",
  On = ["notifications"];
typeof browser < "u" && On.push("clipboardWrite");
let Rs = [];
const Dn = () =>
  chrome.permissions.getAll(({ permissions: t }) => {
    Rs = t.filter((e) => On.includes(e));
  });
Dn();
var is;
(is = chrome.permissions.onAdded) == null || is.addListener(Dn);
var rs;
(rs = chrome.permissions.onRemoved) == null || rs.addListener(Dn);
let cn, Fs, js;
(async () => {
  const { theme: t, setGlobalTheme: e } = await Qs();
  (Fs = t), (js = e);
})();
let Ye = !1;
window.parent !== window && (document.body.classList.add("iframe"), (Ye = !0));
const Wd = {
    components: { Modal: ti, AddonBody: Cd, AddonGroupHeader: Ad, CategorySelector: $d },
    data() {
      return {
        smallMode: !1,
        theme: Fs,
        forceEnglishSetting: null,
        forceEnglishSettingInitial: null,
        switchPath: "../../images/icons/switch.svg",
        moreSettingsOpen: !1,
        categoryOpen: !0,
        loaded: !1,
        searchLoaded: !1,
        manifests: [],
        manifestsById: {},
        selectedCategory: "all",
        searchInput: "",
        searchInputReal: "",
        addonSettings: {},
        addonToEnable: null,
        showPopupModal: !1,
        isIframe: Ye,
        addonGroups: zn.filter((t) => (Ye ? t.iframeShow : t.fullscreenShow)),
        categories: Bo,
        searchMsg: this.msg("search"),
        browserLevelPermissions: On,
        grantedOptionalPermissions: Rs,
        addonListObjs: [],
        sidebarUrls: (() => {
          const t = chrome.i18n.getUILanguage(),
            e = t.startsWith("en") ? "" : `${t.split("-")[0]}/`,
            n = chrome.runtime.getManifest().version,
            s = chrome.runtime.getManifest().version_name,
            o = `utm_source=extension&utm_medium=settingspage&utm_campaign=v${n}`;
          return {
            contributors: `https://scratchaddons.com/${e}credits?${o}`,
            feedback: `https://scratchaddons.com/${e}feedback/?ext_version=${s}&${o}`,
            changelog: `https://scratchaddons.com/${e}changelog?${o}`,
          };
        })(),
      };
    },
    created() {
      chrome.runtime.sendMessage("getSettingsInfo", async ({ manifests: t, addonsEnabled: e, addonSettings: n }) => {
        var u, m;
        console.log("it runs??"), (this.addonSettings = n);
        const s = [];
        let o;
        Ye && (o = await Vo());
        const i = (h) => JSON.parse(JSON.stringify(h));
        for (const { manifest: h, addonId: f } of t) {
          (h._categories = []),
            (h._categories[0] = h.tags.includes("popup")
              ? "popup"
              : h.tags.includes("easterEgg")
              ? "easterEgg"
              : h.tags.includes("theme")
              ? "theme"
              : h.tags.includes("community")
              ? "community"
              : "editor");
          const y = (w) => {
            let O = 0;
            for (const A of w) {
              const R = typeof A == "object" ? A.tag : A,
                X = typeof A == "object" ? A.category : R;
              h.tags.includes(R) && (h._categories.push(X), O++);
            }
            return O;
          };
          if (
            (h._categories[0] === "theme"
              ? y([{ tag: "editor", category: "themesForEditor" }]) ||
                y([{ tag: "community", category: "themesForWebsite" }])
              : h._categories[0] === "editor"
              ? y(["codeEditor", "costumeEditor", "projectPlayer"]) === 0 && h._categories.push("editorOthers")
              : h._categories[0] === "community" &&
                y(["profiles", "projectPage", "forums"]) === 0 &&
                h._categories.push("communityOthers"),
            f === "cat-blocks" && h._categories.push("easterEgg"),
            (h._icon = h._categories[0]),
            (h._enabled = e[f]),
            (h._wasEverEnabled = h._enabled),
            (h._addonId = f),
            (h._groups = []),
            h.versionAdded)
          ) {
            const [w, O, A] = this.version.split("."),
              [R, X, J] = h.versionAdded.split(".");
            w === R &&
              O === X &&
              (h.tags.push("new"),
              h._groups.push(h.tags.includes("recommended") || h.tags.includes("featured") ? "featuredNew" : "new"));
          }
          if (h.latestUpdate) {
            const [w, O, A] = this.version.split("."),
              [R, X, J] = h.latestUpdate.version.split(".");
            w === R &&
              O === X &&
              (h.tags.push((u = h.latestUpdate.newSettings) != null && u.length ? "updatedWithSettings" : "updated"),
              h._groups.push(h.latestUpdate.isMajor ? "featuredNew" : "new"));
          }
          const T = vs.map((w) => w.matchName);
          h.tags.sort((w, O) => T.indexOf(w) - T.indexOf(O)),
            o != null && o.addonsCurrentlyOnTab.includes(f)
              ? h._groups.push("runningOnTab")
              : o != null && o.addonsPreviouslyOnTab.includes(f) && h._groups.push("recentlyUsed"),
            h._enabled
              ? h._groups.push("enabled")
              : h.tags.includes("recommended")
              ? h._groups.push("recommended")
              : h.tags.includes("featured")
              ? h._groups.push("featured")
              : h.tags.includes("beta") || h.tags.includes("danger")
              ? h._groups.push("beta")
              : h.tags.includes("forums")
              ? h._groups.push("forums")
              : h._groups.push("others");
          for (const w of h._groups)
            (m = this.addonGroups.find((O) => O.id === w)) == null || m.addonIds.push(h._addonId);
          s.push(i(h));
        }
        for (const { manifest: h } of t) this.manifestsById[h._addonId] = h;
        (this.manifests = t.map(({ manifest: h }) => h)), (cn = new qe(s, Ho)), console.log(this.manifests);
        const r = (h, f, y) => {
            const T = Array.isArray(h) ? h : [h],
              w = T.some((A) => f.tags.includes(A)),
              O = T.some((A) => y.tags.includes(A));
            return w ^ O ? O - w : w && O ? f.name.localeCompare(y.name) : null;
          },
          d = [["danger", "beta"], "editor", "community", "popup"];
        if (
          (this.addonGroups.forEach((h) => {
            h.addonIds = h.addonIds
              .map((f) => this.manifestsById[f])
              .sort((f, y) => {
                for (const T of h.customOrder || d) {
                  const w = r(T, f, y);
                  if (w !== null) return w;
                }
                return 0;
              })
              .map((f) => f._addonId);
          }),
          Ye)
        ) {
          const h = [];
          for (const y of this.addonGroups) y.addonIds.forEach((T) => h.push(T));
          const f = this.addonGroups.find((y) => y.id === "_iframeSearch");
          f.addonIds = Object.keys(this.manifestsById).filter((y) => h.indexOf(y) === -1);
        }
        let l = 0;
        for (const h of this.addonGroups)
          h.addonIds.forEach((f, y) => {
            const T = this.addonListObjs.find((A) => A.manifest._addonId === "example"),
              w = T || {};
            (w.duplicate = !!this.addonListObjs.find((A) => A.manifest._addonId === f)),
              (w.manifest = this.manifestsById[f]),
              (w.group = h),
              (w.matchesSearch = !1);
            let O = w.manifest._categories[0] === "easterEgg" && w.manifest._enabled === !1;
            if (f === "featured-dangos") {
              const X = new Date().getTime() / 1e3;
              O = !(X < 1680436800 && X > 1680264e3);
            }
            (w.matchesCategory = !O),
              (w.naturalIndex = l),
              (w.headerAbove = y === 0),
              (w.footerBelow = y === h.addonIds.length - 1),
              T || this.addonListObjs.push(w),
              l++;
          });
        (this.addonListObjs = this.addonListObjs.filter((h) => h.manifest._addonId !== "example")),
          (this.loaded = !0),
          setTimeout(() => {
            const h = window.location.hash;
            if (h.startsWith("#addon-")) {
              const f = h.substring(7),
                y = this.addonGroups.find((w) => w.addonIds.includes(f));
              if (!y) return;
              y.expanded = !0;
              const T = this.manifestsById[f];
              (this.selectedCategory = T != null && T.tags.includes("easterEgg") ? "easterEgg" : "all"),
                setTimeout(() => {
                  const w = document.getElementById("addon-" + f);
                  w &&
                    (w.scrollIntoView(),
                    w.classList.add("addon-blink"),
                    setTimeout(() => w.classList.remove("addon-blink"), 2001));
                }, 0);
            }
          }, 0);
        let c = "";
        t.forEach(({ addonId: h }) => (c += e[h] === !0 ? "1" : "0"));
        const g = BigInt(`0b${c}`).toString(36);
        this.sidebarUrls.feedback += `#_${g}`;
      });
    },
    computed: {
      themePath() {
        return this.theme ? "../../images/icons/moon.svg" : "../../images/icons/theme.svg";
      },
      addonList() {
        if (!this.searchInput)
          return (
            this.addonListObjs.forEach((s) => {
              s.group.id === "_iframeSearch" ? (s.matchesSearch = !1) : (s.matchesSearch = !0);
            }),
            this.addonListObjs.sort((s, o) => s.naturalIndex - o.naturalIndex)
          );
        if (!cn) return [];
        const t = Object.values(
            this.addonListObjs.reduce(
              (s, o) => (
                (!s[o.manifest._addonId] ||
                  (s[o.manifest._addonId] && o.group.id !== "featuredNew" && o.group.id !== "new")) &&
                  (s[o.manifest._addonId] = o),
                s
              ),
              Object.create(null)
            )
          ),
          n = cn
            .search(this.searchInput)
            .sort((s, o) =>
              (s.score < 0.1) ^ (o.score < 0.1) ? (s.score < 0.1 ? -1 : 1) : o.item._enabled - s.item._enabled
            )
            .map((s) => t.find((o) => o.manifest._addonId === s.item._addonId));
        for (const s of t) s.matchesSearch = n.includes(s);
        return t.sort((s, o) => n.indexOf(s) - n.indexOf(o));
      },
      hasNoResults() {
        return !this.addonList.some((t) => t.matchesSearch && t.matchesCategory);
      },
      version() {
        return chrome.runtime.getManifest().version;
      },
      versionName() {
        return chrome.runtime.getManifest().version_name;
      },
      addonAmt() {
        return `${Math.floor(this.manifests.filter((t) => !t.tags.includes("easterEgg")).length / 5) * 5}+`;
      },
      selectedCategoryName() {
        var t;
        return (t = this.categories.find((e) => e.id === this.selectedCategory)) == null ? void 0 : t.name;
      },
    },
    methods: {
      openMoreSettings: function () {
        this.closePickers(), (this.moreSettingsOpen = !0), this.smallMode && this.sidebarToggle();
      },
      sidebarToggle: function () {
        (this.categoryOpen = !this.categoryOpen),
          this.categoryOpen
            ? (this.switchPath = "../../images/icons/close.svg")
            : (this.switchPath = "../../images/icons/switch.svg");
      },
      msg(t, ...e) {
        return chrome.i18n.getMessage(t, ...e);
      },
      direction() {
        return Uo(chrome.i18n.getUILanguage());
      },
      openReview() {
        typeof browser < "u"
          ? window.open("https://addons.mozilla.org/en-US/firefox/addon/scratch-messaging-extension/reviews/")
          : window.open(
              "https://chrome.google.com/webstore/detail/scratch-addons/fbeffbjdlemaoicjdapfpikkikjoneco/reviews"
            );
      },
      clearSearch() {
        this.searchInputReal = "";
      },
      setTheme(t) {
        js(t), (this.theme = t);
      },
      stopPropagation(t) {
        t.stopPropagation();
      },
      updateSettings(t, { wait: e = 0, settingId: n = null } = {}) {
        const s = n && this.addonSettings[t._addonId][n];
        setTimeout(() => {
          (!n || this.addonSettings[t._addonId][n] === s) &&
            (chrome.runtime.sendMessage({
              changeAddonSettings: { addonId: t._addonId, newSettings: this.addonSettings[t._addonId] },
            }),
            console.log("Updated", this.addonSettings[t._addonId]));
        }, e);
      },
      closePickers(t, e, { callCloseDropdowns: n = !0 } = {}) {
        ht.$emit("close-pickers", e), n && this.closeResetDropdowns();
      },
      closeResetDropdowns(t, e) {
        ht.$emit("close-reset-dropdowns", e);
      },
      exportSettings() {
        Un().then((t) => {
          const e = new Blob([t], { type: "application/json" });
          qs("scratch-addons-settings.json", e);
        });
      },
      viewSettings() {
        const t = window.open("about:blank");
        Un().then((e) => {
          const n = new Blob([e], { type: "text/plain" });
          t.location.replace(URL.createObjectURL(n));
        });
      },
      importSettings() {
        const t = Object.assign(document.createElement("input"), {
          hidden: !0,
          type: "file",
          accept: "application/json",
        });
        t.addEventListener(
          "change",
          async (e) => {
            const n = t.files[0];
            if (!n) {
              t.remove(), alert(chrome.i18n.getMessage("fileNotSelected"));
              return;
            }
            const s = await n.text();
            t.remove();
            const o = document.getElementById("confirmImport");
            try {
              await Ko(s, this.manifests, o);
            } catch (i) {
              console.warn("Error when importing settings:", i),
                o.classList.add("hidden-button"),
                alert(chrome.i18n.getMessage("importFailed"));
              return;
            }
            alert(chrome.i18n.getMessage("importSuccess")), chrome.runtime.reload();
          },
          { once: !0 }
        ),
          document.body.appendChild(t),
          t.click();
      },
      applyLanguageSettings() {
        alert(chrome.i18n.getMessage("importSuccess")), chrome.runtime.reload();
      },
      openFullSettings() {
        window.open(
          `${chrome.runtime.getURL("webpages/settings/index.html")}#addon-${
            this.addonToEnable && this.addonToEnable._addonId
          }`
        ),
          setTimeout(() => window.parent.close(), 100);
      },
      hidePopup() {
        (document.querySelector(".popup").style.animation = "closePopup 0.6s 1"),
          document.querySelector(".popup").addEventListener(
            "animationend",
            () => {
              this.showPopupModal = !1;
            },
            { once: !0 }
          );
      },
      groupShownCount(t) {
        return t.id === "_iframeSearch"
          ? -1
          : this.addonListObjs.filter((e) => e.group === t && e.matchesSearch && e.matchesCategory).length;
      },
      groupMarginAbove(t) {
        const e = this.addonGroups.find((n) => this.groupShownCount(n) > 0);
        return t !== e;
      },
      closesidebar(t) {
        (t == null ? void 0 : t.target.classList[0]) !== "toggle" &&
          this.categoryOpen &&
          this.smallMode &&
          this.sidebarToggle();
      },
      resizeEvent() {
        console.log("hi"),
          window.innerWidth < 1100
            ? ((this.smallMode = !0), (this.categoryOpen = !1), (this.switchPath = "../../images/icons/switch.svg"))
            : this.smallMode !== !1 &&
              ((this.smallMode = !1), (this.categoryOpen = !0), (this.switchPath = "../../images/icons/close.svg"));
      },
    },
    watch: {
      searchInputReal(t) {
        if (t === "") return (this.searchInput = t);
        setTimeout(() => {
          this.searchInputReal === t && (this.searchInput = t);
        }, 150);
      },
      selectedCategory(t) {
        this.addonListObjs.forEach((e) => {
          const n = e.manifest._categories[0] === "easterEgg" && t !== "easterEgg" && e.manifest._wasEverEnabled === !1;
          e.matchesCategory = !n && (t === "all" || e.manifest._categories.includes(t));
        }),
          t === "forums" && (this.addonGroups.find((e) => e.id === "forums").expanded = !0);
      },
      forceEnglishSetting(t, e) {
        e !== null && chrome.storage.local.set({ forceEnglish: this.forceEnglishSetting });
      },
    },
    mounted() {
      (Ye || typeof browser < "u") &&
        setTimeout(() => {
          var e;
          return (e = document.getElementById("searchBox")) == null ? void 0 : e.focus();
        }, 0);
      const t = {
        group: zn[0],
        manifest: JSON.parse(JSON.stringify(zo)),
        matchesSearch: !0,
        matchesCategory: !0,
        naturalIndex: -1,
        headerAbove: !1,
        footerBelow: !1,
        duplicate: !1,
      };
      setTimeout(() => {
        this.loaded ||
          (this.addonListObjs = Array(25)
            .fill("")
            .map(() => JSON.parse(JSON.stringify(t))));
      }, 0),
        chrome.storage.local.get("forceEnglish", ({ forceEnglish: e }) => {
          (this.forceEnglishSettingInitial = e), (this.forceEnglishSetting = e);
        }),
        window.addEventListener(
          "hashchange",
          (e) => {
            const n = location.hash.replace(/^#addon-/, ""),
              s = this.addonGroups.find((i) => i.addonIds.includes(n));
            if (!s) return;
            const o = this.manifestsById[n];
            (s.expanded = !0),
              (this.selectedCategory = o != null && o.tags.includes("easterEgg") ? "easterEgg" : "all"),
              this.clearSearch(),
              setTimeout(() => {
                var i;
                return (i = document.getElementById("addon-" + n)) == null ? void 0 : i.scrollIntoView();
              }, 0);
          },
          { capture: !1 }
        ),
        window.addEventListener("resize", this.resizeEvent),
        this.resizeEvent();
    },
  },
  Gd = { class: "navbar" },
  Yd = ["src"],
  Xd = a("img", { src: Rd, class: "logo", alt: "Logo" }, null, -1),
  Vd = ["src"],
  Kd = { class: "main" },
  Jd = ["href"],
  qd = a("img", { src: Fd }, null, -1),
  Qd = a("img", { src: Cn }, null, -1),
  Zd = { class: "category category-small", href: "https://scratchaddons.com/translate", target: "_blank" },
  ec = a("img", { src: $s }, null, -1),
  tc = a("img", { src: Cn }, null, -1),
  nc = ["href"],
  sc = a("img", { src: jd }, null, -1),
  oc = a("img", { src: Cn }, null, -1),
  ic = a("img", { src: Bd }, null, -1),
  rc = { class: "addons-block" },
  ac = ["placeholder"],
  lc = { class: "search-button" },
  dc = { key: 0, id: "search-not-found" },
  cc = { key: 1, id: "search-not-found" },
  uc = { key: 0, id: "iframe-fullscreen-suggestion" },
  hc = { class: "addon-block settings-block" },
  gc = { class: "addon-body" },
  mc = { class: "addon-topbar" },
  pc = { class: "addon-name" },
  fc = a("img", { src: Hd, class: "icon-type" }, null, -1),
  vc = { class: "addon-settings" },
  bc = { class: "addon-description-full" },
  yc = { class: "addon-setting" },
  wc = { class: "filter-selector" },
  _c = { class: "filter-text" },
  xc = { class: "filter-options" },
  Sc = { class: "addon-body" },
  Ec = { class: "addon-topbar" },
  kc = { class: "addon-name" },
  Mc = { class: "addon-settings" },
  Ic = { class: "addon-description-full" },
  Tc = { class: "addon-description-full" },
  Cc = { class: "addon-setting" },
  Oc = { class: "filter-selector" },
  Dc = { class: "filter-selector" },
  Ac = { class: "large-button hidden-button", id: "confirmImport" },
  Pc = { class: "filter-selector", style: { "margin-left": "16px" } },
  Nc = { class: "addon-body" },
  Lc = { class: "addon-topbar" },
  $c = { class: "addon-name" },
  Rc = a("img", { src: $s, class: "icon-type" }, null, -1),
  Fc = { class: "addon-settings" },
  jc = { class: "addon-setting", style: { "margin-top": "0" } },
  Bc = a("span", null, "Show addon names and descriptions in English", -1),
  zc = { class: "badge red" },
  Hc = { class: "footer" },
  Uc = ["href"],
  Wc = {
    href: "./licenses.html?libraries=icu-message-formatter,vue,color-picker-web-component,comlink,Sora,fuse,idb,sortable",
    target: "_blank",
  },
  Gc = { class: "popup" },
  Yc = { class: "label" };
function Xc(t, e, n, s, o, i) {
  const r = me("category-selector"),
    d = me("addon-group-header"),
    l = me("addon-body"),
    c = me("modal"),
    g = Nt("click-outside");
  return (
    p(),
    v(
      z,
      null,
      [
        a("div", Gd, [
          F(
            a(
              "img",
              { src: o.switchPath, class: "toggle", onClick: e[0] || (e[0] = (u) => i.sidebarToggle()), alt: "Logo" },
              null,
              8,
              Yd
            ),
            [[Z, o.smallMode]]
          ),
          Xd,
          a("h1", null, S(i.msg("settings")), 1),
          a(
            "img",
            { onClick: e[1] || (e[1] = (u) => i.setTheme(!o.theme)), class: "theme-switch", src: i.themePath },
            null,
            8,
            Vd
          ),
        ]),
        a("div", Kd, [
          F(
            (p(),
            v(
              "div",
              { class: B(["categories-block", { smallMode: o.smallMode === !0 }]) },
              [
                (p(!0),
                v(
                  z,
                  null,
                  K(o.categories, (u) => (p(), be(r, { category: u }, null, 8, ["category"]))),
                  256
                )),
                a(
                  "a",
                  {
                    class: "category category-small",
                    style: { "margin-top": "auto" },
                    href: o.sidebarUrls.contributors,
                    target: "_blank",
                  },
                  [qd, a("span", null, [le(S(i.msg("credits")) + " ", 1), Qd])],
                  8,
                  Jd
                ),
                a("a", Zd, [ec, a("span", null, [le(S(i.msg("translate")) + " ", 1), tc])]),
                a(
                  "a",
                  { class: "category category-small", href: "https://scratchaddons.com/feedback/", target: "_blank" },
                  [sc, a("span", null, [le(S(i.msg("feedback")) + " ", 1), oc])],
                  8,
                  nc
                ),
                a(
                  "div",
                  {
                    class: "category",
                    style: { "margin-top": "12px", "margin-bottom": "14px" },
                    onClick: e[2] || (e[2] = (u) => i.openMoreSettings()),
                  },
                  [ic, a("span", null, S(i.msg("moreSettings")), 1)]
                ),
              ],
              2
            )),
            [
              [g, i.closesidebar],
              [Z, o.categoryOpen && !o.isIframe],
            ]
          ),
          F(
            a(
              "div",
              { class: "categories-shrink", onClick: e[3] || (e[3] = (u) => i.sidebarToggle()) },
              [a("img", { src: zd, class: B({ flipped: o.categoryOpen === (i.direction() === "rtl") }) }, null, 2)],
              512
            ),
            [[Z, !o.isIframe && o.smallMode === !1]]
          ),
          a("div", rc, [
            a(
              "div",
              { class: B(["search-box", { smallMode: o.smallMode === !0 }]) },
              [
                F(
                  a(
                    "input",
                    {
                      type: "text",
                      id: "searchBox",
                      placeholder: o.searchMsg,
                      "onUpdate:modelValue": e[4] || (e[4] = (u) => (o.searchInputReal = u)),
                      autofocus: "",
                    },
                    null,
                    8,
                    ac
                  ),
                  [[nt, o.searchInputReal]]
                ),
                F(a("button", lc, null, 512), [[Z, o.searchInput === ""]]),
                F(
                  a(
                    "button",
                    { class: "search-clear-button", onClick: e[5] || (e[5] = (u) => i.clearSearch()) },
                    null,
                    512
                  ),
                  [[Z, o.searchInput !== ""]]
                ),
              ],
              2
            ),
            a(
              "div",
              { class: B(["addons-container", { placeholder: !o.loaded }]) },
              [
                o.searchInput && i.hasNoResults
                  ? (p(),
                    v(
                      z,
                      { key: 0 },
                      [
                        o.selectedCategory === "all" || !i.selectedCategoryName
                          ? (p(), v("p", dc, S(i.msg("searchNotFound")), 1))
                          : (p(), v("p", cc, S(i.msg("searchNotFoundInCategory", i.selectedCategoryName)), 1)),
                      ],
                      64
                    ))
                  : P("", !0),
                (p(!0),
                v(
                  z,
                  null,
                  K(
                    i.addonList,
                    (u) => (
                      p(),
                      v(
                        z,
                        null,
                        [
                          o.isIframe && u.headerAbove && (i.hasNoResults || u.group.id === "enabled")
                            ? F(
                                (p(),
                                v(
                                  "div",
                                  uc,
                                  [
                                    a("span", null, S(i.msg("exploreAllAddons", [i.addonAmt])), 1),
                                    a(
                                      "button",
                                      { class: "large-button", onClick: e[6] || (e[6] = (m) => i.openFullSettings()) },
                                      S(i.msg("openFullSettings")),
                                      1
                                    ),
                                  ],
                                  512
                                )),
                                [[Z, o.searchInput === ""]]
                              )
                            : P("", !0),
                          u.headerAbove
                            ? (p(),
                              be(
                                d,
                                {
                                  key: 1,
                                  group: u.group,
                                  "shown-count": i.groupShownCount(u.group),
                                  "margin-above": i.groupMarginAbove(u.group),
                                },
                                null,
                                8,
                                ["group", "shown-count", "margin-above"]
                              ))
                            : P("", !0),
                          Lt(
                            l,
                            {
                              visible: u.matchesSearch && u.matchesCategory,
                              addon: u.manifest,
                              "group-id": u.group.id,
                              "group-expanded": u.group.expanded,
                            },
                            null,
                            8,
                            ["visible", "addon", "group-id", "group-expanded"]
                          ),
                        ],
                        64
                      )
                    )
                  ),
                  256
                )),
              ],
              2
            ),
          ]),
        ]),
        Lt(
          c,
          { class: "more-settings", "is-open": o.moreSettingsOpen, title: i.msg("moreSettings") },
          {
            default: Ks(() => [
              a("div", hc, [
                a("div", gc, [
                  a("div", mc, [a("span", pc, [fc, le(" " + S(i.msg("scratchAddonsTheme")), 1)])]),
                  a("div", vc, [
                    a("span", bc, S(i.msg("scratchAddonsThemeDescription")), 1),
                    a("div", yc, [
                      a("div", wc, [
                        a("div", _c, S(i.msg("theme")), 1),
                        a("div", xc, [
                          a(
                            "div",
                            {
                              class: B(["filter-option", { sel: o.theme === !0 }]),
                              onClick: e[7] || (e[7] = (u) => i.setTheme(!0)),
                            },
                            S(i.msg("light")),
                            3
                          ),
                          a(
                            "div",
                            {
                              class: B(["filter-option", { sel: o.theme === !1 }]),
                              onClick: e[8] || (e[8] = (u) => i.setTheme(!1)),
                            },
                            S(i.msg("dark")),
                            3
                          ),
                        ]),
                      ]),
                    ]),
                  ]),
                ]),
                a("div", Sc, [
                  a("div", Ec, [
                    a("span", kc, [
                      a("img", { src: Ud, class: B(["icon-type", { dark: o.theme === !1 }]) }, null, 2),
                      le(" " + S(i.msg("exportAndImportSettings")), 1),
                    ]),
                  ]),
                  a("div", Mc, [
                    a("span", Ic, S(i.msg("exportAndImportSettingsDescription")), 1),
                    a("span", Tc, S(i.msg("useBrowserSync")), 1),
                    a("div", Cc, [
                      a("div", Oc, [
                        a(
                          "button",
                          { class: "large-button", onClick: e[9] || (e[9] = (u) => i.exportSettings()) },
                          S(i.msg("export")),
                          1
                        ),
                      ]),
                      a("div", Dc, [
                        a(
                          "button",
                          { class: "large-button", onClick: e[10] || (e[10] = (u) => i.importSettings()) },
                          S(i.msg("import")),
                          1
                        ),
                        a("button", Ac, S(i.msg("confirmImport")), 1),
                      ]),
                      a("div", Pc, [
                        a(
                          "button",
                          { class: "large-button", onClick: e[11] || (e[11] = (u) => i.viewSettings()) },
                          S(i.msg("viewSettings")),
                          1
                        ),
                      ]),
                    ]),
                  ]),
                ]),
                a("div", Nc, [
                  a("div", Lc, [a("span", $c, [Rc, le(S(i.msg("language")), 1)])]),
                  a("div", Fc, [
                    a("div", jc, [
                      F(
                        a(
                          "input",
                          {
                            type: "checkbox",
                            class: "setting-input check",
                            "onUpdate:modelValue": e[12] || (e[12] = (u) => (o.forceEnglishSetting = u)),
                            style: { "margin-inline-start": "0", "margin-inline-end": "8px" },
                          },
                          null,
                          512
                        ),
                        [[as, o.forceEnglishSetting]]
                      ),
                      Bc,
                      a("div", zc, S(i.msg("beta")), 1),
                      F(
                        a(
                          "button",
                          {
                            class: "large-button",
                            id: "applyLanguageSettingsButton",
                            onClick: e[13] || (e[13] = (u) => i.applyLanguageSettings()),
                            style: { "margin-inline-start": "16px" },
                          },
                          S(i.msg("applySettings")),
                          513
                        ),
                        [
                          [
                            Z,
                            o.forceEnglishSetting !== null && o.forceEnglishSetting !== this.forceEnglishSettingInitial,
                          ],
                        ]
                      ),
                    ]),
                  ]),
                ]),
              ]),
              a("div", Hc, [
                a("p", null, [
                  le(S(i.msg("extensionName")) + " ", 1),
                  a(
                    "a",
                    { href: "https://scratchaddons.com/changelog", title: "{{ msg('changelog') }}", target: "_blank" },
                    " v" + S(i.version),
                    9,
                    Uc
                  ),
                ]),
                a("p", null, [a("a", Wc, S(i.msg("libraryCredits")), 1)]),
              ]),
            ]),
            _: 1,
          },
          8,
          ["is-open", "title"]
        ),
        F(
          a(
            "div",
            Gc,
            [
              a("div", Yc, S(i.msg("settingsPagePermission", o.addonToEnable ? o.addonToEnable.name : "")), 1),
              a("div", null, [
                a(
                  "button",
                  { class: "large-button", onClick: e[14] || (e[14] = (u) => i.openFullSettings()) },
                  S(i.msg("openFullSettings")),
                  1
                ),
                a(
                  "button",
                  { class: "large-button", onClick: e[15] || (e[15] = (u) => i.hidePopup()) },
                  S(i.msg("skipOpenFullSettings")),
                  1
                ),
              ]),
            ],
            512
          ),
          [[Z, o.showPopupModal]]
        ),
      ],
      64
    )
  );
}
const Vc = xe(Wd, [["render", Xc]]);
function Bs(t) {
  if (typeof t.getRootNode != "function") {
    for (; t.parentNode; ) t = t.parentNode;
    return t !== document ? null : document;
  }
  const e = t.getRootNode();
  return e !== document && e.getRootNode({ composed: !0 }) !== document ? null : e;
}
function Kc() {
  return !0;
}
function zs(t, e, n) {
  if (!t || Hs(t, n) === !1) return !1;
  const s = Bs(e);
  if (typeof ShadowRoot < "u" && s instanceof ShadowRoot && s.host === t.target) return !1;
  const o = ((typeof n.value == "object" && n.value.include) || (() => []))();
  return o.push(e), !o.some((i) => (i == null ? void 0 : i.contains(t.target)));
}
function Hs(t, e) {
  return ((typeof e.value == "object" && e.value.closeConditional) || Kc)(t);
}
function Jc(t, e, n) {
  var o;
  const s = typeof n.value == "function" ? n.value : n.value.handler;
  (o = e._clickOutside) != null &&
    o.lastMousedownWasOutside &&
    zs(t, e, n) &&
    setTimeout(() => {
      Hs(t, n) && s && s(t);
    }, 0);
}
function os(t, e) {
  const n = Bs(t);
  e(document), typeof ShadowRoot < "u" && n instanceof ShadowRoot && e(n);
}
const qc = {
    mounted(t, e) {
      var o;
      const n = (i) => Jc(i, t, e),
        s = (i) => {
          t._clickOutside.lastMousedownWasOutside = zs(i, t, e);
        };
      os(t, (i) => {
        i.addEventListener("click", n, !0), i.addEventListener("mousedown", s, !0);
      }),
        t._clickOutside || (t._clickOutside = { lastMousedownWasOutside: !1 }),
        (t._clickOutside[(o = e.instance) == null ? void 0 : o.$.uid] = { onClick: n, onMousedown: s });
    },
    unmounted(t, e) {
      t._clickOutside &&
        (os(t, (n) => {
          var i, r, d;
          if (!n || !((r = t._clickOutside) != null && r[(i = e.instance) == null ? void 0 : i.$.uid])) return;
          const { onClick: s, onMousedown: o } = t._clickOutside[(d = e.instance) == null ? void 0 : d.$.uid];
          n.removeEventListener("click", s, !0), n.removeEventListener("mousedown", o, !0);
        }),
        delete t._clickOutside[e.instance.$.uid]);
    },
  },
  Us = Js(Vc);
Us.directive("click-outside", qc);
Us.mount("#app");
