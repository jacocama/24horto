import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const data: any = {};

  if (body.action === "start") {
    data.status = "LIVE";
    data.startedAt = new Date();
  } else if (body.action === "end") {
    data.status = "FINISHED";
  } else if (body.action === "reset") {
    data.status = "SCHEDULED";
    data.startedAt = null;
    data.penaltyWinnerId = null;
    data.scoreUnknown = false;
    data.homeScore = 0;
    data.awayScore = 0;
  } else if (body.action === "setPenaltyWinner") {
    data.penaltyWinnerId = body.teamId || null;
  } else if (body.action === "setMvp") {
    data.mvpId = body.playerId || null;
  } else if (body.action === "advance") {
    // Passaggio turno senza risultato: winner dichiarato manualmente
    data.status = "FINISHED";
    data.scoreUnknown = true;
    data.homeScore = 0;
    data.awayScore = 0;
    data.penaltyWinnerId = body.teamId || null;
  } else {
    if (body.status) data.status = body.status;
    if (body.scheduledAt) data.scheduledAt = new Date(body.scheduledAt);
    if (typeof body.homeScore === "number") data.homeScore = body.homeScore;
    if (typeof body.awayScore === "number") data.awayScore = body.awayScore;
  }

  const prev = await prisma.match.findUnique({ where: { id } });
  const m = await prisma.match.update({ where: { id }, data });

  // Propagate when:
  // - match just finished AND not a draw, OR
  // - penalty winner just set (draw resolved)
  const drawNow = m.homeScore === m.awayScore;
  const justFinished = prev && prev.status !== "FINISHED" && m.status === "FINISHED";
  const penaltyJustSet = body.action === "setPenaltyWinner" && m.status === "FINISHED";
  const advanceAction = body.action === "advance" && m.status === "FINISHED";

  if ((justFinished && !drawNow) || penaltyJustSet || advanceAction) {
    await propagate(m.id);
  }
  return NextResponse.json(m);
}

async function propagate(matchId: string) {
  const m = await prisma.match.findUnique({ where: { id: matchId } });
  if (!m || !m.homeTeamId || !m.awayTeamId) return;
  let winner: string;
  let loser: string;
  if (m.homeScore === m.awayScore) {
    if (!m.penaltyWinnerId) return;
    winner = m.penaltyWinnerId;
    loser = winner === m.homeTeamId ? m.awayTeamId : m.homeTeamId;
  } else {
    winner = m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId;
    loser = m.homeScore > m.awayScore ? m.awayTeamId : m.homeTeamId;
  }

  if (m.winnerNext) {
    const next = await prisma.match.findUnique({ where: { id: m.winnerNext } });
    if (next) {
      await prisma.match.update({
        where: { id: next.id },
        data: next.homeTeamId ? { awayTeamId: winner } : { homeTeamId: winner },
      });
    }
  }
  if (m.loserNext) {
    const next = await prisma.match.findUnique({ where: { id: m.loserNext } });
    if (next) {
      await prisma.match.update({
        where: { id: next.id },
        data: next.homeTeamId ? { awayTeamId: loser } : { homeTeamId: loser },
      });
    }
  }
}
