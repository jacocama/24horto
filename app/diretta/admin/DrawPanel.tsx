"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function DrawPanel({ editionId, canDrawR16, canDrawQF, r16Assigned, qfAssigned }: {
  editionId: string;
  canDrawR16: boolean;
  canDrawQF: boolean;
  r16Assigned: boolean;
  qfAssigned: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const draw = (target: "R16" | "QF") => {
    const confirmMsg = target === "R16"
      ? (r16Assigned ? "Rifare il sorteggio degli ottavi? Le assegnazioni attuali verranno sovrascritte." : "Vuoi sorteggiare gli ottavi?")
      : (qfAssigned ? "Rifare il sorteggio dei quarti? Le assegnazioni attuali verranno sovrascritte." : "Vuoi sorteggiare i quarti?");
    if (!confirm(confirmMsg)) return;
    start(async () => {
      const r = await fetch("/api/admin/draw", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ editionId, target }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        alert(err.error || "Errore sorteggio");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="card border-accent/40 space-y-2">
      <div className="text-xs uppercase tracking-widest text-accent">🎲 Sorteggi playoff</div>
      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={!canDrawR16 || pending}
          onClick={() => draw("R16")}
          className="rounded-lg px-3 py-2 font-bold text-sm bg-accent text-primary-foreground disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed">
          {r16Assigned ? "Rifai sorteggio ottavi" : "Sorteggia ottavi"}
        </button>
        <button
          disabled={!canDrawQF || pending}
          onClick={() => draw("QF")}
          className="rounded-lg px-3 py-2 font-bold text-sm bg-accent text-primary-foreground disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed">
          {qfAssigned ? "Rifai sorteggio quarti" : "Sorteggia quarti"}
        </button>
      </div>
      <p className="text-[10px] text-white/50">
        Ottavi: disponibili quando Paradiso R2 e Inferno R2 sono tutti conclusi.
        Quarti: disponibili quando gli ottavi sono tutti conclusi.
      </p>
    </div>
  );
}
