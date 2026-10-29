'use client';

/* ------------------------------------------------------------------
   No server and no form provider is configured for this deployment
   (the site is a static export on Cloudflare Pages). So this form does
   NOT claim to send anything. It validates, composes the message, and
   hands it to the visitor's own email app, which is what the button says.

   Nothing is stored and nothing is transmitted by this page.

   To make it send for real, see README "Turning on the contact form".
   ------------------------------------------------------------------ */

import { useEffect, useRef, useState } from 'react';
import { CONTACT, PROFILE } from '@/data/site';

type Errors = Partial<Record<'name' | 'email' | 'message', string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm({ initialTopic }: { initialTopic?: string }) {
  const [topic, setTopic] = useState(initialTopic ?? CONTACT.topics[0].value);
  const [errors, setErrors] = useState<Errors>({});
  const [handedOff, setHandedOff] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
  }, [initialTopic]);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const company = String(data.get('company') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();

    const next: Errors = {};
    if (name.length < 2) next.name = 'Please enter your name.';
    if (!EMAIL_RE.test(email)) next.email = 'Please enter a valid email address so I can reply.';
    if (message.length < 20) next.message = 'A sentence or two about the problem helps — at least 20 characters.';

    setErrors(next);
    if (Object.keys(next).length) {
      const firstKey = Object.keys(next)[0];
      form.querySelector<HTMLElement>(`[name="${firstKey}"]`)?.focus();
      return;
    }

    const label = CONTACT.topics.find((t) => t.value === topic)?.label ?? topic;
    const subject = `${label} — enquiry from ${name}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      company ? `Company: ${company}` : null,
      `Needs help with: ${label}`,
      '',
      message,
    ]
      .filter(Boolean)
      .join('\n');

    // Opens the visitor's email client with the message pre-filled.
    // An anchor click is more reliable than assigning location.href, which
    // some browsers ignore for mailto: outside a direct user gesture.
    const link = document.createElement('a');
    link.href =
      `mailto:${PROFILE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setHandedOff(true);
  }

  return (
    <form onSubmit={submit} noValidate className="card p-5 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label htmlFor="name" className="mb-1.5 block text-[14px] font-medium">
            Name <span aria-hidden="true" className="text-brass">*</span>
          </label>
          <input
            id="name" name="name" type="text" required autoComplete="name" maxLength={120}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'err-name' : undefined}
            className="field"
          />
          {errors.name && (
            <p id="err-name" className="mt-1.5 text-[13px] text-[#8C2F26]">{errors.name}</p>
          )}
        </div>

        <div className="sm:col-span-1">
          <label htmlFor="email" className="mb-1.5 block text-[14px] font-medium">
            Email <span aria-hidden="true" className="text-brass">*</span>
          </label>
          <input
            id="email" name="email" type="email" required autoComplete="email" maxLength={200}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'err-email' : undefined}
            className="field"
          />
          {errors.email && (
            <p id="err-email" className="mt-1.5 text-[13px] text-[#8C2F26]">{errors.email}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="company" className="mb-1.5 block text-[14px] font-medium">
            Company <span className="font-normal text-ink-soft">(optional)</span>
          </label>
          <input id="company" name="company" type="text" autoComplete="organization"
                 maxLength={160} className="field" />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="topic" className="mb-1.5 block text-[14px] font-medium">
            What do you need help with?
          </label>
          <select
            id="topic" name="topic" value={topic}
            onChange={(e) => setTopic(e.target.value)} className="field"
          >
            {CONTACT.topics.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="message" className="mb-1.5 block text-[14px] font-medium">
            Short description of the challenge{' '}
            <span aria-hidden="true" className="text-brass">*</span>
          </label>
          <textarea
            id="message" name="message" required rows={5} maxLength={4000}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'err-message' : 'hint-message'}
            className="field resize-y"
          />
          {errors.message ? (
            <p id="err-message" ref={errorRef} className="mt-1.5 text-[13px] text-[#8C2F26]">
              {errors.message}
            </p>
          ) : (
            <p id="hint-message" className="mt-1.5 text-[13px] text-ink-soft">
              What is slowing the team down, and what have you already tried?
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" className="btn-primary">Open in your email app</button>
        <p className="text-[13px] text-ink-soft">
          or email{' '}
          <a className="text-sage underline underline-offset-2" href={`mailto:${PROFILE.email}`}>
            {PROFILE.email}
          </a>
        </p>
      </div>

      {/* Deliberately not a success message: nothing has been sent by this page. */}
      <p aria-live="polite" className="mt-4 text-[13px] text-ink-soft">
        {handedOff
          ? 'Your email app should now be open with the message filled in. It is not sent until you send it there. If nothing opened, copy the address above instead.'
          : 'This button opens your own email app with the details filled in — the message is not sent from this website, and nothing you type here is stored or transmitted by this page.'}
      </p>
    </form>
  );
}
