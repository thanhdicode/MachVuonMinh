import { useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

export function PaddyGround() {
  const source=useTexture(['/textures/mud-color.jpg','/textures/mud-normal.jpg','/textures/mud-roughness.jpg'])
  const textures=useMemo(()=>source.map((map,i)=>{const texture=map.clone();texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2.4,1.6);texture.anisotropy=4;texture.colorSpace=i===0?THREE.SRGBColorSpace:THREE.NoColorSpace;texture.needsUpdate=true;return texture}),[source[0],source[1],source[2]])
  const geometry=useMemo(()=>{
    const ground=new THREE.BoxGeometry(6,.43,3.5,48,3,28),p=ground.attributes.position
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i),noise=Math.sin(x*13+z*7)*Math.cos(z*11+x*3)
      if(y>0)p.setY(i,y+noise*.025)
      if(Math.abs(x)>2.9)p.setX(i,x+Math.sin(z*14)*.025)
      if(Math.abs(z)>1.65)p.setZ(i,z+Math.sin(x*11)*.025)
    }
    ground.computeVertexNormals();return ground
  },[])
  useEffect(()=>()=>{textures.forEach(t=>t.dispose());geometry.dispose()},[textures,geometry])
  return <group>
    <mesh geometry={geometry} position-y={-1.96}><meshStandardMaterial map={textures[0]} normalMap={textures[1]} normalScale={new THREE.Vector2(.6,.6)} roughnessMap={textures[2]} color="#a99d82"/></mesh>
    <mesh position={[0,-1.705,0]} rotation-x={-Math.PI/2}><planeGeometry args={[5.66,3.14]}/><meshPhysicalMaterial map={textures[0]} normalMap={textures[1]} normalScale={new THREE.Vector2(.18,.18)} color="#657452" roughness={.38} metalness={0} envMapIntensity={.15} clearcoat={.25}/></mesh>
    <mesh position={[0,-1.66,0]}><boxGeometry args={[.22,.15,3.35]}/><meshStandardMaterial map={textures[0]} normalMap={textures[1]} roughness={.96}/></mesh>
    <mesh position={[0,-1.66,.08]}><boxGeometry args={[5.8,.12,.16]}/><meshStandardMaterial map={textures[0]} normalMap={textures[1]} roughness={.96}/></mesh>
  </group>
}
