import { prisma } from "@/lib/prisma";
import { MatchCard } from "@/components/MatchCard";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: true,
      awayTeam: true,
      mvp: { include: { team: true } },
      goals: { include: { team: true, player: true }, orderBy: { minute: "asc" } },
    },
  });
  if (!m) notFound();

  const home = m.goals.filter((g) => g.teamId === m.homeTeamId);
  const away = m.goals.filter((g) => g.teamId === m.awayTeamId);

  const isFinished = m.status === "FINISHED";
  const draw = isFinished && !m.scoreUnknown && m.homeScore === m.awayScore;
  const pkWinner = draw && m.penaltyWinnerId
    ? (m.penaltyWinnerId === m.homeTeamId ? m.homeTeam : m.awayTeam)
    : null;
  const passWinner = isFinished && m.scoreUnknown && m.penaltyWinnerId
    ? (m.penaltyWinnerId === m.homeTeamId ? m.homeTeam : m.awayTeam)
    : null;

  return (
    <div className="space-y-5">
      <MatchCard m={JSON.parse(JSON.stringify(m))} />
      {pkWinner && (
        <div className="card text-center text-sm">
          <span className="text-white/60">Vinto ai rigori da </span>
          <span className="font-bold text-accent">{pkWinner.name}</span>
        </div>
      )}
      {passWinner && (
        <div className="card text-center text-sm">
          <span className="text-white/60">Passa il turno </span>
          <span className="font-bold text-accent">{passWinner.name}</span>
        </div>
      )}
      {m.mvp && (
        <div className="card border-accent/40 text-center space-y-1">
          <div className="text-2xl font-black tracking-wider text-accent">⭐ MVP</div>
          <div className="font-extrabold text-lg">{m.mvp.name}</div>
          <div className="text-xs text-white/60">{m.mvp.team.name}</div>
        </div>
      )}
      {(home.length + away.length > 0) && (
        <div className="card space-y-3">
          <h3 className="text-xs uppercase tracking-widest text-white/50">Marcatori</h3>
          <div>
            <div className="text-[11px] uppercase text-white/40 mb-1">{m.homeTeam?.name}</div>
            <div className="space-y-0.5 text-sm">
              {home.length === 0 && <div className="text-white/30 text-xs">—</div>}
              {home.map((g) => <div key={g.id}>⚽ {g.player?.name ?? "Gol"}</div>)}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase text-white/40 mb-1">{m.awayTeam?.name}</div>
            <div className="space-y-0.5 text-sm">
              {away.length === 0 && <div className="text-white/30 text-xs">—</div>}
              {away.map((g) => <div key={g.id}>⚽ {g.player?.name ?? "Gol"}</div>)}
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-2 text-sm">
        {m.homeTeam && <Link href={`/diretta/squadre/${m.homeTeam.id}`} className="chip hover:bg-white/20 active:bg-accent active:text-brand-bg active:scale-95 transition">Rosa {m.homeTeam.name}</Link>}
        {m.awayTeam && <Link href={`/diretta/squadre/${m.awayTeam.id}`} className="chip hover:bg-white/20 active:bg-accent active:text-brand-bg active:scale-95 transition">Rosa {m.awayTeam.name}</Link>}
      </div>
    </div>
  );
}
