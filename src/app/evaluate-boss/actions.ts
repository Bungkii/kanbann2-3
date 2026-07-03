"use server";

import { createClient } from "@/utils/supabase/server";

export async function submitBossEvaluation(data: any) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('boss_evaluations')
    .insert([{
      appearance_score: data.appearanceScore,
      responsibility_score: data.responsibilityScore,
      traits: data.selectedTraits,
      management_score: data.topicScores.management || 0,
      communication_score: data.topicScores.communication || 0,
      problem_solving_score: data.topicScores.problem_solving || 0,
      suggestion: data.suggestion,
      overall_score: data.overallScore,
      improvements: data.improvements.filter((imp: string) => imp.trim() !== ""),
      should_change_boss: data.shouldChangeBoss
    }]);

  if (error) {
    console.error('Error inserting boss evaluation:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
