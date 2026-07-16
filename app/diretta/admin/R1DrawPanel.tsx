"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useConfirm } from "@/components/confirm-dialog";

type Team = { id: string; name: string };

export function R1DrawPanel({
  editionId,
  teams,
  initialPairs,
}: {
  editionId: string;
  teams: Team[]; // 32 team dell'edizione
  initialPairs: { home: string; away: string }[]; // 16 (possono avere "" se non ancora scelte)
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const confirmDialog = useConfirm();
  const [pairs, setPairs] = useState<{ home: string; away: string }[]>(initialPairs);
  const [expanded, setExpanded] = useState(true);

  const used = new Set(pairs.flatMap((p) => [p.home, p.away]).filter(Boolean));

  const setSlot = (i: number, side: "home" | "away", teamId: string) => {
    setPairs((prev) => prev.map((p, idx) => (idx === i ? { ...p, [side]: teamId } : p)));
  };

  const remaining = teams.filter((t) => !used.has(t.id));
  const filledCount = pairs.filter((p) => p.home && p.away).length;
  const allComplete = filledCount === 16;

  const save = () => {
    start(async () => {
      const r = await fetch("/api/admin/draw-r1", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ editionId, pairs }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        alert(err.error || "Errore salvataggio");
        return;
      }
      router.refresh();
    });
  };

  const clearAll = async () => {
    if (!(await confirmDialog({
      title: "Cancella accoppiamenti",
      message: "Cancellare tutti gli accoppiamenti del 1° turno?",
      confirmLabel: "Cancella",
      danger: true,
    }))) return;
    start(async () => {
      const r = await fetch("/api/admin/draw-r1", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ editionId }),
      });
      if (r.ok) {
        setPairs(Array.from({ length: 16 }, () => ({ home: "", away: "" })));
        router.refresh();
      }
    });
  };

  return (
    <div className="card border-accent/40 space-y-3">
      <button onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full text-left">
        <div className="text-xs uppercase tracking-widest text-accent">
          🎲 Sorteggio 1° turno · {filledCount}/16 partite
        </div>
        <span className="text-white/50 text-sm">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <>
          <p className="text-[11px] text-white/60">
            Inserisci gli accoppiamenti in ordine. Ogni squadra può essere selezionata solo una volta.
            Puoi salvare in qualunque momento e completare più tardi.
          </p>

          <div className="space-y-3">
            {pairs.map((p, i) => (
              <div key={i} className="rounded-lg bg-black/20 border border-white/5 p-2 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  Partita {i + 1}
                </div>
                <select value={p.home}
                  onChange={(e) => setSlot(i, "home", e.target.value)}
                  className="w-full bg-black/40 rounded px-2 py-2 border border-white/10 text-white">
                  <option value="">— casa —</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id} disabled={used.has(t.id) && p.home !== t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <div className="text-center text-[10px] text-white/40">vs</div>
                <select value={p.away}
                  onChange={(e) => setSlot(i, "away", e.target.value)}
                  className="w-full bg-black/40 rounded px-2 py-2 border border-white/10 text-white">
                  <option value="">— ospite —</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id} disabled={used.has(t.id) && p.away !== t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {remaining.length > 0 && (
            <div className="text-[11px] text-white/50">
              Rimaste ({remaining.length}): {remaining.map((r) => r.name).join(", ")}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button disabled={pending} onClick={save}
              className="rounded-lg px-3 py-2 font-bold text-sm bg-accent text-brand-bg disabled:opacity-50">
              {pending ? "Salvataggio…" : allComplete ? "Conferma tutti" : "Salva stato attuale"}
            </button>
            <button disabled={pending} onClick={clearAll}
              className="rounded-lg px-3 py-2 font-bold text-sm bg-white/10 hover:bg-white/20 disabled:opacity-50">
              Cancella tutto
            </button>
          </div>
        </>
      )}
    </div>
  );
}
