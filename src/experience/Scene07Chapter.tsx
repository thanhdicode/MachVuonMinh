import {useEffect,useLayoutEffect,useRef,useState,type KeyboardEvent} from 'react'
import gsap from 'gsap'
import {ScrollTrigger} from 'gsap/ScrollTrigger'
import {accessResponse,flowBeat,flowOption,flowState,splitterResponse,updateFlow} from './scene07State'
import {workshopActs,workshopSources} from './scene07Content'
import {scene07Audio} from './Scene07AudioEngine'
import {useWorld,timeline} from './WorldState'
import {goToFlowBeat,goToScene} from './WorldTimeline'
import './scene07.css'

const steps=['Bối cảnh',...workshopActs.map(a=>a.short),'Kết nối']
function useFlowInput(){
  const [revision,setRevision]=useState(flowState.revision)
  useEffect(()=>{const sync=()=>setRevision(flowState.revision);document.addEventListener('scene07-input',sync);return()=>document.removeEventListener('scene07-input',sync)},[])
  return revision
}
const selection=(index:number)=>index===0?flowOption(flowState.work):index===1?flowState.access:flowOption(flowState.split)
const resultBody=(index:number,selected:number)=>index===0?workshopActs[0].results[selected].body:index===1?accessResponse(selected):splitterResponse(selected/2)

function Choices({index}:{index:number}){
  useFlowInput()
  const act=workshopActs[index],selected=selection(index)
  const choose=(option:number)=>{
    updateFlow(index===0?{work:option/2}:index===1?{access:option}:{split:option/2})
    scene07Audio.gesture(index===0?'work':index===1?'key':'splitter')
  }
  const key=(e:KeyboardEvent<HTMLButtonElement>,option:number)=>{
    const next=e.key==='Home'?0:e.key==='End'?2:['ArrowRight','ArrowDown'].includes(e.key)?(option+1)%3:['ArrowLeft','ArrowUp'].includes(e.key)?(option+2)%3:null
    if(next===null)return
    e.preventDefault();choose(next)
    e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus()
  }
  return <div className="workshop-choices" role="group" aria-label={act.prompt}
    data-guide={index===0?'policy-instruction policy-skills policy-retry':index===1?'policy-data-rights policy-data-governance policy-sandbox':'policy-reward policy-sockets'}>
    <p>{act.prompt} <span>↓</span></p>
    {act.choices.map((choice,i)=><button key={choice} type="button" aria-pressed={selected===i} onClick={()=>choose(i)} onKeyDown={e=>key(e,i)}
      data-guide={index===2?(i===1?'policy-infrastructure':i===2?'policy-inclusion':undefined):undefined}>
      <span className="workshop-choice-number">0{i+1}</span><span>{choice}</span><span aria-hidden="true">{selected===i?'●':'↗'}</span>
    </button>)}
  </div>
}

function WorkshopResult({index}:{index:number}){
  useFlowInput()
  const selected=selection(index),act=workshopActs[index]
  return <div className="workshop-feedback">
    <div className={'workshop-nodes '+(index===2?'is-distribution':index===1?'is-ownership':'')} aria-label={index===2?'Những nơi nhận thành quả':index===1?'Quyền và trách nhiệm với máy':'Các khâu trong xưởng'}>
      {act.results[selected].nodes.map((node,i)=><div key={i} data-emphasis={index===2?selected===i:i===2}><span>0{i+1}</span><strong>{node}</strong></div>)}
    </div>
    <div className="workshop-result" aria-live="polite" aria-atomic="true"><span className="workshop-eyebrow">{index===2?'PHẦN ĐANG XEM':'ĐIỀU THAY ĐỔI'}</span><h3>{act.results[selected].title}</h3><p>{resultBody(index,selected)}</p></div>
  </div>
}
function MachineStatus({beat}:{beat:number}){
  useFlowInput()
  if(beat===4)return null
  const work=flowOption(flowState.work),split=flowOption(flowState.split)
  const label=beat===1?'CHI TIẾT VÀNG / AI BÁO LỖI':beat===2?'CHIẾC MÁY THUỘC VỀ':beat===3?'SỢI ĐỎ DẪN ĐẾN':'MỘT XƯỞNG / BA CÂU HỎI'
  const status=beat===1?['Máy vẫn chạy','Biết lỗi, còn chờ lệnh','Đã dừng để kiểm tra'][work]:beat===2?['Xưởng mua máy','Bên cho thuê máy','Các bên cùng góp vốn'][flowState.access]:beat===3?['Người lao động','Người góp vốn','Phát triển xưởng'][split]:'Máy → AI → người xử lý'
  return <div className="workshop-machine-status" aria-hidden="true" data-stopped={beat===1&&work===2}><span>{label}</span><strong><i/>{status}</strong></div>
}
function Evidence({index}:{index:number}){
  return index===0?<p className="workshop-evidence"><strong>Từ thực tế Việt Nam</strong> ILO ghi nhận tại HITI: khi đưa AI vào kiểm tra sản phẩm, 7 người được đào tạo và bố trí sang công việc khác. <a href={workshopSources.ilo} target="_blank" rel="noreferrer">ILO · 2025 ↗</a></p>:null
}
function Act({index,staticMode=false}:{index:number;staticMode?:boolean}){
  const act=workshopActs[index]
  return <>
    <div className="workshop-copy"><span className="workshop-eyebrow">0{index+1} / {act.label}</span><h2>{act.title}</h2><p className="workshop-intro">{act.intro}</p><Choices index={index}/></div>
    {staticMode&&<WorkshopFallback/>}
    <WorkshopResult index={index}/>
    <div className="workshop-bottom"><p className="workshop-takeaway">{act.takeaway}</p><Evidence index={index}/></div>
  </>
}
function WorkshopFallback(){
  return <svg className="workshop-fallback" viewBox="0 0 700 270" role="img" aria-label="Máy gia công nối với trạm kiểm tra AI và người giám sát">
    <path d="M40 220H660M110 210V85H230V210M125 115H215V170H125Z M295 210V55H410V210M312 70H393V190H312Z M470 210V140H600V210M488 148V100H575V148" fill="none" stroke="currentColor" strokeWidth="5"/>
    <path d="M35 197H630" fill="none" stroke="#b51f2a" strokeWidth="13"/><circle cx="627" cy="107" r="16" fill="#c7b486"/><path d="M627 127V191M627 145L593 156" stroke="#c7b486" strokeWidth="12"/>
    <text x="175" y="253" textAnchor="middle">MÁY</text><text x="350" y="253" textAnchor="middle">AI KIỂM TRA</text><text x="553" y="253" textAnchor="middle">CON NGƯỜI</text>
  </svg>
}
function Arrival(){
  return <><div className="workshop-copy workshop-arrival-copy"><span className="workshop-eyebrow">TỪ CÁC VÍ DỤ VIỆT NAM → MỘT XƯỞNG SẢN XUẤT</span><h2>Máy đã đổi.<br/><em>Cách cùng làm</em><br/>cũng phải đổi.</h2><p className="workshop-intro">Xưởng cơ khí đưa máy tự động và AI vào kiểm tra chi tiết. Cùng một dây chuyền, thử xem ai được dừng máy, máy thuộc về ai và ai hưởng thành quả.</p><button className="workshop-start" onClick={()=>goToFlowBeat(1)}>Thử xử lý một chi tiết lỗi <span>↗</span></button></div>
    <div className="workshop-arrival-note"><p>Con người cùng máy, AI và dữ liệu làm ra sản phẩm.</p><span className="workshop-eyebrow">ĐÓ LÀ LỰC LƯỢNG SẢN XUẤT MỚI</span><p>Cách con người sở hữu máy, tổ chức việc làm và chia thành quả.</p><span className="workshop-eyebrow">ĐÓ LÀ BA MẶT CỦA QUAN HỆ SẢN XUẤT</span></div></>
}
function Conclusion(){
  return <div className="workshop-conclusion" data-guide="policy-result"><span className="workshop-eyebrow">YÊU CẦU ĐẶT RA Ở VIỆT NAM</span><h2>Máy mới cần<br/><em>cách cùng làm phù hợp.</em></h2><p className="workshop-intro">Người lao động cùng máy, công cụ và nguyên liệu tạo thành lực lượng sản xuất. Quan hệ giữa người với người về sở hữu, tổ chức việc làm và chia thành quả là quan hệ sản xuất.</p><div className="workshop-summary">
    {[['Sở hữu','Rõ máy, dữ liệu thuộc ai và ai được sử dụng.',2],['Tổ chức — quản lý','Đào tạo người, giao lại nhiệm vụ và quyền xử lý.',1],['Phân phối','Trả công, chia lợi nhuận và đầu tư trở lại minh bạch.',3]].map(([label,body,step])=><button key={label} onClick={()=>goToFlowBeat(Number(step))}><span>{label}<i>↗</i></span><p>{body}</p></button>)}
    </div><p className="workshop-policy">Nghị quyết 57 yêu cầu phát triển lực lượng sản xuất hiện đại và hoàn thiện quan hệ sản xuất. <a href={workshopSources.policy} target="_blank" rel="noreferrer">Đọc cơ sở chính sách ↗</a></p><button className="workshop-start" onClick={()=>goToScene(8)}>Tiếp tục mạch vận động <span>→</span></button></div>
}
export function Scene07Chapter(){
  const root=useRef<HTMLElement>(null),stage=useRef<HTMLDivElement>(null)
  const [beat,setBeat]=useState(0),[enabled,setEnabled]=useState(false),[error,setError]=useState('')
  const active=useWorld(s=>s.active===7),paused=useWorld(s=>s.paused),sound=useWorld(s=>s.sound)
  const preload=useWorld(s=>s.active===6||s.active===7)
  const enabledRef=useRef(false),activeRef=useRef(active);activeRef.current=active
  useEffect(()=>{if(preload)void scene07Audio.preload()},[preload])
  useLayoutEffect(()=>{
    const media=gsap.matchMedia(),el=root.current!,view=stage.current!
    media.add('(min-width:768px) and (prefers-reduced-motion:no-preference)',()=>{
      flowState.static=false;el.dataset.layout='pinned'
      const playhead={progress:0}
      const master=gsap.timeline({scrollTrigger:{id:'scene07-flow',trigger:el,start:'top top',end:'bottom bottom',pin:view,pinSpacing:false,scrub:.8,invalidateOnRefresh:true,anticipatePin:1,refreshPriority:-1},onUpdate:()=>{
        flowState.progress=playhead.progress;flowState.beat=flowBeat(playhead.progress)
        view.dataset.progress=playhead.progress.toFixed(4);view.dataset.beat=String(flowState.beat)
        setBeat(b=>b===flowState.beat?b:flowState.beat)
      }})
      master.to(playhead,{progress:1,duration:1,ease:'none'})
      return()=>{master.scrollTrigger?.kill(true);master.kill()}
    })
    media.add('(max-width:767px), (prefers-reduced-motion:reduce)',()=>{
      flowState.static=true;el.dataset.layout='vertical'
      const triggers=Array.from(el.querySelectorAll<HTMLElement>('.flow-static-act')).map((act,i)=>ScrollTrigger.create({trigger:act,start:'top 55%',end:'bottom 55%',onEnter:()=>{flowState.beat=i;flowState.progress=[.06,.3,.56,.8,.98][i];setBeat(i)},onEnterBack:()=>{flowState.beat=i;flowState.progress=[.06,.3,.56,.8,.98][i];setBeat(i)}}))
      return()=>triggers.forEach(t=>t.kill())
    })
    return()=>media.revert()
  },[])
  useEffect(()=>{
    const sync=()=>{flowState.active=activeRef.current;scene07Audio.sync({active:activeRef.current,paused:useWorld.getState().paused,hidden:document.hidden,beat:flowState.beat,progress:flowState.progress,velocity:timeline.velocity});const d=scene07Audio.diagnostics();if(enabledRef.current!==d.enabled){enabledRef.current=d.enabled;setEnabled(d.enabled)}if(stage.current){stage.current.dataset.audioContext=d.state;stage.current.dataset.audioRms=String(d.rms)}}
    const timer=window.setInterval(sync,100);document.addEventListener('visibilitychange',sync);sync()
    return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',sync);scene07Audio.stop()}
  },[])
  useEffect(()=>{if(!sound&&enabledRef.current){scene07Audio.stop();enabledRef.current=false;setEnabled(false)}},[sound])
  useEffect(()=>{scene07Audio.sync({active,paused,hidden:document.hidden,beat,progress:flowState.progress,velocity:timeline.velocity})},[active,paused,beat])
  const toggle=async()=>{
    setError('');if(enabledRef.current){scene07Audio.stop();enabledRef.current=false;setEnabled(false);useWorld.getState().set({sound:false});return}
    const started=await scene07Audio.start();enabledRef.current=started;setEnabled(started)
    if(started)useWorld.getState().set({sound:true});else setError('Âm thanh chưa khởi động. Chạm để thử lại.')
  }
  return <section ref={root} className="flow-insertion" aria-label="07 / Công nghệ mới, quan hệ mới">
    <div className="flow-stage" ref={stage} data-beat={beat}>
      <div className="workshop-light" aria-hidden="true"/>
      <nav className="workshop-nav" aria-label="Các bước trong xưởng"><span>07 / CÔNG NGHỆ MỚI, QUAN HỆ MỚI</span><div>{steps.map((step,i)=><button key={step} aria-current={beat===i?'step':undefined} onClick={()=>goToFlowBeat(i)}><small>0{i}</small> {step}</button>)}</div></nav>
      <MachineStatus beat={beat}/>
      <div className="workshop-beat workshop-opening" hidden={beat!==0}><Arrival/></div>
      {[0,1,2].map(i=><div className="workshop-beat" key={i} hidden={beat!==i+1}><Act index={i}/></div>)}
      <div className="workshop-beat" hidden={beat!==4}><Conclusion/></div>
      <div className="workshop-desktop-fallback"><WorkshopFallback/></div>
    </div>
    <div className="flow-static-story">
      <section className="flow-static-act" data-flow-act="0"><Arrival/><WorkshopFallback/></section>
      {[0,1,2].map(i=><section className="flow-static-act" data-flow-act={i+1} key={i}><Act index={i} staticMode/></section>)}
      <section className="flow-static-act" data-flow-act="4"><Conclusion/></section>
    </div>
    {active&&<div className="flow-sound-dock"><button aria-pressed={enabled} onClick={toggle}>ÂM THANH {enabled?'BẬT':'TẮT'} <span aria-hidden="true">{enabled?'◖))':'◖×'}</span></button>{error&&<span role="status">{error}</span>}</div>}
  </section>
}
