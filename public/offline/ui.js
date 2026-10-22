'use strict';
const E=JewelOffline,$=id=>document.getElementById(id),names=['あなた','CPU 1','CPU 2','CPU 3'];
let game,pending=null,session=null,finished=true;
const honor=['','東','南','西','北','白','發','中'];
function label(p){return p[0]==='z'?honor[+p[1]]:(p[1]==='0'?'◆5':p[1])+({m:'萬',p:'筒',s:'索'}[p[0]]||'');}
function tile(p){const el=document.createElement('span');el.className='tile'+(p[1]==='0'?' jewel':'');el.textContent=label(p);return el;}
function handTiles(h){let a=[];if(!h)return a;for(const s of ['m','p','s','z'])for(let n=1;n<h._bingpai[s].length;n++)for(let i=0;i<h._bingpai[s][n];i++)a.push(s+(n===5&&i<h._bingpai[s][0]?0:n));return a;}
function log(text){const li=document.createElement('li');li.textContent=text;$('log').prepend(li);while($('log').children.length>12)$('log').lastChild.remove();}
function render(player){
 if(!player?.model.shan)return;const m=player.model;
 $('table').replaceChildren();
 for(let l=0;l<4;l++){const id=m.player_id[l],seat=document.createElement('article');seat.className='seat'+(m.lunban===l?' active':'');
 const title=document.createElement('h3');title.textContent=`${honor[l+1]} ${names[id]} · ${m.defen[id].toLocaleString()}点`+(m.shoupai[l].lizhi?' リーチ':'');seat.append(title);
 const info=document.createElement('div');info.className='melds';info.textContent=m.shoupai[l]._fulou.map(x=>x+' ').join('')||'門前';seat.append(info);
 const river=document.createElement('div');river.className='river';for(const p of m.he[l]._pai)river.append(tile(p));seat.append(river);$('table').append(seat);}
 $('status').textContent=`${honor[m.zhuangfeng+1]}${m.jushu+1}局 · ${m.changbang}本場 · 供託${m.lizhibang} · 山${m.shan.paishu}枚`;
 $('hand').replaceChildren();for(const p of handTiles(player.shoupai))$('hand').append(tile(p));
}
function update(msg,p){render(p);
 if(msg.hule){const h=msg.hule;log(`${names[p.model.player_id[h.l]]} ${h.baojia===null?'ツモ':'ロン'} ${h.defen}点 / ${(h.hupai||[]).map(y=>y.name).join('・')} / 祝儀${h.jewelChips||0}枚`);}
 if(msg.pingju)log('流局：'+msg.pingju.name);
}
function choose(options,reply,msg,p){
 pending={options,reply};$('actions').replaceChildren();render(p);
 for(const a of options){const b=document.createElement('button');b.textContent=a.reply.dapai?(a.reply.dapai.endsWith('*')?'リーチ ':'打牌 ')+label(a.reply.dapai):a.label;b.onclick=()=>{if(pending?.reply!==reply)return;pending=null;$('actions').replaceChildren();reply(a.reply);};$('actions').append(b);}
}
function totals(){try{const data=JSON.parse(localStorage.getItem('jewel-offline-results-v1')||'{"totals":{}}');$('totals').textContent=names.map((n,i)=>{const t=data.totals[i]||{rankChips:0,bonusChips:0,games:0};return `${n}：順位 ${t.rankChips} / 祝儀 ${t.bonusChips} / 計 ${t.rankChips+t.bonusChips}枚（${t.games}戦）`;}).join('\n');}catch{$('totals').textContent='保存データを読み取れません';}}
function start(){
 if(!finished&&!confirm('現在の対局を破棄して新しい対局を始めますか？'))return;
 if(game){game.stop();for(const p of game._players){p.decide=()=>{};p.onUpdate=()=>{};}}
 finished=false;pending=null;$('actions').replaceChildren();$('log').replaceChildren();$('result').textContent='';
 const run=crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random();session=run;
 const human=new E.Player(choose,update), players=[human,...[1,2,3].map(()=>new E.Player((options,reply,msg,p)=>reply(E.cpu(p,options))))];
 game=new E.Game(players,paipu=>{if(session!==run)return;finished=true;pending=null;$('actions').replaceChildren();const rows=E.settle(paipu);$('result').textContent=(paipu.cold?'55,000点コールド。':'終局。')+rows.slice().sort((a,b)=>a.rank-b.rank).map(r=>`${r.rank}着 ${names[r.id]} ${r.points}点 / 順位${r.rankChips}・祝儀${r.bonusChips}枚`).join(' ／ ');try{E.saveResult(localStorage,run,rows);totals();}catch(e){log('成績保存失敗：'+e.message);}});
 game.speed=0;game._model.player=names;game.kaiju(0);log('新しい東風戦を開始しました');
}
$('new').onclick=start;
$('export').onclick=()=>{const raw=localStorage.getItem('jewel-offline-results-v1')||'{}';if(globalThis.Android?.exportResults){Android.exportResults(raw);return;}const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='mahjong-jewel-results.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
totals();start();
