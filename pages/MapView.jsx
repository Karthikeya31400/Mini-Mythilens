import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import HeritageMap from '@/components/map/HeritageMap';

export default function MapView() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ['heritageSites'],
    queryFn: () => base44.entities.HeritageAnalysis.list('-created_date', 100),
  });

  const filteredSites = sites.filter(site => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      site.title?.toLowerCase().includes(query) ||
      site.location_name?.toLowerCase().includes(query) ||
      site.history?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-sm font-medium mb-4">
            <MapPin className="w-4 h-4" />
            Heritage Map
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-stone-800 mb-4">
            Explore Heritage Sites Worldwide
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Discover and explore analyzed heritage sites on an interactive map
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400" />
            <Input
              placeholder="Search by monument name, location, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg rounded-xl border-2 border-stone-200 focus:border-emerald-400"
            />
          </div>
          <p className="text-sm text-stone-500 mt-2 text-center">
            {filteredSites.length} site{filteredSites.length !== 1 ? 's' : ''} found
          </p>
        </motion.div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            <HeritageMap 
              sites={filteredSites} 
              height="600px"
              zoom={2}
            />
          )}
        </motion.div>

        {/* Stats */}
        {!isLoading && sites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div className="bg-white rounded-xl p-6 border border-stone-200 text-center">
              <p className="text-3xl font-bold text-emerald-600">
                {sites.filter(s => s.latitude && s.longitude).length}
              </p>
              <p className="text-sm text-stone-600 mt-1">Sites Mapped</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-stone-200 text-center">
              <p className="text-3xl font-bold text-amber-600">
                {new Set(sites.map(s => s.location_name).filter(Boolean)).size}
              </p>
              <p className="text-sm text-stone-600 mt-1">Locations</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-stone-200 text-center">
              <p className="text-3xl font-bold text-indigo-600">
                {sites.length}
              </p>
              <p className="text-sm text-stone-600 mt-1">Total Analyses</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-stone-200 text-center">
              <p className="text-3xl font-bold text-rose-600">
                {filteredSites.length}
              </p>
              <p className="text-sm text-stone-600 mt-1">Search Results</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
