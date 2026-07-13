import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { resolveEdition } from "@/lib/edition";
import { EditionBanner } from "@/components/EditionBanner";
import { HowItWorks } from "@/components/HowItWorks";
import { fmtTime, fmtDayShort } from "@/lib/format";

export const dynamic = "force-dynamic";

type Match = {
  id: string;
  code: string;
  phase: string;
  status: string;
  scheduledAt: string | Date;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number;
  awayScore: number;
  penaltyWinnerId: string | null;
  scoreUnknown: boolean;
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
    orderBy: [{ phase: "asc" }, { scheduledAt: "asc" }],
  });

  const byPhase = (p: string) => matches.filter((m) => m.phase === p) as unknown as Match[];
  const finale = byPhase("PLAYOFF_FINAL")[0];
  const champion = finale ? winnerTeam(finale) : null;

  return (
    <div className="space-y-6">
      <EditionBanner edition={edition} />
      <h1 className="text-2xl font-black">Tabellone</h1>

      <HowItWorks />

      {champion && <ChampionBanner name={champion.name} />}

      <div className="sticky top-[110px] z-30 grid grid-cols-3 gap-2 text-[11px] font-bold text-center">
        <a href="#paradiso" className="rounded-lg py-2 bg-sky-400/15 text-sky-300 border border-sky-400/30 hover:bg-sky-400/25 active:bg-sky-400/35 transition">PARADISO</a>
        <a href="#inferno" className="rounded-lg py-2 bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 active:bg-red-500/35 transition">INFERNO</a>
        <a href="#playoff" className="rounded-lg py-2 bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 active:bg-accent/35 transition">PLAYOFF</a>
      </div>

      <BracketSection
        id="paradiso"
        title="Paradiso"
        tint="sky"
        rounds={[
          { label: "1° Turno", matches: byPhase("PARADISO_R1") },
          { label: "2° Turno", matches: byPhase("PARADISO_R2") },
        ]}
        note="I vincitori del 2° turno accedono ai Playoff. Chi perde va all'Inferno."
      />

      <BracketSection
        id="inferno"
        title="Inferno"
        tint="red"
        rounds={[
          { label: "1° Turno", matches: byPhase("INFERNO_R1") },
          { label: "2° Turno", matches: byPhase("INFERNO_R2") },
        ]}
        note="Chi perde all'Inferno è eliminato. I vincitori del 2° turno accedono ai Playoff."
      />

      <BracketSection
        id="playoff"
        title="Playoff"
        tint="accent"
        rounds={[
          { label: "Ottavi", matches: byPhase("PLAYOFF_R16") },
          { label: "Quarti", matches: byPhase("PLAYOFF_QF") },
          { label: "Semifinali", matches: byPhase("PLAYOFF_SF") },
          { label: "Finale", matches: finale ? [finale] : [] },
        ]}
        note="16 qualificate: 8 dal Paradiso + 8 dall'Inferno. Accoppiamenti secondo il tabellone ufficiale."
      />
    </div>
  );
}

function ChampionBanner({ name }: { name: string }) {
  return (
    <div className="rounded-2xl border border-accent/60 bg-gradient-to-br from-accent/20 via-accent/5 to-transparent px-4 py-3 text-center">
      <div className="text-[10px] uppercase tracking-widest text-accent">Campione</div>
      <div className="text-2xl font-black mt-1">{name}</div>
    </div>
  );
}

function BracketSection({
  id, title, tint, rounds, note,
}: {
  id?: string; title: string; tint: "sky" | "red" | "accent";
  rounds: { label: string; matches: Match[] }[]; note?: string;
}) {
  const bg = tint === "sky" ? "bg-sky-400/5 border-sky-400/20" :
             tint === "red" ? "bg-red-500/5 border-red-500/20" :
             "bg-accent/5 border-accent/20";
  const label = tint === "sky" ? "text-sky-300" : tint === "red" ? "text-red-300" : "text-accent";
  return (
    <section id={id} className={`rounded-2xl border p-3 scroll-mt-40 ${bg}`}>
      <h2 className={`text-lg font-black uppercase tracking-wider ${label} mb-3`}>{title}</h2>
      <div className="space-y-4">
        {rounds.filter((r) => r.matches.length > 0).map((round, i) => {
          const nextLabel = rounds.filter((r) => r.matches.length > 0)[i + 1]?.label;
          // Divisore SORTEGGIO tra Ottavi e Quarti (solo nella sezione Playoff)
          const showSorteggio =
            round.label === "Ottavi" && nextLabel === "Quarti";
          return (
            <div key={round.label} className="space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/50 mb-1.5">{round.label}</div>
                <div className="grid gap-1.5">
                  {round.matches.map((m) => <BracketMatch key={m.id} m={m} />)}
                </div>
              </div>
              {showSorteggio && (
                <div className="flex items-center gap-2 text-accent">
                  <div className="flex-1 border-t border-accent/40" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em]">🎲 Sorteggio</span>
                  <div className="flex-1 border-t border-accent/40" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {note && <p className="mt-3 text-[10px] text-white/40 leading-relaxed">{note}</p>}
    </section>
  );
}

function formatCode(code: string): string {
  const [prefix, num] = code.split("-");
  const map: Record<string, string> = {
    P1: "P1", P2: "P2", I1: "I1", I2: "I2",
    OTT: "O", QF: "Q", SF: "S", FIN: "F",
  };
  return `${map[prefix] ?? prefix}.${num}`;
}

function slotLabel(phase: string, idx: number, side: "home" | "away"): string {
  const s = side === "home" ? 1 : 2;
  switch (phase) {
    case "PARADISO_R2":
      // home = vincente P1.(idx*2+1), away = vincente P1.(idx*2+2)
      return `Vincente P1.${idx * 2 + s}`;
    case "INFERNO_R1":
      return `Perdente P1.${idx * 2 + s}`;
    case "INFERNO_R2":
      // home = vincente I1.(idx+1), away = perdente P2.(idx^1 + 1)
      return side === "home"
        ? `Vincente I1.${idx + 1}`
        : `Perdente P2.${(idx ^ 1) + 1}`;
    case "PLAYOFF_R16":
      // home = vincente P2.(idx+1), away = vincente I2.(idx^2 + 1)
      return side === "home"
        ? `Vincente P2.${idx + 1}`
        : `Vincente I2.${(idx ^ 2) + 1}`;
    case "PLAYOFF_QF":
      return "Sorteggio";
    case "PLAYOFF_SF":
      return `Vincente Q.${idx * 2 + s}`;
    case "PLAYOFF_FINAL":
      return side === "home" ? "Vincente S.1" : "Vincente S.2";
    default:
      return "Da definire";
  }
}

function BracketMatch({ m }: { m: Match }) {
  const finished = m.status === "FINISHED" || m.status === "LIVE";
  const winner = winnerTeam(m);
  const homeWin = !!winner && winner.id === m.homeTeamId;
  const awayWin = !!winner && winner.id === m.awayTeamId;
  const draw = finished && m.homeScore === m.awayScore;
  const homePk = draw && m.penaltyWinnerId === m.homeTeamId;
  const awayPk = draw && m.penaltyWinnerId === m.awayTeamId;
  const idx = Number((m.code.split("-")[1] ?? "1")) - 1;
  const homePlaceholder = slotLabel(m.phase, idx, "home");
  const awayPlaceholder = slotLabel(m.phase, idx, "away");
  const clickable = !!m.homeTeam && !!m.awayTeam;

  const content = (
    <>
      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1">
        <span>{formatCode(m.code)}</span>
        <span>{fmtDayShort(m.scheduledAt)} · {fmtTime(m.scheduledAt)}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <span className={`truncate ${homeWin ? "font-black text-white" : "text-white/70"}`}>
          {m.homeTeam?.name ?? <span className="italic text-white/40 text-xs">{homePlaceholder}</span>}
          {homePk && <span className="ml-1 text-[9px] font-bold text-accent">dcr</span>}
        </span>
        <span className={`tabular-nums font-bold ${m.status === "LIVE" ? "text-red-400" : "text-white/80"}`}>
          {m.status === "SCHEDULED" ? "vs" : m.scoreUnknown ? "→" : `${m.homeScore}–${m.awayScore}`}
        </span>
        <span className={`truncate text-right ${awayWin ? "font-black text-white" : "text-white/70"}`}>
          {awayPk && <span className="mr-1 text-[9px] font-bold text-accent">dcr</span>}
          {m.awayTeam?.name ?? <span className="italic text-white/40 text-xs">{awayPlaceholder}</span>}
        </span>
      </div>
    </>
  );

  return clickable ? (
    <Link href={`/diretta/partite/${m.id}`}
      className="rounded-lg bg-white/5 hover:bg-white/10 px-3 py-2 text-sm block">
      {content}
    </Link>
  ) : (
    <div className="rounded-lg bg-white/5 px-3 py-2 text-sm">
      {content}
    </div>
  );
}

function winnerTeam(m: Match): { id: string; name: string } | null {
  if (m.status !== "FINISHED" || !m.homeTeam || !m.awayTeam) return null;
  if (m.scoreUnknown || m.homeScore === m.awayScore) {
    if (!m.penaltyWinnerId) return null;
    return m.penaltyWinnerId === m.homeTeamId ? m.homeTeam : m.awayTeam;
  }
  return m.homeScore > m.awayScore ? m.homeTeam : m.awayTeam;
}
