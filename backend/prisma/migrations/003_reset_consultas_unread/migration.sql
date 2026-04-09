-- Reset all consultas to unread
UPDATE "Consulta" SET "leidoPorAdmin" = false WHERE "leidoPorAdmin" = true;
