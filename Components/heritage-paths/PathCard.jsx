import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Award, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PathCard({ path, progress, onStart, onContinue }) {
  const isStarted = progress && progress.current_step > 0;
  const isCompleted = progress?.completed;
  const completionPercentage = progress 
    ? Math.round((progress.completed_steps.length / path.total_steps) * 100) 
    : 0;

  const themeColors = {
    architecture: 'from-amber-500 to-orange-600',
    mythology: 'from-purple-500 to-pink-600',
    ancient_civilizations: 'from-blue-500 to-indigo-600',
    religious_heritage: 'from-rose-500 to-red-600',
    cultural_traditions: 'from-emerald-500 to-teal-600',
    historical_periods: 'from-stone-500 to-slate-600'
  };

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-stone-200 hover:border-purple-300 transition-all"
    >
      <div className={`h-3 bg-gradient-to-r ${themeColors[path.theme] || 'from-purple-500 to-indigo-600'}`} />
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-display text-xl font-bold text-stone-800 mb-2">
              {path.title}
            </h3>
            <p className="text-sm text-stone-600 mb-3 line-clamp-2">
              {path.description}
            </p>
          </div>
          {isCompleted && (
            <div className="ml-3">
              <CheckCircle className="w-8 h-8 text-emerald-500 fill-emerald-100" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${difficultyColors[path.difficulty_level]}`}>
            {path.difficulty_level}
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
            {path.theme.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <MapPin className="w-4 h-4" />
            <span>{path.total_steps} sites to explore</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Clock className="w-4 h-4" />
            <span>{path.estimated_duration}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-stone-600">
            <Award className="w-4 h-4" />
            <span>Earn: {path.completion_badge}</span>
          </div>
        </div>

        {isStarted && !isCompleted && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-stone-600 font-medium">Progress</span>
              <span className="text-purple-600 font-semibold">{completionPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-600"
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        <Button
          onClick={isStarted ? onContinue : onStart}
          className={`w-full gap-2 ${
            isCompleted
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
          } text-white`}
        >
          {isCompleted ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Review Journey
            </>
          ) : isStarted ? (
            <>
              Continue Journey
              <ChevronRight className="w-4 h-4" />
            </>
          ) : (
            <>
              Start Journey
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
