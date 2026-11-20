import { useState } from 'react';
import { SAMPLE_PREVIEW_DATA } from '../data/samples.ts';
import { FontResultCard } from './FontResultCard.tsx';

export function SampleResultsSection() {
  const [sampleMode, setSampleMode] = useState<'url' | 'image'>('url');
  const [customPreview, setCustomPreview] = useState<string>(
    'Typography shapes hierarchy, rhythm, and editorial clarity.',
  );
  const [fontSize, setFontSize] = useState<number>(26);

  const activeSample = SAMPLE_PREVIEW_DATA[sampleMode];

  return (
    <section
      id="sample-preview"
      className="py-16 sm:py-20 border-t border-[#E4E7EE] bg-white"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="max-w-2xl">
            <p className="text-xs font-mono font-medium text-[#15803D] tracking-wide mb-2">
              Sample Extraction Output
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#111318]">
              Inspect font families, live specimens, and ready-to-paste CSS.
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#4E5666] leading-relaxed">
              Every extraction returns the detected typeface, source or visual confidence score,
              interactive weight controls, custom specimen preview, and foundry links.
            </p>
          </div>

          {/* Interactive Example Switch */}
          <div
            role="tablist"
            aria-label="Sample output mode"
            className="inline-flex items-center gap-1 p-1 bg-[#F1F3F7] border border-[#E2E5EB] rounded-lg self-start md:self-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={sampleMode === 'url'}
              onClick={() => setSampleMode('url')}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                sampleMode === 'url'
                  ? 'bg-white text-[#111318] shadow-xs'
                  : 'text-[#4E5666] hover:text-[#111318]'
              }`}
            >
              Website URL Output
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sampleMode === 'image'}
              onClick={() => setSampleMode('image')}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                sampleMode === 'image'
                  ? 'bg-white text-[#111318] shadow-xs'
                  : 'text-[#4E5666] hover:text-[#111318]'
              }`}
            >
              Image Match Output
            </button>
          </div>
        </div>

        {/* Interactive Specimen Preview Bar */}
        <div className="p-4 sm:p-5 bg-[#F8F9FB] border border-[#E2E5EB] rounded-xl mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-[#5A6272]">
            <span className="font-semibold text-[#111318]">
              {activeSample.mode === 'url'
                ? activeSample.resolvedUrl
                : activeSample.fileName}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {activeSample.fonts.length} typefaces
            </span>
            {activeSample.mode === 'url' && (
              <>
                <span aria-hidden="true">·</span>
                <span>{activeSample.scannedStylesheets} stylesheets parsed</span>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 lg:max-w-xl">
            <label htmlFor="sample-preview-input" className="sr-only">
              Preview custom text in sample fonts
            </label>
            <input
              id="sample-preview-input"
              type="text"
              value={customPreview}
              onChange={(e) => setCustomPreview(e.target.value)}
              placeholder="Type custom preview text..."
              className="flex-1 h-9 px-3 text-sm bg-white border border-[#D4D8E2] rounded-md text-[#111318] focus:border-[#15803D] focus:outline-none"
            />
            <div className="flex items-center gap-2.5 shrink-0">
              <label
                htmlFor="sample-preview-size"
                className="text-xs font-mono text-[#4E5666] tabular-nums w-10 text-right"
              >
                {fontSize}px
              </label>
              <input
                id="sample-preview-size"
                type="range"
                min={18}
                max={42}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-24 accent-[#15803D] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Sample Cards */}
        <div className="space-y-4">
          {activeSample.fonts.map((font) => (
            <FontResultCard
              key={font.id}
              font={font}
              previewText={customPreview}
              previewSize={fontSize}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
