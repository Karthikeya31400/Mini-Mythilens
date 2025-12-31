import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  History as HistoryIcon, 
  Compass, 
  Languages, 
  Trash2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  FileText,
  Calendar,
  Loader2
} from 'lucide-react';
import OfflineDataIndicator from '@/components/ui/OfflineDataIndicator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function HeritageCard({ item, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-lg shadow-stone-200/50 border border-stone-200 overflow-hidden"
    >
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        {item.image_url && (
          <div className="md:w-48 h-48 md:h-auto shrink-0">
            <img 
              src={item.image_url} 
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-600 text-sm font-medium mb-2">
                <Compass className="w-4 h-4" />
                Heritage Analysis
              </div>
              <h3 className="font-display text-xl font-bold text-stone-800">
                {item.title || 'Heritage Monument'}
              </h3>
              <p className="text-sm text-stone-500 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(item.created_date), 'MMM d, yyyy')}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="text-stone-600"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this analysis?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this heritage analysis from your history.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(item.id)} className="bg-red-500 hover:bg-red-600">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Preview */}
          <p className="text-stone-600 mt-3 line-clamp-2">
            {item.history}
          </p>

          {/* Expanded Content */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4 border-t pt-4"
              >
                <div>
                  <h4 className="font-medium text-stone-800 mb-1">Mythology</h4>
                  <p className="text-stone-600 text-sm">{item.mythology}</p>
                </div>
                <div>
                  <h4 className="font-medium text-stone-800 mb-1">Cultural Significance</h4>
                  <p className="text-stone-600 text-sm">{item.cultural_significance}</p>
                </div>
                <div>
                  <h4 className="font-medium text-stone-800 mb-1">Architecture</h4>
                  <p className="text-stone-600 text-sm">{item.architecture}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function TranslationCard({ item, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-lg shadow-stone-200/50 border border-stone-200 overflow-hidden"
    >
      <div className="flex flex-col md:flex-row">
        {/* Image or Icon */}
        <div className="md:w-48 h-48 md:h-auto shrink-0 bg-rose-50 flex items-center justify-center">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt="Ancient text"
              className="w-full h-full object-cover"
            />
          ) : (
            <FileText className="w-16 h-16 text-rose-300" />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-rose-600 text-sm font-medium mb-2">
                <Languages className="w-4 h-4" />
                Text Translation
              </div>
              <p className="text-sm text-stone-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(item.created_date), 'MMM d, yyyy')}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="text-stone-600"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this translation?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this translation from your history.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(item.id)} className="bg-red-500 hover:bg-red-600">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-3">
            <p className="text-stone-800 font-medium line-clamp-1">{item.original_text}</p>
            <p className="text-stone-600 mt-1 line-clamp-2">{item.modern_translation}</p>
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4 border-t pt-4"
              >
                <div>
                  <h4 className="font-medium text-stone-800 mb-1">Original Text</h4>
                  <p className="text-stone-600 text-sm">{item.original_text}</p>
                </div>
                <div>
                  <h4 className="font-medium text-stone-800 mb-1">Modern Translation</h4>
                  <p className="text-stone-600 text-sm">{item.modern_translation}</p>
                </div>
                <div>
                  <h4 className="font-medium text-stone-800 mb-1">Cultural Meaning</h4>
                  <p className="text-stone-600 text-sm">{item.cultural_meaning}</p>
                </div>
                <div>
                  <h4 className="font-medium text-stone-800 mb-1">Historical Importance</h4>
                  <p className="text-stone-600 text-sm">{item.historical_importance}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function History() {
  const [activeTab, setActiveTab] = useState('all');
  const [isOffline, setIsOffline] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { data: heritageAnalyses = [], isLoading: loadingHeritage, refetch: refetchHeritage } = useQuery({
    queryKey: ['heritageAnalyses'],
    queryFn: () => base44.entities.HeritageAnalysis.list('-created_date', 50),
  });

  const { data: translations = [], isLoading: loadingTranslations, refetch: refetchTranslations } = useQuery({
    queryKey: ['textTranslations'],
    queryFn: () => base44.entities.TextTranslation.list('-created_date', 50),
  });

  const handleDeleteHeritage = async (id) => {
    await base44.entities.HeritageAnalysis.delete(id);
    refetchHeritage();
  };

  const handleDeleteTranslation = async (id) => {
    await base44.entities.TextTranslation.delete(id);
    refetchTranslations();
  };

  const isLoading = loadingHeritage || loadingTranslations;
  const totalItems = heritageAnalyses.length + translations.length;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-full text-stone-700 text-sm font-medium">
              <HistoryIcon className="w-4 h-4" />
              Your History
            </div>
            <OfflineDataIndicator show={isOffline} />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-stone-800 mb-4">
            Saved Discoveries
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            View all your heritage analyses and text translations in one place
          </p>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-14 bg-stone-100 p-1 rounded-xl">
            <TabsTrigger 
              value="all"
              className="rounded-lg text-base data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              All ({totalItems})
            </TabsTrigger>
            <TabsTrigger 
              value="heritage"
              className="rounded-lg text-base data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              Heritage ({heritageAnalyses.length})
            </TabsTrigger>
            <TabsTrigger 
              value="translations"
              className="rounded-lg text-base data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2"
            >
              <Languages className="w-4 h-4" />
              Texts ({translations.length})
            </TabsTrigger>
          </TabsList>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && totalItems === 0 && (
            <div className="text-center py-20">
              <div className="inline-flex p-4 rounded-full bg-stone-100 mb-4">
                <HistoryIcon className="w-8 h-8 text-stone-400" />
              </div>
              <h3 className="text-lg font-medium text-stone-800 mb-2">No saved items yet</h3>
              <p className="text-stone-600">
                Start analyzing heritage sites or translating ancient texts to build your history
              </p>
            </div>
          )}

          {/* All Tab */}
          <TabsContent value="all" className="space-y-6">
            {[...heritageAnalyses.map(h => ({ ...h, type: 'heritage' })), 
              ...translations.map(t => ({ ...t, type: 'translation' }))]
              .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
              .map(item => (
                item.type === 'heritage' ? (
                  <HeritageCard key={`h-${item.id}`} item={item} onDelete={handleDeleteHeritage} />
                ) : (
                  <TranslationCard key={`t-${item.id}`} item={item} onDelete={handleDeleteTranslation} />
                )
              ))
            }
          </TabsContent>

          {/* Heritage Tab */}
          <TabsContent value="heritage" className="space-y-6">
            {heritageAnalyses.map(item => (
              <HeritageCard key={item.id} item={item} onDelete={handleDeleteHeritage} />
            ))}
            {!loadingHeritage && heritageAnalyses.length === 0 && (
              <div className="text-center py-12">
                <p className="text-stone-600">No heritage analyses saved yet</p>
              </div>
            )}
          </TabsContent>

          {/* Translations Tab */}
          <TabsContent value="translations" className="space-y-6">
            {translations.map(item => (
              <TranslationCard key={item.id} item={item} onDelete={handleDeleteTranslation} />
            ))}
            {!loadingTranslations && translations.length === 0 && (
              <div className="text-center py-12">
                <p className="text-stone-600">No translations saved yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
