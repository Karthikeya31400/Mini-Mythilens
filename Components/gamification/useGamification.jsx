import { base44 } from '@/api/base44Client';

export function useGamification() {
  const awardPoints = async (action, points) => {
    try {
      const isAuthenticated = await base44.auth.isAuthenticated();
      if (!isAuthenticated) return;

      const user = await base44.auth.me();
      const currentPoints = user.gamification_points || 0;
      
      await base44.auth.updateMe({
        gamification_points: currentPoints + points
      });
    } catch (error) {
      console.error('Failed to award points:', error);
    }
  };

  return { awardPoints };
}
