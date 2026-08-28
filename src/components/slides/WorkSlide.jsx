import { ArrowRight } from 'lucide-react';
import { trackEvent } from '../../lib/analytics.js';

function category(meta) {
  return meta?.split(' · ')[0] || meta || '';
}

function status(meta) {
  const token = meta?.split(' · ').pop()?.trim();
  const known = ['Live', 'Concept', 'Pre-production'];
  return known.includes(token) ? token : null;
}

export function ProjectChapter({ project, onOpen, chapterIndex }) {
  if (!project) return null;
  const st = status(project.meta);
  const src = project.previewImage ?? project.image;

  return (
    <div className="chapter chapter--project">
      <div className="project-spread">
        <div className="project-spread__copy">
          <p className="chapter__eyebrow">
            Project {chapterIndex} · {category(project.meta)}
            {st ? ` · ${st}` : ''}
          </p>
          <h2 className="chapter__title chapter__title--project">{project.name}</h2>
          <p className="chapter__lede">{project.summary}</p>
          <p className="project-chapter__role">{project.role}</p>
          <div className="chapter__cta-row">
            <button
              type="button"
              className="btn-journey"
              onClick={() => {
                onOpen?.();
                trackEvent('project_detail_open', { project_name: project.name });
              }}
            >
              View project
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </button>
            {project.href && project.href !== '#' && (
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-journey btn-journey--ghost"
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
          </div>
        </div>
        <div className="project-spread__visual">
          <div
            className={`project-spread__frame project-spread__frame--${project.previewFrame ?? 'mobile'}`}
          >
            <img src={src} alt="" decoding="async" />
          </div>
        </div>
      </div>
    </div>
  );
}
