-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('student', 'admin');

-- CreateEnum
CREATE TYPE "tryout_mode" AS ENUM ('relaxed', 'timed', 'full_simulation');

-- CreateEnum
CREATE TYPE "error_cause" AS ENUM ('didnt_know', 'out_of_time', 'panic', 'careless');

-- CreateEnum
CREATE TYPE "tag_source" AS ENUM ('auto', 'user');

-- CreateEnum
CREATE TYPE "day_mode" AS ENUM ('recovery', 'balanced', 'challenge');

-- CreateEnum
CREATE TYPE "task_type" AS ENUM ('review', 'practice', 'tryout', 'rest', 'calm');

-- CreateEnum
CREATE TYPE "task_status" AS ENUM ('pending', 'done', 'swapped', 'skipped');

-- CreateEnum
CREATE TYPE "calm_tool" AS ENUM ('breathing', 'grounding', 'reframing');

-- CreateEnum
CREATE TYPE "calm_trigger" AS ENUM ('manual', 'panic_button', 'plan');

-- CreateEnum
CREATE TYPE "support_action" AS ENUM ('shown', 'dismissed', 'opened', 'contacted');

-- CreateEnum
CREATE TYPE "resource_type" AS ENUM ('hotline', 'counselor', 'website');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" VARCHAR(500),
    "role" "user_role" NOT NULL DEFAULT 'student',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "target_university" VARCHAR(150),
    "target_major" VARCHAR(150),
    "exam_date" DATE,
    "wellbeing_consent" BOOLEAN NOT NULL DEFAULT false,
    "consented_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subtests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "default_seconds" INTEGER NOT NULL,

    CONSTRAINT "subtests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subtest_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "topic_id" UUID NOT NULL,
    "difficulty" SMALLINT NOT NULL DEFAULT 2,
    "stem" TEXT NOT NULL,
    "image_url" VARCHAR(500),
    "explanation" TEXT,
    "expected_seconds" INTEGER NOT NULL DEFAULT 90,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "label" CHAR(1) NOT NULL,
    "body" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tryout_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "plan_task_id" UUID,
    "subtest_id" UUID,
    "mode" "tryout_mode" NOT NULL,
    "time_limit_seconds" INTEGER,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ(6),
    "score" DECIMAL(5,2),

    CONSTRAINT "tryout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_answers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "selected_option_id" UUID,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "seconds_spent" INTEGER NOT NULL DEFAULT 0,
    "elapsed_seconds" INTEGER NOT NULL DEFAULT 0,
    "error_tag" "error_cause",
    "tag_source" "tag_source",
    "answered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_stats" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "last_practiced_at" TIMESTAMPTZ(6),

    CONSTRAINT "topic_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "checkin_date" DATE NOT NULL,
    "sleep_hours" DECIMAL(3,1) NOT NULL,
    "energy" SMALLINT NOT NULL,
    "mood" SMALLINT NOT NULL,
    "stress" SMALLINT NOT NULL,
    "note" VARCHAR(280),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "plan_date" DATE NOT NULL,
    "mode" "day_mode" NOT NULL,
    "rule_key" VARCHAR(60) NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "daily_plan_id" UUID NOT NULL,
    "topic_id" UUID,
    "type" "task_type" NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "reason" VARCHAR(255),
    "est_minutes" INTEGER NOT NULL DEFAULT 15,
    "status" "task_status" NOT NULL DEFAULT 'pending',
    "sort_order" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "plan_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calm_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "tryout_session_id" UUID,
    "tool" "calm_tool" NOT NULL,
    "trigger_source" "calm_trigger" NOT NULL,
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calm_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_resources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "type" "resource_type" NOT NULL,
    "contact" VARCHAR(120),
    "url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_verified_at" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "resource_id" UUID,
    "rule_key" VARCHAR(60) NOT NULL,
    "action" "support_action" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "user_id" UUID NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "account_id" VARCHAR(255) NOT NULL,
    "provider_id" VARCHAR(255) NOT NULL,
    "user_id" UUID NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMPTZ(6),
    "refresh_token_expires_at" TIMESTAMPTZ(6),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identifier" VARCHAR(255) NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_user_id_key" ON "student_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subtests_code_key" ON "subtests"("code");

-- CreateIndex
CREATE UNIQUE INDEX "topics_subtest_id_name_key" ON "topics"("subtest_id", "name");

-- CreateIndex
CREATE INDEX "questions_topic_id_is_published_difficulty_idx" ON "questions"("topic_id", "is_published", "difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "question_options_question_id_label_key" ON "question_options"("question_id", "label");

-- CreateIndex
CREATE INDEX "tryout_sessions_user_id_started_at_idx" ON "tryout_sessions"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "session_answers_question_id_idx" ON "session_answers"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_answers_session_id_question_id_key" ON "session_answers"("session_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "topic_stats_user_id_topic_id_key" ON "topic_stats"("user_id", "topic_id");

-- CreateIndex
CREATE UNIQUE INDEX "checkins_user_id_checkin_date_key" ON "checkins"("user_id", "checkin_date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_plans_user_id_plan_date_key" ON "daily_plans"("user_id", "plan_date");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_subtest_id_fkey" FOREIGN KEY ("subtest_id") REFERENCES "subtests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tryout_sessions" ADD CONSTRAINT "tryout_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tryout_sessions" ADD CONSTRAINT "tryout_sessions_plan_task_id_fkey" FOREIGN KEY ("plan_task_id") REFERENCES "plan_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tryout_sessions" ADD CONSTRAINT "tryout_sessions_subtest_id_fkey" FOREIGN KEY ("subtest_id") REFERENCES "subtests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_answers" ADD CONSTRAINT "session_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "tryout_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_answers" ADD CONSTRAINT "session_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_answers" ADD CONSTRAINT "session_answers_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_stats" ADD CONSTRAINT "topic_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_stats" ADD CONSTRAINT "topic_stats_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_plans" ADD CONSTRAINT "daily_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_tasks" ADD CONSTRAINT "plan_tasks_daily_plan_id_fkey" FOREIGN KEY ("daily_plan_id") REFERENCES "daily_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_tasks" ADD CONSTRAINT "plan_tasks_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calm_sessions" ADD CONSTRAINT "calm_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calm_sessions" ADD CONSTRAINT "calm_sessions_tryout_session_id_fkey" FOREIGN KEY ("tryout_session_id") REFERENCES "tryout_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_events" ADD CONSTRAINT "support_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_events" ADD CONSTRAINT "support_events_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "support_resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
