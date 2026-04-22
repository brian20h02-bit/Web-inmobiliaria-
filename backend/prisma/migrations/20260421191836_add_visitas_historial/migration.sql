-- AlterTable
ALTER TABLE "Propiedad" ADD COLUMN     "visitas" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "historial" JSONB NOT NULL DEFAULT '[]';
