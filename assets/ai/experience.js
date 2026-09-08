(() => {
'use strict';
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
const state={paused:reduce.matches,heroProgress:0,pointerX:0,pointerY:0};
const gs=window.gsap,ST=window.ScrollTrigger;
if(gs&&ST)gs.registerPlugin(ST);
const motion=document.querySelector('.motion-switch');
function setMotion(value){state.paused=value;document.body.classList.toggle('motion-paused',value);motion.setAttribute('aria-pressed',String(value));motion.setAttribute('aria-label',value?'Resume page motion':'Pause page motion');motion.querySelector('.motion-icon').textContent=value?'▷':'Ⅱ';if(gs)gs.globalTimeline.paused(value);}
motion.addEventListener('click',()=>setMotion(!state.paused));reduce.addEventListener('change',e=>setMotion(e.matches));
if(gs&&!reduce.matches){
 gs.from('.hero-line',{yPercent:40,opacity:0,rotation:3,duration:1.3,stagger:.13,ease:'power4.out'});
 gs.from('.hero-book-wrap',{y:90,opacity:0,duration:1.7,delay:.25,ease:'power3.out'});
 gs.to('.hero-book',{y:-14,rotation:1.5,duration:3.8,yoyo:true,repeat:-1,ease:'sine.inOut'});

 gs.timeline({scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1,onUpdate:s=>state.heroProgress=s.progress}}).to('.hero-line.first',{xPercent:-20,opacity:0,ease:'none'},0).to('.hero-line.second',{xPercent:20,opacity:0,ease:'none'},0).to('.hero-book-wrap',{scale:.65,yPercent:-5,rotation:-8,ease:'none'},0).to('.hero-caption',{opacity:0,y:-60,ease:'none'},.1).to('.hero-eyebrow',{opacity:0},0);
}
const canvas=document.querySelector('#music-universe'),ctx=canvas.getContext('2d',{alpha:true});
const page=new Image();page.src='/assets/ai/score-fur-elise.jpg';let w=0,h=0,dpr=1,last=0;let visible=true;
function resize(){const rect=canvas.getBoundingClientRect();w=rect.width;h=rect.height;dpr=Math.min(devicePixelRatio||1,1.6);canvas.width=w*dpr;canvas.height=h*dpr;ctx?.setTransform(dpr,0,0,dpr,0,0);}
resize();window.addEventListener('resize',resize,{passive:true});
document.addEventListener('pointermove',e=>{state.pointerX=(e.clientX/innerWidth-.5)*2;state.pointerY=(e.clientY/innerHeight-.5)*2;},{passive:true});
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;}).observe(canvas);
const motes=Array.from({length:90},(_,i)=>({angle:i*2.39996,r:.17+(i%13)/15,speed:.07+(i%5)*.008,size:.4+(i%4)*.45}));
function frame(ms){requestAnimationFrame(frame);if(!ctx||!visible||document.hidden)return;if(state.paused&&last)return;last=ms;const t=state.paused?0:ms*.001;ctx.clearRect(0,0,w,h);const cx=w*(w<600?.5:.77)+state.pointerX*12,cy=h*(w<600?.65:.61)+state.pointerY*8;
 const halo=ctx.createRadialGradient(cx,cy,0,cx,cy,w*.37);halo.addColorStop(0,'rgba(60,225,246,.11)');halo.addColorStop(.4,'rgba(166,80,247,.045)');halo.addColorStop(1,'rgba(10,0,20,0)');ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
 for(const p of motes){const a=p.angle+t*p.speed;const radius=p.r*w*.7;const x=cx+Math.cos(a)*radius,y=cy+Math.sin(a)*radius*.53;ctx.fillStyle=p.size>1?'rgba(83,232,248,.6)':'rgba(216,190,255,.4)';ctx.beginPath();ctx.arc(x,y,p.size,0,Math.PI*2);ctx.fill();}
 if(!page.complete||!page.naturalWidth)return;
 for(let i=0;i<13;i++){const cycle=(t*.036+i/13)%1;const r=(1-cycle)*w*.67+40;const a=i*2.4+t*.16+cycle*1.4;const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.5;const size=(40+(1-cycle)*80)*(w<600?.58:1);ctx.save();ctx.translate(x,y);ctx.rotate(a*.3+Math.sin(t*.3+i)*.1);ctx.globalAlpha=Math.min(1,cycle*6,(1-cycle)*5)*(.35+Math.abs(Math.cos(a))*.35);ctx.shadowColor=i%2?'#ab83e0':'#32dce8';ctx.shadowBlur=12;ctx.drawImage(page,-size*.38,-size*.5,size*.76,size);ctx.restore();}
}
requestAnimationFrame(frame);setMotion(reduce.matches);
// These interactions illustrate the musician's actions. No PDF leaves this page.
const replayButtons=document.querySelectorAll('[data-replay]');
let markTimeline,borrowTimeline,setTimeline;
function markPlay(kind){if(!gs)return;markTimeline?.kill();document.querySelectorAll('[data-mark]').forEach(b=>{b.classList.toggle('selected',b.dataset.mark===kind);b.setAttribute('aria-pressed',String(b.dataset.mark===kind));});
 if(state.paused){gs.set('.scribble,.cue-arrow',{strokeDashoffset:0});gs.set('.play-here,.courtesy-flat',{opacity:1,scale:1});gs.set('.mark-hand',{opacity:0});return;}
 markTimeline=gs.timeline();
 if(!kind||kind==='scribble')markTimeline.fromTo('.scribble',{strokeDashoffset:1200},{strokeDashoffset:0,duration:1.1,ease:'none'},0);
 if(!kind||kind==='cue')markTimeline.fromTo('.cue-arrow',{strokeDashoffset:260},{strokeDashoffset:0,duration:.65},kind?0:.9).fromTo('.play-here',{opacity:0,scale:.8},{opacity:1,scale:1,duration:.5,ease:'back.out(2)'},kind?0:.9);
 if(!kind||kind==='flat')markTimeline.fromTo('.courtesy-flat',{x:130,y:-80,scale:1.8,opacity:0},{x:0,y:0,scale:1,opacity:1,duration:1,ease:'power3.inOut'},kind?0:1.7).fromTo('.mark-hand',{x:130,y:-80,opacity:1},{x:0,y:0,opacity:0,duration:1},kind?0:1.7);
}
document.querySelectorAll('[data-mark]').forEach(b=>b.addEventListener('click',()=>markPlay(b.dataset.mark)));
function borrowPlay(){if(!gs)return;borrowTimeline?.kill();const stamp=document.querySelector('.borrow-stamp');if(state.paused){stamp.innerHTML='PASSAGE<br>IN PLACE.';return;}borrowTimeline=gs.timeline({onComplete:()=>{stamp.innerHTML='PASSAGE<br>IN PLACE.';}});const stage=document.querySelector('.borrow-stage');const distance=stage.clientWidth*.43;borrowTimeline.fromTo('.source-selection',{opacity:.3},{opacity:1,duration:.35,repeat:1,yoyo:true}).fromTo('.flying-passage',{x:0,y:0,rotation:-12,opacity:0,scale:1},{opacity:1,duration:.2}).to('.flying-passage',{x:distance,y:130,rotation:10,scale:1.05,duration:1.2,ease:'power3.inOut'}).to('.flying-passage',{opacity:0,duration:.2}).fromTo('.target-selection',{boxShadow:'0 0 0px #b49aff00',backgroundColor:'#a46dec25'},{boxShadow:'0 0 35px #b49aff70',backgroundColor:'#a46dec60',duration:.6,yoyo:true,repeat:1},'-=.2');}
document.querySelector('#borrow-demo').addEventListener('click',borrowPlay);
function setPlay(){if(!gs)return;setTimeline?.kill();const check=document.querySelector('.set-check');if(state.paused){check.textContent='Songs matched. Check your set.';return;}check.textContent='Finding your songs…';setTimeline=gs.timeline({onComplete:()=>check.textContent='Songs matched. Check your set.'});setTimeline.fromTo('.smudge-trail',{y:-30,scaleX:.2,opacity:0},{y:300,scaleX:1,opacity:1,duration:2.2,ease:'power1.inOut'},0).fromTo('.set-group.one .set-label',{scaleX:.2},{scaleX:1,duration:.35},.2).fromTo('.set-group.two .set-label',{scaleX:.2},{scaleX:1,duration:.35},1.1).fromTo('.set-item',{x:0},{x:24,stagger:.12,duration:.3,yoyo:true,repeat:1,ease:'power2.inOut'},.2).fromTo('.chart-match',{opacity:.15,scale:.8,x:-80},{opacity:1,scale:1,x:0,duration:.7,stagger:.22,ease:'back.out(1.4)'},.8).to('.smudge-trail',{opacity:0,duration:.5},2.2).to('.set-item i',{opacity:1,stagger:.1,duration:.2},1.8);}
replayButtons.forEach(b=>{if(b.dataset.replay==='markup')b.addEventListener('click',()=>markPlay());if(b.dataset.replay==='setlist')b.addEventListener('click',setPlay);});
if(gs&&ST&&!reduce.matches){
 document.querySelectorAll('.feature-heading h2,.books-copy h2,.pit-heading h2,.closing-copy h2,.rehearsal-copy h2').forEach(el=>gs.from(el,{y:65,rotation:2,opacity:.2,duration:1.1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 92%',toggleActions:'play none none reverse'}}));
 gs.fromTo('.score-window',{rotation:-7,y:60},{rotation:2,y:-30,ease:'none',scrollTrigger:{trigger:'.markup-stage',start:'top bottom',end:'bottom top',scrub:1}});
 gs.to('.mark-orbit-text',{xPercent:-20,ease:'none',scrollTrigger:{trigger:'.markup-stage',start:'top bottom',end:'bottom top',scrub:1}});
 gs.fromTo('.borrow-source',{rotation:-18,y:20},{rotation:-7,y:-40,ease:'none',scrollTrigger:{trigger:'.books-story',start:'top 80%',end:'bottom top',scrub:1}});
 gs.fromTo('.borrow-target',{rotation:15,y:40},{rotation:6,y:-20,ease:'none',scrollTrigger:{trigger:'.books-story',start:'top 80%',end:'bottom top',scrub:1}});
 gs.fromTo('.closing-book',{rotation:24,y:120},{rotation:10,y:-50,ease:'none',scrollTrigger:{trigger:'.closing-section',start:'top bottom',end:'bottom bottom',scrub:1.5}});
 ST.create({trigger:'.markup-stage',start:'top 65%',onEnter:()=>markPlay()});ST.create({trigger:'.borrow-stage',start:'top 55%',onEnter:borrowPlay});ST.create({trigger:'.set-stage',start:'top 60%',onEnter:setPlay});
}
const mixer=document.querySelector('#mixer'),expertButton=document.querySelector('#expert-toggle');let mixerTouched=false;
function toggleMixer(open){mixer.classList.toggle('is-open',open);mixer.inert=!open;expertButton.setAttribute('aria-expanded',String(open));expertButton.innerHTML=open?'Close the rhythm mixer <span>−</span>':'Open the rhythm mixer <span>+</span>';if(ST)setTimeout(()=>ST.refresh(),700);}
expertButton.addEventListener('click',()=>{mixerTouched=true;toggleMixer(expertButton.getAttribute('aria-expanded')!=='true');});
const faders=[...document.querySelectorAll('.fader-lane input')];
if(ST&&!reduce.matches){ST.create({trigger:'.metronome-demo',start:'top 55%',once:true,onEnter:()=>{if(!mixerTouched){toggleMixer(true);if(gs&&!state.paused){const values=[90,20,10,70,15,35,25,15,10];faders.forEach((f,i)=>gs.fromTo(f,{value:0},{value:values[i],duration:1.1,delay:.3+i*.07,ease:'power2.inOut',onUpdate:()=>f.dispatchEvent(new Event('input'))}));}}}});}
faders.forEach(f=>f.addEventListener('pointerdown',()=>{mixerTouched=true;if(gs)gs.killTweensOf(f);}));
const bpmInput=document.querySelector('#tempo-range'),tempoOutput=document.querySelector('#tempo-value'),ghost=document.querySelector('.tempo-ghost'),listen=document.querySelector('#listen');let bpm=120,listening=false,audio=null,audioTimer=null,nextNoteTime=0,tick=0,visualStep=-1;const sounds=new Set();
function setBpm(value){bpm=Math.min(220,Math.max(40,Math.round(value)));bpmInput.value=bpm;tempoOutput.textContent=bpm;ghost.textContent=bpm;}
bpmInput.addEventListener('input',()=>setBpm(Number(bpmInput.value)));document.querySelector('#tempo-minus').addEventListener('click',()=>setBpm(bpm-1));document.querySelector('#tempo-plus').addEventListener('click',()=>setBpm(bpm+1));
function pulse(beat){document.querySelectorAll('.beat-lights span').forEach((el,i)=>el.classList.toggle('active',i===beat%4));}
function visualBeat(ms){requestAnimationFrame(visualBeat);if(listening||state.paused||document.hidden)return;const beat=Math.floor(ms/1000*bpm/60);if(beat!==visualStep){visualStep=beat;pulse(beat);}}
requestAnimationFrame(visualBeat);
function clickTone(time,volume,accent){if(volume<=.005||!audio)return;const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.setValueAtTime(accent?1400:880,time);gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume*.15),time+.001);gain.gain.exponentialRampToValueAtTime(.0001,time+.035);osc.connect(gain);gain.connect(audio.destination);osc.start(time);osc.stop(time+.045);sounds.add(osc);osc.onended=()=>{sounds.delete(osc);osc.disconnect();gain.disconnect();};}
const periods={bar:48,half:24,halfTriplet:16,quarter:12,quarterTriplet:8,eighth:6,eighthTriplet:4,sixteenth:3,sixteenthTriplet:2};
function schedule(){if(!audio||!listening)return;while(nextNoteTime<audio.currentTime+.1){let vol=0;for(const f of faders){if(tick%periods[f.dataset.division]===0)vol=Math.max(vol,Number(f.value)/100);}clickTone(nextNoteTime,vol,tick%48===0);if(tick%12===0){const beat=tick/12;const delay=Math.max(0,(nextNoteTime-audio.currentTime)*1000);setTimeout(()=>{if(listening)pulse(beat);},delay);}nextNoteTime+=60/bpm/12;tick=(tick+1)%48;}}
function stopAudio(){listening=false;clearInterval(audioTimer);audioTimer=null;for(const osc of sounds){try{osc.stop();}catch{}}sounds.clear();listen.innerHTML='Listen <span>▷</span>';listen.setAttribute('aria-pressed','false');}
listen.addEventListener('click',async()=>{if(listening){stopAudio();return;}try{const AudioCtor=window.AudioContext||window.webkitAudioContext;if(!AudioCtor)throw new Error('unsupported');audio??=new AudioCtor();await audio.resume();listening=true;listen.innerHTML='Stop sound <span>Ⅱ</span>';listen.setAttribute('aria-pressed','true');nextNoteTime=audio.currentTime+.035;tick=0;schedule();audioTimer=setInterval(schedule,25);document.querySelector('.audio-status').textContent='Metronome playing.';}catch{document.querySelector('.audio-status').textContent='Sound is unavailable in this browser. The visual metronome still works.';stopAudio();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAudio();});window.addEventListener('pagehide',stopAudio);
const partLabels={Trumpet:'TRUMPET · IN YOUR BOOK',Flute:'FLUTE PASSAGE · IN YOUR BOOK',Clarinet:'CLARINET PASSAGE · IN YOUR BOOK'};
document.querySelectorAll('.part-choice').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.part-choice').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});const partImages={Trumpet:'score-trumpet.jpg',Flute:'score-flute.jpg',Clarinet:'score-clarinet.jpg'};document.querySelector('.pit-score-image img').src='/assets/ai/'+partImages[button.dataset.part];document.querySelector('.pit-score-image img').alt=button.dataset.part+' part from The Maid and the Mummy';document.querySelector('#active-part').textContent=button.dataset.part;document.querySelector('#passage-label').textContent=partLabels[button.dataset.part];if(gs&&!state.paused)gs.fromTo('.pit-passage',{opacity:.2,x:-40},{opacity:1,x:0,duration:.6,ease:'power3.out'});}));
// Restrained pointer depth: the heading stays legible; the book moves in its own space.
const heroImage=document.querySelector('.hero-book');document.querySelector('.hero-stage').addEventListener('pointermove',e=>{if(!gs||state.paused||e.pointerType==='touch')return;const px=e.clientX/innerWidth-.5,py=e.clientY/innerHeight-.5;gs.to(heroImage,{rotationY:px*10,rotationX:-py*7,duration:1.2,ease:'power2.out',overwrite:'auto'});},{passive:true});
window.addEventListener('load',()=>ST?.refresh());

})();
