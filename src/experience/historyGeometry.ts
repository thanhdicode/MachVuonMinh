export const historyStep = 72
export function historyProgressForTravel(travel: number, distance: number) {
  const fraction = Math.max(0, Math.min(1, travel / distance))
  return fraction
}

export function worldScroll(y: number, base: number, start: number, length: number) {
  const position = y < start ? y : y < start + length ? start - .001 : y - length
  return Math.max(0, Math.min(1, position / base))
}

export function documentScroll(progress: number, base: number, start: number, length: number) {
  const position = progress * base
  return position < start ? position : position + length
}

export function lensGeometry(rect: {left: number; top: number; width: number; height: number}, naturalWidth: number, naturalHeight: number, x: number, y: number, alignX = .5, alignY = .5) {
  const scale = Math.min(rect.width / naturalWidth, rect.height / naturalHeight)
  const width = naturalWidth * scale, height = naturalHeight * scale
  const left = rect.left + (rect.width - width) * alignX, top = rect.top + (rect.height - height) * alignY
  return {width: width * 2.15, height: height * 2.15, x: 95 - (x - left) * 2.15, y: 95 - (y - top) * 2.15}
}
