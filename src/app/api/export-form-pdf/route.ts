import { NextResponse, NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit-table';

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

    // Setup PDF
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    const chunks: Uint8Array[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // Try load Thai Font
    try {
      const origin = req.nextUrl.origin;
      const fontRes = await fetch(`${origin}/fonts/THSarabunNew.ttf`);
      if (fontRes.ok) {
        const fontBuffer = Buffer.from(await fontRes.arrayBuffer());
        doc.registerFont('THSarabun', fontBuffer);
        doc.font('THSarabun');
      }
    } catch {
      console.warn('Could not load THSarabun font for PDF export');
    }

    const dateStr = new Date().toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Title & Header
    doc
      .fontSize(16)
      .fillColor('#db2777')
      .text(`รายงานสรุปผลการตอบแบบสอบถาม: ${form.title || 'ม.2/3'}`, { align: 'center' });

    doc
      .fontSize(11)
      .fillColor('#475569')
      .text(
        `ออกรายงานเมื่อ: ${dateStr} • ทั้งหมด ${(responses || []).length} คน ${
          form.is_quiz ? '• [แบบทดสอบ Quiz Mode]' : ''
        }`,
        { align: 'center' }
      );
    doc.moveDown(1);

    const questions = form.questions || [];

    // Limit columns for clean table fitting in A4 Landscape (10 columns max, plus general summary)
    const displayQuestions = questions.slice(0, 5);

    const headers = [
      { label: 'ลำดับ', property: 'no', width: 35, headerColor: '#ec4899', headerOpacity: 1 },
      { label: 'เวลาที่ตอบ', property: 'time', width: 85, headerColor: '#ec4899', headerOpacity: 1 },
      { label: 'เลขประจำตัว', property: 'student_id', width: 65, headerColor: '#ec4899', headerOpacity: 1 },
      { label: 'ชื่อ-นามสกุล', property: 'name', width: 110, headerColor: '#ec4899', headerOpacity: 1 },
    ];

    if (form.is_quiz) {
      headers.push({
        label: 'คะแนน',
        property: 'score',
        width: 50,
        headerColor: '#ec4899',
        headerOpacity: 1,
      });
    }

    displayQuestions.forEach((q: any, idx: number) => {
      headers.push({
        label: `ข้อ ${idx + 1}: ${(q.title || '').slice(0, 25)}`,
        property: `q_${q.id || idx}`,
        width: 90,
        headerColor: '#ec4899',
        headerOpacity: 1,
      });
    });

    const datas = (responses || []).map((resp, idx) => {
      const answers = resp.answers || {};
      const row: any = {
        no: String(idx + 1),
        time: new Date(resp.created_at).toLocaleDateString('th-TH'),
        student_id: resp.respondent_id || '-',
        name: resp.respondent_name || 'ผู้ไม่ประสงค์ออกนาม',
      };

      if (form.is_quiz) {
        row.score = `${resp.score ?? 0}/${resp.max_score ?? form.max_points ?? 0}`;
      }

      displayQuestions.forEach((q: any) => {
        const val = answers[q.id];
        if (Array.isArray(val)) {
          row[`q_${q.id}`] = val.join(', ') || '-';
        } else {
          row[`q_${q.id}`] = String(val ?? '-');
        }
      });

      return row;
    });

    if (datas.length === 0) {
      datas.push({
        no: '-',
        time: '-',
        student_id: '-',
        name: 'ยังไม่มีผู้ตอบแบบสอบถามนี้',
        score: '-',
      });
    }

    await doc.table(
      { headers, datas },
      {
        prepareHeader: () => doc.fontSize(11).fillColor('white'),
        prepareRow: () => doc.fontSize(10).fillColor('black'),
        padding: 4,
      }
    );

    doc.end();

    const pdfBuffer = await pdfPromise;
    const safeTitle = (form.title || 'form_responses').replace(/[/\\?%*:|"<>]/g, '_');

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(safeTitle)}_summary.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('PDF export error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
