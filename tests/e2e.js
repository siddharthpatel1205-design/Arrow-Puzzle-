const {JSDOM}=require('jsdom'),fs=require('fs'),d='/home/claude/arrow-neon/';
const html=fs.readFileSync(d+'index.html','utf8').replace('<link rel="stylesheet" href="style.css">','').replace('<script src="config.js"></script>','<script>'+fs.readFileSync(d+'config.js','utf8').replace(/<\//g,'<\\/')+'</script>').replace('<script src="app.js"></script>','<script>'+fs.readFileSync(d+'app.js','utf8')+'</script>');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function parse(doc){return [...doc.querySelectorAll('g.ar')].map(g=>{const p=g.querySelector('.body').getAttribute('d').slice(1).split('L').map(t=>t.split(' ').map(Number));
 const cells=p.map(([x,y])=>Math.floor(y)*20+Math.floor(x));const [a,b]=[p[p.length-2],p[p.length-1]];
 return{g,cells,dir:[Math.sign(b[1]-a[1]),Math.sign(b[0]-a[0])]};});}
(async()=>{
 const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/'});const w=dom.window,doc=w.document;
 const ok=(c,m)=>{if(!c)throw new Error('FAIL '+m);console.log('ok',m)};
 ok(doc.querySelectorAll('.cell').length===400,'400 cells');
 const A=parse(doc);ok(A.length>=40,'arrows rendered '+A.length);
 const hearts=()=>[...doc.querySelectorAll('.heart:not(.lost)')].length;
 const click=g=>g.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
 const occ=new Array(400).fill(-1);A.forEach((a,i)=>a.cells.forEach(c=>occ[c]=i));
 const free=a=>{let r=Math.floor(a.cells.at(-1)/20)+a.dir[0],c=a.cells.at(-1)%20+a.dir[1];while(r>=0&&r<20&&c>=0&&c<20){if(occ[r*20+c]!==-1)return false;r+=a.dir[0];c+=a.dir[1];}return true;};
 // blocked arrow: heart lost once, repeat free, second blocked costs another
 const bl=A.filter(a=>!free(a));ok(bl.length>=2,'blocked arrows exist');
 click(bl[0].g);ok(hearts()===2&&bl[0].g.classList.contains('red'),'blocked -> red, 2 hearts');
 click(bl[0].g);ok(hearts()===2,'same red again costs nothing');
 // think
 doc.getElementById('think').click();ok(doc.getElementById('coins').textContent==='20','think cost 10');
 ok(doc.querySelectorAll('.hint').length===1,'hint shown');
 // restart resets
 doc.getElementById('restart').click();ok(hearts()===3&&doc.querySelectorAll('.red').length===0,'restart resets hearts/red');
 // lose all hearts
 let B=parse(doc);B.forEach((a,i)=>a.cells.forEach(c=>occ[c]=-1));B.forEach((a,i)=>a.cells.forEach(c=>occ[c]=i));
 const bb=B.filter(a=>!free(a));for(let i=0;i<3;i++)click(bb[i].g);
 ok(!doc.getElementById('modal-over').hidden,'game over modal');
 doc.getElementById('over-restart').click();ok(doc.getElementById('modal-over').hidden&&hearts()===3,'restart after game over');
 // clear whole level in a valid order
 const C=parse(doc);occ.fill(-1);C.forEach((a,i)=>a.cells.forEach(c=>occ[c]=i));
 let left=C.slice(),n=0;while(left.length){const f=left.find(free);ok(!!f||0,'')||0;if(!f)throw new Error('stuck');click(f.g);f.cells.forEach(c=>occ[c]=-1);left=left.filter(x=>x!==f);n++;}
 console.log('cleared',n,'arrows');await sleep(3500);
 ok(!doc.getElementById('modal-win').hidden,'level complete modal');
 ok(doc.getElementById('win-level').textContent==='1'&&doc.querySelectorAll('#win-stars .on').length===3&&doc.getElementById('win-hearts').textContent==='3','win dialog: level 1, 3 stars, 3 hearts');
 await sleep(1000);ok(doc.getElementById('win-coins').textContent==='20'&&doc.getElementById('win-total').textContent==='40'&&doc.getElementById('win-next').textContent==='Next level 2','win dialog: +20 coins, total 40, next label');
 ok(doc.getElementById('coins').textContent==='40','reward once (20 + 20)');
 const sv=JSON.parse(w.localStorage.getItem('arrowNeonSave_v1'));ok(sv.level===2&&sv.coins===40,'saved level 2 coins 40');
 doc.getElementById('win-next').click();ok(doc.getElementById('level').textContent==='2'&&parse(doc).length>=40,'next level fresh board');
 process.exit(0);})().catch(e=>{console.error(e.message);process.exit(1)});
