-- CreateEnum
CREATE TYPE "mediascope" AS ENUM ('NACIONAL', 'REGIONAL', 'LOCAL');

-- CreateTable
CREATE TABLE "press_source" (
    "id" VARCHAR NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "domain" VARCHAR(100) NOT NULL,
    "scope" "mediascope" NOT NULL DEFAULT 'REGIONAL',
    "electoraldistrict_id" VARCHAR,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "press_source_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "press_source_domain_key" ON "press_source"("domain");

-- CreateIndex
CREATE INDEX "press_source_scope_idx" ON "press_source"("scope");

-- CreateIndex
CREATE INDEX "press_source_electoraldistrict_id_idx" ON "press_source"("electoraldistrict_id");

-- CreateIndex
CREATE INDEX "press_source_active_idx" ON "press_source"("active");

-- AddForeignKey
ALTER TABLE "press_source" ADD CONSTRAINT "press_source_electoraldistrict_id_fkey" FOREIGN KEY ("electoraldistrict_id") REFERENCES "electoraldistrict"("id") ON DELETE SET NULL ON UPDATE CASCADE;
