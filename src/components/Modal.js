import { audio } from '../core/AudioManager.js'

export default class Modal {
  constructor({ title, content, onConfirm, onClose }) {
    this.element = document.createElement('div')
    this.element.className = 'modal-overlay'
    this.element.innerHTML = `
      <div class="modal-content">
        <button class="modal-close">&times;</button>
        <h2 class="modal-title">${title}</h2>
        <div class="modal-body">${content}</div>
        ${onConfirm ? '<button class="modal-confirm">Continuar</button>' : ''}
      </div>
    `
    this.element.querySelector('.modal-close')?.addEventListener('click', () => {
      audio.play('click')
      this.close()
      onClose?.()
    })
    this.element.querySelector('.modal-confirm')?.addEventListener('click', () => {
      audio.play('click')
      onConfirm?.()
      this.close()
    })
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) this.close()
    })
    document.body.appendChild(this.element)
    requestAnimationFrame(() => this.element.classList.add('visible'))
    audio.play('unlock')
  }

  close() {
    this.element.classList.remove('visible')
    setTimeout(() => this.element.remove(), 300)
  }

  destroy() {
    this.element.remove()
  }
}
