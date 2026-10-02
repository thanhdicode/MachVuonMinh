import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source=await readFile('src/minigame/assets/game.js','utf8')
const physics=['spawnObstacle','playerBox','obstacleBox','overlaps'].map(name=>{
  const start=source.indexOf(`  function ${name}(`),end=source.indexOf('  function ',start+5)
  return source.slice(start,end)
}).join('\n')
const patterns=['hurdle','wide','double','duck-jump','jump-duck','drone','spike']
const constants=source.match(/BASE_SPEED=(\d+), MAX_SPEED=(\d+), GRAVITY=(\d+), JUMP_SPEED=(\d+)/).slice(1).map(Number)
const [base,cap,gravity,jumpSpeed]=constants
const originalRandom=Math.random
let checks=0
try{
  for(const W of [550,900,1400])for(const speed of [base,540,cap])for(const [index,pattern] of patterns.entries())for(const variation of [.01,.99]){
    const state={player:{y:0,vy:0,duck:false},stage:2,score:30,speed,clock:0,obstacles:[],pattern:null}
    const api=new Function('W','state','$',`const groundY=333;${physics};return {spawnObstacle,playerBox,obstacleBox,overlaps}`)(W,state,()=>({textContent:''}))
    let randomCall=0
    Math.random=()=>randomCall++===0?index/7+.01:variation
    api.spawnObstacle();Math.random=originalRandom
    const obstacles=structuredClone(state.obstacles),velocity=speed*W/1000,p=api.playerBox()
    const first=obstacles[0],last=obstacles.at(-1)
    const arrival=(first.x-p.x-p.w)/velocity,finish=(last.x+last.w-p.x)/velocity+.3
    const target=pattern==='duck-jump'?(last.x-p.x-p.w)/velocity:arrival
    let solved=false
    for(let jumpTime=target-.65;jumpTime<=target+.06&&!solved;jumpTime+=.015){
      state.player={y:0,vy:0,duck:false};state.obstacles=structuredClone(obstacles)
      let jumped=false,failed=false
      const duckAfter=(first.x+first.w-p.x)/velocity+.04
      for(let t=0;t<finish;t+=1/240){
        state.clock=t*1000
        if(pattern!=='drone'&&!jumped&&t>=jumpTime){state.player.vy=-jumpSpeed;state.player.y=-1;jumped=true;state.player.duck=false}
        const ducking=pattern==='drone'||(pattern==='duck-jump'&&!jumped)||(pattern==='jump-duck'&&t>=duckAfter)
        if(ducking&&state.player.y<0)state.player.vy=Math.max(state.player.vy,600)
        state.player.duck=ducking;state.player.vy+=gravity/240;state.player.y+=state.player.vy/240
        if(state.player.y>0){state.player.y=0;state.player.vy=0}
        for(const o of state.obstacles)o.x-=velocity/240
        if(state.obstacles.some(o=>api.overlaps(api.playerBox(),api.obstacleBox(o)))){failed=true;break}
      }
      solved=!failed
    }
    assert.ok(solved,`Physically solvable: ${pattern}, virtual width ${W}, speed ${speed}`)
    assert.ok(state.spawnIn>=.82,'Next group leaves a recovery interval')
    checks++
  }
}finally{Math.random=originalRandom}
console.log(`Runner checks passed: ${checks} obstacle/speed/viewport combinations have a collision-free input sequence.`)
