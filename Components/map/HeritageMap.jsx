import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { motion } from 'framer-motion';
import { MapPin, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function HeritageMap({ sites, center, zoom = 2, height = '500px', onMarkerClick }) {
  const validSites = useMemo(() => {
    return sites.filter(site => 
      site.latitude != null && 
      site.longitude != null && 
      !isNaN(site.latitude) && 
      !isNaN(site.longitude)
    );
  }, [sites]);

  const mapCenter = center || (validSites.length > 0 
    ? [validSites[0].latitude, validSites[0].longitude]
    : [20, 0]
  );

  if (validSites.length === 0) {
    return (
      <div 
        className="w-full rounded-2xl bg-stone-100 border-2 border-stone-200 flex flex-col items-center justify-center text-stone-500"
        style={{ height }}
      >
        <MapPin className="w-12 h-12 mb-3 text-stone-300" />
        <p className="font-medium">No locations available yet</p>
        <p className="text-sm">Analyze heritage sites to see them on the map</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden border-2 border-stone-200 shadow-lg" style={{ height }}>
      <MapContainer 
        center={mapCenter} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validSites.map((site) => (
          <Marker 
            key={site.id} 
            position={[site.latitude, site.longitude]}
            eventHandlers={{
              click: () => onMarkerClick?.(site)
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-stone-800 mb-2">{site.title}</h3>
                {site.image_url && (
                  <img 
                    src={site.image_url} 
                    alt={site.title}
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
                )}
                <p className="text-sm text-stone-600 mb-2">
                  {site.location_name}
                </p>
                <p className="text-xs text-stone-500 line-clamp-3 mb-3">
                  {site.history?.substring(0, 150)}...
                </p>
                <Link 
                  to={`${createPageUrl('HeritageScanner')}?site=${site.id}`}
                  className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 text-sm font-medium"
                >
                  View Details
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
