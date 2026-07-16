"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ interval = 20000 }: { interval?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), interval);
    return () => clearInterval(t);
  }, [router, interval]);
  return null;
}
