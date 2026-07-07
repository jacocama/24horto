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
  const m = await prisma.match.findUnique({ where: { id } });
  if (m) {
    const dec = goal.teamId === m.homeTeamId
      ? { homeScore: { decrement: 1 } }
      : { awayScore: { decrement: 1 } };
    await prisma.match.update({ where: { id }, data: dec });
  }
  return NextResponse.json({ ok: true });
}
