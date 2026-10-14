# MOODI UI Audit Report

> **Auditor:** Senior UI/UX Design Critic
> **Date:** 2026-10-14
> **Method:** Code-level review of every rendered component, every copy string, and every data flow. No screenshots taken yet (Phase 0 note below).

---

## Phase 0: Evidence Gaps

**No `docs/modules/` directory exists.** The brief mentions it, but the repo has no `docs/` folder at all.

**Screenshots are pending.** I cannot run the app without a running database and seed data. Every finding below is derived from reading the code that renders each screen — the actual class names, data bindings, copy strings, and component structure. Before any fix ships, I need to see the render at 375/768/1280 in all three themes. If the owner can spin up the app and provide screenshots, or give me DB credentials, I'll re-validate. Until then, nothing here is based on guessing what the code "might" look like.

**Seed data exists** (`prisma/seed.ts`, `prisma/seed-data/`). Good. The app is designed to show real check-in data, daily plans, and session history.

### Screen inventory

| # | Screen | Route | Component(s) |
|---|--------|-------|---------------|
| 1 | Landing | `/` | `app/page.tsx` (PixelStudyScene, FeatureGlyph) |
| 2 | Login | `/login` | `components/auth-form.tsx` (mode=login) |
| 3 | Register | `/register` | `components/auth-form.tsx` (mode=register) |
| 4 | Student Beranda (check-in) | `/dashboard` | `checkin/components/checkin-form.tsx` |
| 5 | Student Beranda (plan view) | `/dashboard` | `checkin/components/daily-plan-view.tsx` |
| 6 | Belajar (study catalog) | `/dashboard/study` | `practice/components/study-catalog.tsx` |
| 7 | Tryout hub | `/dashboard/mock-exam` | `practice/components/mock-exam-hub.tsx` |
| 8 | Session runner | `/dashboard/sessions/[id]` | `practice/components/session-runner.tsx` |
| 9 | Review & Autopsy | `/dashboard/sessions/[id]/review` | `practice/components/review-list.tsx` |
| 10 | Insight | `/dashboard/insight` | `insight/components/insight-dashboard.tsx` |
| 11 | Tenang (Calm room) | `/dashboard/calm` | `calm/components/calm-room.tsx` |
| 12 | Bantuan (Support) | `/dashboard/support` | `support/components/support-directory.tsx` |
| 13 | Admin Beranda | `/dashboard` (admin) | `dashboard/components/dashboard-home.tsx` (AdminDashboard) |
| 14 | Admin Bank Soal overview | `/dashboard/question-bank` | `question-bank/components/question-bank-overview.tsx` |
| 15 | Admin Subtes manager | `/dashboard/question-bank/subtests` | `question-bank/components/subtests-manager.tsx` |
| 16 | Admin Topik manager | `/dashboard/question-bank/topics` | `question-bank/components/topics-manager.tsx` |
| 17 | Admin Pertanyaan list | `/dashboard/question-bank/questions` | `question-bank/components/questions-list.tsx` |
| 18 | Admin Question form | `/dashboard/question-bank/questions/[id]` | `question-bank/components/question-form.tsx` |
| 19 | Breathing overlay | (modal during session) | `calm/components/breathing-overlay.tsx` |

---

## Phase 1: Information Inventory (key student screens)

### Beranda — Daily Plan View

| Element | Appears elsewhere | Count on screen | Job |
|---------|-------------------|-----------------|-----|
| Mode badge ("Mode Pemulihan") | — | 1 | Orient |
| Mode subtitle ("Hari ini kita ringan dulu.") | — | 1 | Orient + Reassure |
| "Kenapa ini?" + reason sentence | — | 1 | Orient (good — explains why) |
| Days until UTBK ("⏳ X Hari Menuju UTBK") | — | 1 | Orient |
| Target university / major | — | 1 | Orient |
| "Ubah Check-in Hari Ini" button | — | 1 | Decide |
| Section title "Rencana Belajar Hari Ini" | — | 1 | Orient |
| "{n} dari {m} langkah terselesaikan" | **ALSO** next to "X% selesai" dot | **2** (same datum, different format) | Orient |
| "X% selesai" pill | — | 1 (but duplicates above) | **Decorate** — adds nothing over "2 dari 3" |
| Per-task: type badge | — | 1 per card | Orient |
| Per-task: "⏱️ X mnt" | — | 1 per card | Orient |
| Per-task: title | — | 1 per card | Orient |
| Per-task: reason | — | 1 per card | Reassure |
| Per-task: "Tandai Selesai" / "Selesai" button | — | 1 per card | Decide |
| Per-task: "Ganti" link | — | 1 per card | Decide |
| Per-task: "Mulai Sekarang →" button | — | 1 per card | Decide |
| "Kondisi Tercatat Hari Ini" section | **Repeats** data the student just entered 30 seconds ago in check-in form | 1 section with 4 stats | **Decorate** on first visit, Orient on return visit |
| Sleep/Energy/Mood/Stress as `X/5` numbers | — | 4 cards | No action attached. **So-what = nothing** |
| Note in quotes | — | 1 | Decorate (student already knows what they wrote) |

**Violations:**
- "2 dari 3 terselesaikan" and "67% selesai" = same datum twice on one screen. Cut one.
- Sleep 7/Energi 3/5/Mood 3/5/Stres 2/5 = four raw numbers with no verb, no action. "So what should I do?" = nothing. Either delete or convert to a sentence like "Tidur cukup, energi stabil."
- The entire "Kondisi Tercatat Hari Ini" section repeats what the student just filled in, 200px below the plan that was already generated from that data. On first visit, it's pure echo.

### Insight Dashboard

| Element | Count | Job |
|---------|-------|-----|
| Header badge (📈 emoji in pixel square) | 1 | Decorate |
| "Wawasan Belajar" label | 1 | Orient (redundant with H1) |
| H1 "Pola pada Datamu" | 1 | Orient |
| Subtitle paragraph | 1 | Orient |
| Sleep+stress bar chart (14 days) | 1 | Orient |
| Chart legend (Jam Tidur / Tingkat Stres) | 1 | Orient |
| "Temuan utama" callout with dominant error % | 1 | Orient + Decide |
| Error autopsy 4-card grid: each has %, count, label, description | 4 | Orient |
| Topic mastery list: subtest code, topic name, correct/attempts, bar, accuracy% | N rows | Orient + Decide |

**Violations:**
- "Wawasan Belajar" label above "Pola pada Datamu" H1: label restates the heading. Delete the label or make it do a different job.
- Error autopsy: four cards each show %, count, label, and description. That's 4 × 4 = 16 data points in one grid. The "Temuan utama" callout already surfaces the main finding. The four cards are a KPI dashboard reflex. A simpler display: one dominant cause sentence + a bar breakdown without four separate cards.
- Topic mastery shows both "X benar dari Y percobaan" and "X%" — same datum twice. Cut one.

### Landing Page

Structure: Header → Hero (eyebrow, H1, subtitle, 2 buttons) → Concepts band → About section (label, H2, paragraph, steps title, steps intro, 4-step cards) → Features section (label, H2, 3 feature cards) → CTA section (label, H2, paragraph, button) → Footer (brand, tagline, SDG note, disclaimer, nav links).

This is the **textbook AI landing page template**: hero → band → about with steps → three equal feature cards → CTA → footer. Every section follows the pattern: small uppercase label → H2 → paragraph → cards/content.

---

## Phase 2: Tests

### Test results by screen

#### 1. Landing Page

| Test | Result |
|------|--------|
| **Removal** | The concepts band ("Check-in · Rencana adaptif · Tryout · Error autopsy · Ruang tenang") adds nothing — these concepts are explained in the features section 200px later. Delete. The small uppercase label above every section heading ("Tentang MOODI", "Arah pengembangan", "MOODI") can be deleted — the headings are clear enough. The four-color swatch in the figure caption is decoration. |
| **Swap** | Replace "MOODI" with "StudyBuddy" and the page still works identically. Nothing on this page is specific to mood-adapted learning. The hero says "tanpa lupa bernafas" but the structure is a generic ed-tech landing. **FAIL.** |
| **Five-second** | "It's an ed-tech product that wants me to sign up." The one job should be: "This adapts to how you feel today." That idea is buried in the subtitle paragraph. |
| **Blur** | Three equal blobs: hero text, illustration, feature cards. No focal point. The illustration is roughly equal weight to the text. |
| **Pixel-skin** | The SVG pixel scene is genuinely good — it's custom pixel art that responds to theme changes (sun/moon/stars). But everything else is a standard SaaS layout wearing the pixel font. The feature cards are three equal cards with an icon above the title. The steps are four equal numbered cards. This is pixel font as paint, not pixel as structure. |
| **Borrow** | A game title screen or a pixel "loading screen" metaphor would be more memorable than hero + feature cards. The "Bagaimana MOODI dirancang?" steps could be a pixel side-scroller timeline instead of four identical cards. |
| **Pre-mortem** | Judge points at: (1) three equal feature cards, (2) small label above every heading, (3) concepts band that duplicates features, (4) hero + CTA pattern. |

**Score: 4/5** (template with pixel paint)

#### 2. Auth (Login / Register)

| Test | Result |
|------|--------|
| **Removal** | Copy says "Masuk untuk membuka dashboard awal MOODI. Fitur belajar masih disiapkan." — is this still true? If features are built, this copy is stale. Otherwise fine. |
| **Swap** | Any product's login form. Generic but appropriate — auth forms should be invisible. |
| **Five-second** | "Log in." Clear. |
| **Blur** | Brand → H1 → Form → Button. Good hierarchy. |

**Score: 2/5** (functional, not trying to be memorable — appropriate for auth)

#### 3. Student Beranda — Check-in Form

| Test | Result |
|------|--------|
| **Removal** | The "Pilihan: Cukup — Stabil" line below each 5-button group restates the selected button's label and description. Redundant. The "Check-in 30 Detik" badge is decoration. The "✓" in a pixel square is decoration. |
| **Five-second** | "Tell MOODI how I feel today." Clear single job. Good. |
| **Blur** | H2 is dominant, four rows of 5 buttons are visually identical. Each question looks the same as the previous. Hierarchy within the form is flat. The four sections (sleep, energy, mood, stress) need more visual differentiation. |
| **So-what** | Sleep presets (4, 5, 6, 7, 8) with emoji (😴 ☕ ✨) — the emoji are cute but add no information. The "0h" to "14h" slider duplicates the preset buttons. Having both is okay for precision, but the slider label says "0h" when the min is actually 1. |
| **Copy** | Em-dashes ("—") appear three times in the "Pilihan:" lines. **Violates non-negotiable.** Hard-coded Indonesian copy not in `id.ts`: all labels (energyLabels, moodLabels, stressLabels), all question text ("1. Berapa jam tidurmu semalam?"), button text, header text — **massive amounts of copy outside `id.ts`.** |

**Score: 3/5** (functional, clear purpose, but visually flat and copy violations)

#### 4. Student Beranda — Daily Plan View

| Test | Result |
|------|--------|
| **Removal** | "X% selesai" pill duplicates "n dari m terselesaikan". Delete the percentage. The "Kondisi Tercatat Hari Ini" section with four stat cards is an echo chamber — you just filled this in. On return visit it has mild Orient value, but four raw numbers with no verb is dead weight. |
| **Swap** | Replace MOODI with any study planner, and this page works. The mode banner (recovery/balanced/challenge) is the one MOODI-specific thing, but it's a small badge, not the structure. **FAIL.** |
| **Five-second** | "Here are today's tasks." Clear. But the mode banner should be the dominant element — it's the whole point of MOODI — and instead it's a small badge in a generic card header. |
| **Blur** | Mode banner card + grid of 2-3 task cards + checkin echo card. Three zones of similar weight. The mode banner should be the hero, not one of three sections. |
| **Pixel-skin** | This is a standard task list dashboard. Every card has the same border, shadow, and padding. The mode banner is a badge in a card. The pixel language does nothing structural. **FAIL.** |
| **Borrow** | A game HUD or quest log metaphor: the mode is the "world state" (sky color, weather metaphor), tasks are quests with clear CTAs. The current grid-of-cards is the most generic possible layout. |
| **Placement** | On a phone, the mode banner card takes the full first screen. Then you scroll to see tasks. The actual decision (which task to start) is below the fold. The mode banner should be compact, putting tasks in the thumb zone. |
| **Pre-mortem** | (1) Grid of equal task cards, (2) mode as a badge instead of structural element, (3) check-in echo section, (4) duplicate completion stats. |

**Score: 4/5** (pure card dashboard template)

#### 5. Belajar (Study Catalog)

| Test | Result |
|------|--------|
| **Five-second** | "Pick a topic to practice." Clear. |
| **Blur** | Subtest headings → grids of topic cards. Repetitive. |
| **Pixel-skin** | Standard catalog grid. Pixel does nothing structural. |

**Score: 3/5** (functional catalog, generic structure)

#### 6. Tryout Hub

| Test | Result |
|------|--------|
| **Five-second** | "Configure and start a tryout." Clear. |
| **Removal** | The H2 and subtitle inside the form repeat the page title from the sidebar. |
| **Blur** | Form section + history list. Reasonable hierarchy. |

**Score: 3/5** (functional, some redundancy)

#### 7. Session Runner

| Test | Result |
|------|--------|
| **Five-second** | "Answer this question." Clear single job. |
| **Real-person: panicking student** | The "Nafas dulu" button is accessible through the QuestionNavigator sidebar/drawer. On mobile, you have to open the drawer first, then find the button. Two taps to panic relief is one too many. The panic button should be directly visible on the main screen. |
| **Placement** | Bottom bar has prev/next/finish. The "Daftar Soal" button opens a drawer. The panic button is inside that drawer. **Bad placement for a safety element.** |
| **Copy** | Hard-coded copy outside `id.ts`: "Daftar Soal", "Belum Lengkap", "Lanjut Jawab Soal Belum Terisi →", "Lengkapi Sisa Soal →", "Selesaikan sesi sekarang", etc. |

**Score: 2/5** (good functional design, but panic button buried)

#### 8. Review & Autopsy

| Test | Result |
|------|--------|
| **Five-second** | "See what I got right and wrong." Clear. |
| **So-what** | The result summary ("X dari Y soal benar") leads to the error tag picker. Good flow. |
| **Blur** | Summary card → filter tabs → question cards. Good hierarchy. |

**Score: 2/5** (well-structured, purpose-built)

#### 9. Insight Dashboard

| Test | Result |
|------|--------|
| **Removal** | "Wawasan Belajar" label above "Pola pada Datamu" is redundant. The emoji badge (📈) is decoration. Each error card shows %, count, label, AND description — 16 data points in one view. The "Temuan utama" callout already summarizes. |
| **So-what** | Bar chart: "So what should I do about my sleep trend?" No answer on screen. Topic mastery: "So what?" → "Practice the weak topics." This is implicit but not stated. |
| **Blur** | Three equally weighted cards/sections stacked vertically. No focal point. |
| **Pixel-skin** | Standard analytics dashboard with bar chart and data cards. Pixel font on chart labels. **Standard SaaS.** |
| **Borrow** | Topic mastery as a small pixel map (grid of colored cells) instead of a list with progress bars. Error causes as a single stacked bar instead of four separate cards. |
| **Pre-mortem** | Judge sees: (1) emoji in pixel square badge, (2) four equal stat cards for errors, (3) standard bar chart, (4) progress bars with percentages — this is a Notion/Linear analytics page with pixel font. |

**Score: 4/5** (analytics dashboard template)

#### 10. Tenang (Calm Room)

| Test | Result |
|------|--------|
| **Five-second** | "Pick a calming exercise." Clear. |
| **Removal** | Four tabs, only one visible at a time. The tab labels are long: "Pernapasan Kotak (4-4-4-4)", "Grounding 5-4-3-2-1", "Pikiran vs Fakta", "Jurnal Singkat". These could be shorter. |
| **Blur** | Header → tab bar → panel content. Good hierarchy. |
| **Pixel-skin** | The breathing orb uses `rounded-full` (circles), which breaks the pixel language. Everything else on the site uses sharp corners. The box breathing animation should use a pixel square, not a circle. |
| **Visual violation** | `red-500` and `red-600` used for the error state in ReframingCards (line 444). **Violates non-negotiable: no red in student-facing feedback.** |
| **Copy** | `rounded-full` badges and `rounded-lg` elements throughout — these are from a different design system. The calm room looks like a different product than the rest of MOODI. |
| **Borrow** | The breathing exercise could use pixel art expanding/contracting instead of a smooth circle animation. |

**Score: 3/5** (good content, visual inconsistency with rest of app, red violation)

#### 11. Bantuan (Support)

| Test | Result |
|------|--------|
| **Five-second** | "Get help from real people." Clear and critical. |
| **Visual inconsistency** | Uses `rounded-2xl`, `rounded-xl`, `rounded-lg`, `rounded-md`, `rounded-full` throughout. This is a completely different design language from the rest of MOODI (which uses sharp pixel corners). Looks like it was built from a different component library. |
| **Safety** | The disclaimer is present and clear. Hotlines have direct contact buttons. Message templates are practical. The content is excellent. |
| **Copy** | Hard-coded copy: MESSAGE_TEMPLATES text, section headings, descriptions — none in `id.ts`. |

**Score: 3/5** (excellent content, wrong visual language)

#### 12. Admin Dashboard

| Test | Result |
|------|--------|
| **Swap** | Replace MOODI with any CMS admin panel. Identical. |
| **Structure** | Label → H1 → greeting → role badge → 4 KPI stat cards → H2 → 3 quick action cards. This is the **canonical AI admin dashboard template.** |
| **Removal** | Role badge ("Admin") — the sidebar already says "Dashboard admin". Greeting "Selamat datang, [name]" — wastes space. The 4 stat cards repeat counts that also appear in the quick action cards below them. |
| **Pre-mortem** | (1) Four colored KPI cards, (2) three equal action cards with icons, (3) greeting hero. |

**Score: 5/5** (pure template)

#### 13. Admin Question Bank Overview

| Test | Result |
|------|--------|
| **Removal** | Four stat cards (Subtes, Topik, Pertanyaan, Terbit) AND three quick action cards below. The quick action cards each show the count again. Same data shown twice. |
| **Structure** | Label → H1 → subtitle → 4 stat cards → H2 → 3 action cards. Same template as admin dashboard. |
| **Pre-mortem** | Identical structure to admin dashboard. If a judge sees both, it's obvious they're from the same template. |

**Score: 5/5** (duplicated template)

---

## Phase 3: Catalog of AI Tells Found

### P0 — Fake or Dead

| ID | Finding |
|----|---------|
| P0-1 | **Red in student-facing UI.** `calm-room.tsx:444` uses `border-red-500 bg-red-500/10 text-red-600` for the reframing error message. Violates non-negotiable. |
| P0-2 | **Em-dashes in student copy.** `checkin-form.tsx:189,224,258` uses "—" (em-dash) in "Pilihan: {label} — {desc}". Violates non-negotiable. |
| P0-3 | **Massive hardcoded copy outside `id.ts`.** `checkin-form.tsx`, `daily-plan-view.tsx`, `calm-room.tsx`, `support-directory.tsx`, `session-runner.tsx`, `insight-dashboard.tsx`, `breathing-overlay.tsx`, `dashboard-home.tsx` — all contain hardcoded Indonesian strings not in the copy file. Violates non-negotiable. |
| P0-4 | **`rounded-full` and `rounded-*` elements** in `calm-room.tsx` (breathing orb, badges), `support-directory.tsx` (every card, badge, button), and `breathing-overlay.tsx`. These break the pixel design language. The breathing orb is a smooth circle in a pixel world. |

### P1 — Duplicates, Missing Hierarchy, Template Structure

| ID | Finding |
|----|---------|
| P1-1 | **Landing page is the standard AI template.** Hero → band → about (with steps) → three feature cards → CTA → footer. Each section has a small uppercase label above the heading. |
| P1-2 | **Concepts band duplicates features.** "Check-in · Rencana adaptif · Tryout · Error autopsy · Ruang tenang" → then the features section explains three of these. Delete the band. |
| P1-3 | **Feature cards have "Arah pengembangan" repeated in the footer of each card** (line 273: `copy.featuresLabel` in the card footer). The same label appears above the section heading. Three times on screen. |
| P1-4 | **Daily plan: duplicate completion data.** "2 dari 3 terselesaikan" text AND "67% selesai" dot-pill. Same datum, two formats. |
| P1-5 | **Daily plan: check-in echo section.** Four stat cards (Sleep/Energy/Mood/Stress as raw numbers) echo data the student entered 30 seconds ago. No action attached. |
| P1-6 | **Admin dashboard: 4 KPI stat cards + 3 action cards.** Action cards repeat the counts from the stat cards. |
| P1-7 | **Question bank overview: identical structure to admin dashboard.** 4 stat cards + 3 action cards, same layout, same data duplication. |
| P1-8 | **Insight: four error cause cards = KPI card reflex.** Dominant cause already surfaced in callout. Four cards with % + count + label + description = 16 data points. |
| P1-9 | **Insight: topic mastery shows both "X benar dari Y" and "X%".** Same datum twice. |
| P1-10 | **Insight: "Wawasan Belajar" label above "Pola pada Datamu" heading.** Label restates heading. |
| P1-11 | **Daily plan: mode banner is a badge in a card, not the structural element.** The mode is MOODI's differentiator but visually it's the same weight as everything else. |
| P1-12 | **Session runner: panic button ("Nafas dulu") buried inside the question navigator drawer on mobile.** Two taps to safety. Should be one tap, always visible. |
| P1-13 | **Check-in form: all four question rows look identical.** Same grid-of-5, same styling. No visual differentiation between sleep, energy, mood, stress. |
| P1-14 | **Small uppercase label above every section heading** — on landing page ("Tentang MOODI", "Arah pengembangan", "MOODI"), on insight ("Wawasan Belajar"), on check-in ("Check-in 30 Detik"), on calm room ("Ruang Tenang"). This is the #1 AI layout tell. |
| P1-15 | **Dashboard skeleton** (line 43-55 of dashboard page.tsx) is a generic card layout skeleton: one tall card + three equal cards. This is the placeholder for a dashboard the student will never see as a dashboard — it's actually a check-in form or plan view. The skeleton shape doesn't match either. |

### P2 — Copy and Polish

| ID | Finding |
|----|---------|
| P2-1 | **Check-in form button text too long:** "Simpan Check-in & Buka Rencana Hari Ini →" (43 chars). Should be shorter: "Lanjut" or "Buka Rencana". |
| P2-2 | **"Menyesuaikan Ritme Belajar..."** loading state is flowery. "Memproses..." is enough. |
| P2-3 | **Insight empty state:** "Pola Belajarmu Sedang Terbentuk" is poetic AI copy. "Insight muncul setelah 7 check-in. Baru {n} yang terisi." is better (and already exists as the subtitle — but the heading overshadows it). |
| P2-4 | **Calm room tab labels are long:** "Pernapasan Kotak (4-4-4-4)", "Grounding 5-4-3-2-1", "Pikiran vs Fakta", "Jurnal Singkat". On mobile these will wrap or overflow. Shorten: "Napas", "Grounding", "Reframe", "Jurnal". |
| P2-5 | **Grounding exercise button text too long:** "Sudah, Lanjut ke Langkah Berikutnya →" (39 chars). "Lanjut →" is enough. |
| P2-6 | **Reframing AI button text too long:** "Bantu Aku Reframe Pikiran Ini ✨" (32 chars). "Reframe ✨" is enough. |
| P2-7 | **"Sedang Membedah Pikiran... ⏳"** loading state is theatrical. "Memproses..." suffices. |
| P2-8 | **Support page hero text is long and formal:** "Persiapan UTBK adalah maraton yang menguras pikiran dan tenaga..." Rewrite to something punchy and direct. |
| P2-9 | **Emoji as structural icons:** 📈 📊 🌿 📝 🌬️ 🌱 💡 👀 ✋ 👂 👃 👅 💭 ✨ 💚 🎯 — emoji are used as section icons throughout. This is an AI tell. Use pixel art glyphs instead. |
| P2-10 | **Feature card footer line 273** says "Arah pengembangan" on every card — the same text as the section label. This is a placeholder that was never customized per-card. |

---

## Phase 4: The Report

### 1. Verdict

MOODI looks like an AI built it because it follows a single template for every screen: small uppercase label → pixel H1 → paragraph → grid of cards with equal shadows. The landing page is the standard hero-band-features-CTA structure. The admin dashboard and question bank overview are the same four-KPI-cards-plus-three-action-cards layout duplicated twice. The student dashboard treats the daily mode — MOODI's only differentiator — as a badge in a card instead of the structural element. The pixel art SVG on the landing page is genuinely good, but everything else uses the pixel font as a skin on a generic SaaS dashboard.

### 2. Screen Scores

| Screen | Score | Notes |
|--------|-------|-------|
| Landing | 4 | Hero-band-features-CTA template |
| Login/Register | 2 | Generic but appropriate |
| Check-in form | 3 | Good purpose, flat visual hierarchy |
| Daily plan view | 4 | Card dashboard template |
| Study catalog | 3 | Functional catalog |
| Tryout hub | 3 | Functional form |
| Session runner | 2 | Well-built, panic button placement issue |
| Review & Autopsy | 2 | Purpose-built, good flow |
| Insight | 4 | Analytics dashboard template |
| Calm room | 3 | Good content, visual inconsistency |
| Support / Bantuan | 3 | Excellent content, wrong visual language |
| Admin dashboard | 5 | Pure KPI template |
| Question bank overview | 5 | Duplicated template |

### 3. Findings Table

| ID | P | Screen | Element | Tell | Evidence | Harm | Fix | Size |
|----|---|--------|---------|------|----------|------|-----|------|
| P0-1 | P0 | Calm (Reframing) | Error message div | Red color in student-facing UI | `calm-room.tsx:444` | Violates non-negotiable, red = anxiety trigger | Change `red-500`/`red-600` to `moodi-peach` styling matching other error states | S |
| P0-2 | P0 | Check-in form | "Pilihan:" description lines | Em-dashes (—) in student copy | `checkin-form.tsx:189,224,258` | Violates non-negotiable | Replace "—" with "·" or a line break | S |
| P0-3 | P0 | Multiple | All hardcoded Indonesian text | Copy outside `id.ts` | `checkin-form.tsx`, `daily-plan-view.tsx`, `calm-room.tsx`, `support-directory.tsx`, `insight-dashboard.tsx`, `session-runner.tsx` | Cannot be audited/maintained centrally, violates non-negotiable | Move every hardcoded string to `lib/copy/id.ts` | L |
| P0-4 | P0 | Calm + Support | Breathing orb, all support cards/badges/buttons | `rounded-full`, `rounded-xl`, `rounded-2xl`, `rounded-lg` break pixel design | `calm-room.tsx:132,134,385,430,444,463,474,494,505,520,527`, `support-directory.tsx:58,88,111,138,153,180,192,218,237,263,274` | Two design languages in one app. Judge sees pixel everywhere then smooth on these screens. | Replace all `rounded-*` with sharp corners (remove radius). Breathing orb: use a pixel square that scales, not a circle. | M |
| P1-1 | P1 | Landing | Overall structure | Hero → band → about → 3 feature cards → CTA → footer | `app/page.tsx` full file | Template landing page, every AI-built site has this | Rethink (see sketches) | L |
| P1-2 | P1 | Landing | Concepts band | Duplicates features section | `app/page.tsx:188-202` | Redundant section | Delete the concepts band entirely | S |
| P1-3 | P1 | Landing | Feature card footer | "Arah pengembangan" repeated 3× on screen | `app/page.tsx:273` | Same label as section heading, no per-card info | Delete the footer line from each card, or replace with a specific detail | S |
| P1-4 | P1 | Daily plan | Completion stats | "n dari m" AND "X%" | `daily-plan-view.tsx:179-187` | Duplicate data | Delete the "X% selesai" pill, keep "n dari m" text | S |
| P1-5 | P1 | Daily plan | "Kondisi Tercatat Hari Ini" | 4 stat cards echoing check-in data | `daily-plan-view.tsx:292-341` | Redundant, no action, wastes scroll | Collapse to one line under the mode banner: "Tidur 7j · Energi 3 · Mood 3 · Stres 2" — or delete entirely and only show the "Ubah Check-in" button | M |
| P1-6 | P1 | Admin dashboard | 4 stat cards + 3 action cards | Counts shown twice | `dashboard-home.tsx:101-163` | Template, duplicate data | Merge: remove the 4 stat cards. Put counts inline in the action cards (already there). | M |
| P1-7 | P1 | QB overview | 4 stat cards + 3 action cards | Identical layout to admin dashboard | `question-bank-overview.tsx:75-121` | Duplicated template visible to judges | Merge: remove stat cards, keep action cards only | M |
| P1-8 | P1 | Insight | 4 error cause cards | KPI card grid | `insight-dashboard.tsx:186-213` | Looks like a dashboard, 16 data points | Replace with a single horizontal stacked bar + labels. Delete the 4 cards. | M |
| P1-9 | P1 | Insight | Topic mastery | "X benar dari Y" AND "X%" | `insight-dashboard.tsx:252,269-270` | Duplicate | Keep only the bar + percentage. Remove the "X benar dari Y" text. | S |
| P1-10 | P1 | Insight | "Wawasan Belajar" label | Label restates H1 | `insight-dashboard.tsx:76-78` | Redundant, AI tell | Delete the label | S |
| P1-11 | P1 | Daily plan | Mode banner | Mode as badge, not structural element | `daily-plan-view.tsx:116-167` | MOODI's differentiator is invisible | Rethink (see sketches): mode should set the visual tone of the entire page, not live in a card | L |
| P1-12 | P1 | Session runner | Panic button | Buried in drawer on mobile | `question-navigator.tsx` (inside drawer only) | Two taps to safety during panic | Move "Nafas dulu" to always-visible position in the session runner header or as a floating button | M |
| P1-13 | P1 | Check-in | 4 question rows | All identical visual weight | `checkin-form.tsx:160-261` | Flat hierarchy, no visual progress | Use different pastel backgrounds per question to show progress and differentiate sections | M |
| P1-14 | P1 | Multiple | Small uppercase labels | Above every heading, on every screen | Multiple files | #1 AI layout tell | Delete from most screens. Keep only where the label does a different job than the heading. | M |
| P1-15 | P1 | Dashboard | Skeleton | Generic card layout doesn't match actual content | `app/(dashboard)/dashboard/page.tsx:43-55` | Skeleton shape doesn't match check-in or plan | Redesign skeleton to match check-in form shape | S |
| P2-1 | P2 | Check-in | Submit button text | 43 chars: "Simpan Check-in & Buka Rencana Hari Ini →" | `checkin-form.tsx:306` | Too long, wraps on mobile | "Buka rencana hari ini" | S |
| P2-2 | P2 | Check-in | Loading state | "Menyesuaikan Ritme Belajar..." | `checkin-form.tsx:306` | Flowery | "Memproses..." | S |
| P2-3 | P2 | Insight | Empty state heading | "Pola Belajarmu Sedang Terbentuk" | `insight-dashboard.tsx:24` | Poetic AI copy | "Belum cukup data." (let the subtitle explain) | S |
| P2-4 | P2 | Calm | Tab labels | Long labels wrap on mobile | `calm-room.tsx:36-39` | Overflow or wrap | Shorten to "Napas", "Grounding", "Reframe", "Jurnal" | S |
| P2-5 | P2 | Calm (Grounding) | Next button | 39 chars | `calm-room.tsx:281` | Too long | "Lanjut →" | S |
| P2-6 | P2 | Calm (Reframing) | Submit button | 32 chars | `calm-room.tsx:456` | Too long | "Reframe ✨" or "Bantu reframe" | S |
| P2-7 | P2 | Calm (Reframing) | Loading text | "Sedang Membedah Pikiran... ⏳" | `calm-room.tsx:456` | Theatrical | "Memproses..." | S |
| P2-8 | P2 | Support | Hero paragraph | Long, formal, lecture-like | `support-directory.tsx:66-69` | Preachy tone for anxious student | Shorten: "Capek atau cemas itu wajar. Ada orang yang siap dengerin." | S |
| P2-9 | P2 | Multiple | Emoji as icons | 📈📊🌿📝 etc. in pixel squares | Multiple files | AI tell — emoji in styled containers | Replace with simple pixel glyphs or remove the container | M |
| P2-10 | P2 | Landing | Feature card footer | "Arah pengembangan" on all 3 cards | `app/page.tsx:273` | Placeholder text, never customized | Delete or replace with per-card detail | S |

### 4. Three Lists

#### Delete
- Concepts band on landing page (P1-2)
- "X% selesai" pill on daily plan (P1-4)
- "Wawasan Belajar" label on insight (P1-10)
- Small uppercase labels above headings on most screens (P1-14)
- "Arah pengembangan" footer in feature cards (P1-3)
- 4 stat cards on admin dashboard (keep action cards) (P1-6)
- 4 stat cards on question bank overview (keep action cards) (P1-7)
- "Pilihan:" description lines with em-dashes on check-in (P0-2)

#### Merge
- "Kondisi Tercatat Hari Ini" section → one-line summary under mode banner (P1-5)
- Insight error cause 4 cards → single stacked bar (P1-8)
- Topic mastery dual data → bar + % only (P1-9)

#### Rethink
- **Landing page** — break the hero-band-features-CTA pattern (P1-1)
- **Daily plan view** — mode as structural element, not badge (P1-11)
- **Insight dashboard** — break the analytics dashboard template (P1-8 + P1-9 + P1-10 combined)

### 5. Rethink Sketches

#### A. Landing Page — 3 layouts

```
Layout 1: Pixel world scroll
┌──────────────────────────┐
│ NAV: MOODI  [Masuk]      │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │   [PIXEL SCENE]      │ │
│ │   fills full width   │ │
│ │   "Belajar UTBK,     │ │
│ │    tanpa lupa         │ │
│ │    bernafas."         │ │
│ │   [Buat akun]         │ │
│ └──────────────────────┘ │
│                          │
│ "Gimana caranya?"        │
│ ┌────┐ ┌────┐ ┌────┐    │
│ │ 1  │→│ 2  │→│ 3  │    │
│ │Cek │ │Plan│ │Bnk │    │
│ └────┘ └────┘ └────┘    │
│  (horizontal scroll on   │
│   mobile, pixel path     │
│   connecting steps)      │
│                          │
│ Footer: disclaimer +     │
│ links, nothing else      │
└──────────────────────────┘
```

```
Layout 2: Single full-screen pitch
┌──────────────────────────┐
│ NAV: MOODI  [Masuk]      │
├──────────────────────────┤
│                          │
│  "Belajar UTBK,          │
│   tanpa lupa bernafas."  │
│                          │
│  ┌──────────────────┐    │
│  │ PIXEL ART SCENE  │    │
│  │ (interactive:    │    │
│  │  click sun=light │    │
│  │  click moon=nigh │    │
│  │  click lamp=dark)│    │
│  └──────────────────┘    │
│                          │
│  [Buat akun]             │
│                          │
│  ── disclaimer ──        │
│  ── SDG note ──          │
└──────────────────────────┘
  (no features section,
   no steps, no band.
   let the app speak.)
```

```
Layout 3: Dialogue / speech bubble
┌──────────────────────────┐
│ NAV: MOODI  [Masuk]      │
├──────────────────────────┤
│                          │
│  ┌─pixel speech bubble──┐│
│  │ "Capek ya?           ││
│  │  MOODI tau.          ││
│  │  Isi check-in 30dtk, ││
│  │  MOODI atur          ││
│  │  belajar hari ini."  ││
│  └──────────────────────┘│
│                          │
│  [Buat akun] [Lihat demo]│
│                          │
│  ┌───pixel window───────┐│
│  │ demo: check-in →     ││
│  │ plan → session cycle ││
│  └──────────────────────┘│
│                          │
│  disclaimer + links      │
└──────────────────────────┘
```

**Chosen: Layout 2.** Reason: (1) Removes all template sections — no band, no feature cards, no steps grid. (2) The pixel scene already exists and is the strongest visual asset. Making it interactive adds memorability without adding sections. (3) One screen, one job: "understand MOODI and sign up." The current five-section page dilutes the message. A competition judge with 3 minutes sees one strong screen, not five weak ones.

#### B. Daily Plan View — 3 layouts

```
Layout 1: Mode as world / quest log
┌──────────────────────────┐
│ [recovery sky color bg]  │
│                          │
│  MODE PEMULIHAN          │
│  "Hari ini ringan dulu." │
│  Kenapa: "Tidur 5 jam,   │
│  stres tinggi."          │
│                          │
│  ┌─quest 1──┐ ┌─quest 2─┐│
│  │□ Review  │ │□ Calm   ││
│  │  Aljabar │ │  Napas  ││
│  │  15 mnt  │ │  10 mnt ││
│  │ [Mulai]  │ │ [Mulai] ││
│  └──────────┘ └─────────┘│
│                          │
│  (no stat cards, no echo)│
│  [Ubah check-in]  tiny   │
└──────────────────────────┘
```

```
Layout 2: Single column task list
┌──────────────────────────┐
│  MODE SEIMBANG           │
│  (butter bg strip)       │
│  "Jaga ritme."           │
│  Kenapa: [reason]        │
│                          │
│  ── Rencana hari ini ──  │
│  ┌───────────────────┐   │
│  │ □ Review Aljabar  │   │
│  │   15 mnt  [Mulai] │   │
│  ├───────────────────┤   │
│  │ □ Latihan TPS     │   │
│  │   20 mnt  [Mulai] │   │
│  ├───────────────────┤   │
│  │ □ Napas singkat   │   │
│  │   5 mnt   [Mulai] │   │
│  └───────────────────┘   │
│                          │
│  "Tidur 7j · Energi 3"  │
│  (one line, tiny)        │
└──────────────────────────┘
```

```
Layout 3: Full-screen first task
┌──────────────────────────┐
│  Mode: Pemulihan         │
│                          │
│  ┌───────────────────┐   │
│  │ LANGKAH PERTAMA   │   │
│  │                   │   │
│  │ Review Aljabar    │   │
│  │ 15 menit          │   │
│  │ "Ulang materi     │   │
│  │  yang kemarin     │   │
│  │  belum pas."      │   │
│  │                   │   │
│  │ [Mulai sekarang]  │   │
│  └───────────────────┘   │
│                          │
│  Berikutnya: Latihan     │
│  soal TPS (20 mnt)       │
│                          │
│  2 langkah lagi ·        │
│  [Ubah check-in]         │
└──────────────────────────┘
```

**Chosen: Layout 1 (Mode as world).** Reason: (1) The mode sets the background color of the entire view, not just a badge — this makes mode the structural element. (2) Tasks presented as a quest log (compact, checkbox + title + time + CTA). (3) No stat cards, no echo section. The check-in data is implied by the mode choice. This is the layout that only makes sense for MOODI.

#### C. Insight Dashboard — 3 layouts

```
Layout 1: Pixel tile map + narrative
┌──────────────────────────┐
│  Pola pada Datamu         │
│                          │
│  ┌─ stacked bar ────────┐│
│  │ ████ ███ ██ █        ││
│  │ 40%  30% 20% 10%     ││
│  │ Blm  Wkt Pnk Tlti   ││
│  └──────────────────────┘│
│  "Fokus utama: konsep    │
│   belum dikuasai (40%)." │
│                          │
│  ── Topik ──             │
│  ┌──┬──┬──┬──┬──┬──┐    │
│  │██│██│░░│██│░░│██│    │
│  │A │B │C │D │E │F │    │
│  └──┴──┴──┴──┴──┴──┘    │
│  (pixel cells: dark=     │
│   mastered, light=weak.  │
│   click to see details)  │
│                          │
│  ── Tidur & Stres ──     │
│  (compact sparkline,     │
│   not full bar chart)    │
└──────────────────────────┘
```

```
Layout 2: Narrative summary
┌──────────────────────────┐
│  14 hari terakhir:       │
│                          │
│  "Tidur rata-rata 6.2j.  │
│   Stres naik 2 hari      │
│   terakhir. Kesalahan    │
│   paling sering: belum   │
│   paham konsep (40%)."   │
│                          │
│  [Lihat detail topik]    │
│  [Lihat pola tidur]      │
└──────────────────────────┘
```

```
Layout 3: Dashboard but fewer panels
┌──────────────────────────┐
│  Pola pada Datamu         │
│                          │
│  ┌─ hero finding ───────┐│
│  │ "Kamu tidur <6j di   ││
│  │  4 dari 14 hari.     ││
│  │  Di hari itu, akurasi││
│  │  turun 15%."         ││
│  └──────────────────────┘│
│                          │
│  ┌─ error bar ──────────┐│
│  │ ████ ███ ██ █        ││
│  └──────────────────────┘│
│                          │
│  ┌─ topic list (sorted) ┐│
│  │ Weakest first        ││
│  │ [Latihan] per topic  ││
│  └──────────────────────┘│
└──────────────────────────┘
```

**Chosen: Layout 1 (Pixel tile map).** Reason: (1) A pixel tile map for topic mastery is the most MOODI-specific visualization — it uses the pixel language structurally, not as paint. (2) The stacked bar replaces four KPI cards with one visual. (3) A sparkline replaces a full bar chart for the trend — less chart, more signal. This is the layout that a judge would remember.

### 6. Questions for the Owner

1. **Is the landing page copy still accurate?** Multiple strings say "fitur belajar belum tersedia" and "masih dalam tahap pengembangan" — but the app has functional check-in, practice, tryout, review, insight, and calm features. If these are live, the landing copy needs a rewrite.

2. **Should the "Kondisi Tercatat" section be deleted or collapsed?** It echoes check-in data with no action. I recommend deletion on first visit (student just entered it) and a one-line summary on return visits. Your call.

3. **Can I move the Bantuan/Support link into the bottom nav for students?** It's currently only in the sidebar footer. A student in crisis on mobile has no path to it from the bottom nav.

4. **The support page uses `rounded-*` everywhere — was this intentional (softer feel for crisis page) or accidental?** I'll make it match the pixel language either way, but want to know if there was a design reason.

5. **The breathing orb is a smooth circle with CSS transitions. Should I replace it with a pixel square?** It's visually the most polished element in the calm room, but it clashes with the pixel language. A pixel square that "expands" by adding pixel rows could be more memorable.

6. **The sidebar shows "Bantuan & Dukungan" with a 💚 emoji for students. Should this be a nav item in the bottom bar too?** Currently on mobile, the only way to reach support is scrolling to find links elsewhere.

7. **How many days of seed data should exist?** The insight dashboard requires 7+ check-ins. The current seed should provide 14 days. Confirming this is seeded correctly.

---

## Validation Checklist (Pre-fix baseline)

| Check | Status | Evidence |
|-------|--------|----------|
| Every control does something | ⚠️ PARTIAL | No `href="#"` found. All buttons have handlers. But need to verify at runtime. |
| Every number from real data | ✅ PASS | No mock arrays or hardcoded statistics found. All data comes from DB queries. |
| Empty/loading/error states exist | ⚠️ PARTIAL | Insight has empty state. Study catalog has empty state. But dashboard skeleton doesn't match content. |
| No horizontal scroll at 375/768/1280 | ⏳ PENDING | Need runtime check. Calm room tab labels likely overflow at 375. |
| Panic button doesn't collide with bottom nav | ⚠️ ISSUE | Panic button is inside drawer, not in main view. No collision because it's hidden. |
| Safe-area padding | ✅ PASS | Bottom nav has `pb-[env(safe-area-inset-bottom)]`. |
| Light/Night/Dark checked | ⏳ PENDING | Theme tokens exist and look intentionally different in CSS. Need visual check. |
| Keyboard focus visible | ✅ PASS | `:focus-visible` has 3px solid outline. |
| Touch targets ≥ 44px | ⚠️ PARTIAL | Most buttons have `min-h-11` (44px) or `min-h-12`. Check-in 5-grid buttons may be small at 375. |
| Reduced motion respected | ✅ PASS | `prefers-reduced-motion` rule exists in globals.css. |
| No em-dashes | ❌ FAIL | 3 instances in `checkin-form.tsx`. |
| No red | ❌ FAIL | `red-500`/`red-600` in `calm-room.tsx:444`. |
| No leaderboard/ranking/streak | ✅ PASS | None found. |
| No invented features shown as built | ⚠️ CHECK | Landing copy says "belum tersedia" but features appear to be built. Either the copy is stale or features are incomplete. |
| Safety elements present | ⚠️ ISSUE | Panic button buried on mobile. Disclaimer present on landing and support. Support link only in sidebar footer on desktop, not in mobile bottom nav. |
| Data diet: ≤1 hero number, ≤5 above fold on phone | ❌ FAIL | Daily plan: mode banner + days until UTBK + completion %. Insight: no hero number but 16 data points in error cards. Admin: 4 KPI numbers above fold. |

---

**Next step:** Owner reviews findings by ID and approves which to fix. I will not touch code until then.
