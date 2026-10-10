// Estadísticas en el mismo mundo de papel: hilos de grullas (senbazuru) para las
// contribuciones por tipo, una tira de kami cortada por lenguaje y tanzaku por día
// de la semana. En un <img> no hay tooltips, así que cada valor va rotulado, y el
// README lleva además la tabla de datos (ver statsMarkdown).
import { TypeSetter } from '../../herbario/lib/type.mjs'
import { C, doc, f1, field, num, PATTERNS, responsive } from './render.mjs'

// Énfasis sin pigmento nuevo: el resto de las barras es la misma tinta añil a menor opacidad.
const MUTED_OPACITY = 0.62

const WEEKDAYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']
const WEEKDAYS_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const dayMonth = (s) => {
  const d = new Date(`${s}T12:00:00Z`)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

// Rachas y ritmo a partir del calendario del último año.
export function rhythm(days) {
  const year = days.slice(-364)
  let best = { len: 0, start: null, end: null }
  let run = 0
  let runStart = null
  for (const d of year) {
    if (d.count > 0) {
      if (run === 0) runStart = d.date
      run++
      if (run > best.len) best = { len: run, start: runStart, end: d.date }
    } else run = 0
  }
  // Racha actual: termina hoy, o ayer si hoy todavía no hay contribuciones.
  let current = 0
  let i = year.length - 1
  if (i >= 0 && year[i].count === 0) i--
  for (; i >= 0 && year[i].count > 0; i--) current++
  const byWeekday = Array(7).fill(0)
  for (const d of year) byWeekday[(new Date(`${d.date}T12:00:00Z`).getUTCDay() + 6) % 7] += d.count
  const top = Math.max(...byWeekday)
  // Todos los días a menos de un 5 % del máximo comparten el énfasis.
  const peaks = byWeekday.map((v, k) => (top > 0 && v >= top * 0.95 ? k : -1)).filter((k) => k >= 0)
  const total = year.reduce((a, d) => a + d.count, 0)
  return { longest: best, current, byWeekday, peaks, total }
}

export function streakLine(r) {
  const lg = r.longest
  const d = (n) => `${n} ${n === 1 ? 'día' : 'días'}`
  if (!lg.len) return 'Sin rachas de contribuciones este año.'
  if (r.current === lg.len && r.current > 0) return `Racha actual: ${d(r.current)} seguidos, la más larga del año (${dayMonth(lg.start)} – ${dayMonth(lg.end)}).`
  return `Racha más larga: ${d(lg.len)} (${dayMonth(lg.start)} – ${dayMonth(lg.end)}) · racha actual: ${d(r.current)}.`
}

const peakNames = (r) => r.peaks.map((k) => WEEKDAYS_LONG[k]).join(' y ')

// ---------------------------------------------------------------------------
// Grulla de papel (orizuru) de perfil, mirando a la izquierda, en una caja de 40×24.
// El hilo la atraviesa por el lomo, en (20, 15). Las alas muestran la cara añil del
// kami y el cuerpo el reverso washi: las dos caras del papel, como en la cabecera.
function crane({ x, y, s = 1, flip = false, tilt = 0 }) {
  const k = flip ? -s : s
  const t = `translate(${f1(x)} ${f1(y)}) rotate(${f1(tilt)}) scale(${f1(k)} ${f1(s)}) translate(-20 -15)`
  const wing = '14,16 27,16 23,0'
  const body = '12,16 20,13 29,16 21,21'
  const neck = '12,16 3,5 4.5,4.6 15,15.5'
  const head = '3,5 0,8.5 4.4,6.2'
  const tail = '28,16 39,4 40,5 30,16.5'
  return `<g transform="${t}"><g fill="${C.washi}" stroke="${C.aiDeep}" stroke-width=".6" stroke-linejoin="round">${[tail, neck, head, body].map((p) => `<polygon points="${p}"/>`).join('')}<polygon points="${wing}" fill="${C.aiTone}" stroke="${C.washi}"/></g><path d="M20.6 16L23 .6" stroke="${C.washi}" stroke-width=".7"/><path d="M12.5 16H28.5" stroke="${C.aiDeep}" stroke-width=".7"/></g>`
}

// Resto menor que una grulla entera: un cuadrado de papel aún sin plegar, de área proporcional.
function paperSquare({ x, y, frac }) {
  const side = Math.max(5, 26 * Math.sqrt(frac))
  return `<rect x="${f1(x - side / 2)}" y="${f1(y - side / 2)}" width="${f1(side)}" height="${f1(side)}" fill="${C.washi}" stroke="${C.aiDeep}" stroke-width=".6" transform="rotate(45 ${f1(x)} ${f1(y)})"/>`
}

const STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000]

export function senbazuru({ fonts, totals, total, date }) {
  const ts = new TypeSetter(fonts)
  const W = 1000
  const strands = senbazuruStrands(totals, total)
  const max = Math.max(1, ...strands.map((s) => s[2]))
  const per = STEPS.find((k) => Math.ceil(max / k) <= 10) ?? 1000
  // El alto sigue al hilo más largo: sin franja muerta bajo las grullas.
  const longest = Math.ceil(max / per)
  const H = Math.max(440, 72 + 22 + (longest - 1) * 31 + 20 + 150)
  const parts = [field(W, H, 8)]

  const rx0 = 380
  const rx1 = 960
  const rodY = 72
  parts.push(`<path d="M${rx0 - 6} ${rodY}H${rx1 + 6}" stroke="${C.washi}" stroke-width="4" stroke-linecap="round"/>`)
  const step = (rx1 - rx0) / strands.length
  strands.forEach(([label, short, value], i) => {
    const sx = rx0 + step * (i + 0.5)
    const full = Math.floor(value / per)
    const frac = (value - full * per) / per
    const gap = 31
    const items = Array.from({ length: full }, () => ({ kind: 'crane', s: 1 }))
    // Un resto de al menos un 20 % se pliega como grulla menor; si no, queda como papel sin plegar.
    if (frac >= 0.2) items.push({ kind: 'crane', s: Math.sqrt(frac) })
    else if (frac > 0) items.push({ kind: 'square', frac })
    const endY = rodY + 22 + Math.max(0, items.length - 1) * gap + (items.length ? 20 : 4)
    parts.push(`<path d="M${f1(sx)} ${rodY}V${f1(endY)}" stroke="${C.washi}" stroke-width="1.1"/>`)
    items.forEach((it, j) => {
      const cy = rodY + 22 + j * gap
      parts.push(it.kind === 'crane' ? `<g class="cr">${crane({ x: sx, y: cy, s: 1.12 * it.s, flip: j % 2 === 1, tilt: j % 2 ? 4 : -4 })}</g>` : paperSquare({ x: sx, y: cy, frac: it.frac }))
    })
    parts.push(`<path d="M${f1(sx)} ${f1(endY)}l-4 12M${f1(sx)} ${f1(endY)}v13M${f1(sx)} ${f1(endY)}l4 12" stroke="${C.washi}" stroke-width="1.2" stroke-linecap="round"/>`)
    // Etiqueta colgada al final de su hilo.
    const ly = endY + 38
    parts.push(`<g class="f">${ts.text(label, { font: 'black', size: ts.fit(label, { font: 'black', size: 15, maxWidth: step - 8 }), x: sx, y: ly, anchor: 'middle', fill: C.washi }).svg}${ts.text(num(value), { font: 'gothic', size: 15, x: sx, y: ly + 21, anchor: 'middle', fill: C.washi }).svg}</g>`)
    const kly = Math.min(endY + 48 + (i % 2) * 78, H - 48)
    parts.push(`<g class="c">${ts.text(short, { font: 'black', size: ts.fit(short, { font: 'black', size: 30, maxWidth: step * 1.9 }), x: sx, y: kly, anchor: 'middle', fill: C.washi }).svg}${ts.text(num(value), { font: 'gothic', size: 30, x: sx, y: kly + 34, anchor: 'middle', fill: C.washi }).svg}</g>`)
  })

  // Columna de texto.
  const X = 40
  const kanji = ts.text('千羽鶴', { font: 'mincho', size: 34, x: X, y: 80, fill: C.washi })
  const titleEs = ts.text('· mil grullas', { font: 'black', size: 20, x: X + kanji.width + 10, y: 78, fill: C.washi })
  const kKanji = ts.text('千羽鶴', { font: 'mincho', size: 34, x: X, y: 86, fill: C.washi })
  const kTitleEs = ts.text('· mil grullas', { font: 'black', size: ts.fit('· mil grullas', { font: 'black', size: 30, maxWidth: 336 - kKanji.width - 10 }), x: X + kKanji.width + 10, y: 85, fill: C.washi })
  const big = ts.text(num(total), { font: 'black', size: 64, x: X, y: 178, fill: C.washi })
  const of = ts.text('/ 1000', { font: 'gothic', size: 26, x: X + big.width + 10, y: 178, fill: C.washi })
  const kBig = ts.text(num(total), { font: 'black', size: 72, x: X, y: 214, fill: C.washi })
  const kOf = ts.text('/ 1000', { font: 'gothic', size: 32, x: X + kBig.width + 10, y: 214, fill: C.washi })
  const para = ts.wrap('Las contribuciones del último año, contadas como grullas de papel. Según la tradición, quien pliega mil pide un deseo.', { font: 'gothic', size: 16, maxWidth: 300 })
  const paraSvg = para.map((l, i) => ts.text(l, { font: 'gothic', size: 16, x: X, y: 216 + i * 24, fill: C.washi }).svg).join('')
  const missing = Math.max(0, 1000 - total)
  const left = ts.text(missing ? `Faltan ${num(missing)}.` : '¡Mil grullas plegadas!', { font: 'black', size: 18, x: X, y: 216 + para.length * 24 + 12, fill: C.washi })
  const legendY = H - 60
  const legend = `${crane({ x: X + 22, y: legendY - 8, s: 1.12 })}${ts.text(`cada grulla = ${num(per)} contribuciones`, { font: 'gothic', size: 15, x: X + 56, y: legendY, fill: C.washi }).svg}${paperSquare({ x: X + 22, y: legendY + 22, frac: 0.15 })}${ts.text('papel sin plegar = resto menor', { font: 'gothic', size: 15, x: X + 56, y: legendY + 28, fill: C.washi }).svg}`
  parts.push(`<g class="f">${kanji.svg}${titleEs.svg}${big.svg}${of.svg}${paraSvg}${left.svg}${legend}</g>`)
  parts.push(`<g class="c">${kKanji.svg}${kTitleEs.svg}${kBig.svg}${kOf.svg}${ts.text(missing ? `faltan ${num(missing)}` : 'deseo cumplido', { font: 'black', size: 32, x: X, y: 262, fill: C.washi }).svg}<g transform="translate(0 0)">${crane({ x: X + 34, y: 330, s: 1.9 })}</g>${ts.text(`= ${num(per)}`, { font: 'black', size: 32, x: X + 82, y: 344, fill: C.washi }).svg}${paperSquare({ x: X + 34, y: 386, frac: 0.5 })}${ts.text('= resto', { font: 'black', size: 32, x: X + 82, y: 398, fill: C.washi }).svg}</g>`)

  return {
    svg: doc({
      w: W,
      h: H,
      title: `Mil grullas: ${total} contribuciones de 1000 en el último año.`,
      body: parts.join(''),
      ts,
      css: responsive(600, '.cr{transform-box:fill-box;transform-origin:center;transform:scale(1.45)}'),
      defs: PATTERNS(),
    }),
    per,
    strands,
  }
}

function senbazuruStrands(totals, total) {
  return totals
    ? [
        ['commits', 'commits', totals.commits],
        ['pull requests', 'PRs', totals.pullRequests],
        ['issues', 'issues', totals.issues],
        ['revisiones', 'revis.', totals.reviews],
        ['repos nuevos', 'repos', totals.repos],
        ...(totals.restricted > 0 ? [['privadas', 'privadas', totals.restricted]] : []),
      ]
    : [['contribuciones', 'total', total]]
}

// ---------------------------------------------------------------------------
// Tira de kami cortada en segmentos proporcionales a los bytes de cada lenguaje.
// Los cortes entre segmentos son cortes de kirigami, con su doblez marcado.

export function languageShares(bytes) {
  const total = Object.values(bytes).reduce((a, b) => a + b, 0) || 1
  const sorted = Object.entries(bytes).sort((a, b) => b[1] - a[1])
  const main = sorted.filter(([, b], i) => b / total >= 0.05 && i < 6)
  const otherBytes = total - main.reduce((a, [, b]) => a + b, 0)
  const segs = [...main, ...(otherBytes > 0 ? [['Otros', otherBytes]] : [])]
  const pct = (b) => {
    const p = (b / total) * 100
    return p >= 10 ? `${Math.round(p)} %` : `${p.toFixed(1).replace('.', ',')} %`
  }
  return segs.map(([name, b]) => ({ name, bytes: b, share: b / total, pct: pct(b) }))
}

export function languages({ fonts, bytes, repoCount }) {
  const ts = new TypeSetter(fonts)
  const W = 1000
  const H = 300
  const segs = languageShares(bytes)
  const x0 = 40
  const x1 = W - 40
  const y0 = 100
  const h = 62
  const gap = 4
  const usable = x1 - x0 - gap * (segs.length - 1)
  const parts = [`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="${C.washi}" stroke="${C.aiDeep}" stroke-width="2"/>`]
  let x = x0
  const outside = { f: [], c: [] }
  const inside = { f: [], c: [] }
  segs.forEach((sg, idx) => {
    const w = sg.share * usable
    const op = sg.name === 'Otros' ? ` fill-opacity="${MUTED_OPACITY}"` : ''
    parts.push(`<rect x="${f1(x)}" y="${y0}" width="${f1(w)}" height="${h}" fill="${C.ai}"${op}/>`)
    // Doblez en valle a lo largo de cada corte (notación del mundo).
    if (idx > 0) parts.push(`<path d="M${f1(x - gap / 2)} ${y0 - 8}V${y0 - 2}M${f1(x - gap / 2)} ${y0 + h + 2}V${y0 + h + 8}" stroke="${C.aiDeep}" stroke-width="1.2"/>`)
    for (const [mode, size, small] of [['f', 16, 14], ['c', 30, 26]]) {
      const nW = ts.measure(sg.name, { font: 'black', size })
      const pW = ts.measure(sg.pct, { font: 'gothic', size: small })
      if (w >= Math.max(nW, pW) + 18) {
        inside[mode].push(`${ts.text(sg.name, { font: 'black', size, x: x + 9, y: y0 + (mode === 'f' ? 26 : 30), fill: C.washi }).svg}${ts.text(sg.pct, { font: 'gothic', size: small, x: x + 9, y: y0 + (mode === 'f' ? 47 : 56), fill: C.washi }).svg}`)
      } else outside[mode].push({ cx: x + w / 2, label: `${sg.name} ${sg.pct}`, name: sg.name, pct: sg.pct, size, small })
    }
    x += w + gap
  })
  // Completo: rótulos exteriores en dos filas escalonadas, con guía.
  {
    const rows = [-Infinity, -Infinity]
    const out = []
    for (const it of outside.f) {
      const width = Math.max(ts.measure(it.name, { font: 'black', size: it.size }), ts.measure(it.pct, { font: 'gothic', size: it.small }))
      const left = Math.max(x0, Math.min(it.cx - width / 2, x1 - width))
      const row = left > rows[0] + 12 ? 0 : 1
      rows[row] = left + width
      const ty = y0 + h + 32 + row * 46
      out.push(`<path d="M${f1(it.cx)} ${y0 + h + 10}V${f1(ty - it.size - 2)}" stroke="${C.aiDeep}" stroke-width="1"/>`)
      out.push(ts.text(it.name, { font: 'black', size: it.size, x: left, y: ty, fill: C.aiDeep }).svg)
      out.push(ts.text(it.pct, { font: 'gothic', size: it.small, x: left, y: ty + 19, fill: C.aiDeep }).svg)
    }
    parts.push(`<g class="f">${inside.f.join('')}${out.join('')}</g>`)
  }
  // Compacto: un rótulo por fila, alineado a la izquierda de su guía (los cortes de la
  // izquierda arriba, así las guías nunca cruzan un texto).
  {
    const out = []
    outside.c.forEach((it, k) => {
      const ty = y0 + h + 44 + k * 38
      const tw = ts.measure(it.label, { font: 'black', size: 28 })
      const right = Math.min(it.cx - 8, x1)
      const left = Math.max(x0, right - tw)
      out.push(`<path d="M${f1(it.cx)} ${y0 + h + 10}V${f1(ty - 9)}H${f1(left + tw + 4)}" fill="none" stroke="${C.aiDeep}" stroke-width="1.6"/>`)
      out.push(ts.text(it.label, { font: 'black', size: ts.fit(it.label, { font: 'black', size: 28, maxWidth: right - x0 }), x: left, y: ty, fill: C.aiDeep }).svg)
    })
    parts.push(`<g class="c">${inside.c.join('')}${out.join('')}</g>`)
  }
  const head = ts.text('言語', { font: 'mincho', size: 24, x: 40, y: 56, fill: C.aiDeep })
  parts.push(`<g class="f">${head.svg}${ts.text('· Lenguajes del código', { font: 'black', size: 17, x: 40 + head.width + 10, y: 54, fill: C.aiDeep }).svg}${ts.text(`por bytes, en ${repoCount} repos propios`, { font: 'gothic', size: 14, x: W - 40, y: 54, anchor: 'end', fill: C.aiDeep }).svg}</g>`)
  const kHead = ts.text('言語', { font: 'mincho', size: 44, x: 40, y: 66, fill: C.aiDeep })
  parts.push(`<g class="c">${kHead.svg}${ts.text('· Lenguajes', { font: 'black', size: 34, x: 40 + kHead.width + 14, y: 62, fill: C.aiDeep }).svg}</g>`)
  return doc({ w: W, h: H, title: 'Lenguajes del código por bytes', body: parts.join(''), ts, css: responsive(600) })
}

// ---------------------------------------------------------------------------
// Tanzaku por día de la semana. Los días a menos de un 5 % del máximo van en añil pleno.

export function weekly({ fonts, rhythm: r }) {
  const ts = new TypeSetter(fonts)
  const W = 1000
  const H = 400
  const ink = C.aiDeep
  const max = Math.max(1, ...r.byWeekday)
  const rodY = 108
  const sw = 92
  const sg = 38
  const sx0 = (W - (7 * sw + 6 * sg)) / 2
  const maxL = 170
  const parts = [`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="${C.washi}" stroke="${ink}" stroke-width="2"/>`]
  parts.push(`<path d="M${sx0 - 14} ${rodY}H${sx0 + 7 * sw + 6 * sg + 14}" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`)
  r.byWeekday.forEach((v, i) => {
    const x = sx0 + i * (sw + sg)
    const L = Math.max(4, (v / max) * maxL)
    const top = rodY + 14
    const peak = r.peaks.includes(i)
    const op = peak ? '' : ` fill-opacity="${MUTED_OPACITY}"`
    // Tanzaku: tira de papel con el corte superior en dos picos y su cordón.
    parts.push(`<path d="M${x + sw / 2} ${rodY}V${top + 10}" stroke="${ink}" stroke-width="1.1"/>`)
    parts.push(`<path d="M${x} ${top + 6}L${x + sw / 2} ${top}L${x + sw} ${top + 6}V${f1(top + L)}H${x}Z" fill="${C.ai}"${op}/>`)
    parts.push(`<circle cx="${x + sw / 2}" cy="${top + 10}" r="2.8" fill="${C.washi}"/>`)
    parts.push(`<g class="f">${ts.text(WEEKDAYS[i], { font: 'black', size: 15, x: x + sw / 2, y: rodY - 12, anchor: 'middle', fill: ink }).svg}${ts.text(num(v), { font: peak ? 'black' : 'gothic', size: 15, x: x + sw / 2, y: top + L + 22, anchor: 'middle', fill: ink }).svg}</g>`)
    parts.push(`<g class="c">${ts.text(WEEKDAYS[i], { font: 'black', size: 30, x: x + sw / 2, y: rodY - 12, anchor: 'middle', fill: ink }).svg}${ts.text(num(v), { font: 'black', size: 30, x: x + sw / 2, y: top + L + 36, anchor: 'middle', fill: ink }).svg}</g>`)
  })

  const line = streakLine(r)
  const peakLine = `Más activos: ${peakNames(r)}.`
  parts.push(`<g class="f">${ts.text(`${line} ${peakLine}`, { font: 'gothic', size: ts.fit(`${line} ${peakLine}`, { font: 'gothic', size: 15, maxWidth: W - 80 }), x: 40, y: H - 28, fill: ink }).svg}</g>`)
  const kLine = r.current === r.longest.len && r.current > 0 ? `racha: ${r.current} días, récord` : `racha récord: ${r.longest.len} días`
  parts.push(`<g class="c">${ts.text(kLine, { font: 'black', size: ts.fit(kLine, { font: 'black', size: 32, maxWidth: W - 80 }), x: 40, y: H - 24, fill: ink }).svg}</g>`)
  const head = ts.text('週', { font: 'mincho', size: 24, x: 40, y: 56, fill: ink })
  parts.push(`<g class="f">${head.svg}${ts.text('· Ritmo semanal', { font: 'black', size: 17, x: 40 + head.width + 10, y: 54, fill: ink }).svg}${ts.text('contribuciones por día de la semana, último año', { font: 'gothic', size: 14, x: W - 40, y: 54, anchor: 'end', fill: ink }).svg}</g>`)
  const kHead = ts.text('週', { font: 'mincho', size: 40, x: 40, y: 52, fill: ink })
  parts.push(`<g class="c">${kHead.svg}${ts.text('· Ritmo semanal', { font: 'black', size: 30, x: 40 + kHead.width + 14, y: 49, fill: ink }).svg}</g>`)
  return doc({ w: W, h: H, title: 'Ritmo semanal de contribuciones', body: parts.join(''), ts, css: responsive(600) })
}

// ---------------------------------------------------------------------------
// Sección del README con los valores en el texto alternativo y una tabla de datos:
// la versión accesible de los tres gráficos. El build la escribe entre marcadores.

export function statsMarkdown({ base, total, per, strands, langs, repoCount, rhythm: r }) {
  const types = strands.map(([label, , v]) => `${label} ${v}`).join(', ')
  const langsText = langs.map((l) => `${l.name} ${l.pct}`).join(', ')
  const days = r.byWeekday.map((v, i) => `${WEEKDAYS_LONG[i]} ${v}`).join(', ')
  const alt = (s) => s.replace(/"/g, '&quot;')
  return [
    `<img src="${base}/senbazuru.svg" width="100%" alt="${alt(`千羽鶴, mil grullas: ${total} de 1000 contribuciones en el último año, contadas como grullas de papel colgadas en hilos por tipo (cada grulla equivale a ${per}): ${types}.`)}">`,
    '',
    `<img src="${base}/lenguajes.svg" width="100%" alt="${alt(`言語, lenguajes del código por bytes en ${repoCount} repos propios: ${langsText}.`)}">`,
    '',
    `<img src="${base}/ritmo.svg" width="100%" alt="${alt(`週, ritmo semanal: contribuciones del último año por día de la semana: ${days}. ${streakLine(r)} Más activos: ${peakNames(r)}.`)}">`,
    '',
    '<details>',
    '<summary>Ver los datos de las estadísticas</summary>',
    '',
    '| Contribuciones del último año | Cantidad |',
    '| --- | ---: |',
    ...strands.map(([label, , v]) => `| ${label} | ${v} |`),
    `| **total** | **${total}** |`,
    '',
    '| Lenguaje | Parte de los bytes |',
    '| --- | ---: |',
    ...langs.map((l) => `| ${l.name} | ${l.pct} |`),
    '',
    '| Día | Contribuciones |',
    '| --- | ---: |',
    ...r.byWeekday.map((v, i) => `| ${WEEKDAYS_LONG[i]} | ${v} |`),
    '',
    streakLine(r),
    '',
    '</details>',
  ].join('\n')
}
