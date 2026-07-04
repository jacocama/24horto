import { PrismaClient, Phase } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

async function main() {
  console.log("Reset...");
  await prisma.goal.deleteMany();
  await prisma.match.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
  await prisma.edition.deleteMany();
  await prisma.adminUser.deleteMany();

  const email = process.env.ADMIN_EMAIL || "admin@orto24h.it";
  const password = process.env.ADMIN_PASSWORD || "changeme";
  await prisma.adminUser.create({
    data: { email, passwordHash: await bcrypt.hash(password, 10) },
  });
  console.log(`Admin: ${email} / ${password}`);

  const year = new Date().getFullYear();
  await prisma.edition.updateMany({ data: { isCurrent: false } });
  const edition = await prisma.edition.create({
    data: { year, name: `Orto 24H ${year}`, isCurrent: true },
  });
  console.log(`Edition: ${edition.year}`);

  const teams = [];
  for (let i = 1; i <= 32; i++) {
    const players = Array.from({ length: 7 }, (_, k) => ({
      name: `Giocatore ${k + 1}`,
      isCoach: false,
    }));
    if (Math.random() < 0.7) players.push({ name: `Mister 1`, isCoach: true });
    const t = await prisma.team.create({
      data: {
        name: `SQUADRA ${i}`,
        seed: i,
        editionId: edition.id,
        players: { create: players },
      },
    });
    teams.push(t);
  }
  console.log(`Created ${teams.length} teams`);

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

  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);
  let cursor = new Date(start);
  const step = 35 * 60 * 1000;

  const byPhase: Record<string, { id: string; idx: number }[]> = {};
  const shuffled = shuffle(teams);

  for (const r of rounds) {
    byPhase[r.phase] = [];
    for (let i = 0; i < r.count; i++) {
      const data: any = {
        code: `${r.codePrefix}-${i + 1}`,
        phase: r.phase,
        scheduledAt: new Date(cursor),
        editionId: edition.id,
      };
      if (r.phase === Phase.PARADISO_R1) {
        data.homeTeamId = shuffled[i * 2].id;
        data.awayTeamId = shuffled[i * 2 + 1].id;
      }
      const m = await prisma.match.create({ data });
      byPhase[r.phase].push({ id: m.id, idx: i });
      cursor = new Date(cursor.getTime() + step);
    }
  }

  // Advancement wiring (fully deterministic — no draws)
  //   P.R1[i]  winner -> P.R2[i/2],   loser -> I.R1[i/2]
  //   I.R1[i]  winner -> I.R2[i]
  //   P.R2[i]  winner -> R16[i],      loser -> I.R2[i XOR 1]  (pair swap)
  //   I.R2[i]  winner -> R16[i XOR 2] (pair-of-pairs swap)
  //   R16[i]   winner -> QF[i/2]
  //   QF[i]    winner -> SF[i/2]
  //   SF[i]    winner -> FINAL
  for (let i = 0; i < 16; i++) {
    await prisma.match.update({
      where: { id: byPhase[Phase.PARADISO_R1][i].id },
      data: {
        winnerNext: byPhase[Phase.PARADISO_R2][Math.floor(i / 2)].id,
        loserNext:  byPhase[Phase.INFERNO_R1][Math.floor(i / 2)].id,
      },
    });
  }
  for (let i = 0; i < 8; i++) {
    await prisma.match.update({
      where: { id: byPhase[Phase.INFERNO_R1][i].id },
      data: { winnerNext: byPhase[Phase.INFERNO_R2][i].id },
    });
    await prisma.match.update({
      where: { id: byPhase[Phase.PARADISO_R2][i].id },
      data: {
        winnerNext: byPhase[Phase.PLAYOFF_R16][i].id,
        loserNext:  byPhase[Phase.INFERNO_R2][i ^ 1].id,
      },
    });
    await prisma.match.update({
      where: { id: byPhase[Phase.INFERNO_R2][i].id },
      data: { winnerNext: byPhase[Phase.PLAYOFF_R16][i ^ 2].id },
    });
    await prisma.match.update({
      where: { id: byPhase[Phase.PLAYOFF_R16][i].id },
      data: { winnerNext: byPhase[Phase.PLAYOFF_QF][Math.floor(i / 2)].id },
    });
  }
  // SF pairing (cross bracket, come da tabellone ufficiale):
  //   SF[0] = QF[0] winner vs QF[3] winner
  //   SF[1] = QF[1] winner vs QF[2] winner
  const qfToSf = [0, 1, 1, 0];
  for (let i = 0; i < 4; i++) {
    await prisma.match.update({
      where: { id: byPhase[Phase.PLAYOFF_QF][i].id },
      data: { winnerNext: byPhase[Phase.PLAYOFF_SF][qfToSf[i]].id },
    });
  }
  for (let i = 0; i < 2; i++) {
    await prisma.match.update({
      where: { id: byPhase[Phase.PLAYOFF_SF][i].id },
      data: { winnerNext: byPhase[Phase.PLAYOFF_FINAL][0].id },
    });
  }

  console.log("Seed done");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
