'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { BoundingBox, POI, SpatialFeatureCollection } from '@/types/geoai';
import { Skeleton } from '@/components/ui/Skeleton';
import { Compass } from 'lucide-react';

interface MapProps {
  bbox: BoundingBox;
  onBboxChange: (newBbox: BoundingBox) => void;
  pois?: POI[];
  polygons?: SpatialFeatureCollection;
  selectedPoi?: POI | null;
  onSelectPoi?: (poi: POI | null) => void;
  className?: string;
}

// Dynamically import MapInner with SSR disabled to prevent Leaflet 'window is not defined' crashes
const DynamicMapInner = dynamic(() => import('@/components/MapInner'), {
  ssr: false,
  loading: () => (
    <div
      role="region"
      aria-label="Loading Interactive Map"
      className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-950 border border-slate-800 relative overflow-hidden"
    >
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-15 pointer-events-none">
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className="border border-slate-700/40" />
        ))}
      </div>
      <div className="z-10 flex flex-col items-center gap-3">
        <div className="p-3 rounded-full bg-slate-900 border border-slate-800 shadow-xl animate-pulse">
          <Compass className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-400">Initializing WebGIS Spatial Engine...</p>
      </div>
    </div>
  ),
});

export default function Map(props: MapProps) {
  return <DynamicMapInner {...props} />;
}
