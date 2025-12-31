import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Languages, Mic, Trash2, Save, Check, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useRestartTour } from '@/components/onboarding/OnboardingTour';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    defaultTargetLanguage: 'english',
    defaultVoiceLanguage: 'en-US',
    defaultVoiceGender: 'female',
    offlineMode: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState(null);
  const restartTour = useRestartTour();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Load from user settings or localStorage
      const savedSettings = currentUser.settings || JSON.parse(localStorage.getItem('mythilens_settings') || '{}');
      setSettings(prev => ({...prev, ...savedSettings}));
    } catch (error) {
      // Load from localStorage if user not authenticated
      const savedSettings = JSON.parse(localStorage.getItem('mythilens_settings') || '{}');
      setSettings(prev => ({...prev, ...savedSettings}));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    
    try {
      // Save to localStorage
      localStorage.setItem('mythilens_settings', JSON.stringify(settings));
      
      // Save to user entity if authenticated
      if (user) {
        await base44.auth.updateMe({ settings });
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const targetLanguages = [
    { value: 'english', label: 'English' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'french', label: 'French' },
    { value: 'german', label: 'German' },
    { value: 'hindi', label: 'Hindi' },
    { value: 'telugu', label: 'Telugu' },
    { value: 'mandarin', label: 'Mandarin Chinese' },
    { value: 'arabic', label: 'Arabic' },
    { value: 'portuguese', label: 'Portuguese' },
    { value: 'japanese', label: 'Japanese' },
    { value: 'korean', label: 'Korean' }
  ];

  const voiceLanguages = [
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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-4">
            <SettingsIcon className="w-4 h-4" />
            User Preferences
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-stone-800 mb-4">
            Settings
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Customize your MythiLens experience with your preferred languages and audio settings
          </p>
        </motion.div>

        {/* Settings Cards */}
        <div className="space-y-6">
          {/* Translation Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-2 border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="w-5 h-5 text-amber-600" />
                  Translation Preferences
                </CardTitle>
                <CardDescription>
                  Set your default language for translating ancient texts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-stone-700 mb-2 block">
                      Default Target Language
                    </Label>
                    <Select 
                      value={settings.defaultTargetLanguage} 
                      onValueChange={(value) => setSettings({...settings, defaultTargetLanguage: value})}
                    >
                      <SelectTrigger className="h-12 border-2 border-stone-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {targetLanguages.map(lang => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Voice Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-rose-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-rose-600" />
                  Audio Narration Preferences
                </CardTitle>
                <CardDescription>
                  Choose your preferred voice language and gender for audio storytelling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-stone-700 mb-2 block">
                      Voice Language
                    </Label>
                    <Select 
                      value={settings.defaultVoiceLanguage} 
                      onValueChange={(value) => setSettings({...settings, defaultVoiceLanguage: value})}
                    >
                      <SelectTrigger className="h-12 border-2 border-stone-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {voiceLanguages.map(lang => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-stone-700 mb-2 block">
                      Voice Gender
                    </Label>
                    <Select 
                      value={settings.defaultVoiceGender} 
                      onValueChange={(value) => setSettings({...settings, defaultVoiceGender: value})}
                    >
                      <SelectTrigger className="h-12 border-2 border-stone-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Offline Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-2 border-emerald-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-emerald-600" />
                  Offline Mode
                </CardTitle>
                <CardDescription>
                  Enable offline access to your saved heritage discoveries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-stone-700">
                      Cache saved data for offline access
                    </Label>
                    <p className="text-sm text-stone-500">
                      Your saved analyses will be available without internet
                    </p>
                  </div>
                  <Switch
                    checked={settings.offlineMode}
                    onCheckedChange={(checked) => setSettings({...settings, offlineMode: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Onboarding Tour */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-2 border-indigo-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-indigo-600" />
                  Onboarding Tour
                </CardTitle>
                <CardDescription>
                  Revisit the app introduction and feature walkthrough
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-stone-600 mb-4">
                  Want to see the tour again? Restart it to learn about all features.
                </p>
                <Button
                  onClick={restartTour}
                  variant="outline"
                  className="w-full border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                >
                  <Compass className="w-4 h-4 mr-2" />
                  Restart Tour
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center pt-4"
          >
            <Button
              onClick={handleSave}
              disabled={isSaving || saved}
              size="lg"
              variant={saved ? "outline" : "default"}
              className={`
                px-8 py-6 text-lg rounded-xl gap-2
                ${saved 
                  ? 'border-2 border-emerald-500 text-emerald-600' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }
              `}
            >
              {saved ? (
                <>
                  <Check className="w-5 h-5" />
                  Settings Saved
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </>
              )}
            </Button>
          </motion.div>
        </div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-blue-50 rounded-2xl p-6 border border-blue-100"
        >
          <h3 className="font-medium text-blue-800 mb-2">Note:</h3>
          <p className="text-blue-700 text-sm">
            Your settings are automatically applied across all features. Voice settings will be used by default in Heritage Scanner and Voice Monument Search.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
