'use strict';
module.exports=function(E){
 const S=require('./scoring')(E),{M,J}=E,analyzeDefense=require('../defense');
 const signedDirection=(from,to)=>from===(to+1)%3?'+':'-';
 class Game{
  constructor(extra={}){this.options=S.options(extra);this.rule=S.rule();this.rng=extra.rng||Math.random;this.id=globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random();this.names=extra.names||['あなた','CPU 1','CPU 2'];this.points=[35000,35000,35000];this.chips=[0,0,0];this.dealer=0;this.round=1;this.honba=0;this.sticks=0;this.log=[];this.ledger=[];this.phase='idle';this.rounds=0;this.startRound();}
  get actor(){return this.phase==='react'||this.phase==='rob'?this.responders[this.responseIndex]:this.turn;}
  get indicators(){return this.dead.slice(0,(2+this.kans)*2).filter((_,i)=>i%2===0);}
  get ura(){return this.dead.slice(0,(2+this.kans)*2).filter((_,i)=>i%2===1);}
  spring(id,flower){const before=this.flowers[id].slice();this.flowers[id].push(flower);const n=S.springDelta(before,this.flowers[id],this.options);if(n)this.chipPay(id,null,n,'春の即時祝儀');this.log.unshift(this.names[id]+'：'+S.FLOWERS[+flower[1]-1]+'を抜きました');}
  chipPay(winner,loser,n,label){const delta=[0,0,0];for(let i=0;i<3;i++)if(i!==winner&&(loser===null||i===loser)){this.chips[i]-=n;this.chips[winner]+=n;delta[i]-=n;delta[winner]+=n;}this.ledger.push({winner,loser,n,label,delta});}
  take(id){while(this.wall.length){const t=this.wall.pop();if(t[0]==='f'){this.spring(id,t);continue;}return t;}return null;}
  startRound(){this.roundLedgerStart=this.ledger.length;this.phase='dealing';this.rounds++;this.draws=[0,0,0];this.anyCalls=false;this.kans=0;this.hands=[];this.rivers=[[],[],[]];this.flowers=[[],[],[]];this.north=[0,0,0];this.ippatsu=[false,false,false];this.openRiichi=[false,false,false];this.furiten=[false,false,false];this.mustDiscard=false;this.rinshan=false;this.last=null;this.roundStartPoints=this.points.slice();this.roundStartChips=this.chips.slice();const wall=S.makeWall(this.options,this.rng);this.dead=wall.splice(0,4);this.wall=wall;for(let id=0;id<3;id++){const tiles=[];for(let j=0;j<13;j++)tiles.push(this.take(id));this.hands.push(new M.Shoupai(tiles));}this.turn=this.dealer;this.draw();}
  draw(rinshan=false){this.rinshan=rinshan;this.mustDiscard=false;const t=this.take(this.turn);if(!t)return this.drawnGame();if(!this.hands[this.turn].lizhi)this.furiten[this.turn]=false;this.hands[this.turn].zimo(t);this.draws[this.turn]++;this.phase='turn';}
  score(id,hand=this.hands[id],ron=null,{honba=this.honba,rob=false,preview=false}={}){return S.score({hand,ron,seat:(id-this.dealer+3)%3,rule:this.rule,indicators:this.indicators,ura:preview?[]:this.ura,north:this.north[id],flowers:this.flowers[id],flowerRules:this.options.flowerRules,ippatsu:this.ippatsu[id],rinshan:!ron&&this.rinshan,last:this.wall.length===0,honba,qianggang:rob,tianhu:!ron&&!hand.lizhi&&!this.anyCalls&&this.draws[id]===1&&!this.rivers[id].length?(id===this.dealer?1:2):0,openRiichi:this.openRiichi[id]});}
  canRon(id){if(this.furiten[id])return false;const wait=S.waits(this.hands[id]);if(this.rivers[id].some(t=>wait.includes(S.normal(t))))return false;return !!this.score(id,this.hands[id],this.last.tile+signedDirection(this.last.from,id),{rob:this.phase==='rob',preview:true});}
  kanOptions(id){const h=this.hands[id];if(this.kans>=4||this.wall.length<3)return [];let ks=h.get_gang_mianzi()||[];if(h.lizhi){const before=S.waits(h.clone().dapai(h._zimo)).sort().join(',');ks=ks.filter(m=>/^[mpsz][0-9A]{4}$/.test(m)&&S.waits(h.clone().gang(m)).sort().join(',')===before);}return ks;}
  actions(){const id=this.actor,h=this.hands[id],out=[],add=(label,reply)=>out.push({label,reply});if(this.phase==='roundEnd'){add(this.finished?'対局結果へ':'次の局へ',{next:true});return out;}if(this.phase==='finished')return out;
   if(this.phase==='react'||this.phase==='rob'){
    const ron=this.canRon(id);if(ron)add('ロン',{win:true});if(ron&&h.lizhi)return out;
    if(this.phase==='react'&&!h.lizhi){const t=this.last.tile+signedDirection(this.last.from,id);for(const m of h.get_peng_mianzi(t)||[])add('ポン',{pon:m});if(this.kans<4&&this.wall.length>=3)for(const m of h.get_gang_mianzi(t)||[])add('大明カン',{kan:m});}
    add('見送り',{pass:true});return out;
   }
   if(this.phase!=='turn')return out;
   const draw=h._zimo?.length===2;
   if(draw&&this.score(id,h,null,{preview:true})){add('ツモ',{win:true});if(h.lizhi)return out;}
   if(draw){if(h._bingpai.z[4]&&(!h.lizhi||S.normal(h._zimo)==='z4'))add('北を抜く',{nuki:true});for(const m of this.kanOptions(id))add('カン',{kan:m});}
   for(const t of h.get_dapai()||[]){add('打牌 '+t,{discard:t});if(draw&&!h.lizhi&&h.menqian&&this.points[id]>=1000&&S.shanten(h.clone().dapai(t))===0&&S.waits(h.clone().dapai(t)).length){const ready=h.clone().dapai(t);ready._lizhi=true;const waits=S.waits(ready);if(!waits.some(p=>S.score({hand:ready.clone().zimo(p),seat:(id-this.dealer+3)%3,rule:this.rule,indicators:this.indicators,north:this.north[id],flowers:this.flowers[id],flowerRules:this.options.flowerRules})))continue;const forcedOpen=this.hands.filter(h=>h.lizhi).length===2||this.rivers[id].some(p=>waits.includes(S.normal(p)))||waits.includes(S.normal(t));if(!forcedOpen)add('リーチ '+t,{discard:t,riichi:true});add('オープンリーチ '+t,{discard:t,riichi:true,open:true});}}
   return out;
  }
  act(reply){const legal=this.actions().find(a=>JSON.stringify(a.reply)===JSON.stringify(reply));if(!legal)throw Error('現在は選べない操作です');const id=this.actor,h=this.hands[id];
   if(reply.next){if(this.finished){this.phase='finished';return;}if(!this.repeat){this.dealer=(this.dealer+1)%3;this.round++;}this.honba=this.nextHonba;this.startRound();return;}
   if(this.phase==='react'||this.phase==='rob'){const hadRon=this.canRon(id);if(hadRon&&!reply.win)this.furiten[id]=true;this.responses.push({id,reply});this.responseIndex++;if(this.responseIndex===this.responders.length)this.resolveResponses();return;}
   if(reply.win){this.win([id],null);return;}
   if(reply.nuki){const t=S.normal(h._zimo)==='z4'?h._zimo:'z4';h.dapai(t);this.north[id]++;this.log.unshift(this.names[id]+'：北を抜きました');this.draw();return;}
   if(reply.kan){if(/[+=-]/.test(reply.kan)){this.beginResponses(id,reply.kan[0]+reply.kan.slice(-1),'rob',reply.kan);return;}this.commitKan(id,reply.kan);return;}
   if(reply.discard){const was=h.lizhi,t=reply.discard;h.dapai(t+(reply.riichi?'*':''));if(reply.riichi){this.points[id]-=1000;this.sticks++;this.ippatsu[id]=true;this.openRiichi[id]=!!reply.open;this.log.unshift(this.names[id]+'：リーチ');}else if(was)this.ippatsu[id]=false;this.rivers[id].push(t.slice(0,2)+(reply.riichi?'*':''));this.mustDiscard=false;this.beginResponses(id,t.slice(0,2),'react',null,!!reply.riichi);}
  }
  beginResponses(from,tile,phase,kan=null,riichi=false){this.last={from,tile,kan,riichi};this.phase=phase;this.responders=[(from+1)%3,(from+2)%3];this.responses=[];this.responseIndex=0;}
  commitKan(id,m,open=false){this.anyCalls=true;if(!open)this.hands[id].gang(m);this.dead.push(this.wall.shift(),this.wall.shift());this.kans++;this.ippatsu=[false,false,false];this.turn=id;this.log.unshift(this.names[id]+'：カン');this.draw(true);}
  resolveResponses(){const wins=this.responses.filter(r=>r.reply.win).map(r=>r.id);if(wins.length){if(this.last.riichi){this.points[this.last.from]+=1000;this.sticks--;this.ippatsu[this.last.from]=false;}this.win(wins,this.last.from);return;}
   if(this.phase==='rob'){this.commitKan(this.last.from,this.last.kan);return;}
   const call=this.responses.find(r=>r.reply.pon||r.reply.kan);if(call){this.anyCalls=true;const m=call.reply.pon||call.reply.kan;this.hands[call.id].fulou(m);this.rivers[this.last.from][this.rivers[this.last.from].length-1]+='-';this.ippatsu=[false,false,false];this.turn=call.id;this.log.unshift(this.names[call.id]+'：'+(call.reply.pon?'ポン':'カン'));if(call.reply.kan)this.commitKan(call.id,m,true);else{this.mustDiscard=true;this.rinshan=false;this.phase='turn';}return;}
   this.turn=(this.last.from+1)%3;this.draw();
  }
  win(winners,loser){const wins=[],before=this.points.slice(),beforeChips=this.chips.slice();for(let i=0;i<winners.length;i++){
   const id=winners[i],ron=loser===null?null:this.last.tile+signedDirection(loser,id),result=this.score(id,this.hands[id],ron,{honba:i===0?this.honba:0,rob:this.phase==='rob'});if(!result)throw Error('和了形が不正です');
   if(loser===null){for(let other=0;other<3;other++)if(other!==id){const n=other===this.dealer?result.pay.dealer:result.pay.child;this.points[other]-=n;this.points[id]+=n;}}else{this.points[loser]-=result.pay.ron;this.points[id]+=result.pay.ron;}
   if(i===0){this.points[id]+=this.sticks*1000;this.sticks=0;}
   if(result.override){this.chipPay(id,null,result.override,'四北四華・八華');result.lines=[{label:'四北四華・八華（他祝儀なし）',amount:result.override}];}
   else{if(result.eff[3]&&['alice','tulip'].includes(this.options.flowerRules.winter)){result.alice=S.alice({tiles:result.tiles,wall:this.wall,mode:this.options.flowerRules.winter,winter:result.eff[3],open:!this.hands[id].menqian,guarantee:(this.ippatsu[id]?1:0)+(result.white?1:0)});if(result.alice.chips)result.lines.push({label:result.alice.mode,amount:result.alice.chips});}
    this.chipPay(id,loser,result.lines.reduce((n,l)=>n+l.amount,0),'和了祝儀');if(result.diceEligible){result.dice=S.dice(this.rng);this.chipPay(id,null,result.dice.chips,'サイコロチャンス');}}
   wins.push({id,loser,...result,received:this.points[id]-before[id]});
  }
  const busted=[];for(let id=0;id<3;id++)if(this.points[id]<=0){busted.push(id);for(const winner of winners)if(winner!==id)this.chipPay(winner,id,2,'トビ賞');}
  this.repeat=winners.includes(this.dealer);this.nextHonba=this.repeat?this.honba+1:0;this.finished=busted.length>0||this.round===3&&!this.repeat;this.summary={type:'win',wins,busted,pointsDelta:this.points.map((n,i)=>n-before[i]),chipsDelta:this.chips.map((n,i)=>n-beforeChips[i]),roundChips:this.chips.map((n,i)=>n-this.roundStartChips[i])};this.summary.ledger=this.ledger.slice(this.roundLedgerStart);this.phase='roundEnd';this.log.unshift(winners.map(id=>this.names[id]).join('・')+'の和了');if(this.finished)this.finish();
  }
  drawnGame(){const tenpai=this.hands.map(h=>S.shanten(h)===0),n=tenpai.filter(Boolean).length,before=this.points.slice();if(n&&n<3)for(let i=0;i<3;i++)this.points[i]+=tenpai[i]?2000/n:-2000/(3-n);this.repeat=true;this.nextHonba=this.honba+1;this.finished=this.points.some(n=>n<=0);this.summary={type:'draw',tenpai,pointsDelta:this.points.map((n,i)=>n-before[i]),roundChips:this.chips.map((n,i)=>n-this.roundStartChips[i])};this.summary.ledger=this.ledger.slice(this.roundLedgerStart);this.phase='roundEnd';this.log.unshift('流局・親は連荘');if(this.finished)this.finish();}
  finish(){if(this.sticks){const top=[0,1,2].sort((a,b)=>this.points[b]-this.points[a]||a-b)[0];this.points[top]+=this.sticks*1000;this.sticks=0;}const order=[0,1,2].sort((a,b)=>this.points[b]-this.points[a]||a-b),second=this.points[order[1]]>=40000?0:-10,uma=[-second+10,second,-10];this.results=order.map((id,index)=>({id,points:this.points[id],rank:index+1,rankChips:uma[index],bonusChips:this.chips[id],score:(this.points[id]-40000)/1000+uma[index]+(index===0?15:0)}));}
 }
 function cpu(game){const id=game.actor,options=game.actions();if(!options.length)return null;const win=options.find(a=>a.reply.win);if(win)return win.reply;const north=options.find(a=>a.reply.nuki);if(north)return north.reply;const discards=options.filter(a=>a.reply.discard);if(discards.length){const visible=new Map(),add=t=>{t=S.normal(t);visible.set(t,(visible.get(t)||0)+1);};S.counts(game.hands[id]).forEach(add);for(let l=0;l<3;l++){for(const t of game.rivers[l])if(!t.endsWith('-'))add(t);if(l!==id)for(const m of game.hands[l]._fulou)J.rawTiles(m).forEach(add);}game.indicators.filter(t=>t[0]!=='f').forEach(add);for(let l=0;l<3;l++)for(let n=0;n<game.north[l];n++)add('z4');const left=t=>Math.max(0,4-(visible.get(S.normal(t))||0));let best=discards[0],value=-Infinity;
   for(const a of discards){const h=game.hands[id].clone().dapai(a.reply.discard),n=S.shanten(h),wait=S.waits(h);let v=-n*1000+wait.reduce((n,t)=>n+left(t),0)*6+J.rawTiles(h.toString()).reduce((n,t)=>n+(t==='p0'||t==='s0'?8:t==='pA'||t==='sA'?4:0),0)+(a.reply.riichi?35:0);for(let l=0;l<3;l++)if(l!==id&&game.hands[l].lizhi)v-=analyzeDefense({tile:S.normal(a.reply.discard),visible,river:game.rivers[l].map(S.normal)}).score*(n>0?500:100);if(v>value){value=v;best=a;}}
   return best.reply;
  }
  // Keep the first version conservative: honor pon only when shanten improves after discard.
  const base=S.shanten(game.hands[id]);for(const a of options.filter(a=>a.reply.pon)){const h=game.hands[id].clone().fulou(a.reply.pon),s=S.normal(a.reply.pon);if(s[0]!=='z'||![1,5,6,7,(id-game.dealer+3)%3+1].includes(+s[1]))continue;for(const t of h.get_dapai()||[])if(S.shanten(h.clone().dapai(t))<base)return a.reply;}
  return options.find(a=>a.reply.pass)?.reply||options[0].reply;
 }
 function saveResult(storage,game){const key='houseki-sanma-results-v1';let record;try{record=JSON.parse(storage.getItem(key)||'{"games":[],"totals":{}}');}catch{throw Error('保存データを読み込めません。上書きはしません。');}if(!record||!Array.isArray(record.games)||!record.totals)throw Error('保存データが不正です');if(!game.results)throw Error('対局はまだ終了していません');if(record.games.some(g=>g.id===game.id))return record;for(const r of game.results){const t=record.totals[r.id]||{games:0,rankChips:0,bonusChips:0};record.totals[r.id]={games:t.games+1,rankChips:t.rankChips+r.rankChips,bonusChips:t.bonusChips+r.bonusChips};}record.games.push({id:game.id,at:new Date().toISOString(),results:game.results,options:{flowerCopies:game.options.flowerCopies,flowerRules:game.options.flowerRules}});storage.setItem(key,JSON.stringify(record));return record;}
 return {...S,Game,cpu,saveResult};
};
