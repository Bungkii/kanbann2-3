import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { STUDENTS } from '@/data/students';

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

    // Helper to escape CSV values
    const escapeCSV = (str: any) => {
      if (str === null || str === undefined) return '""';
      return `"${String(str).replace(/"/g, '""')}"`;
    };

    let csvContent = '';

    // Header Summary Section
    csvContent += `รายงานบัญชีและกองทุนห้อง ม.2/3 (ห้อง 3 สัมธุน)\n`;
    csvContent += `วันที่ออกรายงาน,${escapeCSV(exportDateStr)}\n`;
    csvContent += `ประจำสัปดาห์รอบที่เลือก,${escapeCSV(weekLabel)}\n`;
    csvContent += `\n`;
    csvContent += `=== สรุปยอดบัญชีกองทุนห้อง ===\n`;
    csvContent += `รายการ,จำนวนเงิน (บาท),หมายเหตุ\n`;
    csvContent += `ยอดยกมา / เงินปรับฐานเริ่มต้น,${adjustment},funds_balance_adjustment\n`;
    csvContent += `ยอดเงินเก็บได้รอบสัปดาห์นี้ (${weekLabel}),${weekSumPaid},จ่ายแล้ว ${weekPaidCount} จาก 52 คน\n`;
    csvContent += `ยอดเงินสะสมที่เก็บได้ทั้งหมดทุกรอบ,${sumAllPaid},รวมทุกสัปดาห์\n`;
    csvContent += `ยอดรายจ่ายทั้งหมดของห้อง,${sumExpenses},บันทึกแล้ว ${expenses.length} รายการ\n`;
    csvContent += `ยอดเงินคงเหลือสุทธิในห้อง,${totalFunds},คำนวณจาก (ยอดยกมา + สะสมทั้งหมด) - รายจ่าย\n`;
    csvContent += `\n`;

    // Student Payment Table Section
    csvContent += `=== รายชื่อและการชำระเงินของนักเรียน 52 คน (รอบ ${weekLabel}) ===\n`;
    csvContent += `เลขที่,รหัสประจำตัว,คำนำหน้า,ชื่อ,นามสกุล,ชื่อเล่น,สถานะการชำระ,จำนวนเงิน (บาท)\n`;

    STUDENTS.forEach((student) => {
      const fundRecord = weekFunds.find((f: any) => f.student_number === student.student_no);
      const isPaid = !!fundRecord?.is_paid;
      const amount = isPaid ? (fundRecord?.amount || 20) : 0;

      csvContent += [
        student.student_no,
        escapeCSV(student.student_id),
        escapeCSV(student.prefix),
        escapeCSV(student.first_name),
        escapeCSV(student.last_name),
        escapeCSV(student.nickname),
        escapeCSV(isPaid ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'),
        amount
      ].join(',') + '\n';
    });

    csvContent += `\n`;

    // Expenses Breakdown Section
    csvContent += `=== ประวัติรายจ่ายห้องทั้งหมด (${expenses.length} รายการ) ===\n`;
    csvContent += `ลำดับ,วันที่ทำรายการ,รายละเอียดรายจ่าย,จำนวนเงิน (บาท),ลิงก์ใบเสร็จ\n`;

    if (expenses.length === 0) {
      csvContent += `-,-,ไม่มีรายการรายจ่าย,0,-\n`;
    } else {
      expenses.forEach((exp: any, idx: number) => {
        csvContent += [
          idx + 1,
          escapeCSV(new Date(exp.created_at).toLocaleDateString('th-TH')),
          escapeCSV(exp.description),
          exp.amount,
          escapeCSV(exp.receipt_url || '-')
        ].join(',') + '\n';
      });
    }

    // Add BOM for Microsoft Excel Thai UTF-8 compatibility
    const bom = '\uFEFF';
    const finalCsv = bom + csvContent;

    const filename = `funds_report_${weekParam || 'all'}.csv`;

    return new NextResponse(finalCsv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (err: any) {
    console.error('Export CSV Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
