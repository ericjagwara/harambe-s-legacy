import { useEffect, useState } from 'react'

const RACE_TIME = new Date('2026-12-06T06:00:00+03:00').getTime()

type Parts = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function timeLeft(): Parts {
  const diff = Math.max(0, RACE_TIME - Date.now())
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1_000) % 60,
  }
}

export default function Countdown() {
  const [left, setLeft] = useState<Parts>(() => timeLeft())

  useEffect(() => {
    const timer = window.setInterval(() => setLeft(timeLeft()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const cells: Array<[number, string]> = [
    [left.days, 'Days'],
    [left.hours, 'Hours'],
    [left.minutes, 'Minutes'],
    [left.seconds, 'Seconds'],
  ]

  return (
    <section className="bg-foreground text-white" aria-label="Race day countdown">
      <div className="container-site grid gap-6 py-6 sm:grid-cols-[1fr_auto] sm:items-center sm:py-7">
        <div>
          <p className="font-ui text-[10px] font-bold uppercase tracking-[0.24em] text-secondary">Race day countdown</p>
          <p className="mt-1.5 font-display text-xl uppercase leading-none sm:text-2xl">Sunday, 6 December 2026, Makerere University</p>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {cells.map(([value, label]) => (
            <div key={label} className="bg-white/10 px-4 py-3 text-center sm:px-6">
              <p className="tabular font-display text-3xl leading-none text-secondary sm:text-4xl">{String(value).padStart(2, '0')}</p>
              <p className="mt-1.5 font-ui text-[9px] font-bold uppercase tracking-[0.2em] text-white/55">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
