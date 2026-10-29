/* Canvas-drawn textures for the screens in the studio.

   These are painted with the 2D canvas API and uploaded as CanvasTextures,
   so the monitor, the workflow board and the laptop show real moving content
   rather than a flat colour. No image files, no network. */

const IVORY = '#F4F1E8';
const CREAM = '#EFE9DC';
const SAGE = '#46563C';
const SAGE_MID = '#8A9A7C';
const SAGE_SOFT = '#C7D2B8';
const INK = '#2A3328';
const BRASS = '#B89961';
const SCREEN_BG = '#E6EEF2';
const SCREEN_LINE = '#8FA9B6';
const SCREEN_NODE = '#BBD2DE';

export type Painter = {
  canvas: HTMLCanvasElement;
  draw: (t: number) => void;
};

function make(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function roundRect(
  c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number,
) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/* ---------- Monitor: an automation flow with a packet travelling it ------- */
export function monitorPainter(): Painter {
  const W = 768, H = 448;
  const canvas = make(W, H);
  const c = canvas.getContext('2d')!;

  const nodes = [
    { x: 70,  y: 150, w: 150, h: 64, label: 'Request in' },
    { x: 300, y: 150, w: 150, h: 64, label: 'Categorise' },
    { x: 530, y: 150, w: 150, h: 64, label: 'Assign' },
    { x: 300, y: 282, w: 150, h: 64, label: 'Human check' },
    { x: 530, y: 282, w: 150, h: 64, label: 'Reply drafted' },
  ];
  const path = [0, 1, 2, 3, 4];

  return {
    canvas,
    draw(t) {
      c.fillStyle = SCREEN_BG;
      c.fillRect(0, 0, W, H);

      c.fillStyle = '#5E7A88';
      c.font = '500 22px Georgia, serif';
      c.fillText('Request handling', 70, 86);
      c.fillStyle = '#89A4B0';
      c.font = '16px system-ui, sans-serif';
      c.fillText('sample flow', 70, 112);

      // connectors
      c.strokeStyle = SCREEN_LINE;
      c.lineWidth = 3;
      for (let i = 0; i < path.length - 1; i++) {
        const a = nodes[path[i]], b = nodes[path[i + 1]];
        c.beginPath();
        c.moveTo(a.x + a.w, a.y + a.h / 2);
        if (a.y === b.y) {
          c.lineTo(b.x, b.y + b.h / 2);
        } else {
          const midX = a.x + a.w + 26;
          c.lineTo(midX, a.y + a.h / 2);
          c.lineTo(midX, b.y + b.h / 2);
          c.lineTo(b.x, b.y + b.h / 2);
        }
        c.stroke();
      }

      // which step is lit right now
      const step = Math.floor(t * 0.65) % path.length;

      nodes.forEach((n, i) => {
        const on = i === path[step];
        c.fillStyle = on ? SCREEN_NODE : '#F2F7F9';
        roundRect(c, n.x, n.y, n.w, n.h, 10);
        c.fill();
        c.strokeStyle = on ? '#6E93A3' : SCREEN_LINE;
        c.lineWidth = on ? 3 : 1.6;
        c.stroke();

        c.fillStyle = '#44606D';
        c.font = '500 19px system-ui, sans-serif';
        c.fillText(n.label, n.x + 16, n.y + 39);
      });

      // the human-check step gets a marker, because that is the point
      const hc = nodes[3];
      c.fillStyle = BRASS;
      c.beginPath();
      c.arc(hc.x - 16, hc.y + hc.h / 2, 7, 0, Math.PI * 2);
      c.fill();
    },
  };
}

/* ---------- Workflow board: unclear handoffs resolving into ownership ----- */
export function boardPainter(): Painter {
  const W = 768, H = 384;
  const canvas = make(W, H);
  const c = canvas.getContext('2d')!;

  const before = [
    { x: 60,  y: 120 }, { x: 240, y: 92  }, { x: 420, y: 150 },
    { x: 600, y: 104 }, { x: 150, y: 250 }, { x: 470, y: 264 },
  ];
  const after = [
    { x: 60,  y: 170 }, { x: 240, y: 170 }, { x: 420, y: 170 }, { x: 600, y: 170 },
  ];
  const labels = ['Intake', 'Triage', 'Resolve', 'Confirm'];

  return {
    canvas,
    draw(t) {
      // 0 → tangled, 1 → ordered, easing back and forth with a pause at each end
      const cycle = (t * 0.22) % 2;
      const raw = cycle < 1 ? cycle : 2 - cycle;
      const k = Math.max(0, Math.min(1, (raw - 0.18) / 0.64));
      const e = k * k * (3 - 2 * k);

      c.fillStyle = CREAM;
      c.fillRect(0, 0, W, H);

      c.fillStyle = SAGE;
      c.font = '500 24px Georgia, serif';
      c.fillText('Process map', 56, 62);
      c.fillStyle = '#8B9382';
      c.font = '15px system-ui, sans-serif';
      c.fillText('illustrative', 56, 86);

      const pos = (i: number) => {
        const b = before[i];
        const a = after[Math.min(i, after.length - 1)];
        const fade = i >= after.length ? 1 - e : 0;   // extra nodes dissolve
        return {
          x: b.x + (a.x - b.x) * e,
          y: b.y + (a.y - b.y) * e,
          alpha: i >= after.length ? Math.max(0, 1 - e * 1.6) : 1,
          fade,
        };
      };

      // connectors
      c.strokeStyle = `rgba(138,154,124,${0.35 + 0.5 * e})`;
      c.lineWidth = 2.5 + e;
      for (let i = 0; i < before.length - 1; i++) {
        const p = pos(i), q = pos(i + 1);
        if (p.alpha < 0.06 || q.alpha < 0.06) continue;
        c.beginPath();
        c.moveTo(p.x + 118, p.y + 26);
        c.lineTo(q.x, q.y + 26);
        c.stroke();
      }

      before.forEach((_, i) => {
        const p = pos(i);
        if (p.alpha < 0.04) return;
        c.globalAlpha = p.alpha;
        c.fillStyle = e > 0.5 ? SAGE_SOFT : '#DCE4D2';
        roundRect(c, p.x, p.y, 118, 52, 8);
        c.fill();
        c.strokeStyle = SAGE_MID;
        c.lineWidth = 1.8;
        c.stroke();

        c.fillStyle = INK;
        c.font = '500 17px system-ui, sans-serif';
        if (i < after.length) {
          c.globalAlpha = p.alpha * e;
          c.fillText(labels[i], p.x + 14, p.y + 24);
          c.globalAlpha = p.alpha;
          c.fillStyle = e > 0.5 ? SAGE : '#9AA391';
          c.font = '14px system-ui, sans-serif';
          c.fillText(e > 0.5 ? 'has an owner' : 'owner?', p.x + 14, p.y + 42);
        } else {
          c.fillStyle = '#9AA391';
          c.font = '14px system-ui, sans-serif';
          c.fillText('owner?', p.x + 14, p.y + 32);
        }
        c.globalAlpha = 1;
      });
    },
  };
}

/* ---------- Laptop: a quiet list, suggesting the work pages --------------- */
export function laptopPainter(): Painter {
  const W = 640, H = 400;
  const canvas = make(W, H);
  const c = canvas.getContext('2d')!;

  return {
    canvas,
    draw(t) {
      c.fillStyle = IVORY;
      c.fillRect(0, 0, W, H);

      c.fillStyle = SAGE;
      c.font = '500 26px Georgia, serif';
      c.fillText('Selected work', 48, 74);

      const rows = ['Dynamic Travels', 'TCS — Ultimatix', 'TCS — Telstra Australia'];
      const lit = Math.floor(t * 0.5) % rows.length;
      rows.forEach((r, i) => {
        const y = 118 + i * 78;
        c.fillStyle = i === lit ? '#E6EADF' : '#FBFAF5';
        roundRect(c, 44, y, W - 88, 60, 10);
        c.fill();
        c.strokeStyle = '#DADDD2';
        c.lineWidth = 1.5;
        c.stroke();

        c.fillStyle = INK;
        c.font = '500 20px system-ui, sans-serif';
        c.fillText(r, 64, y + 29);
        c.fillStyle = '#8B9382';
        c.font = '15px system-ui, sans-serif';
        c.fillText('past work', 64, y + 49);
      });
    },
  };
}
