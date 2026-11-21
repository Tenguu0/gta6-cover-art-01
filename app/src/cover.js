export const LAYOUTS = {
  four: { name: 'Four corners', panels: [[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]], title: .56 },
  hero: { name: 'Hero + three', panels: [[0,0,.64,1],[.64,0,.36,.34],[.64,.34,.36,.33],[.64,.67,.36,.33]], title: .73 },
  bleed: { name: 'Full-bleed', panels: [[0,0,1,1]], title: .72 },
  nine: { name: 'Nine stories', panels: Array.from({length:9},(_,i)=>[(i%3)/3,Math.floor(i/3)/3,1/3,1/3]), title: .68 },
  tilt: { name: 'Tilted snapshot', panels: [[.04,.05,.92,.9]], title: .72 },
  story: { name: 'Vertical story', panels: [[0,0,.52,.52],[.52,0,.48,.52],[0,.52,.48,.48],[.48,.52,.52,.48]], title: .56 },
};
export const GRADES = {
  sunset: { name:'Sunset map', overlay:'linear' }, neon:{ name:'Neon coast', overlay:'neon' },
  duo:{ name:'Electric duotone', overlay:'duo' }, halftone:{ name:'Halftone ink', overlay:'dots' }, mono:{ name:'B&W poster', overlay:'mono' },
};
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
function fillCrop(ctx, photo, rect, tune={}) {
  const [x,y,w,h]=rect, iw=photo?.naturalWidth||720, ih=photo?.naturalHeight||480;
  if (!photo) { ctx.fillStyle='#28202d';ctx.fillRect(x,y,w,h);return; }
  const zoom=tune.zoom||1, scale=Math.max(w/iw,h/ih)*zoom, sw=w/scale, sh=h/scale;
  const sx=clamp((tune.x??50)/100*iw-sw/2,0,iw-sw), sy=clamp((tune.y??50)/100*ih-sh/2,0,ih-sh);
  ctx.drawImage(photo,sx,sy,sw,sh,x,y,w,h);
}
function gradePanel(ctx, rect, grade, index) {
  const [x,y,w,h]=rect;
  ctx.save();
  if(grade==='sunset') { const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'rgba(255,196,111,.08)');g.addColorStop(.52,'rgba(239,73,129,.27)');g.addColorStop(1,'rgba(69,28,91,.63)');ctx.fillStyle=g;ctx.fillRect(x,y,w,h); }
  if(grade==='neon') { ctx.fillStyle='rgba(22,202,215,.23)';ctx.fillRect(x,y,w,h*.53);const g=ctx.createLinearGradient(x,y+h*.35,x+w,y+h);g.addColorStop(0,'rgba(51,52,187,.08)');g.addColorStop(1,'rgba(239,44,148,.52)');ctx.fillStyle=g;ctx.fillRect(x,y,w,h); }
  if(grade==='duo') { ctx.fillStyle='rgba(18,37,116,.36)';ctx.fillRect(x,y,w,h);const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'rgba(21,225,201,.38)');g.addColorStop(1,'rgba(245,51,131,.48)');ctx.fillStyle=g;ctx.fillRect(x,y,w,h); }
  if(grade==='mono') { ctx.fillStyle='rgba(12,10,15,.62)';ctx.fillRect(x,y,w,h);ctx.globalCompositeOperation='saturation';ctx.fillStyle='#fff';ctx.fillRect(x,y,w,h); }
  if(grade==='halftone') { ctx.fillStyle='rgba(28,15,37,.22)';ctx.fillRect(x,y,w,h);ctx.fillStyle='rgba(255,185,107,.48)';for(let py=y+6;py<y+h;py+=11)for(let px=x+6+(Math.floor((py-y)/11)%2)*5;px<x+w;px+=11){ctx.beginPath();ctx.arc(px,py,1.25+(index%2)*.25,0,Math.PI*2);ctx.fill();} }
  ctx.restore();
}
function drawTitle(ctx,w,h,caption,subtitle,layoutKey) {
  const band=layoutKey==='bleed'||layoutKey==='tilt'?h*.28:h*.24, y=h-band;
  const fade=ctx.createLinearGradient(0,y-band*.25,0,h);fade.addColorStop(0,'rgba(15,12,25,0)');fade.addColorStop(.28,'rgba(15,12,25,.66)');fade.addColorStop(1,'rgba(15,12,25,.94)');ctx.fillStyle=fade;ctx.fillRect(0,y-band*.3,w,band*1.3);
  ctx.textAlign='center';ctx.textBaseline='alphabetic';let size=band*.48;const title=caption.trim().toUpperCase();
  ctx.font=`${size}px AfterDisplay, Impact, sans-serif`;while(ctx.measureText(title).width>w*.88&&size>18){size-=2;ctx.font=`${size}px AfterDisplay, Impact, sans-serif`;}
  ctx.lineWidth=Math.max(2,size*.018);ctx.strokeStyle='rgba(32,13,43,.7)';ctx.strokeText(title,w/2,y+band*.67);ctx.fillStyle='#fff5e9';ctx.shadowColor='#ff6397';ctx.shadowBlur=size*.22;ctx.fillText(title,w/2,y+band*.67);ctx.shadowBlur=0;
  ctx.font=`italic ${Math.max(17,band*.16)}px Georgia, serif`;ctx.fillStyle='#ff9ac7';ctx.shadowColor='#ff38b2';ctx.shadowBlur=16;ctx.fillText(subtitle.trim(),w/2,y+band*.88);ctx.shadowBlur=0;
  ctx.font='700 12px Arial,sans-serif';ctx.fillStyle='rgba(255,255,255,.7)';ctx.fillText('AFTERGLOW  /  CITY STORIES  /  06',w/2,y+band*.18);
}
function drawTexture(ctx,w,h,seed=61) {
  let state=seed>>>0;const next=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};
  ctx.save();for(let i=0;i<Math.floor(w*h/700);i++){const x=next()*w,y=next()*h,a=.025+next()*.12;ctx.fillStyle=`rgba(255,238,220,${a})`;ctx.fillRect(x,y,1.3,1.3);}
  const v=ctx.createRadialGradient(w*.5,h*.43,Math.min(w,h)*.22,w*.5,h*.48,Math.max(w,h)*.72);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(7,4,16,.68)');ctx.fillStyle=v;ctx.fillRect(0,0,w,h);ctx.restore();
}
export function drawPoster(ctx,{width,height,photos,layout='four',grade='sunset',caption='AFTER HOURS',subtitle='a city that never sleeps',tuning={},texture=true}) {
  const w=width,h=height,L=LAYOUTS[layout]||LAYOUTS.four;ctx.clearRect(0,0,w,h);ctx.fillStyle='#17121d';ctx.fillRect(0,0,w,h);
  const gap=Math.max(4,w*.007), boxes=L.panels.map(([x,y,pw,ph])=>[x*w+gap/2,y*h+gap/2,pw*w-gap,ph*h-gap]);
  boxes.forEach((r,i)=>{ctx.save();if(layout==='tilt'){ctx.translate(w/2,h/2);ctx.rotate(-.035);ctx.translate(-w/2,-h/2);}fillCrop(ctx,photos[i%Math.max(photos.length,1)]||null,r,tuning[i]||{});gradePanel(ctx,r,grade,i);ctx.strokeStyle='rgba(255,228,197,.58)';ctx.lineWidth=Math.max(1,w*.002);ctx.strokeRect(...r);ctx.restore();});
  drawTitle(ctx,w,h,caption,subtitle,layout);if(texture)drawTexture(ctx,w,h,61+layout.length*97+grade.length*11);
}
