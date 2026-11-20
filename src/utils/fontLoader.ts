const loadedFonts = new Set<string>([
  'bricolage grotesque',
  'dm sans',
  'jetbrains mono',
  'fraunces',
  'plus jakarta sans',
  'playfair display',
  'ibm plex mono',
  'barlow condensed',
]);

const SYSTEM_FONTS = new Set([
  'arial',
  'helvetica',
  'helvetica neue',
  'georgia',
  'times new roman',
  'courier new',
  'system-ui',
  'sans-serif',
  'serif',
  'monospace',
  'segoe ui',
  'menlo',
  'monaco',
  'consolas',
]);

export function ensureGoogleFontLoaded(family: string, weights: string[] = ['400', '500', '600', '700']): void {
  if (typeof document === 'undefined') return;
  const clean = family.trim();
  const key = clean.toLowerCase();
  if (!clean || loadedFonts.has(key) || SYSTEM_FONTS.has(key)) return;

  loadedFonts.add(key);

  const uniqueWeights = Array.from(
    new Set(weights.filter((w) => /^\d{3}$/.test(w)).concat(['400', '600', '700'])),
  ).sort((a, b) => Number(a) - Number(b));

  const encodedFamily = clean.replace(/\s+/g, '+');
  const href = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${uniqueWeights.join(';')}&display=swap`;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.fontextractorDynamic = key;
  document.head.appendChild(link);
}
