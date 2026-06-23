-- AlterTable
ALTER TABLE "seatparliamentary" ADD COLUMN     "legislative_period_id" VARCHAR;

-- CreateTable
CREATE TABLE "legislativeperiod" (
    "id" VARCHAR NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legislativeperiod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "legislativeperiod_active_idx" ON "legislativeperiod"("active");

-- CreateIndex
CREATE INDEX "ix_seatparliamentary_period_id" ON "seatparliamentary"("legislative_period_id");

-- AddForeignKey
ALTER TABLE "seatparliamentary" ADD CONSTRAINT "seatparliamentary_legislative_period_id_fkey" FOREIGN KEY ("legislative_period_id") REFERENCES "legislativeperiod"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
