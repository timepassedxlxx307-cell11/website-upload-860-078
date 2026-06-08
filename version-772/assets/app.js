(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    function initNav() {
        var toggle = document.querySelector("[data-nav-toggle]");
        var panel = document.querySelector("[data-mobile-panel]");
        if (!toggle || !panel) {
            return;
        }
        toggle.addEventListener("click", function () {
            panel.classList.toggle("open");
        });
    }

    function initHero() {
        var root = document.querySelector("[data-hero]");
        if (!root) {
            return;
        }
        var slides = Array.prototype.slice.call(root.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
        var prev = root.querySelector("[data-hero-prev]");
        var next = root.querySelector("[data-hero-next]");
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, position) {
                slide.classList.toggle("active", position === current);
            });
            dots.forEach(function (dot, position) {
                dot.classList.toggle("active", position === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        if (prev) {
            prev.addEventListener("click", function () {
                show(current - 1);
                start();
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                show(current + 1);
                start();
            });
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                start();
            });
        });

        root.addEventListener("mouseenter", stop);
        root.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function initFiltering() {
        var input = document.querySelector("[data-search-input]");
        var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-card]"));
        var active = "all";

        if (!cards.length) {
            return;
        }

        function apply() {
            var query = input ? input.value.trim().toLowerCase() : "";
            cards.forEach(function (card) {
                var category = card.getAttribute("data-category") || "";
                var text = (card.getAttribute("data-search") || "").toLowerCase();
                var categoryMatch = active === "all" || category === active;
                var textMatch = !query || text.indexOf(query) !== -1;
                card.classList.toggle("hidden", !(categoryMatch && textMatch));
            });
        }

        if (input) {
            input.addEventListener("input", apply);
        }

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                active = button.getAttribute("data-filter") || "all";
                buttons.forEach(function (item) {
                    item.classList.toggle("active", item === button);
                });
                apply();
            });
        });

        apply();
    }

    function initPlayer() {
        var frame = document.querySelector("[data-player]");
        if (!frame) {
            return;
        }
        var video = frame.querySelector("video");
        var overlay = frame.querySelector(".player-overlay");
        if (!video || !overlay) {
            return;
        }
        var hlsUrl = video.getAttribute("data-hls");
        var hlsInstance = null;
        var attached = false;

        function playVideo() {
            overlay.classList.add("hidden");
            var playAttempt = video.play();
            if (playAttempt && typeof playAttempt.catch === "function") {
                playAttempt.catch(function () {
                    overlay.classList.remove("hidden");
                });
            }
        }

        function attachAndPlay() {
            if (!hlsUrl) {
                return;
            }
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                if (!video.getAttribute("src")) {
                    video.setAttribute("src", hlsUrl);
                }
                playVideo();
                return;
            }
            if (window.Hls && window.Hls.isSupported()) {
                if (!attached) {
                    hlsInstance = new window.Hls();
                    hlsInstance.loadSource(hlsUrl);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, playVideo);
                    attached = true;
                } else {
                    playVideo();
                }
                return;
            }
            if (!video.getAttribute("src")) {
                video.setAttribute("src", hlsUrl);
            }
            playVideo();
        }

        overlay.addEventListener("click", attachAndPlay);
        video.addEventListener("click", function () {
            if (video.paused) {
                attachAndPlay();
            }
        });
        video.addEventListener("play", function () {
            overlay.classList.add("hidden");
        });
        video.addEventListener("pause", function () {
            if (!video.ended) {
                overlay.classList.remove("hidden");
            }
        });
        window.addEventListener("beforeunload", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    }

    ready(function () {
        initNav();
        initHero();
        initFiltering();
        initPlayer();
    });
})();
