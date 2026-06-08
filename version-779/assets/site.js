(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  ready(function () {
    setupMobileMenu();
    setupHeroCarousel();
    setupFilters();
    setupPlayers();
  });

  function setupMobileMenu() {
    var button = document.querySelector('.mobile-menu-button');
    var menu = document.querySelector('.mobile-menu');
    if (!button || !menu) {
      return;
    }

    button.addEventListener('click', function () {
      var isHidden = menu.classList.contains('hidden');
      menu.classList.toggle('hidden', !isHidden);
      button.setAttribute('aria-expanded', String(isHidden));
      var icon = button.querySelector('.menu-icon');
      if (icon) {
        icon.textContent = isHidden ? '×' : '☰';
      }
    });
  }

  function setupHeroCarousel() {
    var root = document.querySelector('[data-hero-carousel]');
    if (!root) {
      return;
    }

    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));
    var prev = root.querySelector('[data-hero-prev]');
    var next = root.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
        restart();
      });
    });

    show(0);
    restart();
  }

  function setupFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-filter-panel]'));
    panels.forEach(function (panel) {
      var input = panel.querySelector('[data-filter-search]');
      var year = panel.querySelector('[data-filter-year]');
      var region = panel.querySelector('[data-filter-region]');
      var category = panel.querySelector('[data-filter-category]');
      var targetSelector = panel.getAttribute('data-filter-target');
      var noResultsSelector = panel.getAttribute('data-filter-empty');
      var targets = Array.prototype.slice.call(document.querySelectorAll(targetSelector));
      var noResults = noResultsSelector ? document.querySelector(noResultsSelector) : null;

      function valueOf(element) {
        return element ? element.value.trim().toLowerCase() : '';
      }

      function apply() {
        var query = valueOf(input);
        var yearValue = valueOf(year);
        var regionValue = valueOf(region);
        var categoryValue = valueOf(category);
        var visible = 0;

        targets.forEach(function (card) {
          var text = [
            card.getAttribute('data-title'),
            card.getAttribute('data-region'),
            card.getAttribute('data-genre'),
            card.getAttribute('data-category'),
            card.getAttribute('data-year')
          ].join(' ').toLowerCase();
          var match = true;

          if (query && text.indexOf(query) === -1) {
            match = false;
          }
          if (yearValue && card.getAttribute('data-year') !== yearValue) {
            match = false;
          }
          if (regionValue && String(card.getAttribute('data-region')).toLowerCase().indexOf(regionValue) === -1) {
            match = false;
          }
          if (categoryValue && String(card.getAttribute('data-category')).toLowerCase() !== categoryValue) {
            match = false;
          }

          card.classList.toggle('is-hidden', !match);
          if (match) {
            visible += 1;
          }
        });

        if (noResults) {
          noResults.classList.toggle('is-visible', visible === 0);
        }
      }

      [input, year, region, category].forEach(function (element) {
        if (element) {
          element.addEventListener('input', apply);
          element.addEventListener('change', apply);
        }
      });

      var params = new URLSearchParams(window.location.search);
      if (input && params.get('q')) {
        input.value = params.get('q');
      }
      apply();
    });
  }

  function setupPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
    players.forEach(function (stage) {
      var video = stage.querySelector('video');
      var playButton = stage.querySelector('[data-player-play]');
      var muteButton = stage.querySelector('[data-player-mute]');
      var volume = stage.querySelector('[data-player-volume]');
      var fullscreen = stage.querySelector('[data-player-fullscreen]');
      var source = stage.getAttribute('data-video-src');
      var hls = null;
      var hasLoaded = false;

      if (!video || !source) {
        return;
      }

      function load() {
        if (hasLoaded) {
          return;
        }
        hasLoaded = true;

        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(source);
          hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
        } else {
          video.src = source;
        }
      }

      function updatePlayState() {
        if (playButton) {
          playButton.textContent = video.paused ? '▶' : 'Ⅱ';
        }
      }

      function togglePlay() {
        load();
        if (video.paused) {
          var promise = video.play();
          if (promise && typeof promise.catch === 'function') {
            promise.catch(function () {});
          }
        } else {
          video.pause();
        }
      }

      if (playButton) {
        playButton.addEventListener('click', togglePlay);
      }
      video.addEventListener('click', togglePlay);
      video.addEventListener('play', updatePlayState);
      video.addEventListener('pause', updatePlayState);
      video.addEventListener('ended', updatePlayState);

      if (muteButton) {
        muteButton.addEventListener('click', function () {
          video.muted = !video.muted;
          muteButton.textContent = video.muted ? '🔇' : '🔊';
        });
      }

      if (volume) {
        volume.addEventListener('input', function () {
          video.volume = Number(volume.value);
          if (video.volume === 0) {
            video.muted = true;
          } else if (video.muted) {
            video.muted = false;
          }
          if (muteButton) {
            muteButton.textContent = video.muted ? '🔇' : '🔊';
          }
        });
      }

      if (fullscreen) {
        fullscreen.addEventListener('click', function () {
          if (stage.requestFullscreen) {
            stage.requestFullscreen();
          } else if (video.webkitEnterFullscreen) {
            video.webkitEnterFullscreen();
          }
        });
      }

      window.addEventListener('beforeunload', function () {
        if (hls) {
          hls.destroy();
        }
      });

      updatePlayState();
    });
  }
})();
