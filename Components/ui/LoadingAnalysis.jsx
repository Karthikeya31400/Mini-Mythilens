import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function LoadingAnalysis({ message = "Analyzing with AI..." }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 rounded-full border-4 border-amber-200 border-t-amber-500"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Sparkles className="w-8 h-8 text-amber-500" />
          </motion.div>
        </div>
      </div>
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="mt-6 text-lg font-medium text-stone-600"
      >
        {message}
      </motion.p>
      <p className="mt-2 text-stone-400 text-sm">
        Powered by Google Gemini AI
      </p>
    </motion.div>
  );
}
