'use client';

/* A deterministic local simulation of a request-handling automation.
   It calls no API, costs nothing to run, and uses sample data that ships
   with the page. The point is to show where automation helps and where a
   person still has to decide. */

import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

type Sample = { subject: string; body: string; category: string; owner: string; reply: string };

const SAMPLES: Sample[] = [
  {
    subject: 'Invoice doesn’t match the quote',
    body: 'We were quoted one figure in March and the invoice that arrived is different. Can someone check before we process it?',
    category: 'Billing query',
    owner: 'Accounts — billing queue',
    reply:
      'Thanks for flagging this. I can see the quote from March and the invoice raised this week, and they do differ. I have put the invoice on hold and asked accounts to confirm which figure stands before anything is processed. I will come back to you by Thursday.',
  },
  {
    subject: 'Still waiting on the access request',
    body: 'Raised a request for system access for two new joiners last Tuesday. They start Monday and still have nothing.',
    category: 'Access request',
    owner: 'IT service desk — onboarding',
    reply:
      'Apologies for the wait. Both access requests are open but were not picked up after the initial approval. I have escalated them to the onboarding queue and asked for confirmation today, so the accounts are ready before Monday.',
  },
  {
    subject: 'Can we add two more users to the plan?',
    body: 'We would like to add two people to our current plan and understand what that changes for the renewal.',
    category: 'Account change',
    owner: 'Account manager',
    reply:
      'Happy to help. Adding two users is straightforward. I have asked your account manager to confirm how it affects the renewal date and the amount before anything changes, so there are no surprises later.',
  },
];

type Step = { key: string; label: string; detail: (s: Sample) => string; human?: boolean };

const STEPS: Step[] = [
  { key: 'received',   label: 'Request received',  detail: (s) => `“${s.subject}”` },
  { key: 'categorise', label: 'Categorise',        detail: (s) => s.category },
  { key: 'assign',     label: 'Assign owner',      detail: (s) => s.owner },
  { key: 'review',     label: 'Human review',      detail: () => 'A person checks the category, the owner and the tone before anything is sent.', human: true },
  { key: 'reply',      label: 'Response prepared', detail: (s) => s.reply },
];

export function AiDemo({ seed }: { seed?: number | null }) {
  /* A sticky note on the monitor can open this on a particular request, in
     which case it starts itself: picking the note up is the instruction to
     run it. Opened any other way it waits to be told. */
  const [sampleIndex, setSampleIndex] = useState(seed ?? 0);
  const [done, setDone] = useState(-1);          // index of the last completed step
  const [running, setRunning] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sample = SAMPLES[sampleIndex];

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  /* Run once on arrival when a note sent us here. The ref keeps a re-render
     from starting it again. */
  const started = useRef(false);
  useEffect(() => {
    if (seed == null || started.current) return;
    started.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const run = () => {
    clear();
    setDone(-1);
    setRunning(true);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gap = reduce ? 0 : 620;

    if (reduce) {
      setDone(STEPS.length - 1);
      setRunning(false);
      return;
    }
    STEPS.forEach((_, i) => {
      timers.current.push(
        setTimeout(() => {
          setDone(i);
          if (i === STEPS.length - 1) setRunning(false);
        }, gap * (i + 1)),
      );
    });
  };

  const reset = () => {
    clear();
    setRunning(false);
    setDone(-1);
  };

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line p-5 sm:p-7">
        <p className="eyebrow">Interactive example · Sample data</p>
        <h3 className="mt-2 text-xl sm:text-2xl">A request, handled end to end</h3>
        <p className="mt-2 max-w-prose text-[15px] text-ink-soft">
          A fixed simulation using the sample messages below. It runs in your
          browser, calls no AI service and sends nothing anywhere — it is here to
          show the shape of the workflow, and where a person still makes the call.
        </p>
        <p className="mt-2 max-w-prose text-[14px] text-ink-soft">
          The notes stuck to the monitor on the desk are these same three
          requests — pick one up and it opens here, already running.
        </p>

        <fieldset className="mt-5">
          <legend className="sr-only">Choose a sample request</legend>
          <div className="flex flex-wrap gap-2">
            {SAMPLES.map((s, i) => {
              const on = i === sampleIndex;
              return (
                <button
                  key={s.subject}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setSampleIndex(i);
                    reset();
                  }}
                  className={`btn min-h-[44px] border px-4 text-[14px] ${
                    on
                      ? 'border-sage bg-sage text-ink-invert'
                      : 'border-line-strong bg-surface text-ink hover:border-sage'
                  }`}
                >
                  {s.category}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={run} disabled={running} className="btn-primary disabled:opacity-60">
            {running ? 'Running…' : 'Run demo'}
          </button>
          <button type="button" onClick={reset} className="btn-secondary">
            Reset
          </button>
        </div>
      </div>

      <div className="bg-ivory/60 p-5 sm:p-7">
        <p className="mb-4 rounded-lg border border-line bg-surface p-4 text-[15px] text-ink-soft">
          <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-ink-soft">
            Incoming message (sample)
          </span>
          <span className="mt-1 block text-ink">{sample.body}</span>
        </p>

        <ol className="space-y-2" aria-live="polite">
          {STEPS.map((step, i) => {
            const shown = i <= done;
            return (
              <li
                key={step.key}
                className={`flex gap-3 rounded-xl border p-4 transition-all duration-300 ease-soft ${
                  shown ? 'border-sage/40 bg-surface opacity-100' : 'border-line bg-surface/50 opacity-55'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-medium ${
                    shown ? 'bg-sage text-ink-invert' : 'bg-sage-soft text-sage'
                  }`}
                  aria-hidden="true"
                >
                  {shown ? <Icon name="check" className="h-4 w-4" /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-medium">{step.label}</span>
                    {step.human && (
                      <span className="rounded-full bg-brass/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-brass">
                        Person decides
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-[14px] text-ink-soft">
                    {shown ? step.detail(sample) : 'Waiting'}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>

        <p className="mt-5 text-[14px] text-ink-soft">
          The automation sorts, routes and drafts. Whether the answer is right,
          whether the tone fits the relationship, and whether the case needs a
          conversation instead — those stay with a person.
        </p>
      </div>
    </div>
  );
}
