import React from 'react';
import { motion } from 'framer-motion';
import { Check, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function ItemSelector({ items, selectedIds, onToggle, type }) {
  const maxSelection = 2;

  return (
    <div className="grid gap-4">
      {items.map((item) => {
        const isSelected = selectedIds.includes(item.id);
        const canSelect = selectedIds.length < maxSelection || isSelected;

        return (
          <motion.div
            key={item.id}
            whileHover={{ scale: canSelect ? 1.02 : 1 }}
            className={`
              relative rounded-2xl border-2 p-5 cursor-pointer transition-all
              ${isSelected 
                ? 'border-amber-500 bg-amber-50' 
                : canSelect 
                  ? 'border-stone-200 bg-white hover:border-amber-300' 
                  : 'border-stone-200 bg-stone-50 opacity-50 cursor-not-allowed'
              }
            `}
            onClick={() => canSelect && onToggle(item.id)}
          >
            <div className="flex gap-4">
              {/* Checkbox */}
              <div className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
                ${isSelected 
                  ? 'border-amber-500 bg-amber-500' 
                  : 'border-stone-300 bg-white'
                }
              `}>
                {isSelected && <Check className="w-4 h-4 text-white" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-stone-800 mb-1">
                  {type === 'heritage' ? item.title : item.original_text?.substring(0, 80)}
                </h3>
                {type === 'heritage' ? (
                  <p className="text-sm text-stone-600 line-clamp-2">{item.history?.substring(0, 150)}</p>
                ) : (
                  <p className="text-sm text-stone-600 line-clamp-2">{item.modern_translation?.substring(0, 150)}</p>
                )}
                <p className="text-xs text-stone-400 mt-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(item.created_date), 'MMM d, yyyy')}
                </p>
              </div>

              {/* Image thumbnail for heritage */}
              {type === 'heritage' && item.image_url && (
                <img 
                  src={item.image_url} 
                  alt={item.title}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
