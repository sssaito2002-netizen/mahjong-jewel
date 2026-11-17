'use strict';
module.exports=E=>{
 const SCHEMA='houseki-custom-rule',MAX=65536,KEYS=['house','flowerRules','pocchiTypes','pocchiIppatsuDice','flowerCopies','customSanma','customRuleName'];
 function normalize(value){
  if(!value||value.schema!==SCHEMA||value.version!==1||!['four','sanma'].includes(value.kind))throw Error('対応するルール共有データではありません');
  let profile;if(value.kind==='four')profile=E.CustomFour.validate(value.profile);else{if(!value.profile?.customSanma)throw Error('カスタム三麻の設定がありません');const o=E.Sanma.options(Object.fromEntries(KEYS.filter(k=>value.profile[k]!==undefined).map(k=>[k,value.profile[k]])));profile=Object.fromEntries(KEYS.map(k=>[k,o[k]]));}
  return {schema:SCHEMA,version:1,kind:value.kind,profile};
 }
 function create(kind,profile){return normalize({schema:SCHEMA,version:1,kind,profile});}
 function json(value){return JSON.stringify(normalize(value),null,2);}
 function code(value){const bytes=new TextEncoder().encode(JSON.stringify(normalize(value)));if(bytes.length>32768)throw Error('共有するルールが大きすぎます');let raw='';for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode(...bytes.subarray(i,i+8192));return 'HM1.'+btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
 function parse(text){
  if(typeof text!=='string'||!text.trim()||text.length>MAX)throw Error('ルール共有データを確認してください（64KBまで）');text=text.trim();
  try{if(!text.startsWith('{')){const found=text.match(/HM1\.[A-Za-z0-9_-]+/);if(found)text=found[0];}if(/^https?:\/\//i.test(text))text=new URL(text).hash.slice(1);if(text.startsWith('#'))text=text.slice(1);if(text.startsWith('rule='))text=new URLSearchParams(text).get('rule')||'';
   if(text.startsWith('HM1.')){let b=text.slice(4);if(!/^[A-Za-z0-9_-]+$/.test(b))throw Error();b=b.replace(/-/g,'+').replace(/_/g,'/');const raw=atob(b.padEnd(Math.ceil(b.length/4)*4,'='));text=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(raw,c=>c.charCodeAt(0)));}
   return normalize(JSON.parse(text));
  }catch(e){throw Error(e.message?.startsWith('対応する')||e.message?.startsWith('カスタム三麻')?e.message:'読み込めません。共有リンク・共有コード・ルールファイルの内容を確認してください');}
 }
 const route=kind=>kind==='four'?'index.html?setup=1&custom=1':'sanma.html?custom=1';
 function link(value,base='https://mahjong-mania.github.io/'){const v=normalize(value),url=new URL(route(v.kind),base);url.hash='rule='+code(v);return url.href;}
 function name(value){const v=normalize(value);return v.kind==='four'?v.profile.name:v.profile.customSanma.name;}
 function rename(value,newName){const v=normalize(value);if(v.kind==='four')v.profile.name=newName;else{v.profile.customSanma.name=newName;v.profile.customRuleName=newName;}return normalize(v);}
 function availableName(value,existing=[]){const base=name(value);if(!existing.includes(base))return base;for(let i=2;i<=1000;i++){const suffix='（受取'+i+'）',candidate=[...base].slice(0,40-[...suffix].length).join('')+suffix;if(!existing.includes(candidate))return candidate;}throw Error('保存名を変更してください');}
 function summary(value){const v=normalize(value);if(v.kind==='four'){const c=v.profile;return ['カスタム四麻 ／ '+c.name,'順位祝儀 '+c.rankChips.join('/')+'枚','一発 '+c.ippatsuChips+'枚 ／ 裏ドラ '+c.uraChips+'枚 ／ トビ '+c.tobiChips+'枚 ／ コールド '+c.coldChips+'枚オール',...c.tiles.map(t=>E.TileChips.label(t.base)+' '+t.name+'：'+t.chips+'枚'+(t.color?' ／ 枠色 '+t.color:'')),'牌別祝儀：'+E.TileChips.summary(c.tileChips)];}
  const c=v.profile.customSanma,lines=E.Sanma.Custom.describe(c);if(c.scoring==='points')lines.push('ツモ：'+(c.tsumo==='loss'?'ツモ損あり':'ロン点を2人で折半')+' ／ 本場：ロン'+c.honbaRon+'点・ツモ各'+c.honbaEach+'点','流局：'+(c.dealerRepeat==='tenpai'?'親テンパイ連荘':'親は常に連荘')+' ／ ノーテン罰符'+c.notenPool+'点','赤5各1枚 '+(c.redFives?'あり':'なし')+' ／ 0点トビ '+(c.bustAtZero?'あり':'なし')+' ／ 親トップ和了止め '+(c.agariYame?'あり':'なし'));const flowers={spring:{tulip:'リーチ和了時チューリップ',linked:'抜いた華の数に連動する祝儀',fixed:'抜くたび1枚オール',off:'なし'},summer:{rank:'打点1ランクアップ',han:'1翻加算',off:'なし'},autumn:{double:'5筒索のドラ・祝儀2倍',dora:'5筒索にドラ追加',chips:'和了祝儀＋1枚',off:'なし'},winter:{dice:'和了時サイコロ1個',alice:'アリス',tulip:'チューリップ',chips:'和了祝儀＋2枚',off:'なし'}};if(c.scoring==='goto'){lines.push('ポッチ：'+(v.profile.pocchiTypes.map(k=>E.Sanma.POCCHI_NAMES[k]).join('・')||'なし'),'華牌 '+v.profile.flowerCopies*4+'枚',...['spring','summer','autumn','winter'].map((key,index)=>E.Sanma.FLOWERS[index]+'：'+flowers[key][v.profile.flowerRules[key]]),...Object.entries(E.Sanma.H.FIELDS).map(([k,f])=>f.label+'：'+(f.values?f.labels[f.values.indexOf(v.profile.house[k])]:v.profile.house[k]?'あり':'なし')));}return lines;
 }
 return {SCHEMA,MAX,create,normalize,json,code,parse,route,link,name,rename,availableName,summary};
};
