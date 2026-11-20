import { Code2, Globe, Image as ImageIcon, ShieldCheck } from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      title: 'Website URL Extraction',
      description:
        'Detects primary headings, body copy stacks, custom @font-face declarations, Google Fonts imports, and system fallback chains directly from live stylesheets.',
      detail: 'Inspects inline <style> blocks, linked CSS files, and font-family variables.',
      icon: Globe,
      span: 'lg:col-span-7',
    },
    {
      title: 'Image & Screenshot Recognition',
      description:
        'Identifies matching typefaces inside UI mockups, social graphics, posters, and product photos—complete with confidence scores and glyph structure notes.',
      detail: 'Supports PNG, JPG, WEBP, and direct Ctrl/⌘ + V clipboard paste.',
      icon: ImageIcon,
      span: 'lg:col-span-5',
    },
    {
      title: 'One-Click CSS & Specimen Preview',
      description:
        'Test any phrase at any weight or size before committing, then copy clean font-family, font-weight, and @import snippets straight into your stylesheet.',
      detail: 'Includes Google Fonts and commercial foundry lookup links.',
      icon: Code2,
      span: 'lg:col-span-5',
    },
    {
      title: 'Truly Free, Zero Friction',
      description:
        'Built for everyday design and engineering workflows without login walls, paywalled font names, watermarks, or daily lookup limits.',
      detail: 'Unlimited checks from any browser with zero account setup.',
      icon: ShieldCheck,
      span: 'lg:col-span-7',
    },
  ];

  return (
    <section className="py-16 sm:py-20 border-t border-[#E4E7EE] bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-mono font-medium text-[#15803D] tracking-wide mb-2">
            Capabilities
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#111318]">
            Built for typographic speed and clarity.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`${feature.span} bg-[#FAFBFD] border border-[#E2E5EB] rounded-xl p-6 sm:p-7 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <h3 className="font-display text-xl font-semibold tracking-tight text-[#111318]">
                      {feature.title}
                    </h3>
                    <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E5EB] flex items-center justify-center text-[#15803D] shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-sm sm:text-[15px] text-[#4E5666] leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <p className="mt-5 pt-4 border-t border-[#E8EBF1] text-xs font-mono text-[#5A6272]">
                  {feature.detail}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
