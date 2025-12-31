import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function InteractiveOnboarding({ onComplete }) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isWaitingForAction, setIsWaitingForAction] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const utteranceRef = useRef(null);

  // Tour steps with page navigation and voice instructions
  const tourSteps = [
    {
      page: 'Home',
      voiceText: 'Hi traveler! Welcome to Mythi Lens. Let\'s do a small tour on how this app works. I will guide you through our amazing features that make heritage exploration easy and fun.',
      highlightElement: null,
      waitForAction: false,
      nextDelay: 5000
    },
    {
      page: 'HeritageScanner',
      voiceText: 'First, let me show you our Heritage Scanner. This is where the magic begins. Please upload an image of any monument or heritage site.',
      highlightElement: '.image-uploader',
      waitForAction: 'image_upload',
      instruction: 'Upload an image to continue'
    },
    {
      page: 'HeritageScanner',
      voiceText: 'Great! Now watch as our AI analyzes the image. It will provide you with detailed information about the monument\'s history, mythology, cultural significance, and architecture. Notice the voice module button - you can click it to have content read aloud, or click next to continue the tour.',
      highlightElement: '.analysis-result',
      waitForAction: false,
      nextDelay: 6000,
      allowSkipDuringSpeech: true
    },
    {
      page: 'DiscoverNearby',
      voiceText: 'Now let\'s explore heritage sites near you. Click on Get My Location button to find amazing sites around your area.',
      highlightElement: '.location-button',
      waitForAction: 'location_click',
      instruction: 'Click "Get My Location" to continue'
    },
    {
      page: 'DiscoverNearby',
      voiceText: 'Excellent! Here are some heritage sites near you. You can see them on the map with markers. Each site shows its distance from you and you can click on any site to learn more about it. Our AI also provides personalized recommendations based on your interests.',
      highlightElement: '.map-container',
      waitForAction: false,
      nextDelay: 8000
    },
    {
      page: 'TextTranslator',
      voiceText: 'Another powerful feature is our Ancient Text Translator. You can upload images of ancient inscriptions or manually type in ancient texts, and our AI will translate them into modern language with full cultural and historical context.',
      highlightElement: null,
      waitForAction: false,
      nextDelay: 7000
    },
    {
      page: 'Home',
      voiceText: 'That\'s it! You now know how to use Mythi Lens. Explore monuments, discover nearby sites, translate ancient texts, and earn points and badges as you go. Remember, you can always use the voice assistant on any page to listen to content. Happy exploring, traveler!',
      highlightElement: null,
      waitForAction: false,
      nextDelay: 8000,
      isLast: true
    }
  ];

  useEffect(() => {
    const hasCompleted = localStorage.getItem('mythilens_voice_tour_completed');
    if (!hasCompleted) {
      setIsVisible(true);
      setTimeout(() => {
        speakText(tourSteps[0].voiceText);
      }, 1000);
    }
  }, []);

  // Monitor for user actions based on current step
  useEffect(() => {
    if (!isVisible) return;

    const step = tourSteps[currentStep];
    
    // Check if we're on the right page
    const currentPagePath = location.pathname.split('/').pop() || 'Home';
    if (step.page !== currentPagePath) {
      navigate(createPageUrl(step.page));
    }

    // Listen for specific actions
    if (step.waitForAction === 'image_upload') {
      const checkForUpload = setInterval(() => {
        const uploader = document.querySelector('.image-uploader');
        const preview = document.querySelector('img[alt="Preview"]');
        if (preview) {
          clearInterval(checkForUpload);
          setIsWaitingForAction(false);
          setTimeout(() => moveToNextStep(), 2000);
        }
      }, 500);
      return () => clearInterval(checkForUpload);
    }

    if (step.waitForAction === 'location_click') {
      const checkForLocation = setInterval(() => {
        const mapContainer = document.querySelector('.leaflet-container');
        if (mapContainer) {
          clearInterval(checkForLocation);
          setIsWaitingForAction(false);
          setTimeout(() => moveToNextStep(), 2000);
        }
      }, 500);
      return () => clearInterval(checkForLocation);
    }
  }, [currentStep, location, isVisible]);

  const speakText = (text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    // Try to get a good quality voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Natural') ||
      voice.name.includes('Enhanced')
    ) || voices.find(voice => voice.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      const step = tourSteps[currentStep];
      if (step.waitForAction) {
        setIsWaitingForAction(true);
      } else if (!step.isLast) {
        setTimeout(() => moveToNextStep(), step.nextDelay || 3000);
      }
    };
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const moveToNextStep = () => {
    const nextIndex = currentStep + 1;
    if (nextIndex < tourSteps.length) {
      setCurrentStep(nextIndex);
      const nextStep = tourSteps[nextIndex];
      
      // Navigate to next page if different
      const currentPagePath = location.pathname.split('/').pop() || 'Home';
      if (nextStep.page !== currentPagePath) {
        navigate(createPageUrl(nextStep.page));
      }
      
      setTimeout(() => {
        speakText(nextStep.voiceText);
      }, 1000);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    window.speechSynthesis.cancel();
    
    // Award badge and save completion
    try {
      const user = await base44.auth.me().catch(() => null);
      if (user) {
        const existing = await base44.entities.UserStats.filter({ user_email: user.email }, '-created_date', 1);
        if (existing[0]) {
          await base44.entities.UserStats.update(existing[0].id, {
            badges: [...(existing[0].badges || []), 'heritage_explorer_1']
          });
        } else {
          await base44.entities.UserStats.create({
            user_email: user.email,
            points: 100,
            reputation_score: 50,
            badges: ['heritage_explorer_1']
          });
        }
      }
    } catch (error) {
      console.error('Failed to save tour completion:', error);
    }

    localStorage.setItem('mythilens_voice_tour_completed', 'true');
    setIsVisible(false);
    navigate(createPageUrl('Home'));
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    window.speechSynthesis.cancel();
    localStorage.setItem('mythilens_voice_tour_completed', 'true');
    setIsVisible(false);
    navigate(createPageUrl('Home'));
    if (onComplete) onComplete();
  };

  const toggleVoice = () => {
    if (voiceEnabled) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      speakText(tourSteps[currentStep].voiceText);
    }
    setVoiceEnabled(!voiceEnabled);
  };

  if (!isVisible) return null;

  const currentTourStep = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 z-[100] pointer-events-none"
      >
        {/* Highlight overlay for specific elements */}
        {currentTourStep.highlightElement && (
          <div className="absolute inset-0 pointer-events-none">
            <style>{`
              ${currentTourStep.highlightElement} {
                position: relative;
                z-index: 101 !important;
                box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3), 0 0 30px rgba(251, 191, 36, 0.6) !important;
                border-radius: 16px;
                pointer-events: auto !important;
              }
            `}</style>
          </div>
        )}

        {/* Tour Control Panel */}
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 pointer-events-auto z-[102]"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 min-w-[400px] max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-800">Guided Tour</h3>
                  <p className="text-xs text-stone-500">
                    Step {currentStep + 1} of {tourSteps.length}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleVoice}
                  className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
                  title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
                >
                  {voiceEnabled ? (
                    <Volume2 className="w-5 h-5 text-amber-600" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-stone-400" />
                  )}
                </button>
                <button
                  onClick={handleSkip}
                  className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
                  title="Skip tour"
                >
                  <X className="w-5 h-5 text-stone-600" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-amber-500 to-purple-600"
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Voice Text */}
            <div className="bg-gradient-to-r from-amber-50 to-purple-50 rounded-xl p-4 mb-4 border-2 border-amber-200">
              <p className="text-stone-700 leading-relaxed">
                {currentTourStep.voiceText}
              </p>
              {isSpeaking && (
                <div className="flex items-center gap-2 mt-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="flex gap-1"
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 h-3 bg-amber-500 rounded-full"
                        animate={{ height: ['12px', '20px', '12px'] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </motion.div>
                  <span className="text-xs text-amber-600 font-medium">Speaking...</span>
                </div>
              )}
            </div>

            {/* Action Instruction */}
            {isWaitingForAction && currentTourStep.instruction && (
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ repeat: Infinity, duration: 1, repeatType: 'reverse' }}
                className="bg-amber-100 border-2 border-amber-400 rounded-xl p-4 text-center"
              >
                <p className="text-amber-800 font-medium">
                  👉 {currentTourStep.instruction}
                </p>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handleSkip}
                className="text-sm text-stone-500 hover:text-stone-700"
              >
                Skip tour
              </button>
              
              {!isWaitingForAction && (
                <Button
                  onClick={() => {
                    if (isSpeaking) {
                      window.speechSynthesis.cancel();
                      setIsSpeaking(false);
                    }
                    moveToNextStep();
                  }}
                  className="bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-700 hover:to-purple-700 text-white"
                >
                  {currentTourStep.isLast ? 'Complete Tour' : 'Next'}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
