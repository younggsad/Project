import { PrismaClient } from "@/generated/prisma/client";

declare global {
  // Чтобы PrismaClient не создавался заново при HMR в development
  var prisma: PrismaClient | undefined;
}

// Если глобального клиента нет — создаём
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
