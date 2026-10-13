const {JSDOM}=require('jsdom'),fs=require('fs'),d='/home/claude/arrow-neon/';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const cfg={vastTagUrl:'https://v.test/x',topBanner:'<b>t</b>',winBanner:'<b>w</b>',overBanner:'<b>o</b>',socialBar:'',continueHearts:3,maxContinuesPerLevel:1,coinsVideoReward:20,coinsVideoCooldownSec:60};
const mock=`<script>window.__req=0;window.google={ima:{ViewMode:{NORMAL:1},AdDisplayContainer:class{initialize(){}},AdsRequest:class{},AdErrorEvent:{Type:{AD_ERROR:'e'}},AdsManagerLoadedEvent:{Type:{ADS_MANAGER_LOADED:'l'}},AdEvent:{Type:{STARTED:'s',SKIPPED:'k',COMPLETE:'c',ALL_ADS_COMPLETED:'a'}},
AdsLoader:class{constructor(){this.h={}}addEventListener(t,f){this.h[t]=f}requestAds(){window.__req++;const m={h:{},addEventListener(t,f){this.h[t]=f},init(){},start(){setTimeout(()=>{this.h.s&&this.h.s();this.h.c&&this.h.c();this.h.a&&this.h.a()},20)},destroy(){}};setTimeout(()=>this.h.l({getAdsManager:()=>m}),10)}}}};<\/script>`;
const html=fs.readFileSync(d+'index.html','utf8').replace('<link rel="stylesheet" href="style.css">','').replace('<script src="config.js"></script>','<script>window.ARROW_ADS='+JSON.stringify(cfg)+';<\/script>'+mock).replace('<script src="app.js"></script>','<script>'+fs.readFileSync(d+'app.js','utf8')+'</script>');
const ok=(c,m)=>{if(!c)throw new Error('FAIL '+m);console.log('ok',m)};
(async()=>{const w=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/'}).window,doc=w.document;
 ok(doc.querySelectorAll('iframe').length===3,'top + win + game-over banners loaded at start (before any popup)');
 await sleep(100);ok(w.__req===1,'video ad requested at start, before any tap');
 ok(doc.getElementById('boot').hidden,'loading screen closed');
 doc.getElementById('free-coins').click();await sleep(150);
 ok(doc.getElementById('coins').textContent==='50','preloaded video reward works');
 await sleep(700);ok(w.__req===2,'next video preloaded after the first one');
 process.exit(0)})().catch(e=>{console.error(e.message);process.exit(1)});
