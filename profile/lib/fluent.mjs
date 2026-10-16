// Emojis 3D animados de https://github.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis
// (basados en Microsoft Fluent Emoji). Ruta = carpeta/archivo dentro de Emojis/.
const BASE = 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis'

export const FLUENT = {
  push: 'Symbols/Up Arrow',
  prOpened: 'Symbols/Shuffle Tracks Button',
  prMerged: 'Smilies/Purple Heart',
  closed: 'Symbols/Cross Mark',
  reopened: 'Symbols/Counterclockwise Arrows Button',
  review: 'Hand gestures/Eyes',
  issueOpened: 'Symbols/Red Exclamation Mark',
  issueClosed: 'Symbols/Check Mark Button',
  comment: 'Smilies/Speech Balloon',
  repo: 'Activities/Sparkles',
  tag: 'Objects/Label',
  release: 'Travel and places/Rocket',
  fork: 'Food/Fork and Knife',
  star: 'Travel and places/Glowing Star',
  public: 'Travel and places/Globe with Meridians',
}

export function fluentUrl(file) {
  return `${BASE}/${file.split('/').map(encodeURIComponent).join('/')}.png`
}

export function fluentImg(key, size = 20) {
  const file = FLUENT[key]
  if (!file) throw new Error(`Emoji Fluent desconocido: ${key}`)
  const alt = file.split('/').at(-1)
  return `<img src="${fluentUrl(file)}" alt="${alt}" width="${size}" height="${size}" align="top"/>`
}
