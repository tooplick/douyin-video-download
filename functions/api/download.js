// 代理下载视频/图片，解决跨域问题
export async function onRequestGet(context) {
    const { request } = context;
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    const filename = url.searchParams.get('filename') || 'douyin_video.mp4';

    if (!targetUrl) {
        return Response.json(
            { code: 400, message: '请提供下载地址' },
            { status: 400 }
        );
    }

    try {
        const resp = await fetch(targetUrl, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                Referer: 'https://www.douyin.com/',
            },
            redirect: 'follow',
        });

        if (!resp.ok) {
            return Response.json(
                { code: resp.status, message: '资源获取失败' },
                { status: 502 }
            );
        }

        // 流式转发，避免内存占用过大
        const headers = new Headers({
            'Content-Type':
                resp.headers.get('Content-Type') || 'application/octet-stream',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
            'Access-Control-Allow-Origin': '*',
        });

        const contentLength = resp.headers.get('Content-Length');
        if (contentLength) {
            headers.set('Content-Length', contentLength);
        }

        return new Response(resp.body, {
            status: 200,
            headers,
        });
    } catch (err) {
        return Response.json(
            { code: 500, message: '下载失败: ' + err.message },
            { status: 500 }
        );
    }
}
