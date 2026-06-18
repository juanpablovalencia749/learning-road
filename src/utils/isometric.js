export const TILE_W = 100
export const TILE_H = 65
export const HALF_W = TILE_W / 2
export const HALF_H = TILE_H / 2
export const MAP_COLS = 10
export const MAP_ROWS = 8
export const OFFSET_X = 375
export const OFFSET_Y = 0

export function tileToScreen(col, row) {
  return {
    x: (col - row) * HALF_W + OFFSET_X,
    y: (col + row) * HALF_H + OFFSET_Y,
  }
}

export function screenToTile(x, y) {
  const cx = x - OFFSET_X
  const cy = y - OFFSET_Y
  return {
    col: Math.round((cx / HALF_W + cy / HALF_H) / 2),
    row: Math.round((cy / HALF_H - cx / HALF_W) / 2),
  }
}

export function zOrder(col, row) {
  return col + row
}

export function isInBounds(col, row) {
  return col >= 0 && col < MAP_COLS && row >= 0 && row < MAP_ROWS
}

export function angleToFrame(angleDeg) {
  let a = ((angleDeg % 360) + 360) % 360
  return Math.round(a / 22.5) % 16
}
