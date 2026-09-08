export const divisions={bar:48,half:24,halfTriplet:16,quarter:12,quarterTriplet:8,eighth:6,eighthTriplet:4,sixteenth:3,sixteenthTriplet:2};
export function tempoFromTaps(previous,now){
  const taps=previous.length&&now-previous.at(-1)<2500?[...previous,now].slice(-6):[now];
  if(taps.length<2)return {taps,bpm:null};
  const interval=(taps.at(-1)-taps[0])/(taps.length-1);
  return {taps,bpm:Math.max(40,Math.min(220,Math.round(60000/interval)))};
}
export function clickSamples(sampleRate,frequency){
  const result=new Float32Array(Math.ceil(sampleRate*.045));
  for(let i=0;i<result.length;i++){
    const t=i/sampleRate,attack=Math.min(1,i/(sampleRate*.001));
    const tail=Math.min(1,(result.length-1-i)/(sampleRate*.005));
    result[i]=.72*attack*tail*Math.exp(-t*105)*(Math.sin(2*Math.PI*frequency*t)+.18*Math.sin(2*Math.PI*frequency*2.7*t));
  }
  return result;
}
export function tickSound(tick,levels){
  let volume=0;
  for(const [division,period] of Object.entries(divisions))if(tick%period===0)volume=Math.max(volume,Math.max(0,Math.min(1,Number(levels[division])||0)));
  return {volume,kind:tick%48===0&&levels.bar>0?'accent':tick%12===0?'beat':'subdivision'};
}
// Only the audio clock controls note times. The polling timer just fills the lookahead window.
export class ClickScheduler{
  constructor(context,readLevels,onBeat=()=>{}){
    this.context=context;this.readLevels=readLevels;this.onBeat=onBeat;this.bpm=120;this.nextTime=0;this.tick=0;this.running=false;this.voices=new Set();
    this.buffers=Object.fromEntries(Object.entries({accent:1550,beat:1050,subdivision:790}).map(([kind,hz])=>{
      const samples=clickSamples(context.sampleRate,hz),buffer=context.createBuffer(1,samples.length,context.sampleRate);buffer.getChannelData(0).set(samples);return [kind,buffer];
    }));
  }
  setTempo(value){this.bpm=Math.max(40,Math.min(220,Math.round(value)));}
  start(){this.stop();this.tick=0;this.nextTime=this.context.currentTime+.045;this.running=true;this.pump();}
  pump(){
    if(!this.running||this.context.state!=='running')return;
    const now=this.context.currentTime,step=60/this.bpm/12;
    // A stalled UI must not emit a burst of late notes on recovery.
    if(this.nextTime<now){const missed=Math.ceil((now-this.nextTime)/step);this.nextTime+=missed*step;this.tick+=missed;}
    while(this.nextTime<now+.2){
      const tick=this.tick,time=this.nextTime,{volume,kind}=tickSound(tick,this.readLevels());
      if(volume>0){
        const source=this.context.createBufferSource(),gain=this.context.createGain();
        source.buffer=this.buffers[kind];gain.gain.setValueAtTime(volume,time);source.connect(gain);gain.connect(this.context.destination);
        this.voices.add(source);source.onended=()=>{this.voices.delete(source);source.disconnect();gain.disconnect();};source.start(time);
      }
      if(tick%12===0)this.onBeat({time,beat:(tick/12)%4});
      this.tick++;this.nextTime+=step;
    }
  }
  stop(){this.running=false;for(const source of this.voices){try{source.stop();}catch{}}this.voices.clear();}
}
// Older iOS versions need an unmuted media session to route Web Audio past silent mode.
// This buffer is entirely silent; it never contains clicks or controls their timing.
export function silentMediaWav(){
  const rate=8000,samples=rate*10,buffer=new ArrayBuffer(44+samples*2),view=new DataView(buffer);
  const word=(offset,text)=>[...text].forEach((char,i)=>view.setUint8(offset+i,char.charCodeAt(0)));
  word(0,'RIFF');view.setUint32(4,36+samples*2,true);word(8,'WAVE');word(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);word(36,'data');view.setUint32(40,samples*2,true);
  return buffer;
}
