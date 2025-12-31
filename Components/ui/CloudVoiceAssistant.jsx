import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Pause, Play, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';

export default function CloudVoiceAssistant({ content, title }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [selectedGender, setSelectedGender] = useState('female');

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

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  const generateAudio = async () => {
    if (!content) return;
    
    setIsGenerating(true);
    
    try {
      // Use LLM to generate audio-optimized narration
      const languageMap = {
        'en-US': 'English',
        'es-ES': 'Spanish',
        'fr-FR': 'French',
        'de-DE': 'German',
        'hi-IN': 'Hindi',
        'te-IN': 'Telugu',
        'zh-CN': 'Chinese',
        'ar-SA': 'Arabic',
        'pt-BR': 'Portuguese',
        'ja-JP': 'Japanese',
        'ko-KR': 'Korean',
        'it-IT': 'Italian',
        'ru-RU': 'Russian'
      };

      const targetLanguage = languageMap[selectedLanguage] || 'English';
      
      const prompt = `Convert this text into a natural, engaging audio narration script in ${targetLanguage}.
${title ? `Title: ${title}` : ''}

Content: ${content}

Create a clear, engaging narration that flows naturally when read aloud. Keep sentences moderate length for natural speech rhythm. Return ONLY the narration text, nothing else.`;

      const narrationText = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
      });

      // Note: Since Base44 doesn't have a built-in TTS integration, 
      // we fall back to browser's speech synthesis with optimized text
      speak(narrationText);
      
    } catch (error) {
      console.error('Audio generation failed:', error);
      alert('Cloud TTS is not available. Using browser speech synthesis instead.');
      speak(content);
    } finally {
      setIsGenerating(false);
    }
  };

  const speak = (text) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis not supported in your browser');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = selectedLanguage;

    const voices = window.speechSynthesis.getVoices();
    const languageCode = selectedLanguage.split('-')[0];
    const languageVoices = voices.filter(voice => 
      voice.lang.toLowerCase().includes(languageCode.toLowerCase())
    );
    
    let selectedVoice = null;
    
    if (selectedGender === 'male') {
      selectedVoice = languageVoices.find(voice => {
        const name = voice.name.toLowerCase();
        return (name.includes('male') && !name.includes('female')) || 
               name.includes('man') || 
               name.includes('boy');
      });
    } else {
      selectedVoice = languageVoices.find(voice => {
        const name = voice.name.toLowerCase();
        return name.includes('female') || 
               name.includes('woman') || 
               name.includes('girl');
      });
    }
    
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
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const pause = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const resume = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

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
        {isGenerating && (
          <motion.div
            key="generating"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <Button variant="outline" size="sm" disabled className="gap-2 border-2 border-amber-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </Button>
          </motion.div>
        )}

        {!isGenerating && !isPlaying && !isPaused && (
          <motion.div
            key="play"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <Button
              onClick={generateAudio}
              variant="outline"
              size="sm"
              className="gap-2 border-2 border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Volume2 className="w-4 h-4" />
              Listen
            </Button>
          </motion.div>
        )}
        
        {isPlaying && (
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
              onClick={resume}
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

      {isPlaying && (
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
