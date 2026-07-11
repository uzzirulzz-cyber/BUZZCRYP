import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

// Force-set DATABASE_URL from .env file (system env may have stale SQLite URL)
let dbUrl: string | undefined
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const dbMatch = envContent.match(/^DATABASE_URL="?(.+?)"?$/m)
  if (dbMatch) {
    dbUrl = dbMatch[1]
    process.env.DATABASE_URL = dbUrl
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
