import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DistortSurface } from '../landing/gl/DistortSurface.jsx';

function PixelCamera() {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    if (!camera.isOrthographicCamera) return;
    camera.left = 0;
    camera.right = size.width;
    camera.top = 0;
    camera.bottom = -size.height;
    camera.position.set(0, 0, 400);
    camera.near = 0.1;
    camera.far = 4000;
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

function WorksWarpScene({
  rootRef,
  projects,
  velocityRef,
  dragRef,
  glRectsRef,
  reducedMotion,
}) {
  const { size } = useThree();
  const screenRef = useRef({
    left: 0,
    top: 0,
    width: 1,
    height: 1,
    coverHeight: 1,
    texture: null,
  });
  const mouseRef = useRef({
    x: 0,
    y: 0,
    px: 0,
    py: 0,
    inside: false,
    strength: 0,
    vw: 1,
    vh: 1,
  });
  const simRef = useRef({
    userVelocity: 0,
    drag: { active: false },
    skew: 0,
    clickRipple: null,
  });
  const paramsRef = useRef({
    spreadPct: 60,
    strengthPct: 200,
    edgeAxis: 'tb',
    edgeWidth: 0.34,
    edgeRefractMul: 48,
    scrollBendVh: 0.2,
    scrollBendSpeed: 1200,
    scrollBendEase: 0.032,
    scrollBendTop: 0,
  });
  const grabRef = useRef(null);

  const imageKey = projects.map((project) => project?.image || '').join('|');
  const bitmaps = useMemo(() => {
    const map = new Map();
    const file = (url) => String(url || '').split('?')[0].split('/').pop();
    imageKey.split('|').forEach((url) => {
      if (!url || map.has(url)) return;
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      map.set(url, img);
      const name = file(url);
      if (name) map.set(name, img);
    });
    return map;
  }, [imageKey]);

  const resolveImage = (src) => {
    const raw = String(src || '');
    const file = raw.split('?')[0].split('/').pop();
    const cached = bitmaps.get(src) || bitmaps.get(raw) || bitmaps.get(file);
    if (cached?.complete && cached.naturalWidth) return cached;
    const nodes = document.querySelectorAll('.works-page img');
    for (const live of nodes) {
      const href = live.currentSrc || live.src || '';
      const data = live.dataset.src || '';
      if (
        (file && (href.endsWith(file) || data.endsWith(file))) ||
        href === raw ||
        data === raw
      ) {
        if (live.complete && live.naturalWidth) return live;
      }
    }
    return null;
  };

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: true });
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.NoColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    grabRef.current = { canvas, ctx, tex };
    screenRef.current.texture = tex;
    return () => {
      tex.dispose();
      rootRef?.current?.closest?.('.works-page')?.classList.remove('is-screen-warp');
    };
  }, []);

  useEffect(() => {
    const onMove = (event) => {
      const root = rootRef?.current;
      if (!root) return;
      const box = root.getBoundingClientRect();
      const inside =
        event.clientX >= box.left &&
        event.clientX <= box.right &&
        event.clientY >= box.top &&
        event.clientY <= box.bottom;
      const mouse = mouseRef.current;
      mouse.inside = inside;
      if (!inside) return;
      mouse.x = event.clientX - box.left;
      mouse.y = event.clientY - box.top;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [rootRef]);

  useFrame((_, dt) => {
    const mouse = mouseRef.current;
    const w = Math.max(1, Math.round(size.width));
    const h = Math.max(1, Math.round(size.height));
    mouse.vw = w;
    mouse.vh = h;
    const speed = Math.hypot(mouse.x - mouse.px, mouse.y - mouse.py) / Math.max(dt, 0.001);
    mouse.px = mouse.x;
    mouse.py = mouse.y;
    const targetStrength =
      mouse.inside && !reducedMotion ? Math.min(0.1615, 0.0323 + speed * 0.000226) : 0;
    mouse.strength += (targetStrength - mouse.strength) * (mouse.inside ? 0.16 : 0.07);

    const sim = simRef.current;
    sim.userVelocity = velocityRef?.current || 0;
    sim.drag.active = Boolean(dragRef?.current);

    const grab = grabRef.current;
    const rects = glRectsRef?.current;
    const screen = screenRef.current;
    screen.left = 0;
    screen.top = 0;
    screen.width = w;
    screen.height = h;
    screen.coverHeight = h;
    if (!grab?.ctx || !rects) return;

    const { canvas, ctx, tex } = grab;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    const prepared = [];
    const queue = (item, clipReveal) => {
      if (!item?.src || item.width < 2 || item.height < 2) return;
      const img = resolveImage(item.src);
      if (!img) return;
      prepared.push({ item, img, clipReveal });
    };
    [...(rects.media || [])]
      .sort((a, b) => (a.z || 0) - (b.z || 0))
      .forEach((item) => queue(item, true));
    (rects.thumbs || []).forEach((item) => queue(item, false));
    if (!prepared.length) {
      const rootBox = rootRef?.current?.getBoundingClientRect?.();
      if (rootBox) {
        document.querySelectorAll('.works-media img, .works-thumb img').forEach((img) => {
          const host = img.closest('.works-media, .works-thumb');
          if (!host || !img.naturalWidth) return;
          const box = host.getBoundingClientRect();
          if (box.width < 2 || box.height < 2) return;
          const style = getComputedStyle(host);
          if (style.opacity === '0' || style.visibility === 'hidden') return;
          prepared.push({
            clipReveal: host.classList.contains('works-media'),
            img,
            item: {
              src: img.currentSrc || img.src,
              left: box.left - rootBox.left,
              top: box.top - rootBox.top,
              width: box.width,
              height: box.height,
              coverHeight: box.height,
            },
          });
        });
      }
    }

    if (prepared.length) {
      ctx.fillStyle = '#edeee5';
      ctx.fillRect(0, 0, w, h);
      const fill = rects.fill;
      if (fill) {
        const paint = (color, amount) => {
          const t = Math.max(0, Math.min(1, amount || 0));
          if (t <= 0.001) return;
          ctx.fillStyle = color;
          ctx.fillRect(0, h * (1 - t), w, h * t);
        };
        if (fill.blackOnTop) {
          paint('#000000', fill.black);
        } else {
          paint('#000000', 1);
          paint('#edeee5', fill.cream);
        }
      }
    }

    let drew = 0;
    const coverBlit = ({ item, img, clipReveal }) => {
      const fullH = item.coverHeight || item.height;
      const fullTop = item.top - Math.max(0, fullH - item.height);
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = item.width / Math.max(fullH, 1);
      let sx = 0;
      let sy = 0;
      let sw = img.naturalWidth;
      let sh = img.naturalHeight;
      if (ir > cr) {
        sw = img.naturalHeight * cr;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sh = img.naturalWidth / cr;
        sy = (img.naturalHeight - sh) / 2;
      }
      ctx.save();
      if (clipReveal) {
        ctx.beginPath();
        ctx.rect(item.left, item.top, item.width, item.height);
        ctx.clip();
      }
      try {
        ctx.drawImage(img, sx, sy, sw, sh, item.left, fullTop, item.width, fullH);
        drew += 1;
      } catch {
        /* skip a frame if the bitmap isn't ready */
      }
      ctx.restore();
    };

    prepared.forEach(coverBlit);

    if (drew > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'difference';
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'top';
      (rects.types || []).forEach((glyph) => {
        if (!glyph?.lines?.length || glyph.fontSize < 6) return;
        ctx.textAlign = glyph.align || 'left';
        ctx.font = `${glyph.weight || 800} ${glyph.fontSize}px "Schibsted Grotesk", "Greed", sans-serif`;
        if (ctx.letterSpacing !== undefined) {
          ctx.letterSpacing = `${glyph.tracking || 0}em`;
        }
        const lh = glyph.fontSize * (glyph.lineHeight || 0.85);
        glyph.lines.forEach((line, lineIndex) => {
          ctx.fillText(String(line).toUpperCase(), glyph.x, glyph.y + lineIndex * lh);
        });
      });
      ctx.restore();
    }

    tex.needsUpdate = true;
    screen.texture = tex;
    screen.width = drew > 0 ? w : 0;
    screen.height = drew > 0 ? h : 0;

    const page = rootRef?.current?.closest?.('.works-page');
    page?.classList.toggle('is-screen-warp', drew > 0);
  });

  return (
    <DistortSurface
      texture={null}
      rectRef={screenRef}
      mouseRef={mouseRef}
      paramsRef={paramsRef}
      simRef={simRef}
      reducedMotion={reducedMotion}
      depthWrite={false}
      segments={[24, 32]}
    />
  );
}

export function WorksSurfaceWarp({
  rootRef,
  projects = [],
  velocityRef,
  dragRef,
  glRectsRef,
  reducedMotion = false,
}) {
  if (reducedMotion || !projects.length) return null;
  return (
    <div className="works-warp" aria-hidden>
      <Canvas
        frameloop="always"
        orthographic
        flat
        linear
        dpr={1}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: 'high-performance',
          premultipliedAlpha: false,
        }}
        style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none', position: 'absolute', inset: 0 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.NoToneMapping;
        }}
      >
        <PixelCamera />
        <WorksWarpScene
          rootRef={rootRef}
          projects={projects}
          velocityRef={velocityRef}
          dragRef={dragRef}
          glRectsRef={glRectsRef}
          reducedMotion={reducedMotion}
        />
      </Canvas>
    </div>
  );
}
