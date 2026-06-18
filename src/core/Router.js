import { eventBus } from './EventBus.js'
import { mapView } from '../components/Map.js'

class Router {
  constructor() {
    this.container = document.getElementById('app')
    this.currentView = null
  }

  showMap() {
    this.clear()
    this.currentView = mapView
    this.container.appendChild(mapView.element)
    mapView.render()
    eventBus.emit('router:map')
  }

  showMinigame(minigame) {
    this.clear()
    const wrapper = document.createElement('div')
    wrapper.className = 'minigame-wrapper'
    wrapper.appendChild(minigame.element)
    this.container.appendChild(wrapper)
    this.currentView = minigame
    minigame.start()
    eventBus.emit('router:minigame', minigame)
  }

  clear() {
    if (this.currentView && this.currentView.destroy) {
      this.currentView.destroy()
    }
    this.container.innerHTML = ''
  }
}

export const router = new Router()
