'use strict';
(function(root){
const fcus=[[420,820],[420,560],[750,820],[750,560],[1040,700],[1035,205],[1375,530],[1370,220]];
const desks=[450,650,850].flatMap(y=>[405,680,1000,1320].map(x=>[x,y])).concat([960,1180,1400].map(x=>[x,195]));
const outline=[[70,1040],[70,305],[830,305],[830,70],[1610,70],[1610,620]];
for(let i=1;i<=24;i++){const t=i/24;outline.push([(1-t)*(1-t)*1610+2*(1-t)*t*1610+t*t*1100,(1-t)*(1-t)*620+2*(1-t)*t*1040+t*t*1040]);}
const seats=desks.flatMap(([x,y],i)=>[-26,26].map((dy,j)=>({id:String(i+1).padStart(2,'0')+(j?'B':'A'),x:x+52.65,y:y+dy})));
function nearest(position){if(!position)return null;let best=0;fcus.forEach(([x,y],i)=>{const [bx,by]=fcus[best];if(Math.hypot(x-position.x*1700,y-position.y*1100)<Math.hypot(bx-position.x*1700,by-position.y*1100))best=i;});return best;}
function zones(people){return fcus.map((point,i)=>{
 const members=people.filter(p=>p.position&&p.profile&&nearest(p.position)===i);
 if(!members.length)return {point,members,target:25,conflict:false,idle:true,lower:null,upper:null,unmet:0};
 const lower=Math.max(...members.map(p=>p.profile.minimum)),upper=Math.min(...members.map(p=>p.profile.maximum));
 const conflict=lower>upper,mean=members.reduce((sum,p)=>sum+p.profile.preferred,0)/members.length;
 // Minimax compromise minimizes the worst acceptable-range violation, with equal priority. 等权最小最大折中使最严重的舒适区间偏差最小。
 const target=conflict?(lower+upper)/2:Math.min(upper,Math.max(lower,mean));
 return {point,members,target,conflict,idle:false,lower,upper,unmet:members.filter(p=>target<p.profile.minimum||target>p.profile.maximum).length};
});}
function temperature(x,y,groups){let total=0,sum=0;groups.forEach(g=>{const weight=1/Math.pow(Math.hypot(x-g.point[0],y-g.point[1])+70,3);sum+=weight*g.target;total+=weight;});return total?sum/total:25;}
function colour(t){const stops=[[20,[71,107,188]],[22,[75,161,198]],[25,[151,196,164]],[27,[233,191,107]],[30,[205,99,77]]];t=Math.max(20,Math.min(30,t));let hi=stops.findIndex(s=>s[0]>=t);if(hi===0)return 'rgb('+stops[0][1].join(',')+')';const [a,ca]=stops[hi-1],[b,cb]=stops[hi];return 'rgb('+ca.map((v,i)=>Math.round(v+(cb[i]-v)*(t-a)/(b-a))).join(',')+')';}
function inside(x,y){let result=false;for(let i=0,j=outline.length-1;i<outline.length;j=i++){const [xi,yi]=outline[i],[xj,yj]=outline[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))result=!result;}return result;}
const api={fcus,desks,outline,seats,nearest,zones,temperature,colour,inside};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ComfortThermal=api;
})(typeof window!=='undefined'?window:globalThis);
