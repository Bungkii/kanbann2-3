import React from 'react';
import { GraduationCap } from 'lucide-react';

interface ParentLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ParentLogo({ size = 'md', className = '' }: ParentLogoProps) {
  if (size === 'sm') {
    return (
      <div
        className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#635bf7] to-[#7343ef] p-1.5 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0 ${className}`}
      >
        <div className="w-full h-full rounded-lg bg-white/18 backdrop-blur-xs border border-white/30 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
          <GraduationCap className="w-5 h-5 text-white stroke-[2.2]" />
        </div>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div
        className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-br from-[#635bf7] via-[#6651f2] to-[#783ef2] p-3 flex items-center justify-center shadow-2xl shadow-indigo-500/30 ${className}`}
      >
        <div className="w-full h-full rounded-2xl bg-white/18 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]">
          <GraduationCap className="w-10 h-10 sm:w-11 sm:h-11 text-white stroke-[2.2] drop-shadow-xs" />
        </div>
      </div>
    );
  }

  // Default 'md'
  return (
    <div
      className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#635bf7] to-[#7343ef] p-2 flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0 ${className}`}
    >
      <div className="w-full h-full rounded-xl bg-white/18 backdrop-blur-xs border border-white/30 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
        <GraduationCap className="w-7 h-7 text-white stroke-[2.2]" />
      </div>
    </div>
  );
}
