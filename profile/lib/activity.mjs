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

function truncate(text, n = 70) {
  const t = String(text).trim().replace(/\s+/g, ' ')
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t
}

const repoLink = (repo) => `[${escapeMd(repo)}](${GH}/${repo})`
const ref = (r) => `\`${String(r).replace(/`/g, '')}\``
const numbered = (item) => {
  const label = item.title ? `#${item.number} ${truncate(item.title)}` : `#${item.number}`
  return `[${escapeMd(label)}](${item.url})`
}

export function renderActivity(items, { timeZone = 'UTC' } = {}) {
  if (!items.length) return '_Sin actividad pública en los últimos 90 días._'
  const fmt = new Intl.DateTimeFormat('es-PE', { timeZone, day: 'numeric', month: 'short', year: 'numeric' })
  const lines = items.map((it) => {
    const r = repoLink(it.repo)
    let text
    switch (it.kind) {
      case 'push':
        text = `${e('push')} ${it.count > 1 ? `Hizo ${it.count} pushes` : 'Subió cambios'} a ${ref(it.ref)} en ${r}`
        break
      case 'pr': {
        const verb = { opened: `${e('prOpened')} Abrió`, closed: `${e('closed')} Cerró`, reopened: `${e('reopened')} Reabrió`, merged: `${e('prMerged')} Fusionó` }[it.action]
        text = `${verb} el PR ${numbered(it)} en ${r}`
        break
      }
      case 'review':
        text = `${e('review')} Revisó el PR ${numbered(it)} en ${r}`
        break
      case 'issue': {
        const verb = { opened: `${e('issueOpened')} Abrió`, closed: `${e('issueClosed')} Cerró`, reopened: `${e('reopened')} Reabrió` }[it.action]
        text = `${verb} el issue ${numbered(it)} en ${r}`
        break
      }
      case 'comment':
        text = `${e('comment')} Comentó en ${numbered(it)} en ${r}`
        break
      case 'repo':
        text = `${e('repo')} Creó el repositorio ${r}`
        break
      case 'tag':
        text = `${e('tag')} Creó la etiqueta ${ref(it.ref)} en ${r}`
        break
      case 'release':
        text = `${e('release')} Publicó la versión [${escapeMd(it.ref)}](${it.url}) en ${r}`
        break
      case 'fork':
        text = `${e('fork')} Hizo fork de ${r}${it.fork ? ` → ${repoLink(it.fork)}` : ''}`
        break
      case 'star':
        text = `${e('star')} Dio estrella a ${r}`
        break
      case 'public':
        text = `${e('public')} Hizo público ${r}`
        break
    }
    return `${text} · <sub>${fmt.format(new Date(it.date))}</sub>`
  })
  return lines.map((l, i) => `${i + 1}. ${l}`).join('\n')
}
