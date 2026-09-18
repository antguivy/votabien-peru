-- AlterTable
ALTER TABLE "ai_workflow" ADD COLUMN "type" VARCHAR(50) NOT NULL DEFAULT 'CANDIDATE_RESEARCH';

-- CreateIndex
CREATE INDEX "ai_workflow_type_idx" ON "ai_workflow"("type");
