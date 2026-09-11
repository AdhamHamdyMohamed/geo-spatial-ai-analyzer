import { BoundingBox, SpatialAnalysisResponse } from '@/types/geoai';

/**
 * Generates realistic context-aware spatial analysis data strictly within
 * the requested geographic bounding box. Used for development, offline usage,
 * and resilient fallback if API keys are not set or rates are exceeded.
 */
export function generateMockSpatialAnalysis(
  bbox: BoundingBox,
  prompt: string
): SpatialAnalysisResponse {
  const [minLat, minLng, maxLat, maxLng] = bbox;
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const latSpan = Math.abs(maxLat - minLat);
  const lngSpan = Math.abs(maxLng - minLng);

  // Normalize prompt for dynamic scoring
  const lowerPrompt = prompt.toLowerCase();
  let score = 78;
  let topic = 'Urban Accessibility & Mobility';

  if (lowerPrompt.includes('safe') || lowerPrompt.includes('risk')) {
    score = 64;
    topic = 'Public Safety & Risk Assessment';
  } else if (lowerPrompt.includes('walk') || lowerPrompt.includes('pedestrian')) {
    score = 86;
    topic = 'Pedestrian Walkability & Micro-mobility';
  } else if (lowerPrompt.includes('transit') || lowerPrompt.includes('transport')) {
    score = 82;
    topic = 'Multimodal Public Transit Connectivity';
  } else if (lowerPrompt.includes('green') || lowerPrompt.includes('park')) {
    score = 71;
    topic = 'Ecological Buffers & Green Canopy Distribution';
  }

  // Generate POIs inside the bounding box
  const pois = [
    {
      id: 'poi-1',
      name: 'Intermodal Transit Hub & Rapid Line',
      category: 'transport',
      lat: Number((centerLat + latSpan * 0.15).toFixed(6)),
      lng: Number((centerLng - lngSpan * 0.1).toFixed(6)),
      description: 'High-frequency rail and feeder bus node with universal step-free access.',
      score: 92,
    },
    {
      id: 'poi-2',
      name: 'Civic Healthcare & Emergency Station',
      category: 'healthcare',
      lat: Number((centerLat - latSpan * 0.2).toFixed(6)),
      lng: Number((centerLng + lngSpan * 0.18).toFixed(6)),
      description: '24/7 primary response outpost serving 1.5km pedestrian radius.',
      score: 85,
    },
    {
      id: 'poi-3',
      name: 'Central Canopy Plaza & Bioswale Park',
      category: 'greenery',
      lat: Number((centerLat + latSpan * 0.05).toFixed(6)),
      lng: Number((centerLng + lngSpan * 0.22).toFixed(6)),
      description: 'Protected urban greenway mitigating heat island effects with permeable paving.',
      score: 89,
    },
    {
      id: 'poi-4',
      name: 'Pedestrian Crossing Safety Corridor',
      category: 'safety',
      lat: Number((centerLat - latSpan * 0.12).toFixed(6)),
      lng: Number((centerLng - lngSpan * 0.24).toFixed(6)),
      description: 'High-visibility illuminated refuge island with traffic calming signals.',
      score: 68,
    },
    {
      id: 'poi-5',
      name: 'Mixed-use Retail & Farmer Market District',
      category: 'commercial',
      lat: Number((centerLat + latSpan * 0.25).toFixed(6)),
      lng: Number((centerLng + lngSpan * 0.08).toFixed(6)),
      description: 'High active frontage pedestrian street promoting street vitality.',
      score: 81,
    },
  ];

  // Generate GeoJSON polygons (e.g., transit buffer and high-density pedestrian zone)
  const offset1 = latSpan * 0.25;
  const offset2 = lngSpan * 0.25;

  const polygons: SpatialAnalysisResponse['polygons'] = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: 'Core High-Accessibility Service Zone',
          category: 'accessibility',
          riskLevel: 'low',
          density: 0.88,
          description: '10-minute walk shed with continuous sidewalks and protected bike paths.',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [centerLng - offset2, centerLat - offset1],
              [centerLng + offset2, centerLat - offset1],
              [centerLng + offset2 * 1.2, centerLat + offset1 * 0.8],
              [centerLng - offset2 * 0.8, centerLat + offset1 * 1.1],
              [centerLng - offset2, centerLat - offset1],
            ],
          ],
        },
      },
      {
        type: 'Feature',
        properties: {
          name: 'Low Lighting / Pedestrian Blind Spot',
          category: 'safety',
          riskLevel: 'high',
          density: 0.32,
          description: 'Identified arterial underpass with insufficient pedestrian illumination at night.',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [centerLng - offset2 * 1.6, centerLat + offset1 * 0.2],
              [centerLng - offset2 * 1.1, centerLat + offset1 * 0.3],
              [centerLng - offset2 * 1.0, centerLat + offset1 * 0.7],
              [centerLng - offset2 * 1.5, centerLat + offset1 * 0.6],
              [centerLng - offset2 * 1.6, centerLat + offset1 * 0.2],
            ],
          ],
        },
      },
    ],
  };

  return {
    summary: `Comprehensive spatial evaluation for ${topic} across selected area [${minLat.toFixed(3)}, ${minLng.toFixed(3)} to ${maxLat.toFixed(3)}, ${maxLng.toFixed(3)}]. Strong multimodal infrastructure is present in the core quadrant, while secondary arterials require pedestrian crossing reinforcements.`,
    score,
    pois,
    recommendations: [
      'Implement smart LED street lighting along the western underpass corridor to mitigate nighttime vulnerability.',
      'Introduce mid-block raised crosswalks and curb extensions between the transit hub and commercial market.',
      'Expand the urban tree canopy buffer by 25% to counteract surface heat retention during peak summer months.',
      'Deploy localized micro-mobility docking stations within 200m of the intermodal transit center.',
    ],
    polygons,
    metadata: {
      bbox,
      timestamp: new Date().toISOString(),
      isMockFallback: true,
      provider: 'GeoAI Spatial Engine (Resilient Fallback Mode)',
    },
  };
}
