import { NextResponse, NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseClient(url, key);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get('id');

    if (!formId) {
      return NextResponse.json({ error: 'Missing form ID' }, { status: 400 });
    }

    const admin = getAdminClient();

    // 1. Fetch form
    const { data: form, error: formError } = await admin
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single();

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // 2. Fetch responses
    const { data: responses, error: respError } = await admin
      .from('form_responses')
      .select('*')
      .eq('form_id', formId)
      .order('created_at', { ascending: true });

    if (respError) {
      return NextResponse.json({ error: respError.message }, { status: 500 });
    }

    const questions = form.questions || [];

    // Helper to escape CSV values
    const escapeCSV = (val: any) => {
      if (val === undefined || val === null) return '""';
      if (Array.isArray(val)) {
        return `"${val.map(x => String(x).replace(/"/g, '""')).join(', ')}"`;
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    // Build Headers
    const headers = [
      'ลำดับ (No.)',
      'วันเวลาที่ตอบ (Submitted At)',
      'เลขประจำตัว (Student ID)',
      'ชื่อ-นามสกุล (Name)',
    ];

    if (form.is_quiz) {
      headers.push('คะแนนที่ได้ (Score)', 'คะแนนเต็ม (Max Score)');
    }

    questions.forEach((q: any, idx: number) => {
      headers.push(`ข้อ ${idx + 1}: ${q.title || 'คำถาม'}`);
    });

    let csvContent = headers.join(',') + '\n';

    // Build Rows
    (responses || []).forEach((resp, rIdx) => {
      const answers = resp.answers || {};
      const row: string[] = [
        String(rIdx + 1),
        escapeCSV(new Date(resp.created_at).toLocaleString('th-TH')),
        escapeCSV(resp.respondent_id || 'ไม่ระบุ'),
        escapeCSV(resp.respondent_name || 'ผู้ไม่ประสงค์ออกนาม'),
      ];

      if (form.is_quiz) {
        row.push(String(resp.score ?? 0), String(resp.max_score ?? form.max_points ?? 0));
      }

      questions.forEach((q: any) => {
        const userAns = answers[q.id];
        row.push(escapeCSV(userAns));
      });

      csvContent += row.join(',') + '\n';
    });

    // UTF-8 BOM for Excel compatibility
    const bom = '\uFEFF';
    const finalCsv = bom + csvContent;

    const safeTitle = (form.title || 'form_responses').replace(/[/\\?%*:|"<>]/g, '_');

    return new NextResponse(finalCsv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(safeTitle)}_responses.csv"`,
      },
    });
  } catch (err: any) {
    console.error('CSV export error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
