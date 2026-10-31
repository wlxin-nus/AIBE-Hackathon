(() => {
const NS='http://www.w3.org/2000/svg';
const thermal=window.ComfortThermal;
const {fcus,desks,outline,seats}=thermal;
const objects=[];
const palette={desk:['#e5d6bd','#c8b99f','#d5c6ad'],seat:['#c4cfb9','#99aa91','#acbba2'],fcu:['#8eb8b0','#547e77','#709b93']};
function mesh(name,points,faces,colors,kind='furniture'){const o={name,points,faces,colors,kind};objects.push(o);return o;}
function box(name,x,y,z,w,d,h,colors,kind='furniture'){
 return mesh(name,[[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z],[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],[[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]],[colors[1],colors[1],colors[2],colors[1],colors[2],colors[0]],kind);
}
// All heights are conceptual drawing units, rather than measured dimensions. 所有高度为概念绘图单位，而非实测尺寸。
const floorPoints=outline.map(([x,y])=>[x,y,-20]).concat(outline.map(([x,y])=>[x,y,0]));
const n=outline.length;
const floorFaces=[];
for(let i=0;i<n;i++)floorFaces.push([i,(i+1)%n,(i+1)%n+n,i+n]);
floorFaces.push(Array.from({length:n},(_,i)=>i+n));
mesh('Room slab',floorPoints,floorFaces,floorFaces.map((_,i)=>i===n?'#f4f3e9':'#cecec0'),'floor');
// Full-height rear walls, with open front and side for an unobstructed cutaway. 后墙保持完整高度，前侧敞开以展示内部。
for(const [i,j] of [[1,2],[2,3],[3,4]]){
const a=outline[i],b=outline[j];
mesh('Rear wall',[[...a,0],[...b,0],[...b,325],[...a,325]],[[0,1,2,3]],['#eceee4'],'wall');
}
// Low perimeter upstand traces the original curved room edge. 低矮边缘沿原始曲线轮廓布置。
for(let i=4;i<n-1;i++){
const a=outline[i],b=outline[i+1];
mesh('Perimeter edge',[[...a,0],[...b,0],[...b,24],[...a,24]],[[0,1,2,3]],['#b8c1b0'],'edge');
}
box('Teaching platform',70,450,0,210,590,30,['#ddc69f','#bfa77e','#cdb58e'],'platform');
// A slim lectern makes the teaching area legible in the axonometric view. 讲台用于标示轴测视图中的教学区域。
box('Lectern base',145,690,30,44,78,5,['#c5ae87','#a28c6a','#b8a07b'],'platform');
box('Lectern body',151,699,35,32,60,71,['#dfcba9','#bca580','#ccb591'],'platform');
box('Lectern top',140,688,106,54,82,8,['#ead9ba','#bca580','#ccb591'],'platform');
desks.forEach(([x,y],i)=>{
 const w=62.4,d=97.5;
 // Small two-seat desks, matching the reduced furniture footprint in plan. 双人桌与平面图的家具占地对应。
 for(const dx of [-25,25])for(const dy of [-40,40])box(`Desk ${i+1} leg`,x+dx-2,y+dy-2,0,4,4,62,['#b3baaa','#9aa490','#a5af9c']);
 box(`Desk ${i+1}`,x-w/2,y-d/2,62,w,d,6,palette.desk);
 for(const dy of [-26,26]){
 const cx=x+52.65,cy=y+dy;
 for(const dx of [-10,10])for(const ey of [-11,11])box(`Chair ${i+1} leg`,cx+dx-1.3,cy+ey-1.3,0,2.6,2.6,34,['#aab59d','#929f87','#9caa92']);
 box(`Chair ${i+1} seat`,cx-13,cy-13.65,34,26,27.3,5,palette.seat);
 box(`Chair ${i+1} back`,cx+9,cy-15.6,39,5.8,31.2,31,palette.seat);
 }
});
fcus.forEach(([x,y],i)=>{
 box(`FCU ${String(i+1).padStart(2,'0')}`,x-47,y-47,270,94,94,17,palette.fcu,'fcu');
 box(`FCU ${i+1} inset`,x-34,y-34,287.2,68,68,1.4,['#b4d0c8','#8eb4aa','#8eb4aa'],'fcu-detail');
 for(let k=-2;k<=2;k++)box(`FCU ${i+1} grille`,x-23,y+k*8-1,289,46,2,0.8,['#719990','#719990','#719990'],'fcu-detail');
});
let yaw=-26, pitch=32, zoom=1, showFCU=true, showFurniture=true;
let camera={}, participants=[], groups=thermal.zones([]), showThermal=true, participantSignature='';
function projectRaw(p){const a=yaw*Math.PI/180,b=pitch*Math.PI/180;const u=p[0]-840,v=p[1]-550;const x=Math.cos(a)*u-Math.sin(a)*v;const d=Math.sin(a)*u+Math.cos(a)*v;return [x,Math.sin(b)*d-Math.cos(b)*p[2],Math.cos(b)*d+Math.sin(b)*p[2]];}
function project(p){const q=projectRaw(p);return [(q[0]-camera.cx)*camera.s+750,(q[1]-camera.cy)*camera.s+470,q[2]];}
function el(tag,attrs={}){const node=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,v);return node;}
function label(parent,p,text,cls){const q=project(p);const t=el('text',{x:q[0],y:q[1],class:cls});t.textContent=text;parent.appendChild(t);}
function render(){
 const projected=objects.flatMap(o=>o.points.map(projectRaw));
 const xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 camera={cx:(minX+maxX)/2,cy:(minY+maxY)/2,s:Math.min(1300/(maxX-minX),720/(maxY-minY))*zoom};
 const scene=document.getElementById('scene');scene.replaceChildren();
 const floorGroup=el('g'),wallGroup=el('g'),meshGroup=el('g');scene.append(floorGroup,wallGroup,meshGroup);
 let faces=[];
 for(const o of objects){
 if(!showFCU&&o.kind.startsWith('fcu'))continue;
 if(!showFurniture&&o.kind==='furniture')continue;
 const ps=o.points.map(project);
 o.faces.forEach((face,i)=>{
 const points=face.map(j=>ps[j]);
 // Back-face culling for box surfaces. Room shell uses two-sided faces. 箱体表面剔除背面，房间外壳双面显示。
 const cross=(points[1][0]-points[0][0])*(points[2][1]-points[0][1])-(points[1][1]-points[0][1])*(points[2][0]-points[0][0]);
 if(o.points.length===8&&cross<=0)return;
 faces.push({o,points,color:o.colors[i],depth:points.reduce((s,p)=>s+p[2],0)/points.length});
 });
 }
 faces.sort((a,b)=>a.depth-b.depth);
 for(const f of faces){
 const attrs={points:f.points.map(p=>p.slice(0,2).join(',')).join(' '),fill:f.color,stroke:f.o.kind.startsWith('fcu')?'#426f68':'#747e6c','stroke-width':f.o.kind==='fcu'?1.25:.45,'stroke-opacity':f.o.kind.startsWith('fcu')?.7:.2,'stroke-linejoin':'round'};
 if(f.o.kind==='wall'){attrs['fill-opacity']=.52;attrs.stroke='#adb7a4';attrs['stroke-opacity']=.5;attrs['stroke-width']=1;}
 if(f.o.kind==='fcu')attrs['fill-opacity']=.85;
 if(f.o.kind==='furniture')attrs.opacity=.68;
 if(f.o.kind==='fcu'){const index=Number(f.o.name.split(' ')[1])-1;attrs.fill=thermal.colour(groups[index].target);attrs.stroke=groups[index].conflict?'#a74935':'#426f68';attrs['stroke-width']=groups[index].conflict?3:1.25;}
 const poly=el('polygon',attrs);
 if(f.o.kind==='floor')floorGroup.appendChild(poly);else if(f.o.kind==='wall'||f.o.kind==='edge')wallGroup.appendChild(poly);else meshGroup.appendChild(poly);
 }

 if(showThermal){
 const heat=el('g',{'pointer-events':'none'});
 const clip=el('clipPath',{id:'thermal-floor-clip'});clip.appendChild(el('polygon',{points:outline.map(([x,y])=>project([x,y,1]).slice(0,2).join(',')).join(' ')}));heat.appendChild(clip);
 const cells=el('g',{'clip-path':'url(#thermal-floor-clip)'});heat.appendChild(cells);
 for(let x=70;x<1610;x+=55)for(let y=70;y<1040;y+=55){
  const points=[[x,y],[x+56,y],[x+56,y+56],[x,y+56]].map(([a,b])=>project([a,b,1]).slice(0,2).join(',')).join(' ');
  cells.appendChild(el('polygon',{points,fill:thermal.colour(thermal.temperature(x+27,y+27,groups)),opacity:.65}));
 }
 scene.insertBefore(heat,wallGroup);
 }
 // Ground projections make the relationship between ceiling units and floor explicit. 地面投影用于展示天花机组与地面的对应关系。
 if(showFCU){const ground=el('g',{'pointer-events':'none'});scene.insertBefore(ground,meshGroup);
 fcus.forEach(([x,y])=>{const pts=[[-47,-47],[47,-47],[47,47],[-47,47]].map(([a,b])=>project([x+a,y+b,1]));ground.appendChild(el('polygon',{points:pts.map(p=>p.slice(0,2).join(',')).join(' '),fill:'#6c9587','fill-opacity':.06,stroke:'none'}));});
 const labels=el('g',{'pointer-events':'none'});scene.appendChild(labels);fcus.forEach(([x,y],i)=>label(labels,[x,y,310],`FCU ${String(i+1).padStart(2,'0')} · ${groups[i].target.toFixed(1)}°${groups[i].conflict?' !':''}`,'unit-label'));
 }

 if(showFCU&&showThermal){const flow=el('g',{'pointer-events':'none'});scene.appendChild(flow);
 groups.forEach(g=>{if(g.idle)return;for(const offset of [-32,0,32]){
 const a=project([g.point[0]+offset,g.point[1],265]),b=project([g.point[0]+offset*2,g.point[1]+35,10]);
 flow.appendChild(el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:thermal.colour(g.target),'stroke-width':3,'stroke-dasharray':'7 7',class:'airflow',opacity:.8}));
 }});
 }
 label(scene,[165,930,34],'TEACHING PLATFORM','platform-label');
 if(showFurniture)desks.forEach(([x,y],i)=>label(scene,[x-42,y,72],String(i+1).padStart(2,'0'),'desk-label'));
 
 const occupantLayer=el('g',{'pointer-events':'none'});
 scene.appendChild(occupantLayer);
 for(const person of participants){
   if(!person.position)continue;
   const p=[person.position.x*1700,person.position.y*1100,1];
   const floor=project(p), q=[floor[0],floor[1]-18];
   occupantLayer.appendChild(el('ellipse',{cx:floor[0],cy:floor[1],rx:25*camera.s,ry:12*camera.s,fill:person.colour,opacity:.2}));
   const silhouette=el('g',{transform:`translate(${q[0]},${q[1]})`,fill:'#fff',stroke:'#202020','stroke-width':1.5,'stroke-linejoin':'round'});
   silhouette.appendChild(el('circle',{cx:0,cy:-26,r:6}));
   silhouette.appendChild(el('path',{d:'M-5 -18 Q-10 -18 -12 -12 L-15 -2 Q-15 1 -12 1 L-7 -8 L-7 0 L-6 16 Q-4 19 -1 16 L0 5 L1 16 Q4 19 6 16 L7 0 L7 -8 L12 1 Q15 1 15 -2 L12 -12 Q10 -18 5 -18 Z'}));
   occupantLayer.appendChild(silhouette);
   const name=el('text',{x:q[0],y:q[1]-39,class:'occupant-label'});name.textContent=person.alias;occupantLayer.appendChild(name);
 }
 document.getElementById('angle').textContent=`${Math.round(pitch)}° ELEVATION`;
}
function reset(){yaw=-26;pitch=32;zoom=1;render();}
let drag=null;
const svg=document.getElementById('model');
svg.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,yaw,pitch};svg.setPointerCapture(e.pointerId);svg.classList.add('dragging');});
svg.addEventListener('pointermove',e=>{if(!drag)return;yaw=drag.yaw+(e.clientX-drag.x)*.22;pitch=Math.max(18,Math.min(72,drag.pitch-(e.clientY-drag.y)*.14));render();});
svg.addEventListener('pointerup',()=>{drag=null;svg.classList.remove('dragging');});
svg.addEventListener('pointercancel',()=>{drag=null;svg.classList.remove('dragging');});
svg.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.65,Math.min(1.6,zoom*(e.deltaY>0?.94:1.06)));render();},{passive:false});
document.getElementById('reset').onclick=reset;
document.getElementById('top').onclick=()=>{yaw=0;pitch=72;zoom=1;render();};
document.getElementById('fcu-toggle').onchange=e=>{showFCU=e.target.checked;render();};
document.getElementById('furniture-toggle').onchange=e=>{showFurniture=e.target.checked;render();};
document.getElementById('zoom-in').onclick=()=>{zoom=Math.min(1.6,zoom+.1);render();};
document.getElementById('zoom-out').onclick=()=>{zoom=Math.max(.65,zoom-.1);render();};
function exportOBJ(){let lines=['# Classroom concept model. Units are illustrative, not measured.'];let offset=1;for(const o of objects){lines.push('o '+o.name.replaceAll(' ','_'));for(const [x,y,z]of o.points)lines.push(`v ${x} ${z} ${-y}`);for(const face of o.faces)lines.push('f '+face.map(i=>i+offset).join(' '));offset+=o.points.length;}return lines.join('\n');}
document.getElementById('export-model').onclick=()=>{const blob=new Blob([exportOBJ()],{type:'text/plain'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='classroom-fcu-model.obj';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
render();

window.ComfortModel={
 seats,fcus,
 setParticipants(people){const signature=JSON.stringify(people.map(({id,alias,position,profile,colour})=>({id,alias,position,profile,colour})));if(signature===participantSignature)return;participantSignature=signature;participants=people;groups=thermal.zones(people);render();window.ComfortPlan?.update(people);},
 getZones(){return groups;},
 setThermal(active){showThermal=active;render();},
 nearestFCU:thermal.nearest,
 seatFor(position){if(!position)return null;return seats.find(s=>Math.abs(s.x/1700-position.x)<.001&&Math.abs(s.y/1100-position.y)<.001);}
};
})();
