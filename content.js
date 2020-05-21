'use strict';

const STATE_STOPPED = 'stopped';
const STATE_PLAYING = 'playing';
const STATE_PAUSED = 'paused';

const PLAYER_STATES = {
  '-1': STATE_STOPPED, // unstarted
  0: STATE_STOPPED, // ended
  1: STATE_PLAYING, // playing
  2: STATE_PAUSED, // paused
  3: STATE_PLAYING, // buffering
  5: STATE_STOPPED, // cued
};

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

function getPlayerState(player) {
  if (player === null) {
    // we don't really know but let's not add yet another state for an unlikely error case :)
    return STATE_STOPPED;
  }
  const state = player.getPlayerState();
  if (PLAYER_STATES[state] === undefined) {
    console.error(`Unexpected player state: ${state}`);
    return STATE_STOPPED;
  }
  return PLAYER_STATES[state];
}

function togglePlayback() {
  const player = getPlayer();
  if (!player) {
    return STATE_STOPPED;
  }
  const playing = getPlayerState(player) === STATE_PLAYING;
  player[playing ? 'pauseVideo' : 'playVideo']();
  return playing ? STATE_PAUSED : STATE_PLAYING;
}

function stopPlayback() {
  const player = getPlayer();
  if (!player) {
    // no idea, but if we try to stop let's assume we're playing...
    return STATE_PLAYING;
  }
  player.stopVideo();
  return STATE_STOPPED;
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
  let state, volume;
  if (req.action === 'getStatus') {
    state = getPlayerState(player)
    volume = player.getVolume();
  } else if (req.action === 'togglePlayback') {
    state = togglePlayback();
    volume = player.getVolume();
  } else if (req.action === 'stopPlayback') {
    state = stopPlayback();
    volume = player.getVolume();
  } else if (req.action === 'changeVolume') {
    state = getPlayerState(player)
    volume = changeVolume(req.delta);
  } else if (req.action === 'seekBy') {
    state = getPlayerState(player)
    volume = player.getVolume();
    seekBy(req.delta);
  }

  return Promise.resolve({
    state,
    volume,
  });
});
