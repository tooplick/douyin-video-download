/**
 * ABogus 签名算法 - 用于抖音 Web API 请求签名
 */

import { sm3ToArray } from './sm3.js';

const STR_MAP = {
    s0: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
    s1: 'Dkdpgh4ZKsQB80/Mfvw36XI1R25+WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe=',
    s2: 'Dkdpgh4ZKsQB80/Mfvw36XI1R25-WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe=',
    s3: 'ckdp1h4ZKsUB80/Mfvw36XIgR25+WQAlEi7NLboqYTOPuzKFjJnry79HbGcaStCe',
    s4: 'Dkdpgh2ZmsQB80/MfvV36XI1R45-WUAlEixNLwoqYTOPuzKFjJnry79HbGcaStCe',
};

const END_STRING = 'cus';
const BROWSER = '1536|742|1536|864|0|0|0|0|1536|864|1536|864|1536|742|24|24|MacIntel';

const UA_CODE = [
    76, 98, 15, 131, 97, 245, 224, 133, 122, 199, 241, 166,
    79, 34, 90, 191, 128, 126, 122, 98, 66, 11, 14, 40,
    49, 110, 110, 173, 67, 96, 138, 252
];

function charCodeAt(s) { return Array.from(s).map(c => c.charCodeAt(0)); }
function fromCharCode(...args) { return args.map(c => String.fromCharCode(c)).join(''); }

function randomList(a, b = 170, c = 85, d = 0, e = 0, f = 0, g = 0) {
    const r = a !== undefined ? a : (Math.random() * 10000);
    const v1 = Math.floor(r) & 255;
    const v2 = Math.floor(r) >> 8;
    return [v1 & b | d, v1 & c | e, v2 & b | f, v2 & c | g];
}

function list1(rn) { return randomList(rn, 170, 85, 1, 2, 5, 45 & 170); }
function list2(rn) { return randomList(rn, 170, 85, 1, 0, 0, 0); }
function list3(rn) { return randomList(rn, 170, 85, 1, 0, 5, 0); }

function generateString1(r1, r2, r3) {
    return fromCharCode(...list1(r1)) + fromCharCode(...list2(r2)) + fromCharCode(...list3(r3));
}

function list4(a, b, c, d, e, f, g, h, i, j, k, m, n, o, p, q, r) {
    return [
        44, a, 0, 0, 0, 0, 24, b, n, 0, c, d, 0, 0, 0, 1,
        0, 239, e, o, f, g, 0, 0, 0, 0, h, 0, 0, 14, i, j,
        0, k, m, 3, p, 1, q, 1, r, 0, 0, 0
    ];
}

function endCheckNum(a) { let r = 0; for (const v of a) r ^= v; return r; }

function rc4Encrypt(plaintext, key) {
    const s = Array.from({ length: 256 }, (_, i) => i);
    let j = 0;
    for (let i = 0; i < 256; i++) {
        j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
        [s[i], s[j]] = [s[j], s[i]];
    }
    let ii = 0; j = 0;
    const cipher = [];
    for (let k = 0; k < plaintext.length; k++) {
        ii = (ii + 1) % 256;
        j = (j + s[ii]) % 256;
        [s[ii], s[j]] = [s[j], s[ii]];
        cipher.push(String.fromCharCode(s[(s[ii] + s[j]) % 256] ^ plaintext.charCodeAt(k)));
    }
    return cipher.join('');
}

function generateString2(urlParams, method = 'GET', startTime = 0, endTime = 0) {
    const browserCode = charCodeAt(BROWSER);
    startTime = startTime || Date.now();
    endTime = endTime || (startTime + Math.floor(Math.random() * 5) + 4);

    const paramsArray = sm3ToArray(sm3ToArray(urlParams + END_STRING));
    const methodArray = sm3ToArray(sm3ToArray(method + END_STRING));

    const a = list4(
        (endTime >> 24) & 255, paramsArray[21], UA_CODE[23],
        (endTime >> 16) & 255, paramsArray[22], UA_CODE[24],
        (endTime >> 8) & 255, (endTime >> 0) & 255,
        (startTime >> 24) & 255, (startTime >> 16) & 255,
        (startTime >> 8) & 255, (startTime >> 0) & 255,
        methodArray[21], methodArray[22],
        Math.floor(endTime / 256 / 256 / 256 / 256) >> 0,
        Math.floor(startTime / 256 / 256 / 256 / 256) >> 0,
        BROWSER.length,
    );
    const e = endCheckNum(a);
    a.push(...browserCode);
    a.push(e);
    return rc4Encrypt(fromCharCode(...a), 'y');
}

function generateResult(s, e = 's4') {
    const table = STR_MAP[e];
    const r = [];
    for (let i = 0; i < s.length; i += 3) {
        let n;
        if (i + 2 < s.length) n = (s.charCodeAt(i) << 16) | (s.charCodeAt(i + 1) << 8) | s.charCodeAt(i + 2);
        else if (i + 1 < s.length) n = (s.charCodeAt(i) << 16) | (s.charCodeAt(i + 1) << 8);
        else n = s.charCodeAt(i) << 16;
        const pairs = [[18, 0xFC0000], [12, 0x03F000], [6, 0x0FC0], [0, 0x3F]];
        for (const [shift, mask] of pairs) {
            if (shift === 6 && i + 1 >= s.length) break;
            if (shift === 0 && i + 2 >= s.length) break;
            r.push(table[(n & mask) >> shift]);
        }
    }
    const pad = (4 - (r.length % 4)) % 4;
    for (let i = 0; i < pad; i++) r.push('=');
    return r.join('');
}

export function getABogus(urlParams) {
    let paramStr;
    if (typeof urlParams === 'object') paramStr = new URLSearchParams(urlParams).toString();
    else paramStr = urlParams;
    const string1 = generateString1();
    const string2 = generateString2(paramStr);
    return encodeURIComponent(generateResult(string1 + string2, 's4'));
}
