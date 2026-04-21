-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "favoritos" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "guardados" JSONB NOT NULL DEFAULT '[]';
