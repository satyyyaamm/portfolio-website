import { BUILD_STEPS } from '../../lib/slides.js';

export function BuildChapter() {
  return (
    <div className="chapter chapter--build">
      <p className="chapter__eyebrow">How I build</p>
      <h2 className="chapter__title">Think → Design → Build → Ship → Iterate</h2>
      <p className="chapter__lede">
        Hands-on product engineering—owning mobile, web, and backend so founders can move from
        concept to production without gaps.
      </p>
      <ol className="build-flow">
        {BUILD_STEPS.map((step, i) => (
          <li key={step.title} className="build-flow__item">
            <span className="build-flow__title">{step.title}</span>
            <span className="build-flow__desc">{step.desc}</span>
            {i < BUILD_STEPS.length - 1 ? (
              <span className="build-flow__arrow" aria-hidden>
                ↓
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
