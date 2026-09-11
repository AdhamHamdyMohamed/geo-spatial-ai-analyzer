'use client';

import React, { useState } from 'react';
import { POI, SpatialAnalysisResponse } from '@/types/geoai';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Info,
  MapPin,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Crosshair,
  Layers,
  Filter,
} from 'lucide-react';

interface AnalyticsPanelProps {
  data: SpatialAnalysisResponse | null;
  isLoading: boolean;
  selectedPoi: POI | null;
  onSelectPoi: (poi: POI | null) => void;
  className?: string;
}

export default function AnalyticsPanel({
  data,
  isLoading,
  selectedPoi,
  onSelectPoi,
  className = '',
}: AnalyticsPanelProps) {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Loading Skeleton State
  if (isLoading) {
    return (
      <section
        role="region"
        aria-label="Spatial Analysis Results"
        aria-busy="true"
        className={`flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100 p-5 overflow-y-auto ${className}`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
        <div className="mt-5 space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </section>
    );
  }

  // Empty / Prompt State
  if (!data) {
    return (
      <section
        role="region"
        aria-label="Spatial Analysis Results"
        className={`flex flex-col items-center justify-center h-full bg-slate-900 border-l border-slate-800 text-slate-400 p-6 text-center ${className}`}
      >
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 mb-4 text-emerald-400 shadow-xl">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-200">No Spatial Analysis Generated Yet</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-[260px] leading-relaxed">
          Choose a bounding box on the map and click <strong className="text-slate-300">Run Spatial AI Analysis</strong> to evaluate urban accessibility, safety, and infrastructure.
        </p>
      </section>
    );
  }

  const { score, summary, recommendations, pois, metadata } = data;

  // Score Badge Color Styling
  const getScoreColor = (val: number) => {
    if (val >= 80) {
      return {
        bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
        ring: 'ring-emerald-500/30',
        label: 'Optimal / High Quality',
      };
    }
    if (val >= 50) {
      return {
        bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
        ring: 'ring-amber-500/30',
        label: 'Moderate / Needs Infill',
      };
    }
    return {
      bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
      ring: 'ring-rose-500/30',
      label: 'Deficit / High Risk',
    };
  };

  const scoreMeta = getScoreColor(score);

  // Extract unique categories for filtering
  const categories = ['all', ...Array.from(new Set(pois.map((p) => p.category)))];

  const filteredPois =
    activeCategoryFilter === 'all'
      ? pois
      : pois.filter((p) => p.category.toLowerCase() === activeCategoryFilter.toLowerCase());

  return (
    <section
      role="region"
      aria-label="Spatial Analysis Results"
      className={`flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-100 p-4 sm:p-5 overflow-y-auto ${className}`}
    >
      {/* Header & Score Badge */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Evaluation Report
          </span>
          <h2 className="text-base font-bold text-white mt-0.5">Spatial Synthesis</h2>
        </div>

        {/* Dynamic Accessibility Score Pill */}
        <div
          aria-label={`Accessibility Score: ${score} out of 100 (${scoreMeta.label})`}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm ${scoreMeta.bg}`}
        >
          <div className="flex flex-col items-end leading-none">
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Index</span>
            <span className="text-lg font-black">{score}</span>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
        </div>
      </div>

      {/* Provider & Fallback status notice */}
      {metadata?.isMockFallback && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Offline Fallback Mode: Generated with mock spatial heuristics. Provide ANTHROPIC_API_KEY for live Claude inferences.</span>
        </div>
      )}

      {/* Executive Summary Card */}
      <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          Executive Spatial Summary
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {summary}
        </p>
      </div>

      {/* Actionable Recommendations */}
      <div className="mt-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          Spatial Planning Recommendations
        </h3>
        <ul className="space-y-2">
          {recommendations.map((rec, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-xs text-slate-300"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* AI Identified POIs */}
      <div className="mt-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            Identified POIs ({filteredPois.length})
          </h3>

          {/* Category Filter */}
          {categories.length > 2 && (
            <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-2 py-0.5 rounded capitalize transition-all ${
                    activeCategoryFilter === cat
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* POI Interactive Cards */}
        <div className="space-y-2 overflow-y-auto max-h-[340px] pr-1">
          {filteredPois.map((poi, idx) => {
            const isSelected = selectedPoi?.name === poi.name;

            return (
              <div
                key={poi.id || idx}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => onSelectPoi(poi)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectPoi(poi);
                  }
                }}
                className={`group p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-400'
                    : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {poi.category}
                      </span>
                      {poi.score !== undefined && (
                        <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                          Score: {poi.score}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                      {poi.name}
                    </h4>
                  </div>

                  <button
                    type="button"
                    title="Zoom to location"
                    aria-label={`Zoom to ${poi.name}`}
                    className="p-1.5 rounded-lg bg-slate-800/60 text-slate-400 group-hover:text-emerald-400 group-hover:bg-slate-800 transition-colors"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                  </button>
                </div>

                {poi.description && (
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                    {poi.description}
                  </p>
                )}

                <div className="mt-2 text-[10px] font-mono text-slate-400 flex items-center gap-2">
                  <span>Lat: {poi.lat.toFixed(4)}</span>
                  <span>Lng: {poi.lng.toFixed(4)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
