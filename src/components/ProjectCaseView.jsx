import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { ShaderBackground } from './ShaderBackground.jsx';
import { useMagneticHover } from './interaction/useMagneticHover.js';
import { trackEvent } from '../lib/analytics.js';

function projectStatusLabel(meta = '') {
  const token = meta.split(' · ').pop()?.trim();
  if (!token) return null;
  const known = ['Live', 'Concept', 'Pre-production'];
  return known.includes(token) ? token : null;
}

function projectMetaSubtitle(meta = '') {
  const parts = meta.split(' · ').filter(Boolean);
  const status = projectStatusLabel(meta);
  const withoutStatus = status ? parts.slice(0, -1) : parts;
  return withoutStatus.join(' · ');
}

/** Gallery tile — the image drifts further than the frame for layered depth. */
function CaseShot({ src }) {
  const ref = useMagneticHover('media');

  return (
    <figure ref={ref} className="project-case__shot magnetic">
      <img className="magnetic-layer" src={src} alt="" decoding="async" />
    </figure>
  );
}

/**
 * Full-viewport case study: portfolio stage swipes away; gradient + project detail remain.
 */
export function ProjectCaseView({ project, onClose }) {
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
  const shots = (project.gallery?.length ? project.gallery : [project.image]).filter(Boolean);
  const status = projectStatusLabel(project.meta);

  return (
    <motion.div
      className="project-case"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-case-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="project-case__bg" aria-hidden>
        <ShaderBackground progress={0.35} />
      </div>

      <motion.div
        className="project-case__frame"
        initial={{ opacity: 0, x: -48 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -24 }}
        transition={{ duration: 0.85, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="project-case__top">
          <button type="button" className="project-case__back" onClick={onClose}>
            <X className="h-4 w-4" strokeWidth={2} aria-hidden />
            Close
          </button>
        </header>

        <div className="project-case__scroll">
          <div className="project-case__intro">
            <div className="project-case__meta-row">
              {status ? <span className="project-case__status">{status}</span> : null}
              {project.role ? <span className="project-case__role">{project.role}</span> : null}
            </div>
            <h2 id="project-case-title" className="project-case__title">
              {project.name}
            </h2>
            <p className="project-case__subtitle">{projectMetaSubtitle(project.meta)}</p>
            <p className="project-case__desc">{project.desc || project.summary}</p>
          </div>

          {shots.length > 0 ? (
            <section className="project-case__gallery" aria-label={`${project.name} images`}>
              <div className="project-case__rail">
                {shots.map((src, i) => (
                  <CaseShot key={`${project.id}-${i}`} src={src} />
                ))}
              </div>
            </section>
          ) : null}

          {project.highlights?.length > 0 ? (
            <section className="project-case__section">
              <h3 className="project-case__label">Key deliverables</h3>
              <ul className="project-case__list">
                {project.highlights.map((line, hi) => (
                  <li key={hi}>{line}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {project.video ? (
            <section className="project-case__section">
              <h3 className="project-case__label">Demo</h3>
              <div className="project-case__video">
                <video
                  src={project.video}
                  poster={project.image}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label={`${project.name} demo video`}
                />
              </div>
            </section>
          ) : null}

          <div className="project-case__actions">
            <button type="button" className="project-case__btn project-case__btn--ghost" onClick={onClose}>
              Back to portfolio
            </button>
            {hasLiveLink ? (
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="project-case__btn project-case__btn--solid"
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
            ) : null}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
