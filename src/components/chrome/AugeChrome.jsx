import { useState } from 'react';
import { Scramble } from '../landing/Scramble.jsx';
import { SoundToggle } from '../SoundToggle.jsx';
import { playHoverSound, playSound } from '../../lib/siteSound.js';
import '../landing/auge-landing.css';

function isFinePointer() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  );
}

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
          id="auge-chrome-drawer"
          className={`auge-drawer${drawerOpen ? ' is-open' : ''}`}
          onPointerEnter={() => {
            if (isFinePointer()) setDrawerOpen(true);
          }}
          onPointerLeave={() => {
            if (isFinePointer()) {
              setDrawerOpen(false);
              setDrawerLink(null);
            }
          }}
          onFocus={() => {
            if (isFinePointer()) setDrawerOpen(true);
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setDrawerOpen(false);
              setDrawerLink(null);
            }
          }}
        >
          <div className="auge-drawer__panel">
            <button
              type="button"
              className="auge-drawer__toggle"
              aria-expanded={drawerOpen}
              aria-controls="auge-chrome-drawer"
              aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
              onClick={(event) => {
                event.stopPropagation();
                playSound('clickMenuItem');
                if (drawerOpen) {
                  setDrawerLink(null);
                  setDrawerOpen(false);
                  event.currentTarget.blur();
                } else {
                  setDrawerOpen(true);
                }
              }}
            >
              <span className="auge-drawer__close" aria-hidden>
                ×
              </span>
            </button>

            <div className="auge-drawer__body">
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
                    onFocus={() => setDrawerLink(item.id)}
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

              <div className="auge-drawer__meta">
                <nav className="auge-drawer__socials" aria-label="Social and legal">
                  {socialItems.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target={item.href.startsWith('mailto:') ? undefined : '_blank'}
                      rel={item.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                      onPointerEnter={() => playHoverSound('hoverFooterItem')}
                      onClick={() => {
                        playSound('clickMenuItem');
                        setDrawerOpen(false);
                      }}
                    >
                      {item.label}
                    </a>
                  ))}
                  <a
                    href="#privacy"
                    onClick={() => {
                      playSound('clickMenuItem');
                      setDrawerOpen(false);
                    }}
                  >
                    Privacy
                  </a>
                  <a
                    href="#cookies"
                    onClick={() => {
                      playSound('clickMenuItem');
                      setDrawerOpen(false);
                    }}
                  >
                    Cookies
                  </a>
                </nav>
                <div className="auge-drawer__legal">
                  <span>© {new Date().getFullYear()}</span>
                  <SoundToggle className="auge-drawer__sound" />
                </div>
              </div>
            </div>

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
