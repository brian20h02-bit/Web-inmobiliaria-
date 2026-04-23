-- Migration: 002_auth_improvements
-- Adds email verification, Google OAuth fields, and makes passwordHash optional

-- Make passwordHash optional (for Google-only users)
ALTER TABLE "Usuario" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Add new auth columns
ALTER TABLE "Usuario"
  ADD COLUMN "emailVerified"           BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN "verificationToken"       TEXT,
  ADD COLUMN "verificationTokenExpiry" TIMESTAMP(3),
  ADD COLUMN "provider"                TEXT         NOT NULL DEFAULT 'email',
  ADD COLUMN "googleId"                TEXT,
  ADD COLUMN "foto"                    TEXT;

-- Existing users are already verified (no email was sent to them)
UPDATE "Usuario" SET "emailVerified" = true;

-- Unique constraints
CREATE UNIQUE INDEX "Usuario_verificationToken_key" ON "Usuario"("verificationToken");
CREATE UNIQUE INDEX "Usuario_googleId_key"           ON "Usuario"("googleId");
