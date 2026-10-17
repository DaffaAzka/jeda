<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 1. What MOODI is

MOODI is a mobile-first web platform for UTBK preparation that adapts the study plan to how the student feels today, not only to their tryout scores. The student fills a 30 second check-in about sleep, energy, mood, and stress. A small rule engine turns that into a daily mode, and the rest of the app follows it. A heavy day gets light tasks. A strong day gets a full simulation.

Three things set it apart from other UTBK platforms. Error autopsy tags every wrong answer with its cause (did not know, ran out of time, panicked, careless), so the dashboard can separate gaps in material from problems under pressure. The panic button gives a 30 to 60 second breathing or grounding exercise during a tryout and records the use as data. Graded exposure raises tryouts step by step, from no timer, to a loose timer, to a full simulation with the real time limit.

Belajar is a dedicated learning module with structured lessons (materi) and immediate low-stakes comprehension checks (cek pemahaman). It never creates tryout sessions, so learning progress never contaminates mock exam mastery stats.

There is no leaderboard, and rest days count toward consistency. MOODI is wellbeing support. It is never therapy and never a diagnosis. It speaks to SDG 3 (target 3.4, mental health and well-being) and SDG 4 (targets 4.3 and 4.5, affordable and equal access to higher education prep).

It is built for the ITASE 7.0 Web Development competition (HMSI, Telkom University Purwokerto). Submission is 17 to 18 October 2026, selection is 20 to 25 October, finalists are announced 26 October, and the online final is 7 November 2026. The judging weights are innovation and SDG fit 30%, interface and layout 30%, clarity of purpose and features 20%, and technical completeness 20%. That 30% on interface is why the design section below is detailed.

## 2. Ground rules

1. One tidy vertical slice beats nine half-built modules. Build in the order of section 8 and stop at the MVP line.
2. The interface and docs may only present features that actually work as existing. Planned features stay labelled as planned.
3. No LLM in anything a student sees or in any wellbeing logic. Every recommendation is still explainable with one rule and one sentence. Gemini is allowed only for admin authoring of lessons and questions, with human review before publishing. Cognitive reframing in the calm room is 100% local CBT logic to guarantee zero student data exposure. No WebSocket, no microservices, no native or Flutter app, and no CMS.
4. Never invent helpline numbers, legal article numbers, statistics, or database columns. Never copy UTBK questions or tutoring-company material. All questions are original.
5. Ask before you add a dependency, pick one of the open decisions in section 13, or change a threshold in `src/config/rules.ts`.
6. Never commit secrets. `.env` stays out of git. Keep `.env.example` current.
7. Every code path that reads or writes wellbeing data checks consent first (section 9).
8. Take the layout rhythm from the GDGoC IPB reference. Do not take its assets, wording, logo, or the Chrome dino. The competition requires original work.

## 3. Competition constraints

These come from the guidebook and cannot be traded away. The site must be responsive and written in Indonesian or English (MOODI uses Indonesian). It must be hosted publicly before submission. Free hosting and a free domain are allowed and earn no bonus. WordPress, Joomla, Drupal, and similar CMSs are banned. The work must be original and must not contain SARA, pornography, violence, or content that offends a group. The public GitHub repository link is part of the submission, so the repository has to be clean and its README has to make sense to a judge. This file is for agents, so the judge-facing `README.md` is a separate file.

The proposal PDF and the demo video have their own rules. They are in sections 13 to 16 of the project summary and are not repeated here.

## 4. Stack

| Layer | Choice | Status |
| --- | --- | --- |
| Framework | Next.js App Router (v16.4), TypeScript | Decided |
| Styling | Tailwind CSS v4 (configured in CSS, no `tailwind.config.js`), shadcn/ui | Decided |
| Fonts | Geist for body text, Pixelify Sans for display, both through `next/font` | Decided |
| Charts | Recharts | Decided |
| Breathing animation | CSS keyframes, no animation library | Decided |
| Backend | Server actions and route handlers inside the same Next.js app | Decided |
| Rule engine | Plain TypeScript module with a threshold config | Decided |
| Hosting | Vercel (check the current free plan limits) | Decided |
| Theme switching | `next-themes` with `attribute="data-theme"` | Decided |
| Database | PostgreSQL (Neon or Supabase) with `@prisma/adapter-pg` | Decided |
| ORM | Prisma Client v7 | Decided |
| Auth | Better Auth v1 with email and password | Decided |
| Rich Text Editor | Lexical (`@lexical/*`) for admin editor, lightweight server AST renderer for students | Decided |
| Math Rendering | KaTeX (server-side, `trust: false`) | Decided |
| AI Authoring | `@google/genai` (admin-only drafting with read-only tools and human review) | Decided |
| Test Runner | Vitest | Decided |

One app, one deployment. Do not add a separate backend.

## 5. Project structure

```
app/
  layout.tsx                 fonts, document shell, and theme provider
  globals.css                design tokens (section 11.3)
  page.tsx                   public landing page
  (auth)/                    login and register routes
  (dashboard)/
    dashboard/
      layout.tsx             authenticated shell and role-aware navigation
      page.tsx               Beranda (daily mode and tasks)
      study/                 Belajar (learning hub and lesson view)
      mock-exam/             Tryout (graded exposure sessions and topic practice)
      insights/              Insight (wellbeing correlation and mastery map)
      calm/                  Ruang Tenang (local CBT reframing, breathing, grounding)
      question-bank/         Admin question bank and topic management
features/
  learn/                     Learning module: lessons, check questions, study hub
  ai/                        Gemini authoring tools, schemas, and orchestration (admin-only)
  practice/                  Tryout sessions, mock exams, error autopsy
  checkin/                   Daily check-in form and plan generation
  insight/                   Mastery map and error distribution analytics
  calm/                      Calm room tools (breathing, grounding, local CBT reframing)
  question-bank/             Admin CRUD actions, forms, and question management
components/
  editor/                    Trimmed Lexical editor and student RichTextView
  sidebar.tsx                Role-aware dashboard navigation
  ui/                        Shadcn UI primitives
  pixel/                     PixelButton, PixelCard, PixelIcon, PixelScene
lib/
  rules/                     Pure rule engine, no framework or database imports
  cbt/                       Local CBT thought reframing (100% client/server local)
  editor/                    Lexical AST validation and Tiptap migration helpers
  copy/id.ts                 All Indonesian UI strings and rule reasons
  crypto.ts                  Encryption for free-text notes
  seed-id.ts                 Deterministic UUID v4 generator for idempotent seeds
prisma/
  schema.prisma              Source of truth database schema
  seed.ts                    Idempotent seeder
  refresh.ts                 Re-runnable reset and refresh script
docs/
  lms-overhaul/              Overhaul brief and audit documentation
```

Code, identifiers, database names, and URL slugs are in English. Everything the student reads in the interface is in Indonesian. Use English route slugs such as `/dashboard`, `/dashboard/study`, `/dashboard/mock-exam`, `/dashboard/insights`, and `/dashboard/calm`; do not translate URL paths to match Indonesian tab labels.

## 6. Clean code conventions

Keep functions small and single-purpose, and name them for what they decide or return (`decideDailyMode`, `shouldShowReferral`), not for how they work. Prefer early returns over nested conditions. Comments explain why, never what. Delete dead code instead of commenting it out.

Types do real work here. No `any`. Model fixed sets as `as const` arrays and derive the union type from them, for example `DayMode`, `ErrorCause`, `ExposureLevel`. Validate input once at the boundary of each server action with Zod schemas, call a service function, then revalidate. A server action should read like three lines of intent, not forty lines of logic.

No magic numbers. Every threshold lives in `src/config/rules.ts` or `src/config/ai.ts` and is passed into the functions as an argument, which keeps them pure and trivially testable. The rule engine imports nothing from Next.js, the database client, or React. It takes plain data in and returns plain data out.

Components are server components by default. Mark a component `"use client"` only when it needs state or events (the check-in form, the tryout timer, the breathing exercise, the charts, the Lexical editor). Feature code stays inside its feature folder, and shared pieces move to `components/` or `lib/` only after a second feature needs them.

User-facing text never appears inline in components. It comes from `lib/copy/id.ts`, which also keeps a future English version possible.

Tests target the rule engine, AST validator, draft checks, and seed ID helpers first as table-driven unit tests. A change to a rule or a threshold needs a test in the same commit.

## Types and Prisma

- Treat generated Prisma model and enum types as the source of truth. Import them with `import type` from the generated Prisma client (`@/app/generated/prisma` or `@prisma/client`).
- Never hand-write a type that mirrors a Prisma model, enum, relation, or query result.
- Define form and request validation with Zod schemas, and derive their TypeScript types with `z.infer`.
- Put read-only database access in feature `queries.ts` modules, mutations in `actions.ts`, schemas and inferred input types in `schemas.ts`, and feature UI in `components/`.
- Keep route pages thin: authorize, call query functions, and compose feature components.
- Use `import type` for type-only imports. Never import the Prisma client runtime into client components.
- Convert non-serializable Prisma values such as `Decimal` and `BigInt` before passing them to client components.
- Do not use `any` or create duplicate model types.

## Performance and Optimization

- Keep exactly one `PrismaClient` instance in `lib/prisma.ts`, using the `globalThis` singleton pattern for development hot reload.
- Select only fields required by the consuming UI or operation. Prefer relations in one query or `Promise.all` for independent reads to avoid N+1 queries.
- Paginate every potentially large list with `take` and `skip` or a cursor. Never load an unbounded table into a page.
- Keep `"use client"` on the smallest interactive leaf components. Keep database queries and credentials server-only.
- Use `next/dynamic` for heavy client-only modules (such as Lexical RichTextEditor on admin pages), `<Suspense>` and route `loading.tsx` for slow sections, and `next/image` for images.
- Revalidate only the affected paths or tags after mutations. Do not disable caching globally.

## 7. Rule engine

All modules write to one history of the student's condition. One rule engine reads that history each day and chooses the mode. Other modules then adapt to the mode. The engine runs when a check-in is saved and when a tryout session ends. There is no cron job.

The numbers below are the team's starting heuristics. They are not clinical standards, and the interface and docs must say so. Never write that MOODI raises scores or lowers anxiety. The safe claim is that it helps students notice mistakes caused by pressure, and a small pilot with 10 to 20 students is the proposed next validation.

| Rule key | Trigger (starting values) | Result |
| --- | --- | --- |
| `recovery` | Sleep under 5 hours, or stress 4 or higher (scale 1 to 5) | Two or three light tasks, 15 to 20 minute review, short lessons (<= 10 mins), no timed tryout, a rest suggestion |
| `balanced` | Anything else (default) | Mix of lessons, practice, and review, tryout with a loose timer |
| `challenge` | Sleep 7 hours or more, energy 4 or higher, stress 2 or lower | Full simulation with the real time limit, challenging lessons and practice |
| `referral` | Three days in a row where mood is 2 or lower, or stress is 4 or higher | Gentle referral screen with verified help services and an option to contact the school counselor |
| `rest_suggestion` | Accuracy falls while study time rises for two days in a row | A message to ease the load, without blaming the student |
| `graded_exposure` | More than 40% of mistakes tagged panic or time-out across the last three tryouts | Offer a breathing exercise and a lighter next tryout level |

Evaluate `recovery` before `challenge`, so the safer mode wins any overlap.

```ts
// config/rules.ts
export const RULES = {
  recovery: { sleepBelowHours: 5, stressAtLeast: 4 },
  challenge: { sleepAtLeastHours: 7, energyAtLeast: 4, stressAtMost: 2 },
  referral: { consecutiveDays: 3, moodAtMost: 2, stressAtLeast: 4 },
  restSuggestion: { consecutiveDays: 2 },
  gradedExposure: { panicOrTimeoutShare: 0.4, recentTryouts: 3 },
  insights: { minCheckins: 7 },
  learning: { shortLessonMinutes: 10 },
} as const;
```

The engine returns a rule key and the facts it used. It does not return display text. A function in `lib/copy` turns those into the "kenapa saya disarankan ini" sentence. The rule key and that sentence are saved in `daily_plans.rule_key` and `daily_plans.reason`, so every recommendation can be explained to a student or a judge.

## 8. Modules and MVP scope

| Module | Status | Scope |
| --- | --- | --- |
| Daily check-in & adaptive plan | Built | 4 inputs (sleep, energy, mood, stress), 3 daily modes, plan tasks with "kenapa" lines |
| Learning module (Belajar) | Built | Subtest/topic hierarchy, structured lessons (materi), Lexical reader, inline "Cek pemahaman" checks with constructive feedback (no tryout session creation) |
| Tryout & practice | Built | Graded exposure (`relaxed`, `timed`, `full_simulation`), panic button ("Napas dulu"), topic-specific practice tab |
| Error autopsy | Built | Post-tryout tagging (`not_known`, `out_of_time`, `panic`, `careless`) with auto-suggestions and student confirmation |
| Insight dashboard | Built | Weekly sleep/mood vs accuracy correlation, error tag distribution, topic mastery map (tryout-only data) |
| Calm room (Ruang Tenang) | Built | 4-4-4-4 box breathing animation, 5-4-3-2-1 grounding checklist, local CBT thought reframing, private journal |
| Support & referral | Built | Gentle referral screen triggered by 3 consecutive heavy days, verified help resources list |
| Admin CRUD & Rich Text | Built | Subtests, topics, questions, and lessons with trimmed Lexical editor and KaTeX math |
| AI Authoring (Admin-only) | Built | Gemini 2.5/3 assistant drafting lessons and questions via read-only tools and structured output; human review required before publishing |
| Seeder & db:refresh | Built | Idempotent upserts, Better Auth server user creation, `--scope=demo` and `--scope=all` resets |
| School counselor dashboard | Planned | Anonymous dashboard with student consent |
| Usability pilot | Planned | Usability study with 10 to 20 students |

## 9. Data

PostgreSQL schema managed via Prisma Client v7. The Prisma schema (`prisma/schema.prisma`) is the sole authoritative source of truth.

There are 19 application domain tables in six groups, plus 3 Better Auth tables (`users`, `sessions`, `accounts`, `verifications`):

| Group | Tables | Description |
| --- | --- | --- |
| Account | `users`, `student_profiles` | Student target university, major, exam date, wellbeing consent |
| Learning | `lessons`, `lesson_questions`, `lesson_progress` | Lessons with Lexical JSON AST, linked check questions, student progress tracking |
| Question bank | `subtests`, `topics`, `questions`, `question_options` | UTBK syllabus structure, original questions, KaTeX math options |
| Practice | `tryout_sessions`, `session_answers`, `topic_stats` | Graded exposure sessions, question timestamps, error cause tags |
| Wellbeing & plan | `checkins` (sensitive), `daily_plans`, `plan_tasks`, `calm_sessions` (sensitive) | Daily condition records, daily mode plans, calm room activity |
| Support & AI | `support_resources`, `support_events` (sensitive), `ai_generations` | Verified help resources, referral logs, AI authoring audit trails |

Real Database Enum Names:
- `TryoutMode`: `timed`, `relaxed`, `full_simulation`
- `ErrorCause`: `not_known`, `out_of_time`, `panic`, `careless`
- `TagSource`: `auto`, `user`
- `DayMode`: `recovery`, `balanced`, `challenge`
- `ContentStatus`: `draft`, `published`
- `ContentSource`: `manual`, `ai_assisted`
- `LessonProgressStatus`: `in_progress`, `completed`
- `AiGenerationKind`: `lesson_draft`, `question_set`
- `AiGenerationStatus`: `succeeded`, `failed`

Key design decisions:
- `session_answers.elapsed_seconds` makes time-pressure mistake clustering computable for the error autopsy.
- `Lesson` check questions are stored in `lesson_questions` and progress is in `lesson_progress`. They never create a `TryoutSession`, so mastery stats remain uncontaminated.
- Sensitive wellbeing tables are only written when `wellbeing_consent` is true.

## 10. Privacy, safety, and tone

MOODI touches student wellbeing, so this section carries real weight.

- Zero Student Data Sent to LLMs: Gemini is strictly for admin authoring of lessons and questions. Student check-ins, journal notes, calm room sessions, and tryout answers are never sent to any external model. CBT reframing is computed 100% locally.
- Check-in results carry no clinical labels, and the app states clearly: "MOODI mendukung kesejahteraanmu, bukan pengganti psikolog atau konselor."
- The referral screen is gentle and never judgmental. Help service numbers come only from verified records in `support_resources` with verification dates.
- No leaderboards, no rankings, no streak shaming, and no red colors for wrong answers in student views.

## 11. Design system

### 11.1 Direction

MOODI combines clean Google clarity with soft pixel character: hard-edged borders, offset shadows, 0 corner radius, and illustrations built on an 8px grid.

### 11.2 Two independent axes: theme and mode

- **Theme (`data-theme`):** `light` (Terang), `night` (Malam), `dark` (Gelap). Set by user.
- **Mode (`data-mode`):** `recovery`, `balanced`, `challenge`. Set by the rule engine.

### 11.3 Tokens

Defined in `globals.css`:
- Brand palette: `moodi-sky` (`#9adcff`), `moodi-butter` (`#fff89a`), `moodi-peach` (`#ffb2a6`), `moodi-pink` (`#ff8aae`), `ink` (`#1f2a3a`).
- Semantic tokens: `border`, `background`, `foreground`, `card`, `muted`, `link`.
- Utilities: `pixel-border` (2px), `pixel-shadow` (4px offset), `pixel-shadow-sm` (2px offset), `pixel-press` (active transform).

### 11.4 Voice

Indonesian, informal "kamu", sentence case, plain verbs, active voice. No em-dashes anywhere in copy or docs. No clinical labels about the student.

| Context | Copy |
| --- | --- |
| Check-in prompt | Hari ini kamu gimana? |
| Reason line | Kenapa ini? Tidurmu 4 jam, jadi hari ini kita ringan dulu. |
| Wrong answer label | Perlu dicek lagi |
| Rest day | Hari istirahat tetap dihitung. |
| Panic button | Napas dulu |
| Empty insight | Insight muncul setelah 7 check-in. Baru 3 yang terisi. |
| Save error | Check-in belum tersimpan. Cek koneksimu, lalu coba lagi. |
| Referral screen opening | Beberapa hari ini terasa berat. Kamu tidak harus menghadapinya sendirian. |
| Disclaimer | MOODI mendukung kesejahteraanmu, bukan pengganti psikolog atau konselor. |
| Lesson AI badge | Disusun dengan bantuan AI dan sudah ditinjau tim MOODI. |

## 12. Running, testing, deploying

### Scripts

- `npm run dev`: Launch local Next.js development server
- `npm run build`: Generate Prisma client and build production bundle
- `npm run test`: Run Vitest unit tests
- `npm run lint`: Run ESLint checks
- `npm run db:generate`: Generate Prisma Client
- `npm run db:migrate`: Run Prisma migrations
- `npm run db:seed`: Idempotent upsert seed (subtests, topics, questions, lessons, resources, demo accounts, 14-day history)
- `npm run db:refresh`: Reset demo student data and re-seed clean state
- `npm run db:refresh -- --scope=all --yes`: Full database wipe and fresh seed (local/dev only)

### Environment Variables

Configured in `.env` locally and in deployment platforms:
- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Random 32+ character auth encryption secret
- `BETTER_AUTH_URL`: Canonical public URL of the application
- `GEMINI_API_KEY`: API key for admin AI authoring tools
- `GEMINI_MODEL`: Model identifier for Gemini (e.g. `gemini-2.5-flash`)
- `SEED_ADMIN_EMAIL`: Admin email for seeding
- `SEED_ADMIN_PASSWORD`: Admin password for seeding
- `SEED_DEMO_PASSWORD`: Demo student password for seeding

## 13. Settled decisions

- Database host: PostgreSQL (Neon / Supabase compatible) with `@prisma/adapter-pg`.
- ORM: Prisma Client v7.
- Auth library: Better Auth with email and password accounts.
- Rich text editor: Lexical for admin editor; server-side AST component for students.
- Student AI boundary: Zero student data sent to external AI; local CBT reframing in Ruang Tenang.

## 14. Definition of done

A change is done when all of these hold:
- It works at 375px, 768px, and 1280px in Light, Night, and Dark.
- It uses tokens only: no raw hex values and no `dark:` or `night:` prefixes outside pixel art swaps.
- Every string comes from `lib/copy`, is Indonesian, and has no em-dashes.
- Types, lint, and tests pass, and any rule change has a test.
- Wellbeing reads and writes are gated by consent.
- Belajar tab never creates a `TryoutSession`.
- Idempotent seeder and `db:refresh` run cleanly.
- Nothing planned is presented as built.

## 15. Glossary

| Term | Meaning in code and UI |
| --- | --- |
| Beranda, Belajar, Tryout, Insight, Tenang | The five app tabs: home, study, tryout, insight, calm |
| Materi (lesson) | The core learning unit within a Topic containing concepts, worked examples, and tips |
| Cek pemahaman | 3 to 5 check questions at the end of a lesson with immediate constructive feedback |
| Mode Pemulihan, Seimbang, Tantangan | `recovery`, `balanced`, `challenge` |
| Santai, Latihan waktu, Simulasi penuh | Exposure levels `relaxed`, `timed`, `full_simulation` |
| Check-in | The daily 30 second condition form |
| Error autopsy | Tagging the cause of each wrong answer (term stays in English in the UI) |
| Napas dulu | The UI label of the panic button |
| Ruang tenang | The calm room (breathing, grounding, local CBT, journal) |
| Rujukan | The referral screen to help services |
| Guru BK | School counselor |
| PTN, prodi | State university, study program |
| UTBK-SNBT, SNPMB | The national exam and its official committee |

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Ignore routine debugging and unverified changes. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Keep a qualifying candidate through the reporting pass even if you resolve or work around it. A successful fix changes the report outcome; it does not erase the friction that qualified it.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `node node_modules/next/dist/bin/next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
