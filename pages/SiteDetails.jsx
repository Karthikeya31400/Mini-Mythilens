import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  MapPin,
  History as HistoryIcon,
  BookOpen,
  Landmark,
  Palette,
  Save,
  Check,
  ShieldAlert,
  Loader2,
  ArrowLeft,
  Star,
  MessageCircle,
  Upload,
  Camera,
  ThumbsUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingAnalysis from '@/components/ui/LoadingAnalysis';
import VoiceAssistant from '@/components/ui/VoiceAssistant';
import ImageUploader from '@/components/ui/ImageUploader';
import InteractiveTimeline from '@/components/timeline/InteractiveTimeline';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useGamification } from '@/components/gamification/useGamification';

export default function SiteDetails() {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [question, setQuestion] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const queryClient = useQueryClient();
  const { awardPoints } = useGamification();

  const urlParams = new URLSearchParams(window.location.search);
  const siteName = urlParams.get('name');
  const lat = urlParams.get('lat');
  const lng = urlParams.get('lng');
  const siteType = urlParams.get('type');

  // Fetch reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['site-reviews', siteName],
    queryFn: () => base44.entities.SiteReview.filter({ site_name: siteName }, '-created_date', 50),
    enabled: !!siteName
  });

  // Fetch Q&A
  const { data: questions = [] } = useQuery({
    queryKey: ['site-questions', siteName],
    queryFn: () => base44.entities.SiteQuestion.filter({ site_name: siteName }, '-created_date', 50),
    enabled: !!siteName
  });

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  useEffect(() => {
    if (siteName) {
      fetchSiteDetails();
    }
  }, [siteName]);

  const fetchSiteDetails = async () => {
    setIsAnalyzing(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide detailed information about "${siteName}" (${siteType || 'heritage site'}) in a student-friendly format:

1. Title: Confirm the monument name
2. History: 4-6 bullet points covering when it was built, by whom, and historical background
3. Mythology: 3-5 bullet points about mythological stories, legends, religious significance
4. Cultural Significance: 5-7 bullet points explaining cultural importance, role in society, influence, and why people should care today
5. Architecture: Brief description of architectural style and unique features
6. Location: Provide location name
7. Rules & Guidelines: Visitor rules, entry requirements, dress code, photography restrictions, cultural etiquette, do's and don'ts

Keep all points concise, clear, and engaging. Use ONLY verified information.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            history_points: {
              type: "array",
              items: { type: "string" }
            },
            mythology_points: {
              type: "array",
              items: { type: "string" }
            },
            cultural_significance_points: {
              type: "array",
              items: { type: "string" }
            },
            architecture: { type: "string" },
            rules_and_guidelines: { type: "string" },
            location_name: { type: "string" },
            image_search_query: { type: "string", description: "Best search query to find image of this site" }
          }
        }
      });

      setAnalysis({
        ...result,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng)
      });

      // Generate an image for the site
      if (result.image_search_query) {
        try {
          const imageResult = await base44.integrations.Core.GenerateImage({
            prompt: `Professional photograph of ${result.image_search_query}, heritage site, architectural detail, high quality, natural lighting`
          });
          setImageUrl(imageResult.url);
        } catch (error) {
          console.error('Failed to generate image:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!analysis) {
      alert('No site data to save');
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
        title: analysis.title || 'Unknown Site',
        history: analysis.history_points?.join('\n• ') || 'No history available',
        mythology: analysis.mythology_points?.join('\n• ') || 'No mythology available',
        cultural_significance: analysis.cultural_significance_points?.join('\n• ') || 'No information available',
        architecture: analysis.architecture || 'No architecture details',
        rules_and_guidelines: analysis.rules_and_guidelines || 'No guidelines available',
        location_name: analysis.location_name || 'Unknown location',
        latitude: analysis.latitude || null,
        longitude: analysis.longitude || null
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

  const handlePhotoSelect = (file) => {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      alert('Please log in to submit reviews');
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (userRating === 0 || reviewText.trim() === '') {
      alert('Please provide a rating and review text.');
      return;
    }


    try {
      const user = await base44.auth.me();
      let photos = [];

      if (photoFile) {
        setUploadingPhoto(true);
        const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });
        photos = [file_url];
        setUploadingPhoto(false);
      }

      await base44.entities.SiteReview.create({
        site_name: siteName,
        rating: userRating,
        review_text: reviewText,
        visit_date: new Date().toISOString().split('T')[0],
        photos,
        user_name: user.full_name || user.email
      });

      setUserRating(0);
      setReviewText('');
      setPhotoFile(null);
      setPhotoPreview(null);
      queryClient.invalidateQueries(['site-reviews', siteName]);
      
      await awardPoints('review', photoFile ? 20 : 15);
      alert(`✅ Review submitted! (+${photoFile ? 20 : 15} points)`);
    } catch (error) {
      alert('Failed to submit review: ' + error.message);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      alert('Please log in to ask questions');
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    if (question.trim() === '') {
      alert('Please enter a question.');
      return;
    }

    try {
      // Generate AI answer
      const aiAnswer = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a heritage site expert. Answer this question about ${siteName}:

Question: ${question}

Context:
${analysis.history_points?.join('\n')}
${analysis.mythology_points?.join('\n')}
${analysis.cultural_significance_points?.join('\n')}

Provide a clear, accurate, and helpful answer in 2-3 sentences. Use verified information only.`,
        add_context_from_internet: true
      });

      await base44.entities.SiteQuestion.create({
        site_name: siteName,
        question,
        answer: aiAnswer,
        is_ai_generated: true,
        helpful_count: 0
      });

      setQuestion('');
      queryClient.invalidateQueries(['site-questions', siteName]);
      
      await awardPoints('question', 5);
      alert('✅ Question answered! (+5 points)');
    } catch (error) {
      alert('Failed to submit question: ' + error.message);
    }
  };

  const handleMarkHelpful = async (questionId) => {
    try {
      const q = questions.find(q => q.id === questionId);
      if (!q) return;

      await base44.entities.SiteQuestion.update(questionId, {
        helpful_count: (q.helpful_count || 0) + 1
      });

      await awardPoints('helpful_vote', 2);
      queryClient.invalidateQueries(['site-questions', siteName]);
    } catch (error) {
      console.error('Failed to mark helpful:', error);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <LoadingAnalysis message="Loading heritage site details..." />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-stone-600">Site not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link to={createPageUrl('DiscoverNearby')} className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Discovery
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-6 md:p-10 border border-stone-200"
        >
          {/* Image */}
          {imageUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl overflow-hidden mb-6"
            >
              <img src={imageUrl} alt={analysis.title} className="w-full h-64 object-cover" />
            </motion.div>
          )}

          {/* Title & Voice */}
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-stone-800 mb-3">
              {analysis.title}
            </h2>
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

          {/* Rating Display */}
          {reviews.length > 0 && (
            <div className="flex items-center justify-center gap-4 mb-6 p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                <span className="text-2xl font-bold text-amber-700">{averageRating.toFixed(1)}</span>
              </div>
              <span className="text-stone-600">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b-2 border-stone-200">
            {['details', 'timeline', 'reviews', 'qna'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-2 font-medium capitalize transition-all
                  ${activeTab === tab
                    ? 'border-b-2 border-amber-500 text-amber-600'
                    : 'text-stone-500 hover:text-stone-700'
                  }
                `}
              >
                {tab === 'qna' ? 'Q&A' : tab}
              </button>
            ))}
          </div>

          {/* Details Tab */}
          {activeTab === 'details' && (
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
                        <li key={idx} className="flex items-start gap-2 text-stone-600">
                          <span className="text-amber-500 mt-1">•</span>
                          <span>{point}</span>
                        </li>
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
                        <li key={idx} className="flex items-start gap-2 text-stone-600">
                          <span className="text-rose-500 mt-1">•</span>
                          <span>{point}</span>
                        </li>
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
                        <li key={idx} className="flex items-start gap-2 text-stone-600">
                          <span className="text-emerald-500 mt-1">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-indigo-100 shrink-0">
                    <Palette className="w-6 h-6 text-indigo-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-indigo-700 mb-3">Architecture</h3>
                    <p className="text-stone-600">{analysis.architecture}</p>
                  </div>
                </div>
              </div>

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
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <InteractiveTimeline siteName={siteName} siteData={analysis} />
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Submit Review */}
              <div className="p-6 border-2 border-amber-200 rounded-xl bg-amber-50">
                <h3 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-600" />
                  Share Your Experience
                </h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-2 block">Your Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-8 h-8 ${star <= userRating ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    placeholder="Share your experience at this heritage site..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={3}
                  />

                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-2 block">Add Photo (optional)</label>
                    {photoPreview ? (
                      <div className="relative">
                        <img src={photoPreview} alt="Review preview" className="w-full h-48 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoFile(null);
                            setPhotoPreview(null);
                          }}
                          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <ImageUploader
                        onImageSelect={handlePhotoSelect}
                        isUploading={false}
                        preview={photoPreview}
                        onClear={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                      />
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={userRating === 0 || uploadingPhoto || reviewText.trim() === ''}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2"
                  >
                    {uploadingPhoto ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading Photo...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        Submit Review
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-center text-stone-500 py-8">No reviews yet. Be the first!</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="p-4 border-2 border-stone-200 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-stone-800">{review.user_name}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-stone-500">
                          {new Date(review.created_date).toLocaleDateString()}
                        </span>
                      </div>
                      {review.review_text && (
                        <p className="text-stone-600 mt-2">{review.review_text}</p>
                      )}
                      {review.photos && review.photos.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {review.photos.map((photo, idx) => (
                            <img key={idx} src={photo} alt={`Review photo ${idx + 1}`} className="w-full h-32 object-cover rounded-lg" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Q&A Tab */}
          {activeTab === 'qna' && (
            <div className="space-y-6">
              {/* Ask Question */}
              <div className="p-6 border-2 border-indigo-200 rounded-xl bg-indigo-50">
                <h3 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-indigo-600" />
                  Ask a Question
                </h3>
                <form onSubmit={handleAskQuestion} className="space-y-4">
                  <Input
                    placeholder="What would you like to know about this site?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    required
                  />
                  <Button type="submit" disabled={question.trim() === ''} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                    Get AI Answer
                  </Button>
                </form>
              </div>

              {/* Q&A List */}
              <div className="space-y-4">
                {questions.length === 0 ? (
                  <p className="text-center text-stone-500 py-8">No questions yet. Ask the first!</p>
                ) : (
                  questions.map((q) => (
                    <div key={q.id} className="p-4 border-2 border-stone-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <MessageCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-1" />
                        <div className="flex-1">
                          <p className="font-medium text-stone-800 mb-2">{q.question}</p>
                          <p className="text-sm text-stone-600 bg-stone-50 p-3 rounded-lg">
                            {q.answer}
                          </p>
                          <div className="flex items-center gap-4 mt-3">
                            <button
                              onClick={() => handleMarkHelpful(q.id)}
                              className="flex items-center gap-1 text-xs text-stone-500 hover:text-emerald-600 transition-colors"
                            >
                              <ThumbsUp className="w-3 h-3" />
                              Helpful ({q.helpful_count || 0})
                            </button>
                            {q.is_ai_generated && (
                              <span className="text-xs text-amber-600 flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                AI-generated
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Save Button */}
          {activeTab === 'details' && (
            <div className="mt-8 flex justify-center">
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
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
