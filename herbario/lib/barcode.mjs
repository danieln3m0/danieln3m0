// Code 39 real: el código de barras del pliego se puede escanear.
const PATTERNS = {
  0: '000110100', 1: '100100001', 2: '001100001', 3: '101100000', 4: '000110001',
  5: '100110000', 6: '001110000', 7: '000100101', 8: '100100100', 9: '001100100',
  A: '100001001', B: '001001001', C: '101001000', D: '000011001', E: '100011000',
  F: '001011000', G: '000001101', H: '100001100', I: '001001100', J: '000011100',
  K: '100000011', L: '001000011', M: '101000010', N: '000010011', O: '100010010',
  P: '001010010', Q: '000000111', R: '100000110', S: '001000110', T: '000010110',
  U: '110000001', V: '011000001', W: '111000000', X: '010010001', Y: '110010000',
  Z: '011010000', '-': '010000101', '.': '110000100', ' ': '011000100', '*': '010010100',
}

export function code39(text, { x, y, width, height, fill }) {
  const chars = `*${text.toUpperCase()}*`.split('')
  const NARROW = 1
  const WIDE = 2.6
  const units = chars.reduce((sum, c) => sum + [...PATTERNS[c]].reduce((a, b) => a + (b === '1' ? WIDE : NARROW), 0) + NARROW, 0)
  const u = width / units
  let cx = x
  const rects = []
  for (const c of chars) {
    ;[...PATTERNS[c]].forEach((b, i) => {
      const w = (b === '1' ? WIDE : NARROW) * u
      if (i % 2 === 0) rects.push(`M${cx.toFixed(2)} ${y}h${w.toFixed(2)}v${height}h-${w.toFixed(2)}z`)
      cx += w
    })
    cx += NARROW * u
  }
  return `<path fill="${fill}" d="${rects.join('')}"/>`
}
