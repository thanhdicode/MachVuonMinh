import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

function surfaceTexture(brushed: boolean) {
  const size=256, data=new Uint8Array(size*size*4)
  let seed=71
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0
    const noise=seed/4294967296,grain=brushed?Math.sin(y*2.13)*18:0
    const value=Math.round(184+grain+(noise-.5)*(brushed?24:80)),i=(y*size+x)*4
    data[i]=value;data[i+1]=value;data[i+2]=value;data[i+3]=255
  }
  const texture=new THREE.DataTexture(data,size,size)
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping
  texture.magFilter=THREE.LinearFilter
  texture.minFilter=THREE.LinearMipmapLinearFilter
  texture.generateMipmaps=true
  texture.repeat.set(brushed?3:7,brushed?3:7)
  texture.needsUpdate=true
  return texture
}

export const brushedMetal=surfaceTexture(true),castGrain=surfaceTexture(false)

const bandShape=new THREE.Shape(),half=.205
for(let i=0;i<=24;i++){
  const angle=-half+i/24*half*2,x=Math.sin(angle)*2.64,y=2.5-Math.cos(angle)*2.64
  if(i===0)bandShape.moveTo(x,y);else bandShape.lineTo(x,y)
}
for(let i=24;i>=0;i--){const angle=-half+i/24*half*2;bandShape.lineTo(Math.sin(angle)*2.4,2.5-Math.cos(angle)*2.4)}
bandShape.closePath()
export const bandGeometry=new THREE.ExtrudeGeometry(bandShape,{depth:1.18,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:3,steps:1}).translate(0,0,-.59)
const details:THREE.BufferGeometry[]=[new THREE.BoxGeometry(.65,.015,.025).translate(0,-.11,.638)]
for(const x of [-.37,.37]){
  details.push(new THREE.CylinderGeometry(.034,.034,.032,6).rotateX(Math.PI/2).translate(x,.006,.65))
  details.push(new THREE.TorusGeometry(.048,.009,6,16).translate(x,.006,.64))
}
const nonIndexed=details.map(geometry=>geometry.toNonIndexed())
export const bandDetails=mergeGeometries(nonIndexed)
details.forEach(geometry=>geometry.dispose());nonIndexed.forEach(geometry=>geometry.dispose())
export const enamel=new THREE.MeshStandardMaterial({color:'#941c27',metalness:.55,roughness:.52,roughnessMap:castGrain,bumpMap:castGrain,bumpScale:.008})
export const agedSteel=new THREE.MeshStandardMaterial({color:'#9ba393',metalness:.82,roughness:.58,roughnessMap:brushedMetal,bumpMap:brushedMetal,bumpScale:.008})
export const brass=new THREE.MeshStandardMaterial({color:'#cbb57d',metalness:.8,roughness:.4})

export function createSoilGeometry(mobile: boolean) {
  const geometry=new THREE.BoxGeometry(7.6,1,5.2,mobile?52:80,5,mobile?36:56)
  const pos=geometry.attributes.position,colors=new Float32Array(pos.count*3)
  const tint=new THREE.Color(),dark=new THREE.Color('#4c3020'),light=new THREE.Color('#795337')
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i)
    const ridge=Math.sin(x*7.1+Math.sin(z*1.8)*.16)
    const height=.105*ridge+.018*Math.sin(x*21+z*13)+.014*Math.cos(x*11-z*17)
    const depth=y+.5
    pos.setY(i,-.92+depth*(.92+height))
    const sediment=Math.sin(depth*26+x*.9+Math.sin(z*.8))*.09
    const blend=depth>.99?.56+ridge*.14:Math.max(0,Math.min(1,.16+depth*.55+sediment))
    tint.copy(dark).lerp(light,blend)
    colors.set([tint.r,tint.g,tint.b],i*3)
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3))
  geometry.computeVertexNormals()
  return geometry
}

if(import.meta.hot)import.meta.hot.dispose(()=>{brushedMetal.dispose();castGrain.dispose();bandGeometry.dispose();bandDetails.dispose();enamel.dispose();agedSteel.dispose();brass.dispose()})
