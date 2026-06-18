export function computeCubicControlPoints(points, index) {
  const p1 = points[index]
  const p2 = points[index + 1]

  const pPrev = index > 0 ? points[index - 1] : {
    x: p1.x - (p2.x - p1.x),
    y: p1.y - (p2.y - p1.y),
  }
  const pNext = index < points.length - 2 ? points[index + 2] : {
    x: p2.x + (p2.x - p1.x),
    y: p2.y + (p2.y - p1.y),
  }

  return {
    cp1: {
      x: p1.x + (p2.x - pPrev.x) / 6,
      y: p1.y + (p2.y - pPrev.y) / 6,
    },
    cp2: {
      x: p2.x - (pNext.x - p1.x) / 6,
      y: p2.y - (pNext.y - p1.y) / 6,
    },
  }
}

export function cubicBezier(p0, p1, p2, p3, t) {
  const mt = 1 - t
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
  }
}

export function cubicBezierDerivative(p0, p1, p2, p3, t) {
  const mt = 1 - t
  return {
    x: 3 * mt * mt * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
    y: 3 * mt * mt * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y),
  }
}
