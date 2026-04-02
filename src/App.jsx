import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { 
  Github, 
  Linkedin, 
  ExternalLink, 
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
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

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
    const mailtoLink = `mailto:satyamt5152@gmail.com?subject=Inquiry&body=Name: ${formData.name}%0D%0AEmail: ${formData.email}%0D%0AMessage: ${formData.message}`;
    window.location.href = mailtoLink;
  };

  const services = [
    { title: "Mobile App Dev", icon: <Smartphone size={32} strokeWidth={1.5} />, desc: "High-performance Flutter & React Native apps." },
    { title: "Front-End Dev", icon: <Layout size={32} strokeWidth={1.5} />, desc: "Responsive web apps using React and Tailwind." },
    { title: "Back-End Dev", icon: <Server size={32} strokeWidth={1.5} />, desc: "Robust APIs with Node.js and Django." },
    { title: "Product Strategy", icon: <Cpu size={32} strokeWidth={1.5} />, desc: "Aligning technical builds with business goals." }
  ];

  const projects = [
    { id: 0, name: "OSAC GMS", desc: "Garage management system for automotive centers.", image: "[https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=800](https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=800)" },
    { id: 1, name: "Waya Waya", desc: "Mall discovery and rewards application.", image: "[https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800](https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800)" },
    { id: 2, name: "Safe Again", desc: "Real-time women safety application.", image: "[https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800](https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800)" },
    { id: 3, name: "UJ WayFinder", desc: "University navigation system using BLE Beacons.", image: "[https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800](https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800)" }
  ];

  const designs = [
    { title: "GMS Dashboard", desc: "Admin interface", img: "[https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200](https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200)" },
    { title: "Checkout UI", desc: "Conversion-optimized", img: "[https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80&w=1200](https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80&w=1200)" },
    { title: "Mobile UI Kit", desc: "Consistent components", img: "[https://images.unsplash.com/photo-1512428559083-a400a6b82c02?auto=format&fit=crop&q=80&w=1200](https://images.unsplash.com/photo-1512428559083-a400a6b82c02?auto=format&fit=crop&q=80&w=1200)" }
  ];

  return (
    <div className="bg-black text-white font-sans min-h-screen relative overflow-x-hidden">
      <Navbar />
      <motion.div style={{ x: cursorX, y: cursorY }} className="fixed top-0 left-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[120px] pointer-events-none z-0" />

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

      {/* Projects */}
      <section id="projects" className="py-24 px-6 bg-zinc-950/20 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="sticky top-32 h-fit">
            <h2 className="text-3xl font-bold mb-12 uppercase tracking-tighter">Projects I've Created</h2>
            {projects.map((p, i) => (
              <div 
                key={i} 
                onMouseEnter={() => setActiveProject(i)} 
                className="border-t border-zinc-800 pt-8 mb-8 cursor-pointer group"
              >
                <h3 className={`text-2xl font-bold transition-all ${activeProject === i ? 'text-white translate-x-2' : 'text-zinc-600'}`}>
                  {p.name}
                </h3>
                <AnimatePresence>
                  {activeProject === i && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-zinc-400 text-xs mt-4 overflow-hidden"
                    >
                      {p.desc}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
          <div className="aspect-[4/5] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
            <motion.img 
              key={activeProject} 
              initial={{ opacity: 0, scale: 1.1 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.4 }}
              src={projects[activeProject].image} 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>
      </section>

      {/* Design Showcase / Carousel */}
      <section className="py-24 px-6 border-t border-zinc-900 overflow-hidden relative z-10">
        <div className="max-w-7xl mx-auto mb-12">
          <h2 className="text-3xl font-bold uppercase tracking-tighter">Design Showcase</h2>
          <p className="text-zinc-500 text-xs mt-2">Interfaces designed with precision.</p>
        </div>
        
        <div className="flex gap-6 overflow-x-auto pb-12 snap-x no-scrollbar">
          {designs.map((d, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="min-w-[300px] md:min-w-[450px] snap-start group"
            >
              <div className="aspect-video rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 mb-4">
                <img src={d.img} alt={d.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <h4 className="font-bold text-sm uppercase tracking-widest">{d.title}</h4>
              <p className="text-zinc-500 text-[10px] mt-1">{d.desc}</p>
            </motion.div>
          ))}
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

      {/* Contact */}
      <section id="contact" className="border-t border-zinc-900 bg-black relative z-10">
        <div className="max-w-[1280px] mx-auto border-x border-zinc-800">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr]">
            <div className="p-10 md:p-16 border-b border-zinc-800 lg:border-b-0 lg:border-r border-zinc-800">
              <p className="text-sm text-zinc-300 mb-4">Contact me</p>
              <h2 className="text-6xl font-semibold leading-none mb-6">Get in touch</h2>
              <p className="text-zinc-400 max-w-sm text-xl leading-snug mb-7">
                It is very important for us to keep in touch with you, so we are always ready to answer any question that interests you.
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center hover:bg-zinc-800">
                  <span className="text-sm">f</span>
                </a>
                <a href="#" className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center hover:bg-zinc-800">
                  <Github size={14} />
                </a>
                <a href="#" className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center hover:bg-zinc-800">
                  <Linkedin size={14} />
                </a>
                <a href="#" className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center hover:bg-zinc-800">
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <div className="p-10 md:p-16 border-b border-zinc-800">
              <form onSubmit={handleSendMail} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Full name</label>
                  <input
                    className="w-full bg-transparent border-b border-zinc-600 pb-2 focus:outline-none focus:border-zinc-300 text-base"
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Email address</label>
                  <input
                    type="email"
                    className="w-full bg-transparent border-b border-zinc-600 pb-2 focus:outline-none focus:border-zinc-300 text-base"
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Phone Number</label>
                  <input className="w-full bg-transparent border-b border-zinc-600 pb-2 focus:outline-none focus:border-zinc-300 text-base" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Subject</label>
                  <input className="w-full bg-transparent border-b border-zinc-600 pb-2 focus:outline-none focus:border-zinc-300 text-base" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-zinc-400 mb-2">Write your message here</label>
                  <textarea
                    rows={2}
                    className="w-full bg-transparent border-b border-zinc-600 pb-2 focus:outline-none focus:border-zinc-300 text-base resize-none"
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="mt-4 w-fit bg-white text-black px-4 py-1.5 text-sm font-medium rounded-sm">
                  Send Message
                </button>
              </form>
            </div>
          </div>

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
                <li><a href="#projects" className="hover:text-white">Designs</a></li>
                <li><a href="#about" className="hover:text-white">About W</a></li>
                <li><a href="#contact" className="hover:text-white">FAQs</a></li>
              </ul>
            </div>
          </div>

          <footer className="px-10 md:px-12 py-6 text-zinc-300 text-sm flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
            <span>Copyright © 2025 Rakesh Karmaker - All rights reserved</span>
            <span>Designed By: Rakesh</span>
          </footer>
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
