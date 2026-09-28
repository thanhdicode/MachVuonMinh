import { useEffect, useRef, useState } from 'react'
import { evidence } from '../data/evidence'
import { vietnamCases, relationQuestions } from '../data/cases'
import { useWorld } from './WorldState'
import atlas from '../data/vietnam-map.json'
const locate = (lon:number,lat:number) => [45+(lon-102)*34.6,35+(24-lat)*36]
const cities = [['Hà Nội',105.85,21.03],['Đà Nẵng',108.20,16.05],['TP. Hồ Chí Minh',106.70,10.78]] as const
export function VietnamEvidence({openSource}:{openSource:(index:number)=>void}) {
  const [mapOpen,setMapOpen]=useState(false)
  const mapDialog=useRef<HTMLDialogElement>(null)
  useEffect(()=>{if(mapOpen){mapDialog.current?.showModal();document.body.classList.add('drawer-open')}return()=>document.body.classList.remove('drawer-open')},[mapOpen])
  const active=useWorld(s=>s.evidenceCase),lens=useWorld(s=>s.evidenceLens),set=useWorld(s=>s.set)
  const story=vietnamCases[active],item=evidence[story.sourceIndex]
  const select=(index:number)=>set({evidenceCase:index,evidenceLens:0})
  const map=<svg viewBox="0 0 640 700" role="img" aria-label="Việt Nam, quần đảo Hoàng Sa và quần đảo Trường Sa">
      <title >Việt Nam, quần đảo Hoàng Sa và quần đảo Trường Sa</title><desc >Đường bờ biển từ Natural Earth. Ký hiệu ngoài khơi định vị hai quần đảo, không biểu diễn ranh giới biển.</desc>
      <defs><pattern id="atlas-grid" width="69.2" height="72" x="45" y="35" patternUnits="userSpaceOnUse"><path d="M69.2 0H0V72" fill="none" stroke="#9a9586" strokeWidth=".5" opacity=".3"/></pattern><pattern id="atlas-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0V5" stroke="#b5a78d" strokeWidth=".7" opacity=".3"/></pattern><clipPath id="atlas-crop"><rect x="15" y="15" width="610" height="625"/></clipPath></defs>
      <g clipPath="url(#atlas-crop)"><rect width="640" height="660" fill="url(#atlas-grid)"/>
        {(['CHN','LAO','KHM','THA'] as const).map(code=><path key={code} d={atlas[code]} fill="#dcd6c5" fillOpacity=".32" stroke="#b4aa95" strokeWidth=".65"/>)}
        <path d={atlas.VNM} transform="translate(3 5)" fill="#ae8e68" opacity=".2"/>
        <path d={atlas.VNM} fill="#f7eedb" stroke="#aa2530" strokeWidth="1.45" strokeLinejoin="round"/>
        <path d={atlas.VNM} fill="url(#atlas-hatch)"/>
        <path d="M-45 640C40 611 59 595 125 563S257 482 259 400S219 325 213 291S164 245 178 142" fill="none" stroke="#b51f2a" strokeWidth="2.4" pathLength="1" className="map-stroke"/>
        {cities.map(([name,lon,lat],i)=>{const [x,y]=locate(lon,lat);return <g key={name} transform={`translate(${x} ${y})`}><circle r="8" fill="#f3e8d0" stroke="#b51f2a" strokeWidth=".8"/><circle r="2.8" fill="#b51f2a"/><path d={`M-10 0H${i===1?-50:-35}`} stroke="#9f8969" strokeWidth=".7"/><text x={i===1?-56:-41} y="4" textAnchor="end" className="atlas-city">{name}</text></g>})}
        <text x="170" y="101" textAnchor="middle" className="atlas-country">VIỆT NAM</text>
        <text x="438" y="426" textAnchor="middle" className="atlas-sea">BIỂN ĐÔNG</text>
        {story.coordinate&&<g className="case-map-pin" transform={`translate(${locate(story.coordinate[0],story.coordinate[1]).join(' ')})`}><circle r="13"/><circle r="5"/><text x="18" y="5">{active===0?'QUẢNG TRỊ':'HẢI PHÒNG'}</text></g>}
        {[...atlas.HSA,...atlas.TSA].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="1.55" fill="#b51f2a"/>)}
        <g className="archipelago" transform={`translate(${locate(112,16.5).join(' ')})`}><path d="M-12 0H12M0-12V12"/><circle r="6"/><path d="M9 0H34L43 -16H150"/><text x="150" y="-25" textAnchor="end">Quần đảo Hoàng Sa</text><text x="43" y="0" className="atlas-detail">HOÀNG SA</text></g>
        <g className="archipelago" transform={`translate(${locate(114.3,9.8).join(' ')})`}><path d="M-12 0H12M0-12V12"/><circle r="6"/><path d="M-9 0H-40L-55 27H-185"/><text x="-55" y="47" textAnchor="end">Quần đảo Trường Sa</text><text x="-55" y="66" textAnchor="end" className="atlas-detail">TRƯỜNG SA</text></g>
        <text x="43" y="558" className="atlas-detail">Phú Quốc</text><path d="M75 549L112 531" stroke="#8f7c62" strokeWidth=".6"/>
        <text x="252" y="602" className="atlas-detail">Côn Đảo</text><path d="M245 594L205 586" stroke="#8f7c62" strokeWidth=".6"/>
      </g>
      <g className="atlas-compass" transform="translate(586 72)"><path d="M0 28V-10M-5-2L0-12 5-2" fill="none" stroke="currentColor"/><text y="-22" textAnchor="middle">B</text></g>
      <text x="26" y="32" className="atlas-detail">102°Đ</text><text x="575" y="632" className="atlas-detail">118°Đ</text>
      <path d="M26 660H614" stroke="#b7a68d" strokeWidth=".7"/><text x="26" y="682" className="atlas-detail">VIỆT NAM / ĐẤT LIỀN & HẢI ĐẢO</text><text x="614" y="682" textAnchor="end" className="atlas-detail">01 : ATLAS</text>
    </svg>
  return <section className={`vietnam-overlay evidence-case-${active}`} aria-label="Việt Nam và những bằng chứng">
    <div className="vietnam-copy"><span className="eyebrow">06 / VIỆT NAM · TỪ CÔNG CỤ ĐẾN QUAN HỆ</span><h2>{story.title}</h2><span className="case-place">{story.place}</span></div>
    <div className="case-fact" aria-live="polite"><strong>{story.fact}</strong><span>{story.unit}<small>{story.context}</small></span></div>
    {active===0&&<figure className="case-illustration"><img src="/images/cooperative-drone.webp" alt="Minh họa nông dân cùng dùng máy tính bảng, drone và cánh đồng lúa"/><figcaption>MINH HỌA · KHÔNG PHẢI ẢNH TƯ LIỆU</figcaption></figure>}
    {active!==0&&<p className="case-object-caption">{active===1?'ROBOT + CON NGƯỜI + HỆ QUẢN LÝ':'13,17 PHẦN GIÁ TRỊ SỐ / 100 PHẦN GDP'}</p>}
    <p className="case-observation">{story.observation}</p>
    <div className="relation-bridge"><span className="eyebrow">QUAN HỆ CẦN THÍCH ỨNG</span><div role="group" aria-label="Ba mặt của quan hệ sản xuất">{relationQuestions.map((q,i)=><button key={q.name} aria-controls="relation-response" aria-pressed={lens===i} onClick={()=>set({evidenceLens:i})}><small>{q.name}</small>{q.question}</button>)}</div><p id="relation-response" aria-live="polite"><span>Gợi mở</span> {story.responses[lens]}</p></div>
    <div className="case-navigation"><div className="case-tabs" aria-label="Chọn tình huống">{vietnamCases.map((c,i)=><button key={c.name} aria-label={`0${i+1} ${c.name}`} aria-pressed={active===i} onClick={()=>select(i)}><span>0{i+1}</span>{c.name}</button>)}</div><button className="case-source" onClick={()=>openSource(story.sourceIndex)}>[{item.code}] Dữ kiện & nguồn gốc ↗</button></div>
    <figure className="vietnam-map">{!mapOpen&&map}<figcaption>Đường bờ: Natural Earth · Ký hiệu định vị quần đảo.</figcaption><button className="map-expand" onClick={()=>setMapOpen(true)}>Phóng to bản đồ ↗</button></figure>
    {mapOpen&&<dialog className="map-dialog" ref={mapDialog} data-lenis-prevent onClose={()=>setMapOpen(false)} onClick={e=>{if(e.target===e.currentTarget)mapDialog.current?.close()}}><button className="map-close" aria-label="Đóng bản đồ" onClick={()=>mapDialog.current?.close()}>ĐÓNG ×</button>{map}<p>Đường bờ: Natural Earth · Ký hiệu định vị quần đảo, không biểu diễn ranh giới biển.</p></dialog>}
  </section>
}
