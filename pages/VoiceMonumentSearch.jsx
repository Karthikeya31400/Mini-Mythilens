import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Sparkles, MapPin, History, BookOpen, Info, Save, Check } from 'lucide-react';
import VoiceSearch from '@/components/ui/VoiceSearch';
import VoiceAssistant from '@/components/ui/VoiceAssistant';
import LoadingAnalysis from '@/components/ui/LoadingAnalysis';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function VoiceMonumentSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [monumentInfo, setMonumentInfo] = useState(null);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSearch = async (query) => {
    if (!query || query.trim().length < 3) {
      setError('Please provide a monument name');
      return;
    }

    setSearchQuery(query);
    setIsSearching(true);
    setError(null);
    setMonumentInfo(null);
    setImageUrl(null);
    setSaved(false);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `The user is asking about: "${query}"
        
Identify this monument, temple, or heritage site and provide ONLY verified, accurate information in an engaging storytelling format suitable for audio narration.

Provide:
1. Full name and alternative names
2. Historical significance - when built, by whom, major events (3-4 key points)
3. Mythological context and legends (if applicable, 2-3 stories)
4. Cultural importance and why it matters today (3-4 points)
5. Location details
6. Interesting facts or lesser-known details (2-3 points)

IMPORTANT: Use ONLY verified information. If you're not certain about the monument, clearly state that. Write in a conversational, storytelling tone as if you're a heritage guide speaking to a visitor.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            found: { type: "boolean", description: "Whether the monument was identified" },
            name: { type: "string", description: "Official name of the monument" },
            alternative_names: { type: "string", description: "Other names" },
            history: { type: "string", description: "Historical background in storytelling format" },
            mythology: { type: "string", description: "Mythological significance and legends" },
            cultural_importance: { type: "string", description: "Why this monument matters culturally" },
            location: { type: "string", description: "Location details" },
            interesting_facts: { type: "string", description: "Fascinating lesser-known details" },
            audio_narrative: { type: "string", description: "Complete engaging audio storytelling script combining all the above" }
          }
        }
      });

      if (result.found) {
        setMonumentInfo(result);
        
        // Generate image for the monument
        try {
          const imageResult = await base44.integrations.Core.GenerateImage({
            prompt: `Professional photograph of ${result.name}, heritage monument, architectural detail, ${result.location}, high quality, natural lighting, cultural significance`
          });
          setImageUrl(imageResult.url);
        } catch (imgError) {
          console.error('Failed to generate image:', imgError);
        }
      } else {
        setError('Monument not found in our database. Please try a different name or check the spelling.');
      }
    } catch (err) {
      setError('Failed to search. Please try again.');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualSearch = () => {
    handleSearch(searchQuery);
  };

  const handleSave = async () => {
    if (!monumentInfo) {
      alert('No monument data to save');
      return;
    }
    
    // Check if user is authenticated
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) {
      const shouldLogin = confirm('You need to log in to save analyses. Would you like to log in now?');
      if (shouldLogin) {
        base44.auth.redirectToLogin(window.location.href);
      }
      return;
    }
    
    setIsSaving(true);
    try {
      const result = await base44.entities.HeritageAnalysis.create({
        image_url: imageUrl || null,
        title: monumentInfo.name || 'Unknown Monument',
        history: monumentInfo.history || 'No history available',
        mythology: monumentInfo.mythology || 'No mythology available',
        cultural_significance: monumentInfo.cultural_importance || 'No information available',
        architecture: monumentInfo.interesting_facts || 'No details available',
        rules_and_guidelines: '',
        location_name: monumentInfo.location || 'Unknown location',
        latitude: null,
        longitude: null
      });
      
      if (result) {
        setSaved(true);
        alert('✅ Successfully saved to your history!');
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert(`❌ Save failed: ${error.message || 'Please try again'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-100 to-rose-100 px-6 py-3 rounded-full mb-6">
            <Mic className="w-5 h-5 text-amber-700" />
            <span className="text-amber-700 font-medium">Voice Monument Search</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-stone-800 mb-4">
            Speak & Discover
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto">
            Simply speak the name of any monument, temple, or heritage site to hear its fascinating story through engaging audio narration.
          </p>
        </motion.div>

        {/* Search Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <div className="space-y-6">
            {/* Voice Search */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-3">
                🎤 Voice Search
              </label>
              <VoiceSearch onSearch={handleSearch} />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-stone-500">or type manually</span>
              </div>
            </div>

            {/* Manual Input */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-3">
                ⌨️ Text Search
              </label>
              <div className="flex gap-3">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                  placeholder="e.g., Taj Mahal, Angkor Wat, Machu Picchu..."
                  className="flex-1"
                />
                <Button
                  onClick={handleManualSearch}
                  disabled={isSearching}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Search
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm"
            >
              {error}
            </motion.div>
          )}
        </motion.div>

        {/* Loading State */}
        {isSearching && (
          <LoadingAnalysis message="Searching heritage database..." />
        )}

        {/* Results */}
        <AnimatePresence>
          {monumentInfo && !isSearching && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Monument Image */}
              {imageUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl overflow-hidden shadow-lg mb-6"
                >
                  <img src={imageUrl} alt={monumentInfo.name} className="w-full h-64 object-cover" />
                </motion.div>
              )}

              {/* Monument Header */}
              <div className="bg-gradient-to-br from-amber-50 to-rose-50 rounded-2xl shadow-lg p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-16 h-16 bg-gradient-to-br from-amber-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-3xl font-display font-bold text-stone-800 mb-2">
                  {monumentInfo.name}
                </h2>
                {monumentInfo.alternative_names && (
                  <p className="text-stone-600 text-sm mb-4">
                    Also known as: {monumentInfo.alternative_names}
                  </p>
                )}
                {monumentInfo.location && (
                  <p className="text-stone-600 flex items-center justify-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {monumentInfo.location}
                  </p>
                )}

                {/* Audio Storytelling */}
                <div className="mt-6">
                  <VoiceAssistant 
                    content={monumentInfo.audio_narrative || 
                      `${monumentInfo.history} ${monumentInfo.mythology} ${monumentInfo.cultural_importance}`}
                    title={monumentInfo.name}
                  />
                </div>
              </div>

              {/* Details Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                {monumentInfo.history && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border-2 border-amber-200"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <History className="w-5 h-5 text-amber-700" />
                      </div>
                      <h3 className="text-lg font-semibold text-stone-800">Historical Background</h3>
                    </div>
                    <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">
                      {monumentInfo.history}
                    </p>
                  </motion.div>
                )}

                {monumentInfo.mythology && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border-2 border-rose-200"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-rose-100 rounded-lg">
                        <BookOpen className="w-5 h-5 text-rose-700" />
                      </div>
                      <h3 className="text-lg font-semibold text-stone-800">Mythology & Legends</h3>
                    </div>
                    <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">
                      {monumentInfo.mythology}
                    </p>
                  </motion.div>
                )}

                {monumentInfo.cultural_importance && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border-2 border-emerald-200"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Sparkles className="w-5 h-5 text-emerald-700" />
                      </div>
                      <h3 className="text-lg font-semibold text-stone-800">Cultural Importance</h3>
                    </div>
                    <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">
                      {monumentInfo.cultural_importance}
                    </p>
                  </motion.div>
                )}

                {monumentInfo.interesting_facts && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border-2 border-indigo-200"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Info className="w-5 h-5 text-indigo-700" />
                      </div>
                      <h3 className="text-lg font-semibold text-stone-800">Fascinating Facts</h3>
                    </div>
                    <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">
                      {monumentInfo.interesting_facts}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Save Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex justify-center mt-8"
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
                      : 'bg-stone-800 hover:bg-stone-900 text-white'
                    }
                  `}
                >
                  {saved ? (
                    <>
                      <Check className="w-5 h-5" />
                      Saved to History
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {isSaving ? 'Saving...' : 'Save to History'}
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Examples */}
        {!monumentInfo && !isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h3 className="text-lg font-semibold text-stone-800 mb-4 text-center">
              Try searching for these famous monuments
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'Taj Mahal',
                'Angkor Wat',
                'Machu Picchu',
                'Colosseum',
                'Great Wall of China',
                'Petra'
              ].map((monument) => (
                <button
                  key={monument}
                  onClick={() => handleSearch(monument)}
                  className="p-3 border-2 border-stone-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-all text-stone-700 text-sm font-medium"
                >
                  {monument}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
