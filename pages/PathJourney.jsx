import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Award, CheckCircle, XCircle, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import VoiceAssistant from '@/components/ui/VoiceAssistant';
import { useGamification } from '@/components/gamification/useGamification';
import confetti from 'canvas-confetti';

export default function PathJourney() {
  const urlParams = new URLSearchParams(window.location.search);
  const pathId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { awardPoints } = useGamification();

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const { data: path, isLoading: pathLoading } = useQuery({
    queryKey: ['heritage-path', pathId],
    queryFn: async () => {
      const paths = await base44.entities.HeritagePath.filter({ id: pathId }, '-created_date', 1);
      return paths[0];
    },
    enabled: !!pathId
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['path-progress', pathId],
    queryFn: async () => {
      const user = await base44.auth.me();
      const prog = await base44.entities.PathProgress.filter({
        path_id: pathId,
        user_email: user.email
      }, '-created_date', 1);
      return prog[0] || null;
    },
    enabled: !!pathId
  });

  const createProgressMutation = useMutation({
    mutationFn: async (data) => base44.entities.PathProgress.create(data),
    onSuccess: () => queryClient.invalidateQueries(['path-progress', pathId])
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, data }) => base44.entities.PathProgress.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['path-progress', pathId])
  });

  const currentStepIndex = progress?.current_step || 0;
  const currentStep = path?.steps?.[currentStepIndex];

  useEffect(() => {
    if (path && !progress) {
      initializeProgress();
    }
  }, [path, progress]);

  const initializeProgress = async () => {
    const user = await base44.auth.me();
    await createProgressMutation.mutateAsync({
      path_id: pathId,
      user_email: user.email,
      current_step: 0,
      completed_steps: [],
      quiz_scores: [],
      completed: false
    });
  };

  const handleQuizSubmit = async () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentStep.quiz.correct_answer;
    setQuizResult(isCorrect);

    const newQuizScores = [
      ...(progress.quiz_scores || []),
      {
        step: currentStepIndex,
        correct: isCorrect,
        answered_at: new Date().toISOString()
      }
    ];

    await updateProgressMutation.mutateAsync({
      id: progress.id,
      data: { quiz_scores: newQuizScores }
    });

    if (isCorrect) {
      await awardPoints('quiz_correct', 10);
    }

    setTimeout(() => {
      if (isCorrect) {
        handleNextStep();
      }
    }, 2000);
  };

  const handleNextStep = async () => {
    const nextStepIndex = currentStepIndex + 1;
    const newCompletedSteps = [...(progress.completed_steps || []), currentStepIndex];
    
    if (nextStepIndex >= path.steps.length) {
      // Path completed
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      await updateProgressMutation.mutateAsync({
        id: progress.id,
        data: {
          current_step: nextStepIndex,
          completed_steps: newCompletedSteps,
          completed: true,
          completion_date: new Date().toISOString()
        }
      });

      // Award badge and points
      await awardPoints('path_completion', 50);
      const user = await base44.auth.me();
      const userStats = await base44.entities.UserStats.filter({ user_email: user.email }, '-created_date', 1);
      if (userStats[0]) {
        await base44.entities.UserStats.update(userStats[0].id, {
          badges: [...(userStats[0].badges || []), path.completion_badge]
        });
      }

      setTimeout(() => {
        navigate(createPageUrl('ForYou'));
      }, 3000);
    } else {
      await updateProgressMutation.mutateAsync({
        id: progress.id,
        data: {
          current_step: nextStepIndex,
          completed_steps: newCompletedSteps
        }
      });

      setSelectedAnswer(null);
      setQuizResult(null);
      setShowQuiz(false);
      await awardPoints('step_completion', 5);
    }
  };

  if (pathLoading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!path) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stone-600">Path not found</p>
      </div>
    );
  }

  const completionPercentage = ((progress?.completed_steps?.length || 0) / path.steps.length) * 100;

  if (progress?.completed) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-3xl p-12 mb-8">
              <Award className="w-20 h-20 mx-auto mb-4" />
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Journey Complete! 🎉
              </h1>
              <p className="text-lg text-purple-100 mb-6">
                You've mastered: {path.title}
              </p>
              <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur px-6 py-3 rounded-full">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">Badge Earned: {path.completion_badge}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <h3 className="text-xl font-semibold text-stone-800 mb-4">Your Journey Stats</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <p className="text-3xl font-bold text-purple-600">{path.steps.length}</p>
                  <p className="text-sm text-stone-600">Sites Explored</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <p className="text-3xl font-bold text-emerald-600">
                    {progress.quiz_scores.filter(q => q.correct).length}/{progress.quiz_scores.length}
                  </p>
                  <p className="text-sm text-stone-600">Quizzes Passed</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <p className="text-3xl font-bold text-amber-600">+50</p>
                  <p className="text-sm text-stone-600">Points Earned</p>
                </div>
              </div>
            </div>

            <Link to={createPageUrl('ForYou')}>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                <ArrowLeft className="w-4 h-4" />
                Explore More Paths
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl('ForYou')} className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Paths
        </Link>

        {/* Progress Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h1 className="font-display text-2xl font-bold text-stone-800 mb-4">{path.title}</h1>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-stone-600">
              Step {currentStepIndex + 1} of {path.steps.length}
            </span>
            <span className="text-purple-600 font-semibold">{Math.round(completionPercentage)}%</span>
          </div>
          <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-600"
            />
          </div>
        </div>

        {/* Current Step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            {currentStep.image_url && (
              <img
                src={currentStep.image_url}
                alt={currentStep.site_name}
                className="w-full h-64 object-cover"
              />
            )}

            <div className="p-8">
              <div className="flex items-center gap-2 text-purple-600 mb-4">
                <MapPin className="w-5 h-5" />
                <span className="font-medium">{currentStep.site_location}</span>
              </div>

              <h2 className="font-display text-2xl font-bold text-stone-800 mb-4">
                {currentStep.site_name}
              </h2>

              <div className="prose max-w-none mb-6">
                <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {currentStep.content}
                </p>
              </div>

              <div className="mb-6">
                <VoiceAssistant content={currentStep.content} title={currentStep.site_name} />
              </div>

              {!showQuiz ? (
                <Button
                  onClick={() => setShowQuiz(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Take Quiz to Continue
                </Button>
              ) : (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200">
                  <h3 className="font-semibold text-stone-800 mb-4">
                    {currentStep.quiz.question}
                  </h3>

                  <div className="space-y-3 mb-6">
                    {currentStep.quiz.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => !quizResult && setSelectedAnswer(idx)}
                        disabled={quizResult !== null}
                        className={`
                          w-full text-left p-4 rounded-xl border-2 transition-all
                          ${selectedAnswer === idx
                            ? quizResult === null
                              ? 'border-purple-500 bg-purple-100'
                              : quizResult
                              ? 'border-emerald-500 bg-emerald-100'
                              : 'border-red-500 bg-red-100'
                            : idx === currentStep.quiz.correct_answer && quizResult === false
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-stone-200 hover:border-purple-300 bg-white'
                          }
                          ${quizResult !== null ? 'cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-stone-800">{option}</span>
                          {selectedAnswer === idx && quizResult !== null && (
                            quizResult ? (
                              <CheckCircle className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )
                          )}
                          {idx === currentStep.quiz.correct_answer && quizResult === false && selectedAnswer !== idx && (
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {quizResult === null ? (
                    <Button
                      onClick={handleQuizSubmit}
                      disabled={selectedAnswer === null}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <div className={`text-center p-4 rounded-xl ${
                      quizResult ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {quizResult ? (
                        <>
                          <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                          <p className="font-semibold">Correct! +10 points</p>
                          <p className="text-sm mt-1">Moving to next step...</p>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-8 h-8 mx-auto mb-2" />
                          <p className="font-semibold">Not quite right</p>
                          <p className="text-sm mt-1">Try again!</p>
                          <Button
                            onClick={() => {
                              setSelectedAnswer(null);
                              setQuizResult(null);
                            }}
                            variant="outline"
                            className="mt-3"
                          >
                            Retry Quiz
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
