import { useRef, useState } from 'react';
import { ExtractorWorkspace, type ExtractorMode } from './components/ExtractorWorkspace.tsx';
import { FaqSection } from './components/FaqSection.tsx';
import { FeaturesSection } from './components/FeaturesSection.tsx';
import { Footer } from './components/Footer.tsx';
import { HowItWorksSection } from './components/HowItWorksSection.tsx';
import { Navbar } from './components/Navbar.tsx';
import { SampleResultsSection } from './components/SampleResultsSection.tsx';

export default function App() {
  const [mode, setMode] = useState<ExtractorMode>('url');
  const urlInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectModeAndScroll = (targetMode: ExtractorMode) => {
    setMode(targetMode);
    const el = document.getElementById('extractor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (targetMode === 'url') {
      setTimeout(() => urlInputRef.current?.focus(), 250);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FB] text-[#111318]">
      <Navbar onSelectModeAndScroll={handleSelectModeAndScroll} />

      <main className="flex-1">
        {/* Hero Section + Interactive Extractor Workspace */}
        <section
          id="extractor"
          className="hairline-grid pt-12 pb-16 sm:pt-16 sm:pb-20 scroll-mt-16"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center mb-9">
              <p className="text-xs sm:text-sm font-mono font-medium text-[#15803D] tracking-tight mb-3">
                100% free · Zero login required · Unlimited extractions
              </p>

              <h1
                className="font-display font-bold tracking-tight text-[#111318] leading-[1.08]"
                style={{
                  fontSize: 'clamp(2.25rem, 4.4vw, 3.6rem)',
                  textWrap: 'balance',
                }}
              >
                Extract fonts from any website URL or image in seconds.
              </h1>

              <p className="mt-4 text-base sm:text-lg text-[#4E5666] leading-relaxed max-w-2xl mx-auto">
                Inspect live CSS <code className="font-mono text-sm text-[#111318]">@font-face</code>{' '}
                stacks or match letterforms from screenshots—completely free, with no sign-up walls,
                trial limits, or paywalled results.
              </p>
            </div>

            <ExtractorWorkspace
              mode={mode}
              onModeChange={setMode}
              urlInputRef={urlInputRef}
            />
          </div>
        </section>

        {/* Live Sample Results Preview Section */}
        <SampleResultsSection />

        {/* 3-Step How It Works */}
        <HowItWorksSection />

        {/* Key Features Grid */}
        <FeaturesSection />

        {/* FAQ Accordion */}
        <FaqSection />
      </main>

      <Footer onSelectModeAndScroll={handleSelectModeAndScroll} />
    </div>
  );
}
