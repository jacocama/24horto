import { PrismaClient, Phase } from "@prisma/client";

const prisma = new PrismaClient();

const TEAM_NAMES = [
  "Real Pomodori", "Atletico Zucchine", "FC Carciofi", "Inter Melanzane",
  "Juventus Cipolle", "Milan Patate", "Napoli Peperoni", "Roma Insalata",
  "Lazio Rucola", "Fiorentina Basilico", "Bologna Broccoli", "Torino Spinaci",
  "Genoa Fagioli", "Sampdoria Piselli", "Cagliari Asparagi", "Verona Carote",
  "Udinese Sedano", "Sassuolo Finocchi", "Empoli Cetrioli", "Lecce Olive",
  "Atalanta Zucca", "Monza Mais", "Salernitana Funghi", "Frosinone Aglio",
  "Pescara Rapanelli", "Brescia Bietole", "Como Cavoli", "Cremonese Porri",
  "Parma Prezzemolo", "Reggina Origano", "Ascoli Rosmarino", "Bari Salvia",
];

const PLAYER_FIRSTS = [
  "Luca", "Marco", "Andrea", "Francesco", "Giuseppe", "Antonio", "Matteo", "Davide",
  "Stefano", "Alessandro", "Daniele", "Giovanni", "Simone", "Riccardo", "Federico",
  "Lorenzo", "Giacomo", "Tommaso", "Filippo", "Edoardo", "Pietro", "Gabriele",
];
const PLAYER_LASTS = [
  "Rossi", "Bianchi", "Russo", "Ferrari", "Esposito", "Romano", "Colombo", "Ricci",
  "Marino", "Greco", "Bruno", "Gallo", "Conti", "De Luca", "Mancini", "Costa",
  "Giordano", "Rizzo", "Lombardi", "Moretti", "Barbieri", "Fontana",
];

function rand<T>(a: T[]) { return a[Math.floor(Math.random() * a.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

async function main() {
  const YEAR = 2025;
  console.log(`Seeding edition ${YEAR}...`);

  const existing = await prisma.edition.findUnique({ where: { year: YEAR } });
  if (existing) {
    await prisma.edition.delete({ where: { id: existing.id } });
    console.log("Removed previous 2025 edition.");
  }

  const edition = await prisma.edition.create({
    data: { year: YEAR, name: `Orto 24H ${YEAR}`, isCurrent: false },
  });

  const teams = [];
  for (let i = 0; i < 32; i++) {
    const players = Array.from({ length: 7 }, () => ({
      name: `${rand(PLAYER_FIRSTS)} ${rand(PLAYER_LASTS)}`,
      isCoach: false,
    }));
    if (Math.random() < 0.7) {
      players.push({ name: `${rand(PLAYER_FIRSTS)} ${rand(PLAYER_LASTS)} (Mister)`, isCoach: true });
    }
    const t = await prisma.team.create({
      data: {
        name: TEAM_NAMES[i],
        seed: i + 1,
        editionId: edition.id,
        players: { create: players },
      },
      include: { players: true },
    });
    teams.push(t);
  }
  console.log(`Created ${teams.length} teams`);

  // Create all 55 matches upfront (scheduling)
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
  const start = new Date(`${YEAR}-06-28T09:00:00`);
  let cursor = new Date(start);
  const step = 35 * 60 * 1000;

  const byPhase: Record<string, string[]> = {}; // phase -> match ids
  for (const r of rounds) {
    byPhase[r.phase] = [];
    for (let i = 0; i < r.count; i++) {
      const m = await prisma.match.create({
        data: {
          code: `${r.codePrefix}-${i + 1}`,
          phase: r.phase,
          scheduledAt: new Date(cursor),
          editionId: edition.id,
        },
      });
      byPhase[r.phase].push(m.id);
      cursor = new Date(cursor.getTime() + step);
    }
  }

  // Play matches simulating a full past edition
  async function playMatch(
    matchId: string,
    homeTeamId: string,
    awayTeamId: string
  ): Promise<{ winner: string; loser: string }> {
    const hs = randInt(0, 5);
    const as = randInt(0, 5);
    let penaltyWinnerId: string | null = null;
    if (hs === as) penaltyWinnerId = Math.random() < 0.5 ? homeTeamId : awayTeamId;

    await prisma.match.update({
      where: { id: matchId },
      data: {
        homeTeamId,
        awayTeamId,
        homeScore: hs,
        awayScore: as,
        status: "FINISHED",
        penaltyWinnerId,
      },
    });

    const homePlayers = await prisma.player.findMany({ where: { teamId: homeTeamId, isCoach: false } });
    const awayPlayers = await prisma.player.findMany({ where: { teamId: awayTeamId, isCoach: false } });
    for (let i = 0; i < hs; i++) {
      await prisma.goal.create({
        data: { matchId, teamId: homeTeamId, playerId: rand(homePlayers).id, minute: 0 },
      });
    }
    for (let i = 0; i < as; i++) {
      await prisma.goal.create({
        data: { matchId, teamId: awayTeamId, playerId: rand(awayPlayers).id, minute: 0 },
      });
    }

    // Random MVP from either team
    const all = [...homePlayers, ...awayPlayers];
    if (all.length) {
      await prisma.match.update({ where: { id: matchId }, data: { mvpId: rand(all).id } });
    }

    let winner: string, loser: string;
    if (hs === as) {
      winner = penaltyWinnerId!;
      loser = winner === homeTeamId ? awayTeamId : homeTeamId;
    } else {
      winner = hs > as ? homeTeamId : awayTeamId;
      loser = hs > as ? awayTeamId : homeTeamId;
    }
    return { winner, loser };
  }

  const shuffled = shuffle(teams);

  // PARADISO_R1 (pair up random teams)
  const paradisoR2Slots: { home?: string; away?: string }[] = Array.from({ length: 8 }, () => ({}));
  const infernoR1Slots: { home?: string; away?: string }[] = Array.from({ length: 8 }, () => ({}));

  for (let i = 0; i < 16; i++) {
    const home = shuffled[i * 2].id;
    const away = shuffled[i * 2 + 1].id;
    const { winner, loser } = await playMatch(byPhase[Phase.PARADISO_R1][i], home, away);
    const nextP = paradisoR2Slots[Math.floor(i / 2)];
    if (!nextP.home) nextP.home = winner; else nextP.away = winner;
    const nextI = infernoR1Slots[Math.floor(i / 2)];
    if (!nextI.home) nextI.home = loser; else nextI.away = loser;
  }

  // INFERNO_R1 (play all)
  const infernoR2Slots: { home?: string; away?: string }[] = Array.from({ length: 8 }, () => ({}));
  for (let i = 0; i < 8; i++) {
    const { winner } = await playMatch(byPhase[Phase.INFERNO_R1][i], infernoR1Slots[i].home!, infernoR1Slots[i].away!);
    infernoR2Slots[i].home = winner;
  }

  // PARADISO_R2 (play all)
  const paradisoR2Winners: string[] = [];
  for (let i = 0; i < 8; i++) {
    const { winner, loser } = await playMatch(byPhase[Phase.PARADISO_R2][i], paradisoR2Slots[i].home!, paradisoR2Slots[i].away!);
    paradisoR2Winners.push(winner);
    infernoR2Slots[i].away = loser;
  }

  // INFERNO_R2 (play all)
  const infernoR2Winners: string[] = [];
  for (let i = 0; i < 8; i++) {
    const { winner } = await playMatch(byPhase[Phase.INFERNO_R2][i], infernoR2Slots[i].home!, infernoR2Slots[i].away!);
    infernoR2Winners.push(winner);
  }

  // PLAYOFF_R16 (sorteggio 16 = 8+8)
  const qualified = shuffle([...paradisoR2Winners, ...infernoR2Winners]);
  const qfSlots: { home?: string; away?: string }[] = Array.from({ length: 4 }, () => ({}));
  for (let i = 0; i < 8; i++) {
    const { winner } = await playMatch(byPhase[Phase.PLAYOFF_R16][i], qualified[i * 2], qualified[i * 2 + 1]);
    // We'll draw QF from all 8 winners after
    qfSlots[Math.floor(i / 2)] = qfSlots[Math.floor(i / 2)];
  }

  // Recollect R16 winners from DB
  const r16Matches = await prisma.match.findMany({ where: { id: { in: byPhase[Phase.PLAYOFF_R16] } } });
  const r16Winners = r16Matches.map((m) => {
    if (m.homeScore === m.awayScore) return m.penaltyWinnerId!;
    return m.homeScore > m.awayScore ? m.homeTeamId! : m.awayTeamId!;
  });

  // PLAYOFF_QF (sorteggio)
  const qfDrawn = shuffle(r16Winners);
  const sfSlots: { home?: string; away?: string }[] = Array.from({ length: 2 }, () => ({}));
  for (let i = 0; i < 4; i++) {
    const { winner } = await playMatch(byPhase[Phase.PLAYOFF_QF][i], qfDrawn[i * 2], qfDrawn[i * 2 + 1]);
    const s = sfSlots[Math.floor(i / 2)];
    if (!s.home) s.home = winner; else s.away = winner;
  }

  // PLAYOFF_SF (bracket)
  const finalSlot: { home?: string; away?: string } = {};
  for (let i = 0; i < 2; i++) {
    const { winner } = await playMatch(byPhase[Phase.PLAYOFF_SF][i], sfSlots[i].home!, sfSlots[i].away!);
    if (!finalSlot.home) finalSlot.home = winner; else finalSlot.away = winner;
  }

  // FINAL
  const { winner: champ } = await playMatch(byPhase[Phase.PLAYOFF_FINAL][0], finalSlot.home!, finalSlot.away!);
  const champion = await prisma.team.findUnique({ where: { id: champ } });
  console.log(`🏆 Campione 2025: ${champion!.name}`);
  console.log("Seed 2025 done.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
