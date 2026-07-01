import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";

export async function requireAdmin() {
  const s = await getServerSession(authOptions);
  if (!s?.user) redirect("/diretta/admin/login");
  return s;
}

export async function isAdmin() {
  const s = await getServerSession(authOptions);
  return !!s?.user;
}
