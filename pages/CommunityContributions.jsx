import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Users, Send, CheckCircle, Clock, XCircle, Upload, Loader2, Award, MapPin } from 'lucide-react';
import { useGamification } from '@/components/gamification/useGamification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ImageUploader from '@/components/ui/ImageUploader';

export default function CommunityContributions() {
  const [formData, setFormData] = useState({
    type: 'heritage_site',
    title: '',
    description: '',
    location_name: '',
    latitude: '',
    longitude: '',
    image_url: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const queryClient = useQueryClient();
  const { awardPoints } = useGamification();

  const { data: contributions = [] } = useQuery({
    queryKey: ['community-contributions'],
    queryFn: async () => {
      const user = await base44.auth.me().catch(() => null);
      if (!user) return [];
      return base44.entities.CommunityContribution.filter({ submitter_email: user.email }, '-created_date', 50);
    }
  });

  const handleImageSelect = (file) => {
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleClear = () => {
    setImageFile(null);
    setPreview(null);
    setFormData({ ...formData, image_url: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      alert('Please log in to submit contributions');
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await base44.auth.me();
      let imageUrl = formData.image_url;

      // Upload image if provided
      if (imageFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
        imageUrl = file_url;
      }

      // Enhanced AI Moderation with Sentiment Analysis
      const moderationResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a heritage content moderator with sentiment analysis capabilities. Analyze this submission:

Type: ${formData.type}
Title: ${formData.title}
Description: ${formData.description}
Location: ${formData.location_name}

Evaluate:
1. Accuracy: Does this seem historically accurate? (research online if needed)
2. Relevance: Is it related to heritage/history/culture?
3. Quality: Is the description informative and well-written?
4. Appropriateness: Is content appropriate and respectful?
5. **Sentiment Analysis**: Detect any disrespectful, biased, inflammatory, or inappropriate tone
6. **Cultural Sensitivity**: Check for culturally insensitive or offensive content

Provide:
- accuracy_score: 0-10 (how accurate/verifiable the information is)
- sentiment_score: 0-10 (10 = very respectful, 0 = inappropriate/disrespectful)
- approval_recommendation: "approve" or "reject"
- feedback: Brief explanation of your assessment
- sentiment_notes: Any concerns about tone, bias, or respect
- improvements: Suggestions if score < 7`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            accuracy_score: { type: "number" },
            sentiment_score: { type: "number" },
            approval_recommendation: { type: "string" },
            feedback: { type: "string" },
            sentiment_notes: { type: "string" },
            improvements: { type: "string" }
          }
        }
      });

      // Check user reputation for auto-approval
      const userStatsData = await base44.entities.UserStats.filter({ user_email: user.email }, '-created_date', 1);
      const userReputation = userStatsData[0]?.reputation_score || 50;
      
      const sentimentOk = moderationResult.sentiment_score >= 7;
      const accuracyOk = moderationResult.accuracy_score >= 7;
      const aiApproved = moderationResult.approval_recommendation === 'approve';
      
      // Trusted users (reputation >= 80) get auto-approved if sentiment is good
      const status = (userReputation >= 80 && sentimentOk && accuracyOk) || 
                     (accuracyOk && sentimentOk && aiApproved) 
        ? 'approved' 
        : 'pending';

      await base44.entities.CommunityContribution.create({
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        image_url: imageUrl,
        status,
        ai_moderation_result: moderationResult.feedback,
        ai_accuracy_score: moderationResult.accuracy_score,
        submitter_email: user.email
      });

      setSubmitSuccess(true);
      setFormData({
        type: 'heritage_site',
        title: '',
        description: '',
        location_name: '',
        latitude: '',
        longitude: '',
        image_url: ''
      });
      handleClear();
      queryClient.invalidateQueries(['community-contributions']);

      // Award points
      await awardPoints('contribution', 25);

      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      alert('Submission failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusIcons = {
    pending: <Clock className="w-4 h-4 text-amber-600" />,
    approved: <CheckCircle className="w-4 h-4 text-emerald-600" />,
    rejected: <XCircle className="w-4 h-4 text-red-600" />
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700 border-amber-300',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    rejected: 'bg-red-100 text-red-700 border-red-300'
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full text-indigo-700 text-sm font-medium mb-4">
            <Users className="w-4 h-4" />
            Community Powered
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-stone-800 mb-4">
            Share Your Heritage Knowledge
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Contribute new heritage sites, historical facts, or local legends to help preserve cultural knowledge.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Submission Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="border-2 border-stone-200">
              <CardHeader>
                <CardTitle>Submit a Contribution</CardTitle>
                <CardDescription>Share your knowledge with the community</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-2 block">Type</label>
                    <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="heritage_site">Heritage Site</SelectItem>
                        <SelectItem value="historical_fact">Historical Fact</SelectItem>
                        <SelectItem value="local_legend">Local Legend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-2 block">Title *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Name of site, fact, or legend"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-2 block">Description *</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Provide detailed information..."
                      rows={5}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-2 block">Location</label>
                    <Input
                      value={formData.location_name}
                      onChange={(e) => setFormData({...formData, location_name: e.target.value})}
                      placeholder="City, State, Country"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-stone-700 mb-2 block">Latitude</label>
                      <Input
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                        placeholder="e.g., 28.6139"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-stone-700 mb-2 block">Longitude</label>
                      <Input
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                        placeholder="e.g., 77.2090"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-2 block">Image (optional)</label>
                    <ImageUploader
                      onImageSelect={handleImageSelect}
                      isUploading={false}
                      preview={preview}
                      onClear={handleClear}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || submitSuccess}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting & Moderating...
                      </>
                    ) : submitSuccess ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Submitted Successfully!
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit for Review
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* My Contributions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="border-2 border-stone-200">
              <CardHeader>
                <CardTitle>Your Contributions</CardTitle>
                <CardDescription>Track your submissions and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {contributions.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                    <p className="text-stone-500">No contributions yet</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {contributions.map((contrib) => (
                      <div
                        key={contrib.id}
                        className="p-4 border-2 border-stone-200 rounded-xl hover:border-indigo-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-stone-800">{contrib.title}</h4>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border-2 ${statusColors[contrib.status]}`}>
                            {statusIcons[contrib.status]}
                            {contrib.status}
                          </div>
                        </div>
                        <p className="text-sm text-stone-600 line-clamp-2 mb-2">{contrib.description}</p>
                        {contrib.location_name && (
                          <p className="text-xs text-stone-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {contrib.location_name}
                          </p>
                        )}
                        {contrib.ai_moderation_result && (
                          <div className="mt-3 p-3 bg-stone-50 rounded-lg">
                            <p className="text-xs font-medium text-stone-700 mb-1">AI Feedback:</p>
                            <p className="text-xs text-stone-600">{contrib.ai_moderation_result}</p>
                            {contrib.ai_accuracy_score && (
                              <p className="text-xs text-amber-600 mt-2">
                                Accuracy Score: {contrib.ai_accuracy_score}/10
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
