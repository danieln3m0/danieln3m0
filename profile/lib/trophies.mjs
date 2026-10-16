// Trofeos calculados a partir de los totales públicos del perfil.
// Cada categoría tiene 8 umbrales: alcanzar el umbral i otorga RANKS[i].
export const RANKS = ['C', 'B', 'A', 'AA', 'AAA', 'S', 'SS', 'SSS']

export const TROPHIES = [
  { key: 'commits', title: 'Commits', unit: 'commits', one: 'commit', levels: [10, 50, 100, 200, 500, 1000, 2000, 4000] },
  { key: 'pullRequests', title: 'Pull Requests', unit: 'PRs', one: 'PR', levels: [1, 10, 20, 50, 100, 200, 500, 1000] },
  { key: 'issues', title: 'Issues', unit: 'issues', one: 'issue', levels: [1, 10, 20, 50, 100, 200, 500, 1000] },
  { key: 'reviews', title: 'Revisiones', unit: 'revisiones', one: 'revisión', levels: [1, 10, 20, 50, 100, 200, 500, 1000] },
  { key: 'stars', title: 'Estrellas', unit: 'estrellas', one: 'estrella', levels: [1, 10, 30, 50, 100, 200, 500, 1000] },
  { key: 'repositories', title: 'Repositorios', unit: 'repos', one: 'repo', levels: [1, 10, 20, 30, 50, 80, 120, 200] },
  { key: 'followers', title: 'Seguidores', unit: 'seguidores', one: 'seguidor', levels: [1, 10, 20, 50, 100, 200, 500, 1000] },
  { key: 'experience', title: 'Experiencia', unit: 'años', one: 'año', levels: [1, 2, 3, 4, 5, 7, 10, 15] },
]

// { rank, next, progress }: rank es null si aún no se alcanza el primer umbral;
// next es el siguiente umbral (null en el rango máximo); progress va de 0 a 1.
export function rankFor(value, levels) {
  let reached = -1
  while (reached + 1 < levels.length && value >= levels[reached + 1]) reached++
  const rank = reached >= 0 ? RANKS[reached] : null
  const next = reached + 1 < levels.length ? levels[reached + 1] : null
  if (next === null) return { rank, next, progress: 1 }
  const floor = reached >= 0 ? levels[reached] : 0
  return { rank, next, progress: Math.max(0, Math.min(1, (value - floor) / (next - floor))) }
}

export function buildTrophies(stats) {
  return TROPHIES.map((t) => {
    const value = stats[t.key] ?? 0
    return { ...t, value: t.key === 'experience' ? Math.floor(value) : value, ...rankFor(value, t.levels) }
  })
}
