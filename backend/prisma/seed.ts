import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  // ── Admin seed (corre en todos los entornos) ──────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL ?? "paolavcastilloinm@gmail.com";

  // Crear / asegurar admin
  await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: { rol: "ADMINISTRADOR", activo: true, emailVerified: true },
    create: {
      nombre: "Administrador",
      email: adminEmail,
      rol: "ADMINISTRADOR",
      activo: true,
      emailVerified: true,
    },
  });

  console.log("✅ Admin asegurado:", adminEmail);

  // 🚫 En producción no cargamos datos fake
  if (process.env.NODE_ENV === "production") {
    console.log("ℹ️ Producción: no se cargan propiedades de ejemplo");
    return;
  }

  // Obtener admin para asignarlo como dueño de las propiedades de ejemplo
  const admin = await prisma.usuario.findUniqueOrThrow({
    where: { email: adminEmail },
  });

  // Crear propiedades de ejemplo
  const propiedadesEjemplo = [
    {
      titulo: 'Casa moderna en zona residencial',
      descripcionPublica: 'Hermosa casa de 3 dormitorios con jardín y piscina',
      descripcionPrivada: 'Propiedad en excelente estado, lista para ocupar',
      tipo: 'VENTA' as const,
      precio: new Decimal('250000'),
      ubicacion: 'Avenida Principal 123, Buenos Aires',
      contacto: '+54 11 1234-5678',
      imagenes: ['https://via.placeholder.com/400x300?text=Casa+Moderna'],
      destacada: true,
    },
    {
      titulo: 'Departamento 2 ambientes en Palermo',
      descripcionPublica: 'Moderno departamento amoblado en el corazón de Palermo',
      descripcionPrivada: 'Excelente oportunidad de inversión',
      tipo: 'ALQUILER' as const,
      precio: new Decimal('1500'),
      ubicacion: 'Calle Libertad 456, Palermo, Buenos Aires',
      contacto: '+54 11 2345-6789',
      imagenes: ['https://via.placeholder.com/400x300?text=Departamento+Palermo'],
      destacada: true,
    },
    {
      titulo: 'Casa quinta en las afueras',
      descripcionPublica: 'Terreno amplio con construcción de 4 dormitorios',
      descripcionPrivada: 'Requiere renovaciones menores',
      tipo: 'VENTA' as const,
      precio: new Decimal('180000'),
      ubicacion: 'Ruta 5, km 40, La Plata',
      contacto: '+54 221 4567-890',
      imagenes: ['https://via.placeholder.com/400x300?text=Casa+Quinta'],
      destacada: false,
    },
    {
      titulo: 'Oficina en centro comercial',
      descripcionPublica: 'Oficina de 50m² en edificio de oficinas',
      descripcionPrivada: 'Con servicios incluidos, inmediato',
      tipo: 'ALQUILER' as const,
      precio: new Decimal('2000'),
      ubicacion: 'Centro, Buenos Aires',
      contacto: '+54 11 3456-7890',
      imagenes: ['https://via.placeholder.com/400x300?text=Oficina'],
      destacada: false,
    },
  ];

  for (const prop of propiedadesEjemplo) {
    await prisma.propiedad.upsert({
      where: { id: `prop-${prop.titulo.slice(0, 10).replace(/\s/g, '')}` },
      update: prop,
      create: {
        ...prop,
        administradorId: admin.id,
      },
    });
  }

  console.log(`✅ ${propiedadesEjemplo.length} propiedades de ejemplo creadas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

