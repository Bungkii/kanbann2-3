import { NextRequest, NextResponse } from 'next/server';
import {
  getStudentTaskCompletions,
  setStudentTaskCompletion,
  TaskStatus,
} from '@/utils/studentTaskCompletions';
import { getCurrentStudentSession } from '@/utils/studentAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
    }

    const completions = await getStudentTaskCompletions(studentId);
    return NextResponse.json({ success: true, completions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { studentId, taskId, status } = body;

    // If studentId not explicitly provided, try getting from current student session
    if (!studentId) {
      const session = await getCurrentStudentSession();
      if (session) {
        studentId = session.student_id;
      }
    }

    if (!studentId || !taskId || !status) {
      return NextResponse.json(
        { error: 'Missing required parameters (studentId, taskId, status)' },
        { status: 400 }
      );
    }

    const result = await setStudentTaskCompletion(
      studentId,
      taskId,
      status as TaskStatus
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, studentId, taskId, status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
