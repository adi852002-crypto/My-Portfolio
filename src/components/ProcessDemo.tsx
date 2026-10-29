'use client';

/* Illustrative workflow. Pick a common problem, see a fragmented process
   redrawn as a clear one. The content is invented for illustration and the
   page says so — it is not a record of any client engagement. */

import { useId, useState } from 'react';

type Node = { id: string; label: string; owner: string | null };

type Case = {
  id: string;
  problem: string;
  beforeNote: string;
  afterNote: string;
  before: Node[];
  after: Node[];
};

const CASES: Case[] = [
  {
    id: 'ownership',
    problem: 'Unclear ownership',
    beforeNote: 'Four people touch the request. None of them owns it, so it stalls between steps.',
    afterNote: 'One named owner per step, and an explicit handoff between them.',
    before: [
      { id: 'b1', label: 'Request arrives', owner: null },
      { id: 'b2', label: 'Someone picks it up', owner: null },
      { id: 'b3', label: 'Passed on for input', owner: null },
      { id: 'b4', label: 'Waiting', owner: null },
      { id: 'b5', label: 'Chased', owner: null },
      { id: 'b6', label: 'Closed, eventually', owner: null },
    ],
    after: [
      { id: 'a1', label: 'Intake', owner: 'Service desk' },
      { id: 'a2', label: 'Triage & assign', owner: 'Duty lead' },
      { id: 'a3', label: 'Resolve', owner: 'Named specialist' },
      { id: 'a4', label: 'Confirm with requester', owner: 'Duty lead' },
    ],
  },
  {
    id: 'escalation',
    problem: 'Escalations go nowhere',
    beforeNote: 'Escalation means emailing whoever answered last time. Nothing is tracked.',
    afterNote: 'A defined path with a trigger at each level and a timebox before it moves up.',
    before: [
      { id: 'b1', label: 'Customer unhappy', owner: null },
      { id: 'b2', label: 'Email to a manager', owner: null },
      { id: 'b3', label: 'Forwarded around', owner: null },
      { id: 'b4', label: 'Someone intervenes', owner: null },
    ],
    after: [
      { id: 'a1', label: 'Trigger defined', owner: 'Agreed threshold' },
      { id: 'a2', label: 'Level 1 — 4 hours', owner: 'Team lead' },
      { id: 'a3', label: 'Level 2 — 1 day', owner: 'Delivery manager' },
      { id: 'a4', label: 'Review & close', owner: 'Account owner' },
    ],
  },
  {
    id: 'crm',
    problem: 'Customer data scattered',
    beforeNote: 'The record lives in three tools and a spreadsheet. Nobody trusts any of them.',
    afterNote: 'One system of record, with the other tools writing into it rather than beside it.',
    before: [
      { id: 'b1', label: 'Email thread', owner: null },
      { id: 'b2', label: 'Spreadsheet', owner: null },
      { id: 'b3', label: 'Chat message', owner: null },
      { id: 'b4', label: 'Someone’s notes', owner: null },
    ],
    after: [
      { id: 'a1', label: 'Capture', owner: 'One intake form' },
      { id: 'a2', label: 'CRM record', owner: 'System of record' },
      { id: 'a3', label: 'Activity logged', owner: 'Owner on the account' },
      { id: 'a4', label: 'Reporting', owner: 'Reads from the CRM' },
    ],
  },
];

export function ProcessDemo() {
  const [caseId, setCaseId] = useState(CASES[0].id);
  const [fixed, setFixed] = useState(false);
  const panelId = useId();
  const active = CASES.find((c) => c.id === caseId)!;
  const nodes = fixed ? active.after : active.before;

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line p-5 sm:p-7">
        <p className="eyebrow">Interactive example · Illustrative</p>
        <h3 className="mt-2 text-xl sm:text-2xl">See a process get simpler</h3>
        <p className="mt-2 max-w-prose text-[15px] text-ink-soft">
          Pick a problem teams often describe, then redraw it. The diagrams are
          illustrations made for this page, not a record of any client engagement.
        </p>

        <fieldset className="mt-5">
          <legend className="sr-only">Choose a sample problem</legend>
          <div className="flex flex-wrap gap-2">
            {CASES.map((c) => {
              const on = c.id === caseId;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  aria-controls={panelId}
                  onClick={() => {
                    setCaseId(c.id);
                    setFixed(false);
                  }}
                  className={`btn min-h-[44px] border px-4 text-[14px] ${
                    on
                      ? 'border-sage bg-sage text-white'
                      : 'border-line-strong bg-surface text-ink hover:border-sage'
                  }`}
                >
                  {c.problem}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <div id={panelId} className="bg-ivory/60 p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-[15px] text-ink-soft">
            <strong className="font-medium text-ink">
              {fixed ? 'After: ' : 'Before: '}
            </strong>
            {fixed ? active.afterNote : active.beforeNote}
          </p>
          <button
            type="button"
            onClick={() => setFixed((v) => !v)}
            className={fixed ? 'btn-secondary' : 'btn-primary'}
          >
            {fixed ? 'Show the original' : 'Simplify this'}
          </button>
        </div>

        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {nodes.map((n, i) => (
            <li
              key={n.id}
              className={`rounded-xl border p-4 transition-colors duration-300 ease-soft ${
                fixed ? 'border-sage/40 bg-sage-soft/60' : 'border-line bg-surface'
              }`}
            >
              <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-ink-soft">
                Step {i + 1}
              </span>
              <span className="mt-1 block text-[15px] font-medium">{n.label}</span>
              <span className="mt-2 block text-[13px] text-ink-soft">
                {n.owner ? (
                  <>
                    Owner: <span className="text-sage">{n.owner}</span>
                  </>
                ) : (
                  <em className="not-italic text-ink-soft/80">No clear owner</em>
                )}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
