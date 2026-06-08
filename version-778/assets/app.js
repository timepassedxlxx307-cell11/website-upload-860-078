(() => {
  const ready = (fn) => {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  };

  const normalize = (value) => (value || '').toString().trim().toLowerCase();

  ready(() => {
    document.querySelectorAll('[data-menu-toggle]').forEach((button) => {
      const nav = document.querySelector('[data-mobile-nav]');
      button.addEventListener('click', () => {
        if (nav) {
          nav.classList.toggle('open');
        }
      });
    });

    document.querySelectorAll('[data-hero]').forEach((hero) => {
      const slides = Array.from(hero.querySelectorAll('.hero-slide'));
      const dots = Array.from(hero.querySelectorAll('.hero-dot'));
      const prev = hero.querySelector('[data-hero-prev]');
      const next = hero.querySelector('[data-hero-next]');
      if (!slides.length) {
        return;
      }
      let current = 0;
      let timer = null;
      const show = (index) => {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, i) => slide.classList.toggle('active', i === current));
        dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
      };
      const play = () => {
        clearInterval(timer);
        timer = setInterval(() => show(current + 1), 5000);
      };
      dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
          show(index);
          play();
        });
      });
      if (prev) {
        prev.addEventListener('click', () => {
          show(current - 1);
          play();
        });
      }
      if (next) {
        next.addEventListener('click', () => {
          show(current + 1);
          play();
        });
      }
      show(0);
      play();
    });

    document.querySelectorAll('[data-filter-root]').forEach((root) => {
      const search = root.querySelector('[data-filter-search]');
      const year = root.querySelector('[data-filter-year]');
      const type = root.querySelector('[data-filter-type]');
      const category = root.querySelector('[data-filter-category]');
      const cards = Array.from(root.querySelectorAll('[data-filter-card]'));
      const params = new URLSearchParams(window.location.search);
      if (search && params.get('q')) {
        search.value = params.get('q');
      }
      if (category && params.get('category')) {
        category.value = params.get('category');
      }
      const apply = () => {
        const q = normalize(search && search.value);
        const selectedYear = year ? year.value : '';
        const selectedType = type ? type.value : '';
        const selectedCategory = category ? category.value : '';
        cards.forEach((card) => {
          const text = normalize(card.textContent);
          const passSearch = !q || text.includes(q);
          const passYear = !selectedYear || card.dataset.year === selectedYear;
          const passType = !selectedType || card.dataset.type === selectedType;
          const passCategory = !selectedCategory || card.dataset.category === selectedCategory;
          card.classList.toggle('filter-hidden', !(passSearch && passYear && passType && passCategory));
        });
      };
      [search, year, type, category].forEach((element) => {
        if (element) {
          element.addEventListener('input', apply);
          element.addEventListener('change', apply);
        }
      });
      apply();
    });

    document.querySelectorAll('.js-player').forEach((player) => {
      const video = player.querySelector('video');
      const trigger = player.querySelector('.js-play');
      const streamUrl = player.dataset.stream;
      let attached = false;
      const attach = () => {
        if (attached || !video || !streamUrl) {
          return;
        }
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
          const hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
        } else {
          video.src = streamUrl;
        }
        attached = true;
      };
      const start = () => {
        attach();
        player.classList.add('is-playing');
        if (video) {
          const action = video.play();
          if (action && typeof action.catch === 'function') {
            action.catch(() => {});
          }
        }
      };
      if (trigger) {
        trigger.addEventListener('click', (event) => {
          event.preventDefault();
          start();
        });
      }
      if (video) {
        video.addEventListener('click', () => {
          if (video.paused) {
            start();
          }
        });
      }
    });
  });
})();
