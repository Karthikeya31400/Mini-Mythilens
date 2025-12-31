import React from 'react';
import { motion } from 'framer-motion';

export default function AnalysisCard({ icon: Icon, title, content, color, delay = 0 }) {
  const colorStyles = {
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    burgundy: 'bg-rose-50 border-rose-200 text-rose-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  };

  const iconBg = {
    amber: 'bg-amber-100',
    burgundy: 'bg-rose-100',
    emerald: 'bg-emerald-100',
    indigo: 'bg-indigo-100',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`
        rounded-2xl border-2 p-6 ${colorStyles[color]}
        hover:shadow-lg transition-shadow duration-300
      `}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${iconBg[color]} shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
