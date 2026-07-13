import { prisma } from "@/lib/prisma";
import { MatchCard } from "@/components/MatchCard";
import { LiveMatch } from "@/components/LiveMatch";
import { resolveEdition } from "@/lib/edition";
import { EditionBanner } from "@/components/EditionBanner";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const sp = await searchParams;
  const edition = await resolveEdition(sp.year);
  if (!edition) {
    return <div className="card text-white/60">Nessuna edizione trovata. Esegui il seed.</div>;
  }

  const where = { editionId: edition.id };
  // "In corso" = partita LIVE OPPURE partita finita in pareggio con rigori
  // ancora da assegnare (penaltyWinnerId nullo)
  const [live, pendingPenalty, upcoming, recent] = await Promise.all([
    prisma.match.findFirst({
      where: { ...where, status: "LIVE" },
      include: {
        homeTeam: true, awayTeam: true,
        goals: { include: { team: true, player: true }, orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.match.findFirst({
      where: {
        ...where,
        status: "FINISHED",
        scoreUnknown: false,
        penaltyWinnerId: null,
        // Filtro finale su lato JS: draw = homeScore == awayScore.
        // Prisma non ha un modo diretto per confrontare due colonne,
        // ma prendiamo la prima partita FINISHED con penaltyWinnerId nullo
        // e verifichiamo dopo.
      },
      orderBy: { scheduledAt: "desc" },
      include: {
        homeTeam: true, awayTeam: true,
        goals: { include: { team: true, player: true }, orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.match.findMany({
      where: { ...where, status: "SCHEDULED" },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { scheduledAt: "asc" }, take: 3,
    }),
    prisma.match.findMany({
      where: { ...where, status: "FINISHED" },
      include: {
        homeTeam: true, awayTeam: true,
        mvp: { include: { team: true } },
        goals: { include: { player: true }, orderBy: { createdAt: "asc" } },
      },
      orderBy: { scheduledAt: "desc" }, take: 3,
    }),
  ]);

  return (
    <div className="space-y-6">
      <EditionBanner edition={edition} />
      {edition.isCurrent && (
        <>
          <section>
            <h2 className="text-xs uppercase tracking-widest text-white/50 mb-2">In corso</h2>
            {live ? (
              <LiveMatch initialId={live.id} />
            ) : pendingPenalty && pendingPenalty.homeScore === pendingPenalty.awayScore ? (
              <LiveMatch initialId={pendingPenalty.id} mode="penalty" />
            ) : (
              <div className="card text-center text-white/60">Nessuna partita in corso adesso.</div>
            )}
          </section>
          <section>
            <h2 className="text-xs uppercase tracking-widest text-white/50 mb-2">Prossime partite</h2>
            <div className="space-y-4">
              {upcoming.length === 0 && <div className="card text-white/60">Nessuna partita in programma.</div>}
              {upcoming.map((m) => <MatchCard key={m.id} m={JSON.parse(JSON.stringify(m))} href={`/diretta/partite/${m.id}`} />)}
            </div>
          </section>
        </>
      )}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-white/50 mb-2">
          {edition.isCurrent ? "Ultimi risultati" : "Risultati"}
        </h2>
        <div className="space-y-4">
          {recent.length === 0 && <div className="card text-white/60">Ancora nessun risultato.</div>}
          {recent
            .filter((m) => !(pendingPenalty && m.id === pendingPenalty.id && m.homeScore === m.awayScore))
            .map((m) => <MatchCard key={m.id} m={JSON.parse(JSON.stringify(m))} href={`/diretta/partite/${m.id}`} />)}
        </div>
      </section>
    </div>
  );
}
