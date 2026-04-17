/*
  Warnings:

  - A unique constraint covering the columns `[usuarioId,adminId,propiedadId]` on the table `Conversacion` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Conversacion_usuarioId_adminId_key";

-- AlterTable
ALTER TABLE "Conversacion" ADD COLUMN     "propiedadId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Conversacion_usuarioId_adminId_propiedadId_key" ON "Conversacion"("usuarioId", "adminId", "propiedadId");

-- AddForeignKey
ALTER TABLE "Conversacion" ADD CONSTRAINT "Conversacion_propiedadId_fkey" FOREIGN KEY ("propiedadId") REFERENCES "Propiedad"("id") ON DELETE SET NULL ON UPDATE CASCADE;
