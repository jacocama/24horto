import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function rand<T>(a: T[]) { return a[Math.floor(Math.random() * a.length)]; }

async function main() {
  const edition = await prisma.edition.findUnique({ where: { year: 2025 } });
  if (!edition) throw new Error("Edizione 2025 non trovata");

  const matches = await prisma.match.findMany({
    where: { editionId: edition.id, status: "FINISHED" },
  });

  let count = 0;
  for (const m of matches) {
    if (!m.homeTeamId || !m.awayTeamId) continue;
    const players = await prisma.player.findMany({
      where: { teamId: { in: [m.homeTeamId, m.awayTeamId] }, isCoach: false },
    });
    if (!players.length) continue;
    const mvp = rand(players);
    await prisma.match.update({ where: { id: m.id }, data: { mvpId: mvp.id } });
    count++;
  }
  console.log(`Assegnati ${count} MVP alle partite 2025`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
