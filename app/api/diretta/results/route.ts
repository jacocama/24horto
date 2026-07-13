import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveEdition } from "@/lib/edition";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ?? undefined;
  const skip = Number(searchParams.get("skip") ?? "0");
  const take = Math.min(Number(searchParams.get("take") ?? "10"), 50);

  const edition = await resolveEdition(year);
  if (!edition) return NextResponse.json({ matches: [], hasMore: false });

  const matches = await prisma.match.findMany({
    where: { editionId: edition.id, status: "FINISHED" },
    include: {
      homeTeam: true, awayTeam: true,
      mvp: { include: { team: true } },
      goals: { include: { player: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { scheduledAt: "desc" },
    skip,
    take: take + 1,
  });

  const hasMore = matches.length > take;
  return NextResponse.json({ matches: matches.slice(0, take), hasMore });
}
