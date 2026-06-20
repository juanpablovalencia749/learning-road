import BaseMinigame from '../BaseMinigame.js'
import { audio } from '../../core/AudioManager.js'
import { shuffle } from '../../utils/random.js'
import { secuencias } from './secuencias.js'

export default class Sequence extends BaseMinigame {
  start() {
    const data = secuencias[this.stationId]
    if (!data) {
      this.element.innerHTML = ''
      this.createBackButton()
      this.createTitle('❌ Error')
      const p = document.createElement('p')
      p.style.cssText = 'text-align:center;color:var(--color-text-dim);padding:40px 0'
      p.textContent = 'No hay secuencia configurada para esta estación.'
      this.element.appendChild(p)
      return
    }

    this.correctOrder = [...data.items]
    this.currentOrder = shuffle([...data.items])
    this.dragIndex = null

    this.element.innerHTML = ''
    this.createBackButton()
    this.createTitle(`🔢 ${data.title}`)

    const instr = document.createElement('p')
    instr.className = 'seq-instrucciones'
    instr.textContent = 'Arrastra los pasos para ordenarlos correctamente.'
    this.element.appendChild(instr)

    this.listEl = document.createElement('div')
    this.listEl.className = 'seq-list'
    this.renderList()
    this.element.appendChild(this.listEl)

    this.verifyBtn = document.createElement('button')
    this.verifyBtn.className = 'btn-verify'
    this.verifyBtn.textContent = '✅ Verificar orden'
    this.verifyBtn.addEventListener('click', () => this.verify())
    this.element.appendChild(this.verifyBtn)

    this.feedbackEl = document.createElement('div')
    this.feedbackEl.className = 'seq-feedback'
    this.element.appendChild(this.feedbackEl)

    this.createSkipButton()
  }

  renderList() {
    this.listEl.innerHTML = ''
    this.itemEls = []

    this.currentOrder.forEach((text, i) => {
      const el = document.createElement('div')
      el.className = 'seq-item'
      el.draggable = true
      el.dataset.index = i
      el.innerHTML = `<span class="seq-handle">☰</span><span class="seq-num">${i + 1}</span><span class="seq-text">${text}</span>`

      el.addEventListener('dragstart', (e) => {
        this.dragIndex = i
        el.classList.add('dragging')
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', String(i))
      })

      el.addEventListener('dragend', () => {
        el.classList.remove('dragging')
        this.dragIndex = null
      })

      el.addEventListener('dragover', (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        this.itemEls.forEach(ie => ie.classList.remove('drag-over'))
        el.classList.add('drag-over')
      })

      el.addEventListener('dragleave', () => {
        el.classList.remove('drag-over')
      })

      el.addEventListener('drop', (e) => {
        e.preventDefault()
        this.itemEls.forEach(ie => ie.classList.remove('drag-over'))
        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'))
        if (fromIdx !== i) {
          const [moved] = this.currentOrder.splice(fromIdx, 1)
          this.currentOrder.splice(i, 0, moved)
          this.renderList()
        }
      })

      this.listEl.appendChild(el)
      this.itemEls.push(el)
    })
  }

  verify() {
    const allCorrect = this.currentOrder.every((text, i) => text === this.correctOrder[i])

    this.itemEls.forEach((el, i) => {
      el.draggable = false
      if (this.currentOrder[i] === this.correctOrder[i]) {
        el.classList.add('correct')
      } else {
        el.classList.add('wrong')
      }
    })
    this.verifyBtn.disabled = true
    this.verifyBtn.style.opacity = '.5'

    if (allCorrect) {
      audio.play('click')
      this.feedbackEl.textContent = '🎉 ¡Orden correcto!'
      this.feedbackEl.className = 'seq-feedback success'
      import('@tsparticles/confetti').then(({ default: confetti }) => {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      })
      this.complete()
    } else {
      audio.play('click')
      this.feedbackEl.textContent = '❌ Hay pasos fuera de orden. ¡Intenta de nuevo!'
      this.feedbackEl.className = 'seq-feedback error'
      setTimeout(() => {
        this.correctOrder = [...secuencias[this.stationId].items]
        this.currentOrder = shuffle([...this.correctOrder])
        this.renderList()
        this.feedbackEl.textContent = ''
        this.feedbackEl.className = 'seq-feedback'
        this.verifyBtn.disabled = false
        this.verifyBtn.style.opacity = '1'
      }, 1500)
    }
  }

  destroy() {
    super.destroy()
  }
}
