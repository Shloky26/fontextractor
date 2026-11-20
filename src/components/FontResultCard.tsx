import { Check, Copy, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ExtractedFont } from '../types/font.ts';
import { ensureGoogleFontLoaded } from '../utils/fontLoader.ts';

interface FontResultCardProps {
  font: ExtractedFont;
  previewText: string;
  previewSize: number;
}

export function FontResultCard({ font, previewText, previewSize }: FontResultCardProps) {
  const defaultWeight = font.weights.includes('600')
    ? '600'
    : font.weights.includes('700')
      ? '700'
      : font.weights[0] || '400';

  const [selectedWeight, setSelectedWeight] = useState<string>(defaultWeight);
  const [selectedStyle, setSelectedStyle] = useState<'normal' | 'italic'>(
    font.styles.includes('normal') ? 'normal' : 'italic',
  );
  const [showImport, setShowImport] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    ensureGoogleFontLoaded(font.family, font.weights);
  }, [font.family, font.weights]);

  useEffect(() => {
    setSelectedWeight(defaultWeight);
    setSelectedStyle(font.styles.includes('normal') ? 'normal' : 'italic');
  }, [font.id, defaultWeight, font.styles]);

  const activeCssRule = [
    ...(showImport && font.importRule ? [font.importRule, ''] : []),
    `font-family: '${font.family}', ${font.fallbackStack};`,
    `font-weight: ${selectedWeight};`,
    `font-style: ${selectedStyle};`,
  ].join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeCssRule);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback copy
      const textarea = document.createElement('textarea');
      textarea.value = activeCssRule;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const displaySample = previewText.trim() || font.observedSample || 'The quick brown fox jumps over the lazy dog.';

  return (
    <article className="bg-white border border-[#E2E5EB] rounded-xl p-5 sm:p-6 transition-colors hover:border-[#CBD1DC]">
      {/* Header row: Font name + clean unboxed metadata */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-[#EFF1F5]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3
              className="text-xl font-semibold tracking-tight text-[#111318] truncate"
              style={{ fontFamily: `'${font.family}', ${font.fallbackStack}` }}
            >
              {font.family}
            </h3>
            <span className="text-xs font-medium text-[#4E5666] whitespace-nowrap">
              {font.role}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#5A6272]">
            <span className="font-medium text-[#111318]">{font.source}</span>
            {font.classification && (
              <>
                <span aria-hidden="true">·</span>
                <span>{font.classification}</span>
              </>
            )}
            {font.selectors && font.selectors.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[11px] text-[#4E5666] truncate max-w-xs sm:max-w-md">
                  Selectors: {font.selectors.join(', ')}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Confidence indicator for image matches */}
        {typeof font.confidence === 'number' && (
          <div className="shrink-0 sm:text-right">
            <div className="font-mono text-xs font-semibold text-[#15803D] tabular-nums">
              {font.confidence}% visual match
            </div>
            <div className="mt-1.5 w-28 h-1.5 bg-[#EEF0F4] rounded-full overflow-hidden sm:ml-auto">
              <div
                className="h-full bg-[#15803D] rounded-full"
                style={{ width: `${font.confidence}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Live Specimen Preview */}
      <div className="py-5 border-b border-[#EFF1F5]">
        <p
          className="text-[#111318] leading-snug break-words transition-all duration-150"
          style={{
            fontFamily: `'${font.family}', ${font.fallbackStack}`,
            fontWeight: Number(selectedWeight) || 400,
            fontStyle: selectedStyle,
            fontSize: `${previewSize}px`,
          }}
        >
          {displaySample}
        </p>

        {font.letterformNotes && (
          <p className="mt-3 text-xs text-[#5A6272] leading-relaxed">
            {font.letterformNotes}
          </p>
        )}
      </div>

      {/* Interactive Weight / Style controls + CSS Rule */}
      <div className="pt-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-[#5A6272] mr-1">Weights:</span>
            {font.weights.map((weight) => {
              const active = selectedWeight === weight;
              return (
                <button
                  key={weight}
                  type="button"
                  onClick={() => setSelectedWeight(weight)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D] ${
                    active
                      ? 'bg-[#111318] text-white font-medium'
                      : 'bg-[#F3F4F7] text-[#4E5666] hover:bg-[#E7E9EF] hover:text-[#111318]'
                  }`}
                >
                  {weight}
                </button>
              );
            })}

            {font.styles.includes('italic') && (
              <button
                type="button"
                onClick={() =>
                  setSelectedStyle((prev) => (prev === 'italic' ? 'normal' : 'italic'))
                }
                className={`ml-1 px-2.5 py-1 text-xs font-mono italic rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedStyle === 'italic'
                    ? 'bg-[#15803D] text-white'
                    : 'bg-[#F3F4F7] text-[#4E5666] hover:bg-[#E7E9EF] hover:text-[#111318]'
                }`}
              >
                italic
              </button>
            )}
          </div>

          {font.importRule && (
            <button
              type="button"
              onClick={() => setShowImport((prev) => !prev)}
              className="text-xs font-medium text-[#15803D] hover:text-[#166534] hover:underline underline-offset-4 cursor-pointer whitespace-nowrap shrink-0"
            >
              {showImport ? 'Hide @import rule' : 'Include @import rule'}
            </button>
          )}
        </div>

        {/* Copyable CSS Snippet */}
        <div className="relative bg-[#F5F6F9] border border-[#E2E5EB] rounded-lg p-3.5 pr-28">
          <pre className="font-mono text-xs text-[#1E222B] leading-relaxed overflow-x-auto">
            <code>{activeCssRule}</code>
          </pre>
          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-[#D8DCE5] text-[#111318] hover:border-[#15803D] hover:text-[#15803D] transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy CSS</span>
              </>
            )}
          </button>
        </div>

        {/* External Foundry & Google Fonts Lookup Links */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
          <span className="font-mono text-[#5A6272] truncate">
            Fallback: {font.fallbackStack}
          </span>
          <div className="flex items-center gap-4 shrink-0">
            {font.googleFontsUrl && (
              <a
                href={font.googleFontsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-[#15803D] hover:text-[#166534] hover:underline underline-offset-4 whitespace-nowrap"
              >
                <span>Google Fonts</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <a
              href={font.foundryLookupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-[#4E5666] hover:text-[#111318] hover:underline underline-offset-4 whitespace-nowrap"
            >
              <span>Foundry Lookup</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
