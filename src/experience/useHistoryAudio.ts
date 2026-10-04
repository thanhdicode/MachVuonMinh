import { useCallback, useEffect, useRef, useState } from 'react'
import { historyAudio } from '../data/historyAudio.ts'
import gsap from 'gsap'
import { timeline, useWorld } from './WorldState.ts'
import { machineState, machineRhythmGain } from './machineState.ts'

const AMBIENT_GAIN = .16
const SILENCE_FADE_SECONDS = .9
const ACTIVATION_CUE_SECONDS = .3

type LoadBuffer = (url: string) => Promise<AudioBuffer>
type Channel = { gain: GainNode; source: AudioBufferSourceNode | null }
type Schedule = (callback: () => void, delay: number) => unknown
type CancelSchedule = (handle: unknown) => void
export type AudioDiagnostics = { contextState: AudioContextState | 'uninitialized'; rms: number; peak: number; era: number | null }

export function createAudioOutput(context: AudioContext) {
  const output=context.createGain(), analyser=context.createAnalyser()
  output.gain.value=1;analyser.fftSize=512
  output.connect(analyser);analyser.connect(context.destination)
  return {output,analyser}
}

export function readAudioMeter(analyser: AnalyserNode, samples: Float32Array<ArrayBuffer>) {
  analyser.getFloatTimeDomainData(samples)
  let sum=0,peak=0
  for(const sample of samples){sum+=sample*sample;peak=Math.max(peak,Math.abs(sample))}
  return {rms:Math.sqrt(sum/samples.length),peak}
}

export async function resumeAudioContext(context: AudioContext) {
  await context.resume()
  if (context.state !== 'running') throw new Error(`AudioContext did not start (state: ${context.state}).`)
}

export function playActivationCue(context: AudioContext, output: AudioNode = context.destination) {
  const oscillator = context.createOscillator(), gain = context.createGain(), now = context.currentTime
  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(440, now)
  oscillator.frequency.setValueAtTime(440, now + .145)
  oscillator.frequency.exponentialRampToValueAtTime(660, now + .155)
  gain.gain.setValueAtTime(.0001, now)
  gain.gain.exponentialRampToValueAtTime(.08, now + .025)
  gain.gain.setValueAtTime(.055, now + .145)
  gain.gain.exponentialRampToValueAtTime(.08, now + .17)
  gain.gain.exponentialRampToValueAtTime(.0001, now + ACTIVATION_CUE_SECONDS)
  oscillator.connect(gain); gain.connect(output)
  oscillator.start(now); oscillator.stop(now + ACTIVATION_CUE_SECONDS)
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
}

export function createHistoryAudioEngine(
  context: AudioContext,
  loadBuffer: LoadBuffer,
  onError: (message: string) => void = () => {},
  schedule: Schedule = (callback, delay) => setTimeout(callback, delay),
  cancelSchedule: CancelSchedule = handle => clearTimeout(handle as ReturnType<typeof setTimeout>),
  output: AudioNode = context.destination,
  onEra: (era: number) => void = () => {},
) {
  const channels: Channel[] = [0, 1].map(() => {
    const gain = context.createGain()
    gain.gain.value = 0
    gain.connect(output)
    return { gain, source: null }
  })
  const buffers = new Map<string, AudioBuffer>()
  let activeChannel = 1
  let request = 0
  let closed = false
  let transitioning = false
  let queuedEra: number | null = null
  let transitionTimer: unknown | null = null

  const ramp = (channel: Channel, value: number, seconds: number) => {
    const now = context.currentTime
    channel.gain.gain.cancelScheduledValues(now)
    channel.gain.gain.setValueAtTime(channel.gain.gain.value, now)
    channel.gain.gain.linearRampToValueAtTime(value, now + seconds)
  }

  const finishAfter = (milliseconds: number) => {
    if (transitionTimer !== null) cancelSchedule(transitionTimer)
    transitioning = true
    transitionTimer = schedule(() => {
      transitionTimer = null
      transitioning = false
      const next = queuedEra
      queuedEra = null
      if (next !== null && !closed) void playEra(next)
    }, milliseconds)
  }

  const silence = () => {
    request++
    queuedEra = null
    channels.forEach(channel => ramp(channel, 0, SILENCE_FADE_SECONDS))
    finishAfter(SILENCE_FADE_SECONDS * 1000)
  }

  async function playEra(era: number) {
    if (closed) return
    const track = historyAudio[era]
    if (!track) { silence(); return }
    if (transitioning) { queuedEra = era; return }
    const currentRequest = ++request
    try {
      let buffer = buffers.get(track.src)
      if (!buffer) {
        buffer = await loadBuffer(track.src)
        buffers.set(track.src, buffer)
      }
      if (closed || currentRequest !== request) return
      const incomingIndex = activeChannel === 0 ? 1 : 0
      const incoming = channels[incomingIndex]
      const outgoing = channels[activeChannel]
      try { incoming.source?.stop() } catch { /* already stopped */ }
      const source = context.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(incoming.gain)
      incoming.source = source
      incoming.gain.gain.value = 0
      source.start()
      onEra(era)
      const seconds = track.crossfadeMs / 1000
      ramp(incoming, AMBIENT_GAIN, seconds)
      ramp(outgoing, 0, seconds)
      try { outgoing.source?.stop(context.currentTime + seconds + .05) } catch { /* already stopped */ }
      activeChannel = incomingIndex
      finishAfter(track.crossfadeMs)
    } catch (error) {
      if (currentRequest === request) {silence();onError(error instanceof Error ? error.message : 'Không thể phát âm thanh lịch sử.')}
    }
  }

  const close = () => {
    closed = true
    request++
    queuedEra = null
    if (transitionTimer !== null) cancelSchedule(transitionTimer)
    channels.forEach(channel => { try { channel.source?.stop() } catch { /* already stopped */ } })
  }

  return { playEra, silence, close }
}

export function useHistoryAudio(activeEra: number, inHistory: boolean): { enabled: boolean; toggle: () => void; error: string | null; contextState: AudioDiagnostics['contextState']; rms: number; peak: number; era: number | null } {
  const inMachine=useWorld(s=>s.machine), paused=useWorld(s=>s.paused), sound=useWorld(s=>s.sound)
  const [enabled, setEnabled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [diagnostics,setDiagnostics]=useState<AudioDiagnostics>({contextState:'uninitialized',rms:0,peak:0,era:null})
  const enabledRef = useRef(false)
  const eraRef = useRef(activeEra)
  const inHistoryRef = useRef(inHistory)
  const contextRef = useRef<AudioContext | null>(null)
  const engineRef = useRef<ReturnType<typeof createHistoryAudioEngine> | null>(null)
  const activatingRef = useRef(false)
  const outputRef=useRef<GainNode|null>(null),analyserRef=useRef<AnalyserNode|null>(null),meterSamplesRef=useRef<Float32Array<ArrayBuffer>|null>(null)
  const meterUntilRef=useRef(0)
  const mechanicalRef=useRef<{gain:GainNode;motor:OscillatorNode;shaft:OscillatorNode;stations:{oscillator:OscillatorNode;gain:GainNode}[]}|null>(null)
  const machineRef=useRef(inMachine)
  machineRef.current=inMachine
  eraRef.current = activeEra
  inHistoryRef.current = inHistory

  const audible = () => (inHistoryRef.current || machineRef.current) && !document.hidden && enabledRef.current && !useWorld.getState().paused
  const silenceMechanical=()=>{
    const context=contextRef.current,mechanical=mechanicalRef.current
    if(!context||!mechanical)return
    for(const gain of [mechanical.gain,...mechanical.stations.map(layer=>layer.gain)]){
      gain.gain.cancelScheduledValues(context.currentTime);gain.gain.setTargetAtTime(0,context.currentTime,.12)
    }
  }

  const toggle = useCallback(() => {
    if (enabledRef.current) {
      enabledRef.current = false
      setEnabled(false)
      useWorld.getState().set({sound:false})
      engineRef.current?.silence()
      silenceMechanical()
      meterUntilRef.current=performance.now()+SILENCE_FADE_SECONDS*1000
      return
    }
    if (activatingRef.current) return
    activatingRef.current = true
    useWorld.getState().set({sound:false})
    setError(null)
    void (async () => {
      try {
        if (!contextRef.current) {
          const context = new AudioContext()
          contextRef.current = context
          const {output,analyser}=createAudioOutput(context)
          outputRef.current=output;analyserRef.current=analyser;meterSamplesRef.current=new Float32Array(analyser.fftSize)
          const gain=context.createGain(), motor=context.createOscillator(), shaft=context.createOscillator()
          gain.gain.value=0;gain.connect(output)
          motor.frequency.value=83;shaft.frequency.value=84.8
          motor.connect(gain);shaft.connect(gain);motor.start();shaft.start()
          const stations=[125,166,209].map(frequency=>{
            const oscillator=context.createOscillator(),layer=context.createGain()
            oscillator.type='triangle';oscillator.frequency.value=frequency;layer.gain.value=0
            oscillator.connect(layer);layer.connect(output);oscillator.start()
            return {oscillator,gain:layer}
          })
          mechanicalRef.current={gain,motor,shaft,stations}
          engineRef.current = createHistoryAudioEngine(context, async url => {
            const response = await fetch(url)
            if (!response.ok) throw new Error(`Audio ${response.status}: ${url}`)
            return context.decodeAudioData(await response.arrayBuffer())
          }, message => { console.error('[history audio]', message); setError(message) }, undefined, undefined, output, era=>setDiagnostics(previous=>({...previous,era})))
        }
        await resumeAudioContext(contextRef.current)
        setDiagnostics(previous=>({...previous,contextState:contextRef.current!.state}))
        meterUntilRef.current=performance.now()+ACTIVATION_CUE_SECONDS*1000
        playActivationCue(contextRef.current,outputRef.current!)
        enabledRef.current = true
        setEnabled(true)
        useWorld.getState().set({sound:true})
        if (audible()) await engineRef.current?.playEra(machineRef.current?4:eraRef.current)
      } catch (cause) {
        enabledRef.current = false
        setEnabled(false)
        useWorld.getState().set({sound:false})
        const message=cause instanceof Error ? cause.message : 'Không thể bật âm thanh lịch sử.'
        console.error('[history audio activation]', cause)
        setDiagnostics(previous=>({...previous,contextState:contextRef.current?.state ?? 'uninitialized',rms:0,peak:0}))
        setError(message)
      } finally {
        activatingRef.current = false
      }
    })()
  }, [])

  useEffect(() => {
    if (!enabledRef.current || !engineRef.current) return
    if (audible()) void engineRef.current.playEra(inMachine?4:activeEra)
    else {engineRef.current.silence();silenceMechanical();meterUntilRef.current=performance.now()+SILENCE_FADE_SECONDS*1000}
  }, [activeEra, inHistory, inMachine, paused])

  useEffect(()=>{
    // Other exhibits can enable the shared preference without starting this
    // engine. Global mute still disables a previously enabled history engine.
    if(!inHistory&&!inMachine){if(!sound&&enabledRef.current)toggle();return}
    if(sound!==enabledRef.current)toggle()
  },[sound,toggle,inHistory,inMachine])
  useEffect(()=>{
    const timer=setInterval(()=>{
      const analyser=analyserRef.current,samples=meterSamplesRef.current,context=contextRef.current
      if(!analyser||!samples||!context)return
      const now=performance.now(),scene=inHistoryRef.current||machineRef.current
      if(!document.hidden&&scene&&(audible()||now<meterUntilRef.current)){
        const meter=readAudioMeter(analyser,samples)
        setDiagnostics(previous=>({...previous,contextState:context.state,rms:+meter.rms.toFixed(5),peak:+meter.peak.toFixed(5)}))
      }else if(now>=meterUntilRef.current)setDiagnostics(previous=>previous.rms||previous.peak?{...previous,contextState:context.state,rms:0,peak:0}:previous)
    },100)
    return()=>clearInterval(timer)
  },[])
  useEffect(()=>{
    let previous=0,wasActive=false
    const update=()=>{
      const context=contextRef.current,mechanical=mechanicalRef.current
      if(!context||!mechanical)return
      const active=audible()&&machineRef.current,p=machineState.progress
      const justActivated=active&&!wasActive
      if(justActivated)previous=p
      mechanical.gain.gain.setTargetAtTime(machineRhythmGain(timeline.velocity,p,active),context.currentTime,.35)
      mechanical.shaft.frequency.setTargetAtTime(84.8+Math.min(3,Math.abs(timeline.velocity)*.12),context.currentTime,.3)
      mechanical.stations.forEach((layer,i)=>layer.gain.gain.setTargetAtTime(active&&p>=[.28,.38,.47][i]?.0015+Math.min(.001,Math.abs(timeline.velocity)*.00006):0,context.currentTime,.4))
      if(active&&!justActivated)for(const threshold of [.28,.38,.47])if(previous<threshold&&p>=threshold){
        const click=context.createOscillator(),gain=context.createGain()
        click.frequency.setValueAtTime(142,context.currentTime);click.frequency.exponentialRampToValueAtTime(74,context.currentTime+.12)
        gain.gain.setValueAtTime(.025,context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+.18)
        click.connect(gain);gain.connect(outputRef.current!);click.start();click.stop(context.currentTime+.2)
        click.onended=()=>{click.disconnect();gain.disconnect()}
      }
      previous=active?p:0
      wasActive=active
    }
    gsap.ticker.add(update)
    return()=>gsap.ticker.remove(update)
  },[])

  useEffect(() => {
    const visibility = () => {
      if (!engineRef.current || !enabledRef.current) return
      if (audible()) void engineRef.current.playEra(machineRef.current?4:eraRef.current)
      else {engineRef.current.silence();silenceMechanical();meterUntilRef.current=performance.now()+SILENCE_FADE_SECONDS*1000}
    }
    document.addEventListener('visibilitychange', visibility)
    return () => document.removeEventListener('visibilitychange', visibility)
  }, [])

  useEffect(() => () => {
    enabledRef.current = false
    engineRef.current?.close()
    mechanicalRef.current?.motor.stop();mechanicalRef.current?.shaft.stop()
    mechanicalRef.current?.stations.forEach(layer=>layer.oscillator.stop())
    void contextRef.current?.close()
  }, [])

  return { enabled, toggle, error, ...diagnostics }
}
