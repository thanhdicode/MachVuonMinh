import * as THREE from 'three'
import {flowState} from './scene07State'

// One authored stream and three returning branches. No shell or enclosing core.
export function createValueFlow(){
  const root=new THREE.Group(), sculpture=new THREE.Group();root.add(sculpture)
  const red=new THREE.MeshPhysicalMaterial({color:'#a91f30',metalness:.28,roughness:.27,clearcoat:1,clearcoatRoughness:.18})
  const ceramic=new THREE.MeshStandardMaterial({color:'#e7d9b8',roughness:.34,metalness:.06,emissive:'#c2a06c',emissiveIntensity:.12})
  const steel=new THREE.MeshStandardMaterial({color:'#303332',metalness:.85,roughness:.39})
  const brass=new THREE.MeshStandardMaterial({color:'#b48b43',metalness:.72,roughness:.35})
  const glass=new THREE.MeshPhysicalMaterial({color:'#c7d7cd',metalness:.05,roughness:.24,transparent:true,opacity:.52,depthWrite:false,clearcoat:1})
  const luminous=new THREE.MeshBasicMaterial({color:'#f3e8d0',transparent:true,opacity:.94})
  const curves:THREE.CatmullRomCurve3[]=[]
  const tube=(points:number[][],radius:number,material:THREE.Material,segments=128)=>{
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p as [number,number,number])))
    curves.push(curve);const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,segments,radius,12,false),material);sculpture.add(mesh);return mesh
  }
  tube([[-6,-.9,-.15],[-3.9,-.7,.15],[-2.3,.75,0],[-.8,1.1,-.5],[.7,.05,.4],[2,-.25,.15],[3.6,.9,-.6],[5,.6,0],[6,-.7,.2]],.15,red,384)
  tube([[-6,-.8,-.1],[-3.9,-.6,.2],[-2.3,.85,.05],[-.8,1.2,-.45],[.7,.15,.45],[2,-.15,.2],[3.6,1,-.55],[5,.7,.05],[6,-.6,.25]],.05,ceramic,384)
  const branchMeshes=[
    tube([[-3.8,-.65,.1],[-2.4,-1.4,.7],[-.8,-1.4,.7],[0,-.5,.25]],.062,red),
    tube([[0,-.5,.25],[.8,-1.45,-.5],[2,-1.15,-.55],[3,-.25,.1]],.062,red),
    tube([[3,-.25,.1],[4.3,-1.25,.8],[1.9,-1.95,.6],[-1,-1.8,.1],[-3.8,-.65,.1]],.062,red,192),
  ]
  const sourceCurves=[[-1.45,.45],[-.7,.8],[.7,.8],[1.45,.45]].map(([x,y])=>{
    const c=new THREE.CatmullRomCurve3([new THREE.Vector3(x,y,.3),new THREE.Vector3(x*.8,-.1,.6),new THREE.Vector3(0,-.65,.4)])
    const m=new THREE.Mesh(new THREE.TubeGeometry(c,48,.018,6,false),brass);root.add(m);return {c,m}
  })
  const data=new THREE.Mesh(new THREE.OctahedronGeometry(.43,0),glass);data.position.set(0,-.65,.4);root.add(data)
  const dataCore=new THREE.Mesh(new THREE.OctahedronGeometry(.22,0),ceramic);data.add(dataCore)
  const hardware=(x:number)=>{const group=new THREE.Group();group.position.set(x,-1.2,.65);root.add(group);const base=new THREE.Mesh(new THREE.CylinderGeometry(.35,.41,.1,40),steel);base.rotation.x=Math.PI/2;group.add(base);const rim=new THREE.Mesh(new THREE.TorusGeometry(.35,.018,8,48),brass);rim.position.z=.07;group.add(rim);return group}
  const work=hardware(-3.65),key=hardware(0),splitter=hardware(3.65)
  const workArm=new THREE.Group();work.add(workArm)
  const workShaft=new THREE.Mesh(new THREE.CylinderGeometry(.034,.034,.6,16),steel);workShaft.rotation.z=-.45;workShaft.position.set(.11,.28,.1);workArm.add(workShaft)
  const workGrip=new THREE.Mesh(new THREE.CapsuleGeometry(.11,.28,8,20),red);workGrip.rotation.z=-.45;workGrip.position.set(.24,.56,.12);workArm.add(workGrip)
  const keyShape=new THREE.Shape();keyShape.absarc(0,.1,.19,0,Math.PI*2,false)
  const hole=new THREE.Path();hole.absarc(0,.1,.095,0,Math.PI*2,true);keyShape.holes.push(hole)
  const keyRing=new THREE.Mesh(new THREE.ExtrudeGeometry(keyShape,{depth:.07,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:3,steps:1,curveSegments:24}),glass)
  const keyStem=new THREE.Mesh(new THREE.BoxGeometry(.07,.45,.09),glass);keyStem.position.y=-.27;keyRing.add(keyStem)
  for(let i=0;i<2;i++){const tooth=new THREE.Mesh(new THREE.BoxGeometry(.15,.06,.09),glass);tooth.position.set(.05,-.36+i*.12,0);keyRing.add(tooth)}
  keyRing.position.set(0,.15,.14);key.add(keyRing)
  const splitArm=new THREE.Group();splitter.add(splitArm)
  const shape=new THREE.Shape();shape.moveTo(-.07,-.08);shape.lineTo(.07,-.08);shape.lineTo(.09,.56);shape.quadraticCurveTo(0,.67,-.09,.56);shape.closePath()
  const arm=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.08,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,bevelSegments:3}),brass);arm.position.z=.12;splitArm.add(arm)
  const knob=new THREE.Mesh(new THREE.SphereGeometry(.1,20,12),red);knob.position.set(0,.54,.23);splitArm.add(knob)
  const branchEnds=[new THREE.Vector3(2.6,-.05,.5),new THREE.Vector3(3.65,.2,.5),new THREE.Vector3(4.7,-.05,.5)]
  const valueBranches=branchEnds.map(end=>{
    const c=new THREE.CatmullRomCurve3([new THREE.Vector3(3.65,-1.2,.5),new THREE.Vector3((end.x+3.65)/2,-.6,.5),end])
    const m=new THREE.Mesh(new THREE.TubeGeometry(c,48,.042,8,false),red.clone());root.add(m);return {c,m}
  })
  const pulseGeometry=new THREE.SphereGeometry(.055,8,6)
  const pulses=new THREE.InstancedMesh(pulseGeometry,luminous,48);root.add(pulses)
  const temp=new THREE.Object3D(),point=new THREE.Vector3()
  let clock=0
  function update(p:number,delta:number,still:boolean){
    if(!still)clock+=Math.min(delta,.05)
    const beat=p<.12?0:p<.38?1:p<.65?2:p<.88?3:4
    workArm.rotation.z=-flowState.work*.85
    keyRing.position.x=(flowState.access-1)*.32
    keyRing.rotation.z=(flowState.access-1)*.25
    splitArm.rotation.z=(flowState.split-.5)*-2
    data.rotation.y=clock*.1
    data.scale.setScalar(beat===2?1.15:1)
    sourceCurves.forEach(({m},i)=>{m.visible=beat===2;m.material=flowState.access===0&&i>0?steel:brass})
    work.visible=beat===1;key.visible=beat===2;splitter.visible=beat===3
    valueBranches.forEach(({m},i)=>{m.visible=beat===3;const selected=flowState.split<.34?0:flowState.split>.66?2:1;(m.material as THREE.MeshPhysicalMaterial).color.set(i===selected?'#d84245':'#661c26')})
    branchMeshes.forEach((m,i)=>{m.scale.z=.8+(i===0?flowState.work:i===1?flowState.access/2:flowState.split)*.4})
    const count=beat===4?48:32;pulses.count=count
    for(let i=0;i<count;i++){
      const c=curves[i%curves.length],speed=.022+flowState.work*.014+flowState.access*.006
      c.getPointAt((i/count+clock*speed)%1,point);temp.position.copy(point);temp.scale.setScalar(.7+(i%3)*.18);temp.updateMatrix();pulses.setMatrixAt(i,temp.matrix)
    }
    pulses.instanceMatrix.needsUpdate=true
    ceramic.emissiveIntensity=.1+flowState.work*.18+flowState.access*.035
  }
  function dispose(){const geometry=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();root.traverse(o=>{if(o instanceof THREE.Mesh){geometry.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m))}});geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}
  return {root,update,dispose,anchors:{work:workGrip,key:keyRing,splitter:knob}}
}
