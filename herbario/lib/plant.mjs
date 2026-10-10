// De árbol de archivos a planta prensada.
// Tallo = raíz del repo, ramas = carpetas, hojas = archivos (la forma depende
// del tipo), raíces = archivos sueltos en la raíz del repositorio.
// Todo es determinista: la misma estructura produce siempre la misma planta.

export function seeded(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const IGNORE = /(^|\/)(node_modules|\.git|dist|build|out|\.next|vendor|Pods|\.dart_tool|\.idea|\.vscode)(\/|$)/

const KINDS = [
  ['test', /(^|\/)(tests?|__tests__|spec)\/|\.(test|spec)\.[a-z]+$/i],
  ['code', /\.(ts|tsx|js|jsx|mjs|cjs|py|java|kt|kts|dart|cs|go|rs|rb|php|c|cc|cpp|h|hpp|swift|vue|svelte|sql|sh|ps1|bas|frm|vb)$/i],
  ['style', /\.(css|scss|sass|less|html|htm|xml|xaml)$/i],
  ['doc', /\.(md|mdx|txt|rst|pdf|docx?)$|(^|\/)(LICENSE|README)[^/]*$/i],
  ['asset', /\.(png|jpe?g|gif|svg|webp|ico|ttf|otf|woff2?|mp3|wav|mp4|webm|glb|gltf|tflite|onnx|pt|h5)$/i],
  ['data', /\.(json|ya?ml|toml|ini|env|lock|gradle|properties|cfg|conf|plist|csv|xcconfig|pbxproj)$|(^|\/)(\.[a-z]+rc|\.gitignore|\.gitattributes|Dockerfile|Makefile|[^/]*\.config\.[a-z]+)$/i],
]

export function kindOf(path) {
  for (const [k, re] of KINDS) if (re.test(path)) return k
  return 'other'
}

export function hierarchy(files) {
  const root = { name: '', dirs: new Map(), files: [] }
  for (const f of files) {
    if (IGNORE.test(f.path)) continue
    const parts = f.path.split('/')
    let node = root
    for (const p of parts.slice(0, -1)) {
      if (!node.dirs.has(p)) node.dirs.set(p, { name: p, dirs: new Map(), files: [] })
      node = node.dirs.get(p)
    }
    node.files.push({ name: parts.at(-1), path: f.path, size: f.size, kind: kindOf(f.path) })
  }
  weigh(root)
  return root
}

function weigh(n) {
  n.count = n.files.length + [...n.dirs.values()].reduce((a, d) => a + weigh(d), 0)
  return n.count
}

export function countFiles(files) {
  return files.filter((f) => !IGNORE.test(f.path)).length
}

// Reduce el árbol a un presupuesto de hojas y ramas manteniendo su forma.
// Las cadenas de carpetas con un solo hijo (src/main/java/com/...) se compactan
// en una sola rama, como las "compact folders" de un editor.
export function prune(node, { maxLeaves = 220, maxDepth = 5, maxBranches = 8 } = {}, rand = Math.random) {
  weigh(node)
  const ratio = Math.min(1, maxLeaves / Math.max(1, node.count))
  const walk = (n, depth) => {
    while (n.files.length === 0 && n.dirs.size === 1) {
      const [only] = n.dirs.values()
      n = { ...only, name: n.name ? `${n.name}/${only.name}` : only.name }
    }
    let dirs = [...n.dirs.values()].sort((a, b) => b.count - a.count)
    let files = n.files
    // Lo que no cabe como rama se prensa como hojas de la rama madre.
    if (dirs.length > maxBranches) {
      files = files.concat(dirs.slice(maxBranches).flatMap(allFiles))
      dirs = dirs.slice(0, maxBranches)
    }
    if (depth >= maxDepth) {
      files = files.concat(dirs.flatMap(allFiles))
      dirs = []
    }
    const keep = files.length ? Math.max(1, Math.round(files.length * ratio)) : 0
    const sampled = files
      .map((f) => [rand(), f])
      .sort((a, b) => a[0] - b[0])
      .slice(0, keep)
      .map(([, f]) => f)
      .sort((a, b) => a.name.localeCompare(b.name))
    const out = { name: n.name, files: sampled, dirs: new Map() }
    for (const d of dirs) out.dirs.set(d.name, walk(d, depth + 1))
    return out
  }
  const out = walk(node, 0)
  weigh(out)
  return out
}

function allFiles(n) {
  return [...n.files, ...[...n.dirs.values()].flatMap(allFiles)]
}

function dominantKind(n) {
  const tally = {}
  const visit = (x) => {
    for (const f of x.files) tally[f.kind] = (tally[f.kind] ?? 0) + 1
    for (const d of x.dirs.values()) visit(d)
  }
  visit(n)
  return Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'other'
}

// ---------------------------------------------------------------------------
// Geometría

const deg = Math.PI / 180

function quad(p0, a, L, bend) {
  const p1 = { x: p0.x + Math.cos(a) * L * 0.5, y: p0.y + Math.sin(a) * L * 0.5 }
  const p2 = { x: p1.x + Math.cos(a + bend) * L * 0.5, y: p1.y + Math.sin(a + bend) * L * 0.5 }
  return { p0, p1, p2 }
}

function at(c, t) {
  const u = 1 - t
  return {
    x: u * u * c.p0.x + 2 * u * t * c.p1.x + t * t * c.p2.x,
    y: u * u * c.p0.y + 2 * u * t * c.p1.y + t * t * c.p2.y,
  }
}

function tangent(c, t) {
  const dx = 2 * (1 - t) * (c.p1.x - c.p0.x) + 2 * t * (c.p2.x - c.p1.x)
  const dy = 2 * (1 - t) * (c.p1.y - c.p0.y) + 2 * t * (c.p2.y - c.p1.y)
  return Math.atan2(dy, dx)
}

// Inclina un ángulo hacia arriba (fototropismo).
function lift(a, f) {
  const up = -90 * deg
  let d = up - a
  while (d > Math.PI) d -= 2 * Math.PI
  while (d < -Math.PI) d += 2 * Math.PI
  return a + d * f
}

/**
 * Hace crecer la planta. Devuelve geometría abstracta (y hacia abajo, base en 0,0).
 * order: función opcional para ordenar las ramas de la raíz (p. ej. por fecha).
 */
export function grow(tree, { seed, roots = [], order, height = 600, tags = {}, leafScale = 1 } = {}) {
  const rand = seeded(seed)
  const jit = (a, b) => a + (b - a) * rand()
  const stems = []
  const leaves = []
  const rootLines = []
  const tagPoints = []
  // Plantas con pocos archivos llevan hojas más grandes, como un ejemplar joven.
  const leafBase = leafScale * height * (0.045 + 0.035 * (1 - Math.min(1, tree.count / 160)))

  const branch = (node, p0, a, L, depth, t0) => {
    const bend = jit(-0.22, 0.22) * (depth === 0 ? 0.5 : 1)
    const c = quad(p0, a, L, bend)
    stems.push({ c, depth, t0, dur: 0.5 + L / height })
    if (tags[node.path ?? node.name] && depth === 1) tagPoints.push({ name: tags[node.path ?? node.name], p: at(c, 1), a })

    let dirs = [...node.dirs.values()]
    dirs = depth === 0 && order ? order(dirs) : dirs.sort((a, b) => b.count - a.count)
    const files = node.files

    // Ramas hijas: las más pesadas abajo, alternando lados.
    const n = dirs.length
    const startSide = rand() < 0.5 ? -1 : 1
    dirs.forEach((d, i) => {
      const t = n === 1 ? jit(0.7, 0.84) : 0.16 + (0.78 * i) / Math.max(1, n - 1) + jit(-0.03, 0.03)
      const side = i % 2 ? -startSide : startSide
      const ta = tangent(c, t)
      const spread = (depth === 0 ? jit(48, 66) : jit(30, 52)) * deg
      const ca = lift(ta + side * spread, depth === 0 ? 0.12 : 0.28)
      const share = Math.sqrt(d.count / Math.max(1, node.count))
      const cl = Math.max(height * 0.05, L * (depth === 0 ? 0.3 + 0.55 * share : 0.42 + 0.45 * share) * jit(0.88, 1.08))
      branch(d, at(c, t), ca, cl, depth + 1, t0 + t * (0.5 + L / height))
    })

    // Hojas: archivos repartidos a lo largo de la rama; pares opuestos si no caben.
    const size = leafBase * Math.max(0.55, 1 - depth * 0.09)
    const slots = Math.max(1, Math.floor(L / (size * 0.55)))
    const paired = files.length > slots
    files.forEach((f, i) => {
      const k = paired ? Math.floor(i / 2) : i
      const total = paired ? Math.ceil(files.length / 2) : files.length
      const t = files.length === 1 ? 1 : 0.22 + (0.78 * (k + 0.5)) / total
      const side = paired ? (i % 2 ? 1 : -1) : k % 2 ? 1 : -1
      const ta = tangent(c, t)
      const tip = t >= 0.999
      const la = tip ? ta : lift(ta + side * jit(38, 64) * deg, 0.15)
      leaves.push({ p: at(c, Math.min(t, 1)), a: la, kind: f.kind, size: size * jit(0.82, 1.12), t0: t0 + t * (0.5 + L / height) })
    })
  }

  // Un repo con pocas carpetas tiene un tallo más corto, para que no quede pelado.
  const stem = height * (0.5 + 0.5 * Math.min(1, tree.dirs.size / 6))
  branch(tree, { x: 0, y: 0 }, -90 * deg + jit(-0.05, 0.05), stem, 0, 0)

  // Raíces: archivos sueltos en la raíz (o forks, en la planta de la cuenta).
  roots.forEach((r, i) => {
    const side = i % 2 ? 1 : -1
    const spread = ((i + 1) / (roots.length + 1)) * 70 * deg
    const a = 90 * deg + side * spread * jit(0.7, 1.1)
    const L = height * (0.07 + 0.05 * Math.min(1, Math.log10((r.size ?? 100) + 10) / 5)) * jit(0.8, 1.3)
    const c = quad({ x: jit(-3, 3), y: 2 }, a, L, jit(-0.5, 0.5))
    rootLines.push({ c, t0: 0 })
    if (rand() < 0.6) {
      const t = jit(0.35, 0.7)
      const ra = tangent(c, t) + (rand() < 0.5 ? -1 : 1) * jit(25, 50) * deg
      rootLines.push({ c: quad(at(c, t), ra, L * jit(0.25, 0.45), jit(-0.4, 0.4)), t0: 0 })
    }
    if (r.tag) tagPoints.push({ name: r.tag, p: at(c, 1), a, root: true })
  })

  return { stems, leaves, rootLines, tagPoints }
}

// Encaja la geometría en una caja (x, y, w, h) con la base abajo al centro.
export function fit(g, box, maxScale = 1.6) {
  const pts = []
  for (const s of [...g.stems, ...g.rootLines]) pts.push(s.c.p0, s.c.p1, s.c.p2)
  for (const l of g.leaves) {
    pts.push({ x: l.p.x + Math.cos(l.a) * l.size, y: l.p.y + Math.sin(l.a) * l.size })
    pts.push(l.p)
  }
  const minX = Math.min(...pts.map((p) => p.x))
  const maxX = Math.max(...pts.map((p) => p.x))
  const minY = Math.min(...pts.map((p) => p.y))
  const maxY = Math.max(...pts.map((p) => p.y))
  const s = Math.min(box.w / (maxX - minX), box.h / (maxY - minY), maxScale)
  const ox = box.x + (box.w - (maxX - minX) * s) / 2 - minX * s
  const oy = box.y + box.h - maxY * s
  const T = (p) => ({ x: p.x * s + ox, y: p.y * s + oy })
  const tc = (c) => ({ p0: T(c.p0), p1: T(c.p1), p2: T(c.p2) })
  return {
    scale: s,
    stems: g.stems.map((st) => ({ ...st, c: tc(st.c) })),
    rootLines: g.rootLines.map((r) => ({ ...r, c: tc(r.c) })),
    leaves: g.leaves.map((l) => ({ ...l, p: T(l.p), size: l.size * s })),
    tagPoints: g.tagPoints.map((t) => ({ ...t, p: T(t.p) })),
    base: T({ x: 0, y: 0 }),
  }
}

// ---------------------------------------------------------------------------
// Dibujo

const f1 = (n) => Math.round(n * 10) / 10

export const LEAF_DEFS = (ink, paper) => `
<g id="lf-code"><path d="M0 0C24-17 66-15 100 0C66 15 24 17 0 0Z"/><path d="M8 0H86" stroke="${paper}" stroke-width="3" fill="none"/></g>
<path id="lf-style" d="M0 0C20-26 70-30 100 0C70 30 20 26 0 0ZM12 0H84" fill="none" stroke="${ink}" stroke-width="7"/>
<g id="lf-data"><path d="M0 0H52" stroke="${ink}" stroke-width="6"/><circle cx="72" cy="0" r="22"/></g>
<g id="lf-doc"><path d="M0 0H48" stroke="${ink}" stroke-width="6"/><g fill="none" stroke="${ink}" stroke-width="6"><ellipse cx="76" cy="-17" rx="11" ry="17" transform="rotate(-20 76 -17)"/><ellipse cx="76" cy="17" rx="11" ry="17" transform="rotate(20 76 17)"/><ellipse cx="93" cy="-8" rx="10" ry="15" transform="rotate(-70 93 -8)"/><ellipse cx="93" cy="8" rx="10" ry="15" transform="rotate(70 93 8)"/><ellipse cx="62" cy="0" rx="9" ry="13" transform="rotate(90 62 0)"/></g><circle cx="80" cy="0" r="8"/></g>
<g id="lf-asset"><path d="M0 0H58" stroke="${ink}" stroke-width="6"/><circle cx="76" cy="0" r="18"/><circle cx="70" cy="-6" r="5" fill="${paper}"/></g>
<g id="lf-test"><path d="M0 0H40" stroke="${ink}" stroke-width="6"/><path d="M36 0C50-20 80-16 92 0C80 16 50 20 36 0Z"/><path d="M52-12L60 0L52 12" fill="none" stroke="${paper}" stroke-width="3"/></g>
<path id="lf-other" d="M0 0C30-9 70-9 100 0C70 9 30 9 0 0Z" fill="none" stroke="${ink}" stroke-width="7"/>`

const qpath = (c) =>
  `M${f1(c.p0.x)} ${f1(c.p0.y)}Q${f1(c.p1.x)} ${f1(c.p1.y)} ${f1(c.p2.x)} ${f1(c.p2.y)}`

/** Devuelve SVG de la planta ya encajada. animate: añade el crecimiento (solo la cabecera).
 * Cada tallo lleva la clase de su profundidad (d0…d3) para que la versión compacta
 * (móvil) pueda engrosarlos desde CSS. */
export function drawPlant(p, { ink, paper, animate = false, stemWidth = 3.2 }) {
  const out = []
  const cls = (base, delay) =>
    animate ? ` class="${base} s" style="animation-delay:${delay.toFixed(2)}s"` : ` class="${base}"`
  const pl = animate ? ' pathLength="1"' : ''

  out.push(`<g fill="none" stroke="${ink}" stroke-linecap="round">`)
  for (const r of p.rootLines) out.push(`<path d="${qpath(r.c)}" stroke-width="1.1"${pl}${cls('rt', 0)}/>`)
  for (const s of p.stems) {
    const w = Math.max(0.8, stemWidth * Math.pow(0.66, s.depth))
    out.push(`<path d="${qpath(s.c)}" stroke-width="${f1(w)}"${pl}${cls(`d${Math.min(3, s.depth)}`, s.t0 * 1.1)}/>`)
  }
  out.push('</g>')

  out.push(`<g class="lv" fill="${ink}">`)
  for (const l of p.leaves) {
    const k = l.size / 100
    const a = animate ? ` class="l" style="animation-delay:${(l.t0 * 1.1 + 0.35).toFixed(2)}s"` : ''
    out.push(
      `<use href="#lf-${l.kind}" transform="translate(${f1(l.p.x)} ${f1(l.p.y)}) rotate(${f1((l.a * 180) / Math.PI)}) scale(${k.toFixed(3)})"${a}/>`,
    )
  }
  out.push('</g>')
  return out.join('')
}

// Versión compacta de la planta: trazos más gruesos y hojas contorneadas para que
// la silueta aguante cuando GitHub la muestra a 170–340 px de ancho.
export const COMPACT_PLANT_CSS = (ink) =>
  `.d0{stroke-width:10px}.d1{stroke-width:6.5px}.d2{stroke-width:4.5px}.d3{stroke-width:3.2px}.rt{stroke-width:2.6px}.lv{stroke:${ink};stroke-width:18px;stroke-linejoin:round}`

export const GROW_CSS = `.s{stroke-dasharray:1;animation:d 1.2s cubic-bezier(.22,1,.36,1) both}.l{animation:o .7s cubic-bezier(.22,1,.36,1) both}@keyframes d{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}@keyframes o{from{opacity:0}to{opacity:1}}@media (prefers-reduced-motion:reduce){.s,.l{animation:none}}`
