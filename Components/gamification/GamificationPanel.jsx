import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Trophy, Award, Star, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const BADGE_CONFIG = {
  'first_contribution': { icon: '🎯', label: 'First Contribution', color: 'text-blue-600' },
  'heritage_explorer_1': { icon: '🏛️', label: 'Heritage Explorer I', color: 'text-amber-600' },
  'heritage_explorer_5': { icon: '🏛️', label: 'Heritage Explorer V', color: 'text-amber-700' },
  'heritage_explorer_10': { icon: '🏛️', label: 'Heritage Explorer X', color: 'text-amber-800' },
  'text_decoder': { icon: '📜', label: 'Text Decoder', color: 'text-purple-600' },
  'history_buff': { icon: '📚', label: 'History Buff', color: 'text-emerald-600' },
  'top_reviewer': { icon: '⭐', label: 'Top Reviewer', color: 'text-rose-600' },
  'community_champion': { icon: '🤝', label: 'Community Champion', color: 'text-indigo-600' },
  'master_explorer': { icon: '👑', label: 'Master Explorer', color: 'text-yellow-600' }
};

export default function GamificationPanel() {
  const { data: userStats } = useQuery({
    queryKey: ['user-gamification-stats'],
    queryFn: async () => {
      const user = await base44.auth.me().catch(() => null);
      if (!user) return null;
      const stats = await base44.entities.UserStats.filter({ user_email: user.email }, '-created_date', 1);
      return stats[0] || null;
    }
  });

  if (!userStats) return null;

  const badges = userStats.badges || [];
  const points = userStats.points || 0;
  const reputation = userStats.reputation_score || 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-amber-50 to-purple-50 rounded-2xl p-6 border-2 border-amber-200"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-stone-800 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-600" />
          Your Achievements
        </h3>
        <Link 
          to={createPageUrl('Leaderboard')}
          className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
        >
          <TrendingUp className="w-4 h-4" />
          Leaderboard
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white p-3 rounded-xl border border-amber-200">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-stone-600">Points</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{points}</p>
        </div>

        <div className="bg-white p-3 rounded-xl border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-stone-600">Reputation</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-purple-600">{reputation}</p>
            <span className="text-xs text-stone-500">/100</span>
          </div>
        </div>
      </div>

      {badges.length > 0 && (
        <div>
          <p className="text-xs font-medium text-stone-600 mb-2">Badges Earned ({badges.length})</p>
          <div className="flex flex-wrap gap-2">
            {badges.slice(0, 6).map((badge, idx) => {
              const config = BADGE_CONFIG[badge] || { icon: '🏅', label: badge, color: 'text-stone-600' };
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-stone-200"
                  title={config.label}
                >
                  <span className="text-lg">{config.icon}</span>
                  <span className={`text-xs font-medium ${config.color}`}>
                    {config.label}
                  </span>
                </div>
              );
            })}
            {badges.length > 6 && (
              <div className="flex items-center px-2 py-1 bg-stone-100 rounded-lg">
                <span className="text-xs text-stone-600">+{badges.length - 6} more</span>
              </div>
            )}
          </div>
        </div>
      )}

      {badges.length === 0 && (
        <p className="text-sm text-stone-500 text-center py-4">
          Start exploring to earn badges! 🎯
        </p>
      )}
    </motion.div>
  );
}
