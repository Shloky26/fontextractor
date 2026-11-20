import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractFontsFromUrl } from '../server/fontParser.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const startedAt = Date.now();
  try {
    const { url } = (req.body || {}) as { url?: string };
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Please provide a valid website URL.' });
      return;
    }

    const result = await extractFontsFromUrl(url);
    res.status(200).json({
      mode: 'url',
      resolvedUrl: result.resolvedUrl,
      pageTitle: result.pageTitle,
      scannedStylesheets: result.scannedStylesheets,
      elapsedMs: Date.now() - startedAt,
      fonts: result.fonts,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unable to extract fonts from that URL.';
    res.status(422).json({ error: message });
  }
}
