// NOTE: This file is server-only. Do NOT import it from Client Components or browser bundles.
// Session utilities (verifySessionToken, getStudentSessionFromCookies) live in ./studentSession
// and are safe to import anywhere.
import path from 'path';
import crypto from 'crypto';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Re-export session types & utils from the client-safe module
export * from './studentSession';
export * from './studentTypes';
import { StudentRole, StudentAccount, SafeStudentAccount } from './studentTypes';
import {
  StudentSessionPayload,
  createSessionToken,
  verifySessionToken,
} from './studentSession';

const ACCOUNTS_FILE = path.join(process.cwd(), 'src', 'data', 'student_accounts.json');
const STUDENTS_FILE = path.join(process.cwd(), 'src', 'data', 'students.json');
const AUTH_SALT = process.env.STUDENT_AUTH_SALT || 'primja_student_auth_salt_2026_m23';

/** Lazy-loads fs/promises to avoid bundling into client-side code. */
async function getFs() {
  const { default: fs } = await import('fs/promises');
  return fs;
}

/**
 * Direct Supabase client for student authentication operations (hybrid storage)
 */
function getDirectSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('placeholder')) return null;
  try {
    return createSupabaseClient(url, key, {
      auth: { persistSession: false },
    });
  } catch {
    return null;
  }
}

// ==========================================
// CRYPTOGRAPHIC HASHING (Zero Plaintext Passwords)
// ==========================================

/**
 * Computes an HMAC-SHA256 hash of a student password.
 */
export function hashPassword(password: string): string {
  if (!password) return '';
  if (password.startsWith('hash$')) return password;
  return 'hash$' + crypto.createHmac('sha256', AUTH_SALT).update(password.trim()).digest('hex');
}

/**
 * Verifies a plaintext password against a stored password or hash.
 */
export function verifyPassword(plainPassword: string, storedHashOrPlain: string): boolean {
  if (!plainPassword || !storedHashOrPlain) return false;
  if (storedHashOrPlain.startsWith('hash$')) {
    const computed = 'hash$' + crypto.createHmac('sha256', AUTH_SALT).update(plainPassword.trim()).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(storedHashOrPlain));
    } catch {
      return false;
    }
  }
  // Legacy plaintext fallback for seamless migration
  return plainPassword.trim() === storedHashOrPlain.trim();
}

/**
 * Computes an HMAC-SHA256 hash of a security question answer (normalized).
 */
export function hashSecurityAnswer(answer: string): string {
  if (!answer) return '';
  if (answer.startsWith('ans$')) return answer;
  return 'ans$' + crypto.createHmac('sha256', AUTH_SALT).update(answer.trim().toLowerCase()).digest('hex');
}

/**
 * Verifies a security question answer against stored answer/hash.
 */
export function verifySecurityAnswer(plainAnswer: string, storedAnswerOrHash?: string | null): boolean {
  if (!plainAnswer) return false;
  const cleanInput = plainAnswer.trim().toLowerCase();
  
  // Emergency master code for admin/testing
  if (cleanInput === '30000') return true;
  if (!storedAnswerOrHash) return false;

  if (storedAnswerOrHash.startsWith('ans$')) {
    const computed = 'ans$' + crypto.createHmac('sha256', AUTH_SALT).update(cleanInput).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(storedAnswerOrHash));
    } catch {
      return false;
    }
  }
  // Legacy plain answer match
  return cleanInput === storedAnswerOrHash.trim().toLowerCase();
}

/**
 * Strips all sensitive fields (passwords, answers) for client consumption.
 */
export function toSafeStudentAccount(account: StudentAccount): SafeStudentAccount {
  return {
    student_id: account.student_id,
    student_no: account.student_no,
    prefix: account.prefix,
    first_name: account.first_name,
    last_name: account.last_name,
    nickname: account.nickname,
    full_name: account.full_name,
    role: account.role,
    is_first_login: account.is_first_login,
    has_security_question: Boolean(account.security_question),
    updated_at: account.updated_at,
  };
}

// ==========================================
// DATA ACCESS & STORAGE (Hybrid: Supabase + JSON)
// ==========================================

/**
 * Reads all student accounts with hybrid failover:
 * 1. Queries Supabase student_accounts table if available.
 * 2. If table doesn't exist or query fails, reads from local JSON file.
 * Automatically hashes any legacy plaintext passwords on the fly.
 */
export async function getStudentAccounts(): Promise<StudentAccount[]> {
  // 1. Try local JSON first (most up-to-date, has is_first_login changes etc.)
  try {
    const fs = await getFs();
    const content = await fs.readFile(ACCOUNTS_FILE, 'utf-8');
    const accounts = JSON.parse(content) as StudentAccount[];
    if (accounts && accounts.length > 0) {
      // Auto-migrate: ensure 30260 is SuperAdmin, hash any plaintext passwords
      let needsSave = false;
      accounts.forEach((a) => {
        if (a.student_id === '30260' && a.role !== 'SuperAdmin') {
          a.role = 'SuperAdmin';
          needsSave = true;
        }
        if (a.password && !a.password.startsWith('hash$')) {
          a.password = hashPassword(a.password);
          needsSave = true;
        }
        if (a.security_answer && !a.security_answer.startsWith('ans$')) {
          a.security_answer = hashSecurityAnswer(a.security_answer);
          needsSave = true;
        }
      });
      if (needsSave) {
        await saveStudentAccounts(accounts).catch(() => {});
      }
      return accounts;
    }
  } catch {
    // Local JSON not found or unreadable — fall through to Supabase
  }

  // 2. Fallback: try Supabase (no local file — e.g. first deploy or Vercel)
  const supabase = getDirectSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('student_accounts').select('*').order('student_no', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map((r: any) => ({
          student_id: String(r.student_id),
          student_no: Number(r.student_no),
          prefix: r.prefix || '',
          first_name: r.first_name || '',
          last_name: r.last_name || '',
          nickname: r.nickname || '',
          full_name: r.full_name || '',
          role: (r.student_id === '30260' ? 'SuperAdmin' : (r.role || 'Student')) as StudentRole,
          password: r.password_hash || '',
          is_first_login: Boolean(r.is_first_login),
          security_question: r.security_question || undefined,
          security_answer: r.security_answer_hash || undefined,
          updated_at: r.updated_at || new Date().toISOString(),
        }));
      }
    } catch {
      // Supabase also unavailable
    }
  }


  return [];
}


/**
 * Returns safe student accounts (no passwords or secret answers).
 */
export async function getSafeStudentAccounts(): Promise<SafeStudentAccount[]> {
  const accounts = await getStudentAccounts();
  return accounts.map(toSafeStudentAccount);
}

/**
 * Initializes accounts for all students from students.json with secure hashes.
 */
export async function initializeStudentAccounts(): Promise<StudentAccount[]> {
  const fs = await getFs();
  const studentsRaw = await fs.readFile(STUDENTS_FILE, 'utf-8');
  const students = JSON.parse(studentsRaw) as Array<{
    student_id: string;
    student_no: number;
    prefix: string;
    first_name: string;
    last_name: string;
    nickname: string;
    full_name: string;
  }>;

  const accounts: StudentAccount[] = students.map((s) => ({
    student_id: s.student_id,
    student_no: s.student_no,
    prefix: s.prefix,
    first_name: s.first_name,
    last_name: s.last_name,
    nickname: s.nickname,
    full_name: s.full_name,
    // Student 30260 (บุ้งกี๋) is SuperAdmin; all others start as Student
    role: (s.student_id === '30260' ? 'SuperAdmin' : 'Student') as StudentRole,
    password: hashPassword(`bBb@${s.student_id}`),
    is_first_login: s.student_id === '30260' ? false : true,
    updated_at: new Date().toISOString(),
  }));

  await saveStudentAccounts(accounts);
  return accounts;
}

/**
 * Saves student accounts to local JSON and syncs with Supabase if accessible.
 */
export async function saveStudentAccounts(accounts: StudentAccount[]): Promise<void> {
  // 1. Try save to local JSON file (best-effort — may fail on read-only FS like Vercel)
  try {
    const fs = await getFs();
    const dir = path.dirname(ACCOUNTS_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
  } catch {
    // On Vercel/serverless: filesystem is read-only. Silent fail — Supabase is source of truth.
  }

  // 2. Sync to Supabase (primary storage when FS is unavailable)
  const supabase = getDirectSupabaseClient();
  if (supabase) {
    try {
      const rows = accounts.map((a) => ({
        student_id: a.student_id,
        student_no: a.student_no,
        prefix: a.prefix,
        first_name: a.first_name,
        last_name: a.last_name,
        nickname: a.nickname,
        full_name: a.full_name,
        role: a.role,
        password_hash: a.password,
        is_first_login: a.is_first_login,
        security_question: a.security_question || null,
        security_answer_hash: a.security_answer || null,
        updated_at: a.updated_at,
      }));
      // Upsert in Supabase — ignore RLS errors gracefully
      const { error } = await supabase.from('student_accounts').upsert(rows, { onConflict: 'student_id' });
      if (error) {
        console.warn('[studentAuth] Supabase upsert warning:', error.message);
      }
    } catch (e) {
      console.warn('[studentAuth] Supabase sync failed:', e);
    }
  }
}

/**
 * Finds a student account by student_id.
 */
export async function getStudentAccountById(studentId: string): Promise<StudentAccount | null> {
  const accounts = await getStudentAccounts();
  return accounts.find((a) => a.student_id === studentId.trim()) || null;
}

/**
 * Verifies credentials against hashed password.
 */
export async function verifyStudentCredentials(
  studentIdOrUsername: string,
  password: string
): Promise<StudentAccount | null> {
  const cleanId = studentIdOrUsername.trim();
  const accounts = await getStudentAccounts();
  const account = accounts.find((a) => a.student_id === cleanId);
  if (!account) return null;

  if (verifyPassword(password, account.password)) {
    return account;
  }
  return null;
}

/**
 * Updates a student's password with hashing and clears is_first_login.
 */
export async function updateStudentPassword(
  studentId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!newPassword || newPassword.trim().length < 4) {
    return { success: false, error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร' };
  }

  const accounts = await getStudentAccounts();
  const index = accounts.findIndex((a) => a.student_id === studentId.trim());
  if (index === -1) {
    return { success: false, error: 'ไม่พบบัญชีนักเรียน' };
  }

  accounts[index].password = hashPassword(newPassword.trim());
  accounts[index].is_first_login = false;
  accounts[index].updated_at = new Date().toISOString();

  await saveStudentAccounts(accounts);
  return { success: true };
}

/**
 * Skips the first-time password change for a student.
 */
export async function skipStudentFirstLogin(studentId: string): Promise<boolean> {
  const accounts = await getStudentAccounts();
  const index = accounts.findIndex((a) => a.student_id === studentId.trim());
  if (index === -1) return false;

  accounts[index].is_first_login = false;
  // Set sentinel so login knows this account has gone through first-time flow
  // (even if the user chose to skip — prevents redirect loop)
  if (!accounts[index].security_question) {
    accounts[index].security_question = '__skipped__';
  }
  accounts[index].updated_at = new Date().toISOString();

  await saveStudentAccounts(accounts);
  return true;
}

/**
 * Updates student password and security question/answer with secure hashing.
 */
export async function updateStudentSecuritySetup(
  studentId: string,
  newPassword?: string,
  securityQuestion?: string,
  securityAnswer?: string
): Promise<{ success: boolean; error?: string }> {
  const accounts = await getStudentAccounts();
  const index = accounts.findIndex((a) => a.student_id === studentId.trim());
  if (index === -1) {
    return { success: false, error: 'ไม่พบบัญชีนักเรียน' };
  }

  if (newPassword && newPassword.trim().length >= 4) {
    accounts[index].password = hashPassword(newPassword.trim());
  }

  if (securityQuestion && securityAnswer) {
    accounts[index].security_question = securityQuestion.trim();
    accounts[index].security_answer = hashSecurityAnswer(securityAnswer.trim());
  }

  accounts[index].is_first_login = false;
  accounts[index].updated_at = new Date().toISOString();

  await saveStudentAccounts(accounts);
  return { success: true };
}

/**
 * Gets student's security question (never reveals answer or hashes).
 */
export async function getStudentSecurityQuestion(
  studentId: string
): Promise<{ exists: boolean; question?: string | null; studentName?: string; error?: string }> {
  const account = await getStudentAccountById(studentId.trim());
  if (!account) {
    return { exists: false, error: `ไม่พบเลขประจำตัวนักเรียน ${studentId}` };
  }

  return {
    exists: true,
    question: account.security_question || null,
    studentName: `${account.full_name} (${account.nickname})`,
  };
}

/**
 * Verifies security answer using secure hash comparison.
 * If answer is correct (or master recovery code 30000), resets password.
 */
export async function verifyAndResetWithSecurityAnswer(
  studentId: string,
  answer: string,
  newPassword?: string
): Promise<{ success: boolean; newPassword?: string; error?: string }> {
  const accounts = await getStudentAccounts();
  const index = accounts.findIndex((a) => a.student_id === studentId.trim());
  if (index === -1) {
    return { success: false, error: `ไม่พบเลขประจำตัวนักเรียน ${studentId}` };
  }

  const account = accounts[index];
  const isMatch = verifySecurityAnswer(answer, account.security_answer);

  if (!isMatch) {
    return {
      success: false,
      error: 'คำตอบความปลอดภัยไม่ถูกต้อง! หากจำคำตอบไม่ได้ ต้องติดต่อขอรีเซ็ตรหัสผ่านกับ Admin (ผู้ดูแลระบบ)',
    };
  }

  const plainPassword =
    newPassword && newPassword.trim().length >= 4 ? newPassword.trim() : `bBb@${account.student_id}`;

  accounts[index].password = hashPassword(plainPassword);
  accounts[index].updated_at = new Date().toISOString();

  await saveStudentAccounts(accounts);
  return { success: true, newPassword: plainPassword };
}

/**
 * Updates a student's role (Admin / SuperAdmin action).
 * Protected: SuperAdmin (30260) cannot be demoted by standard Admins.
 */
export async function updateStudentRole(
  studentId: string,
  newRole: StudentRole,
  operatorRole?: StudentRole
): Promise<{ success: boolean; error?: string }> {
  if (studentId.trim() === '30260' && newRole !== 'SuperAdmin') {
    if (operatorRole !== 'SuperAdmin') {
      return { success: false, error: 'ไม่อนุญาตให้ลดระดับสิทธิ์ของ SuperAdmin (โคตรพ่อโคตรแม่ผู้ดูแลระบบ)' };
    }
  }

  const accounts = await getStudentAccounts();
  const index = accounts.findIndex((a) => a.student_id === studentId.trim());
  if (index === -1) {
    return { success: false, error: 'ไม่พบบัญชีนักเรียน' };
  }

  accounts[index].role = newRole;
  accounts[index].updated_at = new Date().toISOString();

  await saveStudentAccounts(accounts);
  return { success: true };
}

/**
 * Resets a student's password back to default bBb@<student_id> (Admin action).
 * Passwords are saved hashed. Does not reveal passwords in public logs.
 */
export async function resetStudentPassword(
  studentId: string,
  operatorRole?: StudentRole
): Promise<{ success: boolean; defaultPassword?: string; error?: string }> {
  if (studentId.trim() === '30260' && operatorRole !== 'SuperAdmin') {
    return { success: false, error: 'ไม่อนุญาตให้รีเซ็ตรหัสผ่านของ SuperAdmin' };
  }

  const accounts = await getStudentAccounts();
  const index = accounts.findIndex((a) => a.student_id === studentId.trim());
  if (index === -1) {
    return { success: false, error: 'ไม่พบบัญชีนักเรียน' };
  }

  const defaultPassword = `bBb@${accounts[index].student_id}`;
  accounts[index].password = hashPassword(defaultPassword);
  accounts[index].is_first_login = true;
  accounts[index].updated_at = new Date().toISOString();

  await saveStudentAccounts(accounts);
  return { success: true, defaultPassword };
}

// ==========================================
// SESSION MANAGEMENT (Signed Cookie)
// ==========================================

// StudentSessionPayload type and createSessionToken/verifySessionToken
// are re-exported from ./studentSession (already exported at the top).

/**
 * Gets the current student session from cookies in Server Components or Server Actions.
 */
export async function getCurrentStudentSession(): Promise<StudentSessionPayload | null> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('primja_session')?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

// getStudentSessionFromCookies is re-exported from ./studentSession (already exported at top).

/**
 * Sets student session cookies (httpOnly secure cookie + public user cookie).
 */
export async function setStudentSessionCookies(account: StudentAccount): Promise<void> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const payload: StudentSessionPayload = {
    student_id: account.student_id,
    student_no: account.student_no,
    prefix: account.prefix,
    first_name: account.first_name,
    last_name: account.last_name,
    nickname: account.nickname,
    full_name: account.full_name,
    role: account.role,
    is_first_login: account.is_first_login,
    logged_in_at: Date.now(),
  };

  const token = createSessionToken(payload);
  const maxAge = 60 * 60 * 24 * 30; // 30 days

  // 1. HTTP-Only signed session token
  cookieStore.set('primja_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });

  // 2. Client-readable user info (NO sensitive data: no password, no answers)
  const clientUser = {
    student_id: account.student_id,
    student_no: account.student_no,
    prefix: account.prefix,
    first_name: account.first_name,
    nickname: account.nickname,
    full_name: account.full_name,
    role: account.role,
  };
  cookieStore.set('primja_user', encodeURIComponent(JSON.stringify(clientUser)), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

/**
 * Clears student session cookies.
 */
export async function clearStudentSessionCookies(): Promise<void> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  cookieStore.set('primja_session', '', { path: '/', maxAge: 0 });
  cookieStore.set('primja_user', '', { path: '/', maxAge: 0 });
}
