(function (global) {
  'use strict';

  const PAPER = '#f3e8d0', INK = '#171512', RED = '#b51f2a';
  const palettes = [
    { sky: '#ead9b8', haze: '#d6bd8e', far: '#9f9a69', near: '#646d45', soil: '#806044', accent: '#bc8b43' },
    { sky: '#e2d2bb', haze: '#c3aa8e', far: '#956650', near: '#5f453d', soil: '#66483d', accent: '#a94a33' },
    { sky: '#d9d9d2', haze: '#b9c0bb', far: '#727d7c', near: '#3e4d52', soil: '#485357', accent: '#aa7c42' },
    { sky: '#d3d9d5', haze: '#aebcb9', far: '#687b7c', near: '#34494e', soil: '#3f5054', accent: '#a8783d' },
    { sky: '#eadfc5', haze: '#c8c6a5', far: '#83957b', near: '#536b5c', soil: '#6c6854', accent: '#bd8e45' },
  ];

  function defaultCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    return canvas;
  }

  function layer(factory, width, height, alpha) {
    const canvas = factory(width, height);
    canvas.width = width; canvas.height = height;
    return { canvas, ctx: canvas.getContext('2d', { alpha }) };
  }

  function rect(ctx, x, y, width, height, color) {
    ctx.fillStyle = color; ctx.fillRect(x, y, width, height);
  }

  function line(ctx, x1, y1, x2, y2, color, width) {
    ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  function polygon(ctx, points, color) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath(); ctx.fill();
  }

  function circle(ctx, x, y, radius, color) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  }

  function windows(ctx, x, y, columns, rows, color, gapX, gapY) {
    for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) {
      rect(ctx, x + column * gapX, y + row * gapY, 7, 5, color);
    }
  }

  function paintBase(ctx, width, height, groundY, p) {
    rect(ctx, 0, 0, width, height, p.sky);
    rect(ctx, 0, 72, width, 116, p.haze);
    ctx.globalAlpha = .16;
    for (let x = 18; x < width; x += 67) for (let y = 20 + (x % 3) * 7; y < groundY - 30; y += 53) rect(ctx, x, y, 2, 2, INK);
    ctx.globalAlpha = 1;
    circle(ctx, width * .78, 82, 28, PAPER);
    rect(ctx, 0, groundY, width, height - groundY, stageFloor(p));
    for (let y = groundY + 25; y < height; y += 24) line(ctx, 0, y, width, y, INK + '12', 1);
    line(ctx, 0, groundY, width, groundY, RED, 3);
  }

  function stageFloor(p) { return p.soil === '#806044' ? '#d8c5a4' : p.sky === '#eadfc5' ? '#d8ceb3' : '#b8bbb3'; }

  function terraceFar(ctx, width, groundY, p) {
    polygon(ctx, [[0, 245], [120, 180], [250, 226], [390, 158], [540, 222], [700, 176], [width, 230], [width, groundY], [0, groundY]], p.far);
    for (let y = 238; y < groundY; y += 20) line(ctx, 0, y, width, y - 11, PAPER + '88', 3);
    for (let x = 48; x < width; x += 150) { rect(ctx, x, 192 + x % 37, 5, 70, INK + '55'); circle(ctx, x + 2, 185 + x % 37, 14, p.near); }
  }

  function villageNear(ctx, width, groundY, p) {
    for (let x = 58; x < width; x += 205) {
      rect(ctx, x, groundY - 68, 74, 68, PAPER); polygon(ctx, [[x - 8, groundY - 68], [x + 37, groundY - 103], [x + 82, groundY - 68]], p.soil);
      rect(ctx, x + 29, groundY - 37, 17, 37, p.near); rect(ctx, x + 9, groundY - 48, 12, 14, p.accent);
    }
    for (let x = 0; x < width; x += 42) { line(ctx, x, groundY - 7, x + 18, groundY - 18, p.near, 2); line(ctx, x + 18, groundY - 18, x + 35, groundY - 7, p.near, 2); }
  }

  function millFar(ctx, width, groundY, p) {
    for (let x = 18; x < width; x += 270) {
      rect(ctx, x, groundY - 115, 222, 115, p.far);
      for (let roof = 0; roof < 4; roof += 1) polygon(ctx, [[x + roof * 56, groundY - 115], [x + roof * 56 + 29, groundY - 148], [x + roof * 56 + 56, groundY - 115]], p.near);
      rect(ctx, x + 18, groundY - 190, 20, 75, p.near); rect(ctx, x + 175, groundY - 168, 16, 53, p.near);
    }
  }

  function millNear(ctx, width, groundY, p) {
    for (let x = 42; x < width; x += 240) {
      rect(ctx, x, groundY - 78, 172, 78, p.near); windows(ctx, x + 16, groundY - 59, 5, 3, p.haze, 29, 18);
      for (let y = groundY - 70; y < groundY; y += 16) line(ctx, x, y, x + 172, y, p.accent + '88', 1);
      for (let bx = x + 24; bx < x + 172; bx += 38) line(ctx, bx, groundY - 78, bx, groundY, p.accent + '66', 1);
    }
  }

  function plantFar(ctx, width, groundY, p) {
    for (let x = 35; x < width; x += 260) {
      rect(ctx, x, groundY - 130, 205, 130, p.far); rect(ctx, x + 28, groundY - 169, 78, 39, p.near); rect(ctx, x + 142, groundY - 184, 24, 54, p.near);
      windows(ctx, x + 18, groundY - 105, 6, 4, p.haze, 29, 20);
    }
    line(ctx, 0, groundY - 198, width, groundY - 198, p.near, 5);
  }

  function plantNear(ctx, width, groundY, p) {
    for (let x = 0; x < width; x += 190) {
      rect(ctx, x, groundY - 45, 150, 14, p.accent); circle(ctx, x + 24, groundY - 22, 10, p.near); circle(ctx, x + 124, groundY - 22, 10, p.near);
      rect(ctx, x + 58, groundY - 94, 38, 49, p.near); rect(ctx, x + 68, groundY - 111, 18, 17, RED);
    }
    for (let x = 12; x < width; x += 64) rect(ctx, x, groundY - 6, 24, 3, PAPER + '99');
  }

  function cityFar(ctx, width, groundY, p) {
    const heights = [142, 207, 166, 238, 184];
    for (let x = 22, i = 0; x < width; x += 118, i += 1) {
      const height = heights[i % heights.length]; rect(ctx, x, groundY - height, 82, height, i % 2 ? p.far : p.near);
      windows(ctx, x + 13, groundY - height + 20, 3, Math.max(3, Math.floor(height / 30) - 1), p.haze, 23, 25);
    }
  }

  function cityNear(ctx, width, groundY, p) {
    line(ctx, 0, groundY - 88, width, groundY - 88, p.accent, 4);
    for (let x = 45; x < width; x += 148) {
      circle(ctx, x, groundY - 88, 8, RED); line(ctx, x, groundY - 88, x + 74, groundY - 134, p.near, 2); circle(ctx, x + 74, groundY - 134, 6, p.accent);
      rect(ctx, x - 3, groundY - 80, 6, 80, p.near);
    }
    for (let x = 14; x < width; x += 58) rect(ctx, x, groundY - 6, 21, 3, PAPER + '99');
  }

  function renewableFar(ctx, width, groundY, p) {
    polygon(ctx, [[0, 275], [170, 205], [330, 265], [510, 185], [700, 262], [width, 214], [width, groundY], [0, groundY]], p.far);
    for (let x = 105; x < width; x += 310) {
      line(ctx, x, groundY - 18, x, groundY - 188, p.near, 5); circle(ctx, x, groundY - 188, 7, p.accent);
      line(ctx, x, groundY - 188, x - 48, groundY - 214, p.near, 4); line(ctx, x, groundY - 188, x + 50, groundY - 207, p.near, 4); line(ctx, x, groundY - 188, x - 3, groundY - 135, p.near, 4);
    }
  }

  function renewableNear(ctx, width, groundY, p) {
    for (let x = 35; x < width; x += 180) {
      polygon(ctx, [[x, groundY - 56], [x + 112, groundY - 56], [x + 95, groundY - 5], [x - 16, groundY - 5]], p.near);
      for (let gx = x + 9; gx < x + 100; gx += 23) line(ctx, gx, groundY - 53, gx - 13, groundY - 8, p.haze, 1);
      line(ctx, x - 7, groundY - 30, x + 104, groundY - 30, p.haze, 1);
    }
    for (let x = 6; x < width; x += 61) rect(ctx, x, groundY - 6, 23, 3, PAPER + 'aa');
  }

  function paintScenery(stage, far, near, width, groundY, p) {
    if (stage === 0) { terraceFar(far, width, groundY, p); villageNear(near, width, groundY, p); }
    else if (stage === 1) { millFar(far, width, groundY, p); millNear(near, width, groundY, p); }
    else if (stage === 2) { plantFar(far, width, groundY, p); plantNear(near, width, groundY, p); }
    else if (stage === 3) { cityFar(far, width, groundY, p); cityNear(near, width, groundY, p); }
    else { renewableFar(far, width, groundY, p); renewableNear(near, width, groundY, p); }
    line(far, 0, 248, width, 248, RED + 'aa', 2);
  }

  function create(canvasFactory) {
    const factory = canvasFactory || defaultCanvas;
    let cache = null;

    function build(stage, width, height, groundY) {
      const screenWidth = Math.min(1600, Math.max(1, Math.ceil(width)));
      const tileWidth = Math.min(1600, Math.max(768, Math.ceil(width / 256) * 256));
      const sky = layer(factory, screenWidth, height, false), far = layer(factory, tileWidth, groundY, true), near = layer(factory, tileWidth, groundY, true);
      const p = palettes[stage] || palettes[0];
      paintBase(sky.ctx, screenWidth, height, groundY, p); paintScenery(stage, far.ctx, near.ctx, tileWidth, groundY, p);
      cache = { stage, width, height, groundY, tileWidth, sky: sky.canvas, far: far.canvas, near: near.canvas };
    }

    function tile(ctx, image, width, offset) {
      let x = -((offset % width) + width) % width;
      for (; x < cache.width; x += width) ctx.drawImage(image, x, 0);
    }

    return {
      draw(ctx, options) {
        const stage = Math.max(0, Math.min(4, options.stage | 0)), width = Math.max(1, options.width | 0), height = options.height || 430, groundY = options.groundY || 333;
        if (!cache || cache.stage !== stage || cache.width !== width || cache.height !== height || cache.groundY !== groundY) build(stage, width, height, groundY);
        ctx.save(); ctx.drawImage(cache.sky, 0, 0, width, height);
        const world = options.reduced ? 0 : Number(options.world) || 0;
        tile(ctx, cache.far, cache.tileWidth, world * .08); tile(ctx, cache.near, cache.tileWidth, world * .22);
        ctx.restore();
      },
      invalidate() { cache = null; },
    };
  }

  global.MACH_GAME_BACKGROUND = { create };
})(window);
