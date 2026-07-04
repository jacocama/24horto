import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

// Body: { editionId: string, pairs: [{ home: teamId, away: teamId }, ... 4 pairs] }
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { editionId, pairs } = await req.json();
  if (!editionId || !Array.isArray(pairs) || pairs.length !== 4) {
    return NextResponse.json({ error: "editionId e 4 coppie richiesti" }, { status: 400 });
  }

  // Validate: all 8 teams distinct, all real strings
  const ids = pairs.flatMap((p: any) => [p?.home, p?.away]);
  if (ids.some((x) => !x)) return NextResponse.json({ error: "Ogni coppia deve avere home e away" }, { status: 400 });
  if (new Set(ids).size !== 8) return NextResponse.json({ error: "Le 8 squadre devono essere tutte diverse" }, { status: 400 });

  // Validate: all 8 teams are winners of R16 matches in this edition
  const r16 = await prisma.match.findMany({
    where: { editionId, phase: "PLAYOFF_R16", status: "FINISHED" },
    orderBy: { code: "asc" },
  });
  if (r16.length !== 8) {
    return NextResponse.json({ error: "Non tutti gli ottavi sono conclusi" }, { status: 400 });
  }
  const winners = new Set<string>();
  for (const m of r16) {
    if (!m.homeTeamId || !m.awayTeamId) continue;
    if (m.scoreUnknown || m.homeScore === m.awayScore) {
      if (m.penaltyWinnerId) winners.add(m.penaltyWinnerId);
    } else {
      winners.add(m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId);
    }
  }
  for (const id of ids) {
    if (!winners.has(id)) {
      return NextResponse.json({ error: "Squadra non tra i vincitori degli ottavi" }, { status: 400 });
    }
  }

  const qfMatches = await prisma.match.findMany({
    where: { editionId, phase: "PLAYOFF_QF" },
    orderBy: { code: "asc" },
  });
  if (qfMatches.length !== 4) {
    return NextResponse.json({ error: `Aspetto 4 partite di quarti, trovate ${qfMatches.length}` }, { status: 400 });
  }

  for (let i = 0; i < 4; i++) {
    await prisma.match.update({
      where: { id: qfMatches[i].id },
      data: { homeTeamId: pairs[i].home, awayTeamId: pairs[i].away },
    });
  }

  return NextResponse.json({ ok: true });
}
