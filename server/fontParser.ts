import type { ExtractedFont, FontRole, FontSourceType } from '../src/types/font.ts';

const GENERIC_FAMILIES = new Set([
  'sans-serif',
  'serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  '-apple-system',
  'blinkmacsystemfont',
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
  'ui-rounded',
  'inherit',
  'initial',
  'unset',
  'revert',
  'math',
  'emoji',
  'fangsong',
]);

const SYSTEM_FALLBACK_NAMES = new Set([
  'segoe ui',
  'roboto',
  'helvetica neue',
  'helvetica',
  'arial',
  'noto sans',
  'liberation sans',
  'apple color emoji',
  'segoe ui emoji',
  'segoe ui symbol',
  'noto color emoji',
  'sfmono-regular',
  'menlo',
  'monaco',
  'consolas',
  'liberation mono',
  'courier new',
  'georgia',
  'times new roman',
  'cambria',
  'verdana',
  'tahoma',
]);

function normalizeFontName(raw: string): string {
  return raw
    .trim()
    .replace(/^['"`]+|['"`]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isValidFontFamilyCandidate(name: string): boolean {
  if (!name || name.length < 2 || name.length > 64) return false;
  if (/^\d+(\.\d+)?(px|rem|em|%|pt|vh|vw)?$/i.test(name)) return false;
  if (/[<>[\]{}()\\/*;=]/.test(name)) return false;
  const lower = name.toLowerCase();
  if (
    lower.startsWith('var(') ||
    lower.startsWith('--') ||
    lower === 'none' ||
    lower === 'normal' ||
    lower === 'auto' ||
    lower === 'inherit' ||
    lower === 'initial' ||
    lower === 'unset' ||
    lower === 'revert'
  ) {
    return false;
  }
  if (
    lower.includes('icon') ||
    lower.includes('glyph') ||
    lower.includes('fontawesome') ||
    lower.includes('material symbols') ||
    lower.includes('google symbols') ||
    lower.endsWith(' fallback') ||
    lower === 'tofu'
  ) {
    return false;
  }
  return true;
}

function isBlockedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  ) {
    return true;
  }
  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const a = Number(ipv4Match[1]);
    const b = Number(ipv4Match[2]);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

export function validatePublicUrl(input: string): URL {
  let candidate = input.trim();
  if (!candidate) {
    throw new Error('Please enter a website URL.');
  }
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error('Please enter a valid website URL (e.g. https://stripe.com).');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS URLs are supported.');
  }
  if (!parsed.hostname || !parsed.hostname.includes('.')) {
    throw new Error('Please enter a full domain name (e.g. https://example.com).');
  }
  if (isBlockedHostname(parsed.hostname)) {
    throw new Error('Private and local network URLs cannot be inspected.');
  }
  return parsed;
}

function buildLookupUrls(family: string, source: FontSourceType) {
  const encoded = encodeURIComponent(family);
  const plusEncoded = family.trim().replace(/\s+/g, '+');
  const googleFontsUrl =
    source === 'Google Fonts'
      ? `https://fonts.google.com/specimen/${plusEncoded}`
      : `https://fonts.google.com/?query=${encoded}`;
  const foundryLookupUrl = `https://www.myfonts.com/search?query=${encoded}`;
  return { googleFontsUrl, foundryLookupUrl };
}

function inferRoleFromSelectors(selectors: string[], family: string): FontRole {
  const joined = selectors.join(' ').toLowerCase();
  const familyLower = family.toLowerCase();
  if (
    familyLower.includes('mono') ||
    familyLower.includes('code') ||
    familyLower.includes('courier') ||
    joined.includes('code') ||
    joined.includes('pre') ||
    joined.includes('kbd') ||
    joined.includes('mono')
  ) {
    return 'Monospace / Code';
  }
  if (
    joined.includes('h1') ||
    joined.includes('h2') ||
    joined.includes('h3') ||
    joined.includes('heading') ||
    joined.includes('title') ||
    joined.includes('hero') ||
    joined.includes('display') ||
    familyLower.includes('display') ||
    familyLower.includes('serif')
  ) {
    return 'Primary Heading';
  }
  if (joined.includes('body') || joined.includes('html') || joined.includes('p ') || joined === 'p') {
    return 'Body Copy';
  }
  return 'Web Font';
}

function buildCssSnippet(
  family: string,
  weights: string[],
  styles: string[],
  fallbackStack: string,
  importRule?: string,
): string {
  const primaryWeight = weights.includes('600')
    ? '600'
    : weights.includes('700')
      ? '700'
      : weights[0] || '400';
  const primaryStyle = styles.includes('normal') ? 'normal' : styles[0] || 'normal';
  const quoted = family.includes(' ') ? `'${family}'` : `'${family}'`;
  const lines = [
    ...(importRule ? [importRule, ''] : []),
    `font-family: ${quoted}, ${fallbackStack};`,
    `font-weight: ${primaryWeight};`,
    `font-style: ${primaryStyle};`,
  ];
  return lines.join('\n');
}

interface MutableFontEntry {
  family: string;
  source: FontSourceType;
  weights: Set<string>;
  styles: Set<string>;
  selectors: Set<string>;
  fallbackStack: string;
  importRule?: string;
}

function parseGoogleFontsUrl(href: string, entries: Map<string, MutableFontEntry>) {
  try {
    const parsed = new URL(href, 'https://fonts.googleapis.com');
    const families = parsed.searchParams.getAll('family');

    for (const rawFam of families) {
      // css2 format: Family+Name:ital,wght@0,400;0,600;1,400 or Family+Name:wght@400..700
      const [namePart, specPart] = rawFam.split(':');
      const familyName = normalizeFontName(namePart.replace(/\+/g, ' '));
      if (!familyName) continue;

      const key = familyName.toLowerCase();
      const existing = entries.get(key) ?? {
        family: familyName,
        source: 'Google Fonts' as FontSourceType,
        weights: new Set<string>(),
        styles: new Set<string>(['normal']),
        selectors: new Set<string>(),
        fallbackStack: 'sans-serif',
        importRule: `@import url('${href}');`,
      };
      existing.source = 'Google Fonts';
      if (!existing.importRule) existing.importRule = `@import url('${href}');`;

      if (specPart) {
        const atParts = specPart.split('@');
        const axes = atParts[0] || '';
        const values = (atParts[1] || '').split(';');
        const hasItal = axes.includes('ital');

        for (const val of values) {
          const clean = val.trim();
          if (!clean) continue;
          if (hasItal && clean.includes(',')) {
            const [italFlag, wght] = clean.split(',');
            if (italFlag === '1') existing.styles.add('italic');
            if (wght) {
              if (wght.includes('..')) {
                existing.weights.add('400');
                existing.weights.add('500');
                existing.weights.add('600');
                existing.weights.add('700');
              } else {
                existing.weights.add(wght);
              }
            }
          } else if (clean.includes('..')) {
            existing.weights.add('400');
            existing.weights.add('500');
            existing.weights.add('600');
            existing.weights.add('700');
          } else if (/^\d{3}$/.test(clean)) {
            existing.weights.add(clean);
          }
        }
      }

      if (existing.weights.size === 0) {
        existing.weights.add('400');
      }
      entries.set(key, existing);
    }
  } catch {
    // Ignore malformed Google Fonts href
  }
}

function extractCssFonts(cssText: string, entries: Map<string, MutableFontEntry>, baseUrl: string) {
  // 1. Check @import url(...)
  const importRegex = /@import\s+(?:url\()?['"]?([^'")\s]+)['"]?\)?/gi;
  let importMatch: RegExpExecArray | null;
  while ((importMatch = importRegex.exec(cssText)) !== null) {
    const importedUrl = importMatch[1];
    if (importedUrl.includes('fonts.googleapis.com')) {
      parseGoogleFontsUrl(importedUrl, entries);
    }
  }

  // 2. Parse @font-face blocks
  const fontFaceRegex = /@font-face\s*\{([^}]+)\}/gi;
  let ffMatch: RegExpExecArray | null;
  while ((ffMatch = fontFaceRegex.exec(cssText)) !== null) {
    const block = ffMatch[1];
    const familyMatch = block.match(/font-family\s*:\s*([^;]+)/i);
    if (!familyMatch) continue;
    const rawFamily = normalizeFontName(familyMatch[1].split(',')[0]);
    if (!isValidFontFamilyCandidate(rawFamily) || GENERIC_FAMILIES.has(rawFamily.toLowerCase())) {
      continue;
    }

    const weightMatch = block.match(/font-weight\s*:\s*([^;]+)/i);
    const styleMatch = block.match(/font-style\s*:\s*([^;]+)/i);
    const key = rawFamily.toLowerCase();
    const existing = entries.get(key) ?? {
      family: rawFamily,
      source: 'CSS @font-face' as FontSourceType,
      weights: new Set<string>(),
      styles: new Set<string>(),
      selectors: new Set<string>(),
      fallbackStack: 'sans-serif',
    };
    if (existing.source !== 'Google Fonts') {
      existing.source = 'CSS @font-face';
    }

    if (weightMatch) {
      const wRaw = weightMatch[1].trim();
      if (wRaw.includes(' ')) {
        // Variable font range e.g. "100 900"
        existing.weights.add('400');
        existing.weights.add('500');
        existing.weights.add('600');
        existing.weights.add('700');
      } else if (wRaw === 'bold') {
        existing.weights.add('700');
      } else if (wRaw === 'normal') {
        existing.weights.add('400');
      } else if (/^\d{3}$/.test(wRaw)) {
        existing.weights.add(wRaw);
      }
    } else {
      existing.weights.add('400');
    }

    if (styleMatch) {
      const sRaw = styleMatch[1].trim().toLowerCase();
      if (sRaw.includes('italic')) existing.styles.add('italic');
      else existing.styles.add('normal');
    } else {
      existing.styles.add('normal');
    }

    entries.set(key, existing);
  }

  // 3. Scan selector { ... font-family: ... } declarations
  const cleanCss = cssText.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@font-face\s*\{[^}]+\}/gi, '');
  const ruleRegex = /([^{}@]+)\{([^{}]+)\}/g;
  let ruleMatch: RegExpExecArray | null;
  while ((ruleMatch = ruleRegex.exec(cleanCss)) !== null) {
    const selector = ruleMatch[1].trim().replace(/\s+/g, ' ');
    const body = ruleMatch[2];
    const famDeclMatch = body.match(/(?:^|;)\s*font-family\s*:\s*([^;!}]+)/i);
    if (!famDeclMatch) continue;

    const stackRaw = famDeclMatch[1].trim();
    if (!stackRaw || stackRaw.startsWith('var(')) continue;

    const parts = stackRaw.split(',').map((p) => normalizeFontName(p)).filter(Boolean);
    if (parts.length === 0) continue;

    const meaningfulFamily =
      parts.find((p) => isValidFontFamilyCandidate(p) && !GENERIC_FAMILIES.has(p.toLowerCase())) ||
      parts.find((p) => isValidFontFamilyCandidate(p));
    if (!meaningfulFamily) continue;

    const key = meaningfulFamily.toLowerCase();
    const isGenericOrSystem =
      GENERIC_FAMILIES.has(key) || SYSTEM_FALLBACK_NAMES.has(key);

    const existing = entries.get(key) ?? {
      family: meaningfulFamily,
      source: isGenericOrSystem ? ('System Stack' as FontSourceType) : ('CSS @font-face' as FontSourceType),
      weights: new Set<string>(['400']),
      styles: new Set<string>(['normal']),
      selectors: new Set<string>(),
      fallbackStack: parts.slice(1).join(', ') || 'sans-serif',
    };

    if (selector && selector.length < 60 && !selector.includes('<') && !selector.includes('[')) {
      existing.selectors.add(selector);
    }

    const weightDecl = body.match(/(?:^|;)\s*font-weight\s*:\s*([^;!}]+)/i);
    if (weightDecl) {
      const w = weightDecl[1].trim().toLowerCase();
      if (w === 'bold') existing.weights.add('700');
      else if (w === 'normal') existing.weights.add('400');
      else if (/^\d{3}$/.test(w)) existing.weights.add(w);
    }

    entries.set(key, existing);
  }

  // 4. Detect CSS font-family variables (explicitly excluding --font-weight, --font-size, etc.)
  const varFontRegex = /(--font-(?:family|sans|serif|mono|display|body|heading|code|ui|text)[a-z0-9-]*)\s*:\s*([^;!}]+)/gi;
  let varMatch: RegExpExecArray | null;
  while ((varMatch = varFontRegex.exec(cleanCss)) !== null) {
    const varName = varMatch[1];
    const parts = varMatch[2].split(',').map((p) => normalizeFontName(p)).filter(Boolean);
    const primary = parts.find(
      (p) => isValidFontFamilyCandidate(p) && !GENERIC_FAMILIES.has(p.toLowerCase()),
    );
    if (!primary) continue;
    const key = primary.toLowerCase();
    const existing = entries.get(key) ?? {
      family: primary,
      source: SYSTEM_FALLBACK_NAMES.has(key) ? ('System Stack' as FontSourceType) : ('CSS @font-face' as FontSourceType),
      weights: new Set<string>(['400', '600']),
      styles: new Set<string>(['normal']),
      selectors: new Set<string>([varName]),
      fallbackStack: parts.slice(1).join(', ') || 'sans-serif',
    };
    existing.selectors.add(varName);
    entries.set(key, existing);
  }

  void baseUrl;
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'text/html,text/css,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function extractFontsFromUrl(rawUrl: string): Promise<{
  resolvedUrl: string;
  pageTitle: string;
  scannedStylesheets: number;
  fonts: ExtractedFont[];
}> {
  const parsed = validatePublicUrl(rawUrl);
  const res = await fetchWithTimeout(parsed.toString(), 9000);
  if (!res.ok) {
    throw new Error(
      `The website returned HTTP ${res.status}. Some sites block automated inspection—try another URL or paste a screenshot in the Image Matcher tab.`,
    );
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml') && !contentType.includes('text/css')) {
    throw new Error('The target URL did not return an HTML page or CSS stylesheet.');
  }

  const resolvedUrl = res.url || parsed.toString();
  const html = await res.text();
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : parsed.hostname;

  const entries = new Map<string, MutableFontEntry>();

  if (contentType.includes('text/css')) {
    extractCssFonts(html, entries, resolvedUrl);
  } else {
    // Extract <link rel="stylesheet" ...>
    const stylesheetUrls: string[] = [];
    const linkRegex = /<link\b[^>]*>/gi;
    let linkMatch: RegExpExecArray | null;
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      const tag = linkMatch[0];
      const relMatch = tag.match(/rel\s*=\s*['"]?([^'">\s]+)['"]?/i);
      const hrefMatch = tag.match(/href\s*=\s*['"]([^'"]+)['"]/i);
      if (!hrefMatch) continue;
      const href = hrefMatch[1].replace(/&amp;/g, '&');
      const rel = (relMatch?.[1] || '').toLowerCase();

      if (href.includes('fonts.googleapis.com')) {
        parseGoogleFontsUrl(href, entries);
      } else if (href.includes('use.typekit.net') || (!href.includes('fontawesome') && rel.includes('stylesheet'))) {
        try {
          const abs = new URL(href, resolvedUrl).toString();
          if (!abs.includes('fontawesome') && !abs.includes('font-awesome')) {
            stylesheetUrls.push(abs);
          }
        } catch {
          // skip invalid href
        }
      }
    }

    // Inline <style> tags
    const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
    let styleMatch: RegExpExecArray | null;
    while ((styleMatch = styleRegex.exec(html)) !== null) {
      extractCssFonts(styleMatch[1], entries, resolvedUrl);
    }

    // Fetch up to 6 linked stylesheets in parallel
    const uniqueSheets = Array.from(new Set(stylesheetUrls)).slice(0, 6);
    const sheetResults = await Promise.allSettled(
      uniqueSheets.map(async (sheetUrl) => {
        const sheetRes = await fetchWithTimeout(sheetUrl, 5000);
        if (!sheetRes.ok) return null;
        const css = await sheetRes.text();
        return { sheetUrl, css };
      }),
    );

    let scannedStylesheets = 1; // HTML inline styles count
    for (const r of sheetResults) {
      if (r.status === 'fulfilled' && r.value) {
        scannedStylesheets++;
        if (r.value.sheetUrl.includes('use.typekit.net')) {
          // Tag any @font-face inside Typekit CSS as Adobe Fonts
          const tempEntries = new Map<string, MutableFontEntry>();
          extractCssFonts(r.value.css, tempEntries, r.value.sheetUrl);
          for (const [k, v] of tempEntries.entries()) {
            v.source = 'Adobe Fonts';
            entries.set(k, v);
          }
        } else {
          extractCssFonts(r.value.css, entries, r.value.sheetUrl);
        }
      }
    }

    const fonts = buildSortedFonts(entries);
    return { resolvedUrl, pageTitle, scannedStylesheets, fonts };
  }

  const fonts = buildSortedFonts(entries);
  return { resolvedUrl, pageTitle, scannedStylesheets: 1, fonts };
}

function buildSortedFonts(entries: Map<string, MutableFontEntry>): ExtractedFont[] {
  const list = Array.from(entries.values())
    .filter((entry) => isValidFontFamilyCandidate(entry.family));

  // Sort: custom web fonts & Google Fonts first, then system stacks
  const priority = (source: FontSourceType) => {
    if (source === 'Google Fonts') return 0;
    if (source === 'Adobe Fonts') return 1;
    if (source === 'CSS @font-face') return 2;
    return 3;
  };

  list.sort((a, b) => priority(a.source) - priority(b.source));

  const customCount = list.filter((item) => item.source !== 'System Stack').length;
  const trimmed = customCount > 0 ? list.slice(0, 8) : list.slice(0, 4);

  return trimmed.map((entry, idx) => {
    const weights = Array.from(entry.weights).sort((a, b) => Number(a) - Number(b));
    const styles = Array.from(entry.styles);
    const selectors = Array.from(entry.selectors).slice(0, 4);
    const role = inferRoleFromSelectors(selectors, entry.family);
    const { googleFontsUrl, foundryLookupUrl } = buildLookupUrls(entry.family, entry.source);
    const cssSnippet = buildCssSnippet(
      entry.family,
      weights.length ? weights : ['400'],
      styles.length ? styles : ['normal'],
      entry.fallbackStack,
      entry.importRule,
    );

    return {
      id: `url-font-${idx}-${entry.family.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      family: entry.family,
      role,
      source: entry.source,
      weights: weights.length ? weights : ['400'],
      styles: styles.length ? styles : ['normal'],
      fallbackStack: entry.fallbackStack,
      cssSnippet,
      selectors,
      googleFontsUrl,
      foundryLookupUrl,
      importRule: entry.importRule,
    };
  });
}
