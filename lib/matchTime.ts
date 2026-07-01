// 2x12 minuti. Calcola minuto e tempo correnti da startedAt.
export function computeMatchTime(startedAt: Date | string | null, status: string) {
  if (status !== "LIVE" || !startedAt) return { minute: 0, half: 1 };
  const start = typeof startedAt === "string" ? new Date(startedAt) : startedAt;
  const elapsedMs = Date.now() - start.getTime();
  const elapsedMin = Math.max(0, Math.floor(elapsedMs / 60000));
  const HALF = 12;
  if (elapsedMin < HALF) return { minute: elapsedMin, half: 1 };
  return { minute: Math.min(HALF, elapsedMin - HALF), half: 2 };
}
