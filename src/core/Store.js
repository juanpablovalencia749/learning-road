import { eventBus } from './EventBus.js'

const STORAGE_KEY = 'learning-road-progress'

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveProgress(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* quota exceeded */ }
}

export default class Store {
  constructor(initialState) {
    const saved = loadProgress()
    this.state = { ...initialState, ...saved }
  }

  get(key) {
    return this.state[key]
  }

  set(key, value) {
    this.state[key] = value
    saveProgress(this.state)
    eventBus.emit('store:changed', { key, value })
  }

  completeStation(id) {
    const completed = [...(this.state.completedStations || [])]
    if (!completed.includes(id)) {
      completed.push(id)
      this.set('completedStations', completed)
    }
    const nextIndex = completed.length
    if (nextIndex < this.state.totalStations) {
      this.unlockStation(nextIndex)
    }
  }

  unlockStation(index) {
    const unlocked = [...(this.state.unlockedStations || [])]
    if (!unlocked.includes(index)) {
      unlocked.push(index)
      this.set('unlockedStations', unlocked)
    }
  }

  isCompleted(id) {
    return (this.state.completedStations || []).includes(id)
  }

  isUnlocked(index) {
    return (this.state.unlockedStations || []).includes(index)
  }

  reset() {
    localStorage.removeItem(STORAGE_KEY)
    this.state = {
      completedStations: [],
      unlockedStations: [0],
      totalStations: 0,
      currentStation: null,
    }
    eventBus.emit('store:reset')
  }
}

export const store = new Store({
  completedStations: [],
  unlockedStations: [0],
  totalStations: 0,
  currentStation: null,
})
