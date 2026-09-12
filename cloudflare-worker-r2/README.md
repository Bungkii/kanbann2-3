# ☁️ Cloudflare Worker + Cloudflare R2 Storage (cdn.bungkii.app)

โฟลเดอร์นี้บรรจุสคริปต์ **Cloudflare Worker** สำหรับจัดการอัปโหลดและเปิดอ่านไฟล์ทุกชนิด (PDF, เอกสาร Word, Excel, PowerPoint, Zip, วิดีโอ, เสียง) เข้าสู่ **Cloudflare R2 Object Storage** ภายใต้โดเมน **`https://cdn.bungkii.app`**

---

## 🛠️ โครงสร้างการอัปโหลดไฟล์ของระบบ (Upload Architecture)

1. 🖼️ **รูปภาพ (Images - JPG, PNG, WEBP, GIF):**
   - อัปโหลดเข้า **ImgBB API** โดยตรงผ่าน `uploadImageToImgBB()`
   - ได้ URL ลิงก์ตรงที่โหลดไว ไม่มีค่าใช้จ่าย และแสดงผลได้ทันที
2. 📁 **ไฟล์ทุกชนิด & เอกสาร (All File Types - PDF, DOCX, XLSX, ZIP, etc.):**
   - อัปโหลดเข้า **Cloudflare R2 Storage** ผ่าน **Cloudflare Worker** (`uploadFileToR2()`)
   - URL ปลายทาง: **`https://cdn.bungkii.app/<filename>`**

---

## 🚀 วิธีตั้งค่าและ Deploy Worker ไปยัง Cloudflare

### 1. เข้าสู่ Cloudflare Dashboard
1. ไปที่ [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. เมนูด้านซ้ายเลือก **R2 Object Storage** -> กด **Create bucket**
3. ตั้งชื่อ Bucket: `kanbann-storage`
4. กด **Create Bucket**

### 2. ติดตั้งและ Deploy ด้วย Wrangler CLI
เปิด Terminal ในโฟลเดอร์นี้ (`cloudflare-worker-r2`):

```bash
# 1. ติดตั้ง Dependencies (Wrangler)
npm install

# 2. ล็อกอินเข้า Cloudflare
npx wrangler login

# 3. Deploy ขึ้นสู่ Cloudflare
npm run deploy
# หรือ npx wrangler deploy
```

### 3. ตั้งค่า Custom Domain (`cdn.bungkii.app`)
1. ในหน้า Cloudflare Dashboard -> **Workers & Pages** -> เลือก Worker `kanbann-r2-worker`
2. ไปที่แท็บ **Settings** -> **Domains & Routes** -> กด **Add Custom Domain**
3. ใส่โดเมน: `cdn.bungkii.app` แล้วกดยืนยัน (Cloudflare จะผูก DNS CNAME ให้อัตโนมัติ)

---

## 📡 API Endpoints ที่ Worker รองรับ

| Method | Endpoint | คำอธิบาย | ตัวอย่างการใช้งาน |
|---|---|---|---|
| `PUT` | `/:filename` | สตรีมอัปโหลดไฟล์ไบนารีโดยตรง | `fetch('https://cdn.bungkii.app/homework.pdf', { method: 'PUT', body: file })` |
| `POST` | `/` หรือ `/upload` | อัปโหลดผ่าน `FormData` (key: `file`) | `const fd = new FormData(); fd.append('file', file); fetch('https://cdn.bungkii.app/upload', { method: 'POST', body: fd })` |
| `GET` | `/:filename` | ดาวน์โหลด/เปิดอ่านไฟล์จาก R2 | `https://cdn.bungkii.app/1726000000_homework.pdf` |
| `DELETE`| `/:filename` | ลบไฟล์ออกจาก R2 Bucket | `fetch('https://cdn.bungkii.app/homework.pdf', { method: 'DELETE' })` |
