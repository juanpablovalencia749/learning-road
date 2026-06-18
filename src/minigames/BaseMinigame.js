import { audio } from '../core/AudioManager.js'
import { eventBus } from '../core/EventBus.js'

export default class BaseMinigame {
  constructor(stationId) {
    this.stationId = stationId
    this.element = document.createElement('div')
    this.element.className = 'minigame'
    this.completed = false
  }

  createBackButton() {
    const btn = document.createElement('button')
    btn.className = 'btn-back'
    btn.textContent = '← Volver al mapa'
    btn.addEventListener('click', () => {
      audio.play('click')
      eventBus.emit('minigame:back')
    })
    this.element.prepend(btn)
    return btn
  }

  createTitle(text) {
    const title = document.createElement('h2')
    title.className = 'minigame-title'
    title.textContent = text
    this.element.appendChild(title)
    return title
  }

  complete() {
    if (this.completed) return
    this.completed = true
    audio.play('complete')
    eventBus.emit('minigame:completed', this.stationId)
  }

  createSkipButton() {
    const btn = document.createElement('button')
    btn.className = 'btn-skip'
    btn.textContent = '⏭ Saltar este minijuego (temporal)'
    btn.title = 'Botón temporal — lo quitaremos después'
    btn.addEventListener('click', () => {
      audio.play('click')
      this.complete()
    })
    this.element.appendChild(btn)
    return btn
  }

  start() {
    this.createSkipButton()
  }

  destroy() {
    this.element.remove()
  }
}
