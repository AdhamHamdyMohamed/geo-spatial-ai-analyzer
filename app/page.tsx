'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import { BoundingBox, POI, SpatialAnalysisResponse } from '@/types/geoai';
import { generateMockSpatialAnalysis } from '@/lib/mockData';
import {
  AlertCircle,
  Compass,
  Layers,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';

// Dynamic import of Map to ensure 100% SSR-safety
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

// Default area: Downtown San Francisco (dense urban grid, ideal for spatial demonstration)
const INITIAL_BBOX: BoundingBox = [37.765, -122.435, 37.795, -122.395];

export default function GeoAIPage() {
  const [bbox, setBbox] = useState<BoundingBox>(INITIAL_BBOX);
  const [analysis, setAnalysis] = useState<SpatialAnalysisResponse | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Responsive panel collapses for flexible layout
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(true);

  // Load initial spatial analysis on mount
  useEffect(() => {
    const initialData = generateMockSpatialAnalysis(
      INITIAL_BBOX,
      'Analyze safety, urban services, and accessibility for this area.'
    );
    setAnalysis(initialData);
  }, []);

  const handleRunQuery = async (prompt: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSelectedPoi(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bbox, prompt }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with HTTP ${res.status}`);
      }

      const result: SpatialAnalysisResponse = await res.json();
      setAnalysis(result);
      // Auto open analytics panel when new results arrive
      setShowAnalytics(true);
    } catch (err: any) {
      console.error('Spatial Query Failed:', err);
      setErrorMessage(
        err.message || 'Failed to complete spatial analysis. Displaying cached fallback.'
      );
      // Resilient fallback: ensure UI does not break
      const fallback = generateMockSpatialAnalysis(bbox, prompt);
      setAnalysis(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Top Application Bar */}
      <header className="h-14 shrink-0 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">
                GeoAI Spatial Assistant
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                v1.0 Production WebGIS
              </span>
            </div>
          </div>
        </div>

        {/* Layout toggle controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSidebar(!showSidebar)}
            aria-label={showSidebar ? 'Hide Query Sidebar' : 'Show Query Sidebar'}
            title="Toggle Query Sidebar"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1.5 transition-colors"
          >
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            <span className="hidden md:inline">Query Panel</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAnalytics(!showAnalytics)}
            aria-label={showAnalytics ? 'Hide Analytics Panel' : 'Show Analytics Panel'}
            title="Toggle Analytics Panel"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1.5 transition-colors"
          >
            <span className="hidden md:inline">Analytics Panel</span>
            {showAnalytics ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Global Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="bg-rose-500/15 border-b border-rose-500/30 text-rose-300 px-4 py-2 text-xs flex items-center justify-between z-20"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200 underline text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split-View Workspace */}
      <main className="flex-1 flex relative overflow-hidden">
        {/* Left AI Spatial Query Sidebar */}
        {showSidebar && (
          <div className="w-full sm:w-80 md:w-96 shrink-0 h-full z-20 transition-all">
            <Sidebar
              bbox={bbox}
              onSubmitQuery={handleRunQuery}
              isLoading={isLoading}
              className="h-full"
            />
          </div>
        )}

        {/* Center Interactive WebGIS Map Canvas */}
        <div className="flex-1 relative h-full w-full">
          <Map
            bbox={bbox}
            onBboxChange={setBbox}
            pois={analysis?.pois || []}
            polygons={analysis?.polygons}
            selectedPoi={selectedPoi}
            onSelectPoi={setSelectedPoi}
            className="h-full w-full"
          />
        </div>

        {/* Right Spatial Analytics Panel */}
        {showAnalytics && (
          <div className="w-full sm:w-84 md:w-96 shrink-0 h-full z-20 transition-all">
            <AnalyticsPanel
              data={analysis}
              isLoading={isLoading}
              selectedPoi={selectedPoi}
              onSelectPoi={setSelectedPoi}
              className="h-full"
            />
          </div>
        )}
      </main>
    </div>
  );
}
