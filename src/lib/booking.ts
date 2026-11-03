import { PROFILE, type Track } from '@/data/site';

/* Where "Book a call" goes.

   There is no scheduling page yet, and inventing a calendar URL would send
   people to a 404, so until `PROFILE.bookingUrl` is set every booking
   button lands on the contact form with the right intent and the track
   already chosen. The form hands the message to the visitor's own email
   app and says so — nothing here pretends a slot has been held.

   The day a real Cal.com or Calendly page exists, set PROFILE.bookingUrl
   and every button on the site follows it. Nothing else changes. */
export function bookingHref(track?: Pick<Track, 'id' | 'intent'>) {
  if (PROFILE.bookingUrl) return PROFILE.bookingUrl;
  const params = new URLSearchParams({ intent: track?.intent ?? 'discovery-call' });
  if (track) params.set('track', track.id);
  return `/contact/?${params.toString()}`;
}

/** True once a real calendar is wired up, so copy can stop hedging. */
export const hasCalendar = Boolean(PROFILE.bookingUrl);
