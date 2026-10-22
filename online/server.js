'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{Rooms}=require('./rooms');
function createServer(options={}){
 const rooms=new Rooms(options),root=path.resolve(__dirname,'../public/offline'),rates=new Map();
 const json=(res,status,value)=>{if(res.writableEnded||res.destroyed)return;res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
 const body=async req=>{let data='';for await(const chunk of req){data+=chunk;if(data.length>8192)throw Error('送信データが大きすぎます');}return JSON.parse(data||'{}');};
 const server=http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/health')return json(res,200,{ok:true,rooms:rooms.rooms.size});
  if(url.pathname.startsWith('/api/')){
   // Same-origin only. Bearer tokens never appear in URLs or public lobby messages.
   if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return json(res,403,{error:'別のサイトからは操作できません'});
   if(req.method==='POST'){
    const key=req.socket.remoteAddress,now=Date.now(),rate=rates.get(key)||{at:now,n:0};if(now-rate.at>60000){rate.at=now;rate.n=0;}if(++rate.n>180)return json(res,429,{error:'操作が多すぎます。少し待ってください'});if(rates.size>2000)rates.clear();rates.set(key,rate);
   }
   if(req.url==='/api/rooms'&&req.method==='POST'){const b=await body(req);return json(res,200,rooms.create(b.name));}
   const match=url.pathname.match(/^\/api\/rooms\/([A-F0-9]{8})\/(join|events|command)$/);if(!match)return json(res,404,{error:'Not found'});const [,code,action]=match;
   if(action==='join'&&req.method==='POST'){const b=await body(req);return json(res,200,rooms.join(code,b.name));}
   const {r,m}=rooms.auth(code,(req.headers.authorization||'').replace(/^Bearer /,''));
   if(action==='command'&&req.method==='POST'){rooms.command(r,m,await body(req));return json(res,200,{ok:true});}
   if(action==='events'&&req.method==='GET'){
    const after=Number(url.searchParams.get('after')||0);let data=rooms.events(r,m,after);if(data.events.length)return json(res,200,data);
    if(m.waiters.size>=2)return json(res,429,{error:'同時接続が多すぎます'});
    let timer;const wake=()=>{clearTimeout(timer);m.waiters.delete(wake);json(res,200,rooms.events(r,m,after));};m.waiters.add(wake);timer=setTimeout(wake,20000);timer.unref();res.on('close',()=>{clearTimeout(timer);m.waiters.delete(wake);});return;
   }
   return json(res,405,{error:'Method not allowed'});
  }
  if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Method not allowed'});
  const relative=decodeURIComponent(url.pathname).replace(/^\/+/,''),file=path.resolve(root,relative||'online.html');if(!file.startsWith(root+path.sep))return json(res,404,{error:'Not found'});
  const ext=path.extname(file),mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.md':'text/plain','.txt':'text/plain'}[ext];if(!mime)return json(res,404,{error:'Not found'});
  fs.readFile(file,(err,data)=>{if(err)return json(res,404,{error:'Not found'});res.writeHead(200,{'Content-Type':mime+'; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'"});res.end(req.method==='HEAD'?undefined:data);});
 }catch(error){json(res,400,{error:error instanceof SyntaxError?'入力データが不正です':error.message});}});
 const cleanup=setInterval(()=>rooms.expire(),60000);cleanup.unref();server.on('close',()=>{clearInterval(cleanup);rooms.close();});return {server,rooms};
}
if(require.main===module){const {server}=createServer();server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('宝石麻雀 online server started'));}
module.exports={createServer};
