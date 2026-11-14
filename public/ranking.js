(function(root){
  'use strict';
  const PAYOUT=[50,25,-25,-50];
  function settleRound(players){
    if(!Array.isArray(players)||players.length!==4)throw Error('4人分の対局結果が必要です');
    if(new Set(players.map(x=>x.id)).size!==4)throw Error('プレイヤーIDが重複しています');
    players.forEach(p=>{if(!Number.isFinite(p.points)||!Number.isFinite(p.bonusChips||0))throw Error('点数・祝儀は数値で入力してください')});
    const order=[...players].sort((a,b)=>b.points-a.points||(a.seatOrder??99)-(b.seatOrder??99));
    return order.map((p,i)=>({id:p.id,name:p.name,rank:i+1,points:p.points,rankChips:PAYOUT[i],bonusChips:p.bonusChips||0,roundChips:PAYOUT[i]+(p.bonusChips||0)}));
  }
  function updateTotals(previous,results){
    const next={...previous};
    for(const r of results)next[r.id]=(next[r.id]||0)+r.roundChips;
    return next;
  }
  root.JewelRanking={PAYOUT,settleRound,updateTotals};
})(typeof window==='undefined'?globalThis:window);
