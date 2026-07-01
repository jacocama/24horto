import Link from "next/link";

export function EditionBanner({ edition }: { edition: { year: number; isCurrent: boolean; name: string | null } }) {
  if (edition.isCurrent) return null;
  return (
    <div className="rounded-xl bg-accent/15 border border-accent/30 px-3 py-2 text-sm flex items-center justify-between">
      <span>
        Stai visualizzando l'edizione <span className="font-bold text-accent">{edition.year}</span> (archivio)
      </span>
      <Link href="/" className="text-xs underline text-white/70 hover:text-white">torna all'attuale</Link>
    </div>
  );
}
