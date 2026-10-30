/* WCAG 2.2 contrast check for the design tokens. Run: node scripts/check-contrast.mjs */
const T = {
  ivory:'#101A12', surface:'#1B261D', sage:'#A9C089', sageSoft:'#273523',
  ink:'#ECEFE4', inkSoft:'#A5AD9B', inkInvert:'#101A12',
  line:'#2C3A2F', lineStrong:'#6C7A6E', brass:'#D4B37B', brassBright:'#E6C98F',
};
const lin = c => { c/=255; return c<=0.04045 ? c/12.92 : ((c+0.055)/1.055)**2.4; };
const L = h => { const n=parseInt(h.slice(1),16);
  return 0.2126*lin(n>>16&255)+0.7152*lin(n>>8&255)+0.0722*lin(n&255); };
const ratio=(a,b)=>{const x=L(a),y=L(b);return ((Math.max(x,y)+0.05)/(Math.min(x,y)+0.05));};

const pairs = [
  ['ink on ivory','ink','ivory',4.5], ['ink on surface','ink','surface',4.5],
  ['inkSoft on ivory','inkSoft','ivory',4.5], ['inkSoft on surface','inkSoft','surface',4.5],
  ['sage on ivory','sage','ivory',4.5], ['sage on surface','sage','surface',4.5],
  ['sage on sageSoft','sage','sageSoft',4.5],
  ['inkInvert on sage (buttons)','inkInvert','sage',4.5],
  ['sage on surface (links in panels)','sage','surface',4.5],
  ['brass on surface','brass','surface',4.5],
  ['brass on ivory (eyebrow)','brass','ivory',4.5],
  ['inkSoft on sageSoft','inkSoft','sageSoft',4.5],
  ['ink on sageSoft','ink','sageSoft',4.5],
  ['lineStrong on surface (form borders)','lineStrong','surface',3.0],
];
// Informational only: these are decorative and carry no meaning or state.
const deco = [['hairline divider','line','ivory'], ['brassBright scene accent','brassBright','ivory']];
let fail=0;
for (const [name,a,b,min] of pairs){
  const r=ratio(T[a],T[b]); const ok=r>=min;
  if(!ok) fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${r.toFixed(2)}:1  (needs ${min})  ${name}`);
}
for (const [n,a,b] of deco) console.log(`info  ${ratio(T[a],T[b]).toFixed(2)}:1  ${n} (decorative, no minimum)`);
console.log(fail? `\n${fail} token pair(s) below target` : '\nAll token pairs meet target');
process.exit(fail?1:0);
