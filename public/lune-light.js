/* Lune light · the ONE renderer for every light and the globe (Nayara 26 Oct 14:12: "we need a single one").
   Look: "fairy light". Each point is a tiny sharp core with its own soft halo, added together on the GPU,
   so many points read as stardust and a few as stars. Same FORM shapes as lights.js (window.LUME.FORM);
   the moon / globe is one uniform sphere (no stripes) whose point count grows with its size.

   Technique (why): WebGL point sprites with additive blending, one draw call per light, on ONE shared canvas
   per page. Canvas 2D drew every point as a separate image and faked bloom by down-scaling, which gave the
   patchy, blurry look and dropped frames at large sizes. On the GPU the points move with sub-pixel precision,
   stay sharp at 3x pixel density, and hundreds of them cost nothing. The app uses the same maths with Skia's
   drawAtlas (also one GPU call per light): src/ui/motion/stardust.ts.

   API
     const LL = LuneLight.create(canvas)        // a WebGL canvas (usually fixed, full screen, pointer-events none)
     LL.begin()                                 // each frame: resizes to the canvas' CSS box, clears
     LL.light(cx, cy, size, form, t, rgb, opt)  // css px in the canvas' box; t = seconds; rgb = [r,g,b]
         opt: {alpha, field, morph:{to,k}, clip:{x,y,w,h}, r, phase (globe only: 0 new, .5 full, 1 new),
               arrive 0..1 (points of light), look:'fairy' to force the fine grain}
     LL.dot(x, y, r, rgb, a, clip)              // one fairy point (dust, a travelling dot)
     LL.end()
   Shapes only (no drawing):  LuneLight.points(form, t, size, opt) -> [{x,y,s,a,c:[r,g,b]}] around 0,0 */
(function(){
const L=window.LUME,TAU=Math.PI*2,W=[255,250,242];
const cl=x=>x<0?0:x>1?1:x,lerp=(a,b,k)=>a+(b-a)*k,mixc=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const hash=(i,k)=>{const s=Math.sin(i*127.1+k*311.7)*43758.5453;return s-Math.floor(s)};
const eio=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const ALIAS={seed:'bloom',globe:'moon'};

/* ---------- shapes ---------- */
/* the globe: a uniform fibonacci sphere, turning slowly, tilted toward her. n grows with size. */
const FIB={};
function fib(n){if(FIB[n])return FIB[n];const a=[];for(let i=0;i<n;i++){const y=1-2*(i+.5)/n,r=Math.sqrt(1-y*y),g=i*2.399963;a.push([r*Math.cos(g),y,r*Math.sin(g)])}return FIB[n]=a}
function globe(n,t){const ry=t*.1+.4,c=Math.cos(ry),s=Math.sin(ry),ct=Math.cos(.28),st=Math.sin(.28);
 return fib(n).map((p,i)=>{const x=p[0]*c+p[2]*s,z=-p[0]*s+p[2]*c,y=p[1],y2=y*ct-z*st,z2=y*st+z*ct;return[x,y2,z2,.75+.25*hash(i,41),1]})}
const globeN=css=>Math.round(cl((css-40)/400)*560+120);

/* densify: a point between close neighbours so a form reads as a continuous drift. Links are found once per
   form and kept (points keep their identity as the form turns), and only between near neighbours
   (1.6x the typical spacing), so separate parts are never bridged; on the first round only points drawn one after
   the other (or very close) are linked, so loose points (a jar filling, a ripple's centre) stay single stars. */
const TOPO={};
function step(pts,list,max=1e9){const o=pts.slice();for(const[i,j]of list){const p=pts[i],q=pts[j];if(p&&q&&Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2])<max)o.push([(p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2,(p[3]+q[3])/2,(p[4]+q[4])/2])}return o}
function dense(pts,n,key,prox){if(n<=0)return pts;const id=key+(prox?'p':'')+':'+n+':'+pts.length;let T=TOPO[id];
 if(!T){T=[];let cur=pts,lim=.42;for(let r=0;r<n;r++){const nn=cur.map((p,i)=>{let b=1e9;for(let j=0;j<cur.length;j++){if(j===i)continue;const q=cur[j],d=Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);if(d<b)b=d}return b}).sort((a,b)=>a-b);
  const lm=Math.min(lim,(nn[nn.length>>1]||lim)*1.6),list=[],seen=new Set();
  const md=nn[nn.length>>1]||lim;cur.forEach((p,i)=>{const best=[];cur.forEach((q,j)=>{if(j===i)return;const d=Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);if(d<lm&&(r>0||(!prox&&Math.abs(i-j)<=2)||d<md*1.15))best.push([d,j])});
   best.sort((a,b)=>a[0]-b[0]).slice(0,prox===2?5:2).forEach(([,j])=>{const k=i<j?i+'-'+j:j+'-'+i;if(!seen.has(k)){seen.add(k);list.push([i,j])}})});
  T.push([list,lm*1.5]);cur=step(cur,list);lim*=.62}TOPO[id]=T}
 for(const[list,max]of T)pts=step(pts,list,max);return pts}   /* a link that has stretched (a falling point) is dropped */

/* size profile: small lights keep fewer, slightly bigger points; big lights finer grain and a few stars */
function profile(css){const k=cl((css-40)/(340-40));return{rounds:css<64?1:css<140?2:css<260?2:3,
 core:lerp(1.35,1.1,k),coreMax:lerp(2.1,2.3,k),star:css<64?0:lerp(.02,.04,k),starCore:lerp(2.6,4.2,k),halo:lerp(4.5,7,k),floor:lerp(.5,.28,k)}}

/* phase 0 new → .5 full → 1 new: the sun side lit, a faint earthshine on the rest (lit right while waxing) */
function lit(pts,phase){if(phase==null)return pts;const th=phase*TAU,lx=Math.sin(th),lz=-Math.cos(th);
 return pts.map(p=>{const k=cl((p[0]*lx+p[2]*lz)*3+.5);return[p[0],p[1],p[2],p[3],.05+.95*k]})}   /* p[4] carries the light on the globe */
function shape(form,t,css,phase){form=ALIAS[form]||form;
 if(form==='moon')return lit(globe(globeN(css),t),phase);
 const f=L.FORM[form]||L.FORM.bloom;return dense(f(t*.6),profile(css).rounds,form)}

function project(p,R,tilt){let x=p[0],y=p[1],z=p[2];if(tilt){const cy=Math.cos(.7),sy=Math.sin(.7),cx=Math.cos(.25),sx=Math.sin(.25);const x1=x*cy+z*sy,z1=-x*sy+z*cy;x=x1;const y1=y*cx-z1*sx;z=y*sx+z1*cx;y=y1}
 const F=3.2,s=F/(F-z);return[x*s*R,-y*s*R,z,s]}

/* POINTS OF LIGHT (Nayara 26 Oct 14:40: "this is beautiful", the Lume points-of-light exploration): the default look
   for practice lights. The form's own points, no densify, each one a pearl: a soft glow in the far colour and a bright
   core that cools to white as it comes near; near points are a little bigger and out of focus. Far points keep a trace
   of the halo spectrum (violet, rose, amber, blue). opt.arrive 0..1: seen edge on and in full spectrum, it turns to
   face her and cools (about 6 s). The globe and morphs keep the fairy-light grain. */
const SPEC=[[150,125,255],[255,140,185],[255,196,120],[120,190,255]];
const spec=u=>{u=((u%1)+1)%1;const f=u*4,i=Math.floor(f)%4;return mixc(SPEC[i],SPEC[(i+1)%4],f-i)};
/* perspective (Nayara 14:44): the bigger the light, the more detail. Small (<=100) stays as approved; from medium up the
   points grow in number continuously (in-between points fade in with size) and get smaller and crisper. */
const CLOUD=new Set(['build','breath','clear','burst']);   /* sphere clouds fill evenly (5 neighbours), never in rows */
function pearls(form,t,css,o){const fm=ALIAS[form]||form,f=L.FORM[fm]||L.FORM.bloom,G=cl((css-100)/200),raw=f(t*.6),n0=raw.length,
  D=css>100&&fm!=='binary',PX=CLOUD.has(fm)?2:1,pts=D?dense(raw,2,fm,PX):raw,n1=D?dense(raw,1,fm,PX).length:n0,w1=cl((css-100)/80),w2=cl((css-180)/110),n=pts.length,rgb=o.rgb||W,alpha=o.alpha==null?1:o.alpha;
 const A=o.arrive==null?1:cl(o.arrive),q=1-eio(A),cs=Math.cos(1.25*q),sn=Math.sin(1.25*q),R=css*(o.r||.36),base=css/9.5*lerp(1,.3,G),keep=.38,out=[];
 pts.forEach((p,i)=>{const y=p[1]*cs-p[2]*sn,z=p[1]*sn+p[2]*cs,d=cl((z+1)/2),s=3/(3-z),b0=cl(p[3]),b=b0>.02?.42+.58*b0:b0;
  const a=(i<n0?1:i<n1?w1:w2)*b*(.6+.4*d)*(.25+.75*cl(A*3))*alpha*(.85+.15*Math.sin(t*(.9+1.6*hash(i,5))+i*1.7));if(a<.01)return;
  const dof=cl((d-.78)/.22)*(.15+.85*q)+q*.1,sz=base*Math.max(.7,p[4])*s*(.75+.45*d)*(1+1.1*dof),pc=spec(i/n+t*.025);
  const far=mixc(rgb,pc,keep+(1-keep)*q),near=mixc(W,pc,.75*q),x=p[0]*s*R,yy=-y*s*R,soft=1-.5*dof;
  out.push({x,y:yy,core:sz/1.15,halo:1.15,a:Math.min(1,a*(1.15-d*.6)*.8*soft*(1-.55*G)),c:far,z});                 /* the glow */
  out.push({x,y:yy,core:sz*.5/(2.3+2*dof),halo:2.3+2*dof,a:Math.min(1,a*(.35+d)*soft*(1+.25*G)),c:mixc(far,near,.55+.45*d),z})});  /* the core */
 return out.sort((u,v)=>u.z-v.z)}
/* the particles of one light, around 0,0, in css px */
function points(form,t,css,o={}){if(o.look!=='fairy'&&!(o.morph&&o.morph.k>0)&&(ALIAS[form]||form)!=='moon'&&!(o.field>0&&o.look!=='pearl'))return pearls(form,t,css,o);const Q=profile(css),isMoon=(ALIAS[form]||form)==='moon',R=css*(o.r||(isMoon?.4:.4)),rgb=o.rgb||W,alpha=o.alpha==null?1:o.alpha;
 let pts=shape(form,t,css,o.phase);
 if(o.morph&&o.morph.k>0){const k=o.morph.k,B=shape(o.morph.to,t,css,o.phase),ang=p=>Math.atan2(p[1],p[0]);
  const A=pts.slice().sort((a,b)=>ang(a)-ang(b)),Bs=B.slice().sort((a,b)=>ang(a)-ang(b)),n=Math.max(A.length,Bs.length);
  pts=[];for(let i=0;i<n;i++){const p=A[Math.floor(i*A.length/n)],q=Bs[Math.floor(i*Bs.length/n)],ki=eio(cl((k-.35*hash(i,31))/.65)),lift=Math.sin(Math.PI*ki)*.18*(hash(i,32)-.5);
   pts.push([p[0]+(q[0]-p[0])*ki+lift,p[1]+(q[1]-p[1])*ki,p[2]+(q[2]-p[2])*ki,p[3]+(q[3]-p[3])*ki,p[4]+(q[4]-p[4])*ki])}}
 const tilt=!isMoon&&o.tilt!==false,out=[];
 pts.forEach((p,i)=>{const[x,y,z,s]=project(p,R,tilt),dep=cl((z+1)/2),star=hash(i,3)<Q.star;
  const tw=.78+.22*Math.sin(t*(.9+1.6*hash(i,5))+i*1.7);                      /* each point breathes on its own, slowly */
  const a=(Q.floor+(1-Q.floor)*dep)*(.45+.55*cl(p[3]))*tw*alpha*(o.phase!=null?cl(p[4]):1);if(a<.01)return;
  const core=(star?Q.starCore:lerp(Q.core,Q.coreMax,hash(i,9)))*s*(.8+.35*dep);
  out.push({x,y,core,halo:Q.halo,a:Math.min(1,a),c:mixc(rgb,W,.3+.6*dep)})});
 if(o.field){for(let i=0;i<o.field;i++){const an=hash(i,21)*TAU+t*.02*(hash(i,22)-.5),rad=Math.sqrt(hash(i,23))*.5*css,tw=.5+.5*Math.sin(t*(.5+hash(i,24))+i);
  out.push({x:Math.cos(an)*rad,y:Math.sin(an)*rad,core:lerp(.8,1.5,hash(i,26)),halo:5,a:(.12+.4*tw)*(1-.6*rad/(.5*css))*alpha,c:mixc(rgb,W,.5+.4*hash(i,25))})}}
 return out}

/* ---------- GPU ---------- */
const VS=`attribute vec2 p;attribute float sz;attribute vec4 col;attribute float k;uniform vec2 res;varying vec4 v;varying float vk;
void main(){gl_Position=vec4(p/res*2.-1.,0.,1.);gl_Position.y=-gl_Position.y;gl_PointSize=sz;v=col;vk=k;}`;
/* a sharp core (white at its heart) inside its own soft halo; k = core share of the sprite */
const FS=`precision mediump float;varying vec4 v;varying float vk;
void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float c=exp(-pow(r/vk,2.)*2.2);float h=exp(-r*r*4.)*.3*(1.-r);
vec3 col=mix(v.rgb,vec3(1.),c*.75)*(c+h)*v.a;gl_FragColor=vec4(col,max(col.r,max(col.g,col.b)));}`;
/* without WebGL (blocked GPU, lost context) the same points draw on a 2D canvas with additive blending */
function create2d(canvas){const g=canvas.getContext('2d'),spr=document.createElement('canvas');spr.width=spr.height=128;const s=spr.getContext('2d');
 let q=s.createRadialGradient(64,64,0,64,64,64);q.addColorStop(0,'rgba(255,255,255,.3)');q.addColorStop(.5,'rgba(255,255,255,.08)');q.addColorStop(1,'rgba(255,255,255,0)');s.fillStyle=q;s.fillRect(0,0,128,128);
 q=s.createRadialGradient(64,64,0,64,64,20);q.addColorStop(0,'#fff');q.addColorStop(1,'rgba(255,255,255,0)');s.fillStyle=q;s.fillRect(0,0,128,128);
 let dpr=1,clip=null;
 function setClip(c){g.restore();g.save();clip=c||null;if(clip){g.beginPath();g.rect(clip.x,clip.y,clip.w,clip.h);g.clip()}}
 function push(x,y,core,halo,a,c){const sz=core*halo;if(sz<1||a<=.004)return;g.globalAlpha=Math.min(1,a);g.drawImage(spr,x-sz/2,y-sz/2,sz,sz);
  g.globalAlpha=Math.min(1,a)*.6;g.fillStyle=`rgb(${c[0]|0},${c[1]|0},${c[2]|0})`;g.beginPath();g.arc(x,y,core*.9,0,TAU);g.fill()}
 return{begin(){dpr=Math.min(2,devicePixelRatio||1);const w=Math.round(canvas.clientWidth*dpr),h=Math.round(canvas.clientHeight*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
   g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,w,h);g.setTransform(dpr,0,0,dpr,0,0);g.globalCompositeOperation='lighter';g.save();clip=null},
  light(cx,cy,size,form,t,rgb,o={}){if(size<4)return;setClip(o.clip||null);for(const p of points(form,t,size,{...o,rgb}))push(cx+p.x,cy+p.y,p.core,p.halo,p.a,p.c)},
  dot(x,y,r,rgb,a=1,c){setClip(c||null);push(x,y,r*1.6,7,a,rgb)},
  end(){g.restore()}}}
function create(canvas){const gl=canvas.getContext('webgl',{premultipliedAlpha:true,alpha:true,antialias:false});if(!gl)return create2d(canvas);
 const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o},pr=gl.createProgram();
 gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);gl.useProgram(pr);
 const loc={p:gl.getAttribLocation(pr,'p'),sz:gl.getAttribLocation(pr,'sz'),col:gl.getAttribLocation(pr,'col'),k:gl.getAttribLocation(pr,'k'),res:gl.getUniformLocation(pr,'res')};
 const buf=gl.createBuffer(),MAXP=gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1]||64;
 gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);
 let dpr=1,data=[],clip=null,cw=0,ch=0;
 function flush(){if(!data.length)return;const f=new Float32Array(data);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,f,gl.STREAM_DRAW);
  const S=8*4;gl.enableVertexAttribArray(loc.p);gl.vertexAttribPointer(loc.p,2,gl.FLOAT,false,S,0);gl.enableVertexAttribArray(loc.sz);gl.vertexAttribPointer(loc.sz,1,gl.FLOAT,false,S,8);
  gl.enableVertexAttribArray(loc.col);gl.vertexAttribPointer(loc.col,4,gl.FLOAT,false,S,12);gl.enableVertexAttribArray(loc.k);gl.vertexAttribPointer(loc.k,1,gl.FLOAT,false,S,28);
  if(clip){gl.enable(gl.SCISSOR_TEST);gl.scissor(Math.round(clip.x*dpr),Math.round(ch-(clip.y+clip.h)*dpr),Math.round(clip.w*dpr),Math.round(clip.h*dpr))}else gl.disable(gl.SCISSOR_TEST);
  gl.drawArrays(gl.POINTS,0,f.length/8);data=[]}
 function setClip(c){const same=(!c&&!clip)||(c&&clip&&c.x===clip.x&&c.y===clip.y&&c.w===clip.w&&c.h===clip.h);if(!same){flush();clip=c?{...c}:null}}
 function push(x,y,core,halo,a,c){const size=Math.min(MAXP,core*halo*dpr);if(size<1||a<=.004)return;data.push(x*dpr,y*dpr,size,c[0]/255,c[1]/255,c[2]/255,a,Math.min(1,core*dpr/size*1.15))}
 return{
  begin(){dpr=Math.min(3,devicePixelRatio||1);const w=Math.round(canvas.clientWidth*dpr),h=Math.round(canvas.clientHeight*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
   cw=w;ch=h;gl.viewport(0,0,w,h);gl.uniform2f(loc.res,w,h);gl.disable(gl.SCISSOR_TEST);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);clip=null},
  light(cx,cy,size,form,t,rgb,o={}){if(size<4)return;setClip(o.clip||null);for(const q of points(form,t,size,{...o,rgb}))push(cx+q.x,cy+q.y,q.core,q.halo,q.a,q.c)},
  dot(x,y,r,rgb,a=1,c){setClip(c||null);push(x,y,r*1.6,7,a,rgb)},
  end(){flush()}}}
window.LuneLight={create,points};
})();
