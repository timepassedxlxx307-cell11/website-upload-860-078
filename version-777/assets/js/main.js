(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    function initMenu() {
        var button = document.querySelector(".mobile-menu-button");
        var panel = document.querySelector(".mobile-panel");
        if (!button || !panel) {
            return;
        }
        button.addEventListener("click", function () {
            var open = panel.classList.toggle("open");
            button.setAttribute("aria-expanded", open ? "true" : "false");
            button.textContent = open ? "×" : "☰";
        });
    }

    function initHero() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var prev = hero.querySelector("[data-hero-prev]");
        var next = hero.querySelector("[data-hero-next]");
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("active", i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("active", i === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
            }
        }

        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                start();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                start();
            });
        }
        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(parseInt(dot.getAttribute("data-hero-dot"), 10));
                start();
            });
        });
        hero.addEventListener("mouseenter", stop);
        hero.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function normalize(text) {
        return (text || "").toString().toLowerCase().trim();
    }

    function initCatalog() {
        var lists = Array.prototype.slice.call(document.querySelectorAll(".catalog-list"));
        if (!lists.length) {
            return;
        }
        var filterInput = document.querySelector("#searchInput") || document.querySelector(".catalog-filter");
        var sortSelect = document.querySelector(".catalog-sort");
        var emptyState = document.querySelector(".empty-state");
        var params = new URLSearchParams(window.location.search);
        var query = params.get("q") || "";

        if (filterInput && query) {
            filterInput.value = query;
        }

        function filterCards() {
            var needle = normalize(filterInput ? filterInput.value : "");
            var visible = 0;
            lists.forEach(function (list) {
                Array.prototype.slice.call(list.querySelectorAll(".catalog-card")).forEach(function (card) {
                    var haystack = normalize([
                        card.getAttribute("data-title"),
                        card.getAttribute("data-region"),
                        card.getAttribute("data-year"),
                        card.getAttribute("data-tags")
                    ].join(" "));
                    var matched = !needle || haystack.indexOf(needle) !== -1;
                    card.classList.toggle("hidden-card", !matched);
                    if (matched) {
                        visible += 1;
                    }
                });
            });
            if (emptyState) {
                emptyState.hidden = visible !== 0;
            }
        }

        function sortCards() {
            if (!sortSelect) {
                return;
            }
            var mode = sortSelect.value;
            lists.forEach(function (list) {
                var cards = Array.prototype.slice.call(list.querySelectorAll(".catalog-card"));
                cards.sort(function (a, b) {
                    if (mode === "year") {
                        return parseInt(b.getAttribute("data-year"), 10) - parseInt(a.getAttribute("data-year"), 10);
                    }
                    if (mode === "title") {
                        return (a.getAttribute("data-title") || "").localeCompare(b.getAttribute("data-title") || "", "zh-Hans-CN");
                    }
                    return parseInt(b.getAttribute("data-score"), 10) - parseInt(a.getAttribute("data-score"), 10);
                });
                cards.forEach(function (card) {
                    list.appendChild(card);
                });
            });
            filterCards();
        }

        if (filterInput) {
            filterInput.addEventListener("input", filterCards);
        }
        if (sortSelect) {
            sortSelect.addEventListener("change", sortCards);
        }
        sortCards();
        filterCards();
    }

    function initPlayer() {
        var player = document.querySelector(".player-card");
        if (!player) {
            return;
        }
        var video = player.querySelector("video");
        var source = player.getAttribute("data-player-source");
        var bigButton = player.querySelector(".player-big-button");
        var playButton = player.querySelector(".play-control");
        var muteButton = player.querySelector(".mute-control");
        var fullscreenButton = player.querySelector(".fullscreen-control");
        var hlsInstance = null;
        var loaded = false;

        function load() {
            if (loaded || !video || !source) {
                return;
            }
            loaded = true;
            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hlsInstance.loadSource(source);
                hlsInstance.attachMedia(video);
                hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                    if (!data || !data.fatal) {
                        return;
                    }
                    if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                        hlsInstance.startLoad();
                    } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                        hlsInstance.recoverMediaError();
                    } else {
                        hlsInstance.destroy();
                    }
                });
            } else {
                video.src = source;
            }
        }

        function play() {
            load();
            var promise = video.play();
            if (promise && promise.catch) {
                promise.catch(function () {});
            }
        }

        function togglePlay() {
            if (video.paused || video.ended) {
                play();
            } else {
                video.pause();
            }
        }

        if (bigButton) {
            bigButton.addEventListener("click", togglePlay);
        }
        if (playButton) {
            playButton.addEventListener("click", togglePlay);
        }
        if (video) {
            video.addEventListener("click", togglePlay);
            video.addEventListener("play", function () {
                player.classList.add("is-playing");
                if (playButton) {
                    playButton.textContent = "暂停";
                }
            });
            video.addEventListener("pause", function () {
                player.classList.remove("is-playing");
                if (playButton) {
                    playButton.textContent = "▶";
                }
            });
        }
        if (muteButton) {
            muteButton.addEventListener("click", function () {
                video.muted = !video.muted;
                muteButton.textContent = video.muted ? "静音" : "音量";
            });
        }
        if (fullscreenButton) {
            fullscreenButton.addEventListener("click", function () {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else if (player.requestFullscreen) {
                    player.requestFullscreen();
                }
            });
        }
        window.addEventListener("beforeunload", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    }

    ready(function () {
        initMenu();
        initHero();
        initCatalog();
        initPlayer();
    });
})();
