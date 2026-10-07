import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import studentsData from '@/data/students.json';

export const revalidate = 0;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('placeholder')) return null;
  return createSupabaseClient(url, key);
}

// In-memory fallback if Supabase table is pending or offline
let memoryState = {
  agenda: "ระเบียบวาระที่ ๑ เรื่องที่ประธานแจ้งให้ที่ประชุมทราบ",
  control_mode: "QUORUM", // 'QUORUM' or 'VOTE'
  display_mode: "QUORUM",
  is_system_open: true,
  timer_status: "STOPPED", // 'RUNNING', 'PAUSED', 'STOPPED'
  timer_str: "15:00",
  remaining_seconds: 900,
  current_speaker: "",
  speaker_queue: [] as string[],
  motion_text: "ร่างข้อบัญญัติกรุงเทพมหานคร เรื่อง การบริหารจัดการขยะมูลฝอย\n\nข้อ ๑. ให้ผู้กระทำผิดปรับเป็นเงินจำนวน ๒,๐๐๐ บาท",
  recheck_quorum_counter: 0,
  attendance_map: {} as Record<string, boolean>,
  vote_map: {} as Record<string, string>,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('student_id') || '';
  const studentNo = searchParams.get('student_no') || '';

  const supabase = getSupabase();
  if (supabase) {
    try {
      // 1. Fetch live system session state from Supabase system_settings or parliament_session
      const { data: sessionData } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['parliament_state']);

      if (sessionData && sessionData.length > 0) {
        const val = sessionData[0].value;
        const parsed = typeof val === 'string' ? JSON.parse(val) : val;
        memoryState = { ...memoryState, ...parsed };
      }

      // 2. Fetch student's attendance & vote from parliament_votes (within last 60 days)
      if (studentId || studentNo) {
        const { data: records } = await supabase
          .from('parliament_votes')
          .select('*')
          .or(`student_id.eq.${studentId},student_id.eq.${studentNo}`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (records && records.length > 0) {
          const latestVote = records.find(r => r.record_type === 'VOTE' && r.agenda === memoryState.agenda);
          if (latestVote) {
            memoryState.vote_map[studentId] = latestVote.choice;
          }
          const latestQuorum = records.find(r => r.record_type === 'QUORUM');
          if (latestQuorum) {
            memoryState.attendance_map[studentId] = latestQuorum.choice === 'PRESENT';
          }
        }
      }
    } catch {
      // fallback to memory state
    }
  }

  const hasCheckedQuorum = !!(memoryState.attendance_map[studentId] || memoryState.attendance_map[studentNo]);
  const myVote = memoryState.vote_map[studentId] || memoryState.vote_map[studentNo] || 'NONE';
  const isInSpeakerQueue = memoryState.speaker_queue.includes(studentId);

  return NextResponse.json({
    ...memoryState,
    students: studentsData,
    has_checked_quorum: hasCheckedQuorum,
    my_vote: myVote,
    is_in_speaker_queue: isInSpeakerQueue,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, student_id, student_no, student_name, choice, status, new_state } = body;
    const supabase = getSupabase();

    // 1. Admin/Sync state update
    if (action === 'sync_state' && new_state) {
      memoryState = { ...memoryState, ...new_state };
      if (supabase) {
        await supabase
          .from('system_settings')
          .upsert({ key: 'parliament_state', value: memoryState }, { onConflict: 'key' });
      }
      return NextResponse.json({ success: true, state: memoryState });
    }

    // 2. Student Quorum Check-in
    if (action === 'quorum') {
      const isPresent = status !== false;
      if (student_id) memoryState.attendance_map[student_id] = isPresent;
      if (student_no) memoryState.attendance_map[student_no] = isPresent;

      if (supabase) {
        await supabase.from('parliament_votes').insert({
          record_type: 'QUORUM',
          student_id: String(student_id || student_no),
          student_name: student_name || '',
          agenda: memoryState.agenda,
          choice: isPresent ? 'PRESENT' : 'ABSENT',
          created_at: new Date().toISOString()
        });

        // 60-day auto purge
        const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('parliament_votes').delete().lt('created_at', cutoff);
      }
      return NextResponse.json({ success: true, quorum: isPresent });
    }

    // 3. Student Vote
    if (action === 'vote') {
      const voteChoice = choice || 'NONE';
      if (student_id) memoryState.vote_map[student_id] = voteChoice;
      if (student_no) memoryState.vote_map[student_no] = voteChoice;

      if (supabase) {
        await supabase.from('parliament_votes').insert({
          record_type: 'VOTE',
          student_id: String(student_id || student_no),
          student_name: student_name || '',
          agenda: memoryState.agenda,
          choice: voteChoice,
          created_at: new Date().toISOString()
        });

        // 60-day auto purge
        const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('parliament_votes').delete().lt('created_at', cutoff);
      }
      return NextResponse.json({ success: true, choice: voteChoice });
    }

    // 4. Student Speaker Queue
    if (action === 'speaker_queue') {
      const sid = String(student_id);
      let isQueued = false;
      if (memoryState.speaker_queue.includes(sid)) {
        memoryState.speaker_queue = memoryState.speaker_queue.filter(x => x !== sid);
        isQueued = false;
      } else {
        memoryState.speaker_queue.push(sid);
        isQueued = true;
      }
      return NextResponse.json({ success: true, queued: isQueued });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
