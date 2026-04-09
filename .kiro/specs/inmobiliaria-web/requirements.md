# Documento de Requisitos

## Introducción

La plataforma web inmobiliaria es una aplicación orientada a la venta y alquiler de propiedades. Permite a visitantes explorar propiedades públicamente, mientras que los datos sensibles (ubicación exacta, precio, contacto) quedan restringidos a usuarios registrados. Incluye un sistema de mensajería interna entre usuarios y el administrador, y un panel de administración completo para gestionar propiedades y consultas.

El flujo principal es: exploración pública → registro/login → acceso a datos sensibles → consulta al administrador.

---

## Glosario

- **Sistema**: La plataforma web inmobiliaria en su conjunto.
- **API**: El servidor de API REST que procesa las solicitudes del cliente.
- **Autenticador**: El módulo de autenticación responsable de gestionar registro, login y tokens.
- **ModuloPropiedades**: El módulo responsable de gestionar el ciclo de vida de las propiedades.
- **ModuloMensajeria**: El módulo responsable de gestionar consultas y mensajes entre usuarios y el administrador.
- **PanelAdmin**: El módulo de panel de administración accesible solo para administradores.
- **Visitante**: Usuario no autenticado que accede a la plataforma.
- **Usuario**: Persona registrada y autenticada en la plataforma con rol `usuario`.
- **Administrador**: Usuario con rol `administrador` con acceso completo al panel de gestión.
- **Propiedad**: Inmueble publicado en la plataforma con datos públicos y datos sensibles.
- **Consulta**: Mensaje enviado por un usuario registrado al administrador sobre una propiedad específica.
- **Token**: JWT (JSON Web Token) firmado que identifica y autentica a un usuario.
- **DatosSensibles**: Información de una propiedad restringida a usuarios autenticados: precio, ubicación y contacto.
- **DatosPublicos**: Información de una propiedad visible para todos: título, descripción pública, tipo e imágenes.

---

## Requisitos

### Requisito 1: Registro de Usuarios

**Historia de Usuario:** Como visitante, quiero crear una cuenta en la plataforma, para poder acceder a los datos completos de las propiedades y enviar consultas.

#### Criterios de Aceptación

1. WHEN un visitante envía un formulario de registro con nombre, email y contraseña válidos, THE Autenticador SHALL crear una cuenta con rol `usuario` y retornar un token de sesión.
2. WHEN un visitante intenta registrarse con un email ya existente, THE Autenticador SHALL retornar un error indicando que el email ya está en uso.
3. WHEN un visitante envía una contraseña con menos de 8 caracteres, THE Autenticador SHALL rechazar el registro e indicar el requisito mínimo de longitud.
4. WHEN un visitante envía un email con formato inválido, THE Autenticador SHALL rechazar el registro e indicar el error de formato.
5. THE Autenticador SHALL almacenar la contraseña hasheada con bcrypt con un mínimo de 12 salt rounds, nunca en texto plano.
6. WHEN un visitante se registra exitosamente, THE Autenticador SHALL asignar el rol `usuario` por defecto.

---

### Requisito 2: Autenticación de Usuarios

**Historia de Usuario:** Como usuario registrado, quiero iniciar sesión en la plataforma, para acceder a los datos sensibles de las propiedades y gestionar mis consultas.

#### Criterios de Aceptación

1. WHEN un usuario envía credenciales válidas (email y contraseña correctos), THE Autenticador SHALL retornar un token JWT firmado con expiración de 7 días.
2. WHEN un usuario envía credenciales incorrectas, THE Autenticador SHALL retornar un error genérico sin revelar cuál campo es incorrecto.
3. WHEN un usuario intenta autenticarse con una cuenta desactivada, THE Autenticador SHALL retornar un error indicando que la cuenta está desactivada.
4. WHEN un usuario envía email o contraseña vacíos, THE Autenticador SHALL retornar un error indicando que las credenciales son incompletas.
5. THE Autenticador SHALL firmar el token JWT con una clave secreta almacenada en variables de entorno.
6. WHEN un usuario cierra sesión, THE Autenticador SHALL invalidar el token en el cliente.

---

### Requisito 3: Control de Acceso por Roles

**Historia de Usuario:** Como sistema, quiero controlar el acceso a recursos según el rol del usuario, para proteger los datos sensibles y las funciones administrativas.

#### Criterios de Aceptación

1. WHEN una solicitud incluye un token JWT válido, THE Autenticador SHALL verificar el token y extraer el payload con id, email y rol del usuario.
2. WHEN una solicitud incluye un token JWT expirado o inválido, THE API SHALL retornar un error 401 y la interfaz SHALL redirigir al login limpiando el token local.
3. WHEN una solicitud a una ruta de administración no incluye un token con rol `administrador`, THE API SHALL retornar un error 403.
4. THE API SHALL validar el rol del usuario en cada solicitud a rutas protegidas, sin depender únicamente del estado del cliente.

---

### Requisito 4: Exploración Pública de Propiedades

**Historia de Usuario:** Como visitante, quiero explorar propiedades disponibles sin necesidad de registrarme, para evaluar si la plataforma tiene lo que busco.

#### Criterios de Aceptación

1. WHEN un visitante accede a la página principal, THE ModuloPropiedades SHALL retornar la lista de propiedades destacadas con datos públicos únicamente.
2. WHEN un visitante solicita el listado de propiedades, THE ModuloPropiedades SHALL retornar solo propiedades con estado `activa = true`.
3. WHEN un visitante solicita el detalle de una propiedad sin token, THE ModuloPropiedades SHALL retornar únicamente los datos públicos (título, descripción pública, tipo, imágenes).
4. THE ModuloPropiedades SHALL nunca incluir precio, ubicación, contacto ni descripción privada en respuestas a solicitudes sin token válido.
5. WHEN un visitante filtra propiedades por tipo (venta, alquiler, otro), THE ModuloPropiedades SHALL retornar solo las propiedades activas que coincidan con el tipo seleccionado.
6. THE ModuloPropiedades SHALL retornar el listado de propiedades paginado con un máximo de 12 propiedades por página por defecto, ordenadas por fecha de publicación descendente.

---

### Requisito 5: Acceso a Datos Sensibles de Propiedades

**Historia de Usuario:** Como usuario registrado, quiero ver el precio, la ubicación y el contacto de una propiedad, para poder tomar decisiones informadas y comunicarme con el vendedor.

#### Criterios de Aceptación

1. WHEN un usuario autenticado solicita el detalle de una propiedad con token válido, THE ModuloPropiedades SHALL retornar los datos completos incluyendo precio, ubicación, contacto y descripción privada.
2. WHEN un usuario autenticado solicita una propiedad inexistente, THE ModuloPropiedades SHALL retornar un error 404 con mensaje descriptivo.
3. WHEN un usuario autenticado solicita una propiedad con `activa = false`, THE ModuloPropiedades SHALL retornar un error 403 indicando que la propiedad no está disponible.
4. THE ModuloPropiedades SHALL retornar los datos sensibles únicamente cuando el token JWT sea válido y no esté expirado.

---

### Requisito 6: Carrusel de Propiedades Destacadas

**Historia de Usuario:** Como visitante, quiero ver un carrusel de propiedades destacadas en la página principal, para descubrir rápidamente las propiedades más relevantes.

#### Criterios de Aceptación

1. WHEN un visitante accede a la página principal, THE Sistema SHALL mostrar un carrusel con las propiedades que tienen `destacada = true` y `activa = true`.
2. THE Sistema SHALL avanzar el carrusel automáticamente y permitir navegación manual con controles anterior/siguiente.
3. WHEN no existen propiedades destacadas activas, THE Sistema SHALL mostrar el listado general de propiedades en lugar del carrusel.

---

### Requisito 7: Gestión de Propiedades por el Administrador

**Historia de Usuario:** Como administrador, quiero crear, editar, publicar y eliminar propiedades, para mantener actualizado el catálogo de la plataforma.

#### Criterios de Aceptación

1. WHEN un administrador crea una propiedad con título, descripción pública, tipo, precio, ubicación, contacto y al menos una imagen, THE ModuloPropiedades SHALL persistir la propiedad con estado `activa = true`.
2. WHEN un administrador intenta crear una propiedad sin título, THE ModuloPropiedades SHALL rechazar la operación e indicar que el título es requerido.
3. WHEN un administrador intenta crear una propiedad con precio igual o menor a 0, THE ModuloPropiedades SHALL rechazar la operación e indicar que el precio debe ser mayor a 0.
4. WHEN un administrador intenta publicar una propiedad sin imágenes, THE ModuloPropiedades SHALL rechazar la operación e indicar que se requiere al menos una imagen.
5. WHEN un administrador actualiza una propiedad existente, THE ModuloPropiedades SHALL persistir los cambios y retornar la propiedad actualizada.
6. WHEN un administrador elimina una propiedad, THE ModuloPropiedades SHALL marcarla como `activa = false` y dejar de incluirla en los listados públicos.
7. WHEN un administrador marca una propiedad como destacada, THE ModuloPropiedades SHALL actualizar el campo `destacada = true` y la propiedad SHALL aparecer en el carrusel de la página principal.

---

### Requisito 8: Sistema de Consultas

**Historia de Usuario:** Como usuario registrado, quiero enviar consultas sobre propiedades al administrador, para obtener información adicional o coordinar una visita.

#### Criterios de Aceptación

1. WHEN un usuario autenticado envía una consulta con asunto, mensaje y propiedad_id válidos, THE ModuloMensajeria SHALL crear la consulta con estado `pendiente` e incluir el primer mensaje en el hilo.
2. WHEN un usuario no autenticado intenta crear una consulta, THE ModuloMensajeria SHALL retornar un error 401.
3. WHEN un usuario intenta crear una consulta sobre una propiedad inexistente o inactiva, THE ModuloMensajeria SHALL retornar un error 404.
4. WHEN un usuario intenta crear una segunda consulta abierta sobre la misma propiedad, THE ModuloMensajeria SHALL retornar un error 409 indicando que ya existe una consulta activa.
5. WHEN un usuario autenticado solicita sus consultas, THE ModuloMensajeria SHALL retornar únicamente las consultas asociadas a ese usuario.
6. WHEN un usuario envía una consulta con asunto o mensaje vacíos, THE ModuloMensajeria SHALL rechazar la operación e indicar los campos requeridos.

---

### Requisito 9: Gestión de Consultas por el Administrador

**Historia de Usuario:** Como administrador, quiero ver y responder todas las consultas de los usuarios, para brindar atención personalizada sobre las propiedades.

#### Criterios de Aceptación

1. WHEN un administrador solicita el listado de consultas, THE ModuloMensajeria SHALL retornar todas las consultas de todos los usuarios ordenadas cronológicamente.
2. WHEN un administrador responde una consulta, THE ModuloMensajeria SHALL agregar el mensaje al hilo de la consulta y actualizar el estado a `respondida`.
3. WHEN un usuario no administrador intenta acceder al listado completo de consultas, THE ModuloMensajeria SHALL retornar un error 403.
4. WHEN un administrador obtiene el hilo de una consulta, THE ModuloMensajeria SHALL retornar todos los mensajes ordenados cronológicamente de forma ascendente.

---

### Requisito 10: Panel de Administración

**Historia de Usuario:** Como administrador, quiero acceder a un panel centralizado, para gestionar propiedades, usuarios y consultas desde un único lugar.

#### Criterios de Aceptación

1. WHEN un administrador accede al panel, THE PanelAdmin SHALL mostrar un resumen con el total de propiedades activas, usuarios registrados y consultas pendientes.
2. WHEN un usuario sin rol `administrador` intenta acceder al panel, THE PanelAdmin SHALL redirigir al login o mostrar un error 403.
3. THE PanelAdmin SHALL permitir al administrador realizar operaciones CRUD completas sobre propiedades desde el panel.
4. THE PanelAdmin SHALL mostrar al administrador el listado de consultas pendientes con acceso al hilo de cada una.

---

### Requisito 11: Interfaz de Usuario Pública

**Historia de Usuario:** Como visitante, quiero una interfaz clara y moderna, para explorar propiedades de forma intuitiva sin distracciones visuales.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar en la página principal: encabezado con logo y accesos a login/registro, carrusel de destacadas, menú de filtros por tipo, grilla de propiedades y pie de página con datos de contacto.
2. WHEN un visitante hace clic en "Ver más" en una tarjeta de propiedad sin estar autenticado, THE Sistema SHALL mostrar el detalle parcial de la propiedad y un prompt invitando al login o registro.
3. WHEN un usuario autenticado hace clic en "Ver más" en una tarjeta de propiedad, THE Sistema SHALL mostrar el detalle completo incluyendo datos sensibles sin requerir navegación adicional.
4. THE Sistema SHALL aplicar rate limiting en los endpoints de login y registro para prevenir ataques de fuerza bruta.

---

### Requisito 12: Rendimiento y Caché

**Historia de Usuario:** Como usuario, quiero que la plataforma responda rápidamente, para tener una experiencia de navegación fluida.

#### Criterios de Aceptación

1. THE Sistema SHALL cachear el listado de propiedades destacadas con un TTL máximo de 5 minutos para reducir consultas frecuentes a la base de datos.
2. THE Sistema SHALL servir las imágenes de propiedades desde almacenamiento externo (CDN o bucket) con URLs firmadas.
3. THE Sistema SHALL mantener índices en la base de datos sobre los campos `activa`, `tipo`, `destacada` y `fecha_publicacion` para optimizar las consultas de listado.
