'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../offline/engine'),D=require('../public/offline/record-data'),R=E.ResultRules;
const row=(id,rank,rankChips,bonusChips)=>({id,rank,points:35000,rankChips,bonusChips}),storage=data=>({getItem:k=>data[k]??null,setItem:(k,v)=>data[k]=v});
test('new four-player results retain rule names independently of profiles and replay eviction',()=>{
 const data={},s=storage(data),c=E.CustomFour.example(),rows=[row(0,1,20,7)];
 E.saveResult(s,'custom',rows,E.rule({customFour:c}));c.name='後から変更';
 E.saveResult(s,'hard',rows,E.rule({nekkyou:true}));
 E.saveResult(s,'normal',rows,E.rule());
 const list=D.load(s).games.four;
 assert.deepEqual(list.map(g=>R.key(g.ruleMeta)),['custom:DAN風・牌構成','hard','normal']);
 assert.equal(list[0].ruleMeta.name,'DAN風・牌構成');assert.equal(D.filter(list,{rule:'hard'}).length,1);
});
test('sanma exact builtins and changed or named rules remain distinct',()=>{
 const normal=E.Sanma.options(),house=E.Sanma.options({house:E.Sanma.H.PRESET,flowerRules:{spring:'tulip',summer:'rank',autumn:'double',winter:'dice'}});
 assert.equal(R.sanma(normal).type,'normal');assert.equal(R.sanma(house).type,'jewel');
 assert.equal(R.sanma({...house,house:{...house.house,shuba:false}}).type,'custom');
 assert.equal(R.sanma({...normal,customRuleName:'夜卓'}).name,'夜卓');
 assert.throws(()=>E.Sanma.options({customRuleName:'a'.repeat(41)}));
});
test('combined records filter by both connection and named rule, and count the actual online seat',()=>{
 const ruleMeta={version:1,game:'four',type:'custom',name:'A'},data={
 'jewel-offline-results-v1':JSON.stringify({games:[{id:'solo',ruleMeta,results:[row(0,1,20,5)]}],totals:{}}),
 'houseki-online-results-v1':JSON.stringify([{matchId:'online',self:2,ruleMeta,rows:[row(0,1,100,100),row(2,3,-5,-7)]},{matchId:'normal',self:1,ruleMeta:{version:1,game:'four',type:'normal'},rows:[row(1,2,5,2)]}])
 };
 const g=D.load(storage(data)).games.four;assert.equal(g.length,3);
 const total=D.totals(g,4);assert.deepEqual(total,{games:3,rankChips:20,bonusChips:0,placements:[1,1,1,0],score:0,pointGames:0});
 const named=D.filter(g,{rule:'custom:A'});assert.equal(named.length,2);
 assert.deepEqual(D.totals(D.filter(g,{rule:'custom:A',connection:'online'}),4),{games:1,rankChips:-5,bonusChips:-7,placements:[0,0,1,0],score:0,pointGames:0});
 assert.equal(D.filter(g,{connection:'solo'}).length,1);
});
test('old records recover only from available settings or replay, never from payouts',()=>{
 const data={'jewel-offline-results-v1':JSON.stringify({games:[{id:'recover',results:[row(0,1,50,0)]},{id:'unknown',results:[row(0,1,50,0)]}],totals:{}})};
 const g=D.load(storage(data),id=>id==='recover'?{rules:{settings:{nekkyou:true}}}:null).games.four;
 assert.deepEqual(g.map(g=>g.ruleMeta.type),['hard','unknown']);assert.equal(D.totals(g,4).games,2);
 assert.equal(D.filter(g,{rule:'normal'}).length,0);assert.equal(D.filter(g,{rule:'unknown'}).length,1);
});
test('online sanma is included, Chinchiro excluded, duplicates counted once, corrupt sources untouched',()=>{
 const meta={version:1,game:'sanma',type:'jewel'},game={id:'same',kind:'sanma',self:1,ruleMeta:meta,results:[row(0,1,20,100),row(1,2,0,-4)]};
 const data={'houseki-table-results-v1':JSON.stringify([game,game,{id:'dice',kind:'chinchiro',results:[1,2,3]}]),'houseki-sanma-results-v1':'broken'},before=JSON.stringify(data);
 const r=D.load(storage(data));assert.equal(r.games.sanma.length,1);assert.equal(r.errors.sanma.length,1);
 assert.equal(D.totals(r.games.sanma,3).bonusChips,-4);assert.equal(JSON.stringify(data),before);
});
test('sanma result persistence records the named rule without mutating the live options',()=>{
 const data={},game={id:'s',results:[row(0,1,20,3)],options:E.Sanma.options({customRuleName:'週末卓'})};
 E.Sanma.saveResult(storage(data),game);const saved=JSON.parse(data['houseki-sanma-results-v1']).games[0];
 assert.equal(saved.ruleMeta.name,'週末卓');assert.equal(saved.options.customRuleName,'週末卓');
});
