import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Albo d'oro — 24h Orto",
  description:
    "Tutti i vincitori del Torneo 24h Orto dalla prima edizione ad oggi.",
}

const WINNERS = [
  {
    year: 2025,
    team: "Bar Venezia",
    players: ["Brocchi", "Diomedi", "Piattella", "Ricci", "Di Gioacchino", "Verdecchia", "Galdenzi"],
  },
  {
    year: 2024,
    team: "Loggia al 42",
    players: ["Concetti", "Rossi R.", "Orsini", "Rosetti", "Ricci", "Babuccci", "Boutimah"],
  },
  {
    year: 2023,
    team: "Calzaturificio Marina",
    players: ["Capriotti L.", "Capriotti M.", "Torresi", "Camarri", "Sulpizi", "Cataldi", "Strappa"],
  },
  {
    year: 2022,
    team: "Meconi Team",
    players: ["Giacomozzi", "Malaspina", "Pazzi", "Di Ruscio", "Vitali", "Gobbi"],
  },
  {
    year: 2019,
    team: "AutospA",
    players: ["Livini", "Di Gennaro", "Tarquini", "Scotucci", "Nicolai", "Mauro"],
  },
  {
    year: 2018,
    team: "Garra Charrúa",
    players: ["Rossi L.", "Scarcelli", "Pionati", "Pierantozzi", "Bracalente", "Gatta", "Gallucci"],
  },
  {
    year: 2017,
    team: "Bar Panette",
    players: ["Cifani D.", "Leoni M.", "Rossi L.", "Amadio", "Ricci", "Nicolai", "Belà P."],
  },
  {
    year: 2016,
    team: "All Star Fratta",
    players: ["Simoni M.", "Andrenacci", "Malavolta", "Illuminati", "Spurio", "Lignite", "Luciani"],
  },
  {
    year: 2015,
    team: "Team Mattia",
    players: ["Jagatti", "Cruciani", "Rogante", "Mascetti", "Saiti", "Boutimah", "Catalini"],
  },
  {
    year: 2014,
    team: "Dinamo Mandolì",
    players: ["Leoni G.", "Marziali A.", "Campetelli", "Torresi", "Scoccia", "Diomedi"],
  },
  {
    year: 2013,
    team: "Rione Murato",
    players: ["Achei", "Mandolesi P.", "Paniconi", "Pangrazi", "Gentile", "Cipolletti"],
  },
  {
    year: 2012,
    team: "Bar Li Tichi",
    players: ["Leoni G.", "Ulissi", "Del Gatto", "Concetti A.", "Scoccia A.", "Niccolini", "Bagalini F."],
  },
  {
    year: 2011,
    team: "I Leccornosi",
    players: ["Achei", "Mandolesi P.", "Talamonti", "Pangrazi", "Minnucci G.", "Cifani M.", "Juvalè"],
  },
  {
    year: 2010,
    team: "F.C. Temi",
    players: ["Leoni G.", "Ulissi", "Del Gatto", "Concetti", "Foglini", "Telloni", "Niccolini"],
  },
  {
    year: 2009,
    team: "Bagalacticos",
    players: ["Bagalini G.", "Didonna G.", "Didonna M.", "Teodori", "Dell'Arciprete M.", "Santoni P.", "Ventelli"],
  },
  {
    year: 2008,
    team: "Idratati e Reintegrati",
    players: ["Tossici", "Vitali Rosati", "Santoni E.", "Calcinaro", "Carosi", "Pistolesi F."],
  },
  {
    year: 2007,
    team: "Idratati e Reintegrati",
    players: ["Tossici", "Vitali Rosati", "Pistolesi S.", "Budel", "Carosi", "Pistolesi F."],
  },
  {
    year: 2006,
    team: "Idratati e Reintegrati",
    players: ["Tossici", "Vitali Rosati", "Di Nardo", "Santoni E.", "Carosi", "Pistolesi F."],
  },
  {
    year: 2005,
    team: "Eminflex",
    players: ["Croce M.", "Carassai S.", "Matè M.", "Rocchi D.", "Teodori"],
  },
  {
    year: 2004,
    team: "La Banda del Tico",
    players: ["Abbruzzetti M.", "Teodori", "Matè M.", "Ferracuti", "Croce M."],
  },
]

export default function AlboDoro() {
  return (
    <main className="min-h-dvh bg-background px-4 py-10 pb-16">
      <div className="mx-auto max-w-xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="mb-6 inline-block text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            ← Home
          </Link>
          <div className="text-4xl mb-3">🏆</div>
          <h1 className="font-display text-4xl uppercase tracking-tight text-foreground sm:text-5xl">
            Albo d&apos;<span className="text-primary">oro</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground uppercase tracking-widest">
            Torneo 24h Orto · Dal 2004
          </p>
        </div>

        {/* Winners list */}
        <div className="flex flex-col gap-3">
          {WINNERS.map((w) => (
            <div
              key={w.year}
              className="rounded-xl border border-border bg-card p-4"
            >
              {/* Year badge + team */}
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 rounded-lg bg-primary/10 px-2.5 py-1 font-display text-base font-bold leading-none text-primary">
                  {w.year}
                </span>
                <h2 className="font-display text-xl uppercase leading-tight tracking-tight text-foreground">
                  {w.team}
                </h2>
              </div>

              {/* Players */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {w.players.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-[11px] text-muted-foreground uppercase tracking-widest">
          {WINNERS.length} edizioni · 24h Orto
        </p>
      </div>
    </main>
  )
}
