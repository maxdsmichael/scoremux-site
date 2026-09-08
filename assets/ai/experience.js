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
let borrowTimeline,setTimeline;
function borrowPlay(){if(!gs)return;borrowTimeline?.kill();const stamp=document.querySelector('.borrow-stamp');if(state.paused){stamp.innerHTML='PASSAGE<br>IN PLACE.';return;}borrowTimeline=gs.timeline({onComplete:()=>{stamp.innerHTML='PASSAGE<br>IN PLACE.';}});const stage=document.querySelector('.borrow-stage');const distance=stage.clientWidth*.43;borrowTimeline.fromTo('.source-selection',{opacity:.3},{opacity:1,duration:.35,repeat:1,yoyo:true}).fromTo('.flying-passage',{x:0,y:0,rotation:-12,opacity:0,scale:1},{opacity:1,duration:.2}).to('.flying-passage',{x:distance,y:130,rotation:10,scale:1.05,duration:1.2,ease:'power3.inOut'}).to('.flying-passage',{opacity:0,duration:.2}).fromTo('.target-selection',{boxShadow:'0 0 0px #b49aff00',backgroundColor:'#a46dec25'},{boxShadow:'0 0 35px #b49aff70',backgroundColor:'#a46dec60',duration:.6,yoyo:true,repeat:1},'-=.2');}
document.querySelector('#borrow-demo').addEventListener('click',borrowPlay);
function setPlay(){if(!gs)return;setTimeline?.kill();const check=document.querySelector('.set-check');if(state.paused){check.textContent='Songs matched. Check your set.';return;}check.textContent='Finding your songs…';setTimeline=gs.timeline({onComplete:()=>check.textContent='Songs matched. Check your set.'});setTimeline.fromTo('.smudge-trail',{y:-30,scaleX:.2,opacity:0},{y:300,scaleX:1,opacity:1,duration:2.2,ease:'power1.inOut'},0).fromTo('.set-group.one .set-label',{scaleX:.2},{scaleX:1,duration:.35},.2).fromTo('.set-group.two .set-label',{scaleX:.2},{scaleX:1,duration:.35},1.1).fromTo('.set-item',{x:0},{x:24,stagger:.12,duration:.3,yoyo:true,repeat:1,ease:'power2.inOut'},.2).fromTo('.chart-match',{opacity:.15,scale:.8,x:-80},{opacity:1,scale:1,x:0,duration:.7,stagger:.22,ease:'back.out(1.4)'},.8).to('.smudge-trail',{opacity:0,duration:.5},2.2).to('.set-item i',{opacity:1,stagger:.1,duration:.2},1.8);}
replayButtons.forEach(b=>{if(b.dataset.replay==='setlist')b.addEventListener('click',setPlay);});
if(gs&&ST&&!reduce.matches){
 document.querySelectorAll('.feature-heading h2,.books-copy h2,.pit-heading h2,.closing-copy h2,.rehearsal-copy h2').forEach(el=>gs.from(el,{y:65,rotation:2,opacity:.2,duration:1.1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 92%',toggleActions:'play none none reverse'}}));
 gs.fromTo('.borrow-source',{rotation:-18,y:20},{rotation:-7,y:-40,ease:'none',scrollTrigger:{trigger:'.books-story',start:'top 80%',end:'bottom top',scrub:1}});
 gs.fromTo('.borrow-target',{rotation:15,y:40},{rotation:6,y:-20,ease:'none',scrollTrigger:{trigger:'.books-story',start:'top 80%',end:'bottom top',scrub:1}});
 gs.fromTo('.closing-book',{rotation:24,y:120},{rotation:10,y:-50,ease:'none',scrollTrigger:{trigger:'.closing-section',start:'top bottom',end:'bottom bottom',scrub:1.5}});
 ST.create({trigger:'.borrow-stage',start:'top 55%',onEnter:borrowPlay});ST.create({trigger:'.set-stage',start:'top 60%',onEnter:setPlay});
}
const partLabels={Trumpet:'TRUMPET · IN YOUR BOOK',Flute:'FLUTE PASSAGE · IN YOUR BOOK',Clarinet:'CLARINET PASSAGE · IN YOUR BOOK'};
document.querySelectorAll('.part-choice').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.part-choice').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});const partImages={Trumpet:'score-trumpet.jpg',Flute:'score-flute.jpg',Clarinet:'score-clarinet.jpg'};document.querySelector('.pit-score-image img').src='/assets/ai/'+partImages[button.dataset.part];document.querySelector('.pit-score-image img').alt=button.dataset.part+' part from The Maid and the Mummy';document.querySelector('#active-part').textContent=button.dataset.part;document.querySelector('#passage-label').textContent=partLabels[button.dataset.part];if(gs&&!state.paused)gs.fromTo('.pit-passage',{opacity:.2,x:-40},{opacity:1,x:0,duration:.6,ease:'power3.out'});}));
// Restrained pointer depth: the heading stays legible; the book moves in its own space.
const heroImage=document.querySelector('.hero-book');document.querySelector('.hero-stage').addEventListener('pointermove',e=>{if(!gs||state.paused||e.pointerType==='touch')return;const px=e.clientX/innerWidth-.5,py=e.clientY/innerHeight-.5;gs.to(heroImage,{rotationY:px*10,rotationX:-py*7,duration:1.2,ease:'power2.out',overwrite:'auto'});},{passive:true});
window.addEventListener('load',()=>ST?.refresh());

})();
