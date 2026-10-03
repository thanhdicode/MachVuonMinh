(function (global) {
  'use strict';
  // Presentation time is supplied by the campaign. There is no second loop or physics state.
  function frameAt(time, count, fps) {
    return Math.floor(Math.max(0, Number(time) || 0) * (fps || 20) / 1000) % Math.max(1, count | 0);
  }
  function drawFrame(ctx, image, sheet, time, fps, centerX, footY, width, height) {
    if (!image || !sheet) return false;
    const frame = frameAt(time, sheet.frames, fps);
    const crop = sheet.crop || { x: 0, y: 0, width: sheet.frameWidth, height: sheet.frameHeight };
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, frame * sheet.frameWidth + crop.x, crop.y, crop.width, crop.height,
      Math.round(centerX - width / 2), Math.round(footY - height), width, height);
    ctx.restore(); return true;
  }
  function tile(ctx, image, column, row, x, y, width, height, size) {
    if (!image) return false;
    const step = size || 18;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, column * step, row * step, step, step, Math.round(x), Math.round(y), width, height);
    return true;
  }
  global.MACH_RUNNER_PRESENTATION = { frameAt, drawFrame, tile };
})(window);
