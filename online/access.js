'use strict';
const crypto=require('node:crypto'),{posix}=require('node:path');
// Shared preview gate. Keep room bearer-token authorization behind this gate.
const PASSWORD_HASH='bd94dcda26fccb4e68d6a31f9b5aac0b571ae266d822620e901ef7ebe3a11d4f';
module.exports=function createAccessGate({secureCookie=true,now=Date.now}={}){
 const sessions=new Map(),attempts=new Map(),ttl=12*60*60*1000;
 const page=(error,game)=>`<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>オンライン対戦 | 宝石麻雀</title><link rel="stylesheet" href="site.css"><script src="room-invite.js" defer></script></head><body><main class="document"><section class="hero"><span class="eyebrow">HOUSEKI MAHJONG · PREVIEW</span><h1>オンライン対戦</h1><p>確認用パスワードを入力すると、ルーム対戦へ進めます。</p>${error?'<p role="alert">'+error+'</p>':''}<form method="post" action="/access${game?'?game='+game:''}"><p><label for="preview-password">パスワード</label><br><input id="preview-password" name="password" type="password" autocomplete="current-password" required maxlength="128"></p><button class="button" type="submit">確認用ルームへ進む</button></form><p><a href="home.html">メインメニューへ</a> · <a href="records.html">対戦成績</a></p></section></main></body></html>`;
 function html(res,status,error,game){res.writeHead(status,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"});res.end(page(error,game));}
 return async(req,res,url)=>{
  const path=posix.normalize(decodeURIComponent(url.pathname));const requestedGame=url.searchParams.get('game'),game=['sanma','chinchiro'].includes(requestedGame)?requestedGame:null;if(path!=='/access'&&path!=='/'&&path!=='/online.html'&&path!=='/online.js'&&path!=='/table-online.html'&&!path.startsWith('/api/'))return false;
  for(const [token,expiry]of sessions)if(expiry<=now())sessions.delete(token);
  const cookie=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('houseki-preview='))?.slice(16);
  if(path!=='/access'&&sessions.has(cookie))return false;
  if(path==='/access'&&req.method==='POST'){
   if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host){html(res,403,'別のサイトからは認証できません。');return true;}
   const ip=req.socket.remoteAddress,attempt=attempts.get(ip)||{at:now(),n:0};if(now()-attempt.at>60000){attempt.at=now();attempt.n=0;}attempt.n++;if(attempts.size>2000)attempts.clear();attempts.set(ip,attempt);
   if(attempt.n>30){html(res,429,'入力回数が多いため、1分ほど待ってください。');return true;}
   let body='';for await(const part of req){body+=part;if(body.length>1024){html(res,413,'入力が長すぎます。');return true;}}
   const password=new URLSearchParams(body).get('password')||'',hash=crypto.createHash('sha256').update(password).digest();
   if(!crypto.timingSafeEqual(hash,Buffer.from(PASSWORD_HASH,'hex'))){html(res,403,'パスワードが違います。',game);return true;}
   if(sessions.size>=1000)sessions.delete(sessions.keys().next().value);
   const token=crypto.randomBytes(32).toString('hex');sessions.set(token,now()+ttl);
   res.writeHead(303,{'Location':game?'/table-online.html?game='+game+'&connection=remote':'/','Cache-Control':'no-store','Set-Cookie':`houseki-preview=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${ttl/1000}${secureCookie?'; Secure':''}`});res.end();return true;
  }
  if(path.startsWith('/api/')){res.writeHead(401,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify({error:'パスワード認証が必要です。入口でパスワードを入力してください。'}));}
  else html(res,200,undefined,path==='/table-online.html'?game||'sanma':game);
  return true;
 };
};
