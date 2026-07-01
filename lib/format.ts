export function fmtTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}
export function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "short" });
}
export const phaseLabel: Record<string, string> = {
  UPPER_R1: "Tabellone Sopra - 1° Turno",
  UPPER_R2: "Tabellone Sopra - 2° Turno",
  UPPER_R3: "Tabellone Sopra - Quarti",
  UPPER_R4: "Tabellone Sopra - Semifinali",
  UPPER_FINAL: "Finale Tabellone Sopra",
  LOWER_R1: "Tabellone Sotto - 1° Turno",
  LOWER_R2: "Tabellone Sotto - 2° Turno",
  LOWER_R3: "Tabellone Sotto - Semifinali",
  LOWER_FINAL: "Finale Tabellone Sotto",
  GRAND_FINAL: "FINALISSIMA",
};
