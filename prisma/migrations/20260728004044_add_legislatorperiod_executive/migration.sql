-- AlterTable
ALTER TABLE "executive" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "legislative_period_id" VARCHAR;

-- CreateIndex
CREATE INDEX "ix_executive_period_id" ON "executive"("legislative_period_id");

-- AddForeignKey
ALTER TABLE "executive" ADD CONSTRAINT "executive_legislative_period_id_fkey" FOREIGN KEY ("legislative_period_id") REFERENCES "legislativeperiod"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
