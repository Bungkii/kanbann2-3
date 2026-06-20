'use client';

import { Toaster } from 'react-hot-toast';

export default function ToasterProvider() {
  return (
    <Toaster 
      position="bottom-right" 
      toastOptions={{
        style: {
          fontFamily: 'var(--font-ibm-plex-sans-thai)',
          borderRadius: '12px',
          background: '#333',
          color: '#fff',
        },
      }} 
    />
  );
}
