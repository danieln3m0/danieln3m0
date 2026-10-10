// Lectura de datos públicos de GitHub. Cualquier fallo corta el build: es
// preferible conservar el último prensado bueno que publicar uno roto.
const API = 'https://api.github.com'

function headers(token, extra = {}) {
  const h = { 'User-Agent': 'herbario-danieln3m0', Accept: 'application/vnd.github+json', ...extra }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

async function get(path, token) {
  const res = await fetch(`${API}${path}`, { headers: headers(token) })
  if (!res.ok) throw new Error(`GitHub ${res.status} en ${path}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}

export async function repoInfo(full, token) {
  const r = await get(`/repos/${full}`, token)
  return {
    full: r.full_name,
    name: r.name,
    description: r.description,
    language: r.language,
    branch: r.default_branch,
    created: r.created_at,
    pushed: r.pushed_at,
    fork: r.fork,
    parent: r.parent?.full_name ?? null,
    stars: r.stargazers_count,
    url: r.html_url,
  }
}

// Árbol completo de archivos (solo blobs) de la rama por defecto.
export async function repoTree(full, branch, token) {
  const t = await get(`/repos/${full}/git/trees/${encodeURIComponent(branch)}?recursive=1`, token)
  return t.tree.filter((e) => e.type === 'blob').map((e) => ({ path: e.path, size: e.size ?? 0 }))
}

export async function userRepos(user, token) {
  const repos = await get(`/users/${user}/repos?per_page=100&type=owner`, token)
  return repos
    .filter((r) => !r.archived && r.size > 0)
    .map((r) => ({ full: r.full_name, name: r.name, branch: r.default_branch, created: r.created_at, fork: r.fork }))
}

// Bytes por lenguaje de un repo: { TypeScript: 12345, ... }
export async function repoLanguages(full, token) {
  return get(`/repos/${full}/languages`, token)
}

// Contribuciones del último año por tipo. Necesita token (GraphQL); sin él devuelve null.
export async function contributionTotals(user, token) {
  if (!token) return null
  const query = `query($login:String!){user(login:$login){contributionsCollection{totalCommitContributions totalPullRequestContributions totalIssueContributions totalPullRequestReviewContributions totalRepositoryContributions restrictedContributionsCount}}}`
  const res = await fetch(`${API}/graphql`, {
    method: 'POST',
    headers: headers(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ query, variables: { login: user } }),
  })
  const json = await res.json()
  if (!res.ok || json.errors) throw new Error(`GraphQL: ${JSON.stringify(json.errors ?? json).slice(0, 300)}`)
  const c = json.data.user.contributionsCollection
  return {
    commits: c.totalCommitContributions,
    pullRequests: c.totalPullRequestContributions,
    issues: c.totalIssueContributions,
    reviews: c.totalPullRequestReviewContributions,
    repos: c.totalRepositoryContributions,
    restricted: c.restrictedContributionsCount,
  }
}

// Calendario de contribuciones del último año: [{ date, count }]
export async function contributions(user, token) {
  if (token) {
    const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`
    const res = await fetch(`${API}/graphql`, {
      method: 'POST',
      headers: headers(token, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ query, variables: { login: user } }),
    })
    const json = await res.json()
    if (!res.ok || json.errors) throw new Error(`GraphQL: ${JSON.stringify(json.errors ?? json).slice(0, 300)}`)
    const cal = json.data.user.contributionsCollection.contributionCalendar
    return cal.weeks.flatMap((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })))
  }
  // Sin token (ejecución local): la página pública del calendario.
  const res = await fetch(`https://github.com/users/${user}/contributions`, { headers: { 'User-Agent': 'herbario' } })
  if (!res.ok) throw new Error(`Calendario público ${res.status}`)
  const html = await res.text()
  const dates = new Map()
  for (const m of html.matchAll(/data-date="(\d{4}-\d{2}-\d{2})"[^>]*?id="([^"]+)"|id="([^"]+)"[^>]*?data-date="(\d{4}-\d{2}-\d{2})"/g)) {
    dates.set(m[2] ?? m[3], m[1] ?? m[4])
  }
  const days = []
  for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const date = dates.get(m[1])
    if (!date) continue
    const n = /^(\d+)/.exec(m[2].trim())
    days.push({ date, count: n ? Number(n[1]) : 0 })
  }
  if (!days.length) throw new Error('No se pudo leer el calendario público')
  return days.sort((a, b) => a.date.localeCompare(b.date))
}
