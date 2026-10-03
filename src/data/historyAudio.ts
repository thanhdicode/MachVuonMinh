export type HistoryAudioTrack = {
  id: string
  mood: string
  src: string
  source: string
  author: string
  license: string
  date: string
  crossfadeMs: number
}

export const historyAudio: readonly HistoryAudioTrack[] = [
  { id:'a-village', mood:'Vietnamese-style pentatonic plucks, bamboo-like taps, and water', src:'/audio/history-01-village-water.wav', source:'Original deterministic synthesis', author:'Local project audio generator', license:'Unrestricted project use; no external license dependencies', date:'2026-10-03', crossfadeMs:1100 },
  { id:'b-rail', mood:'Steam, rail pulse, and acoustic resonance', src:'/audio/history-02-steam-rail.wav', source:'Original deterministic synthesis', author:'Local project audio generator', license:'Unrestricted project use; no external license dependencies', date:'2026-10-03', crossfadeMs:1250 },
  { id:'c-workshop', mood:'Sparse wood knocks and forge resonance', src:'/audio/history-03-workshop-forge.wav', source:'Original deterministic synthesis', author:'Local project audio generator', license:'Unrestricted project use; no external license dependencies', date:'2026-10-03', crossfadeMs:950 },
  { id:'d-industry', mood:'Measured industrial pulse', src:'/audio/history-04-measured-industry.wav', source:'Original deterministic synthesis', author:'Local project audio generator', license:'Unrestricted project use; no external license dependencies', date:'2026-10-03', crossfadeMs:1200 },
  { id:'e-reconstruction', mood:'Analog electrical hum and restrained machinery', src:'/audio/history-05-analog-hum.wav', source:'Original deterministic synthesis', author:'Local project audio generator', license:'Unrestricted project use; no external license dependencies', date:'2026-10-03', crossfadeMs:1000 },
  { id:'f-reform', mood:'Warm analog chords and light electronic motion', src:'/audio/history-06-warm-electronic.wav', source:'Original deterministic synthesis', author:'Local project audio generator', license:'Unrestricted project use; no external license dependencies', date:'2026-10-03', crossfadeMs:1300 },
  { id:'g-electricity', mood:'Rural electrical drone, motor pulse, and water texture', src:'/audio/history-07-rural-electric.wav', source:'Original deterministic synthesis', author:'Local project audio generator', license:'Unrestricted project use; no external license dependencies', date:'2026-10-03', crossfadeMs:1050 },
  { id:'h-data', mood:'Minimal digital micro-percussion', src:'/audio/history-08-digital-micro.wav', source:'Original deterministic synthesis', author:'Local project audio generator', license:'Unrestricted project use; no external license dependencies', date:'2026-10-03', crossfadeMs:900 },
]
