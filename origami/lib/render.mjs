// Piezas del concepto origami. Dos tintas como un papel kami de dos caras
// (añil por la cara de color, washi por el reverso) y bermellón solo para los
// sellos (hanko). Cada pieza es un objeto opaco: se ve igual en el tema claro y
// en el oscuro de GitHub. Las piezas grandes llevan composición completa (.f) y
// compacta (.c) que se activa con @media dentro del SVG según su ancho real.
import { TypeSetter } from '../../herbario/lib/type.mjs'
import { seeded } from '../../herbario/lib/plant.mjs'
import { creasePattern, flaps, stickFigure } from './treemethod.mjs'

export const C = {
  ai: '#1E3A5F', // añil: cara de color del kami
  aiDeep: '#142A47', // tinta de los pliegues sobre el reverso
  aiTone: '#2B4A73', // asanoha tono sobre tono
  washi: '#F5F4EF', // reverso del papel
  shu: '#C8371F', // bermellón de sello
}

const f1 = (n) => Math.round(n * 10) / 10
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
export const num = (n) => (n < 10000 ? String(n) : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '))

const responsive = (bp, extra = '') =>
  `.c{display:none}@media (max-width:${bp}px){.f{display:none}.c{display:inline}${extra}}`

// El momento principal de la cabecera: la esquina se dobla, se traza la flecha de
// doblez y los sellos se estampan. Con movimiento reducido solo aparecen.
const FOLD_CSS =
  '.cara{opacity:0;animation:cara .95s .35s both}' +
  '.pliegue{animation:aparece .3s 1.2s both}' +
  '.flecha{stroke-dasharray:1;animation:traza .55s cubic-bezier(.16,1,.3,1) 1.25s both}' +
  '.punta{animation:aparece .2s 1.7s both}' +
  '.sello{transform-box:fill-box;transform-origin:center;animation:sello .42s cubic-bezier(.16,1,.3,1) both}' +
  '@keyframes cara{0%,50%{opacity:1}51%,100%{opacity:0}}' +
  '@keyframes aparece{from{opacity:0}}' +
  '@keyframes traza{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}' +
  // El sello está visible desde el primer fotograma: solo se presiona, nunca aparece de la nada.
  '@keyframes sello{from{transform:scale(1.25)}}' +
  '@media (prefers-reduced-motion:reduce){.cara,.pliegue,.flecha,.punta,.sello{animation:none}}'

// Pliegues más gruesos cuando la pieza se ve pequeña (móvil).
const COMPACT_CP = '.cv{stroke-width:3px}.cm{stroke-width:2.6px}.cb{stroke-width:2px}.ch{display:none}'

function doc({ w, h, title, body, ts, css = '', defs = '' }) {
  const t = esc(title)
  const style = css ? `<style>${css}</style>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${t}"><title>${t}</title>${style}<defs>${ts.defs()}${defs}</defs>${body}</svg>\n`
}

// ---------------------------------------------------------------------------
// Materiales

// Asanoha (hoja de cáñamo): retícula triangular con radios al centro de cada triángulo.
function asanohaPath(s) {
  const rh = (s * Math.sqrt(3)) / 2
  const P = (i, j) => ({ x: i * s + (j % 2 ? s / 2 : 0), y: j * rh })
  const seg = []
  const L = (a, b) => seg.push(`M${f1(a.x)} ${f1(a.y)}L${f1(b.x)} ${f1(b.y)}`)
  for (let j = -1; j < 3; j++) {
    for (let i = -2; i < 3; i++) {
      const a0 = P(i, j)
      const a1 = P(i + 1, j)
      const c0 = { x: a0.x + (j % 2 ? -s / 2 : s / 2), y: (j + 1) * rh }
      const c1 = { x: c0.x + s, y: c0.y }
      for (const [A, B, Cc] of [[a0, a1, j % 2 ? c1 : c0], [c0, c1, j % 2 ? a0 : a1]]) {
        const g = { x: (A.x + B.x + Cc.x) / 3, y: (A.y + B.y + Cc.y) / 3 }
        L(A, B), L(B, Cc), L(Cc, A), L(A, g), L(B, g), L(Cc, g)
      }
    }
  }
  return { d: seg.join(''), w: s, h: rh * 2 }
}

const ASA = asanohaPath(30)
const PATTERNS_BASE = `<pattern id="asaT" width="${ASA.w}" height="${f1(ASA.h)}" patternUnits="userSpaceOnUse"><path d="${ASA.d}" fill="none" stroke="${C.aiTone}" stroke-width="1"/></pattern><pattern id="asaW" width="${ASA.w / 1.5}" height="${f1(ASA.h / 1.5)}" patternUnits="userSpaceOnUse"><path d="${asanohaPath(20).d}" fill="none" stroke="${C.washi}" stroke-width="1" stroke-opacity=".75"/></pattern><filter id="sombra" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="-2" dy="3" stdDeviation="3" flood-color="${C.aiDeep}" flood-opacity=".35"/></filter><filter id="tinta" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="2" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.4 1.4" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>`

// Seigaiha (olas): abanicos concéntricos escalonados.
function seigaihaTile(r) {
  const fan = (cx, cy) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.ai}"/>` +
    [1, 0.7, 0.42].map((k) => `<circle cx="${cx}" cy="${cy}" r="${f1(r * k)}" fill="none" stroke="${C.washi}" stroke-opacity=".75" stroke-width="1"/>`).join('')
  return { w: 2 * r, h: r, body: fan(r, 0) + fan(0, r / 2) + fan(2 * r, r / 2) + fan(r, r) }
}

// Kikkō (caparazón de tortuga): hexágonos con doble línea.
function kikkoTile(a) {
  const hex = (cx, cy, k) =>
    `<polygon points="${[0, 60, 120, 180, 240, 300].map((d) => `${f1(cx + Math.cos((d * Math.PI) / 180) * a * k)},${f1(cy + Math.sin((d * Math.PI) / 180) * a * k)}`).join(' ')}"/>`
  const h = a * Math.sqrt(3)
  const centers = [[0, 0], [3 * a, 0], [0, h], [3 * a, h], [1.5 * a, h / 2]]
  return { w: 3 * a, h, body: `<g fill="none" stroke="${C.washi}" stroke-opacity=".75" stroke-width="1">${centers.map(([x, y]) => hex(x, y, 0.92) + hex(x, y, 0.62)).join('')}</g>` }
}

const SEI = seigaihaTile(11)
const KIK = kikkoTile(9)
const CHIYOGAMI = ['asaW', 'seiW', 'kikW']
const EXTRA_PATTERNS = `<pattern id="seiW" width="${SEI.w}" height="${SEI.h}" patternUnits="userSpaceOnUse">${SEI.body}</pattern><pattern id="kikW" width="${KIK.w}" height="${f1(KIK.h)}" patternUnits="userSpaceOnUse"><rect width="${KIK.w}" height="${f1(KIK.h)}" fill="${C.ai}"/>${KIK.body}</pattern><filter id="asiento" x="-10%" y="-10%" width="125%" height="125%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="${C.aiDeep}" flood-opacity=".6"/></filter>`

const PATTERNS = () => PATTERNS_BASE + EXTRA_PATTERNS

function field(w, h, rx = 10) {
  return `<rect width="${w}" height="${h}" rx="${rx}" fill="${C.ai}"/><rect width="${w}" height="${h}" rx="${rx}" fill="url(#asaT)"/>`
}

// Sello (hanko) en hakubun: caracteres en blanco sobre bermellón, columnas de derecha a izquierda.
export function hanko(ts, { x, y, cols, size = 30, rotate = 0, cls = '' }) {
  const rows = Math.max(...cols.map((c) => c.length))
  const pad = size * 0.22
  const w = cols.length * size + pad * 2
  const h = rows * size * 1.02 + pad * 2
  const glyphs = []
  cols.forEach((col, ci) => {
    const cx = x + w - pad - size * (ci + 0.5)
    const top = y + pad + ((rows - col.length) * size * 1.02) / 2
    ;[...col].forEach((ch, ri) => {
      glyphs.push(ts.text(ch, { font: 'mincho', size, x: cx, y: top + size * 0.86 + ri * size * 1.02, anchor: 'middle', fill: C.washi }).svg)
    })
  })
  const k = cls ? ` class="${cls}"` : ''
  return {
    svg: `<g${k} filter="url(#tinta)" transform="rotate(${rotate} ${f1(x + w / 2)} ${f1(y + h / 2)})"><rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(size * 0.12)}" fill="${C.shu}"/>${glyphs.join('')}</g>`,
    w,
    h,
  }
}

const sealCols = (jp) => {
  const chars = [...jp]
  if (chars.length <= 3) return [chars.join('')]
  const half = Math.ceil(chars.length / 2)
  return [chars.slice(0, half).join(''), chars.slice(half).join('')]
}

// ---------------------------------------------------------------------------
// Hoja de kami con su patrón de pliegue y una esquina doblada.

const CORNERS = ['tr', 'br', 'bl', 'tl']

function sheet({ x, y, S, rotate, corner = 'tr', fold = 110, id, inner, pattern = 'asaW', animate = false }) {
  // Pentágono de la hoja sin la esquina doblada, y la solapa reflejada sobre la hoja.
  const f = fold
  const shapes = {
    tr: { poly: [[0, 0], [S - f, 0], [S, f], [S, S], [0, S]], flap: [[S - f, 0], [S, f], [S - f, f]], from: [S, 0] },
    br: { poly: [[0, 0], [S, 0], [S, S - f], [S - f, S], [0, S]], flap: [[S, S - f], [S - f, S], [S - f, S - f]], from: [S, S] },
    bl: { poly: [[0, 0], [S, 0], [S, S], [f, S], [0, S - f]], flap: [[f, S], [0, S - f], [f, S - f]], from: [0, S] },
    tl: { poly: [[f, 0], [S, 0], [S, S], [0, S], [0, f]], flap: [[0, f], [f, 0], [f, f]], from: [0, 0] },
  }[corner]
  const pts = (arr) => arr.map(([a, b]) => `${f1(a)},${f1(b)}`).join(' ')
  const [fa, fb] = shapes.flap
  const mid = { x: (fa[0] + fb[0]) / 2, y: (fa[1] + fb[1]) / 2 }
  const from = { x: shapes.from[0], y: shapes.from[1] }
  const to = { x: shapes.flap[2][0], y: shapes.flap[2][1] }
  // Flecha de doblez en valle (notación Yoshizawa–Randlett): arco de la esquina a su destino.
  const ctrl = { x: mid.x + (from.x - to.x) * 0.15 + (from.y - to.y) * 0.55, y: mid.y + (from.y - to.y) * 0.15 - (from.x - to.x) * 0.55 }
  const ang = Math.atan2(to.y - ctrl.y, to.x - ctrl.x)
  const head = (s) => `M${f1(to.x - Math.cos(ang - 0.45) * s)} ${f1(to.y - Math.sin(ang - 0.45) * s)}L${f1(to.x)} ${f1(to.y)}L${f1(to.x - Math.cos(ang + 0.45) * s)} ${f1(to.y - Math.sin(ang + 0.45) * s)}`
  // Doblez animado: la solapa empieza desplegada (reflejada sobre la línea de pliegue,
  // con la cara washi arriba) y se pliega en valle hasta su sitio. Reflejar es escalar
  // −1 en el eje perpendicular a la línea, así que el giro pasa por 0 como un pliegue real.
  const phi = (Math.atan2(fb[1] - fa[1], fb[0] - fa[0]) * 180) / Math.PI
  const T = (sy) => `translate(${f1(fa[0])}px,${f1(fa[1])}px) rotate(${f1(phi)}deg) scaleY(${sy}) rotate(${f1(-phi)}deg) translate(${f1(-fa[0])}px,${f1(-fa[1])}px)`
  const foldCss = animate
    ? `<style>.pl-${id}{animation:pl-${id} .95s cubic-bezier(.65,0,.35,1) .35s both}@keyframes pl-${id}{from{transform:${T(-1)}}to{transform:${T(1)}}}@media (prefers-reduced-motion:reduce){.pl-${id}{animation:none}}</style>`
    : ''
  const flapClass = animate ? ` class="pl-${id}"` : ''
  const washiFace = animate ? `<polygon class="cara" points="${pts(shapes.flap)}" fill="${C.washi}"/>` : ''
  return `<g transform="translate(${x} ${y}) rotate(${rotate} ${S / 2} ${S / 2})">${foldCss}
<clipPath id="${id}"><polygon points="${pts(shapes.poly)}"/></clipPath>
<polygon points="${pts(shapes.poly)}" fill="${C.washi}" filter="url(#asiento)"/>
<g clip-path="url(#${id})">${inner}</g>
<g${flapClass} filter="url(#sombra)"><polygon points="${pts(shapes.flap)}" fill="${C.ai}"/><polygon points="${pts(shapes.flap)}" fill="url(#${pattern})"/>${washiFace}</g>
<path class="f${animate ? ' pliegue' : ''}" d="M${f1(fa[0])} ${f1(fa[1])}L${f1(fb[0])} ${f1(fb[1])}" stroke="${C.washi}" stroke-width="1.2" stroke-dasharray="7 4"/>
<g class="f" fill="none" stroke="${C.washi}" stroke-width="2.2" stroke-linecap="round"><path${animate ? ' class="flecha" pathLength="1"' : ''} d="M${f1(from.x)} ${f1(from.y)}Q${f1(ctrl.x)} ${f1(ctrl.y)} ${f1(to.x)} ${f1(to.y)}"/><path${animate ? ' class="punta"' : ''} d="${head(12)}"/></g>
</g>`
}

// Dibuja un patrón de pliegue en un cuadrado de lado S (coordenadas locales).
function drawCP(cp, S, { rivers = true } = {}) {
  const T = (p) => `${f1(p.x * S)} ${f1(p.y * S)}`
  const lines = (arr) => arr.map(([a, b]) => `M${T(a)}L${T(b)}`).join('')
  const ink = C.aiDeep
  const out = []
  if (rivers) {
    let top = 0
    for (const rv of cp.rivers) {
      const op = rv.depth === 0 ? (top++ % 2 ? 0.17 : 0.08) : 0.06
      out.push(`<g opacity="${op}">${rv.discs.map((d) => `<circle cx="${f1(d.x * S)}" cy="${f1(d.y * S)}" r="${f1(d.r * S)}" fill="${ink}"/>`).join('')}</g>`)
    }
  }
  out.push(`<g fill="${ink}" fill-opacity=".06" stroke="${ink}" stroke-opacity=".5" stroke-width=".8">${cp.centers.map((c) => `<circle cx="${f1(c.x * S)}" cy="${f1(c.y * S)}" r="${f1(cp.radius * S)}"/>`).join('')}</g>`)
  out.push(`<path class="ch" d="${lines(cp.hinge)}" stroke="${ink}" stroke-opacity=".28" stroke-width=".6"/>`)
  out.push(`<path class="cm" d="${lines(cp.mountain)}" stroke="${ink}" stroke-width="1.2" stroke-dasharray="9 3 1.6 3 1.6 3"/>`)
  out.push(`<path class="cb" d="${lines(cp.bisect.mountain)}" stroke="${ink}" stroke-width=".95" stroke-dasharray="9 3 1.6 3 1.6 3"/>`)
  out.push(`<path class="cb" d="${lines(cp.bisect.valley)}" stroke="${ink}" stroke-width=".95" stroke-dasharray="7 4"/>`)
  out.push(`<path class="cv" d="${lines(cp.valley)}" stroke="${ink}" stroke-width="1.7" stroke-dasharray="7 4"/>`)
  out.push(`<g fill="${ink}">${cp.centers.map((c) => `<circle cx="${f1(c.x * S)}" cy="${f1(c.y * S)}" r="2.6"/>`).join('')}</g>`)
  out.push(`<rect x=".6" y=".6" width="${S - 1.2}" height="${S - 1.2}" fill="none" stroke="${ink}" stroke-width="1.2"/>`)
  return out.join('')
}

// Base preliminar: el plegado de partida de casi todo modelo (sin patrón propio).
function preliminaryCP(S) {
  const ink = C.aiDeep
  return `<path d="M0 0L${S} ${S}M${S} 0L0 ${S}" stroke="${ink}" stroke-width="1.6" stroke-dasharray="7 4"/><path d="M${S / 2} 0V${S}M0 ${S / 2}H${S}" stroke="${ink}" stroke-width="1.3" stroke-dasharray="9 3 1.6 3 1.6 3"/><rect x=".6" y=".6" width="${S - 1.2}" height="${S - 1.2}" fill="none" stroke="${ink}" stroke-width="1.2"/>`
}

function drawStick(fig, { cx, cy, r, color, width = 2 }) {
  const T = (p) => `${f1(cx + p.x * r)} ${f1(cy + p.y * r)}`
  const flapsD = fig.segs.filter((s) => s[2] === 'flap').map(([a, b]) => `M${T(a)}L${T(b)}`).join('')
  const riversD = fig.segs.filter((s) => s[2] === 'river').map(([a, b]) => `M${T(a)}L${T(b)}`).join('')
  return `<g fill="none" stroke="${color}" stroke-linecap="round"><path d="${riversD}" stroke-width="${width * 1.6}"/><path d="${flapsD}" stroke-width="${width}"/></g><g fill="${color}">${fig.tips.map((p) => `<circle cx="${f1(cx + p.x * r)}" cy="${f1(cy + p.y * r)}" r="${width * 1.1}"/>`).join('')}</g>`
}

// ---------------------------------------------------------------------------

export function header({ fonts, tree, owner, award, date, tags = {} }) {
  const ts = new TypeSetter(fonts)
  const W = 1000
  const H = 640
  const rand = seeded('cuenta-origami')
  const cp = creasePattern(flaps(tree), rand)
  const S = 548

  const X = 618
  const nameSize = Math.min(...owner.name.map((n) => ts.fit(n, { font: 'black', size: 44, maxWidth: W - X - 36 })))
  const n1 = ts.text(owner.name[0], { font: 'black', size: nameSize, x: X, y: 108, fill: C.washi })
  const n2 = ts.text(owner.name[1], { font: 'black', size: nameSize, x: X, y: 108 + nameSize * 1.05, fill: C.washi })
  let y = 108 + nameSize * 1.05 + 40
  const lines = owner.lines.map((l, i) => ts.text(l, { font: 'gothic', size: ts.fit(l, { font: 'gothic', size: 16, maxWidth: W - X - 36 }), x: X, y: y + i * 25, fill: C.washi }).svg).join('')
  y += 25 * owner.lines.length + 22
  const seal = hanko(ts, { x: X, y, cols: sealCols(award.jp), size: 30 })
  const awardLines = ts.wrap(award.es, { font: 'gothic', size: 15, maxWidth: W - X - 36 - seal.w - 16 })
  const awardText = awardLines.map((l, i) => ts.text(l, { font: 'gothic', size: 15, x: X + seal.w + 16, y: y + 22 + i * 22, fill: C.washi }).svg).join('')
  y += Math.max(seal.h, awardLines.length * 22) + 34

  // Leyenda de notación.
  const legend = []
  legend.push(ts.text('展開図 · patrón de pliegue de la cuenta', { font: 'gothic', size: 14, x: X, y, fill: C.washi }).svg)
  y += 30
  const rowsL = [
    ['valley', '谷折り · valle'],
    ['mountain', '山折り · monte'],
    ['circle', 'círculo = archivo · banda = repo'],
    ['tag', 'contorno y etiqueta = repo destacado'],
  ]
  for (const [kind, label] of rowsL) {
    if (kind === 'valley') legend.push(`<path d="M${X} ${y - 5}h44" stroke="${C.washi}" stroke-width="2" stroke-dasharray="7 4"/>`)
    if (kind === 'mountain') legend.push(`<path d="M${X} ${y - 5}h44" stroke="${C.washi}" stroke-width="2" stroke-dasharray="9 3 1.6 3 1.6 3"/>`)
    if (kind === 'tag') legend.push(`<rect x="${X + 4}" y="${y - 15}" width="36" height="20" fill="${C.washi}"/>`)
    if (kind === 'circle') legend.push(`<circle cx="${X + 22}" cy="${y - 5}" r="10" fill="none" stroke="${C.washi}" stroke-width="1.6"/>`)
    legend.push(ts.text(label, { font: 'gothic', size: 14, x: X + 58, y, fill: C.washi }).svg)
    y += 26
  }
  const plegado = ts.text(`Plegado el ${date}`, { font: 'gothic', size: 13, x: X, y: H - 36, fill: C.washi })

  // Compacto (móvil).
  const words = owner.name.join(' ').split(' ')
  const ks = Math.min(70, ...words.map((w) => ts.fit(w, { font: 'black', size: 70, maxWidth: W - X - 20 })))
  const kName = words.map((w, i) => ts.text(w, { font: 'black', size: ks, x: X, y: 120 + i * ks * 1.02, fill: C.washi }).svg).join('')
  const kLines = owner.compact.map((l, i) => ts.text(l, { font: 'black', size: ts.fit(l, { font: 'black', size: 36, maxWidth: W - X - 20 }), x: X, y: 120 + 4 * ks * 1.02 + 30 + i * 44, fill: C.washi }).svg).join('')
  const kSeal = hanko(ts, { x: W - 150, y: H - 170, cols: sealCols(award.jp), size: 52, cls: 'c', rotate: -4 })

  const nameSeal = hanko(ts, { x: 30, y: S - 104, cols: sealCols(owner.kana), size: 34, rotate: -3 })
  // Etiquetas sobre las bandas de los repos destacados: así se puede comprobar la leyenda.
  // Contorno de cada banda destacada: la unión de sus discos menos su interior
  // (una máscara deja solo el borde exterior), y su etiqueta, lejos del sello.
  const sealZone = { x0: 18, y0: S - 128, x1: 140, y1: S }
  const featured = cp.rivers.filter((rv) => rv.depth === 0 && tags[rv.name])
  const bandTags = featured
    .map((rv, i) => {
      const discs = (k) => rv.discs.map((d) => `<circle cx="${f1(d.x * S)}" cy="${f1(d.y * S)}" r="${f1(d.r * S + k)}"/>`).join('')
      const contour = `<mask id="borde${i}" maskUnits="userSpaceOnUse" x="-20" y="-20" width="${S + 40}" height="${S + 40}"><rect x="-20" y="-20" width="${S + 40}" height="${S + 40}" fill="#fff"/><g fill="#000">${discs(0)}</g></mask><g mask="url(#borde${i})" fill="${C.aiDeep}" fill-opacity=".85">${discs(2.2)}</g>`
      const cx = (rv.discs.reduce((a, d) => a + d.x, 0) / rv.discs.length) * S
      let cy = (rv.discs.reduce((a, d) => a + d.y, 0) / rv.discs.length) * S
      const t0 = ts.text(tags[rv.name], { font: 'black', size: 14, x: cx, y: 0, anchor: 'middle', fill: C.aiDeep })
      const left = cx - t0.width / 2 - 8
      const right = cx + t0.width / 2 + 8
      if (right > sealZone.x0 && left < sealZone.x1 && cy + 12 > sealZone.y0) cy = sealZone.y0 - 20
      const t = ts.text(tags[rv.name], { font: 'black', size: 14, x: cx, y: cy + 5, anchor: 'middle', fill: C.aiDeep })
      return `<g class="f">${contour}<rect x="${f1(left)}" y="${f1(cy - 12)}" width="${f1(t.width + 16)}" height="24" fill="${C.washi}" stroke="${C.aiDeep}" stroke-width="1.3"/>${t.svg}</g>`
    })
    .join('')
  const kAward = award.compact.map((l, i) => ts.text(l, { font: 'black', size: 30, x: W - 166, y: H - 112 + i * 38, anchor: 'end', fill: C.washi }).svg).join('')
  const body = `${field(W, H)}
${sheet({ x: 36, y: 46, S, rotate: -2, corner: 'tr', fold: 118, id: 'hoja', inner: drawCP(cp, S) + bandTags + `<g class="sello" style="animation-delay:1.5s">${nameSeal.svg}</g>`, animate: true })}
<g class="f">${n1.svg}${n2.svg}${lines}<g class="sello" style="animation-delay:1.75s">${seal.svg}</g>${awardText}${legend.join('')}${plegado.svg}</g>
<g class="c">${kName}${kLines}${kAward}</g><g class="sello" style="animation-delay:1.6s">${kSeal.svg}</g>`

  return doc({
    w: W,
    h: H,
    title: 'Francis Daniel Mamani Silva: el patrón de pliegue de su cuenta de GitHub, donde cada círculo es un archivo y cada banda un repositorio',
    body,
    ts,
    css: FOLD_CSS + responsive(600, COMPACT_CP),
    defs: PATTERNS(),
  })
}

// ---------------------------------------------------------------------------

export function work({ fonts, spec, tree, seal, info, files, index }) {
  const ts = new TypeSetter(fonts)
  const W = 600
  const H = 820
  const rand = seeded(`origami-${spec.id}`)
  const S = 500
  const corner = CORNERS[index % 4]
  const parts = [field(W, H, 8)]

  let inner
  let fig = null
  let drawn = 0
  if (tree) {
    const cp = creasePattern(flaps(tree), rand)
    drawn = cp.flaps
    inner = drawCP(cp, S)
    fig = stickFigure(tree)
  } else {
    inner =
      preliminaryCP(S) +
      `<rect x="${S / 2 - 150}" y="${S / 2 - 46}" width="300" height="92" fill="${C.washi}"/>` +
      `<g class="f">${ts.text('Patrón no publicado', { font: 'black', size: 26, x: S / 2, y: S / 2 - 4, anchor: 'middle', fill: C.aiDeep }).svg}${ts.text('el código no es público', { font: 'gothic', size: 17, x: S / 2, y: S / 2 + 26, anchor: 'middle', fill: C.aiDeep }).svg}</g>` +
      `<g class="c">${ts.text('No publicado', { font: 'black', size: 40, x: S / 2, y: S / 2 + 14, anchor: 'middle', fill: C.aiDeep }).svg}</g>`
  }
  let sealSvg = ''
  if (seal) {
    const cols = sealCols(seal.jp)
    const size = cols[0].length > 2 ? 26 : 32
    const hk = hanko(ts, { x: 0, y: 0, cols, size })
    const sx = corner === 'br' ? 26 : S - hk.w - 26
    const sy = S - hk.h - 26
    sealSvg = hanko(ts, { x: sx, y: sy, cols, size, rotate: 3 }).svg
  }
  parts.push(sheet({ x: 50, y: 40, S, rotate: index % 2 ? 1.4 : -1.4, corner, fold: 92, id: `hoja${index}`, inner: inner + sealSvg, pattern: CHIYOGAMI[index % 3] }))

  // Pie de la obra.
  const cy = 590
  const ns = ts.fit(spec.title, { font: 'black', size: 46, maxWidth: fig ? 380 : 500 })
  const title = ts.text(spec.title, { font: 'black', size: ns, x: 50, y: cy + ns * 0.78, fill: C.washi })
  const descLines = ts.wrap(spec.description, { font: 'gothic', size: 16, maxWidth: fig ? 380 : 500 }).slice(0, 3)
  const desc = descLines.map((l, i) => ts.text(l, { font: 'gothic', size: 16, x: 50, y: cy + ns * 0.78 + 34 + i * 23, fill: C.washi }).svg).join('')
  const years = info ? (spec.since && spec.since < new Date(info.pushed).getFullYear() ? `${spec.since}–${new Date(info.pushed).getFullYear()}` : `${new Date(info.pushed).getFullYear()}`) : ''
  const meta = spec.meta ?? `${info.language ?? '—'} · ${num(files)} archivos · ${drawn} solapas en el patrón · ${years}`
  const metaT = ts.text(meta, { font: 'black', size: ts.fit(meta, { font: 'black', size: 14.5, maxWidth: 500 }), x: 50, y: H - 54, fill: C.washi })
  const sealNote = seal ? `${seal.jp} · ${seal.es}` : spec.repo ? `github.com/${spec.repo}` : spec.href.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const noteT = ts.text(sealNote, { font: 'gothic', size: ts.fit(sealNote, { font: 'gothic', size: 13.5, maxWidth: 500 }), x: 50, y: H - 28, fill: C.washi })
  parts.push(`<g class="f">${title.svg}${desc}${fig ? drawStick(fig, { cx: 500, cy: cy + 44, r: 40, color: C.washi, width: 1.8 }) + ts.text('árbol', { font: 'gothic', size: 13, x: 500, y: cy + 104, anchor: 'middle', fill: C.washi }).svg : ''}<path d="M50 ${H - 82}H550" stroke="${C.washi}" stroke-opacity=".45" stroke-width="1"/>${metaT.svg}${noteT.svg}</g>`)

  // Compacto (móvil).
  const ks = ts.fit(spec.title, { font: 'black', size: 82, maxWidth: 500 })
  const kTitle = ts.text(spec.title, { font: 'black', size: ks, x: 50, y: cy + 14 + ks * 0.76, fill: C.washi })
  const kShort = ts.text(spec.short, { font: 'gothic', size: ts.fit(spec.short, { font: 'gothic', size: 44, maxWidth: 500 }), x: 50, y: H - 82, fill: C.washi })
  const kMetaText = seal ? `${seal.jp} · ${seal.short}` : `${info?.language ?? ''} · ${years}`
  const kMeta = ts.text(kMetaText, { font: 'black', size: ts.fit(kMetaText, { font: 'black', size: 40, maxWidth: 500 }), x: 50, y: H - 28, fill: C.washi })
  parts.push(`<g class="c">${kTitle.svg}${kShort.svg}${kMeta.svg}</g>`)

  return doc({
    w: W,
    h: H,
    title: `${spec.title}: ${spec.description}`,
    body: parts.join(''),
    ts,
    css: responsive(330, COMPACT_CP),
    defs: PATTERNS(),
  })
}

// ---------------------------------------------------------------------------
// Cómo leer los patrones: un ejemplo plegado en tres pasos.

export function notation({ fonts, example }) {
  const ts = new TypeSetter(fonts)
  const W = 1000
  const H = 400
  const cp = creasePattern(flaps(example), seeded('ejemplo'))
  const fig = stickFigure(example)
  const S = 210
  const xs = [60, 395, 730]
  const top = 70
  const ink = C.aiDeep
  const parts = [`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="${C.washi}" stroke="${C.aiDeep}" stroke-width="2"/>`]

  // 1 · árbol
  parts.push(drawStick(fig, { cx: xs[0] + S / 2, cy: top + S / 2, r: S * 0.46, color: ink, width: 2.4 }))
  // 2 · círculos y ríos
  const only = { ...cp, valley: [], mountain: [], bisect: { valley: [], mountain: [] }, hinge: [] }
  const clip = `<clipPath id="paso"><rect width="${S}" height="${S}"/></clipPath>`
  parts.push(`${clip}<g transform="translate(${xs[1]} ${top})"><g clip-path="url(#paso)">${drawCP(only, S)}</g></g>`)
  // 3 · patrón
  parts.push(`<g transform="translate(${xs[2]} ${top})"><g clip-path="url(#paso)">${drawCP(cp, S)}</g></g>`)

  // Flechas de paso.
  for (const x of [xs[0] + S + 22, xs[1] + S + 22]) {
    parts.push(`<path d="M${x} ${top + S / 2 - 9}h44v-11l26 20l-26 20v-11h-44z" fill="${C.washi}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`)
  }

  const steps = [
    ['1', 'Árbol de carpetas', 'y archivos (ejemplo)'],
    ['2', 'Archivo = círculo (solapa)', 'carpeta = banda (río)'],
    ['3', 'Pliegues', null],
  ]
  steps.forEach(([n, a, b], i) => {
    const x = xs[i]
    const y = top + S + 46
    parts.push(`<circle cx="${x + 14}" cy="${y - 7}" r="15" fill="none" stroke="${ink}" stroke-width="2"/>`)
    parts.push(ts.text(n, { font: 'black', size: 18, x: x + 14, y: y - 0.5, anchor: 'middle', fill: ink }).svg)
    if (b) {
      parts.push(`<g class="f">${ts.text(a, { font: 'black', size: 16, x: x + 40, y: y - 1, fill: ink }).svg}${ts.text(b, { font: 'gothic', size: 15, x: x + 40, y: y + 22, fill: ink }).svg}</g>`)
    } else {
      // Una línea por tipo de pliegue, dibujada como en la leyenda de la cabecera.
      const v = ts.text('谷折り valle', { font: 'gothic', size: 14, x: x + 86, y: y + 22, fill: ink })
      const m = ts.text('山折り monte', { font: 'gothic', size: 14, x: x + 86, y: y + 44, fill: ink })
      parts.push(
        `<g class="f">${ts.text(a, { font: 'black', size: 16, x: x + 40, y: y - 1, fill: ink }).svg}<path d="M${x + 40} ${y + 17}h36" stroke="${ink}" stroke-width="1.8" stroke-dasharray="7 4"/>${v.svg}<path d="M${x + 40} ${y + 39}h36" stroke="${ink}" stroke-width="1.6" stroke-dasharray="9 3 1.6 3 1.6 3"/>${m.svg}</g>`,
      )
    }
  })
  const compactLabels = ['Árbol', 'Solapas', 'Pliegues']
  compactLabels.forEach((t, i) => parts.push(`<g class="c">${ts.text(t, { font: 'black', size: 36, x: xs[i] + 40, y: top + S + 52, fill: ink }).svg}</g>`))

  parts.push(`<g class="f">${ts.text('折り図 · cómo se pliega un repositorio', { font: 'black', size: 16, x: 60, y: 44, fill: ink }).svg}</g>`)

  return doc({
    w: W,
    h: H,
    title: 'Cómo leer los patrones: 1, el árbol de carpetas y archivos; 2, cada archivo es un círculo (una solapa) y cada carpeta una banda (un río); 3, los pliegues, en valle (línea discontinua) y en monte (punto y raya)',
    body: parts.join(''),
    ts,
    css: responsive(600, COMPACT_CP),
  })
}

// ---------------------------------------------------------------------------
// Teselado: una torsión cuadrada por semana; más contribuciones, más torsión.

// Cada torsión parte plana y gira hasta su ángulo (que es el dato): así se lee que
// más giro es más contribuciones. Con movimiento reducido, solo un fundido.
const TWIST_CSS =
  '.tw{transform-box:fill-box;transform-origin:center;animation:tw .7s cubic-bezier(.16,1,.3,1) both}' +
  '.fc{animation:fc .7s ease-out both}' +
  // El primer fotograma ya muestra un 40 % del giro y las facetas a media tinta: si un
  // visor congela ese instante, el orden de las semanas sigue siendo legible.
  '@keyframes tw{from{transform:rotate(calc(var(--a) * .6))}}' +
  '@keyframes fc{from{opacity:.45}}' +
  '@media (prefers-reduced-motion:reduce){.tw,.fc{animation:none}}'

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function tessellation({ fonts, days, date }) {
  const ts = new TypeSetter(fonts)
  const W = 1000
  const H = 384
  const weeks = []
  for (const d of days) {
    const dt = new Date(`${d.date}T12:00:00Z`)
    if (!weeks.length || dt.getUTCDay() === 0) weeks.push({ start: d.date, count: 0 })
    weeks.at(-1).count += d.count
  }
  const last = weeks.slice(-52)
  const counts = last.map((w) => w.count).filter((c) => c > 0).sort((a, b) => a - b)
  const q = (p) => counts[Math.min(counts.length - 1, Math.floor(p * counts.length))] ?? 0
  const t1 = q(0.34)
  const t2 = q(0.67)
  const level = (c) => (c === 0 ? 0 : c <= t1 ? 1 : c <= t2 ? 2 : 3)

  const ink = C.aiDeep
  const cols = 13
  const rows = 4
  const gx = 196
  const gy = 84
  const cell = (W - gx - 40) / cols
  const parts = [`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="${C.washi}" stroke="${ink}" stroke-width="2"/>`]
  // La torsión crece de forma continua con las contribuciones: la semana pico es la más girada.
  const peak = Math.max(1, ...last.map((w) => w.count))
  const angle = (c) => (c === 0 ? 0 : 8 + 34 * Math.sqrt(c / peak))
  const hb = cell * 0.15
  const x0 = gx
  const x1 = gx + cols * cell
  const y0 = gy
  const y1 = gy + rows * cell
  // Pliegues continuos que atraviesan la hoja y unen las torsiones (filas y columnas).
  const band = []
  for (let r = 0; r < rows; r++) {
    const cy = gy + r * cell + cell / 2
    band.push(`<rect x="${f1(x0)}" y="${f1(cy - hb)}" width="${f1(x1 - x0)}" height="${f1(2 * hb)}" fill="${C.ai}" fill-opacity=".14"/>`)
    band.push(`<path d="M${f1(x0)} ${f1(cy - hb)}H${f1(x1)}" stroke="${ink}" stroke-width=".9" stroke-dasharray="7 4"/><path d="M${f1(x0)} ${f1(cy + hb)}H${f1(x1)}" stroke="${ink}" stroke-width=".9" stroke-dasharray="9 3 1.6 3 1.6 3"/>`)
  }
  for (let c = 0; c < cols; c++) {
    const cx = gx + c * cell + cell / 2
    band.push(`<rect x="${f1(cx - hb)}" y="${f1(y0)}" width="${f1(2 * hb)}" height="${f1(y1 - y0)}" fill="${C.ai}" fill-opacity=".14"/>`)
    band.push(`<path d="M${f1(cx - hb)} ${f1(y0)}V${f1(y1)}" stroke="${ink}" stroke-width=".9" stroke-dasharray="7 4"/><path d="M${f1(cx + hb)} ${f1(y0)}V${f1(y1)}" stroke="${ink}" stroke-width=".9" stroke-dasharray="9 3 1.6 3 1.6 3"/>`)
  }
  parts.push(band.join(''))

  last.forEach((w, i) => {
    const r = Math.floor(i / cols)
    const c = i % cols
    const cx = gx + c * cell + cell / 2
    const cy = gy + r * cell + cell / 2
    const deg = angle(w.count)
    if (deg === 0) return
    const th = (deg * Math.PI) / 180
    const a = hb * 2.2
    const b = a * (0.62 - 0.12 * (deg / 42))
    const o = [[-a, -a], [a, -a], [a, a], [-a, a]].map(([x, y]) => ({ x: cx + x, y: cy + y }))
    const qd = [[-b, -b], [b, -b], [b, b], [-b, b]].map(([x, y]) => ({ x: cx + x * Math.cos(th) - y * Math.sin(th), y: cy + x * Math.sin(th) + y * Math.cos(th) }))
    const depth = 0.3 + 0.6 * (deg / 42)
    // Las torsiones se pliegan en orden de semana; el retraso total queda acotado.
    const delay = (0.15 + i * 0.016).toFixed(2)
    const shade = [1, 0.45, 0.85, 0.3].map((k) => k * depth)
    for (let k = 0; k < 4; k++) {
      const poly = [o[k], o[(k + 1) % 4], qd[(k + 1) % 4], qd[k]].map((p) => `${f1(p.x)},${f1(p.y)}`).join(' ')
      parts.push(`<polygon class="fc" style="animation-delay:${delay}s" points="${poly}" fill="${C.ai}" fill-opacity="${shade[k].toFixed(2)}" stroke="${ink}" stroke-width=".8"/>`)
    }
    parts.push(`<polygon class="tw" style="--a:${f1(-deg)}deg;animation-delay:${delay}s" points="${qd.map((p) => `${f1(p.x)},${f1(p.y)}`).join(' ')}" fill="${C.washi}" stroke="${ink}" stroke-width="1.1"/>`)
  })

  // Rótulos de fila: el trimestre que cubre cada fila.
  const fmtMonth = (s) => MONTHS[new Date(`${s}T12:00:00Z`).getUTCMonth()]
  for (let r = 0; r < 4; r++) {
    const row = last.slice(r * cols, r * cols + cols)
    if (!row.length) continue
    const y0 = row[0].start.slice(0, 4)
    const y1 = row.at(-1).start.slice(0, 4)
    const label = `${fmtMonth(row[0].start)}–${fmtMonth(row.at(-1).start)}`
    const years = y0 === y1 ? y1 : `${y0}–${y1.slice(2)}`
    const y = gy + r * cell + cell / 2 + 6
    parts.push(`<g class="f">${ts.text(label, { font: 'black', size: 16, x: 40, y: y - 6, fill: ink }).svg}${ts.text(years, { font: 'gothic', size: 13, x: 40, y: y + 13, fill: ink }).svg}</g>`)
    parts.push(`<g class="c">${ts.text(fmtMonth(row[0].start), { font: 'black', size: 34, x: 40, y: y + 6, fill: ink }).svg}</g>`)
  }

  const total = days.slice(-364).reduce((a, b) => a + b.count, 0)
  const best = last.reduce((a, b) => (b.count > a.count ? b : a), last[0])
  const fmt = (s) => new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${s}T12:00:00Z`)).replace('.', '')
  const note = `${num(total)} contribuciones en 52 semanas · semana más intensa: ${fmt(best.start)} (${best.count}) · más torsión, más contribuciones`
  const short = `${num(total)} contribuciones · pico: ${fmt(best.start)}`
  parts.push(`<g class="f">${ts.text(`Una torsión por semana · al ${date}`, { font: 'black', size: 16, x: 40, y: 50, fill: ink }).svg}${ts.text(note, { font: 'gothic', size: ts.fit(note, { font: 'gothic', size: 15, maxWidth: W - 80 }), x: 40, y: H - 26, fill: ink }).svg}</g>`)
  parts.push(`<g class="c">${ts.text('Una torsión por semana', { font: 'black', size: 34, x: 40, y: 56, fill: ink }).svg}${ts.text(short, { font: 'black', size: ts.fit(short, { font: 'black', size: 34, maxWidth: W - 80 }), x: 40, y: H - 22, fill: ink }).svg}</g>`)

  return {
    svg: doc({ w: W, h: H, title: `Teselado de contribuciones: ${note}`, body: parts.join(''), ts, css: TWIST_CSS + responsive(600) }),
    total,
  }
}

// ---------------------------------------------------------------------------
// Tira de kirigami para los títulos de sección: añil con recortes de shippō.

export function strip({ fonts, jp, es }) {
  const ts = new TypeSetter(fonts)
  const H = 60
  const j = ts.text(jp, { font: 'mincho', size: 26, x: 24, y: 40, fill: C.washi })
  const sep = 24 + j.width + 14
  const e = ts.text(`· ${es}`, { font: 'black', size: 22, x: sep, y: 39, fill: C.washi })
  const cutX = sep + e.width + 26
  const cuts = []
  for (let k = 0; k < 3; k++) {
    const cx = cutX + 12 + k * 24
    const cy = H / 2
    const r = 8
    // Hishi (rombo) recortado en kirigami, con su doblez central.
    const rw = r * 0.8
    const rh2 = r * 1.5
    cuts.push(`<path d="M${cx} ${cy - rh2}L${cx + rw} ${cy}L${cx} ${cy + rh2}L${cx - rw} ${cy}Z" fill="${C.washi}"/><path d="M${cx} ${cy - rh2}V${cy + rh2}" stroke="${C.ai}" stroke-width="1.2" stroke-dasharray="2 2"/>`)
  }
  const w = Math.ceil(cutX + 3 * 24 + 18)
  const body = `<path d="M0 6A6 6 0 0 1 6 0H${w - 14}L${w} ${H / 2}L${w - 14} ${H}H6A6 6 0 0 1 0 ${H - 6}Z" fill="${C.ai}"/><path d="M${cutX - 10} 6V${H - 6}" stroke="${C.washi}" stroke-opacity=".6" stroke-width="1.2" stroke-dasharray="4 3"/>${j.svg}${e.svg}${cuts.join('')}`
  return doc({ w, h: H, title: `${jp} · ${es}`, body, ts })
}

export function linkTag({ fonts, label, external }) {
  const ts = new TypeSetter(fonts)
  const size = 21
  const t = ts.text(label, { font: 'black', size, x: 22, y: 37, fill: C.aiDeep })
  const arrow = external ? 28 : 0
  const w = Math.ceil(22 + t.width + arrow + 34)
  const h = 58
  const f = 18
  const ax = 22 + t.width + 12
  const arrowSvg = external
    ? `<path d="M${f1(ax)} 37L${f1(ax + 14)} 23M${f1(ax + 4)} 23H${f1(ax + 14)}V33" fill="none" stroke="${C.aiDeep}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`
    : ''
  const body = `<polygon points="0,0 ${w - f},0 ${w},${f} ${w},${h} 0,${h}" fill="${C.washi}" stroke="${C.aiDeep}" stroke-width="2.4"/><polygon points="${w - f},0 ${w},${f} ${w - f},${f}" fill="${C.ai}" stroke="${C.aiDeep}" stroke-width="1.6" stroke-linejoin="round"/>${t.svg}${arrowSvg}`
  return doc({ w, h, title: label, body, ts })
}

export function footer({ fonts, owner, date }) {
  const ts = new TypeSetter(fonts)
  const W = 720
  const H = 150
  const seal = hanko(ts, { x: 28, y: 22, cols: sealCols(owner.kana), size: 46, rotate: -3 })
  const X = 28 + seal.w + 26
  const a = ts.text('折り紙 · origami', { font: 'black', size: 17, x: X, y: 52, fill: C.washi })
  const b = ts.text('Plegado automáticamente cada 12 horas con GitHub Actions.', { font: 'gothic', size: 15, x: X, y: 82, fill: C.washi })
  const b2 = ts.text(`Última pasada: ${date} · Lima, Perú`, { font: 'gothic', size: 15, x: X, y: 106, fill: C.washi })
  // En compacto el sello también va con su traducción.
  const ka = ts.text('ダニエル · Daniel', { font: 'black', size: 32, x: X, y: 66, fill: C.washi })
  const kb = ts.text('Plegado cada 12 h', { font: 'gothic', size: 32, x: X, y: 114, fill: C.washi })
  const body = `${field(W, H, 8)}${seal.svg}<g class="f">${a.svg}${b.svg}${b2.svg}</g><g class="c">${ka.svg}${kb.svg}</g>`
  return doc({ w: W, h: H, title: `Plegado automáticamente cada 12 horas. Última pasada: ${date}`, body, ts, css: responsive(450), defs: PATTERNS })
}

export { doc, field, responsive, PATTERNS, f1, sealCols }
