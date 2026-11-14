import { createHash } from "node:crypto";
import { getFormula } from "./formulaCatalog.js";
import { sym, rat, add, mul, div, neg, exactKeys, fail } from "./reasoningAlgebra.js";

// Reviewed snapshots: a changed source disables the adapter until reviewed again.
export const SOURCE_DIGESTS = Object.freeze({
  "ds10-hethuc-viet": "645089edd5d8e853b7215f911e1c7edf77d242e94a567826d36810ba15a106e7",
  "hh10-herong": "8f596a2d02686466f8d296daceb38bceecaeb772b284804de0322c00929731b7",
  "hh10-bankinh-noitiep": "84055b0a468454c4db5f9673b5389a8541b481690ac900f02aff04e3c7d62687",
  "hh10-bankinh-ngoaitiep": "3bcc706dd56cc948828bcbce53f12fc5c9211cd3663e9612b4c43f09168d7d82",
});
export function sourceMatches(id, lookup = getFormula) {
  const f = lookup(id);
  return Boolean(f && Object.hasOwn(SOURCE_DIGESTS, id) && createHash("sha256")
    .update(JSON.stringify([f.latex, f.explanation])).digest("hex") === SOURCE_DIGESTS[id]);
}

// Context is backend-owned, NEVER accepted as part of an AI plan.
export function instantiate(step, context, lookup = getFormula) {
  if (!sourceMatches(step.formulaId, lookup)) fail("source_mismatch", "unsupported");
  const viet = step.formulaId === "ds10-hethuc-viet";
  const fields = viet ? ["a", "b", "c", "x1", "x2", "S", "P"] :
    step.formulaId === "hh10-herong" ? ["a", "b", "c", "p", "S"] :
    step.formulaId === "hh10-bankinh-noitiep" ? ["r", "S", "p"] : ["R", "a", "b", "c", "S"];
  exactKeys(step.bindings, fields);
  const bound = fields.map(k => context.symbols.find(s => s.id === step.bindings[k]));
  if (bound.some(s => !s) || new Set(bound.map(s => s.id)).size !== bound.length) fail("bindings");
  const object = bound[0].object;
  if (bound.some(s => s.object !== object)) fail("mixed_objects");
  for (let i = 0; i < fields.length; i++) {
    const quantity = (viet ? "quadratic." : "triangle.") + fields[i];
    const unit = viet ? "scalar" : fields[i] === "S" ? "area" : "length";
    if (bound[i].quantity !== quantity || bound[i].unit !== unit) fail("quantity_or_unit");
  }
  const fact = kind => context.facts.some(f => f.object === object && f.kind === kind);
  if (viet && (!fact("real_roots") || !fact("leading_nonzero"))) fail("quadratic_conditions", "unsupported");
  if (!viet && !fact("valid_triangle")) fail("triangle_conditions", "unsupported");
  const e = k => sym(step.bindings[k]);
  const output = fields.find(k => step.bindings[k] === step.output);
  let rhs, displayRhs;
  if (viet) {
    if (output === "S") { rhs = add(e("x1"), e("x2")); displayRhs = div(neg(e("b")), e("a")); }
    else if (output === "P") { rhs = mul(e("x1"), e("x2")); displayRhs = div(e("c"), e("a")); }
    else fail("template_output");
  } else if (step.formulaId === "hh10-herong") {
    if (output === "p") rhs = div(add(e("a"), e("b"), e("c")), rat(2));
    else if (output === "S") {
      // Opaque trusted source; never expose sqrt to the general algebra verifier.
      displayRhs = { kind: "source_sqrt", arg: mul(e("p"), add(e("p"), neg(e("a"))), add(e("p"), neg(e("b"))), add(e("p"), neg(e("c")))) };
    } else fail("template_output");
  } else if (step.formulaId === "hh10-bankinh-noitiep" && output === "r") rhs = div(e("S"), e("p"));
  else if (step.formulaId === "hh10-bankinh-ngoaitiep" && output === "R") rhs = div(mul(e("a"), e("b"), e("c")), mul(rat(4), e("S")));
  else fail("template_output");
  return { rhs, displayRhs: displayRhs || rhs, object, viet, bound, name: lookup(step.formulaId).name };
}
