export function qs(selector, parent = document) {
  return parent.querySelector(selector)
}

export function qsa(selector, parent = document) {
  return [...parent.querySelectorAll(selector)]
}

export function createEl(tag, attrs = {}, children = []) {
  const el = document.createElement(tag)
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = val
    } else if (key.startsWith('data-')) {
      el.dataset[key.slice(5)] = val
    } else if (key === 'innerHTML') {
      el.innerHTML = val
    } else {
      el.setAttribute(key, val)
    }
  }
  for (const child of children) {
    el.append(typeof child === 'string' ? document.createTextNode(child) : child)
  }
  return el
}

export function on(el, event, handler, opts = {}) {
  el.addEventListener(event, handler, opts)
  return () => el.removeEventListener(event, handler, opts)
}
