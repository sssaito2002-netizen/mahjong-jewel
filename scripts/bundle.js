'use strict';
// Bundle local CommonJS modules without a network dependency; circular imports supported.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),modules={};
function visit(file){let id=path.relative(root,file).replaceAll('\\','/');if(modules[id])return id;
 let src=fs.readFileSync(file,'utf8');modules[id]='';
 src=src.replace(/require\(['"]([^'"]+)['"]\)/g,(_,name)=>{if(!name.startsWith('.'))throw Error('External dependency '+name);let dep=path.resolve(path.dirname(file),name);if(fs.existsSync(dep)&&fs.statSync(dep).isDirectory())dep+='/index.js';else if(!dep.endsWith('.js'))dep+='.js';return 'require('+JSON.stringify(visit(dep))+')';});
 modules[id]=src;return id;}
const entry=visit(path.join(root,'offline/engine.js'));
const roomsEntry=visit(path.join(root,'online/rooms.js'));
fs.mkdirSync(path.join(root,'public/offline'),{recursive:true});
fs.writeFileSync(path.join(root,'public/offline/engine.bundle.js'),`/* Includes majiang-core, MIT. See THIRD_PARTY_NOTICES.md */\n(function(){const modules={${Object.entries(modules).map(([id,src])=>JSON.stringify(id)+':function(module,exports,require){\n'+src+'\n}').join(',\n')}};const cache={};function require(id){if(cache[id])return cache[id].exports;const m=cache[id]={exports:{}};modules[id](m,m.exports,require);return m.exports;}globalThis.JewelOffline=require(${JSON.stringify(entry)});globalThis.JewelRooms=require(${JSON.stringify(roomsEntry)});})();\n`);

require('./build-pwa');
