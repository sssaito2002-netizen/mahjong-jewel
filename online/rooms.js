'use strict';
const crypto=require('node:crypto'),E=require('../offline/engine');
const copy=x=>JSON.parse(JSON.stringify(x));
class Rooms {
 constructor({maxRooms=8,turnMs=20000,callMs=10000,confirmMs=15000,speed=0,idleMs=2*3600000}={}){Object.assign(this,{maxRooms,turnMs,callMs,confirmMs,speed,idleMs});this.rooms=new Map();}
 create(name){this.expire();if(this.rooms.size>=this.maxRooms)throw Error('現在満室です。しばらく待ってください');let code;do{code=crypto.randomBytes(4).toString('hex').toUpperCase();}while(this.rooms.has(code));const r={code,host:0,members:[],selection:E.J.DEFAULT.slice(),game:null,phase:'lobby',touched:Date.now(),id:crypto.randomUUID()};this.rooms.set(code,r);return this.join(code,name);}
 room(code){const r=this.rooms.get(String(code).toUpperCase());if(!r)throw Error('ルームが見つかりません。サーバー再起動の場合は作り直してください');return r;}
 join(code,name){const r=this.room(code);if(r.phase!=='lobby')throw Error('対局開始後は新規参加できません');if(r.members.length>=4)throw Error('満席です');name=String(name||'').trim();if(!name||name.length>16)throw Error('名前は1〜16文字にしてください');const m={id:r.members.length,name,token:crypto.randomBytes(32).toString('hex'),events:[],waiters:new Set(),pending:null,ready:false,lastSeen:Date.now(),joined:Date.now(),seen:new Map()};r.members.push(m);r.touched=Date.now();this.lobby(r);return {room:r.code,token:m.token,self:m.id};}
 auth(code,token){const r=this.room(code),m=r.members.find(m=>m.token===token);if(!m)throw Error('参加情報が無効です');m.lastSeen=Date.now();r.touched=Date.now();return {r,m};}
 emit(m,type,data){if(m.events.length>=20000)throw Error('対局ログ上限です');m.events.push({seq:m.events.length+1,type,data:copy(data)});for(const wake of m.waiters)wake();m.waiters.clear();}
 lobby(r){const data={room:r.code,host:r.host,phase:r.phase,selection:r.selection,members:r.members.map(m=>({id:m.id,name:m.name,ready:m.ready,connected:Date.now()-m.lastSeen<45000})),cpu:4-r.members.length};for(const m of r.members)this.emit(m,'lobby',data);}
 request(r,m,type,data,callback,ms,fallback){const id=crypto.randomUUID(),deadline=Date.now()+ms;const finish=reply=>{if(m.pending?.id!==id)return;clearTimeout(m.pending.timer);m.pending=null;this.emit(m,'resolved',{id});callback(reply);};m.pending={id,type,data,deadline,finish,timer:setTimeout(()=>finish(fallback()),ms)};m.pending.timer.unref?.();this.emit(m,'prompt',{id,type,data,deadline});}
 command(r,m,command){
  const {type}=command;
  if(type==='configure'){if(m.id!==r.host||r.phase!=='lobby')throw Error('設定変更は開始前のホストのみです');E.J.configure(command.selection);r.selection=command.selection.slice();for(const p of r.members)p.ready=false;this.lobby(r);return;}
  if(type==='ready'){if(r.phase!=='lobby')throw Error('すでに開始しています');m.ready=command.ready===true;this.lobby(r);return;}
  if(type==='start'){if(m.id!==r.host)throw Error('開始できるのはホストです');if(r.phase!=='lobby')throw Error('すでに開始しています');if(r.members.length<2)throw Error('人間2人以上で開始できます');if(!r.members.every(p=>p.ready&&Date.now()-p.lastSeen<45000))throw Error('全員の接続と準備完了が必要です');return this.start(r);}
  if(type==='reply'){
   if(typeof command.id!=='string')throw Error('操作IDがありません');if(m.seen.has(command.id))return;
   const p=m.pending;if(!p||p.id!==command.id)throw Error('手番が更新されました');
   const reply=command.reply||{};if(p.type==='action'&&!p.data.options.some(o=>JSON.stringify(o.reply)===JSON.stringify(reply)))throw Error('その操作は選択できません');
   if(p.type!=='action'&&Object.keys(reply).length)throw Error('確認操作が不正です');m.seen.set(p.id,true);if(m.seen.size>100)m.seen.delete(m.seen.keys().next().value);p.finish(copy(reply));return;
  }
  throw Error('不明な操作です');
 }
 start(r){r.phase='playing';r.matchId=crypto.randomUUID();this.lobby(r);const players=[];
  for(let id=0;id<4;id++){const m=r.members[id];let player;
   if(m){player=new E.Player((options,reply,msg,p)=>{const discard=options.some(o=>o.reply.dapai);this.request(r,m,'action',{options},reply,discard?this.turnMs:this.callMs,()=>{const win=options.find(o=>o.reply.hule);if(win)return win.reply;if(discard){const draw=options.find(o=>o.reply.dapai===p.shoupai._zimo+'_')||options.find(o=>o.reply.dapai?.slice(0,2)===p.shoupai._zimo&&!o.reply.dapai.endsWith('*'));if(draw)return draw.reply;}return options.find(o=>Object.keys(o.reply).length===0)?.reply||E.cpu(p,options);});},msg=>this.emit(m,'game',msg));
    player.confirmWin=(h,done)=>this.request(r,m,'win',h,done,this.confirmMs,()=>({}));
    player.confirmRiichi=(d,done)=>this.request(r,m,'riichi',d,done,this.confirmMs,()=>({}));
   }else player=new E.Player((options,reply,msg,p)=>reply(E.cpu(p,options)));
   players.push(player);
  }
  r.game=new E.Game(players,paipu=>{r.phase='finished';r.results=E.settle(paipu);for(const m of r.members)this.emit(m,'result',{matchId:r.matchId,rows:r.results,cold:!!paipu.cold});this.lobby(r);},{gemSelection:r.selection});r.game._model.player=[0,1,2,3].map(id=>r.members[id]?.name||'CPU '+(id+1));r.game.speed=this.speed;r.game.kaiju();
 }
 events(r,m,after){if(!Number.isSafeInteger(after)||after<0||after>m.events.length)throw Error('受信位置が不正です');return {head:m.events.length,events:m.events.slice(after,after+200),pending:m.pending?{id:m.pending.id,type:m.pending.type,data:m.pending.data,deadline:m.pending.deadline}:null};}
 expire(){for(const [code,r]of this.rooms)if(Date.now()-r.touched>this.idleMs){r.game?.stop();for(const m of r.members){clearTimeout(m.pending?.timer);for(const wake of m.waiters)wake();}this.rooms.delete(code);}}
 close(){for(const r of this.rooms.values()){r.game?.stop();for(const m of r.members){clearTimeout(m.pending?.timer);m.pending=null;for(const wake of m.waiters)wake();m.waiters.clear();}}this.rooms.clear();}
}
module.exports={Rooms};
