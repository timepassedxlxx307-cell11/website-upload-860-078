(function () {
  function startPlayer(video, cover) {
    var stream = video.getAttribute('data-stream');

    if (!stream) {
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      if (!video.hlsPlayer) {
        video.hlsPlayer = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        video.hlsPlayer.loadSource(stream);
        video.hlsPlayer.attachMedia(video);
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      if (!video.getAttribute('src')) {
        video.setAttribute('src', stream);
      }
    } else {
      video.setAttribute('src', stream);
    }

    if (cover) {
      cover.classList.add('hidden');
    }

    var playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(function () {
        if (cover) {
          cover.classList.remove('hidden');
        }
      });
    }
  }

  var video = document.getElementById('movie-player');
  if (!video) {
    return;
  }

  var cover = document.querySelector('[data-play-button]');
  var shortcut = document.querySelector('[data-play-shortcut]');

  if (cover) {
    cover.addEventListener('click', function () {
      startPlayer(video, cover);
    });
  }

  if (shortcut) {
    shortcut.addEventListener('click', function () {
      startPlayer(video, cover);
      video.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  video.addEventListener('play', function () {
    if (cover) {
      cover.classList.add('hidden');
    }
  });
})();
