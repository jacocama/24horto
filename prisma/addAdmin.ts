import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage: tsx prisma/addAdmin.ts <email> <password>");
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    await prisma.adminUser.update({ where: { email }, data: { passwordHash } });
    console.log(`Admin ${email} password updated.`);
  } else {
    await prisma.adminUser.create({ data: { email, passwordHash } });
    console.log(`Admin ${email} created.`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
