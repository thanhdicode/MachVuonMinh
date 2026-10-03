import {createServer} from 'node:http'
import {readFile} from 'node:fs/promises'
import {resolve,dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const routes=new Map([
  ['/',{file:'.studio/guide-assets/review.html',type:'text/html; charset=utf-8'}],
  ['/copy.json',{file:'docs/superpowers/specs/2026-10-03-owl-guide-copy.json',type:'application/json; charset=utf-8'}],
  ['/guide/owl-assets.json',{file:'public/guide/owl-assets.json',type:'application/json; charset=utf-8'}],
  ...['neutral','point-left','point-right','inspect','practice','confirm','bye','dock'].map(id=>['/guide/owl-'+id+'.webp',{file:'public/guide/owl-'+id+'.webp',type:'image/webp'}])
])
createServer(async(req,res)=>{
  const route=routes.get(new URL(req.url,'http://127.0.0.1').pathname)
  if(!route){res.writeHead(404);res.end('Not found');return}
  try{const bytes=await readFile(resolve(root,route.file));res.writeHead(200,{'Content-Type':route.type,'Cache-Control':'no-store'});res.end(bytes)}
  catch{res.writeHead(500);res.end('Asset unavailable')}
}).listen(5176,'127.0.0.1',()=>console.log('Owl asset review: http://127.0.0.1:5176/'))
