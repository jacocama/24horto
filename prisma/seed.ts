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

  // Current edition
  const year = new Date().getFullYear();
  await prisma.edition.updateMany({ data: { isCurrent: false } });
  const edition = await prisma.edition.create({
    data: { year, name: `Orto 24H ${year}`, isCurrent: true },
  });
  console.log(`Edition: ${edition.year}`);

  // Admin
  const email = process.env.ADMIN_EMAIL || "admin@orto24h.it";
  const password = process.env.ADMIN_PASSWORD || "changeme";
  await prisma.adminUser.create({
    data: { email, passwordHash: await bcrypt.hash(password, 10) },
  });
  console.log(`Admin: ${email} / ${password}`);

  // Teams 1..32 with 7 players + ~70% coach
  const teams = [];
  for (let i = 1; i <= 32; i++) {
    const players = Array.from({ length: 7 }, (_, k) => ({
      name: `Giocatore ${k + 1}`,
      isCoach: false,
    }));
    if (Math.random() < 0.7) {
      players.push({ name: `Mister 1`, isCoach: true });
    }
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

  // Bracket
  // UPPER: 32->16->8->4->2->1 (5 rounds)
  // LOWER: receives R1 losers, single-elim 16->8->4->2->1 (4 rounds)
  // GRAND: upper champ vs lower champ (we'll reuse UPPER_FINAL/GRAND_FINAL enum)

  const upperRounds = [
    { phase: Phase.UPPER_R1, count: 16 },
    { phase: Phase.UPPER_R2, count: 8 },
    { phase: Phase.UPPER_R3, count: 4 },
    { phase: Phase.UPPER_R4, count: 2 },
    { phase: Phase.UPPER_FINAL, count: 1 },
  ];
  const lowerRounds = [
    { phase: Phase.LOWER_R1, count: 8 },
    { phase: Phase.LOWER_R2, count: 4 },
    { phase: Phase.LOWER_R3, count: 2 },
    { phase: Phase.LOWER_FINAL, count: 1 },
  ];

  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);
  let cursor = new Date(start);
  const step = 35 * 60 * 1000;

  // Create matches in chronological order interleaving upper/lower
  // For simplicity: schedule all upper R1 first (9:00-18:25), then alternate.
  type M = { id: string; phase: Phase; idx: number };
  const upperMatches: M[][] = [];
  const lowerMatches: M[][] = [];

  const shuffled = shuffle(teams);

  for (let r = 0; r < upperRounds.length; r++) {
    const row: M[] = [];
    for (let i = 0; i < upperRounds[r].count; i++) {
      const code = `U${r + 1}-${i + 1}`;
      const data: any = {
        code,
        phase: upperRounds[r].phase,
        scheduledAt: new Date(cursor),
        editionId: edition.id,
      };
      if (r === 0) {
        data.homeTeamId = shuffled[i * 2].id;
        data.awayTeamId = shuffled[i * 2 + 1].id;
      }
      const m = await prisma.match.create({ data });
      row.push({ id: m.id, phase: upperRounds[r].phase, idx: i });
      cursor = new Date(cursor.getTime() + step);
    }
    upperMatches.push(row);
  }

  for (let r = 0; r < lowerRounds.length; r++) {
    const row: M[] = [];
    for (let i = 0; i < lowerRounds[r].count; i++) {
      const code = `L${r + 1}-${i + 1}`;
      const m = await prisma.match.create({
        data: {
          code,
          phase: lowerRounds[r].phase,
          scheduledAt: new Date(cursor),
          editionId: edition.id,
        },
      });
      row.push({ id: m.id, phase: lowerRounds[r].phase, idx: i });
      cursor = new Date(cursor.getTime() + step);
    }
    lowerMatches.push(row);
  }

  // Grand final
  const grand = await prisma.match.create({
    data: {
      code: "GF-1",
      phase: Phase.GRAND_FINAL,
      scheduledAt: new Date(cursor),
      editionId: edition.id,
    },
  });

  // Wire winnerNext / loserNext
  // Upper R1 -> winner to U2 (i/2), loser to L1 (i/2)
  // Upper R2..Final -> winner to next upper (i/2). Losers from upper are NOT dropped to lower (kept simple).
  // Lower R1..Final -> winner to next lower (i/2). Final upper winner & lower winner -> grand.
  for (let r = 0; r < upperMatches.length; r++) {
    for (let i = 0; i < upperMatches[r].length; i++) {
      const m = upperMatches[r][i];
      const winnerNext =
        r < upperMatches.length - 1 ? upperMatches[r + 1][Math.floor(i / 2)].id : grand.id;
      const loserNext = r === 0 ? lowerMatches[0][Math.floor(i / 2)].id : null;
      await prisma.match.update({
        where: { id: m.id },
        data: { winnerNext, loserNext: loserNext ?? undefined },
      });
    }
  }
  for (let r = 0; r < lowerMatches.length; r++) {
    for (let i = 0; i < lowerMatches[r].length; i++) {
      const m = lowerMatches[r][i];
      const winnerNext =
        r < lowerMatches.length - 1 ? lowerMatches[r + 1][Math.floor(i / 2)].id : grand.id;
      await prisma.match.update({ where: { id: m.id }, data: { winnerNext } });
    }
  }

  console.log("Seed done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
