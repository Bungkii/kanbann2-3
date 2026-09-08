'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, ListFilter, CalendarDays } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

export type FilterPeriod = 'year' | 'daily' | 'monthly';
export type SortOption = 'count' | 'name' | 'latest';

export interface TaskFilterState {
  period: FilterPeriod;
  date: string; // YYYY-MM-DD
  sort: SortOption;
}

interface TaskFilterWidgetProps {
  filterState: TaskFilterState;
  onChange: (newState: TaskFilterState) => void;
  className?: string;
}

const SORT_LABELS: Record<SortOption, string> = {
  count: 'เรียงตามจำนวนมากสุด',
  name: 'เรียงตามชื่อ',
  latest: 'เรียงล่าสุด',
};

export default function TaskFilterWidget({
  filterState,
  onChange,
  className = '',
}: TaskFilterWidgetProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date display: DD/MM/YYYY
  const displayDate = React.useMemo(() => {
    try {
      const d = parseISO(filterState.date);
      if (isValid(d)) {
        return format(d, 'dd/MM/yyyy');
      }
    } catch (e) {}
    return filterState.date;
  }, [filterState.date]);

  return (
    <div className={`bg-white/95 backdrop-blur-md rounded-3xl p-3 sm:p-4 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-2.5 max-w-sm w-full ${className}`}>
      {/* 1. Period Segmented Control (ปีการศึกษา / รายวัน / รายเดือน) */}
      <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => onChange({ ...filterState, period: 'year' })}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer text-center ${
            filterState.period === 'year'
              ? 'bg-white text-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          ปีการศึกษา
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...filterState, period: 'daily' })}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer text-center ${
            filterState.period === 'daily'
              ? 'bg-sky-100/90 text-sky-700 border border-sky-200/80 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          รายวัน
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...filterState, period: 'monthly' })}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer text-center ${
            filterState.period === 'monthly'
              ? 'bg-white text-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          รายเดือน
        </button>
      </div>

      {/* 2. Date Selector Pill (Red Calendar Icon + Date) */}
      <div
        onClick={() => {
          try {
            dateInputRef.current?.showPicker?.();
          } catch (e) {
            dateInputRef.current?.focus();
          }
        }}
        className="relative flex items-center justify-between px-3.5 py-2 rounded-full border border-slate-200/90 bg-white hover:border-sky-300 transition-colors cursor-pointer shadow-2xs group"
      >
        <div className="flex items-center gap-2.5">
          {/* Red Calendar Button matching screenshot */}
          <div className="w-7 h-7 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <CalendarDays size={15} />
          </div>
          <span className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
            {displayDate}
          </span>
        </div>

        {filterState.period === 'monthly' && (
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            ทั้งเดือน
          </span>
        )}
        {filterState.period === 'year' && (
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            ทั้งปี
          </span>
        )}

        {/* Hidden Native Date Input */}
        <input
          ref={dateInputRef}
          type="date"
          value={filterState.date}
          onChange={(e) => {
            if (e.target.value) {
              onChange({ ...filterState, date: e.target.value });
            }
          }}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer -z-0"
        />
      </div>

      {/* 3. Sort Dropdown Pill */}
      <div ref={sortRef} className="relative">
        <button
          type="button"
          onClick={() => setIsSortOpen(!isSortOpen)}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-full border border-slate-200/90 bg-white hover:border-sky-300 transition-colors cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Light blue sort icon matching screenshot */}
            <div className="w-7 h-7 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <ListFilter size={15} />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
              {SORT_LABELS[filterState.sort]}
            </span>
          </div>
          <ChevronDown
            size={18}
            className={`text-indigo-600 transition-transform duration-200 shrink-0 ml-1 ${
              isSortOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Options Popup (Image 2 style) */}
        {isSortOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.12)] z-30 space-y-1 animate-in fade-in zoom-in-95 duration-150">
            {(['count', 'name', 'latest'] as SortOption[]).map((opt) => {
              const isSelected = filterState.sort === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange({ ...filterState, sort: opt });
                    setIsSortOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-sky-100/90 text-sky-700 border border-sky-200/80'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {SORT_LABELS[opt]}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
