# Production startup verification — 2026-10-06

User requested smoother synchronized loading and no UI redesign after a production screenshot with an empty hero. Fresh old-production visit reproduced an initial waiting phase; unlocked hero later rendered correctly. All world/HDR/model requests succeeded; no persistent shader/runtime error was reproduced.

Confirmed cause of unnecessary work: the old entry statically imported React from the Scene07AudioSynth chunk, loading and initializing Tone at startup. Fixed with a dedicated React runtime chunk. New HTML preloads the world chunk and HDR at navigation start. Intro overlays wait for the first actual rendered frame; the intro shaders prepare first and other chapter groups yield between jobs. History panorama now uses its existing near-viewport loading signal. Geometry, materials, camera path, DPR, styles and authored notebook motion are unchanged.

## Verification
- Three new behavioral tests cover ready-before-background, yields and cancellation. Full187 tests pass.
- Production build passes. scripts/verify-startup-build.mjs confirms initial static graph has3 JS chunks, no eager audio and world modulepreload. Existing world bundle remains ~1.075MB raw; no universal FPS or network-speed guarantee.
- Chrome production-build preview1440x900: world requested at29ms; first rendered frame2689ms in its first observed cold run. IAB1280x720: first observed frame1252ms; repeat984.7ms. These runs use different browser/cache/GPU states and are not a controlled old/new speed comparison.
- IAB startup:0 AudioSynth requests,0 atlas-panorama requests,1 canvas. Native intro click shows title with ring/thread; history navigation loads panorama and artwork correctly; robot chapter renders and controls remain available.
- Robot steady-state sample2.2sec:397 RAF intervals, median5.6ms, P955.8ms,max5.9ms,0 longtasks. Measures browser frame callbacks on this machine, not guaranteed draw FPS on every laptop or transition.
- Local analytics script404 is expected on vite preview. No world/model asset errors; no early AudioContext warnings after audio isolation.

Official API references: https://vite.dev/guide/build and https://rolldown.rs/reference/OutputOptions.codeSplitting. Installed Three compileAsync implementation verified before staging warmup.

## Production release — 2026-10-07
- Code commit9866cb35aeb2af2ade0ba230a86c7237920b29e4 pushed to main. GitHub Vercel status success; deployment6ENC1Q2UyKmB6iZbfsm2CqFKMH3s.
- Live domain HTML preloads WorldCanvas, React runtime and studio HDR; no AudioSynth preload. Fresh IAB visit: first-frame mark2702ms, WorldCanvas fetch starts1036ms, one canvas, zero AudioSynth and panorama requests, zero resource responses>=400. Single run, not a controlled benchmark.
- Skipped welcome guide and activated intro through its real button. Ring/thread and title are visible together. Saved local production-hero.png proof. No runtime errors; existing THREE.Clock deprecation warning remains.
