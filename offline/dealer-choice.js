'use strict';
// Only settled/provisional public scores and the round number affect this decision.
module.exports=function shouldPassDealer(points,self,round){const others=points.filter((_,id)=>id!==self),lead=points[self]-Math.max(...others);return lead>0&&(round>=points.length-2||lead>=12000);};
