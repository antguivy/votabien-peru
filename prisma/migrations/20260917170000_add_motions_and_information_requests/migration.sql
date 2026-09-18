-- CreateTable motion
CREATE TABLE "motion" (
    "id" VARCHAR NOT NULL,
    "number" VARCHAR(50) NOT NULL,
    "chamber" "chambertype" NOT NULL,
    "period" VARCHAR(50),
    "legislative_session" VARCHAR(150),
    "submission_date" TIMESTAMPTZ(6) NOT NULL,
    "motion_type" VARCHAR(150) NOT NULL,
    "is_greeting" BOOLEAN NOT NULL DEFAULT false,
    "purpose" VARCHAR(255),
    "procedural_status" VARCHAR(200),
    "summary" TEXT NOT NULL,
    "observations" TEXT,
    "coauthors_raw" TEXT,
    "adherents_raw" TEXT,
    "document_url" VARCHAR,
    "legislator_id" VARCHAR,
    "parliamentary_group_id" VARCHAR,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "motion_pkey" PRIMARY KEY ("id")
);

-- CreateTable information_request
CREATE TABLE "information_request" (
    "id" VARCHAR NOT NULL,
    "number" VARCHAR(50) NOT NULL,
    "chamber" "chambertype" NOT NULL,
    "period" VARCHAR(50),
    "legislative_year" VARCHAR(20),
    "legislative_session" VARCHAR(150),
    "document_code" VARCHAR(100),
    "document_date" DATE,
    "origin" VARCHAR(100),
    "summary" TEXT NOT NULL,
    "target_entity" VARCHAR(255) NOT NULL,
    "target_position" VARCHAR(150),
    "target_person" VARCHAR(200),
    "reception_date" DATE,
    "due_date" DATE,
    "coauthors_raw" TEXT,
    "document_url" VARCHAR,
    "legislator_id" VARCHAR,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "information_request_pkey" PRIMARY KEY ("id")
);

-- AlterTable legislatormetrics
ALTER TABLE "legislatormetrics" ADD COLUMN "total_motions" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "legislatormetrics" ADD COLUMN "motions_greeting" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "legislatormetrics" ADD COLUMN "motions_interpellation" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "legislatormetrics" ADD COLUMN "motions_censure" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "legislatormetrics" ADD COLUMN "total_information_requests" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "legislatormetrics" ADD COLUMN "top_committees" JSONB DEFAULT '[]'::jsonb;

-- CreateIndex for motion
CREATE UNIQUE INDEX "motion_number_key" ON "motion"("number");
CREATE INDEX "motion_chamber_is_greeting_idx" ON "motion"("chamber", "is_greeting");
CREATE INDEX "motion_legislator_id_idx" ON "motion"("legislator_id");
CREATE INDEX "motion_parliamentary_group_id_idx" ON "motion"("parliamentary_group_id");
CREATE INDEX "motion_period_idx" ON "motion"("period");
CREATE INDEX "motion_motion_type_idx" ON "motion"("motion_type");
CREATE INDEX "motion_submission_date_idx" ON "motion"("submission_date");

-- CreateIndex for information_request
CREATE UNIQUE INDEX "information_request_number_key" ON "information_request"("number");
CREATE INDEX "information_request_legislator_id_idx" ON "information_request"("legislator_id");
CREATE INDEX "information_request_chamber_idx" ON "information_request"("chamber");
CREATE INDEX "information_request_period_idx" ON "information_request"("period");
CREATE INDEX "information_request_target_entity_idx" ON "information_request"("target_entity");
CREATE INDEX "information_request_document_date_idx" ON "information_request"("document_date");

-- AddForeignKey for motion
ALTER TABLE "motion" ADD CONSTRAINT "motion_legislator_id_fkey" FOREIGN KEY ("legislator_id") REFERENCES "legislator"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "motion" ADD CONSTRAINT "motion_parliamentary_group_id_fkey" FOREIGN KEY ("parliamentary_group_id") REFERENCES "parliamentarygroup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey for information_request
ALTER TABLE "information_request" ADD CONSTRAINT "information_request_legislator_id_fkey" FOREIGN KEY ("legislator_id") REFERENCES "legislator"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
