import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
  Compass, 
  Languages, 
  Sparkles, 
  ArrowRight,
  Camera,
  BookOpen,
  Users,
  Globe,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import GamificationPanel from '@/components/gamification/GamificationPanel';

export default function Home() {
  const features = [
    {
      icon: Camera,
      title: 'AI Heritage Scanner',
      description: 'Upload images of monuments and temples to discover their history, mythology, and cultural significance.',
      link: 'HeritageScanner',
      color: 'amber'
    },
    {
      icon: BookOpen,
      title: 'Ancient Text Translator',
      description: 'Translate ancient inscriptions and texts into modern language with cultural context.',
      link: 'TextTranslator',
      color: 'rose'
    }
  ];

  const stats = [
    { icon: Users, value: 'Students', label: 'Designed for learners' },
    { icon: Globe, value: 'Accessible', label: 'For all communities' },
    { icon: Sparkles, value: 'AI-Powered', label: 'Google Gemini' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-rose-50" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1548013146-72479768bada?w=1920')] bg-cover bg-center opacity-5" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full text-amber-700 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Powered by Google Gemini AI
            </div>
            
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-stone-800 leading-tight">
              Discover the Stories Behind{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-rose-500">
                Ancient Wonders
              </span>
            </h1>
            
            <p className="mt-6 text-lg md:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed">
              MythiLens uses AI to unlock the mysteries of cultural heritage, 
              making ancient history accessible and engaging for everyone.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={createPageUrl('ForYou')}>
                <Button size="lg" className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-purple-200 gap-2">
                  <TrendingUp className="w-5 h-5" />
                  For You
                </Button>
              </Link>
              <Link to={createPageUrl('HeritageScanner')}>
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-amber-200 gap-2">
                  <Compass className="w-5 h-5" />
                  Scan Heritage
                </Button>
              </Link>
              <Link to={createPageUrl('TextTranslator')}>
                <Button size="lg" variant="outline" className="border-2 border-stone-300 px-8 py-6 text-lg rounded-xl gap-2">
                  <Languages className="w-5 h-5" />
                  Translate Texts
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#FAF8F5] to-transparent" />
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-stone-800">
              Two Powerful AI Modules
            </h2>
            <p className="mt-4 text-stone-600 max-w-2xl mx-auto">
              Explore cultural heritage through cutting-edge AI technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Link to={createPageUrl(feature.link)}>
                  <div className={`
                    group relative overflow-hidden rounded-3xl p-8 md:p-10
                    bg-white border-2 border-stone-200
                    hover:border-${feature.color}-300 hover:shadow-2xl hover:shadow-${feature.color}-100
                    transition-all duration-500
                  `}>
                    <div className={`
                      inline-flex p-4 rounded-2xl mb-6
                      ${feature.color === 'amber' ? 'bg-amber-100' : 'bg-rose-100'}
                    `}>
                      <feature.icon className={`w-8 h-8 ${feature.color === 'amber' ? 'text-amber-600' : 'text-rose-600'}`} />
                    </div>
                    
                    <h3 className="font-display text-2xl font-bold text-stone-800 mb-3">
                      {feature.title}
                    </h3>
                    
                    <p className="text-stone-600 leading-relaxed mb-6">
                      {feature.description}
                    </p>

                    <div className={`
                      inline-flex items-center gap-2 font-medium
                      ${feature.color === 'amber' ? 'text-amber-600' : 'text-rose-600'}
                      group-hover:gap-4 transition-all duration-300
                    `}>
                      Try Now
                      <ArrowRight className="w-5 h-5" />
                    </div>

                    {/* Decorative corner */}
                    <div className={`
                      absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-10
                      ${feature.color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}
                    `} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 mb-4">
                  <stat.icon className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-stone-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gamification Panel */}
      <section className="py-8 md:py-12 bg-gradient-to-br from-amber-50 via-purple-50 to-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <GamificationPanel />
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 rounded-full text-rose-700 text-sm font-medium mb-6">
                Our Mission
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-stone-800 mb-6">
                Making Heritage Education Accessible to Everyone
              </h2>
              <p className="text-stone-600 leading-relaxed mb-6">
                MythiLens bridges the gap between ancient knowledge and modern learners. 
                Using Google's powerful Gemini AI, we transform complex historical information 
                into engaging, student-friendly content.
              </p>
              <p className="text-stone-600 leading-relaxed">
                Our platform is designed especially for students and underserved communities, 
                ensuring that cultural heritage education is no longer limited by geography or resources.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800"
                  alt="Ancient temple"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 p-6 bg-white rounded-2xl shadow-2xl max-w-xs">
                <p className="text-stone-600 text-sm italic">
                  "Preserving the past, inspiring the future through AI"
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
