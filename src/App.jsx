import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Github,
  Instagram,
  Linkedin,
  Mail,
} from 'lucide-react';

import gms1 from './assets/gms/gms1.png';
import gms2 from './assets/gms/gms2.png';
import gms3 from './assets/gms/gms3.png';
import gms4 from './assets/gms/gms4.png';
import gmsCarousel from './assets/gms/gms-carousel.jpg';
import sa1 from './assets/sa/sa1.png';
import sa2 from './assets/sa/sa2.png';
import sa3 from './assets/sa/sa3.png';
import sa4 from './assets/sa/sa4.png';
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
import ujCarousel from './assets/uj/uj-carousel.jpg';
import nanda1 from './assets/nanda/nanda1.png';
import nanda2 from './assets/nanda/nanda2.png';
import nanda3 from './assets/nanda/nanda3.png';
import nanda4 from './assets/nanda/nanda4.png';
import picksy1 from './assets/picksy/picksy1.png';
import picksy2 from './assets/picksy/picksy2.png';
import picksy3 from './assets/picksy/picksy3.png';
import picksyCarousel from './assets/picksy/picksy-carousel.jpg';
import picksyVideo from './assets/picksy/picksy.mp4';
import nextoffer1 from './assets/nextoffer/nextoffer1.png';
import nextoffer2 from './assets/nextoffer/nextoffer2.png';
import nextoffer3 from './assets/nextoffer/nextoffer3.png';
import nextofferCarousel from './assets/nextoffer/nextoffer-carousel.jpg';
import affittoCarousel from './assets/affitto/affitto-carousel.jpg';
import affittoAdmin from './assets/affitto/affitto-admin.png';
import affittoCustomerHome from './assets/affitto/affitto-customer-home.png';
import affittoCustomerCategories from './assets/affitto/affitto-customer-categories.png';
import affittoCustomerEquipment from './assets/affitto/affitto-customer-equipment.png';
import affittoCustomerBookings from './assets/affitto/affitto-customer-bookings.png';
import affittoOperatorHome from './assets/affitto/affitto-operator-home.png';
import affittoOperatorEnroute from './assets/affitto/affitto-operator-enroute.jpg';
import affittoOperatorEarnings from './assets/affitto/affitto-operator-earnings.png';
import mindfulNatureCarousel from './assets/mindful-nature/mindful-nature-carousel.jpg';
import woopdo1 from './assets/woopdo/woopdo1.png';
import woopdo2 from './assets/woopdo/woopdo2.png';
import woopdo3 from './assets/woopdo/woopdo3.png';
import woopdo4 from './assets/woopdo/woopdo4.png';
import safeAgainCarousel from './assets/sa/safe-again-carousel.jpg';
import wayaCarousel from './assets/wayawaya/waya-carousel.jpg';
import nandaCarousel from './assets/nanda/nanda-carousel.jpg';
import { trackEvent } from './lib/analytics.js';
import { AugeLanding } from './components/landing/AugeLanding.jsx';
import { ProjectOpenOverlay } from './components/ProjectOpenOverlay.jsx';
import { SiteCursor } from './components/SiteCursor.jsx';
import { RouteCurtain } from './components/works/RouteCurtain.jsx';
import { WorksPage } from './components/works/WorksPage.jsx';
import { initSound } from './lib/siteSound.js';
import { AboutPage } from './components/about/AboutPage.jsx';
import { ContactPage } from './components/contact/ContactPage.jsx';
import {
  findProjectIndexBySlug,
  isWorksIndex,
  parseWorksSlug,
  worksIndexPath,
  worksPath,
} from './lib/worksUrl.js';
import { aboutPath, isAboutPath } from './lib/aboutUrl.js';
import { contactPath, isContactPath } from './lib/contactUrl.js';

const GMS_GALLERY = [gms1, gms2, gms3, gms4];
const SAFE_AGAIN_GALLERY = [sa1, sa2, sa3, sa4];
const WAYA_WAYA_GALLERY = [waya1, waya2, waya3, waya4, waya5, waya6];
const UJ_WAYFINDER_GALLERY = [uj1, uj2, uj3, uj4, uj5];
const NANDA_GALLERY = [nanda1, nanda2, nanda3, nanda4];
const PICKSY_GALLERY = [picksy1, picksy2, picksy3];
const NEXTOFFER_GALLERY = [nextoffer1, nextoffer2, nextoffer3];
const AFFITTO_GALLERY = [
  affittoAdmin,
  affittoCustomerHome,
  affittoCustomerCategories,
  affittoCustomerEquipment,
  affittoCustomerBookings,
  affittoOperatorHome,
  affittoOperatorEnroute,
  affittoOperatorEarnings,
];
/** Woopdo app screens — same product as the Mindful Nature carousel art. */
const WOOPDO_GALLERY = [woopdo1, woopdo2, woopdo3, woopdo4];

const MediumIcon = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.78-6.82A6.8 6.8 0 0113.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
  </svg>
);

/** Get a free key at https://web3forms.com — set `VITE_WEB3FORMS_ACCESS_KEY` in `.env.local` */
const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY ?? '';
const GITHUB_URL = 'https://github.com/satyyyaamm';
const LINKEDIN_URL = 'https://www.linkedin.com/in/satyam-tiwari-a03299200';
const INSTAGRAM_URL = 'https://www.instagram.com/buildwithsatyamm/';
const MEDIUM_URL = 'https://medium.com/@satyamt5152';
const EMAIL_MAILTO = 'mailto:satyamt5152@gmail.com';
const PHONE_DISPLAY = '+91 87933 80992';
const PHONE_TEL = 'tel:+918793380992';

const SOCIAL_ITEMS = [
  { label: 'GitHub', href: GITHUB_URL, icon: <Github size={16} strokeWidth={1.75} /> },
  { label: 'LinkedIn', href: LINKEDIN_URL, icon: <Linkedin size={16} strokeWidth={1.75} /> },
  { label: 'Instagram', href: INSTAGRAM_URL, icon: <Instagram size={16} strokeWidth={1.75} /> },
  { label: 'Medium', href: MEDIUM_URL, icon: <MediumIcon className="h-4 w-4" /> },
  { label: 'Email', href: EMAIL_MAILTO, icon: <Mail size={16} strokeWidth={1.75} /> },
];

const App = () => {
  const [projectOpen, setProjectOpen] = useState(null); // { index, fromRect }
  const [worksIndex, setWorksIndex] = useState(() =>
    typeof window !== 'undefined' ? isWorksIndex(window.location.pathname) : false
  );
  const [aboutOpen, setAboutOpen] = useState(() =>
    typeof window !== 'undefined' ? isAboutPath(window.location.pathname) : false
  );
  const [contactOpen, setContactOpen] = useState(() =>
    typeof window !== 'undefined' ? isContactPath(window.location.pathname) : false
  );
  const [curtain, setCurtain] = useState(null); // { to: 'works' | 'home' | 'about' | 'contact', label }
  const [homeRevealing, setHomeRevealing] = useState(false);
  /** Destination screen may interact — curtain lifts only after this */
  const [routeLiftReady, setRouteLiftReady] = useState(false);
  const [routeReadyRequestId, setRouteReadyRequestId] = useState(0);
  const openCoveredRef = useRef(null);
  const cursorSuppressRef = useRef(false);
  const curtainCoveredRef = useRef(null);
  const curtainDoneRef = useRef(null);
  const routeCoveredRef = useRef(false);
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

  useEffect(() => {
    initSound();
  }, []);

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

  const projects = [
    {
      id: 0,
      slug: 'osac-gms',
      name: "OSAC GMS",
      meta: "Garage Management · Flutter · Aug 2025 – Present · Pre-production",
      role: "Sole developer & technical owner",
      summary:
        "A workshop tool taking shape—quotations, job cards, and technician diaries in one place so garages spend less time chasing paper and more time on the floor.",
      desc: "Full-scale garage management for automotive service centers: quotations, invoices, job cards tied to vehicle registration, technician time tracking, admin configuration, and finance (in progress)—built in Flutter with modular architecture.",
      challenge:
        "Service centres juggled quotations, job cards, and technician time across paper and chat—no shared view of who owned a vehicle or how long a job had been open.",
      solution:
        "A modular Flutter system that ties sales, workshop floor, and admin into one flow: VRM-linked job cards, live technician diaries, and templates that make repeat work fast to spin up.",
      highlights: [
        "Sales workflows: quotations, invoices, job cards (VRM-linked), task diary assigning jobs to technicians and ramps.",
        "Technician module: assigned jobs, check-in/out, lunch breaks, and time tracking per task.",
        "Admin: staff, inventory, workshop resources, profile/task templates for repeatable job creation.",
        "Stack: Flutter & Dart, Riverpod, GoRouter—designed for multi-role access and long-term maintainability.",
      ],
      image: gmsCarousel,
      gallery: GMS_GALLERY,
      previewFrame: 'web',
      href: "#",
    },
    {
      id: 1,
      slug: 'safe-again',
      name: "Safe Again",
      meta: "Women’s safety · Flutter + Firebase · Mid 2023 – Mid 2025 · Live",
      role: "Lead developer",
      summary:
        "A safety network for real moments—broadcast distress to verified people nearby, build private signal groups, and stay connected through community when it matters.",
      desc: "Real-time safety app: distress signals to nearby verified users, private signal groups, community posts, messaging, and push notifications—with scalable Firestore modeling.",
      challenge:
        "Safety tools are either too slow or too public—people need nearby help without exposing themselves to the wrong audience.",
      solution:
        "Real-time distress to verified nearby users, private signal groups, and a community layer on Firestore with push that reaches people when seconds count.",
      highlights: [
        "Emergency broadcast, acceptance flows, and signal history for accountability.",
        "Community module with location-based filtering; separate collections for signals, chats, posts, and users.",
        "Push notifications for emergencies, signal updates, and community activity.",
      ],
      image: safeAgainCarousel,
      gallery: SAFE_AGAIN_GALLERY,
      previewFrame: 'mobile',
      href: "#",
    },
    {
      id: 2,
      slug: 'nextoffer-ai',
      name: "NextOffer.ai",
      meta: "AI job search · Next.js · 2026 · Live",
      role: "Founder & full-stack developer",
      summary:
        "A job search companion that reads your resume, scores each role, and helps you send applications that actually sound like you—not a template.",
      desc: "AI-powered job hunt platform: resume-tailored search with per-role compatibility scores, multi-source job aggregation, LinkedIn profile analysis, and one-click ATS application kits—landing, dashboard, and optimiser flows deployed on Firebase.",
      challenge:
        "Job seekers spray generic applications across tabs and tools—with no clear signal of fit, and copy that never sounds like them.",
      solution:
        "One Next.js + Firebase product that scores roles against your resume, aggregates listings, and generates ATS-ready kits you can ship in a click.",
      highlights: [
        "Job search dashboard with saved profile, skill tags, and filters for remote/hybrid, experience level, salary, and job sources (JSearch, Jooble, Adzuna).",
        "LinkedIn optimiser: PDF upload or paste-in analysis with scored sections, strengths, and prioritised improvement list.",
        "Application kit generation and freemium pricing (Free, Weekly Sprint, Monthly Pro) with Google sign-in.",
      ],
      image: nextofferCarousel,
      gallery: NEXTOFFER_GALLERY,
      previewFrame: 'web',
      href: "https://nextoffer-ai.web.app",
    },
    {
      id: 3,
      slug: 'nanda-enterprise',
      name: "Nanda Enterprises",
      meta: "Business operations platform",
      role: "Product and engineering execution",
      summary:
        "Operations software for teams tired of chasing updates in calls and chats—one place to see requests, status, and who owns what next.",
      desc: "Operations software that centralizes request tracking, status visibility, and approval steps. It solves fragmented communication and unclear ownership by giving teams one source of truth for day-to-day execution.",
      challenge:
        "Requests lived in calls, chats, and spreadsheets—ownership blurred, follow-ups piled up, and nobody could see the next decision.",
      solution:
        "A single operations surface for intake, status, and approvals so handoffs stay visible and teams move without chasing updates.",
      highlights: [
        "Unified request intake and status tracking so teams stop juggling calls, chat threads, and spreadsheets.",
        "Clear handoffs and ownership visibility to reduce follow-ups and missed actions.",
        "Faster approvals and decision cycles through a single workflow view.",
      ],
      image: nandaCarousel,
      gallery: NANDA_GALLERY,
      previewFrame: 'web',
      href: "#",
    },
    {
      id: 4,
      slug: 'wayawaya',
      name: "Waya Waya",
      meta: "Mall rewards & discovery · Flutter · Nov 2021 – Present · Live",
      role: "Lead mobile developer",
      summary:
        "Mall discovery and rewards across South Africa—browse stores, collect points when you walk in, and redeem offers even when the signal drops.",
      desc: "Consumer mall app used across malls in South Africa: discovery, offers, and a location-based rewards system with offline-first local storage.",
      challenge:
        "Mall apps fail underground—spotty signal breaks discovery, check-in, and voucher redeem right when shoppers need them.",
      solution:
        "An offline-first Flutter client with local SQL sync, location-based rewards on entry, and partner redemption that still works when the network dips.",
      highlights: [
        "Authentication, mall selection, stores, and regional offers.",
        "Offline-first sync with SQL plus remote data; points for entering malls and voucher redemption with partners.",
        "Shared architecture patterns with UJ WayFinder, tuned via configuration.",
      ],
      image: wayaCarousel,
      gallery: WAYA_WAYA_GALLERY,
      previewFrame: 'mobile',
      href: "#",
    },
    {
      id: 5,
      slug: 'picksy',
      name: "Picksy",
      meta: "Social decision-making · Mobile · 2025 · Concept",
      role: "Product design & mobile UX",
      summary:
        "For nights when nobody can agree—swipe on movies, food, or plans with friends until the group finds a match worth leaving the couch for.",
      desc: "Social swipe-and-match app for groups choosing what to watch, eat, or do together—room lobbies, category filters, Tinder-style voting, group matches, chat, and profile stats in a dark neon UI built for friends deciding together.",
      challenge:
        "Group plans die in endless polls and chat threads—nobody can see what others actually want until the night is already half gone.",
      solution:
        "A swipe-first room experience: friends vote in parallel, social proof surfaces as they go, and a shared match locks the plan with chat still in-app.",
      highlights: [
        "Multi-category rooms (movies, restaurants, activities) with mood presets, genre/platform filters, and shareable room codes.",
        "Swipe flow with like, maybe, and pass—plus social proof showing what friends in the room already picked.",
        "Group match celebrations, watchlist/history, and integrated chat to lock in plans without leaving the app.",
      ],
      image: picksyCarousel,
      previewImage: picksy3,
      gallery: PICKSY_GALLERY,
      video: picksyVideo,
      previewFrame: 'mobile',
      href: "#",
    },
    {
      id: 6,
      slug: 'uj-wayfinder',
      name: "UJ WayFinder",
      meta: "Campus navigation · Flutter · Nov 2021 – Present · Live",
      role: "Lead mobile developer",
      summary:
        "Campus wayfinding for students—pick your university, follow indoor routes, and let beacons nudge you when GPS alone isn't enough.",
      desc: "Wayfinding for university campuses in South Africa: college selection, maps, routes, and BLE proximity for accurate indoor guidance.",
      challenge:
        "GPS collapses indoors—students get lost between buildings while campus maps stay static and disconnected from where they actually stand.",
      solution:
        "Indoor routes plus BLE beacon proximity on a shared Flutter codebase with Waya Waya, configured per campus so guidance stays accurate inside.",
      highlights: [
        "Map rendering and indoor navigation logic with BLE beacon integration.",
        "Common codebase with Waya Waya, separated by configuration.",
      ],
      image: ujCarousel,
      gallery: UJ_WAYFINDER_GALLERY,
      previewFrame: 'mobile',
      href: "#",
    },
    {
      id: 7,
      slug: 'affitto',
      name: 'Affitto',
      meta: 'Heavy equipment rental · Flutter + Next.js + Firebase · In progress',
      role: 'Founder · product design & full-stack engineering',
      summary:
        'Heavy equipment, right when you need it—book Hydras and more by the hour, dispatch operators live, and run the yard from one ops console.',
      desc: 'Marketplace monorepo for construction equipment rental in India: Flutter customer + operator apps sharing packages/affitto_core, and a Next.js admin panel on Firebase (Auth, Firestore, Storage, FCM). Bookings, live jobs with start/end PINs, pricing quotes, operator onboarding, and verification stay behind repository contracts so the backend can move off Firebase later.',
      challenge:
        'Yards still book Hydras over phone and WhatsApp—availability is unclear, operators get double-booked, PIN-less job starts are insecure, and revenue only shows up days late across chat threads.',
      solution:
        'Three surfaces on one domain model: customers quote and book machines, operators go online / accept / navigate / start-complete with customer PINs, and admins see bookings, fleet, verification, and INR revenue without each app inventing its own booking shape.',
      highlights: [
        'Customer + operator Flutter apps with shared affitto_core contracts (auth, bookings, jobs, pricing, earnings)—no Firebase types above the data layer.',
        'Live job flow: accept offer, on-the-way map, start/complete via customer-read PINs (never stored on-device), extend hours, job photos, and earnings.',
        'Operator onboarding: personal → equipment → documents (Aadhaar, DL, RC, insurance) → bank → review, with verification queue in admin.',
        'Next.js ops console: dashboard KPIs, bookings overview, live map, recent jobs, revenue, and catalogue/verification wired to Firestore when configured.',
      ],
      image: affittoCarousel,
      previewImage: affittoCustomerHome,
      gallery: AFFITTO_GALLERY,
      previewFrame: 'mobile',
      href: 'https://affitto-equipment-app.web.app',
    },
    {
      id: 8,
      slug: 'woopdo',
      name: 'Woopdo',
      meta: 'Social covers · Flutter · Concept',
      role: 'Product design & mobile UX',
      summary:
        'Collect “woops” like Mindful Nature—swipe today’s highlights, open cover stories, and keep your media in one playful feed.',
      desc: 'Woopdo is a cover-first social app: today’s highlights cards, polaroid-style woop collections on your profile, and branded experiences like Mindful Nature (Pause · Breathe · Be Present) with a mint, yellow, and navy system.',
      challenge:
        'Photo dumps and stories feel either clinical or noisy—people want a soft ritual for saving moments without another productivity dashboard.',
      solution:
        'A highlights feed plus “Your woops” covers that open into media, with Mindful Nature as a flagship cover identity on the landing strip.',
      highlights: [
        'Today’s highlights feed with thick-border photo cards and Mindful Nature cover badges.',
        'Profile “Your woops” carousel—tap a cover to open the media inside.',
        'Shared art direction: mint/yellow UI screens plus the burgundy Mindful Nature carousel hero.',
      ],
      image: mindfulNatureCarousel,
      previewImage: woopdo1,
      gallery: WOOPDO_GALLERY,
      previewFrame: 'mobile',
      href: '#',
    },
  ];

  const openProject = projects[projectOpen?.index];
  const caseOpen = Boolean(openProject);
  const nextProjectIndex =
    caseOpen && projects.length > 1
      ? (projectOpen.index + 1) % projects.length
      : -1;
  const nextProject = nextProjectIndex >= 0 ? projects[nextProjectIndex] : null;

  const openWorks = (index, fromRect = null) => {
    const project = projects[index];
    if (!project) return;
    openCoveredRef.current = fromRect?.onCovered || null;
    const { onCovered: _cb, ...rect } = fromRect || {};
    setAboutOpen(false);
    setContactOpen(false);
    setProjectOpen({ index, fromRect: fromRect ? rect : null });
    const next = worksPath(project.slug);
    if (window.location.pathname !== next) {
      window.history.pushState({ works: project.slug }, '', next);
    }
  };

  const markRouteLiftReady = useCallback(() => {
    if (!routeCoveredRef.current) return;
    setRouteLiftReady(true);
  }, []);

  const signalHomeReady = useCallback(() => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => markRouteLiftReady());
    });
  }, [markRouteLiftReady]);

  const runCurtain = (to, label, apply) => {
    routeCoveredRef.current = false;
    setRouteLiftReady(false);
    curtainCoveredRef.current = () => {
      apply();
      routeCoveredRef.current = true;
      setRouteReadyRequestId((n) => n + 1);
      if (to === 'home') signalHomeReady();
    };
    curtainDoneRef.current = () => {
      setCurtain(null);
      routeCoveredRef.current = false;
      setRouteLiftReady(false);
    };
    setCurtain({ to, label });
  };

  const openWorksIndex = () => {
    const go = () => {
      setHomeRevealing(false);
      setProjectOpen(null);
      setAboutOpen(false);
      setContactOpen(false);
      setWorksIndex(true);
      if (!isWorksIndex(window.location.pathname)) {
        window.history.pushState({ works: 'index' }, '', worksIndexPath());
      }
    };
    runCurtain('works', 'WORKS', go);
  };

  const openAbout = () => {
    const go = () => {
      setHomeRevealing(false);
      setProjectOpen(null);
      setWorksIndex(false);
      setContactOpen(false);
      setAboutOpen(true);
      if (!isAboutPath(window.location.pathname)) {
        window.history.pushState({ about: true }, '', aboutPath());
      }
    };
    runCurtain('about', 'ABOUT', go);
  };

  const openContact = () => {
    const go = () => {
      setHomeRevealing(false);
      setProjectOpen(null);
      setWorksIndex(false);
      setAboutOpen(false);
      setContactOpen(true);
      if (!isContactPath(window.location.pathname)) {
        window.history.pushState({ contact: true }, '', contactPath());
      }
    };
    runCurtain('contact', "LET'S TALK", go);
  };

  const coverHome = () => {
    setHomeRevealing(true);
    setWorksIndex(false);
    setAboutOpen(false);
    setContactOpen(false);
    if (
      parseWorksSlug(window.location.pathname) ||
      isWorksIndex(window.location.pathname) ||
      isAboutPath(window.location.pathname) ||
      isContactPath(window.location.pathname)
    ) {
      window.history.pushState({ works: null }, '', '/');
    }
  };

  const closeWorks = () => {
    openCoveredRef.current = null;
    setHomeRevealing(false);
    setProjectOpen(null);
    if (isWorksIndex(window.location.pathname)) {
      setWorksIndex(true);
      return;
    }
    if (parseWorksSlug(window.location.pathname)) {
      setWorksIndex(false);
      window.history.pushState({ works: null }, '', '/');
    }
  };

  const closeWorksIndex = () => {
    runCurtain('home', 'HOME', () => {
      setWorksIndex(false);
      setAboutOpen(false);
      setContactOpen(false);
      setProjectOpen(null);
      if (
        isWorksIndex(window.location.pathname) ||
        parseWorksSlug(window.location.pathname) ||
        isAboutPath(window.location.pathname) ||
        isContactPath(window.location.pathname)
      ) {
        window.history.pushState({ works: null }, '', '/');
      }
    });
  };

  // Deep link: /works, /works/picksy, /about, /contacts (and legacy /?case=0)
  useEffect(() => {
    if (isContactPath(window.location.pathname)) {
      setContactOpen(true);
      setAboutOpen(false);
      setWorksIndex(false);
      return undefined;
    }
    if (isAboutPath(window.location.pathname)) {
      setAboutOpen(true);
      setContactOpen(false);
      setWorksIndex(false);
      return undefined;
    }
    if (isWorksIndex(window.location.pathname)) {
      setWorksIndex(true);
      return undefined;
    }
    const fromPath = parseWorksSlug(window.location.pathname);
    if (fromPath) {
      const index = findProjectIndexBySlug(projects, fromPath);
      if (index >= 0) {
        setProjectOpen({ index, fromRect: null });
        return undefined;
      }
    }
    const raw = new URLSearchParams(window.location.search).get('case');
    if (raw == null || raw === '') return undefined;
    const index = Number.parseInt(raw, 10);
    if (!Number.isFinite(index) || index < 0 || index >= projects.length) return undefined;
    const project = projects[index];
    setProjectOpen({ index, fromRect: null });
    if (project?.slug) {
      window.history.replaceState({ works: project.slug }, '', worksPath(project.slug));
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once from URL
  }, []);

  // Browser back/forward ↔ index / detail
  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      if (isContactPath(path)) {
        openCoveredRef.current = null;
        setHomeRevealing(false);
        setProjectOpen(null);
        setWorksIndex(false);
        setAboutOpen(false);
        setContactOpen(true);
        return;
      }
      if (isAboutPath(path)) {
        openCoveredRef.current = null;
        setHomeRevealing(false);
        setProjectOpen(null);
        setWorksIndex(false);
        setContactOpen(false);
        setAboutOpen(true);
        return;
      }
      if (isWorksIndex(path)) {
        openCoveredRef.current = null;
        setHomeRevealing(false);
        setProjectOpen(null);
        setAboutOpen(false);
        setContactOpen(false);
        setWorksIndex(true);
        return;
      }
      const slug = parseWorksSlug(path);
      if (!slug) {
        openCoveredRef.current = null;
        setHomeRevealing(false);
        setProjectOpen(null);
        setWorksIndex(false);
        setAboutOpen(false);
        setContactOpen(false);
        return;
      }
      const index = findProjectIndexBySlug(projects, slug);
      setWorksIndex(false);
      setAboutOpen(false);
      setContactOpen(false);
      if (index >= 0) setProjectOpen({ index, fromRect: null });
      else setProjectOpen(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`journey-root font-sans relative${caseOpen ? ' is-case-open' : ''}${homeRevealing ? ' is-home-revealing' : ''}${worksIndex ? ' is-works-index' : ''}${aboutOpen ? ' is-about' : ''}${contactOpen ? ' is-contact' : ''}`}
    >
      <SiteCursor suppressRef={cursorSuppressRef} />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <main id="main-content" tabIndex={-1} className="relative outline-none">
        <AugeLanding
          projects={projects}
          stripPaused={(caseOpen && !homeRevealing) || worksIndex || aboutOpen || contactOpen}
          cursorSuppressRef={cursorSuppressRef}
          onOpenWorksIndex={() => openWorksIndex()}
          onOpenAbout={() => openAbout()}
          onOpenContact={() => openContact()}
          onOpenProject={(index, fromRect) => {
            setHomeRevealing(false);
            setWorksIndex(false);
            openWorks(index, fromRect);
          }}
          socialItems={SOCIAL_ITEMS}
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
      </main>

      {worksIndex ? (
        <WorksPage
          projects={projects}
          paused={caseOpen}
          cursorSuppressRef={cursorSuppressRef}
          socialItems={SOCIAL_ITEMS}
          readyRequestId={curtain?.to === 'works' ? routeReadyRequestId : 0}
          onInteractive={curtain?.to === 'works' ? markRouteLiftReady : undefined}
          onOpenProject={(index, fromRect) => {
            setHomeRevealing(false);
            openWorks(index, fromRect);
          }}
          onHome={closeWorksIndex}
          onOpenAbout={() => openAbout()}
          onOpenContact={() => openContact()}
          onOpenWorks={() => openWorksIndex()}
          emailMailto={EMAIL_MAILTO}
        />
      ) : null}

      {aboutOpen ? (
        <AboutPage
          projects={projects}
          socialItems={SOCIAL_ITEMS}
          emailMailto={EMAIL_MAILTO}
          readyRequestId={curtain?.to === 'about' ? routeReadyRequestId : 0}
          onInteractive={curtain?.to === 'about' ? markRouteLiftReady : undefined}
          onHome={closeWorksIndex}
          onOpenWorks={() => openWorksIndex()}
          onOpenContact={() => openContact()}
          onOpenProject={(index) => {
            setHomeRevealing(false);
            setAboutOpen(false);
            openWorks(index, null);
          }}
        />
      ) : null}

      {contactOpen ? (
        <ContactPage
          projects={projects}
          socialItems={SOCIAL_ITEMS}
          emailMailto={EMAIL_MAILTO}
          readyRequestId={curtain?.to === 'contact' ? routeReadyRequestId : 0}
          onInteractive={curtain?.to === 'contact' ? markRouteLiftReady : undefined}
          onHome={closeWorksIndex}
          onOpenWorks={() => openWorksIndex()}
          onOpenAbout={() => openAbout()}
        />
      ) : null}

      <RouteCurtain
        active={Boolean(curtain)}
        label={curtain?.label || ''}
        ready={routeLiftReady}
        onCovered={() => curtainCoveredRef.current?.()}
        onDone={() => curtainDoneRef.current?.()}
      />

      <AnimatePresence>
        {caseOpen ? (
          <ProjectOpenOverlay
            key="works-overlay"
            project={openProject}
            nextProject={nextProject}
            fromRect={projectOpen?.fromRect || null}
            socialItems={SOCIAL_ITEMS}
            emailMailto={EMAIL_MAILTO}
            onCovered={() => openCoveredRef.current?.()}
            homeReady={routeLiftReady}
            onHomeBegin={() => {
              routeCoveredRef.current = false;
              setRouteLiftReady(false);
            }}
            onHomeCovered={() => {
              coverHome();
              routeCoveredRef.current = true;
              signalHomeReady();
            }}
            onClose={closeWorks}
            onOpenWorks={() => openWorksIndex()}
            onOpenAbout={() => openAbout()}
            onOpenContact={() => openContact()}
            onOpenNext={
              nextProjectIndex >= 0
                ? () => {
                    setHomeRevealing(false);
                    // Keep overlay mounted — it runs curtain → load → detail itself
                    openWorks(nextProjectIndex, null);
                  }
                : undefined
            }
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default App;
