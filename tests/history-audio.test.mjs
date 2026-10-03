import assert from 'node:assert/strict'
import { createAudioOutput, createHistoryAudioEngine, playActivationCue, readAudioMeter, resumeAudioContext } from '../src/experience/useHistoryAudio.ts'

const routing=[]
const routingContext={destination:{id:'destination'},createGain(){return {gain:{value:0},connect:target=>routing.push(['master',target])}},createAnalyser(){return {fftSize:0,connect:target=>routing.push(['analyser',target]),getFloatTimeDomainData(array){array.set([0,.25,-.5,.25])}}}}
const audioOutput=createAudioOutput(routingContext)
assert.equal(audioOutput.analyser.fftSize,512)
assert.deepEqual(routing,[['master',audioOutput.analyser],['analyser',routingContext.destination]],'all sources route through analyser to destination')
assert.deepEqual(readAudioMeter(audioOutput.analyser,new Float32Array(4)),{rms:Math.sqrt(.375/4),peak:.5})

const cueEvents=[]
const cueContext={
  state:'suspended',currentTime:2,destination:{},
  async resume(){this.state='running'},
  createOscillator(){return {type:'sine',frequency:{setValueAtTime:(...args)=>cueEvents.push(['frequency',...args]),exponentialRampToValueAtTime:(...args)=>cueEvents.push(['frequencyRamp',...args])},connect(){},disconnect(){},start:time=>cueEvents.push(['start',time]),stop:time=>cueEvents.push(['stop',time]),onended:null}},
  createGain(){return {gain:{setValueAtTime:(...args)=>cueEvents.push(['gain',...args]),exponentialRampToValueAtTime:(...args)=>cueEvents.push(['gainRamp',...args])},connect(){},disconnect(){}}},
}
await resumeAudioContext(cueContext)
playActivationCue(cueContext)
assert.equal(cueContext.state,'running')
assert.deepEqual(cueEvents.find(event=>event[0]==='stop'),['stop',2.3],'activation cue lasts 300ms')
assert.ok(cueEvents.filter(event=>event[0]==='gainRamp'&&event[1]===.08).length===2,'activation cue gives both notes a clean quiet attack')
assert.ok(cueEvents.some(event=>event[0]==='frequencyRamp'&&event[1]===660),'activation cue resolves from 440Hz to 660Hz')
await assert.rejects(resumeAudioContext({state:'suspended',async resume(){}}),/did not start/,'failed resume must not report audio enabled')

const pending = new Map()
const gains = []
const sources = []
const timers = new Map()
let timerId = 0
const context = {
  currentTime: 4,
  destination: {},
  createGain() {
    const events = []
    const node = { gain: {
      value: 0,
      cancelScheduledValues: time => events.push(['cancel', time]),
      setValueAtTime: (value, time) => events.push(['set', value, time]),
      linearRampToValueAtTime: (value, time) => events.push(['ramp', value, time]),
    }, connect() {} }
    gains.push({ node, events })
    return node
  },
  createBufferSource() {
    const node = { connect() {}, startCount: 0, stopCalls: [], stop(time) { this.stopCalls.push(time) }, start() { this.startCount++ } }
    sources.push(node)
    return node
  },
}
const load = url => new Promise(resolve => pending.set(url, resolve))
const schedule = callback => { const id=++timerId; timers.set(id,callback); return id }
const cancel = id => timers.delete(id)
const finishFade = () => { const [id,callback]=timers.entries().next().value; timers.delete(id); callback() }
const engine = createHistoryAudioEngine(context, load, () => {}, schedule, cancel)

const first = engine.playEra(0)
const second = engine.playEra(1)
pending.get('/audio/history-02-steam-rail.wav')({ era: 1 })
await second
pending.get('/audio/history-01-village-water.wav')({ era: 0 })
await first
assert.equal(sources.length, 1, 'a stale era load must never start')
assert.equal(sources[0].startCount, 1)

const third = engine.playEra(2), fourth = engine.playEra(3)
if (pending.has('/audio/history-03-workshop-forge.wav')) pending.get('/audio/history-03-workshop-forge.wav')({ era: 2 })
await third
if (pending.has('/audio/history-04-measured-industry.wav')) pending.get('/audio/history-04-measured-industry.wav')({ era: 3 })
await fourth
assert.equal(sources.length, 1, 'rapid switches must wait for the audible crossfade to finish')
assert.ok(sources.every(source => source.stopCalls.every(time => time !== undefined)), 'rapid switches must not hard-stop an audible source')

finishFade()
pending.get('/audio/history-04-measured-industry.wav')({ era: 3 })
await Promise.resolve(); await Promise.resolve()
assert.equal(sources.length, 2, 'the next era uses the other channel')
assert.ok(gains.some(({ events }) => events.some(event => event[0] === 'ramp' && event[1] === 0.16)), 'incoming channel fades to ambient volume')
assert.ok(gains.some(({ events }) => events.some(event => event[0] === 'ramp' && event[1] === 0)), 'outgoing channel fades to silence')
const fadeEnds = gains.flatMap(({ events }) => events.filter(event => event[0] === 'ramp').map(event => event[2] - context.currentTime))
assert.ok(fadeEnds.every(seconds => seconds >= .9 && seconds <= 1.3), 'crossfades stay within 900–1300ms')

engine.silence()
assert.ok(gains.every(({ events }) => events.at(-1)[0] === 'ramp' && events.at(-1)[1] === 0), 'inactive atlas fades both channels out')
engine.playEra(4)
engine.silence()
finishFade()
await Promise.resolve()
assert.equal(sources.length, 2, 'silence must discard queued eras instead of resurrecting them')
const errors=[]
const failed=createHistoryAudioEngine(context,async url=>{if(url.includes('forge'))throw new Error('decode failed');return {}},error=>errors.push(error),schedule,cancel)
await failed.playEra(0);finishFade()
await failed.playEra(2)
assert.deepEqual(errors,['decode failed'])
assert.ok(gains.slice(-2).every(({events})=>events.at(-1)[1]===0),'failed transition must fade stale ambience out')
failed.close()
console.log('History audio checks passed: stale loads, coalesced crossfades, silence cancellation and failed transition fade.')
