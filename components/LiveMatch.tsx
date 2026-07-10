"use client";
import { useEffect, useRef, useState } from "react";
import { phaseLabel } from "@/lib/format";

type Goal = { id: string; minute: number; team: { id: string; name: string }; player: { name: string } | null };
type Data = {
  id: string;
  code: string;
  phase: string;
  status: string;
  homeScore: number;
  awayScore: number;
  homeTeam: { id: string; name: string } | null;
  awayTeam: { id: string; name: string } | null;
  goals: Goal[];
};

function TeamRow({ name, score, goals }: { name?: string; score: number; goals: Goal[] }) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-extrabold text-lg truncate">{name ?? "—"}</span>
        <span className="text-3xl font-black tabular-nums shrink-0">{score}</span>
      </div>
      {goals.length > 0 && (
        <div className="mt-1.5 space-y-0.5 text-sm text-white/70">
          {goals.map((g) => (
            <div key={g.id} className="truncate">⚽ {g.player?.name ?? "Gol"}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LiveMatch({ initialId }: { initialId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [celebration, setCelebration] = useState<{ team: string; player: string | null; key: number } | null>(null);
  const lastGoalIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const r = await fetch(`/api/matches/${initialId}`, { cache: "no-store" });
      if (!r.ok || !alive) return;
      const next: Data = await r.json();

      // detect new goals
      const currentIds = new Set(next.goals.map((g) => g.id));
      if (lastGoalIdsRef.current) {
        const newGoals = next.goals.filter((g) => !lastGoalIdsRef.current!.has(g.id));
        if (newGoals.length > 0) {
          const g = newGoals[newGoals.length - 1];
          setCelebration({ team: g.team.name, player: g.player?.name ?? null, key: Date.now() });
        }
      }
      lastGoalIdsRef.current = currentIds;
      setData(next);
    };
    load();
    const timer = setInterval(load, 5000);
    return () => { alive = false; clearInterval(timer); };
  }, [initialId]);

  // auto-dismiss celebration
  useEffect(() => {
    if (!celebration) return;
    const t = setTimeout(() => setCelebration(null), 3800);
    return () => clearTimeout(t);
  }, [celebration]);

  if (!data) return <div className="card text-white/60">Caricamento…</div>;

  const homeGoals = data.goals.filter((g) => g.team.id === data.homeTeam?.id);
  const awayGoals = data.goals.filter((g) => g.team.id === data.awayTeam?.id);

  return (
    <>
      <div className="card border-accent/40">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-white/60 mb-2">
          <span className="truncate">{phaseLabel[data.phase] ?? data.phase} · {data.code}</span>
          <span className="chip text-live"><span className="live-dot" /> LIVE</span>
        </div>
        <div className="divide-y divide-white/10">
          <TeamRow name={data.homeTeam?.name} score={data.homeScore} goals={homeGoals} />
          <TeamRow name={data.awayTeam?.name} score={data.awayScore} goals={awayGoals} />
        </div>
      </div>

      {celebration && <GoalCelebration key={celebration.key} team={celebration.team} player={celebration.player} />}
    </>
  );
}

function GoalCelebration({ team, player }: { team: string; player: string | null }) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-brand-bg/85 animate-[goalFade_3.8s_ease-out_forwards]" />
      <div className="relative text-center px-6">
        <div className="text-[clamp(80px,22vw,200px)] font-black tracking-tighter text-accent leading-none animate-[goalPop_3.8s_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
          style={{ textShadow: "0 0 40px rgba(240,147,109,0.6), 0 8px 30px rgba(0,0,0,0.5)" }}>
          GOL!
        </div>
        <div className="mt-3 text-2xl font-extrabold text-white animate-[goalSlide_3.8s_ease-out_forwards]">
          {team}
        </div>
        {player && (
          <div className="mt-1 text-lg text-white/80 animate-[goalSlide_3.8s_ease-out_0.1s_forwards] opacity-0">
            ⚽ {player}
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes goalFade {
          0% { opacity: 0; }
          15% { opacity: 1; }
          75% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes goalPop {
          0% { transform: scale(0.2) rotate(-15deg); opacity: 0; }
          20% { transform: scale(1.15) rotate(3deg); opacity: 1; }
          30% { transform: scale(0.95) rotate(-2deg); }
          40% { transform: scale(1) rotate(0deg); }
          75% { transform: scale(1) rotate(0deg); opacity: 1; }
          100% { transform: scale(1.05) rotate(0deg); opacity: 0; }
        }
        @keyframes goalSlide {
          0% { transform: translateY(30px); opacity: 0; }
          25% { transform: translateY(0); opacity: 1; }
          75% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
