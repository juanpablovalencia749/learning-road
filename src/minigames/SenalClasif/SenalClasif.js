import BaseMinigame from '../BaseMinigame.js'
import { audio } from '../../core/AudioManager.js'

const SIGN_COLORS = {
  prohibicion: '#dc2626',
  obligacion: '#2563eb',
  advertencia: '#d97706',
  emergencia: '#059669',
}

const SIGNS = [
  { id: 'no-pasar',      label: 'No pasar',         emoji: '⛔', category: 'prohibicion' },
  { id: 'no-fumar',      label: 'No fumar',         emoji: '🚭', category: 'prohibicion' },
  { id: 'usar-casco',    label: 'Usar casco',       emoji: '⛑️', category: 'obligacion' },
  { id: 'usar-guantes',  label: 'Usar guantes',     emoji: '🧤', category: 'obligacion' },
  { id: 'peligro',       label: 'Peligro',          emoji: '⚠️', category: 'advertencia' },
  { id: 'riesgo-bio',    label: 'Riesgo biológico', emoji: '☣️', category: 'advertencia' },
  { id: 'primeros-aux',  label: 'Primeros auxilios',emoji: '🆘', category: 'emergencia' },
  { id: 'salida-emerg',  label: 'Salida emergencia',emoji: '🚪', category: 'emergencia' },
]

const CATEGORIES = [
  { id: 'prohibicion', label: 'PROHIBICIÓN', emoji: '⛔' },
  { id: 'obligacion',  label: 'OBLIGACIÓN',  emoji: '🔵' },
  { id: 'advertencia', label: 'ADVERTENCIA', emoji: '⚠️' },
  { id: 'emergencia',  label: 'EMERGENCIA',  emoji: '🆘' },
]

export default class SenalClasif extends BaseMinigame {
  start() {
    this.placed = new Set()

    this.element.innerHTML = ''
    this.createBackButton()
    this.createTitle('⚠️ Clasifica las Señales')

    const instructions = document.createElement('p')
    instructions.className = 'senal-instrucciones'
    instructions.textContent = 'Arrastra cada señal a su categoría correcta.'
    this.element.appendChild(instructions)

    const cardsRow = document.createElement('div')
    cardsRow.className = 'senal-cards'
    this.cardEls = []
    for (const sign of SIGNS) {
      const el = document.createElement('div')
      el.className = 'senal-card'
      el.draggable = true
      el.dataset.signId = sign.id
      el.style.setProperty('--sign-color', SIGN_COLORS[sign.category])
      el.innerHTML = `<span class="senal-card-emoji">${sign.emoji}</span><span class="senal-card-label">${sign.label}</span>`
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', sign.id)
        el.classList.add('dragging')
      })
      el.addEventListener('dragend', () => {
        el.classList.remove('dragging')
      })
      cardsRow.appendChild(el)
      this.cardEls.push(el)
    }
    this.element.appendChild(cardsRow)

    const catsRow = document.createElement('div')
    catsRow.className = 'senal-categories'
    this.catEls = []
    for (const cat of CATEGORIES) {
      const el = document.createElement('div')
      el.className = 'senal-category'
      el.dataset.catId = cat.id
      el.style.setProperty('--cat-color', SIGN_COLORS[cat.id])
      el.innerHTML = `<span class="senal-cat-emoji">${cat.emoji}</span><span class="senal-cat-label">${cat.label}</span><div class="senal-cat-results"></div>`
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
        const signId = e.dataTransfer.getData('text/plain')
        this.handleDrop(signId, cat.id, el)
      })
      catsRow.appendChild(el)
      this.catEls.push(el)
    }
    this.element.appendChild(catsRow)

    this.messageEl = document.createElement('div')
    this.messageEl.className = 'senal-message'
    this.element.appendChild(this.messageEl)

    this.createSkipButton()
  }

  handleDrop(signId, catId, catEl) {
    const sign = SIGNS.find(s => s.id === signId)
    if (!sign) return

    if (this.placed.has(signId)) return

    const cardEl = this.cardEls.find(el => el.dataset.signId === signId)

    if (sign.category === catId) {
      this.placed.add(signId)
      cardEl.classList.add('correct')
      cardEl.draggable = false

      const resultsEl = catEl.querySelector('.senal-cat-results')
      const tag = document.createElement('span')
      tag.className = 'senal-placed-tag'
      tag.textContent = `${sign.emoji} ${sign.label}`
      resultsEl.appendChild(tag)
      audio.play('click')

      if (this.placed.size === SIGNS.length) {
        this.showComplete()
      }
    } else {
      cardEl.classList.add('wrong')
      setTimeout(() => cardEl.classList.remove('wrong'), 400)
      catEl.classList.add('wrong-flash')
      setTimeout(() => catEl.classList.remove('wrong-flash'), 400)
    }
  }

  showComplete() {
    this.messageEl.textContent = '🎉 ¡Clasificaste todas las señales correctamente!'
    this.messageEl.className = 'senal-message success'
    import('@tsparticles/confetti').then(({ default: confetti }) => {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    })
    this.complete()
  }

  destroy() {
    super.destroy()
  }
}
