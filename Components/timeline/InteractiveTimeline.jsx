import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Loader2, Calendar, User, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function InteractiveTimeline({ siteName, siteData }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    year: '',
    title: '',
    description: '',
    key_figures: '',
    source: ''
  });

  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['timeline-events', siteName],
    queryFn: () => base44.entities.TimelineEvent.filter({ site_name: siteName }, 'year', 100),
    enabled: !!siteName
  });

  const createEventMutation = useMutation({
    mutationFn: (eventData) => base44.entities.TimelineEvent.create(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries(['timeline-events', siteName]);
      setShowAddForm(false);
      setNewEvent({ year: '', title: '', description: '', key_figures: '', source: '' });
    }
  });

  const generateTimeline = async () => {
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a comprehensive historical timeline for: ${siteName}

${siteData ? `Context:
${siteData.history || ''}
${siteData.mythology || ''}
${siteData.cultural_significance || ''}` : ''}

Create 8-12 key historical events covering:
- Construction/founding
- Major renovations or expansions
- Important religious/cultural ceremonies
- Historical battles or conflicts related to the site
- Significant rulers or figures associated with it
- Archaeological discoveries
- Modern preservation efforts

For each event provide:
- year: Exact year (use negative numbers for BCE)
- era: Historical period (Ancient/Medieval/Colonial/Modern)
- title: Brief event title
- description: 2-3 sentence description
- key_figures: Array of important people involved (if any)
- source: Brief mention of historical source type
- image_prompt: Detailed prompt for generating an image representing this event`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  year: { type: "number" },
                  era: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  key_figures: { type: "array", items: { type: "string" } },
                  source: { type: "string" },
                  image_prompt: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Generate images and create all events
      for (const event of result.events || []) {
        let imageUrl = null;
        try {
          const imageResult = await base44.integrations.Core.GenerateImage({
            prompt: `${event.image_prompt}, historical scene, detailed illustration, high quality, professional artwork, ${siteName}`
          });
          imageUrl = imageResult.url;
        } catch (error) {
          console.error('Failed to generate image for timeline event:', error);
        }

        await base44.entities.TimelineEvent.create({
          site_name: siteName,
          year: event.year,
          era: event.era,
          title: event.title,
          description: event.description,
          key_figures: event.key_figures || [],
          is_ai_generated: true,
          source: event.source,
          image_url: imageUrl
        });
      }

      queryClient.invalidateQueries(['timeline-events', siteName]);
    } catch (error) {
      alert('Failed to generate timeline: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      alert('Please log in to add timeline events');
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    createEventMutation.mutate({
      site_name: siteName,
      year: parseInt(newEvent.year),
      era: newEvent.year < 500 ? 'Ancient' : newEvent.year < 1500 ? 'Medieval' : newEvent.year < 1900 ? 'Colonial' : 'Modern',
      title: newEvent.title,
      description: newEvent.description,
      key_figures: newEvent.key_figures ? newEvent.key_figures.split(',').map(f => f.trim()) : [],
      is_ai_generated: false,
      source: newEvent.source || 'User contribution'
    });
  };

  const eraColors = {
    Ancient: 'bg-purple-100 text-purple-700 border-purple-300',
    Medieval: 'bg-amber-100 text-amber-700 border-amber-300',
    Colonial: 'bg-red-100 text-red-700 border-red-300',
    Modern: 'bg-emerald-100 text-emerald-700 border-emerald-300'
  };

  if (!siteName) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500">No site selected for timeline</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-stone-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-6 h-6 text-indigo-600" />
          Interactive Timeline
        </CardTitle>
        <CardDescription>Explore the history of {siteName}</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <Button
              onClick={generateTimeline}
              disabled={isGenerating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Timeline...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate AI Timeline
                </>
              )}
            </Button>
          </div>
        )}

        {events.length > 0 && (
          <>
            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-stone-600">{events.length} events</p>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Event
              </Button>
            </div>

            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 border-2 border-indigo-200 rounded-xl bg-indigo-50"
              >
                <form onSubmit={handleAddEvent} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      placeholder="Year (e.g., 1632)"
                      value={newEvent.year}
                      onChange={(e) => setNewEvent({...newEvent, year: e.target.value})}
                      required
                    />
                    <Input
                      placeholder="Title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                      required
                    />
                  </div>
                  <Textarea
                    placeholder="Description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    rows={2}
                    required
                  />
                  <Input
                    placeholder="Key figures (comma separated)"
                    value={newEvent.key_figures}
                    onChange={(e) => setNewEvent({...newEvent, key_figures: e.target.value})}
                  />
                  <Input
                    placeholder="Source (optional)"
                    value={newEvent.source}
                    onChange={(e) => setNewEvent({...newEvent, source: e.target.value})}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                      Add Event
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-amber-500" />
              
              <div className="space-y-6">
                {events.map((event, idx) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative pl-12"
                  >
                    <div
                      className="absolute left-0 w-8 h-8 rounded-full bg-white border-4 border-indigo-500 flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform"
                      onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                    >
                      <Calendar className="w-3 h-3 text-indigo-600" />
                    </div>

                    <div className="bg-white rounded-xl border-2 border-stone-200 hover:border-indigo-300 transition-colors cursor-pointer overflow-hidden"
                         onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}>
                      {event.image_url && (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg font-bold text-indigo-600">
                                {event.year < 0 ? `${Math.abs(event.year)} BCE` : event.year}
                              </span>
                              {event.era && (
                                <span className={`text-xs px-2 py-1 rounded-full border ${eraColors[event.era]}`}>
                                  {event.era}
                                </span>
                              )}
                              {event.is_ai_generated && (
                                <Sparkles className="w-3 h-3 text-amber-500" />
                              )}
                            </div>
                            <h4 className="font-semibold text-stone-800">{event.title}</h4>
                          </div>
                          {expandedEvent === event.id ? (
                            <ChevronUp className="w-5 h-5 text-stone-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-stone-400" />
                          )}
                        </div>

                        <AnimatePresence>
                          {expandedEvent === event.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 pt-3 border-t border-stone-200"
                            >
                              <p className="text-sm text-stone-600 mb-3">{event.description}</p>
                              {event.key_figures && event.key_figures.length > 0 && (
                                <div className="flex items-start gap-2 text-xs text-stone-500 mb-2">
                                  <User className="w-3 h-3 mt-0.5" />
                                  <span>{event.key_figures.join(', ')}</span>
                                </div>
                              )}
                              {event.source && (
                                <p className="text-xs text-stone-400">Source: {event.source}</p>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
