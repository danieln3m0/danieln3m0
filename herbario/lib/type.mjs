// Tipografía convertida a trazos: los SVG se ven dentro de <img>, donde no se
// pueden cargar fuentes externas. Cada glifo se define una vez por documento en
// <defs> y se reutiliza con <use>, así el peso del archivo no crece con el texto.
import opentype from 'opentype.js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const FILES = {
  display: 'libre-franklin-latin-800-normal.ttf',
  caps: 'libre-franklin-latin-600-normal.ttf',
  typed: 'courier-prime-latin-400-normal.ttf',
  typedBold: 'courier-prime-latin-700-normal.ttf',
  italic: 'libre-caslon-text-latin-400-italic.ttf',
}

export function loadFonts(dir) {
  const fonts = {}
  for (const [key, file] of Object.entries(FILES)) {
    const buf = readFileSync(join(dir, file))
    fonts[key] = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
  }
  return fonts
}

const r1 = (n) => Math.round(n * 10) / 10

export class TypeSetter {
  constructor(fonts) {
    this.fonts = fonts
    this.used = new Map() // id -> path data
  }

  glyphs(str, fontKey) {
    const font = this.fonts[fontKey]
    return font.stringToGlyphs(str)
  }

  measure(str, { font = 'typed', size, tracking = 0 }) {
    const f = this.fonts[font]
    const glyphs = f.stringToGlyphs(str)
    const k = size / f.unitsPerEm
    let w = 0
    glyphs.forEach((g, i) => {
      w += g.advanceWidth * k
      if (i < glyphs.length - 1) w += f.getKerningValue(g, glyphs[i + 1]) * k + tracking * size
    })
    return w
  }

  // Ajusta el tamaño para que el texto quepa en maxWidth.
  fit(str, { font, size, tracking = 0, maxWidth }) {
    const w = this.measure(str, { font, size, tracking })
    return w > maxWidth ? size * (maxWidth / w) : size
  }

  wrap(str, { font = 'typed', size, tracking = 0, maxWidth }) {
    const words = str.split(/\s+/)
    const lines = []
    let line = ''
    for (const word of words) {
      const next = line ? `${line} ${word}` : word
      if (line && this.measure(next, { font, size, tracking }) > maxWidth) {
        lines.push(line)
        line = word
      } else line = next
    }
    if (line) lines.push(line)
    return lines
  }

  // Registra el glifo en <defs>; devuelve null si no tiene trazo (espacios).
  ref(fontKey, glyph) {
    const id = `${fontKey}${glyph.index}`
    if (!this.used.has(id)) {
      const f = this.fonts[fontKey]
      const d = glyph.getPath(0, 0, f.unitsPerEm).toPathData(0)
      this.used.set(id, d)
    }
    return this.used.get(id) ? id : null
  }

  // Devuelve un <g> con un <use> por glifo. anchor: start | middle | end
  text(str, { font = 'typed', size, x = 0, y = 0, anchor = 'start', tracking = 0, fill, extra = '' }) {
    const f = this.fonts[font]
    const k = size / f.unitsPerEm
    const glyphs = f.stringToGlyphs(str)
    const width = this.measure(str, { font, size, tracking })
    let cx = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x
    const uses = []
    glyphs.forEach((g, i) => {
      const id = this.ref(font, g)
      if (id) uses.push(`<use href="#${id}" x="${r1(cx / k)}" y="${r1(y / k)}"/>`)
      cx += g.advanceWidth * k
      if (i < glyphs.length - 1) cx += f.getKerningValue(g, glyphs[i + 1]) * k + tracking * size
    })
    const fillAttr = fill ? ` fill="${fill}"` : ''
    return { svg: `<g${fillAttr} transform="scale(${+k.toFixed(5)})"${extra}>${uses.join('')}</g>`, width }
  }

  // Texto sobre un círculo (sellos de goma). startAngle en grados desde arriba, sentido horario.
  arc(str, { font = 'caps', size, cx, cy, r, startAngle = 0, span = 360, tracking = 0, fill }) {
    const f = this.fonts[font]
    const glyphs = f.stringToGlyphs(str)
    const circumference = (2 * Math.PI * r * span) / 360
    // Si el texto no cabe en la circunferencia se reduce el cuerpo, nunca se apiñan las letras.
    const natural = glyphs.reduce((a, g) => a + (g.advanceWidth / f.unitsPerEm + tracking) * size, 0)
    if (natural > circumference * 0.97) size *= (circumference * 0.97) / natural
    const k = size / f.unitsPerEm
    const advances = glyphs.map((g) => g.advanceWidth * k + tracking * size)
    const total = advances.reduce((a, b) => a + b, 0)
    const scale = circumference / total
    let s = 0
    const parts = []
    glyphs.forEach((g, i) => {
      const adv = advances[i] * scale
      const mid = s + adv / 2
      const angle = startAngle + (mid / (2 * Math.PI * r)) * 360
      const id = this.ref(font, g)
      if (id) {
        const gw = g.advanceWidth * k
        parts.push(
          `<use href="#${id}" transform="rotate(${r1(angle)} ${cx} ${cy}) translate(${r1(cx - gw / 2)} ${r1(cy - r)}) scale(${+k.toFixed(5)})"/>`,
        )
      }
      s += adv
    })
    return `<g fill="${fill}">${parts.join('')}</g>`
  }

  defs() {
    return [...this.used]
      .filter(([, d]) => d)
      .map(([id, d]) => `<path id="${id}" d="${d}"/>`)
      .join('')
  }
}
