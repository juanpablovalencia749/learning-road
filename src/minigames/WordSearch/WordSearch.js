import BaseMinigame from '../BaseMinigame.js'
import { SST_WORDS } from './words.js'
import { shuffle } from '../../utils/random.js'
import { audio } from '../../core/AudioManager.js'

const GRID_SIZE = 14

const DIRECTIONS = [
  [0, 1], [1, 0], [0, -1], [-1, 0],
  [1, 1], [-1, -1], [1, -1], [-1, 1],
]

export default class WordSearch extends BaseMinigame {
  constructor(stationId) {
    super(stationId)
    this.grid = []
    this.placedWords = []
    this.foundWords = new Set()
    this.selectedCells = []
    this.isSelecting = false
  }

  start() {
    this.element.innerHTML = ''
    this.createBackButton()
    this.createTitle('🔤 Sopa de Letras — SST')

    const words = shuffle(SST_WORDS).slice(0, 6)
    this.wordsToFind = words
    this.grid = this.buildGrid(words)

    const layout = document.createElement('div')
    layout.className = 'wordsearch-layout'

    const gridContainer = document.createElement('div')
    gridContainer.className = 'wordsearch-grid'
    gridContainer.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`

    this.cells = []
    for (let r = 0; r < GRID_SIZE; r++) {
      this.cells[r] = []
      for (let c = 0; c < GRID_SIZE; c++) {
        const cell = document.createElement('button')
        cell.className = 'ws-cell'
        cell.textContent = this.grid[r][c]
        cell.dataset.row = r
        cell.dataset.col = c
        gridContainer.appendChild(cell)
        this.cells[r][c] = cell
      }
    }
    layout.appendChild(gridContainer)

    const wordList = document.createElement('div')
    wordList.className = 'wordsearch-words'
    this.wordElements = []
    for (const w of words) {
      const el = document.createElement('div')
      el.className = 'ws-word'
      el.innerHTML = `<span class="ws-word-text">${w.word}</span> <span class="ws-word-hint">${w.hint}</span>`
      wordList.appendChild(el)
      this.wordElements.push(el)
    }
    layout.appendChild(wordList)
    this.element.appendChild(layout)

    this.bindEvents()

    this.messageEl = document.createElement('div')
    this.messageEl.className = 'ws-message'
    this.element.appendChild(this.messageEl)

    this.createSkipButton()
  }

  buildGrid(words) {
    const grid = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => null)
    )

    for (const { word } of words) {
      this.placeWord(grid, word.toUpperCase())
    }

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!grid[r][c]) {
          grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26))
        }
      }
    }

    return grid
  }

  placeWord(grid, word) {
    const maxAttempts = 200
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
      const startR = Math.floor(Math.random() * GRID_SIZE)
      const startC = Math.floor(Math.random() * GRID_SIZE)

      if (this.canPlace(grid, word, startR, startC, dir)) {
        for (let i = 0; i < word.length; i++) {
          grid[startR + dir[0] * i][startC + dir[1] * i] = word[i]
        }
        this.placedWords.push({ word, startR, startC, dir })
        return
      }
    }
  }

  canPlace(grid, word, r, c, dir) {
    for (let i = 0; i < word.length; i++) {
      const nr = r + dir[0] * i
      const nc = c + dir[1] * i
      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) return false
      if (grid[nr][nc] !== null && grid[nr][nc] !== word[i]) return false
    }
    return true
  }

  bindEvents() {
    const gridEl = this.element.querySelector('.wordsearch-grid')

    const getCell = (e) => {
      const cell = e.target.closest('.ws-cell')
      if (!cell || cell.classList.contains('found')) return null
      return cell
    }

    const onPointerDown = (e) => {
      const cell = getCell(e)
      if (!cell) return
      this.isSelecting = true
      this.selectedCells = [cell]
      cell.classList.add('selecting')
    }

    const onPointerOver = (e) => {
      if (!this.isSelecting) return
      const cell = getCell(e)
      if (!cell || this.selectedCells.includes(cell)) return

      const last = this.selectedCells[this.selectedCells.length - 1]
      const lr = +last.dataset.row
      const lc = +last.dataset.col
      const cr = +cell.dataset.row
      const cc = +cell.dataset.col

      const dr = Math.sign(cr - lr)
      const dc = Math.sign(cc - lc)

      if (dr === 0 && dc === 0) return

      const prev = this.selectedCells[this.selectedCells.length - 2]
      if (prev) {
        const pr = +prev.dataset.row
        const pc = +prev.dataset.col
        const pdr = Math.sign(lr - pr)
        const pdc = Math.sign(lc - pc)
        if (dr !== pdr || dc !== pdc) return
      }

      let r = lr + dr
      let c = lc + dc
      const cellsToAdd = []
      while (r !== cr || c !== cc) {
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return
        const mid = this.cells[r][c]
        if (!mid || mid.classList.contains('found')) return
        cellsToAdd.push(mid)
        r += dr
        c += dc
      }
      if (this.selectedCells.includes(cell)) return

      for (const mid of cellsToAdd) {
        this.selectedCells.push(mid)
        mid.classList.add('selecting')
      }
      this.selectedCells.push(cell)
      cell.classList.add('selecting')
    }

    const onPointerUp = () => {
      if (!this.isSelecting) return
      this.isSelecting = false
      this.checkSelection()
    }

    gridEl.addEventListener('pointerdown', onPointerDown)
    gridEl.addEventListener('pointerover', onPointerOver)
    document.addEventListener('pointerup', onPointerUp)

    this.cleanupEvents = () => {
      gridEl.removeEventListener('pointerdown', onPointerDown)
      gridEl.removeEventListener('pointerover', onPointerOver)
      document.removeEventListener('pointerup', onPointerUp)
    }
  }

  checkSelection() {
    const word = this.selectedCells.map(c => c.textContent).join('')
    const reversed = [...this.selectedCells].reverse().map(c => c.textContent).join('')

    const found = this.wordsToFind.find(
      w => !this.foundWords.has(w.word) && (w.word === word || w.word === reversed)
    )

    if (found) {
      this.foundWords.add(found.word)
      this.selectedCells.forEach(c => {
        c.classList.remove('selecting')
        c.classList.add('found')
      })
      audio.play('success')

      const idx = this.wordsToFind.indexOf(found)
      if (this.wordElements[idx]) {
        this.wordElements[idx].classList.add('found')
      }

      if (this.foundWords.size === this.wordsToFind.length) {
        this.showComplete()
      } else {
        this.showMessage(`¡Encontraste: ${found.word}!`, 'success')
      }
    } else {
      this.selectedCells.forEach(c => {
        c.classList.remove('selecting')
        c.classList.add('wrong')
        setTimeout(() => c.classList.remove('wrong'), 400)
      })
    }

    this.selectedCells = []
  }

  showComplete() {
    this.messageEl.textContent = '🎉 ¡Completaste la sopa de letras!'
    this.messageEl.className = 'ws-message success'

    import('@tsparticles/confetti').then(({ default: confetti }) => {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    })

    this.complete()
  }

  showMessage(text, type) {
    this.messageEl.textContent = text
    this.messageEl.className = `ws-message ${type}`
    setTimeout(() => {
      this.messageEl.className = 'ws-message'
    }, 2000)
  }

  destroy() {
    if (this.cleanupEvents) this.cleanupEvents()
    super.destroy()
  }
}
