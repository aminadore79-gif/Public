import { PrismaClient } from "@prisma/client";

// Next.js dev 모드에서 Prisma Client가 과도하게 생성되는 것을 방지하기 위한 싱글톤 패턴
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

