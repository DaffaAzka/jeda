# MOODI LMS overhaul

This file briefs an AI coding agent on the next big change to MOODI. Belajar becomes a real learning module instead of a second tryout screen. The rich text editor is replaced with a Lexical based one. Gemini helps admins draft lessons and questions through tool calling. The seeder is rebuilt and gets a refresh command.

Read `AGENTS.md` first. Everything in it still applies, except the points listed in section 9. If this file and `AGENTS.md` disagree anywhere else, stop and ask Azka. Put this file at `docs/lms-overhaul/README.md`.

## 0. Study the repo before you change it

This phase has no code changes. Read the repo in this order: `AGENTS.md`, `docs/project-summary.pdf`, the Prisma schema, `package.json` and the lockfile, `prisma.config.ts` if it exists, every route under `src/app`, every folder under `src/features`, `src/config/rules.ts`, `src/lib/rules`, `src/lib/copy/id.ts`, `src/app/globals.css`, `src/components`, and the current seed scripts. Then write `docs/lms-overhaul/AUDIT.md` with these parts:

1. A route map. For each screen, say what it does and whether it works end to end.
2. A status table for every module in section 8 of `AGENTS.md`, plus admin CRUD. Mark each one working, partial, or stub.
3. How Belajar works today, file by file, and exactly where it overlaps with tryout (shared components, shared actions, use of `TryoutSession`).
4. Where rich text is edited and rendered today. Name the editor, the stored format (HTML, Markdown, or JSON), how LaTeX is stored, and which columns hold it.
5. What the seeder creates, whether it runs on an empty database, and every reason it fails or leaves the app unusable.
6. Every place where `AGENTS.md` no longer matches the repo.
7. Relevant dependencies and versions: Prisma and its driver adapter, Zod, KaTeX, Lexical, a test runner, and `@google/genai` if present.

When the audit is done, summarize it to Azka in under 15 lines. Continue unless the audit contradicts this file.

### What the two source documents already show

The Prisma schema has no model for learning content. `Topic` is only a label between `Subtest` and `Question`. The nearest thing to a lesson is a `PlanTask` of type `review` or `practice` that points at a topic, and `TryoutSession` has its own `topicId`. That explains why Belajar feels like tryout: the only thing it can launch is a question session. Confirm this in the audit.

The schema is Prisma and its auth tables have the Better Auth shape, so the "Open" rows in section 4 of `AGENTS.md` and the line saying the DBML file is authoritative are stale. The Prisma schema is the source of truth now. Its enum names also differ from the identifiers suggested in section 9 of `AGENTS.md` (`timed` vs `loose`, `full_simulation` vs `full`, `didnt_know` vs `not_known`, `out_of_time` vs `time_pressure`, `auto` and `user` vs `system_guess` and `student`). Do not rename database enums. Fix `AGENTS.md` instead.

Two relations matter for the seeder. `Question.isPublished` defaults to false, so seeded questions stay invisible unless the seed sets it. `Topic` to `Question` and `Question` to `SessionAnswer` are both `Restrict`, so content cannot be deleted while answers reference it.

`AGENTS.md` says routes use Indonesian slugs. The repo may use something else. Follow the repo and record the convention in the audit.

## 1. Release safety

`AGENTS.md` puts submission at 17 to 18 October and the judging window at 20 to 25 October, and the repo link and the public URL are both part of the submission. Do all of this work on a branch called `feat/lms-overhaul`. Do not merge into the deployed branch until every item in section 10 passes.

Use a separate database for development, for example a Neon branch or a second project. Never run `db:migrate`, `db:seed`, or `db:refresh` against the production database from this branch. Migrations follow expand then contract: add new tables and columns first, keep the old columns until the converted content has been checked, and drop them in a later commit. Every migration commit must leave `db:seed` working.

## 2. Workstreams and order

Work in this order, because each step depends on the one before it.

| Phase | Work |
| --- | --- |
| 1 | Install and adapt the Lexical editor, convert existing rich text content (section 3) |
| 2 | Learning module: data model, admin lessons, student views, progress, plan integration (section 4) |
| 3 | Gemini authoring tools for lessons, then for questions (section 5) |
| 4 | Seeder rebuild and `db:refresh` (section 6) |
| 5 | Docs, `.env.example`, `AGENTS.md` updates, tests (sections 9 and 10) |

Stop at the end of each phase and show Azka a short summary before starting the next one.

## 3. Lexical editor

Install with `npx shadcn@latest add @shadcn-editor/editor-x`. Run it on a clean git tree and read the whole diff afterwards. The CLI asks before overwriting files, so answer no for any existing file in `src/components/ui` until you have compared it with the MOODI styling. If the `@shadcn-editor` namespace does not resolve, check the registry notes on shadcn-editor.vercel.app. Do not guess a registry URL. Azka has approved this install and the Lexical packages it brings. Record the added dependencies in the commit message.

The generated code lands in `src/components/editor/`. The registry demo wires in far more than MOODI needs, so build a trimmed editor on top of it.

**Keep:** rich text, headings, lists, quote, code block, table, horizontal rule, links, equations (LaTeX), collapsible blocks (useful for hints), markdown shortcuts, history, and the slash menu.

**Remove:** the font family, font size, and color toolbars, and the Twitter, Figma, and YouTube embeds. Remove polls, mentions, speech to text, ruby text, pull quotes, review, date time, cards, and the language selector. Arbitrary colors would break contrast in Night and Dark, and embeds load third party content into a page that many under 18 students will open.

**Images are off by default.** There is no file storage in the stack, and hotlinked images would send students' IP addresses to other sites. Ask Azka before enabling them, together with the choice of storage.

Wrap the result in two components with one job each:

```
RichTextEditor   client component, props: value, onChange, variant ("lesson" | "question" | "option")
RichTextView     renders stored content for students
```

`variant` picks the plugin set. A lesson gets the full trimmed set, a question stem gets a smaller one, and an option body gets inline formatting and equations only. Load the editor lazily and only on admin routes, so it never reaches the student bundle.

**Storage.** Store `editor.getEditorState().toJSON()` in a JSONB column. Validate it on the server at the boundary of every action: the shape must match, only allowlisted node types may appear, and link URLs may only use `http`, `https`, or `mailto`. Never trust JSON from the client.

**Student rendering.** The default is a small server component that walks the stored JSON and returns React elements for the allowlisted nodes. KaTeX renders equations on the server with `trust` off. That keeps Lexical out of the student bundle and avoids `dangerouslySetInnerHTML` for anything except KaTeX output. If this turns out harder than expected, fall back to Lexical in read only mode and tell Azka.

**MOODI theming.** The generated files use stock shadcn classes such as `dark:bg-input/30`. In MOODI the `dark` variant only matches `data-theme="dark"`, so Night would be missed, and `AGENTS.md` forbids `dark:` and `night:` prefixes and raw hex values outside pixel art swaps. Replace them with the semantic tokens from `globals.css`, map any missing shadcn variables (`--input`, `--accent`, `--popover`) onto the existing tokens, use radius 0, and use a 2px `border` on the editor frame. Do not add a second palette. Editor body text is Geist, and Pixelify Sans is only for headings in the rendered lesson.

**Copy.** The generated UI has its own English strings. Route every user facing string through `src/lib/copy/id.ts`, in Indonesian.

**Existing content.** The audit tells you what format questions use today. Convert stems, explanations, and option bodies to Lexical JSON, including existing LaTeX, with a one off script that is tested on a copy. Whether the old `Text` columns are converted in place or replaced by new `Json` columns is Azka's call if the target database holds real data (section 7). The agent defaults to expand then contract.

Mobile, 375px: the toolbar scrolls inside its own container, and the page itself never scrolls sideways. Editing is desktop first, but the layout must not break. The student view must be fully responsive.

## 4. Learning module

### Shape

Subtest is the course, Topic is the module, and Lesson is the unit. There is no separate course table. The existing admin drill down (subtest, topic, question) gains lessons next to questions.

### Student experience

The Belajar tab opens with a "Lanjutkan belajar" card for the last unfinished lesson, then today's recommended lessons from the daily plan, then subtests with progress such as "4 dari 12 materi selesai". A subtest opens to its topics, and a topic opens to its lessons.

A lesson page shows the title, estimated minutes, and the content. Below it sits "Cek pemahaman", which is three to five linked questions shown one at a time with immediate feedback and the question's explanation. A wrong answer uses the `highlight` color, the label "Perlu dicek lagi", and an icon, never red. Then come "Tandai selesai", a link to the next lesson, and a link "Latihan soal topik ini" into the Tryout tab. Completing a lesson never requires passing the check. There are no scores to compare, no rankings, and no streak shaming.

**Belajar must never create a `TryoutSession`.** If the audit shows that Belajar currently hosts topic practice, move that flow unchanged to the Tryout tab so no working feature is lost. Learning progress is not wellbeing data, so it does not need `wellbeing_consent`, and a student who declined consent can use the whole module.

### Admin experience

Under a topic: create, edit, reorder (up and down buttons, no drag library), publish, and unpublish lessons. The lesson form holds the title, summary, estimated minutes, the Lexical editor, and a picker for check questions taken from the topic's published questions. A "Lihat sebagai siswa" preview uses the same `RichTextView` the students see.

### Data model

This is the proposal. Match the conventions already in the schema, and adjust names only if the audit finds a clash.

```prisma
enum ContentStatus {
  draft
  published

  @@map("content_status")
}

enum ContentSource {
  manual
  ai_assisted

  @@map("content_source")
}

enum LessonProgressStatus {
  in_progress
  completed

  @@map("lesson_progress_status")
}

enum AiGenerationKind {
  lesson_draft
  question_set

  @@map("ai_generation_kind")
}

enum AiGenerationStatus {
  succeeded
  failed

  @@map("ai_generation_status")
}

model Lesson {
  id             String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  topicId        String           @map("topic_id") @db.Uuid
  title          String           @db.VarChar(160)
  summary        String?          @db.VarChar(280)
  content        Json             @db.JsonB
  estMinutes     Int              @default(10) @map("est_minutes")
  sortOrder      Int              @default(0) @map("sort_order") @db.SmallInt
  status         ContentStatus    @default(draft)
  source         ContentSource    @default(manual)
  reviewedAt     DateTime?        @map("reviewed_at") @db.Timestamptz(6)
  createdAt      DateTime         @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime         @updatedAt @map("updated_at") @db.Timestamptz(6)
  topic          Topic            @relation(fields: [topicId], references: [id], onDelete: Restrict)
  checkQuestions LessonQuestion[]
  progress       LessonProgress[]
  planTasks      PlanTask[]

  @@index([topicId, status, sortOrder])
  @@map("lessons")
}

model LessonQuestion {
  lessonId   String   @map("lesson_id") @db.Uuid
  questionId String   @map("question_id") @db.Uuid
  sortOrder  Int      @default(0) @map("sort_order") @db.SmallInt
  lesson     Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@id([lessonId, questionId])
  @@index([questionId])
  @@map("lesson_questions")
}

model LessonProgress {
  id            String               @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId        String               @map("user_id") @db.Uuid
  lessonId      String               @map("lesson_id") @db.Uuid
  status        LessonProgressStatus @default(in_progress)
  checkCorrect  Int?                 @map("check_correct") @db.SmallInt
  checkTotal    Int?                 @map("check_total") @db.SmallInt
  firstViewedAt DateTime             @default(now()) @map("first_viewed_at") @db.Timestamptz(6)
  lastViewedAt  DateTime             @default(now()) @map("last_viewed_at") @db.Timestamptz(6)
  completedAt   DateTime?            @map("completed_at") @db.Timestamptz(6)
  user          User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson        Lesson               @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
  @@index([userId, lastViewedAt])
  @@map("lesson_progress")
}

model AiGeneration {
  id           String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId       String             @map("user_id") @db.Uuid
  topicId      String?            @map("topic_id") @db.Uuid
  kind         AiGenerationKind
  status       AiGenerationStatus
  model        String             @db.VarChar(80)
  params       Json?              @db.JsonB
  inputTokens  Int?               @map("input_tokens")
  outputTokens Int?               @map("output_tokens")
  errorCode    String?            @map("error_code") @db.VarChar(60)
  createdAt    DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)
  user         User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  topic        Topic?             @relation(fields: [topicId], references: [id], onDelete: SetNull)

  @@index([userId, createdAt])
  @@map("ai_generations")
}
```

Changes to existing models: `Question` gains `source` and `reviewedAt` and a `lessonLinks` relation. `PlanTask` gains an optional `lessonId` (relation to `Lesson`, `SetNull`), and `TaskType` gains `lesson`. `Topic` gains `lessons` and `aiGenerations`, and `User` gains `lessonProgress` and `aiGenerations`. The rich text columns follow the decision in section 3. If the audit confirms 15 domain tables today, this takes the count to 19, plus the 3 Better Auth tables.

### Plan integration

This comes after the student views work. The plan builder adds `lesson` tasks from topics where the student's `TopicStat` accuracy is lowest and unfinished published lessons exist. In Recovery mode it prefers short lessons. That needs one new threshold, `RULES.learning.shortLessonMinutes`. Propose 10, and ask Azka before adding it to `src/config/rules.ts`. `decideDailyMode` does not change. Each lesson task gets a "kenapa" line from `lib/copy`, in the same style as the existing tasks.

Lesson checks stay separate from `TopicStat`, so the mastery map still reflects tryouts only.

### Student copy (drafts)

| Context | Copy |
| --- | --- |
| Resume card | Lanjutkan belajar |
| Complete button | Tandai selesai |
| Check section | Cek pemahaman |
| Wrong answer | Perlu dicek lagi |
| Link into practice | Latihan soal topik ini |
| Label on reviewed AI assisted lessons | Disusun dengan bantuan AI dan sudah ditinjau tim MOODI. |

## 5. AI authoring with Gemini

### Boundaries

AI is for admins writing content. It is not for students. Gemini never receives check-in data, notes, calm room sessions, support events, tryout answers, or any other student data, and no tool may expose any of it. This is both a privacy rule (health data, many under 18 users, and free tier terms may allow Google to use submitted content, so check the current Gemini API terms) and the reason the rule engine stays fully rule based. Gemini does not write wellbeing content or help service information either. The calm room and the support page remain hand written and wait for counselor review.

Nothing the model produces is published automatically. Output is saved as a draft with `source = ai_assisted`, and `isPublished` stays false for questions. A human opens the draft in the editor, checks it, and publishes it. Publishing sets `reviewedAt`. Language models get answer keys and arithmetic wrong, so the review screen shows the correct option and the explanation prominently.

### Setup

Use `@google/genai`. The older `@google/generative-ai` package is deprecated. The SDK reads `GEMINI_API_KEY` from the environment. Add these to `.env.example` with empty values and never prefix them with `NEXT_PUBLIC_`:

```dotenv
GEMINI_API_KEY=
GEMINI_MODEL=
```

Model IDs change often, so the model name comes from `GEMINI_MODEL`. Check the current IDs at ai.google.dev, and ask Azka which one to use. Never hardcode a model ID in feature code. Every file that touches the SDK starts with `import "server-only"`. Read the current function calling and structured output pages on ai.google.dev before you write the integration. Do not work from memory of the SDK. Those docs say Gemini 3 models can combine structured output with function calling.

### Structure

```
src/features/ai/
  client.ts            the only place that builds the GoogleGenAI client
  tools.ts             tool declarations and their handlers (read only)
  prompts.ts           system instructions
  schema.ts            Zod schemas for lesson drafts and question sets
  blocks-to-lexical.ts pure mapper from validated blocks to Lexical JSON
  generate-lesson.ts   orchestration for a lesson draft
  generate-questions.ts
  actions.ts           server actions, admin only
src/config/ai.ts       limits (see below)
```

### Tool calling

The model gets read only tools so it can ground its draft in what already exists. It never writes to the database. Only the server action saves, and only after validation.

| Tool | Returns | Why |
| --- | --- | --- |
| `get_topic_context(topicId)` | Subtest name, topic name, existing lesson titles and summaries, published question counts per difficulty | Keeps drafts consistent with the topic |
| `list_existing_question_stems(topicId, limit)` | Plain text stems | Avoids duplicates |
| `get_format_rules()` | Option count and labels, difficulty scale, allowed block types, expected seconds range | Constants from config, so the model does not guess |

Run the loop with a hard cap on tool rounds. When the model is done gathering context, it returns the final draft through structured output that matches the Zod schema. If the repo does not use Zod yet, ask before adding it.

### Lesson drafts

The model does not write Lexical JSON, because that is fragile. It returns a list of typed blocks: heading, paragraph (with text and inline math segments), bullet list, numbered list, worked example, common mistake, hint (collapsible), and display equation. `blocks-to-lexical.ts` maps them into editor state with a pure function and unit tests. Suggested sections for a draft: learning goal, explanation, a worked example, a common mistake, and a short summary. After a lesson draft succeeds, the admin can ask for three to five check questions for the same topic. Those arrive as unpublished question drafts and are linked to the lesson.

### Question drafts

Each question has a stem, the option count and labels the official format requires, exactly one correct option, an explanation, a difficulty, and expected seconds. Take the format from the official SNPMB source and never from memory or blogs. If you cannot reach it, ask Azka to paste it. Server side checks, in this order: schema validity, exactly one correct option, LaTeX that KaTeX can render with `throwOnError`, and a duplicate check against existing stems in the topic after normalizing whitespace and case. A failing item is dropped and counted, and the admin sees how many were dropped.

The system instruction must say that every question is original and that material from past UTBK papers, tutoring companies, or textbooks must not be reproduced. It must also say that the content is Indonesian, uses plain language, makes no claims about raising scores or lowering anxiety, and has no content about self harm or medical advice.

### Limits and failure

Put every limit in `src/config/ai.ts` and nowhere else. Suggested starting values:

| Constant | Start |
| --- | --- |
| `maxToolRounds` | 4 |
| `maxQuestionsPerRequest` | 10 |
| `maxBriefChars` | 600 |
| `requestsPerAdminPerHour` | 15 |
| `timeoutMs` | 45000 |

The hourly limit is enforced by counting recent `ai_generations` rows for the admin, so no extra infrastructure is needed. Every request writes a row, successful or not, with the model, token counts, and an error code. Do not store prompts or model output in that row. The `params` column holds only the topic, kind, counts, and difficulty. Handle 429 and 503 with at most one retry. Free tier quotas are small, so a rate limit response from Google must show a friendly message: say what happened and what to do, for example "Draf belum jadi. Coba lagi beberapa menit lagi." Admin only actions check the role on the server, not just in the UI.

### Admin UI

On a topic page, "Buat draf dengan AI" opens a dialog. It has the kind (lesson or questions), the level, a short brief of up to `maxBriefChars` characters, and the question count when relevant. While generating, it shows a loading state. When it finishes, the admin lands on the new draft in the editor. A banner on that screen says the draft was AI assisted and must be checked before publishing.

Out of scope for now: inline "rewrite with AI" inside the editor, any student facing AI, and streaming.

## 6. Seeder

Fix it, then make it re-runnable. Find the existing seed location in the audit and keep it, and follow the repo's Prisma setup (the generator block suggests Prisma 7, where the seed command lives in `prisma.config.ts`; verify).

### Rules for the rebuilt seeder

It is idempotent. Stable ids come from a small `seedId(key)` helper that derives a UUID from a string with `node:crypto`, so rows can be upserted without adding columns or dependencies. Running `db:seed` twice gives the same database.

It creates users through the Better Auth server API, never by writing password hashes into `Account` by hand, otherwise the demo logins will not work. Passwords come from environment variables (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_DEMO_PASSWORD`). The seed stops with a clear message when one is missing. Add them to `.env.example`.

It never calls Gemini and needs no API key. Seed lessons are written in TypeScript through a small builder that outputs Lexical JSON, so nobody hand writes editor state.

It sets `isPublished` and lesson `status` explicitly. Subtests and topics follow the official SNPMB structure, checked by Azka. Questions are original, in the 30 to 50 range from `AGENTS.md`, each with a verified answer key.

Help services come only from a data file that Azka fills in, with a verification date for every entry. Never write a hotline number from memory. If the file has no verified entries, the seed inserts none and says so.

Demo history is generated relative to today, for the 14 days before today. It goes through the real `decideDailyMode` so `rule_key` and `reason` in `daily_plans` match what the app would have written. The story from `AGENTS.md` must be visible: a night with 4 hours of sleep and high stress lands in Pemulihan, and the autopsy shows most mistakes in the last 15 minutes. The demo student also has two or three completed lessons, one in progress, and a lesson task in today's plan. Today is left without a check-in so the demo video can fill one in live.

### Commands

| Script | Behavior |
| --- | --- |
| `db:seed` | Idempotent upserts. Safe on any database. |
| `db:refresh` | Resets demo data, then runs the seed. Scope `demo` is the default. |
| `db:refresh -- --scope=all` | Wipes every table, then seeds. Local use only. |

`--scope=demo` deletes the demo accounts (their data goes with them through cascade) and re-upserts content. It leaves other users alone and does not delete questions, so existing answers never block it. `--scope=all` requires `--yes`, prints the target host before it runs, and refuses when `NODE_ENV` is `production`. Neither command ever runs automatically on deploy.

## 7. Decisions

Ask Azka where the table says Ask. Where it says Default, proceed with the default and list it in the summary at the end of the phase.

| Decision | Default or ask |
| --- | --- |
| Convert existing rich text in place, or add new columns, when the target database has real data | Ask. Default to expand then contract. |
| Images in lessons and where files are stored | Ask. Default: off. |
| Student rendering: server component or read only Lexical | Default: server component |
| Do lesson checks feed `TopicStat` | Default: no |
| Gemini model ID and whether the key is on a paid tier | Ask |
| New threshold `RULES.learning.shortLessonMinutes` | Ask. Proposed 10. |
| Where reviewed AI assisted content shows its label | Default: lesson page only |
| Adding Zod or a test runner if the repo lacks them | Ask |

The open items in section 13 of `AGENTS.md` that this work touches (database host, ORM, auth) are already decided in the repo. Record that in the audit and in `AGENTS.md`.

## 8. Testing

Table driven unit tests for `blocks-to-lexical`, the node allowlist validator, the question draft checks, `seedId`, and the hourly limit counter. A round trip test for editor state: JSON in, rendered output out, with equations. If the repo has no test runner, ask before adding Vitest. A rule or threshold change needs its own test in the same commit, as `AGENTS.md` already says.

## 9. Changes to AGENTS.md

Update `AGENTS.md` in the same pull request so it stays true.

Ground rule 3 currently says "No LLM". Change it to: no LLM in anything a student sees or in any wellbeing logic, every recommendation is still explainable with one rule and one sentence, and Gemini is allowed only for admin authoring of lessons and questions, with human review before publishing. Section 4 gains `@google/genai` and Lexical. Section 5 gains `features/learn`, `features/ai`, and `components/editor`. Section 8 gets the learning module and AI authoring, each marked built or planned according to what actually works. Section 9 gets the new tables and the real Prisma enum names. Section 12 gets the new scripts and environment variables. The glossary gets Materi (lesson) and Cek pemahaman.

Also update the proposal and the judge facing `README.md` if they say "no LLM" or describe Belajar. Nothing planned may be presented as built.

## 10. Definition of done

Everything in section 14 of `AGENTS.md`, plus the following. One demo path works end to end on a clean database: an admin opens a topic, asks Gemini for a lesson draft, edits it in the Lexical editor, publishes it, and a student finds it in Belajar, reads it, answers the check questions, marks it complete, and sees progress. After that, `db:refresh` rebuilds the whole demo in one command. The Belajar tab creates no `TryoutSession`. Existing topic practice still works from the Tryout tab. No Gemini call can be triggered by a non admin. `GEMINI_API_KEY` never appears in client bundles, logs, or the repo. The editor and the lesson view pass the 375px, 768px, and 1280px checks in Light, Night, and Dark. Type check, lint, build, and tests all pass.
