/* Canvas-drawn textures for the Transformation Desk.

   Painted with the 2D canvas API and uploaded as CanvasTextures, so the
   devices show real interfaces rather than a flat colour. No image files
   and no network. Type is sized for the physical screen: the laptop panel
   is 0.30m wide at 1024px, so 28px here reads like 8mm of real type.

   Screens stay deliberately sparse. Detail belongs in the HTML panel the
   object opens, not crammed onto a 3D surface. */

const IVORY = '#0F140F';   // the page behind the scene
const PAPER = '#F6F3EA';
const SAGE = '#46563C';
const SAGE_SOFT = '#D9E0CB';
const SAGE_MID = '#9FB08F';
const INK = '#172018';
const INK_SOFT = '#5B6258';
const BRASS = '#B89961';
const HAIRLINE = '#CFCDC2';

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

/** A soft arrow between two steps. */
function arrow(c: CanvasRenderingContext2D, x: number, y: number, len: number, colour: string) {
  c.strokeStyle = colour;
  c.lineWidth = 3;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + len - 9, y);
  c.stroke();
  c.beginPath();
  c.moveTo(x + len - 14, y - 6);
  c.lineTo(x + len - 6, y);
  c.lineTo(x + len - 14, y + 6);
  c.stroke();
}

/* ---------- Laptop: three selected-work previews -------------------------- */
export function laptopPainter(): Painter {
  const W = 1024, H = 660;
  const canvas = make(W, H);
  const c = canvas.getContext('2d')!;

  const cards = [
    { title: 'Retail operations',  sub: 'Simpler processes' },
    { title: 'CRM transformation', sub: 'One joined-up view' },
    { title: 'AI in action',       sub: 'Practical automation' },
  ];

  /* Deterministic abstract thumbnails: a tinted field with a few bars. */
  function thumb(x: number, y: number, w: number, h: number, i: number) {
    const g = c.createLinearGradient(x, y, x + w, y + h);
    const tints = [['#E7EADF', '#CFD9C2'], ['#E4E9EC', '#C9D6DA'], ['#EFE7D8', '#DCCCAE']][i];
    g.addColorStop(0, tints[0]);
    g.addColorStop(1, tints[1]);
    roundRect(c, x, y, w, h, 10);
    c.fillStyle = g;
    c.fill();

    c.save();
    roundRect(c, x, y, w, h, 10);
    c.clip();
    c.fillStyle = 'rgba(70,86,60,0.26)';
    const bars = [[0.18, 0.46], [0.36, 0.3], [0.54, 0.62], [0.72, 0.4]];
    for (const [fx, fh] of bars) {
      const bh = h * fh * 0.72;
      roundRect(c, x + w * fx, y + h - 18 - bh, w * 0.1, bh, 4);
      c.fill();
    }
    c.restore();
  }

  return {
    canvas,
    draw(t) {
      c.fillStyle = PAPER;
      c.fillRect(0, 0, W, H);

      c.fillStyle = SAGE;
      c.font = '500 44px Georgia, serif';
      c.fillText('Selected work', 64, 104);
      c.fillStyle = INK_SOFT;
      c.font = '26px system-ui, sans-serif';
      c.fillText('Three roles, three kinds of change', 64, 146);

      c.strokeStyle = HAIRLINE;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(64, 180);
      c.lineTo(W - 64, 180);
      c.stroke();

      const lit = Math.floor(t * 0.4) % cards.length;
      const cw = 272, gap = 24, x0 = 64;
      cards.forEach((card, i) => {
        const x = x0 + i * (cw + gap);
        const on = i === lit;
        roundRect(c, x - 14, 214, cw + 28, 356, 14);
        c.fillStyle = on ? SAGE_SOFT : 'rgba(0,0,0,0)';
        c.fill();

        thumb(x, 230, cw, 176, i);

        c.fillStyle = INK;
        c.font = '500 28px system-ui, sans-serif';
        c.fillText(card.title, x, 452);
        c.fillStyle = INK_SOFT;
        c.font = '24px system-ui, sans-serif';
        c.fillText(card.sub, x, 488);

        c.strokeStyle = on ? SAGE : SAGE_MID;
        arrow(c, x, 528, 36, on ? SAGE : SAGE_MID);
      });
    },
  };
}

/* ---------- Tablet: a three-step ownership flow --------------------------- */
export function tabletPainter(): Painter {
  const W = 1024, H = 700;
  const canvas = make(W, H);
  const c = canvas.getContext('2d')!;
  const steps = ['Customer\nrequest', 'Triage\n& assign', 'Resolve\n& confirm'];

  return {
    canvas,
    draw(t) {
      c.fillStyle = PAPER;
      c.fillRect(0, 0, W, H);

      c.fillStyle = SAGE;
      c.font = '500 46px Georgia, serif';
      c.fillText('Ownership flow', 62, 110);
      c.fillStyle = INK_SOFT;
      c.font = '26px system-ui, sans-serif';
      c.fillText('example', 62, 152);

      const lit = Math.floor(t * 0.5) % steps.length;
      const bw = 258, bh = 182, gap = 42, y = 236;
      steps.forEach((label, i) => {
        const x = 62 + i * (bw + gap);
        const on = i === lit;
        roundRect(c, x, y, bw, bh, 16);
        c.fillStyle = on ? SAGE_SOFT : '#ECE9DE';
        c.fill();
        c.strokeStyle = on ? SAGE : HAIRLINE;
        c.lineWidth = on ? 3 : 2;
        c.stroke();

        c.fillStyle = on ? SAGE : SAGE_MID;
        c.font = '500 24px system-ui, sans-serif';
        c.fillText(`0${i + 1}`, x + 26, y + 48);

        c.fillStyle = INK;
        c.font = '500 32px system-ui, sans-serif';
        label.split('\n').forEach((line, k) => c.fillText(line, x + 26, y + 100 + k * 40));

        if (i < steps.length - 1) arrow(c, x + bw + 8, y + bh / 2, gap - 16, SAGE_MID);
      });

      /* the point of the whole thing, in one line */
      c.strokeStyle = SAGE_MID;
      c.lineWidth = 2.5;
      c.setLineDash([7, 7]);
      c.beginPath();
      c.moveTo(62, 492);
      c.lineTo(W - 62, 492);
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = SAGE;
      c.font = '500 30px system-ui, sans-serif';
      c.fillText('One owner, end to end', 62, 552);
      c.fillStyle = INK_SOFT;
      c.font = '25px system-ui, sans-serif';
      c.fillText('No step without a name against it', 62, 594);
    },
  };
}

/* ---------- Monitor: a four-step automation flow -------------------------- */
export function monitorPainter(): Painter {
  const W = 1152, H = 672;
  const canvas = make(W, H);
  const c = canvas.getContext('2d')!;

  const steps = [
    { label: 'New request',     glyph: 'doc' },
    { label: 'Classify\n& route', glyph: 'spark' },
    { label: 'Right owner',     glyph: 'person' },
    { label: 'Faster close',    glyph: 'check' },
  ];

  function glyph(kind: string, x: number, y: number, on: boolean) {
    c.save();
    c.translate(x, y);
    c.strokeStyle = on ? SAGE : '#7E8A74';
    c.fillStyle = on ? SAGE : '#7E8A74';
    c.lineWidth = 3.4;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    if (kind === 'doc') {
      c.beginPath(); c.moveTo(-13, -17); c.lineTo(6, -17); c.lineTo(14, -9);
      c.lineTo(14, 17); c.lineTo(-13, 17); c.closePath(); c.stroke();
      c.beginPath(); c.moveTo(-6, -2); c.lineTo(7, -2); c.moveTo(-6, 8); c.lineTo(7, 8); c.stroke();
    } else if (kind === 'spark') {
      c.beginPath();
      c.moveTo(0, -18); c.lineTo(4.5, -4.5); c.lineTo(18, 0); c.lineTo(4.5, 4.5);
      c.lineTo(0, 18); c.lineTo(-4.5, 4.5); c.lineTo(-18, 0); c.lineTo(-4.5, -4.5);
      c.closePath(); c.fill();
    } else if (kind === 'person') {
      c.beginPath(); c.arc(0, -8, 7.5, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(-13, 17); c.quadraticCurveTo(0, 2, 13, 17); c.stroke();
    } else {
      c.beginPath(); c.arc(0, 0, 16, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(-7, 0); c.lineTo(-2, 6); c.lineTo(8, -6); c.stroke();
    }
    c.restore();
  }

  return {
    canvas,
    draw(t) {
      c.fillStyle = PAPER;
      c.fillRect(0, 0, W, H);

      c.fillStyle = SAGE;
      c.font = '500 48px Georgia, serif';
      c.fillText('A simple automation flow', 74, 118);
      c.fillStyle = INK_SOFT;
      c.font = '27px system-ui, sans-serif';
      c.fillText('example · a person still approves', 74, 162);

      const lit = Math.floor(t * 0.55) % steps.length;
      const bw = 206, gap = 44, y = 250, bh = 240;
      steps.forEach((s, i) => {
        const x = 74 + i * (bw + gap);
        const on = i === lit;
        roundRect(c, x, y, bw, bh, 18);
        c.fillStyle = on ? SAGE_SOFT : '#ECE9DE';
        c.fill();
        c.strokeStyle = on ? SAGE : HAIRLINE;
        c.lineWidth = on ? 3 : 2;
        c.stroke();

        glyph(s.glyph, x + bw / 2, y + 74, on);

        c.fillStyle = INK;
        c.font = '500 28px system-ui, sans-serif';
        c.textAlign = 'center';
        s.label.split('\n').forEach((line, k) =>
          c.fillText(line, x + bw / 2, y + 150 + k * 36));
        c.textAlign = 'left';

        if (i < steps.length - 1) arrow(c, x + bw + 10, y + bh / 2, gap - 20, SAGE_MID);
      });

      c.fillStyle = BRASS;
      c.beginPath();
      c.arc(80, 596, 7, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = INK_SOFT;
      c.font = '26px system-ui, sans-serif';
      c.fillText('Sample data. Nothing is sent anywhere.', 100, 605);
    },
  };
}

/* ---------- Notebook: handwriting, not readable copy ---------------------- */
export function notebookPainter(): Painter {
  const W = 768, H = 540;
  const canvas = make(W, H);
  const c = canvas.getContext('2d')!;
  let painted = false;

  return {
    canvas,
    draw() {
      if (painted) return;
      painted = true;

      c.fillStyle = '#FCFAF4';
      c.fillRect(0, 0, W, H);

      /* ruled lines */
      c.strokeStyle = 'rgba(160,170,150,0.34)';
      c.lineWidth = 1.6;
      for (let y = 96; y < H - 40; y += 46) {
        c.beginPath(); c.moveTo(52, y); c.lineTo(W - 52, y); c.stroke();
      }

      /* four short handwritten notes — deliberately not legible copy */
      let s = 424242;
      const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
      c.strokeStyle = 'rgba(40,52,38,0.55)';
      c.lineWidth = 3;
      c.lineCap = 'round';
      for (let line = 0; line < 4; line++) {
        const y = 86 + line * 46;
        let x = 68;
        const end = 68 + 360 + rand() * 230;
        c.beginPath();
        c.moveTo(x, y);
        while (x < end) {
          const dx = 7 + rand() * 7;
          c.quadraticCurveTo(x + dx / 2, y - 7 - rand() * 7, x + dx, y - rand() * 3);
          x += dx;
        }
        c.stroke();
        /* a small bullet dash in front of each */
        c.beginPath(); c.moveTo(52, y - 5); c.lineTo(62, y - 5); c.stroke();
      }
    },
  };
}

/* ---------- Oak: a quiet grain, scaled to the real desk ------------------- */
export function oakGrainCanvas(): HTMLCanvasElement {
  const W = 1024, H = 512;
  const canvas = make(W, H);
  const c = canvas.getContext('2d')!;

  c.fillStyle = '#C9B48F';
  c.fillRect(0, 0, W, H);

  let s = 20261029;
  const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);

  for (let i = 0; i < 190; i++) {
    const y0 = rand() * H;
    const amp = 1.5 + rand() * 5;
    const period = 300 + rand() * 520;
    const phase = rand() * Math.PI * 2;
    c.strokeStyle = rand() > 0.42
      ? `rgba(176,148,110,${0.05 + rand() * 0.1})`
      : `rgba(246,234,214,${0.06 + rand() * 0.11})`;
    c.lineWidth = 0.6 + rand() * 1.7;
    c.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y = y0 + Math.sin((x / period) * Math.PI * 2 + phase) * amp;
      x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.stroke();
  }

  for (let i = 0; i < 3; i++) {
    const cx = rand() * W, cy = rand() * H, r = 8 + rand() * 14;
    for (let k = 0; k < 4; k++) {
      c.strokeStyle = `rgba(172,142,100,${0.09 - k * 0.02})`;
      c.lineWidth = 1.1;
      c.beginPath();
      c.ellipse(cx, cy, r + k * 4, (r + k * 4) * 0.4, 0.35, 0, Math.PI * 2);
      c.stroke();
    }
  }
  return canvas;
}

/* ---------- Ground: travertine that becomes the page ----------------------
   The studio is suggested, not walled. The ground fades to the exact page
   colour inside the frame, so the scene has no rectangular boundary and no
   screen-space haze is needed over the furniture.                          */
export function floorCanvas(): HTMLCanvasElement {
  const S = 512;
  const canvas = make(S, S);
  const c = canvas.getContext('2d')!;
  c.clearRect(0, 0, S, S);

  const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0.00, 'rgba(238,233,221,1)');
  g.addColorStop(0.22, 'rgba(239,235,223,0.95)');
  g.addColorStop(0.40, 'rgba(242,238,229,0.66)');
  g.addColorStop(0.58, `${IVORY}47`);
  g.addColorStop(0.76, `${IVORY}12`);
  g.addColorStop(1.00, `${IVORY}00`);
  c.fillStyle = g;
  c.fillRect(0, 0, S, S);
  return canvas;
}
