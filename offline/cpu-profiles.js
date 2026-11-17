'use strict';
const learned=require('./cpu-weights');
const BASE={wait:6,gem:1,ready:10,readyCap:180,defense:500,defenseReady:100,riichi:28,chipValue:250,callCost:80,placement:0};
const CANDIDATES={
 balanced:{wait:8,gem:1.1,ready:12,readyCap:220,defense:350,defenseReady:70,riichi:35,chipValue:500,callCost:65,placement:.2},
 fast:{wait:12,gem:.8,ready:9,readyCap:180,defense:220,defenseReady:45,riichi:42,chipValue:400,callCost:45,placement:.1},
 chip:{wait:8,gem:1.6,ready:14,readyCap:260,defense:300,defenseReady:60,riichi:40,chipValue:1000,callCost:45,placement:.2},
 safe:{wait:9,gem:1.1,ready:12,readyCap:220,defense:450,defenseReady:95,riichi:30,chipValue:650,callCost:70,placement:.35},
 push:{wait:10,gem:1.2,ready:12,readyCap:230,defense:120,defenseReady:25,riichi:48,chipValue:750,callCost:35,placement:.1},
 speed:{wait:16,gem:.7,ready:8,readyCap:160,defense:180,defenseReady:40,riichi:50,chipValue:500,callCost:25,placement:.15}
};
function validate(level){if(!['beginner','standard','expert'].includes(level))throw Error('CPUの強さが不正です');return level;}
function profile(level='standard',mode='four-standard'){
 validate(level);
 if(level==='beginner')return {...BASE,beginner:true,wait:3,gem:.15,ready:0,defense:300,defenseReady:80,riichi:12,callCost:140};
 if(level==='standard')return {...BASE};
 const name=learned.selected?.[mode]||'balanced';return {...BASE,...CANDIDATES[name],...(learned.nextPolicy?.[mode]||{})};
}
module.exports={BASE,CANDIDATES,validate,profile,metadata:learned};
