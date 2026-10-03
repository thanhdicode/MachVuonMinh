import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const rate = 16000, duration = 12, count = rate * duration, tau = Math.PI * 2
const targetRms = 10 ** (-23 / 20), peakLimit = 10 ** (-5 / 20)
let seed = 0x6d616368
const random = () => ((seed ^= seed << 13, seed ^= seed >>> 17, seed ^= seed << 5) >>> 0) / 0xffffffff * 2 - 1
const coloredNoise = cutoff => { let value=0;const alpha=1-Math.exp(-tau*cutoff/rate);return()=>value+=alpha*(random()-value) }
const pulse = (t, period, width=.1) => { const phase=(t%period)/period; return phase<width ? Math.exp(-phase*8/width) : 0 }
const tone = (t, hz, phase=0) => Math.sin(tau*hz*t+phase)
const softClip = value => Math.tanh(value * 1.25) * .72

const water=coloredNoise(900),steam=coloredNoise(650),workshop=coloredNoise(1400),industry=coloredNoise(850),rural=coloredNoise(1000),digital=coloredNoise(1800)
const moods = [
  ['history-01-village-water.wav', t => .3*tone(t,[220,275,330,440,550][Math.floor(t/.75)%5])*pulse(t,.75,.55)+.11*tone(t,1040)*pulse(t,1.5,.09)+.012*water()*Math.sin(Math.PI*(t%1.7)/1.7)**2+.035*tone(t,110)],
  ['history-02-steam-rail.wav', t => .025*steam()*(.6+.4*tone(t,.19))+.22*tone(t,82)*pulse(t,1.5,.25)+.13*tone(t,360)*pulse(t,.75,.08)+.045*tone(t,55)],
  ['history-03-workshop-forge.wav', t => .2*tone(t,180)*pulse(t,1,.16)+.15*tone(t,620)*pulse(t,2,.1)+.008*workshop()*pulse(t,1,.12)+.06*tone(t,73)+.025*tone(t,146)],
  ['history-04-measured-industry.wav', t => .18*tone(t,55)*pulse(t,.6,.38)+.11*tone(t,110)+.05*tone(t,165)+.006*industry()*pulse(t,.6,.14)],
  ['history-05-analog-hum.wav', t => .15*tone(t,50)+.085*tone(t,100)+.045*tone(t,150)+.025*tone(t,52,.35*tone(t,.08))],
  ['history-06-warm-electronic.wav', t => .13*tone(t,110)+.11*tone(t,165)+.09*tone(t,220)+.09*tone(t,[330,440,550][Math.floor(t*2)%3])*pulse(t,.5,.42)],
  ['history-07-rural-electric.wav', t => .15*tone(t,50)+.085*tone(t,100)+.11*tone(t,75)*pulse(t,1.5,.42)+.006*rural()*Math.sin(Math.PI*(t%2)/2)**2],
  ['history-08-digital-micro.wav', t => .14*tone(t,880)*pulse(t,.375,.12)+.1*tone(t,1320)*pulse(t,.75,.09)+.055*tone(t,110)+.035*tone(t,220)+.003*digital()*pulse(t,1.5,.08)],
]

function writeWave(name, synth) {
  const bytes = Buffer.alloc(44 + count * 2)
  const samples = new Float64Array(count)
  let sum = 0, peak = 0
  bytes.write('RIFF',0); bytes.writeUInt32LE(36+count*2,4); bytes.write('WAVEfmt ',8); bytes.writeUInt32LE(16,16)
  bytes.writeUInt16LE(1,20); bytes.writeUInt16LE(1,22); bytes.writeUInt32LE(rate,24); bytes.writeUInt32LE(rate*2,28)
  bytes.writeUInt16LE(2,32); bytes.writeUInt16LE(16,34); bytes.write('data',36); bytes.writeUInt32LE(count*2,40)
  for (let i=0;i<count;i++) {
    const t=i/rate, edge=Math.min(1,i/(rate*.08),(count-1-i)/(rate*.08))
    const sample=softClip(synth(t))*Math.max(0,edge)
    samples[i]=sample; sum+=sample*sample; peak=Math.max(peak,Math.abs(sample))
  }
  const scale=Math.min(targetRms/Math.sqrt(sum/count),peakLimit/peak)
  for (let i=0;i<count;i++) bytes.writeInt16LE(Math.round(samples[i]*scale*32767),44+i*2)
  const path=resolve('public/audio',name); mkdirSync(dirname(path),{recursive:true}); writeFileSync(path,bytes)
}

moods.forEach(([name,synth])=>writeWave(name,synth))
console.log(`Prepared ${moods.length} original history ambience loops.`)
