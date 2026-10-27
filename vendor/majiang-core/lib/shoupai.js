/*
 *  Majiang.Shoupai
 */
"use strict";

module.exports = class Shoupai {

    static normal_pai(p) {
        return p[0] === 'z' ? p.replace(/[089A-C]/g, n=>({0:'5',8:'6',9:'4',A:'5',B:'5',C:'5'}[n])) : p.replace(/[0A]/g,'5');
    }

    static valid_pai(p) {
        if (p.match(/^(?:[mps][0-9A]|z[0-9A-C])_?\*?[\+\=\-]?$/)) return p;
    }

    static valid_mianzi(m) {

        if (m[0] === 'z') {
            const h = Shoupai.normal_pai(m);
            if (/^z([1-7])\1\1[+=-]\1?$/.test(h) || /^z([1-7])\1\1\1[+=-]?$/.test(h)) return m;
            return;
        }
        let h = m.replace(/0/g,'5');
        if (h.match(/^[mpsz]([0-9A-C])\1\1[\+\=\-]\1?$/)) {
            return m.replace(/([mpsz])05/,'$1'+'50');
        }
        else if (h.match(/^[mpsz]([0-9A-C])\1\1\1[\+\=\-]?$/)) {
            return m[0]+m.match(/[0-9A-C](?![\+\=\-])/g).sort().reverse().join('')
                       +(m.match(/[0-9A-C][\+\=\-]$/)||[''])[0];
        }
        else if (h.match(/^[mps][0-9A-C]+\-[0-9A-C]*$/)) {
            let hongpai = m.match(/0/);
            let nn = h.match(/[0-9A-C]/g).sort();
            if (nn.length != 3)                               return;
            if (+nn[0] + 1 != +nn[1] || +nn[1] + 1 != +nn[2]) return;
            h = h[0]+h.match(/[0-9A-C][\+\=\-]?/g).sort().join('');
            return hongpai ? h.replace(/5/,'0') : h;
        }
    }

    constructor(qipai = []) {

        this._bingpai = {
            _:  0,
            m: [0,0,0,0,0,0,0,0,0,0,0],
            p: [0,0,0,0,0,0,0,0,0,0,0],
            s: [0,0,0,0,0,0,0,0,0,0,0],
            z: [0,0,0,0,0,0,0,0,0,0,0,0,0],
        };
        this._fulou = [];
        this._zimo  = null;
        this._lizhi = false;

        for (let p of qipai) {
            if (p == '_') {
                this._bingpai._++;
                continue;
            }
            if (! (p = Shoupai.valid_pai(p)))       throw new Error(p);
            let s = p[0], n = ({A:10,B:11,C:12}[p[1]]??+p[1]);
            const base = +Shoupai.normal_pai(s+(({10:'A',11:'B',12:'C'}[n]??n)))[1];
            if (this._bingpai[s][base] >= 4) throw new Error([this,p]);
            this._bingpai[s][n]++;
            if (base !== n) this._bingpai[s][base]++;
        }
    }

    static fromString(paistr = '') {

        let fulou   = paistr.split(',');
        let bingpai = fulou.shift();

        let qipai = bingpai.match(/^_*/)[0].match(/_/g) || [];
        for (let suitstr of bingpai.match(/[mpsz][0-9A-C]+_*/g) || []) {
            let s = suitstr[0];
            for (let n of suitstr.match(/[0-9A-C]/g)) {
                if (s == 'z' && (n < 0 || 9 < n)) continue;
                qipai.push(s+n);
            }
            qipai = qipai.concat(suitstr.match(/_/g)||[]);
        }
        qipai = qipai.slice(0, 14 - fulou.filter(x=>x).length * 3);
        let zimo = qipai.length + fulou.length * 3 == 14 && qipai.slice(-1)[0];
        const shoupai = new Shoupai(qipai);

        let last;
        for (let m of fulou) {
            if (! m) { shoupai._zimo = last; break }
            m = Shoupai.valid_mianzi(m);
            if (m) {
                shoupai._fulou.push(m);
                last = m;
            }
        }

        shoupai._zimo  = shoupai._zimo || zimo || null;
        shoupai._lizhi = bingpai.slice(-1) == '*';

        return shoupai;
    }

    toString() {

        let paistr = '';

        for (let s of ['m','p','s','z']) {
            let suitstr = s;
            let bingpai = this._bingpai[s];
            for (let n=1;n<=(s==='z'?7:9);n++) {
                const markers = s==='z'?({4:[9],5:[0,10,11,12],6:[8]}[n]||[]):n===5?[0,10]:[];
                let total=bingpai[n], special=0;
                for(const marker of markers){const ch=({10:'A',11:'B',12:'C'}[marker]??String(marker));let count=bingpai[marker]||0;if(this._zimo===s+ch){total--;count--;}special+=count;suitstr+=ch.repeat(Math.max(0,count));}
                if(this._zimo===s+n)total--;
                suitstr+=String(n).repeat(Math.max(0,total-special));
            }
            if (suitstr.length > 1) paistr += suitstr;
        }
        paistr += '_'.repeat(this._bingpai._ + (this._zimo == '_' ? -1 : 0));
        if (this._zimo && this._zimo.length <= 2) paistr += this._zimo;
        if (this._lizhi)                          paistr += '*';

        for (let m of this._fulou) {
            paistr += ',' + m;
        }
        if (this._zimo && this._zimo.length > 2) paistr += ',';

        return paistr;
    }

    clone() {

        const shoupai = new Shoupai();

        shoupai._bingpai = {
            _: this._bingpai._,
            m: this._bingpai.m.concat(),
            p: this._bingpai.p.concat(),
            s: this._bingpai.s.concat(),
            z: this._bingpai.z.concat(),
        };
        shoupai._fulou = this._fulou.concat();
        shoupai._zimo  = this._zimo;
        shoupai._lizhi = this._lizhi;

        return shoupai;
    }

    fromString(paistr) {
        const shoupai = Shoupai.fromString(paistr);
        this._bingpai = {
            _: shoupai._bingpai._,
            m: shoupai._bingpai.m.concat(),
            p: shoupai._bingpai.p.concat(),
            s: shoupai._bingpai.s.concat(),
            z: shoupai._bingpai.z.concat(),
        };
        this._fulou = shoupai._fulou.concat();
        this._zimo  = shoupai._zimo;
        this._lizhi = shoupai._lizhi;

        return this;
    }

    decrease(s, n) {
        let bingpai = this._bingpai[s]; n = ({A:10,B:11,C:12}[n]??+n);
        const base = +Shoupai.normal_pai(s+(({10:'A',11:'B',12:'C'}[n]??n)))[1];
        const marker = s==='z' ? ({4:9,5:0,6:8}[base]) : base===5 ? 0 : undefined;
        const available = n===base ? bingpai[base]-(marker===undefined?0:bingpai[marker])-(base===5?bingpai[10]+(s==='z'?(bingpai[11]||0)+(bingpai[12]||0):0):0) : bingpai[n];
        if (!available) {
            if (!this._bingpai._) throw new Error([this,s+n]);
            this._bingpai._--;
        } else {
            bingpai[n]--;
            if (base!==n) bingpai[base]--;
        }
    }

    zimo(p, check = true) {
        if (check && this._zimo)                    throw new Error([this, p]);
        if (p == '_') {
            this._bingpai._++;
            this._zimo = p;
        }
        else {
            if (! Shoupai.valid_pai(p))             throw new Error(p);
            let s = p[0], n = ({A:10,B:11,C:12}[p[1]]??+p[1]);
            let bingpai = this._bingpai[s];
            const base = +Shoupai.normal_pai(s+(({10:'A',11:'B',12:'C'}[n]??n)))[1];
            if (bingpai[base] >= 4) throw new Error([this,p]);
            bingpai[n]++;
            if (base !== n) bingpai[base]++;
            this._zimo = s+(({10:'A',11:'B',12:'C'}[n]??n));
        }
        return this;
    }

    dapai(p, check = true) {
        if (check && ! this._zimo)                  throw new Error([this, p]);
        if (! Shoupai.valid_pai(p))                 throw new Error(p);
        let s = p[0], n = ({A:10,B:11,C:12}[p[1]]??+p[1]);
        this.decrease(s, p[1]);
        this._zimo = null;
        if (p.slice(-1) == '*') this._lizhi = true;
        return this;
    }

    fulou(m, check = true) {
        if (check && this._zimo)                    throw new Error([this, m]);
        if (m != Shoupai.valid_mianzi(m))           throw new Error(m);
        if (m.match(/[0-9A-C]{4}$/))                      throw new Error([this, m]);
        if (m.match(/[0-9A-C]{3}[\+\=\-][0-9A-C]$/))            throw new Error([this, m]);
        let s = m[0];
        for (let n of m.match(/[0-9A-C](?![\+\=\-])/g)) {
            this.decrease(s, n);
        }
        this._fulou.push(m);
        if (! m.match(/[0-9A-C]{4}/)) this._zimo = m;
        return this;
    }

    gang(m, check = true) {
        if (check && ! this._zimo)                  throw new Error([this, m]);
        if (check && this._zimo.length > 2)         throw new Error([this, m]);
        if (m != Shoupai.valid_mianzi(m))           throw new Error(m);
        let s = m[0];
        if (m.match(/[0-9A-C]{4}$/)) {
            for (let n of m.match(/[0-9A-C]/g)) {
                this.decrease(s, n);
            }
            this._fulou.push(m);
        }
        else if (m.match(/[0-9A-C]{3}[\+\=\-][0-9A-C]$/)) {
            let m1 = m.slice(0,5);
            let i = this._fulou.findIndex(m2 => m1 == m2);
            if (i < 0)                              throw new Error([this, m]);
            this._fulou[i] = m;
            this.decrease(s, m.slice(-1));
        }
        else                                        throw new Error([this, m]);
        this._zimo = null;
        return this;
    }

    get menqian() {
        return this._fulou.filter(m=>m.match(/[\+\=\-]/)).length == 0;
    }

    get lizhi() { return this._lizhi }

    get_dapai(check = true) {

        if (! this._zimo) return null;

        let deny = {};
        if (check && this._zimo.length > 2) {
            let m = this._zimo;
            let s = m[0];
            let n = + m.match(/[0-9A-C](?=[\+\=\-])/) || 5;
            deny[s+n] = true;
            if (! m.replace(/0/,'5').match(/^[mpsz]([0-9A-C])\1\1/)) {
                if (n < 7 && m.match(/^[mps][0-9A-C]\-[0-9A-C][0-9A-C]$/)) deny[s+(n+3)] = true;
                if (3 < n && m.match(/^[mps][0-9A-C][0-9A-C][0-9A-C]\-$/)) deny[s+(n-3)] = true;
            }
        }

        let dapai = [];
        if (! this._lizhi) {
            for (let s of ['m','p','s','z']) {
                let bingpai = this._bingpai[s];
                for (let n = 1; n <= (s==='z'?7:9); n++) {
                    if (bingpai[n] == 0)  continue;
                    if (deny[s+n])        continue;
                    if (s+n == this._zimo && bingpai[n] == 1) continue;
                    if (s==='z' && [4,5,6].includes(n)) {
                        const marker={4:9,5:0,6:8}[n];
                        if (bingpai[marker]>0 && (this._zimo!==s+marker || bingpai[marker]>1)) dapai.push(s+marker);
                        if (bingpai[n]>bingpai[marker]) dapai.push(s+n);
                    }
                    else if (n != 5) dapai.push(s+n);
                    else {
                        if (bingpai[0] > 0
                            && s+0 != this._zimo || bingpai[0] > 1)
                                                     dapai.push(s+0);
                        if (bingpai[0] < bingpai[5]) dapai.push(s+n);
                    }
                }
            }
        }
        if (this._zimo.length == 2) dapai.push(this._zimo + '_');
        return dapai;
    }

    get_chi_mianzi(p, check = true) {

        if (this._zimo) return null;
        if (! Shoupai.valid_pai(p))                     throw new Error(p);

        let mianzi = [];
        let s = p[0], n = + p[1] || 5, d = p.match(/[\+\=\-]$/);
        if (! d)                                        throw new Error(p);
        if (s == 'z' || d != '-') return mianzi;
        if (this._lizhi) return mianzi;

        let bingpai = this._bingpai[s];
        if (3 <= n && bingpai[n-2] > 0 && bingpai[n-1] > 0) {
            if (! check
                || (3 < n ? bingpai[n-3] : 0) + bingpai[n]
                        < 14 - (this._fulou.length + 1) * 3)
            {
                if (n-2 == 5 && bingpai[0] > 0) mianzi.push(s+'067-');
                if (n-1 == 5 && bingpai[0] > 0) mianzi.push(s+'406-');
                if (n-2 != 5 && n-1 != 5 || bingpai[0] < bingpai[5])
                                            mianzi.push(s+(n-2)+(n-1)+(p[1]+d));
            }
        }
        if (2 <= n && n <= 8 && bingpai[n-1] > 0 && bingpai[n+1] > 0) {
            if (! check || bingpai[n] < 14 - (this._fulou.length + 1) * 3) {
                if (n-1 == 5 && bingpai[0] > 0) mianzi.push(s+'06-7');
                if (n+1 == 5 && bingpai[0] > 0) mianzi.push(s+'34-0');
                if (n-1 != 5 && n+1 != 5 || bingpai[0] < bingpai[5])
                                            mianzi.push(s+(n-1)+(p[1]+d)+(n+1));
            }
        }
        if (n <= 7 && bingpai[n+1] > 0 && bingpai[n+2] > 0) {
            if (! check
                ||  bingpai[n] + (n < 7 ? bingpai[n+3] : 0)
                        < 14 - (this._fulou.length + 1) * 3)
            {
                if (n+1 == 5 && bingpai[0] > 0) mianzi.push(s+'4-06');
                if (n+2 == 5 && bingpai[0] > 0) mianzi.push(s+'3-40');
                if (n+1 != 5 && n+2 != 5 || bingpai[0] < bingpai[5])
                                            mianzi.push(s+(p[1]+d)+(n+1)+(n+2));
            }
        }
        return mianzi;
    }

    get_peng_mianzi(p) {

        if (this._zimo) return null;
        if (! Shoupai.valid_pai(p))                     throw new Error(p);

        let mianzi = [];
        let s = p[0], n = + p[1] || 5, d = p.match(/[\+\=\-]$/);
        if (! d)                                        throw new Error(p);
        if (this._lizhi) return mianzi;

        if(s==='z') {
            const base=+Shoupai.normal_pai(p)[1], marker={4:9,5:0,6:8}[base], b=this._bingpai.z;
            const special=marker===undefined?0:b[marker], normal=b[base]-special;
            for(let k=0;k<=2;k++) if(k<=special && 2-k<=normal)
                mianzi.push('z'+String(base).repeat(2-k)+String(marker).repeat(k)+p[1]+d);
            return mianzi;
        }

        let bingpai = this._bingpai[s];
        if (bingpai[n] >= 2) {
            if (n == 5 && bingpai[0] >= 2)  mianzi.push(s+'00'+p[1]+d);
            if (n == 5 && bingpai[0] >= 1 && bingpai[5] - bingpai[0] >=1)
                                            mianzi.push(s+'50'+p[1]+d);
            if (n != 5 || bingpai[5] - bingpai[0] >=2)
                                            mianzi.push(s+n+n+p[1]+d);
        }
        return mianzi;
    }

    get_gang_mianzi(p) {

        let mianzi = [];
        const honorGang=(base,called)=>{
            const b=this._bingpai.z, marker={4:9,5:0,6:8}[base], special=marker===undefined?0:b[marker];
            return 'z'+String(base).repeat(b[base]-special)+String(marker).repeat(special)+(called||'');
        };
        if(p && p[0]==='z') {
            if(this._zimo)return null;
            if(this._lizhi)return [];
            const base=+Shoupai.normal_pai(p)[1];
            return this._bingpai.z[base]===3 ? [honorGang(base,p.slice(1))] : [];
        }

        if (p) {
            if (this._zimo) return null;
            if (! Shoupai.valid_pai(p))                 throw new Error(p);

            let s = p[0], n = + p[1] || 5, d = p.match(/[\+\=\-]$/);
            if (! d)                                    throw new Error(p);
            if (this._lizhi) return mianzi;

            let bingpai = this._bingpai[s];
            if (bingpai[n] == 3) {
                if (n == 5) mianzi = [ s + '5'.repeat(3 - bingpai[0])
                                         + '0'.repeat(bingpai[0]) + p[1]+d ];
                else        mianzi = [ s+n+n+n+n+d ];
            }
        }
        else {
            if (! this._zimo) return null;
            if (this._zimo.length > 2) return null;
            let p = Shoupai.normal_pai(this._zimo);

            for (let s of ['m','p','s','z']) {
                let bingpai = this._bingpai[s];
                for (let n = 1; n <= (s==='z'?7:9); n++) {
                    if (bingpai[n] == 0) continue;
                    if(s==='z') {
                        if(bingpai[n]===4 && (!this._lizhi || p==='z'+n)) mianzi.push(honorGang(n));
                        if(!this._lizhi) for(const m of this._fulou) if(Shoupai.normal_pai(m).slice(0,4)==='z'+String(n).repeat(3)) {
                            const marker={4:9,5:0,6:8}[n], special=marker===undefined?0:bingpai[marker];
                            if(bingpai[n]>special)mianzi.push(m+n);
                            if(special)mianzi.push(m+marker);
                        }
                        continue;
                    }
                    if (bingpai[n] == 4) {
                        if (this._lizhi && s+n != p) continue;
                        if (n == 5) mianzi.push(s + '5'.repeat(4 - bingpai[0])
                                                  + '0'.repeat(bingpai[0]));
                        else        mianzi.push(s+n+n+n+n);
                    }
                    else {
                        if (this._lizhi) continue;
                        for (let m of this._fulou) {
                            if (m.replace(/0/g,'5').slice(0,4) == s+n+n+n) {
                                if (n == 5 && bingpai[0] > 0) mianzi.push(m+0);
                                else                          mianzi.push(m+n);
                            }
                        }
                    }
                }
            }
        }
        return mianzi;
    }
}

