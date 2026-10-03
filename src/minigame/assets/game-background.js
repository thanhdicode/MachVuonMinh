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
      // The rice panorama already contains vegetation; coarse crop/fence tiles clash with its scale.
      if (stage !== 0) {
        for (let x = 90; x < 1536; x += 192) {
          // Scenery sits behind and above the lane; never reuse a live hazard as road decoration.
          if (!industrial) tile(props.ctx, images.pixel_tiles, 4 + (x % 3), 6, x, groundY - 82, 3);
          else { tile(props.ctx, images.pixel_industry, 7, 2, x, groundY - 90, 2); tile(props.ctx, images.pixel_industry, 14, 6, x + 50, groundY - 86, 3); }
        }
      }
      return { panorama, props, ground };
    }
    function repeat(ctx, canvas, width, offset, y, mirror = false) {
      const span = canvas.width, period = span * (mirror ? 2 : 1), phase = ((offset % period) + period) % period;
      const first = Math.floor(phase / span);
      for (let n = -1; n <= Math.ceil(width / span) + 1; n++) {
        const x = Math.round(n * span - (phase % span));
        if (mirror && (first + n) % 2 !== 0) { ctx.save(); ctx.translate(x + span, y); ctx.scale(-1, 1); ctx.drawImage(canvas, 0, 0); ctx.restore(); }
        else ctx.drawImage(canvas, x, y);
      }
    }
    function draw(ctx, frame) {
      const stage = Math.max(0, Math.min(4, frame.stage | 0)), h = frame.height || 430, gy = frame.groundY || 333;
      const key = stage + ':' + h + ':' + gy + ':' + !!images['pixel_background_' + stage] + ':' + !!images.pixel_tiles + ':' + !!images.pixel_farm + ':' + !!images.pixel_industry;
      if (key !== signature || !cache) { cache = rebuild(stage, h, gy); signature = key; }
      const world = frame.world || 0, reduced = !!frame.reduced, t = (frame.time || 0) / 1000;
      ctx.save(); ctx.imageSmoothingEnabled = false;
      // One framed panorama avoids mirrored landmarks, doubled suns and a visible sky seam.
      // The road/props loop independently; distant camera travel is deliberately bounded.
      const scenicWidth = Math.max(768, frame.width * 1.18), travel = scenicWidth - frame.width;
      const scenicX = reduced ? 0 : -(1 - Math.cos(world * .075 / Math.max(1, travel))) * travel / 2;
      ctx.drawImage(cache.panorama.canvas, scenicX, 0, scenicWidth, h);
      repeat(ctx, cache.props.canvas, frame.width, reduced ? 0 : world * .38, 0);
      // Clock-driven ambient motes and steam freeze with the campaign.
      if (!reduced) {
        const steam = stage === 1 || stage === 2;
        ctx.fillStyle = steam ? '#f3e8d0' : '#efdba7';
        for (let i = 0; i < 9; i++) {
          const x = ((i * 163 + t * (steam ? 6 : 13)) % (frame.width + 30)) - 15;
          const y = steam ? 190 - ((t * 12 + i * 29) % 130) : 160 + Math.sin(t * .8 + i) * 35;
          ctx.globalAlpha = steam ? .18 : .4;
          ctx.fillRect(Math.round(x), Math.round(y), steam ? 12 : 3, steam ? 6 : 3);
        }
        if (stage === 2 && images.pixel_industry) {
          const x = 660 - (world * .38 % 900);
          ctx.save(); ctx.globalAlpha = .65; ctx.translate(Math.round(x), gy - 94); ctx.rotate(t * .8);
          ctx.drawImage(images.pixel_industry, 3 * 18, 6 * 18, 18, 18, -27, -27, 54, 54); ctx.restore();
        }
        if (stage === 4) {
          const x = 650 - (world * .38 % 900), y = gy - 110;
          ctx.save(); ctx.globalAlpha = .75; ctx.fillStyle = '#ede3c7'; ctx.fillRect(Math.round(x) - 3, y, 6, 110);
          ctx.translate(Math.round(x), y); ctx.rotate(t * .6);
          for (let blade = 0; blade < 3; blade++) { ctx.fillRect(-2, -4, 4, 38); ctx.rotate(Math.PI * 2 / 3); }
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1; repeat(ctx, cache.ground.canvas, frame.width, world, gy); ctx.restore();
    }
    return { draw, invalidate() { cache = null; signature = ''; } };
  }
  global.MACH_GAME_BACKGROUND = { create, palettes };
})(window);
