'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../offline/engine'),{M,J}=E;
const score=(hand,ron,extra={})=>M.Util.hule(M.Shoupai.fromString(hand),ron,M.Util.hule_param({rule:E.rule({gemSelection:[]}),menfeng:1,...extra}));
test('each honba adds 1500 on ron or 500 from each tsumo payer, with deposits unchanged',()=>{
 for(const dealer of [false,true])for(const ron of [null,'z5+']){
  const text=ron?'m123p456s789z1155':'m123p456s789z11555',opts={menfeng:dealer?0:1,lizhibang:2};
  const zero=score(text,ron,opts),one=score(text,ron,{...opts,changbang:1}),two=score(text,ron,{...opts,changbang:2});
  const winner=opts.menfeng;assert.equal(one.defen,zero.defen);assert.equal(one.fenpei[winner]-zero.fenpei[winner],1500);assert.equal(two.fenpei[winner]-zero.fenpei[winner],3000);
  for(let seat=0;seat<4;seat++)if(seat!==winner)assert.equal(one.fenpei[seat]-zero.fenpei[seat],ron?(seat===(winner+1)%4?-1500:0):-500);
 }
});
test('east and west are both round-wind yaku, west also stacks with seat wind',()=>{
 for(const wind of [1,3]){const result=score('m123p456s789z44,z'+wind+wind+wind+'+',null);assert.ok(result.hupai.some(y=>y.name==='場風 '+(wind===1?'東':'西')));}
 const result=score('m123p456s789z44,z333+',null,{menfeng:2});assert.ok(result.hupai.some(y=>y.name==='場風 西'));assert.ok(result.hupai.some(y=>y.name==='自風 西'));
 const noYaku=score('m123p456s789z44,z222+',null,{menfeng:1});assert.ok(noYaku.hupai.some(y=>y.name==='自風 南'));
});
test('west pair gains value-pair fu and cannot produce pinfu',()=>{
 const west=score('m123456p456s78z33', 's9+', {lizhi:1}),north=score('m123456p456s78z44','s9+',{lizhi:1});
 assert.ok(!west.hupai.some(y=>y.name==='平和'));assert.ok(north.hupai.some(y=>y.name==='平和'));assert.equal(west.fu,40);assert.equal(north.fu,30);
});
test('breakdown exactly accounts for additives, amethyst multiplication and negative carnelian',()=>{
 const rule=E.rule({gemSelection:['gold','amethyst-p']});const h={shoupai:'m123p0A5s789z11555',fanshu:6,baojia:null,hupai:[{name:'一発',fanshu:1},{name:'裏ドラ',fanshu:2},{name:'翻牌 白',fanshu:1}]};
 const b=J.bonusBreakdown(h,25000,'翻牌 白',rule);assert.equal(b.subtotal,13);assert.equal(b.multiplier,2);assert.equal(b.perPayer,26);assert.equal(b.lines.reduce((n,l)=>n+l.amount,0)*b.multiplier,J.bonus(h,25000,'翻牌 白',rule));
 const negative=J.bonusBreakdown({shoupai:'m123p406s789z11555',hupai:[],carnelianChoice:'han'},25000,null,E.rule({gemSelection:['carnelian']}));assert.equal(negative.perPayer,-1);
});
test('riichi popup defers a discard response once for a CPU declaration',()=>{
 const p=new E.Player((o,reply)=>reply({}));p.action({kaiju:{id:0,rule:E.rule(),title:'test',player:['a','b','c','d'],qijia:0}},()=>{});
 p.action({qipai:{zhuangfeng:0,jushu:0,changbang:0,lizhibang:0,defen:[25000,25000,25000,25000],baopai:'m8',shoupai:['m123p456s789z1155','','','']}},()=>{});
 let ack,replies=0;p.confirmRiichi=(d,done)=>{assert.equal(d.l,1);ack=done;};p.action({dapai:{l:1,p:'m9*'}},()=>replies++);assert.equal(replies,0);ack();ack();assert.equal(replies,1);
});
