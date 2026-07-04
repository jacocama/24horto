import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function winnerOf(m: { homeScore: number; awayScore: number; penaltyWinnerId: string | null; homeTeamId: string | null; awayTeamId: string | null }): string | null {
  if (!m.homeTeamId || !m.awayTeamId) return null;
  if (m.homeScore === m.awayScore) return m.penaltyWinnerId ?? null;
  return m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId;
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { editionId, target } = await req.json();
  if (!editionId || !target) return NextResponse.json({ error: "editionId and target required" }, { status: 400 });

  const sourcePhases =
    target === "R16" ? ["PARADISO_R2", "INFERNO_R2"] :
    target === "QF" ? ["PLAYOFF_R16"] :
    null;
  if (!sourcePhases) return NextResponse.json({ error: "target must be R16 or QF" }, { status: 400 });

  const targetPhase = target === "R16" ? "PLAYOFF_R16" : "PLAYOFF_QF";

  const sources = await prisma.match.findMany({
    where: { editionId, phase: { in: sourcePhases as any } },
    orderBy: { code: "asc" },
  });

  const notFinished = sources.filter((m) => m.status !== "FINISHED");
  if (notFinished.length) {
    return NextResponse.json({ error: `Ci sono ${notFinished.length} partite del turno precedente non ancora concluse` }, { status: 400 });
  }
  const winners = sources.map(winnerOf).filter((w): w is string => !!w);
  const targetMatches = await prisma.match.findMany({
    where: { editionId, phase: targetPhase as any },
    orderBy: { code: "asc" },
  });
  if (winners.length !== targetMatches.length * 2) {
    return NextResponse.json({ error: `Numero vincitori (${winners.length}) non compatibile con ${targetMatches.length} partite` }, { status: 400 });
  }

  const shuffled = shuffle(winners);
  for (let i = 0; i < targetMatches.length; i++) {
    await prisma.match.update({
      where: { id: targetMatches[i].id },
      data: {
        homeTeamId: shuffled[i * 2],
        awayTeamId: shuffled[i * 2 + 1],
      },
    });
  }

  return NextResponse.json({ ok: true, drawn: targetMatches.length });
}
