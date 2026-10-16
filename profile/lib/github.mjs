// Lectura de datos públicos de GitHub. Sin dependencias: usa el fetch de Node.
const API = 'https://api.github.com'
const UA = 'danieln3m0-profile-readme'

function headers(token, extra = {}) {
  const h = { 'User-Agent': UA, Accept: 'application/vnd.github+json', ...extra }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

export async function rest(path, token) {
  const res = await fetch(`${API}${path}`, { headers: headers(token) })
  if (!res.ok) throw new Error(`GitHub ${res.status} en ${path}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}

export async function graphql(query, variables, token) {
  if (!token) throw new Error('La API GraphQL necesita GITHUB_TOKEN')
  const res = await fetch(`${API}/graphql`, {
    method: 'POST',
    headers: headers(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (!res.ok || json.errors) throw new Error(`GraphQL: ${JSON.stringify(json.errors ?? json).slice(0, 300)}`)
  return json.data
}

// Totales del perfil para los trofeos y calendario de contribuciones del último año.
export async function profileStats(login, token) {
  const { user } = await graphql(
    `query($login:String!){user(login:$login){
      createdAt
      followers{totalCount}
      pullRequests{totalCount}
      issues{totalCount}
      repositories(first:100, ownerAffiliations:OWNER, privacy:PUBLIC){totalCount nodes{stargazerCount}}
      contributionsCollection{
        contributionYears
        contributionCalendar{weeks{contributionDays{date contributionCount}}}
      }
    }}`,
    { login },
    token,
  )
  if (!user) throw new Error(`Usuario ${login} no encontrado`)

  // contributionsCollection abarca como máximo un año: un alias por año.
  const years = user.contributionsCollection.contributionYears
  const aliases = years
    .map(
      (y) =>
        `y${y}: contributionsCollection(from:"${y}-01-01T00:00:00Z", to:"${y}-12-31T23:59:59Z"){totalCommitContributions totalPullRequestReviewContributions}`,
    )
    .join('\n')
  const perYear = years.length
    ? (await graphql(`query($login:String!){user(login:$login){${aliases}}}`, { login }, token)).user
    : {}
  let commits = 0
  let reviews = 0
  for (const y of Object.values(perYear)) {
    commits += y.totalCommitContributions
    reviews += y.totalPullRequestReviewContributions
  }

  const days = user.contributionsCollection.contributionCalendar.weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })),
  )

  return {
    stats: {
      commits,
      pullRequests: user.pullRequests.totalCount,
      issues: user.issues.totalCount,
      reviews,
      stars: user.repositories.nodes.reduce((sum, r) => sum + r.stargazerCount, 0),
      repositories: user.repositories.totalCount,
      followers: user.followers.totalCount,
      experience: (Date.now() - Date.parse(user.createdAt)) / (365.25 * 24 * 3600 * 1000),
    },
    days,
  }
}

export async function publicEvents(login, token) {
  return rest(`/users/${login}/events/public?per_page=100`, token)
}

export async function pullRequest(repo, number, token) {
  return rest(`/repos/${repo}/pulls/${number}`, token)
}

// Los logros (Pull Shark, YOLO…) no tienen API: se leen de la pestaña pública del perfil.
export async function achievementsPage(login) {
  const res = await fetch(`https://github.com/${login}?tab=achievements`, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`Página de logros ${res.status}`)
  return res.text()
}

// Solo se incrustan imágenes servidas por GitHub.
export async function imageDataUri(url) {
  const { protocol, hostname } = new URL(url)
  if (protocol !== 'https:' || !(hostname === 'githubassets.com' || hostname.endsWith('.githubassets.com'))) {
    throw new Error(`Origen de imagen no permitido: ${url}`)
  }
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`Imagen ${res.status} en ${url}`)
  const type = (res.headers.get('content-type') ?? '').split(';')[0].trim()
  if (!/^image\/(png|jpeg|gif|webp)$/.test(type)) throw new Error(`Tipo de imagen inesperado (${type}) en ${url}`)
  const data = Buffer.from(await res.arrayBuffer()).toString('base64')
  return `data:${type};base64,${data}`
}
