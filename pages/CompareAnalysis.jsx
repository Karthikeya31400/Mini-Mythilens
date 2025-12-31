import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  GitCompare, 
  ArrowRight,
  Lightbulb,
  Scale,
  Link as LinkIcon,
  Save,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ItemSelector from '@/components/comparison/ItemSelector';
import AnalysisCard from '@/components/ui/AnalysisCard';
import LoadingAnalysis from '@/components/ui/LoadingAnalysis';
import VoiceAssistant from '@/components/ui/VoiceAssistant';

export default function CompareAnalysis() {
  const [activeTab, setActiveTab] = useState('heritage');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isComparing, setIsComparing] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: heritageAnalyses = [], isLoading: loadingHeritage } = useQuery({
    queryKey: ['heritageAnalyses'],
    queryFn: () => base44.entities.HeritageAnalysis.list('-created_date', 50),
  });

  const { data: translations = [], isLoading: loadingTranslations } = useQuery({
    queryKey: ['textTranslations'],
    queryFn: () => base44.entities.TextTranslation.list('-created_date', 50),
  });

  const handleToggle = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else if (selectedIds.length < 2) {
      setSelectedIds([...selectedIds, id]);
    }
    setComparison(null);
    setSaved(false);
  };

  const handleCompare = async () => {
    if (selectedIds.length !== 2) return;

    setIsComparing(true);
    
    const items = activeTab === 'heritage' ? heritageAnalyses : translations;
    const item1 = items.find(i => i.id === selectedIds[0]);
    const item2 = items.find(i => i.id === selectedIds[1]);

    let prompt;
    if (activeTab === 'heritage') {
      prompt = `Compare these two heritage sites and provide a detailed comparative analysis in simple, student-friendly language:

Site 1: ${item1.title}
History: ${item1.history}
Mythology: ${item1.mythology}
Cultural Significance: ${item1.cultural_significance}
Architecture: ${item1.architecture}

Site 2: ${item2.title}
History: ${item2.history}
Mythology: ${item2.mythology}
Cultural Significance: ${item2.cultural_significance}
Architecture: ${item2.architecture}

Provide: 
1. Similarities between them
2. Key differences
3. Potential connections or relationships
4. An overall summary`;
    } else {
      prompt = `Compare these two ancient texts and provide a detailed comparative analysis in simple, student-friendly language:

Text 1:
Original: ${item1.original_text}
Translation: ${item1.modern_translation}
Cultural Meaning: ${item1.cultural_meaning}
Historical Importance: ${item1.historical_importance}

Text 2:
Original: ${item2.original_text}
Translation: ${item2.modern_translation}
Cultural Meaning: ${item2.cultural_meaning}
Historical Importance: ${item2.historical_importance}

Provide:
1. Similarities in themes, meaning, or origin
2. Key differences in content or context
3. Potential connections or relationships
4. An overall summary`;
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          similarities: { type: "string" },
          differences: { type: "string" },
          connections: { type: "string" },
          summary: { type: "string" }
        }
      }
    });

    setComparison(result);
    setIsComparing(false);
  };

  const handleSave = async () => {
    if (!comparison) return;
    
    setIsSaving(true);
    await base44.entities.ComparativeAnalysis.create({
      item1_id: selectedIds[0],
      item2_id: selectedIds[1],
      item_type: activeTab,
      similarities: comparison.similarities,
      differences: comparison.differences,
      connections: comparison.connections,
      summary: comparison.summary
    });
    setIsSaving(false);
    setSaved(true);
  };

  const canCompare = selectedIds.length === 2;
  const items = activeTab === 'heritage' ? heritageAnalyses : translations;
  const isLoading = loadingHeritage || loadingTranslations;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-4">
            <GitCompare className="w-4 h-4" />
            Comparative Analysis
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-stone-800 mb-4">
            Compare & Discover Connections
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Select two heritage sites or texts to analyze their similarities, differences, and hidden connections
          </p>
        </motion.div>

        {/* Type Selection */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedIds([]); setComparison(null); }}>
          <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-stone-100 p-1 rounded-xl">
            <TabsTrigger value="heritage" className="rounded-lg text-base data-[state=active]:bg-white">
              Heritage Sites ({heritageAnalyses.length})
            </TabsTrigger>
            <TabsTrigger value="translation" className="rounded-lg text-base data-[state=active]:bg-white">
              Ancient Texts ({translations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="heritage">
            {isLoading ? (
              <div className="text-center py-12">Loading...</div>
            ) : heritageAnalyses.length < 2 ? (
              <div className="text-center py-12 bg-stone-50 rounded-2xl">
                <p className="text-stone-600">You need at least 2 heritage analyses to compare</p>
              </div>
            ) : (
              <ItemSelector
                items={heritageAnalyses}
                selectedIds={selectedIds}
                onToggle={handleToggle}
                type="heritage"
              />
            )}
          </TabsContent>

          <TabsContent value="translation">
            {isLoading ? (
              <div className="text-center py-12">Loading...</div>
            ) : translations.length < 2 ? (
              <div className="text-center py-12 bg-stone-50 rounded-2xl">
                <p className="text-stone-600">You need at least 2 translations to compare</p>
              </div>
            ) : (
              <ItemSelector
                items={translations}
                selectedIds={selectedIds}
                onToggle={handleToggle}
                type="translation"
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Compare Button */}
        {canCompare && !comparison && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex justify-center"
          >
            <Button
              onClick={handleCompare}
              disabled={isComparing}
              size="lg"
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-indigo-200 gap-2"
            >
              <GitCompare className="w-5 h-5" />
              {isComparing ? 'Comparing...' : 'Compare Selected Items'}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        )}

        {/* Loading */}
        {isComparing && (
          <div className="mt-12">
            <LoadingAnalysis message="Performing comparative analysis..." />
          </div>
        )}

        {/* Results */}
        {comparison && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-stone-800">
                Analysis Results
              </h2>
              <VoiceAssistant 
                content={`${comparison.summary}. Similarities: ${comparison.similarities}. Differences: ${comparison.differences}. Connections: ${comparison.connections}`}
                title="Comparative Analysis"
              />
            </div>

            <AnalysisCard
              icon={Lightbulb}
              title="Summary"
              content={comparison.summary}
              color="indigo"
              delay={0.1}
            />
            <AnalysisCard
              icon={LinkIcon}
              title="Similarities"
              content={comparison.similarities}
              color="emerald"
              delay={0.2}
            />
            <AnalysisCard
              icon={Scale}
              title="Differences"
              content={comparison.differences}
              color="burgundy"
              delay={0.3}
            />
            <AnalysisCard
              icon={GitCompare}
              title="Connections & Relationships"
              content={comparison.connections}
              color="amber"
              delay={0.4}
            />

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
                    {isSaving ? 'Saving...' : 'Save Comparison'}
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
