const $=id=>document.getElementById(id);
let socket=null, current=null, savedToken=null;
const params=new URLSearchParams(location.search);
if(params.get('room'))$('room').value=params.get('room').toUpperCase();
$('name').value=localStorage.getItem('jewelName')||'プレイヤー';
function toast(msg){$('toast').textContent=msg;$('toast').style.display='block';setTimeout(()=>$('toast').style.display='none',3200);}
function elt(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
function tileLabel(base){if(base.length===2)return ({m:'萬',p:'筒',s:'索'})[base[1]]+base[0];return ({E:'東',S:'南',W:'西',N:'北',P:'白',F:'發',C:'中'})[base]||base;}
function tileNode(tile,klass=''){const d=elt('span','tile '+klass+(tile.jewel?' jewel':''));d.append(elt('span','',tileLabel(tile.base)));if(tile.jewel)d.append(elt('small','',tile.jewel.short));d.title=tile.jewel?tile.jewel.name:tileLabel(tile.base);return d;}
function render(data){current=data;$('joinScreen').hidden=true;$('gameScreen').hidden=false;$('roomCode').textContent=data.lobby.room;
const members=data.lobby.members;$('memberCount').textContent=members.length+' / 4';$('members').replaceChildren();
for(const p of members){const e=elt('div','member');e.append(elt('span','',p.name+(p.id===data.selfId?'（自分）':'')));e.append(elt('i','',p.connected?'● 接続中':'○ 切断中'));$('members').append(e);}
$('startBtn').hidden=data.lobby.host!==data.selfId || data.game?.phase==='playing';$('startBtn').disabled=members.length!==4||members.some(p=>!p.connected);
$('waiting').textContent=data.game?'ゲーム開始済み':'4人そろったらホストが開始できます';
const game=data.game;if(!game){$('gameStatus').textContent='待機中';return;}
$('gameStatus').textContent=game.status;$('wallCount').textContent='山の残り '+game.wallRemaining+' 枚';
$('opponents').replaceChildren();for(const p of members.filter(p=>p.id!==data.selfId)){const el=elt('div','opp'+(game.turnPlayerId===p.id?' active':''));el.append(elt('strong','',p.name));el.append(elt('span','',game.handCounts[p.id]+'枚 🀫'));$('opponents').append(el);}
$('turnStatus').textContent=game.phase==='finished'?'流局':game.turnPlayerId===data.selfId?'あなたの打牌番':'相手の打牌を待っています';
$('river').replaceChildren();for(const p of members){const pile=elt('div','discardGroup');for(const t of game.discards[p.id])pile.append(tileNode(t,'discard'));if(pile.childNodes.length)$('river').append(pile);}
const myTurn=game.phase==='playing'&&game.turnPlayerId===data.selfId;$('hand').replaceChildren();
const sorted=[...game.yourHand].sort((a,b)=>((a.base[1]||'z').localeCompare(b.base[1]||'z'))||a.base.localeCompare(b.base));
for(const t of sorted){const b=elt('button');b.type='button';b.disabled=!myTurn;b.title=(t.jewel?t.jewel.name+' / ':'')+'牌を捨てる';b.append(tileNode(t));b.onclick=()=>{if(myTurn&&confirm('「'+tileLabel(t.base)+'」を打牌しますか？'))send({type:'discard',tileId:t.id});};$('hand').append(b);}
$('handCount').textContent=game.yourHand.length+'枚';renderCalculation();$('hint').textContent=game.phase==='finished'?'試作局が終了しました。ホストは「開始」で新しい局を配れます。':myTurn?'捨てたい牌をタップしてください（試作：ツモは自動）。':'相手の手番です。手牌は他のプレイヤーには公開されません。';
}
function send(m){if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(m));else toast('接続が切れています');}
function connect(){
 const name=$('name').value.trim().slice(0,16)||'プレイヤー';const room=$('room').value.trim().toUpperCase();localStorage.setItem('jewelName',name);
 const protocol=location.protocol==='https:'?'wss':'ws';socket=new WebSocket(protocol+'://'+location.host);
 $('joinBtn').disabled=true;$('connection').textContent='接続中';
 socket.onopen=()=>{send({type:'join',name,room,token:room?localStorage.getItem('jewel-token-'+room):''});$('connection').textContent='● オンライン';};
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='error'){toast(m.message);$('joinBtn').disabled=false;}if(m.type==='joined'){localStorage.setItem('jewel-token-'+m.room,m.token);savedToken=m.token;history.replaceState(null,'','?room='+m.room);$('room').value=m.room;}if(m.type==='state')render(m);};
 socket.onclose=()=>{$('connection').textContent='○ 切断';$('joinBtn').disabled=false;toast('接続が切れました。再接続してください');};
 socket.onerror=()=>toast('通信エラー');
}
$('joinBtn').onclick=connect;$('startBtn').onclick=()=>send({type:'start'});
$('copyBtn').onclick=async()=>{const u=location.origin+'/?room='+current.lobby.room;try{await navigator.clipboard.writeText(u);toast('招待URLをコピーしました');}catch{prompt('招待URL',u);}};

function renderCalculation(){
 const g=current?.game;if(!g)return;const hand=g.yourHand;const result=JewelCalculator.analyzeHand(hand);
 $('shapeResult').textContent=result.complete?'現在の和了形：'+result.shape:hand.length%3===2?'現在は和了形ではありません':'打牌後の13枚（和了判定は14枚のとき）';
 const baseHan=Number($('baseHan').value),baseChips=Number($('baseChips').value);
 try {const c=JewelCalculator.previewJewel({tiles:hand,baseHan,baseChips});$('jewelResult').textContent=`仮の合計：${c.han}翻 / 祝儀 ${c.totalChips}枚。${c.effects.join('、')||'特殊牌効果なし'}。※非公式参考値`; }catch(e){$('jewelResult').textContent=e.message;}
}
$('baseHan').addEventListener('input',renderCalculation);$('baseChips').addEventListener('input',renderCalculation);


// v0.3: offline, browser-local score ledger (not a server-authoritative match result).
(function(){
 const rows=[];
 for(let i=0;i<4;i++){
  const line=elt('div','rankInputRow');
  line.innerHTML=`<label>席${i+1} 名前<input class="rankName" value="${i===0?'自分':'CPU'+i}" maxlength="16"></label><label>持ち点<input class="rankPoints" type="number" value="25000" inputmode="numeric"></label><label>祝儀収支<input class="rankBonus" type="number" value="0" inputmode="numeric"></label>`;
  $('rankingInputs').append(line);rows.push(line);
 }
 const key='jewel-ranking-v03';
 function totals(){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}}
 $('rankSettleBtn').onclick=()=>{
  try{
   const p=rows.map((r,i)=>({id:r.querySelector('.rankName').value.trim()||'席'+(i+1),name:r.querySelector('.rankName').value.trim()||'席'+(i+1),seatOrder:i,points:Number(r.querySelector('.rankPoints').value),bonusChips:Number(r.querySelector('.rankBonus').value)}));
   const result=JewelRanking.settleRound(p),updated=JewelRanking.updateTotals(totals(),result);
   localStorage.setItem(key,JSON.stringify(updated));
   $('rankingResult').textContent=result.map(x=>`${x.rank}着 ${x.name}：順位 ${x.rankChips>0?'+':''}${x.rankChips}枚、祝儀 ${x.bonusChips>0?'+':''}${x.bonusChips}枚、今回 ${x.roundChips>0?'+':''}${x.roundChips}枚、累積 ${updated[x.id]>0?'+':''}${updated[x.id]}枚`).join(' ／ ');
  }catch(e){$('rankingResult').textContent='計算できません：'+e.message;}
 };
 $('rankResetBtn').onclick=()=>{if(confirm('累積チップを削除しますか？')){localStorage.removeItem(key);$('rankingResult').textContent='累積チップをリセットしました。';}};
})();
