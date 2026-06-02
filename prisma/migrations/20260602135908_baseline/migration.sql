CREATE EXTENSION IF NOT EXISTS vector;
-- CreateEnum
CREATE TYPE "attendancestatus" AS ENUM ('ASISTENCIA', 'FALTA', 'FALTA_JUSTIFICADA', 'TARDANZA', 'LICENCIA', 'COMISION_OFICIAL');

-- CreateEnum
CREATE TYPE "billapprovalstatus" AS ENUM ('PRESENTADO', 'EN_COMISION', 'DICTAMEN', 'EN_AGENDA_PLENO', 'ORDEN_DEL_DIA', 'EN_CUARTO_INTERMEDIO', 'APROBADO_PRIMERA_VOTACION', 'PENDIENTE_SEGUNDA_VOTACION', 'APROBADO', 'AUTOGRAFA', 'PUBLICADO', 'EN_RECONSIDERACION', 'RETORNA_A_COMISION', 'AL_ARCHIVO', 'DECRETO_ARCHIVO', 'RETIRADO_POR_AUTOR');

-- CreateEnum
CREATE TYPE "chambertype" AS ENUM ('CONGRESO', 'SENADO', 'DIPUTADOS');

-- CreateEnum
CREATE TYPE "endoftermreason" AS ENUM ('RENUNCIA', 'REMOCION', 'FALLECIMIENTO', 'VACANCIA', 'PERIODO_FINALIZADO', 'DESCONOCIDO');

-- CreateEnum
CREATE TYPE "executiverole" AS ENUM ('PRESIDENTE', 'VICEPRESIDENTE', 'PRIMER_MINISTRO', 'MINISTRO');

-- CreateEnum
CREATE TYPE "sessiontype" AS ENUM ('PLENO', 'COMISION_PERMANENTE', 'COMISION_ORDINARIA', 'EXTRAORDINARIA');

-- CreateEnum
CREATE TYPE "backgroundstatus" AS ENUM ('EN_INVESTIGACION', 'SENTENCIADO', 'SANCIONADO', 'ARCHIVADO', 'ABSUELTO', 'PRESCRITO');

-- CreateEnum
CREATE TYPE "backgroundtype" AS ENUM ('PENAL', 'ETICA', 'CIVIL', 'ADMINISTRATIVO');

-- CreateEnum
CREATE TYPE "candidacystatus" AS ENUM ('SOLICITUD_INSCRIPCION', 'INSCRITO', 'TACHADO', 'EXCLUIDO', 'IMPROCEDENTE', 'RENUNCIA', 'APELACION');

-- CreateEnum
CREATE TYPE "candidacytype" AS ENUM ('PRESIDENTE', 'VICEPRESIDENTE_1', 'SENADOR', 'DIPUTADO', 'VICEPRESIDENTE_2', 'PARLAMENTO_ANDINO');

-- CreateEnum
CREATE TYPE "financingcategory" AS ENUM ('INGRESO', 'GASTO', 'DEUDA');

-- CreateEnum
CREATE TYPE "financingstatus" AS ENUM ('DENTRO_DEL_PLAZO', 'FUERA_DEL_PLAZO', 'NO_PRESENTARON');

-- CreateEnum
CREATE TYPE "flowtype" AS ENUM ('I_FPD', 'I_F_PRIVADO', 'I_OPERACIONALES', 'G_FONDO_FPD', 'G_FONDO_F_PRIVADO', 'G_OPERACIONALES', 'D_TOTAL');

-- CreateEnum
CREATE TYPE "groupchangereason" AS ENUM ('INICIAL', 'CAMBIO_VOLUNTARIO', 'EXPULSION', 'RENUNCIA', 'DISOLUCION_BANCADA', 'CAMBIO_ESTRATEGICO', 'SANCION_DISCIPLINARIA', 'OTRO');

-- CreateEnum
CREATE TYPE "legislatorcondition" AS ENUM ('EN_EJERCICIO', 'FALLECIDO', 'SUSPENDIDO', 'LICENCIA', 'DESTITUIDO');

-- CreateEnum
CREATE TYPE "organizationtype" AS ENUM ('PARTIDO', 'ALIANZA');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "full_name" TEXT,
    "avatar_url" TEXT,
    "bio" TEXT,
    "role" TEXT DEFAULT 'user',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "last_sign_in_at" TIMESTAMPTZ(6),
    "phone" TEXT,
    "company" TEXT,
    "website" TEXT,
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userfeedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendiente',
    "email" TEXT,
    "message" TEXT,
    "image_url" TEXT,
    "reference_url" TEXT,
    "candidate_name" TEXT,
    "candidate_url" TEXT,
    "correction_field" TEXT,
    "current_value" TEXT,
    "correct_value" TEXT,
    "source_url" TEXT,

    CONSTRAINT "userfeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" VARCHAR NOT NULL,
    "legislator_id" VARCHAR NOT NULL,
    "date" TIMESTAMPTZ(6) NOT NULL,
    "session_type" "sessiontype" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "attendance_status" "attendancestatus" NOT NULL,
    "notes" VARCHAR(500),

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill" (
    "id" VARCHAR NOT NULL,
    "number" VARCHAR(50) NOT NULL,
    "title" TEXT,
    "summary" TEXT,
    "submission_date" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "parliamentary_group_id" VARCHAR,
    "approval_date" TIMESTAMPTZ(6),
    "approval_status" "billapprovalstatus" NOT NULL DEFAULT 'PRESENTADO',
    "sponsor" VARCHAR(150),
    "period" VARCHAR(50),
    "legislative_session" VARCHAR(100),
    "committees" TEXT,
    "document_url" VARCHAR,
    "title_ai" TEXT,
    "legislator_id" VARCHAR NOT NULL,
    "coauthors" TEXT,
    "cosponsors" TEXT,

    CONSTRAINT "bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "electoralprocess" (
    "id" VARCHAR NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "year" INTEGER NOT NULL,
    "election_date" TIMESTAMPTZ(6) NOT NULL,
    "active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "electoralprocess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executive" (
    "id" VARCHAR NOT NULL,
    "person_id" VARCHAR NOT NULL,
    "role" "executiverole" NOT NULL,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6),
    "end_reason" "endoftermreason",
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "ministry" VARCHAR,

    CONSTRAINT "executive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seatparliamentary" (
    "id" VARCHAR NOT NULL,
    "chamber" "chambertype" NOT NULL,
    "number_seat" INTEGER NOT NULL,
    "row" INTEGER NOT NULL,
    "legislator_id" VARCHAR,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "seatparliamentary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "electoraldistrict" (
    "id" VARCHAR NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "is_national" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "active" BOOLEAN NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "ubigeo" TEXT,

    CONSTRAINT "electoraldistrict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hito" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TEXT,
    "photo_url" TEXT,
    "photo_description" TEXT,
    "index" BIGINT,
    "quote" TEXT,
    "label" TEXT,

    CONSTRAINT "teamphoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team" (
    "id" VARCHAR NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "linkedin_url" TEXT,
    "portfolio_url" TEXT,
    "is_principal" BOOLEAN DEFAULT false,
    "email" TEXT,
    "role" TEXT,
    "image_url" TEXT,
    "phrase" TEXT,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triviagame" (
    "id" BIGSERIAL NOT NULL,
    "quote" TEXT,
    "person_id" VARCHAR,
    "options" JSON,
    "political_party_id" VARCHAR,
    "category" TEXT,
    "difficulty" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "global_index" BIGINT NOT NULL,
    "explanation" TEXT,
    "source_url" TEXT,

    CONSTRAINT "triviagame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "background" (
    "id" VARCHAR NOT NULL,
    "person_id" VARCHAR NOT NULL,
    "publication_date" TEXT,
    "type" "backgroundtype" NOT NULL,
    "status" "backgroundstatus" NOT NULL,
    "summary" TEXT,
    "sanction" VARCHAR(500),
    "source" VARCHAR(300) NOT NULL,
    "source_url" VARCHAR,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "title" TEXT NOT NULL,

    CONSTRAINT "background_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person" (
    "id" VARCHAR NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "lastname" VARCHAR(150) NOT NULL,
    "fullname" VARCHAR(300) NOT NULL,
    "image_url" VARCHAR,
    "birth_date" TIMESTAMPTZ(6),
    "profession" VARCHAR(200),
    "detailed_biography" JSONB,
    "technical_education" JSONB,
    "university_education" JSONB NOT NULL DEFAULT '[]',
    "no_university_education" JSONB,
    "postgraduate_education" JSONB NOT NULL DEFAULT '[]',
    "work_experience" JSONB NOT NULL DEFAULT '[]',
    "facebook_url" VARCHAR,
    "twitter_url" VARCHAR,
    "instagram_url" VARCHAR,
    "tiktok_url" VARCHAR,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "secondary_school" BOOLEAN,
    "political_role" JSONB,
    "popular_election" JSONB,
    "incomes" JSONB,
    "assets" JSONB,
    "dni" TEXT,
    "gender" TEXT,
    "party_number_rop" TEXT,
    "place_of_birth" TEXT,
    "image_candidate_url" TEXT,
    "education_level" SMALLINT NOT NULL DEFAULT 1,
    "is_incumbent" BOOLEAN,
    "has_criminal_record" BOOLEAN NOT NULL DEFAULT false,
    "has_penal_sentence" BOOLEAN NOT NULL DEFAULT false,
    "has_sanction" BOOLEAN NOT NULL DEFAULT false,
    "is_under_investigation" BOOLEAN NOT NULL DEFAULT false,
    "reinfo_status" TEXT,
    "rnas_sanctions" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "has_income" BOOLEAN NOT NULL DEFAULT false,
    "has_assets" BOOLEAN NOT NULL DEFAULT false,
    "has_electoral_experience" BOOLEAN NOT NULL DEFAULT false,
    "work_experience_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_embeddings" (
    "id" BIGSERIAL NOT NULL,
    "person_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunk_type" TEXT NOT NULL,
    "embedding" vector,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "person_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alliancecomposition" (
    "id" VARCHAR NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parent_org_id" VARCHAR,
    "child_org_id" VARCHAR,
    "process_id" VARCHAR,

    CONSTRAINT "alliance_composition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate" (
    "id" VARCHAR NOT NULL,
    "person_id" VARCHAR NOT NULL,
    "electoral_process_id" VARCHAR NOT NULL,
    "type" "candidacytype" NOT NULL,
    "political_party_id" VARCHAR NOT NULL,
    "electoral_district_id" TEXT NOT NULL,
    "status" "candidacystatus" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "list_number" INTEGER,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "active" BOOLEAN NOT NULL,

    CONSTRAINT "candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidatemetrics" (
    "candidate_id" VARCHAR NOT NULL,
    "total_previous_candidacies" INTEGER NOT NULL,
    "times_elected" INTEGER NOT NULL,
    "political_experience_years" INTEGER NOT NULL,
    "total_parties_belonged" INTEGER NOT NULL,
    "years_in_current_party" DOUBLE PRECISION NOT NULL,
    "max_academic_level_score" INTEGER NOT NULL,
    "has_postgraduate" BOOLEAN NOT NULL,
    "declared_income_annual" DOUBLE PRECISION NOT NULL,
    "declared_assets_value" DOUBLE PRECISION NOT NULL,
    "total_legal_records" INTEGER NOT NULL,
    "has_penal_sentences" BOOLEAN NOT NULL,
    "has_alimentary_debts" BOOLEAN NOT NULL,
    "last_updated" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "candidatemetrics_pkey" PRIMARY KEY ("candidate_id")
);

-- CreateTable
CREATE TABLE "financingreports" (
    "id" VARCHAR NOT NULL,
    "party_id" VARCHAR NOT NULL,
    "report_name" VARCHAR NOT NULL,
    "filing_status" "financingstatus" NOT NULL,
    "source_name" VARCHAR NOT NULL,
    "source_url" VARCHAR,
    "report_date" DATE NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "financingreports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legislator" (
    "id" VARCHAR NOT NULL,
    "person_id" VARCHAR NOT NULL,
    "electoral_district_id" VARCHAR NOT NULL,
    "chamber" "chambertype" NOT NULL,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6),
    "active" BOOLEAN NOT NULL,
    "institutional_email" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "condition" "legislatorcondition" NOT NULL DEFAULT 'EN_EJERCICIO',
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "elected_by_party_id" VARCHAR NOT NULL,

    CONSTRAINT "legislator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legislatormetrics" (
    "legislator_id" VARCHAR NOT NULL,
    "total_bills" INTEGER NOT NULL,
    "bills_presentado" INTEGER NOT NULL,
    "bills_en_comision" INTEGER NOT NULL,
    "bills_aprobado" INTEGER NOT NULL,
    "bills_rechazado" INTEGER NOT NULL,
    "bills_retirado_por_autor" INTEGER NOT NULL,
    "approval_rate" DOUBLE PRECISION,
    "total_sessions" INTEGER NOT NULL,
    "sessions_present" INTEGER NOT NULL,
    "sessions_absent" INTEGER NOT NULL,
    "sessions_justified" INTEGER NOT NULL,
    "sessions_license" INTEGER NOT NULL,
    "attendance_rate" DOUBLE PRECISION,
    "total_party_changes" INTEGER NOT NULL,
    "days_in_current_group" INTEGER,
    "is_defector" BOOLEAN NOT NULL,
    "total_legal_records" INTEGER NOT NULL,
    "penal_records" INTEGER NOT NULL,
    "ethical_records" INTEGER NOT NULL,
    "civil_records" INTEGER NOT NULL,
    "administrative_records" INTEGER NOT NULL,
    "last_updated" TIMESTAMPTZ(6) NOT NULL,
    "bills_en_proceso" INTEGER NOT NULL,

    CONSTRAINT "legislatormetrics_pkey" PRIMARY KEY ("legislator_id")
);

-- CreateTable
CREATE TABLE "parliamentarygroup" (
    "id" VARCHAR NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "acronym" VARCHAR(20),
    "color_hex" VARCHAR(7),
    "logo_url" VARCHAR,
    "description" VARCHAR(1000),
    "formation_date" TIMESTAMPTZ(6),
    "dissolution_date" TIMESTAMPTZ(6),
    "active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "rules_url" VARCHAR,

    CONSTRAINT "parliamentarygroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parliamentarymembership" (
    "id" VARCHAR NOT NULL,
    "legislator_id" VARCHAR NOT NULL,
    "parliamentary_group_id" VARCHAR NOT NULL,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6),
    "change_reason" "groupchangereason" NOT NULL,
    "notes" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "source_url" VARCHAR(1000),

    CONSTRAINT "parliamentarymembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partyfinancing" (
    "id" VARCHAR NOT NULL,
    "financing_report_id" VARCHAR NOT NULL,
    "category" "financingcategory" NOT NULL DEFAULT 'INGRESO',
    "flow_type" "flowtype" NOT NULL DEFAULT 'I_FPD',
    "amount" DECIMAL NOT NULL,
    "currency" VARCHAR NOT NULL DEFAULT 'PEN',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),

    CONSTRAINT "partyfinancing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "politicalparty" (
    "id" VARCHAR NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "acronym" VARCHAR(20),
    "logo_url" VARCHAR,
    "color_hex" VARCHAR(7),
    "active" BOOLEAN NOT NULL,
    "founder" VARCHAR(200),
    "foundation_date" DATE,
    "ideology" VARCHAR(200),
    "main_office" VARCHAR(300),
    "phone" VARCHAR(50),
    "email" VARCHAR(100),
    "website" VARCHAR(200),
    "party_timeline" JSON,
    "facebook_url" VARCHAR,
    "twitter_url" VARCHAR,
    "youtube_url" VARCHAR,
    "tiktok_url" VARCHAR,
    "total_afiliates" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
    "party_president" VARCHAR(200),
    "purpose" VARCHAR,
    "core_values" VARCHAR,
    "slogan" VARCHAR(200),
    "legal_cases" JSON,
    "government_plan_url" TEXT,
    "government_plan_summary" JSON,
    "government_audio_url" TEXT,
    "type" "organizationtype",
    "rop" TEXT,

    CONSTRAINT "politicalparty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profiles_created_at_idx" ON "profiles"("created_at");

-- CreateIndex
CREATE INDEX "profiles_role_idx" ON "profiles"("role");

-- CreateIndex
CREATE INDEX "ix_attendance_attendance_status" ON "attendance"("attendance_status");

-- CreateIndex
CREATE INDEX "ix_attendance_legislator_id" ON "attendance"("legislator_id");

-- CreateIndex
CREATE INDEX "ix_attendance_session_type" ON "attendance"("session_type");

-- CreateIndex
CREATE UNIQUE INDEX "bill_number_key" ON "bill"("number");

-- CreateIndex
CREATE INDEX "ix_bill_approval_date" ON "bill"("approval_date");

-- CreateIndex
CREATE INDEX "ix_bill_approval_status" ON "bill"("approval_status");

-- CreateIndex
CREATE INDEX "ix_bill_legislator_id" ON "bill"("legislator_id");

-- CreateIndex
CREATE INDEX "ix_bill_parliamentary_group_id" ON "bill"("parliamentary_group_id");

-- CreateIndex
CREATE INDEX "ix_electoralprocess_year" ON "electoralprocess"("year");

-- CreateIndex
CREATE INDEX "ix_executive_person_id" ON "executive"("person_id");

-- CreateIndex
CREATE INDEX "ix_seatparliamentary_legislator_id" ON "seatparliamentary"("legislator_id");

-- CreateIndex
CREATE UNIQUE INDEX "ix_electoraldistrict_name" ON "electoraldistrict"("name");

-- CreateIndex
CREATE UNIQUE INDEX "electoraldistrict_code_key" ON "electoraldistrict"("code");

-- CreateIndex
CREATE INDEX "ix_background_person_id" ON "background"("person_id");

-- CreateIndex
CREATE INDEX "ix_background_status" ON "background"("status");

-- CreateIndex
CREATE INDEX "ix_background_type" ON "background"("type");

-- CreateIndex
CREATE UNIQUE INDEX "ix_person_fullname" ON "person"("fullname");

-- CreateIndex
CREATE UNIQUE INDEX "person_dni_key" ON "person"("dni");

-- CreateIndex
CREATE INDEX "person_embeddings_chunk_type_idx" ON "person_embeddings"("chunk_type");

-- CreateIndex
CREATE INDEX "person_embeddings_embedding_idx" ON "person_embeddings"("embedding");

-- CreateIndex
CREATE INDEX "person_embeddings_person_id_idx" ON "person_embeddings"("person_id");

-- CreateIndex
CREATE INDEX "idx_candidate_district" ON "candidate"("electoral_district_id");

-- CreateIndex
CREATE INDEX "idx_candidate_party" ON "candidate"("political_party_id");

-- CreateIndex
CREATE INDEX "idx_candidate_process_type_active" ON "candidate"("electoral_process_id", "type", "active");

-- CreateIndex
CREATE INDEX "ix_candidate_electoral_process_id" ON "candidate"("electoral_process_id");

-- CreateIndex
CREATE INDEX "ix_candidate_person_id" ON "candidate"("person_id");

-- CreateIndex
CREATE INDEX "ix_candidate_political_party_id" ON "candidate"("political_party_id");

-- CreateIndex
CREATE INDEX "ix_candidate_type" ON "candidate"("type");

-- CreateIndex
CREATE UNIQUE INDEX "financingreports_party_id_report_name_key" ON "financingreports"("party_id", "report_name");

-- CreateIndex
CREATE INDEX "ix_legislator_electoral_district_id" ON "legislator"("electoral_district_id");

-- CreateIndex
CREATE INDEX "ix_legislator_person_id" ON "legislator"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "ix_parliamentarygroup_name" ON "parliamentarygroup"("name");

-- CreateIndex
CREATE INDEX "ix_parliamentarygroup_acronym" ON "parliamentarygroup"("acronym");

-- CreateIndex
CREATE INDEX "ix_parliamentarygroup_active" ON "parliamentarygroup"("active");

-- CreateIndex
CREATE INDEX "ix_parliamentarymembership_change_reason" ON "parliamentarymembership"("change_reason");

-- CreateIndex
CREATE INDEX "ix_parliamentarymembership_legislator_id" ON "parliamentarymembership"("legislator_id");

-- CreateIndex
CREATE INDEX "ix_parliamentarymembership_parliamentary_group_id" ON "parliamentarymembership"("parliamentary_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "ix_politicalparty_name" ON "politicalparty"("name");

-- CreateIndex
CREATE INDEX "ix_politicalparty_acronym" ON "politicalparty"("acronym");

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_legislator_id_fkey" FOREIGN KEY ("legislator_id") REFERENCES "legislator"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bill" ADD CONSTRAINT "bill_legislator_id_fkey" FOREIGN KEY ("legislator_id") REFERENCES "legislator"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bill" ADD CONSTRAINT "bill_parliamentary_group_id_fkey" FOREIGN KEY ("parliamentary_group_id") REFERENCES "parliamentarygroup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "executive" ADD CONSTRAINT "executive_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "seatparliamentary" ADD CONSTRAINT "seatparliamentary_legislator_id_fkey" FOREIGN KEY ("legislator_id") REFERENCES "legislator"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "triviagame" ADD CONSTRAINT "triviagame_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "triviagame" ADD CONSTRAINT "triviagame_political_party_id_fkey" FOREIGN KEY ("political_party_id") REFERENCES "politicalparty"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "background" ADD CONSTRAINT "background_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "person_embeddings" ADD CONSTRAINT "person_embeddings_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alliancecomposition" ADD CONSTRAINT "alliance_composition_child_org_id_fkey" FOREIGN KEY ("child_org_id") REFERENCES "politicalparty"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alliancecomposition" ADD CONSTRAINT "alliance_composition_parent_org_id_fkey" FOREIGN KEY ("parent_org_id") REFERENCES "politicalparty"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alliancecomposition" ADD CONSTRAINT "alliance_composition_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "electoralprocess"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "candidate" ADD CONSTRAINT "candidate_electoral_district_id_fkey" FOREIGN KEY ("electoral_district_id") REFERENCES "electoraldistrict"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "candidate" ADD CONSTRAINT "candidate_electoral_process_id_fkey" FOREIGN KEY ("electoral_process_id") REFERENCES "electoralprocess"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "candidate" ADD CONSTRAINT "candidate_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "candidate" ADD CONSTRAINT "candidate_political_party_id_fkey" FOREIGN KEY ("political_party_id") REFERENCES "politicalparty"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "candidatemetrics" ADD CONSTRAINT "candidatemetrics_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "financingreports" ADD CONSTRAINT "financingreports_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "politicalparty"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "legislator" ADD CONSTRAINT "legislator_elected_by_party_id_fkey" FOREIGN KEY ("elected_by_party_id") REFERENCES "politicalparty"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "legislator" ADD CONSTRAINT "legislator_electoral_district_id_fkey" FOREIGN KEY ("electoral_district_id") REFERENCES "electoraldistrict"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "legislator" ADD CONSTRAINT "legislator_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "person"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "legislatormetrics" ADD CONSTRAINT "legislatormetrics_legislator_id_fkey" FOREIGN KEY ("legislator_id") REFERENCES "legislator"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parliamentarymembership" ADD CONSTRAINT "parliamentarymembership_legislator_id_fkey" FOREIGN KEY ("legislator_id") REFERENCES "legislator"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parliamentarymembership" ADD CONSTRAINT "parliamentarymembership_parliamentary_group_id_fkey" FOREIGN KEY ("parliamentary_group_id") REFERENCES "parliamentarygroup"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "partyfinancing" ADD CONSTRAINT "partyfinancing_financing_report_id_fkey" FOREIGN KEY ("financing_report_id") REFERENCES "financingreports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
