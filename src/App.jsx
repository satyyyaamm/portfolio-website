import React, { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
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
} from 'lucide-react';

const MediumIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.78-6.82A6.8 6.8 0 0113.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
  </svg>
);

const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-sm border-b border-zinc-900 py-3 px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <a href="#home" className="text-lg font-bold tracking-tight text-white hover:text-zinc-200 transition-colors">
          Satyam
        </a>
        <div className="hidden md:flex gap-6 text-xs font-medium text-zinc-400">
          <a href="#home" className="hover:text-white transition-colors">Home</a>
          <a href="#services" className="hover:text-white transition-colors">Services</a>
          <a href="#projects" className="hover:text-white transition-colors">Projects</a>
          <a href="#designs" className="hover:text-white transition-colors">Designs</a>
          <a href="#about" className="hover:text-white transition-colors">About</a>
          <a href="#contact" className="hover:text-white transition-colors">Contact</a>
        </div>
        <a
          href="#contact"
          className="border border-zinc-700 px-5 py-1.5 rounded-md text-xs font-medium hover:bg-white hover:text-black transition-all"
        >
          Contact
        </a>
      </div>
    </nav>
  );
};

const RESUME_URL = "/Satyam-Tiwari-Resume.pdf";
const MEDIUM_URL = "https://medium.com/@satyamt5152";

/** Get a free key at https://web3forms.com — set `VITE_WEB3FORMS_ACCESS_KEY` in `.env.local` */
const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY ?? "";
const GITHUB_URL = "https://github.com/satyyyaamm";
const LINKEDIN_URL = "https://www.linkedin.com/in/satyam-tiwari-a03299200";
const PHONE_DISPLAY = "+91 87933 80992";
const PHONE_TEL = "tel:+918793380992";

const techMarqueeItems = [
  "Flutter",
  "Dart",
  "JavaScript",
  "React Native",
  "React.js",
  "Angular",
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
  "inline-flex shrink-0 items-center rounded border border-zinc-800/90 bg-zinc-900/70 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-zinc-200 shadow-sm backdrop-blur-sm sm:px-2.5 sm:py-1.5 sm:text-[10px]";

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

function HeroTechMarquee() {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div className="mt-14 w-full max-w-7xl md:mt-20">
        <p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Technologies I use
        </p>
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

  const edgeFade =
    "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.2) 8%, rgba(0,0,0,0.75) 20%, black 38%, black 62%, rgba(0,0,0,0.75) 80%, rgba(0,0,0,0.2) 92%, transparent 100%)";

  return (
    <motion.div
      className="tech-marquee-wrap mt-14 w-full md:mt-20"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Technologies I use
      </p>
      <div
        className="relative w-full max-w-7xl mx-auto overflow-hidden py-2"
        style={{
          maskImage: edgeFade,
          WebkitMaskImage: edgeFade,
        }}
      >
        <div className="flex min-h-10 items-center sm:min-h-[2.75rem]">
          <TechMarqueeStrip items={techMarqueeItems} />
        </div>
      </div>
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
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close project details"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-detail-title"
        className="relative z-10 flex w-full max-w-lg flex-col rounded-t-2xl border border-zinc-800 bg-zinc-950 shadow-2xl sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
          <div className="min-w-0 pr-2">
            <h2 id="project-detail-title" className="font-service text-xl font-bold tracking-tight text-white">
              {project.name}
            </h2>
            <p className="mt-1 text-xs leading-snug text-zinc-500">{project.meta}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </div>
        <div className="flex-1 px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{project.role}</p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">{project.desc}</p>
          {project.highlights?.length > 0 && (
            <>
              <h3 className="mt-6 text-sm font-semibold text-white">Highlights</h3>
              <ul className="mt-3 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-zinc-400 marker:text-zinc-600">
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

const App = () => {
  const [activeProject, setActiveProject] = useState(0);
  const [projectDetailIndex, setProjectDetailIndex] = useState(null);
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

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 30, stiffness: 200 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX - 200); 
      mouseY.set(e.clientY - 200); 
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
    // mouseX / mouseY are stable MotionValue instances from useMotionValue
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      title: "Frontend (React & Angular)",
      icon: <Layout size={32} strokeWidth={1.5} />,
      desc: "Reusable UI, dashboards, and responsive flows in React.js; Angular for problem-solving and legacy fixes alongside designers and backend teams.",
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
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=1200",
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
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200",
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
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200",
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
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200",
      href: "#",
    },
    {
      id: 4,
      name: "PURI (Urinalysis)",
      meta: "HealthTech · Flutter · Retired",
      role: "Developer",
      summary:
        "Mobile HealthTech product focused on urinalysis workflows: end-to-end Flutter implementation from early build through store presence and later retirement from active distribution. The project reinforced how I scope features, ship under regulatory-adjacent constraints, and wind down a product cleanly while keeping lessons for future health-related mobile work.",
      desc: "Mobile urinalysis / health-focused application; retired from active distribution with learnings carried into later HealthTech-adjacent work.",
      highlights: ["End-to-end mobile ownership through lifecycle from build to retirement."],
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200",
      href: "#",
    },
  ];

  const creativeDesigns = [
    {
      name: "Mobiurja",
      desc: "On-demand petrol delivery (Chirpn IT Solutions): contributed to frontend and mobile flows—user journeys, dashboards, and performance-minded UI for a live fuel-delivery platform.",
      image: "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=1200&q=80",
      accent: "#1e3a5f",
      href: "#",
    },
    {
      name: "Social Share",
      desc: "Linktree-style social profile aggregation: built frontend components, responsive layouts, and interaction flows so users could present links and content in one place.",
      image: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=1200&q=80",
      accent: "#4c1d95",
      href: "#",
    },
    {
      name: "Sportly",
      desc: "Sports-focused mobile application: shipped and maintained features alongside designers and backend engineers in an agile release cadence with code review.",
      image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
      accent: "#14532d",
      href: "#",
    },
    {
      name: "OSAC GMS (preview)",
      desc: "Garage operations UI: job cards, sales staff workflows, and technician views—web-first Flutter targeting workshops that need clarity under daily load.",
      image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
      accent: "#292524",
      href: "#",
    },
    {
      name: "Safe Again (flows)",
      desc: "Safety-first UX: emergency signal paths, verified-user matching, and community surfaces designed for speed and trust under stress.",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      accent: "#3f3f46",
      href: "#",
    },
  ];

  return (
    <div className="bg-black text-white font-sans min-h-screen relative overflow-x-hidden">
      <Navbar />
      <motion.div
        style={{ x: cursorX, y: cursorY }}
        className="fixed top-0 left-0 w-[400px] h-[400px] bg-white/[0.16] rounded-full blur-[100px] pointer-events-none z-[1]"
        aria-hidden
      />

      {/* Hero */}
      <section id="home" className="min-h-screen flex flex-col items-center justify-center pt-16 px-6 text-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-zinc-500 mb-6">
          <MapPin size={14} /><span className="text-xs font-medium">India | Open to Remote</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-8xl font-bold max-w-5xl mb-4 tracking-tight leading-[1]">
          I'm Satyam Tiwari <br /> Flutter Developer
        </motion.h1>
        <p className="text-zinc-500 text-sm font-medium tracking-wide mb-6">Product owner mindset · India · Open to remote</p>
        <p className="text-zinc-400 max-w-2xl text-sm md:text-base mb-10 leading-relaxed">
          Product-focused mobile and frontend developer with ~5 years total experience—1.5 years full-time product work and 3.5+ years as an independent freelancer shipping apps customers use every day, from UI through App Store deployment and long-term support.
        </p>
        <div className="flex gap-4">
          <button className="bg-white text-black px-7 py-2.5 rounded-md text-xs font-bold transition-transform active:scale-95">Get yours now</button>
          <a href="#projects" className="bg-zinc-900 border border-zinc-800 text-white px-7 py-2.5 rounded-md text-xs font-bold transition-transform active:scale-95">See my work</a>
        </div>
        <HeroTechMarquee />
      </section>

      {/* Services */}
      <section id="services" className="py-24 px-6 border-t border-zinc-900 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h2 className="font-service text-5xl md:text-6xl font-bold tracking-tight mb-8">My Services</h2>
            <p className="text-zinc-400 max-w-md text-sm mb-8 leading-relaxed">
              Aligned with how I work in production: mobile-first delivery, web frontends, backend integrations, Firebase/Mongo, and owning the full lifecycle with founders and stakeholders.
            </p>
          </div>
          <div className="space-y-0">
            {services.map((s, i) => (
              <div key={i} className="border-t border-zinc-800 py-8 flex gap-7 items-start hover:bg-zinc-900/40 px-4 transition-all group">
                <div className="text-white shrink-0 pt-0.5">{s.icon}</div>
                <div>
                  <h3 className="font-service text-xl md:text-2xl font-bold tracking-tight mb-2">{s.title}</h3>
                  <p className="text-zinc-500 text-xs md:text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="projects" className="bg-black py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16 xl:gap-20">
          <div className="order-1 w-full shrink-0 lg:order-2 lg:w-[min(54%,620px)] xl:w-[min(54%,720px)]">
            <motion.div
              className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-zinc-950 ring-1 ring-white/10 shadow-2xl lg:mx-0 lg:max-w-none"
              style={{
                aspectRatio: "16 / 9",
                maxHeight: "min(52vh, calc(100dvh - 7.5rem))",
              }}
              whileHover={{ scale: 1.02, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <motion.img
                key={activeProject}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                src={projects[activeProject].image}
                alt={projects[activeProject].name}
                className="h-full w-full min-h-0 object-cover object-center"
                loading="eager"
              />
            </motion.div>
          </div>

          <div className="order-2 min-w-0 flex-1 lg:order-1 lg:max-w-xl">
            <h2 className="font-service text-4xl sm:text-5xl md:text-[2.75rem] font-bold tracking-tight text-white leading-[1.1] mb-6 md:mb-8">
              Selected projects &amp; shipped apps
            </h2>
            <div className="pr-0 lg:pr-2">
              {projects.map((p, i) => (
                <Fragment key={p.id}>
                  <motion.div
                    className="rounded-lg px-2"
                    initial={false}
                    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.055)" }}
                    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <div className="py-4 md:py-5 px-1">
                      <motion.button
                        type="button"
                        onClick={() => setActiveProject(i)}
                        aria-expanded={activeProject === i}
                        aria-controls={`project-panel-${p.id}`}
                        id={`project-trigger-${p.id}`}
                        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
                        whileHover={{ x: 6 }}
                        whileTap={{ scale: 0.995 }}
                        transition={{ type: "spring", stiffness: 420, damping: 28 }}
                      >
                        <h3 className="font-service text-xl md:text-2xl font-medium tracking-tight text-white">
                          {p.name}
                        </h3>
                        <p className="text-zinc-500 text-xs mt-1.5 font-normal tabular-nums">{p.meta}</p>
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
                            <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-400">{p.summary}</p>
                            <button
                              type="button"
                              onClick={() => setProjectDetailIndex(i)}
                              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-white hover:opacity-90 transition-opacity"
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
                    className="w-full shrink-0"
                    style={{ height: "0.5px", backgroundColor: "#ffffff" }}
                    role="presentation"
                    aria-hidden
                  />
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="designs" className="bg-zinc-950 py-24 border-t border-zinc-900 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-service text-4xl sm:text-5xl md:text-[2.75rem] font-bold tracking-tight text-white leading-[1.12]">
            More interfaces &amp;
            <br />
            team-era builds
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {creativeDesigns.map((d) => (
              <article key={d.name} className="flex flex-col">
                <div
                  className="aspect-[4/3] rounded-xl overflow-hidden flex items-center justify-center p-4 sm:p-6"
                  style={{ backgroundColor: d.accent }}
                >
                  <img
                    src={d.image}
                    alt={`${d.name} design mockup`}
                    className="max-h-full max-w-full object-contain rounded-md shadow-lg"
                  />
                </div>
                <h3 className="font-service text-lg sm:text-xl font-bold tracking-tight text-white mt-5">{d.name},</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mt-2 flex-1">{d.desc}</p>
                <a
                  href={d.href}
                  onClick={(e) => {
                    if (d.href === "#") e.preventDefault();
                  }}
                  className="inline-flex items-center gap-1 text-white text-sm font-medium mt-4 hover:opacity-90 transition-opacity"
                >
                  Learn more
                  <ArrowRight className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 px-6 border-t border-zinc-900 bg-black relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-16 items-start">
          <div className="relative w-full max-w-[360px] mx-auto lg:mx-0">
            <div className="absolute -right-5 top-6 h-[92%] w-[92%] rounded-[0_0_42px_0] border border-zinc-500/80" />
            <div className="relative z-10 rounded-sm overflow-hidden bg-zinc-900 ring-1 ring-white/10">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=900&q=80"
                alt="Satyam Tiwari"
                className="w-full h-[430px] object-cover"
              />
            </div>
          </div>

          <div className="max-w-3xl space-y-8">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-6">
                Satyam Tiwari — Flutter developer with a product-owner lens
              </h2>
              <div className="space-y-5 text-zinc-300 text-sm md:text-base leading-relaxed">
                <p>
                  I&apos;m a product-focused mobile and frontend developer with <span className="text-white font-medium">5 years of total experience</span>
                  : about <span className="text-white font-medium">1.5 years</span> in full-time product teams and{' '}
                  <span className="text-white font-medium">3.5+ years</span> as an independent freelancer shipping apps that stay in production.
                </p>
                <p>
                  I&apos;m used to owning products end to end—UI/UX implementation, architecture, testing, App Store and Play releases, compliance, and post-launch support—
                  and working directly with founders to turn requirements into reliable systems.
                </p>
                <p>
                  <span className="text-white font-medium">App Store highlight:</span> four live mobile applications in production, with hands-on experience in App Store Connect,
                  TestFlight, certificates, provisioning profiles, bundle identifiers, and the review process.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href={RESUME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-white text-black px-6 py-2.5 text-sm font-semibold rounded-sm hover:bg-zinc-100 transition-colors"
              >
                Resume
              </a>
              <a
                href="#contact"
                className="inline-flex items-center justify-center bg-zinc-900 border border-zinc-700 text-white px-6 py-2.5 text-sm font-semibold rounded-sm hover:bg-zinc-800 transition-colors"
              >
                Hire me
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="relative z-10 border-t border-zinc-900">
        <div className="bg-zinc-950">
          <div className="max-w-7xl mx-auto px-6 py-16 md:py-20 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-16 xl:gap-24 items-start">
              <div className="max-w-lg">
                <p className="text-sm text-white mb-4">Contact me</p>
                <h2 className="text-5xl sm:text-6xl md:text-7xl font-semibold text-white leading-[0.98] tracking-tight mb-6">
                  Get in touch
                </h2>
                <p className="text-base md:text-lg text-white/90 leading-relaxed mb-6 max-w-md">
                  For collaborations, freelance mobile work, or product builds—email or call. I typically reply within one business day.
                </p>
                <p className="text-sm text-zinc-400 mb-10">
                  <a href={`mailto:satyamt5152@gmail.com`} className="text-white hover:underline underline-offset-2">
                    satyamt5152@gmail.com
                  </a>
                  <span className="mx-2 text-zinc-600" aria-hidden>
                    ·
                  </span>
                  <a href={PHONE_TEL} className="text-white hover:underline underline-offset-2">
                    {PHONE_DISPLAY}
                  </a>
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 shrink-0 rounded-full bg-zinc-800 border border-zinc-700/90 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors"
                    aria-label="GitHub"
                  >
                    <Github size={16} strokeWidth={1.75} />
                  </a>
                  <a
                    href={LINKEDIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 shrink-0 rounded-full bg-zinc-800 border border-zinc-700/90 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin size={16} strokeWidth={1.75} />
                  </a>
                  <a
                    href={MEDIUM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 shrink-0 rounded-full bg-zinc-800 border border-zinc-700/90 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors"
                    aria-label="Medium"
                  >
                    <MediumIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="min-w-0">
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
                      <label htmlFor="contact-name" className="block text-sm text-white mb-2">
                        Full name
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        value={formData.name}
                        disabled={contactFormStatus === 'sending'}
                        className="w-full bg-transparent border-0 border-b border-white pb-2.5 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-white disabled:opacity-50"
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
                      <label htmlFor="contact-email" className="block text-sm text-white mb-2">
                        Email address
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        value={formData.email}
                        disabled={contactFormStatus === 'sending'}
                        className="w-full bg-transparent border-0 border-b border-white pb-2.5 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-white disabled:opacity-50"
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
                      <label htmlFor="contact-phone" className="block text-sm text-white mb-2">
                        Phone Number
                      </label>
                      <input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        disabled={contactFormStatus === 'sending'}
                        className="w-full bg-transparent border-0 border-b border-white pb-2.5 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-white disabled:opacity-50"
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          if (contactFormStatus === 'success' || contactFormStatus === 'error') {
                            setContactFormStatus('idle');
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-subject" className="block text-sm text-white mb-2">
                        Subject
                      </label>
                      <input
                        id="contact-subject"
                        name="subject"
                        value={formData.subject}
                        disabled={contactFormStatus === 'sending'}
                        className="w-full bg-transparent border-0 border-b border-white pb-2.5 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-white disabled:opacity-50"
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
                    <label htmlFor="contact-message" className="block text-sm text-white mb-2">
                      Write your message here
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      disabled={contactFormStatus === 'sending'}
                      className="w-full bg-transparent border-0 border-b border-white pb-2.5 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-white resize-none min-h-[120px] disabled:opacity-50"
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
                    <p className="text-sm text-emerald-400" role="status">
                      Thanks — your message was sent. I&apos;ll reply soon.
                    </p>
                  )}
                  {contactFormStatus === 'error' && contactFormError && (
                    <p className="text-sm text-red-400" role="alert">
                      {contactFormError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={contactFormStatus === 'sending'}
                    className="w-fit bg-zinc-200 text-black px-6 py-2.5 text-sm font-medium rounded-md hover:bg-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {contactFormStatus === 'sending' ? 'Sending…' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-transparent border-t border-zinc-800">
          <div className="max-w-7xl mx-auto px-6 py-14 md:py-16 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-0">
              <div className="lg:pr-12 lg:border-r border-zinc-700/80">
                <h3 className="font-service text-4xl md:text-5xl font-semibold text-white tracking-tight mb-5">
                  Satyam Tiwari
                </h3>
                <p className="font-service text-zinc-400 text-base md:text-lg leading-relaxed mb-8 max-w-md">
                  Freelance Flutter lead · Chirpn (React / RN / Flutter) alumnus · Apps live on App Store with long-term maintenance.
                </p>
                <a
                  href={RESUME_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-white text-black px-5 py-2.5 text-sm font-medium rounded-md mb-10 hover:bg-zinc-200 transition-colors"
                >
                  Resume
                </a>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                    aria-label="GitHub"
                  >
                    <Github size={16} strokeWidth={1.75} />
                  </a>
                  <a
                    href={LINKEDIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin size={16} strokeWidth={1.75} />
                  </a>
                  <a
                    href="mailto:satyamt5152@gmail.com"
                    className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                    aria-label="Email"
                  >
                    <Mail size={16} strokeWidth={1.75} />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 lg:gap-8 lg:pl-12">
                <div>
                  <h4 className="text-2xl md:text-3xl font-semibold text-white mb-6">Contact me</h4>
                  <div className="space-y-5 text-zinc-400 text-base leading-relaxed">
                    <p>
                      <span className="font-semibold text-white">Email:</span>
                      <br />
                      <a
                        href="mailto:satyamt5152@gmail.com"
                        className="hover:text-white transition-colors underline-offset-2 hover:underline"
                      >
                        satyamt5152@gmail.com
                      </a>
                    </p>
                    <p>
                      <span className="font-semibold text-white">Phone:</span>
                      <br />
                      <a href={PHONE_TEL} className="hover:text-white transition-colors underline-offset-2 hover:underline">
                        {PHONE_DISPLAY}
                      </a>
                    </p>
                    <p>
                      <span className="font-semibold text-white">Address:</span>
                      <br />
                      India — open to remote
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="text-2xl md:text-3xl font-semibold text-white mb-6">Menu</h4>
                  <ul className="space-y-3 text-zinc-400 text-base">
                    <li>
                      <a href="#home" className="hover:text-white transition-colors">
                        Home
                      </a>
                    </li>
                    <li>
                      <a href="#services" className="hover:text-white transition-colors">
                        Services
                      </a>
                    </li>
                    <li>
                      <a href="#projects" className="hover:text-white transition-colors">
                        Projects
                      </a>
                    </li>
                    <li>
                      <a href="#designs" className="hover:text-white transition-colors">
                        Designs
                      </a>
                    </li>
                    <li>
                      <a href="#about" className="hover:text-white transition-colors">
                        About me
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <footer className="border-t border-zinc-700 px-6 py-6">
            <p className="text-center text-zinc-400 text-sm leading-relaxed">
              Copyright © 2026 Satyam Tiwari - All rights reserved
              <span className="mx-2 text-zinc-600" aria-hidden>
                ||
              </span>
              Designed By: Satyam Tiwari
            </p>
          </footer>
        </div>
      </section>
      
      {projectDetailIndex !== null && projects[projectDetailIndex] && (
        <ProjectDetailDialog project={projects[projectDetailIndex]} onClose={() => setProjectDetailIndex(null)} />
      )}

    </div>
  );
};

export default App;
