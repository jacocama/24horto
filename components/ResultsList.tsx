"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { MatchCard, type MatchLike } from "@/components/MatchCard";

export function ResultsList({
  initial,
  initialHasMore,
  year,
  pageSize = 10,
}: {
  initial: MatchLike[];
  initialHasMore: boolean;
  year?: string;
  pageSize?: number;
}) {
  const [items, setItems] = useState<MatchLike[]>(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Quando il server re-renderizza (router.refresh) con nuovi risultati in cima,
  // prependiamo le partite nuove senza perdere quelle già caricate dallo scroll.
  useEffect(() => {
    setItems((cur) => {
      const known = new Set(cur.map((m) => m.id));
      const toPrepend = initial.filter((m) => !known.has(m.id));
      return toPrepend.length ? [...toPrepend, ...cur] : cur;
    });
    // se non abbiamo ancora caricato altre pagine, aggiorna anche hasMore
    setHasMore((cur) => (cur ? cur : initialHasMore));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const params = new URLSearchParams({
      skip: String(items.length),
      take: String(pageSize),
    });
    if (year) params.set("year", year);
    const r = await fetch(`/api/diretta/results?${params}`, { cache: "no-store" });
    if (r.ok) {
      const j = await r.json();
      setItems((cur) => [...cur, ...j.matches]);
      setHasMore(!!j.hasMore);
    }
    setLoading(false);
  }, [items.length, loading, hasMore, pageSize, year]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: "300px" });
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [loadMore]);

  return (
    <div className="space-y-4">
      {items.length === 0 && (
        <div className="card text-white/60">Ancora nessun risultato.</div>
      )}
      {items.map((m) => (
        <MatchCard key={m.id} m={m} href={`/diretta/partite/${m.id}`} />
      ))}
      {hasMore && (
        <div ref={sentinelRef} className="text-center text-xs text-white/40 py-3">
          {loading ? "Caricamento…" : "Scorri per caricare altri"}
        </div>
      )}
    </div>
  );
}
