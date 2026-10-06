import type * as THREE from 'three'

const reflectedPrograms=new WeakSet<object>()

export async function prepareScene(renderer:THREE.WebGLRenderer,object:THREE.Object3D,camera:THREE.Camera,target?:THREE.Scene){
  const compilation=renderer.compileAsync(object,camera,target)
  // compileAsync waits on the last program of each material. Shared materials can
  // also have ordinary/instanced/skinned variants still linking on the GPU.
  const programs=[...(renderer.info.programs??[])]
  await compilation
  const context=renderer.getContext(),parallel=context.getExtension('KHR_parallel_shader_compile')
  if(parallel)await new Promise<void>(resolve=>{
    const pending=new Set(programs.map(program=>program.program as WebGLProgram))
    const check=()=>{
      if(context.isContextLost()){resolve();return}
      pending.forEach(program=>{
        if(!context.isProgram(program)||context.getProgramParameter(program,parallel.COMPLETION_STATUS_KHR))pending.delete(program)
      })
      if(pending.size)setTimeout(check,16);else resolve()
    }
    check()
  })
  // Uniform/attribute reflection is lazy in Three. Spread that first-use work
  // across tasks as well, rather than doing it for every material in one frame.
  for(const program of programs){
    if(reflectedPrograms.has(program))continue
    await new Promise<void>(resolve=>setTimeout(resolve,0))
    if(context.isContextLost()||!context.isProgram(program.program as WebGLProgram))continue
    reflectedPrograms.add(program);program.getUniforms();program.getAttributes()
  }
}
