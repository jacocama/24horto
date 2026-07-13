import Image from "next/image"
import Link from "next/link"
import { Countdown } from "@/components/countdown"
import { FloatingWinners } from "@/components/floating-winners"

export default function Page() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-10">
      {/* Past winners drifting in the background */}
      <FloatingWinners />

      {/* Decorative halftone dots */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-6 top-10 grid grid-cols-5 gap-2 opacity-40 sm:left-12 sm:top-16"
      >
        {Array.from({ length: 25 }).map((_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary sm:h-2 sm:w-2" />
        ))}
      </div>

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
        {/* Logo with soft edge-blend */}
        <div className="relative flex items-center justify-center">
          {/* soft glow behind logo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 scale-150 rounded-full opacity-60 blur-2xl"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklch, var(--primary) 35%, transparent) 0%, transparent 65%)",
            }}
          />
          {/* halftone dots ring to break the edge */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 scale-[1.7] opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(color-mix(in oklch, var(--primary) 55%, transparent) 1px, transparent 1.4px)",
              backgroundSize: "9px 9px",
              maskImage:
                "radial-gradient(circle, transparent 38%, black 50%, transparent 72%)",
              WebkitMaskImage:
                "radial-gradient(circle, transparent 38%, black 50%, transparent 72%)",
            }}
          />
          <Image
            src="/logo-24ore.png"
            alt="Logo 24h Orto"
            width={220}
            height={220}
            priority
            className="relative h-auto w-24 sm:w-44"
            style={{
              maskImage:
                "radial-gradient(circle at 50% 50%, black 60%, transparent 92%)",
              WebkitMaskImage:
                "radial-gradient(circle at 50% 50%, black 60%, transparent 92%)",
            }}
          />
        </div>

        {/* Title */}
        <h1 className="mt-5 font-display text-5xl uppercase leading-[0.9] tracking-tight text-foreground sm:text-7xl">
          24<span className="text-primary">h</span> Orto
        </h1>
        <p className="mt-2 text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground sm:text-base">
          18 / 19 Luglio 2026 — XXI Edizione
        </p>

        {/* Claim */}
        <p className="mt-6 max-w-xl text-balance font-display text-2xl uppercase leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          You can <span className="text-primary">be hero</span> just for{" "}
          <span className="text-primary">one day</span>
        </p>

        {/* Countdown */}
        <div className="mt-8 w-full sm:mt-12">
          <Countdown />
        </div>

        {/* Link Albo d'oro */}
        <div className="mt-8 flex items-center gap-3 text-xs uppercase tracking-widest">
          <Link href="/albo-doro" className="text-primary hover:underline">
            🏆 Albo d&apos;oro
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <Link href="/diretta/squadre" className="text-primary hover:underline">
            Scopri le squadre →
          </Link>
        </div>
      </div>
    </main>
  )
}
