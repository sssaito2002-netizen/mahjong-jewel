'use strict';
// Ask every eligible winner first. Calls are offered only if everyone declines.
module.exports = class ReactionGate {
 constructor(size=4){this.size=size;this.entries=[];}
 collect(options,present,finish){
  const entry={options,present,finish};this.entries.push(entry);
  if(this.entries.length!==this.size)return;
  const winners=this.entries.filter(e=>e.options.some(a=>a.reply.hule));
  const calls=()=>{for(const e of this.entries){const options=e.options.filter(a=>!a.reply.hule);if(options.length)e.present(options,e.finish);else e.finish({});}};
  if(!winners.length)return calls();
  let left=winners.length;
  for(const e of winners){let answered=false;e.present(e.options.filter(a=>a.reply.hule||!Object.keys(a.reply).length),reply=>{
   if(answered)return;answered=true;e.answer=reply||{};
   if(--left)return;
   if(winners.some(w=>w.answer.hule)){for(const item of this.entries)item.finish(item.answer?.hule?item.answer:{});}
   else calls();
  });}
 }
};
