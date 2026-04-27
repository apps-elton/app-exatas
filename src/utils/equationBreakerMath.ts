/* ═══ MATH CORE ═══ */
export const rnd = (v: number) => Math.round(v * 100) / 100;
export const rndN = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
export const DEG = 180 / Math.PI;

export function buildPath(fn: (x: number) => number, xn: number, xx: number, toSvg: (x: number, y: number) => [number, number], SH: number = 540) {
  let d = "", ok = false;
  for (let i = 0; i <= 600; i++) {
    const x = xn + (xx - xn) * (i / 600), y = fn(x);
    if (!isFinite(y)) { ok = false; continue; }
    const [sx, sy] = toSvg(x, y);
    if (sy < -800 || sy > SH + 800) { ok = false; continue; }
    d += (ok ? " L" : " M") + ` ${sx.toFixed(1)} ${sy.toFixed(1)}`;
    ok = true;
  }
  return d;
}

export function calcFn(ft: number, a: number, b: number, c: number, d: number, logBase: string, trigType: string) {
  if (ft === 1) return { f: (x: number) => a * x + b, roots: a ? [-b / a] : [], yInt: b };
  if (ft === 2) {
    const f = (x: number) => a * x * x + b * x + c;
    const xv = a ? -b / (2 * a) : 0, yv = a ? f(xv) : c, delta = b * b - 4 * a * c;
    let roots: number[] = [];
    if (a) { if (Math.abs(delta) < .001) roots = [xv]; else if (delta > 0) { const s = Math.sqrt(delta); roots = [(-b - s) / (2 * a), (-b + s) / (2 * a)]; } }
    return { f, xv, yv, delta, roots, up: a > 0, hasV: !!a, yInt: c };
  }
  if (ft === 3) { const base = Math.abs(b) || 2; return { f: (x: number) => a * Math.pow(base, x) + c, roots: [], yInt: a + c }; }
  if (ft === 4) {
    const logFn = logBase === "ln" ? Math.log : Math.log10;
    return { f: (x: number) => { const v = x + b; return v > 0 ? a * logFn(v) + c : NaN; }, roots: [], yInt: b > 0 ? a * logFn(b) + c : NaN, domain: `x > ${rnd(-b)}`, logLabel: logBase === "ln" ? "ln" : "log" };
  }
  if (ft === 5) return { f: (x: number) => a * Math.abs(x + b) + c, xv: -b, yv: c, hasV: true, roots: a && c / a <= 0 ? [(-c / a) - b, (c / a) - b].filter((r, i, arr) => i === 0 || Math.abs(r - arr[0]) > .01) : [], yInt: a * Math.abs(b) + c };
  if (ft === 6) {
    const tfn = trigType === "cos" ? Math.cos : Math.sin;
    return { f: (x: number) => a + b * tfn(c * x + d), roots: [], yInt: a + b * tfn(d), amp: Math.abs(b), period: c ? rnd(2 * Math.PI / Math.abs(c)) : "∞", phase: rnd(d) };
  }
  return { f: (x: number) => x, roots: [], yInt: 0 };
}

export function parseFormula(expr: string) {
  try {
    let s = expr.trim().toLowerCase();
    s = s.replace(/^[gfhy]\s*\(\s*x\s*\)\s*=\s*/, "").replace(/^y\s*=\s*/, "");
    if (!s) return null;
    s = s.replace(/\bsen\b/g, "Math.sin").replace(/\bsin\b/g, "Math.sin").replace(/\bcos\b/g, "Math.cos")
      .replace(/\btan\b/g, "Math.tan").replace(/\bsqrt\b/g, "Math.sqrt").replace(/\babs\b/g, "Math.abs")
      .replace(/\bpi\b/g, "Math.PI").replace(/\be\b(?![a-z])/g, "Math.E")
      .replace(/\blog10\b/g, "Math.log10").replace(/\blog\b/g, "Math.log10").replace(/\bln\b/g, "Math.log")
      .replace(/\bexp\b/g, "Math.exp");
    s = s.replace(/(\d)([a-zA-Z(])/g, "$1*$2").replace(/\)([a-zA-Z0-9(])/g, ")*$1").replace(/\^/g, "**");
    const fn = new Function("x", `"use strict";try{return ${s}}catch(e){return NaN}`);
    if (typeof fn(1) !== "number") return null;
    return fn as (x: number) => number;
  } catch (e) { return null; }
}

export function numericalDerivative(fn: (x: number) => number, x: number) { const h = 0.0001; return (fn(x + h) - fn(x - h)) / (2 * h); }

export function findIntersections(f1: (x: number) => number, f2: (x: number) => number, xn: number, xx: number) {
  const pts = [];
  let prev = f1(xn) - f2(xn);
  for (let i = 1; i <= 1000; i++) {
    const x = xn + (xx - xn) * (i / 1000), cur = f1(x) - f2(x);
    if (isFinite(cur) && isFinite(prev) && prev * cur <= 0) {
      let lo = xn + (xx - xn) * ((i - 1) / 1000), hi = x;
      for (let j = 0; j < 30; j++) { const mid = (lo + hi) / 2; if ((f1(lo) - f2(lo)) * (f1(mid) - f2(mid)) <= 0) hi = mid; else lo = mid; }
      const rx = (lo + hi) / 2;
      if (pts.every(p => Math.abs(p - rx) > .05)) pts.push(rx);
    }
    prev = cur;
  }
  return pts;
}

export function findAsymptotes(fn: (x: number) => number, xn: number, xx: number) {
  const pts = [], h = (xx - xn) / 2000;
  for (let x = xn; x <= xx; x += h) {
    const y1 = fn(x), y2 = fn(x + h);
    if ((isFinite(y1) && isFinite(y2) && Math.abs(y2 - y1) > 100) || (isFinite(y1) && !isFinite(y2)))
      pts.push(rnd(x + h / 2));
  }
  return [...new Set(pts.map(p => Math.round(p * 10) / 10))].slice(0, 10);
}

export function simpsonIntegral(fn: (x: number) => number, a: number, b: number) {
  const n = 200, h = (b - a) / n;
  let s = fn(a) + fn(b);
  for (let i = 1; i < n; i++) { const x = a + i * h, v = fn(x); s += (i % 2 === 0 ? 2 : 4) * (isFinite(v) ? v : 0); }
  return rnd(s * h / 3);
}

/* ═══ COMPLEX MATH ═══ */
export type Complex = { re: number; im: number };
export const cAdd = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im });
export const cSub = (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im });
export const cMul = (a: Complex, b: Complex): Complex => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
export const cDiv = (a: Complex, b: Complex): Complex => { const d = b.re * b.re + b.im * b.im; return d === 0 ? { re: NaN, im: NaN } : { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d }; };
export const cConj = (z: Complex): Complex => ({ re: z.re, im: -z.im });
export const cMod = (z: Complex) => Math.sqrt(z.re * z.re + z.im * z.im);
export const cArg = (z: Complex) => Math.atan2(z.im, z.re);
export const cFromPolar = (r: number, t: number): Complex => ({ re: r * Math.cos(t), im: r * Math.sin(t) });
export const cPow = (z: Complex, n: number): Complex => { const r = cMod(z), t = cArg(z); return { re: Math.pow(r, n) * Math.cos(n * t), im: Math.pow(r, n) * Math.sin(n * t) }; };
export const cFmt = (z: Complex, p = 2) => {
  const re = rndN(z.re, p), im = rndN(z.im, p);
  if (im === 0) return `${re}`;
  if (re === 0) return im === 1 ? "i" : im === -1 ? "−i" : `${im}i`;
  return `${re} ${im > 0 ? "+" : "−"} ${Math.abs(im) === 1 ? "" : Math.abs(im)}i`;
};
export const cTrigFmt = (z: Complex) => { const r = rndN(cMod(z), 2), t = rndN(cArg(z) * DEG, 1); return `${r}(cos${t}°+i·sen${t}°)`; };
export const cPolFmt = (z: Complex) => `${rndN(cMod(z), 2)} ∠ ${rndN(cArg(z) * DEG, 1)}°`;
export const I_CYCLE = [
  { exp: 0, val: { re: 1, im: 0 }, label: "1" },
  { exp: 1, val: { re: 0, im: 1 }, label: "i" },
  { exp: 2, val: { re: -1, im: 0 }, label: "−1" },
  { exp: 3, val: { re: 0, im: -1 }, label: "−i" },
];

/* ═══ POLYNOMIAL MATH ═══ */
export function parsePoly(expr: string): number[] | null {
  try {
    let s = expr.replace(/\s/g, "").toLowerCase().replace(/−/g, "-");
    if (!s) return null;
    const coeffs: Record<number, number> = {};
    const re = /([+-]?)(\d*\.?\d*)(x?)(\^?)(\d*)/g;
    let m, found = false;
    while ((m = re.exec(s)) !== null) {
      if (m[0] === "") { re.lastIndex++; continue; }
      const sign = m[1] === "-" ? -1 : 1;
      const hasX = m[3] === "x";
      const coefStr = m[2];
      let coef = coefStr === "" ? 1 : parseFloat(coefStr);
      coef *= sign;
      let exp = 0;
      if (hasX) { exp = m[5] !== "" ? parseInt(m[5]) : 1; }
      else { if (coefStr === "" && !hasX) continue; }
      coeffs[exp] = (coeffs[exp] || 0) + coef;
      found = true;
    }
    if (!found) return null;
    const deg = Math.max(...Object.keys(coeffs).map(Number));
    if (deg < 0 || deg > 20 || !isFinite(deg)) return null;
    const arr: number[] = [];
    for (let i = deg; i >= 0; i--) arr.push(coeffs[i] || 0);
    if (arr[0] === 0) return null;
    return arr;
  } catch (e) { return null; }
}

export function polyEval(coeffs: number[], x: number) {
  let r = 0;
  for (let i = 0; i < coeffs.length; i++) r = r * x + coeffs[i];
  return r;
}

export function polyDeg(coeffs: number[]) { return coeffs.length - 1; }

export function polyFmt(coeffs: number[]) {
  if (!coeffs || coeffs.length === 0) return "0";
  const deg = coeffs.length - 1;
  let s = "";
  for (let i = 0; i < coeffs.length; i++) {
    const c = coeffs[i], e = deg - i;
    if (Math.abs(c) < 1e-10) continue;
    const sign = c > 0 ? (s ? " + " : "") : (s ? " − " : "−");
    const ac = Math.abs(c);
    const cStr = (ac === 1 && e > 0) ? "" : (Number.isInteger(ac) ? ac.toString() : ac.toFixed(2));
    const xStr = e === 0 ? "" : e === 1 ? "x" : `x^${e}`;
    s += sign + cStr + xStr;
  }
  return s || "0";
}

export function briotRuffini(coeffs: number[], k: number) {
  const n = coeffs.length;
  const line = [coeffs[0]];
  for (let i = 1; i < n; i++) {
    line.push(line[i - 1] * k + coeffs[i]);
  }
  const resto = line[n - 1];
  const quociente = line.slice(0, n - 1);
  return { quociente, resto, line };
}

export function polyDerivative(coeffs: number[]) {
  if (coeffs.length <= 1) return [0];
  const d = [];
  const deg = coeffs.length - 1;
  for (let i = 0; i < deg; i++) d.push(coeffs[i] * (deg - i));
  return d.length ? d : [0];
}

export function rationalCandidates(coeffs: number[]) {
  const an = Math.abs(coeffs[0]);
  const a0 = Math.abs(coeffs[coeffs.length - 1]);
  if (a0 === 0) return [0];
  const divs = (n: number) => {
    const d = new Set<number>();
    for (let i = 1; i <= Math.abs(n); i++) { if (n % i === 0) { d.add(i); d.add(-i); } }
    return [...d];
  };
  const pDivs = divs(Math.round(a0));
  const qDivs = divs(Math.round(an));
  const cands = new Set<number>();
  for (const p of pDivs) {
    for (const q of qDivs) {
      if (q !== 0) {
        const v = p / q;
        cands.add(rndN(v, 4));
      }
    }
  }
  return [...cands].sort((a, b) => a - b);
}

export function findPolyRoots(coeffs: number[]) {
  if (!coeffs || coeffs.length <= 1) return { roots: [], factors: [], remaining: coeffs || [1] };
  const roots: any[] = [];
  const factors: number[] = [];
  let current = [...coeffs];
  const cands = rationalCandidates(current);
  let maxIter = 20;
  while (current.length > 1 && maxIter-- > 0) {
    let foundRoot = false;
    for (const c of cands) {
      const val = polyEval(current, c);
      if (Math.abs(val) < 1e-8) {
        roots.push(rndN(c, 4));
        factors.push(c);
        const { quociente } = briotRuffini(current, c);
        current = quociente;
        foundRoot = true;
        break;
      }
    }
    if (!foundRoot) break;
  }
  if (current.length === 3) {
    const [aa, bb, cc] = current;
    const delta = bb * bb - 4 * aa * cc;
    if (Math.abs(delta) < 1e-8) {
      roots.push(rndN(-bb / (2 * aa), 4));
    } else if (delta > 0) {
      roots.push(rndN((-bb - Math.sqrt(delta)) / (2 * aa), 4));
      roots.push(rndN((-bb + Math.sqrt(delta)) / (2 * aa), 4));
    } else {
      const realPart = rndN(-bb / (2 * aa), 4);
      const imagPart = rndN(Math.sqrt(-delta) / (2 * aa), 4);
      roots.push({ re: realPart, im: imagPart, complex: true });
      roots.push({ re: realPart, im: -imagPart, complex: true });
    }
    current = [current[0]];
  }
  return { roots, factors, remaining: current };
}

export function girardRelations(coeffs: number[]) {
  if (!coeffs || coeffs.length < 2) return [];
  const n = coeffs.length - 1;
  const an = coeffs[0];
  const rels = [];
  for (let k = 1; k <= n; k++) {
    const sign = k % 2 === 0 ? 1 : -1;
    const val = rndN(sign * coeffs[k] / an, 4);
    if (k === 1) rels.push({ label: "Σ rᵢ (soma)", formula: `(−1)¹·a₁/a₀ = ${rndN(-coeffs[1] / an, 4)}`, value: rndN(-coeffs[1] / an, 4) });
    else if (k === n) rels.push({ label: "Π rᵢ (produto)", formula: `(−1)^${n}·a${n}/a₀ = ${val}`, value: val });
    else rels.push({ label: `Σ rᵢrⱼ... (${k} a ${k})`, formula: `(−1)^${k}·a${k}/a₀ = ${val}`, value: val });
  }
  return rels;
}

export function polyDivide(dividend: number[], divisor: number[]) {
  if (!divisor || divisor.length === 0 || divisor[0] === 0) return null;
  if (dividend.length < divisor.length) return { quotient: [0], remainder: [...dividend], steps: [] };
  let rem = [...dividend];
  const quot = [];
  const steps = [];
  while (rem.length >= divisor.length) {
    const coef = rem[0] / divisor[0];
    quot.push(rndN(coef, 6));
    const sub = divisor.map(c => c * coef);
    const newRem = [];
    for (let i = 0; i < rem.length; i++) {
      const val = rem[i] - (i < sub.length ? sub[i] : 0);
      newRem.push(rndN(val, 10));
    }
    steps.push({ coef: rndN(coef, 4), sub: sub.map(v => rndN(v, 4)), remBefore: [...rem], remAfter: [...newRem] });
    newRem.shift();
    rem = newRem;
    while (rem.length > 1 && Math.abs(rem[0]) < 1e-10) rem.shift();
  }
  if (rem.length === 0) rem = [0];
  return { quotient: quot, remainder: rem.map(v => rndN(v, 4)), steps };
}

export function findMultiplicity(coeffs: number[], root: number) {
  let current = [...coeffs];
  let mult = 0;
  for (let i = 0; i < 10; i++) {
    const val = polyEval(current, root);
    if (Math.abs(val) > 1e-6) break;
    mult++;
    const { quociente } = briotRuffini(current, root);
    current = quociente;
    if (current.length <= 1) break;
  }
  return mult;
}

export function bolzanoBisect(fn: (x: number) => number, a: number, b: number, steps = 20) {
  const history = [];
  let lo = a, hi = b;
  if (fn(lo) * fn(hi) > 0) return { found: false, history: [] };
  for (let i = 0; i < steps; i++) {
    const mid = (lo + hi) / 2;
    const fMid = fn(mid);
    history.push({ lo: rndN(lo, 6), hi: rndN(hi, 6), mid: rndN(mid, 6), fLo: rndN(fn(lo), 6), fHi: rndN(fn(hi), 6), fMid: rndN(fMid, 6) });
    if (Math.abs(fMid) < 1e-10) break;
    if (fn(lo) * fMid < 0) hi = mid;
    else lo = mid;
  }
  return { found: true, root: rndN((lo + hi) / 2, 6), history };
}

export function descartesRule(coeffs: number[]) {
  let posChanges = 0;
  const nonZero = coeffs.filter(c => Math.abs(c) > 1e-10);
  for (let i = 1; i < nonZero.length; i++) {
    if (nonZero[i] * nonZero[i - 1] < 0) posChanges++;
  }
  const negCoeffs = coeffs.map((c, i) => {
    const exp = coeffs.length - 1 - i;
    return exp % 2 === 1 ? -c : c;
  });
  let negChanges = 0;
  const negNonZero = negCoeffs.filter(c => Math.abs(c) > 1e-10);
  for (let i = 1; i < negNonZero.length; i++) {
    if (negNonZero[i] * negNonZero[i - 1] < 0) negChanges++;
  }
  return { posChanges, negChanges };
}

export function polyAdd(a: number[], b: number[]) {
  const maxLen = Math.max(a.length, b.length);
  const result = [];
  for (let i = 0; i < maxLen; i++) {
    const ai = i < a.length ? a[a.length - 1 - i] : 0;
    const bi = i < b.length ? b[b.length - 1 - i] : 0;
    result.unshift(rndN(ai + bi, 6));
  }
  while (result.length > 1 && Math.abs(result[0]) < 1e-10) result.shift();
  return result;
}

export function polySub(a: number[], b: number[]) {
  return polyAdd(a, b.map(c => -c));
}

export function polyMul(a: number[], b: number[]) {
  const result = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      result[i + j] += a[i] * b[j];
    }
  }
  return result.map(v => rndN(v, 6));
}

export function findInflectionPts(coeffs: number[]) {
  if (!coeffs || coeffs.length < 3) return [];
  const d1 = polyDerivative(coeffs);
  const d2 = polyDerivative(d1);
  if (d2.length < 2) return [];
  const pts = [];
  for (let i = 1; i <= 500; i++) {
    const x0 = -10 + 20 * ((i - 1) / 500), x1 = -10 + 20 * (i / 500);
    const v0 = polyEval(d2, x0), v1 = polyEval(d2, x1);
    if (isFinite(v0) && isFinite(v1) && v0 * v1 <= 0) {
      let lo = x0, hi = x1;
      for (let j = 0; j < 20; j++) { const mid = (lo + hi) / 2; if (polyEval(d2, lo) * polyEval(d2, mid) <= 0) hi = mid; else lo = mid; }
      const rx = (lo + hi) / 2, ry = polyEval(coeffs, rx);
      if (isFinite(ry) && pts.every(p => Math.abs(p.x - rx) > .05)) pts.push({ x: rndN(rx, 2), y: rndN(ry, 2) });
    }
  }
  return pts;
}

export function findCriticalPts(coeffs: number[]) {
  if (!coeffs || coeffs.length < 2) return [];
  const d1 = polyDerivative(coeffs);
  const pts = [];
  for (let i = 1; i <= 500; i++) {
    const x0 = -10 + 20 * ((i - 1) / 500), x1 = -10 + 20 * (i / 500);
    const v0 = polyEval(d1, x0), v1 = polyEval(d1, x1);
    if (isFinite(v0) && isFinite(v1) && v0 * v1 <= 0) {
      let lo = x0, hi = x1;
      for (let j = 0; j < 20; j++) { const mid = (lo + hi) / 2; if (polyEval(d1, lo) * polyEval(d1, mid) <= 0) hi = mid; else lo = mid; }
      const rx = (lo + hi) / 2, ry = polyEval(coeffs, rx);
      const d2 = polyDerivative(d1);
      const concavity = polyEval(d2, rx);
      if (isFinite(ry) && pts.every(p => Math.abs(p.x - rx) > .05)) pts.push({ x: rndN(rx, 2), y: rndN(ry, 2), type: concavity > 0.01 ? "min" : concavity < -0.01 ? "max" : "infl" });
    }
  }
  return pts;
}
