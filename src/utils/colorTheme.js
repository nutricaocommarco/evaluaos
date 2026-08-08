// Sistema de cor personalizável do EvaluaOS.
// Gera uma escada de tons 50-900 a partir de UMA cor escolhida pelo nutricionista,
// tratando essa cor como o tom 600 (o mais usado na marca hoje) e variando a
// luminosidade (HSL) na mesma proporção que a paleta "emerald" original do Tailwind
// tem entre seus próprios tons — mantendo H/S fixos, só a lightness muda por tom.

export const DEFAULT_PRIMARY_HEX = '#059669' // emerald-600

export const PRESET_COLORS = [
  { nome: 'Esmeralda', hex: '#059669' },
  { nome: 'Verde-azulado', hex: '#0d9488' },
  { nome: 'Azul', hex: '#2563eb' },
  { nome: 'Índigo', hex: '#4f46e5' },
  { nome: 'Violeta', hex: '#7c3aed' },
  { nome: 'Rosa', hex: '#e11d48' },
  { nome: 'Laranja', hex: '#ea580c' },
  { nome: 'Âmbar', hex: '#d97706' },
]

// Deltas de lightness (em pontos percentuais) de cada tom em relação ao 600,
// calculados a partir da paleta emerald-50..900 original do Tailwind.
const LIGHTNESS_DELTAS = {
  50: 65.5,
  100: 59.6,
  200: 50.0,
  300: 36.5,
  400: 21.2,
  500: 9.0,
  600: 0,
  700: -6.1,
  800: -10.6,
  900: -13.9,
  950: -21.4,
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean
  const num = parseInt(full, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  const delta = max - min
  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)
    switch (max) {
      case r: h = ((g - b) / delta) % 6; break
      case g: h = (b - r) / delta + 2; break
      default: h = (r - g) / delta + 4; break
    }
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s, l }
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

// Retorna { 50: "R G B", 100: "R G B", ... } pronto para virar CSS custom properties.
export function generateColorScale(hex) {
  const { r, g, b } = hexToRgb(hex)
  const { h, s, l } = rgbToHsl(r, g, b)
  const l600 = l * 100

  const escala = {}
  for (const tom of Object.keys(LIGHTNESS_DELTAS)) {
    const delta = LIGHTNESS_DELTAS[tom]
    const novoL = clamp(l600 + delta, 2, 98) / 100
    const rgb = hslToRgb(h, s, novoL)
    escala[tom] = `${rgb.r} ${rgb.g} ${rgb.b}`
  }
  return escala
}

// Aplica a escada gerada como variáveis CSS em :root (document.documentElement).
export function applyPrimaryColorScale(hex) {
  const escala = generateColorScale(hex)
  const root = document.documentElement
  for (const tom of Object.keys(escala)) {
    root.style.setProperty(`--color-primary-${tom}`, escala[tom])
  }
}
