export type BoundingBox = [number, number, number, number]; // [minLat, minLng, maxLat, maxLng]

export type POICategory =
  | 'transport'
  | 'safety'
  | 'amenity'
  | 'greenery'
  | 'commercial'
  | 'healthcare'
  | 'education';

export interface POI {
  id?: string;
  name: string;
  category: POICategory | string;
  lat: number;
  lng: number;
  description?: string;
  score?: number;
}

export interface SpatialPolygonFeature {
  type: 'Feature';
  properties: {
    name: string;
    category?: string;
    riskLevel?: 'low' | 'medium' | 'high';
    density?: number;
    description?: string;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][]; // GeoJSON format: [[[lng, lat], ...]]
  };
}

export interface SpatialFeatureCollection {
  type: 'FeatureCollection';
  features: SpatialPolygonFeature[];
}

export interface SpatialAnalysisResponse {
  summary: string;
  score: number; // 0 - 100
  pois: POI[];
  recommendations: string[];
  polygons?: SpatialFeatureCollection;
  metadata?: {
    bbox: BoundingBox;
    timestamp: string;
    isMockFallback?: boolean;
    provider?: string;
  };
}

export interface SpatialAnalysisRequest {
  bbox: BoundingBox;
  prompt: string;
}
