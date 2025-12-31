import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Compass, AlertCircle, Loader2, Clock, Map as MapIcon, Star, TrendingUp, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function DiscoverNearby() {
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [nearbySites, setNearbySites] = useState([]);
  const [recommendedSites, setRecommendedSites] = useState([]);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);

  // Fetch all heritage analyses
  const { data: allSites = [] } = useQuery({
    queryKey: ['heritage-analyses'],
    queryFn: () => base44.entities.HeritageAnalysis.list('-created_date', 1000),
  });

  // Fetch user's saved sites
  const { data: userSavedSites = [] } = useQuery({
    queryKey: ['user-saved-sites'],
    queryFn: async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) return [];
      const user = await base44.auth.me();
      return base44.entities.HeritageAnalysis.filter({ created_by: user.email }, '-created_date', 100);
    },
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        setIsGettingLocation(false);
        generateAIRecommendations(location);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied. Please enable location access.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // AI-powered recommendation engine
  const generateAIRecommendations = async (location) => {
    setIsGeneratingRecommendations(true);
    
    try {
      // Build context from user's saved sites
      const userInterests = userSavedSites.map(site => ({
        title: site.title,
        type: site.architecture || 'heritage site',
        mythology: site.mythology
      }));

      const prompt = `You are a heritage discovery AI. Find REAL heritage sites near GPS coordinates ${location.lat}, ${location.lng} within ${searchRadius * 2} km.

${userInterests.length > 0 ? `User has shown interest in these sites previously:
${userInterests.map(s => `- ${s.title} (${s.type})`).join('\n')}

Prioritize similar sites based on architectural style, mythology, and cultural themes.` : ''}

IMPORTANT:
1. Use Google Maps/Places data to provide REAL sites that exist
2. Recommend based on:
   - Proximity to user location
   - Popularity and cultural significance
   - Similarity to user's saved sites
   - Mythological connections
   - Architectural style
3. Provide 10-20 diverse recommendations ranked by relevance

For each site:
- name: Official name
- description: Brief cultural/historical significance
- latitude: Exact GPS latitude
- longitude: Exact GPS longitude
- type: temple/monument/fort/archaeological site
- popularity_score: 1-10 (based on significance)
- mythology_connection: Any relevant myths/legends
- recommended_reason: Why this site matches user's interests`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            sites: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                  type: { type: "string" },
                  popularity_score: { type: "number" },
                  mythology_connection: { type: "string" },
                  recommended_reason: { type: "string" }
                }
              }
            }
          }
        }
      });

      const sitesWithDistance = (result.sites || []).map(site => ({
        ...site,
        distance: calculateDistance(location.lat, location.lng, site.latitude, site.longitude)
      })).sort((a, b) => {
        // Sort by combination of distance and popularity
        const scoreA = (a.distance / searchRadius) * 0.4 + (10 - a.popularity_score) * 0.6;
        const scoreB = (b.distance / searchRadius) * 0.4 + (10 - b.popularity_score) * 0.6;
        return scoreA - scoreB;
      });

      setRecommendedSites(sitesWithDistance);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  // Filter nearby sites from database
  useEffect(() => {
    if (userLocation && allSites.length > 0) {
      const nearby = allSites
        .filter(site => site.latitude && site.longitude)
        .map(site => ({
          ...site,
          distance: calculateDistance(
            userLocation.lat,
            userLocation.lng,
            site.latitude,
            site.longitude
          )
        }))
        .filter(site => site.distance <= searchRadius)
        .sort((a, b) => a.distance - b.distance);
      
      setNearbySites(nearby);
    }
  }, [userLocation, allSites, searchRadius]);

  return (
    <div className="discover-nearby-container min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 bg-amber-100 px-6 py-3 rounded-full mb-6">
            <Navigation className="w-5 h-5 text-amber-700" />
            <span className="text-amber-700 font-medium">AI-Powered Discovery</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-stone-800 mb-4">
            Discover Nearby Heritage
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto">
            Get personalized recommendations based on your interests, location, and popular sites.
          </p>
        </motion.div>

        {/* Location Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Button
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <Compass className="w-5 h-5" />
                    Check My Surroundings
                  </>
                )}
              </Button>
              
              <div className="flex items-center gap-2">
                <label className="text-sm text-stone-600">Radius:</label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm text-stone-600">km</span>
              </div>
            </div>

            {userLocation && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">
                <MapPin className="w-4 h-4" />
                <span>Location active</span>
              </div>
            )}
          </div>

          {locationError && (
            <div className="mt-4 flex items-start gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{locationError}</p>
            </div>
          )}
        </motion.div>

        {/* Map and Results */}
        {userLocation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-8"
          >
            {/* Map with Clustering */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 bg-stone-50 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-stone-600" />
                  <h3 className="font-semibold text-stone-800">Interactive Map</h3>
                </div>
              </div>
              <div className="h-96">
                <MapContainer
                  center={[userLocation.lat, userLocation.lng]}
                  zoom={11}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  
                  <Circle
                    center={[userLocation.lat, userLocation.lng]}
                    radius={searchRadius * 1000}
                    pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                  />
                  <Marker position={[userLocation.lat, userLocation.lng]}>
                    <Popup>📍 You are here</Popup>
                  </Marker>

                  <MarkerClusterGroup chunkedLoading>
                    {nearbySites.map((site) => (
                      <Marker key={site.id} position={[site.latitude, site.longitude]}>
                        <Popup>
                          <div className="p-2">
                            <h4 className="font-semibold">{site.title}</h4>
                            <p className="text-sm text-stone-600">{site.distance.toFixed(1)} km away</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {recommendedSites.map((place, idx) => (
                      <Marker key={`rec-${idx}`} position={[place.latitude, place.longitude]}>
                        <Popup>
                          <div className="p-2">
                            <h4 className="font-semibold">{place.name}</h4>
                            <p className="text-xs text-stone-600 mt-1">{place.type}</p>
                            {place.popularity_score >= 7 && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                <span className="text-xs text-amber-600">Popular</span>
                              </div>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MarkerClusterGroup>
                </MapContainer>
              </div>
            </div>

            {/* Results List */}
            <div className="space-y-6">
              {/* AI Recommendations */}
              {isGeneratingRecommendations ? (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-4" />
                  <p className="text-stone-600">Generating personalized recommendations...</p>
                </div>
              ) : recommendedSites.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                    AI Recommended Sites ({recommendedSites.length})
                  </h3>
                  <div className="space-y-4">
                    {recommendedSites.slice(0, 10).map((place, idx) => (
                      <Link
                        key={idx}
                        to={`${createPageUrl('SiteDetails')}?name=${encodeURIComponent(place.name)}&lat=${place.latitude}&lng=${place.longitude}&type=${encodeURIComponent(place.type)}`}
                        className="block p-4 border-2 border-stone-200 rounded-xl hover:border-amber-300 hover:bg-amber-50/30 transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shrink-0">
                            <span className="text-white font-semibold text-sm">{idx + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-semibold text-stone-800">{place.name}</h4>
                              {place.popularity_score >= 7 && (
                                <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-full">
                                  <Star className="w-3 h-3 text-amber-600 fill-amber-600" />
                                  <span className="text-xs text-amber-700 font-medium">Popular</span>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-stone-600 mt-1">{place.description}</p>
                            {place.recommended_reason && (
                              <p className="text-sm text-emerald-700 mt-2 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {place.recommended_reason}
                              </p>
                            )}
                            {place.mythology_connection && (
                              <p className="text-sm text-amber-700 mt-2 bg-amber-50 px-3 py-1.5 rounded-lg">
                                🕉️ {place.mythology_connection}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-stone-500">
                              <span>📍 {place.type}</span>
                              <span>📏 {place.distance.toFixed(1)} km away</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Your Scanned Sites Nearby */}
              {nearbySites.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-emerald-600" />
                    Your Saved Sites Nearby ({nearbySites.length})
                  </h3>
                  <div className="space-y-3">
                    {nearbySites.slice(0, 5).map((site) => (
                      <Link
                        key={site.id}
                        to={createPageUrl('HeritageScanner')}
                        className="block p-4 border-2 border-stone-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-stone-800">{site.title}</h4>
                            <p className="text-sm text-stone-600 mt-1">{site.location_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-emerald-600">
                              {site.distance.toFixed(1)} km
                            </p>
                            <p className="text-xs text-stone-500">away</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Initial State */}
        {!userLocation && !locationError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-lg p-12 text-center"
          >
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Navigation className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="text-2xl font-semibold text-stone-800 mb-4">
              Enable Location to Discover
            </h3>
            <p className="text-stone-600 mb-8 max-w-md mx-auto">
              Get AI-powered recommendations based on your location, interests, and popular heritage sites.
            </p>
            <Button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="bg-amber-600 hover:bg-amber-700 text-white text-lg px-8 py-6"
            >
              <Compass className="w-6 h-6 mr-2" />
              Get Started
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
