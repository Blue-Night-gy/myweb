document.addEventListener('DOMContentLoaded', () => {
  const music = document.getElementById('bg-music');
  const btn = document.getElementById('play-music');

  if (!music || !btn) return;

  btn.addEventListener('click', () => {
    if (music.paused) {
      music.play();
      btn.innerText = '⏸ 暂停音乐';
    } else {
      music.pause();
      btn.innerText = '▶ 播放音乐';
    }
  });
});
