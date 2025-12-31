import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { 
  Compass, 
  Languages, 
  History, 
  Menu, 
  X, 
  Sparkles,
  Home,
  GitCompare,
  Map,
  Mic,
  Users,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OfflineIndicator from './components/ui/OfflineIndicator';
import InteractiveOnboarding from './components/onboarding/InteractiveOnboarding';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('Service Worker registered'))
        .catch((error) => console.log('Service Worker registration failed:', error));
    }
  }, []);

  const navItems = [
    { name: 'Home', icon: Home, page: 'Home' },
    { name: 'For You', icon: TrendingUp, page: 'ForYou' },
    { name: 'Heritage Scanner', icon: Compass, page: 'HeritageScanner' },
    { name: 'Text Translator', icon: Languages, page: 'TextTranslator' },
    { name: 'Voice Search', icon: Mic, page: 'VoiceMonumentSearch' },
    { name: 'Discover Nearby', icon: Map, page: 'DiscoverNearby' },
    { name: 'Compare', icon: GitCompare, page: 'CompareAnalysis' },
    { name: 'Community', icon: Users, page: 'CommunityContributions' },
    { name: 'History', icon: History, page: 'History' },
    { name: 'Settings', icon: Sparkles, page: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <InteractiveOnboarding onComplete={() => setShowTour(false)} />
      <OfflineIndicator />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        
        :root {
          --color-amber: #D4A853;
          --color-burgundy: #8B2635;
          --color-cream: #FAF8F5;
          --color-charcoal: #2D2D2D;
        }
        
        body {
          font-family: 'Inter', sans-serif;
        }
        
        .font-display {
          font-family: 'Playfair Display', serif;
        }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-200">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-2xl font-bold text-stone-800">
                MythiLens
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                    transition-all duration-200
                    ${currentPageName === item.page
                      ? 'bg-amber-100 text-amber-700'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-800'
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-stone-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-stone-600" />
              ) : (
                <Menu className="w-6 h-6 text-stone-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-stone-200 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                      transition-all duration-200
                      ${currentPageName === item.page
                        ? 'bg-amber-100 text-amber-700'
                        : 'text-stone-600 hover:bg-stone-100'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="pt-16 md:pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-white">
                MythiLens
              </span>
            </div>
            <p className="text-sm">
              Powered by Google Gemini AI • Making heritage accessible
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
