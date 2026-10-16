import assert from 'node:assert/strict'
import { test } from 'node:test'

import { parseAchievements } from '../lib/achievements.mjs'
import { replaceSection } from '../lib/readme.mjs'
import { escapeXml, niceStep, renderAchievements, renderActivityGraph, renderTrophies } from '../lib/svg.mjs'
import { buildTrophies, rankFor } from '../lib/trophies.mjs'

// Fragmento con la misma estructura que https://github.com/<login>?tab=achievements
const card = (slug, name, img, tier = '') => `
<details class="js-achievement-card-details" data-achievement-slug="${slug}">
  <summary class="achievement-card">    <img src="${img}" width="90" alt="Achievement: ${name}" data-view-component="true" class="achievement-badge-card" />
    <div class="d-flex flex-justify-center mb-1">
      <h3 class="f4 ws-normal">${name}</h3>
      ${tier && `<span data-view-component="true" class="Label achievement-tier-label achievement-tier-label--bronze text-small">${tier}</span>`}
    </div>
</summary>  <details-dialog><span class="achievement-tier-label">x9</span></details-dialog>
</details>`

test('parseAchievements lee nombre, imagen y nivel, sin duplicados', () => {
  const html =
    card('yolo', 'YOLO', 'https://github.githubassets.com/assets/yolo.png') +
    card('pull-shark', 'Pull Shark', 'https://github.githubassets.com/assets/shark.png', 'x2') +
    card('yolo', 'YOLO', 'https://github.githubassets.com/assets/yolo.png')
  assert.deepEqual(parseAchievements(html), [
    { slug: 'yolo', name: 'YOLO', image: 'https://github.githubassets.com/assets/yolo.png', tier: null },
    { slug: 'pull-shark', name: 'Pull Shark', image: 'https://github.githubassets.com/assets/shark.png', tier: 'x2' },
  ])
})

test('parseAchievements devuelve vacío si GitHub cambia el HTML', () => {
  assert.deepEqual(parseAchievements('<html>sin logros</html>'), [])
  // Sin </summary> no se mezclan datos de otros bloques.
  assert.deepEqual(parseAchievements('<details data-achievement-slug="yolo"><img class="achievement-badge-card" src="x.png"><h3>YOLO</h3>'), [])
})

test('parseAchievements tolera otro orden de atributos y decodifica entidades', () => {
  const html = `<details data-achievement-slug="a"><summary>
    <img class="achievement-badge-card" alt="x" src="https://github.githubassets.com/a.png?v=1&amp;s=2" />
    <h3 class="f4">Pair &amp; Co</h3></summary></details>`
  assert.deepEqual(parseAchievements(html), [
    { slug: 'a', name: 'Pair & Co', image: 'https://github.githubassets.com/a.png?v=1&s=2', tier: null },
  ])
})

test('rankFor asigna rango, siguiente umbral y progreso', () => {
  const levels = [10, 50, 100, 200, 500, 1000, 2000, 4000]
  assert.deepEqual(rankFor(5, levels), { rank: null, next: 10, progress: 0.5 })
  assert.deepEqual(rankFor(75, levels), { rank: 'B', next: 100, progress: 0.5 })
  assert.deepEqual(rankFor(5000, levels), { rank: 'SSS', next: null, progress: 1 })
})

test('buildTrophies cubre las 8 categorías y redondea la experiencia', () => {
  const t = buildTrophies({ commits: 643, experience: 4.3 })
  assert.equal(t.length, 8)
  assert.equal(t.find((x) => x.key === 'commits').rank, 'AAA')
  assert.equal(t.find((x) => x.key === 'experience').value, 4)
  assert.equal(t.find((x) => x.key === 'stars').rank, null)
})

test('renderTrophies genera un SVG válido con singular y plural', () => {
  const svg = renderTrophies(buildTrophies({ reviews: 1, stars: 3 }))
  assert.match(svg, /^<svg [^>]*viewBox="0 0 840 284"/)
  assert.match(svg, />1 revisión</)
  assert.match(svg, />3 estrellas</)
  assert.equal((svg.match(/<g transform="translate\(\d+ \d+\)">/g) ?? []).length, 8)
  // Un icono Octicon por tarjeta, sin emojis.
  assert.equal((svg.match(/scale\(1\.25\)" fill="#bf91f3"><path d=/g) ?? []).length, 8)
  assert.doesNotMatch(svg, /\p{Extended_Pictographic}/u)
})

test('renderAchievements escapa nombres e incluye el nivel', () => {
  const svg = renderAchievements([{ name: 'A & B', tier: 'x3', dataUri: 'data:image/png;base64,AA==' }])
  assert.match(svg, />A &amp; B</)
  assert.match(svg, />x3</)
  assert.match(renderAchievements([]), /Aún no hay logros/)
})

test('renderActivityGraph dibuja solo los últimos 31 días y suma el total', () => {
  const days = Array.from({ length: 40 }, (_, i) => ({
    date: `2026-09-${String((i % 30) + 1).padStart(2, '0')}`,
    count: i,
  }))
  const svg = renderActivityGraph(days)
  assert.equal((svg.match(/<circle /g) ?? []).length, 31)
  const total = days.slice(-31).reduce((s, d) => s + d.count, 0)
  assert.match(svg, new RegExp(`${total.toLocaleString('es-PE')} contribuciones`))
  assert.doesNotMatch(renderActivityGraph([]), /NaN|Infinity/)
})

test('niceStep da 4 divisiones que cubren el máximo', () => {
  for (const max of [0, 3, 7, 18, 21, 58, 99, 1234]) {
    const step = niceStep(max)
    assert.ok(step * 4 >= max, `max=${max} step=${step}`)
  }
})

test('escapeXml escapa los caracteres reservados', () => {
  assert.equal(escapeXml(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;')
})

test('replaceSection reemplaza solo el contenido entre marcadores', () => {
  const md = 'a\n<!--START_SECTION:activity-->\nviejo\n<!--END_SECTION:activity-->\nb'
  assert.equal(
    replaceSection(md, 'activity', 'nuevo'),
    'a\n<!--START_SECTION:activity-->\nnuevo\n<!--END_SECTION:activity-->\nb',
  )
  assert.throws(() => replaceSection('sin marcadores', 'activity', 'x'), /marcadores/)
})
