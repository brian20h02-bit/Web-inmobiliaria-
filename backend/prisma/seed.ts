import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin1234!', 12);

  await prisma.usuario.upsert({
    where: { email: 'admin@inmobiliaria.com' },
    update: { passwordHash, rol: 'ADMINISTRADOR', activo: true },
    create: {
      nombre: 'Administrador',
      email: 'admin@inmobiliaria.com',
      passwordHash,
      rol: 'ADMINISTRADOR',
    },
  });

  console.log('Seed completado: usuario administrador creado/actualizado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
