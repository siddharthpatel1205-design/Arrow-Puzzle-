const {JSDOM}=require('jsdom'),fs=require('fs'),d='/home/claude/arrow-neon/';
const html=fs.readFileSync(d+'index.html','utf8').replace('<link rel="stylesheet" href="style.css">','').replace('<script src="config.js"></script>','<script>'+fs.readFileSync(d+'config.js','utf8').replace(/<\//g,'<\\/')+'</script>').replace('<script src="app.js"></script>','<script>'+fs.readFileSync(d+'app.js','utf8')+'</script>');
const w=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/'}).window,doc=w.document;
const ok=(c,m)=>{if(!c)throw new Error('FAIL '+m);console.log('ok',m)};
const z=()=>doc.getElementById('board').style.getPropertyValue('--z'),lab=()=>doc.getElementById('zreset').textContent;
const b=id=>doc.getElementById(id).click();
b('zin');ok(z()==='1.5'&&lab()==='1.5\u00d7','zoom in -> 1.5x');b('zin');b('zin');b('zin');b('zin');b('zin');ok(z()==='3'&&lab()==='3\u00d7','capped at 3x');
b('zout');ok(z()==='2.5','zoom out');b('zreset');ok(z()==='1'&&lab()==='1\u00d7','reset to 1x');b('zout');ok(z()==='1','cannot go below 1x');
// pinch: two pointers moving apart
const st=doc.getElementById('stage'),ev=(t,id,x)=>st.dispatchEvent(Object.assign(new w.Event(t,{bubbles:true}),{pointerId:id,clientX:x,clientY:100}));
ev('pointerdown',1,100);ev('pointerdown',2,140);ev('pointermove',2,220);ok(+z()>=2,'pinch out zooms in ('+z()+')');
ev('pointerup',2,220);ev('pointerup',1,100);
const g=doc.querySelector('g.ar');g.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));ok(!g.classList.contains('red')&&!g.classList.contains('exit')&&doc.querySelectorAll('.heart:not(.lost)').length===3,'tap right after a pinch is ignored (no heart lost)');
process.exit(0);
