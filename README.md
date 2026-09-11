# GeoAI Spatial Assistant

A production-grade WebGIS AI application built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Leaflet (`react-leaflet`)**, **Lucide React**, and the **Anthropic Claude API (`@anthropic-ai/sdk`)**.

---

## Features

1. **Interactive Dark-Mode WebGIS Map (`/components/Map.tsx` & `/components/MapInner.tsx`)**:
   - CartoDB Dark Matter tile layer.
   - Interactive bounding-box selector: click two corners to select any geographic area on Earth.
   - Dynamic GeoJSON rendering for risk zones, density buffers, and urban catchments.
   - Custom accessible SVG POI markers with category-themed colors and tooltips.
   - SSR-safe dynamic loading preventing client-side `window is not defined` errors.

2. **AI Spatial Query Sidebar (`/components/Sidebar.tsx`)**:
   - Natural language queries (e.g., walkability, safety, transit coverage, micro-mobility).
   - Quick preset query chips with single-click activation.
   - Character count limit (500 chars) preventing token abuse.
   - Accessible pulse skeleton loaders during inference execution.

3. **Production Next.js API Route (`/app/api/analyze/route.ts`)**:
   - Validates coordinates and enforces bounds `[-90, 90]` lat and `[-180, 180]` lng.
   - Calls Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`) with structured JSON schema.
   - Resilient automatic fallback mode when `ANTHROPIC_API_KEY` is missing or when timeouts/rate limits occur.

4. **Analytics Panel (`/components/AnalyticsPanel.tsx`)**:
   - Dynamic accessibility index score badge (0-100) with color grading.
   - Executive spatial summary and bulleted planning recommendations.
   - Interactive POI list: clicking pans and zooms the map directly to the target location.

5. **Accessibility & Performance**:
   - `prefers-reduced-motion` detection disabling `flyTo` transitions for motion-sensitive users.
   - Full keyboard navigation and ARIA landmarks (`role="region"`, `aria-busy`, `aria-label`).

---

## Quickstart

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Set your Anthropic API Key
cp .env.example .env.local
# Add your key to .env.local:
# ANTHROPIC_API_KEY=sk-ant-...

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
