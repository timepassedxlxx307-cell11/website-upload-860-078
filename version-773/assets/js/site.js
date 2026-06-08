(function () {
    var body = document.body;
    var menuButton = document.querySelector('[data-menu-toggle]');
    if (menuButton) {
        menuButton.addEventListener('click', function () {
            body.classList.toggle('menu-open');
        });
    }

    document.querySelectorAll('[data-search-form]').forEach(function (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            var input = form.querySelector('input');
            var query = input ? input.value.trim() : '';
            var prefix = form.getAttribute('data-prefix') || './';
            var target = prefix + 'search.html';
            if (query) {
                target += '?q=' + encodeURIComponent(query);
            }
            window.location.href = target;
        });
    });

    document.querySelectorAll('[data-hero]').forEach(function (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var prev = hero.querySelector('[data-hero-prev]');
        var next = hero.querySelector('[data-hero-next]');
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === index);
            });
        }

        function play() {
            clearInterval(timer);
            timer = setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener('click', function () {
                show(dotIndex);
                play();
            });
        });

        if (prev) {
            prev.addEventListener('click', function () {
                show(index - 1);
                play();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                show(index + 1);
                play();
            });
        }

        show(0);
        play();
    });

    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';
    var searchInput = document.querySelector('[data-search-input]');
    if (searchInput && query) {
        searchInput.value = query;
    }

    document.querySelectorAll('[data-card-container]').forEach(function (container) {
        var scope = container.closest('[data-filter-scope]') || document;
        var input = scope.querySelector('[data-search-input]');
        var filters = Array.prototype.slice.call(scope.querySelectorAll('[data-filter-field]'));
        var cards = Array.prototype.slice.call(container.querySelectorAll('[data-movie-card]'));
        var empty = scope.querySelector('[data-empty-state]');

        function matches(card) {
            var text = (card.getAttribute('data-search') || card.textContent || '').toLowerCase();
            var term = input ? input.value.trim().toLowerCase() : '';
            if (term && text.indexOf(term) === -1) {
                return false;
            }
            return filters.every(function (select) {
                var value = select.value;
                var field = select.getAttribute('data-filter-field');
                if (!value || !field) {
                    return true;
                }
                return (card.getAttribute(field) || '') === value;
            });
        }

        function apply() {
            var visible = 0;
            cards.forEach(function (card) {
                var ok = matches(card);
                card.hidden = !ok;
                if (ok) {
                    visible += 1;
                }
            });
            if (empty) {
                empty.classList.toggle('is-visible', visible === 0);
            }
        }

        if (input) {
            input.addEventListener('input', apply);
        }
        filters.forEach(function (select) {
            select.addEventListener('change', apply);
        });
        apply();
    });
})();
