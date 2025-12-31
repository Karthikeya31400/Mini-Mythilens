import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, MapPin, BookOpen, Star, Loader2, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import PathCard from '@/components/heritage-paths/PathCard';

export default function ForYou() {
  const [recommendations, setRecommendations] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPaths, setIsGeneratingPaths] = useState(false);
  const queryClient = useQueryClient();

  const { data: userSites = [] } = useQuery({
    queryKey: ['user-heritage-sites'],
    queryFn: async () => {
      const user = await base44.auth.me().catch(() => null);
      if (!user) return [];
      return base44.entities.HeritageAnalysis.filter({ created_by: user.email }, '-created_date', 50);
    }
  });

  const { data: userTranslations = [] } = useQuery({
    queryKey: ['user-translations'],
    queryFn: async () => {
      const user = await base44.auth.me().catch(() => null);
      if (!user) return [];
      return base44.entities.TextTranslation.filter({ created_by: user.email }, '-created_date', 50);
    }
  });

  const { data: userContributions = [] } = useQuery({
    queryKey: ['user-contributions'],
    queryFn: async () => {
      const user = await base44.auth.me().catch(() => null);
      if (!user) return [];
      return base44.entities.CommunityContribution.filter({ submitter_email: user.email }, '-created_date', 50);
    }
  });

  const { data: userStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const user = await base44.auth.me().catch(() => null);
      if (!user) return null;
      const stats = await base44.entities.UserStats.filter({ user_email: user.email }, '-created_date', 1);
      return stats[0] || null;
    }
  });

  const { data: heritagePaths = [] } = useQuery({
    queryKey: ['heritage-paths'],
    queryFn: () => base44.entities.HeritagePath.list('-created_date', 20)
  });

  const { data: pathProgresses = [] } = useQuery({
    queryKey: ['path-progresses'],
    queryFn: async () => {
      const user = await base44.auth.me().catch(() => null);
      if (!user) return [];
      return base44.entities.PathProgress.filter({ user_email: user.email }, '-created_date', 50);
    }
  });

  const generateHeritagePaths = async () => {
    setIsGeneratingPaths(true);

    try {
      const interests = userStats?.onboarding_interests || [];
      const sitesContext = userSites.slice(0, 10).map(s => s.title);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3 personalized heritage learning paths for a user with these interests: ${interests.join(', ')}.
They've explored: ${sitesContext.join(', ')}.

For each path, create:
1. A compelling title
2. A description of the learning journey
3. Theme (architecture, mythology, ancient_civilizations, religious_heritage, cultural_traditions, or historical_periods)
4. Difficulty level (beginner, intermediate, advanced)
5. 5-7 sequential steps, each with:
   - A real heritage site name and location (with exact GPS coordinates)
   - Educational content (2-3 paragraphs)
   - A quiz question with 4 multiple choice options
6. A unique badge name to award upon completion
7. Estimated duration

Make paths educational, engaging, and tailored to their interests. Include diverse global sites.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            paths: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  theme: { type: "string" },
                  difficulty_level: { type: "string" },
                  estimated_duration: { type: "string" },
                  completion_badge: { type: "string" },
                  steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        order: { type: "number" },
                        site_name: { type: "string" },
                        site_location: { type: "string" },
                        latitude: { type: "number" },
                        longitude: { type: "number" },
                        content: { type: "string" },
                        quiz: {
                          type: "object",
                          properties: {
                            question: { type: "string" },
                            options: {
                              type: "array",
                              items: { type: "string" }
                            },
                            correct_answer: { type: "number" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Generate images for each step
      for (const path of result.paths) {
        for (const step of path.steps) {
          try {
            const imageResult = await base44.integrations.Core.GenerateImage({
              prompt: `Professional photograph of ${step.site_name}, ${step.site_location}, heritage site, architectural detail, high quality, natural lighting`
            });
            step.image_url = imageResult.url;
          } catch (error) {
            console.error('Failed to generate image for step:', error);
            step.image_url = null;
          }
        }

        // Create the path
        await base44.entities.HeritagePath.create({
          title: path.title,
          description: path.description,
          theme: path.theme,
          difficulty_level: path.difficulty_level,
          estimated_duration: path.estimated_duration,
          completion_badge: path.completion_badge,
          total_steps: path.steps.length,
          steps: path.steps,
          is_ai_generated: true
        });
      }

      queryClient.invalidateQueries(['heritage-paths']);
      alert('✅ Learning paths generated successfully!');
    } catch (error) {
      alert('Failed to generate paths: ' + error.message);
    } finally {
      setIsGeneratingPaths(false);
    }
  };

  const generateRecommendations = async () => {
    setIsGenerating(true);
    
    try {
      const interests = userStats?.onboarding_interests || [];
      const sitesContext = userSites.slice(0, 10).map(s => ({
        title: s.title,
        type: s.architecture,
        mythology: s.mythology
      }));
      const translationsContext = userTranslations.slice(0, 5).map(t => ({
        text: t.original_text,
        meaning: t.cultural_meaning
      }));
      const contributionsContext = userContributions.slice(0, 5).map(c => ({
        type: c.type,
        title: c.title
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a personalized heritage recommendation engine. Analyze this user's interaction history and create highly personalized recommendations.

User Profile:
- Onboarding Interests: ${interests.join(', ') || 'Not specified'}
- Saved Heritage Sites (${userSites.length}): ${JSON.stringify(sitesContext)}
- Text Translations (${userTranslations.length}): ${JSON.stringify(translationsContext)}
- Community Contributions (${userContributions.length}): ${JSON.stringify(contributionsContext)}

Based on this deep analysis, recommend:

1. **Similar Sites to Explore** (5-7 sites):
   - Sites architecturally/culturally similar to their saved sites
   - Consider mythology connections, architectural styles, historical periods
   - Provide real heritage sites with exact GPS coordinates

2. **Interesting Facts** (3-5 facts):
   - Historical facts related to their interests
   - Surprising connections between sites they've explored
   - Lesser-known stories about familiar monuments

3. **Suggested Learning Paths** (2-3 paths):
   - Themed exploration journeys (e.g., "Explore Mughal Architecture", "Mythology Tour")
   - Based on gaps in their knowledge or underexplored themes

4. **Trending in Your Interests** (3-4 items):
   - Popular sites/topics among users with similar interests
   - Seasonal or culturally relevant recommendations

Make recommendations specific, actionable, and deeply personalized. Use their actual interaction data.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            similar_sites: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  location: { type: "string" },
                  reason: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                  match_score: { type: "number" }
                }
              }
            },
            interesting_facts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  fact: { type: "string" },
                  related_to: { type: "string" }
                }
              }
            },
            learning_paths: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  sites: { type: "array", items: { type: "string" } }
                }
              }
            },
            trending: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" }
                }
              }
            }
          }
        }
      });

      setRecommendations(result);
    } catch (error) {
      alert('Failed to generate recommendations: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Personalized For You
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-stone-800 mb-4">
            Your Heritage Journey
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Discover sites, facts, and stories tailored to your interests based on your exploration history.
          </p>
        </motion.div>

        {/* User Activity Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border-2 border-stone-200 text-center">
            <p className="text-3xl font-bold text-amber-600">{userSites.length}</p>
            <p className="text-sm text-stone-600">Sites Explored</p>
          </div>
          <div className="bg-white p-4 rounded-xl border-2 border-stone-200 text-center">
            <p className="text-3xl font-bold text-rose-600">{userTranslations.length}</p>
            <p className="text-sm text-stone-600">Texts Translated</p>
          </div>
          <div className="bg-white p-4 rounded-xl border-2 border-stone-200 text-center">
            <p className="text-3xl font-bold text-indigo-600">{userContributions.length}</p>
            <p className="text-sm text-stone-600">Contributions</p>
          </div>
          <div className="bg-white p-4 rounded-xl border-2 border-stone-200 text-center">
            <p className="text-3xl font-bold text-emerald-600">{userStats?.points || 0}</p>
            <p className="text-sm text-stone-600">Points Earned</p>
          </div>
        </div>

        {/* Heritage Paths Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-stone-800 flex items-center gap-2">
                <Compass className="w-7 h-7 text-purple-600" />
                Heritage Learning Paths
              </h2>
              <p className="text-stone-600 mt-1">Curated journeys with quizzes and challenges</p>
            </div>
            {heritagePaths.length === 0 && (
              <Button
                onClick={generateHeritagePaths}
                disabled={isGeneratingPaths}
                className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
              >
                {isGeneratingPaths ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Paths
                  </>
                )}
              </Button>
            )}
          </div>

          {heritagePaths.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-dashed border-stone-300">
              <Compass className="w-12 h-12 text-stone-400 mx-auto mb-3" />
              <p className="text-stone-600">No learning paths yet. Generate personalized paths based on your interests!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {heritagePaths.map((path) => {
                const progress = pathProgresses.find(p => p.path_id === path.id);
                return (
                  <PathCard
                    key={path.id}
                    path={path}
                    progress={progress}
                    onStart={() => window.location.href = `${createPageUrl('PathJourney')}?id=${path.id}`}
                    onContinue={() => window.location.href = `${createPageUrl('PathJourney')}?id=${path.id}`}
                  />
                );
              })}
            </div>
          )}
        </div>

        {!recommendations ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-stone-800 mb-4">
              Get Personalized Recommendations
            </h3>
            <p className="text-stone-600 mb-8 max-w-md mx-auto">
              Our AI will analyze your exploration history to suggest sites, facts, and learning paths tailored just for you.
            </p>
            <Button
              onClick={generateRecommendations}
              disabled={isGenerating}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2 px-8 py-6 text-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Your Journey...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate My Recommendations
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Similar Sites */}
            {recommendations.similar_sites?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                  Sites You'll Love
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {recommendations.similar_sites.map((site, idx) => (
                    <Link
                      key={idx}
                      to={`${createPageUrl('SiteDetails')}?name=${encodeURIComponent(site.name)}&lat=${site.latitude}&lng=${site.longitude}&type=heritage`}
                      className="p-4 border-2 border-stone-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-stone-800">{site.name}</h4>
                        <div className="flex items-center gap-1 bg-purple-100 px-2 py-1 rounded-full">
                          <Star className="w-3 h-3 text-purple-600 fill-purple-600" />
                          <span className="text-xs text-purple-700">{Math.round(site.match_score * 100)}%</span>
                        </div>
                      </div>
                      <p className="text-sm text-stone-600 mb-2">{site.reason}</p>
                      <p className="text-xs text-stone-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {site.location}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Interesting Facts */}
            {recommendations.interesting_facts?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-amber-600" />
                  Did You Know?
                </h3>
                <div className="space-y-4">
                  {recommendations.interesting_facts.map((fact, idx) => (
                    <div key={idx} className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                      <h4 className="font-semibold text-amber-700 mb-2">{fact.title}</h4>
                      <p className="text-sm text-stone-600 mb-2">{fact.fact}</p>
                      <p className="text-xs text-amber-600">Related to: {fact.related_to}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Paths */}
            {recommendations.learning_paths?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                  Suggested Learning Paths
                </h3>
                <div className="space-y-4">
                  {recommendations.learning_paths.map((path, idx) => (
                    <div key={idx} className="p-4 border-2 border-indigo-200 rounded-xl bg-indigo-50">
                      <h4 className="font-semibold text-indigo-700 mb-2">{path.title}</h4>
                      <p className="text-sm text-stone-600 mb-3">{path.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {path.sites.map((site, i) => (
                          <span key={i} className="text-xs bg-white px-3 py-1 rounded-full text-stone-600 border border-indigo-200">
                            {site}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending */}
            {recommendations.trending?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                  Trending in Your Interests
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {recommendations.trending.map((item, idx) => (
                    <div key={idx} className="p-4 border-2 border-emerald-200 rounded-xl bg-emerald-50">
                      <span className="text-xs bg-emerald-100 px-2 py-1 rounded-full text-emerald-700 mb-2 inline-block">
                        {item.category}
                      </span>
                      <h4 className="font-semibold text-stone-800 mb-1">{item.title}</h4>
                      <p className="text-sm text-stone-600">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <Button
                onClick={generateRecommendations}
                variant="outline"
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Refresh Recommendations
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
