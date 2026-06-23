-- AlterTable
ALTER TABLE "seatparliamentary" ADD COLUMN     "parliamentary_group_id" VARCHAR;

-- CreateIndex
CREATE INDEX "ix_seatparliamentary_group_id" ON "seatparliamentary"("parliamentary_group_id");

-- AddForeignKey
ALTER TABLE "seatparliamentary" ADD CONSTRAINT "seatparliamentary_parliamentary_group_id_fkey" FOREIGN KEY ("parliamentary_group_id") REFERENCES "parliamentarygroup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
