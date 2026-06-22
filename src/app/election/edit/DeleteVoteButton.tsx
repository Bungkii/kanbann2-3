'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteVote } from './actions';

export default function DeleteVoteButton({ voteId }: { voteId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('แน่ใจหรือไม่ที่จะลบผลโหวตนี้?')) return;
    
    setIsDeleting(true);
    const result = await deleteVote(voteId);
    
    if (result.error) {
      toast.error(`ลบไม่ได้: ${result.error}`);
      setIsDeleting(false);
    } else {
      toast.success('ลบผลโหวตสำเร็จ');
      // The server action revalidates the path, so it should auto-refresh
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="ลบผลโหวต"
    >
      {isDeleting ? (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <Trash2 size={20} />
      )}
    </button>
  );
}
