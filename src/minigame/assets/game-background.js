(function (global) {
  'use strict';
  const palettes = [
    { sky: '#ead9b8', soil: '#795e43', accent: '#b58b51' },
    { sky: '#e2d2bb', soil: '#765847', accent: '#ab6848' },
    { sky: '#d9d9d2', soil: '#545f60', accent: '#b68d58' },
    { sky: '#d3d9d5', soil: '#465c61', accent: '#a9b7ae' },
    { sky: '#eadfc5', soil: '#65715a', accent: '#bead71' },
  ];
  function defaultCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function create(factory = defaultCanvas, options = {}) {
    const images = options.images || {};
    const scenery = options.scenery || global.MACH_RUNNER_ASSETS?.scenery;
    let cache = null, signature = '';
    function layer(w, h, alpha) {
      const canvas = factory(w, h); canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d', { alpha }); ctx.imageSmoothingEnabled = false;
      return { canvas, ctx };
    }
    function tile(ctx, image, col, row, x, y, scale = 3) {
      if (image) ctx.drawImage(image, col * 18, row * 18, 18, 18, x, y, 18 * scale, 18 * scale);
    }
    function rebuild(stage, height, groundY) {
      const p = palettes[stage], plate = images['pixel_background_' + stage];
      const panorama = layer(768, height, false), props = layer(1536, groundY, true), ground = layer(1026, height - groundY, true);
      panorama.ctx.fillStyle = p.sky; panorama.ctx.fillRect(0, 0, 768, height);
      if (plate) panorama.ctx.drawImage(plate, 2, 0, plate.width - 4, plate.height, 0, 0, 768, height);
      const industrial = stage > 0 && stage < 4, tiles = images[industrial ? 'pixel_industry' : stage === 0 ? 'pixel_farm' : 'pixel_tiles'];
      for (let x = 0; x < 1026; x += 54) {
        tile(ground.ctx, tiles, 1 + ((x / 54) % 2), 0, x, 0);
        tile(ground.ctx, tiles, 1, industrial || stage === 0 ? 1 : 6, x, 54);
      }
      ground.ctx.globalCompositeOperation = 'destination-over';
      ground.ctx.fillStyle = p.soil; ground.ctx.fillRect(0, 0, 1026, height - groundY);
      ground.ctx.globalCompositeOperation = 'source-over';
      ground.ctx.fillStyle = '#f3e8d0'; ground.ctx.globalAlpha = .16; ground.ctx.fillRect(0, 0, 1026, height - groundY); ground.ctx.globalAlpha = 1;
      ground.ctx.fillStyle = '#b51f2a'; ground.ctx.fillRect(0, 18, 1026, 3);
      ground.ctx.fillStyle = '#efd6aa';
      for (let x = 0; x < 1026; x += 171) { ground.ctx.fillRect(x, 18, 9, 3); ground.ctx.fillRect(x + 45, 75, 6, 3); }
      const atlas = images[scenery?.atlas], crops = scenery?.stages[stage], placements = [];
      // Quiet, material-rich clusters share the panorama palette, behind the obstacle lane.
      if (atlas && crops) {
        [[0, 40, 156], [2, 397, 112], [1, 781, 148], [0, 1237, 134]].forEach(([col, x, width], index) => {
          const crop = crops[col], ratio = crop.height / crop.width;
          const h = Math.min(78, Math.round(width * ratio)), w = Math.round(h / ratio), y = groundY - 6 - h;
          const sway = col === 0 && (stage === 0 || stage === 4);
          const canopy = sway ? Math.floor(crop.height * .52) : 0, canopyHeight = Math.round(h * canopy / crop.height);
          props.ctx.drawImage(atlas, crop.x, crop.y + canopy, crop.width, crop.height - canopy, x, y + canopyHeight, w, h - canopyHeight);
          placements.push({ col, index, crop, x, y, width: w, height: h, canopy, canopyHeight });
        });
      }
      return { panorama, props, ground, placements, atlas };
    }
    function repeat(ctx, canvas, width, offset, y, mirror = false) {
      const span = canvas.width, period = span * (mirror ? 2 : 1), phase = ((offset % period) + period) % period;
      const first = Math.floor(phase / span);
      for (let n = -1; n <= Math.ceil(width / span) + 1; n++) {
        const x = Math.round(n * span - (phase % span));
        if (x >= width || x + span <= 0) continue;
        if (mirror && (first + n) % 2 !== 0) { ctx.save(); ctx.translate(x + span, y); ctx.scale(-1, 1); ctx.drawImage(canvas, 0, 0); ctx.restore(); }
        else ctx.drawImage(canvas, x, y);
      }
    }
    function animateScenery(ctx, frame, stage, world, t, reduced) {
      const span = cache.props.canvas.width, phase = reduced ? 0 : ((world * .38 % span) + span) % span;
      for (const prop of cache.placements) {
        for (let n = -1; n <= Math.ceil(frame.width / span) + 1; n++) {
          const x = Math.round(prop.x + n * span - phase);
          if (x >= frame.width || x + prop.width <= 0) continue;
          if (prop.canopy) {
            const sway = reduced ? 0 : Math.round(Math.sin(t * 1.4 + prop.index * 1.7) * 1.5);
            ctx.drawImage(cache.atlas, prop.crop.x, prop.crop.y, prop.crop.width, prop.canopy, x + sway, prop.y, prop.width, prop.canopyHeight);
          }
          if (reduced) continue;
          if (stage === 0 && prop.col === 1) {
            // Glints stay on the irrigation wheel's cascade, rather than floating in the sky.
            ctx.fillStyle = '#f3e8d0'; ctx.globalAlpha = .65;
            for (let i = 0; i < 3; i++) ctx.fillRect(Math.round(x + prop.width * .71), Math.round(prop.y + prop.height * (.62 + ((t * .4 + i / 3) % 1) * .28)), 2, 2);
          } else if ((stage === 1 && prop.col === 1) || (stage === 2 && prop.col === 2)) {
            ctx.fillStyle = '#f3e8d0';
            for (let i = 0; i < 4; i++) {
              const rise = (t * 7 + i * 9) % 36;
              ctx.globalAlpha = .22 * (1 - rise / 36);
              ctx.fillRect(Math.round(x + prop.width * (stage === 1 ? .36 : .76) + Math.sin(t + i) * 3), Math.round(prop.y - rise), 4 + Math.floor(rise / 10), 3);
            }
          } else if (stage === 3 && prop.col === 1) {
            ctx.fillStyle = '#e6be79'; ctx.globalAlpha = .35 + (1 + Math.sin(t * 2)) * .2;
            ctx.fillRect(Math.round(x + prop.width * .32), Math.round(prop.y + prop.height * .21), 2, 2);
          } else if (stage === 4 && prop.col === 1) {
            ctx.fillStyle = '#f3e8d0'; ctx.globalAlpha = Math.max(0, Math.sin(t * .9)) * .4;
            ctx.fillRect(Math.round(x + prop.width * .28), Math.round(prop.y + prop.height * .16), 7, 1);
          }
          ctx.globalAlpha = 1;
        }
      }
    }
    function draw(ctx, frame) {
      const stage = Math.max(0, Math.min(4, frame.stage | 0)), h = frame.height || 430, gy = frame.groundY || 333;
      const key = stage + ':' + h + ':' + gy + ':' + !!images['pixel_background_' + stage] + ':' + !!images.pixel_tiles + ':' + !!images.pixel_farm + ':' + !!images.pixel_industry + ':' + !!images[scenery?.atlas];
      if (key !== signature || !cache) { cache = rebuild(stage, h, gy); signature = key; }
      const world = frame.world || 0, reduced = !!frame.reduced, t = (frame.time || 0) / 1000;
      ctx.save(); ctx.imageSmoothingEnabled = false;
      // One framed panorama avoids mirrored landmarks, doubled suns and a visible sky seam.
      // The road/props loop independently; distant camera travel is deliberately bounded.
      const scenicWidth = Math.max(768, frame.width * 1.18), travel = scenicWidth - frame.width;
      const scenicX = reduced ? 0 : Math.round(-(1 - Math.cos(world * .075 / Math.max(1, travel))) * travel / 2);
      ctx.drawImage(cache.panorama.canvas, scenicX, 0, scenicWidth, h);
      repeat(ctx, cache.props.canvas, frame.width, reduced ? 0 : world * .38, 0);
      animateScenery(ctx, frame, stage, world, t, reduced);
      // Sparse pollen belongs to the garden/rice scenes; machine steam is anchored above.
      if (!reduced && (stage === 0 || stage === 4)) {
        ctx.fillStyle = '#efdba7';
        for (let i = 0; i < 9; i++) {
          const x = ((i * 163 + t * 13) % (frame.width + 30)) - 15;
          const y = gy - 42 + Math.sin(t * .8 + i) * 24;
          ctx.globalAlpha = .28;
          ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
        }
      }
      ctx.globalAlpha = 1; repeat(ctx, cache.ground.canvas, frame.width, world, gy); ctx.restore();
    }
    return { draw, invalidate() { cache = null; signature = ''; } };
  }
  global.MACH_GAME_BACKGROUND = { create, palettes };
})(window);
