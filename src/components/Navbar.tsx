import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { ExtractorMode } from './ExtractorWorkspace.tsx';

interface NavbarProps {
  onSelectModeAndScroll: (mode: ExtractorMode) => void;
}

export function Navbar({ onSelectModeAndScroll }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleJump = (id: string, mode?: ExtractorMode) => {
    setMobileOpen(false);
    if (mode) {
      onSelectModeAndScroll(mode);
      return;
    }
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F8F9FB]/95 backdrop-blur-sm border-b border-[#E2E5EB]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element brand wordmark */}
        <a
          href="#"
          className="font-display text-lg font-bold tracking-tight text-[#111318] whitespace-nowrap shrink-0 flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#15803D] rounded-sm"
        >
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[#111318] text-white font-mono text-xs font-semibold tracking-tighter"
          >
            Aa
          </span>
          FontExtractor
        </a>

        {/* Zone 2: 4 concise single-line text nav links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4E5666]"
        >
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              handleJump('how-it-works');
            }}
            className="hover:text-[#111318] hover:underline underline-offset-4 decoration-[#15803D]/50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#15803D] rounded-sm"
          >
            How It Works
          </a>
          <a
            href="#extractor"
            onClick={(e) => {
              e.preventDefault();
              handleJump('extractor', 'url');
            }}
            className="hover:text-[#111318] hover:underline underline-offset-4 decoration-[#15803D]/50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#15803D] rounded-sm"
          >
            URL Extractor
          </a>
          <a
            href="#extractor"
            onClick={(e) => {
              e.preventDefault();
              handleJump('extractor', 'image');
            }}
            className="hover:text-[#111318] hover:underline underline-offset-4 decoration-[#15803D]/50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#15803D] rounded-sm"
          >
            Image Matcher
          </a>
          <a
            href="#faq"
            onClick={(e) => {
              e.preventDefault();
              handleJump('faq');
            }}
            className="hover:text-[#111318] hover:underline underline-offset-4 decoration-[#15803D]/50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#15803D] rounded-sm"
          >
            FAQ
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleJump('extractor', 'url')}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]"
          >
            100% Free · No Login
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#E2E5EB] bg-white text-[#111318] hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E2E5EB] bg-white px-4 py-4 space-y-2">
          <button
            type="button"
            onClick={() => handleJump('how-it-works')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#111318] hover:bg-slate-50 rounded-lg"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => handleJump('extractor', 'url')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#111318] hover:bg-slate-50 rounded-lg"
          >
            URL Extractor
          </button>
          <button
            type="button"
            onClick={() => handleJump('extractor', 'image')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#111318] hover:bg-slate-50 rounded-lg"
          >
            Image Matcher
          </button>
          <button
            type="button"
            onClick={() => handleJump('faq')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#111318] hover:bg-slate-50 rounded-lg"
          >
            FAQ
          </button>
          <button
            type="button"
            onClick={() => handleJump('extractor', 'url')}
            className="w-full mt-2 px-4 py-2.5 text-sm font-medium text-white bg-[#15803D] hover:bg-[#166534] rounded-lg"
          >
            100% Free · No Login
          </button>
        </div>
      )}
    </header>
  );
}
