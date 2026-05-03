import { PrismaClient } from '@prisma/client'

// DATABASE_URL must be set via environment variable.
// Failing to do so will cause Prisma to throw at startup — intentional.
const prisma = new PrismaClient()

export default prisma
