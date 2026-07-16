import Link from "next/link";
import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Diretta Orto — Torneo 24H",
  description: "Diretta live del Torneo 24H: risultati, tabellone, marcatori e MVP",
  icons: {
    icon: "/logo-24ore.png",
    apple: "/logo-24ore.png",
  },
};

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <img src="/logo-diretta.svg" alt="Diretta Orto" className="w-9 h-9" />
      <div className="leading-tight">
        <div className="font-black text-lg tracking-wide">DIRETTA <span className="text-accent">ORTO</span></div>
        <div className="text-[10px] uppercase tracking-widest text-white/60">Torneo 24H</div>
      </div>
    </div>
  );
}

export default function DirettaLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <header className="sticky top-0 z-40 backdrop-blur bg-brand-bg/80 border-b border-white/10">
        <div className="mx-auto max-w-3xl flex items-center justify-between px-4 py-3">
          <Link href="/diretta"><Logo /></Link>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/" className="text-white/50 hover:text-white">← Home</Link>
            <Link href="/albo-doro" className="text-white/50 hover:text-white">Albo d'oro</Link>
            <Link href="/diretta/admin" className="text-white/50 hover:text-white">Admin</Link>
          </div>
        </div>
        <nav className="mx-auto max-w-3xl px-4 pb-3 flex gap-2 overflow-x-auto text-sm">
          {[
            { href: "/diretta", label: "Live" },
            { href: "/diretta/partite", label: "Partite" },
            { href: "/diretta/tabellone", label: "Tabellone" },
            { href: "/diretta/squadre", label: "Squadre" },
            { href: "/diretta/marcatori", label: "Marcatori" },
          ].map((l) => (
            <Link key={l.href} href={l.href}
              className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 active:bg-accent/30 active:scale-95 whitespace-nowrap transition">
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-5 pb-24">{children}</main>
      <footer className="fixed bottom-0 inset-x-0 text-center text-[10px] text-white/30 py-2 bg-brand-bg/80 backdrop-blur border-t border-white/5">
        Diretta Orto · 24h Orto {new Date().getFullYear()}
      </footer>
    </Providers>
  );
}
