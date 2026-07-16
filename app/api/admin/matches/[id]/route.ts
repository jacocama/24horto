import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const data: any = {};

  const prev = await prisma.match.findUnique({ where: { id } });

  if (body.action === "start") {
    data.status = "LIVE";
    data.startedAt = new Date();
  } else if (body.action === "end") {
    data.status = "FINISHED";
  } else if (body.action === "reset") {
    // Riapri: torna solo a LIVE, mantiene gol/MVP/score/penalty.
    // Un-propaga le squadre dai match successivi.
    if (prev && prev.status === "FINISHED") {
      await unpropagate(prev);
    }
    data.status = "LIVE";
  } else if (body.action === "setPenaltyWinner") {
    data.penaltyWinnerId = body.teamId || null;
  } else if (body.action === "setMvp") {
    data.mvpId = body.playerId || null;
  } else if (body.action === "advance") {
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

  const m = await prisma.match.update({ where: { id }, data });

  const drawNow = m.homeScore === m.awayScore;
  const justFinished = prev && prev.status !== "FINISHED" && m.status === "FINISHED";
  const penaltyJustSet = body.action === "setPenaltyWinner" && m.status === "FINISHED";
  const advanceAction = body.action === "advance" && m.status === "FINISHED";

  if ((justFinished && !drawNow) || penaltyJustSet || advanceAction) {
    await propagate(m.id);
  }
  return NextResponse.json(m);
}

// Rimuove il team `id` da homeTeamId/awayTeamId del match target se presente
async function clearTeamFrom(matchId: string, teamId: string) {
  const target = await prisma.match.findUnique({ where: { id: matchId } });
  if (!target) return;
  const patch: any = {};
  if (target.homeTeamId === teamId) patch.homeTeamId = null;
  if (target.awayTeamId === teamId) patch.awayTeamId = null;
  if (Object.keys(patch).length) {
    await prisma.match.update({ where: { id: matchId }, data: patch });
  }
}

function computeWinnerLoser(m: any): { winner: string | null; loser: string | null } {
  if (!m.homeTeamId || !m.awayTeamId) return { winner: null, loser: null };
  if (m.scoreUnknown || m.homeScore === m.awayScore) {
    if (!m.penaltyWinnerId) return { winner: null, loser: null };
    const winner = m.penaltyWinnerId;
    const loser = winner === m.homeTeamId ? m.awayTeamId : m.homeTeamId;
    return { winner, loser };
  }
  const winner = m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId;
  const loser = m.homeScore > m.awayScore ? m.awayTeamId : m.homeTeamId;
  return { winner, loser };
}

async function unpropagate(m: any) {
  const { winner, loser } = computeWinnerLoser(m);
  if (m.winnerNext && winner) await clearTeamFrom(m.winnerNext, winner);
  if (m.loserNext && loser) await clearTeamFrom(m.loserNext, loser);
}

async function propagate(matchId: string) {
  const m = await prisma.match.findUnique({ where: { id: matchId } });
  if (!m || !m.homeTeamId || !m.awayTeamId) return;
  const { winner, loser } = computeWinnerLoser(m);
  if (!winner || !loser) return;

  // WinnerNext: idempotente
  if (m.winnerNext) {
    const next = await prisma.match.findUnique({ where: { id: m.winnerNext } });
    if (next && next.homeTeamId !== winner && next.awayTeamId !== winner) {
      await prisma.match.update({
        where: { id: next.id },
        data: next.homeTeamId ? { awayTeamId: winner } : { homeTeamId: winner },
      });
    }
  }
  // LoserNext: idempotente
  if (m.loserNext) {
    const next = await prisma.match.findUnique({ where: { id: m.loserNext } });
    if (next && next.homeTeamId !== loser && next.awayTeamId !== loser) {
      await prisma.match.update({
        where: { id: next.id },
        data: next.homeTeamId ? { awayTeamId: loser } : { homeTeamId: loser },
      });
    }
  }
}
