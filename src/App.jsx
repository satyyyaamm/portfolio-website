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
    { title: "Mobile App Dev", icon: <Smartphone size={20} />, desc: "High-performance Flutter & React Native apps." },
    { title: "Front-End Dev", icon: <Layout size={20} />, desc: "Responsive web apps using React and Tailwind." },
    { title: "Back-End Dev", icon: <Server size={20} />, desc: "Robust APIs with Node.js and Django." },
    { title: "Product Strategy", icon: <Cpu size={20} />, desc: "Aligning technical builds with business goals." }
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
            <h2 className="text-4xl md:text-5xl font-bold mb-8">My Services</h2>
            <p className="text-zinc-400 max-w-sm text-sm mb-8">Crafting functional and aesthetic digital products.</p>
          </div>
          <div className="space-y-0">
            {services.map((s, i) => (
              <div key={i} className="border-t border-zinc-800 py-8 flex gap-6 hover:bg-zinc-900/40 px-4 transition-all group">
                <div className="text-zinc-500 group-hover:text-white transition-colors">{s.icon}</div>
                <div>
                  <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                  <p className="text-zinc-500 text-xs">{s.desc}</p>
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

      {/* Contact */}
      <section id="contact" className="py-24 px-6 border-t border-zinc-900 bg-white text-black relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-bold mb-12 tracking-tighter">Get in touch</h2>
          <form onSubmit={handleSendMail} className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-zinc-400">Your Name</label>
              <input 
                placeholder="Ex. Jane Doe" 
                className="bg-transparent border-b border-zinc-200 p-2 focus:outline-none focus:border-black transition-colors" 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-zinc-400">Email Address</label>
              <input 
                type="email"
                placeholder="jane@example.com" 
                className="bg-transparent border-b border-zinc-200 p-2 focus:outline-none focus:border-black transition-colors" 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                required
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[10px] uppercase font-bold text-zinc-400">Message</label>
              <textarea 
                placeholder="What are we building?" 
                rows={4}
                className="bg-transparent border-b border-zinc-200 p-2 focus:outline-none focus:border-black transition-colors resize-none" 
                onChange={e => setFormData({...formData, message: e.target.value})} 
                required
              />
            </div>
            <button 
              type="submit" 
              className="md:col-span-2 bg-black text-white py-4 rounded-full font-bold uppercase tracking-widest text-[10px] hover:invert transition-all"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>

      <footer className="py-12 bg-black text-center text-[10px] text-zinc-600 tracking-widest border-t border-zinc-900">
        © 2025 SATYAM TIWARI | CRAFTED FOR PERFORMANCE
      </footer>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
