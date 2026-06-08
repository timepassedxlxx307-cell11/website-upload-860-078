(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function initMenu() {
        var toggle = document.querySelector("[data-menu-toggle]");
        var menu = document.querySelector("[data-mobile-menu]");
        if (!toggle || !menu) {
            return;
        }
        toggle.addEventListener("click", function () {
            menu.classList.toggle("open");
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
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("active", slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("active", dotIndex === index);
            });
        }

        function play() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                play();
            });
        });

        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                play();
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                play();
            });
        }

        hero.addEventListener("mouseenter", stop);
        hero.addEventListener("mouseleave", play);
        show(0);
        play();
    }

    function initLocalFilter() {
        var input = document.querySelector("[data-local-search]");
        if (!input) {
            return;
        }
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-card]"));
        var reset = document.querySelector("[data-filter-reset]");

        function normalize(value) {
            return String(value || "").trim().toLowerCase();
        }

        function filter() {
            var keyword = normalize(input.value);
            cards.forEach(function (card) {
                var text = [
                    card.getAttribute("data-title"),
                    card.getAttribute("data-genre"),
                    card.getAttribute("data-region"),
                    card.getAttribute("data-year"),
                    card.getAttribute("data-type"),
                    card.textContent
                ].join(" ").toLowerCase();
                card.classList.toggle("card-hidden", keyword && text.indexOf(keyword) === -1);
            });
        }

        input.addEventListener("input", filter);
        if (reset) {
            reset.addEventListener("click", function () {
                input.value = "";
                filter();
                input.focus();
            });
        }
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function cardTemplate(movie) {
        return [
            '<article class="movie-card" data-card>',
            '<a class="movie-cover" href="' + escapeHtml(movie.href) + '" aria-label="' + escapeHtml(movie.title) + '">',
            '<img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
            '<span class="movie-cover-shade"></span>',
            '<span class="play-mini">▶</span>',
            '</a>',
            '<div class="movie-card-body">',
            '<div class="movie-card-meta"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.type) + '</span><span>' + escapeHtml(movie.score) + '</span></div>',
            '<h3><a href="' + escapeHtml(movie.href) + '">' + escapeHtml(movie.title) + '</a></h3>',
            '<p>' + escapeHtml(movie.oneLine) + '</p>',
            '<div class="tag-row"><span>' + escapeHtml(movie.genre) + '</span><span>' + escapeHtml(movie.region) + '</span></div>',
            '</div>',
            '</article>'
        ].join("");
    }

    function initGlobalSearch() {
        var input = document.querySelector("[data-global-search]");
        var button = document.querySelector("[data-global-search-button]");
        var results = document.querySelector("[data-search-results]");
        var title = document.querySelector("[data-search-title]");
        var index = window.MOVIE_SEARCH_INDEX || [];
        if (!input || !results || !index.length) {
            return;
        }

        function normalize(value) {
            return String(value || "").trim().toLowerCase();
        }

        function render(list, keyword) {
            var selected = list.slice(0, 120);
            results.innerHTML = selected.map(cardTemplate).join("");
            if (title) {
                title.textContent = keyword ? "搜索结果" : "热门搜索推荐";
            }
        }

        function search() {
            var keyword = normalize(input.value);
            if (!keyword) {
                render(index.slice(0, 24), "");
                return;
            }
            var matched = index.filter(function (movie) {
                var haystack = [
                    movie.title,
                    movie.genre,
                    movie.region,
                    movie.year,
                    movie.type,
                    movie.category,
                    movie.tags,
                    movie.oneLine
                ].join(" ").toLowerCase();
                return haystack.indexOf(keyword) !== -1;
            });
            render(matched, keyword);
        }

        input.addEventListener("input", search);
        if (button) {
            button.addEventListener("click", search);
        }

        var params = new URLSearchParams(window.location.search);
        var query = params.get("q");
        if (query) {
            input.value = query;
            search();
        }
    }

    function initPlayers() {
        var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));
        players.forEach(function (player) {
            var video = player.querySelector("video");
            var button = player.querySelector("[data-play-button]");
            var src = player.getAttribute("data-src") || (video && video.getAttribute("data-src"));
            var hls = null;

            if (!video || !src) {
                return;
            }

            function attachSource() {
                if (video.getAttribute("data-ready") === "true") {
                    return;
                }
                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = src;
                } else if (window.Hls && window.Hls.isSupported()) {
                    hls = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: false
                    });
                    hls.loadSource(src);
                    hls.attachMedia(video);
                } else {
                    video.src = src;
                }
                video.setAttribute("data-ready", "true");
            }

            function playVideo() {
                attachSource();
                player.classList.add("is-playing");
                var playPromise = video.play();
                if (playPromise && typeof playPromise.catch === "function") {
                    playPromise.catch(function () {
                        player.classList.remove("is-playing");
                    });
                }
            }

            if (button) {
                button.addEventListener("click", playVideo);
            }

            video.addEventListener("play", function () {
                player.classList.add("is-playing");
            });

            video.addEventListener("pause", function () {
                if (video.currentTime === 0 || video.ended) {
                    player.classList.remove("is-playing");
                }
            });

            window.addEventListener("beforeunload", function () {
                if (hls && typeof hls.destroy === "function") {
                    hls.destroy();
                }
            });
        });
    }

    ready(function () {
        initMenu();
        initHero();
        initLocalFilter();
        initGlobalSearch();
        initPlayers();
    });
})();
