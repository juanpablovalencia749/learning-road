import BaseMinigame from '../BaseMinigame.js'
import { audio } from '../../core/AudioManager.js'

const ITEMS = [
  { id: 'casco',  label: 'Casco',     emoji: '🪖', target: 'cabeza' },
  { id: 'gafas',  label: 'Gafas',     emoji: '🥽', target: 'ojos' },
  { id: 'arnes',  label: 'Arnés',     emoji: '🦺', target: 'torso' },
  { id: 'guantes',label: 'Guantes',   emoji: '🧤', target: 'manos' },
  { id: 'botas',  label: 'Botas',     emoji: '👢', target: 'pies' },
]

const ZONES = [
  { id: 'cabeza', label: 'Cabeza', emoji: '🧠' },
  { id: 'ojos',   label: 'Ojos',   emoji: '👁️' },
  { id: 'torso',  label: 'Torso',  emoji: '👤' },
  { id: 'manos',  label: 'Manos',  emoji: '✋' },
  { id: 'pies',   label: 'Pies',   emoji: '🦶' },
]

export default class EppDrag extends BaseMinigame {
  start() {
    this.placed = new Set()

    this.element.innerHTML = ''
    this.createBackButton()
    this.createTitle('🛡️ Arma tu EPP')

    const layout = document.createElement('div')
    layout.className = 'epp-layout'

    const itemsCol = document.createElement('div')
    itemsCol.className = 'epp-items'
    this.itemEls = []
    for (const item of ITEMS) {
      const el = document.createElement('div')
      el.className = 'epp-item'
      el.draggable = true
      el.dataset.itemId = item.id
      el.innerHTML = `<span class="epp-item-emoji">${item.emoji}</span><span class="epp-item-label">${item.label}</span>`
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', item.id)
        el.classList.add('dragging')
      })
      el.addEventListener('dragend', () => {
        el.classList.remove('dragging')
      })
      itemsCol.appendChild(el)
      this.itemEls.push(el)
    }
    layout.appendChild(itemsCol)

    const zonesCol = document.createElement('div')
    zonesCol.className = 'epp-zones'
    this.zoneEls = []
    for (const zone of ZONES) {
      const el = document.createElement('div')
      el.className = 'epp-zone'
      el.dataset.zoneId = zone.id
      el.innerHTML = `<span class="epp-zone-emoji">${zone.emoji}</span><span class="epp-zone-label">${zone.label}</span><span class="epp-zone-result"></span>`
      el.addEventListener('dragover', (e) => {
        e.preventDefault()
        el.classList.add('drag-over')
      })
      el.addEventListener('dragleave', () => {
        el.classList.remove('drag-over')
      })
      el.addEventListener('drop', (e) => {
        e.preventDefault()
        el.classList.remove('drag-over')
        const itemId = e.dataTransfer.getData('text/plain')
        this.handleDrop(itemId, zone.id, el)
      })
      zonesCol.appendChild(el)
      this.zoneEls.push(el)
    }
    layout.appendChild(zonesCol)
    this.element.appendChild(layout)

    this.messageEl = document.createElement('div')
    this.messageEl.className = 'epp-message'
    this.element.appendChild(this.messageEl)

    this.createSkipButton()
  }

  handleDrop(itemId, zoneId, zoneEl) {
    const item = ITEMS.find(i => i.id === itemId)
    if (!item) return

    if (this.placed.has(itemId)) return

    const resultEl = zoneEl.querySelector('.epp-zone-result')
    const itemEl = this.itemEls.find(el => el.dataset.itemId === itemId)

    if (item.target === zoneId) {
      this.placed.add(itemId)
      itemEl.classList.add('correct')
      itemEl.draggable = false
      resultEl.textContent = `✅ ${item.emoji}`
      resultEl.className = 'epp-zone-result correct'
      audio.play('click')

      if (this.placed.size === ITEMS.length) {
        this.showComplete()
      }
    } else {
      itemEl.classList.add('wrong')
      setTimeout(() => itemEl.classList.remove('wrong'), 400)
      zoneEl.classList.add('wrong-flash')
      setTimeout(() => zoneEl.classList.remove('wrong-flash'), 400)
    }
  }

  showComplete() {
    this.messageEl.textContent = '🎉 ¡Equipaste todos los EPP correctamente!'
    this.messageEl.className = 'epp-message success'
    import('@tsparticles/confetti').then(({ default: confetti }) => {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    })
    this.complete()
  }

  destroy() {
    super.destroy()
  }
}
