import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { askFinder, finalizeAnswer, countsAsTurn, completionBudget, noFormulaReason } from '../lib/finderAnswer.js';
import { parseModelJson, checkBaseKnowledge } from '../lib/solutionGuard.js';
import { isCoordinateCircleTask, unsafeCircleAnswer } from '../lib/circleAnswerGuard.js';
const rows=JSON.parse(fs.readFileSync(new URL('./fixtures/phase2-eval.json',import.meta.url),'utf8'));
const evalRows=JSON.parse(fs.readFileSync(new URL('./fixtures/hotfix-circle.json',import.meta.url),'utf8'));
test('completion cap preserves 200 tokens and never uses less than 1200',()=>{
 assert.equal(completionBudget(5200),2300);assert.equal(completionBudget(5700),2100);
 assert.equal(completionBudget(6600),1200);assert.equal(completionBudget(6601),null);
 assert.equal(completionBudget(5200,true),2000);
});
test('a complete retry after length may be delivered',async()=>{
 let calls=0;const groq={chat:{completions:{create:async()=>({choices:[{finish_reason:++calls===1?'length':'stop',message:{content:'{"type":"off_topic","intro":"Chỉ hỗ trợ toán.","steps":[]}'}}]})}}};
 const out=await askFinder({groq,message:'Xin chào'});assert.equal(out.answer.type,'off_topic');assert.equal(countsAsTurn(out.answer,out.meta),true);
});
test('given circle centre is retained; computed centre is rejected',()=>{
 const raw={type:'solution',formula_ids:['hh10-duongtron-phuongtrinh'],intro:'Dùng công thức đường tròn.',steps:[{title:'Dữ kiện',detail:'Tâm I(2; -3), R = 4.',expression:''}],reminder:''};
 assert.equal(finalizeAnswer(raw,{message:'Viết phương trình đường tròn có tâm I(2; -3) và bán kính R = 4',mask:true}).answer.type,'solution');
 assert.equal(finalizeAnswer(raw,{message:'Tìm tâm và bán kính đường tròn x²+y²-4x+6y-12=0',mask:true}).answer.type,'no_formula');
});
test('safe circle guidance with blanks is delivered unchanged',()=>{
 const raw={type:'solution',formula_ids:['hh10-duongtron-phuongtrinh'],intro:'Dùng phương trình đường tròn.',steps:[
  {title:'Hoàn thành bình phương',detail:'Nhóm các hạng tử theo $x$ và $y$, rồi hoàn thành bình phương.',expression:''},
  {title:'Đối chiếu công thức',detail:'So sánh với $(x-a)^2+(y-b)^2=R^2$ và tự điền tâm, bán kính.',expression:'I(a;b)=?, \\quad R=?'}
 ],reminder:'Tự hoàn thành các ô trống.'};
 const out=finalizeAnswer(raw,{message:'Tìm tâm và bán kính đường tròn x² + y² - 4x + 6y - 12 = 0',mask:true,grade:10});
 assert.equal(out.answer.type,'solution');
 assert.deepEqual(out.answer.steps,raw.steps);
 assert.equal(out.answer.intro,raw.intro);
 assert.equal(out.answer.reminder,raw.reminder);
});
test('internal card id is replaced with its name in guidance',()=>{
 const raw={type:'solution',formula_ids:['mr-elip'],intro:'Dùng (mr-elip) để hướng dẫn.',steps:[{title:'Công thức',detail:'Áp dụng (mr-elip).',expression:''}],reminder:''};
 const out=finalizeAnswer(raw,{message:'Viết phương trình chính tắc elip có độ dài trục lớn 10 và độ dài trục nhỏ 6',mask:true,grade:10});
 assert.equal(out.answer.type,'solution');
 assert.doesNotMatch(out.reply,/mr-elip/);
 assert.match(out.reply,/Phương trình chính tắc của Elip/);
});
test('recorded circle centre leakage fails closed',()=>{
 const r=rows.find(r=>r.index===22);
 const out=finalizeAnswer(parseModelJson(r.calls[0].raw),{message:r.message,mask:true,grade:10});
 assert.equal(out.answer.type,'no_formula');assert.equal(countsAsTurn(out.answer,out.meta),false);
});
test('recorded coordinate circle with given centre is delivered',()=>{
 const r=evalRows.find(r=>r.index===21);
 const out=finalizeAnswer(parseModelJson(r.raw),{message:r.message,mask:true,grade:10});
 assert.equal(out.answer.type,'solution');
 assert.equal(isCoordinateCircleTask(r.message),true);
});
test('Heron incircle and circumcircle answers survive both side phrasings',()=>{
 const questions=[
  'Tam giác ABC có a = 13, b = 14, c = 15. Tính bán kính đường tròn nội tiếp r',
  'Tam giác có ba cạnh 13, 14, 15. Tính bán kính đường tròn nội tiếp r.',
  'Tam giác ABC có a = 13, b = 14, c = 15. Tính bán kính đường tròn ngoại tiếp R',
  'Tam giác có ba cạnh 13, 14, 15. Tính bán kính đường tròn ngoại tiếp R.',
 ];
 for(const [i,index] of [5,5,6,6].entries()){
  const raw=parseModelJson(evalRows.find(r=>r.index===index).raw);
  const out=finalizeAnswer(raw,{message:questions[i],mask:true,grade:null});
  assert.equal(isCoordinateCircleTask(questions[i]),false);
  assert.equal(out.answer.type,'solution',questions[i]);
  assert.ok(out.answer.steps.length>0);
 }
 const sides=evalRows.find(r=>r.index===8);
 const out=finalizeAnswer(parseModelJson(sides.raw),{message:sides.message,mask:true,grade:null});
 assert.equal(out.answer.type,'solution','tam giác 5-12-13');
});
test('circle wording alone does not activate coordinate guard',()=>{
 const unrelated=[
  'Tam giác có ba cạnh 5, 12, 13. Tính bán kính đường tròn nội tiếp.',
  'Tính độ dài cung trên đường tròn lượng giác ứng với góc đã cho.',
  'Hình vuông cạnh 4. Tính bán kính đường tròn nội tiếp hình vuông.',
  'Hình chữ nhật có cạnh 3 và 4. Tính bán kính đường tròn ngoại tiếp.',
 ];
 const suspicious={intro:'',reminder:'',steps:[{title:'',detail:'a = 5, b = 12, R = 3',expression:''}]};
 for(const q of unrelated){assert.equal(isCoordinateCircleTask(q),false,q);assert.equal(unsafeCircleAnswer(suspicious,q),false,q);}
});
test('coordinate circle cues still activate fail-closed guard',()=>{
 for(const q of [
  'Viết phương trình đường tròn có tâm I(2; -3) và bán kính R = 4',
  'Tìm tâm và bán kính đường tròn x² + y² - 4x + 6y - 12 = 0',
  'Cho đường tròn (x-2)^2+(y+3)^2=25. Tìm tâm và bán kính.',
 ])assert.equal(isCoordinateCircleTask(q),true,q);
});
test('no_formula log reason distinguishes circle, base knowledge and AI refusal',()=>{
 assert.equal(noFormulaReason({circleRejected:true}),'circle_guard');
 assert.equal(noFormulaReason({baseKnowledge:{verified:false}}),'base_knowledge_reject');
 assert.equal(noFormulaReason({rawType:'no_formula'}),'ai_refused');
});
test('recorded ellipse preserves symbolic equation',()=>{
 const r=rows.find(r=>r.index===23);
 const out=finalizeAnswer(parseModelJson(r.calls[0].raw),{message:r.message,mask:true,grade:10});
 assert.ok(out.answer.steps.some(s=>s.expression.includes('= 1')));
});
test('length never delivers even parseable JSON; exhausted retries refund',async()=>{
 let calls=0;const groq={chat:{completions:{create:async()=>{calls++;return {choices:[{finish_reason:'length',message:{content:'{"type":"off_topic","steps":[]}'}}],usage:{prompt_tokens:5200}};}}}};
 const out=await askFinder({groq,message:'Giải phương trình x² - 9 = 0',grade:10});
 assert.equal(calls,2);assert.equal(out.answer.type,'unavailable');assert.equal(countsAsTurn(out.answer,out.meta),false);
});
test('triangle suffix only permits the exact question with blank',()=>{
 const q=rows.find(r=>r.index===2).message;
 const candidate=tail=>({steps:[{expression:String.raw`3+4>5,3+5>4,4+5>3`+tail}]});
 assert.ok(checkBaseKnowledge(candidate(String.raw`\Rightarrow \text{có thể tạo tam giác} = ?`),q));
 for(const t of [String.raw`\Rightarrow x=?`,String.raw`\Rightarrow \text{có thể tạo tam giác}=có`,String.raw`\Rightarrow \text{có thể tạo tam giác}=không`,String.raw`\Rightarrow ?`,String.raw`\Rightarrow x=?\Rightarrow \text{có thể tạo tam giác}=?`])assert.equal(checkBaseKnowledge(candidate(t),q),null);
});
