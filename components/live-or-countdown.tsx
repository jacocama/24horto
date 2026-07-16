"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Countdown, COUNTDOWN_TARGET } from "@/components/countdown";
import { fmtTime } from "@/lib/format";

type LiveMatchLite = {
  id: string;
  phase: string;
  homeTeam: { name: string } | null;
  awayTeam: { name: string } | null;
  homeScore: number;
  awayScore: number;
} | null;

type NextMatchLite = {
  id: string;
  phase: string;
  scheduledAt: string;
  homeTeam: { name: string } | null;
  awayTeam: { name: string } | null;
} | null;

const phaseShort: Record<string, string> = {
  PARADISO_R1: "Paradiso 1° Turno",
  PARADISO_R2: "Paradiso 2° Turno",
  INFERNO_R1: "Inferno 1° Turno",
  INFERNO_R2: "Inferno 2° Turno",
  PLAYOFF_R16: "Ottavi",
  PLAYOFF_QF: "Quarti",
  PLAYOFF_SF: "Semifinali",
  PLAYOFF_FINAL: "Finale",
};

export function LiveOrCountdown({
  liveMatch,
  nextMatch,
}: {
  liveMatch: LiveMatchLite;
  nextMatch: NextMatchLite;
}) {
  const prev = useRef<{ id: string; home: number; away: number } | null>(null);
  const [flash, setFlash] = useState<{ home: boolean; away: boolean }>({ home: false, away: false });
  const [countdownOver, setCountdownOver] = useState(false);

  useEffect(() => {
    const check = () => setCountdownOver(Date.now() >= COUNTDOWN_TARGET);
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!liveMatch) {
      prev.current = null;
      setFlash({ home: false, away: false });
      return;
    }
    const isSameMatch = prev.current?.id === liveMatch.id;
    if (isSameMatch) {
      const homeUp = liveMatch.homeScore > (prev.current?.home ?? 0);
      const awayUp = liveMatch.awayScore > (prev.current?.away ?? 0);
      if (homeUp || awayUp) {
        setFlash({ home: homeUp, away: awayUp });
        const t = setTimeout(() => setFlash({ home: false, away: false }), 2000);
        return () => clearTimeout(t);
      }
    }
    prev.current = { id: liveMatch.id, home: liveMatch.homeScore, away: liveMatch.awayScore };
  }, [liveMatch]);

  useEffect(() => {
    if (!flash.home && !flash.away && liveMatch) {
      prev.current = { id: liveMatch.id, home: liveMatch.homeScore, away: liveMatch.awayScore };
    }
  }, [flash, liveMatch]);

  // Partita LIVE
  if (liveMatch) {
    return (
      <Link href="/diretta" className="block w-full max-w-lg mx-auto group">
        <div className="text-center mb-3 font-display text-2xl uppercase tracking-tight text-primary group-hover:underline">
          Live
        </div>
        <div className="rounded-2xl border border-border bg-card/50 p-2 group-hover:border-primary/40 group-active:scale-[0.99] transition">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground px-2 pt-1 mb-1">
            <span>{phaseShort[liveMatch.phase] ?? liveMatch.phase}</span>
            <span className="flex items-center gap-1.5 font-black text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE
            </span>
          </div>
          <div className="divide-y divide-white/5">
            <div className={`flex items-center justify-between px-2 py-2 text-sm transition-colors duration-300 ${flash.home ? "text-primary" : ""}`}>
              <span className="font-bold truncate">{liveMatch.homeTeam?.name ?? "—"}</span>
              <span className="font-black tabular-nums shrink-0 ml-2 text-lg">{liveMatch.homeScore}</span>
            </div>
            <div className={`flex items-center justify-between px-2 py-2 text-sm transition-colors duration-300 ${flash.away ? "text-primary" : ""}`}>
              <span className="font-bold truncate">{liveMatch.awayTeam?.name ?? "—"}</span>
              <span className="font-black tabular-nums shrink-0 ml-2 text-lg">{liveMatch.awayScore}</span>
            </div>
          </div>
        </div>
        <div className="mt-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary transition">
          Vai al live →
        </div>
      </Link>
    );
  }

  // Countdown ancora attivo
  if (!countdownOver) {
    return <Countdown />;
  }

  // Countdown finito e nessuna partita LIVE → Starting soon con prossima partita
  return (
    <Link href="/diretta" className="block w-full max-w-lg mx-auto group">
      <div className="text-center mb-3 font-display text-2xl uppercase tracking-tight text-primary group-hover:underline animate-pulse">
        Starting Soon
      </div>
      {nextMatch && (
        <div className="rounded-2xl border border-border bg-card/50 p-2 group-hover:border-primary/40 group-active:scale-[0.99] transition">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground px-2 pt-1 mb-1">
            <span>{phaseShort[nextMatch.phase] ?? nextMatch.phase}</span>
            <span className="tabular-nums">{fmtTime(nextMatch.scheduledAt)}</span>
          </div>
          <div className="divide-y divide-white/5">
            <div className="px-2 py-2 text-sm font-bold truncate">
              {nextMatch.homeTeam?.name ?? "—"}
            </div>
            <div className="px-2 py-2 text-sm font-bold truncate">
              {nextMatch.awayTeam?.name ?? "—"}
            </div>
          </div>
        </div>
      )}
      <div className="mt-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary transition">
        Vai al live →
      </div>
    </Link>
  );
}
