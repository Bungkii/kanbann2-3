# 📚 Kanbann (ระบบจัดการห้องเรียน & แชทบอท LINE พริมจ๋า)

โปรเจกต์เว็บแอปพลิเคชันอเนกประสงค์สำหรับห้องเรียน ที่รวบรวมเครื่องมือจัดการต่างๆ ไว้ในที่เดียว (All-in-One Dashboard) พร้อมระบบบอท LINE เพื่ออำนวยความสะดวกให้แก่นักเรียน แอดมิน และผู้ที่เกี่ยวข้อง

## 🌟 ฟีเจอร์หลัก (Main Systems)

ระบบมีการแบ่งส่วนการทำงานออกเป็นหลายหน้าจอผ่าน Dashboard กลาง โดยแอดมินสามารถ **เปิด/ปิด** แต่ละระบบได้แบบ Real-time:

### 1. 📝 ระบบสำหรับคนจดงาน (Add Work)
- แบบฟอร์มสำหรับเพิ่มรายการการบ้านหรืองานที่ได้รับมอบหมาย
- ระบุวิชา, วันที่ส่ง, รายละเอียด, ชื่อครูผู้สอน
- กำหนดได้ว่าเป็นงานเดี่ยวหรืองานกลุ่ม
- อัปโหลดภาพประกอบได้ (จัดเก็บผ่าน Supabase Storage)

### 2. 📋 พริมง่วงทวงบุญคุณ (Kanban Board)
- ระบบกระดานลากวาง (Drag & Drop) จัดการสถานะงาน (Todo, In Progress, Done)
- แบ่งหมวดหมู่งานให้ดูง่าย (งานเร่งด่วน, งานเลยกำหนด)
- คำนวณเปอร์เซ็นต์ความคืบหน้าของงานภาพรวมแบบอัตโนมัติ

### 3. 📖 ระบบแจกสรุปสอบ (Exam Summaries)
- ศูนย์รวมไฟล์สรุปเนื้อหาสอบกลางภาค/ปลายภาค
- พร้อมระบบนับถอยหลัง (Countdown) สู่วันสอบจริง

### 4. 🗳️ ระบบผลการเลือกตั้ง (Election)
- แสดงผลโหวตเลือกตั้งหัวหน้าห้องหรือตัวแทนแบบ Real-time
- (Admin) สามารถจัดการรายชื่อผู้สมัครได้

### 5. 👑 ระบบประเมินหัวหน้า (Boss Evaluation)
- ฟอร์มประเมินหัวหน้าห้อง พร้อมให้คะแนนหน้าตา, ความรับผิดชอบ, ทักษะการบริหาร ฯลฯ
- สามารถเลือกจุดเด่นหรือลักษณะนิสัยได้
- **พิเศษ:** หากประเมินเสร็จ จะมีหน้าต่าง (Modal) แนะนำสายด่วนฉุกเฉินและสุขภาพจิต (1323, 1669, 1300, ฯลฯ) เพื่อคลายเครียด

### 6. 💸 ระบบทวงเงินห้อง (Funds/Tuang)
- (Admin Only) ระบบจัดการกองทุนห้องและทวงเงินคนค้างจ่าย

### 7. ⚙️ ระบบหลังบ้าน (Admin Settings)
- **ตั้งค่าระบบพริมจ๋า:** 
  - เปิด-ปิดการใช้งานระบบต่างๆ บน Dashboard (Kanban, สรุปสอบ, เลือกตั้ง, ประเมินหัวหน้า ฯลฯ)
  - จัดการเครื่องแบบนักเรียนรายวัน (Uniforms)
  - จัดการตารางเรียน/ตารางเวรทำความสะอาด (Schedules)

---

## 🤖 LINE Chatbot (พริมจ๋า)
แชทบอทประจำกลุ่ม LINE ที่สามารถเรียกข้อมูลจากระบบหลักมาแสดงผลได้ทันทีผ่าน Flex Message:
- `พริมจ๋า งานวันนี้` / `พริมจ๋างานค้าง` / `พริมจ๋า สรุปงาน` - เช็คงาน
- `พริมจ๋าวันนี้ใส่ชุดไร` - เช็คชุดเครื่องแบบประจำวัน
- `พริมจ๋าวันนี้ใครเวร` - เช็คเวรทำความสะอาด
- `พริมจ๋า ต่อไปคาบไร` / `พริมจ๋า วันนี้เรียนไร` - ตารางสอน
- `พริมจ๋า เปลี่ยนหัวหน้า` / `พริมจ๋า สรุปโหวตหัวหน้า` - โหวตและดูผลการเลือกตั้ง
- `พริมจ๋า ดูไอดี` - ดู ID ของกลุ่ม LINE ปัจจุบัน

### 🎮 คำสั่งปั่นๆ (มินิเกม/สีสันในกลุ่ม)
- `พลอยจี` - คุยแก้เหงากับ AI (สุ่มเสียงลิง)
- `อัยย์แจ๋` - สุ่มความรู้เรื่องดนตรีไทย
- `ยูกิจือ` - สาระปั่นๆ เกี่ยวกับ Skibidi Toilet
- `ออสตินจีจ้าบูกิ๊ก` - สุ่มคำให้อภัยคน
- `ฟอสเฟี้ยวฟ้าว` - สุ่มเมนูอาหารและเครื่องดื่มน่ารักๆ
- `แสตมป์` - หาพิกัดห้องน้ำ
- `ฉงฉึกฉัก` - ร้องเพลงฮอร์โมนเพศชาย

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Framework:** Next.js (App Router), React, TypeScript
- **Styling:** Tailwind CSS, Styled-Components, Emotion
- **Animations / Scroll:** Framer Motion, Lenis (Smooth Scrolling)
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Storage)
- **Drag & Drop:** `@dnd-kit/core`
- **Integrations:** LINE Messaging API (Webhook & Flex Messages)

---

## 🚀 การติดตั้งและรันโปรเจกต์ (Setup)

### 1. Clone Project และติดตั้ง Dependencies
```bash
git clone https://github.com/Bungkii/kanbann2-3.git
cd kanbann2-3
npm install
```

### 2. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local` ที่ root ของโปรเจกต์:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
```

### 3. ตั้งค่าฐานข้อมูลบน Supabase
นำไฟล์ Migration SQL ในโฟลเดอร์ `/supabase` ทั้งหมดไปรันใน **Supabase SQL Editor** เพื่อสร้างตาราง ตัวอย่างเช่น:
- `setup.sql` (ตารางหลัก)
- `migration_add_boss_evaluations.sql` (ตารางประเมินหัวหน้า)
- `migration_add_system_settings.sql` (ตารางตั้งค่าเปิดปิดระบบ)

### 4. เริ่มเซิร์ฟเวอร์
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

---

## 🔗 การตั้งค่า LINE Webhook
1. สร้าง Provider และ Channel (Messaging API) ใน [LINE Developers Console](https://developers.line.biz/)
2. นำ `Channel Access Token` มาใส่ใน `.env.local`
3. ตั้งค่า **Webhook URL** เป็น: `https://your-domain.com/api/webhook/line`
4. เปิดการใช้งาน **Use webhook**

---
*Developed & Designed by Bungkii*
