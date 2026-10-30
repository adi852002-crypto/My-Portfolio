'use client';

import Link from 'next/link';
import { PROFILE } from '@/data/site';
import { Icon } from './Icon';

/* The notebook on the desk. Whatever is typed here appears on the page in
   the scene as it is written.

   It is honest about where the words go: nothing leaves the browser until
   the button is pressed, and that button hands the text to the visitor's
   own email app. There is no server behind this page, so nothing is
   "saved" or "shared" and the panel does not pretend otherwise. */
export function NotePanel({
  value, onChange,
}: { value: string; onChange: (v: string) => void }) {
  const MAX = 280;
  const trimmed = value.trim();

  const send = () => {
    if (!trimmed) return;
    const link = document.createElement('a');
    link.href =
      `mailto:${PROFILE.email}` +
      `?subject=${encodeURIComponent('A note from your website')}` +
      `&body=${encodeURIComponent(trimmed)}`;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div>
      <p className="max-w-prose text-[15px] text-ink-soft">
        Type and it appears on the notebook, in the scene. It stays in this
        browser tab — nothing is stored anywhere and nothing is sent until you
        send it yourself.
      </p>

      <label htmlFor="desk-note" className="mt-4 block text-[14px] font-medium">
        Your note
      </label>
      <textarea
        id="desk-note"
        value={value}
        maxLength={MAX}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Anything you like — a question, a problem, a hello."
        className="field mt-1.5 resize-y"
      />
      <p className="mt-1 text-right text-[13px] text-ink-soft" aria-live="polite">
        {value.length} / {MAX}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={send}
          disabled={!trimmed}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send it by email
          <Icon name="arrow" className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onChange('')}
          className="btn-secondary"
          disabled={!value}
        >
          Clear the page
        </button>
        <Link href="/contact/" className="text-[15px] font-medium text-sage">
          Or use the full contact form
        </Link>
      </div>

      <p className="mt-4 text-[14px] text-ink-soft">
        The button opens your own email app with the note already written.
        It is not sent until you send it there.
      </p>
    </div>
  );
}
