import { createClient } from '@/utils/supabase/server';
import ElectionResults from './ElectionResults';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 0; // Disable caching to show real-time results

export default async function ElectionPage() {
  const supabase = await createClient();

  // Fetch all votes
  const { data: votes, error } = await supabase
    .from('leader_votes')
    .select('voted_for');

  if (error) {
    console.error('Error fetching votes:', error);
  }

  const validVotes = votes || [];
  const totalVotes = validVotes.length;
  const TOTAL_POPULATION = 52;
  const turnoutPercentage = Math.round((totalVotes / TOTAL_POPULATION) * 100);

  // Aggregate votes
  const voteCounts = validVotes.reduce((acc: Record<string, number>, vote) => {
    const candidate = vote.voted_for || 'ไม่ประสงค์ลงคะแนน';
    acc[candidate] = (acc[candidate] || 0) + 1;
    return acc;
  }, {});

  // Convert to array and sort
  const candidates = Object.entries(voteCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / Math.max(totalVotes, 1)) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
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
