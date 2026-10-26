/* Lume lights renderer. Practice lights = "Fine stardust" (Nayara 26 Oct 12:37, source motion/build/stardust.js, tuned per size 40..380);
   the moon keeps haloCst (phases, brand moon). */
/* Lume lights renderer, from the Lume design system (Light component, haloCst).
   Paints every <canvas data-light="form"> on the board. Optional: data-color="r g b", data-size (css px). */
(function(){
const TAU=Math.PI*2,PI=Math.PI;
const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2, eo=x=>1-Math.pow(1-x,3), fr=x=>x-Math.floor(x);
const rY=(p,a)=>{const c=Math.cos(a),s=Math.sin(a);return[p[0]*c+p[2]*s,p[1],-p[0]*s+p[2]*c,p[3],p[4]]};
const rX=(p,a)=>{const c=Math.cos(a),s=Math.sin(a);return[p[0],p[1]*c-p[2]*s,p[1]*s+p[2]*c,p[3],p[4]]};
const rZ=(p,a)=>{const c=Math.cos(a),s=Math.sin(a);return[p[0]*c-p[1]*s,p[0]*s+p[1]*c,p[2],p[3],p[4]]};
const ring=(n,r,y=0,b=1,s=1,off=0)=>[...Array(n)].map((_,i)=>{const a=i/n*TAU+off;return[r*Math.cos(a),y,r*Math.sin(a),b,s]});
const fib=n=>[...Array(n)].map((_,i)=>{const y=1-2*(i+.5)/n,r=Math.sqrt(1-y*y),a=i*2.39996;return[r*Math.cos(a),y,r*Math.sin(a)]});
const F70=fib(70),F80=fib(80),F60=fib(60);
const rnd=(i,k=1)=>fr(Math.sin(i*127.1+k*311.7)*43758.5453);
const all=(pts,f)=>pts.map(f);

/* each form returns points [x,y,z,brightness,size] in a unit space */
const FORM={
 knot(t){const m=.5-.5*Math.cos(t*.45),n=96;return all([...Array(n)],(_,i)=>{const u=i/n*TAU+t*.25;
   const k=[(Math.sin(u)+2*Math.sin(2*u))/3,(Math.cos(u)-2*Math.cos(2*u))/3,-Math.sin(3*u)/3],c=[Math.cos(u)*.9,Math.sin(u)*.9,0];
   return rX(rY([k[0]*(1-m)+c[0]*m,k[1]*(1-m)+c[1]*m,k[2]*(1-m)+c[2]*m,.55+.45*Math.sin(u*3-t*2),.8],t*.35),.5)})},
 mirror(t){const d=.42+.14*Math.sin(t*.8),o=t*.6;const A=ring(16,.5,0,1,1,o).map(p=>[d,p[0],p[2],1,1]),B=ring(16,.5,0,1,1,-o).map(p=>[-d,p[0],p[2],.5,.9]);
   return [...A,...B].map(p=>rX(rY(p,t*.45),.25))},
 twin(t){const A=ring(20,.72,0,1,.9,t*.9).map(p=>rX(p,.65)),B=ring(20,.72,0,.75,.9,-t*.9).map(p=>rX(p,-.65));return [...A,...B].map(p=>rY(p,t*.3))},
 helix(t){const n=44;return all([...Array(n)],(_,i)=>{const f=fr(i/n+t*.07),a=i*.5;return rX(rY([.62*Math.cos(a),-.95+1.9*f,.62*Math.sin(a),Math.sin(PI*f),.9],t*.25),.3)})},
 build(t){const ph=fr(t/6),g=ph<.7?eo(ph/.7):1-ease((ph-.7)/.3),r=.4+.45*g;return F70.map(p=>rX(rY([p[0]*r,p[1]*r,p[2]*r,.45+.55*g,.75],t*.3),.35))},
 clear(t){const ph=fr(t/7),g=ph<.55?ease(ph/.55):1-ease((ph-.55)/.45);return [...Array(54)].map((_,i)=>{const d=F60[i],r=.18+.85*g*(.6+.4*rnd(i));return rY([d[0]*r,d[1]*r,d[2]*r,1-.45*g,.8],t*.25)})},
 breath(t){const c=fr(t/12),b=c<1/3?ease(c*3):1-ease((c-1/3)*1.5),r=.55+.28*b;return F80.map(p=>rX(rY([p[0]*r,p[1]*r,p[2]*r,.5+.5*b,.7],t*.18),.3))},
 body(t){const w=1.3-2.6*fr(t/5),P=[];for(let j=0;j<6;j++){const y=.8-j*.32,e=Math.exp(-((y-w)**2)/.06);ring(13,.42+.22*e,y,.45+.55*e,.75+.3*e,t*.2+j*.3).forEach(p=>P.push(p))}return P.map(p=>rX(p,.45))},
 ripple(t){const P=[[0,0,0,.9,1.1]];for(let i=0;i<3;i++){const f=fr(t*.22+i/3);ring(26,.12+.95*f,0,(1-f)*Math.min(1,f*5),.85).forEach(p=>P.push(p))}return P.map(p=>rX(rY(p,t*.1),.95))},
 coin(t){return [...ring(16,.8,0,1,1).map(p=>[p[0],p[2],0,1,1]),[0,0,0,.6+.3*Math.abs(Math.cos(t*.9)),.9]].map(p=>rX(rY(p,t*.9),.12))},
 jar(t){const L=fr(t*.075),n=34,P=[...ring(18,.5,-.72,.35,.6),...ring(18,.5,.72,.35,.6)];const k=Math.floor(L*n);
   for(let i=0;i<k;i++){const a=i*1.1,y=-.62+i/n*1.2;P.push([.32*Math.cos(a),y,.32*Math.sin(a),.9,.85])}
   const f=fr(L*n),a=k*1.1,yT=-.62+k/n*1.2;P.push([.32*Math.cos(a),.95-(.95-yT)*eo(f),.32*Math.sin(a),1,1]);return P.map(p=>rX(rY(p,t*.3),.38))},
 flame(t){const P=ring(12,.36,-.62,.5,.7);for(let i=0;i<28;i++){const f=fr(t*.33+i/28),w=(1-f)*.16;P.push([w*Math.sin(f*9+i),-.52+f*1.45,w*Math.cos(f*7+i),1-f,1.1-f*.6])}return P.map(p=>rX(rY(p,t*.3),.2))},
 vortex(t){return [...Array(64)].map((_,i)=>{const r=fr(t*.11+i/64),a=i*2.4+r*4+t*.5;return rX([r*Math.cos(a),0,r*Math.sin(a),(1-r)*Math.min(1,r*6)+.1,.85],.8)}).concat([[0,0,0,.8,1]].map(p=>rX(p,.8)))},
 salt(t){const ph=fr(t/7),v=ph<.55?ease(ph/.55):1,fade=ph>.8?1-(ph-.8)/.2:1,n=32,P=[[0,0,0,.5,.8]];
   for(let i=0;i<n;i++){if(i/n>v)break;const a=i/n*TAU;P.push([.8*Math.cos(a),0,.8*Math.sin(a),fade,.9])}return P.map(p=>rX(rY(p,t*.2),.85))},
 steam(t){const P=ring(16,.55,-.8,.45,.7);for(let i=0;i<42;i++){const col=i%3,f=fr(t*.18+i/42),a=f*6+col*2.1,r=.2+.28*f;P.push([r*Math.cos(a),-.75+1.65*f,r*Math.sin(a),Math.sin(PI*f),.85])}return P.map(p=>rX(rY(p,t*.15),.3))},
 halo(t){const P=[[0,0,0,1,1.9]];ring(22,.72,0,1,.85,t*.15).forEach((p,i)=>{p[3]=.65+.35*(.5+.5*Math.sin(t*.8+i*.6));P.push(p)});return P.map(p=>rX(p,1.1))},
 galaxy(t){const P=[[0,0,0,1,1.4]];for(let i=0;i<76;i++){const arm=i%2,d=i/76,a=d*5.2+arm*PI+t*.22,r=.12+.88*d;P.push([r*Math.cos(a)+(rnd(i)-.5)*.08,(rnd(i,2)-.5)*.08,r*Math.sin(a)+(rnd(i,3)-.5)*.08,1-d*.55,.75])}return P.map(p=>rX(p,1.0))},
 binary(t){const P=[];for(let s=0;s<2;s++)for(let j=0;j<14;j++){const a=t*.8-j*.07+s*PI;P.push([.45*Math.cos(a),0,.45*Math.sin(a),1-j/16,(1.4-j*.06)])}return P.map(p=>rX(rZ(p,.2),.95))},
 three(t){const P=ring(40,.72,0,.55,.62);for(let i=0;i<3;i++){const a=t*.32+i*TAU/3,g=Math.pow(Math.max(0,Math.cos(t*1.1-i*2.094)),4);P.push([.72*Math.cos(a),0,.72*Math.sin(a),.6+.4*g,1.25+.8*g])}return P.map(p=>rX(p,.85))},
 bloom(t){const o=.18+1.15*(.5-.5*Math.cos(t*.55)),P=[[0,-.45,0,1,1]];for(let k=0;k<6;k++){const ph=k/6*TAU;for(let j=1;j<=7;j++){const s=j/7,r=.95*s*Math.sin(o),y=.95*s*Math.cos(o)-.45;P.push([r*Math.cos(ph),y,r*Math.sin(ph),1-s*.4,.85])}}return P.map(p=>rX(rY(p,t*.22),.35))},
 burst(t){const f=fr(t/4.5),r=.08+.85*eo(f),b=f<.85?1-f*.7:(1-f)/.15*.4;return F60.map(p=>rY([p[0]*r,p[1]*r,p[2]*r,b,.8],t*.2)).concat([[0,0,0,f>.8?(f-.8)*5:Math.max(0,1-f*4),1.2]])},
 fork(t){return [...Array(44)].map((_,i)=>{const f=fr(t*.2+i/44),s=i%2?1:-1;let p=f<.4?[0,0,1-f/.4*1,1,.9]:[s*(f-.4)*1.35,0,-(f-.4)*1.5,1,.9];p[3]=Math.min(1,f*6)*(1-Math.max(0,f-.75)*4);return rX(rY(p,Math.sin(t*.3)*.25),.55)})},
 goodbye(t){const a=.5+.5*Math.cos(t*.5),A=ring(20,.6,0,1,.9,t*.6).map(p=>rZ(rX(p,1.2),.4)),B=ring(20,.6+.22*(1-a),0,a,.85,-t*.6).map(p=>{const q=rZ(rX(p,1.2),-.4);return[q[0]+(1-a)*.18,q[1],q[2]-(1-a)*.6,q[3],q[4]]});return [...A,...B].map(p=>rY(p,t*.2))},
 torus(t){const P=[];for(let i=0;i<14;i++)for(let j=0;j<6;j++){const u=i/14*TAU,v=j/6*TAU+t*.4,R=.6+.24*Math.cos(v);P.push([R*Math.cos(u),.24*Math.sin(v),R*Math.sin(u),.3+.7*Math.pow(Math.max(0,Math.cos(u-t*1.1)),3),.75])}return P.map(p=>rX(rY(p,t*.25),1.05))}
};

/* glow sprites: one white, one per theme color */
const SPR={};function sprite(rgb){if(SPR[rgb])return SPR[rgb];const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);
 g.addColorStop(0,`rgba(${rgb},1)`);g.addColorStop(.18,`rgba(${rgb},.95)`);g.addColorStop(.32,`rgba(${rgb},.32)`);g.addColorStop(1,`rgba(${rgb},0)`);x.fillStyle=g;x.fillRect(0,0,64,64);return SPR[rgb]=c}
const WHITE='244,241,236';
/* HALO LANGUAGE for practice lights: colour and depth on arrival, cooling toward white.
   arrive 0..1: starts far back, seen edge on, in the halo spectrum, near lights large and out of focus; turns to face you and cools.
   steady: far lights keep a little spectrum mixed with the theme, near lights white, soft depth of field. */
const HL={P:[[150,125,255],[255,140,185],[255,196,120],[120,190,255]],W:[255,250,240]};
const hlMix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const hlPal=u=>{u=((u%1)+1)%1;const f=u*4,i=Math.floor(f)%4;return hlMix(HL.P[i],HL.P[(i+1)%4],f-i)};
const hlC=x=>Math.max(0,Math.min(1,x)),hlE=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const HSPR={};
function hlSprite(c,soft){const k=(soft?'s':'h')+(Math.round(c[0]/12)*12)+','+(Math.round(c[1]/12)*12)+','+(Math.round(c[2]/12)*12);if(HSPR[k])return HSPR[k];
 const cv=document.createElement('canvas');cv.width=cv.height=64;const x=cv.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32),r=k.slice(1);
 if(soft){g.addColorStop(0,`rgba(${r},.55)`);g.addColorStop(.45,`rgba(${r},.28)`);g.addColorStop(1,`rgba(${r},0)`)}
 else{g.addColorStop(0,`rgba(${r},1)`);g.addColorStop(.18,`rgba(${r},.95)`);g.addColorStop(.32,`rgba(${r},.32)`);g.addColorStop(1,`rgba(${r},0)`)}
 x.fillStyle=g;x.fillRect(0,0,64,64);return HSPR[k]=cv}
function haloCst(ctx,S,pts0,theme,t,o={}){
 const A=o.arrive==null?1:hlC(o.arrive),e=hlE(A),q=1-e,cx=S/2,cy=S/2,R=S*(o.r||.36)*(o.full?1:.68+.32*e),F=3.0,base=S*(o.dot||1/9.5);
 const near=o.near||HL.W,keep=o.keep==null?.38:o.keep,n=pts0.length,cs=Math.cos(1.25*q),sn=Math.sin(1.25*q);
 const pts=pts0.map((p,i)=>{let y=p[1]*cs-p[2]*sn,z=p[1]*sn+p[2]*cs;const d0=hlC((z+1)/2);z-=(o.full?0:1.5)*q;const s=F/(F-z);
  return[cx+p[0]*s*R,cy-y*s*R,z,p[3],p[4],s,d0,hlPal(i/n+t*.025)]}).sort((a,b)=>a[2]-b[2]);
 for(const p of pts){const depth=p[6],b0=hlC(p[3]),b=b0>.02?.42+.58*b0:b0,a=b*(.6+.4*depth)*(.25+.75*hlC(A*3));if(a<.01)continue;
  const dof=hlC((depth-.78)/.22)*(.15+.85*q)+q*(o.full?.1:.35),sz=base*Math.max(.7,p[4])*p[5]*(.75+.45*depth)*(1+1.1*dof);
  const far=hlMix(theme,p[7],keep+(1-keep)*q),nc=hlMix(near,p[7],.75*q),soft=dof>.35,k=1-.5*dof;
  ctx.globalAlpha=Math.min(1,a*(1-depth)*1.15*k);ctx.drawImage(hlSprite(far,soft),p[0]-sz/2,p[1]-sz/2,sz,sz);
  ctx.globalAlpha=Math.min(1,a*(.25+depth)*k);ctx.drawImage(hlSprite(nc,soft),p[0]-sz/2,p[1]-sz/2,sz,sz)}
 ctx.globalAlpha=1}

const F260=fib(260);const VZ=1;/* +1 or -1: which z faces the viewer */
/* data-phase on a moon canvas (0 new, .25 first quarter, .5 full, .75 last quarter): the same points, lit only on the sun side, so one light can morph through every moon */
FORM.moon=function(t,cv){const ph=cv&&cv.dataset.phase!=null&&cv.dataset.phase!==''?+cv.dataset.phase:null,a=ph==null?0:ph*TAU,L=[Math.sin(a),0,-VZ*Math.cos(a)];
 return F260.map((p,i)=>{let q=rX(rY([p[0]*.95,p[1]*.95,p[2]*.95,.55+.45*(.5+.5*Math.sin(t*.7+i)),.62],t*.08),.15);
  if(ph!=null){const d=(q[0]*L[0]+q[1]*L[1]+q[2]*L[2])/.95,b=q[2]*VZ<0?.018:d>.04?q[3]*(.35+.65*Math.min(1,d*2)):(Math.abs(q[2])<.3?.03:.018);/* back half hidden; the dark face keeps a faint rim */q=[q[0],q[1],q[2],b,q[4]]}return q})};
/* field: a wide drift of faint stardust that fills a screen behind the practice light (exploration PX, 26 Oct) */
const FIELD=[...Array(240)].map((_,i)=>[(rnd(i,1)-.5)*2.5,(rnd(i,2)-.5)*2.5,(rnd(i,3)-.5)*.6,.15+.85*Math.pow(rnd(i,4),3),.5+.5*rnd(i,5)]);
FORM.field=function(t){return FIELD.map(p=>[p[0],p[1],p[2],p[3]*(.7+.3*Math.sin(t*.9+p[0]*7)),p[4]])};
window.LUME={FORM,haloCst};
const live=new Map();const reduce=true;/* static on the canvas: motion is refined in code (motion-spec.md) */
function scan(){document.querySelectorAll('canvas[data-light]').forEach(cv=>{if(live.has(cv))return;
 const css=+cv.dataset.size||cv.clientWidth||120,dpr=cv.dataset.light==='moon'?Math.min(2,devicePixelRatio||1):Math.min(3,Math.max(2,devicePixelRatio||1));/* stardust lights render at 2-3x for crisp points */cv.width=cv.height=Math.round(css*dpr);
 live.set(cv,{ctx:cv.getContext('2d'),S:cv.width,f:cv.dataset.light,rgb:(cv.dataset.color||'255 250 240').split(' ').map(Number),t0:performance.now()/1000,dpr,dot:cv.dataset.light==='moon'?1/22:1/9.5})})}
function frame(ms){const t=8;scan();live.forEach((it,cv)=>{if(!cv.isConnected){live.delete(cv);return}if(cv.width!==it.S||cv.height!==it.S){cv.width=cv.height=it.S;it.drawn=0}const F=FORM[it.f];if(!F||it.drawn)return;it.drawn=1;
 it.ctx.clearRect(0,0,it.S,it.S);if(it.f!=='moon'&&window.Stardust){it.ctx.drawImage(Stardust.render(it.S,it.f,reduce?3.3:t,it.rgb,{dpr:it.dpr,pts:F(reduce?2:t*.6,cv),r:cv.dataset.r?+cv.dataset.r:undefined,rounds:cv.dataset.rounds!=null?+cv.dataset.rounds:undefined,tilt:cv.dataset.tilt!=='false',alpha:cv.dataset.alpha?+cv.dataset.alpha:undefined}),0,0)}else haloCst(it.ctx,it.S,F(reduce?2:t*.6,cv),it.rgb,t,{arrive:reduce?1:(t-it.t0)/6,dot:it.dot,full:1})});setTimeout(frame,700)}
requestAnimationFrame(frame);
})();

/* Lune light renderer · "Fine stardust" (chosen by Nayara 26 Oct 2026 12:37).
   Same shapes as lights.js (window.LUME.FORM), rendered as many tiny sharp points with a shared bloom.
   Stardust.render(S, form, t, rgb, opt) -> square canvas S x S (device px), transparent, ready to drawImage.
   opt: {r: radius share of S (.4), rounds: densify rounds (4; 1 for moon, 0-1 for small sizes), tilt: true} */
(function(){
const L=window.LUME,cl=x=>x<0?0:x>1?1:x,mixc=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const hash=(i,k)=>{const s=Math.sin(i*127.1+k*311.7)*43758.5453;return s-Math.floor(s)};
const W=[255,248,240],SP={};
function core(c){const key=c.map(v=>Math.round(v/8)*8).join(',');if(SP[key])return SP[key];
 const s=128,cv=document.createElement('canvas');cv.width=cv.height=s;const x=cv.getContext('2d'),g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
 g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.12,`rgba(${key},.95)`);g.addColorStop(.3,`rgba(${key},.22)`);g.addColorStop(1,`rgba(${key},0)`);
 x.fillStyle=g;x.fillRect(0,0,s,s);return SP[key]=cv}
function project(p,S,R,tilt){let x=p[0],y=p[1],z=p[2];if(tilt){const cy=Math.cos(.7),sy=Math.sin(.7),cx=Math.cos(.25),sx=Math.sin(.25);const x1=x*cy+z*sy,z1=-x*sy+z*cy;x=x1;const y1=y*cx-z1*sx;z=y*sx+z1*cx;y=y1}
 const F=3.2,s=F/(F-z);return[S/2+x*s*R,S/2-y*s*R,z,s]}
/* resample between close neighbours so the shape reads as a continuous drift of stars, and stays closed */
function dense(pts,n,lim){for(let r=0;r<n;r++){const o=pts.slice(),seen=new Set();pts.forEach((p,i)=>{const best=[];pts.forEach((q,j)=>{if(j===i)return;const d=Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);if(d<lim)best.push([d,j])});
 best.sort((a,b)=>a[0]-b[0]).slice(0,2).forEach(([d,j])=>{const k=i<j?i+'-'+j:j+'-'+i;if(seen.has(k))return;seen.add(k);const q=pts[j];o.push([(p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2,(p[3]+q[3])/2,(p[4]+q[4])/2])})});pts=o;lim*=.62}return pts}
const POOL={};function buf(S,k){const key=k+S;let c=POOL[key];if(!c){c=POOL[key]=document.createElement('canvas');c.width=c.height=S}return c}
function bloom(ctx,S,amt,div){const sm=buf(Math.max(8,Math.round(S/div)),'b'+div),sx=sm.getContext('2d');sx.clearRect(0,0,sm.width,sm.height);sx.drawImage(ctx.canvas,0,0,sm.width,sm.height);
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=amt;ctx.imageSmoothingQuality='high';ctx.drawImage(sm,0,0,S,S);ctx.restore()}
/* size profile (Nayara 12:38: "refined for different sizes"). css = on-screen size in CSS px.
   Small lights keep fewer, slightly bigger points and almost no bloom so they stay crisp;
   big lights get more points, finer grain, a few bright stars and a wider bloom. */
const lerp=(a,b,k)=>a+(b-a)*k;
function profile(css,moon){const k=cl((css-40)/(340-40));return{
 rounds:moon?(css<120?0:1):css<64?1:css<140?2:css<260?3:4,
 dotMin:lerp(1.3,1.0,k),dotMax:lerp(2.2,2.4,k),dens:lerp(1,.9,k),   /* css px */
 star:css<64?0:lerp(.015,.035,k),starPx:lerp(3,6.5,k),
 jitter:lerp(0,.012,k),bloomA:lerp(.4,1,k),bloomB:lerp(0,.6,k),
 floor:lerp(.5,.25,k)}}                                  /* brightness floor: small lights never go faint */
function render(S,form,t,rgb,o={}){S=Math.max(16,Math.round(S));const cv=buf(S,'o'+(o.slot||'')),ctx=cv.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,S,S);
 if(!L.FORM[form])return cv;const moon=form==='moon',px=o.dpr||Math.min(3,Math.max(2,devicePixelRatio||1)),css=S/px,Q=profile(css,moon),R=S*(o.r||.4);
 const pts=dense(o.pts||L.FORM[form](t*.6),o.rounds!=null?o.rounds:Q.rounds,moon?.3:.42),P=pts.map((p,i)=>[...project(p,S,R,o.tilt!==false),i,p[3]]).sort((a,b)=>a[2]-b[2]);
 ctx.globalCompositeOperation='lighter';
 for(const [x,y,z,s,i,b] of P){const dep=cl((z+1)/2),star=hash(i,3)<Q.star,tw=.8+.2*Math.sin(t*(1.2+2*hash(i,5))+i);
  const jx=(hash(i,7)-.5)*S*Q.jitter,jy=(hash(i,8)-.5)*S*Q.jitter,c=mixc(rgb,W,.35+.6*dep),a=(Q.floor+(1-Q.floor)*dep)*(.4+.6*cl(b))*tw*Q.dens*(o.alpha==null?1:o.alpha);
  const d=star?Q.starPx:lerp(Q.dotMin,Q.dotMax,hash(i,9)),sz=d*px*3.2*s*(.75+.4*dep);  /* x2.2: the sprite's bright core is ~1/2 of its box */
  ctx.globalAlpha=Math.min(1,a);ctx.drawImage(core(c),x+jx-sz/2,y+jy-sz/2,sz,sz)}
 ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;bloom(ctx,S,Q.bloomA,10);if(Q.bloomB>.02)bloom(ctx,S,Q.bloomB,28);return cv}
window.Stardust={render};
})();
