import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { resolveEdition } from "@/lib/edition"
import { FloatingWinners } from "@/components/floating-winners"
import { LiveOrCountdown } from "@/components/live-or-countdown"
import { AutoRefresh } from "@/components/auto-refresh"
import { fmtTime } from "@/lib/format"

export const dynamic = "force-dynamic"

const phaseShort: Record<string, string> = {
  PARADISO_R1: "1° Turno",
  PARADISO_R2: "2° Turno",
  INFERNO_R1: "1° Turno Inferno",
  INFERNO_R2: "2° Turno Inferno",
  PLAYOFF_R16: "Ottavi",
  PLAYOFF_QF: "Fase Finale",
  PLAYOFF_SF: "Fase Finale",
  PLAYOFF_FINAL: "Fase Finale",
}

const FINAL_PHASES = ["PLAYOFF_QF", "PLAYOFF_SF", "PLAYOFF_FINAL"]

function shuffle<T>(a: T[]): T[] {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

export default async function Page() {
  const edition = await resolveEdition()
  let liveMatch = null
  let nextMatch: {
    id: string; phase: string; scheduledAt: Date;
    homeTeam: { name: string } | null;
    awayTeam: { name: string } | null;
  } | null = null
  let currentPhase: string | null = null
  let phaseStatus: "upcoming" | "in-corso" | "concluso" = "upcoming"
  let teams: { id: string; name: string }[] = []

  let phaseMatches: {
    id: string; code: string; scheduledAt: Date; status: string;
    homeScore: number; awayScore: number; scoreUnknown: boolean;
    penaltyWinnerId: string | null;
    homeTeamId: string | null; awayTeamId: string | null;
    homeTeam: { name: string } | null;
    awayTeam: { name: string } | null;
  }[] = []

  if (edition) {
    liveMatch = await prisma.match.findFirst({
      where: { editionId: edition.id, status: "LIVE" },
      select: {
        id: true, phase: true, homeScore: true, awayScore: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    })

    // Determine current phase: LIVE > next SCHEDULED > last FINISHED
    if (liveMatch) {
      currentPhase = liveMatch.phase
      phaseStatus = "in-corso"
    } else {
      const nextScheduled = await prisma.match.findFirst({
        where: { editionId: edition.id, status: "SCHEDULED" },
        orderBy: { scheduledAt: "asc" },
        select: {
          id: true, phase: true, scheduledAt: true,
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      })
      if (nextScheduled) {
        currentPhase = nextScheduled.phase
        phaseStatus = "upcoming"
        nextMatch = nextScheduled
      } else {
        const lastFinished = await prisma.match.findFirst({
          where: { editionId: edition.id, status: "FINISHED" },
          orderBy: { scheduledAt: "desc" },
          select: { phase: true },
        })
        if (lastFinished) {
          currentPhase = lastFinished.phase
          phaseStatus = "concluso"
        }
      }
    }

    const allTeams = await prisma.team.findMany({
      where: { editionId: edition.id },
      select: { id: true, name: true },
    })
    teams = shuffle(allTeams).slice(0, 8)

    if (currentPhase) {
      const phasesToShow = FINAL_PHASES.includes(currentPhase)
        ? FINAL_PHASES
        : [currentPhase]
      phaseMatches = await prisma.match.findMany({
        where: { editionId: edition.id, phase: { in: phasesToShow as any } },
        orderBy: { scheduledAt: "asc" },
        select: {
          id: true, code: true, scheduledAt: true, status: true,
          homeScore: true, awayScore: true, scoreUnknown: true,
          penaltyWinnerId: true, homeTeamId: true, awayTeamId: true,
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      })
    }
  }


  return (
    <main className="relative min-h-dvh overflow-hidden">
      <AutoRefresh interval={liveMatch ? 5000 : 20000} />
      <FloatingWinners />

      {/* Decorative dots top-left */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-6 top-10 grid grid-cols-5 gap-2 opacity-40 sm:left-12 sm:top-16"
      >
        {Array.from({ length: 25 }).map((_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary sm:h-2 sm:w-2" />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-6 py-10 sm:py-14">
        {/* Hero */}
        <div className="flex w-full flex-col items-center text-center">
          <div className="relative flex items-center justify-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 scale-150 rounded-full opacity-60 blur-2xl"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in oklch, var(--primary) 35%, transparent) 0%, transparent 65%)",
              }}
            />
            <Image
              src="/logo-24ore.png"
              alt="Logo 24h Orto"
              width={220}
              height={220}
              priority
              className="relative h-auto w-20 sm:w-32"
              style={{
                maskImage:
                  "radial-gradient(circle at 50% 50%, black 60%, transparent 92%)",
                WebkitMaskImage:
                  "radial-gradient(circle at 50% 50%, black 60%, transparent 92%)",
              }}
            />
          </div>

          <h1 className="mt-3 font-display text-4xl uppercase leading-[0.9] tracking-tight text-foreground sm:text-6xl">
            24<span className="text-primary">h</span> Orto
          </h1>
          <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground sm:text-sm">
            18 / 19 Luglio 2026 — XXI Edizione
          </p>
        </div>

        {/* Countdown / Live */}
        <div className="mt-8 w-full sm:mt-10">
          <LiveOrCountdown
            liveMatch={liveMatch as any}
            nextMatch={nextMatch ? JSON.parse(JSON.stringify(nextMatch)) : null}
          />
        </div>

        {/* Full phase matches list */}
        {currentPhase && phaseMatches.length > 0 && (
          <Link href="/diretta/tabellone"
            className="mt-8 block w-full max-w-lg group">
            <div className="text-center mb-3 font-display text-2xl uppercase tracking-tight text-primary group-hover:underline">
              {phaseShort[currentPhase] ?? currentPhase}
            </div>
            <div className="rounded-2xl border border-border bg-card/50 p-2 group-hover:border-primary/40 group-active:scale-[0.99] transition">
              <div className="divide-y divide-white/5">
                {phaseMatches.map((m) => {
                  const finished = m.status === "FINISHED"
                  const isLive = m.status === "LIVE"
                  const draw = finished && m.homeScore === m.awayScore
                  const homeWin = (finished && !m.scoreUnknown && m.homeScore > m.awayScore) ||
                    ((finished && (draw || m.scoreUnknown)) && m.penaltyWinnerId === m.homeTeamId)
                  const awayWin = (finished && !m.scoreUnknown && m.awayScore > m.homeScore) ||
                    ((finished && (draw || m.scoreUnknown)) && m.penaltyWinnerId === m.awayTeamId)
                  return (
                    <div key={m.id}
                      className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 py-2 text-sm">
                      <span className={`truncate text-right font-semibold ${homeWin ? "text-primary" : ""}`}>
                        {m.homeTeam?.name ?? "—"}
                      </span>
                      <span className={`tabular-nums font-black shrink-0 px-2 ${
                        isLive ? "text-red-400" :
                        finished ? "text-foreground" :
                        "text-[11px] text-muted-foreground font-normal"
                      }`}>
                        {finished
                          ? (m.scoreUnknown ? "→" : `${m.homeScore}-${m.awayScore}`)
                          : isLive
                          ? `${m.homeScore}-${m.awayScore}`
                          : fmtTime(m.scheduledAt)}
                      </span>
                      <span className={`truncate text-left font-semibold ${awayWin ? "text-primary" : ""}`}>
                        {m.awayTeam?.name ?? "—"}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="mt-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary transition">
              Tabellone completo →
            </div>
          </Link>
        )}

        {/* 8 random teams */}
        {teams.length > 0 && (
          <Link href="/diretta/squadre" className="mt-8 block w-full max-w-lg group">
            <div className="text-center mb-3 font-display text-2xl uppercase tracking-tight text-primary group-hover:underline">
              Le Squadre
            </div>
            <div className="grid grid-cols-2 gap-2 group-hover:opacity-95 group-active:scale-[0.99] transition">
              {teams.map((t) => (
                <div key={t.id}
                  className="rounded-xl border border-border bg-card/50 px-3 py-2.5 text-sm font-bold truncate">
                  {t.name}
                </div>
              ))}
            </div>
            <div className="mt-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary transition">
              Tutte le squadre →
            </div>
          </Link>
        )}

        {/* Footer link */}
        <div className="mt-10 text-xs uppercase tracking-widest">
          <Link href="/albo-doro" className="text-primary hover:underline">
            🏆 Albo d&apos;oro
          </Link>
        </div>

        {/* Claim */}
        <p className="mt-8 max-w-xl text-balance font-display text-2xl uppercase leading-[1.05] tracking-tight text-foreground text-center sm:text-4xl">
          You can <span className="text-primary">be heroes</span>
          <br />
          just for <span className="text-primary">one day</span>
        </p>
      </div>
    </main>
  )
}
