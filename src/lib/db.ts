import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Always create a new client in dev mode to pick up schema changes
// (Prisma client is regenerated on schema changes, but the cached instance
// in globalThis may not have the new models)
export const db =
  process.env.NODE_ENV === 'production'
    ? (globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] }))
    : new PrismaClient({ log: ['query'] })

if (process.env.NODE_ENV === 'production') globalForPrisma.prisma = db
