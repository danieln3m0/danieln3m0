// Convierte los eventos públicos de GitHub en la lista "Actividad Reciente" del README.
// Desde 2025 el Events API ya no incluye el título de los PR ni el detalle de los
// commits, así que los títulos de PR se resuelven aparte (ver build.mjs).
import { fluentImg as e } from './fluent.mjs'

const GH = 'https://github.com'

// items: [{ kind, repo, date, … }]. Agrupa los pushes al mismo repo, rama y día.
export function summarizeEvents(events, { max = 8, exclude = [], timeZone = 'UTC' } = {}) {
  const day = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date(iso))
  const items = []
  // El API no garantiza orden cronológico: lo más reciente primero.
  const sorted = [...events].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
  for (const e of sorted) {
    const repo = e.repo?.name
    if (!repo || exclude.includes(repo)) continue
    const p = e.payload ?? {}
    const base = { repo, date: e.created_at }
    let item = null
    switch (e.type) {
      case 'PushEvent': {
        const branch = (p.ref ?? '').replace(/^refs\/heads\//, '')
        const same = items.find(
          (it) => it.kind === 'push' && it.repo === repo && it.ref === branch && day(it.date) === day(e.created_at),
        )
        if (same) {
          same.count++
          continue
        }
        item = { ...base, kind: 'push', ref: branch, count: 1 }
        break
      }
      case 'PullRequestEvent': {
        const merged = p.action === 'merged' || (p.action === 'closed' && p.pull_request?.merged)
        const action = merged ? 'merged' : p.action
        if (!['opened', 'closed', 'reopened', 'merged'].includes(action)) break
        const number = p.number ?? p.pull_request?.number
        item = {
          ...base,
          kind: 'pr',
          action,
          number,
          title: p.pull_request?.title ?? null,
          url: p.pull_request?.html_url ?? `${GH}/${repo}/pull/${number}`,
        }
        break
      }
      case 'PullRequestReviewEvent': {
        const number = p.pull_request?.number
        if (!number) break
        item = {
          ...base,
          kind: 'review',
          number,
          title: p.pull_request?.title ?? null,
          url: p.review?.html_url ?? `${GH}/${repo}/pull/${number}`,
        }
        break
      }
      case 'IssuesEvent':
        if (!['opened', 'closed', 'reopened'].includes(p.action) || !p.issue?.number) break
        item = {
          ...base,
          kind: 'issue',
          action: p.action,
          number: p.issue.number,
          title: p.issue.title ?? null,
          url: p.issue.html_url ?? `${GH}/${repo}/issues/${p.issue.number}`,
        }
        break
      case 'IssueCommentEvent':
        if (p.action !== 'created' || !p.issue?.number) break
        item = {
          ...base,
          kind: 'comment',
          number: p.issue.number,
          title: p.issue.title ?? null,
          url: p.comment?.html_url ?? p.issue.html_url ?? `${GH}/${repo}/issues/${p.issue.number}`,
        }
        break
      case 'CreateEvent':
        if (p.ref_type === 'repository') item = { ...base, kind: 'repo' }
        else if (p.ref_type === 'tag') item = { ...base, kind: 'tag', ref: p.ref }
        break
      case 'ReleaseEvent':
        if (p.action === 'published' && p.release?.tag_name) {
          item = { ...base, kind: 'release', ref: p.release.tag_name, url: p.release.html_url ?? `${GH}/${repo}/releases` }
        }
        break
      case 'ForkEvent':
        item = { ...base, kind: 'fork', fork: p.forkee?.full_name }
        break
      case 'WatchEvent':
        item = { ...base, kind: 'star' }
        break
      case 'PublicEvent':
        item = { ...base, kind: 'public' }
        break
    }
    if (!item) continue
    // De un mismo PR o issue solo se muestra su estado más reciente (abierto → fusionado).
    if (
      (item.kind === 'pr' || item.kind === 'issue') &&
      items.some((it) => it.kind === item.kind && it.repo === repo && it.number === item.number)
    ) {
      continue
    }
    items.push(item)
  }
  return items.slice(0, max)
}

// Escapa texto ajeno (títulos de issues/PR) para que no rompa el Markdown ni inyecte HTML.
export function escapeMd(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/[\\`*_[\]#|~$:@]/g, (c) => `\\${c}`)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function truncate(text, n = 44) {
  const t = String(text).trim().replace(/\s+/g, ' ')
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t
}

const ref = (r) => `\`${String(r).replace(/[`|]/g, '')}\``
const numbered = (item) => {
  const label = item.title ? `#${item.number} · ${truncate(item.title)}` : `#${item.number}`
  return `[${escapeMd(label)}](${item.url})`
}

// Texto de la columna "Actividad" (el repositorio va en su propia columna).
function describe(it) {
  switch (it.kind) {
    case 'push':
      return it.count > 1 ? `**${it.count} pushes** a ${ref(it.ref)}` : `**Push** a ${ref(it.ref)}`
    case 'pr': {
      const verb = { opened: 'Abrió', closed: 'Cerró', reopened: 'Reabrió', merged: 'Fusionó' }[it.action]
      return `**${verb}** el PR ${numbered(it)}`
    }
    case 'review':
      return `**Revisó** el PR ${numbered(it)}`
    case 'issue': {
      const verb = { opened: 'Abrió', closed: 'Cerró', reopened: 'Reabrió' }[it.action]
      return `**${verb}** el issue ${numbered(it)}`
    }
    case 'comment':
      return `**Comentó** en ${numbered(it)}`
    case 'repo':
      return '**Creó** el repositorio'
    case 'tag':
      return `**Creó** la etiqueta ${ref(it.ref)}`
    case 'release':
      return `**Publicó** la versión [${escapeMd(it.ref)}](${it.url})`
    case 'fork':
      return it.fork ? `**Hizo fork** → [${escapeMd(it.fork)}](${GH}/${it.fork})` : '**Hizo fork**'
    case 'star':
      return '**Dio estrella**'
    case 'public':
      return '**Hizo público** el repositorio'
  }
}

function icon(it) {
  if (it.kind === 'pr') return e({ opened: 'prOpened', closed: 'closed', reopened: 'reopened', merged: 'prMerged' }[it.action], 24)
  if (it.kind === 'issue') return e({ opened: 'issueOpened', closed: 'issueClosed', reopened: 'reopened' }[it.action], 24)
  return e(it.kind, 24)
}

// Tabla Markdown: icono · actividad · repositorio · fecha. Los repos propios se
// muestran sin el dueño; la fecha omite el año si es el actual.
export function renderActivity(items, { timeZone = 'UTC', owner = null, now = new Date() } = {}) {
  if (!items.length) return '_Sin actividad pública en los últimos 90 días._'
  const year = (d) => new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric' }).format(d)
  const short = new Intl.DateTimeFormat('es-PE', { timeZone, day: 'numeric', month: 'short' })
  const date = (iso) => {
    const d = new Date(iso)
    const text = short.format(d).replace(/\.$/, '')
    return year(d) === year(now) ? text : `${text} ${year(d)}`
  }
  const rows = items.map((it) => {
    const [user, name] = it.repo.split('/')
    const label = user === owner ? name : it.repo
    return `| ${icon(it)} | ${describe(it)} | [${escapeMd(label)}](${GH}/${it.repo}) | <sub>${date(it.date)}</sub> |`
  })
  return ['| | Actividad | Repositorio | Fecha |', '|:-:|:--|:--|:-:|', ...rows].join('\n')
}
