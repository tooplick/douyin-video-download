/**
 * SM3 国密哈希算法 - 纯 JavaScript 实现
 * 用于 ABogus 签名参数生成
 */

const T = [];
for (let i = 0; i < 16; i++) T[i] = 0x79cc4519;
for (let i = 16; i < 64; i++) T[i] = 0x7a879d8a;

function leftRotate(x, n) {
    n %= 32;
    return ((x << n) | (x >>> (32 - n))) >>> 0;
}

function FF(x, y, z, j) {
    if (j < 16) return (x ^ y ^ z) >>> 0;
    return ((x & y) | (x & z) | (y & z)) >>> 0;
}

function GG(x, y, z, j) {
    if (j < 16) return (x ^ y ^ z) >>> 0;
    return ((x & y) | (~x & z)) >>> 0;
}

function P0(x) {
    return (x ^ leftRotate(x, 9) ^ leftRotate(x, 17)) >>> 0;
}

function P1(x) {
    return (x ^ leftRotate(x, 15) ^ leftRotate(x, 23)) >>> 0;
}

function paddingMsg(msg) {
    const len = msg.length;
    const bitLen = len * 8;
    msg.push(0x80);
    while (msg.length % 64 !== 56) msg.push(0x00);
    const hi = Math.floor(bitLen / 0x100000000) >>> 0;
    const lo = (bitLen & 0xffffffff) >>> 0;
    for (let i = 3; i >= 0; i--) msg.push((hi >>> (i * 8)) & 0xff);
    for (let i = 3; i >= 0; i--) msg.push((lo >>> (i * 8)) & 0xff);
    return msg;
}

function sm3Hash(inputBytes) {
    const msg = paddingMsg([...inputBytes]);
    let V = [
        0x7380166f, 0x4914b2b9, 0x172442d7, 0xda8a0600,
        0xa96f30bc, 0x163138aa, 0xe38dee4d, 0xb0fb0e4e,
    ];
    const blocks = msg.length / 64;
    for (let b = 0; b < blocks; b++) {
        const offset = b * 64;
        const W = new Array(68);
        const W1 = new Array(64);
        for (let i = 0; i < 16; i++) {
            W[i] = ((msg[offset + i * 4] << 24) | (msg[offset + i * 4 + 1] << 16) | (msg[offset + i * 4 + 2] << 8) | msg[offset + i * 4 + 3]) >>> 0;
        }
        for (let i = 16; i < 68; i++) {
            W[i] = (P1(W[i - 16] ^ W[i - 9] ^ leftRotate(W[i - 3], 15)) ^ leftRotate(W[i - 13], 7) ^ W[i - 6]) >>> 0;
        }
        for (let i = 0; i < 64; i++) {
            W1[i] = (W[i] ^ W[i + 4]) >>> 0;
        }
        let [A, B, C, D, E, F, G, H] = V;
        for (let j = 0; j < 64; j++) {
            const SS1 = leftRotate((leftRotate(A, 12) + E + leftRotate(T[j], j)) >>> 0, 7);
            const SS2 = (SS1 ^ leftRotate(A, 12)) >>> 0;
            const TT1 = (FF(A, B, C, j) + D + SS2 + W1[j]) >>> 0;
            const TT2 = (GG(E, F, G, j) + H + SS1 + W[j]) >>> 0;
            D = C; C = leftRotate(B, 9); B = A; A = TT1;
            H = G; G = leftRotate(F, 19); F = E; E = P0(TT2);
        }
        V[0] = (V[0] ^ A) >>> 0; V[1] = (V[1] ^ B) >>> 0;
        V[2] = (V[2] ^ C) >>> 0; V[3] = (V[3] ^ D) >>> 0;
        V[4] = (V[4] ^ E) >>> 0; V[5] = (V[5] ^ F) >>> 0;
        V[6] = (V[6] ^ G) >>> 0; V[7] = (V[7] ^ H) >>> 0;
    }
    const result = [];
    for (let i = 0; i < 8; i++) {
        result.push((V[i] >>> 24) & 0xff, (V[i] >>> 16) & 0xff, (V[i] >>> 8) & 0xff, V[i] & 0xff);
    }
    return result;
}

export function sm3ToArray(data) {
    let bytes;
    if (typeof data === 'string') {
        bytes = Array.from(new TextEncoder().encode(data));
    } else {
        bytes = Array.from(data);
    }
    return sm3Hash(bytes);
}
