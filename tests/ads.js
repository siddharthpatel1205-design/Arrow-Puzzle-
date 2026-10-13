const {JSDOM}=require('jsdom'),fs=require('fs'),d='/home/claude/arrow-neon/';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function boot(cfg,scenario){
 const html=fs.readFileSync(d+'index.html','utf8').replace('<link rel="stylesheet" href="style.css">','').replace('<script src="config.js"></script>','<script>window.ARROW_ADS='+JSON.stringify(cfg).replace(/<\//g,'<\\/')+';window.__sc='+JSON.stringify(scenario)+';</script>'+(scenario?`<script>
window.google={ima:{ViewMode:{NORMAL:1},AdDisplayContainer:class{initialize(){}},AdsRequest:class{},
 AdErrorEvent:{Type:{AD_ERROR:'e'}},AdsManagerLoadedEvent:{Type:{ADS_MANAGER_LOADED:'l'}},AdEvent:{Type:{STARTED:'s',SKIPPED:'k',COMPLETE:'c',ALL_ADS_COMPLETED:'a'}},
 AdsLoader:class{constructor(){this.h={}}addEventListener(t,f){this.h[t]=f}requestAds(){const m={h:{},addEventListener(t,f){this.h[t]=f},init(){},start(){const f=t=>this.h[t]&&this.h[t]();setTimeout(()=>{if(window.__sc==='complete'){f('s');f('c');f('a')}else if(window.__sc==='skip'){f('s');f('k')}else f('e')},20)},destroy(){}};
 setTimeout(()=>window.__sc==='loaderr'?this.h.e():this.h.l({getAdsManager:()=>m}),10)}}}};</script>`:'')).replace('<script src="app.js"></script>','<script>'+fs.readFileSync(d+'app.js','utf8')+'</script>');
 return new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/'}).window;}
const ok=(c,m)=>{if(!c)throw new Error('FAIL '+m);console.log('ok',m)};
function fire(w){const doc=w.document;const g=[...doc.querySelectorAll('g.ar')].map(g=>g);return g;}
function loseAll(w){const doc=w.document;const gs=[...doc.querySelectorAll('g.ar')];
 // click arrows until game over: any arrow, blocked ones cost hearts; free ones just leave
 for(const g of gs){if(!doc.getElementById('modal-over').hidden)break;g.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));}}
(async()=>{
 const base={vastTagUrl:'https://example.test/vast',topBanner:'<b id=tb>x</b>',overBanner:'<i>y</i>',continueHearts:3,maxContinuesPerLevel:1,coinsVideoReward:20,coinsVideoCooldownSec:60,socialBar:'<script src="https://example.test/sb.js"></script>',winBanner:''};
 let w=boot(base,'complete');let doc=w.document;
 ok(doc.querySelector('#ad iframe')&&doc.querySelector('#ad iframe').srcdoc.includes('id=tb'),'top banner iframe renders snippet');
 ok(doc.querySelector('script[src="https://example.test/sb.js"]'),'social bar injected');
 // free coins complete -> +20 ; cooldown blocks second
 doc.getElementById('free-coins').click();await sleep(150);ok(doc.getElementById('coins').textContent==='50','free coins after COMPLETE (30+20)');
 doc.getElementById('free-coins').click();await sleep(100);ok(doc.getElementById('coins').textContent==='50','cooldown blocks 2nd video');
 // game over -> continue with video
 loseAll(w);ok(!doc.getElementById('modal-over').hidden,'game over reached');
 ok(doc.querySelector('#ad-over iframe'),'game-over banner shown');
 doc.getElementById('over-ad').click();await sleep(150);
 ok(doc.getElementById('modal-over').hidden&&doc.querySelectorAll('.heart:not(.lost)').length===3,'COMPLETE -> hearts restored, modal closed');
 loseAll(w);ok(doc.getElementById('over-ad').disabled,'second continue blocked (max 1/level)');
 // skip -> no reward
 w=boot(base,'skip');doc=w.document;loseAll(w);doc.getElementById('over-ad').click();await sleep(150);
 ok(!doc.getElementById('modal-over').hidden&&doc.getElementById('over-note').textContent.includes('skipped'),'SKIPPED -> no reward');
 doc.getElementById('free-coins').click;ok(doc.getElementById('coins').textContent==='30','coins unchanged after skip');
 // error -> no reward
 w=boot(base,'error');doc=w.document;doc.getElementById('free-coins').click();await sleep(150);ok(doc.getElementById('coins').textContent==='30','AD_ERROR -> no coins');
 // not configured -> friendly message, no reward
 w=boot({},null);doc=w.document;loseAll(w);doc.getElementById('over-ad').click();await sleep(50);
 ok(!doc.getElementById('modal-over').hidden&&doc.getElementById('over-note').textContent.includes('not set up'),'no config -> message, no reward');
 ok(doc.getElementById('ad').textContent.includes('320'),'placeholder when no banner code');
 process.exit(0);})().catch(e=>{console.error(e.message);process.exit(1)});
