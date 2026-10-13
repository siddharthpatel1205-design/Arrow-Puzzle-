const g=require('./app.js');let t0=Date.now(),min=999,max=0,cov=[];
for(let l=1;l<=60;l+=3)for(let k=0;k<5;k++){const b=g.createBoard(l);
 if(!g.validShape(b)||!g.isSolvable(b)||b.some(a=>a.d<0||a.d>3))throw new Error('bad board L'+l);
 min=Math.min(min,b.length);max=Math.max(max,b.length);cov.push(b.reduce((s,a)=>s+a.cells.length,0)/400);}
console.log('100 boards OK; arrows',min,max,'coverage avg',(cov.reduce((a,b)=>a+b)/cov.length).toFixed(2),'min',Math.min(...cov).toFixed(2),'ms',Date.now()-t0);
