import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const { teamId, playerId } = await req.json();
  if (!teamId) return NextResponse.json({ error: "teamId required" }, { status: 400 });

  const goal = await prisma.goal.create({
    data: { matchId: id, teamId, playerId: playerId || null, minute: 0 },
  });

  const m = await prisma.match.findUnique({ where: { id } });
  if (m) {
    const inc = teamId === m.homeTeamId ? { homeScore: { increment: 1 } } : { awayScore: { increment: 1 } };
    await prisma.match.update({ where: { id }, data: inc });
  }
  return NextResponse.json(goal);
}
