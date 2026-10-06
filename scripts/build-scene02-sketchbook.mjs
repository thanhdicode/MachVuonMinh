import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import path from 'node:path'

const root=process.cwd(), reference=path.join(root,'.studio/sketchbook-reference')
const output=path.join(root,'public/scene02-sketchbook')
await mkdir(path.join(output,'assets'),{recursive:true})
const source=await readFile(path.join(reference,'canonical.html'),'utf8')
const content=JSON.parse(await readFile('src/data/scene02Notebook.json','utf8'))
// Keep the original LAND=6, nine plates, riffle length and circular turn logic.
const pages=[...content.slice(3),...content.slice(0,3)].map(p=>({...p,file:p.id+'.webp'}))
let html=source.replace('<html lang="en">','<html lang="vi">')
  .replace('<title>Meng To</title>','<title>Sổ tay Việt Nam — Mạch Vươn Mình</title>')
  .replace('designer, creator, AI educator — Singapore','Lực lượng sản xuất mới và yêu cầu đổi mới quan hệ sản xuất ở Việt Nam')
  .replace(/const DIR=.*?;/,"const DIR='assets/';")
  .replace(/const PAGES=\[[\s\S]*?\];/,`const PAGES=${JSON.stringify(pages)};`)
  .replace(/<header class="top">[\s\S]*?<\/header>/,`<header class="top">
    <a class="name" href="#sketchbook">Sổ tay Việt Nam</a>
    <nav aria-label="Trong sổ tay"><a href="#plates">Chín trang ghi chép</a><a href="#about">Điều cần hiểu</a><a href="#contact">Đọc tiếp</a></nav>
  </header>`)
  .replace('Designer / Creator / AI Educator / Founder @ Singapore','02 / TỪ LỊCH SỬ ĐẾN VIỆT NAM HÔM NAY')
  .replace('Drag the page to turn · Drag the glass across it','Kéo mép giấy để lật · Kéo kính lúp để xem gần')
  .replace('<div class="sb-captions" id="sbCaptions"></div>','<div class="sb-captions" id="sbCaptions"></div><div class="notebook-reading"><p id="plateMeaning"></p><button id="plateSource">Đọc nguồn ↗</button></div>')
  .replace(/<section id="about" class="about">[\s\S]*?<\/section>/,`<section id="about" class="about"><div>
    <p class="section-label">Vì sao câu chuyện này quan trọng?</p>
    <h1 class="notebook-thesis">Có máy mới,<br>cách làm cũng cần đổi.</h1>
    <p class="bio">Một dây chuyền hiện đại chỉ phát huy được khi có người biết vận hành, các bộ phận phối hợp và quyền sử dụng nguồn lực rõ ràng.</p>
    <p class="bio">Trong chủ đề này, người lao động cùng tư liệu sản xuất là <strong>lực lượng sản xuất</strong>. Còn <strong>quan hệ sản xuất</strong> gồm ba mặt: sở hữu tư liệu sản xuất; tổ chức và quản lý sản xuất; phân phối sản phẩm lao động.</p>
    <p class="bio">Vì vậy, phát triển ở Việt Nam hôm nay cần gắn đổi mới công nghệ với đào tạo, cách tổ chức công việc và cách chia sẻ thành quả.</p>
    </div><img class="bloom" src="assets/bloom.png" alt="" aria-hidden="true"></section>`)
  .replace('<p class="section-label">Plates</p>','<p class="section-label">Chín trang ghi chép / Chọn một trang để mở</p>')
  .replace(/<p class="foot" id="contact">[\s\S]*?<\/p>/,`<div class="notebook-next" id="contact"><span>KHÁM PHÁ TIẾP</span><button id="nextChapter">Con người làm việc cùng công nghệ mới <span>↗</span></button></div>`)

// The server rewrites packaged asset URLs. Bring those exact files back local.
const manifest=JSON.parse(await readFile(path.join(reference,'threeui-source.json'),'utf8'))
for(const asset of manifest.assets){
 const name=path.basename(asset.path)
 html=html.replaceAll(new RegExp('https://ublctyddhtbgaersvxxb\\.supabase\\.co/[^\\s\\)"\']*?/'+name.replaceAll('.','\\.'),'g'),'assets/'+name)
 html=html.replaceAll(new RegExp('https://ublctyddhtbgaersvxxb\\.supabase\\.co/[^\\s\\)"\']*?/'+asset.sha256+'\\.woff2','g'),'assets/'+name)
}
// Keep source CSS intact; append content and host-layout rules separately.
const styles=await readFile('src/experience/sketchbook/frame.css','utf8')
const bridge=await readFile('src/experience/sketchbook/frame.js','utf8')
// Reduced mode is handled before the unchanged engine reads matchMedia.
const reducedScript=`<script>if(new URLSearchParams(location.search).has('reduced')){const nativeMatch=window.matchMedia.bind(window);window.matchMedia=q=>{const result=nativeMatch(q);if(q==='(prefers-reduced-motion: reduce)')Object.defineProperty(result,'matches',{value:true});return result;};}</script>`
html=html.replace('</head>','<link rel="stylesheet" href="assets/vietnamese-fonts.css"><style id="notebook-adapter">'+styles+'</style>'+reducedScript+'</head>')
html=html.replace('</body>','<script id="notebook-adapter-script">'+bridge+'</script></body>')
await writeFile(path.join(output,'index.html'),html)
const sha=s=>createHash('sha256').update(s).digest('hex')
const originalEngine=source.slice(source.indexOf('const M=PAGES.length'),source.lastIndexOf('</script>'))
const derivedEngine=html.slice(html.indexOf('const M=PAGES.length'),html.indexOf('</script>',html.indexOf('const M=PAGES.length')))
if(sha(originalEngine)!==sha(derivedEngine))throw Error('Authored motion engine changed')
await writeFile(path.join(reference,'integrity.json'),JSON.stringify({upstream:'https://github.com/MengTo/sketchbook',commit:'c1e477814c4c9e204452ebf9b298aa13629cbfc2',servedCanonical:sha(source),authoredEngine:sha(originalEngine),derivedEngine:sha(derivedEngine),equal:true,derivedDocument:sha(html),changes:['content array, text, local URLs','appended host-layout styles and bridge','Vietnamese font coverage'],date:'2026-10-06'},null,2))
console.log('Scene02 Sketchbook built; original motion engine SHA256 identical:',sha(originalEngine))
