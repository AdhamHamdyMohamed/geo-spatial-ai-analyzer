import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { BoundingBox, SpatialAnalysisResponse } from '@/types/geoai';
import { generateMockSpatialAnalysis } from '@/lib/mockData';

// Maximum prompt length to enforce token safety and prevent prompt injection
const MAX_PROMPT_LENGTH = 500;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bbox, prompt } = body as { bbox: BoundingBox; prompt: string };

    // 1. Input Validation: Check Bounding Box coordinates
    if (!bbox || !Array.isArray(bbox) || bbox.length !== 4) {
      return NextResponse.json(
        { error: 'Invalid bounding box payload. Required format: [minLat, minLng, maxLat, maxLng]' },
        { status: 400 }
      );
    }

    const [minLat, minLng, maxLat, maxLng] = bbox.map(Number);
    if (
      isNaN(minLat) ||
      isNaN(minLng) ||
      isNaN(maxLat) ||
      isNaN(maxLng) ||
      minLat < -90 ||
      maxLat > 90 ||
      minLat > maxLat ||
      minLng < -180 ||
      maxLng > 180
    ) {
      return NextResponse.json(
        { error: 'Bounding box coordinates are out of valid geospatial bounds (-90 to 90 lat, -180 to 180 lng).' },
        { status: 400 }
      );
    }

    // 2. Input Validation: Enforce Prompt bounds
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    const sanitizedPrompt = prompt.trim();
    if (sanitizedPrompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `Prompt exceeds maximum character length limit of ${MAX_PROMPT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    // 3. Check for Anthropic API Key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('ANTHROPIC_API_KEY is not defined in environment variables. Providing resilient mock fallback.');
      const fallbackResult = generateMockSpatialAnalysis([minLat, minLng, maxLat, maxLng], sanitizedPrompt);
      return NextResponse.json(fallbackResult, {
        headers: { 'X-Data-Source': 'mock-fallback-missing-key' },
      });
    }

    // 4. Invoke Claude 3.5 Sonnet with strict JSON system constraints
    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = `You are a Senior WebGIS and Urban Spatial AI Analyst.
Given a geographic bounding box [minLat, minLng, maxLat, maxLng] and an analytical query, produce a rigorous, structured spatial assessment.

CRITICAL INSTRUCTIONS:
- You must reply with raw, valid JSON ONLY.
- Do NOT wrap in markdown code blocks (\`\`\`json).
- Every POI (Point of Interest) MUST have "lat" between minLat and maxLat, and "lng" between minLng and maxLng.
- Include 3 to 6 key POIs relevant to the query.
- Include GeoJSON polygon features under "polygons" with type "FeatureCollection", representing risk zones, density clusters, or service catchment buffers inside the bounding box.

Required JSON Schema:
{
  "summary": "Concise 2-3 sentence executive summary of spatial findings for the designated bounds.",
  "score": integer between 0 and 100,
  "pois": [
    {
      "id": "poi-unique-string",
      "name": "Specific facility or place name",
      "category": "transport" | "safety" | "amenity" | "greenery" | "commercial" | "healthcare",
      "lat": float,
      "lng": float,
      "description": "Short explanation of significance to the query",
      "score": integer between 0 and 100
    }
  ],
  "recommendations": [
    "Concrete, high-impact spatial/urban planning recommendation 1",
    "Recommendation 2",
    "Recommendation 3"
  ],
  "polygons": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "name": "Zone Title",
          "riskLevel": "low" | "medium" | "high",
          "density": float (0.0 to 1.0),
          "description": "Short description"
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[lng, lat], [lng, lat], [lng, lat], [lng, lat], [lng, lat]]]
        }
      }
    ]
  }
}`;

    // Use a timeout race to guarantee responsive SLAs
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI API timeout after 15 seconds')), 15000)
    );

    const apiCallPromise = anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Geographic Bounding Box: [minLat: ${minLat}, minLng: ${minLng}, maxLat: ${maxLat}, maxLng: ${maxLng}].
Spatial Query: "${sanitizedPrompt}"`,
        },
      ],
    });

    const completion = await Promise.race([apiCallPromise, timeoutPromise]);

    const contentBlock = completion.content[0];
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected non-text response type received from Claude API');
    }

    // Clean any accidental markdown code fences
    let rawText = contentBlock.text.trim();
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsedData: SpatialAnalysisResponse = JSON.parse(rawText);

    // Attach runtime metadata
    parsedData.metadata = {
      bbox: [minLat, minLng, maxLat, maxLng],
      timestamp: new Date().toISOString(),
      isMockFallback: false,
      provider: 'Anthropic Claude 3.5 Sonnet',
    };

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('[GeoAI API Route Error]:', error);

    // Fallback: If context limits, timeout, rate limits, or parse errors happen,
    // gracefully return the high-fidelity mock data rather than hard crashing the UI.
    try {
      const fallbackData = generateMockSpatialAnalysis(
        [37.765, -122.435, 37.795, -122.395],
        'Spatial analysis resilience fallback'
      );

      return NextResponse.json(
        {
          ...fallbackData,
          metadata: {
            ...fallbackData.metadata,
            isMockFallback: true,
            provider: `Fallback due to: ${error.message || 'API constraint'}`,
          },
        },
        { status: 200, headers: { 'X-Data-Source': 'mock-fallback-error' } }
      );
    } catch {
      return NextResponse.json(
        { error: 'An unexpected internal error occurred while processing the spatial query.' },
        { status: 500 }
      );
    }
  }
}
