(function () {
    var hlsPromise = null;

    function loadHls() {
        if (window.Hls) {
            return Promise.resolve(window.Hls);
        }
        if (hlsPromise) {
            return hlsPromise;
        }
        hlsPromise = new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js';
            script.async = true;
            script.onload = function () {
                resolve(window.Hls);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
        return hlsPromise;
    }

    function setStatus(panel, message) {
        var status = panel.querySelector('[data-player-status]');
        if (status) {
            status.textContent = message;
        }
    }

    function startPlayer(panel) {
        if (panel.getAttribute('data-started') === 'true') {
            var existingVideo = panel.querySelector('video');
            if (existingVideo) {
                existingVideo.play().catch(function () {});
            }
            return;
        }

        var video = panel.querySelector('video');
        var playUrl = panel.getAttribute('data-play-url');
        if (!video || !playUrl) {
            setStatus(panel, '播放线路暂时不可用');
            return;
        }

        panel.setAttribute('data-started', 'true');
        panel.classList.add('is-playing');
        setStatus(panel, '正在加载播放线路');

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = playUrl;
            video.addEventListener('loadedmetadata', function () {
                setStatus(panel, '');
                video.play().catch(function () {});
            }, { once: true });
            video.load();
            return;
        }

        loadHls().then(function (Hls) {
            if (Hls && Hls.isSupported()) {
                var hls = new Hls({ enableWorker: true, lowLatencyMode: true });
                hls.loadSource(playUrl);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, function () {
                    setStatus(panel, '');
                    video.play().catch(function () {});
                });
                hls.on(Hls.Events.ERROR, function (event, data) {
                    if (data && data.fatal) {
                        setStatus(panel, '播放线路暂时繁忙，请稍后重试');
                    }
                });
                panel.hlsInstance = hls;
            } else {
                video.src = playUrl;
                video.load();
                video.play().catch(function () {
                    setStatus(panel, '播放线路暂时繁忙，请稍后重试');
                });
            }
        }).catch(function () {
            video.src = playUrl;
            video.load();
            video.play().catch(function () {
                setStatus(panel, '播放线路暂时繁忙，请稍后重试');
            });
        });
    }

    document.querySelectorAll('[data-player]').forEach(function (panel) {
        var button = panel.querySelector('[data-play-button]');
        if (button) {
            button.addEventListener('click', function (event) {
                event.stopPropagation();
                startPlayer(panel);
            });
        }
        panel.addEventListener('click', function (event) {
            if (event.target && event.target.tagName && event.target.tagName.toLowerCase() === 'video') {
                return;
            }
            startPlayer(panel);
        });
    });
})();
