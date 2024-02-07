var b = Object.defineProperty;
var j = (t, n, e) => n in t ? b(t, n, { enumerable: !0, configurable: !0, writable: !0, value: e }) : t[n] = e;
var h = (t, n, e) => (j(t, typeof n != "symbol" ? n + "" : n, e), e);
function H(t, n = !1) {
  if (t == null)
    throw new Error("Cannot clean a NULL value");
  return Array.isArray(t) ? t = t.filter((e) => e != null) : Object.entries(t).forEach(([e, o]) => {
    (o === void 0 || n || o === null) && delete t[e];
  }), t;
}
function J(t) {
  return JSON.parse(JSON.stringify(t));
}
function x(t, n, e) {
  if (!(t == null || !n))
    return n.split(/[.[\]]/g).filter((o) => o.length).reduce((o, r, s, c) => {
      if ((r[0] == '"' || r[0] == "'") && (r = r.slice(1, -1)), !(o != null && o.hasOwnProperty(r))) {
        if (e == null)
          return;
        o[r] = {};
      }
      return e !== void 0 && s == c.length - 1 ? o[r] = e : o[r];
    }, t);
}
function S(t, n, e = !1) {
  if (t == null)
    return e;
  if (Array.isArray(n))
    return n.findIndex((r, s) => !S(t[s], n[s], e)) == -1;
  const o = typeof n;
  return o != typeof t ? !1 : o == "object" ? Object.keys(n).find((r) => !S(t[r], n[r], e)) == null : o == "function" ? t.toString() == n.toString() : t == n;
}
function w(t, n) {
  const e = typeof t, o = typeof n;
  return e != "object" || t == null || o != "object" || n == null ? e == "function" && o == "function" ? t.toString() == n.toString() : t === n : Object.keys(t).length != Object.keys(n).length ? !1 : Object.keys(t).every((s) => w(t[s], n[s]));
}
function K(t, n) {
  return t.indexOf(n) === -1 && t.push(n), t;
}
function Z(t, n) {
  return M([
    ...t.filter((e) => !n.includes((o) => w(e, o))),
    ...n.filter((e) => !t.includes((o) => w(e, o)))
  ]);
}
function F(t) {
  return function(n, e) {
    const o = x(n, t), r = x(e, t);
    return typeof o != "string" || typeof r != "string" ? 1 : o.toLowerCase().localeCompare(r.toLowerCase());
  };
}
function U(t, n = []) {
  return t.forEach((e) => Array.isArray(e) ? U(e, n) : n.push(e)), n;
}
function Q(t, n = !1) {
  return function(e, o) {
    const r = x(e, t), s = x(o, t);
    return typeof r == "number" && typeof s == "number" ? (n ? -1 : 1) * (r - s) : r > s ? n ? -1 : 1 : r < s ? n ? 1 : -1 : 0;
  };
}
function X(t, n) {
  return (e) => w(e[t], n);
}
function M(t) {
  for (let n = t.length - 1; n >= 0; n--)
    t.slice(0, n).find((e) => w(e, t[n])) && t.splice(n, 1);
  return t;
}
function _(t) {
  return Array.isArray(t) ? t : [t];
}
class tt {
  constructor() {
    h(this, "listeners", {});
  }
  emit(n) {
    Object.values(this.listeners).forEach((e) => e(n));
  }
  listen(n, e) {
    const o = e || n, r = typeof n == "string" ? n : `_${Object.keys(this.listeners).length.toString()}`;
    return this.listeners[r] = o, () => delete this.listeners[r];
  }
  once(n) {
    const e = this.listen((o) => {
      n(o), e();
    });
  }
}
const f = class f {
  constructor(n, e = {}) {
    h(this, "interceptors", {});
    this.baseUrl = n, this.headers = e;
  }
  static addInterceptor(n, e) {
    const o = e || n, r = typeof n == "string" ? n : `_${Object.keys(f.interceptors).length.toString()}`;
    return f.interceptors[r] = o, () => delete f.interceptors[r];
  }
  addInterceptor(n, e) {
    const o = e || n, r = typeof n == "string" ? n : `_${Object.keys(this.interceptors).length.toString()}`;
    return this.interceptors[r] = o, () => delete this.interceptors[r];
  }
  getInterceptors() {
    return [...Object.values(f.interceptors), ...Object.values(this.interceptors)];
  }
  fetch(n, e, o = {}) {
    const r = {
      "Content-Type": e && !(e instanceof FormData) ? "application/json" : void 0,
      ...f.headers,
      ...this.headers,
      ...o.headers
    };
    return Object.keys(r).forEach((s) => {
      r[s] || delete r[s];
    }), fetch(`${this.baseUrl}${n || ""}`.replace(/([^:]\/)\/+/g, "$1"), {
      headers: r,
      method: o.method || (e ? "POST" : "GET"),
      body: r["Content-Type"].startsWith("application/json") && e ? JSON.stringify(e) : e
    }).then(async (s) => {
      for (let c of this.getInterceptors())
        await new Promise((d) => c(s, () => d(null)));
      return s.headers["Content-Type"] && s.headers.get("Content-Type").startsWith("application/json") ? await s.json() : s.headers["Content-Type"] && s.headers.get("Content-Type").startsWith("text/plain") ? await s.text() : s;
    });
  }
  delete(n, e) {
    return this.fetch(n, null, { method: "delete", ...e });
  }
  get(n, e) {
    return this.fetch(n, null, { method: "get", ...e });
  }
  patch(n, e, o) {
    return this.fetch(e, n, { method: "patch", ...o });
  }
  post(n, e, o) {
    return this.fetch(e, n, { method: "post", ...o });
  }
  put(n, e, o) {
    return this.fetch(e, n, { method: "put", ...o });
  }
  new(n, e) {
    const o = new f(`${this.baseUrl}${n}`, {
      ...this.headers,
      ...e
    });
    return Object.entries(this.interceptors).map(([r, s]) => o.addInterceptor(r, s)), o;
  }
};
h(f, "interceptors", {}), h(f, "headers", {});
let C = f;
C.addInterceptor((t, n) => {
  if (t.status == 200)
    return n();
  throw t.status == 400 ? new R(t.statusText) : t.status == 401 ? new I(t.statusText) : t.status == 403 ? new N(t.statusText) : t.status == 404 ? new $(t.statusText) : t.status == 500 ? new O(t.statusText) : new p(t.statusText, t.status);
});
class p extends Error {
  constructor(e, o) {
    super(e);
    h(this, "_code");
    o != null && (this._code = o);
  }
  get code() {
    return this._code || this.constructor.code;
  }
  set code(e) {
    this._code = e;
  }
  static from(e) {
    const o = Number(e.statusCode) ?? Number(e.code), r = new this(e.message || e.toString());
    return Object.assign(r, {
      stack: e.stack,
      ...e,
      code: o ?? void 0
    });
  }
  static instanceof(e) {
    return e.constructor.code != null;
  }
  toString() {
    return this.message || super.toString();
  }
}
h(p, "code", 500);
class R extends p {
  constructor(n = "Bad Request") {
    super(n);
  }
  static instanceof(n) {
    return n.constructor.code == this.code;
  }
}
h(R, "code", 400);
class I extends p {
  constructor(n = "Unauthorized") {
    super(n);
  }
  static instanceof(n) {
    return n.constructor.code == this.code;
  }
}
h(I, "code", 401);
class N extends p {
  constructor(n = "Forbidden") {
    super(n);
  }
  static instanceof(n) {
    return n.constructor.code == this.code;
  }
}
h(N, "code", 403);
class $ extends p {
  constructor(n = "Not Found") {
    super(n);
  }
  static instanceof(n) {
    return n.constructor.code == this.code;
  }
}
h($, "code", 404);
class O extends p {
  constructor(n = "Internal Server Error") {
    super(n);
  }
  static instanceof(n) {
    return n.constructor.code == this.code;
  }
}
h(O, "code", 500);
const E = {
  CLEAR: "\x1B[0m",
  BRIGHT: "\x1B[1m",
  DIM: "\x1B[2m",
  UNDERSCORE: "\x1B[4m",
  BLINK: "\x1B[5m",
  REVERSE: "\x1B[7m",
  HIDDEN: "\x1B[8m"
}, y = {
  BLACK: "\x1B[30m",
  RED: "\x1B[31m",
  GREEN: "\x1B[32m",
  YELLOW: "\x1B[33m",
  BLUE: "\x1B[34m",
  MAGENTA: "\x1B[35m",
  CYAN: "\x1B[36m",
  WHITE: "\x1B[37m",
  GREY: "\x1B[90m"
}, et = {
  BLACK: "\x1B[40m",
  RED: "\x1B[41m",
  GREEN: "\x1B[42m",
  YELLOW: "\x1B[43m",
  BLUE: "\x1B[44m",
  MAGENTA: "\x1B[45m",
  CYAN: "\x1B[46m",
  WHITE: "\x1B[47m",
  GREY: "\x1B[100m"
};
class nt {
  constructor(n) {
    this.namespace = n;
  }
  format(...n) {
    return `${(/* @__PURE__ */ new Date()).toISOString()} [${this.namespace}] ${n.join(" ")}`;
  }
  debug(...n) {
    console.log(y.MAGENTA + this.format(...n) + E.CLEAR);
  }
  error(...n) {
    console.log(y.RED + this.format(...n) + E.CLEAR);
  }
  info(...n) {
    console.log(y.CYAN + this.format(...n) + E.CLEAR);
  }
  log(...n) {
    console.log(E.CLEAR + this.format(...n));
  }
  warn(...n) {
    console.log(y.YELLOW + this.format(...n) + E.CLEAR);
  }
  verbose(...n) {
    console.log(y.WHITE + this.format(...n) + E.CLEAR);
  }
}
function ot(t, n) {
  return t.length - t.replaceAll(n, "").length;
}
function rt(t) {
  return Array(t).fill(null).map(() => Math.round(Math.random() * 15).toString(16)).join("");
}
const T = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", m = "0123456789", L = "~`!@#$%^&*()_-+={[}]|\\:;\"'<,>.?/", k = T + m + L;
function st(t) {
  const n = /(\+?1)?.*?(\d{3}).*?(\d{3}).*?(\d{4})/g.exec(t);
  if (!n)
    throw new Error(`Number cannot be parsed: ${t}`);
  return `${n[1] ?? ""} (${n[2]}) ${n[3]}-${n[4]}`.trim();
}
function ct(t, n, e) {
  return `${t.slice(0, e)}${n}${t.slice(e + 1)}`;
}
function it(t, n = k) {
  return Array(t).fill(null).map(() => {
    const e = ~~(Math.random() * n.length);
    return n[e];
  }).join("");
}
function ut(t, n = !1, e = !1, o = !1) {
  if (!n && !e && !o)
    throw new Error("Must enable at least one: letters, numbers, symbols");
  return Array(t).fill(null).map(() => {
    let r;
    do {
      const s = ~~(Math.random() * 3);
      n && s == 0 ? r = T[~~(Math.random() * T.length)] : e && s == 1 ? r = m[~~(Math.random() * m.length)] : o && s == 2 && (r = L[~~(Math.random() * L.length)]);
    } while (!r);
    return r;
  }).join("");
}
function at(t, n) {
  if (typeof n == "string" && (n = new RegExp(n, "g")), !n.global)
    throw new TypeError("Regular expression must be global.");
  let e = [], o;
  for (; (o = n.exec(t)) !== null; )
    e.push(o);
  return e;
}
function Y(t) {
  var n = q(W(P(G(t), 8 * t.length)));
  return n.toLowerCase();
}
function q(t) {
  for (var n, e = "0123456789ABCDEF", o = "", r = 0; r < t.length; r++)
    n = t.charCodeAt(r), o += e.charAt(n >>> 4 & 15) + e.charAt(15 & n);
  return o;
}
function G(t) {
  for (var n = Array(t.length >> 2), e = 0; e < n.length; e++)
    n[e] = 0;
  for (e = 0; e < 8 * t.length; e += 8)
    n[e >> 5] |= (255 & t.charCodeAt(e / 8)) << e % 32;
  return n;
}
function W(t) {
  for (var n = "", e = 0; e < 32 * t.length; e += 8)
    n += String.fromCharCode(t[e >> 5] >>> e % 32 & 255);
  return n;
}
function P(t, n) {
  t[n >> 5] |= 128 << n % 32, t[14 + (n + 64 >>> 9 << 4)] = n;
  for (var e = 1732584193, o = -271733879, r = -1732584194, s = 271733878, c = 0; c < t.length; c += 16) {
    var A = e, d = o, v = r, D = s;
    o = l(o = l(o = l(o = l(o = a(o = a(o = a(o = a(o = u(o = u(o = u(o = u(o = i(o = i(o = i(o = i(o, r = i(r, s = i(s, e = i(e, o, r, s, t[c + 0], 7, -680876936), o, r, t[c + 1], 12, -389564586), e, o, t[c + 2], 17, 606105819), s, e, t[c + 3], 22, -1044525330), r = i(r, s = i(s, e = i(e, o, r, s, t[c + 4], 7, -176418897), o, r, t[c + 5], 12, 1200080426), e, o, t[c + 6], 17, -1473231341), s, e, t[c + 7], 22, -45705983), r = i(r, s = i(s, e = i(e, o, r, s, t[c + 8], 7, 1770035416), o, r, t[c + 9], 12, -1958414417), e, o, t[c + 10], 17, -42063), s, e, t[c + 11], 22, -1990404162), r = i(r, s = i(s, e = i(e, o, r, s, t[c + 12], 7, 1804603682), o, r, t[c + 13], 12, -40341101), e, o, t[c + 14], 17, -1502002290), s, e, t[c + 15], 22, 1236535329), r = u(r, s = u(s, e = u(e, o, r, s, t[c + 1], 5, -165796510), o, r, t[c + 6], 9, -1069501632), e, o, t[c + 11], 14, 643717713), s, e, t[c + 0], 20, -373897302), r = u(r, s = u(s, e = u(e, o, r, s, t[c + 5], 5, -701558691), o, r, t[c + 10], 9, 38016083), e, o, t[c + 15], 14, -660478335), s, e, t[c + 4], 20, -405537848), r = u(r, s = u(s, e = u(e, o, r, s, t[c + 9], 5, 568446438), o, r, t[c + 14], 9, -1019803690), e, o, t[c + 3], 14, -187363961), s, e, t[c + 8], 20, 1163531501), r = u(r, s = u(s, e = u(e, o, r, s, t[c + 13], 5, -1444681467), o, r, t[c + 2], 9, -51403784), e, o, t[c + 7], 14, 1735328473), s, e, t[c + 12], 20, -1926607734), r = a(r, s = a(s, e = a(e, o, r, s, t[c + 5], 4, -378558), o, r, t[c + 8], 11, -2022574463), e, o, t[c + 11], 16, 1839030562), s, e, t[c + 14], 23, -35309556), r = a(r, s = a(s, e = a(e, o, r, s, t[c + 1], 4, -1530992060), o, r, t[c + 4], 11, 1272893353), e, o, t[c + 7], 16, -155497632), s, e, t[c + 10], 23, -1094730640), r = a(r, s = a(s, e = a(e, o, r, s, t[c + 13], 4, 681279174), o, r, t[c + 0], 11, -358537222), e, o, t[c + 3], 16, -722521979), s, e, t[c + 6], 23, 76029189), r = a(r, s = a(s, e = a(e, o, r, s, t[c + 9], 4, -640364487), o, r, t[c + 12], 11, -421815835), e, o, t[c + 15], 16, 530742520), s, e, t[c + 2], 23, -995338651), r = l(r, s = l(s, e = l(e, o, r, s, t[c + 0], 6, -198630844), o, r, t[c + 7], 10, 1126891415), e, o, t[c + 14], 15, -1416354905), s, e, t[c + 5], 21, -57434055), r = l(r, s = l(s, e = l(e, o, r, s, t[c + 12], 6, 1700485571), o, r, t[c + 3], 10, -1894986606), e, o, t[c + 10], 15, -1051523), s, e, t[c + 1], 21, -2054922799), r = l(r, s = l(s, e = l(e, o, r, s, t[c + 8], 6, 1873313359), o, r, t[c + 15], 10, -30611744), e, o, t[c + 6], 15, -1560198380), s, e, t[c + 13], 21, 1309151649), r = l(r, s = l(s, e = l(e, o, r, s, t[c + 4], 6, -145523070), o, r, t[c + 11], 10, -1120210379), e, o, t[c + 2], 15, 718787259), s, e, t[c + 9], 21, -343485551), e = g(e, A), o = g(o, d), r = g(r, v), s = g(s, D);
  }
  return Array(e, o, r, s);
}
function B(t, n, e, o, r, s) {
  return g(V(g(g(n, t), g(o, s)), r), e);
}
function i(t, n, e, o, r, s, c) {
  return B(n & e | ~n & o, t, n, r, s, c);
}
function u(t, n, e, o, r, s, c) {
  return B(n & o | e & ~o, t, n, r, s, c);
}
function a(t, n, e, o, r, s, c) {
  return B(n ^ e ^ o, t, n, r, s, c);
}
function l(t, n, e, o, r, s, c) {
  return B(e ^ (n | ~o), t, n, r, s, c);
}
function g(t, n) {
  var e = (65535 & t) + (65535 & n);
  return (t >> 16) + (n >> 16) + (e >> 16) << 16 | 65535 & e;
}
function V(t, n) {
  return t << n | t >>> 32 - n;
}
function lt(t) {
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(t);
}
function ht(t) {
  return Object.entries(t).map(
    ([n, e]) => encodeURIComponent(n) + "=" + encodeURIComponent(e)
  ).join("&");
}
function ft(t) {
  return t ? `https://www.gravatar.com/avatar/${Y(t)}` : "";
}
function gt(t) {
  const n = new RegExp(
    "(?:(?<protocol>[\\w\\d]+)\\:\\/\\/)?(?:(?<user>.+)\\@)?(?<host>(?<domain>[^:\\/\\?#@\\n]+)(?:\\:(?<port>\\d*))?)(?<path>\\/.*?)?(?:\\?(?<query>.*?))?(?:#(?<fragment>.*?))?$",
    "gm"
  ).exec(t), e = (n == null ? void 0 : n.groups) ?? {}, o = e.domain.split(".");
  if (e.port != null && (e.port = Number(e.port)), o.length > 2 && (e.domain = o.splice(-2, 2).join("."), e.subdomain = o.join(".")), e.query) {
    const r = e.query.split("&"), s = {};
    r.forEach((c) => {
      const [A, d] = c.split("=");
      s[A] = d;
    }), e.query = s;
  }
  return e;
}
function pt(t) {
  return (t instanceof Date ? t.getTime() : t) - (/* @__PURE__ */ new Date()).getTime();
}
function Et(t) {
  return new Promise((n) => setTimeout(n, t));
}
function dt(t) {
  const n = t instanceof Date ? t : new Date(t);
  return new Intl.DateTimeFormat("en-us", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: !0
  }).format(n);
}
export {
  R as BadRequestError,
  et as CliBackground,
  E as CliEffects,
  y as CliForeground,
  p as CustomError,
  tt as Emitter,
  N as ForbiddenError,
  O as InternalServerError,
  nt as Logger,
  $ as NotFoundError,
  I as UnauthorizedError,
  C as XHR,
  K as addUnique,
  Z as arrayDiff,
  F as caseInsensitiveSort,
  H as clean,
  ot as countChars,
  rt as createHex,
  J as deepCopy,
  x as dotNotation,
  X as findByProp,
  U as flattenArr,
  ht as formEncode,
  dt as formatDate,
  st as formatPhoneNumber,
  ft as gravatar,
  S as includes,
  ct as insertAt,
  w as isEqual,
  _ as makeArray,
  M as makeUnique,
  at as matchAll,
  Y as md5,
  it as randomString,
  ut as randomStringBuilder,
  Et as sleep,
  Q as sortByProp,
  pt as timeUntil,
  gt as urlParser,
  lt as validateEmail
};
