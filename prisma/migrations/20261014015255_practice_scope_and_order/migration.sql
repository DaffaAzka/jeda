-- AlterTable
ALTER TABLE "session_answers" ADD COLUMN     "sort_order" SMALLINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "tryout_sessions" ADD COLUMN     "ends_at" TIMESTAMPTZ(6),
ADD COLUMN     "topic_id" UUID;

-- CreateIndex
CREATE INDEX "session_answers_session_id_sort_order_idx" ON "session_answers"("session_id", "sort_order");

-- CreateIndex
CREATE INDEX "tryout_sessions_topic_id_idx" ON "tryout_sessions"("topic_id");

-- AddForeignKey
ALTER TABLE "tryout_sessions" ADD CONSTRAINT "tryout_sessions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
