import { X } from 'lucide-react';
import { useState } from 'react';
import type { ExtractorMode } from './ExtractorWorkspace.tsx';

interface FooterProps {
  onSelectModeAndScroll: (mode: ExtractorMode) => void;
}

export function Footer({ onSelectModeAndScroll }: FooterProps) {
  const [legalDoc, setLegalDoc] = useState<'privacy' | 'terms' | null>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <footer className="border-t border-[#E4E7EE] bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <a
              href="#"
              className="font-display text-lg font-bold tracking-tight text-[#111318] inline-flex items-center gap-2"
            >
              <span
                aria-hidden="true"
                className="inline-flex items-center justify-center w-6 h-6 rounded-sm bg-[#111318] text-white font-mono text-[11px] font-semibold"
              >
                Aa
              </span>
              <span>FontExtractor</span>
            </a>
            <p className="mt-5 text-sm text-[#5A6272]">
              fontextractor.com · Built for designers &amp; developers. 100% free, zero login.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#4E5666]"
          >
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-[#111318] hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => onSelectModeAndScroll('url')}
              className="hover:text-[#111318] hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
            >
              URL Extractor
            </button>
            <button
              type="button"
              onClick={() => onSelectModeAndScroll('image')}
              className="hover:text-[#111318] hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
            >
              Image Matcher
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('faq')}
              className="hover:text-[#111318] hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
            >
              FAQ
            </button>
            <button
              type="button"
              onClick={() => setLegalDoc('privacy')}
              className="hover:text-[#111318] hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
            >
              Privacy
            </button>
            <button
              type="button"
              onClick={() => setLegalDoc('terms')}
              className="hover:text-[#111318] hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
            >
              Terms
            </button>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-[#EFF1F5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#6B7280]">
          <span>© {new Date().getFullYear()} FontExtractor. All rights reserved.</span>
          <span>Inspects public CSS metadata and matches visual letterforms without extracting font binaries.</span>
        </div>
      </div>

      {/* Privacy & Terms Modal */}
      {legalDoc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLegalDoc(null)}
        >
          <div
            className="bg-white border border-[#E2E5EB] rounded-2xl max-w-lg w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#EBEEF4]">
              <h3 id="legal-modal-title" className="font-display text-lg font-semibold text-[#111318]">
                {legalDoc === 'privacy' ? 'Privacy Policy' : 'Terms of Use'}
              </h3>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setLegalDoc(null)}
                className="w-8 h-8 rounded-md inline-flex items-center justify-center text-[#5A6272] hover:bg-slate-100 hover:text-[#111318] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-[#4E5666] leading-relaxed">
              {legalDoc === 'privacy' ? (
                <>
                  <p>
                    FontExtractor requires zero registration, stores no user accounts, and sets no
                    advertising or tracking cookies.
                  </p>
                  <p>
                    Submitted URLs are fetched in real time to read public HTML and CSS font
                    declarations. Uploaded or pasted images are processed strictly in memory to
                    identify visible typography and are never archived or published.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    FontExtractor is provided free of charge for typography inspection, CSS
                    reference, and design research.
                  </p>
                  <p>
                    FontExtractor never extracts or redistributes commercial font binary files. Users
                    are responsible for reviewing and honoring the respective typeface licenses via
                    Google Fonts or the owning type foundry before deploying fonts in production.
                  </p>
                </>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setLegalDoc(null)}
                className="px-4 py-2 text-sm font-medium text-white bg-[#111318] hover:bg-[#232730] rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
