import {ClickScheduler,silentMediaWav,tempoFromTaps} from './metronome-core.mjs';
const host=document.querySelector('.metronome-demo');
const faders=[...host.querySelectorAll('.fader-lane input')],listen=host.querySelector('#listen'),status=host.querySelector('.audio-status');
const range=host.querySelector('#tempo-range'),output=host.querySelector('#tempo-value'),tap=host.querySelector('#tap-tempo');
let bpm=120,playing=false,starting=false,taps=[],startId=0,light=-1,context=null,engine=null,timer=null,beats=[],routeAudio=null,routeURL=null;
const mixer=host.querySelector('#mixer'),expert=host.querySelector('#expert-toggle');
const glow=host.querySelector('.metronome-glow'),reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let glowPulse=null;
expert.addEventListener('click',()=>{const open=expert.getAttribute('aria-expanded')!=='true';mixer.classList.toggle('is-open',open);mixer.inert=!open;expert.setAttribute('aria-expanded',String(open));expert.innerHTML=open?'Close the rhythm mixer <span>−</span>':'Open the rhythm mixer <span>+</span>';setTimeout(()=>window.ScrollTrigger?.refresh(),700);});
function setBpm(value){if(!Number.isFinite(value))return;bpm=Math.max(40,Math.min(220,Math.round(value)));range.value=bpm;output.textContent=bpm;document.querySelector('.tempo-ghost').textContent=bpm;engine?.setTempo(bpm);}
range.addEventListener('input',()=>{taps=[];setBpm(+range.value);});
for(const [selector,delta] of [['#tempo-minus',-1],['#tempo-plus',1]])host.querySelector(selector).addEventListener('click',()=>{taps=[];setBpm(bpm+delta);});
tap.addEventListener('click',()=>{const result=tempoFromTaps(taps,performance.now());taps=result.taps;if(result.bpm)setBpm(result.bpm);tap.querySelector('small').textContent=result.bpm?`${bpm} BPM`:'Keep tapping';tap.classList.remove('tapped');void tap.offsetWidth;tap.classList.add('tapped');});
function enableAudioRoute(){
  let configured=false;
  try{if(navigator.audioSession){navigator.audioSession.type='playback';configured=true;}}catch{}
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if(!configured&&ios){
    if(!routeAudio){routeURL=URL.createObjectURL(new Blob([silentMediaWav()],{type:'audio/wav'}));routeAudio=new Audio(routeURL);routeAudio.loop=true;routeAudio.volume=1;routeAudio.setAttribute('playsinline','');}
    // Start in the original tap handler, before any asynchronous work.
    routeAudio.play()?.catch(()=>{});
  }
}
function stop(message=''){
  startId++;starting=false;playing=false;clearInterval(timer);timer=null;engine?.stop();engine=null;beats=[];routeAudio?.pause();
  if(context){const closing=context;context=null;closing.close().catch(()=>{});}
  listen.innerHTML='Listen <span>▷</span>';listen.setAttribute('aria-pressed','false');status.textContent=message;
}
function start(){
  if(playing||starting){stop();return;}
  const id=++startId;starting=true;
  try{
    enableAudioRoute();
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)throw new Error('Web Audio unavailable');
    context=new AudioContext({latencyHint:'interactive'});
    const current=context;
    // Both context creation and resume happen directly in the Listen gesture.
    const ready=current.resume();
    listen.innerHTML='Starting…';
    Promise.resolve(ready).then(()=>{
      if(id!==startId)return;
      if(current.state!=='running'){stop('Audio is paused by the device. Tap Listen to try again.');return;}
      if(faders.every(f=>+f.value===0))faders.find(f=>f.dataset.division==='quarter').value=70;
      engine=new ClickScheduler(current,()=>Object.fromEntries(faders.map(f=>[f.dataset.division,+f.value/100])),event=>beats.push(event));
      engine.setTempo(bpm);engine.start();timer=setInterval(()=>engine?.pump(),25);
      starting=false;playing=true;listen.innerHTML='Stop sound <span>Ⅱ</span>';listen.setAttribute('aria-pressed','true');status.textContent='';
      current.addEventListener('statechange',()=>{if(context===current&&playing&&current.state!=='running')stop('Playback was interrupted. Tap Listen to resume.');});
    }).catch(()=>{if(id===startId)stop('Sound could not start. Tap Listen to try again.');});
  }catch{stop('Sound could not start. Tap Listen to try again.');}
}
listen.addEventListener('click',start);
faders.forEach(f=>f.addEventListener('input',()=>{status.textContent=playing&&faders.every(f=>+f.value===0)?'All rhythm levels are muted.':'';}));
function pulse(beat){
  if(beat===light)return;light=beat;
  host.querySelectorAll('.beat-lights span').forEach((el,i)=>el.classList.toggle('active',i===beat));
  glowPulse?.cancel();
  if(glow&&!reducedMotion.matches&&!document.body.classList.contains('motion-paused')){
    glowPulse=glow.animate([{opacity:0},{opacity:beat===0?.65:.42,offset:.13},{opacity:0}],{duration:Math.min(600,60000/bpm*.9),easing:'ease-out'});
  }
}
function frame(ms){
  requestAnimationFrame(frame);if(document.hidden)return;
  if(playing&&context){let audible=context.currentTime;const timestamp=context.getOutputTimestamp?.();if(timestamp?.contextTime>0)audible=timestamp.contextTime+(performance.now()-timestamp.performanceTime)/1000;
    while(beats.length&&beats[0].time<=audible)pulse(beats.shift().beat);
  }else if(!document.body.classList.contains('motion-paused'))pulse(Math.floor(ms/1000*bpm/60)%4);
}
requestAnimationFrame(frame);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
window.addEventListener('pagehide',event=>{stop();if(!event.persisted&&routeURL)URL.revokeObjectURL(routeURL);});
