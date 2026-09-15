-- AlterTable triviatopic: Add is_regional column
ALTER TABLE "triviatopic" ADD COLUMN "is_regional" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable triviagame: Add electoral_district_id column
ALTER TABLE "triviagame" ADD COLUMN "electoral_district_id" VARCHAR;

-- CreateIndex
CREATE INDEX "triviagame_electoral_district_id_idx" ON "triviagame"("electoral_district_id");

-- AddForeignKey
ALTER TABLE "triviagame" ADD CONSTRAINT "triviagame_electoral_district_id_fkey" FOREIGN KEY ("electoral_district_id") REFERENCES "electoraldistrict"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
