import * as THREE from 'three'
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js'
import {flowOption,flowState} from './scene07State'

// A single workshop: machining -> optical inspection -> human control station.
// Motion communicates process order, never a calculated productivity or income estimate.
export function createValueFlow(){
  const root=new THREE.Group(),shop=new THREE.Group();root.add(shop)
  shop.rotation.set(.2,-.38,0)

  const red=new THREE.MeshPhysicalMaterial({color:'#b51f2a',metalness:.45,roughness:.27,clearcoat:.55,clearcoatRoughness:.3})
  const offWhite=new THREE.MeshStandardMaterial({color:'#d9d5c9',metalness:.36,roughness:.38})
  const ink=new THREE.MeshStandardMaterial({color:'#202625',metalness:.72,roughness:.32})
  const darkSteel=new THREE.MeshStandardMaterial({color:'#424b49',metalness:.86,roughness:.29})
  const steel=new THREE.MeshStandardMaterial({color:'#89918c',metalness:.9,roughness:.25})
  const brass=new THREE.MeshStandardMaterial({color:'#b68a45',metalness:.72,roughness:.34})
  const glass=new THREE.MeshPhysicalMaterial({color:'#52615d',metalness:.18,roughness:.14,transparent:true,opacity:.22,depthWrite:false,clearcoat:.8})
  const lensGlass=new THREE.MeshPhysicalMaterial({color:'#111817',metalness:.38,roughness:.1,clearcoat:1,clearcoatRoughness:.12})
  const screen=new THREE.MeshStandardMaterial({color:'#17211f',emissive:'#87978a',emissiveIntensity:.28,metalness:.1,roughness:.3})
  const statusMaterials=[brass.clone(),brass.clone(),brass.clone()]
  const splitMaterials=[red.clone(),red.clone(),red.clone()]
  const branchMaterials=[red.clone(),red.clone(),red.clone()]
  const scanMaterial=new THREE.MeshBasicMaterial({color:'#b51f2a',transparent:true,opacity:.08,side:THREE.DoubleSide,depthWrite:false})
  const amber=new THREE.MeshStandardMaterial({color:'#d39a2c',emissive:'#9b6415',emissiveIntensity:.22,metalness:.38,roughness:.3})
  const signalOff=new THREE.MeshStandardMaterial({color:'#343a38',metalness:.7,roughness:.35})
  const signalGreen=new THREE.MeshStandardMaterial({color:'#617963',emissive:'#314f35',emissiveIntensity:.12,metalness:.35,roughness:.3})

  const roundedGeometries=new Map<string,RoundedBoxGeometry>()
  const cylinderGeometries=new Map<string,THREE.CylinderGeometry>()
  const roundedGeometry=(w:number,h:number,d:number,r=Math.min(w,h,d)*.12,segments=2)=>{
    const key=`${w}/${h}/${d}/${r}/${segments}`
    let geometry=roundedGeometries.get(key)
    if(!geometry){geometry=new RoundedBoxGeometry(w,h,d,segments,r);roundedGeometries.set(key,geometry)}
    return geometry
  }
  const cylinderGeometry=(top:number,bottom:number,height:number,segments=18)=>{
    const key=`${top}/${bottom}/${height}/${segments}`
    let geometry=cylinderGeometries.get(key)
    if(!geometry){geometry=new THREE.CylinderGeometry(top,bottom,height,segments);cylinderGeometries.set(key,geometry)}
    return geometry
  }
  const mesh=(parent:THREE.Object3D,geometry:THREE.BufferGeometry,material:THREE.Material,x:number,y:number,z:number)=>{
    const value=new THREE.Mesh(geometry,material);value.position.set(x,y,z);parent.add(value);return value
  }
  const rounded=(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,material:THREE.Material,r?:number)=>
    mesh(parent,roundedGeometry(w,h,d,r),material,x,y,z)
  const stamp=new THREE.Object3D()
  const instances=(parent:THREE.Object3D,geometry:THREE.BufferGeometry,material:THREE.Material,transforms:Array<[number,number,number,number?,number?,number?]>)=>{
    const value=new THREE.InstancedMesh(geometry,material,transforms.length)
    transforms.forEach(([x,y,z,rx=0,ry=0,rz=0],index)=>{
      stamp.position.set(x,y,z);stamp.rotation.set(rx,ry,rz);stamp.scale.set(1,1,1);stamp.updateMatrix();value.setMatrixAt(index,stamp.matrix)
    })
    value.instanceMatrix.needsUpdate=true;parent.add(value);return value
  }
  const tube=(points:Array<[number,number,number]>,radius:number,material:THREE.Material,segments=72,parent:THREE.Object3D=shop)=>{
    const path=new THREE.CatmullRomCurve3(points.map(point=>new THREE.Vector3(...point)))
    return mesh(parent,new THREE.TubeGeometry(path,segments,radius,8,false),material,0,0,0)
  }

  // A compact machined plinth replaces the exposed rectangular floor.
  rounded(shop,7.9,.3,2.55,0,-.2,0,ink,.13)
  rounded(shop,7.55,.07,2.25,0,0,0,darkSteel,.025)
  instances(shop,roundedGeometry(.5,.22,.46,.08),darkSteel,[-3.25,-1.1,1.1,3.25].flatMap(x=>[-.92,.92].map(z=>[x,-.29,z] as [number,number,number])))

  // Tall CNC enclosure with a thick frame and a recessed glazed machining bay.
  const machine=new THREE.Group();machine.position.set(-2.45,0,-.18);shop.add(machine)
  rounded(machine,2.35,.42,1.68,0,.19,0,offWhite,.13)
  rounded(machine,2.28,.3,1.6,0,3.02,0,red,.1)
  rounded(machine,.3,2.58,1.6,-1.01,1.61,0,offWhite,.1)
  rounded(machine,.3,2.58,1.6,1.01,1.61,0,red,.1)
  rounded(machine,1.75,.33,1.55,0,.55,-.02,darkSteel,.08)
  rounded(machine,1.62,2.06,.1,0,1.73,-.63,ink,.045)
  rounded(machine,1.48,1.84,.08,0,1.71,-.54,darkSteel,.025)
  const door=rounded(machine,.68,1.9,.045,-.38,1.73,.855,glass,.025)
  rounded(machine,.07,1.82,.055,-.69,1.73,.89,steel,.02)
  rounded(machine,.07,1.82,.055,-.03,1.73,.89,steel,.02)
  rounded(machine,.07,.76,.08,-.03,1.67,.93,red,.025)
  rounded(machine,1.55,.035,.055,0,.78,.905,brass,.012)
  instances(machine,roundedGeometry(.38,.025,.02,.006),darkSteel,Array.from({length:7},(_,index)=>[-.78,.73-index*.065,.86] as [number,number,number]))
  instances(machine,cylinderGeometry(.025,.025,.024,12),steel,[-.85,.85].flatMap(x=>[.68,2.77].map(y=>[x,y,.91,Math.PI/2,0,0] as [number,number,number,number,number,number])))

  // Visible tooling: a lathed spindle, column, linear rails, vice and billet.
  const spindleProfile=[new THREE.Vector2(.08,0),new THREE.Vector2(.16,.06),new THREE.Vector2(.16,.18),new THREE.Vector2(.23,.23),new THREE.Vector2(.23,.46),new THREE.Vector2(.17,.53),new THREE.Vector2(.12,.72)]
  const spindle=mesh(machine,new THREE.LatheGeometry(spindleProfile,24),steel,0,1.92,.67)
  spindle.name='value-flow-spindle'
  mesh(machine,cylinderGeometry(.045,.075,.42,16),brass,0,1.47,.67)
  rounded(machine,.72,.45,.34,0,2.6,.45,darkSteel,.08)
  instances(machine,roundedGeometry(1.16,.045,.07,.014),steel,[[-.02,.94,.42],[-.02,.94,.67]])
  rounded(machine,.92,.13,.55,0,.86,.54,darkSteel,.035)
  rounded(machine,.62,.24,.4,0,1.02,.57,steel,.045)
  rounded(machine,.28,.26,.3,0,1.22,.59,brass,.035)
  instances(machine,cylinderGeometry(.035,.035,.04,12),ink,[[-.34,1.15,.79,Math.PI/2,0,0],[.34,1.15,.79,Math.PI/2,0,0]])
  rounded(machine,1.5,.025,.025,0,2.84,.83,darkSteel,.008)

  // The outfeed conveyor is mechanically connected to the machine and inspection bay.
  const conveyor=new THREE.Group();shop.add(conveyor)
  rounded(conveyor,4.95,.32,1.02,1.32,.52,.1,ink,.12)
  rounded(conveyor,5.05,.09,.1,1.32,.72,.58,steel,.025)
  rounded(conveyor,5.05,.09,.1,1.32,.72,-.38,steel,.025)
  instances(conveyor,cylinderGeometry(.073,.073,.9,16),steel,Array.from({length:20},(_,index)=>[-1.02+index*.245,.75,.1,Math.PI/2,0,0] as [number,number,number,number,number,number]))
  instances(conveyor,roundedGeometry(.1,.63,.1,.025),darkSteel,[-.75,.6,1.95,3.35].flatMap(x=>[-.28,.48].map(z=>[x,.2,z] as [number,number,number])))
  tube([[-3.72,.76,.92],[-2.2,.76,.92],[-.95,.76,.69],[.8,.76,.69],[2.3,.76,.69],[3.82,.76,.69]],.045,red)

  // Optical inspection gantry with a machined, concentric camera body.
  const scanner=new THREE.Group();scanner.position.set(.75,0,.08);shop.add(scanner)
  rounded(scanner,.22,1.55,.34,-.72,1.4,0,red,.07)
  rounded(scanner,.22,1.55,.34,.72,1.4,0,red,.07)
  rounded(scanner,1.66,.24,.42,0,2.18,0,red,.08)
  rounded(scanner,1.3,.09,.34,0,2.02,0,darkSteel,.025)
  const cameraProfile=[new THREE.Vector2(.09,0),new THREE.Vector2(.18,.025),new THREE.Vector2(.18,.08),new THREE.Vector2(.25,.11),new THREE.Vector2(.25,.2),new THREE.Vector2(.2,.24),new THREE.Vector2(.2,.31),new THREE.Vector2(.12,.35)]
  const camera=mesh(scanner,new THREE.LatheGeometry(cameraProfile,24),darkSteel,0,1.65,.13)
  const lens=mesh(scanner,cylinderGeometry(.105,.105,.055,24),lensGlass,0,1.6,.13);lens.rotation.x=Math.PI/2
  const scan=mesh(scanner,new THREE.PlaneGeometry(1.05,.52),scanMaterial,0,.98,.1);scan.rotation.x=-Math.PI/2
  instances(scanner,cylinderGeometry(.025,.025,.025,12),brass,[[-.55,2.21,.22,Math.PI/2,0,0],[.55,2.21,.22,Math.PI/2,0,0]])
  rounded(scanner,.2,.58,.2,.96,2.05,0,ink,.055)
  const signalLamps=[2.23,2.05,1.87].map(y=>mesh(scanner,cylinderGeometry(.07,.07,.055,18),signalOff,.96,y,.115))
  signalLamps.forEach(lamp=>lamp.rotation.x=Math.PI/2)
  const inspectionBeam=mesh(shop,cylinderGeometry(.012,.028,1,12),scanMaterial,0,0,0)

  // Human control station: articulated monitor, keyboard shelf, pedestal and e-stop.
  const station=new THREE.Group();station.position.set(3.08,0,-.58);station.rotation.y=-.08;shop.add(station)
  rounded(station,.88,1.28,.62,0,.62,0,offWhite,.12)
  rounded(station,.76,.12,.57,0,.08,0,darkSteel,.04)
  rounded(station,.72,.08,.58,0,1.17,.12,darkSteel,.025)
  rounded(station,.66,.08,.3,0,1.3,.36,offWhite,.025)
  instances(station,roundedGeometry(.075,.028,.16,.008),ink,Array.from({length:7},(_,index)=>[-.24+index*.08,1.35,.39] as [number,number,number]))
  rounded(station,.1,.44,.1,0,1.48,.08,darkSteel,.025)
  rounded(station,.96,.69,.12,0,1.83,.1,ink,.07)
  const display=rounded(station,.82,.55,.025,0,1.83,.17,screen,.025)
  const displayBars=instances(station,roundedGeometry(.4,.035,.018,.008),brass,[[-.08,1.94,.19],[-.08,1.83,.19],[-.08,1.72,.19]])
  const stopBase=mesh(station,cylinderGeometry(.12,.14,.055,20),ink,.31,1.38,.43);stopBase.rotation.x=Math.PI/2
  const stop=mesh(station,cylinderGeometry(.085,.085,.06,20),red,.31,1.4,.47);stop.rotation.x=Math.PI/2
  rounded(station,.28,.08,.09,-.22,.46,.34,brass,.02)
  tube([[.75,2.19,-.05],[1.5,2.45,-.32],[2.25,2.25,-.54],[3.08,1.84,-.42]],.022,brass,56)

  // Large mechanical ownership markers make control legible in silhouette.
  const ownership=new THREE.Group();shop.add(ownership)
  const ownershipMarkers=statusMaterials.map((material,index)=>{
    const marker=new THREE.Group();marker.position.set(-2.15+index*2.15,.05,1.08);ownership.add(marker)
    rounded(marker,1.25,.14,.48,0,0,0,ink,.045)
    rounded(marker,1.08,.07,.34,0,.1,.03,material,.025)
    if(index===0){
      const ring=mesh(marker,new THREE.TorusGeometry(.13,.035,8,20),brass,-.18,.19,.22)
      ring.rotation.x=Math.PI/2;rounded(marker,.42,.07,.07,.18,.19,.22,brass,.018)
      rounded(marker,.07,.13,.07,.34,.14,.22,brass,.015)
    }else if(index===1){
      rounded(marker,.52,.25,.08,0,.21,.2,brass,.045)
      const ring=mesh(marker,new THREE.TorusGeometry(.055,.018,7,16),ink,0,.23,.25);ring.rotation.x=Math.PI/2
    }else{
      for(const x of [-.16,.16]){const ring=mesh(marker,new THREE.TorusGeometry(.11,.03,8,20),brass,x,.2,.22);ring.rotation.x=Math.PI/2}
      rounded(marker,.22,.055,.055,0,.2,.22,brass,.014)
    }
    return marker
  })
  // Three destinations coexist; the red thread branches without claiming numeric shares.
  const shares=new THREE.Group();shop.add(shares)
  tube([[0,.76,.69],[0,.68,.81],[0,.6,.95]],.045,red,24,shares)
  mesh(shares,new THREE.TorusGeometry(.09,.028,8,18),brass,0,.6,.95)
  const shareTrays=splitMaterials.map((material,index)=>{
    const x=-2.15+index*2.15
    const tray=new THREE.Group();tray.position.set(x,.02,1.43);shares.add(tray)
    rounded(tray,1.24,.11,.48,0,0,0,ink,.045)
    instances(tray,cylinderGeometry(.1,.1,.035,18),material,[-.25,0,.25].map(offset=>[offset,.105,0] as [number,number,number]))
    tube([[0,.6,.95],[x*.35,.47,1.11],[x*.75,.29,1.34],[x,.17,1.43]],.045,branchMaterials[index],40,shares)
    return tray
  })

  const flangeProfile=[new THREE.Vector2(.095,-.06),new THREE.Vector2(.15,-.06),new THREE.Vector2(.19,-.035),new THREE.Vector2(.19,.035),new THREE.Vector2(.15,.06),new THREE.Vector2(.095,.06),new THREE.Vector2(.095,-.06)]
  const productGeometry=new THREE.LatheGeometry(flangeProfile,20)
  const products=new THREE.InstancedMesh(productGeometry,steel,7);products.name='value-flow-products';shop.add(products)
  const defectBlank=mesh(shop,productGeometry,amber,0,.88,.1);defectBlank.name='value-flow-defect-blank'
  const defectRing=mesh(shop,new THREE.TorusGeometry(.255,.035,10,28),amber,0,.94,.1);defectRing.name='value-flow-defect'
  defectRing.rotation.x=Math.PI/2
  const productStamp=new THREE.Object3D()
  const beamStart=new THREE.Vector3(.75,1.73,.21),beamEnd=new THREE.Vector3(),beamDirection=new THREE.Vector3()
  const up=new THREE.Vector3(0,1,0)
  let exhibitClock=0,beltClock=0,spindleAngle=0
  function update(_progress:number,delta:number,still:boolean){
    const beat=flowState.beat,work=flowOption(flowState.work)
    const step=still?0:Math.min(delta,.05)
    exhibitClock+=step
    if(work!==2){beltClock+=step;spindleAngle+=step*.55}
    root.visible=beat!==4
    spindle.rotation.y=spindleAngle
    camera.rotation.y=-exhibitClock*.18
    scan.position.y=.98+Math.sin(exhibitClock*1.55)*.08
    scanMaterial.opacity=[.045,.1,.18][work]
    screen.emissiveIntensity=[.14,.34,.5][work]
    display.scale.x=[.88,.96,1][work]
    displayBars.position.x=[-.09,0,.08][work]
    stop.material=work===2?red:darkSteel
    signalLamps.forEach((lamp,index)=>{lamp.material=index===work?[red,amber,signalGreen][work]:signalOff})
    ownership.visible=beat===2;shares.visible=beat===3
    ownershipMarkers.forEach((marker,index)=>{
      const selected=index===flowState.access
      statusMaterials[index].color.set(selected?'#b51f2a':'#b68a45')
      marker.position.y=selected?.19:.05;marker.scale.setScalar(selected?1.08:.9)
    })
    const selectedShare=flowOption(flowState.split)
    splitMaterials.forEach((material,index)=>{
      const selected=index===selectedShare
      material.color.set(selected?'#b51f2a':'#715654');branchMaterials[index].color.set(selected?'#b51f2a':'#744448')
      shareTrays[index].position.y=selected?.16:.02;shareTrays[index].scale.setScalar(selected?1.06:.94)
    })
    const regularPhases=[0,1,2,4,5,6,7]
    regularPhases.forEach((phase,index)=>{
      productStamp.position.set(-1.05+((phase/8+beltClock*.035)%1)*4.8,.88,.1)
      productStamp.rotation.set(0,0,0);productStamp.updateMatrix();products.setMatrixAt(index,productStamp.matrix)
    })
    products.instanceMatrix.needsUpdate=true
    const defectX=-1.05+((3/8+beltClock*.035)%1)*4.8
    defectBlank.position.x=defectX;defectRing.position.x=defectX
    defectRing.rotation.z=exhibitClock*.55
    beamEnd.set(defectX,.96,.1);beamDirection.subVectors(beamEnd,beamStart)
    inspectionBeam.position.copy(beamStart).add(beamEnd).multiplyScalar(.5)
    inspectionBeam.scale.set(1,beamDirection.length(),1)
    inspectionBeam.quaternion.setFromUnitVectors(up,beamDirection.normalize())
  }
  root.traverse(object=>{
    if(!(object instanceof THREE.Mesh))return
    object.receiveShadow=true;object.castShadow=false
    if(object instanceof THREE.InstancedMesh||object.geometry instanceof THREE.TubeGeometry)return
    object.geometry.computeBoundingBox()
    const size=new THREE.Vector3();object.geometry.boundingBox?.getSize(size)
    object.castShadow=size.x*size.y*size.z>.08
  })
  door.castShadow=false;scan.castShadow=false;lens.castShadow=false;spindle.castShadow=false;camera.castShadow=false

  function dispose(){
    const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>()
    root.traverse(object=>{
      if(object instanceof THREE.Mesh){
        geometries.add(object.geometry)
        ;(Array.isArray(object.material)?object.material:[object.material]).forEach(material=>materials.add(material))
        if(object instanceof THREE.InstancedMesh)object.dispose()
      }
    })
    geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose())
  }
  return {root,update,dispose}
}
