import { PrismaClient, Phase } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// 32 squadre dell'edizione 2025 — base per il nuovo torneo
const TEAMS = [
  "METKO BOYS", "VERDE PISTACCHIO", "LE ZECCHE DELL'ORTO", "LOGGIA AL 42",
  "AUTOSPA", "WORKS", "R.P. CLAUDIO E PAOLA", "WAY",
  "GARRA CHARRUA", "E LA BASE", "R.P. BARI SC", "BAR VENEZIA",
  "SERVICE CAR", "BAR GEL RIVIERA", "I CALMI", "ORTO ORTO TRE",
  "KIKO CALDAIE", "LEGEND'S TEAM", "TIRAX", "LE DUE PALME",
  "BEOR", "LA SELECION", "TRANCERIA GM", "TITANIC PT F.D. GEN",
  "AS ROMA", "MACELLERIA ALOIA", "SPACE JAM", "LA BANDA BASSOTTI",
  "CALZATURIFICIO", "256", "SCAPPATI DI CASA", "CARCERA",
];

async function main() {
  console.log("Reset...");
  await prisma.goal.deleteMany();
  await prisma.match.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
  await prisma.edition.deleteMany();
  await prisma.adminUser.deleteMany();

  // Admin utenti
  const admins = [
    { email: process.env.ADMIN_EMAIL || "antoniocataldi93@gmail.com", password: process.env.ADMIN_PASSWORD || "Fcim1908!" },
    { email: "24hadmin@orto.it", password: "loggiamerda" },
  ];
  for (const a of admins) {
    await prisma.adminUser.create({
      data: { email: a.email, passwordHash: await bcrypt.hash(a.password, 10) },
    });
    console.log(`Admin: ${a.email}`);
  }

  const year = new Date().getFullYear();
  await prisma.edition.updateMany({ data: { isCurrent: false } });
  const edition = await prisma.edition.create({
    data: { year, name: `Orto 24H ${year}`, isCurrent: true },
  });
  console.log(`Edition: ${edition.year}`);

  const teams = [];
  for (let i = 0; i < TEAMS.length; i++) {
    const players = Array.from({ length: 7 }, (_, k) => ({
      name: `Giocatore ${k + 1}`,
      isCoach: false,
    }));
    const t = await prisma.team.create({
      data: {
        name: TEAMS[i],
        seed: i + 1,
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

  // Data d'inizio del torneo (sabato 18 luglio 2026 alle 09:00, editabile).
  // Calendario torneo: luglio 2026 (CEST/UTC+2)
  // Ogni orario è espresso in ora locale Roma con offset esplicito così
  // il risultato è indipendente dal timezone del server (locale o UTC).
  const TZ_OFFSET = "+02:00";
  const DAYS = ["2026-07-18", "2026-07-19"]; // sab, dom
  const iso = (day: number, h: number, m: number) =>
    new Date(`${DAYS[day]}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00${TZ_OFFSET}`);

  // Orari precisi delle 55 partite (offset dal giorno d'inizio: 0 = sabato, 1 = domenica)
  const SCHEDULE: { d: number; h: number; m: number }[] = [
    // Paradiso R1 (16)
    { d: 0, h: 9,  m: 0 },  { d: 0, h: 9,  m: 35 }, { d: 0, h: 10, m: 10 },
    { d: 0, h: 10, m: 45 }, { d: 0, h: 11, m: 20 }, { d: 0, h: 11, m: 55 },
    // pausa pranzo
    { d: 0, h: 14, m: 0 },  { d: 0, h: 14, m: 35 }, { d: 0, h: 15, m: 10 },
    { d: 0, h: 15, m: 45 }, { d: 0, h: 16, m: 20 }, { d: 0, h: 16, m: 55 },
    { d: 0, h: 17, m: 30 }, { d: 0, h: 18, m: 5 },  { d: 0, h: 18, m: 40 },
    { d: 0, h: 19, m: 15 },
    // Inferno R1 (8)
    { d: 0, h: 20, m: 0 },  { d: 0, h: 20, m: 35 }, { d: 0, h: 21, m: 10 },
    { d: 0, h: 21, m: 45 }, { d: 0, h: 22, m: 20 }, { d: 0, h: 22, m: 55 },
    { d: 0, h: 23, m: 30 }, { d: 1, h: 0,  m: 5 },
    // Paradiso R2 (8)
    { d: 1, h: 0,  m: 40 }, { d: 1, h: 1,  m: 15 }, { d: 1, h: 1,  m: 50 },
    { d: 1, h: 2,  m: 25 }, { d: 1, h: 3,  m: 0 },  { d: 1, h: 3,  m: 35 },
    { d: 1, h: 4,  m: 10 }, { d: 1, h: 4,  m: 45 },
    // Inferno R2 (8)
    { d: 1, h: 5,  m: 20 }, { d: 1, h: 5,  m: 55 }, { d: 1, h: 6,  m: 30 },
    { d: 1, h: 7,  m: 5 },  { d: 1, h: 7,  m: 40 }, { d: 1, h: 8,  m: 15 },
    { d: 1, h: 8,  m: 50 }, { d: 1, h: 9,  m: 25 },
    // Ottavi (8) — pausa mattinata (~9:25 → 14:00)
    { d: 1, h: 14, m: 0 },  { d: 1, h: 14, m: 35 }, { d: 1, h: 15, m: 10 },
    { d: 1, h: 15, m: 45 }, { d: 1, h: 16, m: 20 }, { d: 1, h: 16, m: 55 },
    { d: 1, h: 17, m: 30 }, { d: 1, h: 18, m: 5 },
    // Quarti (4)
    { d: 1, h: 18, m: 40 }, { d: 1, h: 19, m: 15 }, { d: 1, h: 19, m: 50 },
    { d: 1, h: 20, m: 25 },
    // Semifinali (2)
    { d: 1, h: 21, m: 0 },  { d: 1, h: 21, m: 40 },
    // Finale (1)
    { d: 1, h: 23, m: 0 },
  ];

  const scheduledAtFor = (i: number): Date => {
    const s = SCHEDULE[i];
    return iso(s.d, s.h, s.m);
  };

  const byPhase: Record<string, { id: string; idx: number }[]> = {};

  // Le partite sono create vuote (nessuna squadra assegnata).
  // Il sorteggio del primo turno viene fatto dall'admin.
  let scheduleIdx = 0;
  for (const r of rounds) {
    byPhase[r.phase] = [];
    for (let i = 0; i < r.count; i++) {
      const m = await prisma.match.create({
        data: {
          code: `${r.codePrefix}-${i + 1}`,
          phase: r.phase,
          scheduledAt: scheduledAtFor(scheduleIdx++),
          editionId: edition.id,
        },
      });
      byPhase[r.phase].push({ id: m.id, idx: i });
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
    // R16 -> QF: NIENTE winnerNext.
    // I quarti vengono sorteggiati manualmente dall'admin dopo che tutti
    // gli ottavi sono conclusi, e le 8 squadre vengono abbinate a mano.
  }
  // SF pairing (bracket standard adiacente):
  //   SF[0] = QF[0] winner vs QF[1] winner
  //   SF[1] = QF[2] winner vs QF[3] winner
  for (let i = 0; i < 4; i++) {
    await prisma.match.update({
      where: { id: byPhase[Phase.PLAYOFF_QF][i].id },
      data: { winnerNext: byPhase[Phase.PLAYOFF_SF][Math.floor(i / 2)].id },
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
