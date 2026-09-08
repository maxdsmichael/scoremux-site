const n=value=>Math.round(value*100)/100;
export function inkPath(points){
  if(!points.length)return '';
  const first=points[0];let d=`M${n(first.x)} ${n(first.y)}`;
  if(points.length===1)return d+`l.01 0`;
  for(let i=1;i<points.length-1;i++){const p=points[i],q=points[i+1];d+=`Q${n(p.x)} ${n(p.y)} ${n((p.x+q.x)/2)} ${n((p.y+q.y)/2)}`;}
  const last=points.at(-1);return d+`L${n(last.x)} ${n(last.y)}`;
}
export function linePath(a,b,arrow,width=3){
  let d=`M${n(a.x)} ${n(a.y)}L${n(b.x)} ${n(b.y)}`;
  const length=Math.hypot(b.x-a.x,b.y-a.y);if(!arrow||length<1)return d;
  const angle=Math.atan2(b.y-a.y,b.x-a.x),size=Math.min(length*.4,Math.max(10,width*3));
  return d+`M${n(b.x-size*Math.cos(angle-.5))} ${n(b.y-size*Math.sin(angle-.5))}L${n(b.x)} ${n(b.y)}L${n(b.x-size*Math.cos(angle+.5))} ${n(b.y-size*Math.sin(angle+.5))}`;
}
export function segmentDistance(p,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
  const t=length?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length)):0;
  return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
