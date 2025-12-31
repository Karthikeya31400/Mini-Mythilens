import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Languages, 
  FileText, 
  History as HistoryIcon,
  Globe,
  Scroll,
  Save,
  Check,
  Type,
  Camera,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ImageUploader from '@/components/ui/ImageUploader';
import AnalysisCard from '@/components/ui/AnalysisCard';
import LoadingAnalysis from '@/components/ui/LoadingAnalysis';
import VoiceAssistant from '@/components/ui/VoiceAssistant';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGamification } from '@/components/gamification/useGamification';

export default function TextTranslator() {
  const [inputType, setInputType] = useState('text');
  const [manualText, setManualText] = useState('');
  const [inputLanguage, setInputLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('english');
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [textFile, setTextFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [translation, setTranslation] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { awardPoints } = useGamification();
  const [uploadedUrl, setUploadedUrl] = useState(null);

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

  const inputLanguages = [
    { value: 'auto', label: 'Auto-detect' },
    { value: 'sanskrit', label: 'Sanskrit' },
    { value: 'latin', label: 'Latin' },
    { value: 'ancient_greek', label: 'Ancient Greek' },
    { value: 'hieroglyphics', label: 'Egyptian Hieroglyphics' },
    { value: 'cuneiform', label: 'Cuneiform' },
    { value: 'aramaic', label: 'Aramaic' },
    { value: 'old_chinese', label: 'Old Chinese' },
    { value: 'runic', label: 'Runic Scripts' }
  ];

  const handleImageSelect = (file) => {
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setTranslation(null);
    setSaved(false);
  };

  const handleClear = () => {
    setPreview(null);
    setImageFile(null);
    setTranslation(null);
    setSaved(false);
    setUploadedUrl(null);
  };

  const handleTranslate = async () => {
    setIsAnalyzing(true);
    setTranslation(null);
    setSaved(false);

    let result;
    const targetLang = targetLanguages.find(l => l.value === targetLanguage)?.label || 'English';
    const languageHint = inputLanguage !== 'auto' ? ` The script/language is likely ${inputLanguage.replace('_', ' ')}.` : '';

    if (inputType === 'image' && imageFile) {
      setIsUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      setUploadedUrl(file_url);
      setIsUploading(false);
      
      result = await base44.integrations.Core.InvokeLLM({
        prompt: `Look at this image of an ancient inscription or text.${languageHint} 

1. Identify and transcribe the exact text you see (state the script/language clearly)
2. Translate it into modern ${targetLang}
3. Provide cultural and historical significance COMBINED in bullet points (4-6 key points total covering both cultural meaning and historical importance)

Format your response to be concise and student-friendly. Use bullet points for easier reading.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            original_text: { type: "string", description: "The original ancient text as transcribed" },
            modern_translation: { type: "string", description: "Modern translation in target language" },
            significance_points: { 
              type: "array", 
              items: { type: "string" },
              description: "4-6 bullet points covering cultural meaning and historical importance combined" 
            }
          }
        }
      });
    } else if (inputType === 'text' && manualText.trim()) {
      result = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate this ancient text${languageHint} into modern ${targetLang}:
"${manualText}"

Provide:
1. The original text
2. Modern ${targetLang} translation
3. Cultural and historical significance COMBINED in bullet points (4-6 key points total)

Format your response to be concise and student-friendly. Use bullet points for easier reading.`,
        response_json_schema: {
          type: "object",
          properties: {
            original_text: { type: "string", description: "The original ancient text" },
            modern_translation: { type: "string", description: "Modern translation in target language" },
            significance_points: { 
              type: "array", 
              items: { type: "string" },
              description: "4-6 bullet points covering cultural meaning and historical importance combined" 
            }
          }
        }
      });
    } else if (inputType === 'file' && textFile) {
      setIsUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: textFile });
      setIsUploading(false);

      // Fetch file content
      const response = await fetch(file_url);
      const fileContent = await response.text();

      result = await base44.integrations.Core.InvokeLLM({
        prompt: `This is content from an uploaded file containing ancient text${languageHint}:

"${fileContent}"

Provide:
1. The original text (cleaned/formatted)
2. Modern ${targetLang} translation
3. Cultural and historical significance COMBINED in bullet points (4-6 key points total)

Format your response to be concise and student-friendly. Use bullet points for easier reading.`,
        response_json_schema: {
          type: "object",
          properties: {
            original_text: { type: "string", description: "The original ancient text" },
            modern_translation: { type: "string", description: "Modern translation in target language" },
            significance_points: { 
              type: "array", 
              items: { type: "string" },
              description: "4-6 bullet points covering cultural meaning and historical importance combined" 
            }
          }
        }
      });
    }

    setTranslation(result);
    setIsAnalyzing(false);
  };

  const handleSave = async () => {
    if (!translation) {
      alert('No translation data to save');
      return;
    }
    
    // Check if user is authenticated
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) {
      const shouldLogin = confirm('You need to log in to save translations. Would you like to log in now?');
      if (shouldLogin) {
        base44.auth.redirectToLogin(window.location.href);
      }
      return;
    }
    
    setIsSaving(true);
    try {
      const significanceCombined = translation.significance_points?.join('\n• ') || 'No information available';
      const inputText = inputType === 'text' ? manualText : (inputType === 'file' ? textFile?.name : 'Image-based text');
      
      const result = await base44.entities.TextTranslation.create({
        image_url: uploadedUrl || null,
        original_text: translation.original_text || inputText || 'No original text',
        modern_translation: translation.modern_translation || 'No translation available',
        cultural_meaning: significanceCombined,
        historical_importance: significanceCombined,
        input_type: inputType
      });
      
      if (result) {
        setSaved(true);
        await awardPoints('translation', 15);
        alert('✅ Successfully saved to your history! (+15 points)');
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert(`❌ Save failed: ${error.message || 'Please try again'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const canTranslate = inputType === 'image' ? !!imageFile : inputType === 'file' ? !!textFile : !!manualText.trim();

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 rounded-full text-rose-700 text-sm font-medium mb-4">
            <Languages className="w-4 h-4" />
            Ancient Text Translator
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-stone-800 mb-4">
            Decode Ancient Wisdom
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Upload an image of an ancient inscription or enter text manually 
            to translate it and discover its cultural significance.
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-6 md:p-10 border border-stone-200"
        >
          {/* Input Type Tabs */}
          <Tabs value={inputType} onValueChange={(v) => { setInputType(v); setTranslation(null); setSaved(false); }}>
            <TabsList className="grid w-full grid-cols-3 mb-8 h-14 bg-stone-100 p-1 rounded-xl">
              <TabsTrigger 
                value="text" 
                className="rounded-lg text-base data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2"
              >
                <Type className="w-4 h-4" />
                Enter Text
              </TabsTrigger>
              <TabsTrigger 
                value="image"
                className="rounded-lg text-base data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Image
              </TabsTrigger>
              <TabsTrigger 
                value="file"
                className="rounded-lg text-base data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                File
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="mt-0">
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Input Language/Script
                    </label>
                    <Select value={inputLanguage} onValueChange={setInputLanguage}>
                      <SelectTrigger className="h-12 border-2 border-stone-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {inputLanguages.map(lang => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Target Language
                    </label>
                    <Select value={targetLanguage} onValueChange={setTargetLanguage}>
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
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Enter ancient text to translate
                </label>
                <Textarea
                  placeholder="Enter ancient Sanskrit, Latin, Greek, Hieroglyphics transcription, or any historical text..."
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="min-h-[150px] text-lg border-2 border-stone-200 focus:border-rose-300 rounded-xl p-4"
                />
                <p className="text-sm text-stone-500">
                  Specify the input language/script if known for better accuracy
                </p>
              </div>
            </TabsContent>

            <TabsContent value="image" className="mt-0">
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Input Language/Script (Optional)
                    </label>
                    <Select value={inputLanguage} onValueChange={setInputLanguage}>
                      <SelectTrigger className="h-12 border-2 border-stone-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {inputLanguages.map(lang => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Target Language
                    </label>
                    <Select value={targetLanguage} onValueChange={setTargetLanguage}>
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
                <ImageUploader
                  onImageSelect={handleImageSelect}
                  isUploading={isUploading}
                  preview={preview}
                  onClear={handleClear}
                />
              </div>
            </TabsContent>

            <TabsContent value="file" className="mt-0">
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Input Language/Script
                    </label>
                    <Select value={inputLanguage} onValueChange={setInputLanguage}>
                      <SelectTrigger className="h-12 border-2 border-stone-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {inputLanguages.map(lang => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Target Language
                    </label>
                    <Select value={targetLanguage} onValueChange={setTargetLanguage}>
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
                
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Upload Text File
                </label>
                
                {!textFile ? (
                  <div 
                    onClick={() => document.getElementById('file-input').click()}
                    className="cursor-pointer rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 hover:border-rose-400 hover:bg-rose-50/50 p-12 transition-all"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-full bg-stone-100">
                        <FileText className="w-8 h-8 text-stone-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-medium text-stone-700">
                          Drop your text file here
                        </p>
                        <p className="text-stone-500 mt-1">
                          or click to browse
                        </p>
                      </div>
                      <div className="text-sm text-stone-400">
                        TXT or PDF files supported
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-rose-600" />
                        <div>
                          <p className="font-medium text-stone-800">{textFile.name}</p>
                          <p className="text-sm text-stone-500">{(textFile.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTextFile(null);
                          setTranslation(null);
                          setSaved(false);
                        }}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                )}
                
                <input
                  id="file-input"
                  type="file"
                  accept=".txt,.pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setTextFile(file);
                      setTranslation(null);
                      setSaved(false);
                    }
                  }}
                  className="hidden"
                />
                
                <p className="text-sm text-stone-500">
                  Upload a text file containing ancient inscriptions or manuscripts
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Translate Button */}
          {canTranslate && !translation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 flex justify-center"
            >
              <Button
                onClick={handleTranslate}
                disabled={isAnalyzing || isUploading}
                size="lg"
                className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-rose-200 gap-2"
              >
                <Languages className="w-5 h-5" />
                Translate & Analyze
              </Button>
            </motion.div>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <LoadingAnalysis message="Translating ancient text..." />
          )}

          {/* Translation Results */}
          {translation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-10"
            >
              {/* Voice Assistant */}
              <div className="flex justify-center mb-6">
                <VoiceAssistant 
                  content={`Original text: ${translation.original_text}. Translation: ${translation.modern_translation}. Key points: ${translation.significance_points?.join('. ')}`}
                  title="Ancient Text Translation"
                />
              </div>

              {/* Result Cards */}
              <div className="grid gap-6">
                <AnalysisCard
                  icon={Scroll}
                  title="Original Text"
                  content={translation.original_text}
                  color="burgundy"
                  delay={0.1}
                />
                <AnalysisCard
                  icon={FileText}
                  title="Modern Translation"
                  content={translation.modern_translation}
                  color="emerald"
                  delay={0.2}
                />
                <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-indigo-100 shrink-0">
                      <Globe className="w-6 h-6 text-indigo-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-indigo-700 mb-3">Cultural & Historical Significance</h3>
                      <ul className="space-y-2">
                        {translation.significance_points?.map((point, idx) => (
                          <motion.li
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + idx * 0.1 }}
                            className="flex items-start gap-2 text-stone-600"
                          >
                            <span className="text-indigo-500 mt-1">•</span>
                            <span>{point}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

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
                      {isSaving ? 'Saving...' : 'Save Translation'}
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 bg-rose-50 rounded-2xl p-6 border border-rose-100"
        >
          <h3 className="font-medium text-rose-800 mb-3">Tips for best results:</h3>
          <ul className="space-y-2 text-rose-700 text-sm">
            <li>• For images, ensure the inscription is clearly visible and well-lit</li>
            <li>• Works with Sanskrit, Latin, Greek, Arabic, Chinese, and many more scripts</li>
            <li>• Include context about where the text was found for better analysis</li>
            <li>• The AI will attempt to identify the script/language automatically</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
