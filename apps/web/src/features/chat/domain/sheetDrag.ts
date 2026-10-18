export type SheetRelease = 'close' | 'stay'

export interface SheetDrag {
  readonly offset: number
  readonly height: number
  readonly velocity: number
}

const CLOSE_SHARE = 1 / 3
const FLICK_SPEED = 0.5
const FLICK_DISTANCE = 24

export const SHEET_TAP_SLOP = 6

export const sheetOffsetOf = (startY: number, currentY: number): number => Math.max(0, currentY - startY)

export const sheetReleaseOf = ({ offset, height, velocity }: SheetDrag): SheetRelease => {
  const distance = Math.max(0, offset)
  if (distance > height * CLOSE_SHARE) return 'close'
  return velocity >= FLICK_SPEED && distance >= FLICK_DISTANCE ? 'close' : 'stay'
}
