'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),E=require('../offline/engine'),S=E.Sanma,C=S.Custom,T=C.Tiles;
const config=(changes)=>C.validate({...C.defaults(),tileRules:T.tileRules().map(r=>({...r,...changes[r.tile]}))});
test('colored threes/sevens preserve logical limits, physical serialization, discards and calls',()=>{
 const h=new E.M.Shoupai(['pD','pE','p3','p3','sF','sG','s7']);a.equal(h._bingpai.p[3],4);a.throws(()=>h.clone().zimo('p3'));a.equal(E.M.Shoupai.fromString(h.toString()).toString(),h.toString());a.equal(E.M.Shoupai.normal_pai('pD'),'p3');a.equal(E.M.Shoupai.valid_pai('zD'),undefined);
 const ready=new E.M.Shoupai(['pD','pE','p1','p2','p4','p5','s1','s2','s3','s4','s5','s6','z1']);const calls=ready.get_peng_mianzi('p3+');a(calls.includes('pDE3+'));ready.fulou('pDE3+');a.equal(ready._bingpai.p[3],0);a.equal(ready._fulou[0],'pDE3+');
 const drawn=new E.M.Shoupai(['pD','pE','p3']).zimo('p3');a(drawn.get_dapai().includes('pD'));drawn.dapai('pD');a.equal(drawn._bingpai.p[3],3);a.equal(drawn._bingpai.p[13],0);
});
test('custom manzu/north wall inclusion, legal waits and automatic extraction follow saved settings',()=>{
 const c=config({m5:{included:true,hand:false,extract:true,nukiDora:true},z4:{included:false}}),o=S.options({customSanma:c}),wall=S.makeWall(o);a.equal(wall.length,108);a.equal(wall.filter(t=>t==='m5').length,4);a(!wall.includes('z4'));
 const g=new S.Game({customSanma:c});g.wall=['p2','m5'];const old=g.extractedTiles[0].length;a.equal(g.take(0),'p2');a.equal(g.extractedTiles[0].length,old+1);a.equal(g.extractedTiles[0].at(-1),'m5');
 const playable=config({m5:{included:true,hand:true,extract:true,handDora:true}}),x=new S.Game({customSanma:playable});const h=E.M.Shoupai.fromString('p123s123z111m555z2');a(x.waits(h).includes('z2'));const r=S.score({hand:h.clone().zimo('z2'),seat:1,rule:S.rule({},playable),customSanma:playable});a(r.yaku.some(y=>y.name==='設定ドラ'&&y.fanshu===3));a.equal(S.score({hand:h.clone().zimo('z2'),seat:1,rule:S.rule({},c),customSanma:c}),null);
});
test('optional extraction uses the actual tile, replacement draw, bonus and public snapshot',()=>{
 const c=config({m5:{included:true,hand:true,extract:true,nukiDora:false}}),g=new S.Game({customSanma:c});g.turn=0;g.phase='turn';g.hands[0]=E.M.Shoupai.fromString('p123456s123z1112m5');g.wall=['p9','p8'];const n=g.extractedTiles[0].length;const action=g.actions().find(a=>a.reply.nuki==='m5');a(action);g.act(action.reply);a.equal(g.extractedTiles[0].length,n+1);a.equal(g.hands[0]._zimo,'p8');a.equal(g.north[0],0);a(E.Replay.sanmaView(g).extractedTiles[0].includes('m5'));
});
test('Jewels in point sanma retain physical identities, pearl han, amethyst multiplier and wildcard',()=>{
 const c=C.validate({...C.defaults(),gemSelection:['pearl','amethyst-p','topaz'],tileChips:[{tile:'z5',chips:2}]}),rule=S.rule({},c),o=S.options({customSanma:c});a.equal(S.makeWall(o).filter(t=>t==='p0').length,1);a.equal(rule.gemTiles.p0.effect,'pearl');
 const hand=E.M.Shoupai.fromString('p1230A5s123z11122*');const r=S.score({hand,seat:1,rule,customSanma:c});a(r);a(r.han>=8);a.equal(r.chipMultiplier,2);a(r.lines.some(l=>l.label==='パール'));
 const ready=E.M.Shoupai.fromString('p123456s123z1112*'),draw=ready.clone().zimo('z0');const win=S.score({hand:draw,seat:1,rule,customSanma:c});a(win?.white);a.equal(win.pocchiAs,'z2');a(win.lines.some(l=>l.tile==='z5'&&l.amount===2));
});
test('turquoise allows open riichi only while retained, and hard Jewels inherit through indicators',()=>{
 const c=C.validate({...C.defaults(),gemSelection:['turquoise']}),g=new S.Game({customSanma:c});g.turn=0;g.phase='turn';g.hands[0]=E.M.Shoupai.fromString('s123p055s789z33,p123-');const choices=g.actions().filter(x=>x.reply.riichi);a(choices.some(x=>x.reply.discard==='p5'));a(!choices.some(x=>x.reply.discard==='p0'));
 const hard=C.validate({...C.defaults(),gemSelection:['amethyst-p'],gemMode:'hard'}),hand=E.M.Shoupai.fromString('p123555s123z11122'),r=S.score({hand,seat:1,rule:S.rule({},hard),customSanma:hard,indicators:['p0']});a(r);a.equal(r.chipMultiplier,4);a.equal(r.lines.filter(l=>l.label==='アメジスト').length,3);
});
test('selected sanma Jewels can complete full Jewel and carnelian retains both win choices',()=>{
 const c=C.validate({...C.defaults(),gemSelection:['pearl','topaz','gold-pocchi']}),hand=E.M.Shoupai.fromString('p123406s123z0511z8'),r=S.score({hand,seat:1,rule:S.rule({},c),customSanma:c});a(r?.white);a(r.yaku.some(y=>y.name==='フルジュエル'));
 const car=C.validate({...C.defaults(),gemSelection:['carnelian']}),g=new S.Game({customSanma:car});g.turn=0;g.phase='turn';g.hands[0]=E.M.Shoupai.fromString('p123406s123z11122');const wins=g.actions().filter(x=>x.reply.win);a.deepEqual(wins.map(x=>x.reply.jewelChoice),['chips','han']);
});
