import Link from "next/link";
import { fmtTime, fmtDate, phaseLabel } from "@/lib/format";

type Team = { id: string; name: string } | null;
type GoalLite = { id: string; teamId: string; player: { name: string } | null };
type MvpLite = { id: string; name: string; team: { id: string; name: string } } | null;
export type MatchLike = {
  id: string;
  code: string;
  phase: string;
  status: string;
  scheduledAt: string | Date;
  homeTeam: Team;
  awayTeam: Team;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  homeScore: number;
  awayScore: number;
  penaltyWinnerId?: string | null;
  scoreUnknown?: boolean;
  goals?: GoalLite[];
  mvp?: MvpLite;
};

function TeamRow({ team, score, winner, showScore, pkBadge, passBadge, scorers }: { team: Team; score: number; winner: boolean; showScore: boolean; pkBadge?: boolean; passBadge?: boolean; scorers?: GoalLite[] }) {
  return (
    <div className={`flex items-start justify-between gap-3 py-2 ${winner ? "text-white" : "text-white/80"}`}>
      <div className="flex items-start gap-2 min-w-0 flex-1">
        <div className="w-6 h-6 rounded-full bg-white/10 grid place-items-center text-[10px] font-black shrink-0 mt-0.5">
          {team?.name?.match(/\d+/)?.[0] ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`truncate ${winner ? "font-extrabold" : "font-semibold"}`}>
              {team?.name ?? "—"}
            </span>
            {pkBadge && (
              <span className="text-[9px] font-bold uppercase tracking-wider bg-accent text-brand-bg px-1.5 py-0.5 rounded">
                dcr
              </span>
            )}
          </div>
          {scorers && scorers.length > 0 && (
            <div className="mt-1 space-y-0.5 text-xs text-white/60">
              {scorers.map((g) => (
                <div key={g.id} className="truncate">⚽ {g.player?.name ?? "Gol"}</div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showScore && (
        <span className={`tabular-nums text-2xl font-black w-8 text-right ${winner ? "text-accent" : ""}`}>
          {score}
        </span>
      )}
      {passBadge && (
        <span className="text-[10px] font-black uppercase tracking-wider text-accent">Passa</span>
      )}
    </div>
  );
}

export function MatchCard({ m, href }: { m: MatchLike; href?: string }) {
  const isLive = m.status === "LIVE";
  const isFinished = m.status === "FINISHED";
  const hasScore = (isLive || isFinished) && !m.scoreUnknown;
  const declared = isFinished && m.scoreUnknown && !!m.penaltyWinnerId;
  const draw = (isLive || isFinished) && !m.scoreUnknown && m.homeScore === m.awayScore;
  const homeWin = (hasScore && (m.homeScore > m.awayScore || (draw && m.penaltyWinnerId === m.homeTeam?.id)))
    || (declared && m.penaltyWinnerId === m.homeTeam?.id);
  const awayWin = (hasScore && (m.awayScore > m.homeScore || (draw && m.penaltyWinnerId === m.awayTeam?.id)))
    || (declared && m.penaltyWinnerId === m.awayTeam?.id);
  const homePk = !!(draw && m.penaltyWinnerId && m.penaltyWinnerId === m.homeTeam?.id);
  const awayPk = !!(draw && m.penaltyWinnerId && m.penaltyWinnerId === m.awayTeam?.id);

  const content = (
    <div className={`card ${isLive ? "border-live/50" : ""}`}>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-white/50 mb-1">
        <span className="truncate">{phaseLabel[m.phase] ?? m.phase}</span>
        {isLive ? (
          <span className="chip text-live"><span className="live-dot" /> LIVE</span>
        ) : isFinished ? (
          <span className="chip text-white/70">{declared ? "Passa il turno" : "Finita"}</span>
        ) : (
          <span className="text-white/60">{fmtDate(m.scheduledAt)} · {fmtTime(m.scheduledAt)}</span>
        )}
      </div>
      <div className="divide-y divide-white/5">
        <TeamRow team={m.homeTeam} score={m.homeScore} winner={homeWin} showScore={hasScore} pkBadge={homePk} passBadge={declared && homeWin}
          scorers={isFinished ? m.goals?.filter((g) => g.teamId === m.homeTeamId) : undefined} />
        <TeamRow team={m.awayTeam} score={m.awayScore} winner={awayWin} showScore={hasScore} pkBadge={awayPk} passBadge={declared && awayWin}
          scorers={isFinished ? m.goals?.filter((g) => g.teamId === m.awayTeamId) : undefined} />
      </div>
      {!hasScore && (
        <div className="mt-1 text-[10px] text-white/40 text-right">{m.code}</div>
      )}
      {isFinished && m.mvp && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-center gap-2 text-sm">
          <span className="text-accent font-black">⭐ MVP</span>
          <span className="font-bold truncate">{m.mvp.name}</span>
          <span className="text-white/50 text-xs truncate">· {m.mvp.team.name}</span>
        </div>
      )}
    </div>
  );
  return href ? <Link href={href} className="block">{content}</Link> : content;
}
