import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server:{watch:{ignored:['**/.studio/**']}},
  build:{rolldownOptions:{output:{codeSplitting:{groups:[
    // Keep the eagerly used React runtime out of the deferred Tone chunk.
    {name:'react-runtime',test:/node_modules[\/](react|react-dom|scheduler)([\/]|$)/,priority:100},
  ]}}}},
  plugins: [react(), {
  name:'preload-world',
  transformIndexHtml:{order:'post',handler(html,context){
    const bundle=context.bundle
    if(!bundle)return
    const world=Object.values(bundle).find(output=>output.type==='chunk'&&output.name==='WorldCanvas')
    if(!world||world.type!=='chunk')return
    const files=new Set<string>()
    const visit=(file:string)=>{
      if(files.has(file))return
      files.add(file)
      const output=bundle[file]
      if(output?.type==='chunk')output.imports.forEach(visit)
    }
    visit(world.fileName)
    return [...files].filter(file=>!html.includes(`/${file}`)).map(file=>({tag:'link',attrs:{rel:'modulepreload',href:`/${file}`,crossorigin:''},injectTo:'head' as const}))
  }},
}, {
  name: 'reload-world-timeline',
  handleHotUpdate({ file, server }) {
    // These singleton modules are captured by the mounted scroll and render loops.
    if (/World(State|Timeline)\.ts$/.test(file)) {
      server.ws.send({ type: 'full-reload' })
      return []
    }
  },
}] })
