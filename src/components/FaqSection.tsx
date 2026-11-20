import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { FAQ_ITEMS } from '../data/samples.ts';

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0].id);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="faq"
      className="py-16 sm:py-20 border-t border-[#E4E7EE] bg-[#F8F9FB]"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-10">
          <p className="text-xs font-mono font-medium text-[#15803D] tracking-wide mb-2">
            Frequently Asked Questions
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#111318]">
            Clear answers before you inspect.
          </h2>
        </div>

        <div className="bg-white border border-[#E2E5EB] rounded-xl divide-y divide-[#EBEEF4]">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div key={item.id}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${item.id}`}
                  onClick={() => toggle(item.id)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-[#FAFBFD] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#15803D]"
                >
                  <span className="font-display text-base sm:text-lg font-medium text-[#111318]">
                    {item.question}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`w-4 h-4 text-[#5A6272] shrink-0 transition-transform duration-150 ${
                      isOpen ? 'rotate-180 text-[#15803D]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div
                    id={`faq-panel-${item.id}`}
                    className="px-6 pb-5 pt-0.5 text-sm sm:text-[15px] text-[#4E5666] leading-relaxed"
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
