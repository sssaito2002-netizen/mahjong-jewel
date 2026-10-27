'use strict';
// Web Crypto is available in modern Node and in HTTPS browser contexts.
module.exports={randomUUID:()=>globalThis.crypto.randomUUID(),randomBytes:n=>{const bytes=globalThis.crypto.getRandomValues(new Uint8Array(n));return {toString:format=>{if(format!=='hex')throw Error('Unsupported encoding');return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}};}};
