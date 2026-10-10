// Vista previa local: renderiza README.md con la API de Markdown de GitHub (el
// mismo saneado que usa el perfil) y apunta las imágenes a ../dist.
// Uso: GITHUB_TOKEN=... node preview.mjs  →  .impeccable/review/preview-{light,dark}.html
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const outDir = join(root, '.impeccable', 'review')
const token = process.env.GITHUB_TOKEN

const res = await fetch('https://api.github.com/markdown', {
  method: 'POST',
  headers: {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'herbario-preview',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify({ text: readFileSync(join(root, 'README.md'), 'utf8'), mode: 'gfm', context: 'danieln3m0/danieln3m0' }),
})
if (!res.ok) throw new Error(`Markdown API ${res.status}: ${await res.text()}`)
// Las imágenes del herbario viven en la rama output y las del concepto origami en output-origami.
let html = (await res.text())
  .replaceAll('https://github.com/danieln3m0/danieln3m0/raw/output-origami', pathToFileURL(join(root, 'dist-origami')).href)
  .replaceAll('https://github.com/danieln3m0/danieln3m0/raw/output', pathToFileURL(join(root, 'dist')).href)
html = html.replace(/src="https:\/\/camo\.githubusercontent\.com\/[^"]+"([^>]*?)data-canonical-src="([^"]+)"/g, 'src="$2"$1')

const page = (theme) => `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vista previa del perfil (${theme})</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.8.1/github-markdown-${theme}.css">
<style>
  body{margin:0;background:${theme === 'dark' ? '#0d1117' : '#ffffff'};font-family:-apple-system,"Segoe UI",sans-serif}
  .top{height:62px;border-bottom:1px solid ${theme === 'dark' ? '#30363d' : '#d1d9e0'}}
  .wrap{max-width:1280px;margin:0 auto;padding:24px 32px;display:grid;grid-template-columns:296px 1fr;gap:24px}
  .side .av{width:296px;height:296px;border-radius:50%;background:${theme === 'dark' ? '#21262d' : '#eaeef2'}}
  .box{border:1px solid ${theme === 'dark' ? '#30363d' : '#d1d9e0'};border-radius:6px;padding:24px}
  @media (max-width:767px){.wrap{display:block;padding:16px}.side{display:none}.box{padding:16px}}
</style></head>
<body><div class="top"></div><div class="wrap"><div class="side"><div class="av"></div></div>
<div class="box"><article class="markdown-body">${html}</article></div></div></body></html>`

mkdirSync(outDir, { recursive: true })
for (const theme of ['light', 'dark']) writeFileSync(join(outDir, `preview-${theme}.html`), page(theme))
console.log(`Vista previa en ${outDir}`)
