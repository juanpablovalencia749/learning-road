import { Howl } from 'howler'

const SOUNDS = {
  click: '/sounds/click.mp3',
  unlock: '/sounds/unlock.mp3',
  complete: '/sounds/complete.mp3',
  move: '/sounds/move.mp3',
  error: '/sounds/error.mp3',
  success: '/sounds/success.mp3',
  bgm: '/sounds/bgm.mp3',
}

class AudioManager {
  constructor() {
    this.sounds = {}
    this.muted = false
  }

  init() {
    for (const [name, src] of Object.entries(SOUNDS)) {
      this.sounds[name] = new Howl({
        src: [src.replace('.mp3', '.ogg'), src],
        preload: true,
        volume: name === 'bgm' ? 0.3 : 0.6,
        loop: name === 'bgm',
      })
    }
  }

  play(name) {
    if (this.muted) return
    this.sounds[name]?.play()
  }

  stop(name) {
    this.sounds[name]?.stop()
  }

  toggleMute() {
    this.muted = !this.muted
    if (this.muted) {
      Howler.mute(true)
    } else {
      Howler.mute(false)
    }
    return this.muted
  }

  setVolume(vol) {
    Howler.volume(vol)
  }
}

export const audio = new AudioManager()
