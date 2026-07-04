'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export default function PageTransition({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {children}
    </motion.main>
  );
}
