// Pliega el concepto origami: lee los repos y el calendario de GitHub y escribe
// los SVG en ../dist-origami. Reutiliza la lectura de datos y la tipografía del herbario.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as cfg from './config.mjs'
import { contributionTotals, contributions, repoInfo, repoLanguages, repoTree, userRepos } from '../herbario/lib/github.mjs'
import { countFiles, hierarchy, prune, seeded } from '../herbario/lib/plant.mjs'
import { parseFont } from '../herbario/lib/type.mjs'
import { footer, header, linkTag, notation, strip, tessellation, work } from './lib/render.mjs'
import { capFlaps } from './lib/treemethod.mjs'
import { languageShares, languages, rhythm, senbazuru, statsMarkdown, weekly } from './lib/stats.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '..', 'dist-origami')
const token = process.env.GITHUB_TOKEN || ''
const fonts = {
  gothic: parseFont(join(here, 'fonts', 'zen-kaku-gothic-new-500.ttf')),
  black: parseFont(join(here, 'fonts', 'zen-kaku-gothic-new-900.ttf')),
  mincho: parseFont(join(here, 'fonts', 'shippori-mincho-b1-800.ttf')),
}

const date = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Lima' })
  .format(new Date())
  .replace('.', '')

mkdirSync(out, { recursive: true })
const write = (name, svg) => {
  writeFileSync(join(out, name), svg)
  console.log(`  ${name}  ${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB`)
}

console.log(`Plegando el concepto origami (${date})${token ? '' : ' sin token'}`)

// Obras: un patrón de pliegue por repositorio.
const trees = new Map()
for (const [i, spec] of cfg.specimens.entries()) {
  const seal = cfg.seals[spec.id]
  if (!spec.repo) {
    write(`obra-${spec.id}.svg`, work({ fonts, spec, seal, index: i }))
    continue
  }
  const info = await repoInfo(spec.repo, token)
  const files = await repoTree(spec.repo, info.branch, token)
  const full = hierarchy(files)
  trees.set(spec.repo, full)
  // Como mucho 30 solapas por patrón (lo que promete el README).
  const tree = capFlaps(prune(full, { maxLeaves: 30, maxDepth: 3, maxBranches: 5 }, seeded(spec.id)), 30)
  write(`obra-${spec.id}.svg`, work({ fonts, spec, tree, seal, info, files: countFiles(files), index: i }))
}

// Cabecera: la cuenta entera como un solo modelo; cada repo es una rama del árbol.
const repos = [...(await userRepos(cfg.user, token)), ...(await Promise.all(cfg.extraRepos.map((r) => repoInfo(r, token))))]
const account = { name: '', files: [], dirs: new Map() }
for (const r of repos.sort((a, b) => a.created.localeCompare(b.created))) {
  if (cfg.skipRepos.includes(r.full)) continue
  const full = trees.get(r.full) ?? hierarchy(await repoTree(r.full, r.branch, token))
  if (!full.count) continue
  const node = prune(full, { maxLeaves: 5, maxDepth: 1, maxBranches: 2 }, seeded(r.full))
  node.name = r.name
  account.dirs.set(r.name, node)
}
write('cabecera.svg', header({ fonts, tree: account, owner: cfg.owner, award: cfg.award, date, tags: cfg.headerTags }))

// Cómo leer: un repositorio de ejemplo (marcado como tal en la pieza).
const file = (name, kind) => ({ name, kind })
const example = {
  name: '',
  files: [file('README.md', 'doc'), file('package.json', 'data')],
  dirs: new Map([
    ['src', { name: 'src', files: [file('a.ts', 'code'), file('b.ts', 'code'), file('c.ts', 'code')], dirs: new Map() }],
    ['docs', { name: 'docs', files: [file('guia.md', 'doc'), file('api.md', 'doc')], dirs: new Map() }],
  ]),
}
write('notacion.svg', notation({ fonts, example }))

// Teselado de contribuciones.
const days = await contributions(cfg.user, token)
write('teselado.svg', tessellation({ fonts, days: days.slice(-371), date }).svg)

// Estadísticas: contribuciones por tipo (mil grullas), lenguajes y ritmo semanal.
const r = rhythm(days)
const sb = senbazuru({ fonts, totals: await contributionTotals(cfg.user, token), total: r.total, date })
write('senbazuru.svg', sb.svg)
const own = repos.filter((x) => !x.fork && !cfg.skipRepos.includes(x.full))
const bytes = {}
for (const x of own) for (const [lang, b] of Object.entries(await repoLanguages(x.full, token))) bytes[lang] = (bytes[lang] ?? 0) + b
write('lenguajes.svg', languages({ fonts, bytes, repoCount: own.length }))
write('ritmo.svg', weekly({ fonts, rhythm: r }))

// Los valores también van al README (texto alternativo y tabla de datos), entre marcadores.
const readmePath = join(here, '..', 'README.md')
const readme = readFileSync(readmePath, 'utf8')
const START = '<!-- estadisticas:inicio -->'
const END = '<!-- estadisticas:fin -->'
if (readme.includes(START) && readme.includes(END)) {
  const section = statsMarkdown({
    base: 'https://github.com/danieln3m0/danieln3m0/raw/output-origami',
    total: r.total,
    per: sb.per,
    strands: sb.strands,
    langs: languageShares(bytes),
    repoCount: own.length,
    rhythm: r,
  })
  const next = `${readme.slice(0, readme.indexOf(START) + START.length)}\n${section}\n${readme.slice(readme.indexOf(END))}`
  if (next !== readme) {
    writeFileSync(readmePath, next)
    console.log('  README.md  estadísticas actualizadas')
  }
}

// Piezas fijas.
for (const [id, s] of Object.entries(cfg.sections)) write(`tira-${id}.svg`, strip({ fonts, jp: s.jp, es: s.es }))
for (const l of cfg.links) write(`enlace-${l.id}.svg`, linkTag({ fonts, label: l.label, external: l.external }))
write('pie.svg', footer({ fonts, owner: cfg.owner, date }))
console.log('Listo.')
