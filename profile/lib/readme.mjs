// Reemplaza el contenido entre <!--START_SECTION:name--> y <!--END_SECTION:name-->.
export function replaceSection(markdown, name, content) {
  const start = `<!--START_SECTION:${name}-->`
  const end = `<!--END_SECTION:${name}-->`
  const i = markdown.indexOf(start)
  const j = markdown.indexOf(end)
  if (i < 0 || j < 0 || j < i) throw new Error(`No se encontraron los marcadores de la sección "${name}" en el README`)
  return `${markdown.slice(0, i + start.length)}\n${content}\n${markdown.slice(j)}`
}
