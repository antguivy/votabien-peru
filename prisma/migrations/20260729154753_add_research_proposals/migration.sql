-- AlterTable
ALTER TABLE "background" ADD COLUMN     "previous_version" JSONB;

-- CreateTable
CREATE TABLE "research_proposals" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "batch_run_id" TEXT,
    "target_id" TEXT,
    "action" TEXT NOT NULL,
    "proposed_data" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,

    CONSTRAINT "research_proposals_pkey" PRIMARY KEY ("id")
);
