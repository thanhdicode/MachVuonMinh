// Integration only: the authored engine above remains byte-for-byte unchanged.
const HOST=window.parent!==window;
// Reserve room for the Vietnamese caption on compact laptop layouts.
// Only the resting location changes; dragging, magnification and springs are authored.
const authoredRestLoupe=restLoupe;
restLoupe=function(){authoredRestLoupe();if(innerWidth>=1100&&book.clientWidth<900){lx+=90;placeLoupe()}};
const send=(type,data={})=>{if(HOST)parent.postMessage({channel:'mln111-sketchbook',type,...data},location.origin)};
const originalScrollIntoView=Element.prototype.scrollIntoView;
if(HOST)Element.prototype.scrollIntoView=function(options){send('anchor',{top:this.getBoundingClientRect().top+scrollY,center:options?.block==='center'})};
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const target=document.querySelector(a.getAttribute('href'));if(target){e.preventDefault();target.scrollIntoView({behavior:'smooth',block:'start'})}}));
let currentPlate=-1;
function updateMeaning(){
 const current=turn?(turn.t>.56?turn.to:turn.from):idx;
 if(current===currentPlate)return;
 currentPlate=current;
 document.getElementById('plateMeaning').textContent=PAGES[current].text;
 document.body.dataset.plate=PAGES[current].id;
 send('plate',{index:current,id:PAGES[current].id});
}
new MutationObserver(updateMeaning).observe(capBox,{childList:true,subtree:true,attributes:true,attributeFilter:['style']});
updateMeaning();
document.getElementById('plateSource').onclick=()=>send('source',{index:PAGES[currentPlate]?.source??1});
document.getElementById('nextChapter').onclick=()=>send('next');
// The source starts at LAND=6. Reorder only the editorial index into reading order.
const items=[...plateList.children];
[6,7,8,0,1,2,3,4,5].forEach((i,n)=>{items[i].querySelector('.n').textContent=String(n+1).padStart(2,'0');plateList.appendChild(items[i]);});
// marks() uses DOM order in the original. Observe its result, then correct only index labels.
function markLogical(){const current=turn?turn.to:idx;items.forEach((li,i)=>{const b=li.firstElementChild,value=String(i===current);if(b.getAttribute('aria-current')!==value)b.setAttribute('aria-current',value)})}
new MutationObserver(markLogical).observe(capBox,{childList:true});markLogical();
const labels={sbLeft:'Page précédente',sbRight:'Page suivante',zOut:'Thu nhỏ',zIn:'Phóng to',loupeBtn:'Kính lúp',heroDown:'Đọc điều cần hiểu'};
labels.sbLeft='Trang trước';labels.sbRight='Trang sau';
for(const[id,label]of Object.entries(labels))document.getElementById(id)?.setAttribute('aria-label',label);
new MutationObserver(()=>{book.querySelector('.sb-prev')?.setAttribute('aria-label','Trang trước');book.querySelector('.sb-next')?.setAttribute('aria-label','Trang sau')}).observe(book,{childList:true});
let lastHeight=0;
const report=()=>{const height=Math.ceil(document.querySelector('main').getBoundingClientRect().height);if(height!==lastHeight){lastHeight=height;send('height',{height})}};
new ResizeObserver(report).observe(document.querySelector('main'));
addEventListener('message',event=>{
 if(event.source!==parent||event.origin!==location.origin||event.data?.channel!=='mln111-sketchbook-host')return;
 if(Number.isFinite(event.data.height)){document.documentElement.dataset.compact=String(event.data.height<=820);document.documentElement.style.setProperty('--screen-height',event.data.height+'px');layout();restLoupe();report()}
 if(event.data.type==='enter'&&document.body.dataset.ready==='1'&&!window.__notebookEntered){
   window.__notebookEntered=true;
   // Let the source's 220ms boot timer settle its nointro landing first.
   setTimeout(()=>{Q.delete('nointro');idx=0;paint();startIntro()},280);
 }
});
// A wheel over the local document belongs to the existing outer Lenis journey.
addEventListener('wheel',e=>{if(!HOST||e.ctrlKey)return;e.preventDefault();send('wheel',{delta:e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1)})},{passive:false});
let touchY=null;
addEventListener('touchstart',e=>{touchY=e.touches[0]?.clientY??null},{passive:true});
addEventListener('touchmove',e=>{if(!HOST||touchY===null||!e.touches[0])return;const y=e.touches[0].clientY,delta=touchY-y;touchY=y;if(Math.abs(delta)>1){e.preventDefault();send('wheel',{delta})}},{passive:false});
addEventListener('keydown',e=>{if(!HOST||e.defaultPrevented)return;const delta=e.key==='PageDown'?600:e.key==='PageUp'?-600:e.key==='ArrowDown'?80:e.key==='ArrowUp'?-80:0;if(delta){e.preventDefault();send('wheel',{delta})}});
new MutationObserver(()=>{if(document.body.dataset.ready==='1')send('ready')}).observe(document.body,{attributes:true,attributeFilter:['data-ready']});
send('ready');report();
