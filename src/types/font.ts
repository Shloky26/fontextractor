export type FontSourceType =
  | 'Google Fonts'
  | 'CSS @font-face'
  | 'Adobe Fonts'
  | 'Fontshare'
  | 'System Stack'
  | 'Visual Match';

export type FontRole = 'Primary Heading' | 'Body Copy' | 'Monospace / Code' | 'Display / Accent' | 'Web Font';

export interface ExtractedFont {
  id: string;
  family: string;
  role: FontRole;
  source: FontSourceType;
  weights: string[];
  styles: string[];
  fallbackStack: string;
  cssSnippet: string;
  selectors?: string[];
  confidence?: number;
  classification?: string;
  letterformNotes?: string;
  observedSample?: string;
  googleFontsUrl?: string;
  foundryLookupUrl: string;
  importRule?: string;
}

export interface UrlExtractionResponse {
  mode: 'url';
  resolvedUrl: string;
  pageTitle: string;
  scannedStylesheets: number;
  elapsedMs: number;
  fonts: ExtractedFont[];
}

export interface ImageExtractionResponse {
  mode: 'image';
  fileName: string;
  elapsedMs: number;
  fonts: ExtractedFont[];
}

export type ExtractionResult = UrlExtractionResponse | ImageExtractionResponse;
