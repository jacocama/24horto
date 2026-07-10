import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { fmtTime, fmtDate, phaseLabel } from "@/lib/format";
import { resolveEdition } from "@/lib/edition";
import { QfPairingPanel } from "./QfPairingPanel";
import { R1DrawPanel } from "./R1DrawPanel";

export const dynamic = "force-dynamic";

function winnerOfMatch(m: {
  homeScore: number; awayScore: number; scoreUnknown: boolean;
  penaltyWinnerId: string | null; homeTeamId: string | null; awayTeamId: string | null;
}): string | null {
  if (!m.homeTeamId || !m.awayTeamId) return null;
  if (m.scoreUnknown || m.homeScore === m.awayScore) return m.penaltyWinnerId;
  return m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId;
}

export default async function AdminHome() {
  await requireAdmin();
  const edition = await resolveEdition();
  const matches = edition ? await prisma.match.findMany({
    where: { editionId: edition.id },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { scheduledAt: "asc" },
  }) : [];

  // R1 draw panel: available at the start (when P.R1 has matches)
  const p1 = matches.filter((m) => m.phase === "PARADISO_R1");
  const p1AllScheduled = p1.every((m) => m.status === "SCHEDULED");
  const showR1Draw = p1.length === 16 && p1AllScheduled;
  const r1Teams = edition
    ? await prisma.team.findMany({ where: { editionId: edition.id }, orderBy: { name: "asc" }, select: { id: true, name: true } })
    : [];
  const r1InitialPairs = p1.map((m) => ({ home: m.homeTeamId ?? "", away: m.awayTeamId ?? "" }));

  // QF pairing panel: available when all R16 are FINISHED
  const r16 = matches.filter((m) => m.phase === "PLAYOFF_R16");
  const qf = matches.filter((m) => m.phase === "PLAYOFF_QF");
  const r16AllDone = r16.length > 0 && r16.every((m) => m.status === "FINISHED");
  const r16WinnerIds = r16.map(winnerOfMatch).filter((x): x is string => !!x);
  const r16WinnerTeams = r16
    .map((m) => {
      const wId = winnerOfMatch(m);
      if (!wId) return null;
      const t = wId === m.homeTeamId ? m.homeTeam : m.awayTeam;
      return t ? { id: t.id, name: t.name } : null;
    })
    .filter((x): x is { id: string; name: string } => !!x);
  const qfAssigned = qf.some((m) => m.homeTeamId);
  const showQfPairing = r16AllDone && r16WinnerIds.length === 8 && qf.length === 4;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Admin · Partite</h1>
      <p className="text-sm text-white/60">
        Edizione <span className="text-accent font-bold">{edition?.year ?? "—"}</span>. Clicca una partita per gestirla.
      </p>

      {edition && showR1Draw && (
        <R1DrawPanel editionId={edition.id} teams={r1Teams} initialPairs={r1InitialPairs} />
      )}

      {edition && showQfPairing && (
        <QfPairingPanel editionId={edition.id} winners={r16WinnerTeams} alreadyAssigned={qfAssigned} />
      )}

      <div className="space-y-2">
        {matches.map((m) => (
          <Link key={m.id} href={`/diretta/admin/match/${m.id}`}
            className="block card hover:border-accent/50">
            <div className="flex justify-between text-[11px] uppercase tracking-wider text-white/50 mb-1">
              <span>{phaseLabel[m.phase] ?? m.phase} · {m.code}</span>
              <span>
                {m.status === "LIVE" ? "🔴 LIVE" :
                  m.status === "FINISHED" ? "✓ Finita" :
                  `${fmtDate(m.scheduledAt)} ${fmtTime(m.scheduledAt)}`}
              </span>
            </div>
            <div className="divide-y divide-white/5">
              <div className="flex items-center justify-between py-1.5">
                <span className="truncate font-semibold">{m.homeTeam?.name ?? "—"}</span>
                {m.status !== "SCHEDULED" && (
                  <span className="font-black tabular-nums shrink-0 ml-2">{m.homeScore}</span>
                )}
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="truncate font-semibold">{m.awayTeam?.name ?? "—"}</span>
                {m.status !== "SCHEDULED" && (
                  <span className="font-black tabular-nums shrink-0 ml-2">{m.awayScore}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
