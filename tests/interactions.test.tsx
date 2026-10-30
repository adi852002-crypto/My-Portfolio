/* Interaction tests for the acceptance criteria that need a DOM.
   Run: npm test                                                        */
import './setup';
import { setMedia } from './setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';

import { ProcessDemo } from '../src/components/ProcessDemo';
import { AiDemo } from '../src/components/AiDemo';
import { ContactForm } from '../src/components/ContactForm';
import { SiteHeader } from '../src/components/SiteHeader';
import { StudioStage } from '../src/components/StudioStage';
import { CAMERA_SHOTS, PANEL_TITLES } from '../src/components/studio/shots';

test.afterEach(() => cleanup());

/* ---------------- studio: hotspots, panels, camera states ----------------
   jsdom has no WebGL, so StudioStage renders its documented fallback. That
   is the path these tests exercise: the buttons, the panel, focus and the
   state machine all work without the renderer, which is the requirement.
   The camera shots themselves are checked as data.                        */

/* The navigation row below the desk. "How I work" is not in it by design:
   the notebook on the desk opens it, and the About panel and the footer
   both link to the page, so it is never scene-only. */
const HOTSPOTS = [
  { id: 'work', label: 'Work' },
  { id: 'process', label: 'Process & CRM' },
  { id: 'ai', label: 'AI in action' },
  { id: 'about', label: 'About' },
  { id: 'note', label: 'Leave a note' },
] as const;

test('every hotspot is a real button with a visible label', () => {
  render(<StudioStage intro={<h1>Better operations.</h1>} />);
  for (const h of HOTSPOTS) {
    const btn = screen.getByRole('button', { name: new RegExp(`^${h.label}\\b`, 'i') });
    assert.equal(btn.tagName, 'BUTTON');
    assert.ok(btn.textContent?.includes(h.label));
  }
});

test('selecting a hotspot opens its panel with a Back to desk control', () => {
  render(<StudioStage intro={<h1>Better operations.</h1>} />);
  fireEvent.click(screen.getByRole('button', { name: /Process & CRM/i }));

  const panel = screen.getByRole('region', { name: PANEL_TITLES.process });
  assert.ok(panel);
  assert.ok(within(panel).getByRole('button', { name: /Back to desk/i }));
  // the panel holds the real demo, not a placeholder
  assert.match(panel.textContent ?? '', /Unclear ownership/);
});

test('each hotspot opens its own content', () => {
  const expected: [keyof typeof PANEL_TITLES, RegExp, RegExp][] = [
    ['work', /^Work\b/i, /Dynamic Travels/],
    ['process', /Process & CRM/i, /Unclear ownership|No clear owner/],
    ['ai', /AI in action/i, /Run demo/],
    ['about', /^About\b/i, /Bundelkhand University/],
    ['note', /^Leave a note\b/i, /nothing is sent until you send it/i],
  ];
  for (const [id, button, content] of expected) {
    render(<StudioStage intro={<h1>Better operations.</h1>} />);
    fireEvent.click(screen.getByRole('button', { name: button }));
    assert.match(
      screen.getByRole('region', { name: PANEL_TITLES[id] }).textContent ?? '',
      content,
      `panel for ${id}`,
    );
    cleanup();
  }
});

test('Back to desk closes the panel and restores focus to the trigger', () => {
  render(<StudioStage intro={<h1>Better operations.</h1>} />);
  const trigger = screen.getByRole('button', { name: /AI in action/i });
  fireEvent.click(trigger);
  assert.ok(screen.queryByRole('region', { name: PANEL_TITLES.ai }));

  fireEvent.click(screen.getByRole('button', { name: /Back to desk/i }));
  assert.equal(screen.queryByRole('region', { name: PANEL_TITLES.ai }), null);
  assert.equal(document.activeElement, trigger);
});

test('Escape closes the panel', async () => {
  render(<StudioStage intro={<h1>Better operations.</h1>} />);
  fireEvent.click(screen.getByRole('button', { name: /Process & CRM/i }));
  assert.ok(screen.queryByRole('region', { name: PANEL_TITLES.process }));
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() =>
    assert.equal(screen.queryByRole('region', { name: PANEL_TITLES.process }), null));
});

test('rapid switching between hotspots lands on the last one, with one panel open', () => {
  render(<StudioStage intro={<h1>Better operations.</h1>} />);
  const btns = HOTSPOTS.map((h) =>
    screen.getByRole('button', { name: new RegExp(`^${h.label}\\b`, 'i') }));
  for (let i = 0; i < 21; i++) fireEvent.click(btns[i % btns.length]);
  assert.equal(screen.getAllByRole('region').length, 1);
  // 21 clicks over 5 buttons ends on index (20 % 5) = 0 → Work
  assert.ok(screen.queryByRole('region', { name: PANEL_TITLES.work }));
});

test('the selected hotspot reports pressed state, not colour alone', () => {
  render(<StudioStage intro={<h1>Better operations.</h1>} />);
  const btn = screen.getByRole('button', { name: /AI in action/i });
  assert.equal(btn.getAttribute('aria-pressed'), 'false');
  fireEvent.click(btn);
  assert.equal(btn.getAttribute('aria-pressed'), 'true');
});

test('camera shots are distinct, so each hotspot moves the view', () => {
  const keys = ['overview', 'work', 'process', 'ai', 'about', 'note'] as const;
  const seen = new Set<string>();
  for (const k of keys) {
    const s = CAMERA_SHOTS[k];
    assert.equal(s.position.length, 3);
    assert.equal(s.target.length, 3);
    seen.add(s.position.join(',') + '|' + s.target.join(','));
  }
  assert.equal(seen.size, keys.length, 'every state needs its own shot');

  // each destination must actually travel from the overview
  const o = CAMERA_SHOTS.overview;
  for (const k of ['work', 'process', 'ai', 'about', 'note'] as const) {
    const s = CAMERA_SHOTS[k];
    const d = Math.hypot(
      s.position[0] - o.position[0],
      s.position[1] - o.position[1],
      s.position[2] - o.position[2],
    );
    assert.ok(d > 0.6, `${k} camera moves only ${d.toFixed(2)}m from overview`);

    /* The view must genuinely reframe, not drift: either it looks at a
       different object, or it pushes in hard on the one already centred.
       The laptop is the subject of the overview, so its close-up is the
       second kind. */
    const moved = Math.hypot(
      s.target[0] - o.target[0],
      s.target[1] - o.target[1],
      s.target[2] - o.target[2],
    );
    const range = (shot: typeof s) => Math.hypot(
      shot.position[0] - shot.target[0],
      shot.position[1] - shot.target[1],
      shot.position[2] - shot.target[2],
    );
    const pushIn = 1 - range(s) / range(o);
    assert.ok(moved > 0.15 || pushIn > 0.35,
      `${k} neither reframes (${moved.toFixed(2)}m) nor pushes in (${(pushIn * 100).toFixed(0)}%)`);
  }
});

test('the studio falls back without WebGL and keeps the controls usable', () => {
  const { container } = render(<StudioStage intro={<h1>Better operations.</h1>} />);
  assert.ok(container.querySelector('img[src="/scene/poster.webp"]'),
            'expected the poster fallback in a renderer-less environment');
  assert.ok(screen.getByRole('button', { name: /Process & CRM/i }));
  assert.ok(screen.getByRole('link', { name: /Contact/i }));
});

test('"How I work" is reachable without the scene', () => {
  render(<StudioStage intro={<h1>Better operations.</h1>} />);
  fireEvent.click(screen.getByRole('button', { name: /^About\b/i }));
  const panel = screen.getByRole('region', { name: PANEL_TITLES.about });
  const links = [...panel.querySelectorAll('a')].map((a) => a.getAttribute('href'));
  assert.ok(links.some((l) => l === '/services' || l?.startsWith('/services/')),
            `About must link on to how I work, got ${links.join(', ')}`);
});

/* ---------------- process demo ---------------- */

test('process demo redraws from fragmented to owned, and back', () => {
  render(<ProcessDemo />);
  assert.match(document.body.textContent ?? '', /No clear owner/);

  fireEvent.click(screen.getByRole('button', { name: /Simplify this/i }));
  assert.match(document.body.textContent ?? '', /Service desk/);
  assert.doesNotMatch(document.body.textContent ?? '', /No clear owner/);

  fireEvent.click(screen.getByRole('button', { name: /Show the original/i }));
  assert.match(document.body.textContent ?? '', /No clear owner/);
});

test('choosing another problem resets to its "before" state', () => {
  render(<ProcessDemo />);
  fireEvent.click(screen.getByRole('button', { name: /Simplify this/i }));
  fireEvent.click(screen.getByRole('button', { name: /Escalations go nowhere/i }));
  // back to "before" for the new case, not left in the fixed state
  assert.ok(screen.getByRole('button', { name: /Simplify this/i }));
  assert.match(document.body.textContent ?? '', /Email to a manager/);
});

test('problem selector exposes pressed state, not colour alone', () => {
  render(<ProcessDemo />);
  const btn = screen.getByRole('button', { name: /Customer data scattered/i });
  assert.equal(btn.getAttribute('aria-pressed'), 'false');
  fireEvent.click(btn);
  assert.equal(btn.getAttribute('aria-pressed'), 'true');
});

/* ---------------- AI demo ---------------- */

test('AI demo runs to completion and reset clears it', async () => {
  render(<AiDemo />);
  assert.match(document.body.textContent ?? '', /Waiting/);

  fireEvent.click(screen.getByRole('button', { name: /^Run demo$/i }));
  await waitFor(
    () => assert.doesNotMatch(document.body.textContent ?? '', /Waiting/),
    { timeout: 6000 },
  );
  assert.match(document.body.textContent ?? '', /Accounts — billing queue/);

  fireEvent.click(screen.getByRole('button', { name: /Reset/i }));
  assert.match(document.body.textContent ?? '', /Waiting/);
});

test('AI demo names the step where a person still decides', () => {
  render(<AiDemo />);
  assert.match(document.body.textContent ?? '', /Human review/);
  assert.match(document.body.textContent ?? '', /Person decides/);
  assert.match(document.body.textContent ?? '', /calls no AI service/i);
});

test('AI demo completes immediately under reduced motion', () => {
  setMedia({ '(prefers-reduced-motion: reduce)': true });
  render(<AiDemo />);
  fireEvent.click(screen.getByRole('button', { name: /^Run demo$/i }));
  assert.doesNotMatch(document.body.textContent ?? '', /Waiting/);
  setMedia({
    '(prefers-reduced-motion: no-preference)': true,
    '(pointer: fine)': true,
  });
});

/* ---------------- contact ---------------- */

test('contact form reports errors honestly and does not claim to send', () => {
  const { container } = render(<ContactForm />);
  fireEvent.submit(container.querySelector('form')!);

  assert.match(document.body.textContent ?? '', /Please enter your name/);
  assert.match(document.body.textContent ?? '', /valid email address/);
  assert.match(document.body.textContent ?? '', /at least 20 characters/);
  // nothing resembling a success state. Note the page legitimately contains
  // the word "sent" in "is not sent from this website", so match affirmative
  // success phrasing only.
  const body = document.body.textContent ?? '';
  assert.doesNotMatch(body, /message sent|successfully sent|thank you|thanks for (your|getting)|we'?ll be in touch|we'?ll get back/i);
  assert.match(body, /not sent from this website/i);
});

test('invalid fields are marked for assistive tech', () => {
  const { container } = render(<ContactForm />);
  fireEvent.submit(container.querySelector('form')!);
  const email = screen.getByLabelText(/Email/i);
  assert.equal(email.getAttribute('aria-invalid'), 'true');
  const describedBy = email.getAttribute('aria-describedby');
  assert.ok(describedBy && document.getElementById(describedBy), 'error must be referenced');
});

test('a valid submission hands off to the email app and says so', () => {
  const { container } = render(<ContactForm />);
  let navigatedTo = '';
  const spy = (e: Event) => {
    const a = (e.target as HTMLElement)?.closest?.('a[href^="mailto:"]') as HTMLAnchorElement | null;
    if (a) { navigatedTo = a.href; e.preventDefault(); }
  };
  document.addEventListener('click', spy, true);

  fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Priya Raman' } });
  fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'priya@example.com' } });
  fireEvent.change(screen.getByLabelText(/Short description/i), {
    target: { value: 'Our escalations go nowhere and nobody owns the queue.' },
  });
  fireEvent.submit(container.querySelector('form')!);

  document.removeEventListener('click', spy, true);
  assert.ok(navigatedTo.startsWith('mailto:adi852002@gmail.com'), navigatedTo.slice(0, 60));
  assert.match(decodeURIComponent(navigatedTo), /Priya Raman/);
  assert.match(document.body.textContent ?? '', /not sent until you send it there/i);
});

test('the discovery-call intent can be preselected', () => {
  render(<ContactForm initialTopic="discovery-call" />);
  const select = screen.getByLabelText(/What do you need help with/i) as HTMLSelectElement;
  assert.equal(select.value, 'discovery-call');
});

/* ---------------- header ---------------- */

test('every studio destination also has a page of its own', () => {
  render(<StudioStage intro={<h1>Better operations.</h1>} />);
  for (const [button, href] of [
    [/^Work\b/i, '/work/'],
    [/^About\b/i, '/about/'],
  ] as const) {
    fireEvent.click(screen.getByRole('button', { name: button }));
    const panel = screen.getByRole('region');
    const links = [...panel.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    // next/link may render the path without its trailing slash in tests;
    // the exported HTML carries it, so compare on the stem.
    const stem = href.replace(/\/$/, '');
    assert.ok(links.some((l) => l === stem || l?.startsWith(href)),
              `panel for ${href} must link to its page, got ${links.join(', ')}`);
  }
});

test('the notebook writes what is typed and never claims to send it', () => {
  render(<StudioStage intro={<h1>Better operations.</h1>} />);
  fireEvent.click(screen.getByRole('button', { name: /^Leave a note\b/i }));
  const field = screen.getByLabelText(/Your note/i) as HTMLTextAreaElement;
  fireEvent.change(field, { target: { value: 'Escalations go nowhere.' } });
  assert.equal(field.value, 'Escalations go nowhere.');
  const panel = screen.getByRole('region', { name: PANEL_TITLES.note }).textContent ?? '';
  assert.match(panel, /nothing is stored anywhere/i);
  assert.match(panel, /not sent until you send it/i);
  assert.doesNotMatch(panel, /message sent|successfully sent|thanks for/i);
});

test('mobile menu opens, closes on Escape, and returns focus to its toggle', async () => {
  render(<SiteHeader />);
  const toggle = screen.getByRole('button', { name: /Open menu/i });
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');

  fireEvent.click(toggle);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  const panel = document.getElementById('mobile-nav')!;
  assert.equal(panel.hasAttribute('hidden'), false);

  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => assert.equal(toggle.getAttribute('aria-expanded'), 'false'));
  assert.equal(document.activeElement, toggle, 'focus must return to the toggle');
});

test('header navigation points at real sections', () => {
  const { container } = render(<SiteHeader />);
  const nav = within(container.querySelector('header')!);
  for (const label of ['Work', 'About']) {
    const link = nav.getAllByRole('link', { name: label })[0] as HTMLAnchorElement;
    assert.ok(link.getAttribute('href')?.startsWith('/'));
  }
});
