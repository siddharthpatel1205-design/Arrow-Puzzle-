const {JSDOM}=require('jsdom'),fs=require('fs'),d='/home/claude/arrow-neon/';
const html=fs.readFileSync(d+'index.html','utf8').replace('<link rel="stylesheet" href="style.css">','').replace('<script src="config.js"></script>','<script>'+fs.readFileSync(d+'config.js','utf8').replace(/<\//g,'<\\/')+'</script>').replace('<script src="app.js"></script>','<script>'+fs.readFileSync(d+'app.js','utf8')+'</script>');
const w=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/'}).window,doc=w.document;
const ok=(c,m)=>{if(!c)throw new Error('FAIL '+m);console.log('ok',m)};
const gs=[...doc.querySelectorAll('g.ar')];for(const g of gs){if(!doc.getElementById('modal-over').hidden)break;g.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));}
const f=doc.querySelector('#ad-over iframe');ok(f&&f.srcdoc.includes('container-25a5a96c6100251073e3867171ea459a')&&f.srcdoc.includes('invoke.js'),'game-over popup shows native banner code');
process.exit(0);
