// 解析抖音链接，返回精简的视频/图集数据
// 直接调用本地模块，不依赖外部 API
import { getAwemeId, fetchOneVideo } from '../lib/douyin.js';

// 画质标签映射
const QUALITY_LABELS = {
    72: '4K',
    7: '1440p',
    1: '1080p',
    3: '1080p',
    10: '720p',
    211: '720p',
    20: '540p',
    15: '540p',
};

function getQualityLabel(qualityType, height, fps) {
    const base = QUALITY_LABELS[qualityType] || `${height}p`;
    return fps > 30 ? `${base} ${fps}fps` : base;
}

function extractVideoQualities(bitRateList) {
    if (!bitRateList || !Array.isArray(bitRateList)) return [];

    const seen = new Set();
    return bitRateList
        .filter((item) => item.play_addr?.url_list?.length > 0)
        .map((item) => {
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
                codec: item.is_h265 ? 'H.265' : 'H.264',
                size: item.play_addr.data_size,
                url: item.play_addr.url_list[0],
            };
        })
        .filter(Boolean);
}

function formatCount(n) {
    if (!n || n === 0) return '0';
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    return String(n);
}

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
        return Response.json(
            { code: 400, message: '请提供抖音链接' },
            { status: 400 }
        );
    }

    // 从分享文本中提取 URL（用户可能粘贴了完整的分享文案）
    const urlMatch = targetUrl.match(/https?:\/\/[^\s]+/);
    const cleanUrl = urlMatch ? urlMatch[0] : targetUrl;

    const cookie = env.DOUYIN_COOKIE;
    if (!cookie) {
        return Response.json(
            { code: 500, message: '服务器未配置 DOUYIN_COOKIE' },
            { status: 500 }
        );
    }

    try {
        // 1. 提取 aweme_id
        const awemeId = await getAwemeId(cleanUrl);

        // 2. 直接调用抖音 API（本地模块，不走外部 API）
        const json = await fetchOneVideo(awemeId, cookie);
        const detail = json.aweme_detail;

        if (!detail) {
            return Response.json(
                { code: 404, message: '无法解析该链接，视频可能已删除' },
                { status: 404 }
            );
        }

        // 3. 构建响应
        const isImagePost = detail.images && detail.images.length > 0;
        const author = detail.author || {};
        const stats = detail.statistics || {};
        const music = detail.music || {};

        const result = {
            code: 200,
            data: {
                type: isImagePost ? 'images' : 'video',
                awemeId: detail.aweme_id,
                title: detail.preview_title || detail.desc || '无标题',
                desc: detail.desc || '',
                createTime: detail.create_time,
                duration: detail.duration,
                author: {
                    nickname: author.nickname || '',
                    avatar: author.avatar_thumb?.url_list?.[0] || '',
                    uid: author.uid,
                    secUid: author.sec_uid,
                },
                stats: {
                    digg: formatCount(stats.digg_count),
                    comment: formatCount(stats.comment_count),
                    collect: formatCount(stats.collect_count),
                    share: formatCount(stats.share_count),
                },
                music: {
                    title: music.title || '',
                    author: music.author || '',
                    playUrl: music.play_url?.url_list?.[0] || '',
                },
                cover:
                    detail.video?.cover?.url_list?.[0] ||
                    detail.video?.origin_cover?.url_list?.[0] ||
                    '',
            },
        };

        if (isImagePost) {
            result.data.images = detail.images.map((img) => ({
                url:
                    img.url_list?.[img.url_list.length - 1] ||
                    img.url_list?.[0] ||
                    '',
                width: img.width,
                height: img.height,
            }));
        } else {
            result.data.qualities = extractVideoQualities(detail.video?.bit_rate);

            if (result.data.qualities.length === 0 && detail.video?.play_addr) {
                result.data.qualities = [
                    {
                        label: '默认',
                        width: detail.video.play_addr.width,
                        height: detail.video.play_addr.height,
                        fps: 30,
                        bitRate: 0,
                        format: 'mp4',
                        codec: 'H.264',
                        size: detail.video.play_addr.data_size || 0,
                        url: detail.video.play_addr.url_list?.[0] || '',
                    },
                ];
            }
        }

        return Response.json(result, {
            headers: {
                'Cache-Control': 'public, max-age=300',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (err) {
        return Response.json(
            { code: 500, message: '解析失败: ' + err.message },
            { status: 500 }
        );
    }
}
