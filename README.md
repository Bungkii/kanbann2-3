# Kanbann (ระบบจัดการการบ้านและแชทบอท LINE)

ระบบจัดการการบ้านแบบ Kanban Board พร้อมการแจ้งเตือนและฟีเจอร์แชทบอทผ่าน LINE ใช้งานร่วมกับ Supabase เป็นฐานข้อมูลหลัก

## ฟีเจอร์หลัก (Features)

### 1. ระบบจัดการการบ้าน (Kanban Board)
- จัดการการบ้านด้วยระบบ Drag & Drop (Todo, In Progress, Done)
- รองรับงานเดี่ยวและงานกลุ่ม (ระบุจำนวนสมาชิกได้)
- แนบรูปภาพรายละเอียดการบ้านได้ (บันทึกลง Supabase Storage)
- ระบบแสดงผลแบบ Board, List และสรุปตามหมวดหมู่ (หมวดหมู่เร่งด่วน, เลยกำหนด, บอร์ดรวม)
- ระบบคำนวณและแสดงเปอร์เซ็นต์ความคืบหน้าของงานทั้งหมด

### 2. LINE Chatbot (พริมจ๋า)
แชทบอทอำนวยความสะดวกในกลุ่มแชทที่สามารถพิมพ์คำสั่งเพื่อเรียกดูข้อมูลได้ทันที:
- `พริมจ๋า งานวันนี้` หรือ `พริมจ๋างานวันนี้` - สรุปรายการการบ้านที่ต้องส่งภายในวันนี้
- `พริมจ๋า งานค้าง` หรือ `พริมจ๋างานค้าง` - ดูรายการการบ้านที่เลยกำหนดส่ง
- `พริมจ๋า สรุปงาน` หรือ `พริมจ๋าสรุปงาน` - สรุปรายการการบ้านทั้งหมดที่อยู่ในระบบ
- `พริมจ๋า ส่งโพลล่าสุด` หรือ `พริมจ๋าส่งโพลล่าสุด` - เรียกดูและโหวตโพลล่าสุดในกลุ่ม
- `พริมจ๋า เปลี่ยนหัวหน้า` หรือ `พริมจ๋าเปลี่ยนหัวหน้า` - เปิดโหวตเลือกหัวหน้าห้องคนใหม่
- `พริมจ๋า สรุปโหวตหัวหน้า` หรือ `พริมจ๋าสรุปโหวตหัวหน้า` - ดูผลการโหวตหัวหน้าห้องล่าสุด
- `พริมจ๋า ดูไอดี` หรือ `พริมจ๋าดูไอดี` - ดู ID ของกลุ่ม LINE ปัจจุบัน
- `คำสั่งเพิ่มเติม` - เรียกดูคู่มือการใช้งานบอท

## เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend / Backend:** Next.js (App Router), React, TypeScript
- **Styling:** Tailwind CSS, Framer Motion
- **Database / Auth / Storage:** Supabase
- **Drag & Drop:** @dnd-kit/core
- **Messaging:** LINE Messaging API (Flex Messages)

## การติดตั้งและการตั้งค่า (Setup & Installation)

### 1. Clone Project และติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local` ที่ root ของโปรเจกต์ และกำหนดค่าดังนี้:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
```

### 3. ตั้งค่าฐานข้อมูลบน Supabase
รันคำสั่ง SQL ต่อไปนี้ใน **Supabase SQL Editor** เพื่อสร้างตารางทั้งหมดที่จำเป็น:

```sql
-- รันโค้ดจากไฟล์ supabase/setup.sql ของโปรเจกต์
-- หรือก็อปปี้โค้ดด้านล่างไปรัน:

CREATE TABLE IF NOT EXISTS homework_tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subject text NOT NULL,
    due_date timestamp with time zone NOT NULL,
    details text NOT NULL,
    image_url text,
    teacher_name text,
    submission_method text,
    status text DEFAULT 'todo'::text,
    work_type text DEFAULT 'individual'::text,
    group_size integer,
    max_score numeric,
    created_at timestamp with time zone DEFAULT now()
);

-- (ตรวจสอบคำสั่งสร้าง Table และ Policies อื่นๆ ในไฟล์ supabase/setup.sql)
```

### 4. รันโปรเจกต์
```bash
npm run dev
```

เปิดเบราว์เซอร์และเข้าไปที่ `http://localhost:3000` เพื่อดูผลลัพธ์

## การเชื่อมต่อ LINE Webhook
1. สร้าง Provider และ Channel (Messaging API) ใน [LINE Developers Console](https://developers.line.biz/)
2. นำ `Channel Access Token` มาใส่ใน `.env.local`
3. นำ URL ที่ได้จากการ Deploy (เช่น Vercel) ไปตั้งค่าที่ **Webhook URL** ในรูปแบบ `https://your-domain.com/api/webhook/line`
4. กด Verify และตั้งค่า **Use webhook** เป็นเปิด (Enabled)

## License
Private / Proprietary
