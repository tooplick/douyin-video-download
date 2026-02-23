// ============================================
// 抖音视频下载 — 前端逻辑
// ============================================

let currentData = null;
let selectedQualityIndex = 0;

// 解析视频
async function parseVideo() {
    const input = document.getElementById('urlInput');
    const btn = document.getElementById('parseBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    const errorMsg = document.getElementById('errorMsg');
    const resultSection = document.getElementById('resultSection');

    const url = input.value.trim();
    if (!url) {
        showError('请输入抖音链接');
        return;
    }

    // 进入加载状态
    btn.disabled = true;
    btnText.textContent = '解析中';
    btnLoader.style.display = 'inline-block';
    errorMsg.style.display = 'none';
    resultSection.style.display = 'none';

    try {
        const resp = await fetch(`/api/parse?url=${encodeURIComponent(url)}`);
        const json = await resp.json();

        if (json.code !== 200 || !json.data) {
            showError(json.message || '解析失败，请检查链接');
            return;
        }

        currentData = json.data;
        selectedQualityIndex = 0;

        if (currentData.type === 'images') {
            renderImageResult(currentData);
        } else {
            renderVideoResult(currentData);
        }

        resultSection.style.display = 'block';
    } catch (err) {
        showError('网络错误，请稍后重试');
        console.error(err);
    } finally {
        btn.disabled = false;
        btnText.textContent = '解析';
        btnLoader.style.display = 'none';
    }
}

// 渲染视频结果
function renderVideoResult(data) {
    document.getElementById('videoResult').style.display = 'block';
    document.getElementById('imageResult').style.display = 'none';

    // 作者信息
    const avatar = document.getElementById('authorAvatar');
    avatar.src = data.author.avatar;
    avatar.alt = data.author.nickname;
    document.getElementById('authorName').textContent = data.author.nickname;

    // 时长
    if (data.duration) {
        const sec = Math.floor(data.duration / 1000);
        const mm = Math.floor(sec / 60);
        const ss = sec % 60;
        document.getElementById('videoDuration').textContent =
            `${mm}:${String(ss).padStart(2, '0')}`;
    }

    // 标题
    document.getElementById('videoTitle').textContent = data.title;

    // 统计
    setText('#statDigg span', data.stats.digg);
    setText('#statComment span', data.stats.comment);
    setText('#statCollect span', data.stats.collect);
    setText('#statShare span', data.stats.share);

    // 画质列表
    renderQualityList(data.qualities);

    // 设置视频源（默认第一个画质）
    updateVideoSource(0);

    // 设置浏览器媒体卡片信息
    setMediaSession(data);

    // 更新页面标题
    document.title = `${data.title} - 抖音视频下载`;
}

// 渲染画质列表
function renderQualityList(qualities) {
    const container = document.getElementById('qualityList');
    container.innerHTML = '';

    qualities.forEach((q, i) => {
        const item = document.createElement('label');
        item.className = `quality-item${i === 0 ? ' active' : ''}`;
        item.setAttribute('data-index', i);

        const sizeStr = q.size ? formatSize(q.size) : '';

        item.innerHTML = `
      <input type="radio" name="quality" value="${i}" ${i === 0 ? 'checked' : ''}>
      <div class="quality-radio"></div>
      <span class="quality-label">${q.label}</span>
      <div class="quality-meta">
        <span class="quality-codec">${q.codec}</span>
        ${sizeStr ? `<span class="quality-size">${sizeStr}</span>` : ''}
      </div>
    `;

        item.addEventListener('click', () => selectQuality(i));
        container.appendChild(item);
    });
}

// 选择画质
function selectQuality(index) {
    selectedQualityIndex = index;

    // 更新 UI
    document.querySelectorAll('.quality-item').forEach((el, i) => {
        el.classList.toggle('active', i === index);
        el.querySelector('input').checked = i === index;
    });

    updateVideoSource(index);
}

// 更新视频源
function updateVideoSource(index) {
    const video = document.getElementById('videoPlayer');
    const quality = currentData.qualities[index];

    if (!quality) return;

    // 使用代理地址播放以避免跨域
    const proxyUrl = `/api/download?url=${encodeURIComponent(quality.url)}&filename=preview.mp4`;

    // 记住当前播放位置
    const currentTime = video.currentTime;
    const wasPlaying = !video.paused;

    video.poster = currentData.cover || '';
    video.src = proxyUrl;
    video.currentTime = currentTime;

    if (wasPlaying) {
        video.play().catch(() => { });
    }
}

// 下载视频
function downloadVideo() {
    if (!currentData || !currentData.qualities) return;

    const quality = currentData.qualities[selectedQualityIndex];
    if (!quality) return;

    const filename = sanitizeFilename(currentData.title) + `.${quality.format || 'mp4'}`;
    const downloadUrl = `/api/download?url=${encodeURIComponent(quality.url)}&filename=${encodeURIComponent(filename)}`;

    // 使用 <a> 标签触发下载
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// 渲染图集结果
function renderImageResult(data) {
    document.getElementById('videoResult').style.display = 'none';
    document.getElementById('imageResult').style.display = 'block';

    // 作者信息
    const avatar = document.getElementById('imgAuthorAvatar');
    avatar.src = data.author.avatar;
    avatar.alt = data.author.nickname;
    document.getElementById('imgAuthorName').textContent = data.author.nickname;
    document.getElementById('imgTitle').textContent = data.title;

    // 图片画廊
    const gallery = document.getElementById('imageGallery');
    gallery.innerHTML = '';

    data.images.forEach((img, i) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `
      <img src="${img.url}" alt="图片 ${i + 1}" loading="lazy">
      <span class="img-index">${i + 1}</span>
      <button class="img-download-btn" onclick="downloadImage(${i})" title="下载">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>
    `;
        gallery.appendChild(item);
    });
}

// 下载单张图片
function downloadImage(index) {
    if (!currentData || !currentData.images) return;

    const img = currentData.images[index];
    if (!img) return;

    const ext = img.url.includes('.webp') ? 'webp' : 'jpg';
    const filename = `${sanitizeFilename(currentData.title)}_${index + 1}.${ext}`;
    const downloadUrl = `/api/download?url=${encodeURIComponent(img.url)}&filename=${encodeURIComponent(filename)}`;

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// 下载所有图片
function downloadAllImages() {
    if (!currentData || !currentData.images) return;

    currentData.images.forEach((_, i) => {
        setTimeout(() => downloadImage(i), i * 500);
    });
}

// 显示错误
function showError(msg) {
    const el = document.getElementById('errorMsg');
    el.textContent = msg;
    el.style.display = 'block';
}

// 工具函数
function setText(selector, text) {
    const el = document.querySelector(selector);
    if (el) el.textContent = text;
}

function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function sanitizeFilename(name) {
    return (name || 'douyin_video')
        .replace(/[\\/:*?"<>|#]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 80);
}

// 回车触发解析
document.getElementById('urlInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') parseVideo();
});

// 粘贴时自动解析
document.getElementById('urlInput').addEventListener('paste', () => {
    setTimeout(() => {
        const value = document.getElementById('urlInput').value.trim();
        if (value && (value.includes('douyin.com') || value.includes('iesdouyin.com') || value.includes('v.douyin'))) {
            parseVideo();
        }
    }, 100);
});
