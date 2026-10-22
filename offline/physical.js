'use strict';
// Separate physical identity from the logical 34 tile types. 0/A are the two
// different selected Jewels of a five. They never add a fifth logical copy.
module.exports=function install(M){
 const S=M.Shoupai, originalValid=S.valid_mianzi;
 S.valid_mianzi=m=>originalValid(S.normal_pai(m))?m:undefined;
 function normalized(hand){const h=hand.clone();for(const s of ['m','p','s','z']){for(const n of s==='z'?[0,8,9,10]:[0,10])h._bingpai[s][n]=0;}h._zimo=h._zimo?S.normal_pai(h._zimo):null;h._fulou=h._fulou.map(m=>S.normal_pai(m));return h;}
 function available(hand,s,n){const b=hand._bingpai[s],markers=s==='z'?({4:[9],5:[0,10],6:[8]}[n]||[]):n===5?[0,10]:[];const a=[];let specials=0;for(const i of markers){const k=b[i]||0;specials+=k;for(let j=0;j<k;j++)a.push(i===10?'A':String(i));}for(let j=0;j<b[n]-specials;j++)a.push(String(n));return a;}
 const getDiscard=S.prototype.get_dapai;
 S.prototype.get_dapai=function(check=true){if(this.lizhi)return this._zimo?.length===2?[this._zimo+'_']:null;const legal=getDiscard.call(normalized(this),check);if(!legal)return legal;const out=[];for(const p of legal){if(p.endsWith('_'))out.push(this._zimo+'_');else for(const ch of new Set(available(this,p[0],+p[1])))out.push(p[0]+ch);}return [...new Set(out)];};
 for(const name of ['get_chi_mianzi','get_peng_mianzi','get_gang_mianzi']){
  const original=S.prototype[name];S.prototype[name]=function(p,...args){
   const legal=original.call(normalized(this),p?S.normal_pai(p):p,...args);if(!legal)return legal;const out=[];
   for(const m of legal){
    if(/^[mpsz][0-9]{3}[+=-][0-9]$/.test(m)){
     for(const old of this._fulou)if(S.normal_pai(old)===m.slice(0,5))for(const ch of new Set(available(this,m[0],+m.slice(-1))))out.push(old+ch);
     continue;
    }
    const chars=m.split(''),counts={};for(let n=1;n<=(m[0]==='z'?7:9);n++)for(const ch of available(this,m[0],n))counts[ch]=(counts[ch]||0)+1;
    function expand(i){if(i===chars.length){out.push(chars.join(''));return;}if(!/[0-9]/.test(m[i]))return expand(i+1);
     if(/[+=-]/.test(m[i+1]||'!')){chars[i]=p[1];return expand(i+1);}
     for(const ch of Object.keys(counts))if(counts[ch]&&S.normal_pai(m[0]+ch)[1]===m[i]&&!(i>1&&m[i]===m[i-1]&&ch<chars[i-1])){counts[ch]--;chars[i]=ch;expand(i+1);counts[ch]++;}
    }expand(1);
   }
   return [...new Set(out)];
  };
 }
 return {normalized,available};
};
