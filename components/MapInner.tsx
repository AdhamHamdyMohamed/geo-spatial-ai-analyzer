'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Rectangle,
  Marker,
  Popup,
  GeoJSON,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L, { LatLngBoundsExpression, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BoundingBox, POI, SpatialFeatureCollection } from '@/types/geoai';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import {
  Crosshair,
  Layers,
  MapPin,
  Train,
  Shield,
  Heart,
  Trees,
  ShoppingBag,
  Sparkles,
  Info,
} from 'lucide-react';

interface MapInnerProps {
  bbox: BoundingBox;
  onBboxChange: (newBbox: BoundingBox) => void;
  pois?: POI[];
  polygons?: SpatialFeatureCollection;
  selectedPoi?: POI | null;
  onSelectPoi?: (poi: POI | null) => void;
  className?: string;
}

// Category color & icon helper for POIs
function getCategoryMeta(category: string) {
  switch (category.toLowerCase()) {
    case 'transport':
      return { color: '#38bdf8', bg: 'bg-sky-500/20 border-sky-400 text-sky-300' };
    case 'safety':
      return { color: '#f87171', bg: 'bg-rose-500/20 border-rose-400 text-rose-300' };
    case 'healthcare':
      return { color: '#ec4899', bg: 'bg-pink-500/20 border-pink-400 text-pink-300' };
    case 'greenery':
      return { color: '#34d399', bg: 'bg-emerald-500/20 border-emerald-400 text-emerald-300' };
    case 'commercial':
      return { color: '#fbbf24', bg: 'bg-amber-500/20 border-amber-400 text-amber-300' };
    default:
      return { color: '#a78bfa', bg: 'bg-violet-500/20 border-violet-400 text-violet-300' };
  }
}

// Create custom accessible SVG DivIcons
function createCustomPoiIcon(poi: POI, isSelected: boolean) {
  const meta = getCategoryMeta(poi.category);
  const size = isSelected ? 38 : 30;
  const stroke = isSelected ? '#ffffff' : meta.color;
  const shadow = isSelected ? 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))';

  const html = `
    <div 
      tabindex="0"
      role="button"
      aria-label="POI: ${poi.name}, Category: ${poi.category}"
      style="
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #0f172a;
        border: 2px solid ${stroke};
        border-radius: 9999px;
        filter: ${shadow};
        cursor: pointer;
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      "
      class="hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-400"
    >
      <div style="width: 10px; height: 10px; border-radius: 9999px; background: ${meta.color};"></div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-poi-marker',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Controller to fly to or set view when selected POI or BBox updates
function MapViewController({
  selectedPoi,
  bbox,
}: {
  selectedPoi?: POI | null;
  bbox: BoundingBox;
}) {
  const map = useMap();
  const prefersReducedMotion = usePrefersReducedMotion();

  // Pan to selected POI
  useEffect(() => {
    if (selectedPoi) {
      const target: LatLngExpression = [selectedPoi.lat, selectedPoi.lng];
      if (prefersReducedMotion) {
        map.setView(target, 16, { animate: false });
      } else {
        map.flyTo(target, 16, { duration: 1.2, easeLinearity: 0.25 });
      }
    }
  }, [selectedPoi, map, prefersReducedMotion]);

  return null;
}

// Click listener to select new bounding box or click-to-center
function MapInteractionHandler({
  isSelectingBox,
  onBboxSelected,
  onFinishSelecting,
}: {
  isSelectingBox: boolean;
  onBboxSelected: (bbox: BoundingBox) => void;
  onFinishSelecting: () => void;
}) {
  const [firstCorner, setFirstCorner] = useState<L.LatLng | null>(null);

  useMapEvents({
    click(e) {
      if (!isSelectingBox) return;

      if (!firstCorner) {
        // First click
        setFirstCorner(e.latlng);
      } else {
        // Second click: construct bounding box [minLat, minLng, maxLat, maxLng]
        const minLat = Math.min(firstCorner.lat, e.latlng.lat);
        const maxLat = Math.max(firstCorner.lat, e.latlng.lat);
        const minLng = Math.min(firstCorner.lng, e.latlng.lng);
        const maxLng = Math.max(firstCorner.lng, e.latlng.lng);

        onBboxSelected([minLat, minLng, maxLat, maxLng]);
        setFirstCorner(null);
        onFinishSelecting();
      }
    },
  });

  return null;
}

export default function MapInner({
  bbox,
  onBboxChange,
  pois = [],
  polygons,
  selectedPoi = null,
  onSelectPoi,
  className = '',
}: MapInnerProps) {
  const [isSelectingBox, setIsSelectingBox] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Leaflet rectangle bounds format: [[minLat, minLng], [maxLat, maxLng]]
  const rectangleBounds: LatLngBoundsExpression = useMemo(() => {
    return [
      [bbox[0], bbox[1]],
      [bbox[2], bbox[3]],
    ];
  }, [bbox]);

  // Center of the bounding box for initial view
  const centerLat = (bbox[0] + bbox[2]) / 2;
  const centerLng = (bbox[1] + bbox[3]) / 2;

  // GeoJSON style handler for risk & density polygons
  const geoJsonStyle = (feature: any) => {
    const risk = feature?.properties?.riskLevel;
    if (risk === 'high') {
      return {
        color: '#f43f5e',
        weight: 2,
        dashArray: '4, 4',
        fillColor: '#f43f5e',
        fillOpacity: 0.22,
      };
    }
    if (risk === 'medium') {
      return {
        color: '#f59e0b',
        weight: 2,
        fillColor: '#f59e0b',
        fillOpacity: 0.2,
      };
    }
    return {
      color: '#10b981',
      weight: 2,
      fillColor: '#10b981',
      fillOpacity: 0.22,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties) {
      const { name, riskLevel, density, description } = feature.properties;
      const content = `
        <div class="text-slate-900 font-sans p-1 text-xs">
          <div class="font-bold text-sm mb-1">${name || 'Spatial Zone'}</div>
          ${riskLevel ? `<div><span class="font-semibold">Risk:</span> <span class="capitalize">${riskLevel}</span></div>` : ''}
          ${density !== undefined ? `<div><span class="font-semibold">Density Factor:</span> ${(density * 100).toFixed(0)}%</div>` : ''}
          ${description ? `<div class="mt-1 text-slate-600">${description}</div>` : ''}
        </div>
      `;
      layer.bindPopup(content);
    }
  };

  return (
    <div
      role="region"
      aria-label="Interactive Leaflet Spatial Map"
      className={`relative w-full h-full min-h-[400px] overflow-hidden bg-slate-950 ${className}`}
    >
      {/* Floating Control Toolbar */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setIsSelectingBox(!isSelectingBox)}
          aria-pressed={isSelectingBox}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg shadow-xl backdrop-blur-md transition-all border ${
            isSelectingBox
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-emerald-500/25 ring-2 ring-emerald-300'
              : 'bg-slate-900/90 text-slate-200 border-slate-750 hover:bg-slate-800'
          }`}
          title="Click two corners on the map to define a new bounding box"
        >
          <Crosshair className={`w-4 h-4 ${isSelectingBox ? 'animate-spin' : ''}`} />
          <span>{isSelectingBox ? 'Click 2 Corners to Define Area' : 'Select Bounding Box'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowOverlays(!showOverlays)}
          aria-pressed={showOverlays}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg shadow-xl backdrop-blur-md transition-all border ${
            showOverlays
              ? 'bg-slate-800/90 text-slate-200 border-slate-700'
              : 'bg-slate-900/70 text-slate-400 border-slate-800 line-through'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>GeoJSON Overlay</span>
        </button>

        {prefersReducedMotion && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-md bg-slate-900/90 text-slate-300 border border-slate-800 shadow"
            title="Reduced motion mode is active (animations disabled)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Reduced Motion Active
          </div>
        )}
      </div>

      {/* Instructional helper during box selection */}
      {isSelectingBox && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 bg-emerald-500 text-slate-950 font-semibold text-xs rounded-full shadow-2xl animate-pulse flex items-center gap-2">
          <Info className="w-4 h-4" />
          Click Corner 1, then click Corner 2 to define your geographic query area
        </div>
      )}

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ background: '#090d16' }}
      >
        {/* Dark-theme Tile Layer: CartoDB Dark Matter */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* View and Click Controllers */}
        <MapViewController selectedPoi={selectedPoi} bbox={bbox} />
        <MapInteractionHandler
          isSelectingBox={isSelectingBox}
          onBboxSelected={onBboxChange}
          onFinishSelecting={() => setIsSelectingBox(false)}
        />

        {/* User Selected Bounding Box Rectangle */}
        <Rectangle
          bounds={rectangleBounds}
          pathOptions={{
            color: '#38bdf8',
            weight: 2,
            dashArray: '6, 6',
            fillColor: '#38bdf8',
            fillOpacity: 0.08,
          }}
        />

        {/* GeoJSON Polygons (Risk zones, transit catchments, density buffers) */}
        {showOverlays && polygons && polygons.features.length > 0 && (
          <GeoJSON
            key={JSON.stringify(polygons)}
            data={polygons as any}
            style={geoJsonStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {/* AI Identified POIs */}
        {pois.map((poi, idx) => {
          const isSelected = selectedPoi?.name === poi.name;
          const meta = getCategoryMeta(poi.category);

          return (
            <Marker
              key={poi.id || `poi-${idx}-${poi.lat}-${poi.lng}`}
              position={[poi.lat, poi.lng]}
              icon={createCustomPoiIcon(poi, isSelected)}
              eventHandlers={{
                click: () => onSelectPoi?.(poi),
              }}
            >
              <Popup className="custom-dark-popup">
                <div className="p-1 text-slate-900 font-sans max-w-[220px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {poi.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 leading-snug">
                    {poi.name}
                  </h4>
                  {poi.description && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {poi.description}
                    </p>
                  )}
                  <div className="mt-2 text-[10px] text-slate-400 font-mono">
                    {poi.lat.toFixed(4)}, {poi.lng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
