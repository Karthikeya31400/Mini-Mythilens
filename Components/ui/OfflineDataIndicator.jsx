import React from 'react';
import { WifiOff, CloudOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OfflineDataIndicator({ show }) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
    >
      <CloudOff className="w-3.5 h-3.5" />
      Viewing offline data
    </motion.div>
  );
}
