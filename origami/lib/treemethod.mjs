// Método del árbol (diseño de origami, R. J. Lang): cada hoja del árbol es una
// solapa del modelo y se representa con un círculo sobre el cuadrado de papel.
// Dos solapas i, j deben quedar a una distancia mínima igual a la longitud del
// camino entre ellas en el árbol (escalada por s). Maximizar s da el modelo más
// grande posible. Aquí se resuelve con una relajación iterativa (heurística, no
// el optimizador exacto de TreeMaker) y los huecos se rellenan con moléculas de
// "oreja de conejo" sobre una triangulación de Delaunay.

const LEAF = 1 // longitud de la solapa de un archivo
const RIVER = 0.45 // ancho del "río" que añade cada carpeta

// Aplana un árbol podado (de herbario/lib/plant.mjs) en hojas con su ascendencia.
export function flaps(tree) {
  const out = []
  const walk = (n, chain) => {
    for (const f of n.files) out.push({ name: f.name, kind: f.kind, chain })
    for (const d of n.dirs.values()) walk(d, [...chain, d])
  }
  walk(tree, [])
  return out
}

// Recorta un árbol a un máximo de solapas: quita archivos de las carpetas con más
// archivos primero, para que la forma del árbol se mantenga.
export function capFlaps(tree, max) {
  const nodes = []
  const walk = (n) => {
    nodes.push(n)
    for (const d of n.dirs.values()) walk(d)
  }
  walk(tree)
  let total = nodes.reduce((a, n) => a + n.files.length, 0)
  while (total > max) {
    const n = nodes.reduce((a, b) => (b.files.length > a.files.length ? b : a))
    if (!n.files.length) break
    n.files = n.files.slice(0, -1)
    total--
  }
  return tree
}

// Longitud del camino en el árbol entre dos solapas.
export function pathLength(a, b) {
  let k = 0
  while (k < a.chain.length && k < b.chain.length && a.chain[k] === b.chain[k]) k++
  return 2 * LEAF + RIVER * (a.chain.length - k + b.chain.length - k)
}

// Posiciones iniciales a lo largo del borde del papel, en orden de recorrido:
// las solapas hermanas quedan juntas y el borde da las solapas más largas.
function perimeter(n, rand) {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * 4 + 0.15
    const side = Math.floor(t)
    const u = t - side
    const j = (rand() - 0.5) * 0.02
    return [
      { x: u, y: 0 + j },
      { x: 1 + j, y: u },
      { x: 1 - u, y: 1 + j },
      { x: 0 + j, y: 1 - u },
    ][side % 4]
  })
}

function mixed(n, rand) {
  const edge = Math.min(n, Math.round(3.2 * Math.sqrt(n)))
  const ring = perimeter(edge, rand)
  const rest = n - edge
  const k = Math.ceil(Math.sqrt(rest))
  const inner = Array.from({ length: rest }, (_, i) => {
    const row = Math.floor(i / k)
    const col = row % 2 ? k - 1 - (i % k) : i % k
    return { x: 0.18 + (0.64 * (col + 0.5)) / k + (rand() - 0.5) * 0.01, y: 0.18 + (0.64 * (row + 0.5)) / k + (rand() - 0.5) * 0.01 }
  })
  // Intercala para que las hermanas (contiguas en el recorrido) queden cerca.
  const out = []
  let a = 0
  let b = 0
  for (let i = 0; i < n; i++) out.push(i % Math.ceil(n / edge) === 0 && a < edge ? ring[a++] : b < rest ? inner[b++] : ring[a++])
  return out
}

function relax(pos, L, s, iters) {
  const n = pos.length
  const p = pos.map((q) => ({ ...q }))
  let worst = 0
  for (let it = 0; it < iters; it++) {
    worst = 0
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = p[j].x - p[i].x
        let dy = p[j].y - p[i].y
        let d = Math.hypot(dx, dy)
        const need = s * L[i][j]
        if (d >= need) continue
        if (d < 1e-9) {
          dx = Math.cos(i * 2.39996 + j)
          dy = Math.sin(i * 2.39996 + j)
          d = 1
        }
        const push = (need - Math.hypot(p[j].x - p[i].x, p[j].y - p[i].y)) / 2
        worst = Math.max(worst, push * 2)
        p[i].x -= (dx / d) * push
        p[i].y -= (dy / d) * push
        p[j].x += (dx / d) * push
        p[j].y += (dy / d) * push
      }
    }
    for (const q of p) {
      q.x = Math.min(1, Math.max(0, q.x))
      q.y = Math.min(1, Math.max(0, q.y))
    }
    if (worst < 1e-5) break
  }
  return { p, worst }
}

// Empaqueta las solapas. Primero una búsqueda binaria de la escala s desde el
// borde del papel; después se intenta inflar un poco más con pequeños temblores
// (solo se aceptan mejoras). Devuelve centros en [0,1]², la escala s y los caminos.
export function pack(fl, rand) {
  const n = fl.length
  const L = fl.map((a) => fl.map((b) => (a === b ? 0 : pathLength(a, b))))
  const maxL = Math.max(...L.flat())
  // Dos arranques: todo en el borde (óptimo para pocas solapas) o borde más un
  // interior en serpentina (llena el centro cuando hay muchas). Gana la mayor escala.
  const search = (start) => {
    let lo = 0
    let hi = Math.SQRT2 / maxL
    let pos = start
    for (let step = 0; step < 18; step++) {
      const s = (lo + hi) / 2
      const r = relax(pos, L, s, 260)
      if (r.worst < 1e-3) {
        lo = s
        pos = r.p
      } else hi = s
    }
    return { s: lo, p: pos }
  }
  const starts = [perimeter(n, rand)]
  if (n > 12) starts.push(mixed(n, rand))
  const found = starts.map(search).sort((a, b) => b.s - a.s)[0]
  let best = found.p
  let s = found.s
  for (let tries = 0, fails = 0; tries < 160 && fails < 30; tries++) {
    const shake = 0.012 * (1 - tries / 160)
    const moved = best.map((q) => ({
      x: Math.min(1, Math.max(0, q.x + (rand() - 0.5) * shake)),
      y: Math.min(1, Math.max(0, q.y + (rand() - 0.5) * shake)),
    }))
    const r = relax(moved, L, s * 1.01, 200)
    if (r.worst < 1e-3) {
      s *= 1.01
      best = r.p
      fails = 0
    } else fails++
  }
  const final = relax(best, L, s, 400).p
  return { centers: final, scale: s, L }
}

// ---------------------------------------------------------------------------
// Delaunay (Bowyer–Watson), suficiente para unas decenas de puntos.

function circumcircle(a, b, c) {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y))
  if (Math.abs(d) < 1e-12) return { x: 0, y: 0, r2: Infinity }
  const a2 = a.x * a.x + a.y * a.y
  const b2 = b.x * b.x + b.y * b.y
  const c2 = c.x * c.x + c.y * c.y
  const x = (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d
  const y = (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d
  return { x, y, r2: (a.x - x) ** 2 + (a.y - y) ** 2 }
}

export function delaunay(points) {
  const pts = [...points, { x: -10, y: -10 }, { x: 12, y: -10 }, { x: 0.5, y: 14 }]
  const n = points.length
  let tris = [{ v: [n, n + 1, n + 2] }]
  tris[0].c = circumcircle(pts[n], pts[n + 1], pts[n + 2])
  for (let k = 0; k < n; k++) {
    const p = pts[k]
    const bad = tris.filter((t) => (p.x - t.c.x) ** 2 + (p.y - t.c.y) ** 2 < t.c.r2 - 1e-12)
    const edges = new Map()
    for (const t of bad) {
      for (const [a, b] of [[t.v[0], t.v[1]], [t.v[1], t.v[2]], [t.v[2], t.v[0]]]) {
        const key = a < b ? `${a}-${b}` : `${b}-${a}`
        edges.set(key, edges.has(key) ? null : [a, b])
      }
    }
    tris = tris.filter((t) => !bad.includes(t))
    for (const e of edges.values()) {
      if (!e) continue
      const v = [e[0], e[1], k]
      tris.push({ v, c: circumcircle(pts[v[0]], pts[v[1]], pts[v[2]]) })
    }
  }
  return tris.filter((t) => t.v.every((i) => i < n)).map((t) => t.v)
}

// ---------------------------------------------------------------------------
// Patrón de pliegue: aristas axiales, bisectrices de oreja de conejo y bisagras.

export function creasePattern(fl, rand) {
  const { centers, scale, L } = pack(fl, rand)
  const nodes = centers.map((c, i) => ({ ...c, leaf: i }))
  // Las esquinas del papel cierran la triangulación sobre todo el cuadrado.
  for (const c of [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }]) {
    if (!nodes.some((q) => Math.hypot(q.x - c.x, q.y - c.y) < 0.03)) nodes.push({ ...c, leaf: -1 })
  }
  const tris = delaunay(nodes)
  const seen = new Set()
  const valley = []
  const mountain = []
  const bisect = { valley: [], mountain: [] }
  const hinge = []

  const active = (i, j) => {
    const a = nodes[i]
    const b = nodes[j]
    if (a.leaf < 0 || b.leaf < 0) return false
    return Math.hypot(a.x - b.x, a.y - b.y) <= scale * L[a.leaf][b.leaf] * 1.04
  }

  for (const [i, j, k] of tris) {
    for (const [a, b] of [[i, j], [j, k], [k, i]]) {
      const key = a < b ? `${a}-${b}` : `${b}-${a}`
      if (seen.has(key)) continue
      seen.add(key)
      ;(active(a, b) ? valley : mountain).push([nodes[a], nodes[b]])
    }
    // Molécula de oreja de conejo: bisectrices al incentro y bisagras perpendiculares.
    const A = nodes[i]
    const B = nodes[j]
    const C = nodes[k]
    const a = Math.hypot(B.x - C.x, B.y - C.y)
    const b = Math.hypot(A.x - C.x, A.y - C.y)
    const c = Math.hypot(A.x - B.x, A.y - B.y)
    const per = a + b + c
    if (per < 1e-9) continue
    const I = { x: (a * A.x + b * B.x + c * C.x) / per, y: (a * A.y + b * B.y + c * C.y) / per }
    // La bisectriz desde el ángulo mayor (opuesto al lado mayor) es la cresta de la solapa: monte.
    const sides = [a, b, c]
    const big = sides.indexOf(Math.max(...sides))
    ;[A, B, C].forEach((V, idx) => (idx === big ? bisect.mountain : bisect.valley).push([V, I]))
    for (const [P, Q] of [[B, C], [A, C], [A, B]]) {
      const dx = Q.x - P.x
      const dy = Q.y - P.y
      const t = ((I.x - P.x) * dx + (I.y - P.y) * dy) / (dx * dx + dy * dy)
      hinge.push([I, { x: P.x + t * dx, y: P.y + t * dy }])
    }
  }

  // Ríos: cada carpeta reserva una banda alrededor de sus solapas. El contorno
  // exterior de la carpeta D alrededor de la solapa i está a s·(LEAF + RIVER·(k − m)),
  // con k la profundidad de la solapa y m la de D.
  const rivers = new Map()
  fl.forEach((f, i) => {
    f.chain.forEach((D, m) => {
      const r = scale * (LEAF + RIVER * (f.chain.length - m))
      if (!rivers.has(D)) rivers.set(D, { depth: m, name: D.name, discs: [] })
      rivers.get(D).discs.push({ ...centers[i], r })
    })
  })

  return {
    centers,
    radius: scale * LEAF,
    rivers: [...rivers.values()].sort((a, b) => a.depth - b.depth),
    valley,
    mountain,
    bisect,
    hinge,
    flaps: fl.length,
  }
}

// ---------------------------------------------------------------------------
// Figura de alambre de la base (el árbol tal como queda plegado), en coordenadas
// centradas en 0 con radio máximo 1.

export function stickFigure(tree) {
  const count = (n) => n.files.length + [...n.dirs.values()].reduce((a, d) => a + count(d), 0)
  const segs = []
  const tips = []
  const walk = (n, origin, a0, a1) => {
    const total = Math.max(1, count(n))
    let a = a0
    const items = [...[...n.dirs.values()].map((d) => ({ d, w: count(d) })), ...n.files.map((f) => ({ f, w: 1 }))]
    for (const it of items) {
      const span = ((a1 - a0) * it.w) / total
      const mid = a + span / 2
      const len = it.d ? RIVER * 1.6 : LEAF
      const end = { x: origin.x + Math.cos(mid) * len, y: origin.y + Math.sin(mid) * len }
      segs.push([origin, end, it.d ? 'river' : 'flap'])
      if (it.d) walk(it.d, end, a, a + span)
      else tips.push(end)
      a += span
    }
  }
  walk(tree, { x: 0, y: 0 }, -Math.PI / 2, (3 * Math.PI) / 2)
  const R = Math.max(...segs.flatMap(([p, q]) => [Math.hypot(p.x, p.y), Math.hypot(q.x, q.y)]))
  const k = 1 / R
  return {
    segs: segs.map(([p, q, t]) => [{ x: p.x * k, y: p.y * k }, { x: q.x * k, y: q.y * k }, t]),
    tips: tips.map((p) => ({ x: p.x * k, y: p.y * k })),
  }
}
