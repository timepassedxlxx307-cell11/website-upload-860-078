(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function buildCard(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');
    return '<a class="movie-card" href="' + escapeAttr(movie.detail) + '" data-card data-index="' + escapeAttr(movie.index) + '">' +
      '<div class="poster-frame">' +
      '<img src="' + escapeAttr(movie.cover) + '" alt="' + escapeAttr(movie.title) + ' 在线观看封面" loading="lazy">' +
      '<div class="poster-shade"></div>' +
      '<span class="card-category">' + escapeHtml(movie.category) + '</span>' +
      '</div>' +
      '<div class="card-body">' +
      '<h3>' + escapeHtml(movie.title) + '</h3>' +
      '<p>' + escapeHtml(movie.oneLine) + '</p>' +
      '<div class="card-meta"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.score) + ' 分</span></div>' +
      '<div class="tag-row">' + tags + '</div>' +
      '</div>' +
      '</a>';
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, function (char) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[char];
    });
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, '&#39;');
  }

  function initMenu() {
    var button = qs('[data-menu-toggle]');
    var panel = qs('[data-mobile-panel]');
    if (!button || !panel) {
      return;
    }
    button.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function initHero() {
    var slider = qs('[data-hero-slider]');
    if (!slider) {
      return;
    }
    var slides = qsa('[data-hero-slide]', slider);
    var dots = qsa('[data-hero-dot]', slider);
    var previous = qs('[data-hero-prev]', slider);
    var next = qs('[data-hero-next]', slider);
    var current = 0;
    var timer;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
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
      }
    }

    if (previous) {
      previous.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        start();
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(parseInt(dot.getAttribute('data-hero-dot'), 10) || 0);
        start();
      });
    });
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initCardFilter() {
    var input = qs('[data-card-filter]');
    var container = qs('[data-card-container]');
    var empty = qs('[data-empty-state]');
    if (!input || !container) {
      return;
    }
    var cards = qsa('[data-card]', container);
    input.addEventListener('input', function () {
      var query = normalize(input.value);
      var visible = 0;
      cards.forEach(function (card) {
        var matched = !query || normalize(card.getAttribute('data-index')).indexOf(query) !== -1;
        card.style.display = matched ? '' : 'none';
        if (matched) {
          visible += 1;
        }
      });
      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    });
  }

  function initSearchPage() {
    var container = qs('[data-search-results]');
    if (!container || !window.MOVIES_INDEX) {
      return;
    }
    var form = qs('[data-search-form]');
    var input = form ? qs('input[name="q"]', form) : null;
    var title = qs('[data-search-title]');
    var summary = qs('[data-search-summary]');
    var empty = qs('[data-search-empty]');
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    if (input) {
      input.value = query;
    }

    function render(value) {
      var keyword = normalize(value);
      var list = window.MOVIES_INDEX.filter(function (movie) {
        return !keyword || normalize(movie.index).indexOf(keyword) !== -1;
      }).slice(0, 240);
      if (!keyword) {
        list = window.MOVIES_INDEX.slice(0, 48);
      }
      container.innerHTML = list.map(buildCard).join('');
      if (title) {
        title.textContent = keyword ? '搜索结果' : '热门影片';
      }
      if (summary) {
        summary.textContent = keyword ? '与关键词相关的影片' : '精选热门影片推荐';
      }
      if (empty) {
        empty.classList.toggle('is-visible', list.length === 0);
      }
    }

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var value = input ? input.value : '';
        var nextUrl = value ? 'search.html?q=' + encodeURIComponent(value) : 'search.html';
        window.history.replaceState(null, '', nextUrl);
        render(value);
      });
    }
    render(query);
  }

  function initPlayers() {
    qsa('[data-video-player]').forEach(function (player) {
      var video = qs('video', player);
      var overlay = qs('[data-play-button]', player);
      var stream = player.getAttribute('data-stream');
      var attached = false;
      var hlsInstance = null;
      if (!video || !stream) {
        return;
      }

      function attach() {
        if (attached) {
          return;
        }
        attached = true;
        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(stream);
          hlsInstance.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = stream;
        } else {
          video.src = stream;
        }
      }

      function play() {
        attach();
        var promise = video.play();
        if (promise && typeof promise.then === 'function') {
          promise.then(function () {
            player.classList.add('is-playing');
          }).catch(function () {
            player.classList.remove('is-playing');
          });
        } else {
          player.classList.add('is-playing');
        }
      }

      if (overlay) {
        overlay.addEventListener('click', play);
      }
      video.addEventListener('click', function () {
        if (video.paused) {
          play();
        } else {
          video.pause();
        }
      });
      video.addEventListener('play', function () {
        player.classList.add('is-playing');
      });
      video.addEventListener('pause', function () {
        if (!video.seeking && video.currentTime === 0) {
          player.classList.remove('is-playing');
        }
      });
      window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMenu();
    initHero();
    initCardFilter();
    initSearchPage();
    initPlayers();
  });
})();
