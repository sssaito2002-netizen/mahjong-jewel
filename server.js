const http = require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const WebSocket=require('./socket');
const {createGame,discard,playerView}=require('./game');
const PORT=Number(process.env.PORT)||3000;
const rooms=new Map();
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=pathname==='/'?'index.html':pathname.replace(/^\//,'');
  if(!['index.html','style.css','app.js','calculator.js'].includes(file)){res.writeHead(404);return res.end('Not found');}
  fs.readFile(path.join(__dirname,'public',file),(err,data)=>{
    if(err){res.writeHead(404);return res.end('Not found');}
    res.writeHead(200,{'Content-Type':mime[path.extname(file)],'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff'});res.end(data);
  });
});
const wss=new WebSocket.Server({server,maxPayload:4096});
const send=(ws,msg)=>{if(ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify(msg));};
const code=()=>crypto.randomBytes(3).toString('hex').toUpperCase();
function broadcast(room){
  const lobby={room:room.code, host:room.host, members:room.players.map(p=>({id:p.id,name:p.name,connected:p.ws?.readyState===WebSocket.OPEN})), started:!!room.game};
  for(const p of room.players) send(p.ws,{type:'state',selfId:p.id,lobby,game:room.game?playerView(room.game,p.id):null});
}
function findSeatByWs(ws){for(const room of rooms.values())for(const p of room.players)if(p.ws===ws)return {room,p};return null;}
function error(ws,message){send(ws,{type:'error',message});}
wss.on('connection',ws=>{
  ws.on('message',raw=>{
    let m;try{m=JSON.parse(raw)}catch{return error(ws,'無効なデータです');}
    if(typeof m!=='object'||m===null)return error(ws,'無効なデータです');
    try {
      if(m.type==='join'){
        if(findSeatByWs(ws)) throw Error('すでに参加しています');
        const name=String(m.name||'プレイヤー').trim().slice(0,16)||'プレイヤー';
        let room;
        const requested=String(m.room||'').trim().toUpperCase();
        if(requested){room=rooms.get(requested);if(!room)throw Error('ルームが見つかりません');}
        else {let newCode;do{newCode=code()}while(rooms.has(newCode));room={code:newCode,host:null,players:[],game:null};rooms.set(newCode,room);}
        let p;
        const reconnectToken=String(m.token||'');
        if(reconnectToken)p=room.players.find(x=>x.token===reconnectToken);
        if(p){if(p.ws&&p.ws!==ws) p.ws.close();p.ws=ws;}
        else {
          if(room.game)throw Error('対局開始後は新規参加できません');
          if(room.players.length>=4)throw Error('満席です');
          p={id:crypto.randomUUID(),name,token:crypto.randomBytes(24).toString('hex'),ws};
          room.players.push(p);if(!room.host)room.host=p.id;
        }
        send(ws,{type:'joined',room:room.code,token:p.token});broadcast(room);return;
      }
      const seat=findSeatByWs(ws);if(!seat)throw Error('先にルームへ参加してください');
      const {room,p}=seat;
      if(m.type==='start'){
        if(room.host!==p.id)throw Error('ホストのみ開始できます');
        if(room.players.length!==4)throw Error('開始には4人必要です');
        if(!room.players.every(x=>x.ws?.readyState===WebSocket.OPEN))throw Error('全員の接続が必要です');
        if(room.game?.phase==='playing')throw Error('すでに対局中です');
        room.game=createGame(room.players.map(x=>x.id)); broadcast(room);return;
      }
      if(m.type==='discard'){
        if(!room.game)throw Error('まだ開始されていません');
        discard(room.game,p.id,String(m.tileId||''));broadcast(room);return;
      }
      throw Error('不明な操作です');
    }catch(e){error(ws,e.message);}
  });
  ws.on('close',()=>{const seat=findSeatByWs(ws);if(seat){seat.p.ws=null;broadcast(seat.room);}});
});
server.listen(PORT,()=>console.log(`Jewel prototype: http://localhost:${PORT}`));
