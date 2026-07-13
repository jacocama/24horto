const TZ = "Europe/Rome";

export function fmtTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}
export function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "short", timeZone: TZ });
}
export const phaseLabel: Record<string, string> = {
  PARADISO_R1: "Paradiso · 1° Turno",
  PARADISO_R2: "Paradiso · 2° Turno",
  INFERNO_R1: "Inferno · 1° Turno",
  INFERNO_R2: "Inferno · 2° Turno",
  PLAYOFF_R16: "Ottavi di Finale",
  PLAYOFF_QF: "Quarti di Finale",
  PLAYOFF_SF: "Playoff · Semifinali",
  PLAYOFF_FINAL: "Finale",
};
