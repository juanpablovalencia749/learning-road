export const minigameRegistry = new Map()

export function registerMinigame(id, MinigameClass) {
  minigameRegistry.set(id, MinigameClass)
}

export function getMinigame(id) {
  return minigameRegistry.get(id)
}
