"use client"

import { useEffect, useState } from "react"

// 18 luglio 2026, 09:00 ora italiana (CEST, UTC+2)
export const COUNTDOWN_TARGET = new Date("2026-07-18T09:00:00+02:00").getTime()

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(): TimeLeft {
  const diff = Math.max(0, COUNTDOWN_TARGET - Date.now())
  const totalSeconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

const UNITS: { key: keyof TimeLeft; label: string }[] = [
  { key: "days", label: "Giorni" },
  { key: "hours", label: "Ore" },
  { key: "minutes", label: "Minuti" },
  { key: "seconds", label: "Secondi" },
]

export function Countdown() {
  const [mounted, setMounted] = useState(false)
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft())

  useEffect(() => {
    setMounted(true)
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className="flex items-start justify-center gap-3 sm:gap-6"
      role="timer"
      aria-label="Conto alla rovescia all'inizio del torneo"
    >
      {UNITS.map(({ key, label }) => (
        <div key={key} className="flex min-w-[3rem] flex-col items-center sm:min-w-[4.5rem]">
          <span
            className="font-display text-4xl leading-none tabular-nums text-foreground sm:text-6xl"
            suppressHydrationWarning
          >
            {mounted ? String(timeLeft[key]).padStart(2, "0") : "--"}
          </span>
          <span className="mt-2 text-[0.6rem] font-medium uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}
