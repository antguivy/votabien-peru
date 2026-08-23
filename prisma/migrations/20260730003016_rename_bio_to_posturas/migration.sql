
ALTER TABLE "person" RENAME COLUMN "detailed_biography" TO "posturas";

ALTER TABLE "ai_agent" RENAME TO "ai_workflow";
ALTER TABLE "ai_workflow" DROP COLUMN "system_prompt";
ALTER TABLE "ai_workflow" DROP COLUMN "tools";
ALTER TABLE "ai_workflow" DROP COLUMN "model_provider";
ALTER TABLE "ai_workflow" DROP COLUMN "temperature";
ALTER TABLE "ai_workflow" ADD COLUMN "sources" TEXT[];
ALTER TABLE "ai_workflow" ADD COLUMN "compressor_prompt" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ai_workflow" ADD COLUMN "compressor_model" TEXT NOT NULL DEFAULT 'gemini-2.5-flash';
ALTER TABLE "ai_workflow" ADD COLUMN "validator_prompt" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ai_workflow" ADD COLUMN "validator_model" TEXT NOT NULL DEFAULT 'gemini-2.5-flash';
