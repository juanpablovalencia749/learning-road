import { eventBus } from '../core/EventBus.js'
import { store } from '../core/Store.js'
import { stations } from '../data/stations.js'
import { car } from './Car.js'
import Station from './Station.js'
import { computeCubicControlPoints, cubicBezier } from '../utils/bezier.js'
import { decorations, COLS, ROWS, terrainDetails, groundClutter } from '../data/tileMap.js'
import { tileToScreen, zOrder, TILE_W, TILE_H } from '../utils/isometric.js'

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
        <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" result="noise"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.3 0 0 0 0 0.35 0 0 0 0 0.2 0 0 0 0.08 0" in="noise"/>
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
    `
    svg.appendChild(defs)

    const decoMap = {}
    decorations.forEach(d => { decoMap[`${d.col},${d.row}`] = d })

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
        tileList.push({ col, row })
      }
    }
    tileList.sort((a, b) => zOrder(a.col, a.row) - zOrder(b.col, b.row))

    // Organic noise overlay
    const noiseRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    noiseRect.setAttribute('x', '-100')
    noiseRect.setAttribute('y', '-60')
    noiseRect.setAttribute('width', '1100')
    noiseRect.setAttribute('height', '650')
    noiseRect.setAttribute('fill', '#000')
    noiseRect.setAttribute('filter', 'url(#grass-noise)')
    noiseRect.setAttribute('pointer-events', 'none')
    svg.appendChild(noiseRect)

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
      const deco = decoMap[`${col},${row}`]
      const detail = detailMap[`${col},${row}`]
      const clutterList = clutterByTile[`${col},${row}`]

      // Grass diamond image + outline (not overlay tiles like road/water)
      const isOverlay = deco && (deco.type === 'road' || deco.type === 'water' || deco.type === 'beach' || deco.type === 'dirt')
      if (!isOverlay) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        g.setAttribute('transform', `translate(${pos.x.toFixed(1)},${pos.y.toFixed(1)})`)

        const grassImg = document.createElementNS('http://www.w3.org/2000/svg', 'image')
        grassImg.setAttribute('href', resolveTileUrl('tiles/terrain/grassWhole.png'))
        grassImg.setAttribute('x', (-hw).toFixed(1))
        grassImg.setAttribute('y', (-hh).toFixed(1))
        grassImg.setAttribute('width', String(TILE_W))
        grassImg.setAttribute('height', String(TILE_H))
        grassImg.setAttribute('clip-path', 'url(#iso-clip)')
        g.appendChild(grassImg)

        svg.appendChild(g)

        const outline = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
        outline.setAttribute('points', `0,${-hh} ${hw},0 0,${hh} ${-hw},0`)
        outline.setAttribute('transform', `translate(${pos.x.toFixed(1)},${pos.y.toFixed(1)})`)
        outline.setAttribute('fill', 'none')
        outline.setAttribute('stroke', 'rgba(0,0,0,0.06)')
        outline.setAttribute('stroke-width', '0.5')
        svg.appendChild(outline)
      }

      // Phase 3: Ground clutter (tiny decorative elements on grass)
      if (clutterList) {
        clutterList.forEach(item => {
          const cx = pos.x + ((col * 13 + row * 7) % 11) - 5
          const cy = pos.y + ((col * 5 + row * 17) % 9) - 4
          let fillColor, el
          switch (item.type) {
            case 'tuft':
              fillColor = '#8bc34a'
              el = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
              el.setAttribute('r', String(item.size))
              break
            case 'pebble':
              fillColor = '#9e9e9e'
              el = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
              el.setAttribute('r', String(item.size))
              break
            case 'flower': {
              const fi = (col * 7 + row * 13) % flowerColors.length
              fillColor = flowerColors[fi]
              el = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
              el.setAttribute('r', String(item.size))
              break
            }
            case 'leaf':
              fillColor = '#8d6e63'
              el = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse')
              el.setAttribute('rx', String(item.size))
              el.setAttribute('ry', String(item.size * 0.5))
              el.setAttribute('transform', `rotate(${(col * 37 + row * 23) % 360}, ${cx.toFixed(1)}, ${cy.toFixed(1)})`)
              break
            default:
              fillColor = '#8bc34a'
              el = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
              el.setAttribute('r', '3')
          }
          el.setAttribute('cx', cx.toFixed(1))
          el.setAttribute('cy', cy.toFixed(1))
          el.setAttribute('fill', fillColor)
          el.setAttribute('opacity', String(item.opacity))
          svg.appendChild(el)
        })
      }

      // Phase 2: terrain variation circles (grass patches, dirt, rocks)
      if (detail) {
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
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        el.setAttribute('cx', (pos.x + dx).toFixed(1))
        el.setAttribute('cy', (pos.y + dy).toFixed(1))
        el.setAttribute('r', String(detail.radius))
        el.setAttribute('fill', fillColor)
        el.setAttribute('opacity', String(detail.opacity))
        svg.appendChild(el)
      }

      // Phase 4: road edge dirt blending — small circles near diamond vertices
      if (deco && deco.type === 'road') {
        const edgeDirt = [
          { dx: hw * 0.45, dy: 0, r: 5 },
          { dx: -hw * 0.45, dy: 0, r: 5 },
          { dx: 0, dy: hh * 0.45, r: 5 },
          { dx: 0, dy: -hh * 0.45, r: 5 },
        ]
        edgeDirt.forEach(({ dx, dy, r }) => {
          const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
          el.setAttribute('cx', (pos.x + dx).toFixed(1))
          el.setAttribute('cy', (pos.y + dy).toFixed(1))
          el.setAttribute('r', String(r))
          el.setAttribute('fill', '#6b5a3e')
          el.setAttribute('opacity', '0.18')
          svg.appendChild(el)
        })
      }

      // Phase 4: water edge blending
      if (deco && deco.type === 'water') {
        const edgeWet = [
          { dx: hw * 0.45, dy: 0, r: 5 },
          { dx: -hw * 0.45, dy: 0, r: 5 },
          { dx: 0, dy: hh * 0.45, r: 5 },
        ]
        edgeWet.forEach(({ dx, dy, r }) => {
          const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
          el.setAttribute('cx', (pos.x + dx).toFixed(1))
          el.setAttribute('cy', (pos.y + dy).toFixed(1))
          el.setAttribute('r', String(r))
          el.setAttribute('fill', '#7a9a9b')
          el.setAttribute('opacity', '0.15')
          svg.appendChild(el)
        })
      }

      // Layer 1: road / water / beach — diamond-clipped overlay
      if (deco && (deco.type === 'road' || deco.type === 'water' || deco.type === 'beach' || deco.type === 'dirt')) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        g.setAttribute('transform', `translate(${pos.x.toFixed(1)},${pos.y.toFixed(1)})`)

        const img = document.createElementNS('http://www.w3.org/2000/svg', 'image')
        img.setAttribute('href', resolveTileUrl(deco.sprite))
        img.setAttribute('x', (-hw).toFixed(1))
        img.setAttribute('y', (-hh).toFixed(1))
        img.setAttribute('width', String(TILE_W))
        img.setAttribute('height', String(TILE_H))
        img.setAttribute('clip-path', 'url(#iso-clip)')
        g.appendChild(img)

        svg.appendChild(g)
      }

      // Phase 2: shadows under buildings and trees
      if (deco && (deco.type === 'building' || deco.type === 'tree' || deco.type === 'conifer')) {
        const isTree = deco.type === 'tree' || deco.type === 'conifer'
        const shadowRx = isTree ? hw * 0.9 : hw * 0.7
        const shadowRy = isTree ? hh * 0.45 : hh * 0.35
        const shadowOff = hh
        const ambRx = isTree ? hw * 1.2 : hw * 1.4
        const ambRy = isTree ? hh * 0.55 : hh * 0.7

        // Ambient occlusion (wide, soft)
        const ambient = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse')
        ambient.setAttribute('cx', pos.x.toFixed(1))
        ambient.setAttribute('cy', (pos.y + shadowOff * 0.8).toFixed(1))
        ambient.setAttribute('rx', ambRx.toFixed(1))
        ambient.setAttribute('ry', ambRy.toFixed(1))
        ambient.setAttribute('fill', 'url(#ambient-shadow)')
        svg.appendChild(ambient)

        // Contact shadow (tight, dark at center)
        const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse')
        shadow.setAttribute('cx', pos.x.toFixed(1))
        shadow.setAttribute('cy', (pos.y + shadowOff).toFixed(1))
        shadow.setAttribute('rx', shadowRx.toFixed(1))
        shadow.setAttribute('ry', shadowRy.toFixed(1))
        shadow.setAttribute('fill', 'url(#contact-shadow)')
        svg.appendChild(shadow)
      }

      // Layer 4: buildings and trees — unclipped, bottom-center anchored
      if (deco && (deco.type === 'building' || deco.type === 'tree' || deco.type === 'conifer')) {
        const isTree = deco.type === 'tree' || deco.type === 'conifer'

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        g.setAttribute('transform', `translate(${pos.x.toFixed(1)},${pos.y.toFixed(1)})`)

        const decoImg = document.createElementNS('http://www.w3.org/2000/svg', 'image')
        decoImg.setAttribute('href', resolveTileUrl(deco.sprite))

        if (isTree) {
          const treeW = 32
          const treeH = 64
          decoImg.setAttribute('x', (-treeW / 2).toFixed(1))
          decoImg.setAttribute('y', (-treeH + hh).toFixed(1))
          decoImg.setAttribute('width', String(treeW))
          decoImg.setAttribute('height', String(treeH))
        } else {
          const decoH = TILE_H + hh
          decoImg.setAttribute('x', (-hw).toFixed(1))
          decoImg.setAttribute('y', (-decoH + hh).toFixed(1))
          decoImg.setAttribute('width', String(TILE_W))
          decoImg.setAttribute('height', String(decoH))
        }

        g.appendChild(decoImg)
        svg.appendChild(g)
      }
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
