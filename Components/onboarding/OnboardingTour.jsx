import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const tourSteps = [
  {
    id: 'welcome',
    title: 'Welcome to MythiLens! ✨',
    description: 'Let\'s take a quick tour to discover how you can explore ancient heritage with AI.',
    page: 'Home',
    highlightSelector: null,
    position: 'center'
  },
  {
    id: 'discover-nearby',
    title: 'Discover Nearby Heritage',
    description: 'Find heritage sites near you! Enable location services to see monuments, temples, and historical sites in your area. AI will recommend sites based on your interests.',
    page: 'DiscoverNearby',
    highlightSelector: '.discover-nearby-container',
    position: 'center'
  },
  {
    id: 'heritage-scanner',
    title: 'AI Heritage Scanner',
    description: 'Upload a photo of any monument to instantly learn its history, mythology, cultural significance, and architecture. Perfect for travelers and history enthusiasts!',
    page: 'HeritageScanner',
    highlightSelector: '.upload-section',
    position: 'bottom'
  },
  {
    id: 'voice-search',
    title: 'Voice Monument Search',
    description: 'Simply speak the name of any monument or heritage site, and our AI will provide detailed information with images and narrated stories.',
    page: 'VoiceMonumentSearch',
    highlightSelector: '.voice-search-container',
    position: 'center'
  },
  {
    id: 'text-translator',
    title: 'Ancient Text Translator',
    description: 'Upload images of ancient inscriptions or manually enter text to get translations, cultural meanings, and historical context in your preferred language.',
    page: 'TextTranslator',
    highlightSelector: '.translator-container',
    position: 'center'
  },
  {
    id: 'site-details',
    title: 'Explore Site Details',
    description: 'When you discover a site, click on it to see comprehensive information including rules, guidelines, and location maps. You can save sites to your history for later.',
    page: 'Home',
    highlightSelector: null,
    position: 'center'
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    description: 'Start exploring heritage sites around you! You can restart this tour anytime from Settings.',
    page: 'Home',
    highlightSelector: null,
    position: 'center'
  }
];

export default function OnboardingTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('mythilens_tour_completed');
    if (!hasSeenTour) {
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      // Navigate to the appropriate page
      const step = tourSteps[nextStep];
      if (step.page && step.page !== 'Home') {
        navigate(createPageUrl(step.page));
      }
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      
      const step = tourSteps[prevStep];
      if (step.page && step.page !== 'Home') {
        navigate(createPageUrl(step.page));
      }
    }
  };

  const handleSkip = () => {
    localStorage.setItem('mythilens_tour_completed', 'true');
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('mythilens_tour_completed', 'true');
    setIsVisible(false);
    if (onComplete) onComplete();
    navigate(createPageUrl('Home'));
  };

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
        >
          {/* Progress Bar */}
          <div className="h-2 bg-stone-200">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-stone-800">
                    {step.title}
                  </h2>
                  <p className="text-sm text-stone-500">
                    Step {currentStep + 1} of {tourSteps.length}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-stone-600 text-lg leading-relaxed mb-8">
              {step.description}
            </p>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                variant="outline"
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex gap-1.5">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep
                        ? 'bg-amber-500'
                        : index < currentStep
                        ? 'bg-amber-300'
                        : 'bg-stone-300'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={handleNext}
                className="bg-amber-500 hover:bg-amber-600 gap-2"
              >
                {currentStep === tourSteps.length - 1 ? 'Get Started' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {currentStep === 0 && (
              <button
                onClick={handleSkip}
                className="w-full mt-4 text-center text-sm text-stone-400 hover:text-stone-600"
              >
                Skip tour
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook to restart tour from settings
export function useRestartTour() {
  const restart = () => {
    localStorage.removeItem('mythilens_tour_completed');
    window.location.reload();
  };
  
  return restart;
}
