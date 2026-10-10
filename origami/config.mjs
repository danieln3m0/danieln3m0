// Contenido propio del concepto origami. Los textos de cada proyecto (títulos,
// descripciones, enlaces) se reutilizan del herbario para no duplicar la fuente.
// Todo rótulo en japonés va acompañado de su traducción en el diseño.

export { user, specimens, links, extraRepos, skipRepos, headerTags } from '../herbario/config.mjs'

export const owner = {
  name: ['FRANCIS DANIEL', 'MAMANI SILVA'],
  kana: 'ダニエル', // Daniel en katakana, para el sello de firma.
  lines: ['Full-stack · Front-end · Creative coding', 'Ing. de Software, UPC · Lima, Perú'],
  compact: ['Full-stack · Lima', 'danieln3m0'],
}

// Sellos (hanko) por proyecto: kanji + traducción.
export const seals = {
  oratoria: { jp: '二位', es: '2.º puesto nacional · Build with Gemma 2026', short: '2.º puesto · Gemma' },
  ayni: { jp: '論文', es: 'tesis · UPC', short: 'tesis UPC' },
  keyreu: { jp: 'ハッカソン', es: 'hackathon · Sundai Latam', short: 'hackathon' },
  'html-to-figma': { jp: '派生', es: 'fork', short: 'fork' },
}

export const award = { jp: '二位', es: '2.º puesto nacional en el Build with Gemma 2026', compact: ['2.º puesto', 'Gemma 2026'] }

export const sections = {
  obras: { jp: '作品', es: 'Obras' },
  notacion: { jp: '記号', es: 'Cómo leer los patrones' },
  teselado: { jp: 'テセレーション', es: 'Teselado' },
  estadisticas: { jp: '統計', es: 'Estadísticas' },
  trayectoria: { jp: '経歴', es: 'Trayectoria' },
  herramientas: { jp: '道具', es: 'Herramientas' },
}

// Vocabulario japonés usado en las piezas (se usa también para recortar las fuentes).
export const JP = [
  '折り紙', '展開図', '谷折り', '山折り', '作品', '経歴', '道具', '記号', '折り図',
  'テセレーション', '二位', '論文', '派生', 'ハッカソン', 'ダニエル', '切り紙', '和紙',
  '千代紙', '麻の葉', '青海波', '亀甲', '連絡', '一', '二', '三', '四', '週',
  '統計', '千羽鶴', '言語',
]
