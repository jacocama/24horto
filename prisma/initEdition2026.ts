import { PrismaClient, Phase } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const YEAR = 2026;

  // Se esiste già l'edizione 2026 non ricreo (evita duplicati in prod)
  const existing = await prisma.edition.findUnique({ where: { year: YEAR } });
  if (existing) {
    console.log(`Edizione ${YEAR} già presente (id=${existing.id}). Nessuna azione.`);
    return;
  }

  await prisma.edition.updateMany({ data: { isCurrent: false } });
  const edition = await prisma.edition.create({
    data: { year: YEAR, name: `Orto 24H ${YEAR}`, isCurrent: true },
  });
  console.log(`Edizione ${YEAR} creata (id=${edition.id})`);

  const rounds: { phase: Phase; count: number; codePrefix: string }[] = [
    { phase: Phase.PARADISO_R1, count: 16, codePrefix: "P1" },
    { phase: Phase.INFERNO_R1, count: 8, codePrefix: "I1" },
    { phase: Phase.PARADISO_R2, count: 8, codePrefix: "P2" },
    { phase: Phase.INFERNO_R2, count: 8, codePrefix: "I2" },
    { phase: Phase.PLAYOFF_R16, count: 8, codePrefix: "OTT" },
    { phase: Phase.PLAYOFF_QF, count: 4, codePrefix: "QF" },
    { phase: Phase.PLAYOFF_SF, count: 2, codePrefix: "SF" },
    { phase: Phase.PLAYOFF_FINAL, count: 1, codePrefix: "FIN" },
  ];

  // Calendario 18-19 luglio 2026 con offset esplicito +02:00 (indipendente dal TZ del server)
  const DAYS = ["2026-07-18", "2026-07-19"];
  const iso = (d: number, h: number, m: number) =>
    new Date(`${DAYS[d]}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+02:00`);

  const SCHEDULE = [
    { d: 0, h: 9,  m: 0 },  { d: 0, h: 9,  m: 35 }, { d: 0, h: 10, m: 10 },
    { d: 0, h: 10, m: 45 }, { d: 0, h: 11, m: 20 }, { d: 0, h: 11, m: 55 },
    { d: 0, h: 14, m: 0 },  { d: 0, h: 14, m: 35 }, { d: 0, h: 15, m: 10 },
    { d: 0, h: 15, m: 45 }, { d: 0, h: 16, m: 20 }, { d: 0, h: 16, m: 55 },
    { d: 0, h: 17, m: 30 }, { d: 0, h: 18, m: 5 },  { d: 0, h: 18, m: 40 },
    { d: 0, h: 19, m: 15 },
    { d: 0, h: 20, m: 0 },  { d: 0, h: 20, m: 35 }, { d: 0, h: 21, m: 10 },
    { d: 0, h: 21, m: 45 }, { d: 0, h: 22, m: 20 }, { d: 0, h: 22, m: 55 },
    { d: 0, h: 23, m: 30 }, { d: 1, h: 0,  m: 5 },
    { d: 1, h: 0,  m: 40 }, { d: 1, h: 1,  m: 15 }, { d: 1, h: 1,  m: 50 },
    { d: 1, h: 2,  m: 25 }, { d: 1, h: 3,  m: 0 },  { d: 1, h: 3,  m: 35 },
    { d: 1, h: 4,  m: 10 }, { d: 1, h: 4,  m: 45 },
    { d: 1, h: 5,  m: 20 }, { d: 1, h: 5,  m: 55 }, { d: 1, h: 6,  m: 30 },
    { d: 1, h: 7,  m: 5 },  { d: 1, h: 7,  m: 40 }, { d: 1, h: 8,  m: 15 },
    { d: 1, h: 8,  m: 50 }, { d: 1, h: 9,  m: 25 },
    { d: 1, h: 14, m: 0 },  { d: 1, h: 14, m: 35 }, { d: 1, h: 15, m: 10 },
    { d: 1, h: 15, m: 45 }, { d: 1, h: 16, m: 20 }, { d: 1, h: 16, m: 55 },
    { d: 1, h: 17, m: 30 }, { d: 1, h: 18, m: 5 },
    { d: 1, h: 18, m: 40 }, { d: 1, h: 19, m: 15 }, { d: 1, h: 19, m: 50 },
    { d: 1, h: 20, m: 25 },
    { d: 1, h: 21, m: 0 },  { d: 1, h: 21, m: 40 },
    { d: 1, h: 23, m: 0 },
  ];

  const byPhase: Record<string, string[]> = {};
  let scheduleIdx = 0;
  for (const r of rounds) {
    byPhase[r.phase] = [];
    for (let i = 0; i < r.count; i++) {
      const s = SCHEDULE[scheduleIdx++];
      const m = await prisma.match.create({
        data: {
          code: `${r.codePrefix}-${i + 1}`,
          phase: r.phase,
          scheduledAt: iso(s.d, s.h, s.m),
          editionId: edition.id,
        },
      });
      byPhase[r.phase].push(m.id);
    }
  }
  console.log(`Create ${scheduleIdx} partite vuote`);

  // Cablatura
  for (let i = 0; i < 16; i++) {
    await prisma.match.update({
      where: { id: byPhase[Phase.PARADISO_R1][i] },
      data: {
        winnerNext: byPhase[Phase.PARADISO_R2][Math.floor(i / 2)],
        loserNext:  byPhase[Phase.INFERNO_R1][Math.floor(i / 2)],
      },
    });
  }
  for (let i = 0; i < 8; i++) {
    await prisma.match.update({
      where: { id: byPhase[Phase.INFERNO_R1][i] },
      data: { winnerNext: byPhase[Phase.INFERNO_R2][i] },
    });
    await prisma.match.update({
      where: { id: byPhase[Phase.PARADISO_R2][i] },
      data: {
        winnerNext: byPhase[Phase.PLAYOFF_R16][i],
        loserNext:  byPhase[Phase.INFERNO_R2][i ^ 1],
      },
    });
    await prisma.match.update({
      where: { id: byPhase[Phase.INFERNO_R2][i] },
      data: { winnerNext: byPhase[Phase.PLAYOFF_R16][i ^ 2] },
    });
  }
  for (let i = 0; i < 4; i++) {
    await prisma.match.update({
      where: { id: byPhase[Phase.PLAYOFF_QF][i] },
      data: { winnerNext: byPhase[Phase.PLAYOFF_SF][Math.floor(i / 2)] },
    });
  }
  for (let i = 0; i < 2; i++) {
    await prisma.match.update({
      where: { id: byPhase[Phase.PLAYOFF_SF][i] },
      data: { winnerNext: byPhase[Phase.PLAYOFF_FINAL][0] },
    });
  }
  console.log("Cablatura completata");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
