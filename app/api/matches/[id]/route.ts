import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeMatchTime } from "@/lib/matchTime";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: true,
      awayTeam: true,
      mvp: { include: { team: true } },
      goals: { include: { team: true, player: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!m) return NextResponse.json({ error: "not found" }, { status: 404 });
  const t = computeMatchTime(m.startedAt, m.status);
  return NextResponse.json({ ...m, currentMinute: t.minute, half: t.half });
}
