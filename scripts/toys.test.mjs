import test from 'node:test';
import assert from 'node:assert/strict';
import {ClickScheduler,clickSamples,tickSound,silentMediaWav,divisions,tempoFromTaps} from '../assets/ai/metronome-core.mjs';
import {inkPath,linePath,segmentDistance} from '../assets/ai/markup-geometry.mjs';

test('tap tempo averages recent intervals and resets after a pause',()=>{
  assert.equal(tempoFromTaps([],100).bpm,null);
  assert.equal(tempoFromTaps([0,500,1000],1500).bpm,120);
  assert.equal(tempoFromTaps([0,600,1200],1800).bpm,100);
  assert.deepEqual(tempoFromTaps([0,500],4000),{taps:[4000],bpm:null});
  assert.equal(tempoFromTaps([0],100).bpm,220);
  assert.equal(tempoFromTaps([0],2000).bpm,40);
});

class AudioClock {
  constructor(){this.sampleRate=48000;this.currentTime=0;this.state='running';this.destination={};this.starts=[];}
  createBuffer(channels,length,rate){const data=new Float32Array(length);return {getChannelData:()=>data,length,sampleRate:rate};}
  createBufferSource(){const context=this;return {connect(){},disconnect(){},stop(){this.stopped=true;},start(time){context.starts.push({time,buffer:this.buffer});}};}
  createGain(){return {gain:{setValueAtTime(){}},connect(){},disconnect(){}};}
}

test('every subdivision has its expected onset count; muted lanes produce none',()=>{
  for(const [name,period] of Object.entries(divisions)){
    let onsets=0;for(let tick=0;tick<48;tick++)if(tickSound(tick,{[name]:1}).volume>0)onsets++;
    assert.equal(onsets,48/period,name);
  }
  assert.equal(tickSound(0,{}).volume,0);
  assert.equal(tickSound(0,{quarter:1,bar:0}).kind,'beat');
});

test('individual click buffers contain sound and taper to zero at both ends',()=>{
  for(const rate of [44100,48000])for(const hz of [790,1050,1550]){
    const samples=clickSamples(rate,hz);
    assert.equal(samples[0],0);assert.equal(Math.abs(samples.at(-1)),0);
    assert(samples.some(x=>Math.abs(x)>.3));assert(samples.every(x=>Math.abs(x)<1));
  }
  const silent=new DataView(silentMediaWav());for(let i=44;i<silent.byteLength;i+=2)assert.equal(silent.getInt16(i,true),0);
});

test('audio-clock scheduling stays evenly spaced across hundreds of bar boundaries',()=>{
  for(const bpm of [40,120,137,220]){
    const clock=new AudioClock(),scheduler=new ClickScheduler(clock,()=>({quarter:1}));scheduler.setTempo(bpm);scheduler.start();
    for(let i=0;i<18000;i++){clock.currentTime+=i%3===0?.018:i%3===1?.025:.047;scheduler.pump();}
    const times=clock.starts.map(x=>x.time);assert(times.length>350);
    for(let i=1;i<times.length;i++)assert(Math.abs(times[i]-times[i-1]-60/bpm)<1e-8,`BPM ${bpm}, beat ${i}`);
    assert(times.every((time,i)=>Math.abs(time-(.045+i*60/bpm))<1e-7));
  }
});

test('tempo and mixer edits reuse the clock without replaying a bar',()=>{
  const clock=new AudioClock();let levels={quarter:1};const scheduler=new ClickScheduler(clock,()=>levels);
  scheduler.start();for(let i=1;i<100;i++){clock.currentTime=i*.025;scheduler.pump();}
  const tick=scheduler.tick;scheduler.setTempo(180);assert.equal(scheduler.tick,tick);
  for(let i=100;i<220;i++){clock.currentTime=i*.025;scheduler.pump();}
  const tail=clock.starts.slice(-5);for(let i=1;i<tail.length;i++)assert(Math.abs(tail[i].time-tail[i-1].time-1/3)<1e-8);
  levels={};const count=clock.starts.length;clock.currentTime+=.25;scheduler.pump();assert.equal(clock.starts.length,count);
  levels={quarter:1};clock.currentTime+=.5;scheduler.pump();assert(clock.starts.length>count);
  assert(clock.starts.at(-1).time>=clock.currentTime);
  scheduler.stop();const stoppedCount=clock.starts.length;clock.currentTime+=1;scheduler.pump();assert.equal(clock.starts.length,stoppedCount);
});

test('ink smoothing retains the starting and ending touch positions',()=>{
  assert.equal(inkPath([]),'');
  assert.equal(inkPath([{x:5,y:6}]),'M5 6l.01 0');
  const path=inkPath([{x:5,y:6},{x:10,y:15},{x:20,y:25}]);
  assert(path.startsWith('M5 6'));assert(path.includes('Q10 15 15 20'));assert(path.endsWith('L20 25'));
});

test('arrow tip stays at the requested endpoint and eraser distance handles edges',()=>{
  assert.equal(linePath({x:0,y:0},{x:20,y:10},false),'M0 0L20 10');
  assert(linePath({x:0,y:0},{x:20,y:10},true).includes('L20 10L'));
  assert.equal(segmentDistance({x:5,y:4},{x:0,y:0},{x:10,y:0}),4);
  assert.equal(segmentDistance({x:15,y:0},{x:0,y:0},{x:10,y:0}),5);
  assert.equal(segmentDistance({x:3,y:4},{x:0,y:0},{x:0,y:0}),5);
});
