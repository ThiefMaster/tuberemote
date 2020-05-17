'use strict';

function getPlayer() {
  const elem = document.querySelector('ytd-player');
  if (!elem) {
    console.warn('<ytd-player> not found');
    return null;
  }
  if (!elem.wrappedJSObject.getPlayer) {
    console.warn('getPlayer method not found');
    return null;
  }
  return elem.wrappedJSObject.getPlayer();
}

function isPlaying(player) {
  return player !== null && player.getPlayerState() === 1;
}

function togglePlayback() {
  const player = getPlayer();
  if (!player) {
    return null;
  }
  const playing = isPlaying(player);
  player[playing ? 'pauseVideo' : 'playVideo']();
  return !playing;
}

function changeVolume(delta) {
  const player = getPlayer();
  if (!player) {
    return null;
  }
  player.setVolume(player.getVolume() + delta);
  return player.getVolume();
}

function seekBy(delta) {
  const player = getPlayer();
  if (!player) {
    return null;
  }
  player.seekBy(delta);
}

browser.runtime.onMessage.addListener(req => {
  const player = getPlayer();
  let playing, volume;
  if (req.action === 'getStatus') {
    volume = player.getVolume();
    playing = isPlaying(player);
  } else if (req.action === 'togglePlayback') {
    playing = togglePlayback();
    volume = player.getVolume();
  } else if (req.action === 'changeVolume') {
    playing = isPlaying(player);
    volume = changeVolume(req.delta);
  } else if (req.action === 'seekBy') {
    playing = isPlaying(player);
    volume = player.getVolume();
    seekBy(req.delta);
  }

  return Promise.resolve({
    playing,
    volume,
  });
});
