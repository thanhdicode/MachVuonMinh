import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const source=await readFile('src/minigame/assets/game.js','utf8')
const context={window:{}}
for(const file of ['questions.js','document-questions.js'])vm.runInNewContext(await readFile(`src/minigame/assets/${file}`,'utf8'),context)
const bank=vm.runInNewContext(source.slice(source.indexOf('  const questions = ['),source.indexOf('  const bosses = ['))+'\nquestions',context)
const imported=context.window.GAME_DOCUMENT_QUESTIONS
const report=JSON.parse(await readFile('.studio/qa/minigame/question-import-report.json','utf8'))
assert.deepEqual(Array.from(imported,list=>list.length),[6,3,4,3,1])
assert.deepEqual(Array.from(bank,list=>list.length),[18,15,16,15,13])
assert.equal(imported.flat().length,17)
assert.equal(bank.flat().length,77)
const sourceKeys=Array.from(imported,list=>Array.from(list,q=>'ABCD'[q.correct]))
assert.deepEqual(sourceKeys,report.answerKeys,'Yellow highlights from the DOCX retain their answer mapping')
const titles=new Set(),ids=new Set()
for(const [stage,list] of bank.entries())for(const q of list){
  assert.ok(q.q.trim()&&q.explain.trim(),'Question and explanation are present')
  assert.equal(q.a.length,4)
  assert.equal(new Set(q.a.map(a=>a.trim())).size,4,'Four distinct choices')
  assert.ok(q.a.every(a=>a.trim()))
  assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4)
  assert.ok(!titles.has(q.q),'No exact duplicate questions');titles.add(q.q)
  if(q.source){
    assert.equal(q.source.stage,stage+1,'Source stage is preserved')
    assert.ok(!ids.has(q.id));ids.add(q.id)
  }
}
// Use the actual deck/shuffle functions to verify correct answers survive display shuffling.
const functions=['shuffle','nextQuestion'].map(name=>{
  const start=source.indexOf(`  function ${name}(`),end=source.indexOf('  function ',start+5)
  return source.slice(start,end)
}).join('\n')
for(const [stage,list] of imported.entries())for(const original of list){
  const state={stage,questionDecks:Array.from({length:5},()=>[]),lastQuestions:Array(5).fill(null)}
  const next=new Function('state','questions',functions+';return nextQuestion')(state,bank)
  for(let i=0;i<20;i++){
    state.questionDecks[stage]=[original]
    const shown=next()
    assert.equal(shown.a[shown.correct],original.a[original.correct],'Correct answer stays correct after shuffling')
    assert.equal(shown.id,original.id)
  }
}
console.log('Question checks passed: 77 total, 17 from DOCX, source stages and shuffled answer keys preserved.')
