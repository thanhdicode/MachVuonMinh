import {spawn} from 'node:child_process'
import {mkdir,writeFile} from 'node:fs/promises'

const out='.studio/qa/owl-guide/logs'
await mkdir(out,{recursive:true})
const jobs=['intro','production','lab','vietnam','finale'].map(module=>({name:module,script:'matrix-walk',args:['--module',module,'--width','1366','--height','768','--tag',`driver-laptop-${module}-1366`]}))
jobs.push({name:'game',script:'game-walk',args:['--width','1366','--height','768','--via','module','--tag','driver-laptop-game-1366']},{name:'states',script:'states',args:['--width','1366','--height','768','--tag','driver-laptop-1366']},{name:'history1024',script:'matrix-walk',args:['--module','history','--width','1024','--height','768','--tag','driver-laptop-history-1024']})
const results=[]
async function worker(){while(jobs.length){const job=jobs.shift();let log='';const code=await new Promise(resolve=>{const child=spawn(process.execPath,[`scripts/owl-guide-qa/${job.script}.mjs`,...job.args],{env:{...process.env,QA_URL:'http://127.0.0.1:5180/'},stdio:['ignore','pipe','pipe']});child.stdout.on('data',d=>{log+=d});child.stderr.on('data',d=>{log+=d});child.on('close',resolve)});await writeFile(`${out}/driver-laptop-${job.name}.log`,log);results.push({name:job.name,code});console.log(job.name,code===0?'PASS':'FAILED',log.split('\n').slice(-3).join(' '))}}
await Promise.all([worker(),worker()])
await writeFile(`${out}/driver-laptop-summary.json`,JSON.stringify(results,null,2))
if(results.some(r=>r.code!==0))process.exitCode=1
