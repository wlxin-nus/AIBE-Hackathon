(() => {
const t=window.ComfortThermal, ns='http://www.w3.org/2000/svg', mount=document.getElementById('floor-plan');
if(!mount)return;
const phone=document.body.dataset.view==='phone';
const make=(tag,attrs={})=>{const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));return n;};
const svg=make('svg',{viewBox:'0 0 1700 1120',role:'group','aria-label':'Classroom floor plan matching the 3D model: teaching platform on the left, desks 01 to 15 and eight FCUs'});
const clip=make('clipPath',{id:'plan-clip'}),boundary=t.outline.map(p=>p.join(',')).join(' ');
clip.append(make('polygon',{points:boundary}));svg.append(clip,make('polygon',{points:boundary,fill:'#f1efe3',stroke:'#9ba990','stroke-width':5}));
const heat=make('g',{'clip-path':'url(#plan-clip)','pointer-events':'none'});svg.append(heat);
svg.append(make('rect',{x:70,y:450,width:210,height:590,fill:'#d8c19a',stroke:'#a58b60','stroke-width':3}));
function text(x,y,label,size=27){const n=make('text',{x,y,fill:'#354039','font-size':size,'font-family':'Arial','text-anchor':'middle','paint-order':'stroke',stroke:'#fafaf5','stroke-width':4});n.textContent=label;return n;}
svg.append(text(175,760,'PLATFORM',23));
t.desks.forEach(([x,y],i)=>{svg.append(make('rect',{x:x-32,y:y-49,width:64,height:98,rx:5,fill:'#e0ceb0',stroke:'#9f906d','stroke-width':3}));svg.append(text(x-40,y-65,String(i+1).padStart(2,'0'),31));});
let selected=null, enabled=!phone, people=[];
function choose(seat){if(!enabled)return;window.dispatchEvent(new CustomEvent('comfort-seat',{detail:seat}));}
const seatNodes=t.seats.map(seat=>{
 const g=make('g',{'data-plan-seat':seat.id,role:phone?'button':'img','aria-label':'Seat '+seat.id,tabindex:phone?'0':'-1',class:'plan-seat'});
 const rect=make('rect',{x:seat.x-22,y:seat.y-21,width:44,height:42,rx:8,fill:'#e5eadc',stroke:'#829274','stroke-width':3});
 g.append(rect,text(seat.x,seat.y+9,seat.id.slice(-1),24));
 g.addEventListener('click',e=>{e.stopPropagation();choose(seat);});
 g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(seat);}});
 svg.append(g);return {seat,g,rect};
});
const equipment=make('g',{'pointer-events':'none'}),markers=make('g',{'pointer-events':'none'});svg.append(equipment,markers);mount.append(svg);
if(phone)svg.addEventListener('click',e=>{
 if(!enabled)return;const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(svg.getScreenCTM().inverse());
 if(!t.inside(q.x,q.y))return;
 const seat=t.seats.reduce((a,b)=>Math.hypot(a.x-q.x,a.y-q.y)<Math.hypot(b.x-q.x,b.y-q.y)?a:b);choose(seat);
});
function update(next){
 people=next;const groups=t.zones(people);heat.replaceChildren();equipment.replaceChildren();markers.replaceChildren();
 for(let x=70;x<1610;x+=55)for(let y=70;y<1040;y+=55)heat.append(make('rect',{x,y,width:56,height:56,fill:t.colour(t.temperature(x+27,y+27,groups)),opacity:.6}));
 groups.forEach((g,i)=>{equipment.append(make('rect',{x:g.point[0]-44,y:g.point[1]-44,width:88,height:88,rx:8,fill:t.colour(g.target),'fill-opacity':.7,stroke:g.conflict?'#a74935':'#58755f','stroke-width':g.conflict?6:3,'stroke-dasharray':g.idle?'8 5':'none'}));equipment.append(text(g.point[0],g.point[1]-58,'F'+String(i+1).padStart(2,'0')+' · '+g.target.toFixed(1)+'°',25));});
 for(const p of people){if(!p.position)continue;const x=p.position.x*1700,y=p.position.y*1100;
 const i=t.nearest(p.position),f=t.fcus[i];markers.append(make('line',{x1:x,y1:y,x2:f[0],y2:f[1],stroke:p.colour,'stroke-width':3,'stroke-dasharray':'9 6',opacity:.7}));
 const person=make('g',{transform:'translate('+x+','+y+') scale(1.8)',fill:'#fff',stroke:'#202020','stroke-width':1.5,'stroke-linejoin':'round'});
 person.append(make('circle',{cx:0,cy:-26,r:6}),make('path',{d:'M-5 -18 Q-10 -18 -12 -12 L-15 -2 Q-15 1 -12 1 L-7 -8 L-7 0 L-6 16 Q-4 19 -1 16 L0 5 L1 16 Q4 19 6 16 L7 0 L7 -8 L12 1 Q15 1 15 -2 L12 -12 Q10 -18 5 -18 Z'}));markers.append(person);
 markers.append(text(x,y+60,p.alias,25));
 }
 seatNodes.forEach(({seat,g,rect})=>{const active=seat.id===selected;rect.setAttribute('stroke',active?'#7c3656':'#829274');rect.setAttribute('stroke-width',active?'7':'3');g.setAttribute('aria-pressed',String(active));g.setAttribute('aria-disabled',String(!enabled));});
}
window.ComfortPlan={update,setSelected(id){selected=id;update(people);},setEnabled(value){enabled=value;seatNodes.forEach(({g})=>g.setAttribute('aria-disabled',String(!value)));}};
update([]);
})();
