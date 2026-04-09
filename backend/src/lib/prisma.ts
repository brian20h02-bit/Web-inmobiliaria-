import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:2206@localhost:5432/inmobiliaria',
    },
  },
})

export default prisma
