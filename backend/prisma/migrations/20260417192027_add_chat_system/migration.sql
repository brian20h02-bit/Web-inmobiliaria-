/*
  Warnings:

  - The primary key for the `Consulta` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Mensaje` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Propiedad` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `precio` on the `Propiedad` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - The primary key for the `Usuario` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Consulta" DROP CONSTRAINT "Consulta_propiedadId_fkey";

-- DropForeignKey
ALTER TABLE "Consulta" DROP CONSTRAINT "Consulta_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Mensaje" DROP CONSTRAINT "Mensaje_autorId_fkey";

-- DropForeignKey
ALTER TABLE "Mensaje" DROP CONSTRAINT "Mensaje_consultaId_fkey";

-- DropForeignKey
ALTER TABLE "Propiedad" DROP CONSTRAINT "Propiedad_administradorId_fkey";

-- DropIndex
DROP INDEX "Propiedad_activa_idx";

-- DropIndex
DROP INDEX "Propiedad_destacada_idx";

-- DropIndex
DROP INDEX "Propiedad_fechaPublicacion_idx";

-- DropIndex
DROP INDEX "Propiedad_tipo_idx";

-- AlterTable
ALTER TABLE "Consulta" DROP CONSTRAINT "Consulta_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "propiedadId" SET DATA TYPE TEXT,
ALTER COLUMN "usuarioId" SET DATA TYPE TEXT,
ALTER COLUMN "fechaCreacion" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "Consulta_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Mensaje" DROP CONSTRAINT "Mensaje_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "consultaId" SET DATA TYPE TEXT,
ALTER COLUMN "autorId" SET DATA TYPE TEXT,
ALTER COLUMN "fecha" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "Mensaje_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Propiedad" DROP CONSTRAINT "Propiedad_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "precio" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "imagenes" DROP DEFAULT,
ALTER COLUMN "fechaPublicacion" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "administradorId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Propiedad_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "fechaRegistro" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "Conversacion" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualiza" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensajeChat" (
    "id" TEXT NOT NULL,
    "conversacionId" TEXT NOT NULL,
    "emisorId" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MensajeChat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversacion_usuarioId_adminId_key" ON "Conversacion"("usuarioId", "adminId");

-- CreateIndex
CREATE INDEX "MensajeChat_conversacionId_idx" ON "MensajeChat"("conversacionId");

-- CreateIndex
CREATE INDEX "MensajeChat_emisorId_idx" ON "MensajeChat"("emisorId");

-- AddForeignKey
ALTER TABLE "Propiedad" ADD CONSTRAINT "Propiedad_administradorId_fkey" FOREIGN KEY ("administradorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consulta" ADD CONSTRAINT "Consulta_propiedadId_fkey" FOREIGN KEY ("propiedadId") REFERENCES "Propiedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consulta" ADD CONSTRAINT "Consulta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "Consulta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversacion" ADD CONSTRAINT "Conversacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversacion" ADD CONSTRAINT "Conversacion_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensajeChat" ADD CONSTRAINT "MensajeChat_conversacionId_fkey" FOREIGN KEY ("conversacionId") REFERENCES "Conversacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensajeChat" ADD CONSTRAINT "MensajeChat_emisorId_fkey" FOREIGN KEY ("emisorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
