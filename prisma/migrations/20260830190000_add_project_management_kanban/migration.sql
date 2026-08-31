-- CreateTable
CREATE TABLE "project_board" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50) DEFAULT 'FolderKanban',
    "color" VARCHAR(30) DEFAULT 'indigo',
    "area" TEXT NOT NULL DEFAULT 'GENERAL',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_column" (
    "id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "color" VARCHAR(30),
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_column_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_task" (
    "id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "column_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIA',
    "position" INTEGER NOT NULL DEFAULT 0,
    "due_date" TIMESTAMPTZ(6),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_by_id" TEXT,
    "resources" JSONB DEFAULT '[]',
    "checklist" JSONB DEFAULT '[]',
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_task_assignment" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_task_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_task_comment" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_task_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_task_activity" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_task_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_board_created_by_id_idx" ON "project_board"("created_by_id");

-- CreateIndex
CREATE INDEX "project_board_area_idx" ON "project_board"("area");

-- CreateIndex
CREATE INDEX "project_column_board_id_position_idx" ON "project_column"("board_id", "position");

-- CreateIndex
CREATE INDEX "project_task_board_id_column_id_position_idx" ON "project_task"("board_id", "column_id", "position");

-- CreateIndex
CREATE INDEX "project_task_priority_idx" ON "project_task"("priority");

-- CreateIndex
CREATE INDEX "project_task_due_date_idx" ON "project_task"("due_date");

-- CreateIndex
CREATE INDEX "project_task_assignment_user_id_idx" ON "project_task_assignment"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_task_assignment_task_id_user_id_key" ON "project_task_assignment"("task_id", "user_id");

-- CreateIndex
CREATE INDEX "project_task_comment_task_id_created_at_idx" ON "project_task_comment"("task_id", "created_at");

-- CreateIndex
CREATE INDEX "project_task_activity_task_id_created_at_idx" ON "project_task_activity"("task_id", "created_at");

-- AddForeignKey
ALTER TABLE "project_board" ADD CONSTRAINT "project_board_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_column" ADD CONSTRAINT "project_column_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "project_board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_task" ADD CONSTRAINT "project_task_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "project_board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_task" ADD CONSTRAINT "project_task_column_id_fkey" FOREIGN KEY ("column_id") REFERENCES "project_column"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_task" ADD CONSTRAINT "project_task_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_task_assignment" ADD CONSTRAINT "project_task_assignment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "project_task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_task_assignment" ADD CONSTRAINT "project_task_assignment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_task_comment" ADD CONSTRAINT "project_task_comment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "project_task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_task_comment" ADD CONSTRAINT "project_task_comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_task_activity" ADD CONSTRAINT "project_task_activity_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "project_task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_task_activity" ADD CONSTRAINT "project_task_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
