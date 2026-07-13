import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

// Body: { editionId: string, pairs: [{ home: teamId, away: teamId }, ... 16 pairs] }
// Salva/aggiorna gli accoppiamenti del Paradiso R1 in modo incrementale:
// - Se pair[i].home o pair[i].away è vuoto -> lascia il match vuoto
// - Se non partita iniziata -> aggiorna
// - Blocca se qualche match del R1 è già stato startato/finito
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { editionId, pairs } = await req.json();
  if (!editionId || !Array.isArray(pairs) || pairs.length !== 16) {
    return NextResponse.json({ error: "editionId e 16 coppie richiesti" }, { status: 400 });
  }

  const teams = await prisma.team.findMany({ where: { editionId } });
  const teamIds = new Set(teams.map((t) => t.id));

  const filled = pairs
    .flatMap((p: any) => [p?.home, p?.away])
    .filter((x): x is string => !!x);

  for (const id of filled) {
    if (!teamIds.has(id)) return NextResponse.json({ error: `Squadra non valida: ${id}` }, { status: 400 });
  }
  if (new Set(filled).size !== filled.length) {
    return NextResponse.json({ error: "Una squadra è stata assegnata a più di una partita" }, { status: 400 });
  }

  const p1 = await prisma.match.findMany({
    where: { editionId, phase: "PARADISO_R1" },
    orderBy: { scheduledAt: "asc" },
  });
  if (p1.length !== 16) {
    return NextResponse.json({ error: `Aspetto 16 partite di P.R1, trovate ${p1.length}` }, { status: 400 });
  }
  const started = p1.some((m) => m.status !== "SCHEDULED");
  if (started) {
    return NextResponse.json({ error: "Alcune partite del primo turno sono già iniziate o concluse" }, { status: 400 });
  }

  for (let i = 0; i < 16; i++) {
    await prisma.match.update({
      where: { id: p1[i].id },
      data: {
        homeTeamId: pairs[i]?.home || null,
        awayTeamId: pairs[i]?.away || null,
      },
    });
  }
  return NextResponse.json({ ok: true });
}

// Cancella tutti gli abbinamenti del Paradiso R1 (per rifare da capo)
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { editionId } = await req.json();
  if (!editionId) return NextResponse.json({ error: "editionId required" }, { status: 400 });
  await prisma.match.updateMany({
    where: { editionId, phase: "PARADISO_R1", status: "SCHEDULED" },
    data: { homeTeamId: null, awayTeamId: null },
  });
  return NextResponse.json({ ok: true });
}
