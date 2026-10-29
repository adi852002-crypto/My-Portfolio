/* Canvas-drawn textures for the screens in the studio.

   These are painted with the 2D canvas API and uploaded as CanvasTextures,
   so the monitor, the workflow board and the laptop show real moving content
   rather than a flat colour. No image files, no network. */

/* Palette, from the site tokens. Screens are warm white rather than blue,
   so the devices sit inside the ivory room instead of glowing out of it. */
const PAPER = '#FFFEFA';
const IVORY = '#F7F5EF';
const CREAM = '#F1EDE2';
const SAGE = '#46563C';
const SAGE_SOFT = '#E3E7DA';
const SAGE_MID = '#9CAC8C';
const INK = '#172018';
const INK_SOFT = '#5A6157';
const BRASS = '#B89961';
const HAIRLINE = '#E2E0D7';

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


/* Every screen is drawn on a warm-white sheet with the same type scale, so
   the three devices read as one interface family. Text is kept to headings
   and short labels: the detail lives in the HTML panel each one opens. */
function sheet(c: CanvasRenderingContext2D, W: number, H: number) {
  c.fillStyle = PAPER;
  c.fillRect(0, 0, W, H);
}

function title(c: CanvasRenderingContext2D, text: string, sub: string, x: number, y: number, size = 34) {
  c.fillStyle = INK;
  c.font = `500 ${size}px Georgia, serif`;
  c.fillText(text, x, y);
  c.fillStyle = INK_SOFT;
  c.font = `${Math.round(size * 0.52)}px system-ui, sans-serif`;
  c.fillText(sub, x, y + Math.round(size * 0.84));
}

/* ---------- Monitor: a four-step automation flow, one step active -------- */
export function monitorPainter(): Painter {
  const W = 1024, H = 614;
  const canvas = make(W, H);
  const c = canvas.getContext('2d')!;
  const steps = ['New request', 'AI routes it', 'Right owner', 'Resolved'];

  return {
    canvas,
    draw(t) {
      sheet(c, W, H);
      title(c, 'A simple automation flow', 'sample flow — not a live service', 76, 118, 54);

      const active = Math.floor(t * 0.55) % steps.length;
      const boxW = 186, boxH = 176, gap = 52;
      const total = steps.length * boxW + (steps.length - 1) * gap;
      const x0 = (W - total) / 2;
      const y = 248;

      steps.forEach((label, i) => {
        const x = x0 + i * (boxW + gap);
        const on = i === active;

        c.fillStyle = on ? SAGE_SOFT : CREAM;
        roundRect(c, x, y, boxW, boxH, 20);
        c.fill();
        c.strokeStyle = on ? SAGE_MID : HAIRLINE;
        c.lineWidth = on ? 3 : 2;
        c.stroke();

        /* a simple glyph per step, drawn not written */
        c.save();
        c.translate(x + boxW / 2, y + boxH / 2 - 8);
        c.strokeStyle = on ? SAGE : '#8E9688';
        c.fillStyle = c.strokeStyle;
        c.lineWidth = 5;
        c.lineCap = 'round';
        c.lineJoin = 'round';
        if (i === 0) {                       // a document
          c.strokeRect(-25, -32, 50, 64);
          c.beginPath(); c.moveTo(-13, -12); c.lineTo(13, -12); c.moveTo(-13, 2); c.lineTo(13, 2);
          c.moveTo(-13, 16); c.lineTo(5, 16); c.stroke();
        } else if (i === 1) {                // a spark
          c.beginPath();
          for (const [sx, sy, r] of [[-2, -2, 32], [24, 22, 13]]) {
            c.moveTo(sx, sy - r);
            c.quadraticCurveTo(sx + r * 0.22, sy - r * 0.22, sx + r, sy);
            c.quadraticCurveTo(sx + r * 0.22, sy + r * 0.22, sx, sy + r);
            c.quadraticCurveTo(sx - r * 0.22, sy + r * 0.22, sx - r, sy);
            c.quadraticCurveTo(sx - r * 0.22, sy - r * 0.22, sx, sy - r);
          }
          c.fill();
        } else if (i === 2) {                // a person
          c.beginPath(); c.arc(0, -17, 15, 0, Math.PI * 2); c.stroke();
          c.beginPath(); c.moveTo(-25, 32); c.quadraticCurveTo(0, 0, 25, 32); c.stroke();
        } else {                             // a tick in a circle
          c.beginPath(); c.arc(0, 0, 30, 0, Math.PI * 2); c.stroke();
          c.beginPath(); c.moveTo(-14, 1); c.lineTo(-4, 13); c.lineTo(15, -11); c.stroke();
        }
        c.restore();

        c.fillStyle = on ? SAGE : INK_SOFT;
        c.font = '500 30px system-ui, sans-serif';
        c.textAlign = 'center';
        label.split('\n').forEach((line, k) => c.fillText(line, x + boxW / 2, y + boxH + 52 + k * 34));
        c.textAlign = 'left';

        if (i < steps.length - 1) {
          const ax = x + boxW + 16, ay = y + boxH / 2;
          c.strokeStyle = HAIRLINE;
          c.lineWidth = 3;
          c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + gap - 32, ay); c.stroke();
          c.beginPath();
          c.moveTo(ax + gap - 32, ay); c.lineTo(ax + gap - 44, ay - 8);
          c.moveTo(ax + gap - 32, ay); c.lineTo(ax + gap - 44, ay + 8);
          c.stroke();
        }
      });
    },
  };
}

/* ---------- Tablet: ownership moving from unclear to owned --------------- */
export function boardPainter(): Painter {
  const W = 768, H = 560;
  const canvas = make(W, H);
  const c = canvas.getContext('2d')!;
  const steps = [
    ['Customer request', 'arrives in one place'],
    ['Triage & assign', 'one named owner'],
    ['Resolve', 'owned end to end'],
  ];

  return {
    canvas,
    draw(t) {
      sheet(c, W, H);
      title(c, 'Ownership flow', 'illustrative', 54, 100, 50);

      const lit = Math.floor(t * 0.5) % steps.length;
      steps.forEach(([head, sub], i) => {
        const y = 196 + i * 122;
        const on = i === lit;
        c.fillStyle = on ? SAGE_SOFT : CREAM;
        roundRect(c, 54, y, W - 108, 100, 18);
        c.fill();
        c.strokeStyle = on ? SAGE_MID : HAIRLINE;
        c.lineWidth = on ? 3 : 2;
        c.stroke();

        c.fillStyle = on ? SAGE : '#A5AD9C';
        c.beginPath();
        c.arc(102, y + 50, 18, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = PAPER;
        c.font = '500 21px system-ui, sans-serif';
        c.textAlign = 'center';
        c.fillText(String(i + 1), 102, y + 57);
        c.textAlign = 'left';

        c.fillStyle = INK;
        c.font = '500 33px system-ui, sans-serif';
        c.fillText(head, 142, y + 44);
        c.fillStyle = INK_SOFT;
        c.font = '25px system-ui, sans-serif';
        c.fillText(sub, 142, y + 80);

        if (i < steps.length - 1) {
          c.strokeStyle = HAIRLINE;
          c.lineWidth = 3;
          c.beginPath(); c.moveTo(102, y + 100); c.lineTo(102, y + 122); c.stroke();
        }
      });
    },
  };
}

/* ---------- Laptop: three selected-work previews ------------------------- */
export function laptopPainter(): Painter {
  const W = 1024, H = 656;
  const canvas = make(W, H);
  const c = canvas.getContext('2d')!;
  const cards = [
    ['Dynamic Travels', 'Business transformation'],
    ['TCS — Ultimatix', 'Escalation operations'],
    ['TCS — Telstra', 'Service delivery'],
  ];

  return {
    canvas,
    draw(t) {
      sheet(c, W, H);
      title(c, 'Selected work', 'past roles, not client engagements', 68, 110, 52);

      const lit = Math.floor(t * 0.45) % cards.length;
      const cardW = 272, gap = 30, y = 212;
      const x0 = (W - (cards.length * cardW + (cards.length - 1) * gap)) / 2;

      cards.forEach(([head, sub], i) => {
        const x = x0 + i * (cardW + gap);
        const on = i === lit;

        c.fillStyle = on ? SAGE_SOFT : CREAM;
        roundRect(c, x, y, cardW, 180, 18);
        c.fill();
        /* a quiet abstraction of a screen, never a fabricated photograph */
        c.strokeStyle = on ? SAGE_MID : HAIRLINE;
        c.lineWidth = 3;
        for (let k = 0; k < 4; k++) {
          const ly = y + 46 + k * 32;
          c.beginPath();
          c.moveTo(x + 34, ly);
          c.lineTo(x + cardW - 34 - (k % 2 ? 62 : 0), ly);
          c.stroke();
        }
        c.strokeStyle = on ? SAGE_MID : HAIRLINE;
        c.lineWidth = 2;
        roundRect(c, x, y, cardW, 180, 18);
        c.stroke();

        c.fillStyle = INK;
        c.font = '500 32px system-ui, sans-serif';
        c.fillText(head, x, y + 234);
        c.fillStyle = INK_SOFT;
        c.font = '25px system-ui, sans-serif';
        c.fillText(sub, x, y + 272);

        c.strokeStyle = on ? SAGE : '#A5AD9C';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(x, y + 312); c.lineTo(x + 34, y + 312);
        c.moveTo(x + 25, y + 304); c.lineTo(x + 34, y + 312); c.lineTo(x + 25, y + 320);
        c.stroke();
      });
    },
  };
}

/* ---------- Notebook: services on the left, the four steps on the right -- */
export function notebookPainter(): Painter {
  const W = 896, H = 600;
  const canvas = make(W, H);
  const c = canvas.getContext('2d')!;
  const services = ['Simpler systems', 'Better experiences', 'AI that helps people', 'More room to grow'];

  return {
    canvas,
    draw(t) {
      c.fillStyle = '#FCFAF3';
      c.fillRect(0, 0, W, H);

      const g = c.createLinearGradient(W / 2 - 30, 0, W / 2 + 30, 0);
      g.addColorStop(0, 'rgba(176,164,138,0)');
      g.addColorStop(0.5, 'rgba(150,138,112,0.3)');
      g.addColorStop(1, 'rgba(176,164,138,0)');
      c.fillStyle = g;
      c.fillRect(W / 2 - 30, 0, 60, H);

      c.strokeStyle = 'rgba(170,178,160,0.38)';
      c.lineWidth = 1.5;
      for (let y = 120; y < H - 40; y += 46) {
        for (const [x0, x1] of [[56, W / 2 - 44], [W / 2 + 44, W - 56]]) {
          c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke();
        }
      }

      /* left page — a short hand-written list */
      c.fillStyle = INK_SOFT;
      c.font = 'italic 30px Georgia, serif';
      services.forEach((line, i) => c.fillText(`— ${line}`, 72, 152 + i * 92));

      /* right page — the four steps of an engagement */
      const x = W / 2 + 44;
      c.fillStyle = SAGE;
      c.font = '500 28px Georgia, serif';
      c.fillText('How it runs', x, 92);

      const steps = ['Understand', 'Simplify', 'Implement', 'Improve'];
      const lit = Math.floor(t * 0.6) % steps.length;
      steps.forEach((s, i) => {
        const y = 166 + i * 92;
        const on = i === lit;
        c.fillStyle = on ? SAGE : '#8C9482';
        c.font = '500 18px system-ui, sans-serif';
        c.fillText(`0${i + 1}`, x, y);
        c.fillStyle = INK;
        c.font = 'italic 27px Georgia, serif';
        c.fillText(s, x + 48, y);
      });
    },
  };
}

/* ---------- Oak: a quiet grain, drawn once -------------------------------
   Two variants, so the top and the legs are not the same stretched image. */
export function oakGrainCanvas(seed = 20260429, lines = 170): HTMLCanvasElement {
  const W = 1024, H = 512;
  const canvas = make(W, H);
  const c = canvas.getContext('2d')!;

  c.fillStyle = '#E4D6BE';
  c.fillRect(0, 0, W, H);

  let s = seed;
  const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);

  for (let i = 0; i < lines; i++) {
    const y0 = rand() * H;
    const amp = 1.5 + rand() * 5;
    const period = 300 + rand() * 520;
    const phase = rand() * Math.PI * 2;
    const dark = rand() > 0.42;
    c.strokeStyle = dark
      ? `rgba(166,142,105,${0.05 + rand() * 0.1})`
      : `rgba(246,236,218,${0.06 + rand() * 0.12})`;
    c.lineWidth = 0.6 + rand() * 1.8;
    c.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y = y0 + Math.sin((x / period) * Math.PI * 2 + phase) * amp;
      x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.stroke();
  }

  for (let i = 0; i < 4; i++) {
    const cx = rand() * W, cy = rand() * H, r = 8 + rand() * 16;
    for (let k = 0; k < 4; k++) {
      c.strokeStyle = `rgba(164,138,98,${0.09 - k * 0.02})`;
      c.lineWidth = 1.1;
      c.beginPath();
      c.ellipse(cx, cy, r + k * 5, (r + k * 5) * 0.4, 0.35, 0, Math.PI * 2);
      c.stroke();
    }
  }
  return canvas;
}

/* ---------- A single leaf, as colour plus alpha --------------------------
   Used on small planes so the plant has real leaf shapes instead of
   faceted blobs, at a few dozen triangles rather than a few thousand. */
export function leafCanvas(): HTMLCanvasElement {
  const W = 256, H = 256;
  const canvas = make(W, H);
  const c = canvas.getContext('2d')!;
  c.clearRect(0, 0, W, H);

  /* a pointed oval, drawn around the vertical midline */
  c.beginPath();
  c.moveTo(128, 14);
  c.bezierCurveTo(206, 76, 210, 168, 128, 244);
  c.bezierCurveTo(46, 168, 50, 76, 128, 14);
  c.closePath();
  const g = c.createLinearGradient(40, 0, 216, 0);
  g.addColorStop(0, '#6E8A5E');
  g.addColorStop(0.42, '#87A373');
  g.addColorStop(1, '#5E7A50');
  c.fillStyle = g;
  c.fill();

  /* midrib and a few veins, kept faint */
  c.strokeStyle = 'rgba(248,250,240,0.45)';
  c.lineWidth = 4;
  c.beginPath(); c.moveTo(128, 26); c.lineTo(128, 236); c.stroke();
  c.lineWidth = 2;
  for (let i = 1; i <= 5; i++) {
    const y = 48 + i * 32;
    c.beginPath(); c.moveTo(128, y); c.quadraticCurveTo(160, y + 4, 182, y + 26); c.stroke();
    c.beginPath(); c.moveTo(128, y); c.quadraticCurveTo(96, y + 4, 74, y + 26); c.stroke();
  }
  return canvas;
}

/* ---------- Ground: the room floor, all but indistinguishable from the
   page behind it, fading out well inside the frame so the scene never
   reads as a rectangle and nothing is hazed over. --------------------- */
export function floorCanvas(): HTMLCanvasElement {
  const S = 512;
  const canvas = make(S, S);
  const c = canvas.getContext('2d')!;
  c.clearRect(0, 0, S, S);

  const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0.00, 'rgba(241,238,229,1)');
  g.addColorStop(0.42, 'rgba(243,240,232,1)');
  g.addColorStop(0.68, 'rgba(246,244,237,0.76)');
  g.addColorStop(0.86, 'rgba(247,245,239,0.3)');
  g.addColorStop(1.00, 'rgba(247,245,239,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, S, S);
  return canvas;
}
