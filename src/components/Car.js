import gsap from 'gsap'
import { eventBus } from '../core/EventBus.js'
import { audio } from '../core/AudioManager.js'
import carSvg from '../assets/car.svg?raw'
import { computeCubicControlPoints, cubicBezier, cubicBezierDerivative } from '../utils/bezier.js'

const VIEWBOX_W = 800
const VIEWBOX_H = 500

function getPos(segments, progress) {
  const n = segments.length
  const raw = Math.max(0, Math.min(progress * n, n))
  const idx = Math.min(Math.floor(raw), n - 1)
  const t = Math.min(raw - idx, 1)
  return cubicBezier(segments[idx].p0, segments[idx].p1, segments[idx].p2, segments[idx].p3, t)
}

class Car {
  constructor() {
    this.element = document.createElement('div')
    this.element.className = 'car'
    this.element.style.width = '90px'

    this.body = document.createElement('div')
    this.body.className = 'car-body'
    this.body.innerHTML = carSvg
    this.element.appendChild(this.body)

    this.headlight = document.createElement('div')
    this.headlight.className = 'car-headlight'
    this.element.appendChild(this.headlight)

    this.shadowEl = document.createElement('div')
    this.shadowEl.className = 'car-shadow'
    this.element.appendChild(this.shadowEl)

    this.currentVbPos = null
    this.timeline = null
    this.idleTween = null
    this.glowTween = null
    this.currentAngle = 0

    this.trailDots = []
    for (let i = 0; i < 6; i++) {
      const dot = document.createElement('div')
      dot.className = 'car-trail-dot'
      dot.style.opacity = '0'
      this.trailDots.push(dot)
    }
  }

  toPixels(vbx, vby) {
    const parent = this.element.parentElement
    if (!parent) return { x: vbx, y: vby }
    return {
      x: (vbx / VIEWBOX_W) * parent.clientWidth,
      y: (vby / VIEWBOX_H) * parent.clientHeight,
    }
  }

  getPosition() {
    return this.currentVbPos
  }

  setPosition(vbx, vby) {
    this.currentVbPos = { x: vbx, y: vby }
    const { x, y } = this.toPixels(vbx, vby)
    this.element.style.left = `${x}px`
    this.element.style.top = `${y}px`
  }

  syncPosition() {
    if (!this.currentVbPos) return
    this.element.style.transform = ''
    gsap.set(this.body, { y: 0 })
    const { x, y } = this.toPixels(this.currentVbPos.x, this.currentVbPos.y)
    this.element.style.left = `${x}px`
    this.element.style.top = `${y}px`
    this.trailDots.forEach(d => { d.style.opacity = '0' })
    this.startIdleAnimation()
  }

  startIdleAnimation() {
    if (this.idleTween) this.idleTween.kill()
    this.idleTween = gsap.to(this.body, {
      y: -1.5,
      duration: 0.8,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    })

    if (this.glowTween) this.glowTween.kill()
    this.glowTween = gsap.to(this.element, {
      boxShadow: '0 0 20px rgba(245,158,11,.25), 0 6px 12px rgba(0,0,0,.7)',
      duration: 1.2,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    })

    if (this.headlightTween) this.headlightTween.kill()
    this.headlightTween = gsap.to(this.headlight, {
      opacity: 0.8,
      duration: 1.0,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    })
  }

  stopIdleAnimation() {
    if (this.idleTween) {
      this.idleTween.kill()
      this.idleTween = null
    }
    if (this.glowTween) {
      this.glowTween.kill()
      this.glowTween = null
    }
    if (this.headlightTween) {
      this.headlightTween.kill()
      this.headlightTween = null
    }
    gsap.set(this.body, { y: 0 })
    this.element.style.boxShadow = ''
    this.headlight.style.opacity = '1'
  }

  moveThrough(stations, duration = 1.2) {
    if (stations.length < 2) return

    this.stopIdleAnimation()
    audio.play('move')
    if (this.timeline) this.timeline.kill()
    this.trailDots.forEach(d => gsap.killTweensOf(d))

    const dest = stations[stations.length - 1]
    const numSegs = stations.length - 1

    const segments = []
    for (let i = 0; i < numSegs; i++) {
      const from = stations[i]
      const to = stations[i + 1]
      const { cp1, cp2 } = computeCubicControlPoints(stations, i)
      segments.push({
        p0: this.toPixels(from.x, from.y),
        p1: this.toPixels(cp1.x, cp1.y),
        p2: this.toPixels(cp2.x, cp2.y),
        p3: this.toPixels(to.x, to.y),
      })
    }

    this.element.style.transform = ''
    this.element.style.left = `${segments[0].p0.x}px`
    this.element.style.top = `${segments[0].p0.y}px`

    const parent = this.element.parentElement
    this.trailDots.forEach((dot, i) => {
      if (dot.parentElement !== parent) parent.appendChild(dot)
      const p = getPos(segments, 0)
      dot.style.left = `${p.x}px`
      dot.style.top = `${p.y}px`
      dot.style.opacity = `${1 - (i + 1) / (this.trailDots.length + 1)}`
    })

    const state = { progress: 0 }

    this.timeline = gsap.timeline({
      onUpdate: () => {
        const pt = getPos(segments, state.progress)
        this.element.style.left = `${pt.x}px`
        this.element.style.top = `${pt.y}px`

        const raw = state.progress * numSegs
        const idx = Math.min(Math.floor(raw), numSegs - 1)
        const t = Math.min(raw - idx, 1)
        const seg = segments[idx]
        const deriv = cubicBezierDerivative(seg.p0, seg.p1, seg.p2, seg.p3, t)
        const angle = Math.atan2(deriv.y, deriv.x) * (180 / Math.PI)
        this.currentAngle = angle
        this.element.style.transform = `rotate(${angle}deg)`
        this.shadowEl.style.transform = `rotate(${-angle}deg) skewX(${20 + Math.abs(angle) * 0.2}deg)`

        this.trailDots.forEach((dot, i) => {
          const p = getPos(segments, Math.max(0, state.progress - (i + 1) * 0.025))
          dot.style.left = `${p.x}px`
          dot.style.top = `${p.y}px`
        })
      },
      onComplete: () => {
        const end = segments[numSegs - 1].p3
        this.element.style.left = `${end.x}px`
        this.element.style.top = `${end.y}px`
        this.element.style.transform = ''
        gsap.set(this.body, { y: 0 })

        this.currentVbPos = { x: dest.x, y: dest.y }
        this.trailDots.forEach(d => {
          gsap.to(d, { opacity: 0, duration: 0.4, ease: 'power2.out' })
        })
        this.startIdleAnimation()
        eventBus.emit('car:arrived', { x: dest.x, y: dest.y })
        audio.play('unlock')
      },
    })

    this.timeline
      .to(state, { progress: 0.93, duration: duration * 0.82, ease: 'power4.out' })
      .to(state, { progress: 1, duration: duration * 0.18, ease: 'back.out(1.7)' })
  }

  destroy() {
    this.stopIdleAnimation()
    if (this.timeline) this.timeline.kill()
    this.trailDots.forEach(d => d.remove())
    this.element.remove()
  }
}

export const car = new Car()
