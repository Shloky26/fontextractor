export function HowItWorksSection() {
  const steps = [
    {
      index: '01.',
      title: 'Paste a URL or drop an image',
      description:
        'Enter any public website address into the URL Extractor, or drag, browse, or paste a PNG, JPG, or WEBP screenshot into the Image Matcher.',
    },
    {
      index: '02.',
      title: 'Inspect stylesheets or letterforms',
      description:
        'For live URLs, FontExtractor parses linked CSS, @font-face blocks, and Google Fonts imports. For images, it analyzes stroke contrast, x-height, and terminal shapes.',
    },
    {
      index: '03.',
      title: 'Copy CSS rules and ship faster',
      description:
        'Preview custom copy at any weight or size, copy production-ready font-family CSS rules in one click, and jump straight to Google Fonts or foundry listings.',
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-16 sm:py-20 border-t border-[#E4E7EE] bg-[#F8F9FB]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-mono font-medium text-[#15803D] tracking-wide mb-2">
            How It Works
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#111318]">
            From webpage or screenshot to clean CSS in three steps.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.index}
              className="bg-white border border-[#E2E5EB] rounded-xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="font-mono text-sm font-semibold text-[#15803D] mb-3 tabular-nums">
                  {step.index}
                </div>
                <h3 className="font-display text-lg font-semibold text-[#111318] tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-sm text-[#4E5666] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
