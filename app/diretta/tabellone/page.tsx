import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { resolveEdition } from "@/lib/edition";
import { EditionBanner } from "@/components/EditionBanner";

export const dynamic = "force-dynamic";

type Match = {
  id: string;
  code: string;
  phase: string;
  status: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number;
  awayScore: number;
  penaltyWinnerId: string | null;
  homeTeam: { id: string; name: string } | null;
  awayTeam: { id: string; name: string } | null;
};

export default async function Tabellone({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const sp = await searchParams;
  const edition = await resolveEdition(sp.year);
  if (!edition) return <div className="card text-white/60">Nessuna edizione.</div>;

  const matches = await prisma.match.findMany({
    where: { editionId: edition.id },
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ phase: "asc" }, { code: "asc" }],
  });

  const byPhase = (p: string) => matches.filter((m) => m.phase === p) as unknown as Match[];
  const finale = byPhase("PLAYOFF_FINAL")[0];
  const champion = finale ? winnerTeam(finale) : null;

  return (
    <div className="space-y-6">
      <EditionBanner edition={edition} />
      <h1 className="text-2xl font-black">Tabellone</h1>

      {finale && <FinalBanner finale={finale} champion={champion} />}

      <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-center">
        <div className="rounded-lg py-1 bg-sky-400/15 text-sky-300 border border-sky-400/30">😇 PARADISO</div>
        <div className="rounded-lg py-1 bg-red-500/15 text-red-300 border border-red-500/30">😈 INFERNO</div>
        <div className="rounded-lg py-1 bg-accent/15 text-accent border border-accent/30">🏆 PLAYOFF</div>
      </div>

      <BracketSection
        title="Paradiso"
        emoji="😇"
        tint="sky"
        rounds={[
          { label: "1° Turno", matches: byPhase("PARADISO_R1") },
          { label: "2° Turno", matches: byPhase("PARADISO_R2") },
        ]}
        note="I vincitori del 2° turno accedono ai Playoff (ottavi). Chi perde va all'Inferno."
      />

      <BracketSection
        title="Inferno"
        emoji="😈"
        tint="red"
        rounds={[
          { label: "1° Turno", matches: byPhase("INFERNO_R1") },
          { label: "2° Turno", matches: byPhase("INFERNO_R2") },
        ]}
        note="Chi perde all'Inferno è eliminato. I vincitori del 2° turno accedono ai Playoff."
      />

      <BracketSection
        title="Playoff"
        emoji="🏆"
        tint="accent"
        rounds={[
          { label: "Ottavi (sorteggio)", matches: byPhase("PLAYOFF_R16") },
          { label: "Quarti (sorteggio)", matches: byPhase("PLAYOFF_QF") },
          { label: "Semifinali", matches: byPhase("PLAYOFF_SF") },
        ]}
        note="16 qualificate: 8 dal Paradiso + 8 dall'Inferno. Ottavi e quarti sorteggiati; semifinali e finale a tabellone."
      />
    </div>
  );
}

function FinalBanner({ finale, champion }: { finale: Match; champion: { id: string; name: string } | null }) {
  return (
    <Link href={`/diretta/partite/${finale.id}`} className="block card border-accent/60 bg-gradient-to-br from-accent/20 via-accent/5 to-transparent">
      <div className="text-[10px] uppercase tracking-widest text-accent">🏆 Finalissima</div>
      <div className="text-lg font-extrabold mt-1 flex items-center justify-between gap-3">
        <span className="truncate">{finale.homeTeam?.name ?? "Da definire"}</span>
        <span className="text-xl">vs</span>
        <span className="truncate text-right">{finale.awayTeam?.name ?? "Da definire"}</span>
      </div>
      {finale.status === "FINISHED" && champion ? (
        <div className="mt-2 text-sm">
          <span className="text-white/60">Vincente: </span>
          <span className="font-black text-accent">🏆 {champion.name}</span>
        </div>
      ) : (
        <div className="mt-1 text-xs text-white/50">
          {finale.status === "LIVE" ? `🔴 LIVE · ${finale.homeScore} - ${finale.awayScore}` : "Da giocare"}
        </div>
      )}
    </Link>
  );
}

function BracketSection({
  title, emoji, tint, rounds, note,
}: {
  title: string; emoji: string; tint: "sky" | "red" | "accent";
  rounds: { label: string; matches: Match[] }[]; note?: string;
}) {
  const bg = tint === "sky" ? "bg-sky-400/5 border-sky-400/20" :
             tint === "red" ? "bg-red-500/5 border-red-500/20" :
             "bg-accent/5 border-accent/20";
  const label = tint === "sky" ? "text-sky-300" : tint === "red" ? "text-red-300" : "text-accent";
  return (
    <section className={`rounded-2xl border p-3 ${bg}`}>
      <h2 className={`text-lg font-black uppercase tracking-wider ${label} mb-3`}>
        {emoji} {title}
      </h2>
      <div className="space-y-4">
        {rounds.filter((r) => r.matches.length > 0).map((round) => (
          <div key={round.label}>
            <div className="text-[10px] uppercase tracking-widest text-white/50 mb-1.5">{round.label}</div>
            <div className="grid gap-1.5">
              {round.matches.map((m) => <BracketMatch key={m.id} m={m} />)}
            </div>
          </div>
        ))}
      </div>
      {note && <p className="mt-3 text-[10px] text-white/40 leading-relaxed">{note}</p>}
    </section>
  );
}

function BracketMatch({ m }: { m: Match }) {
  const finished = m.status === "FINISHED" || m.status === "LIVE";
  const winner = winnerTeam(m);
  const homeWin = !!winner && winner.id === m.homeTeamId;
  const awayWin = !!winner && winner.id === m.awayTeamId;
  const draw = finished && m.homeScore === m.awayScore;
  const homePk = draw && m.penaltyWinnerId === m.homeTeamId;
  const awayPk = draw && m.penaltyWinnerId === m.awayTeamId;
  return (
    <Link href={`/diretta/partite/${m.id}`}
      className="rounded-lg bg-white/5 hover:bg-white/10 px-3 py-2 text-sm block">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <span className={`truncate ${homeWin ? "font-black text-white" : "text-white/70"}`}>
          {m.homeTeam?.name ?? <span className="italic text-white/40">Da definire</span>}
          {homePk && <span className="ml-1 text-[9px] font-bold text-accent">dcr</span>}
        </span>
        <span className={`tabular-nums font-bold ${m.status === "LIVE" ? "text-red-400" : "text-white/80"}`}>
          {m.status === "SCHEDULED" ? "vs" : `${m.homeScore}–${m.awayScore}`}
        </span>
        <span className={`truncate text-right ${awayWin ? "font-black text-white" : "text-white/70"}`}>
          {awayPk && <span className="mr-1 text-[9px] font-bold text-accent">dcr</span>}
          {m.awayTeam?.name ?? <span className="italic text-white/40">Da definire</span>}
        </span>
      </div>
    </Link>
  );
}

function winnerTeam(m: Match): { id: string; name: string } | null {
  if (m.status !== "FINISHED" || !m.homeTeam || !m.awayTeam) return null;
  if (m.homeScore === m.awayScore) {
    if (!m.penaltyWinnerId) return null;
    return m.penaltyWinnerId === m.homeTeamId ? m.homeTeam : m.awayTeam;
  }
  return m.homeScore > m.awayScore ? m.homeTeam : m.awayTeam;
}
