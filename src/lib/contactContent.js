/** Contacts / Let's talk — Auge sticky-stack structure, Satyam content. */

export const CONTACT_EMAIL = 'satyamt5152@gmail.com';
export const CONTACT_EMAIL_HREF = `mailto:${CONTACT_EMAIL}`;
export const CONTACT_PHONE_DISPLAY = '+91 87933 80992';
export const CONTACT_PHONE_HREF = 'tel:+918793380992';

export const CONTACT_SUBTITLE = 'CONTACT US';

/** Hero inset GIF — “in touch” telephone loop (Philippa Rice / Giphy). */
export const CONTACT_HERO_GIF = {
  kind: 'image',
  src: '/media/contact-touch.gif',
  poster: '/media/contact-touch.gif',
  name: 'In touch',
};

/**
 * Hero lockup — Auge contacts: READY TO BE / ⤷[media] IN TOUCH?
 * Bold = Greed grotesk; italic = Didone. Yellow on R, Y, ?.
 */
/** Each entry is one reveal token (word-sized) with glyph spans inside. */
export const CONTACT_HERO = {
  line1: [
    {
      key: 'ready',
      parts: [
        { text: 'R', ital: true, accent: true },
        { text: 'E', bold: true },
        { text: 'A', bold: true, scramble: true },
        { text: 'D', bold: true },
        { text: 'Y', accent: true, bold: true },
      ],
    },
    {
      key: 'to',
      parts: [
        { text: 'T', ital: true },
        { text: 'O', bold: true },
      ],
    },
    {
      key: 'be',
      parts: [
        { text: 'B', ital: true },
        { text: 'E', bold: true },
      ],
    },
  ],
  line2: [
    { key: 'arrow', arrow: true },
    { key: 'media', media: true },
    {
      key: 'in',
      parts: [
        { text: 'I', bold: true },
        { text: 'N', bold: true },
      ],
    },
    {
      key: 'touch',
      parts: [
        { text: 'T', bold: true, scramble: true },
        { text: 'O', bold: true },
        { text: 'U', bold: true },
        { text: 'C', bold: true },
        { text: 'H', bold: true },
      ],
    },
    {
      key: 'q',
      parts: [{ text: '?', accent: true, bold: true, q: true }],
    },
  ],
};

export const CONTACT_LINKEDIN_URL =
  'https://www.linkedin.com/in/satyam-tiwari-a03299200';
export const CONTACT_INSTAGRAM_URL = 'https://www.instagram.com/buildwithsatyamm/';
export const CONTACT_INSTAGRAM_HANDLE = '@buildwithsatyamm';

/**
 * Sticky social panels (no offices) — Instagram + LinkedIn stacks.
 * Alternating black / cream; titles break like Auge city lockups.
 */
export const CONTACT_PANELS = [
  {
    id: 'instagram',
    kicker: 'SOCIAL',
    /* 2-3-2-2 lockup */
    titleLines: ['IN-', 'STA-', 'GR-', 'AM'],
    addressKicker: 'HANDLE',
    lines: [
      CONTACT_INSTAGRAM_HANDLE,
      'Product builds, process notes,',
      'and behind-the-scenes from the desk.',
      'Short clips, UI experiments, shipping days.',
      '',
      'Pune · IST',
    ],
    link: {
      label: 'Open Instagram',
      href: CONTACT_INSTAGRAM_URL,
    },
    bg: '#000000',
    color: '#FFFFFF',
    gif: {
      kind: 'image',
      src: '/media/contact-instagram.gif',
      poster: '/media/contact-instagram.gif',
      name: 'Instagram',
    },
  },
  {
    id: 'linkedin',
    kicker: 'PROFESSIONAL',
    /* 2-2-2-2 lockup */
    titleLines: ['LI-', 'NK-', 'ED-', 'IN'],
    addressKicker: 'PROFILE',
    lines: [
      'Satyam Tiwari',
      'Mobile App Developer',
      '',
      'Open to collabs & roles',
    ],
    link: {
      label: 'Open LinkedIn',
      href: CONTACT_LINKEDIN_URL,
    },
    bg: '#EDEEE5',
    color: '#000000',
    gif: {
      kind: 'image',
      src: '/media/contact-linkedin.gif',
      poster: '/media/contact-linkedin.gif',
      name: 'LinkedIn',
    },
  },
];

export function contactMediaFromProjects(projects = []) {
  const items = [];
  const push = (item) => {
    if (!item?.src) return;
    if (items.some((x) => x.src === item.src)) return;
    items.push(item);
  };

  for (const project of projects) {
    if (project.video) {
      push({
        kind: 'video',
        src: project.video,
        poster: project.previewImage || project.gallery?.[0] || project.image,
        name: project.name,
      });
    }
    const shot = project.gallery?.[0] || project.previewImage || project.image;
    if (shot) push({ kind: 'image', src: shot, poster: shot, name: project.name });
    if (items.length >= 4) break;
  }

  if (!items.length) {
    push({ kind: 'video', src: '/media/journey.mp4', poster: null, name: 'Journey' });
  }
  return items;
}
