import { drawPoster, GRADES, LAYOUTS } from './cover.js';
import { runShot } from './shots.js';

const one = (selector) => document.querySelector(selector);
const canvas = one('#cover');
const context = canvas.getContext('2d');
const controls = { layout:one('#layout'), grade:one('#grade'), caption:one('#caption'), subtitle:one('#subtitle'), panel:one('#activePanel'), zoom:one('#zoom'), x:one('#horizontal'), y:one('#vertical'), texture:one('#texture') };
const state = { photos:[], tuning:{}, selected:0, layout:'four', grade:'sunset', caption:'AFTER HOURS', subtitle:'a city that never sleeps', texture:true };
const sizes = [[1080,1080,'square'],[1080,1350,'portrait'],[1920,1080,'landscape']];
let userPhotoUrls=[];

function loadLocalImage(url) {
  return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=url;});
}
function fillSelect(select,items) {
  select.replaceChildren(...Object.entries(items).map(([value,item])=>{const option=document.createElement('option');option.value=value;option.textContent=item.name;return option;}));
}
function panelCount() { return LAYOUTS[state.layout].panels.length; }
function panelTuning() {
  if(!state.tuning[state.selected])state.tuning[state.selected]={zoom:Number(controls.zoom.value),x:Number(controls.x.value),y:Number(controls.y.value)};
  state.tuning[state.selected]={zoom:Number(controls.zoom.value),x:Number(controls.x.value),y:Number(controls.y.value)};
}
function syncPanelOptions() {
  const total=panelCount();state.selected=Math.min(state.selected,total-1);
  controls.panel.replaceChildren(...Array.from({length:total},(_,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=`Panel ${String(i+1).padStart(2,'0')}`;return option;}));
  controls.panel.value=String(state.selected);const saved=state.tuning[state.selected]||{zoom:1,x:50,y:50};
  controls.zoom.value=String(saved.zoom);controls.x.value=String(saved.x);controls.y.value=String(saved.y);updateRangeLabels();
}
function updateRangeLabels() {
  one('#zoomValue').value=`${Number(controls.zoom.value).toFixed(1)}×`;
  one('#horizontalValue').value=`${controls.x.value}%`;one('#verticalValue').value=`${controls.y.value}%`;
}
function paintPoster(target=canvas,width=canvas.width,height=canvas.height) {
  target.width=width;target.height=height;
  drawPoster(target.getContext('2d'),{width,height,photos:state.photos,layout:state.layout,grade:state.grade,caption:state.caption,subtitle:state.subtitle,tuning:state.tuning,texture:state.texture});
}
function updatePreview() {
  paintPoster();one('#layoutName').textContent=LAYOUTS[state.layout].name;
  one('.canvas-size').textContent=`${canvas.width} × ${canvas.height}`;
}
function setLayout(layout) {
  state.layout=LAYOUTS[layout]?layout:'four';controls.layout.value=state.layout;syncPanelOptions();updatePreview();
}
async function loadSample(name) {
  const image=await loadLocalImage(`./samples/${name}.jpg`);state.photos=[image];
  document.querySelectorAll('.sample').forEach(button=>button.classList.toggle('active',button.dataset.sample===name));
  updatePreview();
}
async function loadUserFiles(fileList) {
  const nextUrls=Array.from(fileList).filter(file=>file.type.startsWith('image/')).map(file=>URL.createObjectURL(file));
  const loaded=await Promise.all(nextUrls.map(loadLocalImage));
  if(loaded.length){userPhotoUrls.forEach(URL.revokeObjectURL);userPhotoUrls=nextUrls;state.photos=loaded;updatePreview();one('#status').textContent=`${loaded.length} local photo${loaded.length===1?'':'s'} ready. Choose a panel to adjust its crop.`;}
  else nextUrls.forEach(URL.revokeObjectURL);
}
function canvasBlob(target) {
  return new Promise((resolve,reject)=>target.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG export failed')), 'image/png'));
}
async function downloadOne(width,height,label) {
  const exportCanvas=document.createElement('canvas');paintPoster(exportCanvas,width,height);
  const blob=await canvasBlob(exportCanvas),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=`afterglow-${label}-${width}x${height}.png`;link.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
  return {width,height,label,blob};
}
async function exportAllSizes() {
  const button=one('#export');button.disabled=true;one('#status').textContent='Rendering three print-ready PNGs…';
  try { for(const [w,h,label] of sizes)await downloadOne(w,h,label);one('#status').textContent='Saved square, portrait, and landscape PNG covers.'; }
  catch(error){one('#status').textContent=error.message;}
  button.disabled=false;
}
async function showSizeBoard() {
  const board=one('#size-board');board.replaceChildren();board.className='size-board';
  for(const [width,height,label] of sizes){const preview=document.createElement('canvas');paintPoster(preview,width,height);preview.className=`size-${label}`;const card=document.createElement('figure');const caption=document.createElement('figcaption');caption.textContent=`${label} · ${width} × ${height}`;card.append(preview,caption);board.append(card);}
}
function connectControls() {
  fillSelect(controls.layout,LAYOUTS);fillSelect(controls.grade,GRADES);syncPanelOptions();
  controls.layout.addEventListener('change',()=>setLayout(controls.layout.value));
  controls.grade.addEventListener('change',()=>{state.grade=controls.grade.value;updatePreview();});
  controls.caption.addEventListener('input',()=>{state.caption=controls.caption.value;updatePreview();});
  controls.subtitle.addEventListener('input',()=>{state.subtitle=controls.subtitle.value;updatePreview();});
  controls.panel.addEventListener('change',()=>{panelTuning();state.selected=Number(controls.panel.value);syncPanelOptions();updatePreview();});
  [controls.zoom,controls.x,controls.y].forEach(range=>range.addEventListener('input',()=>{panelTuning();updateRangeLabels();updatePreview();}));
  controls.texture.addEventListener('change',()=>{state.texture=controls.texture.checked;updatePreview();});
  one('#photo').addEventListener('change',event=>loadUserFiles(event.target.files));
  document.querySelectorAll('.sample').forEach(button=>button.addEventListener('click',()=>loadSample(button.dataset.sample)));
  one('#export').addEventListener('click',exportAllSizes);
}
async function setupShot(query) {
  await loadSample(query.get('photo')||'pier');state.caption=query.get('caption')||state.caption;state.subtitle=query.get('subtitle')||state.subtitle;
  controls.caption.value=state.caption;controls.subtitle.value=state.subtitle;state.grade=query.get('grade')||state.grade;controls.grade.value=state.grade;
  setLayout(query.get('layout')||'four');
  if(query.get('shot')==='cover'){
    const format=query.get('format')||'landscape',dimensions=format==='portrait'?[1080,1350]:format==='square'?[1080,1080]:[1920,1080];
    paintPoster(canvas,...dimensions);
  }
  if(query.get('shot')==='sizes')showSizeBoard();
}
connectControls();updatePreview();
const query=new URLSearchParams(location.search);
if(query.has('shot'))runShot(query,setupShot);
else loadSample('boulevard');
