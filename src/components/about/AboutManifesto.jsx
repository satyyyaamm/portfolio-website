import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { scrambleFrame } from '../landing/Scramble.jsx';
import { ABOUT_STORY } from '../../lib/aboutContent.js';

function GifChip({ item }) {
  if (!item) return null;
  return (
    <span className="about-manifesto__gif">
      {item.kind === 'video' ? (
        <video src={item.src} poster={item.poster || undefined} muted loop playsInline autoPlay preload="metadata" />
      ) : (
        <img src={item.src} alt="" />
      )}
    </span>
  );
}

function CycleWord({ words, reduced }) {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(words[0]);

  useEffect(() => {
    if (reduced || words.length < 2) {
      setShown(words[0]);
      return undefined;
    }
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % words.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, [words, reduced]);

  useEffect(() => {
    const next = words[index] || words[0];
    if (reduced) {
      setShown(next);
      return undefined;
    }
    let frame = 0;
    const steps = 10;
    setShown(scrambleFrame(next, 0));
    const id = window.setInterval(() => {
      frame += 1;
      if (frame >= steps) {
        setShown(next);
        window.clearInterval(id);
        return;
      }
      setShown(scrambleFrame(next, frame / steps));
    }, 32);
    return () => window.clearInterval(id);
  }, [index, words, reduced]);

  return <span className="about-manifesto__cycle">{shown}</span>;
}

export function AboutManifesto({ gifs = [] }) {
  const reduced = useReducedMotion();

  return (
    <p className="about-manifesto">
      {ABOUT_STORY.map((part, i) => {
        if (part.type === 'gif') {
          return <GifChip key={`gif-${part.i}-${i}`} item={gifs[part.i]} />;
        }
        if (part.type === 'cycle') {
          return <CycleWord key={`cycle-${part.words[0]}`} words={part.words} reduced={Boolean(reduced)} />;
        }
        return (
          <span key={`t-${i}`} className="about-manifesto__text">
            {part.text}
          </span>
        );
      })}
    </p>
  );
}
