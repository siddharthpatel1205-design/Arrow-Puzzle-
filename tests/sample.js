const {JSDOM}=require('jsdom'),fs=require('fs'),d='/home/claude/arrow-neon/';
const html=fs.readFileSync(d+'index.html','utf8').replace('<link rel="stylesheet" href="style.css">','').replace('<script src="config.js"></script>','<script>'+fs.readFileSync(d+'config.js','utf8').replace(/<\//g,'<\\/')+'</script>').replace('<script src="app.js"></script>','<script>'+fs.readFileSync(d+'app.js','utf8')+'</script>');
const w=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/'}).window,doc=w.document;
const ok=(c,m)=>{if(!c)throw new Error('FAIL '+m);console.log('ok',m)};
const f=doc.querySelector('#ad iframe');ok(f&&f.srcdoc.includes('bd9f5fc266d84574158b1d2a791206d8')&&f.width==='320'&&f.height==='50','real 320x50 banner key in top iframe');
ok(doc.querySelector('script[src*="effdc53bc868418e4d28bc6e965b1da5.js"]'),'social bar script injected');
ok(!doc.querySelector('script[src*="invalid"]'),'no sample script loaded');
doc.getElementById('free-coins').click();setTimeout(()=>{ok(doc.getElementById('coins').textContent==='30','video not configured yet -> no coins');process.exit(0)},100);
