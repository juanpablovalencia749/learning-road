import { eventBus } from './core/EventBus.js'
import { store } from './core/Store.js'
import { router } from './core/Router.js'
import { audio } from './core/AudioManager.js'
import { guide } from './components/Guide.js'
import { registerMinigame, getMinigame } from './minigames/registry.js'
import WordSearch from './minigames/WordSearch/WordSearch.js'
import Placeholder from './minigames/Placeholder.js'
import EppDrag from './minigames/EppDrag/EppDrag.js'
import SenalClasif from './minigames/SenalClasif/SenalClasif.js'
import Quiz from './minigames/Quiz/Quiz.js'
import Sequence from './minigames/Sequence/Sequence.js'
import Modal from './components/Modal.js'
import { stations } from './data/stations.js'

registerMinigame('word-search', WordSearch)
registerMinigame('placeholder', Placeholder)
registerMinigame('epp-drag', EppDrag)
registerMinigame('senal-clasif', SenalClasif)
registerMinigame('quiz', Quiz)
registerMinigame('sequence', Sequence)

export default class App {
  init() {
    audio.init()

    if (store.get('unlockedStations')?.length === 0) {
      store.unlockStation(0)
    }

    eventBus.on('map:open-minigame', (stationId) => {
      const station = stations.find(s => s.id === stationId)
      if (!station) return

      const MinigameClass = getMinigame(station.type)
      if (!MinigameClass) return

      const minigame = new MinigameClass(stationId)
      router.showMinigame(minigame)
    })

    eventBus.on('minigame:completed', (stationId) => {
      store.completeStation(stationId)
      const completed = store.get('completedStations') || []
      new Modal({
        title: '🎉 ¡Estación completada!',
        content: `<p>Has superado el reto de esta estación.</p>`,
        onConfirm: () => {
          router.showMap()
        },
      })
    })

    eventBus.on('minigame:back', () => {
      router.showMap()
    })

    router.showMap()
  }
}
