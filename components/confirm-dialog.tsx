"use client";
import { useEffect, useState } from "react";

type Options = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

let externalOpen: ((opts: Options) => Promise<boolean>) | null = null;

export function useConfirm() {
  return async (opts: Options | string): Promise<boolean> => {
    if (!externalOpen) return window.confirm(typeof opts === "string" ? opts : opts.message);
    return externalOpen(typeof opts === "string" ? { message: opts } : opts);
  };
}

export function ConfirmDialogProvider() {
  const [state, setState] = useState<{
    opts: Options;
    resolve: (v: boolean) => void;
  } | null>(null);

  useEffect(() => {
    externalOpen = (opts) =>
      new Promise((resolve) => setState({ opts, resolve }));
    return () => {
      externalOpen = null;
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const close = (v: boolean) => {
    if (!state) return;
    state.resolve(v);
    setState(null);
  };

  if (!state) return null;
  const { opts } = state;
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/70 backdrop-blur px-4"
      onClick={() => close(false)}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-brand-bg p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        {opts.title && (
          <div className="text-xs font-black uppercase tracking-widest text-accent mb-2">
            {opts.title}
          </div>
        )}
        <div className="text-sm text-white/90 mb-5">{opts.message}</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => close(false)}
            className="rounded-lg px-3 py-2.5 font-bold text-sm bg-white/5 hover:bg-white/10 active:scale-95 transition">
            {opts.cancelLabel ?? "Annulla"}
          </button>
          <button
            onClick={() => close(true)}
            className={`rounded-lg px-3 py-2.5 font-bold text-sm active:scale-95 transition ${
              opts.danger
                ? "bg-destructive text-white hover:brightness-110"
                : "bg-accent text-brand-bg hover:brightness-110"
            }`}>
            {opts.confirmLabel ?? "Conferma"}
          </button>
        </div>
      </div>
    </div>
  );
}
