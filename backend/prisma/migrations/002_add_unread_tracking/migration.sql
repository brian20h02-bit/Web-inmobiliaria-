-- AlterTable: Agregar campo leidoPorUsuario a Consulta
ALTER TABLE "Consulta"
ADD COLUMN "leidoPorUsuario" BOOLEAN NOT NULL DEFAULT FALSE;
