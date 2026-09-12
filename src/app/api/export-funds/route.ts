import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import PDFDocument from 'pdfkit-table';
import { STUDENTS } from '@/data/students';
import path from 'path';
import fs from 'fs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekParam = searchParams.get('week');

    const supabase = await createClient();

    // 1. Fetch System Settings (Starting Balance Adjustment, Dates)
    const { data: settingsData } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['funds_balance_adjustment', 'funds_start_date', 'funds_end_date']);

    let adjustment = 0;
    settingsData?.forEach((row: any) => {
      if (row.key === 'funds_balance_adjustment') adjustment = Number(row.value) || 0;
    });

    // 2. Fetch Funds for the requested week
    let query = supabase.from('class_funds').select('*');
    if (weekParam) {
      query = query.eq('week_start_date', weekParam);
    }
    const { data: weekFundsData } = await query;
    const weekFunds = weekFundsData || [];

    // 3. Fetch All Time Funds Data
    const { data: allFundsData } = await supabase
      .from('class_funds')
      .select('amount')
      .eq('is_paid', true);

    const sumAllPaid = (allFundsData || []).reduce((acc: number, item: any) => acc + Number(item.amount), 0);

    // 4. Fetch All Expenses
    const { data: expensesData } = await supabase
      .from('class_expenses')
      .select('*')
      .order('created_at', { ascending: false });

    const expenses = expensesData || [];
    const sumExpenses = expenses.reduce((acc: number, item: any) => acc + Number(item.amount), 0);

    // Calculations
    const weekPaidRecords = weekFunds.filter((f: any) => f.is_paid);
    const weekPaidCount = weekPaidRecords.length;
    const weekSumPaid = weekPaidRecords.reduce((acc: number, f: any) => acc + Number(f.amount || 20), 0);
    const totalFunds = sumAllPaid + adjustment - sumExpenses;

    const exportDateStr = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    const weekLabel = weekParam 
      ? new Date(weekParam).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'ทั้งหมด';

    // Generate PDF (A4 Portrait)
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'portrait' });

    // Stream to buffer
    const chunks: Uint8Array[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    
    const promise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // Register Font from local disk or URL
    try {
      const fontPath = path.join(process.cwd(), 'public', 'fonts', 'THSarabunNew.ttf');
      if (fs.existsSync(fontPath)) {
        doc.registerFont('THSarabun', fontPath);
        doc.font('THSarabun');
      } else {
        const origin = req.nextUrl.origin;
        const fontRes = await fetch(`${origin}/fonts/THSarabunNew.ttf`);
        if (fontRes.ok) {
          const fontBuffer = Buffer.from(await fontRes.arrayBuffer());
          doc.registerFont('THSarabun', fontBuffer);
          doc.font('THSarabun');
        }
      }
    } catch (e) {
      console.warn('Font loading notice:', e);
    }

    // Title
    doc.fontSize(20).fillColor('#0f172a').text(`รายงานบัญชีและกองทุนห้อง ม.2/3 (ห้อง 3 สัมธุน)`, { align: 'center' });
    doc.fontSize(14).fillColor('#475569').text(`ประจำสัปดาห์: ${weekLabel}  |  วันที่ออกรายงาน: ${exportDateStr}`, { align: 'center' });
    doc.moveDown(0.8);

    // Summary Box Table
    const summaryTable = {
      headers: [
        { label: "รายการ", property: "item", width: 230, headerColor: "#059669", headerOpacity: 1 },
        { label: "จำนวนเงิน (บาท)", property: "amount", width: 140, headerColor: "#059669", headerOpacity: 1 },
        { label: "รายละเอียด", property: "note", width: 165, headerColor: "#059669", headerOpacity: 1 },
      ],
      datas: [
        { item: "ยอดยกมา / ปรับฐานเริ่มต้น", amount: `${adjustment.toLocaleString()} บาท`, note: "ยอดยกมาตั้งต้น" },
        { item: `ยอดเก็บได้รอบนี้ (${weekLabel})`, amount: `${weekSumPaid.toLocaleString()} บาท`, note: `จ่ายแล้ว ${weekPaidCount} / 52 คน` },
        { item: "ยอดเงินเก็บสะสมทั้งหมดทุกสัปดาห์", amount: `${sumAllPaid.toLocaleString()} บาท`, note: "รวมทุกสัปดาห์ในระบบ" },
        { item: "ยอดรายจ่ายทั้งหมดของห้อง", amount: `-${sumExpenses.toLocaleString()} บาท`, note: `รวม ${expenses.length} รายการ` },
        { item: "ยอดเงินคงเหลือสุทธิของห้อง", amount: `${totalFunds.toLocaleString()} บาท`, note: "(ยอดยกมา + เก็บได้) - รายจ่าย" },
      ]
    };

    await doc.table(summaryTable, {
      prepareHeader: () => doc.font('THSarabun').fontSize(13).fillColor('white'),
      prepareRow: () => doc.font('THSarabun').fontSize(12).fillColor('#0f172a'),
      padding: 4,
    });

    doc.moveDown(0.8);
    doc.fontSize(15).fillColor('#0f172a').text(`ตารางการชำระเงินรายบุคคล (รอบ ${weekLabel})`, { align: 'left' });
    doc.moveDown(0.3);

    // Student Status Table
    const studentTable = {
      headers: [
        { label: "เลขที่", property: "no", width: 40, headerColor: "#334155", headerOpacity: 1 },
        { label: "รหัส", property: "id", width: 55, headerColor: "#334155", headerOpacity: 1 },
        { label: "ชื่อ - นามสกุล", property: "name", width: 230, headerColor: "#334155", headerOpacity: 1 },
        { label: "ชื่อเล่น", property: "nickname", width: 70, headerColor: "#334155", headerOpacity: 1 },
        { label: "สถานะ", property: "status", width: 70, headerColor: "#334155", headerOpacity: 1 },
        { label: "ยอดเงิน", property: "amount", width: 70, headerColor: "#334155", headerOpacity: 1 },
      ],
      datas: STUDENTS.map((student) => {
        const fundRecord = weekFunds.find((f: any) => f.student_number === student.student_no);
        const isPaid = !!fundRecord?.is_paid;
        const amount = isPaid ? (fundRecord?.amount || 20) : 0;
        return {
          no: String(student.student_no),
          id: student.student_id,
          name: `${student.prefix}${student.first_name} ${student.last_name}`,
          nickname: student.nickname,
          status: isPaid ? 'จ่ายแล้ว' : 'ยังไม่จ่าย',
          amount: isPaid ? `${amount} ฿` : '0 ฿',
        };
      })
    };

    await doc.table(studentTable, {
      prepareHeader: () => doc.font('THSarabun').fontSize(11).fillColor('white'),
      prepareRow: (row: any) => doc.font('THSarabun').fontSize(10).fillColor(row?.status === 'จ่ายแล้ว' ? '#047857' : '#b91c1c'),
      padding: 2.5,
    });

    // Expenses Breakdown on next page if expenses exist
    if (expenses.length > 0) {
      doc.addPage();
      doc.fontSize(16).fillColor('#0f172a').text(`รายการประวัติการใช้จ่ายเงินห้อง (${expenses.length} รายการ)`, { align: 'left' });
      doc.moveDown(0.5);

      const expTable = {
        headers: [
          { label: "ลำดับ", property: "no", width: 45, headerColor: "#dc2626", headerOpacity: 1 },
          { label: "วันที่", property: "date", width: 100, headerColor: "#dc2626", headerOpacity: 1 },
          { label: "รายการรายจ่าย", property: "desc", width: 280, headerColor: "#dc2626", headerOpacity: 1 },
          { label: "จำนวนเงิน", property: "amount", width: 110, headerColor: "#dc2626", headerOpacity: 1 },
        ],
        datas: expenses.map((exp: any, idx: number) => ({
          no: String(idx + 1),
          date: new Date(exp.created_at).toLocaleDateString('th-TH'),
          desc: exp.description || '-',
          amount: `${Number(exp.amount).toLocaleString()} บาท`,
        }))
      };

      await doc.table(expTable, {
        prepareHeader: () => doc.font('THSarabun').fontSize(12).fillColor('white'),
        prepareRow: () => doc.font('THSarabun').fontSize(11).fillColor('#0f172a'),
        padding: 4,
      });
    }

    doc.end();
    const buffer = await promise;

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="funds_report_${weekParam || 'all'}.pdf"`
      }
    });

  } catch (err: any) {
    console.error('Export PDF Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
