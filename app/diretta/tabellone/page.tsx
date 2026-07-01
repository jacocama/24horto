import { prisma } from "@/lib/prisma";
import { phaseLabel } from "@/lib/format";
import Link from "next/link";
import { resolveEdition } from "@/lib/edition";
import { EditionBanner } from "@/components/EditionBanner";

export const dynamic = "force-dynamic";

const UPPER = ["UPPER_R1", "UPPER_R2", "UPPER_R3", "UPPER_R4", "UPPER_FINAL"];
const LOWER = ["LOWER_R1", "LOWER_R2", "LOWER_R3", "LOWER_FINAL"];

export default async function Tabellone({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const sp = await searchParams;
  const edition = await resolveEdition(sp.year);
  if (!edition) return <div className="card text-white/60">Nessuna edizione.</div>;

  const matches = await prisma.match.findMany({
    where: { editionId: edition.id },
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ phase: "asc" }, { code: "asc" }],
  });
  const byPhase = (phases: string[]) =>
    phases.map((p) => ({ phase: p, list: matches.filter((m) => m.phase === p) }));
  const grand = matches.find((m) => m.phase === "GRAND_FINAL");

  return (
    <div className="space-y-8">
      <EditionBanner edition={edition} />
      <h1 className="text-2xl font-black">Tabellone</h1>
      {grand && (
        <Link href={`/diretta/partite/${grand.id}`} className="block card border-accent/60 bg-gradient-to-br from-brand-card to-brand-bg">
          <div className="text-[10px] uppercase tracking-widest text-accent">Finalissima</div>
          <div className="text-lg font-extrabold mt-1">
            {grand.homeTeam?.name ?? "Vincente Sopra"} vs {grand.awayTeam?.name ?? "Vincente Sotto"}
          </div>
          <div className="text-xs text-white/50 mt-1">
            {grand.status === "FINISHED" || grand.status === "LIVE"
              ? `${grand.homeScore} - ${grand.awayScore}` : "Da giocare"}
          </div>
        </Link>
      )}
      <Section title="Tabellone Sopra" data={byPhase(UPPER)} />
      <Section title="Tabellone Sotto" data={byPhase(LOWER)} />
    </div>
  );
}

function Section({ title, data }: { title: string; data: { phase: string; list: any[] }[] }) {
  return (
    <section>
      <h2 className="text-sm font-bold uppercase tracking-widest text-white/70 mb-3">{title}</h2>
      <div className="space-y-4">
        {data.map(({ phase, list }) => (
          <div key={phase}>
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
              {phaseLabel[phase] ?? phase}
            </div>
            <div className="grid gap-2">
              {list.map((m) => {
                const draw = m.homeScore === m.awayScore && m.status !== "SCHEDULED";
                const homePk = draw && m.penaltyWinnerId === m.homeTeamId;
                const awayPk = draw && m.penaltyWinnerId === m.awayTeamId;
                return (
                  <Link key={m.id} href={`/diretta/partite/${m.id}`}
                    className="rounded-lg bg-white/5 hover:bg-white/10 px-3 py-2 text-sm flex items-center justify-between">
                    <span className="truncate">
                      {m.homeTeam?.name ?? "—"}
                      {homePk && <span className="ml-1 text-[9px] font-bold text-accent">(dcr)</span>}
                    </span>
                    <span className="mx-2 font-bold tabular-nums">
                      {m.status === "SCHEDULED" ? "vs" : `${m.homeScore}-${m.awayScore}`}
                    </span>
                    <span className="truncate text-right">
                      {awayPk && <span className="mr-1 text-[9px] font-bold text-accent">(dcr)</span>}
                      {m.awayTeam?.name ?? "—"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
