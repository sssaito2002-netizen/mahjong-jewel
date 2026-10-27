// Minimal dependency-free WebSocket server for this prototype. Supports masked
// client text frames, close, ping/pong, and buffered TCP frames. Not a full RFC6455 implementation.
const crypto=require('node:crypto');
const EventEmitter=require('node:events');
class Peer extends EventEmitter {
  constructor(socket){super();this.socket=socket;this.readyState=1;this.buffer=Buffer.alloc(0);
    socket.on('data',chunk=>this.onData(chunk));socket.on('close',()=>this.closeInternal());socket.on('error',()=>this.closeInternal());}
  onData(chunk){this.buffer=Buffer.concat([this.buffer,chunk]);
    while(this.buffer.length>=2){const first=this.buffer[0],second=this.buffer[1];const opcode=first&15;const fin=!!(first&128);let len=second&127,header=2;
      if(len===126){if(this.buffer.length<4)return;len=this.buffer.readUInt16BE(2);header=4;}
      else if(len===127){if(this.buffer.length<10)return;const n=this.buffer.readBigUInt64BE(2);if(n>4096n){this.close();return;}len=Number(n);header=10;}
      if(!(second&128)||len>4096){this.close();return;}if(this.buffer.length<header+4+len)return;
      const mask=this.buffer.subarray(header,header+4);const payload=Buffer.from(this.buffer.subarray(header+4,header+4+len));this.buffer=this.buffer.subarray(header+4+len);
      for(let i=0;i<payload.length;i++)payload[i]^=mask[i%4];
      if(opcode===8){this.close();return;}if(opcode===9){this.frame(10,payload);continue;}if(opcode===10)continue;
      if(opcode!==1||!fin){this.close();return;}this.emit('message',payload.toString('utf8'));
    }
  }
  frame(opcode,content){if(this.readyState!==1)return;const data=Buffer.from(content);let hdr;
    if(data.length<126){hdr=Buffer.from([0x80|opcode,data.length]);}
    else if(data.length<65536){hdr=Buffer.alloc(4);hdr[0]=0x80|opcode;hdr[1]=126;hdr.writeUInt16BE(data.length,2);}
    else {hdr=Buffer.alloc(10);hdr[0]=0x80|opcode;hdr[1]=127;hdr.writeBigUInt64BE(BigInt(data.length),2);}
    try{this.socket.write(Buffer.concat([hdr,data]));}catch{this.closeInternal();}
  }
  send(data){this.frame(1,String(data));}
  close(){if(this.readyState===1){this.frame(8,'');this.socket.end();}this.closeInternal();}
  closeInternal(){if(this.readyState!==1)return;this.readyState=3;this.emit('close');}
}
class Server extends EventEmitter{
  constructor({server}){super();server.on('upgrade',(req,socket)=>{
    if(req.headers.upgrade?.toLowerCase()!=='websocket'||!/^13$/.test(req.headers['sec-websocket-version']||'')||!req.headers['sec-websocket-key']){socket.destroy();return;}
    const accept=crypto.createHash('sha1').update(req.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
    this.emit('connection',new Peer(socket));
  });}
}
module.exports={Server,OPEN:1};
