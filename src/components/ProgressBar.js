export default class ProgressBar {
  constructor(container) {
    this.container = container
    this.element = document.createElement('div')
    this.element.className = 'progress-bar'
    this.container.appendChild(this.element)
  }

  update(completed, total) {
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    this.element.innerHTML = `
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width:${pct}%"></div>
      </div>
      <span class="progress-label">${completed} / ${total}</span>
    `
  }

  destroy() {
    this.element.remove()
  }
}
