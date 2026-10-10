// Piezas del herbario. Cada SVG es un objeto físico opaco (carpeta, pliego,
// etiqueta), así se ve igual en el tema claro y en el oscuro de GitHub.
// Rojo solo para carpetas y sellos; todo lo demás va en la tinta del ejemplar.
//
// Las piezas grandes llevan dos composiciones: la completa (.f) y una compacta
// (.c) que se activa con @media dentro del propio SVG cuando GitHub lo muestra
// estrecho (móvil). En un <img>, la media query mide el ancho de la imagen.
import { TypeSetter } from './type.mjs'
import { code39 } from './barcode.mjs'
import { COMPACT_PLANT_CSS, drawPlant, fit, grow, LEAF_DEFS, GROW_CSS, seeded } from './plant.mjs'

export const C = {
  red: '#B42318',
  redDeep: '#8E1A12',
  paper: '#EDF0EA',
  ink: '#14261C',
}

const f1 = (n) => Math.round(n * 10) / 10
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

// Cifras en castellano: sin separador hasta 9999, espacio a partir de 10 000.
export const num = (n) => (n < 10000 ? String(n) : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '))

const responsive = (bp, extra = '') =>
  `.c{display:none}@media (max-width:${bp}px){.f{display:none}.c{display:inline}${extra}}`

function doc({ w, h, title, body, ts, css = '', leaves = false, filters = '' }) {
  const defs = `${ts.defs()}${leaves ? LEAF_DEFS(C.ink, C.paper) : ''}${filters}`
  const style = css ? `<style>${css}</style>` : ''
  const t = esc(title)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${t}"><title>${t}</title>${style}<defs>${defs}</defs>${body}</svg>\n`
}

// Tinta de sello: la goma no deja tinta pareja.
const STAMP_FILTER = `<filter id="goma" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="7" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.5 1.42" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>`

function ringStamp(ts, { cx, cy, r, ring, center, rotate = -12, cls = '' }) {
  const inner = r - 30
  const c = ts.text(center, { font: 'display', size: r * 0.5, x: cx, y: cy + r * 0.17, anchor: 'middle', fill: C.red })
  const k = cls ? ` class="${cls}"` : ''
  return `<g${k} filter="url(#goma)" transform="rotate(${rotate} ${cx} ${cy})" opacity=".93"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.red}" stroke-width="3.5"/><circle cx="${cx}" cy="${cy}" r="${inner}" fill="none" stroke="${C.red}" stroke-width="1.6"/>${ts.arc(ring, { font: 'caps', size: r * 0.18, cx, cy, r: r - 21, tracking: 0.06, fill: C.red })}${c.svg}</g>`
}

function boxStamp(ts, { x, y, lines, rotate = -8, size = 26, cls = '' }) {
  const widths = lines.map((l) => ts.measure(l, { font: 'display', size, tracking: 0.08 }))
  const w = Math.max(...widths) + 34
  const h = lines.length * size * 1.08 + 26
  const texts = lines
    .map((l, i) => ts.text(l, { font: 'display', size, x: x + w / 2, y: y + 13 + size * 0.92 + i * size * 1.08, anchor: 'middle', tracking: 0.08, fill: C.red }).svg)
    .join('')
  const k = cls ? ` class="${cls}"` : ''
  return `<g${k} filter="url(#goma)" transform="rotate(${rotate} ${x + w / 2} ${y + h / 2})" opacity=".93"><rect x="${x}" y="${y}" width="${f1(w)}" height="${f1(h)}" fill="none" stroke="${C.red}" stroke-width="3.5"/><rect x="${x + 6}" y="${y + 6}" width="${f1(w - 12)}" height="${f1(h - 12)}" fill="none" stroke="${C.red}" stroke-width="1.4"/>${texts}</g>`
}

// Cinta de lino que sujeta el ejemplar al pliego.
function tape(p, angle, len = 46) {
  return `<rect x="${f1(p.x - len / 2)}" y="${f1(p.y - 6)}" width="${len}" height="12" fill="${C.paper}" stroke="${C.ink}" stroke-width=".9" transform="rotate(${f1(angle)} ${f1(p.x)} ${f1(p.y)})"/>`
}

function tapes(plant, rand) {
  const main = plant.stems.filter((s) => s.depth <= 1)
  const picks = [main[0], ...main.slice(1).sort(() => rand() - 0.5).slice(0, 2)].filter(Boolean)
  return picks
    .map((s, i) => {
      const t = i === 0 ? 0.12 : 0.35
      const u = 1 - t
      const c = s.c
      const p = { x: u * u * c.p0.x + 2 * u * t * c.p1.x + t * t * c.p2.x, y: u * u * c.p0.y + 2 * u * t * c.p1.y + t * t * c.p2.y }
      const a = Math.atan2(c.p2.y - c.p0.y, c.p2.x - c.p0.x) * (180 / Math.PI) + 90 + (rand() - 0.5) * 16
      return tape(p, a)
    })
    .join('')
}

function barcodeBlock(ts, { x, y, w, text, caption, cls = '' }) {
  const cap = ts.text(caption, { font: 'typed', size: 13, x: x + w / 2, y: y + 56, anchor: 'middle', fill: C.ink })
  const k = cls ? ` class="${cls}"` : ''
  return `<g${k}>${code39(text, { x, y, width: w, height: 38, fill: C.ink })}${cap.svg}</g>`
}

// Pestaña de carpeta (la misma forma en la cabecera, los ejemplares y las secciones).
function folderTab(x, w, h, fill) {
  return `<path d="M${x} ${h}V14A14 14 0 0 1 ${x + 14} 0H${x + w - 14}A14 14 0 0 1 ${x + w} 14V${h}Z" fill="${fill}"/>`
}

// Etiqueta de papel atada a una rama con hilo.
function branchTag(ts, { p, name, root = false }) {
  const size = 15
  const w = ts.measure(name, { font: 'typedBold', size }) + 18
  const h = 24
  const dx = p.x > 340 ? 18 : -18 - w
  const dy = root ? -h - 2 : -h - 10
  const x = p.x + dx
  const y = p.y + dy
  const anchor = { x: dx > 0 ? x : x + w, y: y + h / 2 }
  const t = ts.text(name, { font: 'typedBold', size, x: x + 9, y: y + 17, fill: C.ink })
  return `<path d="M${f1(p.x)} ${f1(p.y)}Q${f1((p.x + anchor.x) / 2)} ${f1(anchor.y + (root ? -8 : 8))} ${f1(anchor.x)} ${f1(anchor.y)}" fill="none" stroke="${C.ink}" stroke-width="1" stroke-dasharray="3 2"/><rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${h}" fill="${C.paper}" stroke="${C.ink}" stroke-width="1.2"/>${t.svg}`
}

// ---------------------------------------------------------------------------

export function header({ fonts, tree, roots, tags, owner, award, date }) {
  const ts = new TypeSetter(fonts)
  const W = 1000
  const H = 660
  const rand = seeded('cabecera')

  const g = grow(tree, {
    seed: 'danieln3m0',
    roots,
    height: 620,
    order: (dirs) => dirs.sort((a, b) => a.created.localeCompare(b.created)),
    tags,
    leafScale: 1.3,
  })
  const plant = fit(g, { x: 70, y: 104, w: 520, h: 512 })

  const tab = ts.text('HERBARIO DE REPOSITORIOS · DANIELN3M0', { font: 'caps', size: 19, x: 54, y: 35, tracking: 0.14, fill: C.paper })
  const tabW = tab.width + 52
  // En móvil la pestaña solo lleva el usuario, a un cuerpo que se lee.
  const kTab = ts.text('DANIELN3M0', { font: 'caps', size: 32, x: 54, y: 38, tracking: 0.08, fill: C.paper })

  // Etiqueta completa.
  const L = { x: 590, y: 392, w: 360, h: 220 }
  const nameSize = Math.min(...owner.name.map((n) => ts.fit(n, { font: 'display', size: 40, maxWidth: L.w - 40 })))
  const n1y = L.y + 22 + nameSize * 0.8
  const n1 = ts.text(owner.name[0], { font: 'display', size: nameSize, x: L.x + 20, y: n1y, tracking: -0.01, fill: C.ink })
  const n2 = ts.text(owner.name[1], { font: 'display', size: nameSize, x: L.x + 20, y: n1y + nameSize * 0.98, tracking: -0.01, fill: C.ink })
  const binY = n1y + nameSize * 0.98 + 34
  const bin = ts.text(owner.binomial, { font: 'italic', size: 19, x: L.x + 20, y: binY, fill: C.ink })
  const auth = ts.text(owner.author, { font: 'typed', size: 14, x: L.x + 26 + bin.width, y: binY, fill: C.ink })
  const lines = [...owner.lines, `Colecta: ${date} · Leg. danieln3m0`]
    .map((l, i) => ts.text(l, { font: 'typed', size: ts.fit(l, { font: 'typed', size: 14.5, maxWidth: L.w - 40 }), x: L.x + 20, y: binY + 30 + i * 20, fill: C.ink }).svg)
    .join('')

  // Etiqueta compacta (móvil): el nombre en cuatro líneas grandes.
  const K = { x: 548, y: 214, w: 426, h: 398 }
  const words = owner.name.join(' ').split(' ')
  const ks = Math.min(66, ...words.map((w) => ts.fit(w, { font: 'display', size: 66, maxWidth: K.w - 48 })))
  const compactName = words
    .map((w, i) => ts.text(w, { font: 'display', size: ks, x: K.x + 24, y: K.y + 30 + ks * 0.8 + i * ks * 0.96, tracking: -0.01, fill: C.ink }).svg)
    .join('')
  const kl = owner.compact.map((l, i) =>
    ts.text(l, { font: 'typedBold', size: ts.fit(l, { font: 'typedBold', size: 34, maxWidth: K.w - 48 }), x: K.x + 24, y: K.y + K.h - 70 + i * 42, fill: C.ink }).svg,
  )

  const body = `
<g class="f">${folderTab(28, tabW, 54, C.redDeep)}${tab.svg}</g>
<g class="c">${folderTab(28, kTab.width + 52, 54, C.redDeep)}${kTab.svg}</g>
<rect x="0" y="44" width="${W}" height="${H - 44}" rx="10" fill="${C.red}"/>
<rect x="26" y="74" width="${W - 52}" height="${H - 96}" rx="2" fill="${C.paper}"/>
${drawPlant(plant, { ink: C.ink, paper: C.paper, animate: true, stemWidth: 4.6 })}
${tapes(plant, rand)}
<g class="f">${plant.tagPoints.map((t) => branchTag(ts, t)).join('')}</g>
${barcodeBlock(ts, { x: 760, y: 100, w: 186, text: owner.barcode, caption: 'N.º 108034615', cls: 'f' })}
<g class="f"><rect x="${L.x}" y="${L.y}" width="${L.w}" height="${L.h}" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.2"/>
<rect x="${L.x + 6}" y="${L.y + 6}" width="${L.w - 12}" height="${L.h - 12}" fill="none" stroke="${C.ink}" stroke-width=".8"/>
${n1.svg}${n2.svg}${bin.svg}${auth.svg}${lines}</g>
${ringStamp(ts, { cx: 898, cy: 372, r: 64, ring: award.ring, center: award.center, cls: 'f' })}
<g class="c"><rect x="${K.x}" y="${K.y}" width="${K.w}" height="${K.h}" fill="${C.paper}" stroke="${C.ink}" stroke-width="5"/>${compactName}${kl.join('')}</g>
${ringStamp(ts, { cx: 870, cy: 160, r: 86, ring: award.ring, center: award.center, cls: 'c', rotate: -10 })}`

  return doc({
    w: W,
    h: H,
    title: 'Herbario de repositorios de Francis Daniel Mamani Silva: cada rama de la planta es uno de sus repositorios',
    body,
    ts,
    css: GROW_CSS + responsive(600, COMPACT_PLANT_CSS(C.ink)),
    leaves: true,
    filters: STAMP_FILTER,
  })
}

// ---------------------------------------------------------------------------

export function specimen({ fonts, spec, tree, roots, number, info, files }) {
  const ts = new TypeSetter(fonts)
  const W = 600
  const H = 900
  const rand = seeded(spec.id)
  const parts = []

  // Carpeta de género: la pestaña lleva la familia (el lenguaje) como en un herbario.
  const family = (spec.family ?? info?.language ?? '—').toUpperCase()
  const tab = ts.text(family, { font: 'caps', size: 17, x: 40, y: 30, tracking: 0.14, fill: C.paper })
  const kTab = ts.text(family, { font: 'caps', size: ts.fit(family, { font: 'caps', size: 33, tracking: 0.04, maxWidth: 440 }), x: 36, y: 33, tracking: 0.04, fill: C.paper })
  parts.push(`<g class="f">${folderTab(18, tab.width + 44, 44, C.redDeep)}${tab.svg}</g>`)
  parts.push(`<g class="c">${folderTab(18, kTab.width + 36, 44, C.redDeep)}${kTab.svg}</g>`)
  parts.push(`<rect x="0" y="34" width="${W}" height="${H - 34}" rx="8" fill="${C.red}"/>`)
  parts.push(`<rect x="12" y="48" width="${W - 24}" height="${H - 60}" rx="2" fill="${C.paper}"/>`)

  // Boleta de origen.
  const origin = spec.repo ? `github.com/${spec.repo}` : spec.href.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const os = ts.fit(origin, { font: 'typed', size: 14, maxWidth: 330 })
  const ot = ts.text(origin, { font: 'typed', size: os, x: 40, y: 88, fill: C.ink })
  parts.push(`<g class="f"><rect x="30" y="66" width="${f1(ot.width + 20)}" height="32" fill="${C.paper}" stroke="${C.ink}" stroke-width="1.2"/>${ot.svg}</g>`)

  parts.push(barcodeBlock(ts, { x: 426, y: 66, w: 140, text: `DN3M0-${number}`, caption: `N.º ${number}` }))

  if (tree) {
    const g = grow(tree, { seed: spec.id, roots, height: 560 })
    const plant = fit(g, { x: 50, y: 140, w: 500, h: 440 })
    parts.push(drawPlant(plant, { ink: C.ink, paper: C.paper, stemWidth: 3.2 }))
    parts.push(tapes(plant, rand))
  } else {
    // Sobre de fragmentos: el ejemplar existe pero no está depositado.
    const ex = 120
    const ey = 220
    const ew = 360
    const eh = 260
    const note = ts.wrap(spec.note, { font: 'typed', size: 15, maxWidth: ew - 60 })
    parts.push(
      `<g transform="rotate(-3 ${ex + ew / 2} ${ey + eh / 2})"><rect x="${ex}" y="${ey}" width="${ew}" height="${eh}" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.4"/><path d="M${ex} ${ey}L${ex + ew / 2} ${ey + eh * 0.42}L${ex + ew} ${ey}" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>` +
        `<g class="f">${ts.text('SOBRE DE FRAGMENTOS', { font: 'caps', size: 15, x: ex + ew / 2, y: ey + eh * 0.62, anchor: 'middle', tracking: 0.16, fill: C.ink }).svg}` +
        note.map((l, i) => ts.text(l, { font: 'typed', size: 15, x: ex + ew / 2, y: ey + eh * 0.62 + 30 + i * 21, anchor: 'middle', fill: C.ink }).svg).join('') +
        `</g><g class="c">${ts.text('NO DEPOSITADO', { font: 'caps', size: 34, x: ex + ew / 2, y: ey + eh * 0.74, anchor: 'middle', tracking: 0.08, fill: C.ink }).svg}</g></g>`,
    )
  }

  // Etiqueta de determinación completa.
  const L = { x: 196, y: 604, w: 374, h: 268 }
  const pad = 20
  const ns = ts.fit(spec.title, { font: 'display', size: 52, tracking: -0.01, maxWidth: L.w - pad * 2 })
  const nameY = L.y + 22 + ns * 0.8
  const name = ts.text(spec.title, { font: 'display', size: ns, x: L.x + pad, y: nameY, tracking: -0.01, fill: C.ink })
  const by = nameY + 32
  const bin = ts.text(spec.binomial, { font: 'italic', size: 20, x: L.x + pad, y: by, fill: C.ink })
  const descLines = ts.wrap(spec.description, { font: 'typed', size: 15.5, maxWidth: L.w - pad * 2 }).slice(0, 4)
  const desc = descLines.map((l, i) => ts.text(l, { font: 'typed', size: 15.5, x: L.x + pad, y: by + 30 + i * 20, fill: C.ink }).svg).join('')
  const meta = spec.meta ?? metaLine(info, files, spec)
  const mt = ts.text(meta, { font: 'typedBold', size: ts.fit(meta, { font: 'typedBold', size: 15.5, maxWidth: L.w - pad * 2 }), x: L.x + pad, y: L.y + L.h - 20, fill: C.ink })
  parts.push(
    `<g class="f"><rect x="${L.x}" y="${L.y}" width="${L.w}" height="${L.h}" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.2"/><rect x="${L.x + 6}" y="${L.y + 6}" width="${L.w - 12}" height="${L.h - 12}" fill="none" stroke="${C.ink}" stroke-width=".8"/><path d="M${L.x + pad} ${L.y + L.h - 44}H${L.x + L.w - pad}" stroke="${C.ink}" stroke-width=".8"/>${name.svg}${bin.svg}${desc}${mt.svg}</g>`,
  )
  if (spec.stamp?.kind === 'ring') parts.push(ringStamp(ts, { cx: 108, cy: 770, r: 72, ring: spec.stamp.ring, center: spec.stamp.center, rotate: -14, cls: 'f' }))
  if (spec.stamp?.kind === 'box') parts.push(boxStamp(ts, { x: 24, y: 656, lines: spec.stamp.lines, rotate: -9, size: 15, cls: 'f' }))

  // Etiqueta compacta (móvil): nombre grande y una línea corta.
  const K = { x: 30, y: 604, w: 540, h: 268 }
  const ks = ts.fit(spec.title, { font: 'display', size: 84, tracking: -0.01, maxWidth: K.w - 48 })
  const kName = ts.text(spec.title, { font: 'display', size: ks, x: K.x + 24, y: K.y + 26 + ks * 0.78, tracking: -0.01, fill: C.ink })
  const kShort = ts.text(spec.short, { font: 'typed', size: ts.fit(spec.short, { font: 'typed', size: 44, maxWidth: K.w - 48 }), x: K.x + 24, y: K.y + 178, fill: C.ink })
  const kMetaText = spec.compactMeta ?? `${info?.language ?? ''} · ${new Date(info.pushed).getFullYear()}`
  const kMeta = ts.text(kMetaText, { font: 'typedBold', size: ts.fit(kMetaText, { font: 'typedBold', size: 40, maxWidth: K.w - 48 }), x: K.x + 24, y: K.y + 236, fill: C.ink })
  parts.push(`<g class="c"><rect x="${K.x}" y="${K.y}" width="${K.w}" height="${K.h}" fill="${C.paper}" stroke="${C.ink}" stroke-width="6"/>${kName.svg}${kShort.svg}${kMeta.svg}</g>`)

  return doc({
    w: W,
    h: H,
    title: `${spec.title}: ${spec.description}`,
    body: parts.join(''),
    ts,
    css: responsive(330, COMPACT_PLANT_CSS(C.ink)),
    leaves: !!tree,
    filters: spec.stamp ? STAMP_FILTER : '',
  })
}

function metaLine(info, files, spec) {
  const from = spec.since ?? new Date(info.created).getFullYear()
  const to = new Date(info.pushed).getFullYear()
  const years = from === to ? `${to}` : `${from}–${to}`
  return `${info.language ?? '—'} · ${num(files)} archivos · ${years}`
}

// ---------------------------------------------------------------------------

export function tab({ fonts, text }) {
  const ts = new TypeSetter(fonts)
  const t = ts.text(text, { font: 'caps', size: 22, x: 28, y: 40, tracking: 0.14, fill: C.paper })
  const w = Math.ceil(t.width + 56)
  const body = `${folderTab(0, w, 60, C.red)}${t.svg}`
  return { svg: doc({ w, h: 60, title: text, body, ts }), width: w }
}

export function linkTag({ fonts, label, external }) {
  const ts = new TypeSetter(fonts)
  const size = 21
  const textW = ts.measure(label, { font: 'display', size, tracking: 0.06 })
  const arrow = external ? 26 : 0
  const w = Math.ceil(56 + textW + arrow + 22)
  const h = 58
  const t = ts.text(label, { font: 'display', size, x: 56, y: 37, tracking: 0.06, fill: C.ink })
  const ax = 56 + textW + 14
  const arrowSvg = external
    ? `<path d="M${f1(ax)} 37L${f1(ax + 14)} 23M${f1(ax + 4)} 23H${f1(ax + 14)}V33" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="square"/>`
    : ''
  // Ojal reforzado de la etiqueta de campo.
  const body = `<path d="M18 3H${w - 3}V${h - 3}H18L3 ${h - 18}V18Z" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.4"/><circle cx="26" cy="${h / 2}" r="8.5" fill="none" stroke="${C.ink}" stroke-width="3.5"/><circle cx="26" cy="${h / 2}" r="3.5" fill="${C.ink}"/>${t.svg}${arrowSvg}`
  return { svg: doc({ w, h, title: label, body, ts }), width: w }
}

// ---------------------------------------------------------------------------

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

export function phenology({ fonts, days, date }) {
  const ts = new TypeSetter(fonts)
  const W = 1000
  const H = 340
  // Semanas de domingo a sábado, como el calendario de GitHub.
  const weeks = []
  for (const d of days) {
    const dt = new Date(`${d.date}T12:00:00Z`)
    if (!weeks.length || dt.getUTCDay() === 0) weeks.push({ start: d.date, count: 0 })
    weeks.at(-1).count += d.count
  }
  const counts = weeks.map((w) => w.count).filter((c) => c > 0).sort((a, b) => a - b)
  const q = (p) => counts[Math.min(counts.length - 1, Math.floor(p * counts.length))] ?? 0
  const t1 = q(0.34)
  const t2 = q(0.67)
  // Cuatro pasos discretos: nudo, yema, flor entreabierta, flor abierta.
  const level = (c) => (c === 0 ? 0 : c <= t1 ? 1 : c <= t2 ? 2 : 3)

  const x0 = 48
  const x1 = W - 48
  const baseY = 236
  const step = (x1 - x0) / Math.max(1, weeks.length - 1)
  const rand = seeded('fenologia')

  // Estolón: el tallo rastrero que une las semanas.
  const pts = weeks.map((_, i) => ({ x: x0 + i * step, y: baseY + Math.sin(i * 0.55) * 3 + (rand() - 0.5) * 2 }))
  let d = `M${f1(pts[0].x)} ${f1(pts[0].y)}`
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    d += `Q${f1((a.x + b.x) / 2)} ${f1((a.y + b.y) / 2 + (i % 2 ? 4 : -4))} ${f1(b.x)} ${f1(b.y)}`
  }

  const marks = []
  weeks.forEach((w, i) => {
    const p = pts[i]
    const lv = level(w.count)
    if (lv === 0) {
      marks.push(`<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="2.4" fill="${C.ink}"/>`)
      return
    }
    const hgt = [0, 34, 70, 112][lv]
    const lean = (rand() - 0.5) * 10
    const tip = { x: p.x + lean, y: p.y - hgt }
    marks.push(`<path class="sk" d="M${f1(p.x)} ${f1(p.y)}Q${f1(p.x - lean * 0.2)} ${f1(p.y - hgt * 0.55)} ${f1(tip.x)} ${f1(tip.y)}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`)
    const side = i % 2 ? 1 : -1
    marks.push(`<path d="M${f1(p.x)} ${f1(p.y - hgt * 0.3)}c${4 * side} -6 ${12 * side} -7 ${16 * side} -3c${-4 * side} 5 ${-12 * side} 6 ${-16 * side} 3z" fill="${C.ink}"/>`)
    if (lv === 1) {
      marks.push(`<path d="M${f1(tip.x)} ${f1(tip.y + 2)}c-5 -4 -5 -12 0 -16c5 4 5 12 0 16z" fill="${C.ink}"/>`)
    } else if (lv === 2) {
      marks.push(
        `<g class="pt" fill="none" stroke="${C.ink}" stroke-width="1.7"><ellipse cx="${f1(tip.x - 6)}" cy="${f1(tip.y - 7)}" rx="4" ry="8" transform="rotate(-28 ${f1(tip.x - 6)} ${f1(tip.y - 7)})"/><ellipse cx="${f1(tip.x + 6)}" cy="${f1(tip.y - 7)}" rx="4" ry="8" transform="rotate(28 ${f1(tip.x + 6)} ${f1(tip.y - 7)})"/><ellipse cx="${f1(tip.x)}" cy="${f1(tip.y - 10)}" rx="4" ry="8"/></g>`,
      )
    } else {
      const petals = [0, 72, 144, 216, 288]
        .map((a) => `<ellipse cx="${f1(tip.x)}" cy="${f1(tip.y - 9)}" rx="4.6" ry="9" transform="rotate(${a} ${f1(tip.x)} ${f1(tip.y)})"/>`)
        .join('')
      marks.push(`<g class="pt" fill="none" stroke="${C.ink}" stroke-width="1.7">${petals}</g><circle cx="${f1(tip.x)}" cy="${f1(tip.y)}" r="4.4" fill="${C.ink}"/>`)
    }
  })

  // Meses bajo el estolón, en dos cuerpos: completo y compacto.
  const months = { f: [], c: [] }
  let lastMonth = -1
  weeks.forEach((w, i) => {
    const m = new Date(`${w.start}T12:00:00Z`).getUTCMonth()
    if (m !== lastMonth && i > 0) {
      months.f.push(ts.text(MONTHS[m], { font: 'caps', size: 12, x: pts[i].x, y: baseY + 34, anchor: 'middle', tracking: 0.14, fill: C.ink }).svg)
      months.c.push(ts.text(MONTHS[m], { font: 'caps', size: 24, x: pts[i].x, y: baseY + 46, anchor: 'middle', fill: C.ink }).svg)
      months.f.push(`<path d="M${f1(pts[i].x)} ${baseY + 10}v8" stroke="${C.ink}" stroke-width="1"/>`)
    }
    lastMonth = m
  })

  const total = days.reduce((a, b) => a + b.count, 0)
  const best = weeks.reduce((a, b) => (b.count > a.count ? b : a), weeks[0])
  const inBloom = weeks.filter((w) => level(w.count) === 3).length
  const fmt = (s) => new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${s}T12:00:00Z`)).replace('.', '')
  const note = `${num(total)} contribuciones en 52 semanas · semana más intensa: ${fmt(best.start)} (${best.count}) · ${inBloom} semanas en plena flor`
  const short = `${num(total)} contribuciones · pico: ${fmt(best.start)}`

  const title = ts.text('CONTRIBUCIONES · 52 SEMANAS', { font: 'caps', size: 17, x: 40, y: 50, tracking: 0.16, fill: C.ink })
  const sub = ts.text(`Una planta por semana · al ${date}`, { font: 'typed', size: 15, x: W - 40, y: 50, anchor: 'end', fill: C.ink })
  const nt = ts.text(note, { font: 'typed', size: ts.fit(note, { font: 'typed', size: 15, maxWidth: W - 80 }), x: 40, y: H - 26, fill: C.ink })
  const kTitle = ts.text('UNA PLANTA POR SEMANA', { font: 'caps', size: 32, x: 40, y: 54, tracking: 0.06, fill: C.ink })
  const kNote = ts.text(short, { font: 'typedBold', size: ts.fit(short, { font: 'typedBold', size: 34, maxWidth: W - 80 }), x: 40, y: H - 18, fill: C.ink })

  const body = `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.2"/><path d="M40 66H${W - 40}M40 ${H - 54}H${W - 40}" stroke="${C.ink}" stroke-width=".8"/><path d="${d}" fill="none" stroke="${C.ink}" stroke-width="2"/>${marks.join('')}<g class="f">${title.svg}${sub.svg}${months.f.join('')}${nt.svg}</g><g class="c">${kTitle.svg}${months.c.join('')}${kNote.svg}</g>`
  return {
    svg: doc({
      w: W,
      h: H,
      title: `Fenología de contribuciones: ${note}`,
      body,
      ts,
      css: responsive(600, '.sk{stroke-width:3.4px}.pt{stroke-width:3.2px}'),
    }),
    note,
    total,
  }
}

// ---------------------------------------------------------------------------

export function leafKey({ fonts }) {
  const ts = new TypeSetter(fonts)
  const W = 1000
  const H = 246
  const entries = [
    ['code', 'CÓDIGO', '.ts .py .java .dart', 'CÓDIGO'],
    ['style', 'MARCADO', '.html .css .xml', 'MARCADO'],
    ['data', 'CONFIGURACIÓN', '.json .yml .gradle', 'CONFIG.'],
    ['doc', 'DOCUMENTACIÓN', '.md README LICENSE', 'DOCS'],
    ['asset', 'RECURSOS', 'imágenes y fuentes', 'RECURSOS'],
    ['test', 'PRUEBAS', '*.test.* tests/', 'PRUEBAS'],
    ['branch', 'RAMA', 'una carpeta', 'CARPETA'],
    ['root', 'RAÍZ', 'archivo en la raíz', 'RAÍZ'],
  ]
  const cols = 4
  const cw = (W - 80) / cols
  const parts = []
  entries.forEach(([kind, label, ext, compact], i) => {
    const cx = 40 + (i % cols) * cw
    const cy = 92 + Math.floor(i / cols) * 92
    if (kind === 'branch') {
      parts.push(`<path d="M${cx + 4} ${cy + 8}Q${cx + 26} ${cy - 2} ${cx + 52} ${cy - 22}M${cx + 26} ${cy}Q${cx + 34} ${cy + 4} ${cx + 46} ${cy + 2}" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`)
    } else if (kind === 'root') {
      parts.push(`<path d="M${cx + 26} ${cy - 22}Q${cx + 22} ${cy - 2} ${cx + 8} ${cy + 16}M${cx + 26} ${cy - 22}Q${cx + 32} ${cy} ${cx + 46} ${cy + 14}M${cx + 17} ${cy}l-10 2" fill="none" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`)
    } else {
      parts.push(`<use href="#lf-${kind}" fill="${C.ink}" transform="translate(${cx} ${cy}) rotate(-28) scale(.56)"/>`)
    }
    parts.push(`<g class="f">${ts.text(label, { font: 'caps', size: 13, x: cx + 72, y: cy - 4, tracking: 0.12, fill: C.ink }).svg}${ts.text(ext, { font: 'typed', size: 14, x: cx + 72, y: cy + 16, fill: C.ink }).svg}</g>`)
    parts.push(`<g class="c">${ts.text(compact, { font: 'caps', size: ts.fit(compact, { font: 'caps', size: 28, maxWidth: cw - 76 }), x: cx + 68, y: cy + 10, fill: C.ink }).svg}</g>`)
  })
  const title = ts.text('CLAVE PARA LEER LOS EJEMPLARES', { font: 'caps', size: 15, x: 40, y: 42, tracking: 0.16, fill: C.ink })
  const kTitle = ts.text('CLAVE DE HOJAS', { font: 'caps', size: 30, x: 40, y: 46, tracking: 0.08, fill: C.ink })
  const body = `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.2"/><path d="M40 58H${W - 40}" stroke="${C.ink}" stroke-width=".8"/><g class="f">${title.svg}</g><g class="c">${kTitle.svg}</g>${parts.join('')}`
  return doc({
    w: W,
    h: H,
    title: 'Clave: hojas lanceoladas = código, ovadas = marcado, redondas = configuración, flores = documentación, bayas = recursos, yemas = pruebas, ramas = carpetas, raíces = archivos de la raíz',
    body,
    ts,
    css: responsive(600),
    leaves: true,
  })
}

export function footer({ fonts, date }) {
  const ts = new TypeSetter(fonts)
  const W = 720
  const H = 150
  const a = ts.text('HERBARIO DE REPOSITORIOS · DANIELN3M0', { font: 'caps', size: 14, x: 30, y: 44, tracking: 0.16, fill: C.ink })
  const b = ts.text('Prensado automáticamente cada 12 horas con GitHub Actions.', { font: 'typed', size: 16, x: 30, y: 82, fill: C.ink })
  const c = ts.text(`Última colecta: ${date} · Lima, Perú`, { font: 'typed', size: 16, x: 30, y: 108, fill: C.ink })
  const kb = ts.text('Prensado cada 12 h', { font: 'typedBold', size: 34, x: 30, y: 62, fill: C.ink })
  const kc = ts.text(`Colecta: ${date}`, { font: 'typed', size: 34, x: 30, y: 112, fill: C.ink })
  const body = `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.2"/><rect x="7" y="7" width="${W - 14}" height="${H - 14}" fill="none" stroke="${C.ink}" stroke-width=".8"/><g class="f">${a.svg}${b.svg}${c.svg}</g><g class="c">${kb.svg}${kc.svg}</g>${code39('N3M0', { x: W - 150, y: 28, width: 118, height: 30, fill: C.ink })}`
  return doc({ w: W, h: H, title: `Prensado automáticamente cada 12 horas. Última colecta: ${date}`, body, ts, css: responsive(450) })
}
