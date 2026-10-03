import { historyProgressForTravel } from '../experience/historyGeometry.ts'

export const populatedSlotsChanged = (before: string, slots: readonly (number | null)[]): boolean => slots.some((slot) => slot !== null) && JSON.stringify(slots) !== before

export const openedDuringObservation = (wasOpen: boolean, isOpen: boolean): boolean => !wasOpen && isOpen

export type GuidePosition = { scrollY: number; era: number | null; insideAtlas: boolean; atlasProgress: number | null; wide: boolean }

export function captureGuidePosition(scrollY: number, era: number | null, insideAtlas: boolean, atlasStart: number, atlasDistance: number, wide: boolean): GuidePosition {
  return { scrollY, era, insideAtlas, atlasProgress: insideAtlas ? historyProgressForTravel(scrollY - atlasStart, atlasDistance) : null, wide }
}

export function restoredGuideScrollY(position: GuidePosition, atlasStart: number | null, atlasDistance: number | null, wide: boolean): number | null {
  if (!position.insideAtlas) return position.scrollY
  if (position.wide !== wide || position.atlasProgress === null || atlasStart === null || atlasDistance === null) return null
  return atlasStart + position.atlasProgress * atlasDistance
}
