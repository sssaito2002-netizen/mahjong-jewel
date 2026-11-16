'use strict';
const H=require('./sanma/variants');
const name=value=>typeof value==='string'?value.trim().slice(0,80):'';
const meta=(game,type,ruleName='')=>({version:1,game,type,...(type==='custom'?{name:ruleName}:{})});
function four(rule){
 if(!rule||typeof rule!=='object')return meta('four','unknown');
 if(name(rule.customFour?.name))return meta('four','custom',name(rule.customFour.name));
 if(rule.nekkyou===undefined&&rule.gemTiles&&Array.isArray(rule.gemSelection))return meta('four','normal');
 if(typeof rule.nekkyou==='boolean')return meta('four',rule.nekkyou?'hard':'normal');
 return meta('four','unknown');
}
function sanma(options){
 if(!options||typeof options!=='object')return meta('sanma','unknown');
 const ruleName=name(options.customRuleName||options.customSanma?.name||options.customRule?.name||options.ruleName);
 if(ruleName)return {...meta('sanma','custom',ruleName),...(options.customSanma?.scoring==='points'?{scoring:'points'}:{})};
 if(options.preset==='dan')return meta('sanma','custom','DAN');
 let house;try{house=H.validate(options.house);}catch{return meta('sanma','unknown');}
 const flowers={spring:'linked',summer:'rank',autumn:'dora',winter:'alice',...options.flowerRules},pocchi=options.pocchiTypes??(options.whitePocchi===false?[]:[options.pocchiType||'normal']);
 const common=(options.flowerCopies??1)===1&&!options.pocchiIppatsuDice&&Array.isArray(pocchi)&&pocchi.length===1&&pocchi[0]==='normal';
 const same=(a,b)=>Object.entries(b).every(([k,v])=>a[k]===v);
 if(common&&same(house,H.DEFAULTS)&&same(flowers,{spring:'linked',summer:'rank',autumn:'dora',winter:'alice'}))return meta('sanma','normal');
 if(common&&same(house,H.PRESET)&&same(flowers,{spring:'tulip',summer:'rank',autumn:'double',winter:'dice'}))return meta('sanma','jewel');
 return meta('sanma','custom','');
}
function validate(value,game){
 if(!value||value.version!==1||value.game!==game||!['normal','hard','jewel','custom','unknown'].includes(value.type)||game==='four'&&value.type==='jewel'||game==='sanma'&&value.type==='hard')return null;
 return {...meta(game,value.type,name(value.name)),...(game==='sanma'&&value.scoring==='points'?{scoring:'points'}:{})};
}
const key=r=>r.type==='custom'?'custom:'+r.name:r.type;
function label(r){return r.type==='custom'?'カスタムルール（'+(r.name||'名称未設定')+'）':r.type==='unknown'?'ルール不明（旧記録）':r.game==='four'?(r.type==='hard'?'宝石（ハードモード）':'宝石（通常）'):(r.type==='jewel'?'五等サンマ（宝石麻雀ルール）':'五等サンマ（通常）');}
function infer(game,rows){
 const count=game==='four'?4:3;if(!Array.isArray(rows)||rows.length!==count||new Set(rows.map(r=>r.id)).size!==count||new Set(rows.map(r=>r.rank)).size!==count||rows.some(r=>!Number.isInteger(r.rank)||r.rank<1||r.rank>count||!Number.isFinite(r.rankChips)))return null;
 const ranks=rows.slice().sort((a,b)=>a.rank-b.rank),signature=ranks.map(r=>r.rankChips).join(',');
 const type=game==='four'?signature==='50,25,-25,-50'?'normal':signature==='15,5,-5,-15'?'hard':null:signature==='20,0,-20'?'jewel':signature==='10,0,-10'||signature==='20,-10,-10'?'normal':null;
 return type?meta(game,type):null;
}
module.exports={four,sanma,validate,key,label,infer};
