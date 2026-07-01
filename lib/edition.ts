import { prisma } from "./prisma";

export async function resolveEdition(yearParam?: string | string[] | undefined) {
  const year = yearParam ? Number(Array.isArray(yearParam) ? yearParam[0] : yearParam) : null;
  if (year && !Number.isNaN(year)) {
    const e = await prisma.edition.findUnique({ where: { year } });
    if (e) return e;
  }
  const current = await prisma.edition.findFirst({ where: { isCurrent: true } });
  if (current) return current;
  return prisma.edition.findFirst({ orderBy: { year: "desc" } });
}

export function withYearQuery(href: string, year?: number | null) {
  if (!year) return href;
  return `${href}${href.includes("?") ? "&" : "?"}year=${year}`;
}
