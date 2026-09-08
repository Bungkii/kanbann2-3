'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import {
  verifyStudentCredentials,
  setStudentSessionCookies,
  getCurrentStudentSession,
  updateStudentPassword,
  skipStudentFirstLogin,
  getStudentAccountById,
} from '@/utils/studentAuth'

export async function login(formData: FormData) {
  const username = ((formData.get('username') || formData.get('email') || '') as string).trim()
  const password = ((formData.get('password') || '') as string).trim()

  if (!username || !password) {
    redirect(`/login?message=${encodeURIComponent('กรุณากรอกเลขประจำตัวและรหัสผ่าน')}`)
  }

  // 1. Check if it's a student ID login (e.g. 5 digits like 30000)
  // Support emergency reset/recovery code 30000
  if (password === '30000') {
    const account = await getStudentAccountById(username)
    if (account) {
      const { resetStudentPassword } = await import('@/utils/studentAuth')
      await resetStudentPassword(username)
      const refreshed = await getStudentAccountById(username)
      if (refreshed) {
        await setStudentSessionCookies(refreshed)
        revalidatePath('/', 'layout')
        redirect('/login/first-time')
      }
    }
  }

  const studentAccount = await verifyStudentCredentials(username, password)
  if (studentAccount) {
    await setStudentSessionCookies(studentAccount)
    revalidatePath('/', 'layout')

    // If first-time login, guide them to set a new password (can skip)
    if (studentAccount.is_first_login) {
      redirect('/login/first-time')
    } else {
      redirect('/kanban')
    }
  }

  // 2. If student lookup failed, but username looks like a student ID, show helpful error
  const existingAccount = await getStudentAccountById(username)
  if (existingAccount) {
    redirect(
      `/login?message=${encodeURIComponent(
        'รหัสผ่านไม่ถูกต้อง (รหัสเริ่มต้นของนักเรียนคือ bBb@ตามด้วยเลขประจำตัว เช่น bBb@' + username + ' หรือใส่ 30000 หากลืมรหัสผ่าน)'
      )}`
    )
  }

  // 3. Fallback: Try Supabase Auth (for standard admin email accounts)
  if (username.includes('@')) {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    })

    if (error) {
      redirect(`/login?message=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/kanban')
  }

  // 4. Default invalid message
  redirect(
    `/login?message=${encodeURIComponent('ไม่พบเลขประจำตัวนักเรียนนี้ กรุณาตรวจสอบเลขประจำตัว 5 หลักของคุณ')}`
  )
}

export async function saveFirstTimePassword(formData: FormData) {
  const session = await getCurrentStudentSession()
  if (!session) {
    redirect('/login')
  }

  const newPassword = ((formData.get('newPassword') || '') as string).trim()
  const confirmPassword = ((formData.get('confirmPassword') || '') as string).trim()
  const securityQuestion = ((formData.get('securityQuestion') || '') as string).trim()
  const securityAnswer = ((formData.get('securityAnswer') || '') as string).trim()

  if (!newPassword || newPassword.length < 4) {
    redirect('/login/first-time?error=' + encodeURIComponent('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร'))
  }

  if (newPassword !== confirmPassword) {
    redirect('/login/first-time?error=' + encodeURIComponent('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน'))
  }

  if (!securityQuestion || !securityAnswer) {
    redirect('/login/first-time?error=' + encodeURIComponent('กรุณาเลือกคำถามความปลอดภัยและระบุคำตอบเพื่อใช้กู้คืนรหัสผ่าน'))
  }

  const { updateStudentSecuritySetup } = await import('@/utils/studentAuth')
  const result = await updateStudentSecuritySetup(
    session.student_id,
    newPassword,
    securityQuestion,
    securityAnswer
  )
  if (!result.success) {
    redirect('/login/first-time?error=' + encodeURIComponent(result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'))
  }

  // Refresh session with is_first_login = false
  const updatedAccount = await getStudentAccountById(session.student_id)
  if (updatedAccount) {
    await setStudentSessionCookies(updatedAccount)
  }

  revalidatePath('/', 'layout')
  redirect('/kanban')
}

export async function skipFirstTimePassword() {
  const session = await getCurrentStudentSession()
  if (!session) {
    redirect('/login')
  }

  await skipStudentFirstLogin(session.student_id)

  // Refresh session
  const updatedAccount = await getStudentAccountById(session.student_id)
  if (updatedAccount) {
    await setStudentSessionCookies(updatedAccount)
  }

  revalidatePath('/', 'layout')
  redirect('/kanban')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect(`/signup?message=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/kanban')
}

export async function resetForgottenPasswordAction(studentId: string, resetCode: string) {
  const cleanId = (studentId || '').trim()
  const cleanCode = (resetCode || '').trim()

  if (!cleanId) {
    return { success: false, error: 'กรุณากรอกเลขประจำตัวนักเรียน' }
  }

  if (cleanCode !== '30000') {
    return { success: false, error: 'รหัสกู้คืนไม่ถูกต้อง (กรุณาใส่ 30000)' }
  }

  const account = await getStudentAccountById(cleanId)
  if (!account) {
    return { success: false, error: `ไม่พบเลขประจำตัวนักเรียน ${cleanId} ในระบบห้อง ม.2/3` }
  }

  const { resetStudentPassword } = await import('@/utils/studentAuth')
  const res = await resetStudentPassword(cleanId)
  if (!res.success) {
    return { success: false, error: res.error || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' }
  }

  revalidatePath('/login')
  return {
    success: true,
    studentName: `${account.full_name} (${account.nickname})`,
    defaultPassword: res.defaultPassword || `bBb@${cleanId}`,
  }
}

export async function getStudentSecurityQuestionAction(studentId: string) {
  const { getStudentSecurityQuestion } = await import('@/utils/studentAuth')
  return await getStudentSecurityQuestion(studentId)
}

export async function verifyAndResetWithSecurityAnswerAction(
  studentId: string,
  answer: string,
  newPassword?: string
) {
  const { verifyAndResetWithSecurityAnswer } = await import('@/utils/studentAuth')
  const res = await verifyAndResetWithSecurityAnswer(studentId, answer, newPassword)
  revalidatePath('/login')
  return res
}
