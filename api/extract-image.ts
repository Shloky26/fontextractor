import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import type { ExtractedFont } from '../src/types/font.ts';

const MODEL_CANDIDATES = [
  'gemini-3.8-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

function isTransientDemandError(err: unknown): boolean {
  const text =
    err instanceof Error
      ? `${err.message} ${JSON.stringify(err)}`
      : String(err ?? '');
  return (
    text.includes('503') ||
    text.includes('UNAVAILABLE') ||
    text.includes('high demand') ||
    text.includes('429') ||
    text.includes('RESOURCE_EXHAUSTED')
  );
}

async function generateFontMatchWithFallback(
  ai: GoogleGenAI,
  cleanBase64: string,
  mimeType: string,
) {
  const requestPayload = {
    contents: {
      parts: [
        {
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        },
        {
          text: `Inspect all prominent typography visible in this image. Identify up to 3 distinct typefaces or closest matching web/foundry fonts (such as Playfair Display, Fraunces, Plus Jakarta Sans, DM Sans, Barlow Condensed, JetBrains Mono, IBM Plex Mono, Helvetica Neue, Futura, Garamond, Bodoni Moda, Oswald, Outfit, Syne). For each detected font, determine its role (Primary Heading, Body Copy, Monospace / Code, Display / Accent), confidence score (72 to 98), classification, observed weights, style, fallback stack, a short phrase from the image using that font, and concise letterform geometry notes (e.g. x-height, terminal shape, stroke contrast).`,
        },
      ],
    },
    config: {
      systemInstruction:
        'You are a senior typographer and font identification engine. Analyze letterform geometry accurately and return concise structured JSON with real typeface matches.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matches: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                family: { type: Type.STRING },
                role: { type: Type.STRING },
                confidence: { type: Type.INTEGER },
                classification: { type: Type.STRING },
                weights: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                styles: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                fallbackStack: { type: Type.STRING },
                observedSample: { type: Type.STRING },
                letterformNotes: { type: Type.STRING },
              },
              required: [
                'family',
                'role',
                'confidence',
                'classification',
                'weights',
                'styles',
                'fallbackStack',
                'observedSample',
                'letterformNotes',
              ],
            },
          },
        },
        required: ['matches'],
      },
    },
  };

  let lastError: unknown;
  for (const model of MODEL_CANDIDATES) {
    try {
      return await ai.models.generateContent({
        model,
        ...requestPayload,
      });
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  const startedAt = Date.now();

  try {
    const { imageBase64, mimeType, fileName } = (req.body || {}) as {
      imageBase64?: string;
      mimeType?: string;
      fileName?: string;
    };

    if (!imageBase64 || !mimeType) {
      res.status(400).json({ error: 'Missing image payload or MIME type.' });
      return;
    }

    const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
    if (!allowedMimeTypes.has(mimeType)) {
      res
        .status(400)
        .json({ error: 'Only PNG, JPG, and WEBP images are supported.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'Image font recognition requires GEMINI_API_KEY to be configured in Vercel Environment Variables.',
      });
      return;
    }

    const cleanBase64 = imageBase64.replace(
      /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
      '',
    );

    const response = await generateFontMatchWithFallback(
      ai,
      cleanBase64,
      mimeType,
    );

    const rawText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawText) as {
      matches?: Array<{
        family: string;
        role: string;
        confidence: number;
        classification: string;
        weights: string[];
        styles: string[];
        fallbackStack: string;
        observedSample: string;
        letterformNotes: string;
      }>;
    };

    const matches = parsed.matches || [];
    if (matches.length === 0) {
      res.status(422).json({
        error:
          'No clear letterforms were detected in this image. Try a sharper crop with higher text contrast.',
      });
      return;
    }

    const fonts: ExtractedFont[] = matches.slice(0, 4).map((m, idx) => {
      const normalizedWeights =
        m.weights && m.weights.length > 0 ? m.weights : ['400', '600'];
      const normalizedStyles =
        m.styles && m.styles.length > 0 ? m.styles : ['normal'];
      const primaryWeight = normalizedWeights[0] || '400';
      const primaryStyle = normalizedStyles[0] || 'normal';
      const fallback = m.fallbackStack || 'sans-serif';
      const plusName = m.family.trim().replace(/\s+/g, '+');
      const encoded = encodeURIComponent(m.family.trim());

      return {
        id: `img-font-${idx}-${m.family.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        family: m.family,
        role:
          m.role === 'Primary Heading' ||
          m.role === 'Body Copy' ||
          m.role === 'Monospace / Code' ||
          m.role === 'Display / Accent'
            ? m.role
            : 'Display / Accent',
        source: 'Visual Match',
        weights: normalizedWeights,
        styles: normalizedStyles,
        fallbackStack: fallback,
        confidence: Math.min(99, Math.max(60, Math.round(m.confidence || 88))),
        classification: m.classification,
        observedSample: m.observedSample,
        letterformNotes: m.letterformNotes,
        cssSnippet: `font-family: '${m.family}', ${fallback};\nfont-weight: ${primaryWeight};\nfont-style: ${primaryStyle};`,
        googleFontsUrl: `https://fonts.google.com/?query=${encoded}`,
        foundryLookupUrl: `https://www.myfonts.com/search?query=${encoded}`,
        importRule: `@import url('https://fonts.googleapis.com/css2?family=${plusName}:wght@${normalizedWeights.join(';')}&display=swap');`,
      };
    });

    res.status(200).json({
      mode: 'image',
      fileName: fileName || 'uploaded-image',
      elapsedMs: Date.now() - startedAt,
      fonts,
    });
  } catch (err) {
    if (isTransientDemandError(err)) {
      res.status(503).json({
        error:
          'The font-matching model is temporarily busy. Please try again in a few seconds.',
      });
      return;
    }

    const message =
      err instanceof Error
        ? err.message
        : 'Unable to analyze typography in this image.';
    res.status(500).json({ error: message });
  }
}
