import { test } from "node:test";
import assert from "node:assert/strict";
import { sym as s, rat as n, add, mul, div, neg, pow, checkIdentity } from "../lib/reasoningAlgebra.js";
import { sourceMatches, SOURCE_DIGESTS } from "../lib/reasoningTemplates.js";
import { verifyReasoningPlan } from "../lib/reasoningPlan.js";
import { getFormula } from "../lib/formulaCatalog.js";

const identity = (a, b, nonzero = []) => checkIdentity(a, b, { symbols: ["x", "y", "z"], nonzero });
test("exact polynomial identity and counterexample", () => {
  assert.equal(identity(pow(add(s("x"), s("y")), 2), add(pow(s("x"), 2), mul(n(2), s("x"), s("y")), pow(s("y"), 2))).status, "verified");
  assert.equal(identity(pow(add(s("x"), s("y")), 2), add(pow(s("x"), 2), pow(s("y"), 2))).status, "invalid");
});
test("exact rational coefficients beyond floating precision", () => {
  const big = n("9007199254740993");
  assert.equal(identity(add(big, neg(n("9007199254740992"))), n(1)).status, "verified");
  assert.equal(identity(add(div(n(1), n(3)), div(n(1), n(6))), div(n(1), n(2))).status, "verified");
});
test("original denominator survives cancellation and exponent zero", () => {
  for (const expr of [div(s("x"), s("x")), pow(div(n(1), s("x")), 0)]) {
    assert.equal(identity(expr, n(1)).reasonCode, "unproved_nonzero");
    assert.equal(identity(expr, n(1), ["x"]).status, "verified");
  }
  assert.equal(identity(div(n(0), n(0)), n(0)).reasonCode, "zero_denominator");
  assert.equal(identity(div(n(1), add(s("x"), neg(s("x")))), n(1)).reasonCode, "zero_denominator");
});
test("reciprocal identity requires both roots nonzero", () => {
  const a = add(div(n(1), s("x")), div(n(1), s("y")));
  const b = div(add(s("x"), s("y")), mul(s("x"), s("y")));
  assert.equal(identity(a, b, ["x", "y"]).status, "verified");
  assert.equal(identity(a, b, ["x"]).status, "unsupported");
});
test("invalid AST nodes, fields, numbers and unknown symbols fail closed", () => {
  for (const expr of [{kind:"eval", code:"process.exit()"}, {...s("x"), extra:true}, s("missing"), n("1.5"), n("9".repeat(65)), pow(s("x"), -1), pow(s("x"), 7)]) {
    assert.notEqual(identity(expr, n(1)).status, "verified");
  }
});
test("cyclic, deep and oversized ASTs are bounded", () => {
  const cycle = {kind:"neg"}; cycle.arg = cycle;
  assert.equal(identity(cycle, n(1)).reasonCode, "cycle");
  let deep = s("x"); for (let i=0;i<18;i++) deep=neg(deep);
  assert.equal(identity(deep, n(1)).reasonCode, "ast_limit");
  assert.notEqual(identity(add(...Array.from({length:260}, () => s("x"))), n(1)).status, "verified");
});
test("expansion work and intermediate coefficients are bounded", () => {
  let large = n("9".repeat(64)); for (let i=0;i<3;i++) large=pow(large,6);
  assert.equal(identity(large, n(1)).reasonCode, "coefficient_limit");
  const expr = pow(pow(add(s("x"),s("y"),s("z"),n(1)),6),6);
  assert.equal(identity(expr, n(1)).status, "unsupported");
});
test("seeded numeric counterexample search supplements exact algebra", () => {
  let seed=73;
  for(let i=0;i<50;i++) {
    seed=(seed*1664525+1013904223)>>>0; const x=BigInt(seed%31)-15n;
    seed=(seed*1664525+1013904223)>>>0; const y=BigInt(seed%31)-15n;
    // A separate integer oracle checks exact AST evaluation at generated inputs.
    const expression=add(pow(add(n(x),n(y)),2),neg(mul(n(2),n(x),n(y))));
    assert.equal(identity(expression,n(x*x+y*y)).status,"verified");
    assert.equal(identity(expression,n(x*x+y*y+1n)).status,"invalid");
  }
});
test("reviewed source versions match and drift disables adapter", () => {
  for (const id of Object.keys(SOURCE_DIGESTS)) {
    assert.equal(sourceMatches(id), true);
    assert.equal(sourceMatches(id, key => ({...getFormula(key), explanation:"changed"})), false);
  }
  assert.equal(sourceMatches("made-up"), false);
});

const apply = (id, formulaId, bindings, output) => ({id,kind:"apply",formulaId,bindings,output});
const derive = (id, from, output, rhs, rule="rational_identity") => ({id,kind:"derive",from,rule,output,lhs:s(output),rhs});
function viet(reciprocal=false) {
  const keys=["a","b","c","x1","x2","S","P","Q"];
  const bindings=Object.fromEntries(keys.filter(k=>k!=="Q").map(k=>[k,k]));
  const context={ target:"Q", symbols:keys.map(id=>({id,object:"q1",quantity:`quadratic.${id}`,unit:"scalar",role:id==="Q"?"target":["S","P"].includes(id)?"intermediate":id.startsWith("x")?"root":"given"})),
    facts:["real_roots","leading_nonzero",...(reciprocal?["product_nonzero"]:[])].map(kind=>({object:"q1",kind})),
    goal:reciprocal?add(div(n(1),s("x1")),div(n(1),s("x2"))):add(pow(s("x1"),2),pow(s("x2"),2)) };
  const plan={version:1,target:"Q",steps:[apply("sum","ds10-hethuc-viet",bindings,"S"),apply("product","ds10-hethuc-viet",bindings,"P"),
    derive("answer",["sum","product"],"Q",reciprocal?div(s("S"),s("P")):add(pow(s("S"),2),neg(mul(n(2),s("P")))))]};
  return {plan,context};
}
function triangle(target="r", given=["a","b","c"]) {
  const keys=["a","b","c","p","S","r","R"];
  const context={target,symbols:keys.map(id=>({id,object:"t1",quantity:`triangle.${id}`,unit:id==="S"?"area":"length",role:id===target?"target":given.includes(id)?"given":"intermediate"})),facts:[{object:"t1",kind:"valid_triangle"}]};
  const hb={a:"a",b:"b",c:"c",p:"p",S:"S"};
  const end=target==="r"?apply("radius","hh10-bankinh-noitiep",{r:"r",S:"S",p:"p"},"r"):
    apply("radius","hh10-bankinh-ngoaitiep",{R:"R",a:"a",b:"b",c:"c",S:"S"},"R");
  const plan={version:1,target,steps:[apply("half","hh10-herong",hb,"p"),apply("area","hh10-herong",hb,"S"),end]};
  return {context,plan};
}
test("Vieta square sum and reciprocal plans verify without numeric answers", () => {
  for(const reciprocal of [false,true]) {
    const {plan,context}=viet(reciprocal), result=verifyReasoningPlan(plan,context);
    assert.equal(result.status,"verified",JSON.stringify(result));
    assert.deepEqual(result.sources,["ds10-hethuc-viet"]);
    assert.match(result.steps.at(-1).title,/Suy ra từ/);
    assert.match(result.steps.at(-1).expression,/Q = \?/);
    assert.ok(result.steps.every(step=>!/[=]\s*-?\d/.test(step.expression)));
  }
});
test("wrong Vieta sign, missing nonzero/real-root evidence and fake assumptions rejected", () => {
  const {plan,context}=viet(); plan.steps.at(-1).rhs=add(pow(s("S"),2),mul(n(2),s("P")));
  assert.equal(verifyReasoningPlan(plan,context).reasonCode,"false_identity");
  const reciprocal=viet(true); reciprocal.context.facts=reciprocal.context.facts.filter(f=>f.kind!=="product_nonzero");
  assert.equal(verifyReasoningPlan(reciprocal.plan,reciprocal.context).reasonCode,"unproved_nonzero");
  const real=viet(); real.context.facts=[];
  assert.equal(verifyReasoningPlan(real.plan,real.context).reasonCode,"quadratic_conditions");
  const fake=viet(); fake.plan.steps.at(-1).conditions=["P != 0"];
  assert.equal(verifyReasoningPlan(fake.plan,fake.context).reasonCode,"schema");
});
test("Heron chains to inradius and circumradius preserve source sqrt and blanks", () => {
  for(const target of ["r","R"]) {
    const {plan,context}=triangle(target), result=verifyReasoningPlan(plan,context);
    assert.equal(result.status,"verified",JSON.stringify(result));
    assert.equal(result.sources.length,2);
    assert.match(result.steps[1].expression,/\\sqrt/);
    assert.match(result.steps.at(-1).expression,new RegExp(`${target} = \\?`));
  }
});
test("isolate area from inradius and circumradius without guessing missing factors", () => {
  for(const circum of [false,true]) {
    const {context}=triangle("S",["a","b","c","p","r","R"]);
    const first=circum?apply("source","hh10-bankinh-ngoaitiep",{R:"R",a:"a",b:"b",c:"c",S:"S"},"R"):apply("source","hh10-bankinh-noitiep",{r:"r",S:"S",p:"p"},"r");
    const rhs=circum?div(mul(s("a"),s("b"),s("c")),mul(n(4),s("R"))):mul(s("r"),s("p"));
    const plan={version:1,target:"S",steps:[first,derive("area",["source"],"S",rhs,"isolate_linear")]};
    assert.equal(verifyReasoningPlan(plan,context).status,"verified");
    if(circum) { plan.steps[1].rhs=div(mul(s("a"),s("b"),s("c")),s("R")); assert.equal(verifyReasoningPlan(plan,context).status,"invalid"); }
  }
});
test("incomplete Heron chain cannot mark radius available", () => {
  const {plan,context}=triangle(); plan.steps.splice(0,2);
  assert.equal(verifyReasoningPlan(plan,context).reasonCode,"incomplete_target");
});
test("source mismatch, mixed triangles, wrong units and missing triangle condition rejected", () => {
  const source=triangle();
  assert.equal(verifyReasoningPlan(source.plan,source.context,{lookup:id=>({...getFormula(id),latex:"changed"})}).reasonCode,"source_mismatch");
  const mixed=triangle(); mixed.context.symbols.find(s=>s.id==="S").object="t2";
  assert.equal(verifyReasoningPlan(mixed.plan,mixed.context).reasonCode,"mixed_objects");
  const units=triangle(); units.context.symbols.find(s=>s.id==="p").unit="area";
  assert.equal(verifyReasoningPlan(units.plan,units.context).reasonCode,"quantity_or_unit");
  const missing=triangle(); missing.context.facts=[];
  assert.equal(verifyReasoningPlan(missing.plan,missing.context).reasonCode,"triangle_conditions");
});
test("dependency cycles, changed target and unapproved rules rejected", () => {
  const cycle=viet(); cycle.plan.steps.at(-1).from=["answer"];
  assert.equal(verifyReasoningPlan(cycle.plan,cycle.context).reasonCode,"dependency");
  const target=viet(); target.plan.target="P";
  assert.equal(verifyReasoningPlan(target.plan,target.context).reasonCode,"target");
  const rule=viet(); rule.plan.steps.at(-1).rule="square_both_sides";
  assert.equal(verifyReasoningPlan(rule.plan,rule.context).reasonCode,"unsupported_rule");
});
test("cannot overwrite data, cite unrelated source, or return target tautology", () => {
  const overwrite=viet(); const last=overwrite.plan.steps.at(-1); last.output="a"; last.lhs=s("a");
  assert.equal(verifyReasoningPlan(overwrite.plan,overwrite.context).reasonCode,"overwrite");
  const tautology=viet(); tautology.plan.steps.at(-1).rhs=s("Q");
  assert.equal(verifyReasoningPlan(tautology.plan,tautology.context).reasonCode,"unsolved_output");
  const unused=viet(); unused.plan.steps.at(-1).rhs=unused.context.goal;
  assert.equal(verifyReasoningPlan(unused.plan,unused.context).reasonCode,"unused_source");
});

test("isolate semiperimeter from r=S/p with nonzero geometric quantities", () => {
  const {context}=triangle("p",["S","r"]);
  const plan={version:1,target:"p",steps:[
    apply("source","hh10-bankinh-noitiep",{r:"r",S:"S",p:"p"},"r"),
    derive("answer",["source"],"p",div(s("S"),s("r")),"isolate_linear")
  ]};
  assert.equal(verifyReasoningPlan(plan,context).status,"verified");
});
test("undeclared dependencies and extra disconnected steps rejected", () => {
  const missing=viet(); missing.plan.steps.at(-1).from=["sum"];
  assert.equal(verifyReasoningPlan(missing.plan,missing.context).reasonCode,"uncited_input");
  const extra=viet();
  extra.context.goal=pow(add(s("x1"),s("x2")),2);
  extra.plan.steps.at(-1).from=["sum"];
  extra.plan.steps.at(-1).rhs=pow(s("S"),2);
  assert.equal(verifyReasoningPlan(extra.plan,extra.context).reasonCode,"unconnected_step");
});
test("version, step count, aliased bindings and missing formula rejected", () => {
  const version=viet(); version.plan.version=2;
  assert.equal(verifyReasoningPlan(version.plan,version.context).reasonCode,"target");
  const count=viet(); count.plan.steps=Array(7).fill(count.plan.steps[0]);
  assert.equal(verifyReasoningPlan(count.plan,count.context).reasonCode,"step_limit");
  const alias=triangle(); alias.plan.steps[0].bindings.b="a";
  assert.equal(verifyReasoningPlan(alias.plan,alias.context).reasonCode,"bindings");
  const missing=triangle(); missing.plan.steps[0].formulaId="fake";
  assert.equal(verifyReasoningPlan(missing.plan,missing.context).reasonCode,"source_mismatch");
});
