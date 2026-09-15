-- AlterTable triviatopic: Add has_factcheck column
ALTER TABLE "triviatopic" ADD COLUMN "has_factcheck" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable triviagame: Add secondary_sources column
ALTER TABLE "triviagame" ADD COLUMN "secondary_sources" JSON;
