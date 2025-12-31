import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Compass, 
  History as HistoryIcon, 
  BookOpen, 
  Landmark, 
  Palette,
  Save,
  Check,
  MapPin,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageUploader from '@/components/ui/ImageUploader';
import AnalysisCard from '@/components/ui/AnalysisCard';
import LoadingAnalysis from '@/components/ui/LoadingAnalysis';
import VoiceAssistant from '@/components/ui/VoiceAssistant';
import HeritageMap from '@/components/map/HeritageMap';
import { useGamification } from '@/components/gamification/useGamification';

export default function HeritageScanner() {
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const { awardPoints } = useGamification();

  const handleImageSelect = (file) => {
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setAnalysis(null);
    setSaved(false);
  };

  const handleClear = () => {
    setPreview(null);
    setImageFile(null);
    setAnalysis(null);
    setSaved(false);
    setUploadedUrl(null);
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;

    setIsUploading(true);
    
    // Upload image
    const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
    setUploadedUrl(file_url);
    setIsUploading(false);
    setIsAnalyzing(true);

    // Analyze with Gemini
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this heritage monument image in a student-friendly format:

1. Title: Identify the monument name
2. History: Provide 4-6 bullet points covering when it was built, by whom, and historical background
3. Mythology: Provide 3-5 bullet points about mythological stories, legends, and religious significance
4. Cultural Significance: Provide 5-7 bullet points explaining why this monument is culturally important, its role in society, its influence, what it represents, and why people should care about it today
5. Architecture: Brief description of architectural style and unique features (can be a paragraph)
6. Location: Provide the location name and coordinates
7. Rules & Guidelines: Provide official rules, entry requirements, dress code, photography restrictions, cultural etiquette, and do's and don'ts for visiting this site

Keep all points concise, clear, and engaging for students.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Name or title of the monument" },
          history_points: { 
            type: "array", 
            items: { type: "string" },
            description: "4-6 bullet points about historical background" 
          },
          mythology_points: { 
            type: "array", 
            items: { type: "string" },
            description: "3-5 bullet points about mythology and legends" 
          },
          cultural_significance_points: { 
            type: "array", 
            items: { type: "string" },
            description: "5-7 detailed bullet points explaining why this monument is important culturally" 
          },
          architecture: { type: "string", description: "Architectural description" },
          rules_and_guidelines: { type: "string", description: "Official rules, dress code, photography restrictions, and cultural etiquette" },
          location_name: { type: "string", description: "Location name" },
          latitude: { type: "number", description: "Latitude coordinate" },
          longitude: { type: "number", description: "Longitude coordinate" }
        }
      }
    });

    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleSave = async () => {
    if (!analysis || !uploadedUrl) {
      alert('No analysis data to save');
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
        image_url: uploadedUrl,
        title: analysis.title || 'Unknown Site',
        history: analysis.history_points?.join('\n• ') || analysis.history || 'No history available',
        mythology: analysis.mythology_points?.join('\n• ') || analysis.mythology || 'No mythology available',
        cultural_significance: analysis.cultural_significance_points?.join('\n• ') || analysis.cultural_significance || 'No information available',
        architecture: analysis.architecture || 'No architecture details',
        rules_and_guidelines: analysis.rules_and_guidelines || 'No guidelines available',
        location_name: analysis.location_name || 'Unknown location',
        latitude: analysis.latitude || null,
        longitude: analysis.longitude || null
      });
      
      if (result) {
        setSaved(true);
        await awardPoints('scan', 10);
        alert('✅ Successfully saved to your history! (+10 points)');
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert(`❌ Save failed: ${error.message || 'Please try again'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full text-amber-700 text-sm font-medium mb-4">
            <Compass className="w-4 h-4" />
            AI Heritage Scanner
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-stone-800 mb-4">
            Discover Heritage Stories
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Upload an image of any heritage monument, temple, or archaeological site 
            to uncover its history, mythology, and cultural significance.
          </p>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-6 md:p-10 border border-stone-200"
        >
          <ImageUploader
            onImageSelect={handleImageSelect}
            isUploading={isUploading}
            preview={preview}
            onClear={handleClear}
          />

          {preview && !analysis && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 flex justify-center"
            >
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || isUploading}
                size="lg"
                className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-amber-200 gap-2"
              >
                <Compass className="w-5 h-5" />
                Analyze Heritage
              </Button>
            </motion.div>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <LoadingAnalysis message="Analyzing heritage monument..." />
          )}

          {/* Analysis Results */}
          {analysis && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-10"
            >
              {/* Title & Voice */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-4 mb-3">
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-stone-800">
                    {analysis.title}
                  </h2>
                </div>
                {analysis.location_name && (
                  <p className="text-stone-500 flex items-center justify-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {analysis.location_name}
                  </p>
                )}
                <div className="mt-4 flex justify-center">
                  <VoiceAssistant 
                    content={`History: ${analysis.history_points?.join('. ')}. Mythology: ${analysis.mythology_points?.join('. ')}. Cultural Significance: ${analysis.cultural_significance_points?.join('. ')}. Architecture: ${analysis.architecture}`}
                    title={analysis.title}
                  />
                </div>
              </div>

              {/* Result Cards */}
              <div className="grid gap-6">
                <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-amber-100 shrink-0">
                      <HistoryIcon className="w-6 h-6 text-amber-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-amber-700 mb-3">History</h3>
                      <ul className="space-y-2">
                        {analysis.history_points?.map((point, idx) => (
                          <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + idx * 0.1 }}
                            className="flex items-start gap-2 text-stone-600"
                          >
                            <span className="text-amber-500 mt-1">•</span>
                            <span>{point}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-rose-100 shrink-0">
                      <BookOpen className="w-6 h-6 text-rose-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-rose-700 mb-3">Mythology</h3>
                      <ul className="space-y-2">
                        {analysis.mythology_points?.map((point, idx) => (
                          <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + idx * 0.1 }}
                            className="flex items-start gap-2 text-stone-600"
                          >
                            <span className="text-rose-500 mt-1">•</span>
                            <span>{point}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-emerald-100 shrink-0">
                      <Landmark className="w-6 h-6 text-emerald-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-emerald-700 mb-3">Cultural Significance</h3>
                      <ul className="space-y-2">
                        {analysis.cultural_significance_points?.map((point, idx) => (
                          <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + idx * 0.1 }}
                            className="flex items-start gap-2 text-stone-600"
                          >
                            <span className="text-emerald-500 mt-1">•</span>
                            <span>{point}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <AnalysisCard
                  icon={Palette}
                  title="Architecture"
                  content={analysis.architecture}
                  color="indigo"
                  delay={0.4}
                />

                {analysis.rules_and_guidelines && (
                  <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-orange-100 shrink-0">
                        <ShieldAlert className="w-6 h-6 text-orange-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-orange-700 mb-3">Rules & Guidelines</h3>
                        <p className="text-stone-600 whitespace-pre-wrap">{analysis.rules_and_guidelines}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Map */}
              {analysis.latitude && analysis.longitude && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8"
                >
                  <h3 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-600" />
                    Location
                  </h3>
                  <HeritageMap 
                    sites={[{
                      id: 'current',
                      title: analysis.title,
                      latitude: analysis.latitude,
                      longitude: analysis.longitude,
                      location_name: analysis.location_name,
                      history: analysis.history,
                      image_url: uploadedUrl
                    }]} 
                    height="300px"
                    zoom={8}
                  />
                </motion.div>
              )}

              {/* Save Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 flex justify-center"
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
                      {isSaving ? 'Saving...' : 'Save Analysis'}
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>

        {/* Example Images */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-16"
        >
          <h3 className="text-center text-stone-500 text-sm font-medium mb-6">
            Try with these example monuments
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400',
              'https://images.unsplash.com/photo-1548013146-72479768bada?w=400',
              'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400'
            ].map((src, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                <img src={src} alt={`Example ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
