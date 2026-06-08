(function () {
  function selectAll(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function initNavigation() {
    var button = document.querySelector('.nav-toggle');
    var nav = document.getElementById('siteNav');
    if (!button || !nav) {
      return;
    }
    button.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function initHero() {
    var hero = document.querySelector('.hero-carousel');
    if (!hero) {
      return;
    }
    var slides = selectAll('.hero-slide', hero);
    var dots = selectAll('.hero-dot', hero);
    var prev = hero.querySelector('.hero-prev');
    var next = hero.querySelector('.hero-next');
    var active = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, position) {
        slide.classList.toggle('is-active', position === active);
      });
      dots.forEach(function (dot, position) {
        dot.classList.toggle('is-active', position === active);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(active + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(active - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(active + 1);
        start();
      });
    }
    dots.forEach(function (dot, position) {
      dot.addEventListener('click', function () {
        show(position);
        start();
      });
    });
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initFilters() {
    selectAll('.filter-panel').forEach(function (panel) {
      var container = panel.parentElement;
      var cards = selectAll('.movie-card', container);
      var search = panel.querySelector('.filter-search');
      var region = panel.querySelector('.filter-region');
      var type = panel.querySelector('.filter-type');
      var year = panel.querySelector('.filter-year');
      var category = panel.querySelector('.filter-category');
      var reset = panel.querySelector('.filter-reset');
      var parameters = new URLSearchParams(window.location.search);
      var initialQuery = parameters.get('q');
      if (initialQuery && search) {
        search.value = initialQuery;
      }

      function matches(card) {
        var text = [card.dataset.title, card.dataset.region, card.dataset.type, card.dataset.year, card.dataset.genre, card.dataset.tags].join(' ').toLowerCase();
        var query = search ? search.value.trim().toLowerCase() : '';
        var regionValue = region ? region.value : '';
        var typeValue = type ? type.value : '';
        var yearValue = year ? year.value : '';
        var categoryValue = category ? category.value : '';
        if (query && text.indexOf(query) === -1) {
          return false;
        }
        if (regionValue && card.dataset.region !== regionValue) {
          return false;
        }
        if (typeValue && card.dataset.type !== typeValue) {
          return false;
        }
        if (yearValue && card.dataset.year !== yearValue) {
          return false;
        }
        if (categoryValue) {
          var pill = card.querySelector('.category-pill');
          if (!pill || pill.textContent.trim() !== categoryValue) {
            return false;
          }
        }
        return true;
      }

      function apply() {
        cards.forEach(function (card) {
          card.classList.toggle('is-hidden', !matches(card));
        });
      }

      [search, region, type, year, category].forEach(function (control) {
        if (!control) {
          return;
        }
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      });
      if (reset) {
        reset.addEventListener('click', function () {
          [search, region, type, year, category].forEach(function (control) {
            if (control) {
              control.value = '';
            }
          });
          apply();
        });
      }
      apply();
    });
  }

  function initPlayer() {
    var video = document.getElementById('mainPlayer');
    var shell = document.querySelector('.video-shell');
    if (!video || !shell || !window.__STREAM_URL__) {
      return;
    }
    var center = document.getElementById('startPlay');
    var togglePlay = document.getElementById('togglePlay');
    var toggleMute = document.getElementById('toggleMute');
    var toggleFullscreen = document.getElementById('toggleFullscreen');
    var progress = document.getElementById('progressBar');
    var initialized = false;
    var hls = null;

    function initializeStream() {
      if (initialized) {
        return;
      }
      initialized = true;
      shell.classList.add('is-loading');
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = window.__STREAM_URL__;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(window.__STREAM_URL__);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          shell.classList.remove('is-loading');
        });
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (!data || !data.fatal || !hls) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            shell.classList.remove('is-loading');
          }
        });
      } else {
        video.src = window.__STREAM_URL__;
      }
    }

    function playVideo() {
      initializeStream();
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          shell.classList.add('is-paused');
          shell.classList.remove('is-playing');
        });
      }
    }

    function toggle() {
      if (video.paused) {
        playVideo();
      } else {
        video.pause();
      }
    }

    function updateState() {
      var paused = video.paused;
      shell.classList.toggle('is-playing', !paused);
      shell.classList.toggle('is-paused', paused);
      if (togglePlay) {
        togglePlay.textContent = paused ? '播放' : '暂停';
      }
    }

    function updateProgress() {
      if (!progress || !video.duration) {
        return;
      }
      var value = Math.min(100, Math.max(0, video.currentTime / video.duration * 100));
      progress.style.width = value + '%';
    }

    video.addEventListener('click', toggle);
    video.addEventListener('playing', function () {
      shell.classList.remove('is-loading');
      updateState();
    });
    video.addEventListener('waiting', function () {
      shell.classList.add('is-loading');
    });
    video.addEventListener('canplay', function () {
      shell.classList.remove('is-loading');
    });
    video.addEventListener('pause', updateState);
    video.addEventListener('play', updateState);
    video.addEventListener('timeupdate', updateProgress);

    if (center) {
      center.addEventListener('click', playVideo);
    }
    if (togglePlay) {
      togglePlay.addEventListener('click', toggle);
    }
    if (toggleMute) {
      toggleMute.addEventListener('click', function () {
        video.muted = !video.muted;
        toggleMute.textContent = video.muted ? '取消静音' : '静音';
      });
    }
    if (toggleFullscreen) {
      toggleFullscreen.addEventListener('click', function () {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (shell.requestFullscreen) {
          shell.requestFullscreen();
        }
      });
    }
    window.addEventListener('pagehide', function () {
      if (hls) {
        hls.destroy();
        hls = null;
      }
    });
    updateState();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initHero();
    initFilters();
    initPlayer();
  });
}());
