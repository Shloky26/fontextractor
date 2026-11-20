import type { ExtractionResult } from '../types/font.ts';

export interface SampleUrlPreset {
  label: string;
  url: string;
}

export interface SampleImagePreset {
  id: string;
  label: string;
  subtitle: string;
  imageUrl: string;
  fileName: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const SAMPLE_URL_PRESETS: SampleUrlPreset[] = [
  { label: 'stripe.com', url: 'https://stripe.com' },
  { label: 'vercel.com', url: 'https://vercel.com' },
  { label: 'tailwindcss.com', url: 'https://tailwindcss.com' },
  { label: 'en.wikipedia.org', url: 'https://en.wikipedia.org' },
];

export const SAMPLE_IMAGE_PRESETS: SampleImagePreset[] = [
  {
    id: 'editorial',
    label: 'Editorial Poster',
    subtitle: 'Serif display + neo-grotesque',
    imageUrl: '/src/assets/images/sample_editorial_poster_1795159159490.jpg',
    fileName: 'editorial-poster-specimen.jpg',
  },
  {
    id: 'saas-ui',
    label: 'SaaS Metrics UI',
    subtitle: 'Geometric sans + tabular figures',
    imageUrl: '/src/assets/images/sample_saas_interface_1795159158868.jpg',
    fileName: 'saas-dashboard-card.jpg',
  },
  {
    id: 'packaging',
    label: 'Packaging Label',
    subtitle: 'Condensed display + monospace',
    imageUrl: '/src/assets/images/sample_brand_packaging_1795159158627.jpg',
    fileName: 'botanical-bottle-label.jpg',
  },
];

export const SAMPLE_PREVIEW_DATA: Record<'url' | 'image', ExtractionResult> = {
  url: {
    mode: 'url',
    resolvedUrl: 'https://foundry-journal.example',
    pageTitle: 'Foundry Journal — Architecture & Systems',
    scannedStylesheets: 3,
    elapsedMs: 318,
    fonts: [
      {
        id: 'sample-url-1',
        family: 'Plus Jakarta Sans',
        role: 'Primary Heading',
        source: 'Google Fonts',
        weights: ['500', '600', '700'],
        styles: ['normal'],
        fallbackStack: 'system-ui, -apple-system, sans-serif',
        selectors: ['h1', 'h2', '.article-title', 'header nav'],
        cssSnippet: `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');\n\nfont-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;\nfont-weight: 700;\nfont-style: normal;`,
        googleFontsUrl: 'https://fonts.google.com/specimen/Plus+Jakarta+Sans',
        foundryLookupUrl: 'https://www.myfonts.com/search?query=Plus%20Jakarta%20Sans',
        importRule: `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');`,
      },
      {
        id: 'sample-url-2',
        family: 'Fraunces',
        role: 'Display / Accent',
        source: 'CSS @font-face',
        weights: ['400', '600', '700'],
        styles: ['normal', 'italic'],
        fallbackStack: 'Georgia, Cambria, serif',
        selectors: ['.editorial-lead', 'blockquote', '.pull-quote'],
        cssSnippet: `font-family: 'Fraunces', Georgia, Cambria, serif;\nfont-weight: 600;\nfont-style: normal;`,
        googleFontsUrl: 'https://fonts.google.com/specimen/Fraunces',
        foundryLookupUrl: 'https://www.myfonts.com/search?query=Fraunces',
        importRule: `@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&display=swap');`,
      },
      {
        id: 'sample-url-3',
        family: 'IBM Plex Mono',
        role: 'Monospace / Code',
        source: 'Google Fonts',
        weights: ['400', '500'],
        styles: ['normal'],
        fallbackStack: 'ui-monospace, SFMono-Regular, monospace',
        selectors: ['pre', 'code', '.spec-table'],
        cssSnippet: `font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace;\nfont-weight: 400;\nfont-style: normal;`,
        googleFontsUrl: 'https://fonts.google.com/specimen/IBM+Plex+Mono',
        foundryLookupUrl: 'https://www.myfonts.com/search?query=IBM%20Plex%20Mono',
        importRule: `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap');`,
      },
    ],
  },
  image: {
    mode: 'image',
    fileName: 'editorial-poster-specimen.jpg',
    elapsedMs: 840,
    fonts: [
      {
        id: 'sample-img-1',
        family: 'Playfair Display',
        role: 'Primary Heading',
        source: 'Visual Match',
        confidence: 96,
        classification: 'High-Contrast Transitional Serif',
        weights: ['600', '700'],
        styles: ['normal', 'italic'],
        fallbackStack: 'Georgia, serif',
        observedSample: 'ARCHIVE 2026',
        letterformNotes: 'Pronounced thick-thin stroke modulation, bracketed serifs, and open bowl counters.',
        cssSnippet: `font-family: 'Playfair Display', Georgia, serif;\nfont-weight: 700;\nfont-style: normal;`,
        googleFontsUrl: 'https://fonts.google.com/specimen/Playfair+Display',
        foundryLookupUrl: 'https://www.myfonts.com/search?query=Playfair%20Display',
        importRule: `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');`,
      },
      {
        id: 'sample-img-2',
        family: 'Barlow Condensed',
        role: 'Display / Accent',
        source: 'Visual Match',
        confidence: 91,
        classification: 'Condensed Grotesque Sans',
        weights: ['600', '700'],
        styles: ['normal'],
        fallbackStack: 'system-ui, sans-serif',
        observedSample: 'TYPOGRAPHY & GRID EXHIBITION',
        letterformNotes: 'Tight horizontal proportions, flat-sided bowls, and crisp horizontal terminals.',
        cssSnippet: `font-family: 'Barlow Condensed', system-ui, sans-serif;\nfont-weight: 600;\nfont-style: normal;`,
        googleFontsUrl: 'https://fonts.google.com/specimen/Barlow+Condensed',
        foundryLookupUrl: 'https://www.myfonts.com/search?query=Barlow%20Condensed',
        importRule: `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&display=swap');`,
      },
    ],
  },
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'free-no-login',
    question: 'Is FontExtractor really free with no login?',
    answer:
      'Yes. Both the Website URL Extractor and Image Matcher are 100% free to use with no account registration, no email gates, no credit card prompts, and no daily lookup caps.',
  },
  {
    id: 'any-url-or-image',
    question: 'Can it extract fonts from any URL or image?',
    answer:
      'You can inspect any publicly accessible webpage URL as well as PNG, JPG, or WEBP screenshots and photos. If a site blocks automated stylesheet requests with strict bot firewalls, simply take a quick screenshot and drop or paste it into the Image Matcher tab.',
  },
  {
    id: 'image-accuracy',
    question: 'How accurate is image font detection?',
    answer:
      'FontExtractor analyzes stroke contrast, x-height, terminal geometry, and serif structure to surface the closest matching Google Fonts and commercial foundry typefaces along with a transparent confidence percentage. Clean, flat, high-contrast images yield the highest match accuracy.',
  },
  {
    id: 'font-licensing',
    question: 'Does FontExtractor respect font licensing?',
    answer:
      'Yes. FontExtractor inspects public stylesheet metadata and matches visual letterforms—it never extracts, strips, or redistributes commercial font binary files (.woff2, .ttf, .otf). Instead, it links directly to official Google Fonts pages and foundry search results so you can license or import typefaces properly.',
  },
  {
    id: 'data-privacy',
    question: 'Is uploaded image data private?',
    answer:
      'Images you upload or paste are processed solely in memory to identify visible typography and are never stored in a public gallery, sold, or retained after your request completes.',
  },
];
