"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { phaseLabel } from "@/lib/format";
import { computeMatchTime } from "@/lib/matchTime";
import { useConfirm } from "@/components/confirm-dialog";

type Player = { id: string; name: string; isCoach: boolean };
type Team = { id: string; name: string; players: Player[] } | null;
type Goal = { id: string; team: { id: string; name: string }; player: { id: string; name: string } | null; teamId: string };
type Match = {
  id: string; code: string; phase: string; status: string;
  scheduledAt: string;
  startedAt: string | null;
  homeScore: number; awayScore: number;
  penaltyWinnerId: string | null;
  scoreUnknown: boolean;
  mvpId: string | null;
  homeTeam: Team; awayTeam: Team; goals: Goal[];
};

export function MatchEditor({ match }: { match: Match }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [m, setM] = useState(match);
  const [tick, setTick] = useState(0);
  const confirmDialog = useConfirm();

  // tick every second so live minute updates
  useEffect(() => {
    if (m.status !== "LIVE") return;
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [m.status]);

  const t = computeMatchTime(m.startedAt, m.status);

  const call = (body: any, method: string = "PATCH", path: string = "") =>
    start(async () => {
      const r = await fetch(`/api/admin/matches/${m.id}${path}`, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        const j = await r.json();
        // reload fresh state via SSR
        router.refresh();
        if (j && !path) setM({ ...m, ...j });
      }
    });

  const addGoal = (teamId: string, playerId: string | null) =>
    start(async () => {
      const r = await fetch(`/api/admin/matches/${m.id}/goals`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ teamId, playerId }),
      });
      if (!r.ok) return;
      const goal = await r.json();
      const team =
        teamId === m.homeTeam?.id ? m.homeTeam :
        teamId === m.awayTeam?.id ? m.awayTeam : null;
      const player = team?.players.find((p) => p.id === playerId) ?? null;
      const newGoal: Goal = {
        id: goal.id,
        teamId,
        team: { id: team!.id, name: team!.name },
        player: player ? { id: player.id, name: player.name } : null,
      };
      setM({
        ...m,
        homeScore: teamId === m.homeTeam?.id ? m.homeScore + 1 : m.homeScore,
        awayScore: teamId === m.awayTeam?.id ? m.awayScore + 1 : m.awayScore,
        goals: [...m.goals, newGoal],
      });
      router.refresh();
    });

  const delGoal = (id: string) =>
    start(async () => {
      const r = await fetch(`/api/admin/matches/${m.id}/goals/${id}`, { method: "DELETE" });
      if (!r.ok) return;
      const g = m.goals.find((x) => x.id === id);
      if (!g) return;
      setM({
        ...m,
        homeScore: g.teamId === m.homeTeam?.id ? Math.max(0, m.homeScore - 1) : m.homeScore,
        awayScore: g.teamId === m.awayTeam?.id ? Math.max(0, m.awayScore - 1) : m.awayScore,
        goals: m.goals.filter((x) => x.id !== id),
      });
      router.refresh();
    });

  return (
    <div className="space-y-5">
      <div className="text-[11px] uppercase tracking-wider text-white/50">
        {phaseLabel[m.phase] ?? m.phase} · {m.code}
      </div>

      {/* Scoreboard */}
      <div className="card space-y-3">
        <div className="divide-y divide-white/10">
          <div className="flex items-center justify-between py-2">
            <span className="font-extrabold truncate text-lg">{m.homeTeam?.name ?? "—"}</span>
            <span className="text-3xl font-black tabular-nums text-accent">{m.homeScore}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="font-extrabold truncate text-lg">{m.awayTeam?.name ?? "—"}</span>
            <span className="text-3xl font-black tabular-nums text-accent">{m.awayScore}</span>
          </div>
        </div>

        {/* Status + controls */}
        <div className="flex items-center justify-center gap-2">
          {m.status === "SCHEDULED" && (
            <button onClick={() => call({ action: "start" })}
              className="bg-accent text-pitchDark font-black px-5 py-2 rounded-lg text-lg">
              ▶ START
            </button>
          )}
          {m.status === "FINISHED" && m.scoreUnknown && m.penaltyWinnerId && (
            <span className="chip text-accent">
              Passa: {(m.penaltyWinnerId === m.homeTeam?.id ? m.homeTeam?.name : m.awayTeam?.name)}
            </span>
          )}
          {m.status === "LIVE" && (
            <>
              <div className="chip text-destructive"><span className="live-dot" /> LIVE</div>
              <button onClick={async () => {
                  if (await confirmDialog({ title: "Termina partita", message: "Terminare la partita?", confirmLabel: "Termina", danger: true }))
                    call({ action: "end" });
                }}
                className="bg-destructive text-white font-black px-5 py-2 rounded-lg text-lg">
                ■ END
              </button>
            </>
          )}
          {m.status === "FINISHED" && (
            <>
              <span className="chip">✓ Finita</span>
              <button onClick={async () => {
                  if (await confirmDialog({ title: "Riapri partita", message: "Riaprire la partita? Tornerà LIVE mantenendo gol, MVP e risultato.", confirmLabel: "Riapri" }))
                    call({ action: "reset" });
                }}
                className="bg-white/10 text-white px-3 py-1 rounded-lg text-sm">
                Riapri
              </button>
            </>
          )}
        </div>

        {/* Pass without result — only when scheduled with both teams */}
        {m.status === "SCHEDULED" && m.homeTeam && m.awayTeam && (
          <div className="border-t border-white/10 pt-3 space-y-2">
            <div className="text-xs uppercase tracking-widest text-white/60 text-center">
              Oppure passa il turno senza risultato
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[m.homeTeam, m.awayTeam].map((t) => (
                <button key={t!.id}
                  onClick={async () => {
                    if (await confirmDialog({ title: "Passaggio turno", message: `Segnare ${t!.name} come vincente senza risultato?`, confirmLabel: "Conferma" }))
                      call({ action: "advance", teamId: t!.id });
                  }}
                  className="rounded-lg px-3 py-2 font-bold text-sm bg-white/5 hover:bg-accent hover:text-brand-bg transition">
                  Passa {t!.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Penalty winner — only when finished AND draw (real 0-0 or scores tied), NOT when scoreUnknown */}
        {m.status === "FINISHED" && !m.scoreUnknown && m.homeScore === m.awayScore && m.homeTeam && m.awayTeam && (
          <div className="border-t border-white/10 pt-3 space-y-2">
            <div className="text-xs uppercase tracking-widest text-white/60 text-center">
              Pareggio — vincitore ai rigori
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[m.homeTeam, m.awayTeam].map((t) => {
                const selected = m.penaltyWinnerId === t!.id;
                return (
                  <button key={t!.id}
                    onClick={() => call({ action: "setPenaltyWinner", teamId: t!.id })}
                    className={`rounded-lg px-3 py-3 font-bold text-sm transition active:scale-95 active:bg-accent active:text-brand-bg ${
                      selected ? "bg-accent text-brand-bg" : "bg-white/5 hover:bg-white/15"
                    }`}>
                    {selected ? "✓ " : ""}{t!.name}
                  </button>
                );
              })}
            </div>
            {m.penaltyWinnerId && (
              <button onClick={() => call({ action: "setPenaltyWinner", teamId: null })}
                className="w-full text-xs text-white/50 hover:text-white">
                Annulla scelta
              </button>
            )}
          </div>
        )}

      </div>

      {/* Goal entry: click a player */}
      {m.status !== "SCHEDULED" && (
        <div className="grid grid-cols-2 gap-3">
          <TeamGoalPanel team={m.homeTeam} onPick={(pid) => m.homeTeam && addGoal(m.homeTeam.id, pid)} />
          <TeamGoalPanel team={m.awayTeam} onPick={(pid) => m.awayTeam && addGoal(m.awayTeam.id, pid)} />
        </div>
      )}

      {/* MVP picker — only when finished */}
      {m.status === "FINISHED" && (m.homeTeam || m.awayTeam) && (
        <div className="card space-y-3">
          <div className="text-xs uppercase tracking-widest text-white/60 text-center">
            ⭐ MVP
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[m.homeTeam, m.awayTeam].map((t) => t && (
              <div key={t.id} className="space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-white/40 truncate">{t.name}</div>
                {t.players.filter((p) => !p.isCoach).map((p) => {
                  const selected = m.mvpId === p.id;
                  return (
                    <button key={p.id}
                      onClick={() => call({ action: "setMvp", playerId: selected ? null : p.id })}
                      className={`w-full text-left rounded px-2 py-2 text-sm transition active:scale-95 active:bg-accent active:text-brand-bg ${
                        selected ? "bg-accent text-brand-bg font-bold" : "bg-white/5 hover:bg-white/15"
                      }`}>
                      {selected ? "⭐ " : ""}{p.name}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          {m.mvpId && (
            <button onClick={() => call({ action: "setMvp", playerId: null })}
              className="w-full text-xs text-white/50 hover:text-white">
              Rimuovi MVP
            </button>
          )}
        </div>
      )}

      {/* Goals list */}
      <div className="card space-y-2">
        <h3 className="text-xs uppercase tracking-widest text-white/50">Gol segnati</h3>
        {m.goals.length === 0 && <div className="text-white/40 text-sm">Nessun gol</div>}
        {m.goals.map((g) => (
          <div key={g.id} className="flex items-center justify-between text-sm bg-white/5 rounded px-3 py-2">
            <span>
              <span className="text-white/60">{g.team.name}</span> · {g.player?.name ?? "Sconosciuto"}
            </span>
            <button onClick={() => delGoal(g.id)} className="text-destructive text-xs">elimina</button>
          </div>
        ))}
      </div>

      {pending && <div className="text-xs text-white/50 text-center">Salvataggio…</div>}
    </div>
  );
}

function TeamGoalPanel({ team, onPick }: { team: Team; onPick: (playerId: string | null) => void }) {
  const [flashId, setFlashId] = useState<string | null>(null);

  if (!team) return <div className="card text-white/40 text-sm">—</div>;
  const players = team.players.filter((p) => !p.isCoach);

  const trigger = (id: string, playerId: string | null) => {
    setFlashId(id);
    onPick(playerId);
    // reset flash dopo l'animazione (viene ricreato al prossimo refresh comunque)
    setTimeout(() => setFlashId(null), 700);
  };

  return (
    <div className="card space-y-2">
      <div className="font-bold text-sm truncate">{team.name}</div>
      <div className="text-[10px] uppercase tracking-widest text-white/40">Tocca per +1 gol</div>
      <div className="grid grid-cols-1 gap-1.5">
        {players.map((p) => {
          const flashing = flashId === p.id;
          return (
            <button key={p.id}
              onClick={() => trigger(p.id, p.id)}
              className={`text-left rounded px-2 py-2 text-sm font-medium transition active:scale-95 ${
                flashing
                  ? "bg-accent text-brand-bg scale-95"
                  : "bg-white/5 hover:bg-accent hover:text-brand-bg"
              }`}>
              {flashing ? "✓" : "⚽"} {p.name}
            </button>
          );
        })}
        <button onClick={() => trigger("__nogoal", null)}
          className={`text-left rounded px-2 py-2 text-xs italic transition active:scale-95 ${
            flashId === "__nogoal"
              ? "bg-accent text-brand-bg"
              : "bg-white/5 hover:bg-white/15 text-white/60"
          }`}>
          {flashId === "__nogoal" ? "✓" : ""} Gol senza marcatore
        </button>
      </div>
    </div>
  );
}
