import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { resolveEdition } from "@/lib/edition";
import { EditionBanner } from "@/components/EditionBanner";

export const dynamic = "force-dynamic";

export default async function Marcatori({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const sp = await searchParams;
  const edition = await resolveEdition(sp.year);
  if (!edition) return <div className="card text-white/60">Nessuna edizione.</div>;

  const grouped = await prisma.goal.groupBy({
    by: ["playerId"],
    where: {
      playerId: { not: null },
      match: { status: "FINISHED", editionId: edition.id },
    },
    _count: { playerId: true },
  });

  const playerIds = grouped.map((g) => g.playerId!).filter(Boolean);
  const players = playerIds.length
    ? await prisma.player.findMany({
        where: { id: { in: playerIds } },
        include: { team: true },
      })
    : [];
  const byId = new Map(players.map((p) => [p.id, p]));

  const ranking = grouped
    .map((g) => ({ player: byId.get(g.playerId!), goals: g._count.playerId }))
    .filter((r) => r.player && r.goals > 0)
    .sort((a, b) => b.goals - a.goals || a.player!.name.localeCompare(b.player!.name));

  return (
    <div className="space-y-4">
      <EditionBanner edition={edition} />
      <h1 className="text-2xl font-black">Classifica marcatori</h1>
      <p className="text-xs text-white/50">Solo partite concluse · Edizione {edition.year}.</p>
      {ranking.length === 0 ? (
        <div className="card text-white/60">Ancora nessun gol registrato.</div>
      ) : (
        <div className="card divide-y divide-white/10 p-0 overflow-hidden">
          {ranking.map((r, i) => (
            <Link key={r.player!.id} href={`/diretta/squadre/${r.player!.teamId}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/5">
              <div className="w-7 text-center font-black tabular-nums text-white/60">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{r.player!.name}</div>
                <div className="text-xs text-white/50 truncate">{r.player!.team.name}</div>
              </div>
              <div className="text-2xl font-black text-accent tabular-nums">{r.goals}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
