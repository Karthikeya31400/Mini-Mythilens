import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function VoiceAssistant({ content, title }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [selectedGender, setSelectedGender] = useState('female');
  const [availableVoices, setAvailableVoices] = useState([]);

  // Load user settings
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const savedSettings = JSON.parse(localStorage.getItem('mythilens_settings') || '{}');
        if (savedSettings.defaultVoiceLanguage) {
          setSelectedLanguage(savedSettings.defaultVoiceLanguage);
        }
        if (savedSettings.defaultVoiceGender) {
          setSelectedGender(savedSettings.defaultVoiceGender);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadUserSettings();
  }, []);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
    
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      
      loadVoices();
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  const speak = () => {
    if (!isSupported || !content) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    window.speechSynthesis.cancel();

    // Only use English intro for English language, otherwise speak content directly
    let textToSpeak = content;
    if (selectedLanguage.startsWith('en')) {
      const storytellingIntro = `Welcome, traveler of heritage. ${title ? `Let me share the captivating story of ${title}.` : 'Allow me to guide you through this remarkable discovery.'}`;
      textToSpeak = `${storytellingIntro} ... ${content}`;
    }
    
    // Add pauses for better narration
    textToSpeak = textToSpeak
      .replace(/\. /g, '... ')
      .replace(/: /g, '... ')
      .replace(/\n/g, '... ');

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = selectedLanguage;

    // Better voice selection logic
    const languageCode = selectedLanguage.split('-')[0];
    const languageVoices = availableVoices.filter(voice => 
      voice.lang.toLowerCase().includes(languageCode.toLowerCase())
    );
    
    let selectedVoice = null;
    
    // Try to match gender preference
    if (selectedGender === 'male') {
      // Look for male voices
      selectedVoice = languageVoices.find(voice => {
        const name = voice.name.toLowerCase();
        return (name.includes('male') && !name.includes('female')) || 
               name.includes('man') || 
               name.includes('boy');
      });
    } else {
      // Look for female voices
      selectedVoice = languageVoices.find(voice => {
        const name = voice.name.toLowerCase();
        return name.includes('female') || 
               name.includes('woman') || 
               name.includes('girl');
      });
    }
    
    // If no gender-specific voice found, get best quality voice for language
    if (!selectedVoice && languageVoices.length > 0) {
      selectedVoice = languageVoices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Natural') ||
        voice.name.includes('Enhanced') ||
        voice.name.includes('Premium') ||
        voice.localService === false
      ) || languageVoices[0];
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const pause = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsSpeaking(false);
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  if (!isSupported) return null;

  const languages = [
    { value: 'en-US', label: 'English' },
    { value: 'es-ES', label: 'Spanish' },
    { value: 'fr-FR', label: 'French' },
    { value: 'de-DE', label: 'German' },
    { value: 'hi-IN', label: 'Hindi' },
    { value: 'te-IN', label: 'Telugu' },
    { value: 'zh-CN', label: 'Chinese' },
    { value: 'ar-SA', label: 'Arabic' },
    { value: 'pt-BR', label: 'Portuguese' },
    { value: 'ja-JP', label: 'Japanese' },
    { value: 'ko-KR', label: 'Korean' },
    { value: 'it-IT', label: 'Italian' },
    { value: 'ru-RU', label: 'Russian' }
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      {/* Language Selection */}
      <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
        <SelectTrigger className="w-32 h-9 text-xs border-amber-300">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {languages.map(lang => (
            <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Gender Selection */}
      <Select value={selectedGender} onValueChange={setSelectedGender}>
        <SelectTrigger className="w-28 h-9 text-xs border-amber-300">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="female">Female</SelectItem>
          <SelectItem value="male">Male</SelectItem>
        </SelectContent>
      </Select>

      <AnimatePresence mode="wait">
        {!isSpeaking && !isPaused && (
          <motion.div
            key="play"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <Button
              onClick={speak}
              variant="outline"
              size="sm"
              className="gap-2 border-2 border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Volume2 className="w-4 h-4" />
              Listen
            </Button>
          </motion.div>
        )}
        
        {isSpeaking && (
          <motion.div
            key="pause"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex gap-2"
          >
            <Button
              onClick={pause}
              variant="outline"
              size="sm"
              className="gap-2 border-2 border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Pause className="w-4 h-4" />
              Pause
            </Button>
            <Button
              onClick={stop}
              variant="outline"
              size="sm"
              className="gap-2 border-2 border-red-300 text-red-700 hover:bg-red-50"
            >
              <VolumeX className="w-4 h-4" />
              Stop
            </Button>
          </motion.div>
        )}
        
        {isPaused && (
          <motion.div
            key="resume"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex gap-2"
          >
            <Button
              onClick={speak}
              variant="outline"
              size="sm"
              className="gap-2 border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <Play className="w-4 h-4" />
              Resume
            </Button>
            <Button
              onClick={stop}
              variant="outline"
              size="sm"
              className="gap-2 border-2 border-red-300 text-red-700 hover:bg-red-50"
            >
              <VolumeX className="w-4 h-4" />
              Stop
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {isSpeaking && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="flex gap-1"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-4 bg-amber-500 rounded-full"
              animate={{ height: ['16px', '24px', '16px'] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
