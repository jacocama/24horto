import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { fmtTime, fmtDate, phaseLabel } from "@/lib/format";
import { resolveEdition } from "@/lib/edition";
import { QfPairingPanel } from "./QfPairingPanel";

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
            <div className="flex items-center justify-between">
              <span className="truncate">{m.homeTeam?.name ?? "—"}</span>
              <span className="font-bold tabular-nums">
                {m.status === "SCHEDULED" ? "vs" : `${m.homeScore}-${m.awayScore}`}
              </span>
              <span className="truncate text-right">{m.awayTeam?.name ?? "—"}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
