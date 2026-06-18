import { store } from '../core/Store.js'
import {
  createElement,
  Search, Shield, Triangle, BookOpen, Zap, Mountain, Sparkles,
  Monitor, HeartPulse, Flame, FlaskConical, Volume2, FileText,
  Container, RadioTower,
} from 'lucide'

const lucideMap = {
  Search, Shield, Triangle, BookOpen, Zap, Mountain, Sparkles,
  Monitor, HeartPulse, Flame, FlaskConical, Volume2, FileText,
  Container, RadioTower,
}

function lucideSvg(name, size = 28) {
  const icon = lucideMap[name]
  if (!icon) return ''
  const el = createElement(icon)
  el.setAttribute('width', String(size))
  el.setAttribute('height', String(size))
  el.setAttribute('stroke-width', '1.5')
  return el.outerHTML
}

export default class Station {
  constructor({ id, index, x, y, title, icon, lucideIcon }) {
    this.id = id
    this.index = index
    this.x = x
    this.y = y
    this.title = title
    this.icon = icon || '📌'
    this.lucideIcon = lucideIcon
    this.element = document.createElement('button')
    this.element.className = 'station'
    this.element.dataset.stationId = id
    this.element.style.left = `${(x / 800) * 100}%`
    this.element.style.top = `${(y / 500) * 100}%`
    this.render()
  }

  render() {
    const isUnlocked = store.isUnlocked(this.index)
    const completed = store.isCompleted(this.id)

    this.element.disabled = !isUnlocked
    this.element.innerHTML = `
      <span class="station-icon">${lucideSvg(this.lucideIcon)}</span>
      <span class="station-title">${this.title}</span>
      ${completed ? '<span class="station-check" aria-label="Completada">✓</span>' : ''}
      ${!isUnlocked ? '<span class="station-lock">🔒</span>' : ''}
    `
    this.element.classList.toggle('completed', completed)
    this.element.classList.toggle('locked', !isUnlocked)
    this.element.classList.add('no-enter')
  }

  onClick(callback) {
    this.element.addEventListener('click', callback)
  }

  destroy() {
    this.element.remove()
  }
}
