-- CreateEnum
CREATE TYPE "districtlevel" AS ENUM ('NACIONAL', 'REGIONAL', 'PROVINCIAL', 'DISTRITAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "candidacystatus" ADD VALUE 'ADMITIDO';
ALTER TYPE "candidacystatus" ADD VALUE 'PUBLICADO_PARA_TACHAS';
ALTER TYPE "candidacystatus" ADD VALUE 'TACHA_EN_TRAMITE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "candidacytype" ADD VALUE 'GOBERNADOR_REGIONAL';
ALTER TYPE "candidacytype" ADD VALUE 'VICEGOBERNADOR_REGIONAL';
ALTER TYPE "candidacytype" ADD VALUE 'CONSEJERO_REGIONAL';
ALTER TYPE "candidacytype" ADD VALUE 'ALCALDE_PROVINCIAL';
ALTER TYPE "candidacytype" ADD VALUE 'REGIDOR_PROVINCIAL';
ALTER TYPE "candidacytype" ADD VALUE 'ALCALDE_DISTRITAL';
ALTER TYPE "candidacytype" ADD VALUE 'REGIDOR_DISTRITAL';

-- AlterEnum
ALTER TYPE "organizationtype" ADD VALUE 'MOVIMIENTO_REGIONAL';

-- DropIndex
DROP INDEX "ix_electoraldistrict_name";

-- AlterTable
ALTER TABLE "electoraldistrict" ADD COLUMN     "level" "districtlevel" NOT NULL DEFAULT 'NACIONAL',
ADD COLUMN     "parent_id" VARCHAR;

-- AlterTable
ALTER TABLE "politicalparty" ADD COLUMN     "scope_district_id" VARCHAR;

-- CreateIndex
CREATE INDEX "idx_candidate_process_type_list" ON "candidate"("electoral_process_id", "type", "list_number");

-- CreateIndex
CREATE UNIQUE INDEX "ix_electoraldistrict_name_parent" ON "electoraldistrict"("name", "parent_id");

-- AddForeignKey
ALTER TABLE "electoraldistrict" ADD CONSTRAINT "electoraldistrict_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "electoraldistrict"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "politicalparty" ADD CONSTRAINT "politicalparty_scope_district_id_fkey" FOREIGN KEY ("scope_district_id") REFERENCES "electoraldistrict"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

