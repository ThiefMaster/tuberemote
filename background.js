'use strict';

const STATE_OFFLINE = 'offline';
const STATE_STOPPED = 'stopped';
const STATE_PLAYING = 'playing';
const STATE_PAUSED = 'paused';

async function getActiveYoutubeTab() {
  const tabs = await browser.tabs.query({
    active: true,
    url: 'https://www.youtube.com/watch?*',
  });
  if (tabs.length === 0) {
    return null;
  } else if (tabs.length === 1) {
    return tabs[0].id;
  } else {
    console.warn('Found too many tabs');
    tabs.forEach(t => console.log(t));
    return null;
  }
}

async function togglePlayback() {
  const tab = await getActiveYoutubeTab();
  if (tab === null) {
    return null;
  }
  return await browser.tabs.sendMessage(tab, {action: 'togglePlayback'});
}

async function changeVolume(delta) {
  const tab = await getActiveYoutubeTab();
  if (tab === null) {
    return null;
  }
  return await browser.tabs.sendMessage(tab, {action: 'changeVolume', delta});
}

async function seekBy(delta) {
  const tab = await getActiveYoutubeTab();
  if (tab === null) {
    return null;
  }
  return await browser.tabs.sendMessage(tab, {action: 'seekBy', delta});
}

async function getStatus() {
  const tab = await getActiveYoutubeTab();
  if (tab === null) {
    return null;
  }
  return await browser.tabs.sendMessage(tab, {action: 'getStatus'});
}

function createSocket() {
  console.log('creating websocket');

  const ws = new WebSocket('ws://127.0.0.1:12116/ws');

  ws.addEventListener('open', () => {
    console.log('websocket opened');
  });

  ws.addEventListener('close', () => {
    console.log('websocket closed');
    setTimeout(createSocket, 100);
  });

  ws.addEventListener('error', () => {
    console.log('websocket errored');
  });

  ws.addEventListener('message', async evt => {
    let msg;
    try {
      msg = JSON.parse(evt.data);
    } catch (exc) {
      console.log('could not parse websocket msg', exc);
      return;
    }

    let resp;
    let isAction = true;
    if (msg.action === 'togglePlayback') {
      resp = await togglePlayback();
    } else if (msg.action === 'changeVolume') {
      resp = await changeVolume(+msg.delta);
    } else if (msg.action === 'seekBy') {
      resp = await seekBy(+msg.delta);
    } else if (msg.action === 'getStatus') {
      isAction = false;
      resp = await getStatus();
    } else {
      console.warn('websocket received unexpected msg', msg);
      return;
    }

    if (resp === null) {
      resp = {
        state: STATE_OFFLINE,
        volume: -1,
        actionFailed: isAction,
      };
    }

    ws.send(JSON.stringify(resp));
  });
}

createSocket();
