import { PrismaClient, Phase } from "@prisma/client";

const prisma = new PrismaClient();

// 32 squadre reali dell'edizione 2025 (tabellone ufficiale)
const TEAMS = [
  "METRO BOYS W.E.", "VERDE PISTACCHIO", "LE ZECCHE DELL'ORTO", "LOGGIA AC GR",
  "AUTOSPA", "WORKS", "R.P. CLAUDIO E PAOLA", "WAY",
  "GARRA CHARRUA", "E LA BASE", "R.P. BARI SC", "BAR VENEZIA",
  "SERVICE CAR", "BAR GEL RIVIERA", "I. CALMI", "ORTO ORTO TRE",
  "KIKO CALDAIE", "LEGEND'S TEAM", "TIRAX", "LE DUE PALME",
  "BEOR", "LA SELECION", "TRANCERIA GM", "TITANIC PT F.D. GEN",
  "AS ROMA", "MACELLERIA ALOIA", "SPACE JAM", "LA BANDA BASSOTTI",
  "CALCIONAPPO E CEJAMA", "256", "SCAPPATI DI CASA", "CARCERA",
];

// PARADISO R1 — 16 accoppiamenti, indice del vincitore all'interno della coppia (0 = home, 1 = away)
// Coppia i = TEAMS[2i] vs TEAMS[2i+1]
const PR1_WINNER: number[] = [
  0, // METRO BOYS W.E. batte VERDE PISTACCHIO
  1, // LOGGIA AC GR batte LE ZECCHE DELL'ORTO
  1, // WORKS batte AUTOSPA
  0, // R.P. CLAUDIO E PAOLA batte WAY
  0, // GARRA CHARRUA batte E LA BASE
  1, // BAR VENEZIA batte R.P. BARI SC
  1, // BAR GEL RIVIERA batte SERVICE CAR
  0, // I. CALMI batte ORTO ORTO TRE
  0, // KIKO CALDAIE batte LEGEND'S TEAM
  0, // TIRAX batte LE DUE PALME
  0, // BEOR batte LA SELECION
  0, // TRANCERIA GM batte TITANIC PT F.D. GEN
  0, // AS ROMA batte MACELLERIA ALOIA
  1, // LA BANDA BASSOTTI batte SPACE JAM
  1, // 256 batte CALCIONAPPO E CEJAMA
  0, // SCAPPATI DI CASA batte CARCERA
];

// Paradiso R2 winners (Q1..Q8) — 0 = winner P.R1 di sinistra, 1 = winner P.R1 di destra
const PR2_WINNER: number[] = [
  0, // METRO BOYS W.E. (vs LOGGIA AC GR)              -> Q1
  0, // WORKS (vs R.P. CLAUDIO E PAOLA)                 -> Q2
  0, // GARRA CHARRUA (vs BAR VENEZIA)                  -> Q3
  0, // BAR GEL RIVIERA (vs I. CALMI)                   -> Q4
  0, // KIKO CALDAIE (vs TIRAX)                         -> Q5
  1, // TRANCERIA GM (vs BEOR)                          -> Q6
  1, // LA BANDA BASSOTTI (vs AS ROMA)                  -> Q7
  1, // SCAPPATI DI CASA (vs 256)                       -> Q8
];

// Inferno R1 winners — 8 partite: (loser P.R1[2i] vs loser P.R1[2i+1])
// Non decisivi per l'esito (perderanno tutti in I.R2). Uso 0 come default.
const IR1_WINNER: number[] = [0, 0, 0, 0, 0, 0, 0, 0];

// Inferno R2 winners — tutti P.R2 losers vincono (come da tabellone Q9..Q16)
// 0 = winner I.R1 (home), 1 = loser P.R2 (away)
const IR2_WINNER: number[] = [1, 1, 1, 1, 1, 1, 1, 1];

// Playoff ottavi (8 partite, coppie determinate dalle regole di cablatura)
// R16[i]: home = winner P.R2[i], away = winner I.R2[i XOR 2]
// 0 = home (paradiso), 1 = away (inferno)
const R16_WINNER: number[] = [
  1, // Ottavo 1: METRO vs I CALMI               -> I CALMI vince
  1, // Ottavo 2: WORKS vs BAR VENEZIA           -> BAR VENEZIA
  0, // Ottavo 3: GARRA vs R.P. CLAUDIO E PAOLA  -> GARRA CHARRUA
  0, // Ottavo 4: BAR GEL vs LOGGIA AC GR        -> BAR GEL RIVIERA
  0, // Ottavo 5: KIKO vs 256                    -> KIKO CALDAIE
  1, // Ottavo 6: TRANCERIA vs AS ROMA           -> AS ROMA
  1, // Ottavo 7: LA BANDA vs BEOR               -> BEOR
  1, // Ottavo 8: SCAPPATI vs TIRAX              -> TIRAX
];

// Quarti (bracket normale, coppie: R16[0]&[1] -> QF[0], ecc.)
const QF_WINNER: number[] = [
  1, // QF1: I CALMI vs BAR VENEZIA       -> BAR VENEZIA
  0, // QF2: GARRA vs BAR GEL RIVIERA     -> GARRA? no: dal tabellone -> BAR GEL RIVIERA
  1, // QF3: KIKO vs AS ROMA              -> AS ROMA
  1, // QF4: BEOR vs TIRAX                -> TIRAX
];
// nota: quarto 2 -> BAR GEL RIVIERA (away). Ma home era GARRA, away BAR GEL. Setto 1.
QF_WINNER[1] = 1;

// Semifinali (bracket: QF[0]&[1] -> SF[0], QF[2]&[3] -> SF[1])
const SF_WINNER: number[] = [
  0, // SF1: BAR VENEZIA vs BAR GEL RIVIERA -> BAR VENEZIA
  0, // SF2: AS ROMA vs TIRAX               -> AS ROMA
];

// Finale
const FINAL_WINNER = 1; // BAR VENEZIA vs AS ROMA -> BAR VENEZIA
// Setup: la finale prende SF[0] winner come home e SF[1] winner come away.
// SF1 winner = BAR VENEZIA (home), SF2 winner = AS ROMA (away).
// BAR VENEZIA = home = 0. Setto FINAL_WINNER=0.
// (mi correggo)
// -> Home BAR VENEZIA, Away AS ROMA, vincente BAR VENEZIA => 0
const FINAL_WINNER_FIX = 0;

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

  // Teams
  const teams: { id: string; name: string; players: { id: string; name: string; isCoach: boolean }[] }[] = [];
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
        name: TEAMS[i],
        seed: i + 1,
        editionId: edition.id,
        players: { create: players },
      },
      include: { players: true },
    });
    teams.push(t as any);
  }
  console.log(`Created ${teams.length} teams`);

  const byName = new Map(teams.map((t) => [t.name, t]));

  // Create all matches
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

  const byPhase: Record<string, string[]> = {};
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

  async function playMatch(matchId: string, homeName: string, awayName: string, winnerSide: 0 | 1): Promise<string> {
    const homeTeam = byName.get(homeName)!;
    const awayTeam = byName.get(awayName)!;
    // scores: winner sempre >= loser, ~30% pareggio con rigori
    const draw = Math.random() < 0.3;
    let hs: number, as: number, penaltyWinnerId: string | null = null;
    if (draw) {
      hs = as = randInt(0, 3);
      penaltyWinnerId = winnerSide === 0 ? homeTeam.id : awayTeam.id;
    } else {
      const w = randInt(1, 5);
      const l = randInt(0, Math.max(0, w - 1));
      if (winnerSide === 0) { hs = w; as = l; } else { hs = l; as = w; }
    }
    await prisma.match.update({
      where: { id: matchId },
      data: {
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        homeScore: hs,
        awayScore: as,
        status: "FINISHED",
        penaltyWinnerId,
      },
    });
    const homePlayers = homeTeam.players.filter((p) => !p.isCoach);
    const awayPlayers = awayTeam.players.filter((p) => !p.isCoach);
    for (let i = 0; i < hs; i++) {
      await prisma.goal.create({ data: { matchId, teamId: homeTeam.id, playerId: rand(homePlayers).id, minute: 0 } });
    }
    for (let i = 0; i < as; i++) {
      await prisma.goal.create({ data: { matchId, teamId: awayTeam.id, playerId: rand(awayPlayers).id, minute: 0 } });
    }
    const all = [...homePlayers, ...awayPlayers];
    if (all.length) {
      await prisma.match.update({ where: { id: matchId }, data: { mvpId: rand(all).id } });
    }
    return winnerSide === 0 ? homeTeam.id : awayTeam.id;
  }

  // ------ PARADISO R1 ------
  const pr1WinnerNames: string[] = [];
  const pr1LoserNames: string[] = [];
  for (let i = 0; i < 16; i++) {
    const home = TEAMS[i * 2];
    const away = TEAMS[i * 2 + 1];
    await playMatch(byPhase[Phase.PARADISO_R1][i], home, away, PR1_WINNER[i] as 0 | 1);
    pr1WinnerNames.push(PR1_WINNER[i] === 0 ? home : away);
    pr1LoserNames.push(PR1_WINNER[i] === 0 ? away : home);
  }

  // ------ INFERNO R1 ------
  // I.R1[i] = loser P.R1[2i] vs loser P.R1[2i+1]
  const ir1WinnerNames: string[] = [];
  for (let i = 0; i < 8; i++) {
    const home = pr1LoserNames[i * 2];
    const away = pr1LoserNames[i * 2 + 1];
    await playMatch(byPhase[Phase.INFERNO_R1][i], home, away, IR1_WINNER[i] as 0 | 1);
    ir1WinnerNames.push(IR1_WINNER[i] === 0 ? home : away);
  }

  // ------ PARADISO R2 ------
  // P.R2[i] = winner P.R1[2i] vs winner P.R1[2i+1]
  const pr2WinnerNames: string[] = [];
  const pr2LoserNames: string[] = [];
  for (let i = 0; i < 8; i++) {
    const home = pr1WinnerNames[i * 2];
    const away = pr1WinnerNames[i * 2 + 1];
    await playMatch(byPhase[Phase.PARADISO_R2][i], home, away, PR2_WINNER[i] as 0 | 1);
    pr2WinnerNames.push(PR2_WINNER[i] === 0 ? home : away);
    pr2LoserNames.push(PR2_WINNER[i] === 0 ? away : home);
  }

  // ------ INFERNO R2 ------
  // I.R2[i]: home = winner I.R1[i], away = loser P.R2[i XOR 1]  (swap pattern)
  const ir2WinnerNames: string[] = [];
  for (let i = 0; i < 8; i++) {
    const home = ir1WinnerNames[i];
    const away = pr2LoserNames[i ^ 1];
    await playMatch(byPhase[Phase.INFERNO_R2][i], home, away, IR2_WINNER[i] as 0 | 1);
    ir2WinnerNames.push(IR2_WINNER[i] === 0 ? home : away);
  }

  // ------ PLAYOFF R16 (OTTAVI) ------
  // R16[i]: home = winner P.R2[i], away = winner I.R2[i XOR 2]
  const r16WinnerNames: string[] = [];
  for (let i = 0; i < 8; i++) {
    const home = pr2WinnerNames[i];
    const away = ir2WinnerNames[i ^ 2];
    await playMatch(byPhase[Phase.PLAYOFF_R16][i], home, away, R16_WINNER[i] as 0 | 1);
    r16WinnerNames.push(R16_WINNER[i] === 0 ? home : away);
  }

  // ------ QUARTI ------
  const qfWinnerNames: string[] = [];
  for (let i = 0; i < 4; i++) {
    const home = r16WinnerNames[i * 2];
    const away = r16WinnerNames[i * 2 + 1];
    await playMatch(byPhase[Phase.PLAYOFF_QF][i], home, away, QF_WINNER[i] as 0 | 1);
    qfWinnerNames.push(QF_WINNER[i] === 0 ? home : away);
  }

  // ------ SEMIFINALI ------
  const sfWinnerNames: string[] = [];
  for (let i = 0; i < 2; i++) {
    const home = qfWinnerNames[i * 2];
    const away = qfWinnerNames[i * 2 + 1];
    await playMatch(byPhase[Phase.PLAYOFF_SF][i], home, away, SF_WINNER[i] as 0 | 1);
    sfWinnerNames.push(SF_WINNER[i] === 0 ? home : away);
  }

  // ------ FINALE ------
  const finalHome = sfWinnerNames[0];
  const finalAway = sfWinnerNames[1];
  await playMatch(byPhase[Phase.PLAYOFF_FINAL][0], finalHome, finalAway, FINAL_WINNER_FIX as 0 | 1);

  const champion = FINAL_WINNER_FIX === 0 ? finalHome : finalAway;
  console.log(`🏆 Campione 2025: ${champion}`);
  console.log("Seed 2025 done.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
