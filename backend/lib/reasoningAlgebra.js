// Offline exact algebra only. No parser for executable text, no provider calls.
export class ProofError extends Error {
  constructor(code, status = "invalid") { super(code); this.code = code; this.status = status; }
}
export const fail = (code, status) => { throw new ProofError(code, status); };
export const sym = id => ({ kind: "sym", id });
export const rat = n => ({ kind: "rat", numerator: String(n), denominator: "1" });
export const add = (...args) => ({ kind: "add", args });
export const mul = (...args) => ({ kind: "mul", args });
export const div = (numerator, denominator) => ({ kind: "div", numerator, denominator });
export const neg = arg => ({ kind: "neg", arg });
export const pow = (base, exponent) => ({ kind: "pow", base, exponent });

export function exactKeys(value, keys) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype ||
      Object.keys(value).length !== keys.length || keys.some(k => !Object.hasOwn(value, k))) fail("schema");
}

export function createAlgebra(symbolIds) {
  if (!Array.isArray(symbolIds) || symbolIds.length > 12 || new Set(symbolIds).size !== symbolIds.length) fail("symbol_limit", "unsupported");
  const names = [...symbolIds].sort();
  const index = new Map(names.map((id, i) => [id, i]));
  let nodes = 0, operations = 0;
  const started = performance.now();
  const tick = () => {
    if (++operations > 100000) fail("operation_limit", "unsupported");
    if (operations % 256 === 0 && performance.now() - started > 100) fail("time_limit", "unsupported");
  };
  const bound = n => { if ((n < 0n ? -n : n).toString(2).length > 4096) fail("coefficient_limit", "unsupported"); return n; };
  const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { tick(); [a, b] = [b, a % b]; } return a; };
  const q = (n, d = 1n) => {
    bound(n); bound(d);
    if (d === 0n) fail("zero_denominator");
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d); return [n / g, d / g];
  };
  const qa = (a, b) => q(bound(bound(a[0] * b[1]) + bound(b[0] * a[1])), bound(a[1] * b[1]));
  const qm = (a, b) => q(bound(a[0] * b[0]), bound(a[1] * b[1]));
  const zeroKey = names.map(() => 0).join(",");
  const constant = value => new Map(value[0] === 0n ? [] : [[zeroKey, value]]);
  const one = () => constant([1n, 1n]);
  const put = (p, k, v) => {
    tick(); const next = qa(p.get(k) || [0n, 1n], v);
    if (next[0] === 0n) p.delete(k); else p.set(k, next);
    if (p.size > 512) fail("term_limit", "unsupported");
  };
  const plus = (a, b) => { const p = new Map(a); for (const [k, v] of b) put(p, k, v); return p; };
  const times = (a, b) => {
    const p = new Map();
    for (const [ka, va] of a) for (const [kb, vb] of b) {
      tick(); const bs = kb.split(",").map(Number);
      const k = ka.split(",").map((v, i) => Number(v) + bs[i]).join(",");
      put(p, k, qm(va, vb));
    }
    return p;
  };
  const negative = p => new Map([...p].map(([k, [n, d]]) => [k, [-n, d]]));
  const polynomialEqual = (a, b) => plus(a, negative(b)).size === 0;

  function validate(e, depth = 0, path = new Set()) {
    if (++nodes > 256 || depth > 16) fail("ast_limit", "unsupported");
    if (path.has(e)) fail("cycle");
    path.add(e);
    const visit = v => validate(v, depth + 1, path);
    switch (e?.kind) {
      case "rat":
        exactKeys(e, ["kind", "numerator", "denominator"]);
        if (![e.numerator, e.denominator].every(v => typeof v === "string" && /^-?\d{1,64}$/.test(v))) fail("rational_format", "unsupported");
        q(BigInt(e.numerator), BigInt(e.denominator)); break;
      case "sym":
        exactKeys(e, ["kind", "id"]); if (!index.has(e.id)) fail("unknown_symbol"); break;
      case "add": case "mul":
        exactKeys(e, ["kind", "args"]);
        if (!Array.isArray(e.args) || e.args.length < 2 || e.args.length > 256) fail("arity");
        e.args.forEach(visit); break;
      case "neg": exactKeys(e, ["kind", "arg"]); visit(e.arg); break;
      case "div": exactKeys(e, ["kind", "numerator", "denominator"]); visit(e.numerator); visit(e.denominator); break;
      case "pow":
        exactKeys(e, ["kind", "base", "exponent"]);
        if (!Number.isInteger(e.exponent) || e.exponent < 0 || e.exponent > 6) fail("power_limit", "unsupported");
        visit(e.base); break;
      default: fail("unsupported_node", "unsupported");
    }
    path.delete(e);
  }

  // Every division registers its ORIGINAL denominator, including inside e^0.
  function convert(e, obligations, definitions, path = new Set()) {
    tick();
    const go = v => convert(v, obligations, definitions, path);
    const product = (a, b) => ({ n: times(a.n, b.n), d: times(a.d, b.d) });
    switch (e.kind) {
      case "rat": return { n: constant(q(BigInt(e.numerator), BigInt(e.denominator))), d: one() };
      case "sym": {
        if (definitions.has(e.id)) {
          if (path.has(e.id)) fail("definition_cycle");
          path.add(e.id); const result = go(definitions.get(e.id)); path.delete(e.id); return result;
        }
        const exponents = names.map(() => 0); exponents[index.get(e.id)] = 1;
        return { n: new Map([[exponents.join(","), [1n, 1n]]]), d: one() };
      }
      case "neg": { const a = go(e.arg); return { n: negative(a.n), d: a.d }; }
      case "add": return e.args.map(go).reduce((a, b) => ({ n: plus(times(a.n, b.d), times(b.n, a.d)), d: times(a.d, b.d) }));
      case "mul": return e.args.map(go).reduce(product);
      case "div": {
        const a = go(e.numerator), b = go(e.denominator);
        obligations.push(b.n);
        return { n: times(a.n, b.d), d: times(a.d, b.n) };
      }
      case "pow": {
        const a = go(e.base); let result = { n: one(), d: one() };
        for (let i = 0; i < e.exponent; i++) result = product(result, a);
        return result;
      }
      default: fail("unsupported_node", "unsupported");
    }
  }

  function knownNonzero(p, nonzero) {
    // Deliberately conservative: only a nonzero monomial with proven nonzero factors.
    if (p.size !== 1) return false;
    const [key, value] = [...p][0];
    return value[0] !== 0n && key.split(",").every((power, i) => Number(power) === 0 || nonzero.has(names[i]));
  }

  // Independent evaluation of the original AST: supplemental counterexample search,
  // never a replacement for the exact polynomial proof and domain checks above.
  function sample(e, values, definitions, path = new Set()) {
    tick(); const go = v => sample(v, values, definitions, path);
    switch (e.kind) {
      case "rat": return q(BigInt(e.numerator), BigInt(e.denominator));
      case "sym": {
        if (!definitions.has(e.id)) return values.get(e.id);
        if (path.has(e.id)) fail("definition_cycle");
        path.add(e.id); const result = go(definitions.get(e.id)); path.delete(e.id); return result;
      }
      case "neg": { const [n, d] = go(e.arg); return [-n, d]; }
      case "add": return e.args.map(go).reduce(qa);
      case "mul": return e.args.map(go).reduce(qm);
      case "div": { const a = go(e.numerator), b = go(e.denominator); return qm(a, q(b[1], b[0])); }
      case "pow": { const a = go(e.base); let result = [1n, 1n]; for (let i=0;i<e.exponent;i++) result=qm(result,a); return result; }
      default: fail("unsupported_node", "unsupported");
    }
  }

  function equivalent(lhs, rhs, { definitions = new Map(), nonzero = new Set() } = {}) {
    validate(lhs); validate(rhs);
    for (const [id, e] of definitions) { if (!index.has(id)) fail("unknown_symbol"); validate(e); }
    const obligations = [];
    const a = convert(lhs, obligations, definitions), b = convert(rhs, obligations, definitions);
    if (obligations.some(p => p.size === 0)) fail("zero_denominator");
    if (obligations.some(p => !knownNonzero(p, nonzero))) fail("unproved_nonzero", "unsupported");
    if (!polynomialEqual(times(a.n, b.d), times(b.n, a.d))) return false;
    let seed = 73;
    for (let trial = 0; trial < 8; trial++) {
      const values = new Map(names.map(id => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        // Nonzero samples, including small rational values near zero.
        const numerator = BigInt(seed % 29 + 1) * (seed & 1 ? -1n : 1n);
        return [id, q(numerator, trial < 2 ? 1000n : 1n)];
      }));
      const left = sample(lhs, values, definitions), right = sample(rhs, values, definitions);
      if (left[0] !== right[0] || left[1] !== right[1]) return false;
    }
    return true;
  }
  return { validate, equivalent };
}

export function checkIdentity(lhs, rhs, { symbols, nonzero = [] }) {
  try {
    const algebra = createAlgebra(symbols);
    return { status: algebra.equivalent(lhs, rhs, { nonzero: new Set(nonzero) }) ? "verified" : "invalid", reasonCode: "identity" };
  } catch (e) {
    if (e instanceof ProofError) return { status: e.status, reasonCode: e.code };
    throw e;
  }
}
