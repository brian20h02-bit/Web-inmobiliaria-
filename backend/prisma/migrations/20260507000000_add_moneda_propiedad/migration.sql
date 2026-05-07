-- Add moneda field to Propiedad (USD or ARS, default USD)
ALTER TABLE "Propiedad" ADD COLUMN IF NOT EXISTS "moneda" TEXT NOT NULL DEFAULT 'USD';
