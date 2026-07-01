import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Storico() {
  const editions = await prisma.edition.findMany({
    orderBy: { year: "desc" },
    include: {
      _count: { select: { teams: true, matches: true } },
      matches: {
        where: { phase: "GRAND_FINAL", status: "FINISHED" },
        include: { homeTeam: true, awayTeam: true },
        take: 1,
      },
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Storico Edizioni</h1>
      {editions.length === 0 && <div className="card text-white/60">Nessuna edizione presente.</div>}
      <div className="space-y-3">
        {editions.map((e) => {
          const finale = e.matches[0];
          const champion = finale
            ? (finale.homeScore > finale.awayScore ? finale.homeTeam :
               finale.awayScore > finale.homeScore ? finale.awayTeam :
               finale.penaltyWinnerId === finale.homeTeamId ? finale.homeTeam :
               finale.penaltyWinnerId === finale.awayTeamId ? finale.awayTeam : null)
            : null;
          return (
            <div key={e.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-black">{e.year}</div>
                  {e.name && <div className="text-xs text-white/50">{e.name}</div>}
                </div>
                {e.isCurrent && <span className="chip text-accent">Edizione attuale</span>}
              </div>
              {champion && (
                <div className="text-sm">
                  🏆 Campione: <span className="font-bold text-accent">{champion.name}</span>
                </div>
              )}
              <div className="text-xs text-white/50">
                {e._count.teams} squadre · {e._count.matches} partite
              </div>
              <div className="flex flex-wrap gap-2 text-xs pt-1">
                {[
                  ...(e.isCurrent ? [{ href: "/", label: "Live" }] : []),
                  { href: e.isCurrent ? "/tabellone" : `/tabellone?year=${e.year}`, label: "Tabellone" },
                  { href: e.isCurrent ? "/squadre" : `/squadre?year=${e.year}`, label: "Squadre" },
                  { href: e.isCurrent ? "/marcatori" : `/marcatori?year=${e.year}`, label: "Marcatori" },
                  { href: e.isCurrent ? "/partite" : `/partite?year=${e.year}`, label: "Partite" },
                ].map((l) => (
                  <Link key={l.href} href={l.href} className="chip hover:bg-accent hover:text-brand-bg">{l.label}</Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
