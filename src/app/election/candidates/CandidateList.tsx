'use client';

import { useState } from 'react';
import { deleteCandidate } from './actions';
import toast from 'react-hot-toast';
import { Trash2, Users } from 'lucide-react';

type Candidate = {
  id: string;
  name: string;
  image_url: string | null;
  created_at: string;
};

export default function CandidateList({ candidates }: { candidates: Candidate[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`แน่ใจหรือไม่ที่จะลบผู้สมัคร "${name}"? ข้อมูลคะแนนโหวตจะไม่ถูกลบ แต่ชื่อนี้จะหายไปจากตัวเลือก`)) return;
    
    setDeletingId(id);
    try {
      const result = await deleteCandidate(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('ลบผู้สมัครเรียบร้อย');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setDeletingId(null);
    }
  };

  if (candidates.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
        <div className="text-slate-400 mb-3 flex justify-center"><Users size={40} /></div>
        <p className="text-slate-500 font-medium">ยังไม่มีข้อมูลผู้สมัคร</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {candidates.map((candidate) => (
        <div key={candidate.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="shrink-0">
            {candidate.image_url ? (
              <img src={candidate.image_url} alt={candidate.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-100" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-slate-50">
                <Users size={24} />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-lg truncate">{candidate.name}</h3>
            <p className="text-xs text-slate-500">
              เพิ่มเมื่อ {new Date(candidate.created_at).toLocaleDateString('th-TH')}
            </p>
          </div>
          
          <button
            onClick={() => handleDelete(candidate.id, candidate.name)}
            disabled={deletingId === candidate.id}
            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
            title="ลบผู้สมัคร"
          >
            {deletingId === candidate.id ? (
              <span className="animate-spin border-2 border-red-500 border-t-transparent rounded-full w-5 h-5 block"></span>
            ) : (
              <Trash2 size={20} />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
