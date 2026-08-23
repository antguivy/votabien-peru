-- Truncate existing trivia data before schema upgrade
TRUNCATE TABLE "triviagame" CASCADE;

-- AlterTable
ALTER TABLE "triviagame" ADD COLUMN     "correct_answer_id" VARCHAR NOT NULL,
ADD COLUMN     "display_type" VARCHAR(30) NOT NULL DEFAULT 'TEXT_ONLY',
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "topic_id" VARCHAR,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "quote" SET NOT NULL,
ALTER COLUMN "options" SET NOT NULL,
ALTER COLUMN "difficulty" SET NOT NULL,
ALTER COLUMN "difficulty" SET DEFAULT 'FACIL',
ALTER COLUMN "global_index" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "triviaaudience" (
    "id" VARCHAR NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "emoji" VARCHAR(10),
    "color" VARCHAR(30),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "triviaaudience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triviatopic" (
    "id" VARCHAR NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "badge_color" VARCHAR(30),
    "banner_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "triviatopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triviatopic_audience" (
    "topic_id" VARCHAR NOT NULL,
    "audience_id" VARCHAR NOT NULL,

    CONSTRAINT "triviatopic_audience_pkey" PRIMARY KEY ("topic_id","audience_id")
);

-- CreateTable
CREATE TABLE "triviagame_audience" (
    "question_id" BIGINT NOT NULL,
    "audience_id" VARCHAR NOT NULL,

    CONSTRAINT "triviagame_audience_pkey" PRIMARY KEY ("question_id","audience_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "triviaaudience_slug_key" ON "triviaaudience"("slug");

-- CreateIndex
CREATE INDEX "triviaaudience_is_active_idx" ON "triviaaudience"("is_active");

-- CreateIndex
CREATE INDEX "triviaaudience_order_index_idx" ON "triviaaudience"("order_index");

-- CreateIndex
CREATE UNIQUE INDEX "triviatopic_slug_key" ON "triviatopic"("slug");

-- CreateIndex
CREATE INDEX "triviatopic_is_active_idx" ON "triviatopic"("is_active");

-- CreateIndex
CREATE INDEX "triviatopic_order_index_idx" ON "triviatopic"("order_index");

-- CreateIndex
CREATE INDEX "triviagame_topic_id_idx" ON "triviagame"("topic_id");

-- CreateIndex
CREATE INDEX "triviagame_difficulty_idx" ON "triviagame"("difficulty");

-- CreateIndex
CREATE INDEX "triviagame_global_index_idx" ON "triviagame"("global_index");

-- CreateIndex
CREATE INDEX "triviagame_is_published_idx" ON "triviagame"("is_published");

-- AddForeignKey
ALTER TABLE "triviatopic_audience" ADD CONSTRAINT "triviatopic_audience_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "triviatopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triviatopic_audience" ADD CONSTRAINT "triviatopic_audience_audience_id_fkey" FOREIGN KEY ("audience_id") REFERENCES "triviaaudience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triviagame" ADD CONSTRAINT "triviagame_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "triviatopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triviagame_audience" ADD CONSTRAINT "triviagame_audience_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "triviagame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triviagame_audience" ADD CONSTRAINT "triviagame_audience_audience_id_fkey" FOREIGN KEY ("audience_id") REFERENCES "triviaaudience"("id") ON DELETE CASCADE ON UPDATE CASCADE;
