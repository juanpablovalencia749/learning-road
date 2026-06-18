export const roadPath = {
  points: [
    { x: 160, y: 130 },   // 0  — S0 Bienvenida
    { x: 230, y: 210 },   // 1  — waypoint
    { x: 300, y: 110 },   // 2  — S1 Fundamentos
    { x: 370, y: 200 },   // 3  — waypoint
    { x: 440, y: 110 },   // 4  — S2 Seguridad
    { x: 510, y: 210 },   // 5  — waypoint
    { x: 580, y: 130 },   // 6  — S3 Mantenimiento
    { x: 650, y: 220 },   // 7  — waypoint
    { x: 720, y: 160 },   // 8  — S4 Atención al Cliente
    { x: 750, y: 230 },   // 9  — waypoint (curva a row 2)
    { x: 460, y: 250 },   // 10 — waypoint
    { x: 190, y: 230 },   // 11 — waypoint
    { x: 180, y: 260 },   // 12 — S5 Eficiencia
    { x: 250, y: 340 },   // 13 — waypoint
    { x: 320, y: 270 },   // 14 — S6 Normas
    { x: 390, y: 340 },   // 15 — waypoint
    { x: 460, y: 260 },   // 16 — S7 Peajes
    { x: 530, y: 350 },   // 17 — waypoint
    { x: 600, y: 270 },   // 18 — S8 Emergencias
    { x: 670, y: 340 },   // 19 — waypoint
    { x: 740, y: 280 },   // 20 — S9 Conducción Eco
    { x: 780, y: 340 },   // 21 — waypoint (curva a row 3)
    { x: 460, y: 360 },   // 22 — waypoint
    { x: 190, y: 360 },   // 23 — waypoint
    { x: 180, y: 400 },   // 24 — S10 Trabajo Equipo
    { x: 250, y: 470 },   // 25 — waypoint
    { x: 320, y: 420 },   // 26 — S11 Productividad
    { x: 390, y: 470 },   // 27 — waypoint
    { x: 460, y: 410 },   // 28 — S12 Herramientas
    { x: 530, y: 480 },   // 29 — waypoint
    { x: 600, y: 420 },   // 30 — S13 Ética
    { x: 670, y: 470 },   // 31 — waypoint
    { x: 740, y: 390 },   // 32 — S14 Desafío Final
  ],

  stationIndex: {
    0: 0,
    1: 2,
    2: 4,
    3: 6,
    4: 8,
    5: 12,
    6: 14,
    7: 16,
    8: 18,
    9: 20,
    10: 24,
    11: 26,
    12: 28,
    13: 30,
    14: 32,
  },
}

export function getSegmentGroup(pointIdx) {
  for (let s = 0; s < 14; s++) {
    const start = roadPath.stationIndex[s]
    const end = roadPath.stationIndex[s + 1]
    if (pointIdx >= start && pointIdx < end) return s
  }
  return 13
}
