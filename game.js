const crypto = require('node:crypto');
const SUITS = ['m', 'p', 's'];
const HONORS = ['E','S','W','N','P','F','C'];
const DEFAULT_JEWELS = [
  { id: 'lapis', base: '5m', name: 'ラピスラズリ', short: '💎萬' },
  { id: 'amethyst', base: '5p', name: 'アメジスト', short: '💜筒' },
  { id: 'tourmaline', base: '5s', name: 'トルマリン', short: '💚索' },
  { id: 'amethyst-pocchi', base: 'P', name: 'アメジスト白ポッチ', short: '✨白' },
];
function createWall(jewels=DEFAULT_JEWELS) {
  const wall = [];
  for (const suit of SUITS) for (let n=1;n<=9;n++) for (let k=0;k<4;k++) wall.push({id:`${suit}${n}-${k}`, base:`${n}${suit}`, jewel:null});
  for (const h of HONORS) for (let k=0;k<4;k++) wall.push({id:`${h}-${k}`, base:h, jewel:null});
  for (const config of jewels) {
    const tile=wall.find(x=>x.base===config.base && x.jewel===null);
    if (!tile) throw new Error('Invalid jewel configuration');
    tile.jewel={id:config.id, name:config.name, short:config.short};
  }
  return wall;
}
function shuffle(wall) {
  for(let i=wall.length-1;i>0;i--) {
    const j=crypto.randomInt(i+1);
    [wall[i],wall[j]]=[wall[j],wall[i]];
  }
  return wall;
}
function createGame(playerIds) {
  if(playerIds.length!==4 || new Set(playerIds).size!==4) throw new Error('Four unique players required');
  const wall=shuffle(createWall());
  const hands=Object.fromEntries(playerIds.map(id=>[id,[]]));
  for(let i=0;i<13;i++) for(const id of playerIds) hands[id].push(wall.pop());
  hands[playerIds[0]].push(wall.pop());
  return {phase:'playing', players:[...playerIds], wall, hands, discards:Object.fromEntries(playerIds.map(id=>[id,[]])), turn:0, round:1, actionCount:0, lastDiscard:null, status:'東1局・配牌完了', jewelConfig:DEFAULT_JEWELS};
}
function discard(game, playerId, tileId) {
  if(game.phase!=='playing') throw new Error('対局は進行中ではありません');
  if(game.players[game.turn]!==playerId) throw new Error('あなたの番ではありません');
  const hand=game.hands[playerId];
  const idx=hand.findIndex(t=>t.id===tileId);
  if(idx===-1) throw new Error('その牌を持っていません');
  const [tile]=hand.splice(idx,1);
  game.discards[playerId].push(tile);
  game.lastDiscard={playerId,tile};
  game.actionCount++;
  if(game.wall.length<=14) {
    game.phase='finished';
    game.status='流局（試作品：テンパイ・ノーテン判定なし）';
    return game;
  }
  game.turn=(game.turn+1)%4;
  game.hands[game.players[game.turn]].push(game.wall.pop());
  game.status='進行中';
  return game;
}
function playerView(game, playerId) {
  return {
    phase:game.phase, players:game.players, turnPlayerId:game.players[game.turn],
    yourHand:game.hands[playerId]||[],
    handCounts:Object.fromEntries(game.players.map(id=>[id,game.hands[id].length])),
    discards:game.discards, wallRemaining:Math.max(0,game.wall.length-14),
    status:game.status, actionCount:game.actionCount,
    jewelConfig:game.jewelConfig, lastDiscard:game.lastDiscard
  };
}
module.exports={createWall,shuffle,createGame,discard,playerView,DEFAULT_JEWELS};
