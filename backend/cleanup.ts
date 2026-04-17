import prisma from './src/lib/prisma';

async function cleanup() {
  try {
    console.log('🔍 Buscando usuario común y admin...');
    
    const usuarioComun = await prisma.usuario.findUnique({
      where: { email: 'brian20h02@gmail.com' },
    });
    
    const usuarioAdmin = await prisma.usuario.findUnique({
      where: { email: 'admin@inmobiliaria.com' },
    });
    
    if (!usuarioComun) {
      console.log('❌ Usuario común no encontrado');
      return;
    }
    
    if (!usuarioAdmin) {
      console.log('❌ Admin no encontrado');
      return;
    }
    
    console.log(`✅ Usuario común: ${usuarioComun.id}`);
    console.log(`✅ Admin: ${usuarioAdmin.id}`);
    
    // Encontrar TODAS las propiedades del admin
    const propiedadesAdmin = await prisma.propiedad.findMany({
      where: { administradorId: usuarioAdmin.id }
    });
    
    console.log(`\n📋 Admin tiene ${propiedadesAdmin.length} propiedades`);
    
    // Encontrar todas las consultas del usuario común sobre cualquier propiedad del admin
    const consultasAborrar = await prisma.consulta.findMany({
      where: {
        usuarioId: usuarioComun.id,
        propiedad: {
          administradorId: usuarioAdmin.id
        }
      }
    });
    
    console.log(`\n🗑️  Encontradas ${consultasAborrar.length} consultas para borrar`);
    
    if (consultasAborrar.length === 0) {
      console.log('No hay consultas que borrar');
      return;
    }
    
    // Borrar todos los mensajes de estas consultas
    const mensajesBorrados = await prisma.mensaje.deleteMany({
      where: {
        consultaId: {
          in: consultasAborrar.map(c => c.id)
        }
      }
    });
    
    console.log(`📝 Mensajes borrados: ${mensajesBorrados.count}`);
    
    // Borrar todas las consultas
    const consultasBorradas = await prisma.consulta.deleteMany({
      where: {
        id: {
          in: consultasAborrar.map(c => c.id)
        }
      }
    });
    
    console.log(`✅ Consultas borradas: ${consultasBorradas.count}`);
    console.log('\n✨ Base de datos limpia. Listo para hacer prueba nueva.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
