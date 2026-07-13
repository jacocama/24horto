import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { resolveEdition } from "@/lib/edition";
import { EditionBanner } from "@/components/EditionBanner";

export const dynamic = "force-dynamic";

export default async function Squadre({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const sp = await searchParams;
  const edition = await resolveEdition(sp.year);
  if (!edition) return <div className="card text-white/60">Nessuna edizione.</div>;

  const teams = await prisma.team.findMany({
    where: { editionId: edition.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { players: true } } },
  });
  return (
    <div className="space-y-4">
      <EditionBanner edition={edition} />
      <h1 className="text-2xl font-black">Squadre</h1>
      <div className="grid grid-cols-2 gap-3">
        {teams.map((t) => (
          <Link key={t.id} href={`/diretta/squadre/${t.id}`} className="card hover:border-accent/50">
            <div className="font-bold">{t.name}</div>
            <div className="text-xs text-white/50">{t._count.players} tesserati</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
