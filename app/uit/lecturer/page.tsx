'use client';

import { motion } from 'framer-motion';
import LecturerLayout from '@/components/layout/lecturer';

export default function LecturerDashboard() {
  return (
    <LecturerLayout>
      <motion.div 
        className="flex justify-center items-center h-[80vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-gray-700">
          
        </h1>
      </motion.div>
    </LecturerLayout>
  );
}
