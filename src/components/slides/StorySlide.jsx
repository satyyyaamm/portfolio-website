import { AboutPortrait } from '../AboutPortrait.jsx';

const RESUME_URL = '/Satyam-Tiwari-Resume.pdf';
const UPWORK_URL =
  'https://www.upwork.com/freelancers/~017488413fc2713bec?mp_source=share';

export function StoryChapter({ portraitSrc, animating }) {
  return (
    <div className="chapter chapter--story">
      <div className="story-chapter">
        <div className="story-chapter__portrait">
          <AboutPortrait src={portraitSrc} alt="Satyam Tiwari" animating={animating} />
        </div>
        <div className="story-chapter__copy">
          <p className="chapter__eyebrow">The path so far</p>
          <h2 className="chapter__title chapter__title--story">
            The apps I admire don&apos;t ask for attention.
          </h2>
          <div className="chapter__prose">
            <p>They simply work—until using them feels obvious. That&apos;s the feeling I chase.</p>
            <p>
              Mall apps across South Africa. A safety product for moments that can&apos;t wait.
              Long stretches beside founders—from first sketch through review to keeping builds
              green after launch.
            </p>
          </div>
          <div className="chapter__cta-row">
            <a href={RESUME_URL} target="_blank" rel="noopener noreferrer" className="btn-journey">
              Read my resume
            </a>
            <a
              href={UPWORK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-journey btn-journey--ghost"
            >
              Let&apos;s work together
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export { StoryChapter as StorySlide };
