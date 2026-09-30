import * as THREE from 'three'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'

export function prepareCharacter(source:THREE.Object3D,farmer:boolean) {
    const object=clone(source)
    object.traverse(node=>{
      if(!(node instanceof THREE.Mesh))return
      node.frustumCulled=false
      const material=(node.material as THREE.MeshStandardMaterial).clone()
      node.material=material;material.roughness=.82;material.metalness=0
      const geometry=node.geometry.clone();geometry.deleteAttribute('normal')
      node.geometry=mergeVertices(geometry,1e-7);geometry.dispose()
      if(node.name.includes('Head')&&['Beige','Red'].includes(material.name)){
        if(!farmer)node.visible=false
        else if(material.name==='Red')node.visible=false
        else{
          const positions=node.geometry.attributes.position
          for(let i=0;i<positions.count;i++){
            const x=positions.getX(i),y=positions.getY(i)+.00065,r=Math.hypot(x,y)
            positions.setXYZ(i,x*1.16,y*1.16-.00065,.01705+.002*(1-Math.min(1,r/.0022)))
          }
          positions.needsUpdate=true;material.color.set('#bca579')
        }
      }
      if(material.name==='Brown')material.color.set(farmer?'#81705c':'#aaa18b')
      if(material.name==='LightBlue')material.color.set(farmer?'#384f4b':'#3d4651')
      if(material.name==='Skin')material.color.set('#ae8063')
      node.geometry.computeVertexNormals()
    })
    object.updateMatrixWorld(true)
    object.traverse(node=>{if(node instanceof THREE.SkinnedMesh)node.computeBoundingBox()})
    const box=new THREE.Box3().setFromObject(object),scale=1.65/(box.max.y-box.min.y)
    return {object,scale,bottom:box.min.y}
}
