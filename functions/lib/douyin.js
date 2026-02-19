/**
 * 抖音 API 交互模块
 * 直接从 Pages Function 调用，不经过外部 API
 */

import { getABogus } from './abogus.js';

const DOUYIN_DOMAIN = 'https://www.douyin.com';
const POST_DETAIL = `${DOUYIN_DOMAIN}/aweme/v1/web/aweme/detail/`;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36';

// URL 正则匹配
const VIDEO_URL_PATTERN = /video\/([^/?]*)/;
const VIDEO_URL_PATTERN_NEW = /[?&]vid=(\d+)/;
const NOTE_URL_PATTERN = /note\/([^/?]*)/;
const DISCOVER_URL_PATTERN = /modal_id=([0-9]+)/;

function buildBaseParams(awemeId) {
    return {
        device_platform: 'webapp', aid: '6383', channel: 'channel_pc_web',
        pc_client_type: '1', version_code: '290100', version_name: '29.1.0',
        cookie_enabled: 'true', screen_width: '1920', screen_height: '1080',
        browser_language: 'zh-CN', browser_platform: 'Win32',
        browser_name: 'Chrome', browser_version: '130.0.0.0',
        browser_online: 'true', engine_name: 'Blink', engine_version: '130.0.0.0',
        os_name: 'Windows', os_version: '10', cpu_core_num: '12',
        device_memory: '8', platform: 'PC', downlink: '10',
        effective_type: '4g', from_user_page: '1', locate_query: 'false',
        need_time_list: '1', pc_libra_divert: 'Windows',
        publish_video_strategy_type: '2', round_trip_time: '0',
        show_live_replay_strategy: '1', time_list_query: '0',
        whale_cut_token: '', update_version_code: '170400',
        msToken: '', aweme_id: awemeId,
    };
}

/**
 * 从分享链接中提取 aweme_id
 */
export async function getAwemeId(url) {
    const response = await fetch(url, {
        redirect: 'follow',
        headers: { 'User-Agent': USER_AGENT },
    });

    const responseUrl = response.url;
    for (const pattern of [VIDEO_URL_PATTERN, VIDEO_URL_PATTERN_NEW, NOTE_URL_PATTERN, DISCOVER_URL_PATTERN]) {
        const match = responseUrl.match(pattern);
        if (match) return match[1];
    }
    throw new Error(`无法从 URL 中提取 aweme_id: ${responseUrl}`);
}

/**
 * 调用抖音 API 获取单个视频详情
 */
export async function fetchOneVideo(awemeId, cookie) {
    const params = buildBaseParams(awemeId);
    const aBogus = getABogus(params);
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `${POST_DETAIL}?${queryString}&a_bogus=${aBogus}`;

    const response = await fetch(endpoint, {
        headers: {
            'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
            'User-Agent': USER_AGENT,
            'Referer': 'https://www.douyin.com/',
            'Cookie': cookie,
        },
    });

    if (!response.ok) {
        throw new Error(`抖音 API 请求失败: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}
