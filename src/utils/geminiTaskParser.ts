import { createClient as createAdminClient } from '@supabase/supabase-js';

export interface ParsedTask {
  subject: string;
  details: string;
  due_date: string; // ISO 8601 string
  teacher_name?: string | null;
  submission_method?: string | null;
  work_type?: 'individual' | 'group';
  group_size?: number | null;
  max_score?: number | null;
  created_by?: string | null;
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  return createAdminClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Retrieve Gemini API Key from environment or database system_settings
 */
export async function getGeminiApiKey(): Promise<string> {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return process.env.GEMINI_API_KEY.trim();
  }

  try {
    const supabase = getAdminClient();
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'gemini_api_key')
      .single();

    if (data?.value) {
      const val = typeof data.value === 'string' ? data.value.trim() : String(data.value).trim();
      if (val) return val;
    }
  } catch (err) {
    console.warn('[geminiTaskParser] Could not fetch gemini_api_key from system_settings:', err);
  }

  throw new Error('ยังไม่ได้ตั้งค่า GEMINI_API_KEY บนเซิร์ฟเวอร์');
}

/**
 * Ensure due_date is always a valid ISO-8601 string with time
 */
function normalizeDueDate(rawDate: unknown, referenceDate = new Date()): string {
  try {
    if (typeof rawDate === 'string' && rawDate.trim()) {
      let str = rawDate.trim();

      // Check if Thai Buddhist Year (e.g. 2569 -> 2026)
      const thaiYearMatch = str.match(/(?:25|26)(\d{2})/);
      if (thaiYearMatch) {
        const fullYear = parseInt(thaiYearMatch[0], 10);
        if (fullYear > 2400) {
          str = str.replace(String(fullYear), String(fullYear - 543));
        }
      }

      const thaiDate = str.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
      if (thaiDate) {
        const year = Number(thaiDate[3]);
        const gregorianYear = year > 2400 ? year - 543 : year < 100 ? year + 2000 : year;
        str = `${gregorianYear}-${thaiDate[2].padStart(2, '0')}-${thaiDate[1].padStart(2, '0')}T17:00:00+07:00`;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        str += 'T17:00:00+07:00';
      }
      const parsed = new Date(str);
      if (!isNaN(parsed.getTime())) {
        // If no time component was provided (or 00:00:00 UTC), set to 17:00:00 Bangkok time
        return parsed.toISOString();
      }
    }
  } catch {}

  // Fallback: 7 days from reference date at 17:00 Bangkok time
  const fallback = new Date(referenceDate);
  fallback.setDate(fallback.getDate() + 7);
  fallback.setUTCHours(10, 0, 0, 0);
  return fallback.toISOString();
}

/**
 * Parses homework message using Google Gemini 3.5 Flash Lite
 */
export async function parseHomeworkWithGemini(
  text: string
): Promise<{ tasks: ParsedTask[]; modelUsed: string }> {
  const apiKey = await getGeminiApiKey();
  const primaryModel = 'gemini-3.5-flash-lite';

  const now = new Date();
  const bangkokDateStr = now.toLocaleDateString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const systemInstruction = `คุณเป็น AI ผู้ช่วยอัจฉริยะสำหรับนักเรียนไทย (ระดับมัธยมศึกษา) ทำหน้าที่สกัดและจัดระเบียบข้อมูลการบ้าน/ภาระงานที่ครูหรือเพื่อนนักเรียนส่งมาในกลุ่ม LINE เพื่อนำไปบันทึกลงกระดานการบ้าน (Kanban)
ปัจจุบันคือวัน: ${bangkokDateStr} (ISO: ${now.toISOString()})
ปีปัจจุบัน: ค.ศ. 2026 (พ.ศ. 2569)

คำแนะนำในการวิเคราะห์:
1. ข้อความในกลุ่ม LINE มักมีหลายวิชา คั่นด้วยเครื่องหมาย เช่น 📌, 📍, bullet, หรือข้อความขึ้นต้นด้วยชื่อวิชา
2. สกัดแต่ละวิชาออกมาเป็น 1 รายการ โดยแยกฟิลด์ดังนี้:
   - subject: ชื่อวิชาภาษาไทยสั้นๆ ชัดเจน (เช่น ภาษาอังกฤษ, ภาษาไทย, ทัศนศิลป์, คณิตศาสตร์, วิทยาศาสตร์, สังคมศึกษา, สุขศึกษา, การงานอาชีพ, ฟิสิกส์ ฯลฯ)
   - details: รายละเอียดคำสั่งงาน เรียบเรียงให้อ่านง่าย จัดเป็นข้อๆ หรือ bullet (-) ถ้ามีเงื่อนไขเพิ่มเติม (เช่น ขนาดฉาก, หัวข้อที่ต้องมี, ทำในแอปหรือกระดาษ)
   - due_date: วันที่ต้องส่ง แปลงเป็น ISO-8601 string ใน timezone Asia/Bangkok (+07:00) เช่น '2026-10-30T17:00:00+07:00'
     * ถ้าข้อความระบุ 'ส่ง 30/10/2026' หรือ 'นำมา 30/10' ให้ใช้วันที่นั้น
     * ถ้าใช้ปี พ.ศ. เช่น 2569 หรือ 69 ให้แปลงเป็น ค.ศ. 2026 เสมอ
     * ถ้าเป็นกำหนดส่งแบบสัมพัทธ์ที่ไม่มีวันเริ่มต้น ให้ใส่วันประมาณใน due_date และเขียน '(วันส่งยังไม่แน่ชัด: ข้อความเดิม กรุณาตรวจแก้ก่อนบันทึก)' ใน details
     * 'งาน 29/10/2026' เป็นวันที่ประกาศงาน ไม่ใช่วันส่ง; 'หรือ งาน30/10/2026' เริ่มชุดงานใหม่ ไม่ใช่ชื่อวิชา
     * ถ้าวิชาเดียวกันมีงานสองชุดและวันส่งต่างกัน ให้แยกเป็นสองรายการ
     * สำคัญมาก: due_date ต้องเป็นวันที่ที่ถูกต้องเสมอ ห้ามใส่ค่าว่างหรือ null
   - submission_method: ช่องทาง/วิธีส่ง (เช่น 'ส่งในสมุด', 'ทำในแอปแล้วปริ้น หรือ ในกระดาษ', 'ส่งใน Google Classroom', 'ตรวจในคาบ') ถ้าไม่มีให้ใส่ null
   - teacher_name: ชื่อครูผู้สอนถ้ามีระบุ (ถ้าไม่มีใส่ null)
   - work_type: 'individual' (งานเดี่ยว) หรือ 'group' (งานกลุ่ม)
   - group_size: จำนวนคนในกลุ่มถ้าเป็นงานกลุ่ม (เป็นตัวเลข หรือ null)
   - max_score: คะแนนเต็มถ้ามีระบุ (เป็นตัวเลข หรือ null)

ตอบกลับเป็น JSON array ของวัตถุที่มีฟิลด์ข้างต้นเท่านั้น ห้ามใส่คำบรรยายอื่น`;

  // Try Gemini 3.5 Flash Lite first, then fallback to gemini-2.5-flash-lite
  const modelsToTry = [primaryModel, 'gemini-2.5-flash-lite', 'gemini-2.5-flash'];

  for (const model of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `${systemInstruction}\n\nข้อความที่เพื่อนส่งใน LINE:\n"""\n${text}\n"""`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[geminiTaskParser] Model ${model} returned error status ${response.status}:`, errorText);
        continue;
      }

      const data = await response.json();
      const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        const taskArray: any[] = Array.isArray(parsed) ? parsed : (parsed.tasks || [parsed]);

        if (taskArray.length > 0) {
          const tasks: ParsedTask[] = taskArray.map((t) => ({
            subject: String(t.subject || 'ไม่ระบุวิชา').trim(),
            details: String(t.details || '').trim(),
            due_date: normalizeDueDate(t.due_date, now),
            teacher_name: t.teacher_name ? String(t.teacher_name).trim() : null,
            submission_method: t.submission_method ? String(t.submission_method).trim() : null,
            work_type: t.work_type === 'group' ? 'group' : 'individual',
            group_size: t.group_size ? Number(t.group_size) : null,
            max_score: t.max_score ? Number(t.max_score) : null,
          }));

          return { tasks, modelUsed: model };
        }
      }
    } catch (modelError) {
      console.error(`[geminiTaskParser] Failed calling model ${model}:`, modelError);
    }
  }

  // If Gemini calls fail, fallback to smart regex parser
  console.warn('[geminiTaskParser] Falling back to Smart Fallback Regex Parser');
  const fallbackTasks = smartFallbackParser(text, now);
  return { tasks: fallbackTasks, modelUsed: 'Smart Fallback Parser' };
}

/**
 * Smart Fallback Parser for offline/network issues or fallback parsing
 */
export function smartFallbackParser(text: string, referenceDate = new Date()): ParsedTask[] {
  const tasks: ParsedTask[] = [];
  const sections = text.split(/(?=📌|📍|👉)/gu).map((s) => s.trim()).filter(Boolean);

  for (const section of sections) {
    const cleanSection = section.replace(/^[📌📍👉]\s*/u, '').trim();
    const lines = cleanSection.split('\n').map((l) => l.trim()).filter(Boolean);

    if (lines.length === 0) continue;

    const subject = lines[0].replace(/[:\-–]/g, '').trim();
    if (!subject || /^งาน\s*\d|^การบ้าน|^หรือ$/u.test(subject)) {
      continue;
    }

    const detailLines: string[] = [];
    let dueDateStr: string | null = null;
    let submissionMethod: string | null = null;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Check for deadline line
      if (line.includes('ส่ง') || line.includes('นำมา') || line.includes('กำหนดส่ง')) {
        const dateMatch = line.match(/(\d{1,2})[\/\.-](\d{1,2})(?:[\/\.-](\d{2,4}))?/);
        if (dateMatch) {
          const day = dateMatch[1];
          const month = dateMatch[2];
          let year = dateMatch[3] ? parseInt(dateMatch[3], 10) : referenceDate.getFullYear();
          if (year < 100) year += year >= 50 ? 2500 : 2000;
          if (year > 2500) year -= 543;

          dueDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T17:00:00+07:00`;
        } else if (/สัปดาห์|คาบหน้า|พรุ่งนี้|วันจันทร์|วันอังคาร|วันพุธ|วันพฤหัส|วันศุกร์/u.test(line)) {
          detailLines.push(`(วันส่งยังไม่แน่ชัด: ${line} กรุณาตรวจแก้ก่อนบันทึก)`);
        }
      }

      // Check for submission method
      if (line.includes('สมุด') || line.includes('กระดาษ') || line.includes('ปริ้น') || line.includes('แอป')) {
        submissionMethod = line;
      }

      if (!/^หรือ$|^งาน\s*\d{1,2}[\/.-]\d{1,2}/u.test(line)) detailLines.push(line);
    }

    tasks.push({
      subject,
      details: detailLines.join('\n') || cleanSection,
      due_date: normalizeDueDate(dueDateStr, referenceDate),
      submission_method: submissionMethod,
      teacher_name: null,
      work_type: cleanSection.includes('กลุ่ม') ? 'group' : 'individual',
      group_size: null,
      max_score: null,
    });
  }

  return tasks;
}

/**
 * Saves parsed tasks into Supabase homework_tasks table
 */
export async function saveParsedTasksToDatabase(
  tasks: ParsedTask[],
  source = 'line_bot'
): Promise<{ success: boolean; insertedCount: number; error?: string }> {
  if (!tasks || tasks.length === 0) {
    return { success: false, insertedCount: 0, error: 'ไม่มีรายการงานที่ต้องบันทึก' };
  }

  const supabase = getAdminClient();
  const payload = tasks.map((task) => ({
      subject: task.subject,
      due_date: task.due_date,
      details: task.details,
      teacher_name: task.teacher_name || null,
      submission_method: task.submission_method || null,
      status: 'todo',
      work_type: task.work_type || 'individual',
      group_size: task.group_size || null,
      max_score: task.max_score || null,
      created_by: source,
  }));
  let { error } = await supabase.from('homework_tasks').insert(payload);
    if (error && error.message.includes("'created_by'")) {
      const retry = await supabase.from('homework_tasks').insert(payload.map((task) => ({
        subject: task.subject, due_date: task.due_date, details: task.details,
        teacher_name: task.teacher_name, submission_method: task.submission_method,
        status: task.status, work_type: task.work_type,
        group_size: task.group_size, max_score: task.max_score,
      })));
      error = retry.error;
    }
  if (error) {
    console.error('[saveParsedTasksToDatabase] Insert error:', error);
    return { success: false, insertedCount: 0, error: error.message };
  }
  return { success: true, insertedCount: tasks.length };
}
