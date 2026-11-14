'use strict';
const crypto=require('./crypto');
function issue(r,m,{rotate=false}={}){
 if(m.id!==r.host)throw Error('招待URLを発行できるのはオーナーです');
 if(r.phase!=='lobby')throw Error('招待URLは開始前に発行してください');
 if(rotate||!r.invitation||r.invitation.expiresAt<=Date.now())r.invitation={token:crypto.randomBytes(32).toString('hex'),expiresAt:Date.now()+2*60*60*1000};
 return {...r.invitation,room:r.code};
}
function validate(r,token){
 if(token===undefined)return; // Manual room-code entry remains available.
 if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token)||!r.invitation||r.invitation.expiresAt<=Date.now()||token!==r.invitation.token)throw Error('招待URLが無効か期限切れです。オーナーに再発行を依頼してください');
}
module.exports={issue,validate};
