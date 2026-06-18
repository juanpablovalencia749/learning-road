import BaseMinigame from './BaseMinigame.js'

export default class Placeholder extends BaseMinigame {
  start() {
    this.element.innerHTML = ''
    this.createBackButton()
    this.createTitle('🚧 Próximamente')
    const p = document.createElement('p')
    p.style.cssText = 'text-align:center;color:var(--color-text-dim);padding:40px 0'
    p.textContent = 'Este minijuego estará disponible pronto.'
    this.element.appendChild(p)
    this.createSkipButton()
  }
}
