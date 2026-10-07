"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getStudentSessionFromCookies } from "@/utils/studentSession";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  return createSupabaseClient(supabaseUrl, supabaseKey);
}

// Check if user has rank (Leader, Finance, Admin, SuperAdmin)
export async function getCurrentUserRank() {
  // 1. Try Supabase Auth user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const role = (user.user_metadata?.role || 'Student') as string;
    const isRanked = ['Leader', 'Finance', 'Admin', 'SuperAdmin'].includes(role);
    return {
      isRanked,
      role,
      name: user.user_metadata?.full_name || user.email || 'ผู้ใช้ระบบ',
      id: user.id,
    };
  }

  // 2. Try Student Cookie Session
  const cookieStore = await cookies();
  const student = getStudentSessionFromCookies(cookieStore as any);
  if (student) {
    const isRanked = ['Leader', 'Finance', 'Admin', 'SuperAdmin'].includes(student.role);
    return {
      isRanked,
      role: student.role,
      name: student.full_name || `${student.first_name} ${student.last_name}`,
      id: student.student_id,
      student_no: student.student_no,
    };
  }

  return { isRanked: false, role: 'Guest', name: '', id: '' };
}

// Get all forms
export async function getFormsList() {
  const admin = getAdminClient();
  const user = await getCurrentUserRank();

  const { data, error } = await admin
    .from('forms')
    .select('*, form_responses(count)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching forms:", error);
    return [];
  }

  const list = data || [];
  if (!user.isRanked) {
    return list.filter((f) => !f.visibility || f.visibility === 'public');
  }

  return list.filter((f) => {
    if (!f.visibility || f.visibility === 'public') return true;
    if (['Leader', 'SuperAdmin', 'Admin'].includes(user.role)) return true;
    return f.creator_id === user.id;
  });
}

// Get a single form by ID
export async function getFormById(formId: string) {
  if (!formId) return null;
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('forms')
    .select('*')
    .eq('id', formId)
    .single();

  if (error) {
    return null;
  }
  return data;
}

// Get responses for a form (admin/owner)
export async function getFormResponses(formId: string) {
  if (!formId) return [];
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('form_responses')
    .select('*')
    .eq('form_id', formId)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }
  return data || [];
}

// Check if a respondent already submitted a form (for duplicate prevention)
export async function checkDuplicateResponse(formId: string, respondentId: string): Promise<boolean> {
  if (!formId || !respondentId) return false;
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('form_responses')
    .select('id')
    .eq('form_id', formId)
    .eq('respondent_id', respondentId)
    .limit(1);

  if (error) return false;
  return (data || []).length > 0;
}

// Create a new form (Ranked users only)
export async function createForm(formData: {
  title: string;
  description?: string;
  max_points?: number | null;
  allow_anonymous?: boolean;
  visibility?: 'public' | 'private';
  is_quiz?: boolean;
  questions: any[];
}) {
  const user = await getCurrentUserRank();
  if (!user.isRanked) {
    return { success: false, error: "คุณไม่มีสิทธิ์ในการสร้างแบบสอบถาม (สำหรับผู้มียศเท่านั้น)" };
  }

  if (!formData.title?.trim()) {
    return { success: false, error: "กรุณาระบุหัวข้อแบบสอบถาม" };
  }

  const admin = getAdminClient();
  const { data, error } = await admin
    .from('forms')
    .insert({
      title: formData.title.trim(),
      description: formData.description?.trim() || '',
      creator_id: user.id,
      creator_name: user.name,
      creator_role: user.role,
      is_active: true,
      is_quiz: formData.is_quiz || false,
      allow_anonymous: formData.allow_anonymous || false,
      visibility: formData.visibility || 'public',
      max_points: formData.max_points ?? null,
      questions: formData.questions || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/form');
  return { success: true, form: data };
}

// Update an existing form (Owner or Admin/Leader/SuperAdmin)
export async function updateForm(formId: string, formData: {
  title: string;
  description?: string;
  max_points?: number | null;
  allow_anonymous?: boolean;
  visibility?: 'public' | 'private';
  is_quiz?: boolean;
  questions: any[];
}) {
  const user = await getCurrentUserRank();
  if (!user.isRanked) {
    return { success: false, error: "คุณไม่มีสิทธิ์แก้ไขแบบสอบถาม" };
  }

  if (!formData.title?.trim()) {
    return { success: false, error: "กรุณาระบุหัวข้อแบบสอบถาม" };
  }

  const admin = getAdminClient();

  // Verify ownership or admin privileges
  const { data: existingForm } = await admin
    .from('forms')
    .select('id, creator_id')
    .eq('id', formId)
    .single();

  if (!existingForm) {
    return { success: false, error: "ไม่พบแบบสอบถามที่ต้องการแก้ไข" };
  }

  const canEdit = ['Leader', 'SuperAdmin', 'Admin'].includes(user.role) || existingForm.creator_id === user.id;
  if (!canEdit) {
    return { success: false, error: "คุณสามารถแก้ไขได้เฉพาะแบบสอบถามที่คุณสร้างขึ้นเท่านั้น" };
  }

  const { data, error } = await admin
    .from('forms')
    .update({
      title: formData.title.trim(),
      description: formData.description?.trim() || '',
      allow_anonymous: formData.allow_anonymous || false,
      visibility: formData.visibility || 'public',
      is_quiz: formData.is_quiz || false,
      max_points: formData.max_points ?? null,
      questions: formData.questions || [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', formId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/form');
  revalidatePath(`/form?id=${formId}`);
  return { success: true, form: data };
}

// Toggle form active state (open/close form for responses)
export async function toggleFormStatus(formId: string, isActive: boolean) {
  const user = await getCurrentUserRank();
  if (!user.isRanked) {
    return { success: false, error: "คุณไม่มีสิทธิ์แก้ไขสถานะแบบสอบถาม" };
  }

  const admin = getAdminClient();

  // Verify ownership or admin
  const { data: existingForm } = await admin
    .from('forms')
    .select('id, creator_id')
    .eq('id', formId)
    .single();

  if (!existingForm) return { success: false, error: "ไม่พบแบบสอบถาม" };

  const canEdit = ['Leader', 'SuperAdmin', 'Admin'].includes(user.role) || existingForm.creator_id === user.id;
  if (!canEdit) return { success: false, error: "ไม่มีสิทธิ์แก้ไขแบบสอบถามนี้" };

  const { error } = await admin
    .from('forms')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', formId);

  if (error) return { success: false, error: error.message };
  revalidatePath('/form');
  return { success: true };
}

// Delete a form
export async function deleteForm(formId: string) {
  const user = await getCurrentUserRank();
  if (!user.isRanked) {
    return { success: false, error: "คุณไม่มีสิทธิ์ลบแบบสอบถาม" };
  }

  const admin = getAdminClient();
  const { error } = await admin.from('forms').delete().eq('id', formId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/form');
  return { success: true };
}

// Submit a form response (with automatic score calculation for Quiz Mode + duplicate prevention)
export async function submitFormResponse(formId: string, answers: Record<string, any>, isAnonymous: boolean) {
  const admin = getAdminClient();

  // Check form exists and is active
  const { data: form, error: formError } = await admin
    .from('forms')
    .select('id, title, is_active, allow_anonymous, is_quiz, max_points, questions')
    .eq('id', formId)
    .single();

  if (formError || !form) {
    return { success: false, error: "ไม่พบแบบสอบถามนี้" };
  }

  if (!form.is_active) {
    return { success: false, error: "แบบสอบถามนี้ปิดรับคำตอบแล้ว" };
  }

  const cookieStore = await cookies();
  const session = getStudentSessionFromCookies(cookieStore as any);
  
  let respondentId = session?.student_id || null;
  let respondentName = session?.full_name || null;

  if (!respondentId) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      respondentId = user.id;
      respondentName = user.user_metadata?.full_name || user.email || 'ผู้ใช้ระบบ';
    }
  }

  // If user requested anonymous and form allows it
  if (isAnonymous && form.allow_anonymous) {
    respondentId = null;
    respondentName = 'ผู้ไม่ประสงค์ออกนาม';
  } else if (!respondentName && !respondentId) {
    respondentName = 'ผู้ตอบทั่วไป';
  }

  // --- Duplicate submission prevention (only for identified users, not anonymous) ---
  if (respondentId && !isAnonymous) {
    const isDuplicate = await checkDuplicateResponse(formId, respondentId);
    if (isDuplicate) {
      return { 
        success: false, 
        error: "คุณได้ส่งคำตอบแบบสอบถามนี้ไปแล้ว ไม่สามารถส่งซ้ำได้ครับ",
        isDuplicate: true,
      };
    }
  }

  // Auto-calculate score if it is a quiz
  let earnedScore: number | null = null;
  let totalMaxScore: number | null = null;
  let questionResults: any[] | null = null;

  if (form.is_quiz) {
    earnedScore = 0;
    totalMaxScore = 0;
    questionResults = [];
    const questions = form.questions || [];

    for (const q of questions) {
      const qPoints = Number(q.points) || 1;
      totalMaxScore += qPoints;

      const userAns = answers[q.id];
      const correctAns = q.correct_answer;

      let isCorrect = false;
      let earnedForQ = 0;

      if (correctAns !== undefined && correctAns !== null && String(correctAns).trim() !== "") {
        const cleanCorrect = String(correctAns).trim().toLowerCase();
        
        if (Array.isArray(userAns)) {
          // Checkboxes: support partial credit if user gets some correct choices
          const userSet = new Set(userAns.map((x: string) => String(x).trim().toLowerCase()));
          const correctSet = new Set(cleanCorrect.split(/[,;\n]/).map(x => x.trim()).filter(Boolean));
          
          // Full credit: exact match
          const userJoined = [...userSet].sort().join(',');
          const correctJoined = [...correctSet].sort().join(',');
          if (userJoined === correctJoined) {
            isCorrect = true;
            earnedForQ = qPoints;
          } else {
            // Partial credit: proportion of correct choices selected (minus wrong ones)
            const correctlySelected = [...userSet].filter(u => correctSet.has(u)).length;
            const wronglySelected = [...userSet].filter(u => !correctSet.has(u)).length;
            const partialRatio = Math.max(0, (correctlySelected - wronglySelected)) / correctSet.size;
            earnedForQ = Math.round(partialRatio * qPoints * 10) / 10;
            if (earnedForQ > 0) isCorrect = true;
          }
        } else if (userAns !== undefined && userAns !== null) {
          const cleanUser = String(userAns).trim().toLowerCase();
          if (cleanUser === cleanCorrect) {
            isCorrect = true;
            earnedForQ = qPoints;
          }
        }
      } else {
        // No correct answer defined → skip scoring for this question
        earnedForQ = 0;
      }

      earnedScore += earnedForQ;
      questionResults.push({
        qId: q.id,
        qTitle: q.title,
        qType: q.type,
        qPoints,
        earnedPoints: earnedForQ,
        isCorrect,
        userAnswer: userAns,
        correctAnswer: q.correct_answer,
      });
    }

    if (form.max_points && form.max_points > 0) {
      totalMaxScore = form.max_points;
    }
  }

  const { error: insertError } = await admin
    .from('form_responses')
    .insert({
      form_id: formId,
      respondent_id: respondentId,
      respondent_name: respondentName,
      answers: answers || {},
      score: earnedScore,
      max_score: totalMaxScore,
      question_results: questionResults,
      created_at: new Date().toISOString(),
    });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  revalidatePath(`/form`);
  return { 
    success: true, 
    is_quiz: form.is_quiz, 
    score: earnedScore, 
    max_score: totalMaxScore,
    question_results: questionResults,
  };
}
