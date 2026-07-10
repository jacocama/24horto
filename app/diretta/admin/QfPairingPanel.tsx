"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Team = { id: string; name: string };

export function QfPairingPanel({
  editionId,
  winners,
  alreadyAssigned,
}: {
  editionId: string;
  winners: Team[]; // 8 winners of R16
  alreadyAssigned: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [pairs, setPairs] = useState<{ home: string; away: string }[]>([
    { home: "", away: "" },
    { home: "", away: "" },
    { home: "", away: "" },
    { home: "", away: "" },
  ]);

  const used = new Set(pairs.flatMap((p) => [p.home, p.away]).filter(Boolean));

  const setSlot = (i: number, side: "home" | "away", teamId: string) => {
    setPairs((prev) => prev.map((p, idx) => (idx === i ? { ...p, [side]: teamId } : p)));
  };

  const remaining = winners.filter((w) => !used.has(w.id));
  const canSubmit = pairs.every((p) => p.home && p.away) && new Set(pairs.flatMap((p) => [p.home, p.away])).size === 8;

  const submit = () => {
    if (!canSubmit) return;
    if (alreadyAssigned && !confirm("I quarti sono già assegnati. Vuoi sovrascriverli?")) return;
    start(async () => {
      const r = await fetch("/api/admin/pair-qf", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ editionId, pairs }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        alert(err.error || "Errore");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="card border-accent/40 space-y-3">
      <div className="text-xs uppercase tracking-widest text-accent">
        🎲 Sorteggio quarti — {alreadyAssigned ? "modifica accoppiamenti" : "seleziona gli accoppiamenti"}
      </div>
      <div className="space-y-3">
        {pairs.map((p, i) => (
          <div key={i} className="rounded-lg bg-black/20 border border-white/5 p-2 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              Quarto {i + 1}
            </div>
            <select value={p.home}
              onChange={(e) => setSlot(i, "home", e.target.value)}
              className="w-full bg-black/40 rounded px-2 py-2 border border-white/10 text-white">
              <option value="">— casa —</option>
              {winners.map((w) => (
                <option key={w.id} value={w.id} disabled={used.has(w.id) && p.home !== w.id}>{w.name}</option>
              ))}
            </select>
            <div className="text-center text-[10px] text-white/40">vs</div>
            <select value={p.away}
              onChange={(e) => setSlot(i, "away", e.target.value)}
              className="w-full bg-black/40 rounded px-2 py-2 border border-white/10 text-white">
              <option value="">— ospite —</option>
              {winners.map((w) => (
                <option key={w.id} value={w.id} disabled={used.has(w.id) && p.away !== w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      {remaining.length > 0 && (
        <div className="text-[11px] text-white/50">
          Rimaste: {remaining.map((r) => r.name).join(", ")}
        </div>
      )}
      <button
        disabled={!canSubmit || pending}
        onClick={submit}
        className="w-full rounded-lg px-3 py-2 font-bold text-sm bg-accent text-brand-bg disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed">
        {pending ? "Salvataggio…" : alreadyAssigned ? "Aggiorna quarti" : "Conferma quarti"}
      </button>
    </div>
  );
}
