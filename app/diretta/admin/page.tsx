import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { fmtTime, fmtDate, phaseLabel } from "@/lib/format";
import { resolveEdition } from "@/lib/edition";
import { DrawPanel } from "./DrawPanel";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdmin();
  const edition = await resolveEdition();
  const matches = edition ? await prisma.match.findMany({
    where: { editionId: edition.id },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { scheduledAt: "asc" },
  }) : [];

  // Draw readiness checks
  const p2Done = matches.filter((m) => m.phase === "PARADISO_R2").every((m) => m.status === "FINISHED");
  const i2Done = matches.filter((m) => m.phase === "INFERNO_R2").every((m) => m.status === "FINISHED");
  const r16Done = matches.filter((m) => m.phase === "PLAYOFF_R16").every((m) => m.status === "FINISHED");
  const r16Assigned = matches.some((m) => m.phase === "PLAYOFF_R16" && m.homeTeamId);
  const qfAssigned = matches.some((m) => m.phase === "PLAYOFF_QF" && m.homeTeamId);
  const hasR16 = matches.some((m) => m.phase === "PLAYOFF_R16");
  const hasQF = matches.some((m) => m.phase === "PLAYOFF_QF");

  const canDrawR16 = hasR16 && p2Done && i2Done;
  const canDrawQF = hasQF && r16Done;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Admin · Partite</h1>
      <p className="text-sm text-white/60">
        Edizione <span className="text-accent font-bold">{edition?.year ?? "—"}</span>. Clicca una partita per gestirla.
      </p>

      {edition && (canDrawR16 || canDrawQF || r16Assigned || qfAssigned) && (
        <DrawPanel
          editionId={edition.id}
          canDrawR16={canDrawR16}
          canDrawQF={canDrawQF}
          r16Assigned={r16Assigned}
          qfAssigned={qfAssigned}
        />
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
