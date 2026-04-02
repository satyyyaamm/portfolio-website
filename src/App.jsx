import React, { useState, useRef, useEffect, Fragment } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { 
  Github, 
  Linkedin, 
  ExternalLink, 
  Dribbble,
  Smartphone, 
  Layout, 
  Server, 
  ChevronRight, 
  ArrowRight, 
  Cpu, 
  MapPin, 
  ChevronLeft, 
  X,
  Briefcase
} from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-sm border-b border-zinc-900 py-3 px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-lg font-bold tracking-tight text-white">Satyam</div>
        <div className="hidden md:flex gap-6 text-xs font-medium text-zinc-400">
          <a href="#home" className="hover:text-white transition-colors">Home</a>
          <a href="#services" className="hover:text-white transition-colors">Services</a>
          <a href="#projects" className="hover:text-white transition-colors">Projects</a>
          <a href="#about" className="hover:text-white transition-colors">About</a>
          <a href="#contact" className="hover:text-white transition-colors">Contact</a>
        </div>
        <button className="border border-zinc-700 px-5 py-1.5 rounded-md text-xs font-medium hover:bg-white hover:text-black transition-all">
          Contact
        </button>
      </div>
    </nav>
  );
};

const App = () => {
  const [activeProject, setActiveProject] = useState(0);
  const [creativeIndex, setCreativeIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const creativeTrackRef = useRef(null);

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
  }, []);

  const handleSendMail = (e) => {
    e.preventDefault();
    const subj = encodeURIComponent(formData.subject.trim() || 'Inquiry');
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nSubject: ${formData.subject}\n\nMessage:\n${formData.message}`
    );
    window.location.href = `mailto:satyamt5152@gmail.com?subject=${subj}&body=${body}`;
  };

  const services = [
    { title: "Mobile App Dev", icon: <Smartphone size={32} strokeWidth={1.5} />, desc: "High-performance Flutter & React Native apps." },
    { title: "Front-End Dev", icon: <Layout size={32} strokeWidth={1.5} />, desc: "Responsive web apps using React and Tailwind." },
    { title: "Back-End Dev", icon: <Server size={32} strokeWidth={1.5} />, desc: "Robust APIs with Node.js and Django." },
    { title: "Product Strategy", icon: <Cpu size={32} strokeWidth={1.5} />, desc: "Aligning technical builds with business goals." }
  ];

  const projects = [
    {
      id: 0,
      name: "OSAC GMS",
      desc: "End-to-end garage management for automotive workshops: job cards, service history, parts inventory, and billing in one workflow. Built to cut admin time and give staff a clear daily view of bays, customers, and revenue.",
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=1200",
      href: "#"
    },
    {
      id: 1,
      name: "Waya Waya",
      desc: "A mall discovery app that helps visitors find stores, deals, and events while earning rewards for check-ins and purchases. The focus is fast search, simple maps, and notifications that feel helpful—not noisy.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200",
      href: "#"
    },
    {
      id: 2,
      name: "Safe Again",
      desc: "A safety companion for quick alerts and trusted contacts when someone feels at risk. Location sharing, emergency triggers, and calm onboarding were prioritized so the app stays dependable under stress.",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200",
      href: "#"
    },
    {
      id: 3,
      name: "UJ WayFinder",
      desc: "Indoor navigation for a large campus using BLE beacons so students can find lecture halls, labs, and venues without guesswork. Offline-friendly cues and step-by-step guidance reduce late arrivals on complex sites.",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200",
      href: "#"
    }
  ];

  const creativeDesigns = [
    {
      name: "Checkout",
      desc: "This page is designed for checking out your products bought from Astro Mart which, a high quality e-commerce website for delivering fresh and high quality products.",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80",
      accent: "#7dd3fc",
      href: "#"
    },
    {
      name: "Admin Panel",
      desc: "The MSCSC Admin Panel streamlines website management, enabling efficient updates to events and content. A simple and user-friendly tool for the team to keep the site dynamic.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
      accent: "#2563eb",
      href: "#"
    },
    {
      name: "Mobile experience",
      desc: "A focused mobile flow for onboarding and daily use—clear hierarchy, generous tap targets, and motion that reinforces feedback without slowing people down.",
      image: "https://images.unsplash.com/photo-1512428559083-a400a6b82c02?auto=format&fit=crop&w=1200&q=80",
      accent: "#1e293b",
      href: "#"
    },
    {
      name: "Analytics suite",
      desc: "Dashboards for teams who need signal, not noise: KPIs at a glance, drill-down when needed, and a layout that stays legible on long review sessions.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
      accent: "#0f172a",
      href: "#"
    },
    {
      name: "Brand landing",
      desc: "A single-scroll landing that carries brand voice from hero to CTA—typography, spacing, and imagery aligned so the story reads effortlessly on any device.",
      image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1200&q=80",
      accent: "#27272a",
      href: "#"
    }
  ];

  useEffect(() => {
    const track = creativeTrackRef.current;
    if (!track) return;
    const cards = track.querySelectorAll("[data-creative-card]");
    const card = cards[creativeIndex];
    if (!card) return;
    track.scrollTo({ left: card.offsetLeft - 24, behavior: "smooth" });
  }, [creativeIndex]);

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
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-8xl font-bold max-w-5xl mb-8 tracking-tight leading-[1]">
          I'm Satyam Tiwari <br /> Flutter Developer
        </motion.h1>
        <p className="text-zinc-400 max-w-xl text-sm md:text-base mb-10 leading-relaxed">
          I build scalable mobile apps and beautiful digital products that help you stand out.
        </p>
        <div className="flex gap-4">
          <button className="bg-white text-black px-7 py-2.5 rounded-md text-xs font-bold transition-transform active:scale-95">Get yours now</button>
          <a href="#projects" className="bg-zinc-900 border border-zinc-800 text-white px-7 py-2.5 rounded-md text-xs font-bold transition-transform active:scale-95">See my work</a>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 px-6 border-t border-zinc-900 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h2 className="font-service text-5xl md:text-6xl font-bold tracking-tight mb-8">My Services</h2>
            <p className="text-zinc-400 max-w-sm text-sm mb-8">Crafting functional and aesthetic digital products.</p>
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
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-12 lg:gap-20 items-start">
          <div className="lg:sticky lg:top-28 lg:self-start w-full max-w-xl">
            <h2 className="font-service text-4xl sm:text-5xl md:text-[2.75rem] font-bold tracking-tight text-white leading-[1.1] mb-10 md:mb-12">
              Projects I&apos;ve Created for My Clients
            </h2>
            <div>
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
                            <p className="text-zinc-400 text-sm md:text-[0.9375rem] leading-relaxed mt-3 max-w-lg">
                              {p.desc}
                            </p>
                            <a
                              href={p.href}
                              target={p.href.startsWith("http") ? "_blank" : undefined}
                              rel={p.href.startsWith("http") ? "noopener noreferrer" : undefined}
                              onClick={(e) => {
                                if (p.href === "#") e.preventDefault();
                              }}
                              className="inline-flex items-center gap-1 text-white text-sm font-medium mt-4 hover:opacity-90 transition-opacity"
                            >
                              Learn more
                              <ArrowRight className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
                            </a>
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
          <div className="w-full flex justify-center lg:justify-end lg:self-end">
            <motion.div
              className="w-full max-w-md sm:max-w-lg lg:max-w-xl aspect-video rounded-2xl overflow-hidden bg-zinc-950 ring-1 ring-white/10 shadow-2xl"
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
                className="w-full h-full object-cover object-center"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section id="designs" className="bg-zinc-950 py-24 px-6 border-t border-zinc-900 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 md:mb-12">
            <h2 className="font-service text-4xl sm:text-5xl md:text-[2.75rem] font-bold tracking-tight text-white leading-[1.12]">
              Creative Designs for
              <br />
              My Clients
            </h2>
            <div className="mt-5 flex flex-row items-center justify-between gap-4">
              <p className="text-zinc-400 text-sm tabular-nums leading-none">
                {creativeIndex + 1}/{creativeDesigns.length}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  aria-label="Previous design"
                  disabled={creativeIndex === 0}
                  onClick={() => setCreativeIndex((i) => Math.max(0, i - 1))}
                  className="h-11 w-11 shrink-0 rounded-full bg-white text-black opacity-100 flex items-center justify-center transition-colors enabled:hover:bg-zinc-200 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-white disabled:text-black disabled:opacity-100"
                >
                  <ChevronLeft className="w-5 h-5 shrink-0 text-black" strokeWidth={2} aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Next design"
                  disabled={creativeIndex === creativeDesigns.length - 1}
                  onClick={() => setCreativeIndex((i) => Math.min(creativeDesigns.length - 1, i + 1))}
                  className="h-11 w-11 shrink-0 rounded-full bg-white text-black opacity-100 flex items-center justify-center transition-colors enabled:hover:bg-zinc-200 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-white disabled:text-black disabled:opacity-100"
                >
                  <ChevronRight className="w-5 h-5 shrink-0 text-black" strokeWidth={2} aria-hidden />
                </button>
              </div>
            </div>
          </div>

          <div
            ref={creativeTrackRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2 -mx-1 px-1"
          >
            {creativeDesigns.map((d, i) => (
              <article
                key={d.name}
                data-creative-card
                className="snap-start shrink-0 w-[min(85vw,calc(100%-2rem))] sm:w-[min(72vw,420px)] lg:w-[calc(50%-0.75rem)] max-w-[520px] flex flex-col"
              >
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
                <h3 className="font-service text-lg sm:text-xl font-bold tracking-tight text-white mt-5">
                  {d.name},
                </h3>
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
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-16 items-center">
          <div className="relative w-full max-w-[360px] mx-auto lg:mx-0">
            <div className="absolute -right-5 top-6 h-[92%] w-[92%] rounded-[0_0_42px_0] border border-zinc-500/80" />
            <div className="relative z-10 rounded-sm overflow-hidden bg-zinc-900">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=900&q=80"
                alt="Profile"
                className="w-full h-[430px] object-cover"
              />
            </div>
          </div>

          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-8">
              I am Rakesh, a full stack web developer and a programmer working remotely in my home at Dhaka, Bangladesh
            </h2>

            <div className="space-y-6 text-zinc-300 text-sm md:text-base leading-relaxed">
              <p>
                I've spent the last 3+ years learning and working across different areas of development: front-end development,
                back-end development, UI/UX design and currently working for Monipur School and College science club as a Web developer.
              </p>
              <p>
                These days my time is spent researching, designing, building websites, and coding. I also love to learn and
                experiment with new things.
              </p>
              <p>
                My mission is to help small and medium-sized businesses grow their audience and brand recognition by providing
                them with stylish and modern-looking, fully functional websites.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <button className="bg-white text-black px-6 py-2.5 text-sm font-semibold rounded-sm hover:bg-zinc-100 transition-colors">
                My Resume
              </button>
              <button className="bg-zinc-900 border border-zinc-700 text-white px-6 py-2.5 text-sm font-semibold rounded-sm hover:bg-zinc-800 transition-colors">
                Hire me
              </button>
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
                <p className="text-base md:text-lg text-white/90 leading-relaxed mb-10 max-w-md">
                  It is very important for us to keep in touch with you, so we are always ready to answer any question that interests you.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="#"
                    className="h-10 w-10 shrink-0 rounded-full bg-zinc-800 border border-zinc-700/90 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors"
                    aria-label="Facebook"
                  >
                    <span className="text-xs font-semibold leading-none">f</span>
                  </a>
                  <a
                    href="#"
                    className="h-10 w-10 shrink-0 rounded-full bg-zinc-800 border border-zinc-700/90 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors"
                    aria-label="GitHub"
                  >
                    <Github size={16} strokeWidth={1.75} />
                  </a>
                  <a
                    href="#"
                    className="h-10 w-10 shrink-0 rounded-full bg-zinc-800 border border-zinc-700/90 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin size={16} strokeWidth={1.75} />
                  </a>
                  <a
                    href="#"
                    className="h-10 w-10 shrink-0 rounded-full bg-zinc-800 border border-zinc-700/90 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors"
                    aria-label="Dribbble"
                  >
                    <Dribbble size={16} strokeWidth={1.75} />
                  </a>
                </div>
              </div>

              <div className="min-w-0">
                <form onSubmit={handleSendMail} className="space-y-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
                    <div>
                      <label htmlFor="contact-name" className="block text-sm text-white mb-2">
                        Full name
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        value={formData.name}
                        className="w-full bg-transparent border-0 border-b border-white pb-2.5 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-white"
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                        className="w-full bg-transparent border-0 border-b border-white pb-2.5 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-white"
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                        className="w-full bg-transparent border-0 border-b border-white pb-2.5 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-white"
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                        className="w-full bg-transparent border-0 border-b border-white pb-2.5 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-white"
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
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
                      className="w-full bg-transparent border-0 border-b border-white pb-2.5 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:border-white resize-none min-h-[120px]"
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-fit bg-zinc-200 text-black px-6 py-2.5 text-sm font-medium rounded-md hover:bg-white transition-colors"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black border-t border-zinc-800">
          <div className="max-w-[1280px] mx-auto border-x border-zinc-800">
          <div className="grid grid-cols-1 md:grid-cols-3 border-b border-zinc-800">
            <div className="p-10 md:p-12 border-b border-zinc-800 md:border-b-0 md:border-r">
              <h3 className="text-5xl font-semibold mb-4">Rakesh Karmaker</h3>
              <p className="text-zinc-400 text-lg leading-snug mb-6">
                I'm a web developer with 3+ years of experience in front-end, back-end, and UI/UX design, creating modern, functional websites to help businesses grow.
              </p>
              <button className="bg-white text-black px-4 py-1.5 text-sm font-medium rounded-sm mb-8">My Resume</button>
              <div className="flex items-center gap-3">
                <a href="#" className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center hover:bg-zinc-800"><span className="text-sm">f</span></a>
                <a href="#" className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center hover:bg-zinc-800"><Github size={14} /></a>
                <a href="#" className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center hover:bg-zinc-800"><Linkedin size={14} /></a>
                <a href="#" className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center hover:bg-zinc-800"><ExternalLink size={14} /></a>
              </div>
            </div>

            <div className="p-10 md:p-12 border-b border-zinc-800 md:border-b-0 md:border-r">
              <h4 className="text-4xl font-semibold mb-6">Contact me</h4>
              <div className="space-y-4 text-zinc-300 text-base">
                <p><span className="font-semibold text-white">Email:</span><br />rakeshkarmaker0175@gmail.com</p>
                <p><span className="font-semibold text-white">Phone:</span><br />(880) 1756-170957</p>
                <p><span className="font-semibold text-white">Adress:</span><br />East Kazipara, Mirpur<br />Dhaka, Bangladesh</p>
              </div>
            </div>

            <div className="p-10 md:p-12">
              <h4 className="text-4xl font-semibold mb-6">Menu</h4>
              <ul className="space-y-3 text-zinc-300 text-base">
                <li><a href="#home" className="hover:text-white">Home</a></li>
                <li><a href="#services" className="hover:text-white">Services</a></li>
                <li><a href="#projects" className="hover:text-white">Projects</a></li>
                <li><a href="#designs" className="hover:text-white">Designs</a></li>
                <li><a href="#about" className="hover:text-white">About W</a></li>
                <li><a href="#contact" className="hover:text-white">FAQs</a></li>
              </ul>
            </div>
          </div>

          <footer className="px-10 md:px-12 py-6 text-zinc-300 text-sm flex flex-col md:flex-row gap-2 md:items-center md:justify-between border-t border-zinc-800">
            <span>Copyright © 2025 Rakesh Karmaker - All rights reserved</span>
            <span>Designed By: Rakesh</span>
          </footer>
          </div>
        </div>
      </section>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
