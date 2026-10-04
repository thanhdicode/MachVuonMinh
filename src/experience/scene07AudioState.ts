export type Scene07AudioInput={active:boolean;paused:boolean;hidden:boolean;beat:number;progress:number;velocity:number}
export type Scene07Gesture='work'|'key'|'splitter'
export type Scene07AudioDiagnostics={state:string;rms:number;enabled:boolean}
export const isScene07Audible=(input:Pick<Scene07AudioInput,'active'|'paused'|'hidden'>)=>input.active&&!input.paused&&!input.hidden
export const scene07PulseBpm=(velocity:number)=>55+Math.min(15,Math.abs(Number.isFinite(velocity)?velocity:0)*.35)
export const shouldPlayScene07Finale=(previous:number,current:number,velocity:number)=>velocity>=0&&previous<.96&&current>=.96
