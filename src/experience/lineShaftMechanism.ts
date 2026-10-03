import * as THREE from 'three'
import { brushedMetal, castGrain } from './surfaceDetail.ts'

type LineShaftMechanism = {
  root: THREE.Group
  update: (progress: number, velocity: number, delta: number, compact?: boolean) => void
  dispose: () => void
}

function ribbonGeometry(points: THREE.Vector3[], width: number, widthAxis: 'x' | 'z') {
  const positions: number[] = [], indices: number[] = []
  for (const point of points) {
    const offset = width / 2
    if (widthAxis === 'x') positions.push(point.x - offset, point.y, point.z, point.x + offset, point.y, point.z)
    else positions.push(point.x, point.y, point.z - offset, point.x, point.y, point.z + offset)
  }
  for (let i = 0; i < points.length; i++) {
    const next = (i + 1) % points.length, a = i * 2, b = next * 2
    indices.push(a, b, a + 1, b, b + 1, a + 1)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  return geometry
}

function verticalBeltPoints(x: number, topY: number, bottomY: number, topRadius: number, bottomRadius: number) {
  const points: THREE.Vector3[] = []
  for (let i = 0; i <= 12; i++) {
    const angle = i / 12 * Math.PI
    points.push(new THREE.Vector3(x, topY + Math.sin(angle) * topRadius, Math.cos(angle) * topRadius))
  }
  for (let i = 0; i <= 12; i++) {
    const angle = Math.PI + i / 12 * Math.PI
    points.push(new THREE.Vector3(x, bottomY + Math.sin(angle) * bottomRadius, Math.cos(angle) * bottomRadius))
  }
  return points
}

function externalBeltPoints(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number, z: number) {
  const dx = x2 - x1, dy = y2 - y1, distance = Math.hypot(dx, dy)
  const direction = Math.atan2(dy, dx), offset = Math.acos((r1 - r2) / distance)
  const first = direction + offset, second = direction - offset + Math.PI * 2
  const points: THREE.Vector3[] = []
  for (let i = 0; i <= 24; i++) {
    const angle = first + i / 24 * (second - first)
    points.push(new THREE.Vector3(x1 + Math.cos(angle) * r1, y1 + Math.sin(angle) * r1, z))
  }
  for (let i = 0; i <= 14; i++) {
    const angle = second - Math.PI * 2 + i / 14 * (first - (second - Math.PI * 2))
    points.push(new THREE.Vector3(x2 + Math.cos(angle) * r2, y2 + Math.sin(angle) * r2, z))
  }
  return points
}

export function createLineShaftMechanism(): LineShaftMechanism {
  const root = new THREE.Group()
  root.name = 'line-shaft-mechanism'

  const castMetal = new THREE.MeshStandardMaterial({
    color: '#62675f', metalness: .26, roughness: .72, roughnessMap: castGrain,
    bumpMap: castGrain, bumpScale: 1.1,
  })
  const wornEdge = new THREE.MeshStandardMaterial({
    color: '#87704d', metalness: .55, roughness: .58, roughnessMap: brushedMetal,
    bumpMap: brushedMetal, bumpScale: .45,
  })
  const brass = new THREE.MeshStandardMaterial({ color: '#b48b43', metalness: .66, roughness: .45 })
  const leather = () => new THREE.MeshStandardMaterial({
    color: '#68432c', emissive: '#000000', metalness: .03, roughness: .88,
    roughnessMap: castGrain, side: THREE.DoubleSide,
  })
  const mainLeather = leather(), beltMaterials = [leather(), leather(), leather()]
  const seamMaterial = new THREE.MeshStandardMaterial({ color: '#9c7250', metalness: .04, roughness: .82 })
  const motorMetal = new THREE.MeshStandardMaterial({
    color: '#748183', metalness: .62, roughness: .46, roughnessMap: brushedMetal,
    bumpMap: brushedMetal, bumpScale: .28,
  })
  const tracerMaterial = new THREE.MeshStandardMaterial({
    color: '#b51f2a', emissive: '#3d0508', emissiveIntensity: .38,
    metalness: .12, roughness: .54,
  })

  const flywheel = new THREE.Group()
  flywheel.name = 'line-shaft-flywheel'
  flywheel.position.set(330, 340, 40)
  root.add(flywheel)
  flywheel.add(new THREE.Mesh(new THREE.TorusGeometry(145, 15, 10, 72), castMetal))
  for (const z of [-10, 10]) {
    const edge = new THREE.Mesh(new THREE.TorusGeometry(145, 2.2, 6, 72), wornEdge)
    edge.position.z = z
    flywheel.add(edge)
  }
  for (let i = 0; i < 8; i++) {
    const angle = i / 8 * Math.PI * 2
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(116, 12, 13), castMetal)
    spoke.position.set(Math.cos(angle) * 69, Math.sin(angle) * 69, 0)
    spoke.rotation.z = angle
    flywheel.add(spoke)
  }
  const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(29, 29, 46, 24), castMetal)
  wheelHub.rotation.x = Math.PI / 2
  flywheel.add(wheelHub)
  const hubCap = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 53, 16), brass)
  hubCap.rotation.x = Math.PI / 2
  flywheel.add(hubCap)

  const mainDrive = new THREE.Mesh(
    ribbonGeometry(externalBeltPoints(330, 340, 160, 440, 645, 52, 40), 18, 'z'),
    mainLeather,
  )
  mainDrive.name = 'main-leather-drive'
  root.add(mainDrive)

  const inputPulley = new THREE.Mesh(new THREE.CylinderGeometry(52, 52, 22, 32), castMetal)
  inputPulley.name = 'countershaft-input-pulley'
  inputPulley.position.set(440, 645, 40)
  inputPulley.rotation.x = Math.PI / 2
  root.add(inputPulley)
  const counterOutputGeometry = new THREE.CylinderGeometry(42, 42, 26, 28).rotateZ(Math.PI / 2)
  const counterOutput = new THREE.Mesh(counterOutputGeometry, wornEdge)
  counterOutput.name = 'countershaft-output-pulley'
  counterOutput.position.set(440, 645, 0)
  root.add(counterOutput)

  const lineShaftGeometry = new THREE.CylinderGeometry(9, 9, 1160, 18).rotateZ(Math.PI / 2)
  const lineShaft = new THREE.Mesh(lineShaftGeometry, castMetal)
  lineShaft.name = 'line-shaft'
  lineShaft.position.set(910, 645, 0)
  root.add(lineShaft)

  const shaftPulleys: THREE.Mesh[] = []
  for (const [index, x, radius] of [[0, 440, 42], [1, 600, 31], [2, 700, 39], [3, 1080, 32], [4, 1370, 37], [5, 1490, 28]] as const) {
    const geometry = new THREE.CylinderGeometry(radius, radius, 22, 28).rotateZ(Math.PI / 2)
    const pulley = new THREE.Mesh(geometry, index === 0 ? wornEdge : castMetal)
    pulley.name = `shaft-pulley-${index + 1}`
    pulley.position.set(x, 645, 0)
    shaftPulleys.push(pulley)
    root.add(pulley)
  }

  for (const [index, x] of [530, 900, 1190, 1450].entries()) {
    const hanger = new THREE.Group()
    hanger.name = `bearing-hanger-${index + 1}`
    const bearing = new THREE.Mesh(new THREE.TorusGeometry(19, 7, 8, 28), wornEdge)
    bearing.rotation.y = Math.PI / 2
    hanger.add(bearing)
    const drop = new THREE.Mesh(new THREE.BoxGeometry(16, 78, 18), castMetal)
    drop.position.y = 52
    hanger.add(drop)
    for (const z of [-10, 10]) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 5, 10), brass)
      bolt.position.set(0, 83, z)
      bolt.rotation.x = Math.PI / 2
      hanger.add(bolt)
    }
    hanger.position.set(x, 645, 0)
    root.add(hanger)
  }

  const stationData = [
    { x: 700, y: 440, topRadius: 39, bottomRadius: 34, width: 16, at: .28 },
    { x: 1080, y: 570, topRadius: 32, bottomRadius: 25, width: 18, at: .38 },
    { x: 1370, y: 365, topRadius: 37, bottomRadius: 32, width: 15, at: .47 },
  ]
  const stations: THREE.Group[] = [], drivenPulleys: THREE.Mesh[] = [], belts: THREE.Mesh[] = []
  const seams: THREE.Mesh[] = [], motors: THREE.Group[] = []
  stationData.forEach((data, index) => {
    const station = new THREE.Group()
    station.name = `drive-station-${index + 1}`
    const belt = new THREE.Mesh(
      ribbonGeometry(verticalBeltPoints(data.x, 645, data.y, data.topRadius, data.bottomRadius), data.width, 'x'),
      beltMaterials[index],
    )
    belt.name = `vertical-belt-${index + 1}`
    belts.push(belt)
    station.add(belt)
    const drivenGeometry = new THREE.CylinderGeometry(data.bottomRadius, data.bottomRadius, data.width + 8, 26).rotateZ(Math.PI / 2)
    const driven = new THREE.Mesh(drivenGeometry, castMetal)
    driven.name = `driven-pulley-${index + 1}`
    driven.position.set(data.x, data.y, 0)
    drivenPulleys.push(driven)
    station.add(driven)
    const seam = new THREE.Mesh(new THREE.BoxGeometry(data.width + 2, 10, 3), seamMaterial)
    seam.name = `belt-seam-${index + 1}`
    seam.position.set(data.x, data.y, data.topRadius + 1.5)
    seams.push(seam)
    station.add(seam)

    const motor = new THREE.Group()
    motor.name = `drive-motor-${index + 1}`
    motor.position.set(data.x + (data.width + 34) / 2, data.y, 0)
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 26, 20).rotateZ(Math.PI / 2), motorMetal)
    housing.name = `motor-housing-${index + 1}`
    motor.add(housing)
    const endcap = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 4, 16).rotateZ(Math.PI / 2), wornEdge)
    endcap.name = `motor-endcap-${index + 1}`
    endcap.position.x = 15
    motor.add(endcap)
    const coupling = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 10, 12).rotateZ(Math.PI / 2), brass)
    coupling.position.x = -18
    motor.add(coupling)
    motor.visible = false
    motor.scale.setScalar(.02)
    motors.push(motor)
    station.add(motor)

    if (index === 0) {
      const spindle = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 76, 16).rotateZ(Math.PI / 2), wornEdge)
      spindle.name = 'driven-chuck'
      spindle.position.set(data.x + 42, data.y - 48, 0)
      station.add(spindle)
      const chuck = new THREE.Mesh(new THREE.CylinderGeometry(23, 18, 20, 12).rotateZ(Math.PI / 2), castMetal)
      chuck.position.set(data.x + 78, data.y - 48, 0)
      station.add(chuck)
    } else if (index === 1) {
      const ram = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 48, 16), wornEdge)
      ram.name = 'driven-ram'
      ram.position.set(data.x, data.y - 82, 0)
      station.add(ram)
    } else {
      const roller = new THREE.Mesh(new THREE.CylinderGeometry(17, 17, 108, 18).rotateZ(Math.PI / 2), wornEdge)
      roller.name = 'driven-output-roller'
      roller.position.set(data.x, data.y - 60, 0)
      station.add(roller)
    }
    stations.push(station)
    root.add(station)
  })

  const tracerWheelPoints = [
    new THREE.Vector3(118, 340, 58),
    ...externalBeltPoints(330, 340, 166, 440, 645, 57, 58),
  ]
  tracerWheelPoints.push(new THREE.Vector3(440, 645, 58))
  const tracerCurve = new THREE.CatmullRomCurve3(tracerWheelPoints, false, 'centripetal')
  const tracerWrap = new THREE.Mesh(new THREE.TubeGeometry(tracerCurve, 128, 2.1, 5, false), tracerMaterial)
  tracerWrap.name = 'red-tracer-wheel-wrap'
  root.add(tracerWrap)
  const tracerShaft = new THREE.Mesh(new THREE.BoxGeometry(930, 3.2, 3.2), tracerMaterial)
  tracerShaft.name = 'red-tracer-shaft-route'
  tracerShaft.position.set(905, 645, 45)
  root.add(tracerShaft)
  const tracerDrop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1, 3.2), tracerMaterial)
  tracerDrop.name = 'active-red-tracer'
  root.add(tracerDrop)

  let velocityOffset = 0
  const leatherColor = new THREE.Color('#68432c'), signalColor = new THREE.Color('#9bb7b7')
  const update = (progress: number, velocity: number, delta: number, compact = false) => {
    const p = THREE.MathUtils.clamp(progress, 0, 1), dt = THREE.MathUtils.clamp(delta, 0, .1)
    velocityOffset += (THREE.MathUtils.clamp(velocity, -3, 3) * .09 - velocityOffset) * (1 - Math.exp(-10 * dt))
    const wheelAngle = p * 13 + velocityOffset, shaftAngle = -wheelAngle * 1.72
    flywheel.rotation.z = wheelAngle
    inputPulley.rotation.z = -wheelAngle * 2.7
    counterOutput.rotation.x = shaftAngle
    lineShaft.rotation.x = shaftAngle
    shaftPulleys.forEach(pulley => { pulley.rotation.x = shaftAngle })
    drivenPulleys.forEach((pulley, index) => { pulley.rotation.x = shaftAngle * stationData[index].topRadius / stationData[index].bottomRadius })
    const chuck=root.getObjectByName('driven-chuck'),ram=root.getObjectByName('driven-ram'),roller=root.getObjectByName('driven-output-roller')
    if(chuck&&p>=.28)chuck.rotation.x=shaftAngle*1.8
    if(ram&&p>=.38)ram.position.y=stationData[1].y-82-Math.sin(shaftAngle*1.6)*4
    if(roller&&p>=.47)roller.rotation.x=shaftAngle*2.2

    stations.forEach((station, index) => { station.visible = p >= stationData[index].at && !(compact && index === 2) })
    seams.forEach((seam, index) => {
      const data = stationData[index], travel = 645 - data.y
      seam.position.y = data.y + THREE.MathUtils.euclideanModulo(-shaftAngle / (Math.PI * 2), 1) * travel
    })
    belts.forEach((belt, index) => {
      belt.scale.set(1, 1, 1)
      belt.position.set(0, 0, 0)
      seams[index].visible = true
      beltMaterials[index].color.copy(leatherColor)
      beltMaterials[index].emissive.set(0x000000)
    })
    const cool = THREE.MathUtils.smoothstep(p, .93, 1)
    motors.forEach((motor, index) => {
      motor.visible = stations[index].visible && cool > 0
      motor.scale.setScalar(Math.max(.02, cool))
    })
    const activeIndex = p < .28 ? -1 : p < .38 ? 0 : p < .47 || compact ? 1 : 2
    tracerDrop.visible = activeIndex >= 0
    if (activeIndex >= 0) {
      const data = stationData[activeIndex]
      tracerDrop.position.set(data.x, (645 + data.y) / 2, 45)
      tracerDrop.scale.y = 645 - data.y
    }
    let signalIndex = -1
    stations.forEach((station, index) => { if (station.visible) signalIndex = index })
    if (signalIndex >= 0) {
      const signalBelt = belts[signalIndex]
      signalBelt.scale.x = 1 - cool * .85
      signalBelt.position.x = stationData[signalIndex].x * (1 - signalBelt.scale.x)
      seams[signalIndex].visible = cool < .55
      beltMaterials[signalIndex].color.copy(leatherColor).lerp(signalColor, cool)
      beltMaterials[signalIndex].emissive.copy(signalColor).multiplyScalar(cool * .16)
    }
  }

  update(0, 0, 0)

  const dispose = () => {
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>()
    root.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      geometries.add(object.geometry)
      const ownedMaterials = Array.isArray(object.material) ? object.material : [object.material]
      ownedMaterials.forEach(material => materials.add(material))
    })
    geometries.forEach(geometry => geometry.dispose())
    materials.forEach(material => material.dispose())
  }

  return { root, update, dispose }
}
