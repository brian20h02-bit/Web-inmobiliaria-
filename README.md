# Inmobiliaria Web

Aplicación full-stack para gestión y publicación de propiedades inmobiliarias.

## Requisitos previos

- Node.js 18+
- PostgreSQL 14+
- Cuenta en [Cloudinary](https://cloudinary.com) (para imágenes)

## Instalación

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

## Configuración

```bash
# Backend
cp backend/.env.example backend/.env
# Editar backend/.env con tus valores reales

# Frontend
cp frontend/.env.example frontend/.env
# Editar frontend/.env con la URL del backend
```

Variables clave en `backend/.env`:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL |
| `JWT_SECRET` | Mínimo 32 caracteres en producción |
| `CORS_ORIGIN` | Dominio del frontend (ej: `https://midominio.com`) |
| `CLOUDINARY_*` | Credenciales de Cloudinary |

## Base de datos

```bash
cd backend

# Ejecutar migraciones
npx prisma migrate deploy

# Cargar datos iniciales
npx prisma db seed
```

## Desarrollo

```bash
# Backend (puerto 3001)
cd backend && npm run dev

# Frontend (puerto 5173)
cd frontend && npm run dev
```

## Tests

```bash
cd backend

# Ejecutar suite completa
npm test

# Con cobertura
npm run test -- --coverage
```

Los tests requieren una base de datos PostgreSQL disponible (usa `DATABASE_URL` del `.env`).

## Estructura del proyecto

```
├── backend/
│   ├── prisma/          # Schema y migraciones
│   ├── src/
│   │   ├── controllers/ # Lógica de negocio
│   │   ├── lib/         # Prisma, Cloudinary, caché
│   │   ├── middleware/  # Auth, upload
│   │   ├── routes/      # Definición de rutas
│   │   └── tests/       # Tests de integración
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/  # Componentes reutilizables
    │   ├── context/     # AuthContext
    │   ├── lib/         # Cliente API, helpers auth
    │   └── pages/       # Vistas y páginas admin
    └── .env.example
```
