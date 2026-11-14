const test=require('node:test');const assert=require('node:assert/strict');const {analyzeHand,previewJewel}=require('../public/calculator');
test('標準4面子1雀頭',()=>assert.equal(analyzeHand(['1m','2m','3m','4m','5m','6m','7p','8p','9p','E','E','E','P','P']).shape,'標準形'));
test('七対子',()=>assert.equal(analyzeHand(['1m','1m','2m','2m','3m','3m','4m','4m','5m','5m','6m','6m','E','E']).shape,'七対子'));
test('国士無双',()=>assert.equal(analyzeHand(['1m','9m','1p','9p','1s','9s','E','S','W','N','P','F','C','C']).shape,'国士無双'));
test('未完成形',()=>assert.equal(analyzeHand(['1m','1m','1m','2m','2m','2m','3m','3m','3m','4m','4m','5m','6m','8m']).complete,false));
test('アメジスト+ラピスの参考計算',()=>{const r=previewJewel({tiles:[{base:'5m',jewel:{id:'lapis'}},{base:'5p',jewel:{id:'amethyst'}}],baseHan:2,baseChips:1});assert.equal(r.han,6);assert.equal(r.totalChips,16);});
test('端末側の算出は入力を変更しない',()=>{const x=[{base:'5s',jewel:{id:'tourmaline'}}];const before=JSON.stringify(x);previewJewel({tiles:x,points:28900});assert.equal(JSON.stringify(x),before);});
