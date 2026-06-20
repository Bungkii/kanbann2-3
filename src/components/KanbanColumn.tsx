'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import type { Task } from './KanbanBoard';

type ColumnProps = {
  column: {
    id: string;
    title: string;
    tasks: Task[];
  };
  onDeleteTask?: (id: string) => void;
  onTaskClick?: (task: Task) => void;
};

export default function KanbanColumn({ column, onDeleteTask, onTaskClick }: ColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div className="bg-slate-100/50 rounded-2xl w-80 flex flex-col max-h-full flex-shrink-0 border border-slate-200">
      <div className="p-4 border-b border-slate-200/60 flex items-center justify-between bg-slate-100/80 rounded-t-2xl">
        <h3 className="font-bold text-slate-700">{column.title}</h3>
        <span className="bg-white text-slate-500 text-xs font-medium px-2.5 py-0.5 rounded-full border border-slate-200 shadow-sm">
          {column.tasks.length}
        </span>
      </div>
      
      <div 
        ref={setNodeRef}
        className="p-3 flex-1 overflow-y-auto flex flex-col gap-3 min-h-[150px]"
      >
        <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {column.tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-slate-400 border-2 border-dashed border-slate-200/60 rounded-xl bg-slate-50/50 mt-1">
              <span className="text-sm font-medium">ลากงานมาวางที่นี่</span>
            </div>
          ) : (
            column.tasks.map((task) => (
              <TaskCard key={task.id} task={task} onDelete={onDeleteTask} onClick={onTaskClick} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
