'use client';

/* ------------------------------------------------------------------
   The form posts to /api/contact on this site, which saves the message
   privately for Aniruddha to read in his dashboard. It says "sent" only
   once the server has confirmed the save.

   If the server cannot be reached, nothing is lost: the form offers to
   open the visitor's own email app with the same message filled in.
   ------------------------------------------------------------------ */

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CONTACT, PROFILE, TRACKS } from '@/data/site';
import { sessionId } from '@/lib/analytics';

type Errors = Partial<Record<'name' | 'email' | 'message', string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm({ initialTopic }: { initialTopic?: string }) {
  const [topic, setTopic] = useState(initialTopic ?? CONTACT.topics[0].value);
  const [errors, setErrors] = useState<Errors>({});
  const [handedOff, setHandedOff] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed' | 'rate'>('idle');
  const [sentTo, setSentTo] = useState('');
  const [track, setTrack] = useState<string | null>(null);
  const startedAt = useRef(0);
  const mailtoRef = useRef('');
  useEffect(() => { startedAt.current = Date.now(); }, []);

  /* A booking button carries which door it came through, so the subject
     line says so and nobody has to explain it twice. The site is a static
     export, so this is read in the browser rather than on a server. */
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const intent = q.get('intent');
      if (intent && CONTACT.topics.some((t) => t.value === intent)) setTopic(intent);
      const t = q.get('track');
      if (t && TRACKS.some((x) => x.id === t)) setTrack(t);
    } catch { /* no query, nothing to preselect */ }
  }, []);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
  }, [initialTopic]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'sending') return;
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const company = String(data.get('company') ?? '').trim();
    const when = String(data.get('when') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();
    const website = String(data.get('website') ?? '');

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
    const door = TRACKS.find((t) => t.id === track);
    const subject = door
      ? `${door.label} — ${label} — enquiry from ${name}`
      : `${label} — enquiry from ${name}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      company ? `Company: ${company}` : null,
      `Needs help with: ${label}`,
      when ? `Times that suit: ${when}` : null,
      door ? `Came in through: ${door.label}` : null,
      '',
      message,
    ]
      .filter(Boolean)
      .join('\n');
    mailtoRef.current =
      `mailto:${PROFILE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name, email, company, when, message, topic, track, website,
          elapsed: Date.now() - startedAt.current, s: sessionId(),
        }),
      });
      if (res.status === 429) { setStatus('rate'); return; }
      const out = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !out.ok) throw new Error(String(res.status));
      setSentTo(email);
      setStatus('sent');
      form.reset();
      setTopic(initialTopic ?? CONTACT.topics[0].value);
    } catch {
      setStatus('failed');
    }
  }

  /* The fallback: the visitor's own email app, with the message filled in.
     An anchor click is more reliable than assigning location.href, which
     some browsers ignore for mailto: outside a direct user gesture. */
  function handOff() {
    const link = document.createElement('a');
    link.href = mailtoRef.current;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setHandedOff(true);
  }

  if (status === 'sent') {
    return (
      <div className="card p-5 sm:p-7" role="status">
        <p className="font-serif text-[22px]">Thank you — your message is with me.</p>
        <p className="mt-2 max-w-prose text-[15px] text-ink-soft">
          I will reply to <span className="font-medium text-ink">{sentTo}</span>. If it is
          urgent, email{' '}
          <a className="text-sage underline underline-offset-2" href={`mailto:${PROFILE.email}`}>
            {PROFILE.email}
          </a>{' '}
          directly.
        </p>
        <button type="button" className="btn-secondary mt-5" onClick={() => setStatus('idle')}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="card p-5 sm:p-7">
      {/* A field people never see. Form-filling scripts tend to fill it in,
          and anything that arrives with it filled is discarded. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Leave this empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
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
            <p id="err-name" className="mt-1.5 text-[13px] text-error">{errors.name}</p>
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
            <p id="err-email" className="mt-1.5 text-[13px] text-error">{errors.email}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="company" className="mb-1.5 block text-[14px] font-medium">
            Company <span className="font-normal text-ink-soft">(optional)</span>
          </label>
          <input id="company" name="company" type="text" autoComplete="organization"
                 maxLength={160} className="field" />
        </div>

        {/* There is no scheduling page, so the nearest honest thing to
            booking a slot is letting the first email propose one. Optional,
            and it simply does not appear in the message when it is empty. */}
        <div className="sm:col-span-2">
          <label htmlFor="when" className="mb-1.5 block text-[14px] font-medium">
            Times that suit you <span className="font-normal text-ink-soft">(optional)</span>
          </label>
          <input
            id="when" name="when" type="text" maxLength={160} className="field"
            placeholder="e.g. Tuesday or Thursday afternoon"
            aria-describedby="when-note"
          />
          <p id="when-note" className="mt-1.5 text-[13px] text-ink-soft">
            A couple of windows in your own time zone, and a time gets agreed in one
            reply instead of three. I am in {PROFILE.location} (GMT+5:30).
          </p>
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
            <p id="err-message" ref={errorRef} className="mt-1.5 text-[13px] text-error">
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
        <button type="submit" className="btn-primary" disabled={status === 'sending'} aria-busy={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </button>
        <p className="text-[13px] text-ink-soft">
          or email{' '}
          <a className="text-sage underline underline-offset-2" href={`mailto:${PROFILE.email}`}>
            {PROFILE.email}
          </a>
        </p>
      </div>

      <div aria-live="polite" className="mt-4 text-[13px] text-ink-soft">
        {status === 'failed' ? (
          <div className="rounded-xl border border-line bg-ivory/60 p-3 text-[14px] text-ink">
            <p>The message could not be sent from here just now. Nothing is lost — you can send the same message from your own email app.</p>
            <button type="button" className="btn-secondary mt-3" onClick={handOff}>
              Open it in your email app
            </button>
            {handedOff && (
              <p className="mt-2 text-[13px] text-ink-soft">
                Your email app should now be open with the message filled in. It is not sent until you send it there.
              </p>
            )}
          </div>
        ) : status === 'rate' ? (
          <p className="text-[14px] text-ink">
            A few messages have already arrived from here in the last hour. Please email{' '}
            <a className="text-sage underline underline-offset-2" href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>{' '}
            if there is more to add.
          </p>
        ) : (
          <p>
            Your message is saved privately for {PROFILE.name.split(' ')[0]} to read and is not shared with anyone.{' '}
            <Link href="/privacy/" className="text-sage underline underline-offset-2">Privacy</Link>
          </p>
        )}
      </div>
    </form>
  );
}
