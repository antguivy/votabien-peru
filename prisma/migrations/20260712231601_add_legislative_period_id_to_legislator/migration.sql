-- AlterTable
ALTER TABLE "legislator" ADD COLUMN     "legislative_period_id" VARCHAR;

-- AddForeignKey
ALTER TABLE "legislator" ADD CONSTRAINT "legislator_legislative_period_id_fkey" FOREIGN KEY ("legislative_period_id") REFERENCES "legislativeperiod"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
