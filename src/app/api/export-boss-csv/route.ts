import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: evaluations, error } = await supabase
      .from('boss_evaluations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Prepare CSV Header
    const headers = [
      'วันที่ประเมิน',
      'คะแนนหน้าตา',
      'คะแนนความรับผิดชอบ',
      'ลักษณะนิสัย',
      'คะแนนการจัดการ',
      'คะแนนการสื่อสาร',
      'คะแนนการแก้ปัญหา',
      'ข้อเสนอแนะ',
      'ควรเปลี่ยนหัวหน้าหรือไม่'
    ];

    let csvContent = headers.join(',') + '\n';

    // Format Data
    (evaluations || []).forEach((ev) => {
      const topics = ev.topics_scores || {};
      
      // Helper to escape commas and quotes in CSV
      const escapeCSV = (str: string | null | undefined) => {
        if (!str) return '""';
        return `"${String(str).replace(/"/g, '""')}"`;
      };

      const row = [
        escapeCSV(new Date(ev.created_at).toLocaleDateString('th-TH')),
        ev.appearance_score || 0,
        ev.responsibility_score || 0,
        escapeCSV((ev.traits || []).join(', ')),
        topics['management'] || 0,
        topics['communication'] || 0,
        topics['problem_solving'] || 0,
        escapeCSV(ev.suggestion || '-'),
        ev.should_change_boss ? 'Yes' : 'No'
      ];
      
      csvContent += row.join(',') + '\n';
    });

    // Add BOM for Excel to read UTF-8 correctly
    const bom = '\uFEFF';
    const finalCsv = bom + csvContent;

    return new NextResponse(finalCsv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="boss_evaluations.csv"'
      }
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
