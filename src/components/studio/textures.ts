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

/* ---------- Laptop: customer success, what is offered and what was done --
   Two columns, because the distinction matters: on the left, what an
   engagement sets up; on the right, where that experience comes from. The
   right-hand column is roles held, never clients of a consultancy.      */
export function laptopPainter(): Painter {
  const W = 1024, H = 660;
  const canvas = make(W, H);
  const c = canvas.getContext('2d')!;

  const offers = ['Escalation frameworks', 'Onboarding workflows', 'Service review structures', 'Visibility into issues'];
  const done = ['Enterprise escalation ops', 'Liaison across HR, IT, Ariba', 'MIS and executive reporting', 'SLA, quality and coaching'];

  function column(x: number, heading: string, sub: string, items: string[], lit: number) {
    c.fillStyle = SAGE;
    c.font = '500 30px Georgia, serif';
    c.fillText(heading, x, 236);
    c.fillStyle = INK_SOFT;
    c.font = '21px system-ui, sans-serif';
    c.fillText(sub, x, 268);

    items.forEach((item, i) => {
      const y = 318 + i * 68;
      const on = i === lit;
      roundRect(c, x - 16, y - 34, 436, 54, 10);
      c.fillStyle = on ? SAGE_SOFT : 'rgba(0,0,0,0)';
      c.fill();
      c.fillStyle = on ? SAGE : SAGE_MID;
      c.beginPath();
      c.arc(x + 2, y - 10, 5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = INK;
      c.font = '24px system-ui, sans-serif';
      c.fillText(item, x + 24, y);
    });
  }

  return {
    canvas,
    draw(t) {
      c.fillStyle = PAPER;
      c.fillRect(0, 0, W, H);

      c.fillStyle = SAGE;
      c.font = '500 44px Georgia, serif';
      c.fillText('Customer success', 64, 104);
      c.fillStyle = INK_SOFT;
      c.font = '25px system-ui, sans-serif';
      c.fillText('Making the service people actually receive hold together', 64, 142);

      c.strokeStyle = HAIRLINE;
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(64, 178); c.lineTo(W - 64, 178); c.stroke();
      c.beginPath(); c.moveTo(W / 2, 212); c.lineTo(W / 2, 596); c.stroke();

      const lit = Math.floor(t * 0.45) % 4;
      column(64, 'What I set up', 'in an engagement', offers, lit);
      column(W / 2 + 40, 'Where it comes from', 'roles held, not clients', done, lit);
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
/** The notebook's page: ruled paper, with whatever has been written on it.
    Empty, it shows the few lines that were already there. */
export function notebookCanvas(): HTMLCanvasElement {
  return make(768, 540);
}

export function drawNotebook(canvas: HTMLCanvasElement, text: string) {
  const c = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height;

  c.fillStyle = '#EDE7D8';
  c.fillRect(0, 0, W, H);

  c.strokeStyle = 'rgba(160,170,150,0.34)';
  c.lineWidth = 1.6;
  const TOP = 112, STEP = 62;
  for (let y = TOP; y < H - 40; y += STEP) {
    c.beginPath(); c.moveTo(52, y); c.lineTo(W / 2 - 28, y); c.stroke();
    c.beginPath(); c.moveTo(W / 2 + 28, y); c.lineTo(W - 52, y); c.stroke();
  }

  if (!text.trim()) {
    /* what was already on the page: strokes, not words */
    let s = 424242;
    const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
    c.strokeStyle = 'rgba(40,52,38,0.5)';
    c.lineWidth = 3;
    c.lineCap = 'round';
    for (let line = 0; line < 3; line++) {
      const y = TOP - 14 + line * STEP;
      let x = 68;
      const end = 68 + 180 + rand() * 120;
      c.beginPath();
      c.moveTo(x, y);
      while (x < end) {
        const dx = 7 + rand() * 7;
        c.quadraticCurveTo(x + dx / 2, y - 7 - rand() * 7, x + dx, y - rand() * 3);
        x += dx;
      }
      c.stroke();
      c.beginPath(); c.moveTo(52, y - 5); c.lineTo(62, y - 5); c.stroke();
    }
    return;
  }

  /* what has just been written, wrapped onto the rules */
  c.fillStyle = '#1C2419';
  c.font = 'italic 42px Georgia, "Times New Roman", serif';
  c.textBaseline = 'alphabetic';

  /* One page at a time, the way a book is written: fill the left side, then
     carry on across the gutter. */
  const LEFT = 52, GUTTER = 28;
  const colWidth = W / 2 - LEFT - GUTTER;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (c.measureText(next).width > colWidth && line) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);

  const perPage = Math.floor((H - 48 - TOP) / STEP) + 1;
  lines.slice(0, perPage * 2).forEach((l, i) => {
    const page = i < perPage ? 0 : 1;
    const row = i - page * perPage;
    c.fillText(l, LEFT + page * (W / 2), TOP - 14 + row * STEP);
  });
  if (lines.length > perPage * 2) {
    c.fillStyle = 'rgba(28,36,25,0.55)';
    c.fillText('…', LEFT + W / 2, TOP - 14 + perPage * STEP);
  }
}

/* ---------- Phone: the card you would hand someone ------------------------
   A contact card, not a shop. There is no server behind this site, so the
   phone shows what is true of it: who this is, where he is, and the three
   ways to reach him. The panel it opens carries the same three as real
   links.                                                                 */
export function phonePainter(): Painter {
  const W = 540, H = 1120;
  const canvas = make(W, H);
  const c = canvas.getContext('2d')!;

  const rows = [
    { label: 'Call', value: '+91 99879 86857', glyph: 'phone' },
    { label: 'Email', value: 'adi852002@gmail.com', glyph: 'mail' },
    { label: 'LinkedIn', value: '/in/aniruddhagkdasgupta', glyph: 'link' },
  ];

  function glyph(kind: string, x: number, y: number) {
    c.save();
    c.translate(x, y);
    c.strokeStyle = SAGE;
    c.lineWidth = 3.4;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    if (kind === 'phone') {
      c.beginPath();
      c.moveTo(-9, -12); c.lineTo(-3, -12); c.lineTo(-1, -5);
      c.lineTo(-5, -2); c.quadraticCurveTo(0, 6, 7, 9); c.lineTo(10, 5);
      c.lineTo(16, 7); c.lineTo(16, 13);
      c.quadraticCurveTo(0, 15, -9, -12);
      c.stroke();
    } else if (kind === 'mail') {
      c.strokeRect(-13, -9, 26, 19);
      c.beginPath(); c.moveTo(-13, -9); c.lineTo(0, 2); c.lineTo(13, -9); c.stroke();
    } else {
      c.beginPath(); c.arc(-7, -5, 4.5, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(-7, 2); c.lineTo(-7, 13); c.stroke();
      c.beginPath(); c.moveTo(3, 13); c.lineTo(3, 4);
      c.quadraticCurveTo(3, -2, 9, -2); c.quadraticCurveTo(14, -2, 14, 4); c.lineTo(14, 13);
      c.stroke();
    }
    c.restore();
  }

  return {
    canvas,
    draw() {
      c.fillStyle = PAPER;
      c.fillRect(0, 0, W, H);

      /* a band of colour at the top, the way a card has a spine */
      const g = c.createLinearGradient(0, 0, 0, 300);
      g.addColorStop(0, '#DDE5D2');
      g.addColorStop(1, PAPER);
      c.fillStyle = g;
      c.fillRect(0, 0, W, 300);

      /* the status strip, so it reads as a phone and not a poster */
      c.fillStyle = 'rgba(35,45,32,0.5)';
      c.font = '500 26px system-ui, sans-serif';
      c.fillText('Mumbai', 42, 56);
      c.textAlign = 'right';
      c.fillText('●●●', W - 42, 56);
      c.textAlign = 'left';

      c.fillStyle = SAGE;
      c.font = '500 54px Georgia, serif';
      c.fillText('Aniruddha', 42, 182);
      c.fillText('Dasgupta', 42, 240);

      c.fillStyle = INK_SOFT;
      c.font = '28px system-ui, sans-serif';
      c.fillText('Operations · Customer success', 42, 304);
      c.fillText('Practical AI', 42, 344);

      c.strokeStyle = HAIRLINE;
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(42, 396); c.lineTo(W - 42, 396); c.stroke();

      rows.forEach((row, i) => {
        const y = 470 + i * 150;
        roundRect(c, 32, y - 54, W - 64, 118, 20);
        c.fillStyle = '#EFEDE2';
        c.fill();

        glyph(row.glyph, 86, y);

        c.fillStyle = INK;
        c.font = '500 32px system-ui, sans-serif';
        c.fillText(row.label, 140, y - 6);
        c.fillStyle = INK_SOFT;
        c.font = '26px system-ui, sans-serif';
        c.fillText(row.value, 140, y + 32);
      });

      c.fillStyle = INK_SOFT;
      c.font = '25px system-ui, sans-serif';
      c.fillText('Working with teams across time zones', 42, 1010);

      /* the home bar */
      c.fillStyle = 'rgba(35,45,32,0.3)';
      roundRect(c, W / 2 - 70, H - 42, 140, 8, 4);
      c.fill();
    },
  };
}

/* ---------- The green notebook: fifteen years, on its cover ---------------
   A hardback with the years blocked on it. The dates come from the CV and
   are passed in, so the cover and the page can never drift apart.       */
export function workCoverPainter(rows: { name: string; dates: string }[]): Painter {
  const W = 720, H = 500;
  const canvas = make(W, H);
  const c = canvas.getContext('2d')!;
  let painted = false;

  /* Step the type down until the name fits rather than squeezing it with
     maxWidth, which distorts the letterforms and reads as a mistake. */
  const fit = (text: string, limit: number, from: number, to: number) => {
    for (let size = from; size > to; size -= 1) {
      c.font = `500 ${size}px system-ui, sans-serif`;
      if (c.measureText(text).width <= limit) return;
    }
  };

  return {
    canvas,
    draw() {
      if (painted) return;
      painted = true;

      c.fillStyle = '#4C5B3F';
      c.fillRect(0, 0, W, H);

      /* a blind-embossed rule, the way a cover is tooled */
      c.strokeStyle = 'rgba(255,255,255,0.1)';
      c.lineWidth = 2;
      c.strokeRect(30, 30, W - 60, H - 60);
      c.strokeStyle = 'rgba(0,0,0,0.18)';
      c.strokeRect(33, 33, W - 66, H - 66);

      c.fillStyle = '#E8EDDC';
      c.font = '500 44px Georgia, serif';
      c.fillText('Work history', 62, 112);
      c.fillStyle = 'rgba(232,237,220,0.62)';
      c.font = '22px system-ui, sans-serif';
      c.fillText('every role, 2007 onwards', 62, 148);

      c.strokeStyle = 'rgba(232,237,220,0.24)';
      c.beginPath(); c.moveTo(62, 174); c.lineTo(W - 62, 174); c.stroke();

      const SHOWN = 6;
      rows.slice(0, SHOWN).forEach((row, i) => {
        const y = 220 + i * 44;
        c.fillStyle = 'rgba(232,237,220,0.94)';
        fit(row.name, 400, 23, 16);
        c.fillText(row.name, 62, y);
        /* Dates in their own left-aligned column: right-aligning them left
           each one floating at a different distance from its role. */
        c.fillStyle = 'rgba(232,237,220,0.64)';
        c.font = '20px system-ui, sans-serif';
        c.fillText(row.dates, 486, y);
      });

      if (rows.length > SHOWN) {
        c.fillStyle = 'rgba(232,237,220,0.58)';
        c.font = '20px system-ui, sans-serif';
        c.fillText(`and ${rows.length - SHOWN} more inside`, 62, 220 + SHOWN * 44);
      }
    },
  };
}

/* ---------- The visiting card -------------------------------------------
   Pale card stock with the type letterpressed into it: a shadow along the
   top of the impression, a highlight along the bottom.                  */
function pressed(c: CanvasRenderingContext2D, text: string, x: number, y: number, colour: string) {
  c.fillStyle = 'rgba(0,0,0,0.22)';
  c.fillText(text, x, y - 1.1);
  c.fillStyle = 'rgba(255,255,255,0.5)';
  c.fillText(text, x, y + 1.1);
  c.fillStyle = colour;
  c.fillText(text, x, y);
}

export function cardPainter(lines: { name: string; role: string; email: string; phone: string; place: string }): Painter {
  const W = 1024, H = 596;              // 85 x 55 mm
  const canvas = make(W, H);
  const c = canvas.getContext('2d')!;
  let painted = false;

  return {
    canvas,
    draw() {
      if (painted) return;
      painted = true;

      c.fillStyle = '#F2EEE2';
      c.fillRect(0, 0, W, H);

      /* the grain of the stock */
      let s = 7788;
      const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
      for (let i = 0; i < 2600; i++) {
        c.fillStyle = `rgba(0,0,0,${0.015 + rand() * 0.02})`;
        c.fillRect(rand() * W, rand() * H, 1.6, 1.6);
      }

      /* a sage rule down the left, the only colour on it */
      c.fillStyle = '#46563C';
      c.fillRect(0, 0, 18, H);

      c.textBaseline = 'alphabetic';
      c.font = '500 62px Georgia, serif';
      pressed(c, lines.name, 86, 196, '#1F2A1C');
      c.font = '28px system-ui, sans-serif';
      pressed(c, lines.role, 86, 248, '#51564F');

      c.fillStyle = 'rgba(70,86,60,0.3)';
      c.fillRect(86, 300, 170, 2);

      c.font = '27px system-ui, sans-serif';
      pressed(c, lines.email, 86, 368, '#394030');
      pressed(c, lines.phone, 86, 412, '#394030');
      pressed(c, lines.place, 86, 456, '#6B7064');

      /* the monogram, bottom right */
      c.textAlign = 'right';
      c.font = '500 58px Georgia, serif';
      pressed(c, 'AD', W - 76, 500, 'rgba(70,86,60,0.42)');
      c.textAlign = 'left';
    },
  };
}

/* ---------- Steam ---------------------------------------------------------
   One soft blob, drawn once. A handful of these drift up from the mug on
   their own clocks, which is enough to read as steam without a particle
   system.                                                               */
export function steamCanvas(): HTMLCanvasElement {
  const S = 128;
  const canvas = make(S, S);
  const c = canvas.getContext('2d')!;
  const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.42, 'rgba(255,255,255,0.3)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, S, S);
  return canvas;
}

/* ---------- Sticky notes -------------------------------------------------
   A note is a short script: a heading, then a few marks, each with its own
   slice of the run. Progress is one number for the whole note, and every
   mark works out how far through itself that leaves it — so the strokes
   land in order, at their own pace, rather than all together.

   Two kinds of mark. A `scribble` is one continuous wavering line. A `words`
   mark is a row of short strokes with gaps, which reads as a line of
   handwriting at the size a note on a monitor actually is.

   Headings are real words because a heading is legible at this size. They
   are the kind of thing anyone writes on a sticky note — never a claim
   about the work, a client or a result.                                   */

const NOTE_PX = 256;

type Mark =
  | { kind: 'scribble'; y: number; from: number; to: number; at: [number, number] }
  | { kind: 'words'; y: number; from: number; to: number; at: [number, number]; words: number[] };

export type StickyNote = {
  colour: string;
  heading?: string;
  headingAt?: [number, number];
  marks: Mark[];
};

/** How far through its own window `at` the overall progress `t` leaves a mark. */
function within(t: number, at: [number, number]) {
  const [from, to] = at;
  if (t <= from) return 0;
  if (t >= to) return 1;
  return (t - from) / (to - from);
}

/** A hand wobbles. The same seed always wobbles the same way. */
function wobble(seed: number) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

function scribble(
  c: CanvasRenderingContext2D, m: Extract<Mark, { kind: 'scribble' }>, local: number, seed: number,
) {
  const rand = wobble(seed + m.y);
  const stop = m.from + (m.to - m.from) * local;
  let x = m.from;
  c.beginPath();
  c.moveTo(x, m.y);
  while (x < stop) {
    const dx = Math.min(9 + rand() * 9, stop - x);
    c.quadraticCurveTo(x + dx / 2, m.y - 6 - rand() * 6, x + dx, m.y - rand() * 3);
    x += dx;
  }
  c.stroke();
}

function words(
  c: CanvasRenderingContext2D, m: Extract<Mark, { kind: 'words' }>, local: number, seed: number,
) {
  const rand = wobble(seed + m.y * 3);
  const total = m.words.reduce((a, b) => a + b, 0) + (m.words.length - 1) * 9;
  const scale = (m.to - m.from) / total;
  const stop = m.from + (m.to - m.from) * local;
  let x = m.from;
  for (const w of m.words) {
    const width = w * scale;
    if (x >= stop) break;
    const end = Math.min(x + width, stop);
    c.beginPath();
    c.moveTo(x, m.y);
    let cx = x;
    while (cx < end) {
      const dx = Math.min(7 + rand() * 6, end - cx);
      c.quadraticCurveTo(cx + dx / 2, m.y - 5 - rand() * 6, cx + dx, m.y - rand() * 2.5);
      cx += dx;
    }
    c.stroke();
    x += width + 9 * scale;
  }
}

/** Draws a note: its paper, its heading, and its marks as far as `t` through. */
export function drawNote(c: CanvasRenderingContext2D, note: StickyNote, t: number, seed: number) {
  const s = NOTE_PX;

  c.fillStyle = note.colour;
  c.fillRect(0, 0, s, s);

  /* the gummed strip along the top, a touch darker as it is on the real thing */
  c.fillStyle = 'rgba(0,0,0,0.05)';
  c.fillRect(0, 0, s, 44);

  /* a soft shadow down the right edge, so it reads as paper on paper */
  const g = c.createLinearGradient(s - 30, 0, s, 0);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.07)');
  c.fillStyle = g;
  c.fillRect(s - 30, 0, 30, s);

  c.textBaseline = 'alphabetic';
  if (note.heading && within(t, note.headingAt ?? [0, 0.22]) > 0) {
    const shown = within(t, note.headingAt ?? [0, 0.22]);
    c.save();
    /* the heading arrives letter by letter, like the rest of it */
    c.beginPath();
    c.rect(0, 0, 28 + (s - 56) * shown, s);
    c.clip();
    c.fillStyle = '#26301F';
    c.font = 'italic 600 42px Georgia, "Times New Roman", serif';
    c.fillText(note.heading, 28, 92, s - 56);
    c.restore();
  }

  c.strokeStyle = 'rgba(38,48,36,0.6)';
  c.lineWidth = 5;
  c.lineCap = 'round';
  c.lineJoin = 'round';

  for (const m of note.marks) {
    const local = within(t, m.at);
    if (local <= 0) continue;
    if (m.kind === 'scribble') scribble(c, m, local, seed);
    else words(c, m, local, seed);
  }
}

/* The three notes on the monitor. Headings only — nothing here states
   anything about the work, a client or a result. */
export const STICKY_NOTES: StickyNote[] = [
  {
    colour: '#E6DCA4',
    heading: 'Today',
    headingAt: [0, 0.2],
    marks: [
      { kind: 'words', y: 136, from: 28, to: 214, at: [0.2, 0.52], words: [26, 42, 18, 34] },
      { kind: 'words', y: 178, from: 28, to: 190, at: [0.52, 0.8], words: [34, 22, 40] },
      { kind: 'scribble', y: 218, from: 28, to: 150, at: [0.8, 1], },
    ],
  },
  {
    colour: '#CCDBBB',
    marks: [
      { kind: 'words', y: 102, from: 30, to: 216, at: [0, 0.3], words: [30, 44, 26] },
      { kind: 'words', y: 148, from: 30, to: 200, at: [0.3, 0.58], words: [22, 38, 30] },
      { kind: 'words', y: 194, from: 30, to: 224, at: [0.58, 0.86], words: [40, 24, 32, 20] },
      { kind: 'scribble', y: 234, from: 30, to: 128, at: [0.86, 1] },
    ],
  },
  {
    colour: '#E3C7B2',
    heading: 'Ask',
    headingAt: [0, 0.24],
    marks: [
      { kind: 'words', y: 142, from: 28, to: 206, at: [0.24, 0.62], words: [36, 28, 44] },
      { kind: 'words', y: 184, from: 28, to: 176, at: [0.62, 0.9], words: [28, 36] },
      /* the underline someone draws when they want to remember it */
      { kind: 'scribble', y: 206, from: 28, to: 170, at: [0.9, 1] },
    ],
  },
];

export function stickyNotePainter(note: StickyNote, seed: number): Painter {
  const canvas = make(NOTE_PX, NOTE_PX);
  const c = canvas.getContext('2d')!;
  return { canvas, draw: (t) => drawNote(c, note, t, seed) };
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
export function floorCanvas(lampOn = true): HTMLCanvasElement {
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
