'use strict';
const M = require('../vendor/majiang-core/lib');
const J=require('./jewels');
const Physical=require('./physical')(M);
const PAYOUT = [50,25,-25,-50];
const UNLOCK_YAKU = ['平和','断幺九','一盃口','三色同順','一気通貫','混全帯幺九','七対子','対々和','三暗刻','三色同刻','混老頭','小三元','混一色','純全帯幺九','二盃口','清一色'];
function rule(extra={}) {
 const modes=extra.pocchiModes||[extra.pocchiMode||'amethyst-white'];
 const legacy={white:'topaz','amethyst-white':'amethyst-white',gold:'gold-pocchi',gane:'gane-pocchi'};
 const ids=extra.gemSelection||['lapis','amethyst-p','tourmaline',...modes.map(x=>legacy[x]||x)];
 const gemTiles=J.configure(ids);
 return M.rule({'場数':1,'延長戦方式':0,'本場点':1500,'場風牌':[1,3],'赤牌':{m:0,p:0,s:0},jewelBonus:true,fullJewel:true,...extra,
  gemSelection:ids.slice(),gemTiles,pocchiModes:modes.slice(),whitePocchi:ids.some(x=>['topaz','amethyst-white'].includes(x)),pocchiAmethyst:ids.includes('amethyst-white'),goldPocchi:ids.includes('gold-pocchi'),ganePocchi:ids.includes('gane-pocchi')});
}
function actions(p,msg) {
 const out=[]; const self=p._menfeng, hand=p.shoupai;
 if(!hand)return out;
 const z=msg.zimo||msg.gangzimo;
 const add=(label,reply)=>{if(reply.hule&&(J.has(p._rule,hand,'carnelian')||p._rule.gemTiles?.[msg.dapai?.p.slice(0,2)]?.effect==='carnelian')){out.push({label:label+'（祝儀優先）',reply:{...reply,jewelChoice:'chips'}});out.push({label:label+'（翻数優先）',reply:{...reply,jewelChoice:'han'}});}else out.push({label,reply});};
 if(z && z.l===self || msg.fulou && msg.fulou.l===self && !msg.fulou.m.match(/\d{4}/)) {
  if(z && p.allow_hule(hand,null,!!msg.gangzimo)) add('ツモ',{hule:'-'});
  if(z) for(const m of p.get_gang_mianzi(hand)||[]) add('カン '+m,{gang:m});
  if(z && !hand.lizhi && p.allow_pingju(hand)) add('九種九牌',{pingju:true});
  for(const tile of p.get_dapai(hand)||[]) {
   if(hand.lizhi && tile!==hand._zimo+'_')continue;
   add('打牌 '+tile,{dapai:tile});
   if(z && p.allow_lizhi(hand,tile)) add('リーチ '+tile,{dapai:tile+'*'});
  }
 } else if(msg.dapai && msg.dapai.l!==self) {
  const d=msg.dapai, tile=d.p.slice(0,2)+'_+=-'[(4+d.l-self)%4];
  if(p.allow_hule(hand,tile)) add('ロン',{hule:'-'});
  for(const [name,fn] of [['ポン','get_peng_mianzi'],['チー','get_chi_mianzi'],['カン','get_gang_mianzi']])
   for(const m of p[fn](hand,tile)||[]) add(name+' '+m,{fulou:m});
  if(out.length) add('見送り',{});
 } else if(msg.gang && msg.gang.l!==self && !msg.gang.m.match(/^[mpsz]\d{4}$/)) {
  const g=msg.gang, tile=g.m[0]+g.m.slice(-1)+'_+=-'[(4+g.l-self)%4];
  if(p.allow_hule(hand,tile,true)) { add('ロン（槍槓）',{hule:'-'}); add('見送り',{}); }
 }
 return out;
}
function cpu(p,options) {
 const win=options.find(a=>a.reply.hule); if(win)return win.reply;
 const discards=options.filter(a=>a.reply.dapai);
 if(discards.length) {
  let best,score=-Infinity;
  for(const a of discards) {
   const h=p.shoupai.clone().dapai(a.reply.dapai), n=M.Util.xiangting(h);
   let value=-n*1000;
   if(n>=0) value+=M.Util.tingpai(h).reduce((s,t)=>s+4-(h._bingpai[t[0]][+t[1]]||0),0);
   if(a.reply.dapai.endsWith('*'))value+=50;
   if(a.reply.dapai[1]==='0')value-=5;
   if(value>score){score=value;best=a;}
  }
  return best.reply;
 }
 // Only call when doing so improves shanten and preserves an obvious open yaku.
 for(const a of options.filter(a=>a.reply.fulou)) {
  const h=p.shoupai.clone().fulou(a.reply.fulou);
  const honors=[5,6,7,p._menfeng+1,...(p._rule['場風牌']||[p.model.zhuangfeng+1])];
  const yakuhai=h._fulou.some(m=>m[0]==='z'&&honors.includes(+m[1]));
  const simple= !/[19]/.test(h.toString().replace(/z\d+/g,''))&&!h.toString().includes('z');
  if((yakuhai||simple) && M.Util.xiangting(h)<M.Util.xiangting(p.shoupai)) return a.reply;
 }
 return {};
}
class Player extends M.Player {
 constructor(decide,onUpdate=()=>{}) {super();this.decide=decide;this.onUpdate=onUpdate;}
 action(msg,callback) {
  this.message=msg;
  super.action(msg,callback);
  if(!callback)this.onUpdate(msg,this);
 }
 respond() {
  this.onUpdate(this.message,this);
  const callback=this._callback;
  if(this.message.hule&&this.confirmWin){let replied=false;return this.confirmWin(this.message.hule,()=>{if(replied)return;replied=true;callback({});},this);}
  const proceed=()=>{const opts=actions(this,this.message);if(!opts.length)return callback({});this.decide(opts,reply=>callback(reply||{}),this.message,this);};
  if(this.message.dapai?.p.endsWith('*')&&this.confirmRiichi){let replied=false;return this.confirmRiichi(this.message.dapai,()=>{if(replied)return;replied=true;proceed();},this);}
  proceed();
 }

}
for(const type of ['kaiju','qipai','zimo','dapai','fulou','gang','hule','pingju','jieju'])Player.prototype['action_'+type]=function(){this.respond();};
function indicatorNumber(p){return J.number(p);}
function garnetValue(indicators=[],ura=[]){return J.garnet(indicators,ura);}
function bonus(h,points,unlockedYaku=null,gameRule=rule()){return J.bonus(h,points,unlockedYaku,gameRule);}

function transfer(chips,winner,loser,n) {
 if(loser===null){for(let id=0;id<4;id++)if(id!==winner){chips[id]-=n;chips[winner]+=n;}}
 else{chips[loser]-=n;chips[winner]+=n;}
}
class Game extends M.Game {
 constructor(players,done,extra={}) {
  super(players,done,rule({unlockedYaku:UNLOCK_YAKU[Math.floor(Math.random()*UNLOCK_YAKU.length)],...extra}),'宝石麻雀 — Offline');
  this.chips=[0,0,0,0];this.busted=new Set();this.bonusLog=[];
 }
 add_paipu(msg) {
  if(msg.qipai)msg.qipai.chipBalances=this.chips.slice();
  if(msg.hule){
   const before=this.chips.slice();
   const h=msg.hule, ids=this.model.player_id, winner=ids[h.l], loser=h.baojia===null?null:ids[h.baojia];
   h.pocchiAmethyst=this._rule.pocchiAmethyst;
   h.indicators=this.model.shan.baopai;
   h.garnetUra=this.model.shan.fubaopai || [];
   h.winningTile=M.Shoupai.fromString(h.shoupai)._zimo;
   h.unlockedYaku=this._rule.unlockedYaku;
   h.unlockedChips=(h.hupai||[]).some(y=>y.name===h.unlockedYaku)?5:0;
   h.chipBreakdown=J.bonusBreakdown(h,this.model.defen[winner],this._rule.unlockedYaku,this._rule);
   const n=h.chipBreakdown.perPayer;transfer(this.chips,winner,loser,n);
   const victims=[];
   for(let seat=0;seat<4;seat++) {
    const id=ids[seat];
    if(this.model.defen[id]>=0 && this.model.defen[id]+h.fenpei[seat]<0 && !this.busted.has(id)) {
     transfer(this.chips,winner,id,10);this.busted.add(id);victims.push(id);
    }
   }
   h.jewelChips=n;h.jewelTotal=n*(loser===null?3:1);h.chipWinner=winner;h.chipLoser=loser;h.chipBalances=this.chips.slice();h.chipDelta=this.chips.map((v,id)=>v-before[id]);h.tobi=victims;this.bonusLog.push({winner,loser,n,victims});
  }
  super.add_paipu(msg);
 }
 last() { if(this.model.defen.some(n=>n>=55000)) {this.cold=true;return this.delay(()=>this.jieju(),0);}return super.last(); }
 jieju() {this._paipu.bonusChips=this.chips.slice();this._paipu.cold=!!this.cold;return super.jieju();}
}
function settle(paipu) {return paipu.defen.map((points,id)=>({id,points,rank:paipu.rank[id],rankChips:PAYOUT[paipu.rank[id]-1],bonusChips:paipu.bonusChips?.[id]||0}));}
function saveResult(storage,id,results) {
 const key='jewel-offline-results-v1'; let record;
 try {record=JSON.parse(storage.getItem(key)||'{"games":[],"totals":{}}');}catch{throw Error('保存データを読み取れません。既存データは変更していません。');}
 if(!record||!Array.isArray(record.games)||!record.totals)throw Error('保存データの形式が不正です');
 if(record.games.some(g=>g.id===id))return record;
 for(const r of results){const t=record.totals[r.id]||{rankChips:0,bonusChips:0,games:0};record.totals[r.id]={rankChips:t.rankChips+r.rankChips,bonusChips:t.bonusChips+r.bonusChips,games:t.games+1};}
 record.games.push({id,at:new Date().toISOString(),results});storage.setItem(key,JSON.stringify(record));return record;
}
module.exports={M,J,Physical,UNLOCK_YAKU,indicatorNumber,garnetValue,rule,actions,cpu,Player,Game,bonus,transfer,settle,saveResult};
