// Draws the "I will be there" poster on a canvas, entirely in the visitor's browser.
// The photo never leaves their device here; only the finished poster is emailed once they confirm their email.

export const POSTER_W = 1080
export const POSTER_H = 1080
// Drawn at twice the size so the poster stays sharp on big screens and when shared.
export const POSTER_SCALE = 2

export type PosterTemplate = 'green' | 'gold' | 'night'
export const TEMPLATES: Array<{ key: PosterTemplate; label: string; swatch: string }> = [
  { key: 'green', label: 'Harambe green', swatch: '#00563a' },
  { key: 'gold', label: 'Gold rush', swatch: '#e1a524' },
  { key: 'night', label: 'Night run', swatch: '#06241a' },
]

export const ACTIVITIES = [
  { value: '21 km', big: '21 KM', top: "I'LL BE RUNNING", sub: 'THE HALF MARATHON', label: 'Running the 21 km half marathon' },
  { value: '10 km', big: '10 KM', top: "I'LL BE RUNNING", sub: '', label: 'Running the 10 km' },
  { value: '5 km', big: '5 KM', top: "I'LL BE RUNNING", sub: '', label: 'Running the 5 km' },
  { value: '3 km', big: '3 KM', top: "I'LL BE RUNNING", sub: 'THE FUN RUN', label: 'Running the 3 km fun run' },
  { value: 'cheering', big: 'CHEERING!', top: "I'LL BE", sub: 'FROM THE SIDELINES', label: 'Cheering from the sidelines' },
  { value: 'volunteering', big: 'HELPING!', top: "I'LL BE", sub: 'AS A VOLUNTEER', label: 'Volunteering on the day' },
]

export const TAGLINES = [
  'Come run with me!',
  'Run for startups. Fund the next big thing.',
  'Sweat now, startups win later.',
  'Every step funds a student founder.',
]

type Look = { blob: string; text: string; accent: string; ring: string; ribbonText: string; badge: string; badgeText: string }
const LOOKS: Record<PosterTemplate, Look> = {
  green: { blob: '#03664f', text: '#ffffff', accent: '#ffd12a', ring: '#ffd12a', ribbonText: '#0b4a3a', badge: '#ffd12a', badgeText: '#0b2e22' },
  gold: { blob: '#e1a524', text: '#0b2e22', accent: '#00563a', ring: '#00563a', ribbonText: '#00563a', badge: '#00563a', badgeText: '#ffffff' },
  night: { blob: '#06241a', text: '#ffffff', accent: '#f08a24', ring: '#f08a24', ribbonText: '#06241a', badge: '#f08a24', badgeText: '#06241a' },
}

export type PosterInput = {
  template: PosterTemplate
  name: string
  activity: string
  tagline: string
  photo: CanvasImageSource | null
  logo: CanvasImageSource | null
}

export async function loadFonts() {
  try {
    await Promise.all([document.fonts.load('800 80px Montserrat'), document.fonts.load('700 30px Montserrat'), document.fonts.load('600 30px Montserrat')])
  } catch {
    /* falls back to a system font */
  }
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

const FONT = 'Montserrat, "Helvetica Neue", Arial, sans-serif'

function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, maxWidth: number, start: number, min = 24) {
  let size = start
  ctx.font = `${weight} ${size}px ${FONT}`
  while (ctx.measureText(text).width > maxWidth && size > min) {
    size -= 2
    ctx.font = `${weight} ${size}px ${FONT}`
  }
  return size
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function sourceSize(src: CanvasImageSource) {
  const s = src as { naturalWidth?: number; naturalHeight?: number; width?: number; height?: number }
  return { w: s.naturalWidth || s.width || 1, h: s.naturalHeight || s.height || 1 }
}

const BADGES: Record<string, [string, string]> = {
  '21 km': ['21', 'KM'],
  '10 km': ['10', 'KM'],
  '5 km': ['5', 'KM'],
  '3 km': ['3', 'KM'],
  cheering: ['LOUD', '& PROUD'],
  volunteering: ['HERE TO', 'HELP'],
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

// Small round icons drawn with paths so no image files are needed.
function icon(ctx: CanvasRenderingContext2D, kind: 'calendar' | 'runner' | 'pin' | 'globe', cx: number, cy: number, fg: string, bg: string) {
  ctx.save()
  ctx.fillStyle = bg
  ctx.beginPath()
  ctx.arc(cx, cy, 30, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = fg
  ctx.fillStyle = fg
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (kind === 'calendar') {
    roundRect(ctx, cx - 14, cy - 12, 28, 26, 5)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx - 14, cy - 3)
    ctx.lineTo(cx + 14, cy - 3)
    ctx.moveTo(cx - 7, cy - 17)
    ctx.lineTo(cx - 7, cy - 9)
    ctx.moveTo(cx + 7, cy - 17)
    ctx.lineTo(cx + 7, cy - 9)
    ctx.stroke()
    for (const [dx, dy] of [[-7, 4], [0, 4], [7, 4], [-7, 10], [0, 10]]) {
      ctx.beginPath()
      ctx.arc(cx + dx, cy + dy, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (kind === 'runner') {
    ctx.beginPath()
    ctx.arc(cx + 5, cy - 14, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(cx + 3, cy - 7)
    ctx.lineTo(cx - 3, cy + 3)
    ctx.lineTo(cx + 6, cy + 8)
    ctx.lineTo(cx + 3, cy + 17)
    ctx.moveTo(cx - 3, cy + 3)
    ctx.lineTo(cx - 12, cy + 10)
    ctx.moveTo(cx + 2, cy - 5)
    ctx.lineTo(cx + 14, cy - 1)
    ctx.moveTo(cx + 2, cy - 5)
    ctx.lineTo(cx - 8, cy - 8)
    ctx.stroke()
  } else if (kind === 'pin') {
    ctx.beginPath()
    ctx.arc(cx, cy - 4, 12, Math.PI, 0)
    ctx.quadraticCurveTo(cx + 12, cy + 8, cx, cy + 20)
    ctx.quadraticCurveTo(cx - 12, cy + 8, cx - 12, cy - 4)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx, cy - 4, 4.5, 0, Math.PI * 2)
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.arc(cx, cy, 16, 0, Math.PI * 2)
    ctx.moveTo(cx - 16, cy)
    ctx.lineTo(cx + 16, cy)
    ctx.moveTo(cx, cy - 16)
    ctx.quadraticCurveTo(cx - 12, cy, cx, cy + 16)
    ctx.moveTo(cx, cy - 16)
    ctx.quadraticCurveTo(cx + 12, cy, cx, cy + 16)
    ctx.stroke()
  }
  ctx.restore()
}

export function drawPoster(canvas: HTMLCanvasElement, input: PosterInput) {
  canvas.width = POSTER_W * POSTER_SCALE
  canvas.height = POSTER_H * POSTER_SCALE
  const ctx = canvas.getContext('2d')!
  ctx.scale(POSTER_SCALE, POSTER_SCALE)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  const L = LOOKS[input.template]
  const act = ACTIVITIES.find((a) => a.value === input.activity) ?? ACTIVITIES[2]
  const name = input.name.trim() || 'YOUR NAME'
  const badge = BADGES[act.value] ?? BADGES['5 km']
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // White page with one big rounded shape, like a sticker sheet.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)
  ctx.fillStyle = L.blob
  ctx.beginPath()
  ctx.moveTo(0, 112)
  ctx.lineTo(560, 112)
  ctx.bezierCurveTo(850, 112, 1010, 270, 1015, 520)
  ctx.bezierCurveTo(1018, 640, 930, 700, 870, 790)
  ctx.bezierCurveTo(800, 900, 770, 1000, 735, 1080)
  ctx.lineTo(0, 1080)
  ctx.closePath()
  ctx.fill()

  // Logo on the white strip, three dots on the right.
  if (input.logo) {
    const { w, h } = sourceSize(input.logo)
    const lh = 70
    ctx.drawImage(input.logo, 52, 21, (w / h) * lh, lh)
  }
  ctx.fillStyle = L.blob
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(900 + i * 34, 62, 11, 0, Math.PI * 2)
    ctx.fill()
  }

  // Headline.
  ctx.fillStyle = L.text
  ctx.font = `800 138px ${FONT}`
  ctx.fillText("I'll be", 88, 285)
  ctx.fillText('there!', 88, 412)

  // Warm line.
  ctx.font = `500 29px ${FONT}`
  const lines = wrapText(ctx, input.tagline, 620)
  lines.forEach((line, i) => ctx.fillText(line, 90, 480 + i * 40))

  // Details with icons.
  const rows: Array<['calendar' | 'runner' | 'pin', string]> = [
    ['calendar', 'Sun 29 November 2026'],
    ['runner', act.label],
    ['pin', 'Freedom Square, Kampala'],
  ]
  rows.forEach(([kind, label], i) => {
    const y = 600 + i * 78
    icon(ctx, kind, 120, y, L.blob, '#ffffff')
    ctx.fillStyle = L.text
    ctx.font = `700 33px ${FONT}`
    let size = 33
    while (ctx.measureText(label).width > 385 && size > 20) {
      size -= 1
      ctx.font = `700 ${size}px ${FONT}`
    }
    ctx.fillText(label, 172, y + 12)
  })

  // Photo in a ring, bottom right.
  const cx = 805
  const cy = 715
  const R = 190
  ctx.fillStyle = L.ring
  ctx.beginPath()
  ctx.arc(cx, cy, R + 24, 0, Math.PI * 2)
  ctx.fill()
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.clip()
  if (input.photo) {
    const { w, h } = sourceSize(input.photo)
    const scale = Math.max((R * 2) / w, (R * 2) / h)
    ctx.drawImage(input.photo, cx - (w * scale) / 2, cy - (h * scale) / 2, w * scale, h * scale)
  } else {
    ctx.fillStyle = '#dfe7e2'
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2)
    ctx.fillStyle = '#9db1a8'
    ctx.beginPath()
    ctx.arc(cx, cy - 45, 75, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx, cy + 165, 150, 125, 0, Math.PI, 0)
    ctx.fill()
  }
  ctx.restore()

  // Sticker badge: how they will be there.
  ctx.save()
  ctx.translate(650, 545)
  ctx.rotate(-0.2)
  ctx.shadowColor = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur = 14
  ctx.shadowOffsetY = 6
  ctx.fillStyle = L.badge
  ctx.beginPath()
  for (let i = 0; i < 24; i++) {
    const ang = (i / 24) * Math.PI * 2
    const r = i % 2 === 0 ? 84 : 72
    ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r)
  }
  ctx.closePath()
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.fillStyle = L.badgeText
  ctx.textAlign = 'center'
  const bigSize = badge[0].length > 3 ? 30 : 54
  ctx.font = `800 ${bigSize}px ${FONT}`
  ctx.fillText(badge[0], 0, badge[0].length > 3 ? -2 : 6)
  ctx.font = `800 ${badge[1].length > 3 ? 20 : 28}px ${FONT}`
  ctx.fillText(badge[1], 0, badge[0].length > 3 ? 26 : 36)
  ctx.restore()

  // White ribbon with the name.
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.22)'
  ctx.shadowBlur = 16
  ctx.shadowOffsetY = 8
  const label = name.toUpperCase()
  ctx.font = `800 44px ${FONT}`
  const size = fit(ctx, label, 800, 560, 44, 24)
  const rw = Math.min(ctx.measureText(label).width + 120, 700)
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(95, 878)
  ctx.lineTo(95 + rw, 878)
  ctx.lineTo(95 + rw - 26, 940)
  ctx.lineTo(70, 940)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
  ctx.fillStyle = L.ribbonText
  ctx.textAlign = 'left'
  ctx.font = `800 ${size}px ${FONT}`
  ctx.fillText(label, 112, 922 - (44 - size) * 0.15)

  // Footer.
  icon(ctx, 'globe', 120, 1006, L.blob, '#ffffff')
  ctx.fillStyle = L.text
  ctx.font = `800 32px ${FONT}`
  ctx.fillText('haramberun.com', 172, 1004)
  ctx.font = `600 23px ${FONT}`
  ctx.fillText('#StartupsHarambeRun', 172, 1038)
}

export function posterBlob(canvas: HTMLCanvasElement, type: 'image/png' | 'image/jpeg', quality = 0.9) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not make the image'))), type, quality))
}
