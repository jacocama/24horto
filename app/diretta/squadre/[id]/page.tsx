import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MatchCard } from "@/components/MatchCard";

export const dynamic = "force-dynamic";

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      players: { orderBy: [{ isCoach: "asc" }, { name: "asc" }] },
      homeMatches: {
        include: {
          homeTeam: true, awayTeam: true,
          mvp: { include: { team: true } },
          goals: { include: { player: true }, orderBy: { createdAt: "asc" } },
        },
        orderBy: { scheduledAt: "asc" },
      },
      awayMatches: {
        include: {
          homeTeam: true, awayTeam: true,
          mvp: { include: { team: true } },
          goals: { include: { player: true }, orderBy: { createdAt: "asc" } },
        },
        orderBy: { scheduledAt: "asc" },
      },
    },
  });
  if (!team) notFound();

  const matches = [...team.homeMatches, ...team.awayMatches].sort(
    (a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt)
  );

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-white/40">Seed #{team.seed}</div>
        <h1 className="text-2xl font-black">{team.name}</h1>
      </div>
      <div className="card">
        <h2 className="text-xs uppercase tracking-widest text-white/50 mb-3">Rosa</h2>
        <ul className="divide-y divide-white/5">
          {team.players.map((p) => (
            <li key={p.id} className="py-2 flex justify-between">
              <span>{p.name}</span>
              {p.isCoach && <span className="chip text-accent">Allenatore</span>}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-xs uppercase tracking-widest text-white/50 mb-2">Partite</h2>
        <div className="space-y-4">
          {matches.length === 0 && <div className="card text-white/60">Nessuna partita.</div>}
          {matches.map((m) => (
            <MatchCard key={m.id} m={JSON.parse(JSON.stringify(m))} href={`/diretta/partite/${m.id}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
