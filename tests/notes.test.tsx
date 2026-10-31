/* The sticky notes' half of the bargain. The notes themselves are 3D and
   jsdom cannot render them, but what they do when one is picked up is
   ordinary React — the walk-through opens on that request and starts
   itself — and that is the part that can break.
   Run: npm test                                                        */
import './setup';
import { setMedia } from './setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { render, screen, cleanup } from '@testing-library/react';

import { AiDemo } from '../src/components/AiDemo';

/* Reduced motion makes the walk-through land in one go, so there is nothing
   to wait for and no timer left behind. */
const STILL = { '(prefers-reduced-motion: reduce)': true, '(pointer: fine)': true };
test.beforeEach(() => setMedia(STILL));
test.afterEach(() => cleanup());

test('the walk-through opens on the request the note was about', () => {
  render(<AiDemo seed={1} />);
  assert.equal(screen.getByRole('button', { name: /Access request/i })
    .getAttribute('aria-pressed'), 'true');
  for (const other of ['Billing query', 'Account change'])
    assert.equal(screen.getByRole('button', { name: new RegExp(other, 'i') })
      .getAttribute('aria-pressed'), 'false');
});

/* "Response prepared" is a step label and is always on the page; what says
   the run actually happened is the drafted reply underneath it. */
const REPLY = /Adding two users is straightforward/i;

test('a note arrives mid-run: picking it up is the instruction to run it', () => {
  render(<AiDemo seed={2} />);
  assert.match(document.body.textContent ?? '', REPLY);
});

test('opened on its own, the walk-through waits to be told', () => {
  render(<AiDemo />);
  assert.doesNotMatch(document.body.textContent ?? '', REPLY);
  assert.equal((document.body.textContent ?? '').match(/Waiting/g)?.length, 5,
    'every step is still waiting');
  assert.ok(screen.getByRole('button', { name: /Run demo/i }));
});

test('every request a note can point at is one of the samples', () => {
  for (const seed of [0, 1, 2]) {
    render(<AiDemo seed={seed} />);
    const pressed = screen.getAllByRole('button', { name: /query|request|change/i })
      .filter((b) => b.getAttribute('aria-pressed') === 'true');
    assert.equal(pressed.length, 1, `sample ${seed} selects exactly one request`);
    cleanup();
  }
});
