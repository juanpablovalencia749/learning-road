import { eventBus } from '../core/EventBus.js'
import { store } from '../core/Store.js'
import { stations } from '../data/stations.js'
import { car } from './Car.js'
import Station from './Station.js'
import { computeCubicControlPoints, cubicBezier } from '../utils/bezier.js'
import { decorations, COLS, ROWS, terrainDetails, groundClutter, terrainHeightMap, waterCells, riverCells, beachCells } from '../data/tileMap.js'
import { tileToScreen, zOrder, TILE_W, TILE_H } from '../utils/isometric.js'

// Override station coordinates dynamically from col/row
stations.forEach(s => {
  const pos = tileToScreen(s.col, s.row)
  s.x = pos.x
  s.y = pos.y
})

const tileUrlMap = import.meta.glob('../assets/**/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})

const urlLookup = {}
for (const [key, url] of Object.entries(tileUrlMap)) {
  const relativePath = key.replace('../assets/', '')
  urlLookup[relativePath] = url
}

function resolveTileUrl(path) {
  return urlLookup[path] || path
}

// -- Neighbour-aware sprite resolution --

function cellHeight(col, row) {
  return terrainHeightMap[row]?.[col] ?? 0
}

function isWater(col, row) {
  return waterCells.some(([c, r]) => c === col && r === row)
}

function isRiver(col, row) {
  return riverCells.some(([c, r]) => c === col && r === row)
}

function isBeach(col, row) {
  return beachCells.some(([c, r]) => c === col && r === row)
}

function isWaterOrRiver(col, row) {
  return isWater(col, row) || isRiver(col, row)
}

function getTerrainReliefSprite(col, row) {
  const h = cellHeight(col, row)
  if (!h) return null

  const dirs = []
  if (row > 0 && cellHeight(col, row - 1) < h) dirs.push('N')
  if (row < ROWS - 1 && cellHeight(col, row + 1) < h) dirs.push('S')
  if (col < COLS - 1 && cellHeight(col + 1, row) < h) dirs.push('E')
  if (col > 0 && cellHeight(col - 1, row) < h) dirs.push('W')

  if (dirs.length === 0) return null
  if (dirs.length === 1) {
    if (dirs[0] === 'W') return null
    return `tiles/terrain/hill${dirs[0]}.png`
  }

  if (dirs.length === 2) {
    if (dirs.includes('N') && dirs.includes('E')) return 'tiles/terrain/hillNE.png'
    if (dirs.includes('N') && dirs.includes('W')) return 'tiles/terrain/hillNW.png'
    if (dirs.includes('S') && dirs.includes('E')) return 'tiles/terrain/hillES.png'
    if (dirs.includes('S') && dirs.includes('W')) return 'tiles/terrain/hillSW.png'
    return 'tiles/terrain/hillN.png'
  }

  return 'tiles/terrain/lotNE.png'
}

function getWaterSprite(col, row) {
  if (!isWater(col, row)) return null

  const n = isWaterOrRiver(col, row - 1)
  const s = isWaterOrRiver(col, row + 1)
  const e = isWaterOrRiver(col + 1, row)
  const w = isWaterOrRiver(col - 1, row)

  const waterCount = [n, s, e, w].filter(Boolean).length
  if (waterCount === 4) return 'tiles/water/water.png'

  const land = []
  if (row > 0 && !isWaterOrRiver(col, row - 1)) land.push('N')
  if (row < ROWS - 1 && !isWaterOrRiver(col, row + 1)) land.push('S')
  if (col < COLS - 1 && !isWaterOrRiver(col + 1, row)) land.push('E')
  if (col > 0 && !isWaterOrRiver(col - 1, row)) land.push('W')

  if (land.length === 0) return 'tiles/water/water.png'

  if (land.length === 1) {
    const r90 = { N: 'E', S: 'W', E: 'S', W: 'N' }
    return `tiles/water/water${r90[land[0]]}.png`
  }

  if (land.length === 2) {
    if (land.includes('N') && land.includes('E')) return 'tiles/water/waterES.png'
    if (land.includes('N') && land.includes('W')) return 'tiles/water/waterNE.png'
    if (land.includes('E') && land.includes('S')) return 'tiles/water/waterSW.png'
    if (land.includes('S') && land.includes('W')) return 'tiles/water/waterNW.png'
    return 'tiles/water/water.png'
  }

  return 'tiles/water/water.png'
}

function getRiverSprite(col, row) {
  if (!isRiver(col, row)) return null

  const nRiver = row > 0 && isRiver(col, row - 1)
  const sRiver = row < ROWS - 1 && isRiver(col, row + 1)
  const sWater = row < ROWS - 1 && isWater(col, row + 1)
  const wWater = col > 0 && isWater(col - 1, row)

  if (nRiver && sWater && wWater) return 'tiles/river/riverSW.png'
  if (nRiver && (sRiver || sWater)) return 'tiles/river/riverNS.png'

  return 'tiles/river/riverNS.png'
}

function getBeachSprite(col, row) {
  if (!isBeach(col, row)) return null

  const waterDirs = []
  if (row > 0 && isWaterOrRiver(col, row - 1)) waterDirs.push('N')
  if (row < ROWS - 1 && isWaterOrRiver(col, row + 1)) waterDirs.push('S')
  if (col < COLS - 1 && isWaterOrRiver(col + 1, row)) waterDirs.push('E')
  if (col > 0 && isWaterOrRiver(col - 1, row)) waterDirs.push('W')

  if (waterDirs.length === 0) return null
  if (waterDirs.length === 1) return `tiles/beach/beach${waterDirs[0]}.png`

  if (waterDirs.length === 2) {
    const sorted = waterDirs.slice().sort()
    const key = sorted[0] + sorted[1]
    const map = { EN: 'NE', NE: 'NE', NW: 'NW', WN: 'NW', ES: 'ES', SE: 'ES', SW: 'SW', WS: 'SW' }
    return `tiles/beach/beach${map[key] || 'S'}.png`
  }

  return 'tiles/beach/beachS.png'
}

function getTerrainSpriteHeight(sprite) {
  const name = sprite.split('/').pop().replace('.png', '')
  if (name === 'hillS' || name === 'hillSW') return 80
  if (name === 'slopeE' || name === 'slopeN') return 58
  return 65
}

function getFlatTileHeight(sprite) {
  const short = ['water.png','waterS.png','waterW.png','waterNW.png','waterSW.png',
                 'beachS.png','beachW.png','beachNE.png']
  return short.includes(sprite?.split('/').pop()) ? 58 : 65
}

const WALL_H = 48

function addEdgeWallSegments(svg, col, row, pos, hw, hh, gradientId = 'wall-grad') {
  const isLeft = col === 0
  const isRight = col === COLS - 1
  const isTop = row === 0
  const isBottom = row === ROWS - 1
  if (!isLeft && !isRight && !isTop && !isBottom) return

  const wallDefs = []

  if (isLeft || isTop) {
    wallDefs.push([
      [-hw, 0], [0, -hh],
      [0, -hh + WALL_H], [-hw, WALL_H],
    ])
  }
  if (isRight || isTop) {
    wallDefs.push([
      [0, -hh], [hw, 0],
      [hw, WALL_H], [0, -hh + WALL_H],
    ])
  }
  if (isRight || isBottom) {
    wallDefs.push([
      [hw, 0], [0, hh],
      [0, hh + WALL_H], [hw, WALL_H],
    ])
  }
  if (isLeft || isBottom) {
    wallDefs.push([
      [0, hh], [-hw, 0],
      [-hw, WALL_H], [0, hh + WALL_H],
    ])
  }

  const seen = new Set()
  wallDefs.forEach(pts => {
    const key = pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('|')
    if (seen.has(key)) return
    seen.add(key)

    const poly = createSvgElement('polygon')
    const points = pts.map(p => `${(pos.x + p[0]).toFixed(1)},${(pos.y + p[1]).toFixed(1)}`).join(' ')
    poly.setAttribute('points', points)
    poly.setAttribute('fill', `url(#${gradientId})`)
    poly.setAttribute('stroke', '#3a6a1e')
    poly.setAttribute('stroke-width', '1')
    svg.appendChild(poly)
  })
}

const overlayTypes = new Set(['road', 'bridge'])
const objectTypes = new Set(['building', 'tree', 'conifer'])

function createSvgElement(name) {
  return document.createElementNS('http://www.w3.org/2000/svg', name)
}

class MapView {
  constructor() {
    this.element = document.createElement('div')
    this.element.className = 'map-container'
    this.stationComponents = []
    this.boundHandler = this.handleStationClick.bind(this)
    this.arrivalCleanup = null
  }

  render() {
    this.element.innerHTML = ''
    store.set('totalStations', stations.length)

    const bg = document.createElement('div')
    bg.className = 'map-background'
    this.element.appendChild(bg)

    const completed = store.get('completedStations') || []

    const lighting = document.createElement('div')
    lighting.className = 'lighting-overlay'
    const pct = stations.length > 0 ? completed.length / stations.length : 0
    lighting.style.background = `linear-gradient(135deg,
      rgba(59,130,246,${0.08 - pct * 0.05}),
      rgba(245,158,11,${pct * 0.1})
    )`
    this.element.appendChild(lighting)

    this.renderScenery(completed)
    this.renderPath(completed)
    this.renderStations()
    this.placeCar(completed)

    this.renderProgress(completed)

    this.unsubscribe = eventBus.on('store:changed', () => {
      this.stationComponents.forEach(s => s.render())
      this.updateStationBounce()
      const completedNow = store.get('completedStations') || []
      this.renderProgress(completedNow)
    })
  }

  renderScenery(completed) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('class', 'map-scenery')
    svg.setAttribute('viewBox', '0 0 800 500')
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    svg.style.transform = 'translateX(0px)'

    const hw = TILE_W / 2
    const hh = TILE_H / 2

    // --- defs: clip path, filters, gradients ---
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    defs.innerHTML = `
      <clipPath id="iso-clip">
        <polygon points="0,${-hh - 0.5} ${hw + 0.5},0 0,${hh + 0.5} ${-hw - 0.5},0"/>
      </clipPath>
      <filter id="grass-noise" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="4" result="noise"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.28 0 0 0 0 0.32 0 0 0 0 0.18 0 0 0 0.14 0" in="noise"/>
      </filter>
      <filter id="grass-noise-fine" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" result="noise"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.35 0 0 0 0 0.38 0 0 0 0 0.25 0 0 0 0.10 0" in="noise"/>
      </filter>
      <linearGradient id="sunlight" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.03)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.04)"/>
      </linearGradient>
      <radialGradient id="contact-shadow">
        <stop offset="0%" stop-color="rgba(0,0,0,0.55)"/>
        <stop offset="45%" stop-color="rgba(0,0,0,0.1)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
      </radialGradient>
      <radialGradient id="ambient-shadow">
          <stop offset="0%" stop-color="rgba(0,0,0,0.07)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
        </radialGradient>
      <linearGradient id="wall-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#4a7a28"/>
        <stop offset="25%" stop-color="#7a623f"/>
        <stop offset="100%" stop-color="#3a2510"/>
      </linearGradient>

    `
    svg.appendChild(defs)

    const decosByTile = {}
    decorations.forEach(d => {
      const key = `${d.col},${d.row}`
      if (!decosByTile[key]) decosByTile[key] = []
      decosByTile[key].push(d)
    })

    const detailMap = {}
    terrainDetails.forEach(d => { detailMap[`${d.col},${d.row}`] = d })

    const clutterByTile = {}
    groundClutter.forEach(c => {
      const key = `${c.col},${c.row}`
      if (!clutterByTile[key]) clutterByTile[key] = []
      clutterByTile[key].push(c)
    })

    const tileList = []
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        const decoHeight = Math.max(0, ...(decosByTile[`${col},${row}`] || []).map(d => d.elevation || 0))
        const height = Math.max(decoHeight, terrainHeightMap[row]?.[col] || 0)
        tileList.push({ col, row, height })
      }
    }
    tileList.sort((a, b) => zOrder(a.col, a.row, a.height) - zOrder(b.col, b.row, b.height))

    // Broad organic noise overlay
    const noiseRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    noiseRect.setAttribute('x', '-100')
    noiseRect.setAttribute('y', '-60')
    noiseRect.setAttribute('width', '1100')
    noiseRect.setAttribute('height', '650')
    noiseRect.setAttribute('fill', '#000')
    noiseRect.setAttribute('filter', 'url(#grass-noise)')
    noiseRect.setAttribute('pointer-events', 'none')
    svg.appendChild(noiseRect)

    // Fine noise overlay for texture detail
    const fineNoise = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    fineNoise.setAttribute('x', '-100')
    fineNoise.setAttribute('y', '-60')
    fineNoise.setAttribute('width', '1100')
    fineNoise.setAttribute('height', '650')
    fineNoise.setAttribute('fill', '#000')
    fineNoise.setAttribute('filter', 'url(#grass-noise-fine)')
    fineNoise.setAttribute('pointer-events', 'none')
    svg.appendChild(fineNoise)

    // Directional sunlight
    const sunRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    sunRect.setAttribute('x', '-100')
    sunRect.setAttribute('y', '-60')
    sunRect.setAttribute('width', '1100')
    sunRect.setAttribute('height', '650')
    sunRect.setAttribute('fill', 'url(#sunlight)')
    sunRect.setAttribute('pointer-events', 'none')
    svg.appendChild(sunRect)

    // --- Layers 1-4: z-sorted per-tile rendering ---
    const flowerColors = ['#fdd835', '#f48fb1', '#ce93d8', '#ef5350']

    tileList.forEach(({ col, row }) => {
      const pos = tileToScreen(col, row)
      const tileDecos = decosByTile[`${col},${row}`] || []
      const objectLayers = tileDecos.filter(d => objectTypes.has(d.type))
      const detail = detailMap[`${col},${row}`]
      const clutterList = clutterByTile[`${col},${row}`]
      const hasRoad = tileDecos.some(d => d.type === 'road')
      const hasBridge = tileDecos.some(d => d.type === 'bridge')
      const terrainRelief = getTerrainReliefSprite(col, row)
      const waterSprite = getWaterSprite(col, row)
      const riverSprite = getRiverSprite(col, row)
      const beachSprite = getBeachSprite(col, row)
      const blockingOverlay = hasRoad || hasBridge || terrainRelief || waterSprite || riverSprite || beachSprite
      const canReceiveGrassDetails = !blockingOverlay

      const appendTileImage = (sprite, options = {}) => {
        const imgH = options.height || 65
        const g = createSvgElement('g')
        g.setAttribute('transform', `translate(${pos.x.toFixed(1)},${pos.y.toFixed(1)})`)

        const img = createSvgElement('image')
        img.setAttribute('href', resolveTileUrl(sprite))
        img.setAttribute('x', (-hw).toFixed(1))
        img.setAttribute('y', (-hh).toFixed(1))
        img.setAttribute('width', String(TILE_W))
        img.setAttribute('height', String(imgH))
        if (options.clip !== false) img.setAttribute('clip-path', 'url(#iso-clip)')
        g.appendChild(img)
        svg.appendChild(g)
      }

      addEdgeWallSegments(svg, col, row, pos, hw, hh, (waterSprite || riverSprite) ? 'wall-grad' : undefined)

      appendTileImage('tiles/terrain/grassWhole.png')

      if (terrainRelief) appendTileImage(terrainRelief, { clip: false, height: getTerrainSpriteHeight(terrainRelief) })
      if (beachSprite) appendTileImage(beachSprite, { height: getFlatTileHeight(beachSprite) })
      if (waterSprite) appendTileImage(waterSprite, { height: getFlatTileHeight(waterSprite) })
      if (riverSprite) appendTileImage(riverSprite)

      // Subtle grass variation patches for organic depth
      if (canReceiveGrassDetails) {
        const seed = col * 17 + row * 31
        const patchCount = 1 + (seed * 13 + 7) % 3
        for (let i = 0; i < patchCount; i++) {
          const angle = ((seed * (i + 1) * 37) % 360) * (Math.PI / 180)
          const dist = 6 + ((seed * (i + 2) * 53) % 20)
          const patchX = pos.x + Math.cos(angle) * dist
          const patchY = pos.y + Math.sin(angle) * dist
          const shade = ((seed * (i + 3) * 41) % 3)
          const fill = shade === 0 ? '#9ec763' : shade === 1 ? '#b5d97a' : '#7da84a'
          const el = createSvgElement('circle')
          el.setAttribute('cx', patchX.toFixed(1))
          el.setAttribute('cy', patchY.toFixed(1))
          el.setAttribute('r', String(10 + ((seed * (i + 4) * 29) % 14)))
          el.setAttribute('fill', fill)
          el.setAttribute('opacity', '0.08')
          svg.appendChild(el)
        }
      }

      // Ground clutter and terrain variations belong only on grass/terrain cells.
      if (canReceiveGrassDetails && clutterList) {
        clutterList.forEach(item => {
          const cx = pos.x + ((col * 13 + row * 7) % 11) - 5
          const cy = pos.y + ((col * 5 + row * 17) % 9) - 4
          let fillColor, el
          switch (item.type) {
            case 'tuft':
              fillColor = '#8bc34a'
              el = createSvgElement('circle')
              el.setAttribute('r', String(item.size))
              break
            case 'pebble':
              fillColor = '#9e9e9e'
              el = createSvgElement('circle')
              el.setAttribute('r', String(item.size))
              break
            case 'flower': {
              const fi = (col * 7 + row * 13) % flowerColors.length
              fillColor = flowerColors[fi]
              el = createSvgElement('circle')
              el.setAttribute('r', String(item.size))
              break
            }
            case 'leaf':
              fillColor = '#8d6e63'
              el = createSvgElement('ellipse')
              el.setAttribute('rx', String(item.size))
              el.setAttribute('ry', String(item.size * 0.5))
              el.setAttribute('transform', `rotate(${(col * 37 + row * 23) % 360}, ${cx.toFixed(1)}, ${cy.toFixed(1)})`)
              break
            default:
              fillColor = '#8bc34a'
              el = createSvgElement('circle')
              el.setAttribute('r', '3')
          }
          el.setAttribute('cx', cx.toFixed(1))
          el.setAttribute('cy', cy.toFixed(1))
          el.setAttribute('fill', fillColor)
          el.setAttribute('opacity', String(item.opacity))
          svg.appendChild(el)
        })
      }

      if (canReceiveGrassDetails && detail) {
        const dx = ((col * 7 + row * 13) % 9) - 4
        const dy = (((col * 11 + row * 5) % 7) - 3)
        let fillColor
        switch (detail.type) {
          case 'light': fillColor = '#9ec763'; break
          case 'dark': fillColor = '#5c8030'; break
          case 'dirt': fillColor = '#8b7355'; break
          case 'rock': fillColor = '#7a7a7a'; break
          default: fillColor = '#9ec763'
        }
        const el = createSvgElement('circle')
        el.setAttribute('cx', (pos.x + dx).toFixed(1))
        el.setAttribute('cy', (pos.y + dy).toFixed(1))
        el.setAttribute('r', String(detail.radius))
        el.setAttribute('fill', fillColor)
        el.setAttribute('opacity', String(detail.opacity))
        svg.appendChild(el)
      }

      if (hasRoad) {
        const dirtSpots = [
          { dx: hw * 0.50, dy: 0, r: 14 },
          { dx: -hw * 0.50, dy: 0, r: 14 },
          { dx: 0, dy: hh * 0.50, r: 12 },
          { dx: 0, dy: -hh * 0.50, r: 12 },
          { dx: hw * 0.30, dy: hh * 0.25, r: 9 },
          { dx: -hw * 0.30, dy: hh * 0.25, r: 9 },
          { dx: hw * 0.30, dy: -hh * 0.25, r: 9 },
          { dx: -hw * 0.30, dy: -hh * 0.25, r: 9 },
        ]
        dirtSpots.forEach(({ dx, dy, r }) => {
          const el = createSvgElement('circle')
          el.setAttribute('cx', (pos.x + dx).toFixed(1))
          el.setAttribute('cy', (pos.y + dy).toFixed(1))
          el.setAttribute('r', String(r))
          el.setAttribute('fill', '#7a623f')
          el.setAttribute('opacity', '0.18')
          svg.appendChild(el)
        })
      }

      if (waterSprite || riverSprite) {
        const edgeWet = [
          { dx: hw * 0.52, dy: 0, r: 13 },
          { dx: -hw * 0.52, dy: 0, r: 13 },
          { dx: 0, dy: hh * 0.52, r: 12 },
          { dx: 0, dy: -hh * 0.52, r: 12 },
        ]
        edgeWet.forEach(({ dx, dy, r }) => {
          const el = createSvgElement('circle')
          el.setAttribute('cx', (pos.x + dx).toFixed(1))
          el.setAttribute('cy', (pos.y + dy).toFixed(1))
          el.setAttribute('r', String(r))
          el.setAttribute('fill', '#6fa6a4')
          el.setAttribute('opacity', '0.15')
          svg.appendChild(el)
        })
      }

      tileDecos
        .filter(d => d.type === 'road' || d.type === 'bridge')
        .forEach(d => appendTileImage(d.sprite, { height: d.height }))

      objectLayers.forEach(deco => {
        const isTree = deco.type === 'tree' || deco.type === 'conifer'
        const shadowRx = isTree ? hw * 0.9 : hw * 0.7
        const shadowRy = isTree ? hh * 0.45 : hh * 0.35
        const shadowOff = hh
        const ambRx = isTree ? hw * 1.2 : hw * 1.4
        const ambRy = isTree ? hh * 0.55 : hh * 0.7

        if (!isTree) {
          const base = createSvgElement('ellipse')
          base.setAttribute('cx', pos.x.toFixed(1))
          base.setAttribute('cy', (pos.y + hh * 0.6).toFixed(1))
          base.setAttribute('rx', (hw * 0.55).toFixed(1))
          base.setAttribute('ry', (hh * 0.28).toFixed(1))
          base.setAttribute('fill', '#5a7a30')
          base.setAttribute('opacity', '0.30')
          svg.appendChild(base)

          const edge = createSvgElement('ellipse')
          edge.setAttribute('cx', pos.x.toFixed(1))
          edge.setAttribute('cy', (pos.y + hh * 0.65).toFixed(1))
          edge.setAttribute('rx', (hw * 0.50).toFixed(1))
          edge.setAttribute('ry', (hh * 0.25).toFixed(1))
          edge.setAttribute('fill', '#4a6a28')
          edge.setAttribute('opacity', '0.20')
          svg.appendChild(edge)
        }

        const ambient = createSvgElement('ellipse')
        ambient.setAttribute('cx', pos.x.toFixed(1))
        ambient.setAttribute('cy', (pos.y + shadowOff * 0.8).toFixed(1))
        ambient.setAttribute('rx', ambRx.toFixed(1))
        ambient.setAttribute('ry', ambRy.toFixed(1))
        ambient.setAttribute('fill', 'url(#ambient-shadow)')
        svg.appendChild(ambient)

        const shadow = createSvgElement('ellipse')
        shadow.setAttribute('cx', pos.x.toFixed(1))
        shadow.setAttribute('cy', (pos.y + shadowOff).toFixed(1))
        shadow.setAttribute('rx', shadowRx.toFixed(1))
        shadow.setAttribute('ry', shadowRy.toFixed(1))
        shadow.setAttribute('fill', 'url(#contact-shadow)')
        svg.appendChild(shadow)
      })

      objectLayers.forEach(deco => {
        const isTree = deco.type === 'tree' || deco.type === 'conifer'
        const g = createSvgElement('g')
        g.setAttribute('transform', `translate(${pos.x.toFixed(1)},${pos.y.toFixed(1)})`)

        const decoImg = createSvgElement('image')
        decoImg.setAttribute('href', resolveTileUrl(deco.sprite))

        if (isTree) {
          const treeW = 32
          const treeH = 64
          decoImg.setAttribute('x', (-treeW / 2).toFixed(1))
          decoImg.setAttribute('y', (-treeH + hh).toFixed(1))
          decoImg.setAttribute('width', String(treeW))
          decoImg.setAttribute('height', String(treeH))
        } else {
          const decoH = 97.5
          decoImg.setAttribute('x', (-hw).toFixed(1))
          decoImg.setAttribute('y', (-decoH + hh).toFixed(1))
          decoImg.setAttribute('width', String(TILE_W))
          decoImg.setAttribute('height', String(decoH))
        }

        g.appendChild(decoImg)
        svg.appendChild(g)
      })
    })

    this.element.appendChild(svg)
    this.scenerySvg = svg
    this.updateParallax(completed.length / stations.length)
  }

  updateParallax(progress) {
    if (!this.scenerySvg) return
    const p = Math.max(0, Math.min(progress, 1))
    this.scenerySvg.style.transform = `translateX(${-p * 40}px)`
  }

  renderPath(completed) {
    const pathSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    pathSvg.setAttribute('class', 'map-path')
    pathSvg.setAttribute('viewBox', '0 0 800 500')
    pathSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet')

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    defs.innerHTML = `
      <filter id="pathGlowGreen">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id="pathGlowAmber">
        <feGaussianBlur stdDeviation="4" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `
    pathSvg.appendChild(defs)

    const lastCompletedIdx = completed.length > 0
      ? Math.max(...completed.map(id => stations.findIndex(s => s.id === id)))
      : -1

    for (let i = 0; i < stations.length - 1; i++) {
      const curr = stations[i]
      const next = stations[i + 1]
      const { cp1, cp2 } = computeCubicControlPoints(stations, i)
      const d = `M ${curr.x} ${curr.y} C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${next.x} ${next.y}`

      const bothCompleted = completed.includes(curr.id) && completed.includes(next.id)
      const isActive = lastCompletedIdx === i

      // Base: road surface
      const base = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      base.setAttribute('d', d)
      base.setAttribute('stroke', '#1e293b')
      base.setAttribute('stroke-width', '10')
      base.setAttribute('fill', 'none')
      base.setAttribute('stroke-linecap', 'round')
      pathSvg.appendChild(base)

      // Top: road markings
      const top = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      top.setAttribute('d', d)
      top.setAttribute('fill', 'none')
      top.setAttribute('stroke-linecap', 'round')

      if (bothCompleted) {
        top.setAttribute('stroke', '#22c55e')
        top.setAttribute('stroke-width', '3')
        top.setAttribute('filter', 'url(#pathGlowGreen)')
      } else if (isActive) {
        top.setAttribute('stroke', '#f59e0b')
        top.setAttribute('stroke-width', '3.5')
        top.setAttribute('filter', 'url(#pathGlowAmber)')
        top.setAttribute('class', 'path-active')
      } else {
        top.setAttribute('stroke', '#475569')
        top.setAttribute('stroke-width', '2')
        top.setAttribute('stroke-dasharray', '8 6')
      }
      pathSvg.appendChild(top)

      // Kilometric nodes along segment
      for (const t of [0.3, 0.6]) {
        const pt = cubicBezier(curr, cp1, cp2, next, t)
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        node.setAttribute('cx', String(pt.x))
        node.setAttribute('cy', String(pt.y))
        node.setAttribute('r', '2')
        node.setAttribute('fill', bothCompleted ? '#22c55e' : isActive ? '#f59e0b' : '#475569')
        node.setAttribute('opacity', '0.5')
        pathSvg.appendChild(node)
      }
    }

    this.element.appendChild(pathSvg)
  }

  renderStations() {
    this.stationComponents = stations.map((s) => {
      const station = new Station(s)
      station.onClick(() => this.boundHandler(station))
      this.element.appendChild(station.element)
      return station
    })
    this.updateStationBounce()
  }

  updateStationBounce() {
    const completed = store.get('completedStations') || []
    const nextStation = this.stationComponents.find(s =>
      store.isUnlocked(s.index) && !completed.includes(s.id)
    )
    this.stationComponents.forEach(s => {
      s.element.classList.toggle('station-bounce', s === nextStation)
    })
  }

  placeCar(completed) {
    this.element.appendChild(car.element)

    if (!car.getPosition()) {
      const firstIncompleteIndex = stations.findIndex(s => !completed.includes(s.id))
      const targetStation = firstIncompleteIndex >= 0
        ? stations[firstIncompleteIndex]
        : stations[stations.length - 1]
      car.setPosition(targetStation.x, targetStation.y)
    } else {
      car.syncPosition()
    }

    this.updateParallax(completed.length / stations.length)
  }

  getCarStationIndex() {
    const pos = car.getPosition()
    if (!pos) return 0
    let closest = 0
    let minDist = Infinity
    stations.forEach((s, i) => {
      const d = Math.hypot(s.x - pos.x, s.y - pos.y)
      if (d < minDist) {
        minDist = d
        closest = i
      }
    })
    return closest
  }

  renderProgress(completed) {
    const existing = this.element.querySelector('.map-progress')
    if (existing) existing.remove()

    const c = completed || store.get('completedStations') || []
    const total = stations.length
    const pct = total > 0 ? Math.round((c.length / total) * 100) : 0

    const nextIdx = c.length < total ? c.length : total - 1
    const nextStation = stations[nextIdx]
    const prevIdx = c.length > 0 ? c.length - 1 : 0
    const currentStation = stations[prevIdx]

    const bar = document.createElement('div')
    bar.className = 'map-progress'
    bar.innerHTML = `
      <span class="progress-label">${c.length} / ${total}</span>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width:${pct}%"></div>
      </div>
      <span class="progress-dest">
        ${c.length === 0
          ? '🚀 ' + stations[0].title
          : c.length >= total
            ? '🏁 ¡Completado!'
            : '📍 ' + nextStation.title
        }
      </span>
    `
    this.element.appendChild(bar)
  }

  handleStationClick(station) {
    if (store.isCompleted(station.id)) return
    if (!store.isUnlocked(station.index)) return

    eventBus.emit('station:clicked', station.id)

    const fromIndex = this.getCarStationIndex()
    const toIndex = station.index

    if (fromIndex !== toIndex) {
      const route = []
      const step = fromIndex <= toIndex ? 1 : -1
      for (let i = fromIndex; i !== toIndex + step; i += step) {
        route.push({ x: stations[i].x, y: stations[i].y })
      }

      if (this.arrivalCleanup) this.arrivalCleanup()

      car.moveThrough(route, 1.2)

      this.arrivalCleanup = eventBus.on('car:arrived', () => {
        const completed = store.get('completedStations') || []
        this.updateParallax(completed.length / stations.length)
        this.triggerArrivalRing(station)
        eventBus.emit('guide:arrival', station.id)
        eventBus.emit('map:open-minigame', station.id)
      })
    } else {
      eventBus.emit('map:open-minigame', station.id)
    }
  }

  triggerArrivalRing(station) {
    const el = this.stationComponents.find(s => s.id === station.id)
    if (!el) return
    const ring = document.createElement('div')
    ring.className = 'arrival-ring'
    ring.style.left = `${(station.x / 800) * 100}%`
    ring.style.top = `${(station.y / 500) * 100}%`
    this.element.appendChild(ring)
    setTimeout(() => ring.remove(), 800)
  }

  destroy() {
    if (this.arrivalCleanup) this.arrivalCleanup()
    if (this.unsubscribe) this.unsubscribe()
    this.stationComponents.forEach(s => s.destroy())
    car.destroy()
    this.element.innerHTML = ''
  }

  refresh() {
    this.render()
  }
}

export const mapView = new MapView()
