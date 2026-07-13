import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; goalId: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id, goalId } = await params;
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) return NextResponse.json({ error: "not found" }, { status: 404 });
  await prisma.goal.delete({ where: { id: goalId } });

  // Ricalcola il punteggio dai gol rimasti (evita punteggi negativi in caso di reset+delete)
  const remaining = await prisma.goal.findMany({ where: { matchId: id } });
  const m = await prisma.match.findUnique({ where: { id } });
  if (m) {
    const homeScore = remaining.filter((g) => g.teamId === m.homeTeamId).length;
    const awayScore = remaining.filter((g) => g.teamId === m.awayTeamId).length;
    await prisma.match.update({ where: { id }, data: { homeScore, awayScore } });
  }
  return NextResponse.json({ ok: true });
}
