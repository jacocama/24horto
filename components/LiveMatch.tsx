"use client";
import { useEffect, useRef, useState } from "react";
import { phaseLabel } from "@/lib/format";

type Goal = { id: string; minute: number; team: { id: string; name: string }; player: { name: string } | null };
type Data = {
  id: string;
  code: string;
  phase: string;
  status: string;
  half: number;
  currentMinute: number;
  homeScore: number;
  awayScore: number;
  homeTeam: { id: string; name: string } | null;
  awayTeam: { id: string; name: string } | null;
  goals: Goal[];
};

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
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-white/60 mb-3">
          <span>{phaseLabel[data.phase] ?? data.phase} · {data.code}</span>
          <span className="chip text-live"><span className="live-dot" /> LIVE {data.half}° tempo · {data.currentMinute}'</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="text-right font-extrabold text-lg truncate">{data.homeTeam?.name}</div>
          <div className="text-4xl font-black tabular-nums px-4 py-2 rounded-xl bg-black/50 min-w-[110px] text-center">
            {data.homeScore} - {data.awayScore}
          </div>
          <div className="text-left font-extrabold text-lg truncate">{data.awayTeam?.name}</div>
        </div>

        {(homeGoals.length + awayGoals.length) > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1 text-right">
              {homeGoals.map((g) => (
                <div key={g.id} className="text-white/80">⚽ {g.player?.name ?? "Gol"}</div>
              ))}
            </div>
            <div className="space-y-1">
              {awayGoals.map((g) => (
                <div key={g.id} className="text-white/80">⚽ {g.player?.name ?? "Gol"}</div>
              ))}
            </div>
          </div>
        )}
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
