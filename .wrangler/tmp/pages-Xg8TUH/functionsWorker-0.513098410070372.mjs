var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/download.js
async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");
  const filename = url.searchParams.get("filename") || "douyin_video.mp4";
  if (!targetUrl) {
    return Response.json(
      { code: 400, message: "\u8BF7\u63D0\u4F9B\u4E0B\u8F7D\u5730\u5740" },
      { status: 400 }
    );
  }
  try {
    const resp = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://www.douyin.com/"
      },
      redirect: "follow"
    });
    if (!resp.ok) {
      return Response.json(
        { code: resp.status, message: "\u8D44\u6E90\u83B7\u53D6\u5931\u8D25" },
        { status: 502 }
      );
    }
    const headers = new Headers({
      "Content-Type": resp.headers.get("Content-Type") || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Access-Control-Allow-Origin": "*"
    });
    const contentLength = resp.headers.get("Content-Length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }
    return new Response(resp.body, {
      status: 200,
      headers
    });
  } catch (err) {
    return Response.json(
      { code: 500, message: "\u4E0B\u8F7D\u5931\u8D25: " + err.message },
      { status: 500 }
    );
  }
}
__name(onRequestGet, "onRequestGet");

// lib/sm3.js
var T = [];
for (let i = 0; i < 16; i++) T[i] = 2043430169;
for (let i = 16; i < 64; i++) T[i] = 2055708042;
function leftRotate(x, n) {
  n %= 32;
  return (x << n | x >>> 32 - n) >>> 0;
}
__name(leftRotate, "leftRotate");
function FF(x, y, z, j) {
  if (j < 16) return (x ^ y ^ z) >>> 0;
  return (x & y | x & z | y & z) >>> 0;
}
__name(FF, "FF");
function GG(x, y, z, j) {
  if (j < 16) return (x ^ y ^ z) >>> 0;
  return (x & y | ~x & z) >>> 0;
}
__name(GG, "GG");
function P0(x) {
  return (x ^ leftRotate(x, 9) ^ leftRotate(x, 17)) >>> 0;
}
__name(P0, "P0");
function P1(x) {
  return (x ^ leftRotate(x, 15) ^ leftRotate(x, 23)) >>> 0;
}
__name(P1, "P1");
function paddingMsg(msg) {
  const len = msg.length;
  const bitLen = len * 8;
  msg.push(128);
  while (msg.length % 64 !== 56) msg.push(0);
  const hi = Math.floor(bitLen / 4294967296) >>> 0;
  const lo = (bitLen & 4294967295) >>> 0;
  for (let i = 3; i >= 0; i--) msg.push(hi >>> i * 8 & 255);
  for (let i = 3; i >= 0; i--) msg.push(lo >>> i * 8 & 255);
  return msg;
}
__name(paddingMsg, "paddingMsg");
function sm3Hash(inputBytes) {
  const msg = paddingMsg([...inputBytes]);
  let V = [
    1937774191,
    1226093241,
    388252375,
    3666478592,
    2842636476,
    372324522,
    3817729613,
    2969243214
  ];
  const blocks = msg.length / 64;
  for (let b = 0; b < blocks; b++) {
    const offset = b * 64;
    const W = new Array(68);
    const W1 = new Array(64);
    for (let i = 0; i < 16; i++) {
      W[i] = (msg[offset + i * 4] << 24 | msg[offset + i * 4 + 1] << 16 | msg[offset + i * 4 + 2] << 8 | msg[offset + i * 4 + 3]) >>> 0;
    }
    for (let i = 16; i < 68; i++) {
      W[i] = (P1(W[i - 16] ^ W[i - 9] ^ leftRotate(W[i - 3], 15)) ^ leftRotate(W[i - 13], 7) ^ W[i - 6]) >>> 0;
    }
    for (let i = 0; i < 64; i++) {
      W1[i] = (W[i] ^ W[i + 4]) >>> 0;
    }
    let [A, B, C, D, E, F, G, H] = V;
    for (let j = 0; j < 64; j++) {
      const SS1 = leftRotate(leftRotate(A, 12) + E + leftRotate(T[j], j) >>> 0, 7);
      const SS2 = (SS1 ^ leftRotate(A, 12)) >>> 0;
      const TT1 = FF(A, B, C, j) + D + SS2 + W1[j] >>> 0;
      const TT2 = GG(E, F, G, j) + H + SS1 + W[j] >>> 0;
      D = C;
      C = leftRotate(B, 9);
      B = A;
      A = TT1;
      H = G;
      G = leftRotate(F, 19);
      F = E;
      E = P0(TT2);
    }
    V[0] = (V[0] ^ A) >>> 0;
    V[1] = (V[1] ^ B) >>> 0;
    V[2] = (V[2] ^ C) >>> 0;
    V[3] = (V[3] ^ D) >>> 0;
    V[4] = (V[4] ^ E) >>> 0;
    V[5] = (V[5] ^ F) >>> 0;
    V[6] = (V[6] ^ G) >>> 0;
    V[7] = (V[7] ^ H) >>> 0;
  }
  const result = [];
  for (let i = 0; i < 8; i++) {
    result.push(V[i] >>> 24 & 255, V[i] >>> 16 & 255, V[i] >>> 8 & 255, V[i] & 255);
  }
  return result;
}
__name(sm3Hash, "sm3Hash");
function sm3ToArray(data) {
  let bytes;
  if (typeof data === "string") {
    bytes = Array.from(new TextEncoder().encode(data));
  } else {
    bytes = Array.from(data);
  }
  return sm3Hash(bytes);
}
__name(sm3ToArray, "sm3ToArray");

// lib/abogus.js
var STR_MAP = {
  s0: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
  s1: "Dkdpgh4ZKsQB80/Mfvw36XI1R25+WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe=",
  s2: "Dkdpgh4ZKsQB80/Mfvw36XI1R25-WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe=",
  s3: "ckdp1h4ZKsUB80/Mfvw36XIgR25+WQAlEi7NLboqYTOPuzKFjJnry79HbGcaStCe",
  s4: "Dkdpgh2ZmsQB80/MfvV36XI1R45-WUAlEixNLwoqYTOPuzKFjJnry79HbGcaStCe"
};
var END_STRING = "cus";
var BROWSER = "1536|742|1536|864|0|0|0|0|1536|864|1536|864|1536|742|24|24|MacIntel";
var UA_CODE = [
  76,
  98,
  15,
  131,
  97,
  245,
  224,
  133,
  122,
  199,
  241,
  166,
  79,
  34,
  90,
  191,
  128,
  126,
  122,
  98,
  66,
  11,
  14,
  40,
  49,
  110,
  110,
  173,
  67,
  96,
  138,
  252
];
function charCodeAt(s) {
  return Array.from(s).map((c) => c.charCodeAt(0));
}
__name(charCodeAt, "charCodeAt");
function fromCharCode(...args) {
  return args.map((c) => String.fromCharCode(c)).join("");
}
__name(fromCharCode, "fromCharCode");
function randomList(a, b = 170, c = 85, d = 0, e = 0, f = 0, g = 0) {
  const r = a !== void 0 ? a : Math.random() * 1e4;
  const v1 = Math.floor(r) & 255;
  const v2 = Math.floor(r) >> 8;
  return [v1 & b | d, v1 & c | e, v2 & b | f, v2 & c | g];
}
__name(randomList, "randomList");
function list1(rn) {
  return randomList(rn, 170, 85, 1, 2, 5, 45 & 170);
}
__name(list1, "list1");
function list2(rn) {
  return randomList(rn, 170, 85, 1, 0, 0, 0);
}
__name(list2, "list2");
function list3(rn) {
  return randomList(rn, 170, 85, 1, 0, 5, 0);
}
__name(list3, "list3");
function generateString1(r1, r2, r3) {
  return fromCharCode(...list1(r1)) + fromCharCode(...list2(r2)) + fromCharCode(...list3(r3));
}
__name(generateString1, "generateString1");
function list4(a, b, c, d, e, f, g, h, i, j, k, m, n, o, p, q, r) {
  return [
    44,
    a,
    0,
    0,
    0,
    0,
    24,
    b,
    n,
    0,
    c,
    d,
    0,
    0,
    0,
    1,
    0,
    239,
    e,
    o,
    f,
    g,
    0,
    0,
    0,
    0,
    h,
    0,
    0,
    14,
    i,
    j,
    0,
    k,
    m,
    3,
    p,
    1,
    q,
    1,
    r,
    0,
    0,
    0
  ];
}
__name(list4, "list4");
function endCheckNum(a) {
  let r = 0;
  for (const v of a) r ^= v;
  return r;
}
__name(endCheckNum, "endCheckNum");
function rc4Encrypt(plaintext, key) {
  const s = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
    [s[i], s[j]] = [s[j], s[i]];
  }
  let ii = 0;
  j = 0;
  const cipher = [];
  for (let k = 0; k < plaintext.length; k++) {
    ii = (ii + 1) % 256;
    j = (j + s[ii]) % 256;
    [s[ii], s[j]] = [s[j], s[ii]];
    cipher.push(String.fromCharCode(s[(s[ii] + s[j]) % 256] ^ plaintext.charCodeAt(k)));
  }
  return cipher.join("");
}
__name(rc4Encrypt, "rc4Encrypt");
function generateString2(urlParams, method = "GET", startTime = 0, endTime = 0) {
  const browserCode = charCodeAt(BROWSER);
  startTime = startTime || Date.now();
  endTime = endTime || startTime + Math.floor(Math.random() * 5) + 4;
  const paramsArray = sm3ToArray(sm3ToArray(urlParams + END_STRING));
  const methodArray = sm3ToArray(sm3ToArray(method + END_STRING));
  const a = list4(
    endTime >> 24 & 255,
    paramsArray[21],
    UA_CODE[23],
    endTime >> 16 & 255,
    paramsArray[22],
    UA_CODE[24],
    endTime >> 8 & 255,
    endTime >> 0 & 255,
    startTime >> 24 & 255,
    startTime >> 16 & 255,
    startTime >> 8 & 255,
    startTime >> 0 & 255,
    methodArray[21],
    methodArray[22],
    Math.floor(endTime / 256 / 256 / 256 / 256) >> 0,
    Math.floor(startTime / 256 / 256 / 256 / 256) >> 0,
    BROWSER.length
  );
  const e = endCheckNum(a);
  a.push(...browserCode);
  a.push(e);
  return rc4Encrypt(fromCharCode(...a), "y");
}
__name(generateString2, "generateString2");
function generateResult(s, e = "s4") {
  const table = STR_MAP[e];
  const r = [];
  for (let i = 0; i < s.length; i += 3) {
    let n;
    if (i + 2 < s.length) n = s.charCodeAt(i) << 16 | s.charCodeAt(i + 1) << 8 | s.charCodeAt(i + 2);
    else if (i + 1 < s.length) n = s.charCodeAt(i) << 16 | s.charCodeAt(i + 1) << 8;
    else n = s.charCodeAt(i) << 16;
    const pairs = [[18, 16515072], [12, 258048], [6, 4032], [0, 63]];
    for (const [shift, mask] of pairs) {
      if (shift === 6 && i + 1 >= s.length) break;
      if (shift === 0 && i + 2 >= s.length) break;
      r.push(table[(n & mask) >> shift]);
    }
  }
  const pad = (4 - r.length % 4) % 4;
  for (let i = 0; i < pad; i++) r.push("=");
  return r.join("");
}
__name(generateResult, "generateResult");
function getABogus(urlParams) {
  let paramStr;
  if (typeof urlParams === "object") paramStr = new URLSearchParams(urlParams).toString();
  else paramStr = urlParams;
  const string1 = generateString1();
  const string2 = generateString2(paramStr);
  return encodeURIComponent(generateResult(string1 + string2, "s4"));
}
__name(getABogus, "getABogus");

// lib/douyin.js
var DOUYIN_DOMAIN = "https://www.douyin.com";
var POST_DETAIL = `${DOUYIN_DOMAIN}/aweme/v1/web/aweme/detail/`;
var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36";
var VIDEO_URL_PATTERN = /video\/([^/?]*)/;
var VIDEO_URL_PATTERN_NEW = /[?&]vid=(\d+)/;
var NOTE_URL_PATTERN = /note\/([^/?]*)/;
var DISCOVER_URL_PATTERN = /modal_id=([0-9]+)/;
function buildBaseParams(awemeId) {
  return {
    device_platform: "webapp",
    aid: "6383",
    channel: "channel_pc_web",
    pc_client_type: "1",
    version_code: "290100",
    version_name: "29.1.0",
    cookie_enabled: "true",
    screen_width: "1920",
    screen_height: "1080",
    browser_language: "zh-CN",
    browser_platform: "Win32",
    browser_name: "Chrome",
    browser_version: "130.0.0.0",
    browser_online: "true",
    engine_name: "Blink",
    engine_version: "130.0.0.0",
    os_name: "Windows",
    os_version: "10",
    cpu_core_num: "12",
    device_memory: "8",
    platform: "PC",
    downlink: "10",
    effective_type: "4g",
    from_user_page: "1",
    locate_query: "false",
    need_time_list: "1",
    pc_libra_divert: "Windows",
    publish_video_strategy_type: "2",
    round_trip_time: "0",
    show_live_replay_strategy: "1",
    time_list_query: "0",
    whale_cut_token: "",
    update_version_code: "170400",
    msToken: "",
    aweme_id: awemeId
  };
}
__name(buildBaseParams, "buildBaseParams");
async function getAwemeId(url) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": USER_AGENT }
  });
  const responseUrl = response.url;
  for (const pattern of [VIDEO_URL_PATTERN, VIDEO_URL_PATTERN_NEW, NOTE_URL_PATTERN, DISCOVER_URL_PATTERN]) {
    const match2 = responseUrl.match(pattern);
    if (match2) return match2[1];
  }
  throw new Error(`\u65E0\u6CD5\u4ECE URL \u4E2D\u63D0\u53D6 aweme_id: ${responseUrl}`);
}
__name(getAwemeId, "getAwemeId");
async function fetchOneVideo(awemeId, cookie) {
  const params = buildBaseParams(awemeId);
  const aBogus = getABogus(params);
  const queryString = new URLSearchParams(params).toString();
  const endpoint = `${POST_DETAIL}?${queryString}&a_bogus=${aBogus}`;
  const response = await fetch(endpoint, {
    headers: {
      "Accept-Language": "zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2",
      "User-Agent": USER_AGENT,
      "Referer": "https://www.douyin.com/",
      "Cookie": cookie
    }
  });
  if (!response.ok) {
    throw new Error(`\u6296\u97F3 API \u8BF7\u6C42\u5931\u8D25: ${response.status} ${response.statusText}`);
  }
  return await response.json();
}
__name(fetchOneVideo, "fetchOneVideo");

// api/parse.js
var QUALITY_LABELS = {
  72: "4K",
  7: "1440p",
  1: "1080p",
  3: "1080p",
  10: "720p",
  211: "720p",
  20: "540p",
  15: "540p"
};
function getQualityLabel(qualityType, height, fps) {
  const base = QUALITY_LABELS[qualityType] || `${height}p`;
  return fps > 30 ? `${base} ${fps}fps` : base;
}
__name(getQualityLabel, "getQualityLabel");
function extractVideoQualities(bitRateList) {
  if (!bitRateList || !Array.isArray(bitRateList)) return [];
  const seen = /* @__PURE__ */ new Set();
  return bitRateList.filter((item) => item.play_addr?.url_list?.length > 0).map((item) => {
    const label = getQualityLabel(
      item.quality_type,
      item.play_addr.height,
      item.FPS
    );
    if (seen.has(label)) return null;
    seen.add(label);
    return {
      label,
      width: item.play_addr.width,
      height: item.play_addr.height,
      fps: item.FPS,
      bitRate: item.bit_rate,
      format: item.format,
      codec: item.is_h265 ? "H.265" : "H.264",
      size: item.play_addr.data_size,
      url: item.play_addr.url_list[0]
    };
  }).filter(Boolean);
}
__name(extractVideoQualities, "extractVideoQualities");
function formatCount(n) {
  if (!n || n === 0) return "0";
  if (n >= 1e4) return (n / 1e4).toFixed(1) + "\u4E07";
  return String(n);
}
__name(formatCount, "formatCount");
async function onRequestGet2(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");
  if (!targetUrl) {
    return Response.json(
      { code: 400, message: "\u8BF7\u63D0\u4F9B\u6296\u97F3\u94FE\u63A5" },
      { status: 400 }
    );
  }
  const urlMatch = targetUrl.match(/https?:\/\/[^\s]+/);
  const cleanUrl = urlMatch ? urlMatch[0] : targetUrl;
  const cookie = env.DOUYIN_COOKIE;
  if (!cookie) {
    return Response.json(
      { code: 500, message: "\u670D\u52A1\u5668\u672A\u914D\u7F6E DOUYIN_COOKIE" },
      { status: 500 }
    );
  }
  try {
    const awemeId = await getAwemeId(cleanUrl);
    const json = await fetchOneVideo(awemeId, cookie);
    const detail = json.aweme_detail;
    if (!detail) {
      return Response.json(
        { code: 404, message: "\u65E0\u6CD5\u89E3\u6790\u8BE5\u94FE\u63A5\uFF0C\u89C6\u9891\u53EF\u80FD\u5DF2\u5220\u9664" },
        { status: 404 }
      );
    }
    const isImagePost = detail.images && detail.images.length > 0;
    const author = detail.author || {};
    const stats = detail.statistics || {};
    const music = detail.music || {};
    const result = {
      code: 200,
      data: {
        type: isImagePost ? "images" : "video",
        awemeId: detail.aweme_id,
        title: detail.preview_title || detail.desc || "\u65E0\u6807\u9898",
        desc: detail.desc || "",
        createTime: detail.create_time,
        duration: detail.duration,
        author: {
          nickname: author.nickname || "",
          avatar: author.avatar_thumb?.url_list?.[0] || "",
          uid: author.uid,
          secUid: author.sec_uid
        },
        stats: {
          digg: formatCount(stats.digg_count),
          comment: formatCount(stats.comment_count),
          collect: formatCount(stats.collect_count),
          share: formatCount(stats.share_count)
        },
        music: {
          title: music.title || "",
          author: music.author || "",
          playUrl: music.play_url?.url_list?.[0] || ""
        },
        cover: detail.video?.cover?.url_list?.[0] || detail.video?.origin_cover?.url_list?.[0] || ""
      }
    };
    if (isImagePost) {
      result.data.images = detail.images.map((img) => ({
        url: img.url_list?.[img.url_list.length - 1] || img.url_list?.[0] || "",
        width: img.width,
        height: img.height
      }));
    } else {
      result.data.qualities = extractVideoQualities(detail.video?.bit_rate);
      if (result.data.qualities.length === 0 && detail.video?.play_addr) {
        result.data.qualities = [
          {
            label: "\u9ED8\u8BA4",
            width: detail.video.play_addr.width,
            height: detail.video.play_addr.height,
            fps: 30,
            bitRate: 0,
            format: "mp4",
            codec: "H.264",
            size: detail.video.play_addr.data_size || 0,
            url: detail.video.play_addr.url_list?.[0] || ""
          }
        ];
      }
    }
    return Response.json(result, {
      headers: {
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    return Response.json(
      { code: 500, message: "\u89E3\u6790\u5931\u8D25: " + err.message },
      { status: 500 }
    );
  }
}
__name(onRequestGet2, "onRequestGet");

// ../.wrangler/tmp/pages-Xg8TUH/functionsRoutes-0.9507284595646687.mjs
var routes = [
  {
    routePath: "/api/download",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/parse",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  }
];

// C:/Users/id654/AppData/Roaming/npm/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// C:/Users/id654/AppData/Roaming/npm/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// C:/Users/id654/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// C:/Users/id654/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-NQQucQ/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// C:/Users/id654/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-NQQucQ/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.513098410070372.mjs.map
