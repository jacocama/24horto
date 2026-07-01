"use client"

import { useMemo } from "react"

const WINNERS = [
  { year: 2025, team: "BAR VENEZIA" },
  { year: 2024, team: "LOGGIA AL 42" },
  { year: 2023, team: "CALZATURIFICIO MARINA" },
  { year: 2022, team: "MECONI TEAM" },
  { year: 2019, team: "AUTOSPA" },
  { year: 2018, team: "GARRA CHARRÙA" },
  { year: 2017, team: "BAR PANETTE" },
  { year: 2016, team: "ALL STAR FRATTA" },
  { year: 2015, team: "TEAM MATTIA" },
  { year: 2014, team: "DINAMO MANDOLÌ" },
  { year: 2013, team: "RIONE MURATO" },
  { year: 2012, team: "BAR LI TICHI" },
  { year: 2011, team: "I LECCORNIOSI" },
  { year: 2010, team: "F.C. TEMI" },
  { year: 2009, team: "BAGALACTICOS" },
  { year: 2008, team: "IDRATATI E REINTEGRATI" },
  { year: 2007, team: "IDRATATI E REINTEGRATI" },
  { year: 2006, team: "IDRATATI E REINTEGRATI" },
  { year: 2005, team: "EMINFLEX" },
  { year: 2004, team: "LA BANDA DEL TICO" },
]

// deterministic pseudo-random so server/client match
function rand(seed: number) {
  const x = Math.sin(seed * 99.13) * 43758.5453
  return x - Math.floor(x)
}

export function FloatingWinners() {
  const items = useMemo(() => {
    // Deterministic shuffle so the visual order isn't strictly chronological,
    // while staying identical between server and client render.
    const order = WINNERS.map((_, i) => i)
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand(i * 3.7 + 1) * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }

    return order.map((sourceIndex, i) => {
      const w = WINNERS[sourceIndex]
      const duration = Number((38 + rand(i + 7) * 40).toFixed(2)) // s
      const delay = Number((-rand(i + 3) * duration).toFixed(2)) // s, negative => already in motion
      const direction = rand(i + 11) > 0.5 ? "drift-right" : "drift-left"
      const fontSize = Number(((0.85 + rand(i + 5) * 0.9) * 2.2).toFixed(2)) // rem
      return { ...w, duration, delay, direction, fontSize, id: sourceIndex }
    })
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 flex flex-col items-start justify-between overflow-hidden py-6"
    >
      {items.map((it) => (
        <div
          key={it.id}
          className="floating-winner relative whitespace-nowrap font-display uppercase tracking-tight text-primary/[0.07]"
          style={{
            animationName: it.direction,
            animationDuration: `${it.duration}s`,
            animationDelay: `${it.delay}s`,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            fontSize: `${it.fontSize}rem`,
            lineHeight: 1.1,
          }}
        >
          <span className="text-primary/[0.10]">{it.year}</span> {it.team}
        </div>
      ))}
    </div>
  )
}
