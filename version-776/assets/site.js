(function () {
  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function one(selector, root) {
    return (root || document).querySelector(selector);
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
      }[char];
    });
  }

  function setupMobileMenu() {
    var toggle = one("[data-mobile-toggle]");
    var panel = one("[data-mobile-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.classList.toggle("is-open");
      document.body.classList.toggle("locked", panel.classList.contains("is-open"));
    });
  }

  function setupHero() {
    var hero = one("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = all(".hero-slide", hero);
    var dots = all(".hero-dot", hero);
    var prev = one("[data-hero-prev]", hero);
    var next = one("[data-hero-next]", hero);
    var index = 0;
    var timer;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    function play() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

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
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        play();
      });
    });
    show(0);
    play();
  }

  function setupCardFilter() {
    all("[data-card-filter]").forEach(function (input) {
      var target = document.querySelector(input.getAttribute("data-card-filter"));
      if (!target) {
        return;
      }
      input.addEventListener("input", function () {
        var keyword = input.value.trim().toLowerCase();
        all(".movie-card, .ranking-item", target).forEach(function (card) {
          var text = card.textContent.toLowerCase();
          card.style.display = text.indexOf(keyword) >= 0 ? "" : "none";
        });
      });
    });
  }

  function setupSort() {
    all("[data-sort-cards]").forEach(function (select) {
      var target = document.querySelector(select.getAttribute("data-sort-cards"));
      if (!target) {
        return;
      }
      select.addEventListener("change", function () {
        var value = select.value;
        var cards = all(".movie-card, .ranking-item", target);
        cards.sort(function (a, b) {
          if (value === "title") {
            return String(a.dataset.title || "").localeCompare(String(b.dataset.title || ""), "zh-Hans-CN");
          }
          if (value === "year") {
            return Number(b.dataset.year || 0) - Number(a.dataset.year || 0);
          }
          return Number(a.dataset.rank || 0) - Number(b.dataset.rank || 0);
        });
        cards.forEach(function (card) {
          target.appendChild(card);
        });
      });
    });
  }

  function setupPlayer() {
    var video = one("video[data-hls-src]");
    if (!video) {
      return;
    }
    var button = one("[data-play-video]");
    var box = video.closest(".video-box");
    var src = video.getAttribute("data-hls-src");
    var attached = false;

    function attach() {
      if (attached || !src) {
        return;
      }
      attached = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        return;
      }
      video.src = src;
    }

    function playVideo() {
      attach();
      var result = video.play();
      if (result && result.catch) {
        result.catch(function () {});
      }
    }

    if (button) {
      button.addEventListener("click", playVideo);
    }
    video.addEventListener("click", playVideo);
    video.addEventListener("play", function () {
      if (box) {
        box.classList.add("is-playing");
      }
    });
    video.addEventListener("pause", function () {
      if (box) {
        box.classList.remove("is-playing");
      }
    });
  }

  function searchCard(item) {
    var tags = (item.tags || []).slice(0, 3).map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");
    return "<article class=\"movie-card\" data-title=\"" + escapeHtml(item.title) + "\" data-year=\"" + escapeHtml(item.year) + "\" data-rank=\"" + escapeHtml(item.index) + "\">" +
      "<a class=\"poster-link\" href=\"" + escapeHtml(item.file) + "\" aria-label=\"" + escapeHtml(item.title) + "\">" +
      "<img src=\"" + escapeHtml(item.cover) + "\" alt=\"" + escapeHtml(item.title) + "\" loading=\"lazy\">" +
      "<span class=\"card-badge\">" + escapeHtml(item.region) + " · " + escapeHtml(item.type) + "</span>" +
      "</a>" +
      "<div class=\"card-body\">" +
      "<h3><a href=\"" + escapeHtml(item.file) + "\">" + escapeHtml(item.title) + "</a></h3>" +
      "<p>" + escapeHtml(item.oneLine) + "</p>" +
      "<div class=\"card-meta\"><span>" + escapeHtml(item.year) + "</span><span>" + escapeHtml(item.genre) + "</span></div>" +
      "<div class=\"tag-row\">" + tags + "</div>" +
      "</div>" +
      "</article>";
  }

  function setupSearchPage() {
    var root = one("[data-search-page]");
    if (!root || !window.SEARCH_ITEMS) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var input = one("#searchInput", root);
    var region = one("#regionFilter", root);
    var type = one("#typeFilter", root);
    var results = one("#searchResults", root);
    var form = one("#searchForm", root);
    if (input) {
      input.value = params.get("q") || "";
    }

    function match(item, keyword) {
      if (!keyword) {
        return true;
      }
      var source = [item.title, item.region, item.type, item.year, item.genre, item.oneLine].concat(item.tags || []).join(" ").toLowerCase();
      return source.indexOf(keyword.toLowerCase()) >= 0;
    }

    function render() {
      var keyword = input ? input.value.trim() : "";
      var regionValue = region ? region.value : "";
      var typeValue = type ? type.value : "";
      var items = window.SEARCH_ITEMS.filter(function (item) {
        var regionOk = !regionValue || item.region.indexOf(regionValue) >= 0;
        var typeOk = !typeValue || item.type.indexOf(typeValue) >= 0;
        return regionOk && typeOk && match(item, keyword);
      }).slice(0, 240);
      if (!items.length) {
        results.innerHTML = "<div class=\"empty-state\">没有找到匹配影片</div>";
        return;
      }
      results.innerHTML = items.map(searchCard).join("");
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        render();
      });
    }
    [input, region, type].forEach(function (node) {
      if (node) {
        node.addEventListener("input", render);
        node.addEventListener("change", render);
      }
    });
    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupMobileMenu();
    setupHero();
    setupCardFilter();
    setupSort();
    setupPlayer();
    setupSearchPage();
  });
})();
