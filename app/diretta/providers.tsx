"use client";
import { SessionProvider } from "next-auth/react";
import { ConfirmDialogProvider } from "@/components/confirm-dialog";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <ConfirmDialogProvider />
    </SessionProvider>
  );
}
