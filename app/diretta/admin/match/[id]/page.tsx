import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MatchEditor } from "./MatchEditor";

export const dynamic = "force-dynamic";

export default async function AdminMatch({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const m = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: { include: { players: true } },
      awayTeam: { include: { players: true } },
      goals: { include: { player: true, team: true }, orderBy: { minute: "asc" } },
    },
  });
  if (!m) notFound();
  return <MatchEditor match={JSON.parse(JSON.stringify(m))} />;
}
