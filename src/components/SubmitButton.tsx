'use client';

import { useFormStatus } from 'react-dom';

export default function SubmitButton({ children, pendingText }: { children: React.ReactNode, pendingText: string }) {
  const { pending } = useFormStatus();

  return (
    <button 
      disabled={pending}
      type="submit"
      className="bg-indigo-600 text-white rounded-xl px-4 py-3 mt-4 mb-2 hover:bg-indigo-700 font-medium shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full"
    >
      {pending ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          {pendingText}
        </>
      ) : children}
    </button>
  );
}
