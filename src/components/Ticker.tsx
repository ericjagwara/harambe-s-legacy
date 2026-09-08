type TickerProps = {
  items: string[]
  variant?: 'gold' | 'green' | 'orange'
  reverse?: boolean
  className?: string
}

const variantClasses: Record<NonNullable<TickerProps['variant']>, string> = {
  gold: 'bg-secondary text-secondary-foreground',
  green: 'bg-primary text-white',
  orange: 'bg-accent text-white',
}

function TickerRow({ items, hidden }: { items: string[]; hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <span key={`${hidden ? 'b' : 'a'}-${item}`} className="ticker-item">
          <span className="px-6 sm:px-8">{item}</span>
          <span className="inline-block h-2 w-2 shrink-0 bg-current opacity-50" />
        </span>
      ))}
    </div>
  )
}

export default function Ticker({ items, variant = 'gold', reverse = false, className = '' }: TickerProps) {
  return (
    <div className={`ticker marquee border-y border-foreground/10 py-3 sm:py-3.5 ${variantClasses[variant]} ${className}`}>
      <div className={`marquee-track ${reverse ? 'reverse' : ''}`}>
        <TickerRow items={items} />
        <TickerRow items={items} hidden />
      </div>
    </div>
  )
}
