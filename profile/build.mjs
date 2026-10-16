// Genera dist/trophies.svg, dist/achievements.svg y dist/activity-graph.svg, y
// actualiza la sección "activity" del README. Cada tarea es independiente: si una
// falla se avisa y se conserva el archivo anterior (el workflow lo restaura de la
// rama `output` antes de ejecutar este script).
//
// Uso local: GITHUB_TOKEN=$(gh auth token) node build.mjs
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseAchievements } from './lib/achievements.mjs'
import { renderActivity, summarizeEvents } from './lib/activity.mjs'
import { achievementsPage, imageDataUri, profileStats, publicEvents, pullRequest } from './lib/github.mjs'
import { replaceSection } from './lib/readme.mjs'
import { renderAchievements, renderActivityGraph, renderTrophies } from './lib/svg.mjs'
import { buildTrophies } from './lib/trophies.mjs'

const LOGIN = process.env.PROFILE_LOGIN || 'danieln3m0'
const TOKEN = process.env.GITHUB_TOKEN
const TIME_ZONE = 'America/Lima'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(root, 'dist')
const README = path.join(root, 'README.md')

let stats
const loadStats = async () => (stats ??= await profileStats(LOGIN, TOKEN))

const tasks = {
  async trofeos() {
    const { stats: totals } = await loadStats()
    await writeFile(path.join(OUT, 'trophies.svg'), renderTrophies(buildTrophies(totals)))
  },

  async 'grafico de actividad'() {
    const { days } = await loadStats()
    await writeFile(path.join(OUT, 'activity-graph.svg'), renderActivityGraph(days))
  },

  async logros() {
    const list = parseAchievements(await achievementsPage(LOGIN))
    // Una página sin logros suele ser un cambio de HTML de GitHub, no la realidad.
    if (!list.length) throw new Error('No se encontró ningún logro en la página del perfil')
    // Una imagen caída solo omite ese logro, no toda la tarjeta.
    const results = await Promise.allSettled(list.map(async (a) => ({ ...a, dataUri: await imageDataUri(a.image) })))
    const withImages = results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
    for (const r of results) if (r.status === 'rejected') console.log(`::warning::${r.reason.message}`)
    if (!withImages.length) throw new Error('No se pudo descargar ninguna imagen de logros')
    await writeFile(path.join(OUT, 'achievements.svg'), renderAchievements(withImages))
  },

  async 'actividad reciente'() {
    const events = await publicEvents(LOGIN, TOKEN)
    const items = summarizeEvents(events, { max: 8, exclude: [`${LOGIN}/${LOGIN}`], timeZone: TIME_ZONE })
    // Los eventos de PR ya no traen el título: se pide cada PR mostrado.
    await Promise.all(
      items
        .filter((it) => (it.kind === 'pr' || it.kind === 'review') && !it.title)
        .map(async (it) => {
          try {
            const pr = await pullRequest(it.repo, it.number, TOKEN)
            it.title = pr.title
            if (it.kind === 'pr') {
              it.url = pr.html_url
              // Con el payload reducido, un "closed" no dice si se fusionó.
              if (it.action === 'closed' && pr.merged) it.action = 'merged'
            }
          } catch (err) {
            console.log(`::notice::Sin título para ${it.repo}#${it.number}: ${err.message}`)
          }
        }),
    )
    const before = await readFile(README, 'utf8')
    const after = replaceSection(before, 'activity', renderActivity(items, { timeZone: TIME_ZONE, owner: LOGIN }))
    if (after !== before) await writeFile(README, after)
    console.log(after === before ? 'README sin cambios' : 'README actualizado')
  },
}

// PROFILE_TASKS="actividad reciente" ejecuta solo esas tareas (separadas por comas).
const only = process.env.PROFILE_TASKS?.split(',').map((t) => t.trim()).filter(Boolean)
const selected = Object.entries(tasks).filter(([name]) => !only?.length || only.includes(name))
if (!selected.length) throw new Error(`PROFILE_TASKS no coincide con ninguna tarea: ${Object.keys(tasks).join(', ')}`)

await mkdir(OUT, { recursive: true })
let failed = 0
for (const [name, run] of selected) {
  try {
    await run()
    console.log(`✓ ${name}`)
  } catch (err) {
    failed++
    console.log(`::warning::Falló "${name}": ${err.message}`)
  }
}
// El workflow publica lo que sí se generó y marca el job en rojo al final si algo falló.
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `failed=${failed}\n`)
if (failed === selected.length) process.exit(1)
