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
import { Studio, StudioButtons } from '../src/components/Studio';
import { HOTSPOTS } from '../src/data/site';

test.afterEach(() => cleanup());

/* ---------------- hotspots ---------------- */

test('every hotspot renders a real button with a visible label and fires its id', () => {
  const fired: string[] = [];
  render(<Studio onHotspot={(id) => fired.push(id)} />);

  for (const h of HOTSPOTS) {
    const btn = screen.getByRole('button', { name: new RegExp(h.label, 'i') });
    assert.equal(btn.tagName, 'BUTTON', `${h.label} must be a button, not a div`);
    assert.ok(btn.textContent?.includes(h.label), `${h.label} needs a visible text label`);
    fireEvent.click(btn);
  }
  assert.deepEqual(fired, HOTSPOTS.map((h) => h.id));
});

test('rapid switching between hotspots is safe and does not lose any click', () => {
  const fired: string[] = [];
  render(<Studio onHotspot={(id) => fired.push(id)} />);
  const [a, b, c] = HOTSPOTS.map((h) =>
    screen.getByRole('button', { name: new RegExp(h.label, 'i') }));
  for (let i = 0; i < 12; i++) fireEvent.click([a, b, c][i % 3]);
  assert.equal(fired.length, 12);
});

test('the mobile fallback offers the same three destinations', () => {
  const fired: string[] = [];
  render(<StudioButtons onHotspot={(id) => fired.push(id)} />);
  assert.equal(screen.getAllByRole('button').length, HOTSPOTS.length);
  fireEvent.click(screen.getByRole('button', { name: /Selected work/i }));
  assert.deepEqual(fired, ['work']);
});

test('the scene falls back to a message if its art fails to load', () => {
  const { container } = render(<Studio onHotspot={() => {}} />);
  const poster = container.querySelector('img[src="/scene/poster.webp"]')!;
  fireEvent.error(poster);
  assert.match(container.textContent ?? '', /could not load/i);
  // hotspots survive the failure
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
