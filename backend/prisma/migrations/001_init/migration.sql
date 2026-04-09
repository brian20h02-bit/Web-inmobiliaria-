-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('USUARIO', 'ADMINISTRADOR');

-- CreateEnum
CREATE TYPE "TipoPropiedad" AS ENUM ('VENTA', 'ALQUILER', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoConsulta" AS ENUM ('PENDIENTE', 'RESPONDIDA', 'CERRADA');

-- CreateTable: Usuario
CREATE TABLE "Usuario" (
    "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
    "nombre"        TEXT        NOT NULL,
    "email"         TEXT        NOT NULL,
    "passwordHash"  TEXT        NOT NULL,
    "rol"           "Rol"       NOT NULL DEFAULT 'USUARIO',
    "fechaRegistro" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "activo"        BOOLEAN     NOT NULL DEFAULT TRUE,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: email único en Usuario
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateTable: Propiedad
CREATE TABLE "Propiedad" (
    "id"                 UUID            NOT NULL DEFAULT gen_random_uuid(),
    "titulo"             TEXT            NOT NULL,
    "descripcionPublica" TEXT            NOT NULL,
    "descripcionPrivada" TEXT,
    "tipo"               "TipoPropiedad" NOT NULL,
    "precio"             DECIMAL         NOT NULL,
    "ubicacion"          TEXT            NOT NULL,
    "contacto"           TEXT            NOT NULL,
    "imagenes"           TEXT[]          NOT NULL DEFAULT '{}',
    "destacada"          BOOLEAN         NOT NULL DEFAULT FALSE,
    "activa"             BOOLEAN         NOT NULL DEFAULT TRUE,
    "fechaPublicacion"   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    "administradorId"    UUID            NOT NULL,

    CONSTRAINT "Propiedad_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: Propiedad → Usuario
ALTER TABLE "Propiedad"
    ADD CONSTRAINT "Propiedad_administradorId_fkey"
    FOREIGN KEY ("administradorId") REFERENCES "Usuario"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: Consulta
CREATE TABLE "Consulta" (
    "id"            UUID             NOT NULL DEFAULT gen_random_uuid(),
    "propiedadId"   UUID             NOT NULL,
    "usuarioId"     UUID             NOT NULL,
    "asunto"        TEXT             NOT NULL,
    "estado"        "EstadoConsulta" NOT NULL DEFAULT 'PENDIENTE',
    "fechaCreacion" TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

    CONSTRAINT "Consulta_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: Consulta → Propiedad
ALTER TABLE "Consulta"
    ADD CONSTRAINT "Consulta_propiedadId_fkey"
    FOREIGN KEY ("propiedadId") REFERENCES "Propiedad"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Consulta → Usuario
ALTER TABLE "Consulta"
    ADD CONSTRAINT "Consulta_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: Mensaje
CREATE TABLE "Mensaje" (
    "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
    "consultaId" UUID        NOT NULL,
    "autorId"    UUID        NOT NULL,
    "contenido"  TEXT        NOT NULL,
    "fecha"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "Mensaje_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: Mensaje → Consulta
ALTER TABLE "Mensaje"
    ADD CONSTRAINT "Mensaje_consultaId_fkey"
    FOREIGN KEY ("consultaId") REFERENCES "Consulta"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Mensaje → Usuario
ALTER TABLE "Mensaje"
    ADD CONSTRAINT "Mensaje_autorId_fkey"
    FOREIGN KEY ("autorId") REFERENCES "Usuario"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex: índices en Propiedad
CREATE INDEX "Propiedad_activa_idx"           ON "Propiedad"("activa");
CREATE INDEX "Propiedad_tipo_idx"             ON "Propiedad"("tipo");
CREATE INDEX "Propiedad_destacada_idx"        ON "Propiedad"("destacada");
CREATE INDEX "Propiedad_fechaPublicacion_idx" ON "Propiedad"("fechaPublicacion");
