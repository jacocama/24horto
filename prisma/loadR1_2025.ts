import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Accoppiamenti Paradiso R1 dal tabellone 2025 (in ordine)
const PAIRINGS: [string, string][] = [
  ["METKO BOYS", "VERDE PISTACCHIO"],            // P1-1
  ["LE ZECCHE DELL'ORTO", "LOGGIA AL 42"],       // P1-2
  ["AUTOSPA", "WORKS"],                          // P1-3
  ["R.P. CLAUDIO E PAOLA", "WAY"],               // P1-4
  ["GARRA CHARRUA", "E LA BASE"],                // P1-5
  ["R.P. BARI SC", "BAR VENEZIA"],               // P1-6
  ["SERVICE CAR", "BAR GEL RIVIERA"],            // P1-7
  ["I CALMI", "ORTO ORTO TRE"],                  // P1-8
  ["KIKO CALDAIE", "LEGEND'S TEAM"],             // P1-9
  ["TIRAX", "LE DUE PALME"],                     // P1-10
  ["BEOR", "LA SELECION"],                       // P1-11
  ["TRANCERIA GM", "TITANIC PT F.D. GEN"],       // P1-12
  ["AS ROMA", "MACELLERIA ALOIA"],               // P1-13
  ["SPACE JAM", "LA BANDA BASSOTTI"],            // P1-14
  ["CALZATURIFICIO", "256"],                     // P1-15
  ["SCAPPATI DI CASA", "CARCERA"],               // P1-16
];

async function main() {
  const edition = await prisma.edition.findFirst({ where: { isCurrent: true } });
  if (!edition) throw new Error("Nessuna edizione corrente");

  const teams = await prisma.team.findMany({ where: { editionId: edition.id } });
  const byName = new Map(teams.map((t) => [t.name, t]));
  for (const [h, a] of PAIRINGS) {
    if (!byName.has(h)) throw new Error(`Squadra non trovata: ${h}`);
    if (!byName.has(a)) throw new Error(`Squadra non trovata: ${a}`);
  }

  const p1 = await prisma.match.findMany({
    where: { editionId: edition.id, phase: "PARADISO_R1" },
    orderBy: { scheduledAt: "asc" },
  });
  if (p1.length !== 16) throw new Error(`Aspetto 16 partite R1, trovate ${p1.length}`);

  for (let i = 0; i < 16; i++) {
    const [homeName, awayName] = PAIRINGS[i];
    await prisma.match.update({
      where: { id: p1[i].id },
      data: {
        homeTeamId: byName.get(homeName)!.id,
        awayTeamId: byName.get(awayName)!.id,
      },
    });
    console.log(`${p1[i].code}: ${homeName} vs ${awayName}`);
  }
  console.log("Sorteggio R1 caricato.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
