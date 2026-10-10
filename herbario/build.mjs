// Prensa el herbario: lee los repos y el calendario de GitHub y escribe los SVG en ../dist.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as cfg from './config.mjs'
import { contributions, repoInfo, repoTree, userRepos } from './lib/github.mjs'
import { countFiles, hierarchy, prune, seeded } from './lib/plant.mjs'
import { footer, header, leafKey, linkTag, phenology, specimen, tab } from './lib/render.mjs'
import { loadFonts } from './lib/type.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '..', 'dist')
const token = process.env.GITHUB_TOKEN || ''
const fonts = loadFonts(join(here, 'fonts'))

const date = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Lima' })
  .format(new Date())
  .replace('.', '')

mkdirSync(out, { recursive: true })
const write = (name, svg) => {
  writeFileSync(join(out, name), svg)
  console.log(`  ${name}  ${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB`)
}

// Raíces de un ejemplar: archivos sueltos en la raíz del repo. El resto es la parte aérea.
const rootFiles = (tree) => tree.files.slice(0, 14).map((f) => ({ size: f.size }))
const aerial = (tree) => ({ ...tree, files: [] })

console.log(`Prensando el herbario (${date})${token ? '' : ' sin token'}`)

// Ejemplares tipo.
const trees = new Map()
for (const [i, spec] of cfg.specimens.entries()) {
  const number = String(i + 1).padStart(3, '0')
  if (!spec.repo) {
    write(`ejemplar-${spec.id}.svg`, specimen({ fonts, spec, number, date }))
    continue
  }
  const info = await repoInfo(spec.repo, token)
  const files = await repoTree(spec.repo, info.branch, token)
  const full = hierarchy(files)
  trees.set(spec.repo, { info, full })
  const pruned = prune(aerial(full), { maxLeaves: 200, maxDepth: 4, maxBranches: 7 }, seeded(spec.id))
  write(
    `ejemplar-${spec.id}.svg`,
    specimen({ fonts, spec, tree: pruned, roots: rootFiles(full), number, info, files: countFiles(files), date }),
  )
}

// Planta de la cuenta: cada repo propio es una rama (los más antiguos abajo) y los forks son raíces.
const repos = [...(await userRepos(cfg.user, token)), ...(await Promise.all(cfg.extraRepos.map((r) => repoInfo(r, token))))]
const account = { name: '', files: [], dirs: new Map() }
const forkRoots = []
for (const r of repos) {
  if (cfg.skipRepos.includes(r.full)) continue
  if (r.fork) {
    forkRoots.push({ size: 4000, tag: cfg.headerTags[r.name] })
    continue
  }
  const cached = trees.get(r.full)
  const full = cached ? cached.full : hierarchy(await repoTree(r.full, r.branch, token))
  if (!full.count) continue
  const node = prune(full, { maxLeaves: 26, maxDepth: 3, maxBranches: 4 }, seeded(r.full))
  node.name = r.name
  node.created = r.created
  account.dirs.set(r.name, node)
}
account.count = [...account.dirs.values()].reduce((a, d) => a + d.count, 0)
write('cabecera.svg', header({ fonts, tree: account, roots: forkRoots, tags: cfg.headerTags, owner: cfg.owner, award: cfg.award, date }))

// Fenología.
const days = await contributions(cfg.user, token)
const pheno = phenology({ fonts, days: days.slice(-364), date })
write('fenologia.svg', pheno.svg)

// Piezas fijas.
write('clave.svg', leafKey({ fonts }))
write('pie.svg', footer({ fonts, date }))
for (const [id, text] of Object.entries(cfg.sections)) write(`pestana-${id}.svg`, tab({ fonts, text }).svg)
for (const l of cfg.links) write(`enlace-${l.id}.svg`, linkTag({ fonts, label: l.label, external: l.external }).svg)

writeFileSync(join(out, 'colecta.json'), JSON.stringify({ date, repos: repos.length, contributions: pheno.total }, null, 2))
console.log('Listo.')
