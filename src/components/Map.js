import { eventBus } from '../core/EventBus.js'
import { store } from '../core/Store.js'
import { stations } from '../data/stations.js'
import { car } from './Car.js'
import Station from './Station.js'
import { computeCubicControlPoints, cubicBezier } from '../utils/bezier.js'

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
    this.renderSignage()
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

    const completedCount = completed.length
    const progress = Math.min(completedCount / stations.length, 1)

    // Mountains far layer
    const m1 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    m1.setAttribute('d', 'M-50,500 L60,240 L160,340 L260,180 L380,300 L480,220 L580,310 L680,160 L780,270 L850,500 Z')
    m1.setAttribute('fill', '#1e293b')
    m1.setAttribute('stroke', '#1e293b')
    m1.setAttribute('stroke-width', '8')
    m1.setAttribute('stroke-linejoin', 'round')
    m1.setAttribute('opacity', '0.45')
    svg.appendChild(m1)

    const m2 = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    m2.setAttribute('d', 'M-30,500 L100,300 L200,380 L320,240 L440,330 L540,260 L660,320 L740,200 L820,280 L860,500 Z')
    m2.setAttribute('fill', '#1e293b')
    m2.setAttribute('stroke', '#1e293b')
    m2.setAttribute('stroke-width', '8')
    m2.setAttribute('stroke-linejoin', 'round')
    m2.setAttribute('opacity', '0.3')
    svg.appendChild(m2)

    // City skyline (medium layer)
    const skyline = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    skyline.setAttribute('opacity', '0.25')
    const buildings = [
      [20, 380, 30, 120], [55, 380, 22, 80], [85, 370, 35, 130],
      [140, 390, 28, 110], [175, 385, 20, 60], [210, 380, 32, 120],
      [360, 390, 25, 110], [390, 380, 30, 90], [425, 385, 22, 70],
      [560, 390, 34, 110], [600, 380, 26, 80], [635, 385, 30, 120],
      [680, 390, 24, 60], [710, 380, 35, 100], [750, 385, 28, 130],
    ]
    buildings.forEach(([x, y, w, h]) => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rect.setAttribute('x', String(x))
      rect.setAttribute('y', String(y))
      rect.setAttribute('width', String(w))
      rect.setAttribute('height', String(h))
      rect.setAttribute('rx', '4')
      rect.setAttribute('fill', '#1e293b')
      skyline.appendChild(rect)
    })
    svg.appendChild(skyline)

    // Trees (near layer)
    const trees = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    trees.setAttribute('opacity', '0.35')
    const treePositions = [
      [50, 410], [130, 430], [220, 400], [280, 420],
      [350, 410], [430, 390], [510, 420], [590, 400],
      [660, 410], [730, 430], [780, 410],
    ]
    treePositions.forEach(([tx, ty]) => {
      const h = 28 + (tx % 12)
      const trunk = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      trunk.setAttribute('x', String(tx - 2))
      trunk.setAttribute('y', String(ty - h * 0.3))
      trunk.setAttribute('width', '4')
      trunk.setAttribute('height', String(Math.ceil(h * 0.3)))
      trunk.setAttribute('rx', '2')
      trunk.setAttribute('fill', '#1a2a1a')
      trees.appendChild(trunk)

      const crown = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      crown.setAttribute('d', `M${tx},${ty - h} L${tx - 8},${ty - h * 0.35} L${tx + 8},${ty - h * 0.35} Z`)
      crown.setAttribute('fill', '#1a3a2a')
      crown.setAttribute('stroke', '#1a3a2a')
      crown.setAttribute('stroke-width', '3')
      crown.setAttribute('stroke-linejoin', 'round')
      trees.appendChild(crown)
    })
    svg.appendChild(trees)

    this.element.appendChild(svg)
    this.scenerySvg = svg
    this.updateParallax(progress)
  }

  updateParallax(progress) {
    if (!this.scenerySvg) return
    const p = Math.max(0, Math.min(progress, 1))
    this.scenerySvg.style.transform = `translateX(${-p * 40}px)`
  }

  renderSignage() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('class', 'map-signage')
    svg.setAttribute('viewBox', '0 0 800 500')
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')

    // Warning signs near curve apexes
    const signs = [
      { x: 680, y: 410, label: '!' },
      { x: 120, y: 230, label: '!' },
      { x: 320, y: 145, label: '!' },
    ]

    signs.forEach(({ x, y, label }) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      // Pole
      const pole = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      pole.setAttribute('x', String(x - 1.5))
      pole.setAttribute('y', String(y))
      pole.setAttribute('width', '3')
      pole.setAttribute('height', '25')
      pole.setAttribute('fill', '#94a3b8')
      g.appendChild(pole)
      // Triangle sign
      const tri = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      tri.setAttribute('d', `M${x},${y - 18} L${x - 9},${y - 2} L${x + 9},${y - 2} Z`)
      tri.setAttribute('fill', '#f59e0b')
      tri.setAttribute('stroke', '#1e293b')
      tri.setAttribute('stroke-width', '1.5')
      tri.setAttribute('stroke-linejoin', 'round')
      g.appendChild(tri)
      // Exclamation text
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      txt.setAttribute('x', String(x))
      txt.setAttribute('y', String(y - 7))
      txt.setAttribute('text-anchor', 'middle')
      txt.setAttribute('fill', '#1e293b')
      txt.setAttribute('font-size', '11')
      txt.setAttribute('font-weight', 'bold')
      txt.textContent = label
      g.appendChild(txt)

      svg.appendChild(g)
    })

    this.element.appendChild(svg)
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
