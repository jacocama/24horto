"use client";
import { useState } from "react";

export function HowItWorks() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-black uppercase tracking-widest text-white/70 hover:text-white transition">
        <span>Come funziona?</span>
        <span className="text-white/40 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4 text-sm text-white/70">
          <div>
            <div className="text-sky-300 font-black uppercase tracking-wider text-xs mb-1">Paradiso</div>
            <p>
              32 squadre si scontrano nel <b>1° turno</b>: le vincitrici passano al 2° turno,
              le perdenti finiscono all'Inferno. Le vincitrici del <b>2° turno del Paradiso</b> accedono
              direttamente ai <b>Playoff (ottavi)</b>.
            </p>
          </div>
          <div>
            <div className="text-red-300 font-black uppercase tracking-wider text-xs mb-1">Inferno</div>
            <p>
              Le 16 perdenti del 1° turno del Paradiso giocano il <b>1° turno dell'Inferno</b>: chi perde
              è <b>eliminato</b> dal torneo. Le 8 vincitrici affrontano al <b>2° turno dell'Inferno</b> le
              8 perdenti del 2° turno del Paradiso. Le 8 vincitrici del 2° turno dell'Inferno accedono
              anche loro ai <b>Playoff (ottavi)</b>.
            </p>
          </div>
          <div>
            <div className="text-accent font-black uppercase tracking-wider text-xs mb-1">Playoff</div>
            <p>
              16 squadre qualificate: <b>8 dal Paradiso + 8 dall'Inferno</b>. Gli accoppiamenti degli
              <b> ottavi</b> seguono il tabellone ufficiale. I <b>quarti</b> vengono <b>sorteggiati</b>. Da lì in poi il tabellone segue lo schema classico
              fino alla <b>Finale</b>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
