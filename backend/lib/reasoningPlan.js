import { getFormula } from "./formulaCatalog.js";
import { instantiate } from "./reasoningTemplates.js";
import { createAlgebra, ProofError, exactKeys, fail, sym } from "./reasoningAlgebra.js";

const RULES = new Set(["rename", "substitute", "ring_identity", "rational_identity", "isolate_linear"]);
const labels = { a: "a", b: "b", c: "c", x1: "x_1", x2: "x_2", S: "S", P: "P", Q: "Q", p: "p", r: "r", R: "R" };
function refs(e, found = new Set()) {
  if (e.kind === "sym") found.add(e.id);
  else if (e.args) e.args.forEach(v => refs(v, found));
  else if (e.kind === "div") { refs(e.numerator, found); refs(e.denominator, found); }
  else if (e.arg) refs(e.arg, found);
  else if (e.base) refs(e.base, found);
  return found;
}
function render(e, symbols) {
  switch (e.kind) {
    case "sym": return labels[symbols.get(e.id).quantity.split(".")[1]];
    case "rat": return e.denominator === "1" ? e.numerator : `\\frac{${e.numerator}}{${e.denominator}}`;
    case "add": return e.args.map(v => `\\left(${render(v, symbols)}\\right)`).join(" + ");
    case "mul": return e.args.map(v => `\\left(${render(v, symbols)}\\right)`).join(" \\cdot ");
    case "neg": return `-\\left(${render(e.arg, symbols)}\\right)`;
    case "div": return `\\frac{${render(e.numerator, symbols)}}{${render(e.denominator, symbols)}}`;
    case "pow": return `\\left(${render(e.base, symbols)}\\right)^{${e.exponent}}`;
    case "source_sqrt": return `\\sqrt{${render(e.arg, symbols)}}`;
    default: fail("render_node");
  }
}

/** Pure offline API. context is trusted typed input from backend/test fixtures, NOT model output.
 * No natural-language parsing, numeric answer evaluation, route or quota integration in B1.
 */
export function verifyReasoningPlan(plan, context, { lookup = getFormula } = {}) {
  let stepId;
  try {
    exactKeys(plan, ["version", "target", "steps"]);
    if (plan.version !== 1 || plan.target !== context.target) fail("target");
    if (!Array.isArray(plan.steps) || !plan.steps.length || plan.steps.length > 6) fail("step_limit", "unsupported");
    const algebra = createAlgebra(context.symbols.map(s => s.id));
    const symbols = new Map(context.symbols.map(s => [s.id, s]));
    if (!symbols.has(plan.target)) fail("target");
    for (const s of symbols.values()) {
      if (!/^[a-zA-Z][a-zA-Z0-9_.]{0,63}$/.test(s.id) || !["given", "intermediate", "target", "root"].includes(s.role) ||
          !Object.hasOwn(labels, s.quantity.split(".")[1])) fail("context_symbol");
    }
    if (symbols.get(plan.target).role !== "target") fail("target_role");
    if (context.goal) algebra.validate(context.goal);
    const available = new Set(context.symbols.filter(s => s.role === "given" || s.role === "root").map(s => s.id));
    const records = new Map(), sources = new Set(), outputSteps = new Map(), verified = [];
    const nonzero = new Set();
    // These facts must already have been established by a trusted parser/checker.
    for (const s of context.symbols) {
      const has = kind => context.facts.some(f => f.object === s.object && f.kind === kind);
      if ((s.quantity.startsWith("triangle.") && has("valid_triangle")) ||
          (s.quantity === "quadratic.a" && has("leading_nonzero")) ||
          (["quadratic.x1", "quadratic.x2", "quadratic.P", "quadratic.c"].includes(s.quantity) && has("product_nonzero"))) nonzero.add(s.id);
    }

    for (const step of plan.steps) {
      stepId = step?.id;
      if (typeof stepId !== "string" || !/^[a-zA-Z][a-zA-Z0-9_]{0,31}$/.test(stepId) || records.has(stepId)) fail("step_id");
      if (!symbols.has(step.output)) fail("unknown_output");
      let expression, definition, dependencies = [], stepSources = new Set();
      if (step.kind === "apply") {
        exactKeys(step, ["id", "kind", "formulaId", "bindings", "output"]);
        const template = instantiate(step, context, lookup);
        sources.add(step.formulaId); stepSources.add(step.formulaId);
        if (sources.size > 2) fail("source_limit", "unsupported");
        expression = template.displayRhs; definition = template.rhs;
        // Source equations may be introduced even when solving them backwards.
        // Only make the output available when all display inputs are available.
        const inputs = refs(expression);
        for (const id of inputs) if (outputSteps.has(id)) dependencies.push(outputSteps.get(id));
        if ([...inputs].every(id => available.has(id))) available.add(step.output);
      } else if (step.kind === "derive") {
        exactKeys(step, ["id", "kind", "from", "rule", "lhs", "rhs", "output"]);
        if (!RULES.has(step.rule)) fail("unsupported_rule", "unsupported");
        if (!Array.isArray(step.from) || !step.from.length || step.from.length > 6 || new Set(step.from).size !== step.from.length || step.from.some(id => !records.has(id))) fail("dependency");
        algebra.validate(step.lhs); algebra.validate(step.rhs);
        if (step.lhs.kind !== "sym" || step.lhs.id !== step.output || refs(step.rhs).has(step.output)) fail("unsolved_output");
        if (["given", "root"].includes(symbols.get(step.output).role) || available.has(step.output)) fail("overwrite");
        if (![...refs(step.rhs)].every(id => available.has(id))) fail("unavailable_input");
        const dependenciesSet = new Set();
        const collect = id => { if (dependenciesSet.has(id)) return; dependenciesSet.add(id); records.get(id).dependencies.forEach(collect); };
        step.from.forEach(collect); dependencies = [...dependenciesSet];
        for (const id of refs(step.rhs)) {
          if (outputSteps.has(id) && !dependenciesSet.has(outputSteps.get(id))) fail("uncited_input");
        }
        const definitions = new Map();
        for (const id of dependencies) {
          const r = records.get(id);
          r.sources.forEach(s => stepSources.add(s));
          if (r.definition) definitions.set(r.output, r.definition);
        }
        if (!stepSources.size) fail("missing_source");
        // A new target such as Q is defined by the BACKEND goal, never by the AI.
        const lhs = step.output === context.target && context.goal ? context.goal : step.lhs;
        const used = new Set([...refs(lhs), ...refs(step.rhs)]);
        const object = symbols.get(step.output).object;
        if ([...used].some(id => symbols.get(id).object !== object)) fail("mixed_objects");
        if (!algebra.equivalent(lhs, step.rhs, { definitions, nonzero })) fail("false_identity");
        // Prevent a source-free tautology from passing via an unrelated citation.
        if (![...used].some(id => definitions.has(id))) fail("unused_source");
        expression = step.rhs; definition = step.rhs;
        available.add(step.output);
      } else fail("step_kind", "unsupported");
      if (outputSteps.has(step.output)) fail("duplicate_output");
      outputSteps.set(step.output, stepId);
      records.set(stepId, { output: step.output, definition, dependencies, sources: stepSources });
      const name = render(sym(step.output), symbols);
      verified.push({ id: stepId, formulaIds: [...stepSources],
        title: step.kind === "derive" ? `Suy ra từ: ${[...stepSources].map(id => lookup(id).name).join(", ")}` : lookup(step.formulaId).name,
        expression: `${name} = ${render(expression, symbols)}, \\quad ${name} = ?` });
    }
    if (plan.steps.at(-1).output !== plan.target || !available.has(plan.target)) fail("incomplete_target");
    const connected = new Set();
    const walk = id => { if (connected.has(id)) return; connected.add(id); records.get(id).dependencies.forEach(walk); };
    walk(plan.steps.at(-1).id);
    if (connected.size !== records.size) fail("unconnected_step");
    return { status: "verified", steps: verified, sources: [...sources] };
  } catch (e) {
    if (e instanceof ProofError) return { status: e.status, reasonCode: e.code, ...(stepId ? { stepId } : {}) };
    throw e;
  }
}
