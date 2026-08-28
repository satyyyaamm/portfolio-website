import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion, useTransform } from 'framer-motion';
import { ScrollComposition, ScrollLayer, useScrollProgress } from './ScrollComposition.jsx';
import { ScrollTypewriter } from './ScrollTypewriter.jsx';
import { SocialDock } from './SocialDock.jsx';
import { SCENE, beatRange, projectRange } from '../../lib/scrollTimeline.js';
import { useMagneticHover } from '../interaction/useMagneticHover.js';
import { projectTheme } from '../../lib/projectThemes.js';
import { ABOUT_PARAGRAPH } from '../../lib/slides.js';
import { TECH_WORDS } from '../../lib/techStack.js';
import { FAQ_ITEMS } from '../../lib/faq.js';
import { trackEvent } from '../../lib/analytics.js';

const RESUME_URL = '/Satyam-Tiwari-Resume.pdf';
const UPWORK_URL =
  'https://www.upwork.com/freelancers/~017488413fc2713bec?mp_source=share';

const MID = { x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 };

/**
 * Motion languages (ShaderGradient-style layering):
 * - text(): foreground type — soft rise bottom→top + fade
 */
function text(from = 72, to = -96) {
  return {
    enter: { y: from, opacity: 0 },
    hold: MID,
    exit: { y: to, opacity: 0 },
  };
}

/** Cursor-tracking button — magnetic drift + tilt, falls back to plain CSS hover. */
function MagneticButton({ className = '', children, ...rest }) {
  const ref = useMagneticHover('button');
  return (
    <button ref={ref} className={`${className} magnetic`.trim()} {...rest}>
      <span className="magnetic-layer">{children}</span>
    </button>
  );
}

/** Cursor-tracking link, same motion language as MagneticButton. */
function MagneticLink({ className = '', children, ...rest }) {
  const ref = useMagneticHover('button');
  return (
    <a ref={ref} className={`${className} magnetic`.trim()} {...rest}>
      <span className="magnetic-layer">{children}</span>
    </a>
  );
}

const PROJECT_MOTIONS = [
  { title: text(64, -88), copy: text(88, -72) },
  { title: text(70, -92), copy: text(96, -78) },
  { title: text(60, -84), copy: text(80, -70) },
];

/**
 * Continuous scroll composition — text rises, atmosphere falls, mesh lives.
 */
export function PortfolioComposition({
  projects,
  onOpenProject,
  socialItems,
  caseOpen = false,
  EMAIL_MAILTO,
  PHONE_DISPLAY,
  PHONE_TEL,
  formData,
  setFormData,
  contactFormStatus,
  setContactFormStatus,
  contactFormError,
  contactHoneypot,
  setContactHoneypot,
  handleContactSubmit,
}) {
  return (
    <ScrollComposition projects={projects} caseOpen={caseOpen}>
      <IntroScene />
      <JourneyScene />
      {projects.map((project, i) => (
        <ProjectScene
          key={project.id}
          project={project}
          index={i}
          count={projects.length}
          motionSet={PROJECT_MOTIONS[i % PROJECT_MOTIONS.length]}
          onOpen={() => onOpenProject?.(i)}
        />
      ))}
      <ProcessScene />
      <StoryScene />
      <StoryCtaScene />
      <FaqScene />
      <ContactScene
        socialItems={socialItems}
        EMAIL_MAILTO={EMAIL_MAILTO}
        PHONE_DISPLAY={PHONE_DISPLAY}
        PHONE_TEL={PHONE_TEL}
        formData={formData}
        setFormData={setFormData}
        contactFormStatus={contactFormStatus}
        setContactFormStatus={setContactFormStatus}
        contactFormError={contactFormError}
        contactHoneypot={contactHoneypot}
        setContactHoneypot={setContactHoneypot}
        handleContactSubmit={handleContactSubmit}
      />
      <SocialDock items={socialItems} />
    </ScrollComposition>
  );
}

function IntroScene() {
  const [a, b] = SCENE.intro;
  const settled = { x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 };
  return (
    <section className="scene scene--intro" aria-label="Intro">
      <ScrollLayer
        range={[a, b]}
        className="layer layer--eyebrow"
        style={{ top: '18%', left: '50%', transform: 'translateX(-50%)' }}
        enter={settled}
        hold={settled}
        exit={{ y: -70, opacity: 0 }}
        holdRatio={0.4}
      >
        <p className="comp-eyebrow">Portfolio</p>
      </ScrollLayer>

      <ScrollLayer
        range={[a, b]}
        className="layer layer--hero-title"
        style={{ top: '32%', left: '50%', transform: 'translateX(-50%)', width: 'min(92vw, 52rem)', textAlign: 'center' }}
        enter={settled}
        hold={settled}
        exit={{ y: -110, opacity: 0 }}
        holdRatio={0.4}
      >
        <h1 className="comp-hero">Build with Satyam</h1>
      </ScrollLayer>

      <ScrollLayer
        range={[a, b]}
        className="layer layer--hero-line"
        style={{ top: '52%', left: '50%', transform: 'translateX(-50%)', width: 'min(90vw, 28rem)', textAlign: 'center' }}
        enter={settled}
        hold={settled}
        exit={{ y: -90, opacity: 0 }}
        holdRatio={0.4}
      >
        <p className="comp-lede">I build things people actually use.</p>
      </ScrollLayer>

      <ScrollLayer
        range={[a, b]}
        className="layer layer--hint"
        style={{ bottom: '18%', left: '50%', transform: 'translateX(-50%)' }}
        enter={settled}
        hold={settled}
        exit={{ y: 40, opacity: 0 }}
        holdRatio={0.45}
      >
        <p className="comp-hint">Keep scrolling</p>
      </ScrollLayer>
    </section>
  );
}

/**
 * Journey — the video plate carries the chapter while the tools that built the
 * work arrive one at a time. Once the last word clears, the plate itself
 * collapses into the device rect and hands off to the project grid.
 */
function JourneyScene() {
  const [a, b] = SCENE.journey;
  const span = b - a;

  /** Ends just before the plate starts collapsing, so the two don't overlap. */
  const wordsRange = [a + span * 0.14, a + span * 0.86];

  return (
    <section className="scene scene--journey" aria-label="Journey">
      <ScrollLayer
        range={[a, a + span * 0.22]}
        className="layer layer--journey-eyebrow"
        style={{ top: '12%', left: '50%', transform: 'translateX(-50%)' }}
        {...text(48, -80)}
        holdRatio={0.35}
      >
        <p className="comp-eyebrow">My journey</p>
      </ScrollLayer>

      {TECH_WORDS.map((word, i) => (
        <ScrollLayer
          key={word}
          range={beatRange(wordsRange, i, TECH_WORDS.length)}
          className="layer layer--journey-word"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          enter={{ y: 56, opacity: 0, scale: 0.94 }}
          hold={MID}
          exit={{ y: -48, opacity: 0, scale: 1.04 }}
          holdRatio={0.42}
        >
          <p className="comp-tech-word">{word}</p>
        </ScrollLayer>
      ))}
    </section>
  );
}

function ProjectScene({ project, index, count, motionSet, onOpen }) {
  const [a, b] = projectRange(index, count);
  const theme = projectTheme(project.id);

  return (
    <section className="scene scene--project" aria-label={project.name}>
      <div className="project-stage project-stage--copy-only">
        <div className="project-stage__copy">
          <ScrollLayer
            range={[a, b]}
            className="layer layer--project-title"
            enter={motionSet.title.enter}
            hold={motionSet.title.hold}
            exit={motionSet.title.exit}
            holdRatio={0.4}
          >
            <p className="comp-eyebrow">
              Project {String(index + 1).padStart(2, '0')}
            </p>
            <h2
              className="comp-project-name"
              style={{ color: theme.accent }}
            >
              {project.name}
            </h2>
            {project.role ? (
              <p className="comp-project-role">{project.role}</p>
            ) : null}
          </ScrollLayer>

          <ScrollLayer
            range={[a, b]}
            className="layer layer--project-copy"
            enter={motionSet.copy.enter}
            hold={motionSet.copy.hold}
            exit={motionSet.copy.exit}
            holdRatio={0.4}
          >
            <p className="comp-lede comp-lede--left">{project.summary}</p>
            <MagneticButton
              type="button"
              className="comp-cta"
              onClick={() => {
                onOpen?.();
                trackEvent('project_detail_open', { project_name: project.name });
              }}
            >
              View project
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </MagneticButton>
          </ScrollLayer>
        </div>
      </div>
    </section>
  );
}

function ProcessScene() {
  const [a, b] = SCENE.process;
  const span = Math.max(0.001, b - a);
  const typeStart = a + span * 0.08;
  const typeEnd = b - span * 0.2;

  return (
    <section className="scene scene--process" aria-label="About me">
      <ScrollLayer
        range={[a, b]}
        className="layer layer--process-paragraph"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(90vw, 36rem)',
        }}
        enter={{ y: 36, opacity: 0 }}
        hold={MID}
        exit={{ y: -28, opacity: 0 }}
        holdRatio={0.62}
      >
        <p className="comp-eyebrow comp-eyebrow--about">About me</p>
        <ScrollTypewriter
          text={ABOUT_PARAGRAPH}
          range={[typeStart, typeEnd]}
          className="comp-typewriter comp-typewriter--about"
        />
      </ScrollLayer>
    </section>
  );
}

function StoryCtaLinks({ ctas }) {
  return (
    <>
      <p className="comp-cta-panel__eyebrow">Next step</p>
      <div className="comp-cta-row comp-cta-row--story">
        {ctas.map((cta) => (
          <MagneticLink
            key={cta.label}
            href={cta.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cta.className}
            onClick={() => {
              if (cta.track) {
                trackEvent('click_outbound', {
                  link_url: cta.href,
                  link_text: cta.label,
                });
              }
            }}
          >
            {cta.label}
          </MagneticLink>
        ))}
      </div>
    </>
  );
}

function StoryCtaTakeover({ range: [start, end], ctas }) {
  const { progress, reducedMotion } = useScrollProgress();
  const span = Math.max(0.001, end - start);

  const shellOpacity = useTransform(
    progress,
    [start, start + span * 0.12, start + span * 0.7, end],
    [0, 1, 1, 0]
  );
  const scale = useTransform(
    progress,
    [start, start + span * 0.2, start + span * 0.48, start + span * 0.82, end],
    [0.92, 1, 1.05, 8, 10]
  );
  const radius = useTransform(
    progress,
    [start + span * 0.48, start + span * 0.82],
    [20, 0]
  );
  /** Buttons fade before the shell blooms — kept off the scaled layer so clicks stay reliable. */
  const contentOpacity = useTransform(
    progress,
    [start, start + span * 0.12, start + span * 0.48, start + span * 0.58],
    [0, 1, 1, 0]
  );
  const pointerEvents = useTransform(contentOpacity, (o) => (o > 0.4 ? 'auto' : 'none'));

  if (reducedMotion) {
    return (
      <div className="story-cta-overlay story-cta-overlay--static">
        <div className="comp-cta-panel">
          <StoryCtaLinks ctas={ctas} />
        </div>
      </div>
    );
  }

  return (
    <div className="story-cta-overlay">
      {/* Decorative grow — never captures clicks */}
      <motion.div
        className="comp-cta-takeover"
        aria-hidden
        style={{ opacity: shellOpacity, scale, borderRadius: radius }}
      />
      {/* Real CTAs — fade out before the shell scales up */}
      <motion.div
        className="comp-cta-panel comp-cta-panel--takeover"
        style={{ opacity: contentOpacity, pointerEvents }}
      >
        <StoryCtaLinks ctas={ctas} />
      </motion.div>
    </div>
  );
}

function StoryHorizontalSlide({ range: [start, end], text }) {
  const { progress, reducedMotion } = useScrollProgress();
  const trackRef = useRef(null);
  const [textWidth, setTextWidth] = useState(0);
  const span = Math.max(0.001, end - start);

  useLayoutEffect(() => {
    const measure = () => {
      if (trackRef.current) setTextWidth(trackRef.current.offsetWidth);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [text]);

  const x = useTransform(progress, (p) => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const w = textWidth || vw;
    const startX = vw;
    const endX = -w;
    if (p <= start) return startX;
    if (p >= end) return endX;
    const t = (p - start) / span;
    return startX + (endX - startX) * t;
  });

  const opacity = useTransform(
    progress,
    [start, start + span * 0.03, end - span * 0.05, end],
    [0, 1, 1, 0]
  );

  if (reducedMotion) {
    return (
      <div className="layer layer--story-slide layer--story-slide--static">
        <p className="story-slide__line">{text}</p>
      </div>
    );
  }

  return (
    <div className="layer layer--story-slide">
      <motion.div ref={trackRef} className="story-slide__track" style={{ x, y: '-50%', opacity }}>
        <p className="story-slide__line">{text}</p>
      </motion.div>
    </div>
  );
}

function StoryScene() {
  const [a, b] = SCENE.story;
  const story =
    "I don't remember the first app I tried to build. I remember not wanting to stop. That became a career.";

  return (
    <section className="scene scene--story" aria-label="Story">
      <StoryHorizontalSlide range={[a, b]} text={story} />
    </section>
  );
}

const STORY_CTAS = [
  {
    label: 'Read my resume',
    href: RESUME_URL,
    className: 'comp-cta comp-cta--story comp-cta--story-primary',
  },
  {
    label: "Let's work together",
    href: UPWORK_URL,
    className: 'comp-cta comp-cta--story comp-cta--story-ghost',
    track: true,
  },
];

function StoryCtaScene() {
  const [ctaStart, ctaEnd] = SCENE.storyCta;

  return (
    <section className="scene scene--story-cta" aria-label="Next step">
      <StoryCtaTakeover range={[ctaStart, ctaEnd]} ctas={STORY_CTAS} />
    </section>
  );
}

function FaqRow({ item }) {
  const ref = useMagneticHover('row');

  return (
    <details ref={ref} className="comp-faq__item magnetic">
      <summary className="comp-faq__summary magnetic-layer">{item.q}</summary>
      <p className="comp-faq__answer">{item.a}</p>
    </details>
  );
}

function FaqScene() {
  const [a, b] = SCENE.faq;

  return (
    <section className="scene scene--faq" id="faq" aria-label="FAQ">
      <ScrollLayer
        range={[a, b]}
        className="layer"
        style={{
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(92vw, 40rem)',
          textAlign: 'center',
        }}
        enter={{ y: 70, opacity: 0 }}
        hold={MID}
        exit={{ y: -40, opacity: 0 }}
        holdRatio={0.4}
      >
        <p className="comp-eyebrow">FAQ</p>
        <h2 className="comp-hero comp-hero--faq">Still got questions?</h2>
      </ScrollLayer>

      <ScrollLayer
        range={[a, b]}
        className="layer layer--faq-list"
        style={{
          top: '26%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(92vw, 36rem)',
        }}
        enter={{ y: 100, opacity: 0 }}
        hold={MID}
        exit={{ y: -20, opacity: 0 }}
        holdRatio={0.55}
      >
        <div className="comp-faq">
          {FAQ_ITEMS.map((item) => (
            <FaqRow key={item.q} item={item} />
          ))}
        </div>
      </ScrollLayer>
    </section>
  );
}

function ContactScene({
  socialItems = [],
  EMAIL_MAILTO,
  PHONE_DISPLAY,
  PHONE_TEL,
  formData,
  setFormData,
  contactFormStatus,
  setContactFormStatus,
  contactFormError,
  contactHoneypot,
  setContactHoneypot,
  handleContactSubmit,
}) {
  const [a, b] = SCENE.contact;

  return (
    <section className="scene scene--contact" id="contact" aria-label="Contact">
      <ScrollLayer
        range={[a, b]}
        className="layer"
        style={{ top: '14%', left: '50%', transform: 'translateX(-50%)', width: 'min(92vw, 40rem)', textAlign: 'center' }}
        enter={{ y: 90, opacity: 0 }}
        hold={MID}
        exit={{ y: -30, opacity: 1 }}
        holdRatio={0.45}
      >
        <p className="comp-eyebrow">Contact</p>
        <h2 className="comp-hero comp-hero--contact">Have something worth building?</h2>
      </ScrollLayer>

      <ScrollLayer
        range={[a, b]}
        className="layer layer--contact-panel"
        style={{ top: '32%', left: '50%', transform: 'translateX(-50%)', width: 'min(92vw, 36rem)' }}
        enter={{ y: 140, opacity: 0 }}
        hold={MID}
        exit={{ y: 0, opacity: 1 }}
        holdRatio={0.5}
      >
        <div className="comp-contact">
          <p className="comp-lede comp-lede--center">
            <a href={EMAIL_MAILTO}>satyamt5152@gmail.com</a>
            <span aria-hidden> · </span>
            <a href={PHONE_TEL}>{PHONE_DISPLAY}</a>
          </p>
          <div className="comp-contact__socials">
            {socialItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith('mailto:') ? undefined : '_blank'}
                rel={item.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                className="social-icon-btn"
                aria-label={item.label}
              >
                {item.icon}
              </a>
            ))}
          </div>

          <form className="comp-form" onSubmit={handleContactSubmit} noValidate>
            <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
              <label htmlFor="company_website">Company</label>
              <input
                id="company_website"
                name="company_website"
                tabIndex={-1}
                autoComplete="off"
                value={contactHoneypot}
                onChange={(e) => setContactHoneypot(e.target.value)}
              />
            </div>
            <div className="comp-form__row">
              <label>
                Name
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
                />
              </label>
            </div>
            <label>
              Message
              <textarea
                required
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData((d) => ({ ...d, message: e.target.value }))}
              />
            </label>
            {contactFormError ? <p className="comp-form__error">{contactFormError}</p> : null}
            <button
              type="submit"
              className="comp-cta"
              disabled={contactFormStatus === 'sending'}
              onClick={() => setContactFormStatus?.((s) => s)}
            >
              {contactFormStatus === 'sending'
                ? 'Sending…'
                : contactFormStatus === 'success'
                  ? 'Sent'
                  : 'Send message'}
            </button>
          </form>
        </div>
      </ScrollLayer>

      <ScrollLayer
        range={[a, b]}
        className="layer layer--contact-legal"
        style={{
          bottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(92vw, 36rem)',
          textAlign: 'center',
        }}
        enter={{ y: 24, opacity: 0 }}
        hold={MID}
        exit={{ y: 0, opacity: 1 }}
        holdRatio={0.55}
      >
        <p className="comp-legal">
          © {new Date().getFullYear()} Satyam Tiwari. All rights reserved.
        </p>
      </ScrollLayer>
    </section>
  );
}
