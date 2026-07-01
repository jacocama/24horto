import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { fmtTime, fmtDate, phaseLabel } from "@/lib/format";
import { resolveEdition } from "@/lib/edition";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdmin();
  const edition = await resolveEdition();
  const matches = edition ? await prisma.match.findMany({
    where: { editionId: edition.id },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { scheduledAt: "asc" },
  }) : [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Admin · Partite</h1>
      <p className="text-sm text-white/60">
        Edizione <span className="text-accent font-bold">{edition?.year ?? "—"}</span>. Clicca una partita per gestirla.
      </p>
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
