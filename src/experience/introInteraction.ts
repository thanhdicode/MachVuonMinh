type Point = { x: number; y: number }
type Bounds = { left: number; top: number; width: number; height: number }

// Test the whole pointer segment so a quick drag cannot skip the opening.
export function crossesEyelet(from: Point, to: Point, bounds: Bounds): boolean {
  if (bounds.width <= 0 || bounds.height <= 0) return false
  const rx = bounds.width / 2, ry = bounds.height / 2
  const x = (from.x - bounds.left - rx) / rx
  const y = (from.y - bounds.top - ry) / ry
  const dx = (to.x - from.x) / rx, dy = (to.y - from.y) / ry
  const length = dx * dx + dy * dy
  const t = length ? Math.max(0, Math.min(1, -(x * dx + y * dy) / length)) : 0
  return (x + t * dx) ** 2 + (y + t * dy) ** 2 <= 1
}
