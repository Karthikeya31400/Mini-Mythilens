import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Star, TrendingUp } from 'lucide-react';

export default function Leaderboard() {
  const { data: topUsers = [] } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const stats = await base44.entities.UserStats.list('-points', 50);
      return stats;
    }
  });

  const { data: currentUserStats } = useQuery({
    queryKey: ['current-user-rank'],
    queryFn: async () => {
      const user = await base44.auth.me().catch(() => null);
      if (!user) return null;
      const stats = await base44.entities.UserStats.filter({ user_email: user.email }, '-created_date', 1);
      return stats[0] || null;
    }
  });

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-stone-500 font-bold">#{rank}</span>;
  };

  const currentUserRank = currentUserStats 
    ? topUsers.findIndex(u => u.user_email === currentUserStats.user_email) + 1 
    : null;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full text-amber-700 text-sm font-medium mb-4">
            <TrendingUp className="w-4 h-4" />
            Community Leaderboard
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-stone-800 mb-4">
            Top Contributors
          </h1>
          <p className="text-stone-600">
            Celebrating our most active heritage explorers
          </p>
        </motion.div>

        {/* Current User Rank */}
        {currentUserStats && currentUserRank && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-purple-100 to-amber-100 rounded-2xl p-6 mb-8 border-2 border-amber-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                  {getRankIcon(currentUserRank)}
                </div>
                <div>
                  <p className="text-sm text-stone-600">Your Rank</p>
                  <p className="text-2xl font-bold text-stone-800">#{currentUserRank}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-amber-600">{currentUserStats.points}</p>
                <p className="text-sm text-stone-600">points</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-stone-200">
          {topUsers.length === 0 ? (
            <div className="py-16 text-center">
              <Trophy className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500">No contributors yet. Be the first!</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-200">
              {topUsers.map((user, idx) => {
                const rank = idx + 1;
                const isCurrentUser = currentUserStats?.user_email === user.user_email;
                
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-6 flex items-center justify-between transition-colors ${
                      isCurrentUser ? 'bg-amber-50' : 'hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-purple-100 flex items-center justify-center">
                        {getRankIcon(rank)}
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium text-stone-800">
                          {user.user_email.split('@')[0]}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs bg-amber-200 text-amber-700 px-2 py-1 rounded-full">
                              You
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-stone-500">
                          <span>{user.contributions_count || 0} contributions</span>
                          <span>{user.reviews_count || 0} reviews</span>
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {user.reputation_score || 50} rep
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-amber-600 flex items-center gap-1">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                        {user.points || 0}
                      </p>
                      {user.badges && user.badges.length > 0 && (
                        <p className="text-xs text-stone-500 mt-1">
                          {user.badges.length} {user.badges.length === 1 ? 'badge' : 'badges'}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Points Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-stone-50 rounded-2xl p-6 border-2 border-stone-200"
        >
          <h3 className="font-semibold text-stone-800 mb-4">How to Earn Points</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-stone-600">+10 pts - Heritage scan</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-stone-600">+15 pts - Text translation</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-stone-600">+25 pts - Community contribution</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-stone-600">+20 pts - Site review with photo</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-stone-600">+5 pts - Ask a question</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-stone-600">+2 pts per helpful vote received</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
