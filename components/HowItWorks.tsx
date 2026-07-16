"use client";
import { useState } from "react";

export function HowItWorks() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-accent/25 bg-accent/5 overflow-hidden">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-black uppercase tracking-widest text-accent/85 hover:bg-accent/10 active:bg-accent/20 cursor-pointer transition">
        <span>Come funziona?</span>
        <span className="text-accent/60 text-xs">{open ? "▲" : "▼"}</span>
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
          <div>
            <div className="text-white font-black uppercase tracking-wider text-xs mb-1">Come leggere i codici</div>
            <p className="mb-2">
              Ogni partita ha un codice del tipo <b>[lettera].[numero]</b>. La lettera indica <b>fase e turno</b>,
              il numero indica <b>quale partita</b> di quel turno.
            </p>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
              <li><b className="text-sky-300">P1.x</b> — Paradiso 1° turno</li>
              <li><b className="text-sky-300">P2.x</b> — Paradiso 2° turno</li>
              <li><b className="text-red-300">I1.x</b> — Inferno 1° turno</li>
              <li><b className="text-red-300">I2.x</b> — Inferno 2° turno</li>
              <li><b className="text-accent">O.x</b> — Ottavi</li>
              <li><b className="text-accent">Q.x</b> — Quarti</li>
              <li><b className="text-accent">S.x</b> — Semifinali</li>
              <li><b className="text-accent">F.1</b> — Finale</li>
            </ul>
            <p className="mt-2 text-xs">
              Se al posto di una squadra vedi <i>"Vincente P1.3"</i> significa che quello slot sarà occupato
              dalla vincitrice della partita <b>P1.3</b>. Stessa cosa con <i>"Perdente P1.4"</i> nell'Inferno.
              Così puoi seguire già dal tabellone tutti i <b>possibili accoppiamenti</b> anche prima che le
              partite vengano giocate.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
