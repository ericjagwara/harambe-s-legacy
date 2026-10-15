import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Check } from 'lucide-react'

// Drawn signature, exported as a PNG data URL. Fixed internal resolution, scaled to the box with CSS,
// so no resize handling is needed. `minInk` is the least number of inked pixels that counts as a signature
// (0 = anything drawn counts); smaller marks are treated as no signature.
const PAD_WIDTH = 900
const PAD_HEIGHT = 260

export default function SignaturePad({
  onChange,
  minInk = 0,
  hint = 'Use your finger or mouse. Your typed name above is what makes the signature valid.',
}: {
  onChange: (png: string | null) => void
  minInk?: number
  hint?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const [hasInk, setHasInk] = useState(false)
  const [tooSmall, setTooSmall] = useState(false)

  const position = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const start = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const ctx = event.currentTarget.getContext('2d')
    if (!ctx) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drawing.current = true
    const { x, y } = position(event)
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0b2e22'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 0.01, y) // a tap leaves a dot
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const move = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = event.currentTarget.getContext('2d')
    if (!ctx) return
    const { x, y } = position(event)
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const end = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    drawing.current = false
    const canvas = event.currentTarget
    if (minInk > 0) {
      const ctx = canvas.getContext('2d')
      const pixels = ctx?.getImageData(0, 0, canvas.width, canvas.height).data
      let ink = 0
      if (pixels) for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0) ink++
      if (ink < minInk) {
        setHasInk(false)
        setTooSmall(true)
        onChange(null)
        return
      }
    }
    setTooSmall(false)
    setHasInk(true)
    onChange(canvas.toDataURL('image/png'))
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasInk(false)
    setTooSmall(false)
    onChange(null)
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={PAD_WIDTH}
        height={PAD_HEIGHT}
        aria-label="Signature drawing area"
        className="block aspect-[900/260] w-full cursor-crosshair touch-none border border-dashed border-border bg-background"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />
      <div className="mt-2 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{hint}</p>
        <button type="button" onClick={clear} className="btn-outline px-3 py-2">
          Clear
        </button>
      </div>
      {tooSmall ? (
        <p className="mt-2 text-sm font-bold text-accent" role="alert">
          That mark is too small to be a signature. Please clear it and sign again.
        </p>
      ) : null}
      {hasInk ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
          <Check className="h-4 w-4" strokeWidth={3} /> Signature captured
        </p>
      ) : null}
    </div>
  )
}
