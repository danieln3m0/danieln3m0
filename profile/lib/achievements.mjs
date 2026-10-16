// Extrae los logros del HTML de https://github.com/<login>?tab=achievements.
// Cada logro es un <details data-achievement-slug="…"> cuyo <summary> trae la
// imagen, el nombre y, si lo hay, el nivel (x2, x3, x4).
export function parseAchievements(html) {
  const found = []
  const seen = new Set()
  for (const chunk of html.split('data-achievement-slug="').slice(1)) {
    const slug = chunk.slice(0, chunk.indexOf('"'))
    if (!slug || seen.has(slug)) continue
    const end = chunk.indexOf('</summary>')
    if (end < 0) continue
    const summary = chunk.slice(0, end)
    const img = /<img\b[^>]*\bachievement-badge-card\b[^>]*>/.exec(summary)?.[0]
    const image = img && /\ssrc="([^"]+)"/.exec(img)?.[1]
    const name = /<h3[^>]*>([^<]+)<\/h3>/.exec(summary)?.[1]?.trim()
    const tier = /achievement-tier-label[^"]*">\s*(x\d+)\s*</.exec(summary)?.[1] ?? null
    if (!image || !name) continue
    seen.add(slug)
    found.push({ slug, name: decodeEntities(name), image: decodeEntities(image), tier })
  }
  return found
}

function decodeEntities(text) {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}
