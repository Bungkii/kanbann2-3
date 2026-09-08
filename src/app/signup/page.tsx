import { redirect } from 'next/navigation'

export default function SignupPage() {
  redirect(
    '/login?message=' +
      encodeURIComponent('ระบบใช้งานบัญชีนักเรียนประจำห้อง ม.2/3 สามารถเข้าสู่ระบบด้วยเลขประจำตัวนักเรียนได้ทันที')
  )
}
