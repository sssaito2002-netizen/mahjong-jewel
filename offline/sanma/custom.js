'use strict';
const TileChips=require('../tile-chips');
const integer=(n,min,max,label)=>{if(!Number.isSafeInteger(n)||n<min||n>max)throw Error(label+'は'+min+'〜'+max+'の整数です');return n;};
function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==1)throw Error('カスタム三麻の形式が不正です');
 const name=typeof value.name==='string'?value.name.trim():'';
 if(!name||[...name].length>40||/[\u0000-\u001f\u007f]/.test(name))throw Error('ルール名は1〜40文字です');
 const scoring=value.scoring??'points',length=value.length??'east',tsumo=value.tsumo??'loss',dealerRepeat=value.dealerRepeat??'tenpai';
 if(!['points','goto'].includes(scoring)||!['east','south'].includes(length)||!['loss','split'].includes(tsumo)||!['tenpai','always'].includes(dealerRepeat))throw Error('対局形式が不正です');
 for(const k of ['redFives','nuki','bustAtZero','agariYame'])if(value[k]!==undefined&&typeof value[k]!=='boolean')throw Error('ルール設定が不正です');
 const startPoints=integer(value.startPoints??35000,1000,100000,'開始点'),returnPoints=integer(value.returnPoints??40000,1000,100000,'返し点');
 if(startPoints%1000||returnPoints%1000)throw Error('開始点・返し点は1000点単位です');
 if((value.notenPool??3000)%1000||(value.honbaRon??300)%100||(value.honbaEach??100)%100)throw Error('本場は100点単位、罰符は1000点単位です');
 const uma=value.uma??[20,0,-20];if(!Array.isArray(uma)||uma.length!==3||uma.some(n=>!Number.isSafeInteger(n)||Math.abs(n)>1000)||uma.reduce((a,b)=>a+b)!==0)throw Error('ウマは3人分・合計0の整数です');
 return {version:1,name,tileChips:TileChips.validate(value.tileChips,{sanma:true}),scoring,length,startPoints,returnPoints,uma:uma.slice(),tsumo,dealerRepeat,redFives:value.redFives??true,nuki:value.nuki??true,bustAtZero:value.bustAtZero??false,agariYame:value.agariYame??true,honbaRon:integer(value.honbaRon??300,0,10000,'ロン本場'),honbaEach:integer(value.honbaEach??100,0,10000,'ツモ本場'),notenPool:integer(value.notenPool??3000,0,12000,'ノーテン罰符')};
}
function defaults(name='点数三麻・東風'){return validate({version:1,name});}
function finish(points,order,value,chips=[0,0,0]){
 const c=validate(value),oka=(c.returnPoints-c.startPoints)*3/1000;
 return order.map((id,index)=>({id,rank:index+1,points:points[id],score:c.scoring==='points'?Math.round(((points[id]-c.returnPoints)/1000+c.uma[index]+(index===0?oka:0))*1000)/1000:0,rankChips:c.scoring==='points'?0:undefined,bonusChips:chips[id]}));
}
module.exports={validate,defaults,finish};
