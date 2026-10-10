// Descarga (una vez) los recortes de fuentes que usa el concepto origami.
// Google Fonts entrega un TTF con solo los caracteres pedidos en `text=`:
// latín completo para el contenido dinámico y el vocabulario japonés de config.mjs.
// Uso: node origami/fonts/fetch.mjs   (los .ttf resultantes se versionan)
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { JP } from '../config.mjs'

const here = dirname(fileURLToPath(import.meta.url))
let latin = ''
for (let c = 32; c < 127; c++) latin += String.fromCharCode(c)
latin += 'áéíóúÁÉÍÓÚñÑüÜ¿¡º°–—·«»…’“”×'
const text = [...new Set(latin + JP.join(''))].join('')

const faces = [
  ['Zen Kaku Gothic New', 500, 'zen-kaku-gothic-new-500.ttf'],
  ['Zen Kaku Gothic New', 900, 'zen-kaku-gothic-new-900.ttf'],
  ['Shippori Mincho B1', 800, 'shippori-mincho-b1-800.ttf'],
]

for (const [family, weight, file] of faces) {
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=${family.replaceAll(' ', '+')}:wght@${weight}&text=${encodeURIComponent(text)}`)
  ).text()
  const url = /url\((https:[^)]+)\)/.exec(css)?.[1]
  if (!url) throw new Error(`Sin URL para ${family} ${weight}: ${css.slice(0, 200)}`)
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
  writeFileSync(join(here, file), buf)
  console.log(`${file}  ${(buf.length / 1024).toFixed(1)} KB`)
}
