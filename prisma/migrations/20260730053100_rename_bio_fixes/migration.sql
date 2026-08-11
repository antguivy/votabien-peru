/*
  Warnings:

  - You are about to drop the column `model_name` on the `ai_workflow` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ai_workflow" RENAME CONSTRAINT "ai_agent_pkey" TO "ai_workflow_pkey";

ALTER TABLE "ai_workflow" DROP COLUMN "model_name",
ALTER COLUMN "compressor_prompt" DROP DEFAULT,
ALTER COLUMN "validator_prompt" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "ai_agent_status_idx" RENAME TO "ai_workflow_status_idx";
