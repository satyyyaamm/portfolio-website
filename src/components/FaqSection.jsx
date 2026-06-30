import { motion } from 'framer-motion';
import { scrollRevealProps } from '../context/SiteReadyContext.jsx';

const FAQ_ITEMS = [
  {
    q: 'What do you build?',
    a: 'Cross-platform mobile apps (Flutter, React Native), supporting web and backend when a product needs it—from first prototype through App Store and Play Store release.',
  },
  {
    q: 'Who do you usually work with?',
    a: 'Founders with an early idea, product teams that need an extra engineer, and companies shipping consumer or B2B apps. I’m comfortable owning a feature end to end or joining an existing squad.',
  },
  {
    q: 'How does a project usually start?',
    a: 'A short call or email to understand scope, timeline, and constraints. I’ll follow up with a clear proposal—what I’d build first, how long it might take, and how we’d stay in sync while shipping.',
  },
  {
    q: 'Do you handle App Store and Play Store releases?',
    a: 'Yes. I’ve taken apps through review, TestFlight, staged rollouts, and the work after launch—crash fixes, OS updates, and keeping builds green in CI.',
  },
  {
    q: 'Are you open to remote work?',
    a: 'Yes. I’m based in Pune, India, and work with teams across time zones. Async updates, shared Figma boards, and regular check-ins keep projects moving.',
  },
  {
    q: 'How fast will I hear back?',
    a: 'Usually within a business day. If your note includes a rough timeline and what you’re trying to ship, I can reply with something useful—not just a generic “let’s chat.”',
  },
];

export function FaqSection({ animating, reducedMotion }) {
  return (
    <section id="faq" className="py-24 md:py-28 px-6 border-t border-mocha-200/80 relative z-10">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="mb-10 md:mb-12"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.06 } },
          }}
          {...scrollRevealProps(animating, reducedMotion, { once: true, amount: 0.35 })}
        >
          <motion.p
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mocha-500 mb-4"
          >
            FAQ
          </motion.p>
          <motion.h2
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
            className="font-service text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-mocha-800 leading-[1.08]"
          >
            Common questions
          </motion.h2>
        </motion.div>

        <motion.div
          className="faq-list"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
          {...scrollRevealProps(animating, reducedMotion, { once: true, amount: 0.15 })}
        >
          {FAQ_ITEMS.map((item) => (
            <motion.div key={item.q} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
              <details className="faq-item group">
                <summary className="faq-item__summary">{item.q}</summary>
                <p className="faq-item__answer">{item.a}</p>
              </details>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
