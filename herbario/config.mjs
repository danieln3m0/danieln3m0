// Contenido curado del herbario. Los números (archivos, fechas, contribuciones)
// salen de la API de GitHub en cada ejecución; aquí solo va lo que escribe una persona.
// Fuente de los textos: danieln3m0/Portafolio → src/data/portfolio.ts (CV).

export const user = 'danieln3m0'

export const owner = {
  name: ['FRANCIS DANIEL', 'MAMANI SILVA'],
  binomial: 'Fullstackia limensis',
  author: 'F.D.Mamani',
  lines: ['Full-stack · Front-end · Creative coding', 'Ing. de Software, UPC · Lima, Perú'],
  // Etiqueta compacta (móvil).
  compact: ['Full-stack · Lima', 'danieln3m0'],
  barcode: 'DANIELN3M0',
}

// Sello principal de la cabecera.
export const award = { ring: '2.º PUESTO NACIONAL · BUILD WITH GEMMA · GDG CALLAO ·', center: '2026' }

// Repos fuera de la cuenta que también forman parte de la planta de la cabecera.
export const extraRepos = ['ayni-tesis/ayni_sdk_monorepo']

// Repos que no entran en la planta de la cabecera.
export const skipRepos = ['danieln3m0/danieln3m0']

// Ejemplares tipo, en el orden en que aparecen en el README.
export const specimens = [
  {
    id: 'oratoria',
    title: 'OratorIA',
    repo: null,
    href: 'https://danieln3m0.github.io/Portafolio/',
    binomial: 'Oratoria gemmae',
    description: 'Práctica de oratoria con IA 100 % en el dispositivo: voz, muletillas y lenguaje corporal en tiempo real.',
    meta: 'Gemma on-device · 2026',
    family: 'IA on-device',
    short: 'Oratoria con IA local',
    compactMeta: '2.º puesto · Gemma',
    stamp: { kind: 'ring', ring: '2.º PUESTO NACIONAL · BUILD WITH GEMMA ·', center: '2026' },
    note: 'Código no depositado. Ver en el portafolio.',
  },
  {
    id: 'ayni',
    title: 'Ayni',
    repo: 'ayni-tesis/ayni_sdk_monorepo',
    binomial: 'Coffea aynii',
    description: 'Detección de enfermedades del café a partir de fotos de hojas: SDK, dashboard web y backend.',
    since: 2025,
    short: 'Plagas del café con ML',
    stamp: { kind: 'box', lines: ['TESIS', 'UPC'] },
  },
  {
    id: 'keyreu',
    title: 'KeyReu',
    repo: 'danieln3m0/KeyReu',
    binomial: 'Pythonia keyreuensis',
    short: 'Reuniones con agentes',
    description: 'Graba una reunión y, mientras hablas, dispara agentes de código sobre un repo. Al final, resumen por correo.',
    stamp: { kind: 'box', lines: ['HACKATHON', 'SUNDAI LATAM'] },
  },
  {
    id: 'portafolio',
    title: 'Portafolio',
    repo: 'danieln3m0/Portafolio',
    binomial: 'Typescripta portafolii',
    short: 'Next.js y escena 3D',
    description: 'Mi portafolio en Next.js: una escena 3D que reacciona al cursor y un modo para reclutadores.',
  },
  {
    id: 'poslas4as',
    title: 'POSLas4as',
    repo: 'danieln3m0/POSLas4as',
    binomial: 'Springia inventarii',
    short: 'API de inventario',
    description: 'API REST de inventario para A&S Soluciones Generales, con Spring Boot, JWT y Domain-Driven Design.',
  },
  {
    id: 'html-to-figma',
    title: 'html-to-figma',
    repo: 'danieln3m0/html-to-figma',
    binomial: 'Typescripta figmoides',
    short: 'Del DOM a Figma',
    description: 'Fork en el que mantengo mejoras: convierte nodos del DOM en capas de Figma.',
    stamp: { kind: 'box', lines: ['CULT.', 'FORK'] },
  },
]

// Etiquetas de rama en la planta de la cabecera (nombre del repo → texto de la etiqueta).
export const headerTags = {
  Portafolio: 'Portafolio',
  KeyReu: 'KeyReu',
  ayni_sdk_monorepo: 'Ayni',
  POSLas4as: 'POSLas4as',
  'html-to-figma': 'html-to-figma',
}

export const links = [
  { id: 'portafolio', label: 'PORTAFOLIO', href: 'https://danieln3m0.github.io/Portafolio/', external: true },
  { id: 'linkedin', label: 'LINKEDIN', href: 'https://www.linkedin.com/in/francis-daniel-mamani-silva-562ab6307/', external: true },
  { id: 'correo', label: 'CORREO', href: 'mailto:francisdani143@gmail.com' },
  { id: 'instagram', label: 'INSTAGRAM', href: 'https://www.instagram.com/francis_daniel029/', external: true },
]

export const sections = {
  ejemplares: 'EJEMPLARES TIPO',
  fenologia: 'FENOLOGÍA',
  anotaciones: 'ANOTACIONES',
  familias: 'ÍNDICE DE FAMILIAS',
}
