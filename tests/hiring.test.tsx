/* The third door. A recruiter's panel has one job — say what the role
   search is, and put the CV one click away — and one hard rule: it must
   not publish anything the CV does not carry.
   Run: npm test                                                        */
import './setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { render, screen, cleanup } from '@testing-library/react';

import { HiringPanel } from '../src/components/HiringPanel';
import { HIRING, PROFILE } from '../src/data/site';

test.afterEach(() => cleanup());

test('the recruiter panel says what is wanted and where', () => {
  render(<HiringPanel />);
  assert.ok(screen.getByText(HIRING.promise));
  assert.ok(screen.getByText(HIRING.where));
  for (const l of HIRING.looking) assert.ok(screen.getByText(l));
});

test('the CV is one click away, and so is a reply', () => {
  render(<HiringPanel />);
  const cv = screen.getByRole('link', { name: /Download the CV/i });
  assert.equal(cv.getAttribute('href'), PROFILE.resumeUrl);
  assert.ok(cv.hasAttribute('download'));
  assert.match(screen.getByRole('link', { name: /Email me about a role/i })
    .getAttribute('href') ?? '', new RegExp(`^mailto:${PROFILE.email}`));
});

test('it claims no credential the CV does not carry', () => {
  render(<HiringPanel />);
  const text = document.body.textContent ?? '';
  for (const banned of ['Lean Six Sigma', 'PMP', 'PRINCE2', 'ITIL', 'Zoho'])
    assert.doesNotMatch(text, new RegExp(banned, 'i'), `${banned} is not on the CV`);
});

test('it names no salary, no notice period and no employer he approached', () => {
  render(<HiringPanel />);
  const text = document.body.textContent ?? '';
  assert.doesNotMatch(text, /salary|USD|\$|₹|lakh|CTC|notice period/i);
  /* Companies he has applied to or interviewed with are private; only
     employers from the work history may appear anywhere on the site. */
  assert.doesNotMatch(text, /Morgan Stanley|Viceroy|Toptal|Deel/i);
});
