import { FAQ_ITEMS } from '../lib/faq.js';

export function FaqSection() {
  return (
    <section id="faq-legacy" className="py-24 md:py-28 px-6 border-t border-mocha-200/80 relative z-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 md:mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mocha-500 mb-4">
            FAQ
          </p>
          <h2 className="font-service text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-mocha-800 leading-[1.08]">
            Still got questions?
          </h2>
        </div>

        <div className="faq-list">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="faq-item group">
              <summary className="faq-item__summary">{item.q}</summary>
              <p className="faq-item__answer">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
