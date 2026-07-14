"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getSolutions(taskId: string) {
  const supabase = await createClient();

  const { data: solutions, error: solError } = await supabase
    .from('homework_solutions')
    .select(`
      id,
      task_id,
      uploader_name,
      image_url,
      post_type,
      description,
      liked_by,
      created_at
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (solError) {
    console.error('Error fetching solutions:', solError);
    return { success: false, error: solError.message };
  }

  // Fetch comments for these solutions
  const solutionIds = (solutions || []).map(s => s.id);
  
  let commentsData: any[] = [];
  if (solutionIds.length > 0) {
    const { data: comments, error: comError } = await supabase
      .from('homework_solution_comments')
      .select('*')
      .in('solution_id', solutionIds)
      .order('created_at', { ascending: true });
      
    if (!comError) {
      commentsData = comments || [];
    }
  }

  // Combine
  const solutionsWithComments = solutions.map(sol => ({
    ...sol,
    comments: commentsData.filter(c => c.solution_id === sol.id)
  }));

  return { success: true, data: solutionsWithComments };
}

export async function getAllSolutions() {
  const supabase = await createClient();

  const { data: solutions, error: solError } = await supabase
    .from('homework_solutions')
    .select(`
      id,
      task_id,
      uploader_name,
      image_url,
      post_type,
      description,
      liked_by,
      created_at,
      homework_tasks(subject)
    `)
    .order('created_at', { ascending: false });

  if (solError) {
    console.error('Error fetching all solutions:', solError);
    return { success: false, error: solError.message };
  }

  const solutionIds = (solutions || []).map(s => s.id);
  
  let commentsData: any[] = [];
  if (solutionIds.length > 0) {
    const { data: comments, error: comError } = await supabase
      .from('homework_solution_comments')
      .select('*')
      .in('solution_id', solutionIds)
      .order('created_at', { ascending: true });
      
    if (!comError) {
      commentsData = comments || [];
    }
  }

  const solutionsWithComments = (solutions || []).map(sol => ({
    ...sol,
    task_subject: (sol.homework_tasks as any)?.subject || 'ไม่ระบุวิชา',
    comments: commentsData.filter(c => c.solution_id === sol.id)
  }));

  return { success: true, data: solutionsWithComments };
}

export async function addSolution(taskId: string, uploaderName: string, description: string, imageUrl: string | null, postType: string = 'share') {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('homework_solutions')
    .insert({
      task_id: taskId,
      uploader_name: uploaderName,
      description,
      image_url: imageUrl,
      post_type: postType
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding solution:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/kanban');
  return { success: true, data };
}

export async function toggleLikeSolution(solutionId: string, deviceId: string) {
  const supabase = await createClient();
  
  // First, get current liked_by array
  const { data: current, error: fetchError } = await supabase
    .from('homework_solutions')
    .select('liked_by')
    .eq('id', solutionId)
    .single();
    
  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  let likedBy = current.liked_by || [];
  
  if (likedBy.includes(deviceId)) {
    likedBy = likedBy.filter((id: string) => id !== deviceId);
  } else {
    likedBy.push(deviceId);
  }

  const { error: updateError } = await supabase
    .from('homework_solutions')
    .update({ liked_by: likedBy })
    .eq('id', solutionId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath('/kanban');
  return { success: true, liked_by: likedBy };
}

export async function addComment(solutionId: string, authorName: string, content: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('homework_solution_comments')
    .insert({
      solution_id: solutionId,
      author_name: authorName,
      content
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/kanban');
  return { success: true, data };
}

export async function getActiveTasks() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('homework_tasks')
    .select('id, subject')
    .neq('status', 'deleted')
    .order('due_date', { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data: data || [] };
}
