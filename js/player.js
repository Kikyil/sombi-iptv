import { showToast } from './utils.js';

// HLS is available as a global variable from the CDN script tag
// No import needed - use window.Hls

// ======================== PLAYER STATE ========================
let hls = null;
let currentChannel = null;
let selectedQualityIdx = -1;
let playbackMode = 'saver'; // saver, balanced, hd
let isPipActive = false;

// DOM elements
let video = null;
let loadingOverlay = null;
let playingTitle = null;
let epgNow = null;
let epgNext = null;
let qualityOptions = null;
let pipIndicator = null;
let homeView = null;
let playerView = null;

// Callbacks set by app.js
let onPlayerClose = null;

export function initPlayer(callbacks) {
  video = document.getElementById('video');
  loadingOverlay = document.getElementById('loadingOverlay');
  playingTitle = document.getElementById('playingTitle');
  epgNow = document.getElementById('epgNow');
  epgNext = document.getElementById('epgNext');
  qualityOptions = document.getElementById('qualityOptions');
  pipIndicator = document.getElementById('pipIndicator');
  homeView = document.getElementById('homeView');
  playerView = document.getElementById('playerView');
  
  onPlayerClose = callbacks.onClose;
  
  // PiP event listener
  video?.addEventListener('leavepictureinpicture', () => {
    if (!isPipActive) return;
    isPipActive = false;
    pipIndicator?.classList.add('hidden');
    if (playerView?.classList.contains('hidden') && currentChannel) {
      homeView?.classList.add('hidden');
      playerView?.classList.remove('hidden');
      playerView.style.display = 'flex';
      setTimeout(() => { video?.play().catch(e => console.warn('Playback resume:', e)); }, 100);
    }
  });
}

export function getPlayerConfig() {
  if (playbackMode === 'saver') {
    return { startLevel: 0, autoLevelCapping: 1, maxBufferLength: 3 };
  }
  if (playbackMode === 'balanced') {
    return { startLevel: 1, autoLevelCapping: 2, maxBufferLength: 8 };
  }
  return { startLevel: -1, autoLevelCapping: -1 };
}

export function playChannel(ch, addToHistoryCallback) {
  if (!ch || !ch.url) {
    showToast('Invalid stream URL', true, 4000);
    return;
  }
  
  addToHistoryCallback(ch);
  currentChannel = ch;
  playingTitle.innerHTML = `${ch.name} <span class="text-xs bg-zinc-800 px-2 py-0.5 rounded-full">LIVE</span>`;
  
  if (document.pictureInPictureElement) {
    document.exitPictureInPicture().catch(e => console.log);
    isPipActive = false;
    pipIndicator?.classList.add('hidden');
  }
  
  homeView?.classList.add('hidden');
  playerView?.classList.remove('hidden');
  playerView.style.display = 'flex';
  loadingOverlay.style.display = 'flex';
  
  if (hls) {
    hls.destroy();
    hls = null;
  }
  
  // Check if Hls is available globally
  if (typeof Hls === 'undefined') {
    showToast('HLS player not loaded. Please refresh the page.', true, 4000);
    loadingOverlay.style.display = 'none';
    return;
  }
  
  try {
    hls = new Hls(getPlayerConfig());
    hls.loadSource(ch.url);
    hls.attachMedia(video);
    
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (playbackMode === 'saver' && hls.levels.length) {
        let lowIdx = 0;
        for (let i = 0; i < hls.levels.length; i++) {
          if ((hls.levels[i].height || 999) <= 360) {
            lowIdx = i;
            break;
          }
        }
        hls.currentLevel = lowIdx;
        selectedQualityIdx = lowIdx;
      } else {
        selectedQualityIdx = -1;
      }
      buildQualityMenu();
      video?.play().catch(e => console.warn);
      loadingOverlay.style.display = 'none';
      generateEPG(ch);
    });
    
    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        showToast(`❌ Stream unavailable: ${ch.name}`, true, 6000);
        if (!isPipActive) fullExitPlayer();
      }
    });
  } catch (err) {
    console.error('HLS Error:', err);
    showToast(`Failed to initialize player`, true, 4000);
    loadingOverlay.style.display = 'none';
  }
}

function generateEPG(ch) {
  const n = ch.name.toLowerCase();
  if (n.includes('sport')) {
    epgNow.innerHTML = '⚽ LIVE: Match in progress';
    epgNext.innerHTML = '⏩ Next: Highlights';
  } else if (n.includes('news')) {
    epgNow.innerHTML = '📡 NOW: Breaking news';
    epgNext.innerHTML = '⏩ Next: Analysis';
  } else if (n.includes('movie')) {
    epgNow.innerHTML = '🎬 NOW: Feature film';
    epgNext.innerHTML = '⏩ Next: Behind scenes';
  } else {
    epgNow.innerHTML = '📺 Live programming';
    epgNext.innerHTML = '⏩ Stay tuned';
  }
}

function buildQualityMenu() {
  if (!hls || !hls.levels || !hls.levels.length) {
    qualityOptions.innerHTML = '<div class="text-center p-4 text-zinc-400">Auto adaptive</div>';
    return;
  }
  let html = `<button onclick='window.setQuality(-1)' class='w-full p-4 rounded-xl transition ${selectedQualityIdx === -1 ? 'bg-indigo-600' : 'bg-zinc-800'} font-medium'>🌀 Auto</button>`;
  hls.levels.forEach((lvl, idx) => {
    const height = lvl.height || (lvl.bitrate > 2000 ? 720 : 480);
    html += `<button onclick='window.setQuality(${idx})' class='w-full p-4 rounded-xl transition ${selectedQualityIdx === idx ? 'bg-indigo-600' : 'bg-zinc-800'}'>📺 ${height}p</button>`;
  });
  qualityOptions.innerHTML = html;
}

export function setQuality(idx) {
  if (hls) {
    hls.currentLevel = idx;
    selectedQualityIdx = idx;
    buildQualityMenu();
    showToast(`Quality changed`, false, 1500);
  }
}

export function cyclePlaybackMode(modeBtnDesktop, modeBtnMobile, playerModeBtn) {
  if (playbackMode === 'saver') {
    playbackMode = 'balanced';
    if(modeBtnDesktop) modeBtnDesktop.innerHTML = '⚖️ Balanced';
    if(modeBtnMobile) modeBtnMobile.innerHTML = '⚖️ Balanced';
    if(playerModeBtn) playerModeBtn.innerHTML = '⚖️ Balanced';
    showToast('Balanced mode', false, 2000);
  } else if (playbackMode === 'balanced') {
    playbackMode = 'hd';
    if(modeBtnDesktop) modeBtnDesktop.innerHTML = '🔥 HD';
    if(modeBtnMobile) modeBtnMobile.innerHTML = '🔥 HD';
    if(playerModeBtn) playerModeBtn.innerHTML = '🔥 HD';
    showToast('HD mode', false, 2000);
  } else {
    playbackMode = 'saver';
    if(modeBtnDesktop) modeBtnDesktop.innerHTML = '💾 Saver';
    if(modeBtnMobile) modeBtnMobile.innerHTML = '💾 Saver';
    if(playerModeBtn) playerModeBtn.innerHTML = '💾 Saver';
    showToast('Saver mode', false, 2000);
  }
  if (currentChannel && !playerView?.classList.contains('hidden')) {
    playChannel(currentChannel, () => {});
  }
}

export async function enterPictureInPictureAndBrowse(buildHomeCallback) {
  if (!currentChannel) {
    showToast('No active stream', true, 3000);
    return;
  }
  if (!document.pictureInPictureEnabled) {
    showToast('PiP not supported', true, 4000);
    return;
  }
  try {
    await video.requestPictureInPicture();
    isPipActive = true;
    pipIndicator?.classList.remove('hidden');
    playerView?.classList.add('hidden');
    playerView.style.display = 'none';
    homeView?.classList.remove('hidden');
    buildHomeCallback();
  } catch (err) {
    showToast('PiP failed', true, 3000);
  }
}

export function fullExitPlayer() {
  if (document.pictureInPictureElement) {
    document.exitPictureInPicture().catch(e => {});
  }
  isPipActive = false;
  pipIndicator?.classList.add('hidden');
  if (hls) {
    hls.destroy();
    hls = null;
  }
  if (video) {
    video.pause();
    video.src = '';
  }
  currentChannel = null;
  playerView?.classList.add('hidden');
  playerView.style.display = 'none';
  homeView?.classList.remove('hidden');
  if (onPlayerClose) onPlayerClose();
}

export function playChannelByObject(str, addToHistoryCallback) {
  const ch = JSON.parse(decodeURIComponent(str));
  playChannel(ch, addToHistoryCallback);
}

// Export for inline onclick handlers
window.setQuality = setQuality;