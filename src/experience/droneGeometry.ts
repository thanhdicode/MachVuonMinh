import * as THREE from 'three'

export const rotorPositions: [number,number,number][] = [[-1.38,.18,-.94],[1.38,.18,-.94],[-1.38,.18,.94],[1.38,.18,.94]]

export function createPropellerGeometry() {
  const blade=new THREE.Shape()
  blade.moveTo(.1,-.035)
  blade.bezierCurveTo(.4,-.12,.8,-.11,1.02,-.025)
  blade.bezierCurveTo(1.09,.005,1.08,.045,1.01,.055)
  blade.bezierCurveTo(.68,.065,.4,.12,.12,.055)
  blade.closePath()
  const geometry=new THREE.ExtrudeGeometry(blade,{depth:.018,bevelEnabled:true,bevelSize:.008,bevelThickness:.006,bevelSegments:2,curveSegments:12,steps:1})
  geometry.rotateX(-Math.PI/2)
  return geometry
}

export function createRiceGeometry() {
  const vertices:number[]=[],colors:number[]=[]
  for(let leaf=0;leaf<5;leaf++){
    const angle=leaf*Math.PI*2/5, height=.34+(leaf%3)*.065
    const vertex=(t:number,side:number)=>{
      const bend=t*t*.14,width=Math.sin(t*Math.PI)*.008
      vertices.push(Math.cos(angle)*bend-Math.sin(angle)*width*side,t*height,Math.sin(angle)*bend+Math.cos(angle)*width*side)
      colors.push(.045+t*.065,.075+t*.095,.008+t*.014)
    }
    for(let j=0;j<5;j++){
      const a=j/5,b=(j+1)/5
      vertex(a,-1);vertex(b,-1);vertex(b,1)
      vertex(a,-1);vertex(b,1);vertex(a,1)
    }
  }
  for(let seed=0;seed<12;seed++){
    const t=seed/11,x=.02+t*.11,y=.49+Math.sin(t*Math.PI)*.055-t*.05,z=Math.sin(seed*2.4)*.025
    const points=[[x-.006,y,z],[x+.006,y,z],[x,y+.018,z+.004],[x,y-.012,z-.004]]
    for(const i of [0,1,2,0,3,1,0,2,3,1,3,2]){vertices.push(...points[i]);colors.push(.22,.18,.045)}
  }
  const geometry=new THREE.BufferGeometry()
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3))
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3))
  geometry.computeVertexNormals()
  return geometry
}

export const flightRoute=new THREE.CatmullRomCurve3([
  [-.85,.95,-.65],[.85,.95,-.65],[1,.95,-.3],[.85,.95,0],[-.85,.95,0],[-1,.95,.3],[-.85,.95,.65],[.85,.95,.65],[1.15,.95,.1],[1.1,.95,-.95],[-1.1,.95,-.95],
].map(p=>new THREE.Vector3(...p)),true,'catmullrom',.14)

export function flightPosition(time:number,position:THREE.Vector3) {
  flightRoute.getPointAt((time*.025)%1,position)
  position.y+=Math.sin(time*.9)*.025
  return position
}
