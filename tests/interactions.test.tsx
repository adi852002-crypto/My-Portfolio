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

const HOTSPOTS = [
  { id: 'process', label: 'Process & CRM' },
  { id: 'ai', label: 'AI in action' },
  { id: 'work', label: 'Selected work' },
] as const;

test('every hotspot is a real button with a visible label', () => {
  render(<StudioStage />);
  for (const h of HOTSPOTS) {
    const btn = screen.getByRole('button', { name: new RegExp(h.label, 'i') });
    assert.equal(btn.tagName, 'BUTTON');
    assert.ok(btn.textContent?.includes(h.label));
  }
});

test('selecting a hotspot opens its panel with a Back to studio control', () => {
  render(<StudioStage />);
  fireEvent.click(screen.getByRole('button', { name: /Process & CRM/i }));

  const panel = screen.getByRole('region', { name: PANEL_TITLES.process });
  assert.ok(panel);
  assert.ok(within(panel).getByRole('button', { name: /Back to studio/i }));
  // the panel holds the real demo, not a placeholder
  assert.match(panel.textContent ?? '', /Unclear ownership/);
});

test('each hotspot opens its own content', () => {
  render(<StudioStage />);
  fireEvent.click(screen.getByRole('button', { name: /AI in action/i }));
  assert.match(
    screen.getByRole('region', { name: PANEL_TITLES.ai }).textContent ?? '',
    /Run demo/,
  );
  cleanup();

  render(<StudioStage />);
  fireEvent.click(screen.getByRole('button', { name: /Selected work/i }));
  assert.match(
    screen.getByRole('region', { name: PANEL_TITLES.work }).textContent ?? '',
    /Dynamic Travels/,
  );
});

test('Back to studio closes the panel and restores focus to the trigger', () => {
  render(<StudioStage />);
  const trigger = screen.getByRole('button', { name: /AI in action/i });
  fireEvent.click(trigger);
  assert.ok(screen.queryByRole('region', { name: PANEL_TITLES.ai }));

  fireEvent.click(screen.getByRole('button', { name: /Back to studio/i }));
  assert.equal(screen.queryByRole('region', { name: PANEL_TITLES.ai }), null);
  assert.equal(document.activeElement, trigger);
});

test('Escape closes the panel', async () => {
  render(<StudioStage />);
  fireEvent.click(screen.getByRole('button', { name: /Process & CRM/i }));
  assert.ok(screen.queryByRole('region', { name: PANEL_TITLES.process }));
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() =>
    assert.equal(screen.queryByRole('region', { name: PANEL_TITLES.process }), null));
});

test('rapid switching between hotspots lands on the last one, with one panel open', () => {
  render(<StudioStage />);
  const btns = HOTSPOTS.map((h) =>
    screen.getByRole('button', { name: new RegExp(h.label, 'i') }));
  for (let i = 0; i < 12; i++) fireEvent.click(btns[i % 3]);
  assert.equal(screen.getAllByRole('region').length, 1);
  assert.ok(screen.queryByRole('region', { name: PANEL_TITLES.work }));
});

test('the selected hotspot reports pressed state, not colour alone', () => {
  render(<StudioStage />);
  const btn = screen.getByRole('button', { name: /AI in action/i });
  assert.equal(btn.getAttribute('aria-pressed'), 'false');
  fireEvent.click(btn);
  assert.equal(btn.getAttribute('aria-pressed'), 'true');
});

test('camera shots are distinct, so each hotspot moves the view', () => {
  const keys = ['overview', 'process', 'ai', 'work'] as const;
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
  for (const k of ['process', 'ai', 'work'] as const) {
    const s = CAMERA_SHOTS[k];
    const d = Math.hypot(
      s.position[0] - o.position[0],
      s.position[1] - o.position[1],
      s.position[2] - o.position[2],
    );
    assert.ok(d > 1.0, `${k} camera moves only ${d.toFixed(2)}m from overview`);
  }
});

test('the studio falls back without WebGL and keeps the hotspots usable', () => {
  const { container } = render(<StudioStage />);
  assert.ok(container.querySelector('img[src="/scene/poster.webp"]'),
            'expected the poster fallback in a renderer-less environment');
  assert.ok(screen.getByRole('button', { name: /Process & CRM/i }));
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
  for (const label of ['Work', 'Services', 'About']) {
    const link = nav.getAllByRole('link', { name: label })[0] as HTMLAnchorElement;
    assert.ok(link.getAttribute('href')?.startsWith('#'));
  }
});
