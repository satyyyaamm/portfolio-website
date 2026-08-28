import { FAQ_ITEMS } from '../../lib/faq.js';
import { useState } from 'react';

export function ContactChapter({
  socialLinks,
  EMAIL_MAILTO,
  PHONE_DISPLAY,
  PHONE_TEL,
  formData,
  setFormData,
  contactFormStatus,
  setContactFormStatus,
  contactFormError,
  contactHoneypot,
  setContactHoneypot,
  handleContactSubmit,
}) {
  const [faqOpen, setFaqOpen] = useState(false);

  return (
    <div className="chapter chapter--contact">
      <div className="contact-chapter">
        <div className="contact-chapter__copy">
          <p className="chapter__eyebrow">Let&apos;s build</p>
          <h2 className="chapter__title">Have something worth building?</h2>
          <p className="chapter__lede">
            An idea taking shape, or an app that needs a steady hand—I&apos;d love to hear what
            you&apos;re shipping. I usually reply within a day.
          </p>
          <p className="contact-chapter__direct">
            <a href={EMAIL_MAILTO}>satyamt5152@gmail.com</a>
            <span aria-hidden> · </span>
            <a href={PHONE_TEL}>{PHONE_DISPLAY}</a>
          </p>
          {socialLinks}
          <button
            type="button"
            className="contact-faq-toggle"
            aria-expanded={faqOpen}
            onClick={() => setFaqOpen((v) => !v)}
          >
            {faqOpen ? 'Hide FAQ' : 'Common questions'}
          </button>
          {faqOpen && (
            <div className="contact-faq">
              {FAQ_ITEMS.map((item) => (
                <details key={item.q} className="faq-item group">
                  <summary className="faq-item__summary">{item.q}</summary>
                  <p className="faq-item__answer">{item.a}</p>
                </details>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleContactSubmit} className="contact-form">
          <p className="contact-form__note">
            Your note comes straight to me—I&apos;ll only use your details to reply.
          </p>
          <p className="sr-only" aria-live="polite">
            {contactFormStatus === 'success' && 'Message sent successfully.'}
            {contactFormStatus === 'error' && contactFormError}
          </p>
          <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
            <label htmlFor="contact-website">Website</label>
            <input
              id="contact-website"
              name="botcheck"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={contactHoneypot}
              onChange={(e) => setContactHoneypot(e.target.value)}
            />
          </div>
          <div className="contact-form__row">
            <div>
              <label htmlFor="contact-name">Full name</label>
              <input
                id="contact-name"
                name="name"
                value={formData.name}
                disabled={contactFormStatus === 'sending'}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (contactFormStatus !== 'idle') setContactFormStatus('idle');
                }}
                required
              />
            </div>
            <div>
              <label htmlFor="contact-email">Email address</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                value={formData.email}
                disabled={contactFormStatus === 'sending'}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (contactFormStatus !== 'idle') setContactFormStatus('idle');
                }}
                required
              />
            </div>
          </div>
          <div className="contact-form__row">
            <div>
              <label htmlFor="contact-phone">Phone number</label>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                value={formData.phone}
                disabled={contactFormStatus === 'sending'}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="contact-subject">Subject</label>
              <input
                id="contact-subject"
                name="subject"
                value={formData.subject}
                disabled={contactFormStatus === 'sending'}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label htmlFor="contact-message">Tell me about your project</label>
            <textarea
              id="contact-message"
              name="message"
              rows={4}
              value={formData.message}
              disabled={contactFormStatus === 'sending'}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
            />
          </div>
          {contactFormStatus === 'success' && (
            <p className="text-sm text-emerald-300" role="status">
              Thanks — your message was sent. I&apos;ll reply soon.
            </p>
          )}
          {contactFormStatus === 'error' && contactFormError && (
            <p className="text-sm text-red-300" role="alert">
              {contactFormError}
            </p>
          )}
          <button type="submit" disabled={contactFormStatus === 'sending'} className="btn-journey">
            {contactFormStatus === 'sending' ? 'Sending…' : 'Send a note'}
          </button>
        </form>
      </div>
    </div>
  );
}

export { ContactChapter as ContactSlide };
