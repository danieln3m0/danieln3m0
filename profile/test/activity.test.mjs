import assert from 'node:assert/strict'
import { test } from 'node:test'

import { escapeMd, renderActivity, summarizeEvents } from '../lib/activity.mjs'
import { fluentImg } from '../lib/fluent.mjs'

const ev = (type, repo, created_at, payload = {}) => ({ type, repo: { name: repo }, created_at, payload })

test('ordena por fecha y agrupa pushes al mismo repo, rama y día', () => {
  const items = summarizeEvents(
    [
      ev('PushEvent', 'u/a', '2026-10-10T05:00:00Z', { ref: 'refs/heads/main' }),
      ev('PullRequestEvent', 'u/a', '2026-10-10T06:00:00Z', { action: 'opened', number: 1 }),
      ev('PushEvent', 'u/a', '2026-10-10T07:00:00Z', { ref: 'refs/heads/main' }),
      ev('PushEvent', 'u/a', '2026-10-09T07:00:00Z', { ref: 'refs/heads/main' }),
    ],
    { timeZone: 'UTC' },
  )
  assert.deepEqual(
    items.map((i) => [i.kind, i.count ?? null]),
    [
      ['push', 2],
      ['pr', null],
      ['push', 1],
    ],
  )
})

test('de un mismo PR solo deja el estado más reciente y reconoce "merged" antiguo y nuevo', () => {
  const items = summarizeEvents([
    ev('PullRequestEvent', 'u/a', '2026-10-10T05:00:00Z', { action: 'opened', number: 7 }),
    ev('PullRequestEvent', 'u/a', '2026-10-10T06:00:00Z', { action: 'merged', number: 7 }),
    ev('PullRequestEvent', 'u/a', '2026-10-10T04:00:00Z', {
      action: 'closed',
      number: 3,
      pull_request: { number: 3, merged: true, title: 'Viejo', html_url: 'https://github.com/u/a/pull/3' },
    }),
  ])
  assert.deepEqual(
    items.map((i) => [i.number, i.action, i.url]),
    [
      [7, 'merged', 'https://github.com/u/a/pull/7'],
      [3, 'merged', 'https://github.com/u/a/pull/3'],
    ],
  )
})

test('excluye repos, ignora eventos irrelevantes y respeta el máximo', () => {
  const events = [
    ev('PushEvent', 'u/u', '2026-10-10T05:00:00Z', { ref: 'refs/heads/main' }),
    ev('DeleteEvent', 'u/a', '2026-10-10T05:00:00Z'),
    ev('CreateEvent', 'u/a', '2026-10-10T05:00:00Z', { ref_type: 'branch', ref: 'x' }),
    ...Array.from({ length: 12 }, (_, i) => ev('WatchEvent', `o/r${i}`, `2026-10-0${(i % 9) + 1}T00:00:00Z`)),
  ]
  const items = summarizeEvents(events, { max: 5, exclude: ['u/u'] })
  assert.equal(items.length, 5)
  assert.ok(items.every((i) => i.kind === 'star'))
})

test('renderActivity genera una tabla con icono, actividad, repositorio y fecha', () => {
  const md = renderActivity(
    [
      { kind: 'push', repo: 'u/a', ref: 'main', count: 3, date: '2026-10-10T15:00:00Z' },
      { kind: 'repo', repo: 'o/b', date: '2025-12-09T15:00:00Z' },
    ],
    { timeZone: 'America/Lima', owner: 'u', now: new Date('2026-10-15T00:00:00Z') },
  )
  const lines = md.split('\n')
  assert.deepEqual(lines.slice(0, 2), ['| | Actividad | Repositorio | Fecha |', '|:-:|:--|:--|:-:|'])
  assert.equal(lines.length, 4)
  // Repo propio sin dueño y fecha sin año (año actual).
  assert.match(
    lines[2],
    /^\| <img src="[^"]+\/Symbols\/Up%20Arrow\.png"[^>]*\/> \| \*\*3 pushes\*\* a `main` \| \[a\]\(https:\/\/github\.com\/u\/a\) \| <sub>10 oct<\/sub> \|$/,
  )
  // Repo ajeno con dueño y fecha de otro año con año.
  assert.match(lines[3], /alt="Sparkles"[^>]*\/> \| \*\*Creó\*\* el repositorio \| \[o\/b\]\(https:\/\/github\.com\/o\/b\) \| <sub>9 dic 2025<\/sub> \|$/)
})

test('renderActivity escapa barras verticales para no romper la tabla', () => {
  const md = renderActivity([
    { kind: 'pr', action: 'opened', repo: 'u/a', number: 1, title: 'a | b', url: 'https://github.com/u/a/pull/1', date: '2026-10-10T15:00:00Z' },
    { kind: 'push', repo: 'u/a', ref: 'x|y', count: 1, date: '2026-10-10T15:00:00Z' },
  ])
  for (const line of md.split('\n').slice(2)) {
    assert.equal(line.replace(/\\\|/g, '').split('|').length, 6, line)
  }
})

test('renderActivity sin eventos muestra un mensaje en vez de dejar la sección vacía', () => {
  assert.match(renderActivity([]), /Sin actividad pública/)
})

test('fluentImg codifica la ruta y rechaza claves desconocidas', () => {
  assert.equal(
    fluentImg('fork'),
    '<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Fork%20and%20Knife.png" alt="Fork and Knife" width="20" height="20" align="top"/>',
  )
  assert.throws(() => fluentImg('nope'), /desconocido/)
})

test('escapeMd neutraliza Markdown y HTML de títulos ajenos', () => {
  assert.equal(escapeMd('[x](y) <img> `a` *b*'), '\\[x\\](y) &lt;img&gt; \\`a\\` \\*b\\*')
  assert.equal(escapeMd('&lt; $x$ @user https://a.b'), '&amp;lt; \\$x\\$ \\@user https\\://a.b')
})

test('issues y comentarios con payload recortado usan enlaces de respaldo o se descartan', () => {
  const items = summarizeEvents([
    ev('IssuesEvent', 'u/a', '2026-10-10T05:00:00Z', { action: 'opened', issue: { number: 4 } }),
    ev('IssueCommentEvent', 'u/a', '2026-10-10T04:00:00Z', { action: 'created', issue: { number: 4 } }),
    ev('IssuesEvent', 'u/a', '2026-10-10T03:00:00Z', { action: 'opened' }),
    ev('ReleaseEvent', 'u/a', '2026-10-10T02:00:00Z', { action: 'published', release: {} }),
  ])
  assert.deepEqual(
    items.map((i) => [i.kind, i.url]),
    [
      ['issue', 'https://github.com/u/a/issues/4'],
      ['comment', 'https://github.com/u/a/issues/4'],
    ],
  )
  assert.doesNotMatch(renderActivity(items), /undefined/)
})

test('renderActivity cubre PR, revisión, fork y versión sin dejar campos vacíos', () => {
  const md = renderActivity([
    { kind: 'pr', action: 'merged', repo: 'u/a', number: 7, title: 'Título [raro]', url: 'https://github.com/u/a/pull/7', date: '2026-10-10T15:00:00Z' },
    { kind: 'review', repo: 'u/a', number: 8, title: null, url: 'https://github.com/u/a/pull/8', date: '2026-10-10T15:00:00Z' },
    { kind: 'fork', repo: 'o/r', fork: 'u/r', date: '2026-10-10T15:00:00Z' },
    { kind: 'release', repo: 'u/a', ref: 'v1.0', url: 'https://github.com/u/a/releases/tag/v1.0', date: '2026-10-10T15:00:00Z' },
  ])
  assert.match(md, /alt="Purple Heart"[^>]*\/> \| \*\*Fusionó\*\* el PR \[\\#7 · Título \\\[raro\\\]\]\(https:\/\/github\.com\/u\/a\/pull\/7\)/)
  assert.match(md, /alt="Eyes"[^>]*\/> \| \*\*Revisó\*\* el PR \[\\#8\]/)
  assert.match(md, /alt="Fork and Knife"[^>]*\/> \| \*\*Hizo fork\*\* → \[u\/r\]\(https:\/\/github\.com\/u\/r\) \| \[o\/r\]/)
  assert.match(md, /alt="Rocket"[^>]*\/> \| \*\*Publicó\*\* la versión \[v1\.0\]/)
  assert.doesNotMatch(md, /undefined|null/)
})
