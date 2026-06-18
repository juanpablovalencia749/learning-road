import gsap from 'gsap'
import { eventBus } from '../core/EventBus.js'
import { store } from '../core/Store.js'
import { stations } from '../data/stations.js'

const GREETINGS = [
  '¡Hola! Soy tu guía de Seguridad y Salud en el Trabajo.',
  'Recorre las estaciones del mapa y completa cada reto.',
  'Aprenderás sobre prevención de riesgos, EPP y normativa SST.',
]

class Guide {
  constructor() {
    this.queue = []
    this.visible = false
    this.cleanups = []

    this.element = document.createElement('div')
    this.element.className = 'guide'
    this.element.style.display = 'none'
    this.element.innerHTML = `
      <div class="guide-bubble">
        <p class="guide-text"></p>
        <button class="guide-next">→</button>
      </div>
      <div class="guide-avatar">
        <svg viewBox="0 0 100 100" width="90" height="90">
          <defs>
            <radialGradient id="gBg" cx="40%" cy="40%">
              <stop offset="0%" stop-color="#1e293b"/>
              <stop offset="100%" stop-color="#0f172a"/>
            </radialGradient>
            <radialGradient id="gSkin" cx="45%" cy="40%">
              <stop offset="0%" stop-color="#fef3c7"/>
              <stop offset="100%" stop-color="#fde68a"/>
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="47" fill="url(#gBg)" stroke="rgba(255,255,255,.08)" stroke-width="1.5"/>
          <circle cx="50" cy="50" r="44" fill="rgba(59,130,246,.04)"/>
          <path d="M22 44 Q50 16 78 44" fill="#f59e0b"/>
          <path d="M22 44 L24 36 Q50 18 76 36 L78 44" fill="#fbbf24"/>
          <path d="M28 38 Q50 28 72 38" stroke="#d97706" stroke-width="2" fill="none"/>
          <rect x="30" y="43" width="40" height="7" rx="3" fill="#d97706"/>
          <circle cx="50" cy="55" r="15" fill="url(#gSkin)"/>
          <ellipse cx="43" cy="52" rx="2.5" ry="3" fill="#1e293b"/>
          <ellipse cx="57" cy="52" rx="2.5" ry="3" fill="#1e293b"/>
          <circle cx="42" cy="51" r="1.2" fill="#fff" opacity=".5"/>
          <circle cx="56" cy="51" r="1.2" fill="#fff" opacity=".5"/>
          <path d="M43 62 Q50 67 57 62" stroke="#1e293b" stroke-width="1.8" fill="none" stroke-linecap="round"/>
          <path d="M32 69 L30 90 L70 90 L68 69" fill="#f97316"/>
          <path d="M34 72 L66 72" stroke="#fcd34d" stroke-width="3" stroke-linecap="round"/>
          <path d="M34 78 L66 78" stroke="#fcd34d" stroke-width="3" stroke-linecap="round"/>
          <path d="M34 84 L66 84" stroke="#fcd34d" stroke-width="3" stroke-linecap="round"/>
          <rect x="36" y="75" width="28" height="16" rx="2" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
          <line x1="40" y1="79" x2="60" y2="79" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="40" y1="83" x2="56" y2="83" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="40" y1="87" x2="52" y2="87" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M72 42 L74 68 L92 62 L90 38 Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
          <line x1="76" y1="46" x2="88" y2="44" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="76" y1="51" x2="88" y2="49" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="76" y1="56" x2="86" y2="54" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="92" y1="54" x2="82" y2="44" stroke="#fcd34d" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
    `

    this.textEl = this.element.querySelector('.guide-text')
    this.nextBtn = this.element.querySelector('.guide-next')
    this.avatarEl = this.element.querySelector('.guide-avatar')

    this.nextBtn.addEventListener('click', () => this.showNext())

    gsap.to(this.avatarEl, {
      scale: 1.02,
      duration: 2.4,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      transformOrigin: 'center bottom',
    })

    document.body.appendChild(this.element)
    this.connect()
  }

  connect() {
    this.cleanups.push(
      eventBus.on('router:map', () => {
        if (this.visible) return
        const completed = store.get('completedStations') || []
        if (completed.length === 0) {
          this.say(GREETINGS)
        } else if (completed.length === stations.length) {
          this.say([
            '🎉 ¡Felicidades! Completaste todas las estaciones.',
            'Eres todo un experto en Seguridad y Salud en el Trabajo.',
          ])
        } else {
          this.say([
            `Llevas ${completed.length} de ${stations.length} estaciones. ¡Sigue así!`,
          ])
        }
      }),

      eventBus.on('station:clicked', (stationId) => {
        const station = stations.find(s => s.id === stationId)
        if (!station) return
        this.say(`📍 ${station.title}`)
        this.say(station.content.theory)
      }),

      eventBus.on('guide:arrival', (stationId) => {
        const station = stations.find(s => s.id === stationId)
        if (!station) return
        this.say(`🛑 Has llegado a: ${station.title}`)
        this.say(station.content.instructions)
      }),

      eventBus.on('minigame:completed', (stationId) => {
        const station = stations.find(s => s.id === stationId)
        if (!station) return
        this.say(`✅ ${station.content.completedMessage}`)
        const completed = store.get('completedStations') || []
        if (completed.length < stations.length) {
          this.say('Revisa el mapa para continuar con la siguiente estación.')
        }
      }),

      eventBus.on('store:changed', ({ key, value }) => {
        if (key !== 'unlockedStations') return
        const unlocked = value || []
        const lastIdx = unlocked[unlocked.length - 1]
        if (lastIdx === undefined) return
        const station = stations.find(s => s.index === lastIdx)
        if (!station) return
        this.say(`🔓 ¡Nueva estación desbloqueada: ${station.title}!`)
      }),
    )
  }

  say(input) {
    const texts = Array.isArray(input) ? input : [input]
    this.queue.push(...texts)

    if (!this.visible) {
      this.showNext()
    }
  }

  showNext() {
    if (this.queue.length === 0) {
      this.hide()
      return
    }

    const text = this.queue.shift()
    this.show(text)
  }

  show(text) {
    this.visible = true
    this.element.style.display = 'flex'

    this.textEl.textContent = text

    const showNextExists = this.queue.length > 0
    this.nextBtn.textContent = showNextExists ? '→' : '✕'
    this.nextBtn.style.display = 'inline-block'

    gsap.killTweensOf(this.element)
    gsap.fromTo(this.element,
      { opacity: 0, y: 40, scale: 0.92 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 0.45,
        ease: 'back.out(1.4)',
        clearProps: 'transform',
      },
    )
  }

  hide() {
    if (!this.visible) return
    this.visible = false

    gsap.killTweensOf(this.element)
    gsap.to(this.element, {
      opacity: 0,
      y: 24,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        this.element.style.display = 'none'
        this.element.style.transform = ''
      },
    })
  }

  destroy() {
    gsap.killTweensOf(this.element)
    this.cleanups.forEach(fn => fn())
    this.element.remove()
  }
}

export const guide = new Guide()
