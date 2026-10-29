"""Generate the Transformation Studio scene as layered SVG.

Three layers so the hero can parallax them at different rates:
  back  — wall, workflow board, monitor, slat panel, shelf
  mid   — platform, desk, desk objects, chairs, rug
  front — foreground plants and the book stack

The character is a separate PNG cutout layered between mid and front.
W/H are the scene viewBox; hotspot coordinates in site.ts are percentages
of this box, so both stay in sync.
"""
W, H = 1200, 1000

# palette (from the approved visual)
IVORY      = '#F7F5EF'
TRAVERTINE = '#EFE7DA'
TRAV_DARK  = '#E3D8C7'
OAK        = '#D9BD93'
OAK_LIGHT  = '#E8D5B4'
OAK_DARK   = '#C2A275'
OAK_EDGE   = '#B08E62'
SAGE_UPH   = '#6E7F5E'
SAGE_DARK  = '#5A6A4C'
CREAM      = '#EFE9DC'
LEATHER    = '#A06E50'
LEATHER_D  = '#86593F'
GREEN_1    = '#4E6B46'
GREEN_2    = '#6B8A5A'
GREEN_3    = '#3F5739'
POT        = '#E7E0D2'
POT_D      = '#D5CCBA'
SCREEN     = '#DCE6EC'
METAL      = '#B9BCB6'
WARM       = '#F0D4A0'
INK        = '#172018'


def defs():
    return f'''<defs>
  <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="{TRAVERTINE}"/><stop offset="1" stop-color="{TRAV_DARK}"/>
  </linearGradient>
  <linearGradient id="oakTop" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="{OAK_LIGHT}"/><stop offset="1" stop-color="{OAK}"/>
  </linearGradient>
  <linearGradient id="oakFace" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="{OAK}"/><stop offset="1" stop-color="{OAK_DARK}"/>
  </linearGradient>
  <linearGradient id="platform" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="{OAK_LIGHT}"/><stop offset="1" stop-color="{OAK_DARK}"/>
  </linearGradient>
  <linearGradient id="screenG" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#E8F0F4"/><stop offset="1" stop-color="#C9D8E0"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="{WARM}" stop-opacity=".55"/>
    <stop offset="1" stop-color="{WARM}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="contact" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#8C7F66" stop-opacity=".40"/>
    <stop offset="1" stop-color="#8C7F66" stop-opacity="0"/>
  </radialGradient>
</defs>'''


def leaf(cx, cy, rx, ry, rot, fill):
    return (f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}" '
            f'transform="rotate({rot} {cx} {cy})"/>')


import math, random

def _foliage(out, cx, cy, spread, count, size, seed, greens):
    rnd = random.Random(seed)
    for i in range(count):
        a = rnd.uniform(0, math.tau)
        r = spread * math.sqrt(rnd.random())
        lx = cx + math.cos(a) * r
        ly = cy + math.sin(a) * r * 0.62
        sz = size * rnd.uniform(0.62, 1.15)
        rot = math.degrees(math.atan2(ly - cy, lx - cx)) * 0.55 + rnd.uniform(-22, 22)
        out.append(leaf(round(lx,1), round(ly,1), round(sz,1), round(sz*0.44,1),
                        round(rot,1), greens[i % len(greens)]))


def plant(x, y, scale=1.0, tall=False, seed=0):
    """A potted plant. tall=True gives the tree-like one."""
    s = scale
    g = [GREEN_1, GREEN_2, GREEN_3, GREEN_2]
    out = [f'<g transform="translate({x} {y}) scale({s})">']
    if tall:
        out.append(f'<path d="M-62 0 Q-66 -74 -52 -80 L52 -80 Q66 -74 62 0 Z" fill="{POT}"/>')
        out.append(f'<path d="M-62 0 Q-62 -14 -60 -18 L60 -18 Q62 -14 62 0 Z" fill="{POT_D}"/>')
        out.append(f'<ellipse cx="0" cy="-80" rx="52" ry="10" fill="{POT_D}"/>')
        out.append(f'<path d="M-2 -82 Q4 -220 -6 -330" stroke="#7A6A4E" stroke-width="9" fill="none"/>')
        for bx, by, ang in [(-6,-250,-38),(-4,-290,34),(-5,-200,28),(-6,-330,-26)]:
            out.append(f'<path d="M{bx} {by} q{ang*1.6} -26 {ang*2.4} -52" '
                       f'stroke="#7A6A4E" stroke-width="4" fill="none"/>')
        _foliage(out, -74, -296, 62, 78, 11, seed+1, g)
        _foliage(out,  64, -318, 58, 70, 10, seed+2, g)
        _foliage(out, -10, -388, 58, 74, 10, seed+3, g)
        _foliage(out, -60, -208, 44, 40,  9, seed+4, g)
        _foliage(out,  60, -228, 42, 36,  9, seed+5, g)
        _foliage(out,  12, -262, 50, 46, 10, seed+6, g)
    else:
        out.append(f'<path d="M-30 0 L30 0 L25 -52 L-25 -52 Z" fill="{POT}"/>')
        out.append(f'<path d="M-30 0 L30 0 L27 -10 L-27 -10 Z" fill="{POT_D}"/>')
        _foliage(out, 0, -84, 40, 54, 9, seed+7, g)
        _foliage(out, 0, -60, 32, 30, 8, seed+8, g)
    out.append('</g>')
    return ''.join(out)


def trailing(x, y, scale=1.0, seed=11):
    """Vines trailing down from a shelf edge."""
    rnd = random.Random(seed)
    out = [f'<g transform="translate({x} {y}) scale({scale})">']
    for i, (dx, length, bend) in enumerate([(-18,164,-30),(2,214,22),(26,132,36),(-38,112,-38),(14,178,-14)]):
        out.append(f'<path d="M{dx} 0 Q{dx+bend} {length*0.55} {dx+bend*0.4} {length}" '
                   f'stroke="{GREEN_3}" stroke-width="2.4" fill="none"/>')
        n = max(6, length // 16)
        for t in range(1, n + 1):
            f = t / (n + 1.0)
            lx = dx + bend * 0.9 * f * (1 - f) * 2 + bend * 0.4 * f * f
            ly = length * f
            side = -1 if t % 2 else 1
            off = rnd.uniform(7, 13) * side
            sz = rnd.uniform(8, 13)
            out.append(leaf(round(lx + off,1), round(ly + rnd.uniform(-4,4),1),
                            round(sz,1), round(sz*0.5,1),
                            round(side * rnd.uniform(16, 42),1),
                            GREEN_2 if t % 2 else GREEN_1))
    out.append('</g>')
    return ''.join(out)


def board(x, y, w, h):
    """Workflow board: cream panel, sage nodes, connectors."""
    out = [f'<g transform="translate({x} {y})">']
    out.append(f'<rect x="0" y="0" width="{w}" height="{h}" rx="6" fill="{CREAM}" '
               f'stroke="#DED6C6" stroke-width="2"/>')
    nodes = [(34,42),(130,42),(226,42),(34,120),(130,120),(226,120)]
    conns = [((34,42),(130,42)),((130,42),(226,42)),((130,42),(130,120)),
             ((34,120),(130,120)),((130,120),(226,120))]
    for (ax,ay),(bx,by) in conns:
        out.append(f'<path d="M{ax+60} {ay+18} L{bx} {by+18}" stroke="#A9B49C" '
                   f'stroke-width="2.5" fill="none"/>' if ay==by else
                   f'<path d="M{ax+30} {ay+36} L{bx+30} {by}" stroke="#A9B49C" '
                   f'stroke-width="2.5" fill="none"/>')
    for i,(nx,ny) in enumerate(nodes):
        fill = '#C7D2B8' if i % 2 == 0 else '#DCE4D2'
        out.append(f'<rect x="{nx}" y="{ny}" width="60" height="36" rx="4" fill="{fill}" '
                   f'stroke="#A9B49C" stroke-width="1.5"/>')
        out.append(f'<rect x="{nx+8}" y="{ny+11}" width="30" height="4" rx="2" fill="#8A9A7C"/>')
        out.append(f'<rect x="{nx+8}" y="{ny+20}" width="20" height="4" rx="2" fill="#A9B49C"/>')
    # a couple of sticky notes, slightly rotated
    out.append(f'<rect x="300" y="30" width="46" height="46" rx="3" fill="#E4E8B8" '
               f'transform="rotate(-4 323 53)"/>')
    out.append(f'<rect x="300" y="96" width="46" height="46" rx="3" fill="#DCE4D2" '
               f'transform="rotate(3 323 119)"/>')
    out.append('</g>')
    return ''.join(out)


def back_layer():
    o = [f'<g id="back">']
    # warm wash behind everything
    o.append(f'<ellipse cx="620" cy="300" rx="520" ry="300" fill="url(#glow)" opacity=".5"/>')
    # travertine wall
    o.append(f'<rect x="300" y="80" width="760" height="706" rx="10" fill="url(#wall)"/>')
    # warm light strip under the wall top
    o.append(f'<rect x="312" y="92" width="736" height="6" rx="3" fill="{WARM}" opacity=".75"/>')
    o.append(f'<rect x="300" y="742" width="760" height="10" fill="{TRAV_DARK}" opacity=".7"/>')
    # oak slat panel
    for i in range(7):
        o.append(f'<rect x="{742+i*17}" y="110" width="10" height="470" rx="4" fill="url(#oakFace)"/>')
    # workflow board on the wall
    o.append(board(392, 180, 372, 186))
    # shelf + monitor on the right
    o.append(f'<rect x="860" y="300" width="214" height="12" rx="4" fill="url(#oakTop)"/>')
    o.append(f'<rect x="864" y="312" width="206" height="7" rx="3" fill="{WARM}" opacity=".6"/>')
    o.append(f'<rect x="868" y="318" width="196" height="128" rx="7" fill="#2C3630"/>')
    o.append(f'<rect x="876" y="326" width="180" height="112" rx="4" fill="url(#screenG)"/>')
    # simple flow drawn on the monitor
    o.append(f'<g opacity=".85">'
             f'<rect x="892" y="346" width="44" height="22" rx="3" fill="#B9CEDA"/>'
             f'<rect x="958" y="346" width="44" height="22" rx="3" fill="#CBDCE4"/>'
             f'<path d="M936 357 L958 357" stroke="#8FA9B6" stroke-width="2"/>'
             f'<rect x="892" y="392" width="44" height="22" rx="3" fill="#CBDCE4"/>'
             f'<path d="M914 368 L914 392" stroke="#8FA9B6" stroke-width="2"/>'
             f'<circle cx="992" cy="404" r="14" fill="#B9CEDA"/>'
             f'<circle cx="987" cy="401" r="2.4" fill="#5E7A88"/>'
             f'<circle cx="997" cy="401" r="2.4" fill="#5E7A88"/>'
             f'<path d="M985 409 Q992 414 999 409" stroke="#5E7A88" stroke-width="2" fill="none"/>'
             f'</g>')
    # small plants on the shelf
    o.append(plant(898, 300, 0.42))
    o.append(plant(1044, 300, 0.36))
    o.append('</g>')
    return ''.join(o)


def mid_layer():
    o = [f'<g id="mid">']
    # curved platform
    o.append(f'<path d="M150 760 L1070 760 Q1096 760 1092 790 Q1070 880 620 892 '
             f'Q170 880 148 790 Q144 760 150 760 Z" fill="url(#platform)"/>')
    o.append(f'<path d="M148 790 Q170 880 620 892 Q1070 880 1092 790 L1092 806 '
             f'Q1070 896 620 908 Q170 896 148 806 Z" fill="{OAK_EDGE}"/>')
    o.append(f'<path d="M160 768 L1062 768" stroke="{WARM}" stroke-width="3" opacity=".5"/>')
    # rug
    o.append(f'<ellipse cx="600" cy="796" rx="340" ry="66" fill="{CREAM}"/>')
    o.append(f'<ellipse cx="600" cy="796" rx="340" ry="66" fill="none" stroke="#E3DCCB" stroke-width="3"/>')

    # large tree, behind the seating
    o.append(f'<ellipse cx="318" cy="748" rx="88" ry="19" fill="url(#contact)"/>')
    o.append(plant(318, 748, 0.80, tall=True, seed=5))

    # --- left grouping: side table, then visitor chair -------------------
    o.append(f'<ellipse cx="168" cy="762" rx="62" ry="16" fill="url(#contact)"/>')
    o.append(f'<rect x="162" y="702" width="11" height="56" rx="4" fill="{OAK_DARK}"/>')
    o.append(f'<path d="M138 758 L198 758" stroke="{OAK_DARK}" stroke-width="7" stroke-linecap="round"/>')
    o.append(f'<ellipse cx="168" cy="702" rx="58" ry="15" fill="url(#oakTop)"/>')
    o.append(plant(168, 698, 0.40, seed=21))

    o.append(f'<g>'
             f'<ellipse cx="352" cy="770" rx="94" ry="20" fill="url(#contact)"/>'
             f'<rect x="282" y="622" width="144" height="102" rx="34" fill="{SAGE_UPH}"/>'
             f'<rect x="288" y="692" width="132" height="62" rx="22" fill="{SAGE_DARK}"/>'
             f'<rect x="300" y="676" width="108" height="38" rx="15" fill="#7C8D6C"/>'
             f'<rect x="318" y="638" width="68" height="44" rx="12" fill="{CREAM}" '
             f'transform="rotate(-6 352 660)"/>'
             f'<rect x="304" y="748" width="11" height="24" rx="4" fill="{OAK_DARK}"/>'
             f'<rect x="394" y="748" width="11" height="24" rx="4" fill="{OAK_DARK}"/>'
             f'</g>')

    # --- desk sweeps to the RIGHT of where the character stands ----------
    # office chair sits behind the desk
    o.append(f'<g>'
             f'<ellipse cx="872" cy="770" rx="70" ry="17" fill="url(#contact)"/>'
             f'<rect x="826" y="556" width="98" height="110" rx="26" fill="{LEATHER}"/>'
             f'<rect x="832" y="638" width="86" height="40" rx="15" fill="{LEATHER_D}"/>'
             f'<rect x="866" y="678" width="13" height="50" rx="5" fill="{METAL}"/>'
             f'<path d="M830 762 L918 762" stroke="{METAL}" stroke-width="9" stroke-linecap="round"/>'
             f'<path d="M844 740 L872 762 L900 740" stroke="{METAL}" stroke-width="8" fill="none" stroke-linecap="round"/>'
             f'</g>')
    o.append(f'<path d="M700 686 Q880 652 1066 668 L1066 702 Q880 686 700 720 Z" fill="url(#oakTop)"/>')
    o.append(f'<path d="M700 720 Q880 686 1066 702 L1066 718 Q880 702 700 736 Z" fill="{OAK_EDGE}"/>')
    o.append(f'<rect x="1018" y="714" width="11" height="54" rx="4" fill="{OAK_DARK}"/>')
    o.append(f'<rect x="742" y="730" width="11" height="48" rx="4" fill="{OAK_DARK}"/>')

    # laptop on the desk, clear of the character
    o.append(f'<g>'
             f'<path d="M756 692 L876 682 L888 704 L746 714 Z" fill="#C6CBC8"/>'
             f'<path d="M768 684 L870 675 L862 610 L776 617 Z" fill="#9AA3A0"/>'
             f'<path d="M774 680 L865 672 L858 616 L780 622 Z" fill="url(#screenG)"/>'
             f'<rect x="792" y="632" width="52" height="5" rx="2" fill="#9FB4BF"/>'
             f'<rect x="792" y="644" width="36" height="5" rx="2" fill="#B8C9D2"/>'
             f'<rect x="792" y="656" width="44" height="5" rx="2" fill="#B8C9D2"/>'
             f'</g>')
    # mug
    o.append(f'<g><rect x="706" y="688" width="30" height="30" rx="6" fill="{CREAM}"/>'
             f'<path d="M736 695 q12 7 0 16" stroke="{CREAM}" stroke-width="5" fill="none"/>'
             f'<ellipse cx="721" cy="688" rx="15" ry="4.5" fill="#E3DCCB"/></g>')
    # books on the desk
    o.append(f'<g><rect x="946" y="660" width="82" height="9" rx="2" fill="{SAGE_UPH}"/>'
             f'<rect x="950" y="652" width="74" height="9" rx="2" fill="{CREAM}"/>'
             f'<rect x="954" y="644" width="66" height="9" rx="2" fill="{OAK_DARK}"/></g>')
    o.append('</g>')
    return ''.join(o)


def front_layer():
    o = [f'<g id="front">']
    # trailing plant from the right shelf
    o.append(trailing(1046, 446, 1.0))
    # book stack on the platform, labelled
    labels = ['OPERATIONS', 'CUSTOMER EXPERIENCE', 'AI IMPLEMENTATION']
    for i, text in enumerate(labels):
        by = 788 + i * 26
        o.append(f'<rect x="206" y="{by}" width="238" height="24" rx="3" fill="{OAK_LIGHT}"/>')
        o.append(f'<rect x="206" y="{by+18}" width="238" height="6" rx="2" fill="{OAK_DARK}"/>')
        o.append(f'<text x="325" y="{by+16}" font-family="Helvetica,Arial,sans-serif" '
                 f'font-size="11" letter-spacing="1.2" fill="#6B5B42" text-anchor="middle">{text}</text>')
    o.append('</g>')
    return ''.join(o)


def svg(inner, w=W, h=H):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
            f'width="{w}" height="{h}" fill="none">{defs()}{inner}</svg>')


if __name__ == '__main__':
    import pathlib
    pathlib.Path('layer_back.svg').write_text(svg(back_layer()))
    pathlib.Path('layer_mid.svg').write_text(svg(mid_layer()))
    pathlib.Path('layer_front.svg').write_text(svg(front_layer()))
    pathlib.Path('scene_all.svg').write_text(
        svg(f'<rect width="{W}" height="{H}" fill="{IVORY}"/>'
            + back_layer() + mid_layer() + front_layer()))
    print('wrote 4 svg files')
