import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import PDFDocument from 'pdfkit-table';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: evaluations, error } = await supabase
      .from('boss_evaluations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate PDF
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

    // Stream to buffer
    const chunks: Uint8Array[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    
    const promise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // Register Font
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'THSarabunNew.ttf');
    if (fs.existsSync(fontPath)) {
      doc.registerFont('THSarabun', fontPath);
      doc.font('THSarabun');
    }

    const dateStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.fontSize(18).fillColor('black').text(`ผลการประเมินหัวหน้ายอดแย่ ผลเมื่อวันที่ ${dateStr}`, { align: 'center' });
    doc.moveDown();

    const table = {
      headers: [
        { label: "created_at", property: "created_at", width: 70, headerColor: "#ec4899", headerOpacity: 1 },
        { label: "appearance_score", property: "appearance_score", width: 90, headerColor: "#ec4899", headerOpacity: 1 },
        { label: "responsibility_score", property: "responsibility_score", width: 90, headerColor: "#ec4899", headerOpacity: 1 },
        { label: "traits", property: "traits", width: 100, headerColor: "#ec4899", headerOpacity: 1 },
        { label: "management_score", property: "management_score", width: 90, headerColor: "#ec4899", headerOpacity: 1 },
        { label: "communication_score", property: "communication_score", width: 100, headerColor: "#ec4899", headerOpacity: 1 },
        { label: "problem_solving_score", property: "problem_solving_score", width: 100, headerColor: "#ec4899", headerOpacity: 1 },
        { label: "suggestion", property: "suggestion", width: 70, headerColor: "#ec4899", headerOpacity: 1 },
        { label: "should_change_boss", property: "should_change_boss", width: 80, headerColor: "#ec4899", headerOpacity: 1 },
      ],
      datas: (evaluations || []).map((ev) => {
        const topics = ev.topics_scores || {};
        return {
          created_at: new Date(ev.created_at).toLocaleDateString('th-TH'),
          appearance_score: String(ev.appearance_score || 0),
          responsibility_score: String(ev.responsibility_score || 0),
          traits: (ev.traits || []).join(', '),
          management_score: String(topics['management'] || 0),
          communication_score: String(topics['communication'] || 0),
          problem_solving_score: String(topics['problem_solving'] || 0),
          suggestion: ev.suggestion || '-',
          should_change_boss: ev.should_change_boss ? 'Yes' : 'No'
        };
      })
    };

    if (table.datas.length === 0) {
      table.datas.push({
         created_at: '-',
         appearance_score: '-',
         responsibility_score: '-',
         traits: '-',
         management_score: '-',
         communication_score: '-',
         problem_solving_score: '-',
         suggestion: 'ไม่มีข้อมูล',
         should_change_boss: '-'
      });
    }

    await doc.table(table, {
      prepareHeader: () => doc.font('THSarabun').fontSize(12).fillColor('white'),
      prepareRow: () => doc.font('THSarabun').fontSize(12).fillColor('black'),
      padding: 5,
    });

    doc.end();
    
    const buffer = await promise;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="boss_evaluations.pdf"'
      }
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
