const TILE_W = 100
const TILE_H = 65
const COLS = 10
const ROWS = 8

function tile(col, row, sprite, type = 'grass', options = {}) {
  return { col, row, sprite, type, elevation: type === 'terrain' ? 1 : 0, ...options }
}

// Road tiles — zigzag path top to bottom
// Naming: roadNS = connects North↔South of diamond (NW-SE on screen = horizontal in grid)
//         roadEW = connects East↔West of diamond (NE-SW on screen = vertical in grid)
//         roadNE/NW/ES/SW = corner pieces connecting two adjacent edges
const roadTiles = [
  // Row 1 (top, col 3→7): rightward (horizontal = NS sprite)
  tile(3, 1, 'tiles/road/endS.png', 'road'),
  tile(4, 1, 'tiles/road/roadNS.png', 'road'),
  tile(5, 1, 'tiles/road/roadNS.png', 'road'),
  tile(6, 1, 'tiles/road/roadNS.png', 'road'),
  tile(7, 1, 'tiles/road/roadNW.png', 'road'),  // corner W→S (left)

  // Col 7 (vertical segment): downward (vertical = EW sprite)
  tile(7, 2, 'tiles/road/roadEW.png', 'road'),
  tile(7, 3, 'tiles/road/roadNE.png', 'road'),  // corner N→W (top)

  // Row 3 (middle, col 7→3): leftward (horizontal = NS sprite)
  tile(6, 3, 'tiles/road/roadNS.png', 'road'),
  tile(5, 3, 'tiles/road/roadNS.png', 'road'),
  tile(4, 3, 'tiles/road/roadNS.png', 'road'),
  tile(3, 3, 'tiles/road/roadSW.png', 'road'),  // corner E→S (bottom)

  // Col 3 (vertical segment): downward (vertical = EW sprite)
  tile(3, 4, 'tiles/road/roadEW.png', 'road'),
  tile(3, 5, 'tiles/road/roadES.png', 'road'),  // corner N→E (right)

  // Row 5 (bottom, col 3→7): rightward (horizontal = NS sprite)
  tile(4, 5, 'tiles/road/roadNS.png', 'road'),
  tile(5, 5, 'tiles/road/roadNS.png', 'road'),
  tile(6, 5, 'tiles/road/roadNS.png', 'road'),
  tile(7, 5, 'tiles/road/roadNS.png', 'road'),
]

// Logical terrain layers. Sprites are resolved in Map.js from neighbours so internal
// borders are not drawn between tiles that belong to the same surface.
export const terrainHeightMap = [
  [1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
]

export const waterCells = [
  [0, 6], [0, 7], [1, 7],
]

export const riverCells = []

export const beachCells = []

const bridgeFeatures = []

// Buildings at strategic spots
const buildings = [
  tile(0, 0, 'buildings/buildingTiles_003.png', 'building'),
  tile(8, 0, 'buildings/buildingTiles_004.png', 'building'),
  tile(2, 2, 'buildings/buildingTiles_012.png', 'building'),
  tile(8, 2, 'buildings/buildingTiles_018.png', 'building'),
  tile(0, 4, 'buildings/buildingTiles_025.png', 'building'),
  tile(8, 4, 'buildings/buildingTiles_030.png', 'building'),
  tile(2, 5, 'buildings/buildingTiles_042.png', 'building'),
  tile(8, 5, 'buildings/buildingTiles_055.png', 'building'),
]

// Trees scattered naturally
const trees = [
  tile(1, 0, 'tiles/trees/treeTall.png', 'tree'),
  tile(4, 0, 'tiles/trees/treeShort.png', 'tree'),
  tile(6, 0, 'tiles/trees/coniferTall.png', 'tree'),
  tile(0, 1, 'tiles/trees/treeTall.png', 'tree'),
  tile(8, 1, 'tiles/trees/coniferShort.png', 'tree'),
  tile(9, 1, 'tiles/trees/treeAltTall.png', 'tree'),
  tile(9, 2, 'tiles/trees/treeTall.png', 'tree'),
  tile(0, 3, 'tiles/trees/treeShort.png', 'tree'),
  tile(8, 3, 'tiles/trees/coniferShort.png', 'tree'),
  tile(9, 3, 'tiles/trees/treeAltTall.png', 'tree'),
  tile(1, 4, 'tiles/trees/treeTall.png', 'tree'),
  tile(9, 4, 'tiles/trees/coniferTall.png', 'tree'),
  tile(4, 6, 'tiles/trees/coniferShort.png', 'tree'),
  tile(8, 6, 'tiles/trees/treeAltTall.png', 'tree'),
  tile(3, 6, 'tiles/trees/treeAltShort.png', 'tree'),
  tile(6, 6, 'tiles/trees/coniferAltShort.png', 'tree'),
  tile(9, 6, 'tiles/trees/coniferAltTall.png', 'tree'),
]

export const GRASS_COLOR = '#84ac46'

// Terrain variation details on empty grass tiles
// Each: { col, row, type, radius, opacity }
// type: 'light' | 'dark' | 'dirt' | 'rock'
export const terrainDetails = [
  // Brighter grass patches
  { col: 0, row: 2, type: 'light', radius: 28, opacity: 0.12 },
  { col: 2, row: 0, type: 'light', radius: 25, opacity: 0.1 },
  { col: 3, row: 0, type: 'light', radius: 30, opacity: 0.08 },
  { col: 2, row: 4, type: 'light', radius: 22, opacity: 0.12 },
  { col: 5, row: 4, type: 'light', radius: 26, opacity: 0.1 },
  { col: 7, row: 0, type: 'light', radius: 24, opacity: 0.1 },
  { col: 7, row: 6, type: 'light', radius: 28, opacity: 0.1 },
  // Darker grass patches
  { col: 1, row: 3, type: 'dark', radius: 24, opacity: 0.1 },
  { col: 3, row: 2, type: 'dark', radius: 20, opacity: 0.12 },
  { col: 4, row: 2, type: 'dark', radius: 26, opacity: 0.08 },
  { col: 6, row: 4, type: 'dark', radius: 22, opacity: 0.1 },
  { col: 9, row: 5, type: 'dark', radius: 25, opacity: 0.08 },
  // Dirt spots
  { col: 2, row: 1, type: 'dirt', radius: 8, opacity: 0.25 },
  { col: 5, row: 6, type: 'dirt', radius: 10, opacity: 0.2 },
  { col: 6, row: 2, type: 'dirt', radius: 7, opacity: 0.3 },
  { col: 7, row: 4, type: 'dirt', radius: 9, opacity: 0.2 },
  { col: 9, row: 0, type: 'dirt', radius: 8, opacity: 0.25 },
  // Small rocks
  { col: 1, row: 1, type: 'rock', radius: 4, opacity: 0.35 },
  { col: 5, row: 0, type: 'rock', radius: 5, opacity: 0.3 },
  { col: 3, row: 7, type: 'rock', radius: 4, opacity: 0.4 },
  { col: 8, row: 7, type: 'rock', radius: 5, opacity: 0.35 },
]

// Tiny decorative details scattered on grass tiles
// Each: { col, row, type, size, opacity }
// type: 'tuft' | 'pebble' | 'flower' | 'leaf'
export const groundClutter = [
  // Grass tufts
  { col: 0, row: 2, type: 'tuft', size: 5, opacity: 0.3 },
  { col: 0, row: 5, type: 'tuft', size: 4, opacity: 0.25 },
  { col: 2, row: 4, type: 'tuft', size: 6, opacity: 0.2 },
  { col: 3, row: 6, type: 'tuft', size: 4, opacity: 0.3 },
  { col: 5, row: 2, type: 'tuft', size: 5, opacity: 0.25 },
  { col: 6, row: 4, type: 'tuft', size: 4, opacity: 0.3 },
  { col: 8, row: 7, type: 'tuft', size: 5, opacity: 0.25 },
  { col: 9, row: 6, type: 'tuft', size: 4, opacity: 0.3 },
  // Pebbles
  { col: 1, row: 5, type: 'pebble', size: 3, opacity: 0.35 },
  { col: 2, row: 6, type: 'pebble', size: 4, opacity: 0.3 },
  { col: 3, row: 0, type: 'pebble', size: 3, opacity: 0.4 },
  { col: 4, row: 4, type: 'pebble', size: 3, opacity: 0.35 },
  { col: 7, row: 6, type: 'pebble', size: 4, opacity: 0.3 },
  { col: 9, row: 0, type: 'pebble', size: 3, opacity: 0.35 },
  // Tiny flowers
  { col: 1, row: 2, type: 'flower', size: 3, opacity: 0.4 },
  { col: 3, row: 2, type: 'flower', size: 2, opacity: 0.5 },
  { col: 4, row: 2, type: 'flower', size: 3, opacity: 0.4 },
  { col: 5, row: 4, type: 'flower', size: 3, opacity: 0.45 },
  { col: 6, row: 6, type: 'flower', size: 2, opacity: 0.5 },
  { col: 7, row: 2, type: 'flower', size: 3, opacity: 0.4 },
  { col: 9, row: 5, type: 'flower', size: 2, opacity: 0.5 },
  // Fallen leaves
  { col: 0, row: 5, type: 'leaf', size: 4, opacity: 0.2 },
  { col: 2, row: 3, type: 'leaf', size: 5, opacity: 0.15 },
  { col: 5, row: 0, type: 'leaf', size: 4, opacity: 0.2 },
  { col: 5, row: 6, type: 'leaf', size: 3, opacity: 0.25 },
  { col: 6, row: 2, type: 'leaf', size: 4, opacity: 0.2 },
  { col: 7, row: 0, type: 'leaf', size: 5, opacity: 0.15 },
  { col: 9, row: 7, type: 'leaf', size: 4, opacity: 0.2 },
]

export const decorations = [
  ...roadTiles,
  ...bridgeFeatures,
  ...buildings,
  ...trees,
]

export function getSpritePaths() {
  const paths = new Set()
  paths.add('tiles/terrain/grassWhole.png')
  paths.add('tiles/terrain/grass.png')
  ;[
    'tiles/terrain/hillE.png',
    'tiles/terrain/hillN.png',
    'tiles/terrain/hillS.png',
    'tiles/terrain/hillNE.png',
    'tiles/terrain/hillNW.png',
    'tiles/terrain/hillES.png',
    'tiles/terrain/hillSW.png',
    'tiles/water/water.png',
    'tiles/water/waterN.png',
    'tiles/water/waterS.png',
    'tiles/water/waterE.png',
    'tiles/water/waterW.png',
    'tiles/water/waterNE.png',
    'tiles/water/waterNW.png',
    'tiles/water/waterES.png',
    'tiles/water/waterSW.png',
    // 'tiles/beach/beachS.png',
    'tiles/beach/beachW.png',
    'tiles/beach/beachSW.png',
    'tiles/river/riverNS.png',
    'tiles/river/riverSW.png',
  ].forEach(path => paths.add(path))
  decorations.forEach(d => paths.add(d.sprite))
  return [...paths]
}

export { COLS, ROWS, TILE_W, TILE_H }
