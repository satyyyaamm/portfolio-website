import { useState } from 'react';
import { Scramble } from '../landing/Scramble.jsx';
import { SoundToggle } from '../SoundToggle.jsx';
import { playHoverSound, playSound } from '../../lib/siteSound.js';
import '../landing/auge-landing.css';

/**
 * Shared mark + © footer + drawer + socials.
 * Wrapper stays z-index:auto so mix-blend difference can see page pixels;
 * children sit above scroll/sticky content via .auge-chrome rules.
 */
export function AugeChrome({
  socialItems = [],
  navItems = [],
  onHome,
  className = '',
  drawerExtra = null,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLink, setDrawerLink] = useState(null);
  const [markHover, setMarkHover] = useState(false);

  return (
    <div className={`auge-chrome${className ? ` ${className}` : ''}`}>
      <a
        href="/"
        className="auge-mark"
        aria-label="Home"
        onPointerEnter={() => setMarkHover(true)}
        onPointerLeave={() => setMarkHover(false)}
        onClick={(event) => {
          event.preventDefault();
          playSound('clickMenuItem');
          onHome?.();
        }}
      >
        <Scramble text="S" active={markHover} steps={36} intervalMs={120} />
        <span className="auge-sr">Satyam</span>
      </a>

      <footer className="auge-footer">
        <p>© {new Date().getFullYear()} Satyam Tiwari</p>
        <SoundToggle className="auge-footer__sound" />
      </footer>

      <div className="auge-corner">
        <div
          className={`auge-drawer${drawerOpen ? ' is-open' : ''}`}
          onPointerEnter={() => setDrawerOpen(true)}
          onPointerLeave={() => {
            setDrawerOpen(false);
            setDrawerLink(null);
          }}
        >
          <div className="auge-drawer__panel">
            <nav className="auge-drawer__nav" aria-label="Site">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="auge-drawer__link"
                  onPointerEnter={() => {
                    setDrawerLink(item.id);
                    playHoverSound('hoverButton');
                  }}
                  onPointerLeave={() => setDrawerLink(null)}
                  onClick={() => {
                    playSound('clickMenuItem');
                    setDrawerOpen(false);
                    item.onClick?.();
                  }}
                >
                  <span className="auge-drawer__label">
                    <Scramble text={item.label} active={drawerOpen && drawerLink === item.id} />
                  </span>
                </button>
              ))}
            </nav>
            {drawerExtra}
            <span className="auge-drawer__bars" aria-hidden>
              <span />
              <span />
            </span>
          </div>
        </div>

        <nav className="auge-footer__links" aria-label="Social links">
          {socialItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target={item.href.startsWith('mailto:') ? undefined : '_blank'}
              rel={item.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
              onPointerEnter={() => playHoverSound('hoverFooterItem')}
              onClick={() => playSound('clickMenuItem')}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
