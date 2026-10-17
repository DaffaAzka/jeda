# MOODI LMS Overhaul — Comprehensive Repository Audit

**Date:** 2026-10-17  
**Branch:** `feat/lms-overhaul`  
**Auditor:** AI Assistant (Antigravity)

---

## 1. Route Map

The application uses English slug routing under `app/(auth)` and `app/(dashboard)`. Below is the end-to-end audit for every screen.

| # | Route | File Path | Role | Description | End-to-End Status |
|---|---|---|---|---|---|
| 1 | `/` | `app/page.tsx` | Public | Landing page with pixel study scene, value proposition, features overview, how it works, and SDG disclaimers. | **Working** |
| 2 | `/login` | `app/(auth)/login/page.tsx` | Public | Email/password sign-in with Better Auth, Cloudflare Turnstile bot protection, and rate limiting. | **Working** |
| 3 | `/register` | `app/(auth)/register/page.tsx` | Public | Student registration including target university/major, exam date, and wellbeing consent. | **Working** |
| 4 | `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | Student | If no check-in today: presents 30s check-in form. If checked in: displays daily adaptive plan, mode badge (Pemulihan/Seimbang/Gas Pol), task list, and condition summary. | **Working** |
| 5 | `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | Admin | Admin overview displaying total subtests, topics, published questions, drafts, and navigation cards. | **Working** |
| 6 | `/dashboard/study` | `app/(dashboard)/dashboard/study/page.tsx` | Student | Catalog of subtests & topics. Clicking a topic launches a practice session modal (question count & time mode), which creates a `TryoutSession`. | **Working technically**, but operates as question practice instead of real learning material (materi). |
| 7 | `/dashboard/mock-exam` | `app/(dashboard)/dashboard/mock-exam/page.tsx` | Student | Tryout hub for launching full UTBK simulation or timed subtest practice; shows active sessions and recent history. | **Working** |
| 8 | `/dashboard/sessions/[sessionId]` | `app/(dashboard)/dashboard/sessions/[sessionId]/page.tsx` | Student | Live question runner with question navigator, countdown timer, options, and "Napas dulu" 4-4-4-4 breathing overlay modal. | **Working** |
| 9 | `/dashboard/sessions/[sessionId]/review` | `app/(dashboard)/dashboard/sessions/[sessionId]/review/page.tsx` | Student | Post-session error autopsy: score, correct answers, full LaTeX explanations, and error cause tagging (`didnt_know`, `out_of_time`, `panic`, `careless`). | **Working** |
| 10 | `/dashboard/insight` | `app/(dashboard)/dashboard/insight/page.tsx` | Student | 14-day sleep vs. stress dual chart, dominant error pattern analysis, and topic mastery meter. | **Working** |
| 11 | `/dashboard/calm` | `app/(dashboard)/dashboard/calm/page.tsx` | Student | Ruang Tenang: 4-4-4-4 box breathing, 5-4-3-2-1 grounding checklist, and cognitive reframing ("Pikiran vs Fakta"). | **Working**, but calls Gemini with student thoughts in `gemini-reframe.ts` (violating student privacy and Ground Rule 3). |
| 12 | `/dashboard/support` | `app/(dashboard)/dashboard/support/page.tsx` | Student & Admin | Directory of verified crisis hotlines, counselors, and organizations with action logging (`shown`, `opened`, `contacted`). | **Working** |
| 13 | `/dashboard/question-bank` | `app/(dashboard)/dashboard/question-bank/page.tsx` | Admin | Overview of question bank hierarchy and content stats. | **Working** |
| 14 | `/dashboard/question-bank/subtests` | `app/(dashboard)/dashboard/question-bank/subtests/page.tsx` | Admin | CRUD management for UTBK subtests (code, name, defaultSeconds). | **Working** |
| 15 | `/dashboard/question-bank/topics` | `app/(dashboard)/dashboard/question-bank/topics/page.tsx` | Admin | CRUD management for topics under subtests. | **Working** |
| 16 | `/dashboard/question-bank/questions` | `app/(dashboard)/dashboard/question-bank/questions/page.tsx` | Admin | Filterable, paginated question list with publication status toggles. | **Working** |
| 17 | `/dashboard/question-bank/questions/new` | `app/(dashboard)/dashboard/question-bank/questions/new/page.tsx` | Admin | Question creation form: stem & explanation in rich text with LaTeX, option builder with correct answer selection. | **Working** |
| 18 | `/dashboard/question-bank/questions/[questionId]/edit` | `app/(dashboard)/dashboard/question-bank/questions/[questionId]/edit/page.tsx` | Admin | Edit existing question, options, difficulty, time estimate, and published state. | **Working** |
| 19 | `/api/auth/[...all]` | `app/api/auth/[...all]/route.ts` | Public | Better Auth route handling authentication, sessions, and Turnstile tokens. | **Working** |

---

## 2. Module Status Table

Status of each core module described in `AGENTS.md` (and related architectural requirements):

| Module | Status | Notes |
|---|---|---|
| **Daily Check-in & Consent** | **Working** | 30-second check-in evaluates sleep, energy, mood, stress, and notes. Without consent, daily mode defaults to `balanced` under rule `no_consent`. |
| **Adaptive Daily Plan** | **Working** | Deterministic rule engine (`RULES.recovery`, `RULES.challenge`, `RULES.referral`) selects day mode and generates task breakdown with single-sentence "kenapa" explanations. |
| **Belajar (Learning Module)** | **Stub / Misaligned** | There is no data model for lessons or learning content (`Lesson`). `Topic` only groups questions. Belajar directly starts a 5–15 question `TryoutSession`. |
| **Tryout & Practice Runner** | **Working** | Full simulation and timed subtest practice work smoothly with timers, question grids, panic breathing overlays, and completion checks. |
| **Review & Error Autopsy** | **Working** | Question review displays KaTeX math, answer keys, explanations, heuristic auto-tagging (`guessErrorTag`), and student-selected error causes. |
| **Insight (Wawasan Belajar)** | **Working** | 14-day chart of sleep vs. stress, error autopsy pattern breakdown, and topic accuracy indicators. |
| **Ruang Tenang (Calm Room)** | **Partial / Misaligned** | Breathing and grounding work purely on the client. However, cognitive reframing (`reframeThoughtWithGemini`) sends student input directly to Gemini, violating the no-student-LLM policy. |
| **Bantuan (Support Directory)** | **Working** | Verified Indonesian mental health and crisis contacts with structured action logging. |
| **Admin CRUD (Bank Soal)** | **Working** | Full creation, modification, filtering, and deletion for Subtests, Topics, and Questions with foreign key protection. |

---

## 3. How Belajar Works Today & Overlap with Tryout

### File-by-File Flow:
1. **`app/(dashboard)/dashboard/study/page.tsx`**:
   - Authenticates session and ensures the user is a student.
   - Fetches subtests, topics, question availability, and user stats via `getStudyCatalogData(userId)` in `features/practice/queries.ts`.
   - Passes data into `StudyCatalog`.
2. **`features/practice/components/study-catalog.tsx`**:
   - Renders `ActiveSessionCard` if the user has an ongoing session.
   - Lists subtests and their topics with accuracy stats from `TopicStat`.
   - Clicking "Pilih" opens a modal using `LevelPicker` (setting mode: `relaxed`, `timed`, `full_simulation`) and question presets (5, 10, 15).
   - "Mulai Latihan" calls `startSessionAction({ scopeType: "topic", scopeId: selectedTopic.id, level, questionCount })`.
3. **`features/practice/actions.ts` & `features/practice/services/start-session.ts`**:
   - Validates input and queries `prisma.question` for published questions matching the `topicId`.
   - Creates a new `prisma.tryoutSession` row with `topicId: topic.id`, `mode`, and `endsAt`.
   - Inserts `prisma.sessionAnswer` rows with `sortOrder`.
   - Redirects the student to `/dashboard/sessions/[sessionId]`.
4. **`app/(dashboard)/dashboard/sessions/[sessionId]/page.tsx` & `features/practice/components/session-runner.tsx`**:
   - Runs the session identically to a tryout, sharing the timer, navigator, options, and breathing overlay.
5. **`app/(dashboard)/dashboard/sessions/[sessionId]/review/page.tsx` & `features/practice/components/review-list.tsx`**:
   - Shows results and error autopsy for both topic practice and mock exams.
6. **`features/practice/services/finish-session.ts`**:
   - Calculates score and upserts `prisma.topicStat` (`attempts`, `correct`), directly mutating tryout mastery stats.

### Overlap Summary:
- **Shared Model**: Belajar creates a `TryoutSession` with `topicId` set, while tryout sets `subtestId`.
- **Shared Actions & Services**: Both rely on `startSessionAction`, `startSessionService`, `saveAnswerAction`, and `finishSessionService`.
- **Shared Components**: `ActiveSessionCard`, `LevelPicker`, `SessionRunner`, `SessionTimer`, `QuestionNavigator`, `BreathingOverlay`, `ReviewList`, `ErrorTagPicker`.
- **Contamination of Mastery**: Completing a Belajar session alters `TopicStat`, meaning learning practice contaminates the student's mock exam mastery indicators.

---

## 4. Rich Text Editing and Rendering

- **Current Editor**: **Tiptap** (`@tiptap/react` `^3.31.4`, `@tiptap/starter-kit`, `@tiptap/extension-mathematics`, `@tiptap/extension-placeholder`).
- **Editor Component**: `features/question-bank/components/rich-text-editor.tsx` (`RichTextEditor`).
- **Where Edited**: Used in `features/question-bank/components/question-form.tsx` for question `stem`, `explanation`, and each option `body`.
- **Stored Format**: Serialized JSON string of the Tiptap document:
  ```json
  { "type": "doc", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "..." }] }] }
  ```
- **How LaTeX is Stored**: Stored inside Tiptap document AST nodes:
  - Inline formula: `{ "type": "inlineMath", "attrs": { "latex": "x^2 + y^2 = z^2" } }`
  - Block formula: `{ "type": "blockMath", "attrs": { "latex": "x^2 + y^2 = z^2" } }`
- **Database Columns**:
  - `Question.stem`: `String @db.Text`
  - `Question.explanation`: `String? @db.Text`
  - `QuestionOption.body`: `String @db.Text`
- **Current Rendering Component**: `components/rich-content.tsx` (`RichContent`).
  - Parses JSON string on the server/client and renders AST nodes into React elements.
  - LaTeX rendered via `katex.renderToString(latex, { displayMode, throwOnError: false })` using `dangerouslySetInnerHTML`.

---

## 5. Current Seeder Audit

The current seed script is in `prisma/seed.ts` (with helpers in `prisma/seed-data/`).

### What It Creates:
1. 7 Subtests (KPU, PPU, PBM, PK, LBI, LBE, PM) and 26 Topics (`SEED_SUBTESTS`).
2. 35 Original UTBK questions with 5 options each (A–E), explanations, and `isPublished: true`.
3. 6 Verified support resources (`SEED_SUPPORT_RESOURCES`).
4. 1 Demo student (`student@wtc.com`, name "Lia", role "student") with `StudentProfile`.
5. Promotes `azkadaiki26@gmail.com` to admin if already present.
6. 14 Days of check-ins ending on Day 0 (today) with low sleep (4h) and high stress (4).
7. 1 Daily plan for today in `recovery` mode with 3 tasks.
8. 3 Demo tryout sessions with error autopsy tags (including panic in the last 15 minutes).
9. Pre-calculated `TopicStat` entries.

### Does it run on an empty database?
**NO — it leaves the application unusable for authentication and testing.**

### Failure Points and Usability Issues:
1. **No Better Auth Account for Demo Student**: It writes directly to `prisma.user.create`, but never creates an `Account` record with a password hash or calls Better Auth's server API. Consequently, the demo student cannot log in via `/login`.
2. **No Admin User on Empty DB**: It uses `prisma.user.updateMany({ where: { email: "azkadaiki26@gmail.com" } })`. If the database is blank, no admin is created, leaving all admin routes inaccessible.
3. **Hardcoded Credentials**: Emails and logins are hardcoded instead of reading `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and `SEED_DEMO_PASSWORD`.
4. **Day 0 (Today) is Pre-Populated**: Fills in today's check-in and plan, preventing live demonstration of the daily check-in flow.
5. **Lack of Idempotent IDs**: Questions are looked up via `findFirst({ where: { topicId, stem } })` rather than deterministic keys (`seedId`). Re-running causes duplicate questions or orphan errors.
6. **No Scope Control**: Destructively deletes all demo plans and sessions without granular `--scope=demo` or `--scope=all` options.
7. **No Learning Content**: Does not seed any lessons or learning progress.

---

## 6. Discrepancies Between `AGENTS.md` and the Repository

1. **`AGENTS.md` File Content**: In the repository, `AGENTS.md` contains only Next.js 16 agent rules generated by `next dev`. The original specification was either committed externally or overwritten.
2. **Database & Auth Status**: `AGENTS.md` marked database and auth tables as "Open" and cited DBML. The repo has fully settled on Prisma 7 with PostgreSQL and Better Auth.
3. **Database Enum Names**:
   - `TryoutMode`: `relaxed`, `timed`, `full_simulation` (vs. `timed` / `loose` / `full`).
   - `ErrorCause`: `didnt_know`, `out_of_time`, `panic`, `careless` (vs. `not_known` / `time_pressure`).
   - `TagSource`: `auto`, `user` (vs. `system_guess` / `student`).
   - `DayMode`: `recovery`, `balanced`, `challenge` (vs. `pemulihan`).
4. **Route Slugs**: `AGENTS.md` specified Indonesian slugs (`/belajar`, `/tryout`), but the repository uses English slugs (`/dashboard/study`, `/dashboard/mock-exam`, `/dashboard/sessions`, etc.).
5. **Ground Rule 3 & Student LLM Usage**: `AGENTS.md` stated "No LLM". The repo introduced Gemini call in `lib/ai/gemini-reframe.ts` directly processing student thoughts in Ruang Tenang, conflicting with student privacy and explainability principles.
6. **Rich Text Editor**: Repo currently uses Tiptap (`@tiptap/react`), not Lexical.
7. **PlanTask TaskType**: Schema currently has `review`, `practice`, `tryout`, `rest`, `calm`. The new `lesson` task type is missing.

---

## 7. Relevant Dependencies and Versions

- **Prisma**:
  - `prisma`: `^7.10.0`
  - `@prisma/client`: `^7.10.0`
  - `@prisma/adapter-pg`: `^7.10.0`
  - `pg`: `^8.23.1`
- **Zod**:
  - `zod`: `^4.6.7` (already installed and active)
- **KaTeX**:
  - `katex`: `^0.18.10`
- **Lexical**:
  - **Not installed** (currently using Tiptap `^3.31.4`)
- **Test Runner**:
  - `vitest`: `^3.2.7`
  - Tests passing: 36 tests across 4 test suites
- **Google GenAI**:
  - `@google/genai`: `^2.29.1` (installed, but currently used via raw fetch in `gemini-reframe.ts`)

---
*Audit completed and verified against active workspace.*
