(() => {
  const gs=window.gsap, stage=document.querySelector('.markup-stage');
  if(!gs||!stage)return;
  const score=stage.querySelector('.rehearsal-score'), toolbox=stage.querySelector('.edit-toolbox');
  const narrow=matchMedia('(max-width:600px)'), reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const marks={pencil:'.scribble',marker:'.scribble',line:'.cue-arrow',text:'.play-out',stamp:'.courtesy-accidental',highlighter:'.demo-highlight',shape:'.demo-shape'};
  const instructions={pencil:['Pencil','Draw on the music'],marker:['Marker','Draw on the music'],highlighter:['Highlighter','Highlight a passage'],erase:['Eraser','Erase your marks'],line:['Lines','Draw a line on the music'],shape:['Shape','Tap to add a shape'],text:['Text','Tap the music to add a note'],stamp:['Stamps','Musical marks, ready to place']};
  let sequence,active='pencil',history=[],started=false;
  const paused=()=>reduced.matches||document.body.classList.contains('motion-paused');
  const viewFor=tool=>narrow.matches?(tool==='pencil'||tool==='marker'?'120 105 350 200':'535 105 350 200'):'85 95 820 220';
  function focus(tool,animate=true){gs.to(score,{attr:{viewBox:viewFor(tool)},duration:animate&&!paused()?.8:0,ease:'power3.inOut'});stage.querySelector('.reader-zoom-value').textContent='Zoomed in';stage.querySelector('#rehearsal-fit').textContent='Fit page';}
  function select(tool){active=tool;const info=instructions[tool];stage.querySelector('#edit-tool-name').textContent=info[0];stage.querySelector('#edit-tool-instruction').textContent=info[1];stage.querySelectorAll('[data-draw]').forEach(b=>{const selected=b.dataset.draw===tool;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));if(selected)toolbox.style.setProperty('--active-color',b.style.getPropertyValue('--tool-color'));});stage.querySelector('.stamp-chooser').hidden=tool!=='stamp';stage.querySelector('.tool-properties').hidden=tool==='stamp';}
  function draw(tool){
    select(tool);focus(tool);
    if(tool==='erase'){undo();return;}
    const el=stage.querySelector(marks[tool]);if(!el)return;
    history.push(el);
    const duration=paused()?0:.85;
    if(tool==='pencil'||tool==='marker'||tool==='line'){
      el.style.stroke=stage.querySelector('#markup-color').value;
      el.style.strokeWidth=stage.querySelector('#markup-width').value;
      const length=el.getTotalLength();gs.fromTo(el,{opacity:1,strokeDasharray:length,strokeDashoffset:length},{strokeDashoffset:0,duration,ease:'none',delay:paused()?0:.7});
    }else gs.fromTo(el,{opacity:0},{opacity:1,duration,delay:paused()?0:.7});
  }
  function stopDemo(){sequence?.kill();gs.killTweensOf([score,...stage.querySelectorAll('.score-annotations>*')]);}
  function undo(){const el=history.pop();if(el)gs.set(el,{opacity:0});}
  function replay(){
    stopDemo();history=[];
    gs.set(stage.querySelectorAll('.score-annotations>*'),{opacity:0});
    stage.querySelector('.extra-draw-tools').hidden=true;
    stage.querySelector('.courtesy-accidental').textContent=String.fromCodePoint(57952);
    if(paused()){['pencil','line','text','stamp'].forEach(t=>{const el=stage.querySelector(marks[t]);gs.set(el,{opacity:1,strokeDashoffset:0});history.push(el);});select('stamp');focus('stamp',false);return;}
    score.setAttribute('viewBox','45 65 970 540');
    select('pencil');sequence=gs.timeline();
    sequence.to(score,{attr:{viewBox:viewFor('pencil')},duration:1.2,ease:'power3.inOut'},0);
    sequence.call(()=>draw('pencil'),[],1.25);
    sequence.call(()=>draw('line'),[],3.45);
    sequence.call(()=>draw('text'),[],5.35);
    sequence.call(()=>{select('stamp');focus('stamp');},[],7.15);
    sequence.call(()=>{stage.querySelector('[data-stamp="57952"]').classList.add('selected');history.push(stage.querySelector(marks.stamp));gs.fromTo(marks.stamp,{x:25,y:-25,opacity:0},{x:0,y:0,opacity:1,duration:.75,ease:'power3.out'});},[],8.35);
  }
  stage.querySelectorAll('[data-draw]').forEach(button=>button.addEventListener('click',()=>{
    stopDemo();
    const tool=button.dataset.draw;
    if(tool==='more'){const tray=stage.querySelector('.extra-draw-tools');tray.hidden=!tray.hidden;button.setAttribute('aria-pressed',String(!tray.hidden));return;}
    if(tool==='stamp'){select(tool);focus(tool);return;}
    draw(tool);
  }));
  // Compact app chrome moves Text and Lines into Tools while keeping the four daily tools.
  for(const tool of ['text','line']){const copy=stage.querySelector(`[data-draw="${tool}"]`).cloneNode(true);copy.addEventListener('click',()=>{stopDemo();draw(tool);});stage.querySelector('.extra-draw-tools').append(copy);}
  stage.querySelectorAll('[data-stamp]').forEach(button=>button.addEventListener('click',()=>{stopDemo();const el=stage.querySelector(marks.stamp);el.textContent=String.fromCodePoint(+button.dataset.stamp);stage.querySelectorAll('[data-stamp]').forEach(b=>b.classList.toggle('selected',b===button));history.push(el);focus('stamp');gs.fromTo(el,{x:20,y:-20,opacity:0},{x:0,y:0,opacity:1,duration:paused()?0:.6});}));
  stage.querySelector('#markup-undo').addEventListener('click',()=>{stopDemo();undo();});
  stage.querySelector('#put-tool-down').addEventListener('click',()=>{stopDemo();stage.querySelector('#edit-tool-name').textContent='Choose a tool';stage.querySelector('#edit-tool-instruction').textContent='Tap a tool to mark the music';stage.querySelectorAll('[data-draw]').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');});stage.querySelector('.stamp-chooser').hidden=true;});
  stage.querySelector('#markup-color').addEventListener('input',e=>{const el=stage.querySelector(marks[active]);if(el&&active!=='stamp')el.style[active==='text'?'fill':'stroke']=e.target.value;});
  stage.querySelector('#markup-width').addEventListener('input',e=>{const el=stage.querySelector(marks[active]);if(el)el.style.strokeWidth=e.target.value;});
  stage.querySelector('#rehearsal-fit').addEventListener('click',e=>{stopDemo();const fit=e.target.textContent==='Fit page';gs.to(score,{attr:{viewBox:fit?'45 65 970 540':viewFor(active)},duration:paused()?0:.7});e.target.textContent=fit?'Zoom in':'Fit page';});
  document.querySelector('[data-replay="markup"]').addEventListener('click',replay);
  new IntersectionObserver(entries=>{if(entries[0].isIntersecting&&!started){started=true;document.fonts.load('32px Petaluma').then(replay);}}, {threshold:.35}).observe(stage);
  narrow.addEventListener('change',()=>{stopDemo();focus(active,false);});
})();
