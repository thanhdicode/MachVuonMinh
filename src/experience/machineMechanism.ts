import * as THREE from 'three'
import { brushedMetal, castGrain } from './surfaceDetail.ts'

type Mechanism = {
  root: THREE.Group
  update: (progress: number, velocity: number, delta: number) => void
  dispose: () => void
}

const darkSteel = (texture: THREE.Texture) => new THREE.MeshStandardMaterial({
  color: '#555a51', metalness: .38, roughness: .68, roughnessMap: texture,
  bumpMap: texture, bumpScale: 1.4, transparent: true,
})

export function createMachineMechanism(): Mechanism {
  const root = new THREE.Group()
  root.name = 'machine-mechanism'

  const wheelMaterial = darkSteel(castGrain)
  const wornMaterial = new THREE.MeshStandardMaterial({
    color: '#b48b43', metalness: .46, roughness: .62, roughnessMap: brushedMetal,
    bumpMap: brushedMetal, bumpScale: .7, transparent: true,
  })
  const redMaterial = new THREE.MeshStandardMaterial({
    color: '#b51f2a', emissive: '#3c0508', emissiveIntensity: .32,
    metalness: .16, roughness: .68, roughnessMap: castGrain, transparent: true,
  })
  const toolMaterial = darkSteel(brushedMetal)
  const conveyorMaterial = new THREE.MeshStandardMaterial({
    color: '#666b68', metalness: .32, roughness: .65, roughnessMap: brushedMetal,
    bumpMap: brushedMetal, bumpScale: .6, transparent: true,
  })

  const powerWheel = new THREE.Group()
  powerWheel.name = 'power-wheel'
  powerWheel.position.set(720, 480, 0)
  powerWheel.rotation.y=-.15
  root.add(powerWheel)

  powerWheel.add(new THREE.Mesh(new THREE.TorusGeometry(145, 14, 10, 72), wheelMaterial))
  for (const z of [-8, 8]) {
    const edge = new THREE.Mesh(new THREE.TorusGeometry(145, 2.6, 6, 72), wornMaterial)
    edge.position.z = z
    powerWheel.add(edge)
  }
  for (let i = 0; i < 24; i++) {
    const angle = i / 24 * Math.PI * 2
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(13, 20, 20), wheelMaterial)
    tooth.position.set(Math.cos(angle) * 163, Math.sin(angle) * 163, 0)
    tooth.rotation.z = angle
    powerWheel.add(tooth)
  }
  for (let i = 0; i < 8; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(116, 13, 13), wheelMaterial)
    const angle = i / 8 * Math.PI * 2
    spoke.position.set(Math.cos(angle)*70,Math.sin(angle)*70,0)
    spoke.rotation.z = angle
    powerWheel.add(spoke)
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(32, 32, 38, 24), wheelMaterial)
  hub.rotation.x = Math.PI / 2
  powerWheel.add(hub)
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 100, 18), wornMaterial)
  shaft.rotation.x = Math.PI / 2
  powerWheel.add(shaft)
  for (const z of [-42, 42]) {
    const bearing = new THREE.Mesh(new THREE.TorusGeometry(22, 7, 8, 28), wornMaterial)
    bearing.position.z = z
    powerWheel.add(bearing)
  }

  const beltPoints: THREE.Vector3[] = []
  for (let i = 0; i <= 12; i++) {
    const angle = .2 + i / 12 * (Math.PI * 2 - .4)
    beltPoints.push(new THREE.Vector3(720 + Math.cos(angle) * 166, 480 + Math.sin(angle) * 166, 18))
  }
  beltPoints.push(
    new THREE.Vector3(1015, 420, 18),
    new THREE.Vector3(1330, 420, 18),
    new THREE.Vector3(1362, 450, 18),
    new THREE.Vector3(1330, 480, 18),
    new THREE.Vector3(1015, 480, 18),
  )
  const beltCurve = new THREE.CatmullRomCurve3(beltPoints, true, 'centripetal')
  const belt = new THREE.Mesh(new THREE.TubeGeometry(beltCurve, 144, 5.5, 7, true), redMaterial)
  belt.name = 'red-transmission-belt'
  root.add(belt)

  const lineShaftGeometry = new THREE.CylinderGeometry(8, 8, 500, 16).rotateZ(Math.PI / 2)
  const lineShaft = new THREE.Mesh(lineShaftGeometry, wornMaterial)
  lineShaft.name = 'line-shaft'
  lineShaft.position.set(1200, 450, 0)
  root.add(lineShaft)

  const machineTool = new THREE.Group()
  machineTool.name = 'machine-tool'
  machineTool.position.set(1070, 480, 0)
  machineTool.rotation.y=-.15
  root.add(machineTool)
  const toolBase = new THREE.Mesh(new THREE.BoxGeometry(180, 32, 92), toolMaterial)
  toolBase.position.y = -94
  machineTool.add(toolBase)
  const column = new THREE.Mesh(new THREE.BoxGeometry(58, 174, 72), toolMaterial)
  column.position.set(46, -1, -4)
  machineTool.add(column)
  const ram = new THREE.Mesh(new THREE.BoxGeometry(132, 28, 42), toolMaterial)
  ram.name = 'reciprocating-ram'
  ram.position.set(-22, 48, 8)
  machineTool.add(ram)
  const toolHead = new THREE.Mesh(new THREE.BoxGeometry(15, 58, 18), wornMaterial)
  toolHead.position.set(-78, 20, 8)
  ram.add(toolHead)
  const toolPulley = new THREE.Mesh(new THREE.CylinderGeometry(39, 39, 16, 28), redMaterial)
  toolPulley.name = 'tool-drive-pulley'
  toolPulley.position.set(-54, -30, 18)
  toolPulley.rotation.x = Math.PI / 2
  machineTool.add(toolPulley)
  const crankPin = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 28, 12), wornMaterial)
  crankPin.position.set(-31, -30, 25)
  crankPin.rotation.x = Math.PI / 2
  machineTool.add(crankPin)
  const linkage = new THREE.Mesh(new THREE.BoxGeometry(72, 8, 8), wornMaterial)
  linkage.name = 'ram-linkage'
  linkage.position.set(-28, 9, 22)
  machineTool.add(linkage)

  const conveyor = new THREE.Group()
  conveyor.name = 'output-conveyor'
  conveyor.position.set(1370, 420, 0)
  conveyor.rotation.y=-.15
  root.add(conveyor)
  const conveyorBed = new THREE.Mesh(new THREE.BoxGeometry(230, 16, 76), toolMaterial)
  conveyor.add(conveyorBed)
  const conveyorBelt = new THREE.Mesh(new THREE.BoxGeometry(218, 5, 68), redMaterial)
  conveyorBelt.position.y = 11
  conveyor.add(conveyorBelt)
  const rollers: THREE.Mesh[] = []
  for (let i = 0; i < 7; i++) {
    const roller = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 72, 12), conveyorMaterial)
    roller.position.set(-96 + i * 32, 7, 0)
    roller.rotation.x = Math.PI / 2
    rollers.push(roller)
    conveyor.add(roller)
  }
  for (const x of [-92, 92]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(12, 54, 12), toolMaterial)
    leg.position.set(x, -33, 0)
    conveyor.add(leg)
  }
  const outputPulley = new THREE.Mesh(new THREE.CylinderGeometry(31, 31, 15, 24), redMaterial)
  outputPulley.name = 'output-drive-pulley'
  outputPulley.position.set(-40, 30, 18)
  outputPulley.rotation.x = Math.PI / 2
  conveyor.add(outputPulley)

  const stationMaterials = new Map<THREE.Material, number>()
  for (const material of [wheelMaterial, wornMaterial, redMaterial]) stationMaterials.set(material, 0)
  stationMaterials.set(toolMaterial, .34)
  stationMaterials.set(conveyorMaterial, .47)

  let velocityOffset = 0
  const update = (progress: number, velocity: number, delta: number) => {
    const p = THREE.MathUtils.clamp(progress, 0, 1)
    const dt = THREE.MathUtils.clamp(delta, 0, .1)
    velocityOffset += (THREE.MathUtils.clamp(velocity, -3, 3) * .08 - velocityOffset) * (1 - Math.exp(-10 * dt))
    const angle = p * 12 + velocityOffset
    powerWheel.rotation.z = angle
    toolPulley.rotation.z = -angle * 3.7
    outputPulley.rotation.z = -angle * 4.8
    lineShaft.rotation.x = -angle * 4.1
    ram.position.x = -22 + Math.sin(angle * 3.7) * 18
    linkage.rotation.z = Math.sin(angle * 3.7) * .42
    rollers.forEach(roller => { roller.rotation.z = -angle * 4.8 })

    const finalFade = (1 - THREE.MathUtils.smoothstep(p, .84, .96))*THREE.MathUtils.smoothstep(p,.075,.16)
    for (const [material, revealAt] of stationMaterials) {
      const reveal = revealAt === 0 ? 1 : THREE.MathUtils.smoothstep(p, revealAt, revealAt + .035)
      material.opacity = reveal * finalFade
      material.depthWrite = material.opacity > .98
    }
    machineTool.visible = p >= .34 && finalFade > 0
    conveyor.visible = p >= .47 && finalFade > 0
    powerWheel.visible = belt.visible = finalFade > 0
    lineShaft.visible = p>=.34 && finalFade>0
  }

  update(0, 0, 0)

  const dispose = () => {
    const geometries = new Set<THREE.BufferGeometry>()
    const materials = new Set<THREE.Material>()
    root.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      geometries.add(object.geometry)
      const meshMaterials = Array.isArray(object.material) ? object.material : [object.material]
      meshMaterials.forEach(material => materials.add(material))
    })
    geometries.forEach(geometry => geometry.dispose())
    materials.forEach(material => material.dispose())
  }

  return { root, update, dispose }
}
