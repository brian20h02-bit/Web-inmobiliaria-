# Plan de Tareas: Plataforma Web Inmobiliaria

- [x] 1. Configuración del Proyecto
  - [x] 1.1 Inicializar repositorio con estructura monorepo (frontend + backend)
  - [x] 1.2 Configurar proyecto backend (Node.js/Express, TypeScript, linter, variables de entorno)
  - [x] 1.3 Configurar proyecto frontend (React, TypeScript, linter, variables de entorno)
  - [x] 1.4 Configurar base de datos PostgreSQL y herramienta de migraciones (Prisma)
  - [x] 1.5 Configurar almacenamiento de imágenes (Cloudinary)
  - [x] 1.6 Configurar pipeline de CI básico (lint + tests)

- [x] 2. Modelos de Datos y Migraciones
  - [x] 2.1 Crear migración para tabla `usuarios` (id, nombre, email, password_hash, rol, fecha_registro, activo)
  - [x] 2.2 Crear migración para tabla `propiedades` con todos los campos del modelo
  - [x] 2.3 Crear migración para tabla `consultas` (id, propiedad_id, usuario_id, asunto, estado, fecha_creacion)
  - [x] 2.4 Crear migración para tabla `mensajes` (id, consulta_id, autor_id, contenido, fecha)
  - [x] 2.5 Crear índices en `propiedades` sobre campos `activa`, `tipo`, `destacada`, `fecha_publicacion`

- [x] 3. Módulo de Autenticación
  - [x] 3.1 Implementar endpoint `POST /auth/registro` con validación de email, contraseña (mín. 8 chars) y nombre
  - [x] 3.2 Implementar hashing de contraseña con bcrypt (salt rounds ≥ 12) antes de persistir
  - [x] 3.3 Implementar endpoint `POST /auth/login` con verificación de credenciales y emisión de JWT (7 días)
  - [x] 3.4 Implementar middleware de autenticación que verifica y decodifica el token JWT en cada request
  - [x] 3.5 Implementar middleware de autorización por rol (`usuario`, `administrador`)
  - [x] 3.6 Implementar rate limiting en endpoints `/auth/login` y `/auth/registro`
  - [x] 3.7 Escribir tests unitarios para `autenticarUsuario`: credenciales válidas, inválidas, cuenta desactivada, campos vacíos
  - [x] 3.8 Escribir property tests para autenticación (Propiedades 1-8)

- [x] 4. Módulo de Propiedades
  - [x] 4.1 Implementar endpoint `GET /propiedades/destacadas` que retorna propiedades con `destacada=true` y `activa=true` (solo datos públicos)
  - [x] 4.2 Implementar endpoint `GET /propiedades` con filtro por tipo y paginación (12 por página, orden fecha desc)
  - [x] 4.3 Implementar endpoint `GET /propiedades/:id` con lógica de datos públicos vs. sensibles según token
  - [x] 4.4 Implementar endpoint `POST /propiedades` (solo admin) con validación de campos requeridos
  - [x] 4.5 Implementar endpoint `PUT /propiedades/:id` (solo admin) para actualización de datos
  - [x] 4.6 Implementar endpoint `DELETE /propiedades/:id` (solo admin) que marca `activa=false`
  - [x] 4.7 Implementar endpoint `PATCH /propiedades/:id/destacar` (solo admin) que actualiza `destacada=true`
  - [x] 4.8 Implementar subida y gestión de imágenes hacia Cloudinary
  - [x] 4.9 Escribir tests unitarios para `obtenerDetallePropiedad`: con token, sin token, propiedad inexistente, inactiva
  - [x] 4.10 Escribir property tests para propiedades (Propiedades 10-19)

- [x] 5. Módulo de Mensajería / Consultas
  - [x] 5.1 Implementar endpoint `POST /consultas` (requiere auth) con validación de asunto, mensaje y propiedad_id
  - [x] 5.2 Implementar validación de consulta duplicada abierta (retornar 409 si ya existe)
  - [x] 5.3 Implementar endpoint `GET /consultas` (solo admin) que retorna todas las consultas
  - [x] 5.4 Implementar endpoint `GET /consultas/mis-consultas` (requiere auth) que retorna solo las del usuario
  - [x] 5.5 Implementar endpoint `GET /consultas/:id/hilo` con mensajes ordenados cronológicamente ascendente
  - [x] 5.6 Implementar endpoint `POST /consultas/:id/respuesta` (solo admin) que agrega mensaje y actualiza estado a `respondida`
  - [x] 5.7 Escribir tests unitarios para `crearConsulta`: token válido, inválido, propiedad inactiva, campos vacíos
  - [x] 5.8 Escribir property tests para mensajería (Propiedades 20-24)

- [x] 6. Panel de Administración (API)
  - [x] 6.1 Implementar endpoint `GET /admin/resumen` que retorna totales de propiedades activas, usuarios y consultas pendientes
  - [x] 6.2 Implementar endpoint `GET /admin/usuarios` que retorna listado de usuarios registrados
  - [x] 6.3 Verificar que todos los endpoints de admin validan rol `administrador` en cada request
  - [x] 6.4 Escribir tests de integración para flujo de administración: login admin → crear propiedad → marcar destacada → responder consulta

- [x] 7. Interfaz de Usuario — Páginas Públicas
  - [x] 7.1 Implementar layout base con encabezado (logo, botones login/registro) y pie de página (contacto, política de privacidad)
  - [x] 7.2 Implementar carrusel de propiedades destacadas con auto-scroll y navegación manual
  - [x] 7.3 Implementar menú de filtros por tipo (Ver todo, Comprar, Alquilar, Otros)
  - [x] 7.4 Implementar grilla de tarjetas de propiedades con datos públicos
  - [x] 7.5 Implementar página de detalle de propiedad con vista parcial para visitantes y prompt de login
  - [x] 7.6 Implementar lógica de recarga de datos sensibles tras login sin navegación adicional

- [x] 8. Interfaz de Usuario — Autenticación
  - [x] 8.1 Implementar formulario de registro con validación en cliente (email, contraseña mín. 8 chars)
  - [x] 8.2 Implementar formulario de login con manejo de errores genéricos
  - [x] 8.3 Implementar gestión de token JWT en cliente (almacenamiento, expiración, limpieza en logout)
  - [x] 8.4 Implementar redirección automática al login cuando el token expira o es inválido (401)

- [x] 9. Interfaz de Usuario — Área de Usuario Registrado
  - [x] 9.1 Implementar vista de detalle completo de propiedad para usuarios autenticados (con datos sensibles)
  - [x] 9.2 Implementar formulario de creación de consulta sobre una propiedad
  - [x] 9.3 Implementar vista de listado de mis consultas con estado de cada una
  - [x] 9.4 Implementar vista de hilo de consulta con mensajes ordenados cronológicamente

- [x] 10. Interfaz de Usuario — Panel de Administración
  - [x] 10.1 Implementar dashboard de administración con resumen de totales
  - [x] 10.2 Implementar CRUD de propiedades en el panel (crear, editar, eliminar, destacar)
  - [x] 10.3 Implementar subida de imágenes desde el panel de administración
  - [x] 10.4 Implementar listado de consultas pendientes con acceso al hilo y formulario de respuesta
  - [x] 10.5 Implementar listado de usuarios registrados

- [x] 11. Testing de Integración y E2E
  - [x] 11.1 Escribir test de integración: flujo completo visitante → registro → login → ver propiedad → crear consulta
  - [x] 11.2 Escribir test de integración: flujo admin → login → crear propiedad → marcar destacada → responder consulta
  - [x] 11.3 Verificar que el carrusel solo muestra propiedades con `destacada=true` y `activa=true`
  - [x] 11.4 Verificar que datos sensibles nunca aparecen en respuestas públicas (test de seguridad)

- [x] 12. Despliegue y Configuración Final
  - [x] 12.1 Configurar variables de entorno de producción (JWT secret, DB, storage)
  - [x] 12.2 Configurar caché para endpoint de propiedades destacadas (TTL 5 minutos)
  - [x] 12.3 Verificar configuración de CORS, headers de seguridad y HTTPS
  - [x] 12.4 Realizar despliegue en entorno de staging y ejecutar suite de tests completa
