# TECH ARCHITECTURE V2

## Stack
Adapt to current project where necessary.

Core:
- React 19
- TypeScript strict
- current Vite/Base44 React foundation
- three
- @react-three/fiber 9
- @react-three/drei
- GSAP + @gsap/react + ScrollTrigger
- Lenis
- Zustand
- maath

Optional:
- @react-three/postprocessing
- motion
- howler
- Leva dev-only

Do not jump to experimental R3F 10 just for novelty.

## Structure

src/
  experience/
    Experience.tsx
    WorldCanvas.tsx
    CameraRig.tsx
    WorldTimeline.ts
    WorldState.ts
  scenes/
    IntroThread/
    Agrarian/
    Machine/
    Automation/
    Data/
    DialecticLab/
    VietnamEvidence/
    PolicyChamber/
    Synthesis/
  objects/
    RedThread/
    DialecticCore/
    AdaptiveCage/
    GearSystem/
    RobotArm/
    DataParticles/
    VietnamPath/
  shaders/
    inkBleed/
    dither/
    coreDeform/
    signal/
  ui/
    SceneCopy/
    MinimalNav/
    SourceDrawer/
    LabControls/
    PolicyTokens/
  data/
    copy.ts
    evidence.ts
    sources.ts

## World timeline
0.00–0.08 intro
0.08–0.18 agrarian
0.18–0.30 machine
0.30–0.41 automation
0.41–0.53 digital
0.53–0.70 lab
0.70–0.82 Vietnam
0.82–0.92 policy
0.92–1.00 synthesis

Tune after screenshot QA.

## Scene manager
Only current/adjacent scenes animate at full detail.
Preload next.
Hide/freeze far scenes.
One WebGL context only.

## Dialectic Lab conceptual model
LLSX:
technology, data, skills, infrastructure, automation

QHSX:
ownership, organization, distribution

llsx = weighted mean
qhsx = weighted mean
gap = llsx - qhsx
alignment = 1 - abs(llsx - qhsx)

Important:
“higher QHSX” is not automatically better.
Fit is based on relation/distance.

Suggested:
strain at ~0.18 gap
contradiction at ~0.38

Illustrative:
capacity = llsx * (0.55 + 0.45*alignment)

Never label capacity as GDP/productivity.

## Performance
Desktop target ~60fps
Integrated laptop >45fps
Mobile >30fps

Rules:
- max DPR ~1.5 desktop / 1 mobile
- instancing
- reuse materials
- lazy textures
- no giant 4K PNG
- one EffectComposer
- fewer particles mobile
- SVG fallback for map
- avoid dynamic shadows
- scene-specific effects only

## Mobile
Re-author; do not shrink desktop:
- shorter camera path
- core/thread retained
- edge controls become bottom sheet
- policy tokens horizontal
- source drawer fullscreen
- particles reduced

## QA screenshots
Capture:
1440x900
1920x1080
390x844

Reject if:
- >50% useless empty area
- main visual smaller than content panel
- slide-deck composition
- repeated rectangular panels
- no depth
- red thread not visible
