'use client';

import React, { useState } from 'react';
import { BoundingBox } from '@/types/geoai';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Sparkles,
  MapPin,
  Send,
  Sliders,
  Footprints,
  Bus,
  ShieldAlert,
  Trees,
  HelpCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface SidebarProps {
  bbox: BoundingBox;
  onSubmitQuery: (prompt: string) => void;
  isLoading: boolean;
  className?: string;
}

const PRESET_QUERIES = [
  {
    label: 'Walkability Index',
    prompt: 'Evaluate pedestrian sidewalk connectivity, crosswalk density, and 15-minute neighborhood walkability for this area.',
    icon: Footprints,
  },
  {
    label: 'Public Transport Coverage',
    prompt: 'Analyze public transit frequency, multi-modal stop distribution, and last-mile connectivity gaps.',
    icon: Bus,
  },
  {
    label: 'Safety & Risk Analysis',
    prompt: 'Identify urban blind spots, night lighting deficiencies, and recommended safety refuge corridors.',
    icon: ShieldAlert,
  },
  {
    label: 'Green Canopy & Park Access',
    prompt: 'Examine urban park accessibility, open green canopy distribution, and heat island mitigation zones.',
    icon: Trees,
  },
];

const MAX_PROMPT_CHARS = 500;

export default function Sidebar({
  bbox,
  onSubmitQuery,
  isLoading,
  className = '',
}: SidebarProps) {
  const [prompt, setPrompt] = useState(
    'Analyze safety, urban services, and accessibility for this area.'
  );

  const [minLat, minLng, maxLat, maxLng] = bbox;
  const isOverLimit = prompt.length > MAX_PROMPT_CHARS;
  const isDisabled = isLoading || prompt.trim().length === 0 || isOverLimit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDisabled) {
      onSubmitQuery(prompt.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!isDisabled) {
        onSubmitQuery(prompt.trim());
      }
    }
  };

  return (
    <aside
      role="region"
      aria-label="AI Spatial Query Panel"
      aria-busy={isLoading}
      className={`flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-100 p-4 sm:p-5 overflow-y-auto ${className}`}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            GeoAI Spatial Assistant
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Next-Gen Urban Intelligence & WebGIS
          </p>
        </div>
      </div>

      {/* Active Bounding Box Coordinate Pill */}
      <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span className="flex items-center gap-1.5 font-semibold text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            Active Bounding Box
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
            WGS84
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
          <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
            <span className="text-slate-500 mr-1">SW:</span>
            {minLat.toFixed(4)}, {minLng.toFixed(4)}
          </div>
          <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
            <span className="text-slate-500 mr-1">NE:</span>
            {maxLat.toFixed(4)}, {maxLng.toFixed(4)}
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          Use the map's <span className="text-slate-300 font-medium">Select Bounding Box</span> tool to adjust the spatial analysis envelope.
        </p>
      </div>

      {/* Quick Preset Queries */}
      <div className="mt-5">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          Preset Query Templates
        </label>
        <div className="grid grid-cols-1 gap-1.5">
          {PRESET_QUERIES.map((preset) => {
            const Icon = preset.icon;
            const isSelected = prompt === preset.prompt;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => setPrompt(preset.prompt)}
                disabled={isLoading}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-all border ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-medium'
                    : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="truncate">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Natural Language Spatial Query Input Form */}
      <form onSubmit={handleSubmit} className="mt-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="spatial-query-input"
            className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5"
          >
            Spatial Analysis Query
          </label>
          <span
            className={`text-[11px] font-mono ${
              isOverLimit ? 'text-rose-400 font-bold' : 'text-slate-500'
            }`}
          >
            {prompt.length}/{MAX_PROMPT_CHARS}
          </span>
        </div>

        <textarea
          id="spatial-query-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={4}
          placeholder="Describe your spatial inquiry (e.g., Evaluate walkability, green space canopy, or transit deserts)..."
          className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 transition-all resize-none shadow-inner disabled:opacity-50"
          aria-describedby="query-help-text"
        />

        <div id="query-help-text" className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
          <span>Tip: Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300">Enter</kbd> to analyze</span>
        </div>

        <button
          type="submit"
          disabled={isDisabled}
          className={`mt-4 w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
            isDisabled
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold shadow-emerald-500/20 active:scale-[0.99]'
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>Analyzing Spatial Geometry...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Run Spatial AI Analysis</span>
            </>
          )}
        </button>
      </form>

      {/* Skeleton Loading Feedback State */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Claude Spatial Inference Engine running...</span>
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="pt-2 flex gap-2">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
        </div>
      )}
    </aside>
  );
}
