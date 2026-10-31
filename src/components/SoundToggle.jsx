import { useEffect, useSyncExternalStore } from 'react';
import {
  initSound,
  isSoundMuted,
  isSoundMutedOnServer,
  playSound,
  resumeSound,
  setSoundMuted,
  subscribeSoundPreference,
} from '../lib/siteSound.js';
import './sound-toggle.css';

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 25 22" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M13.75 4.31221C13.75 2.60949 11.758 1.68558 10.4581 2.78544L6.50925 6.12678C6.14814 6.43233 5.69042 6.6 5.21739 6.60001L3.24998 6.60002C1.86928 6.60003 0.75 7.71932 0.75 9.10002V12.9C0.75 14.2808 1.86929 15.4 3.25 15.4H5.21742C5.69046 15.4 6.14819 15.5677 6.50931 15.8733L10.4581 19.2146C11.758 20.3144 13.75 19.3905 13.75 17.6878V11V4.31221Z" />
      <g data-sound-wave>
        <path
          d="M18.3174 14.7614C19.1701 13.8157 19.6754 12.6401 19.6754 11.3663C19.6754 10.0924 19.1701 8.91691 18.3174 7.97119"
          strokeLinecap="round"
        />
        <path
          d="M22.3916 17.4775C23.2443 15.7752 23.7496 13.6592 23.7496 11.3663C23.7496 9.07339 23.2443 6.95742 22.3916 5.25513"
          strokeLinecap="round"
        />
      </g>
      <g data-sound-cross>
        <path d="M17.9056 13.2216L22.3906 8.73657" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17.9056 8.73689L22.3906 13.2219" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function SoundToggle({ className = '' }) {
  const muted = useSyncExternalStore(
    subscribeSoundPreference,
    isSoundMuted,
    isSoundMutedOnServer
  );

  useEffect(() => {
    initSound();
  }, []);

  return (
    <button
      type="button"
      data-sound-toggle
      className={`sound-toggle${muted ? ' is-muted' : ''}${className ? ` ${className}` : ''}`}
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      aria-pressed={!muted}
      onClick={() => {
        const next = !isSoundMuted();
        setSoundMuted(next);
        if (!next) {
          resumeSound().then(() => playSound('clickMenuItem'));
        }
      }}
    >
      <SpeakerIcon />
    </button>
  );
}
