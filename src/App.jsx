import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  motion,
  AnimatePresence,
  animate,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from 'framer-motion';
import { 
  Github, 
  Linkedin, 
  Globe,
  Smartphone, 
  Layout, 
  Server, 
  ArrowRight, 
  Cpu, 
  X,
  Briefcase,
  Mail,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import gms1 from './assets/gms/gms1.png';
import gms2 from './assets/gms/gms2.png';
import gms3 from './assets/gms/gms3.png';
import gms4 from './assets/gms/gms4.png';
import sa1 from './assets/sa/sa1.png';
import sa2 from './assets/sa/sa2.png';
import sa3 from './assets/sa/sa3.png';
import sa4 from './assets/sa/sa4.png';
import woopdo1 from './assets/woopdo/woopdo1.png';
import woopdo2 from './assets/woopdo/woopdo2.png';
import woopdo3 from './assets/woopdo/woopdo3.png';
import woopdo4 from './assets/woopdo/woopdo4.png';
import waya1 from './assets/wayawaya/IMG_0193.PNG';
import waya2 from './assets/wayawaya/IMG_0194.PNG';
import waya3 from './assets/wayawaya/IMG_0195.PNG';
import waya4 from './assets/wayawaya/IMG_0196.PNG';
import waya5 from './assets/wayawaya/IMG_0197.PNG';
import waya6 from './assets/wayawaya/IMG_0198.PNG';
import uj1 from './assets/uj/IMG_0188.PNG';
import uj2 from './assets/uj/IMG_0189.PNG';
import uj3 from './assets/uj/IMG_0190.PNG';
import uj4 from './assets/uj/IMG_0191.PNG';
import uj5 from './assets/uj/IMG_0192.PNG';
import mobiurja1 from './assets/mobiurja/mobiurja1.png';
import nanda1 from './assets/nanda/nanda1.png';
import nanda2 from './assets/nanda/nanda2.png';
import nanda3 from './assets/nanda/nanda3.png';
import nanda4 from './assets/nanda/nanda4.png';
import puri1 from './assets/puri/puri1.png';
import puri2 from './assets/puri/puri2.png';
import picksy1 from './assets/picksy/picksy1.png';
import picksy2 from './assets/picksy/picksy2.png';
import picksy3 from './assets/picksy/picksy3.png';
import picksyVideo from './assets/picksy/picksy.mp4';
import nextoffer1 from './assets/nextoffer/nextoffer1.png';
import nextoffer2 from './assets/nextoffer/nextoffer2.png';
import nextoffer3 from './assets/nextoffer/nextoffer3.png';
import aboutPortrait from './assets/satyam.png';
import { trackEvent } from './lib/analytics.js';
import { handleSectionLinkClick } from './lib/scrollToSection.js';
import { HeroPhone } from './components/HeroPhone.jsx';
import { FaqSection } from './components/FaqSection.jsx';
import { AboutPortrait } from './components/AboutPortrait.jsx';
import { scrollRevealProps, useSiteAnimationsEnabled } from './context/SiteReadyContext.jsx';

const GMS_GALLERY = [gms1, gms2, gms3, gms4];
const SAFE_AGAIN_GALLERY = [sa1, sa2, sa3, sa4];
const WOOPDO_GALLERY = [woopdo1, woopdo2, woopdo3, woopdo4];
const WAYA_WAYA_GALLERY = [waya1, waya2, waya3, waya4, waya5, waya6];
const UJ_WAYFINDER_GALLERY = [uj1, uj2, uj3, uj4, uj5];
const PURI_GALLERY = [puri1, puri2];
const NANDA_GALLERY = [nanda1, nanda2, nanda3, nanda4];
const PICKSY_GALLERY = [picksy1, picksy2, picksy3];
const NEXTOFFER_GALLERY = [nextoffer1, nextoffer2, nextoffer3];

/** Fixed site theme — off-white, near-black, blue accent (ui-ux-pro-max) */
const SITE_THEME = {
  marqueeFadeRgb: '250,250,250',
  designCardHoverShadow:
    'group-hover:shadow-[0_20px_44px_-16px_rgba(9,9,11,0.08)]',
  designAccent1: '#2563EB',
};

function aspectRatioCss(w, h) {
  if (!w || !h) return '16 / 9';
  return `${w} / ${h}`;
}

const SLIDESHOW_SWIPE_MIN_PX = 50;

/** Auto-advancing slideshow; optional video as first slide, then images. */
function ProjectPreviewSlideshow({
  images,
  video,
  videoPoster,
  projectName,
  reducedMotion,
  onAspectRatioChange,
  variant = 'default',
  showDots = true,
}) {
  const hasVideo = Boolean(video);
  const slideCount = (hasVideo ? 1 : 0) + images.length;
  const isVideoSlide = (i) => hasVideo && i === 0;
  const [index, setIndex] = useState(0);
  const [dimsByIndex, setDimsByIndex] = useState({});
  const onAspectRef = useRef(onAspectRatioChange);
  const videoRef = useRef(null);
  const pointerStartRef = useRef(null);
  const suppressClickRef = useRef(false);
  const suppressClickTimeoutRef = useRef(null);
  const isCard = variant === 'card';
  const multi = slideCount > 1;

  useLayoutEffect(() => {
    onAspectRef.current = onAspectRatioChange;
  });

  useEffect(() => {
    if (!hasVideo) return;
    const el = document.createElement('video');
    const onMeta = () => {
      const w = el.videoWidth;
      const h = el.videoHeight;
      if (!w || !h) return;
      setDimsByIndex((prev) => ({ ...prev, 0: { w, h } }));
    };
    el.addEventListener('loadedmetadata', onMeta);
    el.src = video;
    return () => {
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeAttribute('src');
      el.load();
    };
  }, [video, hasVideo]);

  useEffect(() => {
    let cancelled = false;
    images.forEach((src, i) => {
      const slideIndex = hasVideo ? i + 1 : i;
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) return;
        setDimsByIndex((prev) => ({ ...prev, [slideIndex]: { w, h } }));
      };
      img.src = src;
    });
    return () => {
      cancelled = true;
    };
  }, [images, hasVideo]);

  useLayoutEffect(() => {
    if (!onAspectRef.current) return;
    const d = dimsByIndex[index];
    if (isVideoSlide(index) && !d?.w) {
      onAspectRef.current('9 / 16');
      return;
    }
    onAspectRef.current(aspectRatioCss(d?.w, d?.h));
  }, [index, dimsByIndex, hasVideo]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !hasVideo) return;
    if (isVideoSlide(index)) {
      if (!reducedMotion) {
        el.play().catch(() => {});
      }
    } else {
      el.pause();
    }
  }, [index, reducedMotion, hasVideo]);

  useEffect(() => {
    if (reducedMotion || slideCount <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slideCount);
    }, 5500);
    return () => window.clearInterval(id);
  }, [slideCount, reducedMotion]);

  useEffect(
    () => () => {
      if (suppressClickTimeoutRef.current) {
        window.clearTimeout(suppressClickTimeoutRef.current);
      }
    },
    []
  );

  const releasePointerIfCaptured = (target, pointerId) => {
    try {
      if (target?.hasPointerCapture?.(pointerId)) {
        target.releasePointerCapture(pointerId);
      }
    } catch {
      /* ignore */
    }
  };

  const scheduleSuppressClickClear = () => {
    suppressClickRef.current = true;
    if (suppressClickTimeoutRef.current) {
      window.clearTimeout(suppressClickTimeoutRef.current);
    }
    suppressClickTimeoutRef.current = window.setTimeout(() => {
      suppressClickRef.current = false;
      suppressClickTimeoutRef.current = null;
    }, 450);
  };

  const handlePointerDown = (e) => {
    if (!multi) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      pointerId: e.pointerId,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerUpOrCancel = (e) => {
    const start = pointerStartRef.current;
    if (!start || start.pointerId !== e.pointerId) return;
    releasePointerIfCaptured(e.currentTarget, e.pointerId);
    pointerStartRef.current = null;

    if (e.type === 'pointercancel') return;

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const mostlyHorizontal =
      Math.abs(dx) >= SLIDESHOW_SWIPE_MIN_PX &&
      Math.abs(dx) > Math.abs(dy) * 0.85;
    if (!mostlyHorizontal) return;

    scheduleSuppressClickClear();
    if (dx < 0) {
      setIndex((i) => (i + 1) % slideCount);
    } else {
      setIndex((i) => (i - 1 + slideCount) % slideCount);
    }
  };

  const handleLostPointerCapture = (e) => {
    if (pointerStartRef.current?.pointerId === e.pointerId) {
      pointerStartRef.current = null;
    }
  };

  const handleStageClick = (e) => {
    if (!suppressClickRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    suppressClickRef.current = false;
    if (suppressClickTimeoutRef.current) {
      window.clearTimeout(suppressClickTimeoutRef.current);
      suppressClickTimeoutRef.current = null;
    }
  };

  const handleImgLoad = (e) => {
    const el = e.currentTarget;
    const i = Number(el.dataset.slideIndex);
    if (Number.isNaN(i)) return;
    const w = el.naturalWidth;
    const h = el.naturalHeight;
    if (!w || !h) return;
    setDimsByIndex((prev) => ({ ...prev, [i]: { w, h } }));
  };

  const stagePb = isCard
    ? showDots
      ? 'pb-7 sm:pb-8'
      : 'pb-0'
    : 'pb-9 sm:pb-10';
  const dotWrapBottom = isCard ? 'bottom-1.5' : 'bottom-2.5';
  const dotActive = isCard ? 'w-5 bg-white shadow-sm' : 'w-6 bg-mocha-600';
  const dotIdle = isCard
    ? 'w-2 bg-white/45 hover:bg-white/75'
    : 'w-2 bg-mocha-400/50 hover:bg-mocha-500/70';
  const imgClass = isCard
    ? 'max-h-full max-w-full object-contain object-center rounded-md shadow-lg transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100 pointer-events-none'
    : 'max-h-full max-w-full object-contain object-center rounded-2xl pointer-events-none';
  const videoClass = isCard
    ? 'max-h-full max-w-full object-contain object-center rounded-md shadow-lg pointer-events-auto'
    : 'max-h-full max-w-full object-contain object-center rounded-2xl pointer-events-auto';

  const handleVideoMeta = (e) => {
    const el = e.currentTarget;
    const w = el.videoWidth;
    const h = el.videoHeight;
    if (!w || !h) return;
    setDimsByIndex((prev) => ({ ...prev, 0: { w, h } }));
  };

  const slideLabel = (i) => {
    if (isVideoSlide(i)) return 'demo video';
    const shot = hasVideo ? i : i + 1;
    return `screenshot ${shot} of ${images.length}`;
  };

  return (
    <div className="relative h-full min-h-0 w-full">
      <div
        className={`flex h-full min-h-0 w-full items-center justify-center pt-0 ${stagePb} ${multi ? 'touch-pan-y select-none cursor-grab active:cursor-grabbing' : ''}`}
        role={multi ? 'region' : undefined}
        aria-roledescription={multi ? 'carousel' : undefined}
        aria-label={
          multi
            ? showDots
              ? `${projectName} preview, ${index + 1} of ${slideCount}. Swipe horizontally or use the dots.`
              : `${projectName} preview, ${index + 1} of ${slideCount}. Swipe horizontally to change.`
            : undefined
        }
        onPointerDownCapture={handlePointerDown}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        onLostPointerCapture={handleLostPointerCapture}
        onClick={handleStageClick}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isVideoSlide(index) ? (
            <motion.video
              key="video"
              ref={videoRef}
              src={video}
              poster={videoPoster}
              controls
              playsInline
              muted
              loop
              autoPlay={!reducedMotion}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
              className={videoClass}
              onLoadedMetadata={handleVideoMeta}
              aria-label={`${projectName} demo video`}
            />
          ) : (
            <motion.img
              key={index}
              data-slide-index={index}
              src={images[hasVideo ? index - 1 : index]}
              alt={`${projectName} — ${slideLabel(index)}`}
              draggable={false}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
              className={imgClass}
              onLoad={handleImgLoad}
            />
          )}
        </AnimatePresence>
      </div>
      {showDots && slideCount > 1 && (
        <div
          className={`absolute ${dotWrapBottom} left-0 right-0 flex justify-center gap-1.5 px-2 sm:gap-2`}
          role="tablist"
          aria-label="Project preview slides"
        >
          {Array.from({ length: slideCount }, (_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={isVideoSlide(i) ? 'Show demo video' : `Show screenshot ${hasVideo ? i : i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? dotActive : dotIdle
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function designCardSlides(d) {
  return d.gallery?.length ? d.gallery : [d.image];
}

function projectStatusLabel(meta) {
  const token = meta.split(' · ').pop()?.trim();
  if (!token) return null;
  const known = ['Live', 'Concept', 'Pre-production'];
  return known.includes(token) ? token : null;
}

function projectMetaSubtitle(meta) {
  const parts = meta.split(' · ').filter(Boolean);
  const status = projectStatusLabel(meta);
  const withoutStatus = status ? parts.slice(0, -1) : parts;
  return withoutStatus.join(' · ');
}

const PROJECT_STATUS_STYLES = {
  Live: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
  Concept: 'bg-amber-50 text-amber-900 ring-amber-200/80',
  'Pre-production': 'bg-mocha-100 text-mocha-700 ring-mocha-200/80',
};

function projectCategory(meta) {
  return meta.split(' · ')[0] || meta;
}

function ProjectStatusBadge({ meta }) {
  const status = projectStatusLabel(meta);
  if (!status) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${PROJECT_STATUS_STYLES[status] ?? 'bg-mocha-100 text-mocha-600 ring-mocha-200/80'}`}
    >
      {status}
    </span>
  );
}

function WorkProjectPreview({ src, alt, frame = 'mobile' }) {
  if (frame === 'web') {
    return (
      <div className="work-project-card__media work-project-card__media--web">
        <div className="work-project-card__browser">
          <div className="work-project-card__browser-bar" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className="work-project-card__browser-screen">
            <img src={src} alt={alt} className="work-project-card__shot" loading="lazy" decoding="async" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="work-project-card__media work-project-card__media--mobile">
      <div className="work-project-card__phone" aria-hidden>
        <div className="work-project-card__phone-island" />
        <div className="work-project-card__phone-screen">
          <img src={src} alt={alt} className="work-project-card__shot" loading="lazy" decoding="async" />
        </div>
      </div>
    </div>
  );
}

function DesignCardPreview({ design, reducedMotion, designCardHoverShadow }) {
  const slides = designCardSlides(design);
  return (
    <div
      className={`aspect-[4/3] w-full min-h-0 rounded-xl overflow-hidden flex flex-col ring-1 ring-mocha-700/10 group-hover:ring-mocha-700/20 transition-[box-shadow,ring-color] duration-300 ${designCardHoverShadow} motion-reduce:group-hover:shadow-none motion-reduce:group-hover:ring-mocha-700/10`}
      style={{ backgroundColor: design.accent }}
    >
      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-6">
        <ProjectPreviewSlideshow
          key={design.name}
          images={slides}
          projectName={design.name}
          reducedMotion={reducedMotion}
          variant="card"
          showDots={false}
        />
      </div>
    </div>
  );
}

const MediumIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.78-6.82A6.8 6.8 0 0113.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
  </svg>
);

const SECTION_EASE = [0.22, 1, 0.36, 1];

const sectionHeadStaggerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.14, delayChildren: 0.08 },
  },
};

const sectionLineRevealVariants = {
  hidden: { opacity: 0, y: 32, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.75, ease: SECTION_EASE },
  },
};

const sectionFadeUpVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: SECTION_EASE },
  },
};

const sectionListStaggerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.12 },
  },
};

const sectionListItemFadeUpVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: SECTION_EASE },
  },
};

const sectionCardStaggerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const sectionCardItemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: SECTION_EASE },
  },
};

const sectionProjectRowVariants = {
  hidden: { opacity: 0, x: -22 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: SECTION_EASE },
  },
};

function Navbar() {
  const navLink = (hash, label) => (
    <a
      href={hash}
      onClick={(e) => handleSectionLinkClick(e, hash)}
      className="hover:text-mocha-800 transition-colors"
    >
      {label}
    </a>
  );

  return (
    <nav
      className="fixed top-0 w-full z-50 bg-mocha-50/55 backdrop-blur-md border-b border-mocha-200/45 py-3 px-6"
      aria-label="Primary"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-3 gap-x-4">
        <a
          href="#home"
          onClick={(e) => handleSectionLinkClick(e, 'home')}
          className="flex items-center gap-2.5 font-service text-lg font-bold tracking-tight text-mocha-800 hover:text-mocha-700 transition-colors shrink-0"
        >
          <img
            src={aboutPortrait}
            alt=""
            className="h-8 w-8 rounded-full object-cover object-center ring-1 ring-mocha-300/80"
            decoding="async"
            width={32}
            height={32}
          />
          Satyam
        </a>
        <div className="hidden md:flex flex-1 justify-center gap-6 text-xs font-medium text-mocha-600">
          {navLink('#home', 'Home')}
          {navLink('#services', 'Approach')}
          {navLink('#work', 'Work')}
          {navLink('#about', 'Story')}
          {navLink('#faq', 'FAQ')}
          {navLink('#contact', 'Contact')}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="#contact"
            onClick={(e) => handleSectionLinkClick(e, 'contact')}
            className="border border-mocha-600/45 px-4 sm:px-5 py-1.5 rounded-md text-xs font-medium text-mocha-600 hover:text-white hover:bg-accent transition-all shrink-0"
          >
            Say hello
          </a>
        </div>
      </div>
    </nav>
  );
}

const RESUME_URL = "/Satyam-Tiwari-Resume.pdf";
const MEDIUM_URL = "https://medium.com/@satyamt5152";

/** Get a free key at https://web3forms.com — set `VITE_WEB3FORMS_ACCESS_KEY` in `.env.local` */
const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY ?? "";
const GITHUB_URL = "https://github.com/satyyyaamm";
const LINKEDIN_URL = "https://www.linkedin.com/in/satyam-tiwari-a03299200";
const UPWORK_URL =
  "https://www.upwork.com/freelancers/~017488413fc2713bec?mp_source=share";
const EMAIL_MAILTO = "mailto:satyamt5152@gmail.com";
const PHONE_DISPLAY = "+91 87933 80992";
const PHONE_TEL = "tel:+918793380992";

function SocialLinks({ className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="GitHub">
        <Github size={16} strokeWidth={1.75} />
      </a>
      <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="LinkedIn">
        <Linkedin size={16} strokeWidth={1.75} />
      </a>
      <a href={MEDIUM_URL} target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="Medium">
        <MediumIcon className="h-4 w-4" />
      </a>
      <a href={EMAIL_MAILTO} className="social-icon-btn" aria-label="Email">
        <Mail size={16} strokeWidth={1.75} />
      </a>
    </div>
  );
}

const techMarqueeItems = [
  "Flutter",
  "Dart",
  "JavaScript",
  "React Native",
  "Next.js",
  "React",
  "Node.js",
  "Django",
  "MongoDB",
  "Firebase",
  "Firestore",
  "REST APIs",
  "Riverpod",
  "GoRouter",
  "BLE",
  "Maps",
  "SQLite",
  "Git",
  "CI/CD",
  "TestFlight",
  "App Store Connect",
  "iOS",
  "Android",
  "Figma",
  "Jira",
  "Trello",
  "Notion",
];

const techPillClass =
  "inline-flex shrink-0 items-center rounded border border-mocha-600/25 bg-white/75 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-mocha-600 shadow-sm backdrop-blur-sm sm:px-2.5 sm:py-1.5 sm:text-[10px]";

function TechMarqueePill({ label, staggerIndex, animating }) {
  const hidden = { opacity: 0, y: 18, scale: 0.92 };
  const visible = { opacity: 1, y: 0, scale: 1 };
  return (
    <motion.span
      className={techPillClass}
      initial={hidden}
      animate={animating ? visible : hidden}
      transition={{
        delay: animating ? 0.14 + staggerIndex * 0.034 : 0,
        type: 'spring',
        stiffness: 440,
        damping: 26,
        mass: 0.85,
      }}
    >
      {label}
    </motion.span>
  );
}

function TechMarqueeStrip({ items, animating }) {
  const doubled = [...items, ...items];
  return (
    <div
      className="tech-marquee-track flex w-max gap-2 sm:gap-2.5"
      style={{ '--tech-marquee-duration': '48s' }}
    >
      {doubled.map((label, i) => (
        <TechMarqueePill key={`${label}-${i}`} label={label} staggerIndex={i} animating={animating} />
      ))}
    </div>
  );
}

/**
 * Auto-marquee keeps running (infinite CSS animation) while the outer area scrolls horizontally
 * so users can swipe/drag without stopping the motion. `animated={false}` for reduced-motion swipe rows.
 */
function TechMarqueeScrollable({ edgeFade, animated = true, animating = true }) {
  return (
    <div
      className="tech-marquee-scroll relative mx-auto w-full max-w-7xl touch-pan-x overflow-x-auto overflow-y-hidden overscroll-x-contain py-2"
      style={{
        maskImage: edgeFade,
        WebkitMaskImage: edgeFade,
      }}
      role="region"
      aria-label={
        animated
          ? "Technologies — continuously scrolling; swipe or scroll sideways to move the view"
          : "Technologies — swipe sideways to see more"
      }
      tabIndex={0}
    >
      <div className="flex min-h-10 items-center sm:min-h-[2.75rem]">
        {animated ? (
          <TechMarqueeStrip items={techMarqueeItems} animating={animating} />
        ) : (
          <div className="flex min-h-10 w-max items-center gap-2 sm:min-h-[2.75rem] sm:gap-2.5 pr-10">
            {techMarqueeItems.map((label) => (
              <span key={label} className={`${techPillClass} shrink-0`}>
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function useTechMarqueeSwipeMode() {
  const [swipeMode, setSwipeMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(max-width: 767px)").matches
    );
  });

  useEffect(() => {
    const sync = () => {
      setSwipeMode(
        window.matchMedia("(pointer: coarse)").matches ||
          window.matchMedia("(max-width: 767px)").matches
      );
    };
    const qCoarse = window.matchMedia("(pointer: coarse)");
    const qNarrow = window.matchMedia("(max-width: 767px)");
    qCoarse.addEventListener("change", sync);
    qNarrow.addEventListener("change", sync);
    return () => {
      qCoarse.removeEventListener("change", sync);
      qNarrow.removeEventListener("change", sync);
    };
  }, []);

  return swipeMode;
}

function HeroTechMarquee({ fadeRgb = '249,246,240' }) {
  const reduced = useReducedMotion();
  const animating = useSiteAnimationsEnabled();
  const swipeMode = useTechMarqueeSwipeMode();

  const edgeFade = useMemo(
    () =>
      `linear-gradient(90deg, transparent 0%, rgba(${fadeRgb},0.2) 8%, rgba(${fadeRgb},0.75) 20%, rgb(${fadeRgb}) 38%, rgb(${fadeRgb}) 62%, rgba(${fadeRgb},0.75) 80%, rgba(${fadeRgb},0.2) 92%, transparent 100%)`,
    [fadeRgb]
  );

  const titleSm = "mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-mocha-500";
  const titleLg = "mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-mocha-500";

  if (reduced && swipeMode) {
    return (
      <div className="mt-14 w-full max-w-7xl md:mt-20">
        <p className={titleSm}>Technologies I use</p>
        <TechMarqueeScrollable edgeFade={edgeFade} animated={false} />
      </div>
    );
  }

  if (reduced) {
    return (
      <div className="mt-14 w-full max-w-7xl md:mt-20">
        <p className={titleSm}>Technologies I use</p>
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
          {techMarqueeItems.map((label) => (
            <span key={label} className={techPillClass}>
              {label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="mt-14 w-full md:mt-20"
      initial={{ opacity: 0, y: 24 }}
      animate={animating ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ delay: animating ? 0.45 : 0, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className={titleLg}>Technologies I use</p>
      <TechMarqueeScrollable edgeFade={edgeFade} animating={animating} />
    </motion.div>
  );
}

function ProjectDetailDialog({ project, onClose }) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!project) return null;

  const hasLiveLink = project.href && project.href !== '#';

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-mocha-950/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close case study"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-detail-title"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="case-study-modal relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-mocha-200/90 bg-mocha-50 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="case-study-modal__header">
          <div className="min-w-0 flex-1 pr-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <ProjectStatusBadge meta={project.meta} />
              <span className="text-[11px] font-medium text-mocha-500">{project.role}</span>
            </div>
            <h2 id="project-detail-title" className="font-service text-xl sm:text-2xl font-bold tracking-tight text-mocha-800">
              {project.name}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-mocha-500 leading-relaxed">
              {projectMetaSubtitle(project.meta)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-mocha-500 transition-colors hover:bg-mocha-200 hover:text-mocha-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-mocha-700/35"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className="case-study-modal__body">
          <div className="case-study-modal__preview">
            <img
              src={project.image}
              alt=""
              className="max-h-[min(42vh,280px)] w-full object-contain object-center"
              decoding="async"
            />
          </div>

          <div className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
            <section>
              <h3 className="case-study-modal__label">Overview</h3>
              <p className="mt-2 text-sm sm:text-[15px] leading-relaxed text-mocha-600">{project.desc}</p>
            </section>

            {project.highlights?.length > 0 && (
              <section>
                <h3 className="case-study-modal__label">Key deliverables</h3>
                <ul className="mt-3 space-y-2">
                  {project.highlights.map((line, hi) => (
                    <li
                      key={hi}
                      className="flex gap-3 rounded-lg border border-mocha-200/80 bg-white px-3.5 py-3 text-sm leading-relaxed text-mocha-600"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mocha-600" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {project.video && (
              <section>
                <h3 className="case-study-modal__label">Demo</h3>
                <div className="mt-3 overflow-hidden rounded-xl border border-mocha-200/80 bg-mocha-100">
                  <video
                    src={project.video}
                    poster={project.image}
                    className="max-h-[min(50vh,420px)] w-full object-contain"
                    controls
                    playsInline
                    preload="metadata"
                    aria-label={`${project.name} demo video`}
                  />
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="case-study-modal__footer">
          <button type="button" onClick={onClose} className="case-study-modal__btn-secondary">
            Close
          </button>
          {hasLiveLink && (
            <a
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              className="case-study-modal__btn-primary"
              onClick={() =>
                trackEvent('click_outbound', {
                  link_url: project.href,
                  link_text: `${project.name} case study`,
                })
              }
            >
              Visit live site
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Coarse pointer: drift the hero glow between random points near each screen corner (no fixed loop). */
function CoarsePointerAmbientGlow() {
  const animating = useSiteAnimationsEnabled();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);

  useEffect(() => {
    if (!animating) return undefined;

    let cancelled = false;

    const randomTarget = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const md = window.matchMedia("(min-width: 768px)").matches;
      const leftPct = md ? 0.08 : 0.04;
      const topPct = md ? 0.1 : 0.08;
      // Smaller orb + blur on phones so the glow does not wash the whole screen; tablet+ unchanged.
      const size = md ? Math.min(0.7 * vw, 380) : Math.min(0.52 * vw, 200);
      const blurPx = md ? 88 : 52;
      const maxScale = 1.17;
      const pad = blurPx + ((maxScale - 1) * size) / 2 + 20;

      const left0 = leftPct * vw;
      const top0 = topPct * vh;
      let minX = -left0 - pad;
      let maxX = vw - left0 - size + pad;
      let minY = -top0 - pad;
      let maxY = vh - top0 - size + pad;

      if (maxX < minX) {
        const mid = (minX + maxX) / 2;
        minX = mid;
        maxX = mid;
      }
      if (maxY < minY) {
        const mid = (minY + maxY) / 2;
        minY = mid;
        maxY = mid;
      }

      return {
        x: minX + Math.random() * (maxX - minX),
        y: minY + Math.random() * (maxY - minY),
        scale: 0.85 + Math.random() * 0.32,
        duration: 4.5 + Math.random() * 6.5,
      };
    };

    const loop = async () => {
      await new Promise((r) => requestAnimationFrame(r));
      while (!cancelled) {
        const t = randomTarget();
        await Promise.all([
          animate(x, t.x, { duration: t.duration, ease: [0.25, 0.08, 0.25, 1] }),
          animate(y, t.y, { duration: t.duration, ease: [0.25, 0.08, 0.25, 1] }),
          animate(scale, t.scale, { duration: t.duration, ease: [0.25, 0.08, 0.25, 1] }),
        ]);
      }
    };
    loop();
    return () => {
      cancelled = true;
    };
    // MotionValues are stable for the lifetime of this component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animating]);

  if (!animating) return null;

  return (
    <motion.div
      className="pointer-events-none fixed left-[4%] top-[8%] z-[1] h-[min(52vw,200px)] w-[min(52vw,200px)] rounded-full blur-[52px] bg-accent/16 md:left-[8%] md:top-[10%] md:h-[min(70vw,380px)] md:w-[min(70vw,380px)] md:blur-[88px] md:bg-accent/12"
      style={{ x, y, scale }}
      aria-hidden
    />
  );
}

function DesignImageLightbox({ title, images, onClose }) {
  const [index, setIndex] = useState(0);
  const n = images.length;

  useEffect(() => {
    setIndex(0);
  }, [title]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (n <= 1) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIndex((i) => (i - 1 + n) % n);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIndex((i) => (i + 1) % n);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, n]);

  const goPrev = () => setIndex((i) => (i - 1 + n) % n);
  const goNext = () => setIndex((i) => (i + 1) % n);

  return (
    <div className="fixed inset-0 z-[110]">
      <button
        type="button"
        className="absolute inset-0 z-0 bg-mocha-950/88 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close full-size images"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="pointer-events-auto absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white text-mocha-900 shadow-md ring-1 ring-mocha-900/15 transition-colors hover:bg-mocha-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-mocha-950 sm:right-4 sm:top-4 sm:h-10 sm:w-10"
        aria-label="Close full-size view"
      >
        <X className="h-5 w-5" strokeWidth={2.25} aria-hidden />
      </button>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="design-lightbox-title"
        className="relative z-10 flex h-full min-h-0 flex-col p-3 pt-14 sm:p-5 sm:pt-16 pointer-events-none"
      >
        <div className="pointer-events-auto flex shrink-0 items-center pb-2 sm:pb-3 pr-11 sm:pr-12">
          <p
            id="design-lightbox-title"
            className="min-w-0 truncate text-sm font-medium text-mocha-50 sm:text-base"
          >
            {title}
          </p>
        </div>

        <div className="pointer-events-none flex min-h-0 flex-1 items-center justify-center gap-1 sm:gap-3">
          {n > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="pointer-events-auto shrink-0 rounded-full p-2 text-mocha-100 transition-colors hover:bg-white/10 sm:p-3"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} aria-hidden />
            </button>
          )}
          <div className="pointer-events-auto flex min-h-0 min-w-0 flex-1 items-center justify-center px-1">
            <img
              src={images[index]}
              alt={`${title} — full size ${index + 1} of ${n}`}
              className="max-h-[min(88dvh,100%)] w-auto max-w-full object-contain shadow-2xl"
            />
          </div>
          {n > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="pointer-events-auto shrink-0 rounded-full p-2 text-mocha-100 transition-colors hover:bg-white/10 sm:p-3"
              aria-label="Next image"
            >
              <ChevronRight className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} aria-hidden />
            </button>
          )}
        </div>

        {n > 1 && (
          <p className="pointer-events-auto pt-2 text-center text-xs text-mocha-200/90">
            {index + 1} / {n}
          </p>
        )}
      </div>
    </div>
  );
}

const App = () => {
  const [projectDetailIndex, setProjectDetailIndex] = useState(null);
  const [designLightbox, setDesignLightbox] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [contactFormStatus, setContactFormStatus] = useState('idle');
  const [contactFormError, setContactFormError] = useState('');
  const [contactHoneypot, setContactHoneypot] = useState('');
  const [pointerCoarse, setPointerCoarse] = useState(false);
  const reducedMotion = useReducedMotion();
  const animating = useSiteAnimationsEnabled();

  const designCardHoverShadow = SITE_THEME.designCardHoverShadow;

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 30, stiffness: 200 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const mqCoarse = window.matchMedia("(pointer: coarse)");
    const mqNarrow = window.matchMedia("(max-width: 767px)");
    const sync = () => setPointerCoarse(mqCoarse.matches || mqNarrow.matches);
    sync();
    mqCoarse.addEventListener("change", sync);
    mqNarrow.addEventListener("change", sync);
    return () => {
      mqCoarse.removeEventListener("change", sync);
      mqNarrow.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || pointerCoarse || !animating) return;
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX - 200);
      mouseY.set(e.clientY - 200);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
    // mouseX / mouseY are stable MotionValue instances from useMotionValue
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, pointerCoarse, animating]);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactFormError('');
    if (contactHoneypot) return;

    if (!WEB3FORMS_ACCESS_KEY) {
      setContactFormStatus('error');
      setContactFormError(
        'Form is not configured yet. Add VITE_WEB3FORMS_ACCESS_KEY to .env.local (see .env.example), or email satyamt5152@gmail.com directly.'
      );
      return;
    }

    setContactFormStatus('sending');
    try {
      const subject = formData.subject.trim() || 'Portfolio — New message';
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject,
          name: formData.name.trim(),
          from_name: formData.name.trim(),
          email: formData.email.trim(),
          replyto: formData.email.trim(),
          phone: formData.phone.trim() || '—',
          message: formData.message.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setContactFormStatus('success');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        setContactHoneypot('');
        trackEvent('contact_form_submit', { method: 'web3forms' });
      } else {
        setContactFormStatus('error');
        setContactFormError(typeof data.message === 'string' ? data.message : 'Something went wrong. Try again or email directly.');
      }
    } catch {
      setContactFormStatus('error');
      setContactFormError('Network error. Check your connection or email satyamt5152@gmail.com.');
    }
  };

  const services = [
    {
      title: 'Mobile development',
      icon: Smartphone,
      desc: 'Cross-platform iOS and Android in Flutter—one codebase, polished UX, and builds ready for store submission.',
    },
    {
      title: 'Web interfaces',
      icon: Layout,
      desc: 'Dashboards, marketing sites, and admin tools in Next.js and React, aligned with the mobile product experience.',
    },
    {
      title: 'Backend & APIs',
      icon: Server,
      desc: 'Auth, data models, and integrations on Firebase, MongoDB, and Node or Django—structured for production load.',
    },
    {
      title: 'Technical ownership',
      icon: Cpu,
      desc: 'Architecture, implementation, QA, and release planning from first prototype through post-launch maintenance.',
    },
    {
      title: 'Store distribution',
      icon: Briefcase,
      desc: 'Certificates, provisioning, review prep, TestFlight, and Play Console—the full path from build to live.',
    },
    {
      title: 'Remote collaboration',
      icon: Globe,
      desc: 'Async updates, clear documentation, and Figma-to-code handoffs for founders and teams across time zones.',
    },
  ];

  const projects = [
    {
      id: 0,
      name: "OSAC GMS",
      meta: "Garage Management · Flutter · Aug 2025 – Present · Pre-production",
      role: "Sole developer & technical owner",
      summary:
        "A workshop tool taking shape—quotations, job cards, and technician diaries in one place so garages spend less time chasing paper and more time on the floor.",
      desc: "Full-scale garage management for automotive service centers: quotations, invoices, job cards tied to vehicle registration, technician time tracking, admin configuration, and finance (in progress)—built in Flutter with modular architecture.",
      highlights: [
        "Sales workflows: quotations, invoices, job cards (VRM-linked), task diary assigning jobs to technicians and ramps.",
        "Technician module: assigned jobs, check-in/out, lunch breaks, and time tracking per task.",
        "Admin: staff, inventory, workshop resources, profile/task templates for repeatable job creation.",
        "Stack: Flutter & Dart, Riverpod, GoRouter—designed for multi-role access and long-term maintainability.",
      ],
      image: gms1,
      gallery: GMS_GALLERY,
      previewFrame: 'web',
      href: "#",
    },
    {
      id: 1,
      name: "Picksy",
      meta: "Social decision-making · Mobile · 2025 · Concept",
      role: "Product design & mobile UX",
      summary:
        "For nights when nobody can agree—swipe on movies, food, or plans with friends until the group finds a match worth leaving the couch for.",
      desc: "Social swipe-and-match app for groups choosing what to watch, eat, or do together—room lobbies, category filters, Tinder-style voting, group matches, chat, and profile stats in a dark neon UI built for friends deciding together.",
      highlights: [
        "Multi-category rooms (movies, restaurants, activities) with mood presets, genre/platform filters, and shareable room codes.",
        "Swipe flow with like, maybe, and pass—plus social proof showing what friends in the room already picked.",
        "Group match celebrations, watchlist/history, and integrated chat to lock in plans without leaving the app.",
      ],
      image: picksy2,
      previewImage: picksy3,
      gallery: PICKSY_GALLERY,
      video: picksyVideo,
      previewFrame: 'mobile',
      href: "#",
    },
    {
      id: 2,
      name: "NextOffer.ai",
      meta: "AI job search · Next.js · 2026 · Live",
      role: "Founder & full-stack developer",
      summary:
        "A job search companion that reads your resume, scores each role, and helps you send applications that actually sound like you—not a template.",
      desc: "AI-powered job hunt platform: resume-tailored search with per-role compatibility scores, multi-source job aggregation, LinkedIn profile analysis, and one-click ATS application kits—landing, dashboard, and optimiser flows deployed on Firebase.",
      highlights: [
        "Job search dashboard with saved profile, skill tags, and filters for remote/hybrid, experience level, salary, and job sources (JSearch, Jooble, Adzuna).",
        "LinkedIn optimiser: PDF upload or paste-in analysis with scored sections, strengths, and prioritised improvement list.",
        "Application kit generation and freemium pricing (Free, Weekly Sprint, Monthly Pro) with Google sign-in.",
      ],
      image: nextoffer1,
      gallery: NEXTOFFER_GALLERY,
      previewFrame: 'web',
      href: "https://nextoffer-ai.web.app",
    },
    {
      id: 3,
      name: "Waya Waya",
      meta: "Mall rewards & discovery · Flutter · Nov 2021 – Present · Live",
      role: "Lead mobile developer",
      summary:
        "Mall discovery and rewards across South Africa—browse stores, collect points when you walk in, and redeem offers even when the signal drops.",
      desc: "Consumer mall app used across malls in South Africa: discovery, offers, and a location-based rewards system with offline-first local storage.",
      highlights: [
        "Authentication, mall selection, stores, and regional offers.",
        "Offline-first sync with SQL plus remote data; points for entering malls and voucher redemption with partners.",
        "Shared architecture patterns with UJ WayFinder, tuned via configuration.",
      ],
      image: waya1,
      gallery: WAYA_WAYA_GALLERY,
      previewFrame: 'mobile',
      href: "#",
    },
    {
      id: 4,
      name: "UJ WayFinder",
      meta: "Campus navigation · Flutter · Nov 2021 – Present · Live",
      role: "Lead mobile developer",
      summary:
        "Campus wayfinding for students—pick your university, follow indoor routes, and let beacons nudge you when GPS alone isn't enough.",
      desc: "Wayfinding for university campuses in South Africa: college selection, maps, routes, and BLE proximity for accurate indoor guidance.",
      highlights: [
        "Map rendering and indoor navigation logic with BLE beacon integration.",
        "Common codebase with Waya Waya, separated by configuration.",
      ],
      image: uj1,
      gallery: UJ_WAYFINDER_GALLERY,
      previewFrame: 'mobile',
      href: "#",
    },
    {
      id: 5,
      name: "Safe Again",
      meta: "Women’s safety · Flutter + Firebase · Mid 2023 – Mid 2025 · Live",
      role: "Lead developer",
      summary:
        "A safety network for real moments—broadcast distress to verified people nearby, build private signal groups, and stay connected through community when it matters.",
      desc: "Real-time safety app: distress signals to nearby verified users, private signal groups, community posts, messaging, and push notifications—with scalable Firestore modeling.",
      highlights: [
        "Emergency broadcast, acceptance flows, and signal history for accountability.",
        "Community module with location-based filtering; separate collections for signals, chats, posts, and users.",
        "Push notifications for emergencies, signal updates, and community activity.",
      ],
      image: sa1,
      gallery: SAFE_AGAIN_GALLERY,
      previewFrame: 'mobile',
      href: "#",
    },
    {
      id: 6,
      name: "Nanda Enterprise",
      meta: "Business operations platform",
      role: "Product and engineering execution",
      summary:
        "Operations software for teams tired of chasing updates in calls and chats—one place to see requests, status, and who owns what next.",
      desc: "Operations software that centralizes request tracking, status visibility, and approval steps. It solves fragmented communication and unclear ownership by giving teams one source of truth for day-to-day execution.",
      highlights: [
        "Unified request intake and status tracking so teams stop juggling calls, chat threads, and spreadsheets.",
        "Clear handoffs and ownership visibility to reduce follow-ups and missed actions.",
        "Faster approvals and decision cycles through a single workflow view.",
      ],
      image: nanda1,
      gallery: NANDA_GALLERY,
      previewFrame: 'web',
      href: "#",
    },
  ];

  const creativeDesigns = useMemo(
    () => [
      {
        name: "OSAC GMS",
        desc: "Garage operations under daily pressure—job cards, sales flows, and technician views designed to stay clear when the workshop is loud.",
        image: gms1,
        gallery: GMS_GALLERY,
        accent: SITE_THEME.designAccent1,
        href: "#",
      },
      {
        name: "Safe Again",
        desc: "Safety UX built for speed—emergency paths, verified matching, and community surfaces that stay calm when stress is high.",
        image: sa1,
        gallery: SAFE_AGAIN_GALLERY,
        previewFrame: 'mobile',
        accent: "#3f3f46",
        href: "#",
      },
      {
        name: "Mobiurja",
        desc: "On-demand fuel delivery—I helped shape mobile and web flows so ordering petrol feels as simple as ordering dinner.",
        image: mobiurja1,
        previewFrame: 'mobile',
        accent: "#1e3a5f",
        href: "#",
      },
      {
        name: "Puri",
        desc: "A clinical companion app—capture test strips, walk through clear steps, and read results without squinting at a tiny screen.",
        image: puri1,
        gallery: PURI_GALLERY,
        previewFrame: 'mobile',
        accent: "#1d4ed8",
        href: "#",
      },
      {
        name: "Woopdo",
        desc: "An app for real-world connection—guided activities, prompts, and discovery for people who want to meet offline, not just swipe.",
        image: woopdo1,
        gallery: WOOPDO_GALLERY,
        previewFrame: 'mobile',
        accent: "#0f766e",
        href: "#",
      },
    ],
    []
  );

  const journeyDesigns = useMemo(
    () => creativeDesigns.filter((d) => !projects.some((p) => p.name === d.name)),
    [creativeDesigns, projects]
  );

  return (
    <div className="bg-mocha-50 text-mocha-600 font-sans min-h-screen relative overflow-x-hidden">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-mocha-700/35 focus-visible:ring-offset-2 focus-visible:ring-offset-mocha-50"
      >
      {/* Desktop / fine pointer: glow follows cursor */}
      {!reducedMotion && animating && !pointerCoarse && (
        <motion.div
          style={{ x: cursorX, y: cursorY }}
          className="pointer-events-none fixed top-0 left-0 z-[1] h-[400px] w-[400px] rounded-full blur-[100px] bg-accent/10"
          aria-hidden
        />
      )}
      {/* Touch / coarse pointer: random corner-to-corner drift */}
      {!reducedMotion && animating && pointerCoarse && <CoarsePointerAmbientGlow />}
      {/* Reduced motion: single static glow */}
      {reducedMotion && (
        <div
          className="pointer-events-none fixed left-[10%] top-[16%] z-[1] h-[min(50vw,180px)] w-[min(50vw,180px)] rounded-full blur-[52px] bg-accent/14 md:left-[15%] md:top-[18%] md:h-[360px] md:w-[360px] md:blur-[88px] md:bg-accent/8"
          aria-hidden
        />
      )}

      {/* Hero */}
      <section id="home" className="min-h-screen flex flex-col items-center justify-center pt-20 pb-12 px-6 relative z-10">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-12 lg:gap-16 xl:gap-20 items-center">
          <div className="order-2 lg:order-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={animating ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              className="flex items-center justify-center lg:justify-start gap-2 text-mocha-500 mb-6"
            >
              <span className="text-xs font-medium">Available for enquiries</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={animating ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: animating ? 0.1 : 0 }}
              className="font-service text-5xl md:text-6xl xl:text-7xl font-bold max-w-3xl mb-4 tracking-tight leading-[1.02] text-mocha-800 mx-auto lg:mx-0"
            >
              I build <span className="text-accent">mobile apps</span> people use every day.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={animating ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ delay: animating ? 0.18 : 0 }}
              className="text-mocha-600 max-w-xl text-sm md:text-base mb-10 leading-relaxed mx-auto lg:mx-0"
            >
              I&apos;m <strong className="font-semibold text-mocha-800">Satyam</strong> — a developer who turns quiet ideas into apps people actually keep on their home screen. Five years in, I&apos;m still most alive somewhere between a sketch and a ship date.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={animating ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{ delay: animating ? 0.26 : 0 }}
              className="flex flex-wrap gap-4 justify-center lg:justify-start"
            >
              <a href="#work" className="btn-primary-sm">
                See my work
              </a>
              <a href="#contact" className="bg-white border border-mocha-200 text-mocha-800 px-7 py-2.5 rounded-md text-xs font-bold transition-transform hover:bg-mocha-100 active:scale-95">
                Say hello
              </a>
            </motion.div>
          </div>

          <div className="order-1 lg:order-2 flex justify-center lg:justify-end lg:pr-10 w-full">
            <HeroPhone />
          </div>
        </div>
        <HeroTechMarquee fadeRgb={SITE_THEME.marqueeFadeRgb} />
      </section>

      {/* Services */}
      <section id="services" className="py-24 md:py-28 px-6 border-t border-mocha-200/80 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="mb-14 md:mb-16 max-w-3xl"
            variants={sectionHeadStaggerVariants}
            {...scrollRevealProps(animating, reducedMotion)}
          >
            <motion.p
              variants={sectionLineRevealVariants}
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mocha-500 mb-4"
            >
              Approach
            </motion.p>
            <motion.h2
              variants={sectionLineRevealVariants}
              className="font-service text-4xl sm:text-5xl font-bold tracking-tight text-mocha-800 leading-[1.08] mb-5"
            >
              From architecture to App Store
            </motion.h2>
            <motion.p
              variants={sectionLineRevealVariants}
              className="text-mocha-600 text-sm md:text-base leading-relaxed"
            >
              I work as a hands-on product engineer—owning mobile, web, and backend layers so founders and teams can move from concept to production without gaps between design, code, and release.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
            variants={sectionCardStaggerVariants}
            {...scrollRevealProps(animating, reducedMotion, {
              once: true,
              amount: 0.12,
              margin: '0px 0px -48px 0px',
            })}
          >
            {services.map((service, i) => {
              const Icon = service.icon;
              return (
                <motion.article
                  key={service.title}
                  variants={sectionCardItemVariants}
                  className="approach-card"
                >
                  <div className="approach-card__head">
                    <span className="approach-card__index" aria-hidden>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="approach-card__icon" aria-hidden>
                      <Icon size={18} strokeWidth={1.75} />
                    </span>
                  </div>
                  <h3 className="approach-card__title">{service.title}</h3>
                  <p className="approach-card__desc">{service.desc}</p>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section id="work" className="py-24 md:py-28 px-6 relative z-10 border-t border-mocha-200/80">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="mb-14 md:mb-16 max-w-3xl"
            variants={sectionHeadStaggerVariants}
            {...scrollRevealProps(animating, reducedMotion)}
          >
            <motion.p
              variants={sectionLineRevealVariants}
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mocha-500 mb-4"
            >
              Selected work
            </motion.p>
            <motion.h2
              variants={sectionLineRevealVariants}
              className="font-service text-4xl sm:text-5xl font-bold tracking-tight text-mocha-800 leading-[1.08] mb-5"
            >
              Products shipped end to end
            </motion.h2>
            <motion.p
              variants={sectionLineRevealVariants}
              className="text-mocha-600 text-sm md:text-base leading-relaxed"
            >
              Cross-platform apps for retail, campus navigation, safety, and founder-led products—owned from system design and UI through store release and ongoing maintenance.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5"
            variants={sectionCardStaggerVariants}
            {...scrollRevealProps(animating, reducedMotion, {
              once: true,
              amount: 0.08,
              margin: '0px 0px -48px 0px',
            })}
          >
            {projects.map((project, i) => (
              <motion.article key={project.id} variants={sectionCardItemVariants} className="work-project-card">
                <WorkProjectPreview
                  src={project.previewImage ?? project.image}
                  alt={project.name}
                  frame={project.previewFrame ?? 'mobile'}
                />
                <div className="work-project-card__body">
                  <div className="work-project-card__meta">
                    <span className="work-project-card__category">{projectCategory(project.meta)}</span>
                    <ProjectStatusBadge meta={project.meta} />
                  </div>
                  <h3 className="work-project-card__title">{project.name}</h3>
                  <p className="work-project-card__role">{project.role}</p>
                  <p className="work-project-card__summary">{project.summary}</p>
                  <div className="work-project-card__actions">
                    {project.href && project.href !== '#' && (
                      <a
                        href={project.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="work-project-card__link"
                        onClick={() =>
                          trackEvent('click_outbound', {
                            link_url: project.href,
                            link_text: project.name,
                          })
                        }
                      >
                        Live site
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setProjectDetailIndex(i);
                        trackEvent('project_detail_open', { project_name: project.name });
                      }}
                      className="work-project-card__cta"
                    >
                      Case study
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>

          {journeyDesigns.length > 0 && (
            <div className="mt-20 md:mt-24 pt-14 md:pt-16 border-t border-mocha-200/80">
              <div className="mb-10 md:mb-12 max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mocha-500 mb-3">
                  Additional contributions
                </p>
                <p className="text-sm md:text-base text-mocha-600 leading-relaxed">
                  Product and interface work with teams across healthcare, on-demand delivery, and social experiences.
                </p>
              </div>

              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5"
                variants={sectionCardStaggerVariants}
                {...scrollRevealProps(animating, reducedMotion, {
                  once: true,
                  amount: 0.08,
                  margin: '0px 0px -48px 0px',
                })}
              >
                {journeyDesigns.map((design) => (
                  <motion.article
                    key={design.name}
                    variants={sectionCardItemVariants}
                    role="button"
                    tabIndex={0}
                    aria-label={`${design.name} — open full-size images`}
                    onClick={() =>
                      setDesignLightbox({ title: design.name, images: designCardSlides(design) })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setDesignLightbox({ title: design.name, images: designCardSlides(design) });
                      }
                    }}
                    className="work-project-card work-project-card--interactive"
                  >
                    <WorkProjectPreview
                      src={design.image}
                      alt={design.name}
                      frame={design.previewFrame ?? 'mobile'}
                    />
                    <div className="work-project-card__body">
                      <h3 className="work-project-card__title">{design.name}</h3>
                      <p className="work-project-card__summary">{design.desc}</p>
                      <span className="work-project-card__cta work-project-card__cta--text">
                        View screens
                        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      </span>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            </div>
          )}
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 px-6 border-t border-mocha-200/80 bg-mocha-50 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,300px)_1fr] gap-12 lg:gap-16 items-start">
          <motion.div
            className="relative mx-auto flex w-full max-w-[min(100%,280px)] justify-center lg:mx-0 lg:max-w-none lg:justify-start"
            variants={sectionFadeUpVariants}
            {...scrollRevealProps(animating, reducedMotion, { once: true, amount: 0.35 })}
          >
            <AboutPortrait src={aboutPortrait} alt="Satyam Tiwari" animating={animating} />
          </motion.div>

          <motion.div
            className="max-w-3xl flex flex-col gap-8"
            variants={sectionHeadStaggerVariants}
            {...scrollRevealProps(animating, reducedMotion, { once: true, amount: 0.28 })}
          >
            <motion.h2
              variants={sectionLineRevealVariants}
              className="font-service text-3xl md:text-5xl font-bold leading-tight text-mocha-800"
            >
              The path so far
            </motion.h2>
            <motion.div
              variants={sectionListStaggerVariants}
              className="space-y-5 text-mocha-600 text-sm md:text-base leading-relaxed"
            >
              <motion.p variants={sectionListItemFadeUpVariants}>
                I don&apos;t remember the first app I tried to build—I remember not wanting to stop. What began as late-night tinkering turned into a rhythm: ship something real, watch how people use it, then make it better.
              </motion.p>
              <motion.p variants={sectionListItemFadeUpVariants}>
                That&apos;s carried me through mall apps across South Africa, a safety product for moments that can&apos;t wait, and long stretches beside founders as a freelancer—from the first sketch through App Store review to the quieter months of keeping an app steady in the wild.
              </motion.p>
              <motion.p variants={sectionListItemFadeUpVariants}>
                The apps I admire don&apos;t ask for attention. They simply work—until using them feels obvious. That&apos;s the feeling I chase in every project.
              </motion.p>
            </motion.div>

            <motion.div variants={sectionFadeUpVariants} className="flex flex-wrap gap-4 pt-2">
              <a
                href={RESUME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Read my resume
              </a>
              <a
                href={UPWORK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-white border border-mocha-200 text-mocha-800 px-6 py-2.5 text-sm font-semibold rounded-sm hover:bg-mocha-100 transition-colors"
              >
                Let&apos;s work together
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <FaqSection animating={animating} reducedMotion={reducedMotion} />

      <section id="contact" className="relative z-10 border-t border-mocha-200/80">
        <div className="bg-mocha-150/80">
          <div className="max-w-7xl mx-auto px-6 py-16 md:py-20 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-16 xl:gap-24 items-start">
              <motion.div
                className="max-w-lg"
                variants={sectionHeadStaggerVariants}
                {...scrollRevealProps(animating, reducedMotion, { once: true, amount: 0.35 })}
              >
                <motion.p variants={sectionLineRevealVariants} className="text-sm text-mocha-600 mb-4">
                  If you&apos;re reading this
                </motion.p>
                <motion.h2
                  variants={sectionLineRevealVariants}
                  className="font-service text-5xl sm:text-6xl md:text-7xl font-semibold text-mocha-800 leading-[0.98] tracking-tight mb-6"
                >
                  Let&apos;s talk
                </motion.h2>
                <motion.p
                  variants={sectionLineRevealVariants}
                  className="text-base md:text-lg text-mocha-600 leading-relaxed mb-6 max-w-md"
                >
                  Have an idea taking shape, or an app that needs a steady hand? I&apos;d love to hear what you&apos;re building. I usually reply within a day.
                </motion.p>
                <motion.p variants={sectionFadeUpVariants} className="text-sm text-mocha-600 mb-10">
                  <a href={EMAIL_MAILTO} className="hover:text-mocha-800 hover:underline underline-offset-2 transition-colors">
                    satyamt5152@gmail.com
                  </a>
                  <span className="mx-2 text-mocha-400/70" aria-hidden>
                    ·
                  </span>
                  <a href={PHONE_TEL} className="hover:text-mocha-800 hover:underline underline-offset-2 transition-colors">
                    {PHONE_DISPLAY}
                  </a>
                </motion.p>
                <motion.div variants={sectionFadeUpVariants}>
                  <SocialLinks />
                </motion.div>
              </motion.div>

              <motion.div
                className="min-w-0"
                variants={sectionFadeUpVariants}
                {...scrollRevealProps(animating, reducedMotion, {
                  once: true,
                  amount: 0.2,
                  margin: '0px 0px -40px 0px',
                })}
              >
                <form onSubmit={handleContactSubmit} className="relative space-y-10">
                  <p className="text-xs leading-relaxed text-mocha-500 max-w-md">
                    Your note comes straight to me—I&apos;ll only use your details to reply.
                  </p>
                  <p className="sr-only" aria-live="polite">
                    {contactFormStatus === 'success' && 'Message sent successfully.'}
                    {contactFormStatus === 'error' && contactFormError}
                  </p>
                  <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
                    <label htmlFor="contact-website">Website</label>
                    <input
                      id="contact-website"
                      name="botcheck"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={contactHoneypot}
                      onChange={(e) => setContactHoneypot(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
                    <div>
                      <label htmlFor="contact-name" className="block text-sm text-mocha-600 mb-2">
                        Full name
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        value={formData.name}
                        disabled={contactFormStatus === 'sending'}
                        className="w-full bg-transparent border-0 border-b border-mocha-300/90 pb-2.5 text-base text-mocha-800 placeholder:text-mocha-500 focus:outline-none focus:border-mocha-700 disabled:opacity-50"
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (contactFormStatus === 'success' || contactFormStatus === 'error') {
                            setContactFormStatus('idle');
                          }
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-sm text-mocha-600 mb-2">
                        Email address
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        value={formData.email}
                        disabled={contactFormStatus === 'sending'}
                        className="w-full bg-transparent border-0 border-b border-mocha-300/90 pb-2.5 text-base text-mocha-800 placeholder:text-mocha-500 focus:outline-none focus:border-mocha-700 disabled:opacity-50"
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (contactFormStatus === 'success' || contactFormStatus === 'error') {
                            setContactFormStatus('idle');
                          }
                        }}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
                    <div>
                      <label htmlFor="contact-phone" className="block text-sm text-mocha-600 mb-2">
                        Phone number
                      </label>
                      <input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        disabled={contactFormStatus === 'sending'}
                        className="w-full bg-transparent border-0 border-b border-mocha-300/90 pb-2.5 text-base text-mocha-800 placeholder:text-mocha-500 focus:outline-none focus:border-mocha-700 disabled:opacity-50"
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          if (contactFormStatus === 'success' || contactFormStatus === 'error') {
                            setContactFormStatus('idle');
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-subject" className="block text-sm text-mocha-600 mb-2">
                        Subject
                      </label>
                      <input
                        id="contact-subject"
                        name="subject"
                        value={formData.subject}
                        disabled={contactFormStatus === 'sending'}
                        className="w-full bg-transparent border-0 border-b border-mocha-300/90 pb-2.5 text-base text-mocha-800 placeholder:text-mocha-500 focus:outline-none focus:border-mocha-700 disabled:opacity-50"
                        onChange={(e) => {
                          setFormData({ ...formData, subject: e.target.value });
                          if (contactFormStatus === 'success' || contactFormStatus === 'error') {
                            setContactFormStatus('idle');
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="block text-sm text-mocha-600 mb-2">
                      Tell me about your project
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      disabled={contactFormStatus === 'sending'}
                      className="w-full bg-transparent border-0 border-b border-mocha-300/90 pb-2.5 text-base text-mocha-800 placeholder:text-mocha-500 focus:outline-none focus:border-mocha-700 resize-none min-h-[120px] disabled:opacity-50"
                      onChange={(e) => {
                        setFormData({ ...formData, message: e.target.value });
                        if (contactFormStatus === 'success' || contactFormStatus === 'error') {
                          setContactFormStatus('idle');
                        }
                      }}
                      required
                    />
                  </div>
                  {contactFormStatus === 'success' && (
                    <p className="text-sm text-emerald-700" role="status">
                      Thanks — your message was sent. I&apos;ll reply soon.
                    </p>
                  )}
                  {contactFormStatus === 'error' && contactFormError && (
                    <p className="text-sm text-red-700" role="alert">
                      {contactFormError}
                    </p>
                  )}
                  <button type="submit" disabled={contactFormStatus === 'sending'} className="btn-primary-md">
                    {contactFormStatus === 'sending' ? 'Sending…' : 'Send a note'}
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </div>

        <footer className="border-t border-mocha-200/80 px-6 py-3">
          <p className="text-center text-mocha-600 text-xs leading-normal">
            Copyright © {new Date().getFullYear()} Satyam Tiwari — All rights reserved
          </p>
        </footer>
      </section>


      </main>

      <AnimatePresence>
        {projectDetailIndex !== null && projects[projectDetailIndex] && (
          <ProjectDetailDialog
            key={projects[projectDetailIndex].id}
            project={projects[projectDetailIndex]}
            onClose={() => setProjectDetailIndex(null)}
          />
        )}
      </AnimatePresence>

      {designLightbox && (
        <DesignImageLightbox
          title={designLightbox.title}
          images={designLightbox.images}
          onClose={() => setDesignLightbox(null)}
        />
      )}

    </div>
  );
};

export default App;
