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
  MapPin, 
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
import aboutPortrait from './assets/satyam.png';

const GMS_GALLERY = [gms1, gms2, gms3, gms4];
const SAFE_AGAIN_GALLERY = [sa1, sa2, sa3, sa4];
const WOOPDO_GALLERY = [woopdo1, woopdo2, woopdo3, woopdo4];
const WAYA_WAYA_GALLERY = [waya1, waya2, waya3, waya4, waya5, waya6];
const UJ_WAYFINDER_GALLERY = [uj1, uj2, uj3, uj4, uj5];

function aspectRatioCss(w, h) {
  if (!w || !h) return '16 / 9';
  return `${w} / ${h}`;
}

const SLIDESHOW_SWIPE_MIN_PX = 50;

/** Auto-advancing slideshow; optional `onAspectRatioChange` for fluid project preview frames. */
function ProjectPreviewSlideshow({
  images,
  projectName,
  reducedMotion,
  onAspectRatioChange,
  variant = 'default',
  showDots = true,
}) {
  const [index, setIndex] = useState(0);
  const [dimsByIndex, setDimsByIndex] = useState({});
  const onAspectRef = useRef(onAspectRatioChange);
  const pointerStartRef = useRef(null);
  const suppressClickRef = useRef(false);
  const suppressClickTimeoutRef = useRef(null);
  const isCard = variant === 'card';
  const multi = images.length > 1;

  useLayoutEffect(() => {
    onAspectRef.current = onAspectRatioChange;
  });

  useEffect(() => {
    let cancelled = false;
    images.forEach((src, i) => {
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) return;
        setDimsByIndex((prev) => ({ ...prev, [i]: { w, h } }));
      };
      img.src = src;
    });
    return () => {
      cancelled = true;
    };
  }, [images]);

  useLayoutEffect(() => {
    if (!onAspectRef.current) return;
    const d = dimsByIndex[index];
    onAspectRef.current(aspectRatioCss(d?.w, d?.h));
  }, [index, dimsByIndex]);

  useEffect(() => {
    if (reducedMotion || images.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [images.length, reducedMotion]);

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
      setIndex((i) => (i + 1) % images.length);
    } else {
      setIndex((i) => (i - 1 + images.length) % images.length);
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
    : 'max-h-full max-w-full object-contain object-center pointer-events-none';

  return (
    <div className="relative h-full min-h-0 w-full">
      <div
        className={`flex h-full min-h-0 w-full items-center justify-center pt-0 ${stagePb} ${multi ? 'touch-pan-y select-none cursor-grab active:cursor-grabbing' : ''}`}
        role={multi ? 'region' : undefined}
        aria-roledescription={multi ? 'carousel' : undefined}
        aria-label={
          multi
            ? showDots
              ? `${projectName} screenshots, ${index + 1} of ${images.length}. Swipe horizontally or use the dots.`
              : `${projectName} screenshots, ${index + 1} of ${images.length}. Swipe horizontally to change.`
            : undefined
        }
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        onLostPointerCapture={handleLostPointerCapture}
        onClick={handleStageClick}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={index}
            data-slide-index={index}
            src={images[index]}
            alt={`${projectName} — screenshot ${index + 1} of ${images.length}`}
            draggable={false}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            className={imgClass}
            onLoad={handleImgLoad}
          />
        </AnimatePresence>
      </div>
      {showDots && images.length > 1 && (
        <div
          className={`absolute ${dotWrapBottom} left-0 right-0 flex justify-center gap-1.5 px-2 sm:gap-2`}
          role="tablist"
          aria-label="Screenshot slides"
        >
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show screenshot ${i + 1}`}
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
  return (
    <nav className="fixed top-0 w-full z-50 bg-mocha-50/90 backdrop-blur-sm border-b border-mocha-200/90 py-3 px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-3 gap-x-4">
        <a href="#home" className="font-service text-lg font-bold tracking-tight text-mocha-800 hover:text-mocha-700 transition-colors">
          Satyam
        </a>
        <div className="hidden md:flex flex-1 justify-center gap-6 text-xs font-medium text-mocha-600">
          <a href="#home" className="hover:text-mocha-800 transition-colors">Home</a>
          <a href="#services" className="hover:text-mocha-800 transition-colors">Services</a>
          <a href="#projects" className="hover:text-mocha-800 transition-colors">Projects</a>
          <a href="#designs" className="hover:text-mocha-800 transition-colors">Designs</a>
          <a href="#about" className="hover:text-mocha-800 transition-colors">About</a>
          <a href="#contact" className="hover:text-mocha-800 transition-colors">Contact</a>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="#contact"
            className="border border-mocha-600/45 px-4 sm:px-5 py-1.5 rounded-md text-xs font-medium text-mocha-600 hover:text-white hover:bg-mocha-700 transition-all shrink-0"
          >
            Contact
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

function TechMarqueePill({ label, staggerIndex }) {
  return (
    <motion.span
      className={techPillClass}
      initial={{ opacity: 0, y: 18, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: 0.14 + staggerIndex * 0.034,
        type: "spring",
        stiffness: 440,
        damping: 26,
        mass: 0.85,
      }}
    >
      {label}
    </motion.span>
  );
}

function TechMarqueeStrip({ items }) {
  const doubled = [...items, ...items];
  return (
    <div
      className="tech-marquee-track flex w-max gap-2 sm:gap-2.5"
      style={{ "--tech-marquee-duration": "48s" }}
    >
      {doubled.map((label, i) => (
        <TechMarqueePill key={`${label}-${i}`} label={label} staggerIndex={i} />
      ))}
    </div>
  );
}

/**
 * Auto-marquee keeps running (infinite CSS animation) while the outer area scrolls horizontally
 * so users can swipe/drag without stopping the motion. `animated={false}` for reduced-motion swipe rows.
 */
function TechMarqueeScrollable({ edgeFade, animated = true }) {
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
          <TechMarqueeStrip items={techMarqueeItems} />
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

function HeroTechMarquee({ fadeRgb = "249,246,240" }) {
  const reduced = useReducedMotion();
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
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className={titleLg}>Technologies I use</p>
      <TechMarqueeScrollable edgeFade={edgeFade} />
    </motion.div>
  );
}

function ProjectDetailDialog({ project, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-5">
      <button
        type="button"
        className="absolute inset-0 backdrop-blur-sm bg-mocha-700/35"
        onClick={onClose}
        aria-label="Close project details"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-detail-title"
        className="relative z-10 flex w-full max-w-lg flex-col rounded-t-2xl border border-mocha-200 bg-mocha-50 shadow-2xl sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-mocha-200/80 px-5 py-4">
          <div className="min-w-0 pr-2">
            <h2 id="project-detail-title" className="font-service text-xl font-bold tracking-tight text-mocha-800">
              {project.name}
            </h2>
            <p className="mt-1 text-xs leading-snug text-mocha-500">{project.meta}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-mocha-500 transition-colors hover:bg-mocha-200 hover:text-mocha-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </div>
        <div className="flex-1 px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-mocha-500">{project.role}</p>
          <p className="mt-3 text-sm leading-relaxed text-mocha-600">{project.desc}</p>
          {project.highlights?.length > 0 && (
            <>
              <h3 className="mt-6 text-sm font-semibold text-mocha-800">Highlights</h3>
              <ul className="mt-3 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-mocha-600 marker:text-mocha-600/70">
                {project.highlights.map((line, hi) => (
                  <li key={hi}>{line}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Coarse pointer: drift the hero glow between random points near each screen corner (no fixed loop). */
function CoarsePointerAmbientGlow() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);

  useEffect(() => {
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
  }, []);

  return (
    <motion.div
      className="pointer-events-none fixed left-[4%] top-[8%] z-[1] h-[min(52vw,200px)] w-[min(52vw,200px)] rounded-full blur-[52px] bg-mocha-500/32 md:left-[8%] md:top-[10%] md:h-[min(70vw,380px)] md:w-[min(70vw,380px)] md:blur-[88px] md:bg-mocha-500/22"
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
  const [activeProject, setActiveProject] = useState(0);
  const [projectGalleryAspect, setProjectGalleryAspect] = useState('16 / 9');
  const [projectDetailIndex, setProjectDetailIndex] = useState(null);
  const [designLightbox, setDesignLightbox] = useState(null);

  useEffect(() => {
    setProjectGalleryAspect('16 / 9');
  }, [activeProject]);
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
  const [serviceHoverIndex, setServiceHoverIndex] = useState(null);
  const [huePhase, setHuePhase] = useState('brown');
  const reducedMotion = useReducedMotion();

  const themeMotion = useMemo(() => {
    if (huePhase === 'green') {
      return {
        marqueeFadeRgb: '243,247,244',
        designCardHoverShadow:
          'group-hover:shadow-[0_20px_44px_-16px_rgba(47,61,52,0.12)]',
        rowHoverBg: 'rgba(47, 61, 52, 0.05)',
        designAccent1: '#556b5c',
      };
    }
    if (huePhase === 'slate') {
      return {
        marqueeFadeRgb: '242,245,248',
        designCardHoverShadow:
          'group-hover:shadow-[0_20px_44px_-16px_rgba(47,55,66,0.12)]',
        rowHoverBg: 'rgba(47, 55, 66, 0.05)',
        designAccent1: '#556070',
      };
    }
    return {
      marqueeFadeRgb: '249,246,240',
      designCardHoverShadow:
        'group-hover:shadow-[0_20px_44px_-16px_rgba(61,52,44,0.12)]',
      rowHoverBg: 'rgba(28, 25, 23, 0.05)',
      designAccent1: '#6f5f4f',
    };
  }, [huePhase]);

  useEffect(() => {
    document.documentElement.dataset.theme = huePhase;
  }, [huePhase]);

  useEffect(() => {
    if (reducedMotion) {
      setHuePhase('brown');
      document.documentElement.dataset.theme = 'brown';
      return;
    }
    let cancelled = false;
    let tid;
    const scheduleNext = () => {
      tid = window.setTimeout(() => {
        if (cancelled) return;
        setHuePhase((p) => {
          if (p === 'brown') return 'green';
          if (p === 'green') return 'slate';
          return 'brown';
        });
        scheduleNext();
      }, 14000 + Math.random() * 4000);
    };
    scheduleNext();
    return () => {
      cancelled = true;
      window.clearTimeout(tid);
    };
  }, [reducedMotion]);

  const designCardHoverShadow = themeMotion.designCardHoverShadow;

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
    if (reducedMotion || pointerCoarse) return;
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX - 200);
      mouseY.set(e.clientY - 200);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
    // mouseX / mouseY are stable MotionValue instances from useMotionValue
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, pointerCoarse]);

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
      title: "Mobile (Flutter & React Native)",
      icon: <Smartphone size={32} strokeWidth={1.5} />,
      desc: "Cross-platform iOS & Android apps with strong performance, offline patterns, and App Store / Play Store delivery—including TestFlight, certificates, and review cycles.",
    },
    {
      title: "Frontend (Next.js & React)",
      icon: <Layout size={32} strokeWidth={1.5} />,
      desc: "Reusable UI, dashboards, and responsive flows in Next.js and React—routing, server and client components, and performance-minded delivery alongside designers and backend teams.",
    },
    {
      title: "Backend & data",
      icon: <Server size={32} strokeWidth={1.5} />,
      desc: "Node.js and Django services, MongoDB, and Firebase (auth, storage, messaging, dynamic links) with clear APIs and production-minded data modeling.",
    },
    {
      title: "Product ownership",
      icon: <Cpu size={32} strokeWidth={1.5} />,
      desc: "End-to-end ownership: architecture, UI/UX implementation, testing, deployment, and long-term maintenance—translating founder requirements into reliable systems.",
    },
    {
      title: "App Store & release ops",
      icon: <Briefcase size={32} strokeWidth={1.5} />,
      desc: "Hands-on with App Store Connect, provisioning, bundle IDs, beta distribution, and staying aligned with Apple review guidelines for live apps.",
    },
    {
      title: "Tools & collaboration",
      icon: <Globe size={32} strokeWidth={1.5} />,
      desc: "Git, GitHub, CI/CD basics, Figma, Jira, Trello, and Notion—comfortable with international clients, async communication, and structured delivery.",
    },
  ];

  const projects = [
    {
      id: 0,
      name: "OSAC GMS",
      meta: "Garage Management · Flutter · Aug 2025 – Present · Pre-production",
      role: "Sole developer & technical owner",
      summary:
        "End-to-end garage management for workshops: quotations, invoices, and job cards linked to vehicle registration, plus a task diary that routes work to technicians and ramps. Technician flows cover assigned jobs, check-in/out, breaks, and time-on-task. Admin covers staff, inventory, workshop resources, and templates so teams can spin up jobs quickly. Built in Flutter with Riverpod and GoRouter; finance modules are still in active development ahead of wider production rollout.",
      desc: "Full-scale garage management for automotive service centers: quotations, invoices, job cards tied to vehicle registration, technician time tracking, admin configuration, and finance (in progress)—built in Flutter with modular architecture.",
      highlights: [
        "Sales workflows: quotations, invoices, job cards (VRM-linked), task diary assigning jobs to technicians and ramps.",
        "Technician module: assigned jobs, check-in/out, lunch breaks, and time tracking per task.",
        "Admin: staff, inventory, workshop resources, profile/task templates for repeatable job creation.",
        "Stack: Flutter & Dart, Riverpod, GoRouter—designed for multi-role access and long-term maintainability.",
      ],
      image: gms1,
      gallery: GMS_GALLERY,
      href: "#",
    },
    {
      id: 1,
      name: "Waya Waya",
      meta: "Mall rewards & discovery · Flutter · Nov 2021 – Present · Live",
      role: "Lead mobile developer",
      summary:
        "Consumer-facing mall discovery and rewards for multiple malls in South Africa: authentication, mall and store browsing, regional offers, and an offline-first layer using local SQL with sync to remote data. Users earn points when they enter participating malls and can redeem rewards through partner vouchers. The app shares scalable architecture patterns with UJ WayFinder, with differences driven by configuration rather than a forked codebase.",
      desc: "Consumer mall app used across malls in South Africa: discovery, offers, and a location-based rewards system with offline-first local storage.",
      highlights: [
        "Authentication, mall selection, stores, and regional offers.",
        "Offline-first sync with SQL plus remote data; points for entering malls and voucher redemption with partners.",
        "Shared architecture patterns with UJ WayFinder, tuned via configuration.",
      ],
      image: waya1,
      gallery: WAYA_WAYA_GALLERY,
      href: "#",
    },
    {
      id: 2,
      name: "UJ WayFinder",
      meta: "Campus navigation · Flutter · Nov 2021 – Present · Live",
      role: "Lead mobile developer",
      summary:
        "Campus wayfinding for universities across South Africa: students pick a college or university, then use in-app maps and routes to reach lecture halls, labs, and venues. BLE beacons support proximity-aware indoor guidance where GPS alone is not enough. The product reuses the same Flutter foundation as Waya Waya, optimized through configuration so both apps stay maintainable while serving different domains.",
      desc: "Wayfinding for university campuses in South Africa: college selection, maps, routes, and BLE proximity for accurate indoor guidance.",
      highlights: [
        "Map rendering and indoor navigation logic with BLE beacon integration.",
        "Common codebase with Waya Waya, separated by configuration.",
      ],
      image: uj1,
      gallery: UJ_WAYFINDER_GALLERY,
      href: "#",
    },
    {
      id: 3,
      name: "Safe Again",
      meta: "Women’s safety · Flutter + Firebase · Mid 2023 – Mid 2025 · Live",
      role: "Lead developer",
      summary:
        "Real-time safety and community assistance: users can broadcast distress to nearby verified responders, with acceptance flows that create private signal groups and history for follow-up. A community module supports posts, messaging, and location-aware discovery of people and content. Backend is Firebase (Firestore, auth, messaging) with deliberately separated collections for signals, chats, community, and profiles. Push notifications cover emergencies, signal updates, and community activity.",
      desc: "Real-time safety app: distress signals to nearby verified users, private signal groups, community posts, messaging, and push notifications—with scalable Firestore modeling.",
      highlights: [
        "Emergency broadcast, acceptance flows, and signal history for accountability.",
        "Community module with location-based filtering; separate collections for signals, chats, posts, and users.",
        "Push notifications for emergencies, signal updates, and community activity.",
      ],
      image: sa1,
      gallery: SAFE_AGAIN_GALLERY,
      href: "#",
    },
  ];

  const creativeDesigns = useMemo(
    () => [
      {
        name: "OSAC GMS",
        desc: "Garage operations UI: job cards, sales staff workflows, and technician views—web-first Flutter targeting workshops that need clarity under daily load.",
        image: gms1,
        gallery: GMS_GALLERY,
        accent: themeMotion.designAccent1,
        href: "#",
      },
      {
        name: "Safe Again",
        desc: "Safety-first UX: emergency signal paths, verified-user matching, and community surfaces designed for speed and trust under stress.",
        image: sa1,
        gallery: SAFE_AGAIN_GALLERY,
        accent: "#3f3f46",
        href: "#",
      },
      {
        name: "Mobiurja",
        desc: "On-demand petrol delivery (Chirpn IT Solutions): contributed to frontend and mobile flows—user journeys, dashboards, and performance-minded UI for a live fuel-delivery platform.",
        image: "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=1200&q=80",
        accent: "#1e3a5f",
        href: "#",
      },
      {
        name: "Woopdo",
        desc: "Real-world connection app: guided partner activities (“woops”), prompts, and social discovery—mobile UI and flows for timed, in-person experiences in beta.",
        image: woopdo1,
        gallery: WOOPDO_GALLERY,
        accent: "#0f766e",
        href: "#",
      },
    ],
    [themeMotion.designAccent1]
  );

  return (
    <div className="bg-mocha-50 text-mocha-600 font-sans min-h-screen relative overflow-x-hidden">
      <Navbar />
      {/* Desktop / fine pointer: glow follows cursor */}
      {!reducedMotion && !pointerCoarse && (
        <motion.div
          style={{ x: cursorX, y: cursorY }}
          className="pointer-events-none fixed top-0 left-0 z-[1] h-[400px] w-[400px] rounded-full blur-[100px] bg-mocha-500/14"
          aria-hidden
        />
      )}
      {/* Touch / coarse pointer: random corner-to-corner drift */}
      {!reducedMotion && pointerCoarse && <CoarsePointerAmbientGlow />}
      {/* Reduced motion: single static glow */}
      {reducedMotion && (
        <div
          className="pointer-events-none fixed left-[10%] top-[16%] z-[1] h-[min(50vw,180px)] w-[min(50vw,180px)] rounded-full blur-[52px] bg-mocha-500/26 md:left-[15%] md:top-[18%] md:h-[360px] md:w-[360px] md:blur-[88px] md:bg-mocha-500/10"
          aria-hidden
        />
      )}

      {/* Hero */}
      <section id="home" className="min-h-screen flex flex-col items-center justify-center pt-16 px-6 text-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-mocha-500 mb-6">
          <MapPin size={14} /><span className="text-xs font-medium">India | Open to Remote</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-service text-5xl md:text-8xl font-bold max-w-5xl mb-4 tracking-tight leading-[1] text-mocha-800">
          I'm Satyam Tiwari <br /> Flutter Developer
        </motion.h1>
        <p className="text-mocha-600 max-w-2xl text-sm md:text-base mb-10 leading-relaxed">
          Product-focused mobile and frontend developer with ~5 years total experience—1.5 years full-time product work and 3.5+ years as an independent freelancer shipping apps customers use every day, from UI through App Store deployment and long-term support.
        </p>
        <div className="flex gap-4">
          <a href="#contact" className="btn-primary-sm">
            Get in touch
          </a>
          <a href="#projects" className="bg-white border border-stone-300/90 text-mocha-800 px-7 py-2.5 rounded-md text-xs font-bold transition-transform hover:bg-stone-50 active:scale-95">See my work</a>
        </div>
        <HeroTechMarquee fadeRgb={themeMotion.marqueeFadeRgb} />
      </section>

      {/* Services */}
      <section id="services" className="py-24 px-6 border-t border-mocha-200/80 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          <motion.div
            variants={sectionHeadStaggerVariants}
            initial={reducedMotion ? false : 'hidden'}
            whileInView={reducedMotion ? undefined : 'visible'}
            viewport={{ once: true, amount: 0.4 }}
          >
            <motion.h2
              variants={sectionLineRevealVariants}
              className="font-service text-5xl md:text-6xl font-bold tracking-tight mb-8 text-mocha-800"
            >
              My Services
            </motion.h2>
            <motion.p
              variants={sectionLineRevealVariants}
              className="text-mocha-600 max-w-md text-sm mb-8 leading-relaxed"
            >
              Aligned with how I work in production: mobile-first delivery, web frontends, backend integrations, Firebase/Mongo, and owning the full lifecycle with founders and stakeholders.
            </motion.p>
          </motion.div>
          <motion.div
            className="space-y-0"
            variants={sectionListStaggerVariants}
            initial={reducedMotion ? false : 'hidden'}
            whileInView={reducedMotion ? undefined : 'visible'}
            viewport={{ once: true, amount: 0.2 }}
          >
            {services.map((s, i) => (
              <motion.div
                key={i}
                variants={sectionListItemFadeUpVariants}
                className="border-t border-mocha-200 py-8 flex gap-7 items-start hover:bg-mocha-200/50 px-4 transition-all group"
                onMouseEnter={() => setServiceHoverIndex(i)}
                onMouseLeave={() => setServiceHoverIndex(null)}
              >
                <motion.div
                  className="text-mocha-600 shrink-0 pt-0.5 inline-flex origin-center will-change-transform"
                  animate={{
                    rotate:
                      !reducedMotion && serviceHoverIndex === i ? 1080 : 0,
                  }}
                  transition={
                    !reducedMotion && serviceHoverIndex === i
                      ? {
                          type: 'spring',
                          stiffness: 280,
                          damping: 16,
                          mass: 0.55,
                        }
                      : { duration: 0 }
                  }
                >
                  {s.icon}
                </motion.div>
                <div>
                  <h3 className="font-service text-xl md:text-2xl font-bold tracking-tight mb-2 text-mocha-800">{s.title}</h3>
                  <p className="text-mocha-600 text-xs md:text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="projects" className="bg-mocha-100 py-24 px-6 relative z-10 border-t border-mocha-200/70">
        <div className="max-w-7xl mx-auto flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16 xl:gap-20">
          <motion.div
            className="order-1 w-full shrink-0 lg:order-2 lg:w-[min(62%,760px)] xl:w-[min(64%,880px)]"
            variants={sectionFadeUpVariants}
            initial={reducedMotion ? false : 'hidden'}
            whileInView={reducedMotion ? undefined : 'visible'}
            viewport={{ once: true, amount: 0.28 }}
          >
            <motion.div
              className="mx-auto w-full max-w-4xl lg:mx-0 lg:max-w-none"
              style={{
                aspectRatio: projects[activeProject].gallery?.length
                  ? projectGalleryAspect
                  : '16 / 9',
                maxHeight: 'min(64vh, calc(100dvh - 5.5rem))',
              }}
            >
              {projects[activeProject].gallery?.length ? (
                <ProjectPreviewSlideshow
                  key={activeProject}
                  images={projects[activeProject].gallery}
                  projectName={projects[activeProject].name}
                  reducedMotion={reducedMotion}
                  onAspectRatioChange={setProjectGalleryAspect}
                />
              ) : (
                <motion.img
                  key={activeProject}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  src={projects[activeProject].image}
                  alt={projects[activeProject].name}
                  className="h-full w-full min-h-0 object-contain object-center"
                  loading="eager"
                />
              )}
            </motion.div>
          </motion.div>

          <div className="order-2 min-w-0 flex-1 lg:order-1 lg:max-w-xl">
            <motion.h2
              className="font-service text-4xl sm:text-5xl md:text-[2.75rem] font-bold tracking-tight text-mocha-800 leading-[1.1] mb-6 md:mb-8"
              variants={sectionHeadStaggerVariants}
              initial={reducedMotion ? false : 'hidden'}
              whileInView={reducedMotion ? undefined : 'visible'}
              viewport={{ once: true, amount: 0.45 }}
            >
              <motion.span className="block" variants={sectionLineRevealVariants}>
                Selected projects &amp;
              </motion.span>
              <motion.span className="block" variants={sectionLineRevealVariants}>
                shipped apps
              </motion.span>
            </motion.h2>
            <motion.div
              className="pr-0 lg:pr-2"
              variants={sectionListStaggerVariants}
              initial={reducedMotion ? false : 'hidden'}
              whileInView={reducedMotion ? undefined : 'visible'}
              viewport={{ once: true, amount: 0.12, margin: '0px 0px -32px 0px' }}
            >
              {projects.map((p, i) => (
                <motion.div key={p.id} variants={sectionProjectRowVariants}>
                  <motion.div
                    className="rounded-lg px-2"
                    initial={false}
                    whileHover={{ backgroundColor: themeMotion.rowHoverBg }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <div className="py-2 md:py-2.5 px-1">
                      <motion.button
                        type="button"
                        onClick={() => setActiveProject(i)}
                        aria-expanded={activeProject === i}
                        aria-controls={`project-panel-${p.id}`}
                        id={`project-trigger-${p.id}`}
                        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-mocha-700/35 focus-visible:ring-offset-2 focus-visible:ring-offset-mocha-100 rounded-sm"
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.995 }}
                        transition={{ type: "spring", stiffness: 420, damping: 28 }}
                      >
                        <h3 className="font-service text-lg md:text-xl font-medium tracking-tight text-mocha-800 leading-snug">
                          {p.name}
                        </h3>
                        <span className="sr-only">{p.meta}</span>
                      </motion.button>
                      <AnimatePresence initial={false}>
                        {activeProject === i && (
                          <motion.div
                            id={`project-panel-${p.id}`}
                            role="region"
                            aria-labelledby={`project-trigger-${p.id}`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                            className="overflow-hidden"
                          >
                            <p className="mt-2 max-w-lg text-sm leading-relaxed text-mocha-600">{p.summary}</p>
                            <button
                              type="button"
                              onClick={() => setProjectDetailIndex(i)}
                              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-mocha-600 hover:opacity-90 transition-opacity"
                            >
                              Learn more
                              <ArrowRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                  <div
                    className="h-px w-full shrink-0 bg-mocha-300/90"
                    role="presentation"
                    aria-hidden
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section id="designs" className="bg-mocha-150 py-24 border-t border-mocha-200/80 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          {reducedMotion ? (
            <h2 className="font-service text-4xl sm:text-5xl md:text-[2.75rem] font-bold tracking-tight text-mocha-800 leading-[1.12]">
              More interfaces &amp;
              <br />
              team-era builds
            </h2>
          ) : (
            <motion.h2
              className="font-service text-4xl sm:text-5xl md:text-[2.75rem] font-bold tracking-tight text-mocha-800 leading-[1.12]"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.45 }}
              variants={sectionHeadStaggerVariants}
            >
              <motion.span className="block" variants={sectionLineRevealVariants}>
                More interfaces &amp;
              </motion.span>
              <motion.span className="block" variants={sectionLineRevealVariants}>
                team-era builds
              </motion.span>
            </motion.h2>
          )}

          {reducedMotion ? (
            <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {creativeDesigns.map((d) => (
                <article
                  key={d.name}
                  role="button"
                  tabIndex={0}
                  aria-label={`${d.name} — open full-size images`}
                  onClick={() =>
                    setDesignLightbox({ title: d.name, images: designCardSlides(d) })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDesignLightbox({ title: d.name, images: designCardSlides(d) });
                    }
                  }}
                  className="group flex cursor-pointer flex-col rounded-lg transition-transform duration-300 ease-out will-change-transform hover:-translate-y-1 motion-reduce:hover:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-mocha-700/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mocha-150"
                >
                  <DesignCardPreview
                    design={d}
                    reducedMotion={reducedMotion}
                    designCardHoverShadow={designCardHoverShadow}
                  />
                  <h3 className="font-service text-lg sm:text-xl font-bold tracking-tight text-mocha-800 mt-5">{d.name}</h3>
                  <p className="text-mocha-600 text-sm leading-relaxed mt-2 flex-1">{d.desc}</p>
                  <a
                    href={d.href}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (d.href === '#') e.preventDefault();
                    }}
                    className="inline-flex items-center gap-1 text-mocha-600 text-sm font-medium mt-4 transition-[opacity,gap] duration-300 hover:opacity-90 group-hover:gap-2"
                  >
                    Learn more
                    <ArrowRight
                      className="w-4 h-4 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <motion.div
              className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.12, margin: '0px 0px -48px 0px' }}
              variants={sectionCardStaggerVariants}
            >
              {creativeDesigns.map((d) => (
                <motion.article
                  key={d.name}
                  variants={sectionCardItemVariants}
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${d.name} — open full-size images`}
                  onClick={() =>
                    setDesignLightbox({ title: d.name, images: designCardSlides(d) })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDesignLightbox({ title: d.name, images: designCardSlides(d) });
                    }
                  }}
                  className="group flex cursor-pointer flex-col will-change-transform rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-mocha-700/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mocha-150"
                >
                  <DesignCardPreview
                    design={d}
                    reducedMotion={reducedMotion}
                    designCardHoverShadow={designCardHoverShadow}
                  />
                  <h3 className="font-service text-lg sm:text-xl font-bold tracking-tight text-mocha-800 mt-5">{d.name}</h3>
                  <p className="text-mocha-600 text-sm leading-relaxed mt-2 flex-1">{d.desc}</p>
                  <a
                    href={d.href}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (d.href === '#') e.preventDefault();
                    }}
                    className="inline-flex items-center gap-1 text-mocha-600 text-sm font-medium mt-4 transition-[opacity,gap] duration-300 hover:opacity-90 group-hover:gap-2"
                  >
                    Learn more
                    <ArrowRight
                      className="w-4 h-4 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </a>
                </motion.article>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 px-6 border-t border-mocha-200/80 bg-mocha-50 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,480px)_1fr] gap-16 items-start">
          <motion.div
            className="relative mx-auto flex w-full max-w-[min(100%,440px)] justify-center lg:mx-0 lg:max-w-none lg:justify-start"
            variants={sectionFadeUpVariants}
            initial={reducedMotion ? false : 'hidden'}
            whileInView={reducedMotion ? undefined : 'visible'}
            viewport={{ once: true, amount: 0.35 }}
          >
            <div className="relative aspect-square w-full max-w-[360px] sm:max-w-[400px] md:max-w-[440px] rounded-full ring-2 ring-mocha-600 ring-offset-4 ring-offset-mocha-50">
              <div className="h-full w-full overflow-hidden rounded-full">
                <img
                  src={aboutPortrait}
                  alt="Satyam Tiwari"
                  className="h-full w-full object-cover object-center select-none"
                  decoding="async"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="max-w-3xl flex flex-col gap-8"
            variants={sectionHeadStaggerVariants}
            initial={reducedMotion ? false : 'hidden'}
            whileInView={reducedMotion ? undefined : 'visible'}
            viewport={{ once: true, amount: 0.28 }}
          >
            <motion.h2
              variants={sectionLineRevealVariants}
              className="font-service text-3xl md:text-5xl font-bold leading-tight text-mocha-800"
            >
              Satyam Tiwari — Flutter developer with a product-owner lens
            </motion.h2>
            <motion.div
              variants={sectionListStaggerVariants}
              className="space-y-5 text-mocha-600 text-sm md:text-base leading-relaxed"
            >
              <motion.p variants={sectionListItemFadeUpVariants}>
                I&apos;m a product-focused mobile and frontend developer with <span className="font-semibold text-mocha-600">5 years of total experience</span>
                : about <span className="font-semibold text-mocha-600">1.5 years</span> in full-time product teams and{' '}
                <span className="font-semibold text-mocha-600">3.5+ years</span> as an independent freelancer shipping apps that stay in production.
              </motion.p>
              <motion.p variants={sectionListItemFadeUpVariants}>
                I&apos;m used to owning products end to end—UI/UX implementation, architecture, testing, App Store and Play releases, compliance, and post-launch support—
                and working directly with founders to turn requirements into reliable systems.
              </motion.p>
              <motion.p variants={sectionListItemFadeUpVariants}>
                <span className="text-mocha-800 font-medium">App Store highlight:</span> four live mobile applications in production, with hands-on experience in App Store Connect,
                TestFlight, certificates, provisioning profiles, bundle identifiers, and the review process.
              </motion.p>
            </motion.div>

            <motion.div variants={sectionFadeUpVariants} className="flex flex-wrap gap-4 pt-2">
              <a
                href={RESUME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Resume
              </a>
              <a
                href={UPWORK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-white border border-stone-300/90 text-mocha-800 px-6 py-2.5 text-sm font-semibold rounded-sm hover:bg-stone-50 transition-colors"
              >
                Hire me
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="contact" className="relative z-10 border-t border-mocha-200/80">
        <div className="bg-mocha-150">
          <div className="max-w-7xl mx-auto px-6 py-16 md:py-20 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-16 xl:gap-24 items-start">
              <motion.div
                className="max-w-lg"
                variants={sectionHeadStaggerVariants}
                initial={reducedMotion ? false : 'hidden'}
                whileInView={reducedMotion ? undefined : 'visible'}
                viewport={{ once: true, amount: 0.35 }}
              >
                <motion.p variants={sectionLineRevealVariants} className="text-sm text-mocha-600 mb-4">
                  Contact me
                </motion.p>
                <motion.h2
                  variants={sectionLineRevealVariants}
                  className="font-service text-5xl sm:text-6xl md:text-7xl font-semibold text-mocha-800 leading-[0.98] tracking-tight mb-6"
                >
                  Get in touch
                </motion.h2>
                <motion.p
                  variants={sectionLineRevealVariants}
                  className="text-base md:text-lg text-mocha-600 leading-relaxed mb-6 max-w-md"
                >
                  For collaborations, freelance mobile work, or product builds—email or call. I typically reply within one business day.
                </motion.p>
                <motion.p variants={sectionFadeUpVariants} className="text-sm text-mocha-600 mb-10">
                  <a href={EMAIL_MAILTO} className="text-mocha-600 hover:text-mocha-800 hover:underline underline-offset-2">
                    satyamt5152@gmail.com
                  </a>
                  <span className="mx-2 text-mocha-400/70" aria-hidden>
                    ·
                  </span>
                  <a href={PHONE_TEL} className="text-mocha-600 hover:text-mocha-800 hover:underline underline-offset-2">
                    {PHONE_DISPLAY}
                  </a>
                </motion.p>
                <motion.div variants={sectionFadeUpVariants} className="flex flex-wrap items-center gap-3">
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon-btn"
                    aria-label="GitHub"
                  >
                    <Github size={16} strokeWidth={1.75} />
                  </a>
                  <a
                    href={LINKEDIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon-btn"
                    aria-label="LinkedIn"
                  >
                    <Linkedin size={16} strokeWidth={1.75} />
                  </a>
                  <a
                    href={MEDIUM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon-btn"
                    aria-label="Medium"
                  >
                    <MediumIcon className="h-4 w-4" />
                  </a>
                  <a
                    href={EMAIL_MAILTO}
                    className="social-icon-btn"
                    aria-label="Email"
                  >
                    <Mail size={16} strokeWidth={1.75} />
                  </a>
                </motion.div>
              </motion.div>

              <motion.div
                className="min-w-0"
                variants={sectionFadeUpVariants}
                initial={reducedMotion ? false : 'hidden'}
                whileInView={reducedMotion ? undefined : 'visible'}
                viewport={{ once: true, amount: 0.2, margin: '0px 0px -40px 0px' }}
              >
                <form onSubmit={handleContactSubmit} className="relative space-y-10">
                  <p className="sr-only" aria-live="polite">
                    {contactFormStatus === 'success' && 'Message sent successfully.'}
                    {contactFormStatus === 'error' && contactFormError}
                  </p>
                  {/* Honeypot — Web3Forms ignores bots that fill this */}
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
                        Phone Number
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
                      Write your message here
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
                  <button
                    type="submit"
                    disabled={contactFormStatus === 'sending'}
                    className="btn-primary-md"
                  >
                    {contactFormStatus === 'sending' ? 'Sending…' : 'Send Message'}
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="bg-transparent border-t border-mocha-200/80">
          <motion.div
            className="max-w-7xl mx-auto px-6 py-14 md:py-16 lg:px-10"
            variants={sectionHeadStaggerVariants}
            initial={reducedMotion ? false : 'hidden'}
            whileInView={reducedMotion ? undefined : 'visible'}
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-0">
              <motion.div variants={sectionFadeUpVariants} className="lg:pr-12 lg:border-r border-mocha-300/70">
                <h3 className="font-service text-4xl md:text-5xl font-semibold text-mocha-800 tracking-tight mb-5">
                  Satyam Tiwari
                </h3>
                <p className="text-mocha-600 text-base md:text-lg leading-relaxed mb-8 max-w-md">
                  Freelance Flutter lead · Chirpn (React / RN / Flutter) alumnus · Apps live on App Store with long-term maintenance.
                </p>
                <a
                  href={RESUME_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary-block"
                >
                  Resume
                </a>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon-btn"
                    aria-label="GitHub"
                  >
                    <Github size={16} strokeWidth={1.75} />
                  </a>
                  <a
                    href={LINKEDIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon-btn"
                    aria-label="LinkedIn"
                  >
                    <Linkedin size={16} strokeWidth={1.75} />
                  </a>
                  <a
                    href={MEDIUM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon-btn"
                    aria-label="Medium"
                  >
                    <MediumIcon className="h-4 w-4" />
                  </a>
                  <a href={EMAIL_MAILTO} className="social-icon-btn" aria-label="Email">
                    <Mail size={16} strokeWidth={1.75} />
                  </a>
                </div>
              </motion.div>

              <motion.div
                variants={sectionFadeUpVariants}
                className="grid grid-cols-1 sm:grid-cols-2 gap-10 lg:gap-8 lg:pl-12"
              >
                <div>
                  <h4 className="font-service text-2xl md:text-3xl font-semibold text-mocha-800 mb-6">Contact me</h4>
                  <div className="space-y-5 text-mocha-600 text-base leading-relaxed">
                    <p>
                      <span className="font-semibold text-mocha-800">Email:</span>
                      <br />
                      <a
                        href={EMAIL_MAILTO}
                        className="text-mocha-600 hover:text-mocha-800 transition-colors underline-offset-2 hover:underline"
                      >
                        satyamt5152@gmail.com
                      </a>
                    </p>
                    <p>
                      <span className="font-semibold text-mocha-800">Phone:</span>
                      <br />
                      <a href={PHONE_TEL} className="text-mocha-600 hover:text-mocha-800 transition-colors underline-offset-2 hover:underline">
                        {PHONE_DISPLAY}
                      </a>
                    </p>
                    <p>
                      <span className="font-semibold text-mocha-800">Address:</span>
                      <br />
                      <span className="mt-1 inline-block max-w-sm">
                        STELLA TOWERS PHASE 1, Stella Towers, D1-104, Moshi
                        <br />
                        Alandi Rd, Dudulgaon, Pimpri-Chinchwad, Moshi
                        <br />
                        Pune — 412105
                      </span>
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-service text-2xl md:text-3xl font-semibold text-mocha-800 mb-6">Menu</h4>
                  <ul className="space-y-3 text-mocha-600 text-base">
                    <li>
                      <a href="#home" className="hover:text-mocha-800 transition-colors">
                        Home
                      </a>
                    </li>
                    <li>
                      <a href="#services" className="hover:text-mocha-800 transition-colors">
                        Services
                      </a>
                    </li>
                    <li>
                      <a href="#projects" className="hover:text-mocha-800 transition-colors">
                        Projects
                      </a>
                    </li>
                    <li>
                      <a href="#designs" className="hover:text-mocha-800 transition-colors">
                        Designs
                      </a>
                    </li>
                    <li>
                      <a href="#about" className="hover:text-mocha-800 transition-colors">
                        About me
                      </a>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <footer className="border-t border-mocha-300/60 px-6 py-6">
            <p className="text-center text-mocha-600 text-sm leading-relaxed">
              Copyright © 2026 Satyam Tiwari - All rights reserved
            </p>
          </footer>
        </div>
      </section>
      
      {projectDetailIndex !== null && projects[projectDetailIndex] && (
        <ProjectDetailDialog project={projects[projectDetailIndex]} onClose={() => setProjectDetailIndex(null)} />
      )}

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
