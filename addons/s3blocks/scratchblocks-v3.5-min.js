/**
 * scratchblocks v3.5.0
 * https://scratchblocks.github.io/
 * Render scratchblocks code to SVG images.
 *
 * Copyright 2013–2020, Tim Radvan
 * @license MIT
 */
// copy that defaults to scratch3 style instead of scratch2
var scratchblocks = (function () {
  "use strict";
  var e = Math.min,
    t = Math.max;
  function i(e, t) {
    return e((t = { exports: {} }), t.exports), t.exports;
  }
  function n() {
    return (n =
      Object.assign ||
      function (e) {
        for (var t, i = 1; i < arguments.length; i++)
          for (var n in (t = arguments[i])) Object.prototype.hasOwnProperty.call(t, n) && (e[n] = t[n]);
        return e;
      }).apply(this, arguments);
  }
  function s(e, t) {
    (null == t || t > e.length) && (t = e.length);
    for (var i = 0, n = Array(t); i < t; i++) n[i] = e[i];
    return n;
  }
  function r(e, t) {
    var i;
    if ("undefined" == typeof Symbol || null == e[Symbol.iterator]) {
      if (
        Array.isArray(e) ||
        (i = (function (e, t) {
          if (e) {
            if ("string" == typeof e) return s(e, t);
            var i = Object.prototype.toString.call(e).slice(8, -1);
            return (
              "Object" === i && e.constructor && (i = e.constructor.name),
              "Map" === i || "Set" === i
                ? Array.from(e)
                : "Arguments" === i || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(i)
                ? s(e, t)
                : void 0
            );
          }
        })(e)) ||
        (t && e && "number" == typeof e.length)
      ) {
        i && (e = i);
        var n = 0,
          r = function () {};
        return {
          s: r,
          n: function () {
            return n >= e.length ? { done: !0 } : { done: !1, value: e[n++] };
          },
          e: function (e) {
            throw e;
          },
          f: r,
        };
      }
      throw new TypeError(
        "Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
      );
    }
    var o,
      a = !0,
      c = !1;
    return {
      s: function () {
        i = e[Symbol.iterator]();
      },
      n: function () {
        var e = i.next();
        return (a = e.done), e;
      },
      e: function (e) {
        (c = !0), (o = e);
      },
      f: function () {
        try {
          a || null == i.return || i.return();
        } finally {
          if (c) throw o;
        }
      },
    };
  }
  function o(e) {
    return a(e.replace(k, " _ "));
  }
  function a(e) {
    return e
      .replace(/_/g, " _ ")
      .replace(/ +/g, " ")
      .replace(/[,%?:]/g, "")
      .replace(/ß/g, "ss")
      .replace(/ä/g, "a")
      .replace(/ö/g, "o")
      .replace(/ü/g, "u")
      .replace(". . .", "...")
      .replace(/^…$/, "...")
      .trim()
      .toLowerCase();
  }
  function c(e) {
    Object.keys(e).forEach(function (t) {
      !(function (e, t) {
        var i = (t.blocksByHash = {});
        Object.keys(t.commands).forEach(function (e) {
          var n = t.commands[e],
            s = E[e],
            r = o(n);
          i[r] = s;
          var a = A.exec(e);
          if (a) {
            var c = a[0],
              l = r.replace(o(c), I[c]);
            i[l] = s;
          }
        }),
          (t.nativeAliases = {}),
          Object.keys(t.aliases).forEach(function (e) {
            var n = t.aliases[e],
              s = E[n];
            var r = o(e);
            (i[r] = s), (t.nativeAliases[n] = e);
          }),
          Object.keys(t.renamedBlocks || {}).forEach(function (e) {
            var i = t.renamedBlocks[e];
            if (!L[i]) throw new Error("Unknown ID: " + i);
            var n = L[i],
              s = o(e);
            T.blocksByHash[s] = n;
          }),
          (t.nativeDropdowns = {}),
          Object.keys(t.dropdowns).forEach(function (e) {
            var i = t.dropdowns[e];
            t.nativeDropdowns[i] = e;
          }),
          (t.code = e),
          (C[e] = t);
      })(t, e[t]);
    });
  }
  function l(e, t) {
    if (!L[e]) throw new Error("Unknown ID: " + e);
    L[e].specialCase = t;
  }
  function h(e, t, i) {
    var n = function (n, s, r) {
      return L[i(s, r) ? e : t];
    };
    l(e, n), l(t, n);
  }
  function p(e, t) {
    if (!e) throw "Assertion failed! " + (t || "");
  }
  function u(e, t, i) {
    var n = [];
    (function (e) {
      return e && e.constructor === Array;
    })(t[t.length - 1]) && (n = t.pop());
    for (var s, o = [], a = 0; a < t.length; a++)
      (s = t[a]).isLabel ? o.push(s.value) : s.isIcon ? o.push("@" + s.name) : o.push("_");
    var c = o.join(" "),
      l = (e.hash = se(c)),
      h = re(l, e, t, i);
    if (h) {
      var p = h.lang,
        d = h.type;
      (e.language = p),
        (e.isRTL = -1 < ce.indexOf(p.code)),
        ("ring" === d.shape ? "reporter" === e.shape : "stack" === e.shape) && (e.shape = d.shape),
        (e.category = d.category),
        (e.categoryIsDefault = !0),
        d.selector && (e.selector = d.selector),
        d.id && (e.id = d.id),
        (e.hasLoopArrow = d.hasLoopArrow),
        ". . ." === d.spec && (t = [new W(". . .")]);
    } else {
      var g,
        m = r(i);
      try {
        for (m.s(); !(g = m.n()).done; ) {
          var v = g.value;
          if (f(t, v)) {
            (e.shape = "define-hat"), (e.category = "custom");
            for (
              var b, y = t.splice(v.definePrefix.length, t.length - v.defineSuffix.length), w = 0;
              w < y.length;
              w++
            ) {
              if ((b = y[w]).isInput && b.isBoolean)
                b = u({ shape: "boolean", argument: "boolean", category: "custom-arg" }, [new W("")], i);
              else if (!b.isInput || ("string" !== b.shape && "number" !== b.shape))
                (b.isReporter || b.isBoolean) &&
                  b.info.categoryIsDefault &&
                  ((b.info.category = "custom-arg"), (b.info.argument = b.isBoolean ? "boolean" : "number"));
              else {
                var k = b.value.split(/ +/g).map(function (e) {
                  return new W(e);
                });
                b = u(
                  { shape: "reporter", argument: "string" === b.shape ? "string" : "number", category: "custom-arg" },
                  k,
                  i
                );
              }
              y[w] = b;
            }
            var A = new q({ shape: "outline", category: "custom", categoryIsDefault: !0, hasLoopArrow: !1 }, y);
            t.splice(v.definePrefix.length, 0, A);
            break;
          }
        }
      } catch (e) {
        m.e(e);
      } finally {
        m.f();
      }
    }
    ae(e, n), e.hasLoopArrow && t.push(new X("loopArrow"));
    var O = new q(e, t);
    return d && le.test(d.spec) && O.translate(p, !0), "+" === e.diff ? new J(O) : ((O.diff = e.diff), O);
  }
  function f(e, t) {
    if (e.length < t.definePrefix.length) return !1;
    if (e.length < t.defineSuffix.length) return !1;
    for (var i = 0; i < t.definePrefix.length; i++) {
      var n = t.definePrefix[i],
        s = e[i];
      if (!s.isLabel || se(s.value) !== se(n)) return !1;
    }
    for (i = 1; i <= t.defineSuffix.length; i++) {
      var r = t.defineSuffix[t.defineSuffix.length - i],
        o = e[e.length - i];
      if (!o.isLabel || se(o.value) !== se(r)) return !1;
    }
    return !0;
  }
  function d(e, t) {
    function i() {
      y = e[++w];
    }
    function n() {
      return e[w + 1];
    }
    function s() {
      for (var t = w + 1; t < e.length; t++) if (" " !== e[t]) return e[t];
    }
    function r(e, i) {
      var n = !!i.filter(function (e) {
        return !e.isLabel;
      }).length;
      return u(
        {
          shape: e,
          category: "reporter" !== e || n ? "obsolete" : "variables",
          categoryIsDefault: !0,
          hasLoopArrow: !1,
        },
        i,
        t
      );
    }
    function o(e, i) {
      var n = ie(i, t) || i;
      return new Z(e, i, n);
    }
    function a(e) {
      for (var t, r = []; y && "\n" !== y; ) {
        if ("<" === y || (">" === y && ">" === e)) {
          var o = r[r.length - 1],
            a = s();
          if (o && !o.isLabel && ("[" === a || "(" === a || "<" === a || "{" === a)) {
            (t = null), r.push(new W(y)), i();
            continue;
          }
        }
        if (y === e) break;
        if ("/" === y && "/" === n() && !e) break;
        switch (y) {
          case "[":
            (t = null), r.push(c());
            break;
          case "(":
            (t = null), r.push(h());
            break;
          case "<":
            (t = null), r.push(p());
            break;
          case "{":
            (t = null), r.push(f());
            break;
          case " ":
          case "\t":
            i(), (t = null);
            break;
          case "◂":
          case "▸":
            r.push(d()), (t = null);
            break;
          case "@":
            i();
            for (var l = ""; y && /[a-zA-Z]/.test(y); ) (l += y), i();
            "cloud" === l ? r.push(new W("☁")) : r.push(X.icons.hasOwnProperty(l) ? new X(l) : new W("@" + l)),
              (t = null);
            break;
          case "\\":
            i();
          case ":":
            if (":" === y && ":" === n()) return r.push(m(e)), r;
          default:
            t || r.push((t = new W(""))), (t.value += y), i();
        }
      }
      return r;
    }
    function c() {
      i();
      for (var e = "", t = !1; y && "]" !== y && "\n" !== y; ) {
        if ("\\" !== y) t = !1;
        else if ((i(), "v" === y && (t = !0), !y)) break;
        (e += y), i();
      }
      return (
        "]" === y && i(),
        ne.test(e)
          ? new Z("color", e)
          : !t && / v$/.test(e)
          ? o("dropdown", e.slice(0, e.length - 2))
          : new Z("string", e)
      );
    }
    function l(e) {
      var t = a(e);
      if ((y && "\n" === y && ((b = !0), i()), 0 !== t.length)) {
        if (1 === t.length) {
          var n = t[0];
          if (n.isBlock && (n.isReporter || n.isBoolean || n.isRing)) return n;
        }
        return r("stack", t);
      }
    }
    function h() {
      if ((i(), " " === y && (i(), "v" === y && ")" === n()))) return i(), i(), new Z("number-dropdown", "");
      var e = a(")");
      if ((y && ")" === y && i(), 0 === e.length)) return new Z("number", "");
      if (1 === e.length && e[0].isLabel) {
        var t = e[0].value;
        if (/^[0-9e.-]*$/.test(t)) return new Z("number", t);
        if (ne.test(t)) return new Z("color", t);
      }
      for (var s = 0; s < e.length && e[s].isLabel; s++);
      if (s === e.length) {
        var c = e[s - 1];
        if (1 < s && "v" === c.value)
          return (
            e.pop(),
            o(
              "number-dropdown",
              (t = e
                .map(function (e) {
                  return e.value;
                })
                .join(" "))
            )
          );
      }
      var l = r("reporter", e);
      if (l.info && "ring" === l.info.shape) {
        var h = l.children[0];
        h && h.isInput && "number" === h.shape && "" === h.value
          ? (l.children[0] = new Z("reporter"))
          : ((h && h.isScript && h.isEmpty) || (h && h.isBlock && !h.children.length)) &&
            (l.children[0] = new Z("stack"));
      }
      return l;
    }
    function p() {
      i();
      var e = a(">");
      return y && ">" === y && i(), 0 === e.length ? new Z("boolean") : r("boolean", e);
    }
    function f() {
      i(), (b = !1);
      var e = g(function () {
          for (; y && "}" !== y; ) {
            var e = l("}");
            if (e) return e;
          }
        }),
        t = [];
      return (
        e.forEach(function (e) {
          t = t.concat(e.blocks);
        }),
        "}" === y && i(),
        b
          ? new $(t)
          : ((function (e, t) {
              if (!e) throw "Assertion failed! " + (t || "");
            })(1 >= t.length),
            t.length ? t[0] : r("stack", []))
      );
    }
    function d() {
      var e = y;
      return i(), "▸" === e ? new X("addInput") : "◂" === e ? new X("delInput") : void 0;
    }
    function m(e) {
      i(), i();
      for (var t = [], s = ""; y && "\n" !== y && y !== e; ) {
        if (" " === y) s && (t.push(s), (s = ""));
        else {
          if ("/" === y && "/" === n()) break;
          s += y;
        }
        i();
      }
      return s && t.push(s), t;
    }
    function v() {
      var e;
      ("+" === y || "-" === y) && ((e = y), i());
      var t = l();
      if ("/" === y && "/" === n()) {
        var s = (function (e) {
          i(), i();
          for (var t = ""; y && "\n" !== y && y !== e; ) (t += y), i();
          return y && "\n" === y && i(), new Q(t, !0);
        })();
        if (((s.hasBlock = t && t.children.length), !s.hasBlock)) return s;
        t.comment = s;
      }
      return t && (t.diff = e), t;
    }
    var b,
      y = e[0],
      w = 0,
      k = [];
    return (
      t.map(function (e) {
        k = k.concat(e.define);
      }),
      function () {
        if (y) return v() || "NL";
      }
    );
  }
  function g(e) {
    function t() {
      r = e();
    }
    function i() {
      var e = r;
      if ((t(), e.hasScript))
        for (;;) {
          var i = s();
          if ((e.children.push(new $(i)), !r || !r.isElse)) {
            r && r.isEnd && t();
            break;
          }
          for (var n = 0; n < r.children.length; n++) e.children.push(r.children[n]);
          t();
        }
      return e;
    }
    function s() {
      for (var e = []; r; )
        if ("NL" !== r) {
          if (!r.isCommand) return e;
          var n = i(),
            s = "+" === n.diff;
          if ((s && (n.diff = null), s)) {
            var o = e[e.length - 1],
              a = [];
            if (o && o.isGlow) {
              e.pop();
              a = o.child.isScript ? o.child.blocks : [o.child];
            }
            a.push(n), e.push(new J(new $(a)));
          } else e.push(n);
        } else t();
      return e;
    }
    var r = e();
    return (function () {
      for (; "NL" === r; ) t();
      for (var e = []; r; ) {
        for (var s = []; r && "NL" !== r; ) {
          var o = i(),
            a = "+" === o.diff;
          if (
            (a && (o.diff = null),
            (o.isElse || o.isEnd) && (o = new q(n({}, o.info, { shape: "stack" }), o.children)),
            a)
          ) {
            var c = s[s.length - 1],
              l = [];
            c && c.isGlow && (s.pop(), (l = c.child.isScript ? c.child.blocks : [c.child])),
              l.push(o),
              s.push(new J(new $(l)));
          } else if (o.isHat) s.length && e.push(new $(s)), (s = [o]);
          else {
            if (o.isFinal) {
              s.push(o);
              break;
            }
            if (!o.isCommand) {
              s.length && e.push(new $(s)), e.push(new $([o])), (s = []);
              break;
            }
            s.push(o);
          }
        }
        for (s.length && e.push(new $(s)); "NL" === r; ) t();
      }
      return e;
    })();
  }
  function m(e, t) {
    e.isScript
      ? (e.blocks = e.blocks.map(function (e) {
          return m(e, t), t(e) || e;
        }))
      : e.isBlock
      ? (e.children = e.children.map(function (e) {
          return m(e, t), t(e) || e;
        }))
      : e.isGlow && m(e.child, t);
  }
  function v(e, t) {
    return n({}, e, t);
  }
  var b = [
      "motion",
      "looks",
      "sound",
      "pen",
      "variables",
      "list",
      "events",
      "control",
      "sensing",
      "operators",
      "custom",
      "custom-arg",
      "extension",
      "grey",
      "obsolete",
      "music",
      "video",
      "tts",
      "translate",
      "wedo",
      "ev3",
      "microbit",
      "makeymakey",
    ],
    y = ["hat", "cap", "stack", "boolean", "reporter", "ring", "cat"],
    w = /(%[a-zA-Z0-9](?:\.[a-zA-Z0-9]+)?)/,
    k = new RegExp(w.source, "g"),
    A = /(@[a-zA-Z]+)/,
    O = new RegExp([w.source, "|", A.source, "| +"].join(""), "g"),
    S = /^#(?:[0-9a-fA-F]{3}){1,2}?$/,
    L = {},
    E = {},
    R = [
      {
        id: "MOTION_MOVESTEPS",
        selector: "forward:",
        spec: "move %1 steps",
        inputs: ["%n"],
        shape: "stack",
        category: "motion",
      },
      {
        id: "MOTION_TURNRIGHT",
        selector: "turnRight:",
        spec: "turn @turnRight %1 degrees",
        inputs: ["%n"],
        shape: "stack",
        category: "motion",
      },
      {
        id: "MOTION_TURNLEFT",
        selector: "turnLeft:",
        spec: "turn @turnLeft %1 degrees",
        inputs: ["%n"],
        shape: "stack",
        category: "motion",
      },
      {
        id: "MOTION_POINTINDIRECTION",
        selector: "heading:",
        spec: "point in direction %1",
        inputs: ["%d.direction"],
        shape: "stack",
        category: "motion",
      },
      {
        id: "MOTION_POINTTOWARDS",
        selector: "pointTowards:",
        spec: "point towards %1",
        inputs: ["%m.spriteOrMouse"],
        shape: "stack",
        category: "motion",
      },
      {
        id: "MOTION_GOTOXY",
        selector: "gotoX:y:",
        spec: "go to x:%1 y:%2",
        inputs: ["%n", "%n"],
        shape: "stack",
        category: "motion",
      },
      {
        id: "MOTION_GOTO",
        selector: "gotoSpriteOrMouse:",
        spec: "go to %1",
        inputs: ["%m.location"],
        shape: "stack",
        category: "motion",
      },
      {
        id: "MOTION_GLIDESECSTOXY",
        selector: "glideSecs:toX:y:elapsed:from:",
        spec: "glide %1 secs to x:%2 y:%3",
        inputs: ["%n", "%n", "%n"],
        shape: "stack",
        category: "motion",
      },
      {
        id: "MOTION_GLIDETO",
        spec: "glide %1 secs to %2",
        inputs: ["%n", "%m.location"],
        shape: "stack",
        category: "motion",
      },
      {
        id: "MOTION_CHANGEXBY",
        selector: "changeXposBy:",
        spec: "change x by %1",
        inputs: ["%n"],
        shape: "stack",
        category: "motion",
      },
      { id: "MOTION_SETX", selector: "xpos:", spec: "set x to %1", inputs: ["%n"], shape: "stack", category: "motion" },
      {
        id: "MOTION_CHANGEYBY",
        selector: "changeYposBy:",
        spec: "change y by %1",
        inputs: ["%n"],
        shape: "stack",
        category: "motion",
      },
      { id: "MOTION_SETY", selector: "ypos:", spec: "set y to %1", inputs: ["%n"], shape: "stack", category: "motion" },
      {
        id: "MOTION_SETROTATIONSTYLE",
        selector: "setRotationStyle",
        spec: "set rotation style %1",
        inputs: ["%m.rotationStyle"],
        shape: "stack",
        category: "motion",
      },
      {
        id: "LOOKS_SAYFORSECS",
        selector: "say:duration:elapsed:from:",
        spec: "say %1 for %2 seconds",
        inputs: ["%s", "%n"],
        shape: "stack",
        category: "looks",
      },
      { id: "LOOKS_SAY", selector: "say:", spec: "say %1", inputs: ["%s"], shape: "stack", category: "looks" },
      {
        id: "LOOKS_THINKFORSECS",
        selector: "think:duration:elapsed:from:",
        spec: "think %1 for %2 seconds",
        inputs: ["%s", "%n"],
        shape: "stack",
        category: "looks",
      },
      { id: "LOOKS_THINK", selector: "think:", spec: "think %1", inputs: ["%s"], shape: "stack", category: "looks" },
      { id: "LOOKS_SHOW", selector: "show", spec: "show", inputs: [], shape: "stack", category: "looks" },
      { id: "LOOKS_HIDE", selector: "hide", spec: "hide", inputs: [], shape: "stack", category: "looks" },
      {
        id: "LOOKS_SWITCHCOSTUMETO",
        selector: "lookLike:",
        spec: "switch costume to %1",
        inputs: ["%m.costume"],
        shape: "stack",
        category: "looks",
      },
      {
        id: "LOOKS_NEXTCOSTUME",
        selector: "nextCostume",
        spec: "next costume",
        inputs: [],
        shape: "stack",
        category: "looks",
      },
      {
        id: "LOOKS_NEXTBACKDROP_BLOCK",
        selector: "nextScene",
        spec: "next backdrop",
        inputs: [],
        shape: "stack",
        category: "looks",
      },
      {
        id: "LOOKS_SWITCHBACKDROPTO",
        selector: "startScene",
        spec: "switch backdrop to %1",
        inputs: ["%m.backdrop"],
        shape: "stack",
        category: "looks",
      },
      {
        id: "LOOKS_SWITCHBACKDROPTOANDWAIT",
        selector: "startSceneAndWait",
        spec: "switch backdrop to %1 and wait",
        inputs: ["%m.backdrop"],
        shape: "stack",
        category: "looks",
      },
      {
        id: "LOOKS_CHANGEEFFECTBY",
        selector: "changeGraphicEffect:by:",
        spec: "change %1 effect by %2",
        inputs: ["%m.effect", "%n"],
        shape: "stack",
        category: "looks",
      },
      {
        id: "LOOKS_SETEFFECTTO",
        selector: "setGraphicEffect:to:",
        spec: "set %1 effect to %2",
        inputs: ["%m.effect", "%n"],
        shape: "stack",
        category: "looks",
      },
      {
        id: "LOOKS_CLEARGRAPHICEFFECTS",
        selector: "filterReset",
        spec: "clear graphic effects",
        inputs: [],
        shape: "stack",
        category: "looks",
      },
      {
        id: "LOOKS_CHANGESIZEBY",
        selector: "changeSizeBy:",
        spec: "change size by %1",
        inputs: ["%n"],
        shape: "stack",
        category: "looks",
      },
      {
        id: "LOOKS_SETSIZETO",
        selector: "setSizeTo:",
        spec: "set size to %1%",
        inputs: ["%n"],
        shape: "stack",
        category: "looks",
      },
      { selector: "comeToFront", spec: "go to front", inputs: [], shape: "stack", category: "looks" },
      { id: "LOOKS_GOTOFRONTBACK", spec: "go to %1 layer", inputs: ["%m"], shape: "stack", category: "looks" },
      { selector: "goBackByLayers:", spec: "go back %1 layers", inputs: ["%n"], shape: "stack", category: "looks" },
      {
        id: "LOOKS_GOFORWARDBACKWARDLAYERS",
        spec: "go %1 %2 layers",
        inputs: ["%m", "%n"],
        shape: "stack",
        category: "looks",
      },
      {
        id: "SOUND_PLAY",
        selector: "playSound:",
        spec: "start sound %1",
        inputs: ["%m.sound"],
        shape: "stack",
        category: "sound",
      },
      {
        id: "SOUND_CHANGEEFFECTBY",
        spec: "change %1 effect by %2",
        inputs: ["%m", "%n"],
        shape: "stack",
        category: "sound",
      },
      { id: "SOUND_SETEFFECTO", spec: "set %1 effect to %2", inputs: ["%m", "%n"], shape: "stack", category: "sound" },
      { id: "SOUND_CLEAREFFECTS", spec: "clear sound effects", inputs: [], shape: "stack", category: "sound" },
      {
        id: "SOUND_PLAYUNTILDONE",
        selector: "doPlaySoundAndWait",
        spec: "play sound %1 until done",
        inputs: ["%m.sound"],
        shape: "stack",
        category: "sound",
      },
      {
        id: "SOUND_STOPALLSOUNDS",
        selector: "stopAllSounds",
        spec: "stop all sounds",
        inputs: [],
        shape: "stack",
        category: "sound",
      },
      {
        id: "music.playDrumForBeats",
        selector: "playDrum",
        spec: "play drum %1 for %2 beats",
        inputs: ["%d.drum", "%n"],
        shape: "stack",
        category: "music",
      },
      {
        id: "music.restForBeats",
        selector: "rest:elapsed:from:",
        spec: "rest for %1 beats",
        inputs: ["%n"],
        shape: "stack",
        category: "music",
      },
      {
        id: "music.playNoteForBeats",
        selector: "noteOn:duration:elapsed:from:",
        spec: "play note %1 for %2 beats",
        inputs: ["%d.note", "%n"],
        shape: "stack",
        category: "music",
      },
      {
        id: "music.setInstrument",
        selector: "instrument:",
        spec: "set instrument to %1",
        inputs: ["%d.instrument"],
        shape: "stack",
        category: "music",
      },
      {
        id: "SOUND_CHANGEVOLUMEBY",
        selector: "changeVolumeBy:",
        spec: "change volume by %1",
        inputs: ["%n"],
        shape: "stack",
        category: "sound",
      },
      {
        id: "SOUND_SETVOLUMETO",
        selector: "setVolumeTo:",
        spec: "set volume to %1%",
        inputs: ["%n"],
        shape: "stack",
        category: "sound",
      },
      {
        id: "music.changeTempo",
        selector: "changeTempoBy:",
        spec: "change tempo by %1",
        inputs: ["%n"],
        shape: "stack",
        category: "music",
      },
      { selector: "setTempoTo:", spec: "set tempo to %1 bpm", inputs: ["%n"], shape: "stack", category: "sound" },
      {
        id: "music.setTempo",
        selector: "setTempoTo:",
        spec: "set tempo to %1",
        inputs: ["%n"],
        shape: "stack",
        category: "music",
      },
      { id: "pen.clear", selector: "clearPenTrails", spec: "erase all", inputs: [], shape: "stack", category: "pen" },
      { id: "pen.stamp", selector: "stampCostume", spec: "stamp", inputs: [], shape: "stack", category: "pen" },
      { id: "pen.penDown", selector: "putPenDown", spec: "pen down", inputs: [], shape: "stack", category: "pen" },
      { id: "pen.penUp", selector: "putPenUp", spec: "pen up", inputs: [], shape: "stack", category: "pen" },
      {
        id: "pen.setColor",
        selector: "penColor:",
        spec: "set pen color to %1",
        inputs: ["%c"],
        shape: "stack",
        category: "pen",
      },
      {
        id: "pen.changeHue",
        selector: "changePenHueBy:",
        spec: "change pen color by %1",
        inputs: ["%n"],
        shape: "stack",
        category: "pen",
      },
      {
        id: "pen.setColorParam",
        spec: "set pen %1 to %2",
        inputs: ["%m.color", "%c"],
        shape: "stack",
        category: "pen",
      },
      {
        id: "pen.changeColorParam",
        spec: "change pen %1 by %2",
        inputs: ["%m.color", "%n"],
        shape: "stack",
        category: "pen",
      },
      {
        id: "pen.setHue",
        selector: "setPenHueTo:",
        spec: "set pen color to %1",
        inputs: ["%n"],
        shape: "stack",
        category: "pen",
      },
      {
        id: "pen.changeShade",
        selector: "changePenShadeBy:",
        spec: "change pen shade by %1",
        inputs: ["%n"],
        shape: "stack",
        category: "pen",
      },
      {
        id: "pen.setShade",
        selector: "setPenShadeTo:",
        spec: "set pen shade to %1",
        inputs: ["%n"],
        shape: "stack",
        category: "pen",
      },
      {
        id: "pen.changeSize",
        selector: "changePenSizeBy:",
        spec: "change pen size by %1",
        inputs: ["%n"],
        shape: "stack",
        category: "pen",
      },
      {
        id: "pen.setSize",
        selector: "penSize:",
        spec: "set pen size to %1",
        inputs: ["%n"],
        shape: "stack",
        category: "pen",
      },
      {
        id: "EVENT_WHENFLAGCLICKED",
        selector: "whenGreenFlag",
        spec: "when @greenFlag clicked",
        inputs: [],
        shape: "hat",
        category: "events",
      },
      {
        id: "EVENT_WHENKEYPRESSED",
        selector: "whenKeyPressed",
        spec: "when %1 key pressed",
        inputs: ["%m.key"],
        shape: "hat",
        category: "events",
      },
      {
        id: "EVENT_WHENTHISSPRITECLICKED",
        selector: "whenClicked",
        spec: "when this sprite clicked",
        inputs: [],
        shape: "hat",
        category: "events",
      },
      { id: "EVENT_WHENSTAGECLICKED", spec: "when stage clicked", inputs: [], shape: "hat", category: "events" },
      {
        id: "EVENT_WHENBACKDROPSWITCHESTO",
        selector: "whenSceneStarts",
        spec: "when backdrop switches to %1",
        inputs: ["%m.backdrop"],
        shape: "hat",
        category: "events",
      },
      {
        id: "EVENT_WHENGREATERTHAN",
        selector: "whenSensorGreaterThan",
        spec: "when %1 > %2",
        inputs: ["%m.triggerSensor", "%n"],
        shape: "hat",
        category: "events",
      },
      {
        id: "EVENT_WHENBROADCASTRECEIVED",
        selector: "whenIReceive",
        spec: "when I receive %1",
        inputs: ["%m.broadcast"],
        shape: "hat",
        category: "events",
      },
      {
        id: "EVENT_BROADCAST",
        selector: "broadcast:",
        spec: "broadcast %1",
        inputs: ["%m.broadcast"],
        shape: "stack",
        category: "events",
      },
      {
        id: "EVENT_BROADCASTANDWAIT",
        selector: "doBroadcastAndWait",
        spec: "broadcast %1 and wait",
        inputs: ["%m.broadcast"],
        shape: "stack",
        category: "events",
      },
      {
        id: "CONTROL_WAIT",
        selector: "wait:elapsed:from:",
        spec: "wait %1 seconds",
        inputs: ["%n"],
        shape: "stack",
        category: "control",
      },
      {
        id: "CONTROL_REPEAT",
        selector: "doRepeat",
        spec: "repeat %1",
        inputs: ["%n"],
        shape: "c-block",
        category: "control",
        hasLoopArrow: !0,
      },
      {
        id: "CONTROL_FOREVER",
        selector: "doForever",
        spec: "forever",
        inputs: [],
        shape: "c-block cap",
        category: "control",
        hasLoopArrow: !0,
      },
      { id: "CONTROL_IF", selector: "doIf", spec: "if %1 then", inputs: ["%b"], shape: "c-block", category: "control" },
      {
        id: "CONTROL_WAITUNTIL",
        selector: "doWaitUntil",
        spec: "wait until %1",
        inputs: ["%b"],
        shape: "stack",
        category: "control",
      },
      {
        id: "CONTROL_REPEATUNTIL",
        selector: "doUntil",
        spec: "repeat until %1",
        inputs: ["%b"],
        shape: "c-block",
        category: "control",
        hasLoopArrow: !0,
      },
      {
        id: "CONTROL_STOP",
        selector: "stopScripts",
        spec: "stop %1",
        inputs: ["%m.stop"],
        shape: "cap",
        category: "control",
      },
      {
        id: "CONTROL_STARTASCLONE",
        selector: "whenCloned",
        spec: "when I start as a clone",
        inputs: [],
        shape: "hat",
        category: "control",
      },
      {
        id: "CONTROL_CREATECLONEOF",
        selector: "createCloneOf",
        spec: "create clone of %1",
        inputs: ["%m.spriteOnly"],
        shape: "stack",
        category: "control",
      },
      {
        id: "CONTROL_DELETETHISCLONE",
        selector: "deleteClone",
        spec: "delete this clone",
        inputs: [],
        shape: "cap",
        category: "control",
      },
      {
        id: "SENSING_ASKANDWAIT",
        selector: "doAsk",
        spec: "ask %1 and wait",
        inputs: ["%s"],
        shape: "stack",
        category: "sensing",
      },
      {
        id: "videoSensing.videoToggle",
        selector: "setVideoState",
        spec: "turn video %1",
        inputs: ["%m.videoState"],
        shape: "stack",
        category: "video",
      },
      {
        id: "videoSensing.setVideoTransparency",
        selector: "setVideoTransparency",
        spec: "set video transparency to %1%",
        inputs: ["%n"],
        shape: "stack",
        category: "video",
      },
      {
        id: "videoSensing.whenMotionGreaterThan",
        spec: "when video motion > %1",
        inputs: ["%n"],
        shape: "hat",
        category: "video",
      },
      {
        id: "SENSING_RESETTIMER",
        selector: "timerReset",
        spec: "reset timer",
        inputs: [],
        shape: "stack",
        category: "sensing",
      },
      {
        id: "DATA_SETVARIABLETO",
        selector: "setVar:to:",
        spec: "set %1 to %2",
        inputs: ["%m.var", "%s"],
        shape: "stack",
        category: "variables",
      },
      {
        id: "DATA_CHANGEVARIABLEBY",
        selector: "changeVar:by:",
        spec: "change %1 by %2",
        inputs: ["%m.var", "%n"],
        shape: "stack",
        category: "variables",
      },
      {
        id: "DATA_SHOWVARIABLE",
        selector: "showVariable:",
        spec: "show variable %1",
        inputs: ["%m.var"],
        shape: "stack",
        category: "variables",
      },
      {
        id: "DATA_HIDEVARIABLE",
        selector: "hideVariable:",
        spec: "hide variable %1",
        inputs: ["%m.var"],
        shape: "stack",
        category: "variables",
      },
      {
        id: "DATA_ADDTOLIST",
        selector: "append:toList:",
        spec: "add %1 to %2",
        inputs: ["%s", "%m.list"],
        shape: "stack",
        category: "list",
      },
      {
        id: "DATA_DELETEOFLIST",
        selector: "deleteLine:ofList:",
        spec: "delete %1 of %2",
        inputs: ["%d.listDeleteItem", "%m.list"],
        shape: "stack",
        category: "list",
      },
      { id: "DATA_DELETEALLOFLIST", spec: "delete all of %1", inputs: ["%m.list"], shape: "stack", category: "list" },
      {
        id: "MOTION_IFONEDGEBOUNCE",
        selector: "bounceOffEdge",
        spec: "if on edge, bounce",
        inputs: [],
        shape: "stack",
        category: "motion",
      },
      {
        id: "DATA_INSERTATLIST",
        selector: "insert:at:ofList:",
        spec: "insert %1 at %2 of %3",
        inputs: ["%s", "%d.listItem", "%m.list"],
        shape: "stack",
        category: "list",
      },
      {
        id: "DATA_REPLACEITEMOFLIST",
        selector: "setLine:ofList:to:",
        spec: "replace item %1 of %2 with %3",
        inputs: ["%d.listItem", "%m.list", "%s"],
        shape: "stack",
        category: "list",
      },
      {
        id: "DATA_SHOWLIST",
        selector: "showList:",
        spec: "show list %1",
        inputs: ["%m.list"],
        shape: "stack",
        category: "list",
      },
      {
        id: "DATA_HIDELIST",
        selector: "hideList:",
        spec: "hide list %1",
        inputs: ["%m.list"],
        shape: "stack",
        category: "list",
      },
      {
        id: "SENSING_OF_XPOSITION",
        selector: "xpos",
        spec: "x position",
        inputs: [],
        shape: "reporter",
        category: "motion",
      },
      {
        id: "SENSING_OF_YPOSITION",
        selector: "ypos",
        spec: "y position",
        inputs: [],
        shape: "reporter",
        category: "motion",
      },
      {
        id: "SENSING_OF_DIRECTION",
        selector: "heading",
        spec: "direction",
        inputs: [],
        shape: "reporter",
        category: "motion",
      },
      {
        id: "SENSING_OF_COSTUMENUMBER",
        selector: "costumeIndex",
        spec: "costume #",
        inputs: [],
        shape: "reporter",
        category: "looks",
      },
      {
        id: "LOOKS_COSTUMENUMBERNAME",
        selector: "LOOKS_COSTUMENUMBERNAME",
        spec: "costume %1",
        inputs: ["%m"],
        shape: "reporter",
        category: "looks",
      },
      { id: "SENSING_OF_SIZE", selector: "scale", spec: "size", inputs: [], shape: "reporter", category: "looks" },
      {
        id: "SENSING_OF_BACKDROPNAME",
        selector: "sceneName",
        spec: "backdrop name",
        inputs: [],
        shape: "reporter",
        category: "looks",
      },
      { id: "LOOKS_BACKDROPNUMBERNAME", spec: "backdrop %1", inputs: ["%m"], shape: "reporter", category: "looks" },
      {
        id: "SENSING_OF_BACKDROPNUMBER",
        selector: "backgroundIndex",
        spec: "backdrop #",
        inputs: [],
        shape: "reporter",
        category: "looks",
      },
      { id: "SOUND_VOLUME", selector: "volume", spec: "volume", inputs: [], shape: "reporter", category: "sound" },
      { id: "music.getTempo", selector: "tempo", spec: "tempo", inputs: [], shape: "reporter", category: "music" },
      {
        id: "SENSING_TOUCHINGOBJECT",
        selector: "touching:",
        spec: "touching %1?",
        inputs: ["%m.touching"],
        shape: "boolean",
        category: "sensing",
      },
      {
        id: "SENSING_TOUCHINGCOLOR",
        selector: "touchingColor:",
        spec: "touching color %1?",
        inputs: ["%c"],
        shape: "boolean",
        category: "sensing",
      },
      {
        id: "SENSING_COLORISTOUCHINGCOLOR",
        selector: "color:sees:",
        spec: "color %1 is touching %2?",
        inputs: ["%c", "%c"],
        shape: "boolean",
        category: "sensing",
      },
      {
        id: "SENSING_DISTANCETO",
        selector: "distanceTo:",
        spec: "distance to %1",
        inputs: ["%m.spriteOrMouse"],
        shape: "reporter",
        category: "sensing",
      },
      { id: "SENSING_ANSWER", selector: "answer", spec: "answer", inputs: [], shape: "reporter", category: "sensing" },
      {
        id: "SENSING_KEYPRESSED",
        selector: "keyPressed:",
        spec: "key %1 pressed?",
        inputs: ["%m.key"],
        shape: "boolean",
        category: "sensing",
      },
      {
        id: "SENSING_MOUSEDOWN",
        selector: "mousePressed",
        spec: "mouse down?",
        inputs: [],
        shape: "boolean",
        category: "sensing",
      },
      { id: "SENSING_MOUSEX", selector: "mouseX", spec: "mouse x", inputs: [], shape: "reporter", category: "sensing" },
      { id: "SENSING_MOUSEY", selector: "mouseY", spec: "mouse y", inputs: [], shape: "reporter", category: "sensing" },
      { id: "SENSING_SETDRAGMODE", spec: "set drag mode %1", inputs: ["%m"], shape: "stack", category: "sensing" },
      {
        id: "SENSING_LOUDNESS",
        selector: "soundLevel",
        spec: "loudness",
        inputs: [],
        shape: "reporter",
        category: "sensing",
      },
      {
        id: "videoSensing.videoOn",
        selector: "senseVideoMotion",
        spec: "video %1 on %2",
        inputs: ["%m.videoMotionType", "%m.stageOrThis"],
        shape: "reporter",
        category: "video",
      },
      { id: "SENSING_TIMER", selector: "timer", spec: "timer", inputs: [], shape: "reporter", category: "sensing" },
      {
        id: "SENSING_OF",
        selector: "getAttribute:of:",
        spec: "%1 of %2",
        inputs: ["%m.attribute", "%m.spriteOrStage"],
        shape: "reporter",
        category: "sensing",
      },
      {
        id: "SENSING_CURRENT",
        selector: "timeAndDate",
        spec: "current %1",
        inputs: ["%m.timeAndDate"],
        shape: "reporter",
        category: "sensing",
      },
      {
        id: "SENSING_DAYSSINCE2000",
        selector: "timestamp",
        spec: "days since 2000",
        inputs: [],
        shape: "reporter",
        category: "sensing",
      },
      {
        id: "SENSING_USERNAME",
        selector: "getUserName",
        spec: "username",
        inputs: [],
        shape: "reporter",
        category: "sensing",
      },
      {
        id: "OPERATORS_ADD",
        selector: "+",
        spec: "%1 + %2",
        inputs: ["%n", "%n"],
        shape: "reporter",
        category: "operators",
      },
      {
        id: "OPERATORS_SUBTRACT",
        selector: "-",
        spec: "%1 - %2",
        inputs: ["%n", "%n"],
        shape: "reporter",
        category: "operators",
      },
      {
        id: "OPERATORS_MULTIPLY",
        selector: "*",
        spec: "%1 * %2",
        inputs: ["%n", "%n"],
        shape: "reporter",
        category: "operators",
      },
      {
        id: "OPERATORS_DIVIDE",
        selector: "/",
        spec: "%1 / %2",
        inputs: ["%n", "%n"],
        shape: "reporter",
        category: "operators",
      },
      {
        id: "OPERATORS_RANDOM",
        selector: "randomFrom:to:",
        spec: "pick random %1 to %2",
        inputs: ["%n", "%n"],
        shape: "reporter",
        category: "operators",
      },
      {
        id: "OPERATORS_LT",
        selector: "<",
        spec: "%1 < %2",
        inputs: ["%s", "%s"],
        shape: "boolean",
        category: "operators",
      },
      {
        id: "OPERATORS_EQUALS",
        selector: "=",
        spec: "%1 = %2",
        inputs: ["%s", "%s"],
        shape: "boolean",
        category: "operators",
      },
      {
        id: "OPERATORS_GT",
        selector: ">",
        spec: "%1 > %2",
        inputs: ["%s", "%s"],
        shape: "boolean",
        category: "operators",
      },
      {
        id: "OPERATORS_AND",
        selector: "&",
        spec: "%1 and %2",
        inputs: ["%b", "%b"],
        shape: "boolean",
        category: "operators",
      },
      {
        id: "OPERATORS_OR",
        selector: "|",
        spec: "%1 or %2",
        inputs: ["%b", "%b"],
        shape: "boolean",
        category: "operators",
      },
      { id: "OPERATORS_NOT", selector: "not", spec: "not %1", inputs: ["%b"], shape: "boolean", category: "operators" },
      {
        id: "OPERATORS_JOIN",
        selector: "concatenate:with:",
        spec: "join %1 %2",
        inputs: ["%s", "%s"],
        shape: "reporter",
        category: "operators",
      },
      {
        id: "OPERATORS_LETTEROF",
        selector: "letter:of:",
        spec: "letter %1 of %2",
        inputs: ["%n", "%s"],
        shape: "reporter",
        category: "operators",
      },
      {
        id: "OPERATORS_LENGTH",
        selector: "stringLength:",
        spec: "length of %1",
        inputs: ["%s"],
        shape: "reporter",
        category: "operators",
      },
      {
        id: "OPERATORS_MOD",
        selector: "%",
        spec: "%1 mod %2",
        inputs: ["%n", "%n"],
        shape: "reporter",
        category: "operators",
      },
      {
        id: "OPERATORS_ROUND",
        selector: "rounded",
        spec: "round %1",
        inputs: ["%n"],
        shape: "reporter",
        category: "operators",
      },
      {
        id: "OPERATORS_MATHOP",
        selector: "computeFunction:of:",
        spec: "%1 of %2",
        inputs: ["%m.mathOp", "%n"],
        shape: "reporter",
        category: "operators",
      },
      {
        id: "OPERATORS_CONTAINS",
        spec: "%1 contains %2?",
        inputs: ["%s", "%s"],
        shape: "boolean",
        category: "operators",
      },
      {
        id: "DATA_ITEMOFLIST",
        selector: "getLine:ofList:",
        spec: "item %1 of %2",
        inputs: ["%d.listItem", "%m.list"],
        shape: "reporter",
        category: "list",
      },
      {
        id: "DATA_ITEMNUMOFLIST",
        spec: "item # of %1 in %2",
        inputs: ["%s", "%m.list"],
        shape: "reporter",
        category: "list",
      },
      {
        id: "DATA_LENGTHOFLIST",
        selector: "lineCountOfList:",
        spec: "length of %1",
        inputs: ["%m.list"],
        shape: "reporter",
        category: "list",
      },
      {
        id: "DATA_LISTCONTAINSITEM",
        selector: "list:contains:",
        spec: "%1 contains %2?",
        inputs: ["%m.list", "%s"],
        shape: "boolean",
        category: "list",
      },
      { id: "wedo2.motorOn", spec: "turn %1 on", inputs: ["%m.motor"], shape: "stack", category: "extension" },
      { id: "wedo2.motorOff", spec: "turn %1 off", inputs: ["%m.motor"], shape: "stack", category: "extension" },
      {
        id: "wedo2.startMotorPower",
        spec: "set %1 power to %2",
        inputs: ["%m.motor", "%n"],
        shape: "stack",
        category: "extension",
      },
      {
        id: "wedo2.setMotorDirection",
        spec: "set %1 direction to %2",
        inputs: ["%m.motor2", "%m.motorDirection"],
        shape: "stack",
        category: "extension",
      },
      {
        id: "wedo2.whenDistance",
        spec: "when distance %1 %2",
        inputs: ["%m.lessMore", "%n"],
        shape: "hat",
        category: "extension",
      },
      { id: "wedo2.getDistance", spec: "distance", inputs: [], shape: "reporter", category: "extension" },
      {
        id: "wedo2.motorOnFor",
        spec: "turn %1 on for %2 seconds",
        inputs: ["%m.motor", "%n"],
        shape: "stack",
        category: "extension",
      },
      { id: "wedo2.setLightHue", spec: "set light color to %1", inputs: ["%n"], shape: "stack", category: "extension" },
      {
        id: "wedo2.playNoteFor",
        spec: "play note %1 for %2 seconds",
        inputs: ["%n", "%n"],
        shape: "stack",
        category: "extension",
      },
      { id: "wedo2.whenTilted", spec: "when tilted %1", inputs: ["%m.xxx"], shape: "hat", category: "extension" },
      { id: "wedo2.getTiltAngle", spec: "tilt angle %1", inputs: ["%m.xxx"], shape: "reporter", category: "extension" },
      { id: "CONTROL_ELSE", spec: "else", inputs: [], shape: "celse", category: "control" },
      { id: "scratchblocks:end", spec: "end", inputs: [], shape: "cend", category: "control" },
      { id: "scratchblocks:ellipsis", spec: ". . .", inputs: [], shape: "stack", category: "grey" },
      { id: "scratchblocks:addInput", spec: "%1 @addInput", inputs: ["%n"], shape: "ring", category: "grey" },
      { id: "SENSING_USERID", spec: "user id", inputs: [], shape: "reporter", category: "obsolete" },
      { selector: "doIf", spec: "if %1", inputs: ["%b"], shape: "c-block", category: "obsolete" },
      { selector: "doForeverIf", spec: "forever if %1", inputs: ["%b"], shape: "c-block cap", category: "obsolete" },
      { selector: "doReturn", spec: "stop script", inputs: [], shape: "cap", category: "obsolete" },
      { selector: "stopAll", spec: "stop all", inputs: [], shape: "cap", category: "obsolete" },
      {
        selector: "lookLike:",
        spec: "switch to costume %1",
        inputs: ["%m.costume"],
        shape: "stack",
        category: "obsolete",
      },
      { selector: "nextScene", spec: "next background", inputs: [], shape: "stack", category: "obsolete" },
      {
        selector: "startScene",
        spec: "switch to background %1",
        inputs: ["%m.backdrop"],
        shape: "stack",
        category: "obsolete",
      },
      { selector: "backgroundIndex", spec: "background #", inputs: [], shape: "reporter", category: "obsolete" },
      { id: "SENSING_LOUD", selector: "isLoud", spec: "loud?", inputs: [], shape: "boolean", category: "obsolete" },
    ].map(function (e) {
      var t = e.spec;
      if (!e.id) {
        if (!e.selector) throw new Error("Missing ID: " + e.spec);
        e.id = "sb2:" + e.selector;
      }
      if (!e.spec) throw new Error("Missing spec: " + e.id);
      var i = {
        id: e.id,
        spec: e.spec,
        parts: e.spec.split(O).filter(function (e) {
          return !!e;
        }),
        selector: e.selector || "sb3:" + e.id,
        inputs: e.inputs,
        shape: e.shape,
        category: e.category,
        hasLoopArrow: !!e.hasLoopArrow,
      };
      if (L[i.id]) throw new Error("Duplicate ID: " + i.id);
      return (L[i.id] = i), (E[t] = i);
    }),
    I = { "@greenFlag": "⚑", "@turnRight": "↻", "@turnLeft": "↺", "@addInput": "▸", "@delInput": "◂" },
    C = {},
    T = {
      aliases: {
        "turn left %1 degrees": "turn @turnLeft %1 degrees",
        "turn ccw %1 degrees": "turn @turnLeft %1 degrees",
        "turn right %1 degrees": "turn @turnRight %1 degrees",
        "turn cw %1 degrees": "turn @turnRight %1 degrees",
        "when gf clicked": "when @greenFlag clicked",
        "when flag clicked": "when @greenFlag clicked",
        "when green flag clicked": "when @greenFlag clicked",
      },
      renamedBlocks: {
        "say %1 for %2 secs": "LOOKS_SAYFORSECS",
        "think %1 for %2 secs": "LOOKS_THINKFORSECS",
        "play sound %1": "SOUND_PLAY",
        "wait %1 secs": "CONTROL_WAIT",
        clear: "pen.clear",
      },
      definePrefix: ["define"],
      defineSuffix: [],
      ignorelt: ["when distance"],
      math: [
        "abs",
        "floor",
        "ceiling",
        "sqrt",
        "sin",
        "cos",
        "tan",
        "asin",
        "acos",
        "atan",
        "ln",
        "log",
        "e ^",
        "10 ^",
      ],
      soundEffects: ["pitch", "pan left/right"],
      osis: ["other scripts in sprite", "other scripts in stage"],
      dropdowns: {},
      commands: {},
    };
  R.forEach(function (e) {
    T.commands[e.spec] = e.spec;
  }),
    c({ en: T }),
    h("OPERATORS_MATHOP", "SENSING_OF", function (e, t) {
      var i = e[0];
      if (i.isInput) {
        var n = i.value;
        return -1 < t.math.indexOf(n);
      }
    }),
    h("SOUND_CHANGEEFFECTBY", "LOOKS_CHANGEEFFECTBY", function (e, t) {
      for (var i, n = 0; n < e.length; n++)
        if ("dropdown" === (i = e[n]).shape) {
          var s,
            o = i.value,
            c = r(t.soundEffects);
          try {
            for (c.s(); !(s = c.n()).done; ) {
              if (a(s.value) === a(o)) return !0;
            }
          } catch (e) {
            c.e(e);
          } finally {
            c.f();
          }
        }
      return !1;
    }),
    h("SOUND_SETEFFECTO", "LOOKS_SETEFFECTTO", function (e, t) {
      for (var i, n = 0; n < e.length; n++)
        if ("dropdown" === (i = e[n]).shape) {
          var s,
            o = i.value,
            c = r(t.soundEffects);
          try {
            for (c.s(); !(s = c.n()).done; ) {
              if (a(s.value) === a(o)) return !0;
            }
          } catch (e) {
            c.e(e);
          } finally {
            c.f();
          }
        }
      return !1;
    }),
    h("DATA_LENGTHOFLIST", "OPERATORS_LENGTH", function (e) {
      var t = e[e.length - 1];
      return t.isInput ? "dropdown" === t.shape : void 0;
    }),
    h("DATA_LISTCONTAINSITEM", "OPERATORS_CONTAINS", function (e) {
      var t = e[0];
      return t.isInput ? "dropdown" === t.shape : void 0;
    }),
    h("pen.setColor", "pen.setHue", function (e) {
      var t = e[e.length - 1];
      return (t.isInput && t.isColor) || t.isBlock;
    }),
    l("CONTROL_STOP", function (e, t, i) {
      var s = t[t.length - 1];
      if (s.isInput) {
        var r = s.value;
        if (-1 < i.osis.indexOf(r)) return n({}, L.CONTROL_STOP, { shape: "stack" });
      }
    });
  var N = {
      loadLanguages: c,
      blockName: function (e) {
        for (var t, i = [], n = 0; n < e.children.length; n++) {
          if (!(t = e.children[n]).isLabel) return;
          i.push(t.value);
        }
        return i.join(" ");
      },
      allLanguages: C,
      lookupDropdown: function (e, t) {
        for (var i, n = 0; n < t.length; n++)
          if ((i = t[n]).nativeDropdowns.hasOwnProperty(e)) {
            return i.nativeDropdowns[e];
          }
      },
      hexColorPat: S,
      minifyHash: a,
      lookupHash: function (e, t, i, n) {
        for (var s, r = 0; r < n.length; r++)
          if ((s = n[r]).blocksByHash.hasOwnProperty(e)) {
            var o = s.blocksByHash[e];
            if ("reporter" === t.shape && "reporter" !== o.shape) continue;
            if ("boolean" === t.shape && "boolean" !== o.shape) continue;
            return o.specialCase && (o = o.specialCase(t, i, s) || o), { type: o, lang: s };
          }
      },
      applyOverrides: function (e, t) {
        for (var i, n = 0; n < t.length; n++)
          (i = t[n]),
            S.test(i)
              ? ((e.color = i), (e.category = ""), (e.categoryIsDefault = !1))
              : -1 < b.indexOf(i)
              ? ((e.category = i), (e.categoryIsDefault = !1))
              : -1 < y.indexOf(i)
              ? (e.shape = i)
              : "loop" === i
              ? (e.hasLoopArrow = !0)
              : ("+" === i || "-" === i) && (e.diff = i);
      },
      rtlLanguages: ["ar", "ckb", "fa", "he"],
      iconPat: A,
      hashSpec: o,
      parseSpec: function (e) {
        var t = e.split(O).filter(function (e) {
            return !!e;
          }),
          i = t.filter(function (e) {
            return w.test(e);
          });
        return { spec: e, parts: t, inputs: i, hash: o(e) };
      },
      parseInputNumber: function (e) {
        var t = /\%([0-9]+)/.exec(e);
        return t ? +t[1] : 0;
      },
      inputPat: w,
      unicodeIcons: I,
      english: T,
      blocksById: L,
    },
    M = N.blocksById,
    P = N.parseSpec,
    x = N.inputPat,
    D = N.parseInputNumber,
    B = N.iconPat,
    F = N.rtlLanguages,
    H = N.unicodeIcons,
    z = function (e, t) {
      (this.value = e), (this.cls = t || ""), (this.el = null), (this.height = 12), (this.metrics = null), (this.x = 0);
    };
  (z.prototype.isLabel = !0),
    (z.prototype.stringify = function () {
      return "<" === this.value || ">" === this.value ? this.value : this.value.replace(/([<>[\](){}])/g, "\\$1");
    });
  var G = function e(t) {
    (this.name = t), (this.isArrow = "loopArrow" === t), p(e.icons[t], "no info for icon " + t);
  };
  (G.prototype.isIcon = !0),
    (G.icons = { greenFlag: !0, turnLeft: !0, turnRight: !0, loopArrow: !0, addInput: !0, delInput: !0 }),
    (G.prototype.stringify = function () {
      return H["@" + this.name] || "";
    });
  var V = function (e, t, i) {
    (this.shape = e),
      (this.value = t),
      (this.menu = i || null),
      (this.isRound = "number" === e || "number-dropdown" === e),
      (this.isBoolean = "boolean" === e),
      (this.isStack = "stack" === e),
      (this.isInset = "boolean" === e || "stack" === e || "reporter" === e),
      (this.isColor = "color" === e),
      (this.hasArrow = "dropdown" === e || "number-dropdown" === e),
      (this.isDarker = "boolean" === e || "stack" === e || "dropdown" === e),
      (this.isSquare = "string" === e || "color" === e || "dropdown" === e),
      (this.hasLabel = !(this.isColor || this.isInset)),
      (this.label = this.hasLabel ? new z(t, "literal-" + this.shape) : null),
      (this.x = 0);
  };
  (V.prototype.isInput = !0),
    (V.prototype.stringify = function () {
      if (this.isColor) return p("#" === this.value[0]), "[" + this.value + "]";
      var e = (this.value ? "" + this.value : "").replace(/ v$/, " \\v").replace(/([\]\\])/g, "\\$1");
      return (
        this.hasArrow && (e += " v"),
        this.isRound ? "(" + e + ")" : this.isSquare ? "[" + e + "]" : this.isBoolean ? "<>" : this.isStack ? "{}" : e
      );
    }),
    (V.prototype.translate = function () {
      if (this.hasArrow) {
        var e = this.menu || this.value;
        (this.value = e), (this.label = new z(this.value, "literal-" + this.shape));
      }
    });
  var j = function (e, t, i) {
    p(e), (this.info = n({}, e)), (this.children = t), (this.comment = i || null), (this.diff = null);
    var s = this.info.shape;
    (this.isHat = "hat" === s || "cat" === s || "define-hat" === s),
      (this.hasPuzzle = "stack" === s || "hat" === s || "cat" === s),
      (this.isFinal = /cap/.test(s)),
      (this.isCommand = "stack" === s || "cap" === s || /block/.test(s)),
      (this.isOutline = "outline" === s),
      (this.isReporter = "reporter" === s),
      (this.isBoolean = "boolean" === s),
      (this.isRing = "ring" === s),
      (this.hasScript = /block/.test(s)),
      (this.isElse = "celse" === s),
      (this.isEnd = "cend" === s);
  };
  (j.prototype.isBlock = !0),
    (j.prototype.stringify = function (e) {
      var t = null,
        i = !1,
        n = this.children
          .map(function (e) {
            return (
              e.isIcon && (i = !0),
              t || e.isLabel || e.isIcon || (t = e),
              e.isScript
                ? "\n" +
                  (function (e) {
                    return e
                      .split("\n")
                      .map(function (e) {
                        return "  " + e;
                      })
                      .join("\n");
                  })(e.stringify()) +
                  "\n"
                : e.stringify().trim() + " "
            );
          })
          .join("")
          .trim(),
        s = this.info.language;
      if (i && s && this.info.selector) {
        var r = M[this.info.id],
          o = (r.spec, s.nativeAliases[r.spec]);
        if (o) return x.test(o) && t && (o = o.replace(x, t.stringify())), o;
      }
      var a = e || "";
      return (
        (!1 === this.info.categoryIsDefault ||
          ("custom-arg" === this.info.category && (this.isReporter || this.isBoolean)) ||
          ("custom" === this.info.category && "stack" === this.info.shape)) &&
          (a && (a += " "), (a += this.info.category)),
        a && (n += " :: " + a),
        this.hasScript
          ? n + "\nend"
          : "reporter" === this.info.shape
          ? "(" + n + ")"
          : "boolean" === this.info.shape
          ? "<" + n + ">"
          : n
      );
    }),
    (j.prototype.translate = function (e, i) {
      var n = this;
      if (!e) throw new Error("Missing language");
      var s = this.info.id;
      if (s) {
        if ("PROCEDURES_DEFINITION" === s) {
          var o = this.children.find(function (e) {
            return e.isOutline;
          });
          this.children = [];
          var a,
            c = r(e.definePrefix);
          try {
            for (c.s(); !(a = c.n()).done; ) {
              var l = a.value;
              this.children.push(new z(l));
            }
          } catch (e) {
            c.e(e);
          } finally {
            c.f();
          }
          this.children.push(o);
          var h,
            p = r(e.defineSuffix);
          try {
            for (p.s(); !(h = p.n()).done; ) {
              var u = h.value;
              this.children.push(new z(u));
            }
          } catch (e) {
            p.e(e);
          } finally {
            p.f();
          }
          return;
        }
        var f = M[s],
          d = this.info.language.commands[f.spec],
          g = e.commands[f.spec];
        if (g) {
          var m = P(g),
            v = this.children.filter(function (e) {
              return !e.isLabel && !e.isIcon;
            });
          i ||
            v.forEach(function (t) {
              t.translate(e);
            });
          var b = P(d)
              .parts.map(function (e) {
                return D(e);
              })
              .filter(function (e) {
                return !!e;
              }),
            y = 0,
            w = b.map(function (e) {
              return (y = t(y, e)), v[e - 1];
            }),
            k = v.slice(y);
          (this.children = m.parts
            .map(function (e) {
              if ((e = e.trim())) {
                var t = D(e);
                return t ? w[t - 1] : B.test(e) ? new G(e.slice(1)) : new z(e);
              }
            })
            .filter(function (e) {
              return !!e;
            })),
            k.forEach(function (t, i) {
              1 === i && "CONTROL_IF" === n.info.id && n.children.push(new z(e.commands.else)), n.children.push(t);
            }),
            (this.info.language = e),
            (this.info.isRTL = -1 < F.indexOf(e.code)),
            (this.info.categoryIsDefault = !0);
        }
      }
    });
  var _ = function (e, t) {
    (this.label = new z(e, "comment-label")), (this.width = null), (this.hasBlock = t);
  };
  (_.prototype.isComment = !0),
    (_.prototype.stringify = function () {
      return "// " + this.label.value;
    });
  var U = function (e) {
    p(e), (this.child = e), e.isBlock ? ((this.shape = e.info.shape), (this.info = e.info)) : (this.shape = "stack");
  };
  (U.prototype.isGlow = !0),
    (U.prototype.stringify = function () {
      return this.child.isBlock
        ? this.child.stringify("+")
        : this.child
            .stringify()
            .split("\n")
            .map(function (e) {
              return "+ " + e;
            })
            .join("\n");
    }),
    (U.prototype.translate = function (e) {
      this.child.translate(e);
    });
  var Y = function (e) {
    (this.blocks = e), (this.isEmpty = !e.length), (this.isFinal = !this.isEmpty && e[e.length - 1].isFinal);
  };
  (Y.prototype.isScript = !0),
    (Y.prototype.stringify = function () {
      return this.blocks
        .map(function (e) {
          var t = e.stringify();
          return e.comment && (t += " " + e.comment.stringify()), t;
        })
        .join("\n");
    }),
    (Y.prototype.translate = function (e) {
      this.blocks.forEach(function (t) {
        t.translate(e);
      });
    });
  var K = function (e) {
    this.scripts = e;
  };
  (K.prototype.stringify = function () {
    return this.scripts
      .map(function (e) {
        return e.stringify();
      })
      .join("\n\n");
  }),
    (K.prototype.translate = function (e) {
      this.scripts.forEach(function (t) {
        t.translate(e);
      });
    });
  var W = z,
    X = G,
    Z = V,
    q = j,
    Q = _,
    J = U,
    $ = Y,
    ee = K,
    te = N.allLanguages,
    ie = N.lookupDropdown,
    ne = N.hexColorPat,
    se = N.minifyHash,
    re = N.lookupHash,
    oe = N.hashSpec,
    ae = N.applyOverrides,
    ce = N.rtlLanguages,
    le = N.iconPat,
    he = N.blockName,
    pe = {
      "append:toList:": 1,
      "deleteLine:ofList:": 1,
      "insert:at:ofList:": 2,
      "setLine:ofList:to:": 1,
      "showList:": 0,
      "hideList:": 0,
    },
    ue = {
      allLanguages: N.allLanguages,
      loadLanguages: N.loadLanguages,
      parse: function (e, t) {
        if ((t = n({ inline: !1, languages: ["en"] }, t)).dialect)
          throw new Error("Option 'dialect' no longer supported");
        (e = (e = e.replace(/&lt;/g, "<")).replace(/&gt;/g, ">")), t.inline && (e = e.replace(/\n/g, " "));
        var i = g(
          d(
            e,
            t.languages.map(function (e) {
              var t = te[e];
              if (!t) throw new Error("Unknown language: '" + e + "'");
              return t;
            })
          )
        );
        return (
          (function (e) {
            var t = Object.create(null),
              i = Object.create(null),
              n = Object.create(null);
            e.forEach(function (e) {
              var n = Object.create(null);
              m(e, function (e) {
                if (e.isBlock)
                  if ("define-hat" === e.info.shape) {
                    var s = e.children.find(function (e) {
                      return e.isOutline;
                    });
                    if (!s) return;
                    for (var r, o = [], a = [], c = 0; c < s.children.length; c++)
                      if ((r = s.children[c]).isLabel) a.push(r.value);
                      else if (r.isBlock) {
                        if (!r.info.argument) return;
                        a.push({ number: "%n", string: "%s", boolean: "%b" }[r.info.argument]);
                        var l = he(r);
                        o.push(l), (n[l] = !0);
                      }
                    var h = a.join(" "),
                      p = oe(h),
                      u = (t[p] = { spec: h, names: o });
                    (e.info.id = "PROCEDURES_DEFINITION"),
                      (e.info.selector = "procDef"),
                      (e.info.call = u.spec),
                      (e.info.names = u.names),
                      (e.info.category = "custom");
                  } else if (e.info.categoryIsDefault && (e.isReporter || e.isBoolean))
                    (l = he(e)),
                      n[l] &&
                        ((e.info.category = "custom-arg"),
                        (e.info.categoryIsDefault = !1),
                        (e.info.selector = "getParam"));
                  else if (pe.hasOwnProperty(e.info.selector)) {
                    var f = pe[e.info.selector],
                      d = e.children.filter(function (e) {
                        return !e.isLabel;
                      })[f];
                    d && d.isInput && (i[d.value] = !0);
                  }
              });
            }),
              e.forEach(function (e) {
                m(e, function (e) {
                  var s, r;
                  if (e.info && e.info.categoryIsDefault && "obsolete" === e.info.category)
                    (r = t[e.info.hash]) &&
                      ((e.info.selector = "call"),
                      (e.info.call = r.spec),
                      (e.info.names = r.names),
                      (e.info.category = "custom"));
                  else if (
                    (e.isReporter &&
                      "variables" === e.info.category &&
                      e.info.categoryIsDefault &&
                      ((e.info.selector = "readVariable"), (s = he(e)), (r = e.info)),
                    s)
                  )
                    if (i[s]) (r.category = "list"), (r.categoryIsDefault = !1), (r.selector = "contentsOfList:");
                    else {
                      if (!n[s]) return;
                      (r.category = "variables"), (r.categoryIsDefault = !1), (r.selector = "readVariable");
                    }
                });
              });
          })(i),
          new ee(i)
        );
      },
      Label: z,
      Icon: G,
      Input: V,
      Block: j,
      Comment: _,
      Glow: U,
      Script: Y,
      Document: K,
    },
    fe = i(function (t) {
      function i(e, t) {
        return n({}, e, t);
      }
      function s(e, t) {
        if (!e) throw "Assertion failed! " + (t || "");
      }
      var r,
        o,
        a = { textContent: !0 },
        c = (t.exports = {
          init: function (e) {
            r = e.document;
            var t = e.DOMParser;
            (o = new t().parseFromString("<xml></xml>", "application/xml")), (c.XMLSerializer = e.XMLSerializer);
          },
          makeCanvas: function () {
            return r.createElement("canvas");
          },
          cdata: function (e) {
            return o.createCDATASection(e);
          },
          el: function (e, t) {
            var i = r.createElementNS("http://www.w3.org/2000/svg", e);
            return c.setProps(i, t);
          },
          setProps: function (e, t) {
            for (var i in t) {
              var n = "" + t[i];
              a[i]
                ? (e[i] = n)
                : /^xlink:/.test(i)
                ? e.setAttributeNS("http://www.w3.org/1999/xlink", i.slice(6), n)
                : null !== t[i] && t.hasOwnProperty(i) && e.setAttributeNS(null, i, n);
            }
            return e;
          },
          withChildren: function (e, t) {
            for (var i = 0; i < t.length; i++) e.appendChild(t[i]);
            return e;
          },
          group: function (e) {
            return c.withChildren(c.el("g"), e);
          },
          newSVG: function (e, t) {
            return c.el("svg", { version: "1.1", width: e, height: t });
          },
          polygon: function (e) {
            return c.el("polygon", i(e, { points: e.points.join(" ") }));
          },
          path: function (e) {
            return c.el("path", i(e, { path: null, d: e.path.join(" ") }));
          },
          text: function (e, t, n, s) {
            var r = c.el("text", i(s, { x: e, y: t, textContent: n }));
            return r;
          },
          symbol: function (e) {
            return c.el("use", { "xlink:href": e });
          },
          move: function (e, t, i) {
            return c.setProps(i, { transform: ["translate(", e, " ", t, ")"].join("") }), i;
          },
          translatePath: function (e, t, i) {
            for (var n, r = !0, o = i.split(" "), a = [], c = 0; c < o.length; c++)
              if ("A" !== (n = o[c])) /[A-Za-z]/.test(n) ? s(r) : ((n = +n), (n += r ? e : t), (r = !r)), a.push(n);
              else {
                var l = c + 5;
                for (a.push("A"); c < l; ) a.push(o[++c]);
              }
            return a.join(" ");
          },
          rect: function (e, t, n) {
            return c.el("rect", i(n, { x: 0, y: 0, width: e, height: t }));
          },
          ellipse: function (e, t, n) {
            return c.el("ellipse", i(n, { cx: e / 2, cy: t / 2, rx: e / 2, ry: t / 2 }));
          },
          arc: function (e, t, i, n, s, r) {
            return ["L", e, t, "A", s, r, 0, 0, 1, i, n].join(" ");
          },
          arcw: function (e, t, i, n, s, r) {
            return ["L", e, t, "A", s, r, 0, 0, 0, i, n].join(" ");
          },
          roundedPath: function (e, t) {
            var i = t / 2;
            return ["M", i, 0, c.arc(e - i, 0, e - i, t, i, i), c.arc(i, t, i, 0, i, i), "Z"];
          },
          roundedRect: function (e, t, n) {
            return c.path(i(n, { path: c.roundedPath(e, t) }));
          },
          pointedPath: function (e, t) {
            var i = t / 2;
            return ["M", i, 0, "L", e - i, 0, e, i, "L", e, i, e - i, t, "L", i, t, 0, i, "L", 0, i, i, 0, "Z"];
          },
          pointedRect: function (e, t, n) {
            return c.path(i(n, { path: c.pointedPath(e, t) }));
          },
          getTop: function (e) {
            return [
              "M",
              0,
              3,
              "L",
              3,
              0,
              "L",
              13,
              0,
              "L",
              16,
              3,
              "L",
              24,
              3,
              "L",
              27,
              0,
              "L",
              e - 3,
              0,
              "L",
              e,
              3,
            ].join(" ");
          },
          getRingTop: function (e) {
            return ["M", 0, 3, "L", 3, 0, "L", 7, 0, "L", 10, 3, "L", 16, 3, "L", 19, 0, "L", e - 3, 0, "L", e, 3].join(
              " "
            );
          },
          getRightAndBottom: function (e, t, i, n) {
            void 0 === n && (n = 0);
            var s = ["L", e, t - 3, "L", e - 3, t];
            return (
              i && (s = s.concat(["L", n + 27, t, "L", n + 24, t + 3, "L", n + 16, t + 3, "L", n + 13, t])),
              (s = 0 < n ? s.concat(["L", n + 2, t, "L", n, t + 2]) : s.concat(["L", n + 3, t, "L", 0, t - 3])).join(
                " "
              )
            );
          },
          getArm: function (e, t) {
            return ["L", 15, t - 2, "L", 17, t, "L", e - 3, t, "L", e, t + 3].join(" ");
          },
          stackRect: function (e, t, n) {
            return c.path(i(n, { path: [c.getTop(e), c.getRightAndBottom(e, t, !0, 0), "Z"] }));
          },
          capPath: function (e, t) {
            return [c.getTop(e), c.getRightAndBottom(e, t, !1, 0), "Z"];
          },
          ringCapPath: function (e, t) {
            return [c.getRingTop(e), c.getRightAndBottom(e, t, !1, 0), "Z"];
          },
          capRect: function (e, t, n) {
            return c.path(i(n, { path: c.capPath(e, t) }));
          },
          hatRect: function (e, t, n) {
            return c.path(
              i(n, {
                path: [
                  "M",
                  0,
                  12,
                  c.arc(0, 12, 80, 10, 80, 80),
                  "L",
                  e - 3,
                  10,
                  "L",
                  e,
                  13,
                  c.getRightAndBottom(e, t, !0),
                  "Z",
                ],
              })
            );
          },
          curve: function (e, t, i, n, s) {
            var r = Math.round;
            return [r((e + i) / 2 + (s = s || 0.42) * (n - t)), r((t + n) / 2 - s * (i - e)), i, n].join(" ");
          },
          procHatBase: function (t, n, s, r) {
            s = e(0.2, 35 / t);
            return c.path(
              i(r, {
                path: [
                  "M",
                  0,
                  15,
                  "Q",
                  c.curve(0, 15, t, 15, s),
                  c.getRightAndBottom(t, n, !0),
                  "M",
                  -1,
                  13,
                  "Q",
                  c.curve(-1, 13, t + 1, 13, s),
                  "Q",
                  c.curve(t + 1, 13, t, 16, 0.6),
                  "Q",
                  c.curve(t, 16, 0, 16, -s),
                  "Q",
                  c.curve(0, 16, -1, 13, 0.6),
                  "Z",
                ],
              })
            );
          },
          procHatCap: function (e, t, i) {
            return c.path({
              path: [
                "M",
                -1,
                13,
                "Q",
                c.curve(-1, 13, e + 1, 13, i),
                "Q",
                c.curve(e + 1, 13, e, 16, 0.6),
                "Q",
                c.curve(e, 16, 0, 16, -i),
                "Q",
                c.curve(0, 16, -1, 13, 0.6),
                "Z",
              ],
              class: "sb-define-hat-cap",
            });
          },
          procHatRect: function (t, i, n) {
            var s = e(0.2, 35 / t);
            return c.move(0, i - 52, c.group([c.procHatBase(t, 52, s, n), c.procHatCap(t, 52, s)]));
          },
          mouthRect: function (e, t, n, s, r) {
            for (
              var o, a = s[0].height, l = [c.getTop(e), c.getRightAndBottom(e, a, !0, 15)], h = 1;
              h < s.length;
              h += 2
            ) {
              (o = h + 2 === s.length), (a += s[h].height - 3), l.push(c.getArm(e, a));
              var p = !(o && n),
                u = o ? 0 : 15;
              (a += s[h + 1].height + 3), l.push(c.getRightAndBottom(e, a, p, u));
            }
            return c.path(i(r, { path: l }));
          },
          ringRect: function (e, t, n, s, r, o, a) {
            var l =
              "reporter" === o ? c.roundedPath : "boolean" === o ? c.pointedPath : 40 > s ? c.ringCapPath : c.capPath;
            return c.path(
              i(a, {
                path: [
                  "M",
                  8,
                  0,
                  c.arcw(8, 0, 0, 8, 8, 8),
                  c.arcw(0, t - 8, 8, t, 8, 8),
                  c.arcw(e - 8, t, e, t - 8, 8, 8),
                  c.arcw(e, 8, e - 8, 0, 8, 8),
                  "Z",
                  c.translatePath(4, n || 4, l(s, r).join(" ")),
                ],
                "fill-rule": "even-odd",
              })
            );
          },
          commentRect: function (e, t, n) {
            return c.path(
              i(n, {
                class: "sb-comment",
                path: [
                  "M",
                  6,
                  0,
                  c.arc(e - 6, 0, e, 6, 6, 6),
                  c.arc(e, t - 6, e - 6, t, 6, 6),
                  c.arc(6, t, 0, t - 6, 6, 6),
                  c.arc(0, 6, 6, 0, 6, 6),
                  "Z",
                ],
              })
            );
          },
          commentLine: function (e, t) {
            return c.move(-e, 9, c.rect(e, 2, i(t, { class: "sb-comment-line" })));
          },
          strikethroughLine: function (e, t) {
            return c.path(i(t, { path: ["M", 0, 0, "L", e, 0], class: "sb-diff sb-diff-del" }));
          },
        });
    }),
    de =
      (fe.init,
      fe.makeCanvas,
      fe.cdata,
      fe.el,
      fe.setProps,
      fe.withChildren,
      fe.group,
      fe.newSVG,
      fe.polygon,
      fe.path,
      fe.text,
      fe.symbol,
      fe.move,
      fe.translatePath,
      fe.rect,
      fe.ellipse,
      fe.arc,
      fe.arcw,
      fe.roundedPath,
      fe.roundedRect,
      fe.pointedPath,
      fe.pointedRect,
      fe.getTop,
      fe.getRingTop,
      fe.getRightAndBottom,
      fe.getArm,
      fe.stackRect,
      fe.capPath,
      fe.ringCapPath,
      fe.capRect,
      fe.hatRect,
      fe.curve,
      fe.procHatBase,
      fe.procHatCap,
      fe.procHatRect,
      fe.mouthRect,
      fe.ringRect,
      fe.commentRect,
      fe.commentLine,
      fe.strikethroughLine,
      function (e, t) {
        (this.el = fe.el("filter", v(t, { id: e, x0: "-50%", y0: "-50%", width: "200%", height: "200%" }))),
          (this.highestId = 0);
      });
  (de.prototype.fe = function (e, t, i) {
    var n = [e.toLowerCase().replace(/gaussian|osite/, ""), "-", ++this.highestId].join("");
    return this.el.appendChild(fe.withChildren(fe.el("fe" + e, v(t, { result: n })), i || [])), n;
  }),
    (de.prototype.comp = function (e, t, i, n) {
      return this.fe("Composite", v(n, { operator: e, in: t, in2: i }));
    }),
    (de.prototype.subtract = function (e, t) {
      return this.comp("arithmetic", e, t, { k2: 1, k3: -1 });
    }),
    (de.prototype.offset = function (e, t, i) {
      return this.fe("Offset", { in: i, dx: e, dy: t });
    }),
    (de.prototype.flood = function (e, t, i) {
      return this.fe("Flood", { in: i, "flood-color": e, "flood-opacity": t });
    }),
    (de.prototype.blur = function (e, t) {
      return this.fe("GaussianBlur", { in: t, stdDeviation: [e, e].join(" ") });
    }),
    (de.prototype.colorMatrix = function (e, t) {
      return this.fe("ColorMatrix", { in: e, type: "matrix", values: t.join(" ") });
    }),
    (de.prototype.merge = function (e) {
      this.fe(
        "Merge",
        {},
        e.map(function (e) {
          return fe.el("feMergeNode", { in: e });
        })
      );
    });
  var ge = de,
    me = i(function (e) {
      var t = (e.exports = {
        cssContent: "\n.sb-label {\n  font-family: Lucida Grande, Verdana, Arial, DejaVu Sans, sans-serif;\n  font-weight: bold;\n  fill: #fff;\n  font-size: 10px;\n  word-spacing: +1px;\n}\n\n.sb-obsolete { fill: #d42828; }\n.sb-motion { fill: #4a6cd4; }\n.sb-looks { fill: #8a55d7; }\n.sb-sound { fill: #bb42c3; }\n.sb-pen { fill: #0e9a6c;  }\n.sb-events { fill: #c88330; }\n.sb-control { fill: #e1a91a; }\n.sb-sensing { fill: #2ca5e2; }\n.sb-operators { fill: #5cb712; }\n.sb-variables { fill: #ee7d16; }\n.sb-list { fill: #cc5b22 }\n.sb-custom { fill: #632d99; }\n.sb-custom-arg { fill: #5947b1; }\n.sb-extension { fill: #4b4a60; }\n.sb-grey { fill: #969696; }\n\n.sb-bevel {\n  filter: url(#bevelFilter);\n}\n\n.sb-input {\n  filter: url(#inputBevelFilter);\n}\n.sb-input-number,\n.sb-input-string,\n.sb-input-number-dropdown {\n  fill: #fff;\n}\n.sb-literal-number,\n.sb-literal-string,\n.sb-literal-number-dropdown,\n.sb-literal-dropdown {\n  font-weight: normal;\n  font-size: 9px;\n  word-spacing: 0;\n}\n.sb-literal-number,\n.sb-literal-string,\n.sb-literal-number-dropdown {\n  fill: #000;\n}\n\n.sb-darker {\n  filter: url(#inputDarkFilter);\n}\n\n.sb-outline {\n  stroke: #fff;\n  stroke-opacity: 0.2;\n  stroke-width: 2;\n  fill: none;\n}\n\n.sb-define-hat-cap {\n  stroke: #632d99;\n  stroke-width: 1;\n  fill: #8e2ec2;\n}\n\n.sb-comment {\n  fill: #ffffa5;\n  stroke: #d0d1d2;\n  stroke-width: 1;\n}\n.sb-comment-line {\n  fill: #ffff80;\n}\n.sb-comment-label {\n  font-family: Helevetica, Arial, DejaVu Sans, sans-serif;\n  font-weight: bold;\n  fill: #5c5d5f;\n  word-spacing: 0;\n  font-size: 12px;\n}\n\n.sb-diff {\n  fill: none;\n  stroke: #000;\n}\n.sb-diff-ins {\n  stroke-width: 2px;\n}\n.sb-diff-del {\n  stroke-width: 3px;\n}\n  ".replace(
          /[ \n]+/,
          " "
        ),
        makeIcons: function () {
          return [
            fe.el("path", {
              d:
                "M1.504 21L0 19.493 4.567 0h1.948l-.5 2.418s1.002-.502 3.006 0c2.006.503 3.008 2.01 6.517 2.01 3.508 0 4.463-.545 4.463-.545l-.823 9.892s-2.137 1.005-5.144.696c-3.007-.307-3.007-2.007-6.014-2.51-3.008-.502-4.512.503-4.512.503L1.504 21z",
              fill: "#3f8d15",
              id: "greenFlag",
            }),
            fe.el("path", {
              d:
                "M6.724 0C3.01 0 0 2.91 0 6.5c0 2.316 1.253 4.35 3.14 5.5H5.17v-1.256C3.364 10.126 2.07 8.46 2.07 6.5 2.07 4.015 4.152 2 6.723 2c1.14 0 2.184.396 2.993 1.053L8.31 4.13c-.45.344-.398.826.11 1.08L15 8.5 13.858.992c-.083-.547-.514-.714-.963-.37l-1.532 1.172A6.825 6.825 0 0 0 6.723 0z",
              fill: "#fff",
              id: "turnRight",
            }),
            fe.el("path", {
              d:
                "M3.637 1.794A6.825 6.825 0 0 1 8.277 0C11.99 0 15 2.91 15 6.5c0 2.316-1.253 4.35-3.14 5.5H9.83v-1.256c1.808-.618 3.103-2.285 3.103-4.244 0-2.485-2.083-4.5-4.654-4.5-1.14 0-2.184.396-2.993 1.053L6.69 4.13c.45.344.398.826-.11 1.08L0 8.5 1.142.992c.083-.547.514-.714.963-.37l1.532 1.172z",
              fill: "#fff",
              id: "turnLeft",
            }),
            fe.el("path", { d: "M0 0L4 4L0 8Z", fill: "#111", id: "addInput" }),
            fe.el("path", { d: "M4 0L4 8L0 4Z", fill: "#111", id: "delInput" }),
            fe.setProps(
              fe.group([
                fe.el("path", { d: "M8 0l2 -2l0 -3l3 0l-4 -5l-4 5l3 0l0 3l-8 0l0 2", fill: "#000", opacity: "0.3" }),
                fe.move(
                  -1,
                  -1,
                  fe.el("path", { d: "M8 0l2 -2l0 -3l3 0l-4 -5l-4 5l3 0l0 3l-8 0l0 2", fill: "#fff", opacity: "0.9" })
                ),
              ]),
              { id: "loopArrow" }
            ),
          ];
        },
        makeStyle: function () {
          var e = fe.el("style");
          return e.appendChild(fe.cdata(t.cssContent)), e;
        },
        bevelFilter: function (e, t) {
          var i = new ge(e),
            n = "SourceAlpha",
            s = t ? -1 : 1,
            r = i.blur(1, n);
          return (
            i.merge([
              "SourceGraphic",
              i.comp("in", i.flood("#fff", 0.15), i.subtract(n, i.offset(+s, +s, r))),
              i.comp("in", i.flood("#000", 0.7), i.subtract(n, i.offset(-s, -s, r))),
            ]),
            i.el
          );
        },
        darkFilter: function (e) {
          var t = new ge(e);
          return t.merge(["SourceGraphic", t.comp("in", t.flood("#000", 0.2), "SourceAlpha")]), t.el;
        },
        darkRect: function (e, t, i, n) {
          return fe.setProps(fe.group([fe.setProps(n, { class: ["sb-" + i, "sb-darker"].join(" ") })]), {
            width: e,
            height: t,
          });
        },
        defaultFontFamily: "Lucida Grande, Verdana, Arial, DejaVu Sans, sans-serif",
      });
    }),
    ve =
      (me.cssContent,
      me.makeIcons,
      me.makeStyle,
      me.bevelFilter,
      me.darkFilter,
      me.darkRect,
      me.defaultFontFamily,
      ue.Label),
    be = ue.Icon,
    ye = ue.Input,
    we = ue.Block,
    ke = ue.Comment,
    Ae = ue.Glow,
    Oe = ue.Script,
    Se = ue.Document,
    Le = me.defaultFontFamily,
    Ee = me.makeStyle,
    Re = me.makeIcons,
    Ie = me.darkRect,
    Ce = me.bevelFilter,
    Te = me.darkFilter,
    Ne = function (e) {
      n(this, e), (this.el = null), (this.height = 12), (this.metrics = null), (this.x = 0);
    };
  (Ne.prototype.isLabel = !0),
    (Ne.prototype.draw = function () {
      return this.el;
    }),
    Object.defineProperty(Ne.prototype, "width", {
      get: function () {
        return this.metrics.width;
      },
    }),
    (Ne.metricsCache = {}),
    (Ne.toMeasure = []),
    (Ne.prototype.measure = function () {
      var e = this.value,
        t = "sb-" + this.cls;
      this.el = fe.text(0, 10, e, { class: "sb-label " + t });
      var i = Ne.metricsCache[t];
      if ((i || (i = Ne.metricsCache[t] = Object.create(null)), Object.hasOwnProperty.call(i, e))) this.metrics = i[e];
      else {
        var n = /comment-label/.test(this.cls)
          ? "bold 12px Helevetica, Arial, DejaVu Sans, sans-serif"
          : /literal/.test(this.cls)
          ? "normal 9px " + Le
          : "bold 10px " + Le;
        this.metrics = i[e] = Ne.measure(e, n);
      }
    }),
    (Ne.measure = function (e, t) {
      var i = Ne.measuring;
      return (i.font = t), { width: 0 | (i.measureText(e).width + 0.5) };
    });
  var Me = function e(t) {
    n(this, t);
    var i = e.icons[this.name];
    if (!i) throw new Error("no info for icon: " + this.name);
    n(this, i);
  };
  (Me.prototype.isIcon = !0),
    (Me.prototype.draw = function () {
      return fe.symbol("#" + this.name, { width: this.width, height: this.height });
    }),
    (Me.icons = {
      greenFlag: { width: 20, height: 21, dy: -2 },
      turnLeft: { width: 15, height: 12, dy: 1 },
      turnRight: { width: 15, height: 12, dy: 1 },
      loopArrow: { width: 14, height: 11 },
      addInput: { width: 4, height: 8 },
      delInput: { width: 4, height: 8 },
    });
  var Pe = function (e) {
    n(this, e), e.label && (this.label = ze(e.label)), (this.x = 0);
  };
  (Pe.prototype.measure = function () {
    this.hasLabel && this.label.measure();
  }),
    (Pe.shapes = {
      string: fe.rect,
      number: fe.roundedRect,
      "number-dropdown": fe.roundedRect,
      color: fe.rect,
      dropdown: fe.rect,
      boolean: fe.pointedRect,
      stack: fe.stackRect,
      reporter: fe.roundedRect,
    }),
    (Pe.prototype.draw = function (e) {
      if (this.hasLabel)
        var i = this.label.draw(),
          n = t(14, this.label.width + ("string" === this.shape || "number-dropdown" === this.shape ? 6 : 9));
      else n = this.isInset ? 30 : this.isColor ? 13 : null;
      this.hasArrow && (n += 10), (this.width = n);
      var s = (this.height = this.isRound || this.isColor ? 13 : 14),
        r = Pe.shapes[this.shape](n, s);
      this.isColor
        ? fe.setProps(r, { fill: this.value })
        : this.isDarker && ((r = Ie(n, s, e.info.category, r)), e.info.color && fe.setProps(r, { fill: e.info.color }));
      var o = fe.group([fe.setProps(r, { class: ["sb-input", "sb-input-" + this.shape].join(" ") })]);
      if (this.hasLabel) {
        var a = this.isRound ? 5 : 4;
        o.appendChild(fe.move(a, 0, i));
      }
      if (this.hasArrow) {
        var c = "dropdown" === this.shape ? 5 : 4;
        o.appendChild(fe.move(n - 10, c, fe.polygon({ points: [7, 0, 3.5, 4, 0, 0], fill: "#000", opacity: "0.6" })));
      }
      return o;
    });
  var xe = function (e) {
    switch (
      (n(this, e),
      (this.children = e.children.map(ze)),
      (this.comment = this.comment ? ze(this.comment) : null),
      this.info.category)
    ) {
      case "music":
        this.info.category = "sound";
        break;
      case "video":
        this.info.category = "sensing";
        break;
      case "tts":
      case "translate":
      case "wedo":
      case "ev3":
      case "microbit":
      case "makeymakey":
        this.info.category = "extension";
    }
    (this.x = 0), (this.width = null), (this.height = null), (this.firstLine = null), (this.innerWidth = null);
  };
  (xe.prototype.isBlock = !0),
    (xe.prototype.measure = function () {
      for (var e, t = 0; t < this.children.length; t++) (e = this.children[t]).measure && e.measure();
      this.comment && this.comment.measure();
    }),
    (xe.shapes = {
      stack: fe.stackRect,
      "c-block": fe.stackRect,
      "if-block": fe.stackRect,
      celse: fe.stackRect,
      cend: fe.stackRect,
      cap: fe.capRect,
      reporter: fe.roundedRect,
      boolean: fe.pointedRect,
      hat: fe.hatRect,
      cat: fe.hatRect,
      "define-hat": fe.procHatRect,
      ring: fe.roundedRect,
    }),
    (xe.prototype.drawSelf = function (e, t, i) {
      if (1 < i.length)
        return fe.mouthRect(e, t, this.isFinal, i, { class: ["sb-" + this.info.category, "sb-bevel"].join(" ") });
      if ("outline" === this.info.shape) return fe.setProps(fe.stackRect(e, t), { class: "sb-outline" });
      if (this.isRing) {
        var n = this.children[0];
        if (n && (n.isInput || n.isBlock || n.isScript)) {
          var s = n.isScript ? "stack" : n.isInput ? n.shape : n.info.shape;
          return fe.ringRect(e, t, n.y, n.width, n.height, s, {
            class: ["sb-" + this.info.category, "sb-bevel"].join(" "),
          });
        }
      }
      var r = xe.shapes[this.info.shape];
      if (!r) throw new Error("no shape func: " + this.info.shape);
      return r(e, t, { class: ["sb-" + this.info.category, "sb-bevel"].join(" ") });
    }),
    (xe.prototype.minDistance = function (e) {
      return this.isBoolean
        ? e.isReporter
          ? 0 | (4 + e.height / 4)
          : e.isLabel
          ? 0 | (5 + e.height / 2)
          : e.isBoolean || "boolean" === e.shape
          ? 5
          : 0 | (2 + e.height / 2)
        : this.isReporter
        ? (e.isInput && e.isRound) || ((e.isReporter || e.isBoolean) && !e.hasScript)
          ? 0
          : e.isLabel
          ? 0 | (2 + e.height / 2)
          : 0 | (e.height / 2 - 2)
        : 0;
    }),
    (xe.padding = {
      hat: [15, 6, 2],
      cat: [15, 6, 2],
      "define-hat": [21, 8, 9],
      reporter: [3, 4, 1],
      boolean: [3, 4, 2],
      cap: [6, 6, 2],
      "c-block": [3, 6, 2],
      "if-block": [3, 6, 2],
      ring: [4, 4, 2],
      null: [4, 6, 2],
    }),
    (xe.prototype.draw = function () {
      function i(e) {
        0 === m.length ? (u.height += o + c) : ((u.height += e ? 0 : 2), (u.y -= 1)), (L += u.height), m.push(u);
      }
      var n = "define-hat" === this.info.shape,
        s = this.children,
        r = xe.padding[this.info.shape] || xe.padding.null,
        o = r[0],
        a = r[1],
        c = r[2],
        l = function (e) {
          (this.y = e), (this.width = 0), (this.height = e ? 13 : 16), (this.children = []);
        },
        h = 0,
        p = 0,
        u = new l((L = 0));
      if (this.info.isRTL) {
        for (
          var f = 0,
            d = function () {
              s = s.slice(0, f).concat(s.slice(f, g).reverse()).concat(s.slice(g));
            }.bind(this),
            g = 0;
          g < s.length;
          g++
        )
          s[g].isScript && (d(), (f = g + 1));
        f < g && d();
      }
      var m = [];
      for (g = 0; g < s.length; g++)
        if ((((A = s[g]).el = A.draw(this)), A.isScript && this.isCommand))
          (this.hasScript = !0),
            i(),
            (A.y = L),
            m.push(A),
            (p = t(p, t(1, A.width))),
            (A.height = t(12, A.height) + 3),
            (L += A.height),
            (u = new l(L));
        else if (A.isArrow) u.children.push(A);
        else {
          var v = 0 < g ? 30 : 0,
            b = this.isCommand ? 0 : this.minDistance(A),
            y = this.isCommand ? (A.isBlock || A.isInput ? v : 0) : b;
          y && !m.length && u.width < y - a && (u.width = y - a),
            (A.x = u.width),
            (u.width += A.width),
            (h = t(h, u.width + t(0, b - a))),
            (u.width += 4),
            A.isLabel || (u.height = t(u.height, A.height)),
            u.children.push(A);
        }
      if (
        (i(!0),
        (h = t(
          h + 2 * a,
          this.isHat || this.hasScript ? 83 : this.isCommand || this.isOutline || this.isRing ? 39 : 20
        )),
        (this.height = L),
        (this.width = p ? t(h, 15 + p) : h),
        n)
      ) {
        var w = e(26, 0 | (3.5 + 0.13 * h)) - 18;
        (this.height += w), (o += 2 * w);
      }
      (this.firstLine = m[0]), (this.innerWidth = h);
      var k = [];
      for (g = 0; g < m.length; g++)
        if ((u = m[g]).isScript) k.push(fe.move(15, u.y, u.el));
        else
          for (var A, O = u.height, S = 0; S < u.children.length; S++)
            if ((A = u.children[S]).isArrow) k.push(fe.move(h - 15, this.height - 3, A.el));
            else {
              var L = o + (O - A.height - o - c) / 2 - 1;
              if (
                !(n && A.isLabel ? (L += 3) : A.isIcon && (L += 0 | A.dy),
                (this.isRing && ((A.y = 0 | (u.y + L)), A.isInset)) ||
                  (k.push(fe.move(a + A.x, 0 | (u.y + L), A.el)), "+" !== A.diff))
              ) {
                var E = fe.insEllipse(A.width, A.height);
                k.push(fe.move(a + A.x, 0 | (u.y + L), E));
              }
            }
      var R = this.drawSelf(h, this.height, m);
      return k.splice(0, 0, R), this.info.color && fe.setProps(R, { fill: this.info.color }), fe.group(k);
    });
  var De = function (e) {
    n(this, e), (this.label = ze(e.label)), (this.width = null);
  };
  (De.prototype.isComment = !0),
    (De.lineLength = 12),
    (De.prototype.height = 20),
    (De.prototype.measure = function () {
      this.label.measure();
    }),
    (De.prototype.draw = function () {
      var e = this.label.draw();
      return (
        (this.width = this.label.width + 16),
        fe.group([
          fe.commentLine(this.hasBlock ? De.lineLength : 0, 6),
          fe.commentRect(this.width, this.height, { class: "sb-comment" }),
          fe.move(8, 4, e),
        ])
      );
    });
  var Be = function (e) {
    n(this, e), (this.child = ze(e.child)), (this.width = null), (this.height = null), (this.y = 0);
  };
  (Be.prototype.isGlow = !0),
    (Be.prototype.measure = function () {
      this.child.measure();
    }),
    (Be.prototype.drawSelf = function () {
      var e = this.child,
        t = this.width,
        i = this.height - 1;
      if (e.isScript)
        n = !e.isEmpty && e.blocks[0].isHat ? fe.hatRect(t, i) : e.isFinal ? fe.capRect(t, i) : fe.stackRect(t, i);
      else var n = e.drawSelf(t, i, []);
      return fe.setProps(n, { class: "sb-diff sb-diff-ins" });
    }),
    (Be.prototype.draw = function () {
      var e = this.child,
        t = e.isScript ? e.draw(!0) : e.draw();
      return (
        (this.width = e.width),
        (this.height = (e.isBlock && e.firstLine.height) || e.height),
        fe.group([t, this.drawSelf()])
      );
    });
  var Fe = function (e) {
    n(this, e), (this.blocks = e.blocks.map(ze)), (this.y = 0);
  };
  (Fe.prototype.isScript = !0),
    (Fe.prototype.measure = function () {
      for (var e = 0; e < this.blocks.length; e++) this.blocks[e].measure();
    }),
    (Fe.prototype.draw = function (e) {
      var i = [],
        n = 0;
      this.width = 0;
      for (var s = 0; s < this.blocks.length; s++) {
        var r = this.blocks[s],
          o = e ? 0 : 2,
          a = r.draw();
        if ((i.push(fe.move(o, n, a)), (this.width = t(this.width, r.width)), "-" === r.diff)) {
          var c = r.width,
            l = r.firstLine.height || r.height;
          i.push(fe.move(o, n + l / 2 + 1, fe.strikethroughLine(c))), (this.width = t(this.width, r.width));
        }
        n += r.height;
        var h = r.comment;
        if (h) {
          var p = r.firstLine,
            u = r.innerWidth + 2 + De.lineLength,
            f = n - r.height + p.height / 2,
            d = h.draw();
          i.push(fe.move(u, f - h.height / 2, d)), (this.width = t(this.width, u + h.width));
        }
      }
      return (
        (this.height = n), e || this.isFinal || (this.height += 3), !e && r.isGlow && (this.height += 2), fe.group(i)
      );
    });
  var He = function (e) {
    n(this, e),
      (this.scripts = e.scripts.map(ze)),
      (this.width = null),
      (this.height = null),
      (this.el = null),
      (this.defs = null);
  };
  (He.prototype.measure = function () {
    this.scripts.forEach(function (e) {
      e.measure();
    });
  }),
    (He.prototype.render = function () {
      if ("function" == typeof ocbptions) throw new Error("render() no longer takes a callback");
      this.measure();
      for (var e, i = 0, n = 0, s = [], r = 0; r < this.scripts.length; r++)
        n && (n += 10),
          ((e = this.scripts[r]).y = n),
          s.push(fe.move(0, n, e.draw())),
          (n += e.height),
          (i = t(i, e.width + 4));
      (this.width = i), (this.height = n);
      var o = fe.newSVG(i, n);
      return (
        o.appendChild(
          (this.defs = fe.withChildren(
            fe.el("defs"),
            [Ce("bevelFilter", !1), Ce("inputBevelFilter", !0), Te("inputDarkFilter")].concat(Re())
          ))
        ),
        o.appendChild(fe.group(s)),
        (this.el = o),
        o
      );
    }),
    (He.prototype.exportSVGString = function () {
      if (null == this.el) throw new Error("call draw() first");
      var e = Ee();
      this.defs.appendChild(e);
      var t = new fe.XMLSerializer().serializeToString(this.el);
      return this.defs.removeChild(e), t;
    }),
    (He.prototype.exportSVG = function () {
      return "data:image/svg+xml;utf8," + this.exportSVGString().replace(/[#]/g, encodeURIComponent);
    }),
    (He.prototype.toCanvas = function (e, t) {
      t = t || 1;
      var i = fe.makeCanvas();
      (i.width = this.width * t), (i.height = this.height * t);
      var n = i.getContext("2d"),
        s = new Image();
      (s.src = this.exportSVG()),
        (s.onload = function () {
          n.save(), n.scale(t, t), n.drawImage(s, 0, 0), n.restore(), e(i);
        });
    }),
    (He.prototype.exportPNG = function (e, t) {
      this.toCanvas(function (t) {
        URL && URL.createObjectURL && Blob && t.toBlob
          ? t.toBlob(function (t) {
              e(URL.createObjectURL(t));
            }, "image/png")
          : e(t.toDataURL("image/png"));
      }, t);
    });
  var ze = function (e) {
      return new ((function (e) {
        switch (e.constructor) {
          case ve:
            return Ne;
          case be:
            return Me;
          case ye:
            return Pe;
          case we:
            return xe;
          case ke:
            return De;
          case Ae:
            return Be;
          case Oe:
            return Fe;
          case Se:
            return He;
          default:
            throw new Error("no view for " + e.constructor.name);
        }
      })(e))(e);
    },
    Ge = { newView: ze, LabelView: Ne },
    Ve = {
      init: function (e) {
        fe.init(e), (Ge.LabelView.measuring = fe.makeCanvas().getContext("2d"));
      },
      newView: Ge.newView,
      makeStyle: me.makeStyle,
    },
    je = i(function (e) {
      function t(e, t) {
        return n({}, e, t);
      }
      var i,
        s,
        r = { textContent: !0 },
        o = (e.exports = {
          init: function (e) {
            i = e.document;
            var t = e.DOMParser;
            (s = new t().parseFromString("<xml></xml>", "application/xml")), (o.XMLSerializer = e.XMLSerializer);
          },
          makeCanvas: function () {
            return i.createElement("canvas");
          },
          cdata: function (e) {
            return s.createCDATASection(e);
          },
          el: function (e, t) {
            var n = i.createElementNS("http://www.w3.org/2000/svg", e);
            return o.setProps(n, t);
          },
          setProps: function (e, t) {
            for (var i in t) {
              var n = "" + t[i];
              r[i]
                ? (e[i] = n)
                : /^xlink:/.test(i)
                ? e.setAttributeNS("http://www.w3.org/1999/xlink", i.slice(6), n)
                : null !== t[i] && t.hasOwnProperty(i) && e.setAttributeNS(null, i, n);
            }
            return e;
          },
          withChildren: function (e, t) {
            for (var i = 0; i < t.length; i++) e.appendChild(t[i]);
            return e;
          },
          group: function (e) {
            return o.withChildren(o.el("g"), e);
          },
          newSVG: function (e, t) {
            return o.el("svg", { version: "1.1", width: e, height: t });
          },
          polygon: function (e) {
            return o.el("polygon", t(e, { points: e.points.join(" ") }));
          },
          path: function (e) {
            return o.el("path", t(e, { path: null, d: e.path.join(" ") }));
          },
          text: function (e, i, n, s) {
            var r = o.el("text", t(s, { x: e, y: i, textContent: n }));
            return r;
          },
          symbol: function (e) {
            return o.el("use", { "xlink:href": e });
          },
          move: function (e, t, i) {
            return o.setProps(i, { transform: ["translate(", e, " ", t, ")"].join("") }), i;
          },
          rect: function (e, i, n) {
            return o.el("rect", t(n, { x: 0, y: 0, width: e, height: i }));
          },
          roundRect: function (e, i, n) {
            return o.rect(e, i, t(n, { rx: 4, ry: 4 }));
          },
          pillRect: function (e, i, n) {
            var s = i / 2;
            return o.rect(e, i, t(n, { rx: s, ry: s }));
          },
          pointedPath: function (e, t) {
            var i = t / 2;
            return [
              ["M", i, 0].join(" "),
              ["L", e - i, 0, e, i].join(" "),
              ["L", e, i, e - i, t].join(" "),
              ["L", i, t, 0, i].join(" "),
              ["L", 0, i, i, 0].join(" "),
              "Z",
            ];
          },
          pointedRect: function (e, i, n) {
            return o.path(t(n, { path: o.pointedPath(e, i) }));
          },
          topNotch: function (e, t) {
            return [
              "c 2 0 3 1 4 2",
              "l 4 4",
              "c 1 1 2 2 4 2",
              "h 12",
              "c 2 0 3 -1 4 -2",
              "l 4 -4",
              "c 1 -1 2 -2 4 -2",
              ["L", e - 4, t].join(" "),
              "a 4 4 0 0 1 4 4",
            ].join(" ");
          },
          getTop: function (e) {
            return ["M 0 4", "A 4 4 0 0 1 4 0", "H 12", o.topNotch(e, 0)].join(" ");
          },
          getRingTop: function (e) {
            return ["M", 0, 3, "L", 3, 0, "L", 7, 0, "L", 10, 3, "L", 16, 3, "L", 19, 0, "L", e - 3, 0, "L", e, 3].join(
              " "
            );
          },
          getRightAndBottom: function (e, t, i, n) {
            void 0 === n && (n = 0);
            var s = [["L", e, t - 4].join(" "), "a 4 4 0 0 1 -4 4"];
            return (
              i &&
                (s = s.concat([
                  ["L", n + 48, t].join(" "),
                  "c -2 0 -3 1 -4 2",
                  "l -4 4",
                  "c -1 1 -2 2 -4 2",
                  "h -12",
                  "c -2 0 -3 -1 -4 -2",
                  "l -4 -4",
                  "c -1 -1 -2 -2 -4 -2",
                ])),
              0 === n
                ? (s.push("L", n + 4, t), s.push("a 4 4 0 0 1 -4 -4"))
                : (s.push("L", n + 4, t), s.push("a 4 4 0 0 0 -4 4")),
              s.join(" ")
            );
          },
          getArm: function (e, t) {
            return [["L", 16, t - 4].join(" "), "a 4 4 0 0 0 4 4", ["L", 28, t].join(" "), o.topNotch(e, t)].join(" ");
          },
          getArmNoNotch: function (e, t) {
            return [
              ["L", 16, t - 4].join(" "),
              "a 4 4 0 0 0 4 4",
              ["L", 28, t].join(" "),
              ["L", e - 4, t].join(" "),
              "a 4 4 0 0 1 4 4",
            ].join(" ");
          },
          stackRect: function (e, i, n) {
            return o.path(t(n, { path: [o.getTop(e), o.getRightAndBottom(e, i, !0, 0), "Z"] }));
          },
          capPath: function (e, t) {
            return [o.getTop(e), o.getRightAndBottom(e, t, !1, 0), "Z"];
          },
          ringCapPath: function (e, t) {
            return [o.getRingTop(e), o.getRightAndBottom(e, t, !1, 0), "Z"];
          },
          capRect: function (e, i, n) {
            return o.path(t(n, { path: o.capPath(e, i) }));
          },
          getHatTop: function (e) {
            return ["M 0 16", "c 25,-22 71,-22 96,0", ["L", e - 4, 16].join(" "), "a 4 4 0 0 1 4 4"].join(" ");
          },
          getCatTop: function (e) {
            return [
              "M 0 32",
              "c2.6,-2.3 5.5,-4.3 8.5,-6.2c-1,-12.5 5.3,-23.3 8.4,-24.8c3.7,-1.8 16.5,13.1 18.4,15.4c8.4,-1.3 17,-1.3 25.4,0c1.9,-2.3 14.7,-17.2 18.4,-15.4c3.1,1.5 9.4,12.3 8.4,24.8c3,1.8 5.9,3.9 8.5,6.1",
              ["L", e - 4, 32].join(" "),
              "a 4 4 0 0 1 4 4",
            ].join(" ");
          },
          hatRect: function (e, i, n) {
            return o.path(t(n, { path: [o.getHatTop(e), o.getRightAndBottom(e, i, !0, 0), "Z"] }));
          },
          catHat: function (e, i, n) {
            return o.group([
              o.path(t(n, { path: [o.getCatTop(e), o.getRightAndBottom(e, i, !0, 0), "Z"] })),
              o.move(
                0,
                32,
                o.setProps(
                  o.group([
                    o.el("circle", { cx: 29.1, cy: -3.3, r: 3.4 }),
                    o.el("circle", { cx: 59.2, cy: -3.3, r: 3.4 }),
                    o.el("path", {
                      d:
                        "M45.6,0.1c-0.9,0-1.7-0.3-2.3-0.9c-0.6,0.6-1.3,0.9-2.2,0.9c-0.9,0-1.8-0.3-2.3-0.9c-1-1.1-1.1-2.6-1.1-2.8c0-0.5,0.5-1,1-1l0,0c0.6,0,1,0.5,1,1c0,0.4,0.1,1.7,1.4,1.7c0.5,0,0.7-0.2,0.8-0.3c0.3-0.3,0.4-1,0.4-1.3c0-0.1,0-0.1,0-0.2c0-0.5,0.5-1,1-1l0,0c0.5,0,1,0.4,1,1c0,0,0,0.1,0,0.2c0,0.3,0.1,0.9,0.4,1.2C44.8-2.2,45-2,45.5-2s0.7-0.2,0.8-0.3c0.3-0.4,0.4-1.1,0.3-1.3c0-0.5,0.4-1,0.9-1.1c0.5,0,1,0.4,1.1,0.9c0,0.2,0.1,1.8-0.8,2.8C47.5-0.4,46.8,0.1,45.6,0.1z",
                    }),
                  ]),
                  { fill: "#000", "fill-opacity": 0.6 }
                )
              ),
              o.move(
                0,
                32,
                o.el("path", {
                  d:
                    "M73.1-15.6c1.7-4.2,4.5-9.1,5.8-8.5c1.6,0.8,5.4,7.9,5,15.4c0,0.6-0.7,0.7-1.1,0.5c-3-1.6-6.4-2.8-8.6-3.6C72.8-12.3,72.4-13.7,73.1-15.6z",
                  fill: "#FFD5E6",
                  transform: "translate(0, 32)",
                })
              ),
              o.move(
                0,
                32,
                o.el("path", {
                  d:
                    "M22.4-15.6c-1.7-4.2-4.5-9.1-5.8-8.5c-1.6,0.8-5.4,7.9-5,15.4c0,0.6,0.7,0.7,1.1,0.5c3-1.6,6.4-2.8,8.6-3.6C22.8-12.3,23.2-13.7,22.4-15.6z",
                  fill: "#FFD5E6",
                  transform: "translate(0, 32)",
                })
              ),
            ]);
          },
          getProcHatTop: function (e) {
            return ["M 0 20", "a 20 20 0 0 1 20 -20", ["L", e - 20, 0].join(" "), "a 20,20 0 0,1 20,20"].join(" ");
          },
          procHatRect: function (e, i, n) {
            return o.path(t(n, { path: [o.getProcHatTop(e), o.getRightAndBottom(e, i, !0, 0), "Z"] }));
          },
          mouthRect: function (e, i, n, s, r) {
            for (
              var a = s[0].height, c = [o.getTop(e), o.getRightAndBottom(e, a, !0, 16)], l = 1;
              l < s.length;
              l += 2
            ) {
              var h = l + 2 === s.length,
                p = s[l];
              (a += p.height - 3), p.isFinal ? c.push(o.getArmNoNotch(e, a)) : c.push(o.getArm(e, a));
              var u = h ? 0 : 16;
              (a += s[l + 1].height + 3), c.push(o.getRightAndBottom(e, a, !(h && n), u));
            }
            return c.push("Z"), o.path(t(r, { path: c }));
          },
          commentRect: function (e, i, n) {
            return o.roundRect(e, i, t(n, { class: "sb3-comment" }));
          },
          commentLine: function (e, i) {
            return o.move(-e, 9, o.rect(e, 2, t(i, { class: "sb3-comment-line" })));
          },
          strikethroughLine: function (e, i) {
            return o.path(t(i, { path: ["M", 0, 0, "L", e, 0], class: "sb3-diff sb3-diff-del" }));
          },
        });
    }),
    _e =
      (je.init,
      je.makeCanvas,
      je.cdata,
      je.el,
      je.setProps,
      je.withChildren,
      je.group,
      je.newSVG,
      je.polygon,
      je.path,
      je.text,
      je.symbol,
      je.move,
      je.rect,
      je.roundRect,
      je.pillRect,
      je.pointedPath,
      je.pointedRect,
      je.topNotch,
      je.getTop,
      je.getRingTop,
      je.getRightAndBottom,
      je.getArm,
      je.getArmNoNotch,
      je.stackRect,
      je.capPath,
      je.ringCapPath,
      je.capRect,
      je.getHatTop,
      je.getCatTop,
      je.hatRect,
      je.catHat,
      je.getProcHatTop,
      je.procHatRect,
      je.mouthRect,
      je.commentRect,
      je.commentLine,
      je.strikethroughLine,
      i(function (e) {
        var t = (e.exports = {
          cssContent: "\n.sb3-label {\n  font: 500 12pt Helevetica Neue, Helvetica, sans-serif;\n  fill: #fff;\n  word-spacing: +1pt;\n}\n\n.sb3-motion { fill: #4c97ff; stroke: #3373cc; }\n.sb3-motion-alt { fill: #4280d7; }\n.sb3-motion-dark { fill: #4c97ff; }\n.sb3-looks { fill: #9966ff; stroke: #774dcb; }\n.sb3-looks-alt { fill: #855cd6; }\n.sb3-looks-dark { fill: #bd42bd; }\n.sb3-sound { fill: #cf63cf; stroke: #bd42bd; }\n.sb3-sound-alt { fill: #c94fc9; }\n.sb3-sound-dark { fill: #bd42bd; }\n.sb3-control { fill: #ffab19; stroke: #cf8b17; }\n.sb3-control-alt { fill: #ec9c13; }\n.sb3-control-dark { fill: #cf8b17; }\n.sb3-events { fill: #ffbf00; stroke: #cc9900; }\n.sb3-events-alt { fill: #e6ac00; }\n.sb3-events-dark { fill: #cc9900; }\n.sb3-sensing { fill: #5cb1d6; stroke: #2e8eb8; }\n.sb3-sensing-alt { fill: #47a8d1; }\n.sb3-sensing-dark { fill: #2e8eb8; }\n.sb3-operators { fill: #59c059; stroke: #389438; }\n.sb3-operators-alt { fill: #46b946; }\n.sb3-operators-dark { fill: #389438; }\n.sb3-variables { fill: #ff8c1a; stroke: #db6e00; }\n.sb3-variables-alt { fill: #ff8000; }\n.sb3-variables-dark { fill: #db6e00; }\n.sb3-list { fill: #ff661a; stroke: #e64d00; }\n.sb3-list-alt { fill: #ff5500; }\n.sb3-list-dark { fill: #e64d00; }\n.sb3-custom { fill: #ff6680; stroke: #ff3355; }\n.sb3-custom-alt { fill: #ff4d6a; }\n.sb3-custom-dark { fill: #ff3355; }\n.sb3-custom-arg { fill: #ff6680; stroke: #ff3355; }\n\n/* extension blocks, e.g. pen */\n.sb3-extension { fill: #0fbd8c; stroke: #0b8e69; }\n.sb3-extension-alt { fill: #0da57a; }\n.sb3-extension-line { stroke: #0da57a; }\n.sb3-extension-dark { fill: #0b8e69; }\n\n/* obsolete colors: chosen by hand, indicates invalid blocks */ \n.sb3-obsolete { fill: #ed4242; stroke: #ca2b2b; }\n.sb3-obsolete-alt { fill: #db3333; }\n.sb3-obsolete-dark { fill: #ca2b2b; }\n\n/* grey: special color from the Scratch 3.0 design mockups */\n.sb3-grey { fill: #bfbfbf; stroke: #909090; }\n.sb3-grey-alt { fill: #b2b2b2; }\n.sb3-grey-dark { fill: #909090; }\n\n.sb3-input-color {\n  stroke: #fff;\n}\n\n.sb3-input-number,\n.sb3-input-string {\n  fill: #fff;\n}\n.sb3-literal-number,\n.sb3-literal-string,\n.sb3-literal-number-dropdown,\n.sb3-literal-dropdown {\n  word-spacing: 0;\n}\n.sb3-literal-number,\n.sb3-literal-string {\n  fill: #575e75;\n}\n\n.sb3-comment {\n  fill: #ffffa5;\n  stroke: #d0d1d2;\n  stroke-width: 1;\n}\n.sb3-comment-line {\n  fill: #ffff80;\n}\n.sb3-comment-label {\n  font: 400 12pt Helevetica Neue, Helvetica, sans-serif;\n  fill: #000;\n  word-spacing: 0;\n}\n\n.sb3-diff {\n  fill: none;\n  stroke: #000;\n}\n.sb3-diff-ins {\n  stroke-width: 2px;\n}\n.sb3-diff-del {\n  stroke-width: 3px;\n}\n  ".replace(
            /[ \n]+/,
            " "
          ),
          makeIcons: function () {
            return [
              je.setProps(
                je.group([
                  je.el("path", {
                    d:
                      "M20.8 3.7c-.4-.2-.9-.1-1.2.2-2 1.6-4.8 1.6-6.8 0-2.3-1.9-5.6-2.3-8.3-1v-.4c0-.6-.5-1-1-1s-1 .4-1 1v18.8c0 .5.5 1 1 1h.1c.5 0 1-.5 1-1v-6.4c1-.7 2.1-1.2 3.4-1.3 1.2 0 2.4.4 3.4 1.2 2.9 2.3 7 2.3 9.8 0 .3-.2.4-.5.4-.9V4.7c0-.5-.3-.9-.8-1zm-.3 10.2C18 16 14.4 16 11.9 14c-1.1-.9-2.5-1.4-4-1.4-1.2.1-2.3.5-3.4 1.1V4c2.5-1.4 5.5-1.1 7.7.6 2.4 1.9 5.7 1.9 8.1 0h.2l.1.1-.1 9.2z",
                    fill: "#45993d",
                  }),
                  je.el("path", {
                    d:
                      "M20.6 4.8l-.1 9.1v.1c-2.5 2-6.1 2-8.6 0-1.1-.9-2.5-1.4-4-1.4-1.2.1-2.3.5-3.4 1.1V4c2.5-1.4 5.5-1.1 7.7.6 2.4 1.9 5.7 1.9 8.1 0h.2c0 .1.1.1.1.2z",
                    fill: "#4cbf56",
                  }),
                ]),
                { id: "sb3-greenFlag" }
              ),
              je.setProps(
                je.group([
                  je.el("path", {
                    d:
                      "M12.71 2.44A2.41 2.41 0 0 1 12 4.16L8.08 8.08a2.45 2.45 0 0 1-3.45 0L.72 4.16A2.42 2.42 0 0 1 0 2.44 2.48 2.48 0 0 1 .71.71C1 .47 1.43 0 6.36 0s5.39.46 5.64.71a2.44 2.44 0 0 1 .71 1.73z",
                    fill: "#231f20",
                    opacity: ".1",
                  }),
                  je.el("path", {
                    d:
                      "M6.36 7.79a1.43 1.43 0 0 1-1-.42L1.42 3.45a1.44 1.44 0 0 1 0-2c.56-.56 9.31-.56 9.87 0a1.44 1.44 0 0 1 0 2L7.37 7.37a1.43 1.43 0 0 1-1.01.42z",
                    fill: "#fff",
                  }),
                ]),
                { id: "sb3-dropdownArrow", transform: "scale(0.944)" }
              ),
              je.setProps(
                je.group([
                  je.el("path", {
                    d:
                      "M22.68 12.2a1.6 1.6 0 0 1-1.27.63h-7.69a1.59 1.59 0 0 1-1.16-2.58l1.12-1.41a4.82 4.82 0 0 0-3.14-.77 4.31 4.31 0 0 0-2 .8A4.25 4.25 0 0 0 7.2 10.6a5.06 5.06 0 0 0 .54 4.62A5.58 5.58 0 0 0 12 17.74a2.26 2.26 0 0 1-.16 4.52A10.25 10.25 0 0 1 3.74 18a10.14 10.14 0 0 1-1.49-9.22 9.7 9.7 0 0 1 2.83-4.14A9.92 9.92 0 0 1 9.66 2.5a10.66 10.66 0 0 1 7.72 1.68l1.08-1.35a1.57 1.57 0 0 1 1.24-.6 1.6 1.6 0 0 1 1.54 1.21l1.7 7.37a1.57 1.57 0 0 1-.26 1.39z",
                    fill: "#3d79cc",
                  }),
                  je.el("path", {
                    d:
                      "M21.38 11.83h-7.61a.59.59 0 0 1-.43-1l1.75-2.19a5.9 5.9 0 0 0-4.7-1.58 5.07 5.07 0 0 0-4.11 3.17A6 6 0 0 0 7 15.77a6.51 6.51 0 0 0 5 2.92 1.31 1.31 0 0 1-.08 2.62 9.3 9.3 0 0 1-7.35-3.82 9.16 9.16 0 0 1-1.4-8.37A8.51 8.51 0 0 1 5.71 5.4a8.76 8.76 0 0 1 4.11-1.92 9.71 9.71 0 0 1 7.75 2.07l1.67-2.1a.59.59 0 0 1 1 .21L22 11.08a.59.59 0 0 1-.62.75z",
                    fill: "#fff",
                  }),
                ]),
                { id: "sb3-turnRight" }
              ),
              je.setProps(
                je.group([
                  je.el("path", {
                    d:
                      "M20.34 18.21a10.24 10.24 0 0 1-8.1 4.22 2.26 2.26 0 0 1-.16-4.52 5.58 5.58 0 0 0 4.25-2.53 5.06 5.06 0 0 0 .54-4.62A4.25 4.25 0 0 0 15.55 9a4.31 4.31 0 0 0-2-.8 4.82 4.82 0 0 0-3.15.8l1.12 1.41A1.59 1.59 0 0 1 10.36 13H2.67a1.56 1.56 0 0 1-1.26-.63A1.54 1.54 0 0 1 1.13 11l1.72-7.43A1.59 1.59 0 0 1 4.38 2.4a1.57 1.57 0 0 1 1.24.6L6.7 4.35a10.66 10.66 0 0 1 7.72-1.68A9.88 9.88 0 0 1 19 4.81 9.61 9.61 0 0 1 21.83 9a10.08 10.08 0 0 1-1.49 9.21z",
                    fill: "#3d79cc",
                  }),
                  je.el("path", {
                    d:
                      "M19.56 17.65a9.29 9.29 0 0 1-7.35 3.83 1.31 1.31 0 0 1-.08-2.62 6.53 6.53 0 0 0 5-2.92 6.05 6.05 0 0 0 .67-5.51 5.32 5.32 0 0 0-1.64-2.16 5.21 5.21 0 0 0-2.48-1A5.86 5.86 0 0 0 9 8.84L10.74 11a.59.59 0 0 1-.43 1H2.7a.6.6 0 0 1-.6-.75l1.71-7.42a.59.59 0 0 1 1-.21l1.67 2.1a9.71 9.71 0 0 1 7.75-2.07 8.84 8.84 0 0 1 4.12 1.92 8.68 8.68 0 0 1 2.54 3.72 9.14 9.14 0 0 1-1.33 8.36z",
                    fill: "#fff",
                  }),
                ]),
                { id: "sb3-turnLeft" }
              ),
              je.el("path", { d: "M0 0L4 4L0 8Z", fill: "#111", id: "sb3-addInput" }),
              je.el("path", { d: "M4 0L4 8L0 4Z", fill: "#111", id: "sb3-delInput" }),
              je.setProps(
                je.group([
                  je.el("path", {
                    d:
                      "M23.3 11c-.3.6-.9 1-1.5 1h-1.6c-.1 1.3-.5 2.5-1.1 3.6-.9 1.7-2.3 3.2-4.1 4.1-1.7.9-3.6 1.2-5.5.9-1.8-.3-3.5-1.1-4.9-2.3-.7-.7-.7-1.9 0-2.6.6-.6 1.6-.7 2.3-.2H7c.9.6 1.9.9 2.9.9s1.9-.3 2.7-.9c1.1-.8 1.8-2.1 1.8-3.5h-1.5c-.9 0-1.7-.7-1.7-1.7 0-.4.2-.9.5-1.2l4.4-4.4c.7-.6 1.7-.6 2.4 0L23 9.2c.5.5.6 1.2.3 1.8z",
                    fill: "#cf8b17",
                  }),
                  je.el("path", {
                    d:
                      "M21.8 11h-2.6c0 1.5-.3 2.9-1 4.2-.8 1.6-2.1 2.8-3.7 3.6-1.5.8-3.3 1.1-4.9.8-1.6-.2-3.2-1-4.4-2.1-.4-.3-.4-.9-.1-1.2.3-.4.9-.4 1.2-.1 1 .7 2.2 1.1 3.4 1.1s2.3-.3 3.3-1c.9-.6 1.6-1.5 2-2.6.3-.9.4-1.8.2-2.8h-2.4c-.4 0-.7-.3-.7-.7 0-.2.1-.3.2-.4l4.4-4.4c.3-.3.7-.3.9 0L22 9.8c.3.3.4.6.3.9s-.3.3-.5.3z",
                    fill: "#fff",
                  }),
                ]),
                { id: "sb3-loopArrow" }
              ),
              je.setProps(
                je.group([
                  je.el("path", {
                    d:
                      "M28.456 21.675c-.009-.312-.087-.825-.256-1.702-.096-.495-.612-3.022-.753-3.73-.395-1.98-.76-3.92-1.142-6.113-.732-4.223-.693-6.05.344-6.527.502-.23 1.06-.081 1.842.35.413.227 2.181 1.365 2.07 1.296 1.993 1.243 3.463 1.775 4.928 1.549 1.527-.237 2.505-.06 2.877.618.348.635.015 1.416-.729 2.18-1.473 1.516-3.976 2.514-5.849 2.023-.822-.218-1.238-.464-2.38-1.266a9.737 9.737 0 0 0-.095-.066c.047.593.264 1.74.717 3.803.294 1.336 2.079 9.187 2.637 11.674l.002.012c.529 2.637-1.872 4.724-5.235 4.724-3.29 0-6.363-1.988-6.862-4.528-.53-2.64 1.873-4.734 5.233-4.734a8.411 8.411 0 0 1 2.65.437zM11.46 27.666c-.01-.319-.091-.84-.266-1.738-.09-.46-.595-2.937-.753-3.727-.39-1.96-.752-3.892-1.131-6.07-.732-4.224-.692-6.052.344-6.527.502-.23 1.06-.082 1.841.349.414.228 2.181 1.365 2.07 1.296 1.992 1.243 3.461 1.775 4.925 1.549 1.525-.24 2.504-.064 2.876.614.348.635.015 1.415-.728 2.18-1.474 1.517-3.977 2.513-5.847 2.017-.822-.218-1.237-.463-2.38-1.266a9.729 9.729 0 0 0-.094-.065c.047.593.264 1.74.717 3.802.294 1.337 2.078 9.19 2.636 11.675l.003.013c.517 2.638-1.884 4.732-5.234 4.732-3.286 0-6.359-1.993-6.87-4.54-.518-2.639 1.885-4.73 5.242-4.73.904 0 1.802.15 2.65.436z",
                    stroke: "#000",
                    "stroke-opacity": ".1",
                  }),
                  je.el("path", {
                    d:
                      "M32.18 25.874C32.636 28.157 30.512 30 27.433 30c-3.07 0-5.923-1.843-6.372-4.126-.458-2.285 1.665-4.136 4.743-4.136.647 0 1.283.084 1.89.234a7 7 0 0 1 .938.302c.87-.02-.104-2.294-1.835-12.229-2.134-12.303 3.06-1.87 8.768-2.753 5.708-.885.076 4.82-3.65 3.844-3.724-.987-4.65-7.153.263 14.738zm-16.998 5.99C15.63 34.148 13.507 36 10.439 36c-3.068 0-5.92-1.852-6.379-4.136-.448-2.284 1.674-4.135 4.751-4.135 1.002 0 1.974.197 2.854.544.822-.055-.15-2.377-1.862-12.228-2.133-12.303 3.059-1.87 8.764-2.753 5.706-.894.076 4.821-3.648 3.834-3.723-.987-4.648-7.152.263 14.738z",
                    fill: "#FFF",
                  }),
                ]),
                { id: "sb3-musicBlock", fill: "none" }
              ),
              je.setProps(
                je.group([
                  je.el("path", {
                    d:
                      "M8.753 34.602l-4.251 1.779 1.784-4.236c1.218-2.892 2.907-5.423 5.03-7.538L31.066 4.93c.846-.842 2.65-.41 4.032.967 1.38 1.375 1.816 3.173.97 4.015L16.318 29.59c-2.123 2.116-4.664 3.799-7.565 5.012",
                    fill: "#FFF",
                  }),
                  je.el("path", { d: "M29.41 6.111s-4.45-2.379-8.202 5.771c-1.734 3.766-4.35 1.546-4.35 1.546" }),
                  je.el("path", {
                    d:
                      "M36.42 8.825c0 .463-.14.873-.432 1.164l-9.335 9.301c.282-.29.41-.668.41-1.12 0-.874-.507-1.963-1.406-2.868-1.362-1.358-3.147-1.8-4.002-.99L30.99 5.01c.844-.84 2.65-.41 4.035.96.898.904 1.396 1.982 1.396 2.855M10.515 33.774a23.74 23.74 0 0 1-1.764.83L4.5 36.382l1.786-4.235c.258-.604.529-1.186.833-1.757.69.183 1.449.625 2.109 1.282.659.658 1.102 1.412 1.287 2.102",
                    fill: "#4C97FF",
                  }),
                  je.el("path", {
                    d:
                      "M36.498 8.748c0 .464-.141.874-.433 1.165l-19.742 19.68c-2.131 2.111-4.673 3.793-7.572 5.01L4.5 36.381l.974-2.317 1.925-.808c2.899-1.218 5.441-2.899 7.572-5.01l19.742-19.68c.292-.292.432-.702.432-1.165 0-.647-.27-1.4-.779-2.123.249.172.498.377.736.614.898.905 1.396 1.983 1.396 2.856",
                    fill: "#575E75",
                    opacity: ".15",
                  }),
                  je.el("path", { d: "M18.45 12.831a.904.904 0 1 1-1.807 0 .904.904 0 0 1 1.807 0z", fill: "#575E75" }),
                ]),
                { id: "sb3-penBlock", stroke: "#575E75", fill: "none", "stroke-linejoin": "round" }
              ),
              je.setProps(
                je.group([
                  je.el("circle", { opacity: 0.25, cx: 32, cy: 16, r: 4.5 }),
                  je.el("circle", { opacity: 0.5, cx: 32, cy: 12, r: 4.5 }),
                  je.el("circle", { opacity: 0.75, cx: 32, cy: 8, r: 4.5 }),
                  je.el("circle", { cx: 32, cy: 4, r: 4.5 }),
                  je.el("path", {
                    d:
                      "M22.672 4.42l-6.172 4V6.1c0-2.01-1.563-3.6-3.5-3.6H4.1C2.076 2.5.5 4.076.5 6.1V14c0 1.927 1.584 3.512 3.6 3.6H13c1.902 0 3.5-1.653 3.5-3.6v-2.283l6.257 3.754.097.075c.02.02.098.054.146.054.267 0 .5-.217.5-.5V4.8c0 .037-.056-.094-.129-.243-.145-.242-.43-.299-.7-.137z",
                    fill: "#4D4D4D",
                    "stroke-linejoin": "round",
                  }),
                ]),
                { id: "sb3-videoBlock", stroke: "#000", fill: "#FFF", "stroke-opacity": 0.15 }
              ),
              je.setProps(
                je.group([
                  je.el("path", {
                    d:
                      "M25.644 20.5c-1.667 1.937-4.539 3.429-5.977 3.429a1.25 1.25 0 0 1-.557-.137c-.372-.186-.61-.542-.61-1.03 0-.105.017-.207.05-.308.076-.236.624-.986.727-1.173.27-.484.462-1.075.566-1.865A8.5 8.5 0 0 1 24 3.5h4a8.5 8.5 0 1 1 0 17h-2.356z",
                    fill: "#FFF",
                  }),
                  je.el("path", {
                    d:
                      "M15.5 21.67c0-1.016-1.494-1.586-2.387-.782l-2.7 2.163A5.958 5.958 0 0 1 6.7 24.33h-.4c-1.035 0-1.8.69-1.8 1.573v4.235c0 .883.765 1.572 1.8 1.572h.4c1.458 0 2.754.423 3.82 1.287l2.598 2.161c.908.75 2.382.188 2.382-.876V21.67z",
                    fill: "#4D4D4D",
                  }),
                ]),
                { id: "sb3-ttsBlock", stroke: "#000", "stroke-opacity": 0.15 }
              ),
              je.el("image", {
                id: "sb3-translateBlock",
                width: "40px",
                height: "40px",
                href:
                  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAABTVBMVEX///8AAAAAAAAAAAAAAABqamoAAAAAAAAAAAAAAACurq7Ly8vV1dXZ2dnS0tLDw8MAAAAAAAAAAAAAAADb29vq6urz8/P6+vr////9/f319fXx8fHl5eXPz89HR0e2trbu7u7X19ekpKTe3t74+Pjn5+fg4ODi4uIAAACEhISWlpa9vb0AAAAAAADH3v/0+P8AAADHx8e41f9Rmf9WnP/p8v+Pvv9Nl/9Ynf/S5f9ho/9Smv+82P9PmP9Ml/+Rv/9uqv9mpf9coP+MvP9an/9zrf9Qmf+rzf+Dtv9op/+10/+bxP/d6/96sf9jpP+5ubkAAABrqf92r/9/tP9GieeOrtnW19mgx/96otnZ4u5Znv/q6+5XXnXV19ygpLGWmqhhZ3309fbKzNTAwsuLkKBtbW3s7OxMTEy1uMJ2fI5rcobf4eVFRUWBhperrrqQI7PpAAAAbXRSTlMADBUdJkERBQIfeLzl/9ehGA4aJP///////////8kyhf/yav//////E09ckwcK//8hrv///////////////////////////////////////0b//////////////////////////z//L/////80bccdAQAABJxJREFUeAHtmOd/qkoTgDELVhZLiKwRseuRA5Y00uT03nvvvf7/H++CmVzNsvvD+74f85ie8DCzO2EGpFOiOSWxgmRFRiiZ+r/o0plsTsUULa8UhMp0sbQqc1ktFdNSQCmnr5UNUlmvmrimJPm+pFXXsACtboVHy7hBjjDMZqvA8xVazXajQ7h0Gu3Z0TLukmMaOFvg+LJwYh5wdCGPe/1+wyAhVZw9E5lvC1dFLji6lZTSaGC3zmpw/mpTidiZtNVskBg0mhbdGcd1i6jVPMq8X4tIulhvk1i060U4ZNCc5WRgJeGcFJa0iACHo4gQtZIU4ozt/FEQ5sS2x4lF4Spm93djc2ub3Wu8KgWkLI1uzWxjyv0eVgfuglDGhGHH290jDFieFUVOn8+prKul/02IcJnMY2CLJxzte8ABfLE/YoWLVVbGMk94OPUZpodMypN2Zc5X6dX4KZ87f/6C5108H3Lgb144f/4Sk3La0nqVOZ9mOaI1HHn+ZfjiIHINJQeMkT5mU674V8MNuTb1rkcKwcjxMcK9q96NIMBd/+o2RwhG8ImFZN+7epOQW1PvfHTZgNFgfBzh3tQ/2L7t+d52pBCMOdzHNfCJC/sOrb4Df3orurDBOFbqyhh8YiFdPlrRdwlHCLiuKwFiITn0fEiYIwTiCa9d9egKHgyDbayaOgbu3ed0Q7Hw9oOrPl1Dz58+3G6ATdQNxcK9R1ep6vpodHfqe4+fPI3XDbnCm/tTqtsdEsqzzcfP43ZDnnC4STdj89aIhLx4Ersb8lrA8ODqy2tw/avoOH435DWp7dvzp166G4rbqBkrQOiGMRq9jvn7y3bDGKMIxiQmWOYPS2Lhq9eUNwIhO86JhW8D4TuOkB0458LsBv+5rPB9IHz/QSyEkRgp2Dj2NQeyfJ8Rfnwd8imGMOy2JlS02RwUo65Cn2l4NMjPsYSuDVXSaWtfqI8VfggW8B398CqOMKOtzcL7ivPfHClK+J26PgZpf48jlHEn1OmqXUpLkcIfr1//DDfmZxzheGKul7u6moXxkRH+orG9JSTI+VcMYfK3htVJa1zkXsnfzkwfoRR5QqBYQmjFEbQGmivwPoYQuiJX+AlsUIoiIfTtjCDCz9TzJ+Q1lKJI6Fg13Mc5y4kSwnXhBwn5CaXIFcI0ZcDsEyH8/m/9vYUvuUJ2OmOEEBbUz0+hkJ0fWeHfv3+/z339ly/kTrirS7cAxgfGNNMNl2pSpdrMB8b2pPBfbyphrconRgG0/G3vPBY2TtwYoaVvzBdAqj4fYkPPFZZ9dLCIO1Bxrz9zGv0e1qzU0g83FkmMbRsaSjtvjx3h45fuXHDMwAk4CWh5VdqfhA+IBs1jo4EVxIzEQKHWhw7aQkXXdSQOxUHThCozaYHxSCnNKiSinbXtAUrzjF+0NvRHbLtc45ks1IjR6NOtyXNP7nzL46+zINe0jBQJWyNdwT1JumSreqjs8P4KasQ0QNgQ/mlinFX1bnndnIwlAUmlhs3qeoUY5TU9V5JEFMetiYq130lJRKqg5MOyU3PZTFoS46wgVIIezlcmEZIHMlrh/OUpp/wDfCaVjn0YjrEAAAAASUVORK5CYII=",
              }),
              je.el("image", {
                id: "sb3-microbitBlock",
                width: "40px",
                height: "40px",
                href:
                  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAKQElEQVR4AeybBVAcSxeF4+4OwcND4hV3fB1NFuLu7i5IXLCHS9wV97cQd3d3d/e9/9wh6YI/AwOT2dqF2q46leb07e7b3/RMr2RLaIu2aIu2aIu2aIu2aIu2aIu2aIu2aIv6SuSG1I3ha5NOb9ihOJt58MyV/5di/5mr4RtSTkZtTL0Wvi59bJFZGACUbN68eWUzM7M6TY2N6zcxMmqgCvkGbVakpe+HjMxDkLn3CKPSFQchLeMALF21doWq8sA1WlhY1LY2sq7ACzwcTDA5Lkqy/MEnWehPpSwUoGBSgnDijjzbhRP+bJMsvga2soFgI/RQm2yFHh9thO77O9pIhaamptX+CqC5uXlVwbSkraywGOA5DA8DW5fRecHDZNUMjwWkyONLZyupDQWxPGeAuJ2lAW9+cIGHSRCADPBQGgqPyFogj2nWrFlNzrdvl74+1lzhEYDM8FAaDI/oBj77OQPsOsBPyhUeAcgMD6XZ8FAC9wfULVxXNQBZ4BGAzPBQf8KTDQLBiAgQjN3IoE1gP9gfbEQ9iwVAFngEIIHHJju38SBZ8RCkfq9BNP84iOcezC3PMyAL+gLiBSfAVtK/uAAk8P5aIs9TIPV9DjaOQ8FG3PfPiyHpA3Yes3BO3I3FASB/8FBSv5cgmr3vV/017l7ShvOIZmVhnYYsmnOwqAPkFx5K4n2OgvMCbJ2G5b0De82h5xeM316UAfIPD2UnnwoSahdK/d+CmLqdRfOP5pLY5wLIgr6CZOFlPGyKEEDVwyOydR4BgnFbQTglDoSTY3MJPcHI1bgTi+opTOAVG9n38QSJ1zkQe1PyOY+i63buU/kDWFzhoRyGBILr7FRw8TySvUmCPoOQPF95A0jgFUuAzkuugvOK+wQePiJ4A9it33KJKuD1GzwBho2eDiKnfsTr2X8s7Tm6DSJejz6jaM/FfSjxsE552EY87IMejlFIgLjzmOHxAbBdZ4c2qrjyp89egEePn8CUGT7Ey9x3iPaW+4YSLzY+lfai124hHtYpD9uIh33QwzEKC1D6LwM8TQd46MhxesGjxs8mXkJyGu15+awi3qYtu2gvICiSeFinPGwjHvZBD8co1CHSbxEIJu4m8FQO0FrgDlb2bmBlx6xu9t0xhjXxLtaO0MlKClYOPYjX1cY526PGIJ6tC3rUuG7EwzrlYRvxsA96OEbe8zLkL6A95vx5BogfLoJH37GwYHEoeC0NY9Qc7zAQyPpq2mHBPX8+AXazc4Ulvuvg/oNHcP8hs67duAuTZizFnaVJhwj3/HkFaOsKq4I20s8a1M1btyEtIwsUmfvh3v0H2d7tezB19gqwJgDVf4hwyl/VAK9evQ4jxs4EsXN/cJEPBe/FfvDg4SN2gOo5RLjnzwdAqetAuHTlOqzwDSYJ7IlJAntJbyC3Wq+RcOjwMXaAajxEEGBB8w8MjqLXLHMd+PCvAcqpZ83Xr99g+44YksCumEQqgV4kAfe+o1kAql8IsKD5xyek0Wvu2W/0I15uYdyFORO4efMW9fzyBrHzAHDuPhh8FrHcwuo/RAqbP65ZtYfI1es3yEP4/oOHmnuIcM+f/5cxS/3W4suAPHXtxh2YMtsXrDTrEOGeP/8vpMfBgsXh4L00jFGzvYJA6NhPw96JcM9f9W/lRH3Y38qpX1zeiqr+wwRb2WAQLziO3+dq9MdZHKR6gAhPNHsvSAI/4JdBmv9xlgYBJPDwk2ppwDsEqPEfZ6kfIAM856XX2AGq/xDRGID4oSOBhx+Du02PAadFlwhADZf6ATqMigLJwosg9j6fLa+z1N8X8Ltc7SFSjL4TKdYAtYcIR2kPkWIi9QMc1EcIkZ5NH0V5Nb20eGr7r7ai/N+22YnlsHmJ5bcz6+s+PbGm3rt54zqTNrZ+GxY3+XEgUuexIkTvWUH7oQJmt1KeWFvvxaEonWe+M1sr2XJ0dnGB/4INPp1aW/dJ6r+GHwb0FqsGYH9q4ORAg6M4YEujljX8ppv3ifZu+iW/5OJ8G31d5204GOOFXevonFxT99qMUd1YIcT7N/oRMe+fqfgTA/xf8on+hskF6RcyrwUkB+itb9KkSS3U1iWmwcFzW+YZ7yDpAafX1n23YoxR+5ZGRjUWjarX/Oz6Oq+cnF34B7h9mRlMHWHREX1sb21iUn1feMMb9mI5Y3J45Y9G17/5+9c+np6epYJnGDumBRnmCwH7nV1X5yUC+J1H++YN9RIDTL6zAEQYH3MuGOuKEIN3ecVPGmZNbQr9mI4dO1b8FV8+ZqVhpNfEjvwDVITow6rJZh7W1tZlsA0XeH5jned4CzAlJ5J1h/Mbaj/DOIxv3bp1Wf8Zlv2PRTfIFwL2u7Oz6ifcedhPLpeXHjPIstWR6AZKNoC3dlT7bk3BxouFsjQ01Dm3ofa3vOLnj+8M6UH6mVSOVXDNVI6V9qw03uo/u5VqAF7ZUvON1xgzO9wRu1ca74CsEsr8AGJ7zEqjLd2a6urPHW0quLq15tuCAITMEpAapL9X2sXAZFJ/s3an1tV9zNYP9SS2EuyP0Lkk6mxu3q2l5T/JgYZn0MsP4MfUMspoT7OZ+Kus4Dlmo5/HV/jBK0APuQz2rDSFa1tr4MJoKTNLKH/Xz66vDVmhenBsdX04EtUADkbqwFGqfiBChzH+ZUJ5OI6x0Q2oGF28zWFfuC7dnzpoICusYe5+Wdl9X1H9MGY/3acBNUY9+qKeXlcXzqyvQ9e/ppci/X7+mvML5eF8CipH6kJgPMbS3vVt1chcv+NRCf7GGMMPwCH9hHhlKVXMTk5REj6nlcN6Lr1NLkvqb5Jyt3/PKJPr7/cpzLEfUnPG4eLLwY//SgOJTSyXYwwSCwSCIvvfj6kV8pzvh4LMReb4llEWPqWVh1eJVeBDSkU4HN0A21QD8PQGE9gf1aRQAFNCWnECeGajCZzfZFhogNtWdYUD0Y3hWXx1VoDpYS0hNqA9hPqIIWKhEDJCW/IDEEvT1q0bUQCVBCC94Mpwc4dOYQBSfWtyAnh5qx5CKDTAsxuN4fp2XapekhXgje06cHGzAf0vbo5LW/QJQCuB/Cz+XpozQOw8ZrDdyZwAiQoOEMUJIFHhAOYWC0AGEYDU15sr8TfTnAFSx3u50QNaCKgH7uf/tXPWCBFDURSdEnd3Ghxa1kiPu7trh7tHx911DbybLTAV3BNPniX5kh9L/rMDqK1W54a6hzpxOWT7Dfh3AC4J7mYaLpSVakf0oDiRPinIYpo6Kcgoq9WOm6mmr4/FGrvUvvrTTIP6vlBrv5+u/87I9sxpQTZ2WJTENHNWkPVsl4c+IbtQpz9MN6gfIns33aC8z9ean0s19uvJps+syGGIix58pY4LMv6dkgh83M80KK/zdQZkryaaP5XlGsf3crUT85JL0ogpcVyYgm8swzf8XYndb0u2xpKFLWO9wgtZ+JBpOnlcmEmeFKR2RtrHhgfq6nHNa8sHOAu4WscF518f8IMNtEisFhchhBBCCCGEEEJIPvkBF5B61BH0sY4AAAAASUVORK5CYII=",
              }),
              je.setProps(
                je.group([
                  je.el("path", {
                    d: "M23.513 11.17h-.73c-.319 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479",
                    fill: "#7C87A5",
                  }),
                  je.el("path", {
                    d: "M24.91 11.17h-.73c-.319 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479z",
                  }),
                  je.el("path", {
                    d: "M9.54 11.17h-.728c-.32 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.257-.479-.577-.479",
                    fill: "#7C87A5",
                  }),
                  je.el("path", {
                    d: "M10.938 11.17h-.729c-.32 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.257-.479-.577-.479z",
                  }),
                  je.el("path", {
                    d: "M26.305 11.17h-.73c-.318 0-.574.213-.574.478v1.08h1.882v-1.08c0-.265-.26-.479-.578-.479",
                    fill: "#7C87A5",
                  }),
                  je.el("path", {
                    d: "M27.702 11.17h-.73c-.318 0-.574.213-.574.478v1.08h1.882v-1.08c0-.265-.26-.479-.578-.479z",
                  }),
                  je.el("path", {
                    d: "M29.101 11.17h-.73c-.318 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479",
                    fill: "#7C87A5",
                  }),
                  je.el("path", {
                    d: "M30.498 11.17h-.73c-.318 0-.576.213-.576.478v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479z",
                  }),
                  je.el("path", {
                    d: "M17.925 11.17h-.73c-.319 0-.577.213-.577.478v1.08h1.883v-1.08c0-.265-.258-.479-.576-.479",
                    fill: "#7C87A5",
                  }),
                  je.el("path", {
                    d: "M19.322 11.17h-.73c-.319 0-.577.213-.577.478v1.08h1.883v-1.08c0-.265-.258-.479-.576-.479z",
                  }),
                  je.el("path", {
                    d: "M20.717 11.17h-.73c-.319 0-.575.213-.575.478v1.08h1.883v-1.08c0-.265-.26-.479-.578-.479",
                    fill: "#7C87A5",
                  }),
                  je.el("path", {
                    d: "M22.114 11.17h-.73c-.319 0-.575.213-.575.478v1.08h1.883v-1.08c0-.265-.26-.479-.578-.479z",
                  }),
                  je.el("path", {
                    d: "M15.129 11.17H14.4c-.32 0-.576.213-.576.478v1.08h1.883v-1.08c0-.265-.258-.479-.578-.479",
                    fill: "#7C87A5",
                  }),
                  je.el("path", {
                    d: "M16.526 11.17h-.729c-.32 0-.576.213-.576.478v1.08h1.883v-1.08c0-.265-.258-.479-.578-.479z",
                  }),
                  je.el("path", {
                    d: "M12.335 11.17h-.73c-.319 0-.575.213-.575.478v1.08h1.882v-1.08c0-.265-.26-.479-.577-.479",
                    fill: "#7C87A5",
                  }),
                  je.el("path", {
                    d: "M13.732 11.17h-.73c-.319 0-.575.213-.575.478v1.08h1.883v-1.08c0-.265-.26-.479-.578-.479z",
                  }),
                  je.el("path", {
                    d: "M31.893 11.17h-.73c-.318 0-.574.213-.574.478v1.08h1.882v-1.08c0-.265-.26-.479-.578-.479",
                    fill: "#7C87A5",
                  }),
                  je.el("path", {
                    d: "M33.29 11.17h-.73c-.318 0-.574.213-.574.478v1.08h1.882v-1.08c0-.265-.26-.479-.578-.479z",
                  }),
                  je.el("path", {
                    d: "M33.647 28.407H15.765V12.533h17.882c.52 0 .941.445.941.992v13.89c0 .547-.421.992-.94.992",
                    fill: "#FFF",
                  }),
                  je.el("path", {
                    d: "M33.647 28.407H15.765V12.533h17.882c.52 0 .941.445.941.992v13.89c0 .547-.421.992-.94.992z",
                    stroke: "#7C87A5",
                    "stroke-width": ".893",
                  }),
                  je.el("path", {
                    d:
                      "M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V16.502c0-2.19 1.686-3.969 3.764-3.969h15.06-3.766c-2.078 0-3.764 1.778-3.764 3.969v11.905z",
                    fill: "#FFF",
                  }),
                  je.el("path", {
                    d:
                      "M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V16.502c0-2.19 1.686-3.969 3.764-3.969h15.06-3.766c-2.078 0-3.764 1.778-3.764 3.969v11.905z",
                    stroke: "#7C87A5",
                    "stroke-width": ".893",
                  }),
                  je.el("path", {
                    d:
                      "M12.941 12.533H11.06c-1.559 0-2.824 1.334-2.824 2.977v1.986c0 .547.422.992.941.992H12c.52 0 .941-.445.941-.992V15.51c0-1.643 1.265-2.977 2.824-2.977h.94-3.764z",
                    fill: "#4C97FF",
                  }),
                  je.el("path", {
                    d:
                      "M12.941 12.533H11.06c-1.559 0-2.824 1.334-2.824 2.977v1.986c0 .547.422.992.941.992H12c.52 0 .941-.445.941-.992V15.51c0-1.643 1.265-2.977 2.824-2.977h.94-3.764z",
                    stroke: "#3D79CC",
                    "stroke-width": ".893",
                  }),
                  je.el("path", { stroke: "#7C87A5", "stroke-width": ".893", d: "M4.47 20.474h27.961l2.157 2.974" }),
                  je.el("path", {
                    d:
                      "M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V16.502c0-2.19 1.686-3.969 3.764-3.969h15.06-3.766c-2.078 0-3.764 1.778-3.764 3.969v11.905z",
                    stroke: "#7C87A5",
                    "stroke-width": ".893",
                  }),
                  je.el("path", {
                    d: "M21.307 18.964h-.73c-.319 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479",
                    fill: "#7C87A5",
                  }),
                  je.el("path", {
                    d: "M21.307 18.964h-.73c-.319 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.258-.479-.576-.479z",
                  }),
                  je.el("path", {
                    d: "M24.178 18.964h-.728c-.32 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.258-.479-.578-.479",
                    fill: "#7C87A5",
                  }),
                  je.el("path", {
                    d: "M24.178 18.964h-.728c-.32 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.258-.479-.578-.479z",
                  }),
                  je.el("path", {
                    d: "M27.051 18.964h-.73c-.318 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.257-.479-.576-.479",
                    fill: "#7C87A5",
                  }),
                  je.el("path", {
                    d: "M27.051 18.964h-.73c-.318 0-.576.214-.576.479v1.08h1.882v-1.08c0-.265-.257-.479-.576-.479z",
                  }),
                  je.el("path", {
                    d: "M29.923 18.964h-.729c-.32 0-.576.214-.576.479v1.08h1.883v-1.08c0-.265-.258-.479-.578-.479",
                    fill: "#7C87A5",
                  }),
                  je.el("path", {
                    d: "M29.923 18.964h-.729c-.32 0-.576.214-.576.479v1.08h1.883v-1.08c0-.265-.258-.479-.578-.479z",
                  }),
                  je.el("path", {
                    d: "M33.647 28.407H15.765V20.47H32.43l2.157 2.978v3.966c0 .548-.421.993-.94.993",
                    fill: "#E6E7E8",
                  }),
                  je.el("path", {
                    d: "M33.647 28.407H15.765V20.47H32.43l2.157 2.978v3.966c0 .548-.421.993-.94.993z",
                    stroke: "#7C87A5",
                    "stroke-width": ".893",
                  }),
                  je.el("path", {
                    d: "M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V20.47h11.294v7.937z",
                    fill: "#E6E7E8",
                  }),
                  je.el("path", {
                    d: "M15.765 28.407H5.412c-.52 0-.941-.445-.941-.993V20.47h11.294v7.937z",
                    stroke: "#7C87A5",
                    "stroke-width": ".893",
                  }),
                  je.el("path", { fill: "#E6E7E8", d: "M19.53 24.438h11.294V20.47H19.529z" }),
                  je.el("path", {
                    stroke: "#7C87A5",
                    "stroke-width": ".893",
                    d: "M19.53 24.438h11.294V20.47H19.529zm12.902-3.964l2.157-2.794",
                  }),
                ]),
                { id: "sb3-wedoBlock", fill: "none" }
              ),
              je.setProps(
                je.group([
                  je.el("rect", {
                    stroke: "#7C87A5",
                    fill: "#FFF",
                    x: ".5",
                    y: "3.59",
                    width: "28",
                    height: "25.81",
                    rx: "1",
                  }),
                  je.el("rect", {
                    stroke: "#7C87A5",
                    fill: "#E6E7E8",
                    x: "2.5",
                    y: ".5",
                    width: "24",
                    height: "32",
                    rx: "1",
                  }),
                  je.el("path", { stroke: "#7C87A5", fill: "#FFF", d: "M2.5 14.5h24v13h-24z" }),
                  je.el("path", { d: "M14.5 10.5v4", stroke: "#7C87A5", fill: "#E6E7E8" }),
                  je.el("rect", { fill: "#414757", x: "4.5", y: "2.5", width: "20", height: "10", rx: "1" }),
                  je.el("rect", {
                    fill: "#7C87A5",
                    opacity: ".5",
                    x: "13.5",
                    y: "20.13",
                    width: "2",
                    height: "2",
                    rx: ".5",
                  }),
                  je.el("path", {
                    d:
                      "M9.06 20.13h1.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1.5a1 1 0 0 1 0-2zM19.93 22.13h-1.51a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h1.5a1 1 0 0 1 .01 2zM8.23 17.5H5a.5.5 0 0 1-.5-.5v-2.5h6l-1.85 2.78a.51.51 0 0 1-.42.22zM18.15 18.85l-.5.5a.49.49 0 0 0-.15.36V20a.5.5 0 0 1-.5.5h-.5a.5.5 0 0 1-.5-.5.5.5 0 0 0-.5-.5h-2a.5.5 0 0 0-.5.5.5.5 0 0 1-.5.5H12a.5.5 0 0 1-.5-.5v-.29a.49.49 0 0 0-.15-.36l-.5-.5a.51.51 0 0 1 0-.71l1.51-1.49a.47.47 0 0 1 .35-.15h3.58a.47.47 0 0 1 .35.15l1.51 1.49a.51.51 0 0 1 0 .71zM10.85 23.45l.5-.5a.49.49 0 0 0 .15-.36v-.29a.5.5 0 0 1 .5-.5h.5a.5.5 0 0 1 .5.5.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5.5.5 0 0 1 .5-.5h.5a.5.5 0 0 1 .5.5v.29a.49.49 0 0 0 .15.36l.5.5a.5.5 0 0 1 0 .7l-1.51 1.5a.47.47 0 0 1-.35.15h-3.58a.47.47 0 0 1-.35-.15l-1.51-1.5a.5.5 0 0 1 0-.7z",
                    fill: "#7C87A5",
                    opacity: ".5",
                  }),
                  je.el("path", { d: "M21.5 27.5h5v4a1 1 0 0 1-1 1h-4v-5z", stroke: "#CC4C23", fill: "#F15A29" }),
                ]),
                { transform: "translate(5.5 3.5)", id: "sb3-ev3Block" }
              ),
              je.setProps(
                je.group([
                  je.el("path", {
                    d: "M35 28H5a1 1 0 0 1-1-1V12c0-.6.4-1 1-1h30c.5 0 1 .4 1 1v15c0 .5-.5 1-1 1z",
                    fill: "#fff",
                  }),
                  je.el("path", {
                    fill: "red",
                    d: "M4 25h32v2.7H4zm9-1h-2.2a1 1 0 0 1-1-1v-9.7c0-.6.4-1 1-1H13c.6 0 1 .4 1 1V23c0 .6-.5 1-1 1z",
                  }),
                  je.el("path", {
                    fill: "red",
                    d: "M6.1 19.3v-2.2c0-.5.4-1 1-1h9.7c.5 0 1 .5 1 1v2.2c0 .5-.5 1-1 1H7.1a1 1 0 0 1-1-1z",
                  }),
                  je.el("circle", { fill: "red", cx: "22.8", cy: "18.2", r: "3.4" }),
                  je.el("circle", { fill: "red", cx: "30.6", cy: "18.2", r: "3.4" }),
                  je.el("path", { fill: "red", d: "M4.2 27h31.9v.7H4.2z" }),
                  je.el("circle", { fill: "#e0e0e0", cx: "22.8", cy: "18.2", r: "2.3" }),
                  je.el("circle", { fill: "#e0e0e0", cx: "30.6", cy: "18.2", r: "2.3" }),
                  je.el("path", {
                    fill: "#e0e0e0",
                    d: "M12.5 22.9h-1.2c-.3 0-.5-.2-.5-.5V14c0-.3.2-.5.5-.5h1.2c.3 0 .5.2.5.5v8.4c0 .3-.2.5-.5.5z",
                  }),
                  je.el("path", {
                    fill: "#e0e0e0",
                    d:
                      "M7.2 18.7v-1.2c0-.3.2-.5.5-.5h8.4c.3 0 .5.2.5.5v1.2c0 .3-.2.5-.5.5H7.7c-.3 0-.5-.2-.5-.5zM4 26h32v2H4z",
                  }),
                  je.el("path", {
                    stroke: "#666",
                    "stroke-width": ".5",
                    d: "M35.2 27.9H4.8a1 1 0 0 1-1-1V12.1c0-.6.5-1 1-1h30.5c.5 0 1 .4 1 1V27a1 1 0 0 1-1.1.9z",
                  }),
                  je.el("path", {
                    stroke: "#666",
                    "stroke-width": ".5",
                    d: "M35.2 27.9H4.8a1 1 0 0 1-1-1V12.1c0-.6.5-1 1-1h30.5c.5 0 1 .4 1 1V27a1 1 0 0 1-1.1.9z",
                  }),
                ]),
                { id: "sb3-makeymakeyBlock", fill: "none" }
              ),
            ];
          },
          makeStyle: function () {
            var e = je.el("style");
            return e.appendChild(je.cdata(t.cssContent)), e;
          },
          defaultFont: "500 12pt Helevetica Neue, Helvetica, sans-serif",
          commentFont: "400 12pt Helevetica Neue, Helvetica, sans-serif",
        });
      })),
    Ue = (_e.cssContent, _e.makeIcons, _e.makeStyle, _e.defaultFont, _e.commentFont, ue.Label),
    Ye = ue.Icon,
    Ke = ue.Input,
    We = ue.Block,
    Xe = ue.Comment,
    Ze = ue.Glow,
    qe = ue.Script,
    Qe = ue.Document,
    Je = _e.defaultFont,
    $e = _e.commentFont,
    et = _e.makeStyle,
    tt = _e.makeIcons,
    it = function (e) {
      n(this, e), (this.el = null), (this.height = 12), (this.metrics = null), (this.x = 0);
    };
  (it.prototype.isLabel = !0),
    (it.prototype.draw = function () {
      return this.el;
    }),
    Object.defineProperty(it.prototype, "width", {
      get: function () {
        return this.metrics.width;
      },
    }),
    (it.metricsCache = {}),
    (it.toMeasure = []),
    (it.prototype.measure = function () {
      var e = this.value,
        t = "sb3-" + this.cls;
      this.el = je.text(0, 13, e, { class: "sb3-label " + t });
      var i = it.metricsCache[t];
      if ((i || (i = it.metricsCache[t] = Object.create(null)), Object.hasOwnProperty.call(i, e))) this.metrics = i[e];
      else {
        var n = /comment-label/.test(this.cls) ? $e : Je;
        this.metrics = i[e] = it.measure(e, n);
      }
    }),
    (it.measure = function (e, t) {
      var i = it.measuring;
      return (i.font = t), { width: 0 | (i.measureText(e).width + 0.5) };
    });
  var nt = function e(t) {
    n(this, t);
    var i = e.icons[this.name];
    if (!i) throw new Error("no info for icon: " + this.name);
    n(this, i);
  };
  (nt.prototype.isIcon = !0),
    (nt.prototype.draw = function () {
      return je.symbol("#sb3-" + this.name, { width: this.width, height: this.height });
    }),
    (nt.icons = {
      greenFlag: { width: 20, height: 21, dy: -2 },
      turnLeft: { width: 24, height: 24 },
      turnRight: { width: 24, height: 24 },
      loopArrow: { width: 24, height: 24 },
      addInput: { width: 4, height: 8 },
      delInput: { width: 4, height: 8 },
      musicBlock: { width: 40, height: 40 },
      penBlock: { width: 40, height: 40 },
      videoBlock: { width: 40, height: 40, dy: 10 },
      ttsBlock: { width: 40, height: 40 },
      translateBlock: { width: 40, height: 40 },
      wedoBlock: { width: 40, height: 40 },
      ev3Block: { width: 40, height: 40 },
      microbitBlock: { width: 40, height: 40 },
      makeymakeyBlock: { width: 40, height: 40 },
    });
  var st = function () {
    (this.width = 1), (this.height = 40), (this.x = 0);
  };
  (st.prototype.isLine = !0),
    (st.prototype.measure = function () {}),
    (st.prototype.draw = function (e) {
      var t = e.info.category;
      return je.el("line", { class: "sb3-" + t + "-line", "stroke-linecap": "round", x1: 0, y1: 0, x2: 0, y2: 40 });
    });
  var rt = function (e) {
    n(this, e),
      e.label && (this.label = pt(e.label)),
      (this.isBoolean = "boolean" === this.shape),
      (this.isDropdown = "dropdown" === this.shape),
      (this.isRound = !(this.isBoolean || this.isDropdown)),
      (this.x = 0);
  };
  (rt.prototype.isInput = !0),
    (rt.prototype.measure = function () {
      this.hasLabel && this.label.measure();
    }),
    (rt.shapes = {
      string: je.pillRect,
      number: je.pillRect,
      "number-dropdown": je.pillRect,
      color: je.pillRect,
      dropdown: je.roundRect,
      boolean: je.pointedRect,
      stack: je.stackRect,
      reporter: je.pillRect,
    }),
    (rt.prototype.draw = function (e) {
      if (this.isBoolean) var t = 48;
      else if (this.isColor) t = 40;
      else if (this.hasLabel) {
        var i = this.label.draw(),
          n = 18 <= this.label.width ? 11 : (40 - this.label.width) / 2;
        t = this.label.width + 2 * n;
        i = je.move(n, 9, i);
      } else t = this.isInset ? 30 : null;
      this.hasArrow && (t += 20), (this.width = t);
      var s = (this.height = 32),
        r = rt.shapes[this.shape](t, s);
      je.setProps(r, {
        class: [this.isColor ? "" : "sb3-" + e.info.category, "sb3-input", "sb3-input-" + this.shape].join(" "),
      }),
        this.isColor
          ? je.setProps(r, { fill: this.value })
          : "dropdown" === this.shape
          ? e.info.color && je.setProps(r, { fill: e.info.color, stroke: "rgba(0, 0, 0, 0.2)" })
          : "number-dropdown" === this.shape
          ? (r.classList.add("sb3-" + e.info.category + "-alt"),
            e.info.color && je.setProps(r, { fill: "rgba(0, 0, 0, 0.1)", stroke: "rgba(0, 0, 0, 0.15)" }))
          : "boolean" === this.shape &&
            (r.classList.remove("sb3-" + e.info.category),
            r.classList.add("sb3-" + e.info.category + "-dark"),
            e.info.color && je.setProps(r, { fill: "rgba(0, 0, 0, 0.15)" }));
      var o = je.group([r]);
      return (
        this.hasLabel && o.appendChild(i),
        this.hasArrow && o.appendChild(je.move(t - 24, 13, je.symbol("#sb3-dropdownArrow", {}))),
        o
      );
    });
  var ot = function (e) {
    switch (
      (n(this, e),
      (this.children = e.children.map(pt)),
      (this.comment = this.comment ? pt(this.comment) : null),
      (this.isRound = this.isReporter),
      (this.info = n({}, e.info)),
      this.info.category)
    ) {
      case "music":
        this.children.unshift(new st()),
          this.children.unshift(new nt({ name: "musicBlock" })),
          (this.info.category = "extension");
        break;
      case "pen":
        this.children.unshift(new st()),
          this.children.unshift(new nt({ name: "penBlock" })),
          (this.info.category = "extension");
        break;
      case "video":
        this.children.unshift(new st()),
          this.children.unshift(new nt({ name: "videoBlock" })),
          (this.info.category = "extension");
        break;
      case "tts":
      case "translate":
      case "wedo":
      case "ev3":
      case "microbit":
      case "makeymakey":
        this.children.unshift(new st()),
          this.children.unshift(new nt({ name: this.info.category + "Block" })),
          (this.info.category = "extension");
    }
    (this.x = 0), (this.width = null), (this.height = null), (this.firstLine = null), (this.innerWidth = null);
  };
  (ot.prototype.isBlock = !0),
    (ot.prototype.measure = function () {
      for (var e, t = 0; t < this.children.length; t++) (e = this.children[t]).measure && e.measure();
      this.comment && this.comment.measure();
    }),
    (ot.shapes = {
      stack: je.stackRect,
      "c-block": je.stackRect,
      "if-block": je.stackRect,
      celse: je.stackRect,
      cend: je.stackRect,
      cap: je.capRect,
      reporter: je.pillRect,
      boolean: je.pointedRect,
      hat: je.hatRect,
      cat: je.catHat,
      "define-hat": je.procHatRect,
      ring: je.pillRect,
    }),
    (ot.prototype.drawSelf = function (e, t, i) {
      if (1 < i.length) return je.mouthRect(e, t, this.isFinal, i, { class: ["sb3-" + this.info.category].join(" ") });
      if ("outline" === this.info.shape)
        return je.setProps(je.stackRect(e, t), {
          class: ["sb3-" + this.info.category, "sb3-" + this.info.category + "-alt"].join(" "),
        });
      if (this.isRing) {
        var n = this.children[0];
        if (n && (n.isInput || n.isBlock || n.isScript))
          return (
            n.isScript || (n.isInput ? n.shape : n.info.shape),
            je.roundRect(e, t, { class: ["sb3-" + this.info.category].join(" ") })
          );
      }
      var s = ot.shapes[this.info.shape];
      if (!s) throw new Error("no shape func: " + this.info.shape);
      return s(e, t, { class: ["sb3-" + this.info.category].join(" ") });
    }),
    (ot.padding = { hat: [24, 8], cat: [24, 8], "define-hat": [20, 16], null: [4, 4] }),
    (ot.prototype.horizontalPadding = function (e) {
      if (this.isRound) {
        if (e.isIcon) return 16;
        if (e.isLabel) return 12;
        if (e.isDropdown) return 12;
        if (e.isBoolean) return 12;
        if (e.isRound) return 4;
      } else if (this.isBoolean) {
        if (e.isIcon) return 24;
        if (e.isLabel) return 20;
        if (e.isDropdown) return 20;
        if (e.isRound && e.isBlock) return 24;
        if (e.isRound) return 20;
        if (e.isBoolean) return 8;
      }
      return 8;
    }),
    (ot.prototype.marginBetween = function (e, t) {
      return e.isLabel && t.isLabel ? 5 : 8;
    }),
    (ot.prototype.draw = function () {
      function e() {
        0 === v.length ? (p.height += o + a) : ((p.height -= 11), (p.y -= 2)), (L += p.height), v.push(p);
      }
      var i = "define-hat" === this.info.shape,
        n = this.children,
        s = this.isCommand,
        r = ot.padding[this.info.shape] || ot.padding.null,
        o = r[0],
        a = r[1],
        c = function (e) {
          (this.y = e), (this.width = 0), (this.height = s ? 40 : 32), (this.children = []);
        },
        l = 0,
        h = 0,
        p = new c((L = "cat" === this.info.shape ? 16 : 0));
      if (this.info.isRTL) {
        for (
          var u = 0,
            f = function () {
              n = n.slice(0, u).concat(n.slice(u, d).reverse()).concat(n.slice(d));
            }.bind(this),
            d = 0;
          d < n.length;
          d++
        )
          n[d].isScript && (f(), (u = d + 1));
        u < d && f();
      }
      var g,
        m,
        v = [];
      for (d = 0; d < n.length; d++)
        if ((((A = n[d]).el = A.draw(this)), A.isScript && this.isCommand))
          (this.hasScript = !0),
            e(),
            (A.y = L - 1),
            v.push(A),
            (h = t(h, t(1, A.width))),
            (A.height = t(29, A.height + 3) - 2),
            (L += A.height),
            (p = new c(L)),
            (g = null);
        else if (A.isArrow) p.children.push(A), (g = A);
        else {
          v.length || (m = A), g && (p.width += this.marginBetween(g, A));
          var b = 48 - this.horizontalPadding(n[0]);
          (this.isCommand || this.isOutline) && !A.isLabel && !A.isIcon && p.width < b && (p.width = b),
            A.isIcon && 0 === d && this.isCommand && (p.height = t(p.height, A.height + 8)),
            (A.x = p.width),
            (p.width += A.width),
            (l = t(l, p.width)),
            A.isLabel || (p.height = t(p.height, A.height)),
            p.children.push(A),
            (g = A);
        }
      e();
      var y = n.length ? this.horizontalPadding(n[0]) : 0,
        w = (l += y + (n.length ? this.horizontalPadding(m) : 0));
      (l = t(
        this.hasScript ? 160 : this.isHat ? 108 : this.isCommand || this.isOutline ? 64 : this.isReporter ? 48 : 0,
        l
      )),
        this.isReporter && (y += (l - w) / 2),
        (this.height = L),
        (this.width = h ? t(l, 15 + h) : l),
        (this.firstLine = v[0]),
        (this.innerWidth = l);
      var k = [];
      for (d = 0; d < v.length; d++)
        if ((p = v[d]).isScript) k.push(je.move(16, p.y, p.el));
        else
          for (var A, O = p.height, S = 0; S < p.children.length; S++)
            if ((A = p.children[S]).isArrow) k.push(je.move(l - 32, this.height - 28, A.el));
            else {
              var L = o + (O - A.height - o - a) / 2;
              A.isLabel && 0 === d
                ? (L -= 1)
                : i && A.isLabel
                ? (L += 3)
                : A.isIcon && ((L += 0 | A.dy), this.isCommand && 0 === d && 0 === S && (L += 4));
              var E = y + A.x;
              A.dx && (E += A.dx), k.push(je.move(E, 0 | (p.y + L), A.el));
            }
      var R = this.drawSelf(l, this.height, v);
      return (
        k.splice(0, 0, R),
        this.info.color && je.setProps(R, { fill: this.info.color, stroke: "rgba(0, 0, 0, 0.2)" }),
        je.group(k)
      );
    });
  var at = function (e) {
    n(this, e), (this.label = pt(e.label)), (this.width = null);
  };
  (at.prototype.isComment = !0),
    (at.lineLength = 12),
    (at.prototype.height = 20),
    (at.prototype.measure = function () {
      this.label.measure();
    }),
    (at.prototype.draw = function () {
      var e = this.label.draw();
      return (
        (this.width = this.label.width + 16),
        je.group([
          je.commentLine(this.hasBlock ? at.lineLength : 0, 6),
          je.commentRect(this.width, this.height, { class: "sb3-comment" }),
          je.move(8, 4, e),
        ])
      );
    });
  var ct = function (e) {
    n(this, e), (this.child = pt(e.child)), (this.width = null), (this.height = null), (this.y = 0);
  };
  (ct.prototype.isGlow = !0),
    (ct.prototype.measure = function () {
      this.child.measure();
    }),
    (ct.prototype.drawSelf = function () {
      var e = this.child,
        t = this.width,
        i = this.height - 1;
      if (e.isScript)
        n = !e.isEmpty && e.blocks[0].isHat ? je.hatRect(t, i) : e.isFinal ? je.capRect(t, i) : je.stackRect(t, i);
      else var n = e.drawSelf(t, i, []);
      return je.setProps(n, { class: "sb3-diff sb3-diff-ins" });
    }),
    (ct.prototype.draw = function () {
      var e = this.child,
        t = e.isScript ? e.draw(!0) : e.draw();
      return (
        (this.width = e.width),
        (this.height = (e.isBlock && e.firstLine.height) || e.height),
        je.group([t, this.drawSelf()])
      );
    });
  var lt = function (e) {
    n(this, e), (this.blocks = e.blocks.map(pt)), (this.y = 0);
  };
  (lt.prototype.isScript = !0),
    (lt.prototype.measure = function () {
      for (var e = 0; e < this.blocks.length; e++) this.blocks[e].measure();
    }),
    (lt.prototype.draw = function (e) {
      var i = [],
        n = 1;
      this.width = 0;
      for (var s = 0; s < this.blocks.length; s++) {
        var r = this.blocks[s],
          o = e ? 0 : 2,
          a = r.draw();
        if ((i.push(je.move(o, n, a)), (this.width = t(this.width, r.width)), "-" === r.diff)) {
          var c = r.width,
            l = r.firstLine.height || r.height;
          i.push(je.move(o, n + l / 2 + 1, je.strikethroughLine(c))), (this.width = t(this.width, r.width));
        }
        n += r.height;
        var h = r.comment;
        if (h) {
          var p = r.firstLine,
            u = r.innerWidth + 2 + at.lineLength,
            f = n - r.height + p.height / 2,
            d = h.draw();
          i.push(je.move(u, f - h.height / 2, d)), (this.width = t(this.width, u + h.width));
        }
      }
      return (
        (this.height = n + 1),
        e || this.isFinal || (this.height += r.hasPuzzle ? 44 : 36),
        !e && r.isGlow && (this.height += 2),
        je.group(i)
      );
    });
  var ht = function (e) {
    n(this, e),
      (this.scripts = e.scripts.map(pt)),
      (this.width = null),
      (this.height = null),
      (this.el = null),
      (this.defs = null);
  };
  (ht.prototype.measure = function () {
    this.scripts.forEach(function (e) {
      e.measure();
    });
  }),
    (ht.prototype.render = function () {
      if ("function" == typeof ocbptions) throw new Error("render() no longer takes a callback");
      this.measure();
      for (var e, i = 0, n = 0, s = [], r = 0; r < this.scripts.length; r++)
        n && (n += 10),
          ((e = this.scripts[r]).y = n),
          s.push(je.move(0, n, e.draw())),
          (n += e.height),
          (i = t(i, e.width + 4));
      (this.width = i), (this.height = n);
      var o = je.newSVG(i, n);
      return (
        o.appendChild((this.defs = je.withChildren(je.el("defs"), tt()))), o.appendChild(je.group(s)), (this.el = o), o
      );
    }),
    (ht.prototype.exportSVGString = function () {
      if (null == this.el) throw new Error("call draw() first");
      var e = et();
      this.defs.appendChild(e);
      var t = new je.XMLSerializer().serializeToString(this.el);
      return this.defs.removeChild(e), t;
    }),
    (ht.prototype.exportSVG = function () {
      return "data:image/svg+xml;utf8," + this.exportSVGString().replace(/[#]/g, encodeURIComponent);
    }),
    (ht.prototype.toCanvas = function (e, t) {
      t = t || 1;
      var i = je.makeCanvas();
      (i.width = this.width * t), (i.height = this.height * t);
      var n = i.getContext("2d"),
        s = new Image();
      (s.src = this.exportSVG()),
        (s.onload = function () {
          n.save(), n.scale(t, t), n.drawImage(s, 0, 0), n.restore(), e(i);
        });
    }),
    (ht.prototype.exportPNG = function (e, t) {
      this.toCanvas(function (t) {
        URL && URL.createObjectURL && Blob && t.toBlob
          ? t.toBlob(function (t) {
              e(URL.createObjectURL(t));
            }, "image/png")
          : e(t.toDataURL("image/png"));
      }, t);
    });
  var pt = function (e) {
      return new ((function (e) {
        switch (e.constructor) {
          case Ue:
            return it;
          case Ye:
            return nt;
          case Ke:
            return rt;
          case We:
            return ot;
          case Xe:
            return at;
          case Ze:
            return ct;
          case qe:
            return lt;
          case Qe:
            return ht;
          default:
            throw new Error("no view for " + e.constructor.name);
        }
      })(e))(e);
    },
    ut = { newView: pt, LabelView: it },
    ft = {
      init: function (e) {
        je.init(e), (ut.LabelView.measuring = je.makeCanvas().getContext("2d"));
      },
      newView: ut.newView,
      makeStyle: _e.makeStyle,
    },
    dt = function (e) {
      function t(e, t) {
        return c.parse(e, t);
      }
      function i(e, t) {
        switch ((t = n({ style: "scratch3" }, t)).style) {
          case "scratch2":
            return b.newView(e);
          case "scratch3":
            return y.newView(e);
          default:
            throw new Error("Unknown style: " + t.style);
        }
      }
      function s(e, t) {
        if ("function" == typeof t) throw new Error("render() no longer takes a callback");
        return i(e, t).render();
      }
      function r(e, t) {
        t = n({ inline: !1 }, t);
        var i = e.innerHTML.replace(/<br>\s?|\n|\r\n|\r/gi, "\n"),
          s = a.createElement("pre");
        s.innerHTML = i;
        var r = s.textContent;
        return t.inline && (r = r.replace("\n", "")), r;
      }
      function o(e, t, i, n) {
        if (n.inline) {
          var s = a.createElement("span"),
            r = "scratchblocks scratchblocks-inline";
          i.scripts[0] && !i.scripts[0].isEmpty && (r += " scratchblocks-inline-" + i.scripts[0].blocks[0].shape),
            (s.className = r),
            (s.style.display = "inline-block"),
            (s.style.verticalAlign = "middle");
        } else {
          (s = a.createElement("div")).className = "scratchblocks";
        }
        s.appendChild(t), (e.innerHTML = ""), e.appendChild(s);
      }
      var a = e.document,
        c = ue,
        l = c.allLanguages,
        h = c.loadLanguages,
        p = c.Label,
        u = c.Icon,
        f = c.Input,
        d = c.Block,
        g = c.Comment,
        m = c.Script,
        v = c.Document,
        b = Ve;
      b.init(e);
      var y = ft;
      y.init(e);
      return {
        allLanguages: l,
        loadLanguages: h,
        stringify: function (e) {
          return e.stringify();
        },
        Label: p,
        Icon: u,
        Input: f,
        Block: d,
        Comment: g,
        Script: m,
        Document: v,
        newView: i,
        read: r,
        parse: t,
        replace: o,
        render: s,
        renderMatching: function (e, i) {
          (e = e || "pre.blocks"),
            (i = n({ style: "scratch3", inline: !1, languages: ["en"], read: r, parse: t, render: s, replace: o }, i));
          [].slice.apply(a.querySelectorAll(e)).forEach(function (e) {
            var t = i.read(e, i),
              n = i.parse(t, i),
              s = i.render(n, i);
            i.replace(e, s, n, i);
          });
        },
        appendStyles: function () {
          a.head.appendChild(b.makeStyle()), a.head.appendChild(y.makeStyle());
        },
      };
    };
  return i(function (e) {
    (window.scratchblocks = e.exports = dt(window)).appendStyles();
  });
})();
//# sourceMappingURL=scratchblocks.min.js.map
