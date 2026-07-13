-- CreateEnum
CREATE TYPE "alerttype" AS ENUM ('TRANSFUGA_DETECTED', 'SCRAPER_ERROR', 'SYSTEM_INFO');

-- CreateEnum
CREATE TYPE "alertstatus" AS ENUM ('PENDING', 'RESOLVED', 'IGNORED', 'SNOOZED');

-- CreateTable
CREATE TABLE "systemalert" (
    "id" VARCHAR NOT NULL,
    "type" "alerttype" NOT NULL,
    "status" "alertstatus" NOT NULL DEFAULT 'PENDING',
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSON,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "systemalert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "systemalert_status_idx" ON "systemalert"("status");

-- CreateIndex
CREATE INDEX "systemalert_type_idx" ON "systemalert"("type");

-- CreateIndex
CREATE INDEX "systemalert_created_at_idx" ON "systemalert"("created_at");
