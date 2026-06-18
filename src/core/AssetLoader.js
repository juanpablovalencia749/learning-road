const imageCache = new Map()
let loadingCount = 0
let loadedCount = 0
let onProgress = null

function assetUrl(subpath) {
  return new URL(`../assets/${subpath}`, import.meta.url).href
}

export function setProgressCallback(fn) {
  onProgress = fn
}

export function loadImage(subpath) {
  if (imageCache.has(subpath)) return Promise.resolve(imageCache.get(subpath))
  loadingCount++
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      imageCache.set(subpath, img)
      loadedCount++
      if (onProgress) onProgress(loadedCount, loadingCount)
      resolve(img)
    }
    img.onerror = () => {
      loadedCount++
      console.warn(`Failed to load: ${subpath}`)
      resolve(null)
    }
    img.src = assetUrl(subpath)
  })
}

export function getImage(subpath) {
  return imageCache.get(subpath) || null
}

export function getUrl(subpath) {
  return assetUrl(subpath)
}

export function loadAll(urls) {
  return Promise.all(urls.map(u => loadImage(u)))
}

export function resetCache() {
  imageCache.clear()
  loadingCount = 0
  loadedCount = 0
}
