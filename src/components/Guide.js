import gsap from 'gsap'
import { eventBus } from '../core/EventBus.js'
import { store } from '../core/Store.js'
import { stations } from '../data/stations.js'

const ROBOT_IDLE = new URL('../assets/robot/character_robot_idle.png', import.meta.url).href
const ROBOT_TALK = new URL('../assets/robot/character_robot_talk.png', import.meta.url).href
const ROBOT_THINK = new URL('../assets/robot/character_robot_think.png', import.meta.url).href
const ROBOT_CHEER = new URL('../assets/robot/character_robot_cheer0.png', import.meta.url).href

const GREETINGS = [
  '¡Hola! Soy tu guía de Seguridad y Salud en el Trabajo.',
  'Recorre las estaciones del mapa y completa cada reto.',
  'Aprenderás sobre prevención de riesgos, EPP y normativa SST.',
]

const TEMPO_FAST = 4000
const TEMPO_LONG = 6000

class Guide {
  constructor() {
    this.queue = []
    this.visible = false
    this.cleanups = []
    this._autoTimer = null

    this.element = document.createElement('div')
    this.element.className = 'guide'
    this.element.style.display = 'none'
    this.element.innerHTML = `
      <div class="guide-bubble">
        <p class="guide-text"></p>
        <button class="guide-next">→</button>
      </div>
      <div class="guide-avatar">
        <img class="robot-sprite" src="${ROBOT_IDLE}" width="80" height="auto" alt="Robot guía" />
      </div>
    `

    this.textEl = this.element.querySelector('.guide-text')
    this.nextBtn = this.element.querySelector('.guide-next')
    this.avatarEl = this.element.querySelector('.guide-avatar')
    this.robotImg = this.element.querySelector('.robot-sprite')

    this.nextBtn.addEventListener('click', () => {
      if (this._autoTimer) clearTimeout(this._autoTimer)
      this.showNext()
    })

    gsap.to(this.robotImg, {
      scale: 1.03,
      duration: 2.8,
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
        this.robotImg.src = ROBOT_CHEER
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
        this.robotImg.src = ROBOT_CHEER
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

    // Change sprite based on context
    this.robotImg.src = showNextExists ? ROBOT_TALK : ROBOT_IDLE

    // Auto-advance timer
    if (this._autoTimer) clearTimeout(this._autoTimer)
    const delay = text.length > 120 ? TEMPO_LONG : TEMPO_FAST
    if (showNextExists) {
      this._autoTimer = setTimeout(() => {
        this.robotImg.src = ROBOT_THINK
        this.showNext()
      }, delay)
    } else {
      this._autoTimer = setTimeout(() => {
        this.hide()
      }, delay)
    }

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

    if (this._autoTimer) clearTimeout(this._autoTimer)
    this.robotImg.src = ROBOT_IDLE

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
