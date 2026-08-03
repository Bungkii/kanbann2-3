@AGENTS.md

# 📚 Kanbann Project Documentation for Claude

This is a Next.js (App Router) project designed as an All-in-One Dashboard for classroom management with a heavily integrated LINE Chatbot. 

## 🛠️ Tech Stack
- Next.js (App Router), React, TypeScript
- Supabase (PostgreSQL, Storage, RLS)
- Tailwind CSS
- LINE Messaging API

## 🤖 LINE Chatbot Commands
- `พริมจ๋า งานวันนี้`, `พริมจ๋างานค้าง`, `พริมจ๋า สรุปงาน` - Task checking
- `พริมจ๋าวันนี้ใส่ชุดไร` - Uniform schedule
- `พริมจ๋าวันนี้ใครเวร` - Cleaning schedule
- `พริมจ๋า ต่อไปคาบไร`, `พริมจ๋า วันนี้เรียนไร` - Class schedule
- `พริมจ๋า เปลี่ยนหัวหน้า`, `พริมจ๋า สรุปโหวตหัวหน้า` - Election system
- `ถาพัดจัดให้` - Random 250 Facts About Me questions (Pulls from `src/utils/questions.ts`)
- `ตอบถาพัด: <answer>` - Submit answer for random questions (Saved to `random_questions_answers` table)
- `พริมจ๋า ส่งโพลล่าสุด` - Sends the latest web-created poll

## 📂 Key Files
- `src/app/api/webhook/line/route.ts`: Core LINE webhook handler. Add new text commands here.
- `src/utils/line/flex.ts`: Contains all Flex Message generators.
- `supabase/setup.sql`: Contains the database schema.
- `src/utils/questions.ts`: Array of 214 random questions.

## ⚠️ Notes for Claude
- Always use `createClient` from `@supabase/supabase-js` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in webhook handlers.
- LINE Push messages cost quota. Use Reply messages (`replyToLine`) whenever possible.
