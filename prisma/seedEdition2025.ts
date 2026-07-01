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

  // Wipe existing 2025 if present
  const existing = await prisma.edition.findUnique({ where: { year: YEAR } });
  if (existing) {
    await prisma.edition.delete({ where: { id: existing.id } });
    console.log("Removed previous 2025 edition.");
  }

  const edition = await prisma.edition.create({
    data: { year: YEAR, name: `Orto 24H ${YEAR}`, isCurrent: false },
  });

  // Teams + players
  const teams = [];
  for (let i = 0; i < 32; i++) {
    const playerCount = 7;
    const players = Array.from({ length: playerCount }, () => ({
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

  // Bracket: identical to current edition structure
  const upperRounds: { phase: Phase; count: number }[] = [
    { phase: Phase.UPPER_R1, count: 16 },
    { phase: Phase.UPPER_R2, count: 8 },
    { phase: Phase.UPPER_R3, count: 4 },
    { phase: Phase.UPPER_R4, count: 2 },
    { phase: Phase.UPPER_FINAL, count: 1 },
  ];
  const lowerRounds: { phase: Phase; count: number }[] = [
    { phase: Phase.LOWER_R1, count: 8 },
    { phase: Phase.LOWER_R2, count: 4 },
    { phase: Phase.LOWER_R3, count: 2 },
    { phase: Phase.LOWER_FINAL, count: 1 },
  ];

  // Dates: torneo del weekend del 28-29 giugno 2025
  const start = new Date(`${YEAR}-06-28T09:00:00`);
  let cursor = new Date(start);
  const step = 35 * 60 * 1000;

  type Slot = { id: string; phase: Phase; idx: number; homeTeamId?: string; awayTeamId?: string };
  const upper: Slot[][] = [];
  const lower: Slot[][] = [];

  const shuffled = shuffle(teams);

  for (let r = 0; r < upperRounds.length; r++) {
    const row: Slot[] = [];
    for (let i = 0; i < upperRounds[r].count; i++) {
      const code = `U${r + 1}-${i + 1}`;
      const data: any = { code, phase: upperRounds[r].phase, scheduledAt: new Date(cursor), editionId: edition.id };
      if (r === 0) {
        data.homeTeamId = shuffled[i * 2].id;
        data.awayTeamId = shuffled[i * 2 + 1].id;
      }
      const m = await prisma.match.create({ data });
      row.push({ id: m.id, phase: upperRounds[r].phase, idx: i, homeTeamId: data.homeTeamId, awayTeamId: data.awayTeamId });
      cursor = new Date(cursor.getTime() + step);
    }
    upper.push(row);
  }
  for (let r = 0; r < lowerRounds.length; r++) {
    const row: Slot[] = [];
    for (let i = 0; i < lowerRounds[r].count; i++) {
      const code = `L${r + 1}-${i + 1}`;
      const m = await prisma.match.create({
        data: { code, phase: lowerRounds[r].phase, scheduledAt: new Date(cursor), editionId: edition.id },
      });
      row.push({ id: m.id, phase: lowerRounds[r].phase, idx: i });
      cursor = new Date(cursor.getTime() + step);
    }
    lower.push(row);
  }
  const grand = await prisma.match.create({
    data: { code: "GF-1", phase: Phase.GRAND_FINAL, scheduledAt: new Date(cursor), editionId: edition.id },
  });

  // Helper: simulate a match — set scores, assign goals to random players, propagate
  async function playMatch(matchId: string, homeTeamId: string, awayTeamId: string): Promise<{ winner: string; loser: string }> {
    let hs = randInt(0, 5);
    let as = randInt(0, 5);
    let penaltyWinnerId: string | null = null;

    // If draw, decide penalty winner randomly
    if (hs === as) {
      penaltyWinnerId = Math.random() < 0.5 ? homeTeamId : awayTeamId;
    }

    await prisma.match.update({
      where: { id: matchId },
      data: { homeTeamId, awayTeamId, homeScore: hs, awayScore: as, status: "FINISHED", penaltyWinnerId },
    });

    // Add goals attributed to random non-coach players
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

  // Play upper R1, dropping losers into lower R1
  const lowerR1Incoming: string[] = []; // losers from U1
  for (let i = 0; i < upper[0].length; i++) {
    const m = upper[0][i];
    const { winner, loser } = await playMatch(m.id, m.homeTeamId!, m.awayTeamId!);
    // assign winner to next upper
    const nextU = upper[1][Math.floor(i / 2)];
    if (i % 2 === 0) nextU.homeTeamId = winner; else nextU.awayTeamId = winner;
    await prisma.match.update({
      where: { id: nextU.id },
      data: i % 2 === 0 ? { homeTeamId: winner } : { awayTeamId: winner },
    });
    lowerR1Incoming.push(loser);
  }

  // Pair losers into lower R1 (already in random order from upper R1)
  for (let i = 0; i < lower[0].length; i++) {
    const home = lowerR1Incoming[i * 2];
    const away = lowerR1Incoming[i * 2 + 1];
    lower[0][i].homeTeamId = home;
    lower[0][i].awayTeamId = away;
    await prisma.match.update({
      where: { id: lower[0][i].id },
      data: { homeTeamId: home, awayTeamId: away },
    });
  }

  // Generic round-by-round play: upper R2+ (winner only advances upper), lower R1+ (winner only advances lower)
  for (let r = 1; r < upper.length; r++) {
    for (let i = 0; i < upper[r].length; i++) {
      const m = upper[r][i];
      const { winner } = await playMatch(m.id, m.homeTeamId!, m.awayTeamId!);
      if (r < upper.length - 1) {
        const nextU = upper[r + 1][Math.floor(i / 2)];
        nextU[i % 2 === 0 ? "homeTeamId" : "awayTeamId"] = winner;
        await prisma.match.update({
          where: { id: nextU.id },
          data: i % 2 === 0 ? { homeTeamId: winner } : { awayTeamId: winner },
        });
      }
    }
  }
  for (let r = 0; r < lower.length; r++) {
    for (let i = 0; i < lower[r].length; i++) {
      const m = lower[r][i];
      const { winner } = await playMatch(m.id, m.homeTeamId!, m.awayTeamId!);
      if (r < lower.length - 1) {
        const nextL = lower[r + 1][Math.floor(i / 2)];
        nextL[i % 2 === 0 ? "homeTeamId" : "awayTeamId"] = winner;
        await prisma.match.update({
          where: { id: nextL.id },
          data: i % 2 === 0 ? { homeTeamId: winner } : { awayTeamId: winner },
        });
      }
    }
  }

  // Grand final: upper champ vs lower champ
  const upperFinal = await prisma.match.findUnique({ where: { id: upper[upper.length - 1][0].id } });
  const lowerFinal = await prisma.match.findUnique({ where: { id: lower[lower.length - 1][0].id } });
  const upperChamp = (upperFinal!.homeScore > upperFinal!.awayScore)
    || (upperFinal!.homeScore === upperFinal!.awayScore && upperFinal!.penaltyWinnerId === upperFinal!.homeTeamId)
      ? upperFinal!.homeTeamId! : upperFinal!.awayTeamId!;
  const lowerChamp = (lowerFinal!.homeScore > lowerFinal!.awayScore)
    || (lowerFinal!.homeScore === lowerFinal!.awayScore && lowerFinal!.penaltyWinnerId === lowerFinal!.homeTeamId)
      ? lowerFinal!.homeTeamId! : lowerFinal!.awayTeamId!;

  await playMatch(grand.id, upperChamp, lowerChamp);

  const gf = await prisma.match.findUnique({ where: { id: grand.id }, include: { homeTeam: true, awayTeam: true } });
  const champion = gf!.homeScore > gf!.awayScore || (gf!.homeScore === gf!.awayScore && gf!.penaltyWinnerId === gf!.homeTeamId)
    ? gf!.homeTeam : gf!.awayTeam;
  console.log(`🏆 Campione 2025: ${champion!.name}`);
  console.log("Seed 2025 done.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
