"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fmtDate, fmtTime, phaseLabel } from "@/lib/format";

type Team = { id: string; name: string } | null;

export function ComingSoon({ match }: {
  match: {
    id: string;
    code: string;
    phase: string;
    scheduledAt: string;
    homeTeam: Team;
    awayTeam: Team;
  } | null;
}) {
  const router = useRouter();

  // polling: ogni 10s ricarica lo stato del server per beccare la nuova partita LIVE
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 10000);
    return () => clearInterval(t);
  }, [router]);

  if (!match) {
    return (
      <div className="card text-center text-white/60">
        Nessuna partita in programma.
      </div>
    );
  }

  return (
    <div className="card border-accent/40">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-white/60 mb-2">
        <span className="truncate">{phaseLabel[match.phase] ?? match.phase} · {match.code}</span>
        <span className="chip text-accent font-black">Coming soon</span>
      </div>
      <div className="divide-y divide-white/10">
        <div className="py-3">
          <span className="font-extrabold text-lg truncate">{match.homeTeam?.name ?? "—"}</span>
        </div>
        <div className="py-3">
          <span className="font-extrabold text-lg truncate">{match.awayTeam?.name ?? "—"}</span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/10 text-center text-xs text-white/60">
        {fmtDate(match.scheduledAt)} · {fmtTime(match.scheduledAt)}
      </div>
    </div>
  );
}
