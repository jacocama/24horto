import { prisma } from "@/lib/prisma";
import { MatchCard } from "@/components/MatchCard";
import { fmtDate } from "@/lib/format";
import { resolveEdition } from "@/lib/edition";
import { EditionBanner } from "@/components/EditionBanner";

export const dynamic = "force-dynamic";

export default async function Partite({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const sp = await searchParams;
  const edition = await resolveEdition(sp.year);
  if (!edition) return <div className="card text-white/60">Nessuna edizione.</div>;

  const matches = await prisma.match.findMany({
    where: { editionId: edition.id },
    include: {
      homeTeam: true, awayTeam: true,
      mvp: { include: { team: true } },
      goals: { include: { player: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  const byDay = new Map<string, typeof matches>();
  for (const m of matches) {
    const k = fmtDate(m.scheduledAt);
    if (!byDay.has(k)) byDay.set(k, [] as any);
    byDay.get(k)!.push(m);
  }

  return (
    <div className="space-y-6">
      <EditionBanner edition={edition} />
      <h1 className="text-2xl font-black">Calendario</h1>
      {[...byDay.entries()].map(([day, list]) => (
        <section key={day}>
          <h2 className="text-xs uppercase tracking-widest text-white/50 mb-2">{day}</h2>
          <div className="space-y-4">
            {list.map((m) => <MatchCard key={m.id} m={JSON.parse(JSON.stringify(m))} href={`/diretta/partite/${m.id}`} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
