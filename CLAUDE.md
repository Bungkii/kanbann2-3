@AGENTS.md

# 📚 Kanbann Project Documentation for Claude

This repository is **Kanbann (ระบบจัดการห้องเรียน & แชทบอท LINE พริมจ๋า)** — an all-in-one classroom dashboard and administrative portal paired with an interactive LINE Chatbot ("พริมจ๋า" / "Primja") for Mathayom 2/3 (ม.2/3).

---

## 🛠️ Tech Stack & Architecture

- **Core Framework:** Next.js 16 (App Router), React 19, TypeScript 5.9
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`, PostCSS), Emotion / Styled-Components (compat)
- **Database & Storage:** Supabase (PostgreSQL, Row Level Security, Storage Buckets, Auth)
- **Supabase Clients:**
  - Server Components & Server Actions: `@/utils/supabase/server` (`createClient()`)
  - Client Components: `@/utils/supabase/client` (`createClient()`)
  - Webhooks & Standalone Scripts: `@supabase/supabase-js` (`createClient(url, key)`)
- **Animation & UX:** Framer Motion, Lenis (Smooth Scroll), React Hot Toast
- **Rich Text & Media:**
  - `react-quill-new` (⚠️ **MUST use `react-quill-new`** — legacy `react-quill` fails on React 19 due to `findDOMNode` deprecation)
  - `video.js` & custom `VideoPlayer` component
  - Dicebear Avatars API (for user avatars)
- **Exporting & Utilities:** PDFKit & PDFKit-Table (server-side PDF generation), Date-fns
- **Integrations:** LINE Messaging API (Webhook handler, Push & Reply APIs, Rich Flex Messages)

---

## 📂 Project Routing & File Map

### Web Application Routes (`src/app/`)
- `/` (`page.tsx`): Main dashboard displaying system cards with real-time toggle states, countdowns, and quick actions.
- `/kanban` (`page.tsx`): Kanban board with drag-and-drop (`@dnd-kit`), urgent/overdue filters, and progress tracking.
- `/add` (`page.tsx`): Homework creation drawer form with image uploads and rich text descriptions.
- `/schedule` (`page.tsx`, `ScheduleViewer.tsx`): Room 3 timetable (ม.2/3) supporting:
  - Mobile: Daily cards view with weekday color codes.
  - Desktop: Weekly table view with period columns (Periods 1–8 + Lunch break).
  - Real-time vertical column and active class highlighting.
  - Period Detail Modal popup and "Copy to LINE" button.
- `/summaries` (`page.tsx`): Exam summary depository with term filtering, multi-image carousel preview, PDF downloads, and external link support.
- `/exam-topics` (`page.tsx`, `ExamTopicsClient.tsx`): Breakdown of exam scopes per subject, teacher names, MCQ/essay question counts, and term filtering.
- `/homework-feed` (`page.tsx`): "ลอกงาน 🚀" homework sharing & requests feed with multi-image uploads, interactive comments/replies chat, like/repost systems, and Dicebear avatars.
- `/funds` (`page.tsx`, `FundsClient.tsx`): Class funds tracking (weekly dues, student payment grid 1–52, expense tracking, balance adjustments, bank/PromptPay QR modal).
- `/election` (`page.tsx`): Classroom representative/leader election dashboard.
- `/evaluate-boss` (`page.tsx`): Classroom leader performance assessment with a post-submission mental health & emergency hotline modal.
- `/settings` (`page.tsx`): Admin settings hub:
  - `/settings/system`: Feature toggles (Maintenance, Add Work, Kanban, Summaries, Election, Boss Evaluation, Announcement), multi-image popup modal configuration, announcement banner text, and Boss Evaluation PDF/CSV export.
  - `/settings/schedule`: Edit timetable entries (subject, teacher, room, periods).
  - `/settings/cleaning`: Manage weekday cleaning duty rosters.
  - `/settings/uniform`: Manage daily student uniform requirements.
- `/parent` (`layout.tsx`, `page.tsx`, `/assignments`, `/exams`): **Parent Portal (ระบบผู้ปกครอง)** — Read-only portal with Slate/Blue theme tailored for parents to track urgent/overdue homework, live final exam countdown, subject exam scopes (MCQ/essay counts), and study summaries with PDF/image lightboxes. Mobile-first design with bottom navigation.
- `/login`, `/signup`, `/auth/signout`: Supabase user authentication.

### API Routes (`src/app/api/`)
- `/api/webhook/line/route.ts`: Core LINE Messaging API webhook handling all incoming user & group text messages.
- `/api/export-boss/route.ts`: Generates and downloads Boss Evaluation report as PDF.
- `/api/export-boss-csv/route.ts`: Exports Boss Evaluation entries as CSV.
- `/api/popup-settings/route.ts`: Serves public popup banner configuration.
- `/api/asset/media/route.ts`: Serves static assets/media for popups.
- `/api/cron/*`: Automated cron trigger endpoints:
  - `/api/cron/morning`: Daily morning homework briefing.
  - `/api/cron/evening`: Daily evening homework reminder.
  - `/api/cron/cleanup`: Cleaning roster reminder.
  - `/api/cron/reset-uniform`: Weekly uniform reset.
  - `/api/cron/bot-anthem`: National anthem broadcast (08:00 & 18:00).
  - `/api/cron/bot-0500` & `/api/cron/bot-2200`: Scheduled bot messages.

### Utilities (`src/utils/`)
- `src/utils/line/flex.ts`: Builders for all custom LINE Flex Messages.
- `src/utils/schedule.ts`: Schedule helper methods (e.g. `getCurrentOrNextPeriod()`).
- `src/utils/questions.ts`: 214 icebreaker questions for the "ถาพัดจัดให้" game.
- `src/utils/supabase/`: Client and Server Supabase instance helpers.

---

## 🤖 LINE Chatbot ("พริมจ๋า") Command Registry

All commands are processed in `src/app/api/webhook/line/route.ts`:

### 📚 Academic & Daily Utility
- `พริมจ๋า` — Displays main interactive menu (Flex Message).
- `พริมจ๋า งานวันนี้` — Displays homework due today or overdue.
- `พริมจ๋า งานค้าง` — Lists all pending/overdue assignments.
- `พริมจ๋า สรุปงาน` — Complete summary of all registered tasks.
- `พริมจ๋าวันนี้ใส่ชุดไร` / `พรุ่งนี้ใส่ชุดอะไร` / `วัน[จันทร์-ศุกร์]ใส่ชุดอะไร` — Checks uniform schedule.
- `พริมจ๋า วันนี้ใครเวร` / `พรุ่งนี้ใครเวร` — Checks cleaning duty roster.
- `พริมจ๋า ต่อไปคาบไร` — Checks current or upcoming class period and room.
- `พริมจ๋า วันนี้เรียนไร` / `พริมจ๋า พรุ่งนี้เรียนไร` — Full daily timetable with teachers and periods.
- `พริมจ๋าเนื้อหาออกสอบ <ชื่อวิชา>` — Exam topic scope, MCQ & essay breakdown for the requested subject.
- `พริมจ๋า ดูไอดี` — Prints current LINE Group ID or Room ID.

### 🗳️ Polls & Elections
- `พริมจ๋า เปลี่ยนหัวหน้า` — Displays election ballot for room leader.
- `โหวตหัวหน้า: <ชื่อ>` — Casts vote for leader candidate.
- `พริมจ๋า สรุปโหวตหัวหน้า` — Tally and summary of leader election.
- `พริมจ๋า ส่งโพลล่าสุด` / `โพลล่าสุด` — Fetches latest web-created poll to LINE (conserves push quota).
- `โพลสรุปล่าสุด` — Current voting results for the latest active poll.
- `โหวตโพล:<poll_id>:<option_index>` — Casts vote in a custom poll.
- `สรุปโพล:<poll_id>` — Displays vote counts for a specific poll.

### 💸 Class Funds ("ตาลทวงเงิน")
- `ตาล ทวงเงิน` / `ตาลจ๋า ทวงเงิน` / `ตาลทวงทำไม` — Weekly fund balance summary, paid count, and unpaid student numbers list.
- `ตาลทวงยับ` — Aggressive/hardcore fund reminder message.
- `คู่มือตาลทวงยับ` — Displays class fund payment manual.

### 🎮 Icebreaker & Games ("ถาพัดจัดให้")
- `ถาพัดจัดให้` — Randomly selects one of 214 "Facts About Me" questions with a 1-tap copy reply button.
- `ตอบถาพัด: [ข้อ X] <คำตอบ>` — Records user's answer into `random_questions_answers` table with their LINE profile name.
- `คู่มือถาพัด` / `ถาพัดคืออะไร` — Rules and guide for the game (interactive HTML guide at `/porschemanual.html`).

### 🎭 Easter Eggs & Meme Commands
- `พลอยจี` — Monkey AI chatbot replies.
- `อัยย์แจ๋` — Traditional Thai musical instrument facts.
- `ยูกิจือ` — Skibidi toilet and brainrot lore.
- `ออสตินจีจ้าบูกิ๊ก` — Wholesome forgiveness quote.
- `ดินปืนปู๊ดแป่ว` — Thai date and morning greeting.
- `ฟอสเฟี้ยวฟ้าว` — Random cute cafe drink & dessert recommendations.
- `แสตมป์` — Scans for bizarre toilet locations worldwide.
- `ชิน` — "ว่าวเซส"
- `ฉงฉึกฉัก` / `ฉง` — Hormones song quote.
- `คำสั่งเพิ่มเติม` — Full help menu with Quick Replies.

---

## ⚠️ Important Implementation Notes for Claude

1. **Next.js & React 19 Compatibility:**
   - This project uses React 19. Do **NOT** use `react-quill`; always use `react-quill-new`.
   - In Next.js App Router route handlers and server actions, handle asynchronous `params` and `searchParams` as Promises where required.
2. **Supabase Client Usage:**
   - In Server Components & Server Actions: `import { createClient } from '@/utils/supabase/server'`.
   - In Client Components: `import { createClient } from '@/utils/supabase/client'`.
   - In LINE Webhook (`route.ts`): use `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)`.
3. **LINE Quota & Messaging Practices:**
   - LINE Push messages (`/v2/bot/message/push`) consume monthly message quota.
   - Always prioritize **Reply API** (`replyToLine(replyToken, messages, token)`) in webhooks since reply messages are free.
   - Always validate Flex Message JSON structure to avoid 400 Bad Request errors from LINE API.
4. **Maintenance & Bot Offline Mode:**
   - The bot checks `primja_status` in the `system_settings` table before executing commands. If set to `offline`, it notifies the user of maintenance with the expected return time (`primja_offline_until`). Ensure any new command prefix is registered in `isCommand` inside `route.ts`.
5. **Database Migrations:**
   - Database schemas and updates live in `/supabase/*.sql`. The consolidated master schema is `supabase/setup.sql` or `supabase/FULL_SETUP_2025.sql`.
