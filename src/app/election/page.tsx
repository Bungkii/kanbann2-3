import { createClient } from '@/utils/supabase/server';
import ElectionResults from './ElectionResults';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 0; // Disable caching to show real-time results

export default async function ElectionPage() {
  const supabase = await createClient();

  // Fetch all votes
  const { data: votes, error: votesError } = await supabase
    .from('leader_votes')
    .select('voted_for');

  if (votesError) {
    console.error('Error fetching votes:', votesError);
  }

  // Fetch all candidates to get their images
  const { data: candidatesData, error: candidatesError } = await supabase
    .from('candidates')
    .select('*');

  if (candidatesError) {
    console.error('Error fetching candidates:', candidatesError);
  }

  const validVotes = votes || [];
  const totalVotes = validVotes.length;
  const TOTAL_POPULATION = 52;
  const turnoutPercentage = Math.round((totalVotes / TOTAL_POPULATION) * 100);

  // Aggregate votes
  const voteCounts = validVotes.reduce((acc: Record<string, number>, vote) => {
    const candidateName = vote.voted_for || 'ไม่ประสงค์ลงคะแนน';
    acc[candidateName] = (acc[candidateName] || 0) + 1;
    return acc;
  }, {});

  // Add candidates with 0 votes if they exist in the candidates table
  (candidatesData || []).forEach(c => {
    if (voteCounts[c.name] === undefined) {
      voteCounts[c.name] = 0;
    }
  });

  // Convert to array, sort, and attach image_url
  const candidates = Object.entries(voteCounts)
    .map(([name, count]) => {
      const dbCandidate = (candidatesData || []).find(c => c.name === name);
      return {
        name,
        count: count as number,
        percentage: Math.round(((count as number) / Math.max(totalVotes, 1)) * 100),
        image_url: dbCandidate?.image_url || null
      };
    })
    .sort((a, b) => b.count - a.count);

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center overflow-hidden">
      <div className="w-full max-w-3xl relative">
        <Link 
          href="/"
          className="absolute -top-4 left-0 md:-left-12 text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors z-10"
          title="กลับหน้าแรก"
        >
          <ArrowLeft size={24} />
        </Link>
        
        <ElectionResults 
          candidates={candidates} 
          totalVotes={totalVotes} 
          totalPopulation={TOTAL_POPULATION} 
          turnoutPercentage={turnoutPercentage} 
        />
      </div>
    </main>
  );
}
