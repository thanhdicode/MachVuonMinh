import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {AnimationMixer,Box3,Group,Mesh,SkinnedMesh} from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {prepareCharacter} from '../src/experience/characterModel.ts'

const bytes=await readFile(new URL('../public/models/farmer.glb',import.meta.url))
const source=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')
for(const farmer of [true,false]){
  const {object,scale,bottom}=prepareCharacter(source.scene,farmer)
  assert.ok(scale>.8&&scale<1.1,'Rig world matrices must be current before computing human scale')
  assert.ok(object.getObjectByName('WristR'),'Controller attaches to the exported right wrist')
  const holder=new Group();holder.add(object);object.scale.setScalar(scale);object.position.y=-bottom*scale
  const mixer=new AnimationMixer(object)
  for(const name of ['Idle_Neutral','Walk']){
    mixer.stopAllAction();mixer.clipAction(source.animations.find(a=>a.name===name)).play()
    for(let frame=0;frame<60;frame++){
      mixer.update(1/30);holder.updateMatrixWorld(true)
      object.traverse(n=>{if(n instanceof SkinnedMesh)n.computeBoundingBox()})
      const box=new Box3().setFromObject(holder)
      assert.ok(Number.isFinite(box.min.y)&&box.max.y-box.min.y>1.3&&box.max.y-box.min.y<1.95,'Animated human retains natural height')
    }
  }
  object.traverse(n=>{if(n instanceof Mesh){n.geometry.dispose();n.material.dispose()}})
}
console.log('Character checks passed: skeleton scale, wrist attachment, idle and walk bounds.')
