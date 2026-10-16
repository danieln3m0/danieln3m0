// Renderizado de las tarjetas SVG con la paleta Tokyo Night del resto del README.
import { OCTICONS } from './icons.mjs'

const C = {
  bg: '#1a1b27',
  border: '#414868',
  title: '#70a5fd',
  text: '#38bdae',
  accent: '#bf91f3',
  muted: '#565f89',
  gold: '#e0af68',
  blue: '#7aa2f7',
  green: '#9ece6a',
  silver: '#a9b1d6',
}
const FONT = "'Segoe UI', Ubuntu, 'Helvetica Neue', Sans-Serif"

export function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const num = (n) => Number(n).toLocaleString('es-PE')
const count = (n, t) => `${num(n)} ${n === 1 ? t.one : t.unit}`

function rankColor(rank) {
  if (!rank) return C.muted
  if (rank.startsWith('S')) return C.gold
  if (rank.startsWith('A')) return C.blue
  if (rank === 'B') return C.green
  return C.silver
}

function svgDoc(width, height, title, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title">
<title id="title">${escapeXml(title)}</title>
<style>
  text { font-family: ${FONT}; }
</style>
${body}
</svg>
`
}

// trophies: salida de buildTrophies() (lib/trophies.mjs)
export function renderTrophies(trophies, { columns = 4 } = {}) {
  const w = 195
  const h = 132
  const gap = 20
  const rows = Math.ceil(trophies.length / columns)
  const width = columns * w + (columns - 1) * gap
  const height = rows * h + (rows - 1) * gap
  const cards = trophies.map((t, i) => {
    const x = (i % columns) * (w + gap)
    const y = Math.floor(i / columns) * (h + gap)
    const color = rankColor(t.rank)
    const letter = t.rank ?? '?'
    const letterSize = letter.length >= 3 ? 15 : letter.length === 2 ? 18 : 22
    const caption = t.next === null ? 'Rango máximo alcanzado' : `Siguiente: ${count(t.next, t)}`
    return `<g transform="translate(${x} ${y})">
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="10" fill="${C.bg}" stroke="${C.border}"/>
  <circle cx="44" cy="50" r="27" fill="none" stroke="${color}" stroke-width="3"${t.rank ? '' : ' stroke-dasharray="5 4"'}/>
  <text x="44" y="50" dy="0.35em" text-anchor="middle" font-size="${letterSize}" font-weight="800" fill="${color}">${escapeXml(letter)}</text>
  <text x="84" y="44" font-size="15" font-weight="600" fill="${C.title}">${escapeXml(t.title)}</text>
  <text x="84" y="66" font-size="13" fill="${C.text}">${escapeXml(count(t.value, t))}</text>
  <g transform="translate(${w - 36} 14) scale(1.25)" fill="${C.accent}">${OCTICONS[t.key] ?? ''}</g>
  <rect x="18" y="94" width="${w - 36}" height="6" rx="3" fill="${C.border}"/>
  <rect x="18" y="94" width="${((w - 36) * t.progress).toFixed(1)}" height="6" rx="3" fill="${color}"/>
  <text x="18" y="118" font-size="11" fill="${C.muted}">${escapeXml(caption)}</text>
</g>`
  })
  return svgDoc(width, height, 'Trofeos de GitHub', cards.join('\n'))
}

// achievements: [{ name, tier, dataUri }]
export function renderAchievements(achievements) {
  const cell = 150
  const height = 170
  if (!achievements.length) {
    return svgDoc(
      400,
      80,
      'Logros de GitHub',
      `<rect x="0.5" y="0.5" width="399" height="79" rx="10" fill="${C.bg}" stroke="${C.border}"/>
<text x="200" y="40" dy="0.35em" text-anchor="middle" font-size="14" fill="${C.text}">Aún no hay logros desbloqueados</text>`,
    )
  }
  const width = achievements.length * cell
  const items = achievements.map((a, i) => {
    const x = i * cell
    const tier = a.tier
      ? `<rect x="${cell / 2 + 14}" y="88" width="36" height="20" rx="10" fill="${C.gold}"/>
  <text x="${cell / 2 + 32}" y="98" dy="0.35em" text-anchor="middle" font-size="12" font-weight="700" fill="${C.bg}">${escapeXml(a.tier)}</text>`
      : ''
    return `<g transform="translate(${x} 0)">
  <image x="${(cell - 100) / 2}" y="10" width="100" height="100" href="${escapeXml(a.dataUri)}"/>
  ${tier}
  <text x="${cell / 2}" y="140" text-anchor="middle" font-size="14" font-weight="600" fill="${C.title}">${escapeXml(a.name)}</text>
</g>`
  })
  return svgDoc(width, height, 'Logros de GitHub', items.join('\n'))
}

// days: [{ date: 'YYYY-MM-DD', count }] en orden cronológico; se dibujan los últimos `span`.
export function renderActivityGraph(days, { span = 31 } = {}) {
  const data = days.slice(-span)
  const width = 840
  const height = 320
  const pad = { left: 48, right: 24, top: 64, bottom: 44 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom
  const total = data.reduce((s, d) => s + d.count, 0)
  const max = Math.max(...data.map((d) => d.count), 0)
  const step = niceStep(max)
  const top = Math.max(step * 4, step)
  const x = (i) => pad.left + (data.length > 1 ? (i * plotW) / (data.length - 1) : plotW / 2)
  const y = (v) => pad.top + plotH - (v / top) * plotH

  const grid = []
  for (let v = 0; v <= top; v += step) {
    grid.push(`<line x1="${pad.left}" x2="${width - pad.right}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="${C.border}" stroke-dasharray="${v === 0 ? '0' : '3 4'}"/>
<text x="${pad.left - 10}" y="${y(v).toFixed(1)}" dy="0.35em" text-anchor="end" font-size="11" fill="${C.muted}">${v}</text>`)
  }
  const labels = data.map(
    (d, i) =>
      `<text x="${x(i).toFixed(1)}" y="${height - pad.bottom + 20}" text-anchor="middle" font-size="10" fill="${C.muted}">${Number(d.date.slice(8, 10))}</text>`,
  )
  const pts = data.map((d, i) => `${x(i).toFixed(1)},${y(d.count).toFixed(1)}`)
  const line = data.length ? `M${pts.join(' L')}` : ''
  const area = data.length
    ? `${line} L${x(data.length - 1).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`
    : ''
  const dots = data.map(
    (d, i) =>
      `<circle cx="${x(i).toFixed(1)}" cy="${y(d.count).toFixed(1)}" r="3.5" fill="${C.accent}"><title>${escapeXml(`${d.date}: ${d.count}`)}</title></circle>`,
  )
  const range = data.length ? `${data[0].date} → ${data[data.length - 1].date}` : ''

  const body = `<defs>
  <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.title}" stop-opacity="0.45"/>
    <stop offset="1" stop-color="${C.title}" stop-opacity="0"/>
  </linearGradient>
</defs>
<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="10" fill="${C.bg}" stroke="${C.border}"/>
<text x="${pad.left}" y="34" font-size="18" font-weight="600" fill="${C.title}">Contribuciones de los últimos ${data.length} días</text>
<text x="${width - pad.right}" y="34" text-anchor="end" font-size="13" fill="${C.text}">${escapeXml(`${num(total)} contribuciones · ${range}`)}</text>
${grid.join('\n')}
${labels.join('\n')}
<path d="${area}" fill="url(#area)"/>
<path d="${line}" fill="none" stroke="${C.title}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
<g>${dots.join('')}</g>
<text x="${width / 2}" y="${height - 8}" text-anchor="middle" font-size="11" fill="${C.muted}">Día del mes</text>`
  return svgDoc(width, height, `Gráfico de contribuciones: ${total} en ${data.length} días`, body)
}

// Paso "bonito" (1, 2, 5, 10…) para que el eje Y tenga 4 divisiones.
export function niceStep(max) {
  if (max <= 4) return 1
  const raw = max / 4
  const mag = 10 ** Math.floor(Math.log10(raw))
  for (const m of [1, 2, 5, 10]) if (m * mag >= raw) return m * mag
  return 10 * mag
}
