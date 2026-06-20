import BaseMinigame from '../BaseMinigame.js'
import { audio } from '../../core/AudioManager.js'
import { preguntas } from './preguntas.js'

const STATION_KEYS = {
  legislacion: 'Legislación SST',
  ergonomia: 'Ergonomía',
  'orden-limpieza': 'Orden y Limpieza',
  'primeros-auxilios': 'Primeros Auxilios',
  'riesgos-electricos': 'Riesgos Eléctricos',
  'sustancias-peligrosas': 'Sustancias Peligrosas',
  'ruido-vibraciones': 'Ruido y Vibraciones',
  'espacios-confinados': 'Espacios Confinados',
}

export default class Quiz extends BaseMinigame {
  start() {
    this.current = 0
    this.score = 0

    const key = STATION_KEYS[this.stationId] ? this.stationId : null
    if (!key || !preguntas[key]) {
      this.element.innerHTML = ''
      this.createBackButton()
      this.createTitle('❌ Error')
      const p = document.createElement('p')
      p.style.cssText = 'text-align:center;color:var(--color-text-dim);padding:40px 0'
      p.textContent = 'No hay preguntas configuradas para esta estación.'
      this.element.appendChild(p)
      return
    }

    this.questions = preguntas[key]
    this.total = this.questions.length

    this.element.innerHTML = ''
    this.createBackButton()
    this.createTitle(`📋 ${STATION_KEYS[key]}`)

    this.progressEl = document.createElement('div')
    this.progressEl.className = 'quiz-progress'
    this.element.appendChild(this.progressEl)

    this.questionEl = document.createElement('div')
    this.questionEl.className = 'quiz-question'
    this.element.appendChild(this.questionEl)

    this.optionsEl = document.createElement('div')
    this.optionsEl.className = 'quiz-options'
    this.element.appendChild(this.optionsEl)

    this.feedbackEl = document.createElement('div')
    this.feedbackEl.className = 'quiz-feedback'
    this.element.appendChild(this.feedbackEl)

    this.createSkipButton()
    this.renderQuestion()
  }

  renderQuestion() {
    if (this.current >= this.total) {
      this.showResult()
      return
    }

    const q = this.questions[this.current]

    this.progressEl.textContent = `Pregunta ${this.current + 1} de ${this.total}`
    this.progressEl.innerHTML += `<span class="quiz-score">${'●'.repeat(this.score)}${'○'.repeat(this.total - this.score)}</span>`

    this.questionEl.textContent = q.q
    this.optionsEl.innerHTML = ''
    this.feedbackEl.textContent = ''
    this.feedbackEl.className = 'quiz-feedback'

    q.opts.forEach((opt, i) => {
      const btn = document.createElement('button')
      btn.className = 'quiz-option'
      btn.textContent = opt
      btn.addEventListener('click', () => this.selectOption(i))
      this.optionsEl.appendChild(btn)
    })
  }

  selectOption(idx) {
    const q = this.questions[this.current]
    const opts = this.optionsEl.querySelectorAll('.quiz-option')
    opts.forEach(b => b.disabled = true)

    if (idx === q.answer) {
      opts[idx].classList.add('correct')
      this.score++
      audio.play('click')
      this.feedbackEl.textContent = '✅ ¡Correcto!'
      this.feedbackEl.className = 'quiz-feedback correct'
    } else {
      opts[idx].classList.add('wrong')
      opts[q.answer].classList.add('correct')
      this.feedbackEl.textContent = `❌ Incorrecto. La respuesta era: ${q.opts[q.answer]}`
      this.feedbackEl.className = 'quiz-feedback wrong'
    }

    this.current++
    setTimeout(() => this.renderQuestion(), 1200)
  }

  showResult() {
    this.progressEl.textContent = ''
    this.questionEl.textContent = ''
    this.optionsEl.innerHTML = ''

    const allCorrect = this.score === this.total
    const emoji = allCorrect ? '🎉' : '👍'
    const msg = allCorrect
      ? `¡${this.score}/${this.total}! Todas correctas.`
      : `Obtuviste ${this.score}/${this.total}. ¡Sigue practicando!`

    this.feedbackEl.innerHTML = `
      <div class="quiz-result">
        <span class="quiz-result-emoji">${emoji}</span>
        <span class="quiz-result-text">${msg}</span>
      </div>
    `
    this.feedbackEl.className = 'quiz-feedback result'

    if (allCorrect) {
      import('@tsparticles/confetti').then(({ default: confetti }) => {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      })
    }

    this.complete()
  }

  destroy() {
    super.destroy()
  }
}
