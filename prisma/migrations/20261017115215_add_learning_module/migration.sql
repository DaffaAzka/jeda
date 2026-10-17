-- CreateEnum
CREATE TYPE "content_status" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "content_source" AS ENUM ('manual', 'ai_assisted');

-- CreateEnum
CREATE TYPE "lesson_progress_status" AS ENUM ('in_progress', 'completed');

-- CreateEnum
CREATE TYPE "ai_generation_kind" AS ENUM ('lesson_draft', 'question_set');

-- CreateEnum
CREATE TYPE "ai_generation_status" AS ENUM ('succeeded', 'failed');

-- AlterEnum
ALTER TYPE "task_type" ADD VALUE 'lesson';

-- AlterTable
ALTER TABLE "plan_tasks" ADD COLUMN     "lesson_id" UUID;

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "reviewed_at" TIMESTAMPTZ(6),
ADD COLUMN     "source" "content_source" NOT NULL DEFAULT 'manual';

-- CreateTable
CREATE TABLE "lessons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "topic_id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "summary" VARCHAR(280),
    "content" JSONB NOT NULL,
    "est_minutes" INTEGER NOT NULL DEFAULT 10,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "status" "content_status" NOT NULL DEFAULT 'draft',
    "source" "content_source" NOT NULL DEFAULT 'manual',
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_questions" (
    "lesson_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "lesson_questions_pkey" PRIMARY KEY ("lesson_id","question_id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "status" "lesson_progress_status" NOT NULL DEFAULT 'in_progress',
    "check_correct" SMALLINT,
    "check_total" SMALLINT,
    "first_viewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_viewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "topic_id" UUID,
    "kind" "ai_generation_kind" NOT NULL,
    "status" "ai_generation_status" NOT NULL,
    "model" VARCHAR(80) NOT NULL,
    "params" JSONB,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "error_code" VARCHAR(60),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lessons_topic_id_status_sort_order_idx" ON "lessons"("topic_id", "status", "sort_order");

-- CreateIndex
CREATE INDEX "lesson_questions_question_id_idx" ON "lesson_questions"("question_id");

-- CreateIndex
CREATE INDEX "lesson_progress_user_id_last_viewed_at_idx" ON "lesson_progress"("user_id", "last_viewed_at");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_user_id_lesson_id_key" ON "lesson_progress"("user_id", "lesson_id");

-- CreateIndex
CREATE INDEX "ai_generations_user_id_created_at_idx" ON "ai_generations"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "plan_tasks" ADD CONSTRAINT "plan_tasks_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_questions" ADD CONSTRAINT "lesson_questions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_questions" ADD CONSTRAINT "lesson_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generations" ADD CONSTRAINT "ai_generations_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
