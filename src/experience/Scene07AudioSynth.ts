import * as Tone from 'tone'
import {isScene07Audible,scene07PulseBpm,shouldPlayScene07Finale,type Scene07AudioInput,type Scene07Gesture,type Scene07AudioDiagnostics} from './scene07AudioState'

const SILENCE_SECONDS = .045
const ACTIVE_GAIN = .34
const DEFAULT_INPUT: Scene07AudioInput = {
  active: false,
  paused: false,
  hidden: false,
  beat: 0,
  progress: 0,
  velocity: 0,
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum))

function createGraph() {
  const output = new Tone.Gain(1)
  const meter = new Tone.Meter({ smoothing: 0, normalRange: false })
  const sceneGain = new Tone.Gain(0)
  const cueGain = new Tone.Gain(0)
  output.connect(meter)
  meter.toDestination()
  sceneGain.connect(output)
  cueGain.connect(output)

  const airFilter = new Tone.Filter({ frequency: 620, type: 'lowpass', rolloff: -24 })
  const airGain = new Tone.Gain(.035)
  const air = new Tone.Noise('pink').connect(airFilter)
  airFilter.connect(airGain)
  airGain.connect(sceneGain)
  air.start()

  const humGain = new Tone.Gain(.025)
  const hum = new Tone.Oscillator({ frequency: 49, type: 'sine' }).connect(humGain)
  humGain.connect(sceneGain)
  hum.start()

  const pulse = new Tone.MembraneSynth({
    pitchDecay: .025,
    octaves: 1.2,
    oscillator: { type: 'sine' },
    envelope: { attack: .002, decay: .11, sustain: 0, release: .04 },
  }).connect(sceneGain)
  const metal = new Tone.MetalSynth({
    harmonicity: 3.1,
    modulationIndex: 18,
    resonance: 1800,
    octaves: 1.2,
    envelope: { attack: .001, decay: .09, release: .025 },
  }).connect(sceneGain)
  metal.frequency.value = 150
  const servo = new Tone.FMSynth({
    harmonicity: 1.45,
    modulationIndex: 2.2,
    oscillator: { type: 'sine' },
    envelope: { attack: .002, decay: .07, sustain: 0, release: .08 },
    modulation: { type: 'triangle' },
    modulationEnvelope: { attack: .002, decay: .05, sustain: 0, release: .06 },
  }).connect(sceneGain)
  const glassFilter = new Tone.Filter({ frequency: 2600, type: 'bandpass', Q: 1.4 })
  const glass = new Tone.PluckSynth({ attackNoise: .7, dampening: 4200, resonance: .82 })
    .connect(glassFilter)
  glassFilter.connect(sceneGain)

  const leftPan = new Tone.Panner(-.62).connect(sceneGain)
  const rightPan = new Tone.Panner(.62).connect(sceneGain)
  const motifLeft = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: .004, decay: .08, sustain: 0, release: .12 },
  }).connect(leftPan)
  const motifRight = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: .004, decay: .08, sustain: 0, release: .12 },
  }).connect(rightPan)
  const chord = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: .055, decay: .22, sustain: .12, release: .75 },
  }).connect(sceneGain)
  const cue = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: .004, decay: .06, sustain: 0, release: .08 },
  }).connect(cueGain)
  const interaction=new Tone.PolySynth(Tone.Synth,{oscillator:{type:'triangle'},envelope:{attack:.004,decay:.06,sustain:0,release:.06}}).connect(sceneGain)

  return {
    output, meter, sceneGain, cueGain, airFilter, airGain, air, humGain, hum,
    pulse, metal, servo, glass, glassFilter, leftPan, rightPan, motifLeft,
    motifRight, chord, cue, interaction,
  }
}

type Scene07Graph = ReturnType<typeof createGraph>

class Scene07AudioEngine {
  private graph: Scene07Graph | null = null
  private input = { ...DEFAULT_INPUT }
  private enabled = false
  private audible = false
  private disposed = false
  private finaleArmed = true
  private activation = 0
  private pulseTimer: ReturnType<typeof setTimeout> | null = null
  private cueTimer: ReturnType<typeof setTimeout> | null = null
  private pulseCount=0
  private gestureTime=-Infinity

  async start(): Promise<boolean> {
    if (this.disposed) return false
    if (this.enabled && this.graph && Tone.getContext().state === 'running') return true
    const activation = ++this.activation
    try {
      await Tone.start()
      if (activation !== this.activation || this.disposed) return false
      if (Tone.getContext().state !== 'running') return false
      this.graph ??= createGraph()
      this.enabled = true
      this.setAudible(isScene07Audible(this.input))
      this.playCue()
      return true
    } catch (error) {
      console.warn('Scene07 audio activation failed',error)
      if (activation === this.activation) this.enabled = false
      return false
    }
  }

  bindContext(context:AudioContext):void { if(!this.graph)Tone.setContext(context) }

  stop(): void {
    this.activation++
    this.enabled = false
    this.setAudible(false)
  }

  sync(input: Scene07AudioInput): void {
    const previous = this.input
    this.input = {
      ...input,
      beat: Number.isFinite(input.beat) ? input.beat : 0,
      progress: clamp(input.progress, 0, 1),
      velocity: Number.isFinite(input.velocity) ? input.velocity : 0,
    }
    const nextAudible = this.enabled && isScene07Audible(this.input)
    const wasAudible = this.audible

    if (this.graph) {
      this.graph.airFilter.frequency.rampTo(480 + this.input.progress * 380, .25)
      this.graph.hum.frequency.rampTo(48 + this.input.progress * 5, .25)
    }
    if (nextAudible !== wasAudible) this.setAudible(nextAudible, nextAudible)
    const arrivedAtFinale = shouldPlayScene07Finale(previous.progress, this.input.progress, this.input.velocity)
    if (arrivedAtFinale) {
      if (this.finaleArmed && wasAudible && nextAudible) {
        this.graph?.chord.triggerAttackRelease(['C2', 'G2', 'C3'], .7, Tone.now(), .22)
      }
      this.finaleArmed = false
    } else if (this.input.progress < .88) {
      this.finaleArmed = true
    }
  }

  gesture(kind: Scene07Gesture): void {
    const graph = this.graph
    if (!graph || !this.enabled || !this.audible) return
    const now = Tone.now()
    if(now-this.gestureTime<.07)return
    this.gestureTime=now
    if (kind === 'work') {
      graph.metal.triggerAttackRelease('32n', now, .14)
      graph.interaction.triggerAttackRelease('G2', '32n', now + .035, .12)
    } else if (kind === 'key') {
      graph.glassFilter.frequency.cancelScheduledValues(now)
      graph.glassFilter.frequency.setValueAtTime(1800,now)
      graph.glassFilter.frequency.exponentialRampToValueAtTime(6800,now+.18)
      graph.interaction.triggerAttackRelease('C5', '16n', now, .22)
    } else {
      graph.interaction.triggerAttackRelease(['C4','G4','D5'], '32n', now, .12)
    }
  }

  diagnostics(): Scene07AudioDiagnostics {
    const value = this.graph?.meter.getValue()
    const db = typeof value === 'number' ? value : value?.[0]
    const rms = Number.isFinite(db) ? Tone.dbToGain(db as number) : 0
    return {
      state: this.graph ? Tone.getContext().state : 'uninitialized',
      rms: +clamp(rms, 0, 1).toFixed(5),
      enabled: this.enabled,
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.stop()
    this.disposed = true
    const graph = this.graph
    if (!graph) return
    graph.air.stop()
    graph.hum.stop()
    Object.values(graph).forEach(node => node.dispose())
    this.graph = null
  }

  private setAudible(next: boolean, cue = false) {
    this.audible = next
    const graph = this.graph
    if (!graph) return
    this.ramp(graph.sceneGain, next ? ACTIVE_GAIN : 0, next ? .12 : SILENCE_SECONDS)
    if (!next) {
      this.clearPulse()
      this.clearCue()
      this.ramp(graph.cueGain, 0, SILENCE_SECONDS)
      return
    }
    if (cue) this.playCue()
    this.schedulePulse(true)
  }

  private schedulePulse(immediate = false) {
    this.clearPulse()
    if (!this.audible || !this.enabled) return
    const tick = () => {
      if (!this.audible || !this.enabled || !this.graph) return
      const notes = ['C1', 'D1', 'G1']
      const note = notes[Math.abs(Math.trunc(this.input.beat)) % notes.length]
      this.graph.pulse.triggerAttackRelease(note, '32n', Tone.now(), .09)
      const now=Tone.now();this.pulseCount++
      if(this.input.beat===1&&this.pulseCount%4===0)this.graph.servo.triggerAttackRelease('G2','32n',now+.06,.08)
      if(this.input.beat===2&&this.pulseCount%3===0)this.graph.glass.triggerAttackRelease('G4','32n',now+.06,.08)
      if(this.input.beat===3&&this.pulseCount%3===0){this.graph.motifLeft.triggerAttackRelease('C4','32n',now+.03,.08);this.graph.motifRight.triggerAttackRelease('G4','32n',now+.16,.08);this.graph.motifLeft.triggerAttackRelease('D5','32n',now+.28,.07)}
      this.schedulePulse()
    }
    if (immediate) tick()
    else this.pulseTimer = setTimeout(tick, 60_000 / scene07PulseBpm(this.input.velocity))
  }

  private playCue() {
    const graph = this.graph
    if (!graph || !this.enabled || !this.audible || !isScene07Audible(this.input)) return
    this.clearCue()
    this.ramp(graph.cueGain, .24, .008)
    const now = Tone.now()
    graph.cue.triggerAttackRelease('C5', '32n', now, .18)
    graph.cue.triggerAttackRelease('G5', '32n', now + .07, .15)
    this.cueTimer = setTimeout(() => {
      this.cueTimer = null
      if (this.graph) this.ramp(this.graph.cueGain, 0, .06)
    }, 170)
  }

  private ramp(gain: Tone.Gain, value: number, seconds: number) {
    const now = Tone.now()
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(value, now + seconds)
  }

  private clearPulse() {
    if (this.pulseTimer !== null) clearTimeout(this.pulseTimer)
    this.pulseTimer = null
  }

  private clearCue() {
    if (this.cueTimer !== null) clearTimeout(this.cueTimer)
    this.cueTimer = null
  }
}

export const scene07Audio = new Scene07AudioEngine()
