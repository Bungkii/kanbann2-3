'use client';

import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { useMemo } from 'react';

const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div className="h-48 w-full bg-slate-50 animate-pulse rounded-2xl border border-slate-200"></div>
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  }), []);

  return (
    <div className="rich-text-container">
      <style>{`
        .ql-container {
          font-family: inherit !important;
          font-size: 1rem !important;
          border-bottom-left-radius: 1rem;
          border-bottom-right-radius: 1rem;
          border-color: #e2e8f0 !important;
          background: rgba(248, 250, 252, 0.5);
          min-height: 150px;
        }
        .ql-toolbar {
          border-top-left-radius: 1rem;
          border-top-right-radius: 1rem;
          border-color: #e2e8f0 !important;
          background: #ffffff;
          font-family: inherit !important;
        }
        .ql-editor {
          min-height: 150px;
          padding: 1rem 1.25rem;
        }
        .ql-editor p {
          margin-bottom: 0.5rem;
        }
        .rich-text-container:focus-within .ql-container,
        .rich-text-container:focus-within .ql-toolbar {
          border-color: #6366f1 !important;
        }
      `}</style>
      <ReactQuill 
        theme="snow" 
        value={value} 
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
      />
    </div>
  );
}
