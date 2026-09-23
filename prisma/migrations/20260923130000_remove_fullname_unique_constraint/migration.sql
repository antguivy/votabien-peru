-- DropIndex
DROP INDEX IF EXISTS "ix_person_fullname";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_person_fullname" ON "person"("fullname");
