/* Minimal browser shims jsdom lacks. */
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html lang="en"><body></body></html>', {
  url: 'https://aniruddhadasgupta.pages.dev/',
  pretendToBeVisual: true,
});

const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
Object.defineProperty(g, 'navigator', {
  value: dom.window.navigator, writable: true, configurable: true,
});
g.HTMLElement = dom.window.HTMLElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.getComputedStyle = dom.window.getComputedStyle;
/* Node ships its own FormData/Event (undici). They reject jsdom nodes,
   so point the globals at jsdom's implementations. */
g.FormData = dom.window.FormData;
g.Event = dom.window.Event;
g.CustomEvent = dom.window.CustomEvent;
g.MouseEvent = dom.window.MouseEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.HTMLAnchorElement = dom.window.HTMLAnchorElement;

/* jsdom has no IntersectionObserver; the studio uses it to pause rendering.
   The stub reports the element as visible, which is the interesting case. */
class IO {
  constructor(private cb: (e: { isIntersecting: boolean }[]) => void) {}
  observe() { this.cb([{ isIntersecting: true }]); }
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
g.IntersectionObserver = IO;
dom.window.IntersectionObserver = IO;

/* jsdom has no ResizeObserver. The studio uses one to measure the space the
   page leaves for the scene; without a renderer there is nothing to measure,
   so a no-op is the right stand-in. */
class RO {
  constructor(_cb: () => void) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
g.ResizeObserver = RO;
dom.window.ResizeObserver = RO;
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0) as unknown as number;
g.cancelAnimationFrame = (id: number) => clearTimeout(id);
g.IS_REACT_ACT_ENVIRONMENT = true;

/* matchMedia: default to "motion is fine, fine pointer". Tests override. */
export function setMedia(map: Record<string, boolean>) {
  dom.window.matchMedia = ((q: string) => ({
    matches: map[q] ?? false,
    media: q,
    onchange: null,
    addListener() {}, removeListener() {},
    addEventListener() {}, removeEventListener() {},
    dispatchEvent() { return false; },
  })) as any;
  g.matchMedia = dom.window.matchMedia;
}
setMedia({
  '(prefers-reduced-motion: no-preference)': true,
  '(pointer: fine)': true,
});

/* scrollIntoView is not implemented in jsdom. */
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
