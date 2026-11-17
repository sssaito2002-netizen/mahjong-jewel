'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),E=require('../offline/engine'),R=E.RuleExchange,S=E.Sanma;
test('four rule files/codes/links preserve frame colors and chip settings, without device or result data',()=>{
 const profile={...E.CustomFour.example(),tileChips:[{tile:'z7',chips:3,color:'#abcdef'}],names:['秘密'],token:'private',results:[1]};profile.tiles[0].color='#123456';const value=R.create('four',profile);for(const text of [R.json(value),R.code(value),R.link(value),'受け取ったルールです\n'+R.link(value)])a.deepEqual(R.parse(text),value);a.equal(value.profile.tiles[0].color,'#123456');a(!R.json(value).includes('private'));a(!R.json(value).includes('秘密'));
});
test('sanma sharing preserves every variant, optional tile and Jewel setting and five-style outer rules',()=>{
 const variants=[S.Custom.dan(),S.Custom.bingo(),{...S.Custom.defaults(),settlement:'rank',chipPoint:5,gemSelection:['pearl'],tileRules:S.Custom.Tiles.tileRules().map(r=>({...r,...(r.tile==='m5'?{included:true,extract:true,hand:false}:{} )}))},{...S.Custom.defaults(),scoring:'goto'}];
 for(const customSanma of variants){const options=S.options({customSanma,house:S.H.PRESET,flowerRules:{spring:'tulip'},names:['private'],participantTypes:['human'],cpuLevel:'expert',startSeat:2}),v=R.create('sanma',options);a.deepEqual(R.parse(R.link(v)),v);const g=new S.Game(v.profile);a.deepEqual(g.options.customSanma,S.Custom.validate(customSanma));if(customSanma.scoring==='goto'){a.equal(g.options.house.riichiOnly,true);a.equal(g.options.flowerRules.spring,'tulip');}a(!R.json(v).includes('private'));a(!Object.hasOwn(v.profile,'cpuLevel'));a(!Object.hasOwn(v.profile,'startSeat'));}
});
test('invalid envelopes, malformed code, unsupported versions and oversized text are rejected before import',()=>{
 for(const text of ['','not a rule','HM1.???',JSON.stringify({schema:R.SCHEMA,version:2,kind:'four',profile:{}}),JSON.stringify({schema:R.SCHEMA,version:1,kind:'sanma',profile:{}}),'x'.repeat(R.MAX+1)])a.throws(()=>R.parse(text));a.throws(()=>R.create('four',{...E.CustomFour.example(),tiles:[{base:'m2',slot:0,name:'bad',chips:3}]}));a.throws(()=>R.create('sanma',{customSanma:{...S.Custom.defaults(),chipPoint:0}}));
});
test('received names avoid overwrite, retain Unicode length bounds and preserve settings when renamed',()=>{
 const v=R.create('four',{...E.CustomFour.example(),name:'宝'.repeat(40)}),name=R.availableName(v,[R.name(v)]);a([...name].length<=40);a.notEqual(name,R.name(v));const renamed=R.rename(v,name);a.equal(renamed.profile.tiles[0].chips,v.profile.tiles[0].chips);a.equal(R.name(renamed),name);
 const sanma=R.create('sanma',S.options({customSanma:S.Custom.dan()})),copy=R.rename(sanma,'受け取った宝石');a.equal(copy.profile.customRuleName,'受け取った宝石');a.equal(copy.profile.customSanma.name,'受け取った宝石');a.equal(copy.profile.customSanma.specialTiles.length,sanma.profile.customSanma.specialTiles.length);
});
