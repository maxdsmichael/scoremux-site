import {inkPath,linePath,segmentDistance} from './markup-geometry.mjs';
const stage=document.querySelector('.markup-stage'),gs=window.gsap;
const score=stage.querySelector('.rehearsal-score'),toolbox=stage.querySelector('.edit-toolbox'),ink=score.querySelector('.score-annotations');
const narrow=matchMedia('(max-width:600px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
const ns='http://www.w3.org/2000/svg',baseline=[...ink.children].map(el=>el.cloneNode(true));
const demoMarks={pencil:'.scribble',line:'.cue-arrow',text:'.play-out',stamp:'.courtesy-accidental'};
const instructions={pencil:['Pencil','Draw on the music'],marker:['Marker','Draw on the music'],highlighter:['Highlighter','Highlight a passage'],erase:['Eraser','Drag over ink to erase it'],line:['Lines','Drag to draw a line'],shape:['Shape','Drag to draw a shape'],text:['Text','Tap the music to place your words'],stamp:['Stamps','Choose a stamp, then tap the music']};
const settings={pencil:{color:'#30343b',width:2},marker:{color:'#ed265c',width:5},highlighter:{color:'#f3d133',width:16},line:{color:'#ed265c',width:3},shape:{color:'#3887e6',width:2},text:{color:'#ed265c',width:3},stamp:{color:'#307de4',width:3},erase:{color:'#30343b',width:14}};
const color=stage.querySelector('#markup-color'),width=stage.querySelector('#markup-width');
let sequence,active='pencil',history=[],started=false,interacted=false,gesture=null,stamp=57952,generation=0;
const paused=()=>reduced.matches||document.body.classList.contains('motion-paused');
const viewFor=tool=>narrow.matches?(tool==='pencil'||tool==='marker'?'120 105 350 200':'535 105 350 200'):'85 95 820 220';
function animateView(view,animate=true){if(gs&&!paused()&&animate)gs.to(score,{attr:{viewBox:view},duration:.75,ease:'power3.inOut'});else score.setAttribute('viewBox',view);}
function focus(tool,animate=true){animateView(viewFor(tool),animate);stage.querySelector('#rehearsal-fit').textContent='Fit page';}
function stopDemo(){generation++;sequence?.kill();gs?.killTweensOf([score,...ink.children]);}
function takeControl(){interacted=true;started=true;stopDemo();}
function snapshot(){return {nodes:[...ink.children].map(el=>el.cloneNode(true)),signature:ink.innerHTML};}
function restore(saved){ink.replaceChildren(...saved.nodes.map(el=>el.cloneNode(true)));}
function remember(before){if(before.signature===ink.innerHTML)return;history.push(before);if(history.length>35)history.shift();updateUndo();}
function updateUndo(){stage.querySelector('#markup-undo').disabled=!history.length;}
function select(tool){
  active=tool;const info=instructions[tool]||['Choose a tool','Tap a tool to mark the music'];
  stage.querySelector('#edit-tool-name').textContent=info[0];stage.querySelector('#edit-tool-instruction').textContent=info[1];
  score.classList.toggle('drawing-enabled',!!tool);
  score.style.cursor=!tool?'default':tool==='text'?'text':'crosshair';
  stage.querySelectorAll('[data-draw]').forEach(b=>{const selected=b.dataset.draw===tool;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));if(selected)toolbox.style.setProperty('--active-color',b.style.getPropertyValue('--tool-color'));});
  stage.querySelector('.stamp-chooser').hidden=tool!=='stamp';
  stage.querySelector('.tool-properties').hidden=!tool;
  stage.querySelector('.shape-option').hidden=tool!=='shape';stage.querySelector('.line-option').hidden=tool!=='line';stage.querySelector('.text-option').hidden=tool!=='text';
  stage.querySelector('.tool-color').hidden=!tool||tool==='erase';stage.querySelector('.tool-width').hidden=!tool||['text','stamp'].includes(tool);
  if(tool){color.value=settings[tool].color;width.max=tool==='highlighter'?30:tool==='erase'?35:10;width.value=settings[tool].width;}
}
function create(tag,attributes={}){const el=document.createElementNS(ns,tag);for(const [key,value] of Object.entries(attributes))el.setAttribute(key,String(value));el.dataset.userInk='true';return el;}
function scorePoint(event){const matrix=score.getScreenCTM();if(!matrix)return null;const point=score.createSVGPoint();point.x=event.clientX;point.y=event.clientY;return point.matrixTransform(matrix.inverse());}
function visible(el){return getComputedStyle(el).opacity!=='0'&&el.getAttribute('display')!=='none';}
function hit(el,p,radius){
  if(!visible(el))return false;
  const box=el.getBBox();
  if(p.x<box.x-radius||p.x>box.x+box.width+radius||p.y<box.y-radius||p.y>box.y+box.height+radius)return false;
  if(typeof el.getTotalLength!=='function')return true;
  const length=el.getTotalLength(),pad=radius+(parseFloat(getComputedStyle(el).strokeWidth)||0)/2;
  let previous=el.getPointAtLength(0);const step=Math.max(2,radius*.65);
  for(let t=step;t<length+step;t+=step){const point=el.getPointAtLength(Math.min(t,length));if(segmentDistance(p,previous,point)<=pad)return true;previous=point;}
  return false;
}
function eraseAt(p){
  // The source image is a sibling of this ink-only group and is never an eraser target.
  for(const el of [...ink.children].reverse())if(hit(el,p,settings.erase.width/2)){el.remove();gesture.changed=true;}
}
function paintMove(event){
  if(!gesture||gesture.id!==event.pointerId)return;
  const p=scorePoint(event);if(!p)return;
  const g=gesture;
  if(g.tool==='erase'){eraseAt(p);return;}
  if(['pencil','marker','highlighter'].includes(g.tool)){
    const samples=event.getCoalescedEvents?.()||[event];
    for(const sample of samples.length?samples:[event]){const next=scorePoint(sample);if(next&&Math.hypot(next.x-g.points.at(-1).x,next.y-g.points.at(-1).y)>.25)g.points.push({x:next.x,y:next.y});}
    g.el.setAttribute('d',inkPath(g.points));
  }else if(g.tool==='line')g.el.setAttribute('d',linePath(g.start,p,stage.querySelector('#markup-line').value==='arrow',g.width));
  else if(g.tool==='shape'){
    const x=Math.min(p.x,g.start.x),y=Math.min(p.y,g.start.y),w=Math.abs(p.x-g.start.x),h=Math.abs(p.y-g.start.y);
    if(g.el.localName==='rect'){for(const [key,value] of Object.entries({x,y,width:w,height:h}))g.el.setAttribute(key,value);}
    else for(const [key,value] of Object.entries({cx:x+w/2,cy:y+h/2,rx:w/2,ry:h/2}))g.el.setAttribute(key,value);
  }
  g.changed=true;
}
score.addEventListener('pointerdown',event=>{
  if(event.button!==0||!active||gesture)return;
  const p=scorePoint(event);if(!p)return;
  takeControl();event.preventDefault();
  const before=snapshot(),tool=active,setting=settings[tool];
  if(tool==='stamp'||tool==='text'){
    const el=create('text',{x:p.x,y:p.y,fill:setting.color,'font-size':tool==='stamp'?32:20,'font-family':tool==='stamp'?'Petaluma':'Georgia, serif'});
    el.textContent=tool==='stamp'?String.fromCodePoint(stamp):stage.querySelector('#markup-text').value.trim();
    if(!el.textContent)return;
    ink.append(el);remember(before);return;
  }
  gesture={id:event.pointerId,tool,start:{x:p.x,y:p.y},points:[{x:p.x,y:p.y}],before,changed:false,width:setting.width};
  score.setPointerCapture(event.pointerId);
  if(tool==='erase'){eraseAt(p);return;}
  const attrs={fill:'none',stroke:setting.color,'stroke-width':setting.width,'stroke-linecap':'round','stroke-linejoin':'round'};
  const el=create(tool==='shape'?stage.querySelector('#markup-shape').value:'path',attrs);
  if(tool==='highlighter'){el.setAttribute('opacity','.38');el.style.mixBlendMode='multiply';}
  if(tool==='shape'){
    const geometry=el.localName==='rect'?{x:p.x,y:p.y,width:0,height:0}:{cx:p.x,cy:p.y,rx:0,ry:0};for(const [key,value] of Object.entries(geometry))el.setAttribute(key,value);
  }else el.setAttribute('d',inkPath(gesture.points));
  gesture.el=el;ink.append(el);gesture.changed=true;
});
score.addEventListener('pointermove',paintMove);
function endGesture(event,cancelled=false){
  if(!gesture||event.pointerId!==gesture.id)return;
  if(!cancelled)paintMove(event);
  const g=gesture;gesture=null;
  if(cancelled)restore(g.before);else if(g.changed)remember(g.before);
  if(score.hasPointerCapture(event.pointerId))score.releasePointerCapture(event.pointerId);
}
score.addEventListener('pointerup',e=>endGesture(e));score.addEventListener('pointercancel',e=>endGesture(e,true));score.addEventListener('lostpointercapture',e=>endGesture(e,true));
function pickTool(button){takeControl();const tool=button.dataset.draw;if(tool==='more'){const tray=stage.querySelector('.extra-draw-tools');tray.hidden=!tray.hidden;button.setAttribute('aria-pressed',String(!tray.hidden));return;}select(tool);}
for(const tool of ['text','line'])stage.querySelector('.extra-draw-tools').append(stage.querySelector(`[data-draw="${tool}"]`).cloneNode(true));
stage.querySelectorAll('[data-draw]').forEach(button=>button.addEventListener('click',()=>pickTool(button)));
stage.querySelectorAll('[data-stamp]').forEach(button=>button.addEventListener('click',()=>{takeControl();stamp=+button.dataset.stamp;select('stamp');stage.querySelectorAll('[data-stamp]').forEach(b=>b.classList.toggle('selected',b===button));}));
color.addEventListener('input',()=>{takeControl();if(active)settings[active].color=color.value;});
width.addEventListener('input',()=>{takeControl();if(active)settings[active].width=+width.value;});
stage.querySelector('#markup-undo').addEventListener('click',()=>{takeControl();const previous=history.pop();if(previous!==undefined)restore(previous);updateUndo();});
stage.querySelector('#markup-clear').addEventListener('click',()=>{takeControl();const before=snapshot();ink.replaceChildren();remember(before);});
stage.querySelector('#put-tool-down').addEventListener('click',()=>{takeControl();select(null);});
stage.querySelector('#rehearsal-fit').addEventListener('click',event=>{takeControl();const fit=event.target.textContent==='Fit page';animateView(fit?'45 65 970 540':viewFor(active||'pencil'));event.target.textContent=fit?'Zoom in':'Fit page';});
function demoDraw(tool){
  select(tool);focus(tool);
  const el=ink.querySelector(demoMarks[tool]);if(!el)return;
  if(tool==='pencil'||tool==='line'){const length=el.getTotalLength();gs.fromTo(el,{opacity:1,strokeDasharray:length,strokeDashoffset:length},{strokeDashoffset:0,duration:.85,ease:'none',delay:.7});}
  else gs.fromTo(el,{opacity:0},{opacity:1,duration:.7,delay:.7});
}
function replay(){
  stopDemo();const before=snapshot();
  // Preserve the visitor's drawing; replay only replaces the example annotations.
  const visitorMarks=[...ink.querySelectorAll('[data-user-ink]')].map(el=>el.cloneNode(true));
  ink.replaceChildren(...baseline.map(el=>el.cloneNode(true)),...visitorMarks);remember(before);
  stage.querySelector('.extra-draw-tools').hidden=true;
  for(const el of ink.children)if(!el.dataset.userInk)el.style.opacity='0';
  if(paused()||!gs){for(const selector of Object.values(demoMarks)){const el=ink.querySelector(selector);el.style.opacity='1';el.style.strokeDashoffset='0';}select('pencil');focus('stamp',false);return;}
  score.setAttribute('viewBox','45 65 970 540');select('pencil');sequence=gs.timeline();
  sequence.to(score,{attr:{viewBox:viewFor('pencil')},duration:1.2,ease:'power3.inOut'},0);
  sequence.call(()=>demoDraw('pencil'),[],1.25).call(()=>demoDraw('line'),[],3.45).call(()=>demoDraw('text'),[],5.35);
  sequence.call(()=>{select('stamp');focus('stamp');},[],7.15);
  sequence.call(()=>{gs.fromTo(ink.querySelector(demoMarks.stamp),{x:25,y:-25,opacity:0},{x:0,y:0,opacity:1,duration:.75,ease:'power3.out'});},[],8.35);
  sequence.call(()=>{select('pencil');},[],9.3);
}
document.querySelector('[data-replay="markup"]').addEventListener('click',()=>{interacted=true;started=true;replay();});
new IntersectionObserver(entries=>{if(entries[0].isIntersecting&&!started){started=true;const version=generation;document.fonts.load('32px Petaluma').then(()=>{if(!interacted&&version===generation)replay();});}}, {threshold:.3}).observe(stage);
narrow.addEventListener('change',()=>{stopDemo();focus(active||'pencil',false);});
select('pencil');updateUndo();
