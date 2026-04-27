// ======================== UTILITY FUNCTIONS ========================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ======================== VIRTUAL SCROLLER ========================
class VirtualScroller {
  constructor(container, itemHeight = 80, buffer = 5) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.buffer = buffer;
    this.items = [];
    this.renderCallback = null;
    this.scrollHandler = this.onScroll.bind(this);
    this.container.addEventListener('scroll', this.scrollHandler);
    this.currentStart = 0;
    this.currentEnd = 0;
  }
  
  setItems(items, renderCallback) {
    this.items = items;
    this.renderCallback = renderCallback;
    this.container.innerHTML = '';
    this.contentDiv = document.createElement('div');
    this.contentDiv.className = 'virtual-scroller-content';
    this.contentDiv.style.height = `${items.length * this.itemHeight}px`;
    this.itemsDiv = document.createElement('div');
    this.itemsDiv.className = 'virtual-scroller-items';
    this.contentDiv.appendChild(this.itemsDiv);
    this.container.appendChild(this.contentDiv);
    this.onScroll();
  }
  
  onScroll() {
    if (!this.renderCallback) return;
    const scrollTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);
    const endIndex = Math.min(this.items.length, Math.ceil((scrollTop + containerHeight) / this.itemHeight) + this.buffer);
    
    if (startIndex === this.currentStart && endIndex === this.currentEnd) return;
    
    this.currentStart = startIndex;
    this.currentEnd = endIndex;
    
    const fragment = document.createDocumentFragment();
    for (let i = startIndex; i < endIndex; i++) {
      const item = this.items[i];
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.top = `${i * this.itemHeight}px`;
      div.style.left = '0';
      div.style.right = '0';
      div.innerHTML = this.renderCallback(item);
      div.firstChild?.classList.add('drawer-item');
      fragment.appendChild(div);
    }
    
    this.itemsDiv.innerHTML = '';
    this.itemsDiv.appendChild(fragment);
  }
  
  destroy() {
    this.container.removeEventListener('scroll', this.scrollHandler);
  }
}

let drawerScroller = null;

// ======================== SINGLE PANEL MANAGEMENT ========================
function closeAllPanels() {
  document.getElementById('drawer')?.classList.remove('show');
  document.getElementById('qualityPanel')?.classList.remove('show');
  document.getElementById('browserPanel')?.classList.remove('show');
  const overlay = document.getElementById('panelOverlay');
  if (overlay) overlay.style.display = 'none';
}

function openPanelAndCloseOthers(panelId) {
  closeAllPanels();
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('show');
  const overlay = document.getElementById('panelOverlay');
  if (overlay) overlay.style.display = 'block';
}

window.closeDrawer = function() { closeAllPanels(); };
window.closeQualityPanel = function() { closeAllPanels(); };
window.closePanel = function() { closeAllPanels(); };

document.getElementById('panelOverlay')?.addEventListener('click', () => closeAllPanels());
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllPanels(); });

window.toggleDrawer = function() {
  const drawer = document.getElementById('drawer');
  if (drawer.classList.contains('show')) closeAllPanels();
  else openPanelAndCloseOthers('drawer');
};
window.toggleQualityMenu = function() {
  const qp = document.getElementById('qualityPanel');
  if (qp.classList.contains('show')) closeAllPanels();
  else {
    openPanelAndCloseOthers('qualityPanel');
    if (window.hls) buildQualityMenu();
  }
};
window.openPanel = function(type, btn) {
  document.querySelectorAll('.navtab').forEach(x => x.classList.remove('active'));
  if(btn) btn.classList.add('active');
  document.getElementById('panelTitle').innerText = type.toUpperCase();
  const contentDiv = document.getElementById('panelContent');
  contentDiv.innerHTML = window.REGISTRY[type].map(i => `<div onclick="window.loadSection('${type}','${i.label}','${i.url}'); closeAllPanels();" class='p-4 mb-3 rounded-2xl bg-zinc-800/70 hover:bg-zinc-700 cursor-pointer transition'>${i.label}</div>`).join('');
  openPanelAndCloseOthers('browserPanel');
};

document.getElementById('sidebarOverlay')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.remove('open');
});

// ======================== TOAST ========================
function showToast(msg, isError = false, duration = 4000) {
  const toastEl = document.getElementById('toast');
  toastEl.textContent = msg;
  toastEl.classList.remove('show', 'error', 'success');
  if (isError) toastEl.classList.add('error');
  else toastEl.classList.add('success');
  void toastEl.offsetWidth;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), duration);
}

// ======================== CONFIG & STATE ========================
window.REGISTRY = {
  categories: [
    {label:'⚽ Sports', url:'https://iptv-org.github.io/iptv/categories/sports.m3u'},
    {label:'📰 News', url:'https://iptv-org.github.io/iptv/categories/news.m3u'},
    {label:'🎬 Movies', url:'https://iptv-org.github.io/iptv/categories/movies.m3u'},
    {label:'📺 Series', url:'https://iptv-org.github.io/iptv/categories/series.m3u'},
    {label:'🎵 Music', url:'https://iptv-org.github.io/iptv/categories/music.m3u'}
  ],
  countries: [
    {label:'🇳🇬 Nigeria', url:'https://iptv-org.github.io/iptv/countries/ng.m3u'},
    {label:'🇺🇸 USA', url:'https://iptv-org.github.io/iptv/countries/us.m3u'},
    {label:'🇬🇧 UK', url:'https://iptv-org.github.io/iptv/countries/uk.m3u'},
    {label:'🇫🇷 France', url:'https://iptv-org.github.io/iptv/countries/fr.m3u'},
    {label:'🇩🇪 Germany', url:'https://iptv-org.github.io/iptv/countries/de.m3u'}
  ],
  languages: [
    {label:'English', url:'https://iptv-org.github.io/iptv/languages/eng.m3u'},
    {label:'Spanish', url:'https://iptv-org.github.io/iptv/languages/spa.m3u'},
    {label:'Hausa', url:'https://iptv-org.github.io/iptv/languages/hau.m3u'},
    {label:'French', url:'https://iptv-org.github.io/iptv/languages/fra.m3u'},
    {label:'Arabic', url:'https://iptv-org.github.io/iptv/languages/ara.m3u'}
  ]
};

const HOME_SECTIONS = [
  {title:'🔥 Breaking News', url:window.REGISTRY.categories[1].url, keywords:['CNN','BBC','Fox','Al Jazeera','Sky News','ABC','CBS']},
  {title:'⚡ Live Sports', url:window.REGISTRY.categories[0].url, keywords:['ESPN','Fox Sports','beIN','Sky Sports','NFL','NBA']},
  {title:'🎬 Cinema & Movies', url:window.REGISTRY.categories[2].url, keywords:['Movie','HBO','Cinemax','Film','Starz']},
  {title:'🎶 Music & Events', url:window.REGISTRY.categories[4].url, keywords:['MTV','VH1','Music','Hits','BET']}
];

let hls = null;
let currentChannel = null;
let channelsMaster = [];
let selectedQualityIdx = -1;
let playbackMode = 'saver';
let favorites = JSON.parse(localStorage.getItem('iptvFavs') || '[]');
let watchHistory = JSON.parse(localStorage.getItem('iptvHistory') || '[]');
let isPipActive = false;

// DOM elements
const homeView = document.getElementById('homeView');
const playerView = document.getElementById('playerView');
const video = document.getElementById('video');
const loadingOverlay = document.getElementById('loadingOverlay');
const railsContainer = document.getElementById('railsContainer');
const heroSection = document.getElementById('heroSection');
const heroLogo = document.getElementById('heroLogo');
const heroTitle = document.getElementById('heroTitle');
const heroPlay = document.getElementById('heroPlay');
const playingTitle = document.getElementById('playingTitle');
const epgNow = document.getElementById('epgNow');
const epgNext = document.getElementById('epgNext');
const qualityOptions = document.getElementById('qualityOptions');
const searchMobile = document.getElementById('searchMobile');
const searchDesktop = document.getElementById('searchDesktop');
const modeBtnMobile = document.getElementById('modeBtnMobile');
const modeBtnDesktop = document.getElementById('modeBtnDesktop');
const playerModeBtn = document.getElementById('playerModeBtn');
const pipIndicator = document.getElementById('pipIndicator');
const pipBackBtn = document.getElementById('pipBackBtn');
const exitPlayerBtn = document.getElementById('exitPlayerBtn');

function scrollToTop() { if (homeView) homeView.scrollTo({ top: 0, behavior: 'smooth' }); }

// ======================== DEBOUNCED SEARCH ========================
const debouncedSearch = debounce((value) => {
  if (!channelsMaster.length) return;
  if (!value) { if (heroSection.style.display !== 'flex') renderGrid(channelsMaster, 'Browse', true); return; }
  const filtered = channelsMaster.filter(c => c.name.toLowerCase().includes(value.toLowerCase()));
  renderGrid(filtered, `🔍 Results: ${filtered.length}`);
}, 250);

function handleSearch(value) { debouncedSearch(value); }
if (searchMobile) searchMobile.addEventListener('input', (e) => handleSearch(e.target.value));
if (searchDesktop) searchDesktop.addEventListener('input', (e) => handleSearch(e.target.value));

// ======================== HISTORY FUNCTIONS ========================
function addToHistory(channel) {
  if (!channel || !channel.url) return;
  watchHistory = watchHistory.filter(item => item.url !== channel.url);
  watchHistory.unshift({
    url: channel.url, name: channel.name, logo: channel.logo || '',
    group: channel.group || 'General', watchedAt: Date.now(),
    formattedTime: new Date().toLocaleTimeString()
  });
  if (watchHistory.length > 50) watchHistory = watchHistory.slice(0, 50);
  localStorage.setItem('iptvHistory', JSON.stringify(watchHistory));
}

window.clearHistory = function() {
  watchHistory = [];
  localStorage.setItem('iptvHistory', JSON.stringify(watchHistory));
  showToast('History cleared', false, 2500);
  const active = document.querySelector('.sidebar-item.active, .mobile-nav-item.active, .navtab.active');
  if (active && active.getAttribute('data-nav') === 'history') window.showHistory();
};

// ======================== M3U PARSER ========================
function parseM3U(text) {
  const lines = text.split(/\r?\n/);
  const items = [];
  let current = null;
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('#EXTINF')) {
      const matchName = /#EXTINF:-?\d+(.*?),(.*)$/.exec(line);
      let name = matchName ? matchName[2] : 'Unknown';
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupMatch = line.match(/group-title="([^"]*)"/);
      current = { name: name.trim(), logo: logoMatch ? logoMatch[1] : '', group: groupMatch ? groupMatch[1] : 'General', url: '' };
    } else if (line.startsWith('http') && current) {
      current.url = line;
      items.push({ ...current });
      current = null;
    }
  }
  return items;
}

async function loadFeed(url) {
  try {
    const resp = await fetch(url);
    const txt = await resp.text();
    return parseM3U(txt);
  } catch(e) {
    showToast(`⚠️ Network error`, true, 5000);
    return [];
  }
}

function inferCategory(ch) { return ch.group && ch.group !== 'General' ? ch.group : (ch.name.includes('Sport') ? 'Sports' : (ch.name.includes('News') ? 'News' : 'Entertainment')); }
function isFav(url) { return favorites.includes(url); }

function cardHTML(ch) {
  const favActive = isFav(ch.url);
  const escapedUrl = encodeURIComponent(ch.url);
  const escapedObj = encodeURIComponent(JSON.stringify(ch));
  return `<div class='channel-card relative'><button class='fav-btn absolute top-2 right-2 z-10' onclick="event.stopPropagation();window.toggleFav('${escapedUrl}', this)">${favActive ? '❤️' : '🤍'}</button><div onclick="window.playChannelByObject('${escapedObj}')" class="cursor-pointer"><div class='h-24 flex items-center justify-center mb-2 bg-black/40 rounded-xl p-1'><img src='${ch.logo || 'https://cdn-icons-png.flaticon.com/512/2333/2333216.png'}' class='max-h-16 object-contain' onerror="this.src='https://cdn-icons-png.flaticon.com/512/2333/2333216.png'"></div><div class='font-semibold text-sm truncate px-1'>${ch.name.substring(0, 32)}</div><div class='mt-2'><span class='cat-pill text-[10px]'>${inferCategory(ch)}</span></div></div></div>`;
}

// ======================== DOCUMENT FRAGMENT RENDERING ========================
function renderRail(title, channelsArray) {
  if (!channelsArray.length) return;
  const section = document.createElement('section');
  section.className = 'mb-10';
  const h2 = document.createElement('h2');
  h2.className = 'px-5 mb-4 text-xl font-bold tracking-tight';
  h2.textContent = `✨ ${title}`;
  const scrollDiv = document.createElement('div');
  scrollDiv.className = 'flex gap-4 overflow-x-auto px-5 scroll-smooth';
  const fragment = document.createDocumentFragment();
  channelsArray.forEach(ch => {
    const temp = document.createElement('div');
    temp.innerHTML = cardHTML(ch);
    fragment.appendChild(temp.firstElementChild);
  });
  scrollDiv.appendChild(fragment);
  section.appendChild(h2);
  section.appendChild(scrollDiv);
  railsContainer.appendChild(section);
}

function renderGrid(data, title, isGrouped = false) {
  scrollToTop();
  const fragment = document.createDocumentFragment();
  const container = document.createElement('div');
  container.className = 'pt-5';
  
  if (!isGrouped) {
    const h2 = document.createElement('h2');
    h2.className = 'text-2xl font-black mb-6 px-5';
    h2.textContent = title;
    const gridDiv = document.createElement('div');
    gridDiv.className = 'grid-cards';
    data.forEach(ch => {
      const temp = document.createElement('div');
      temp.innerHTML = cardHTML(ch);
      gridDiv.appendChild(temp.firstElementChild);
    });
    container.appendChild(h2);
    container.appendChild(gridDiv);
  } else {
    const h2 = document.createElement('h2');
    h2.className = 'text-3xl font-black mb-2 px-5';
    h2.textContent = title;
    container.appendChild(h2);
    
    const groups = {};
    data.forEach(ch => { let g = inferCategory(ch); if (!groups[g]) groups[g] = []; groups[g].push(ch); });
    Object.keys(groups).sort().forEach(g => {
      const groupH3 = document.createElement('h3');
      groupH3.className = 'text-xl font-bold mt-8 mb-3 border-l-4 border-yellow-400 pl-3 px-5';
      groupH3.textContent = g;
      const gridDiv = document.createElement('div');
      gridDiv.className = 'grid-cards';
      groups[g].forEach(ch => {
        const temp = document.createElement('div');
        temp.innerHTML = cardHTML(ch);
        gridDiv.appendChild(temp.firstElementChild);
      });
      container.appendChild(groupH3);
      container.appendChild(gridDiv);
    });
  }
  fragment.appendChild(container);
  railsContainer.innerHTML = '';
  railsContainer.appendChild(fragment);
}

// ======================== BUILD HOME ========================
async function buildHome() {
  heroSection.style.display = 'flex';
  railsContainer.innerHTML = '';
  scrollToTop();
  try {
    const featuredFeed = await loadFeed(window.REGISTRY.categories[0].url);
    if (featuredFeed.length) {
      heroLogo.src = featuredFeed[0].logo || 'https://cdn-icons-png.flaticon.com/512/2333/2333216.png';
      heroTitle.innerText = featuredFeed[0].name;
      heroPlay.onclick = () => playChannel(featuredFeed[0]);
    }
    for (let sec of HOME_SECTIONS) {
      const feed = await loadFeed(sec.url);
      let selected = [];
      sec.keywords.forEach(kw => { const matches = feed.filter(c => c.name.toLowerCase().includes(kw.toLowerCase())).slice(0, 3); selected.push(...matches); });
      if (selected.length === 0) selected = feed.slice(0, 8);
      else selected = selected.slice(0, 12);
      renderRail(sec.title, selected);
    }
  } catch (err) { showToast('Error loading homepage', true, 4000); }
}

// ======================== PLAYBACK ========================
function getPlayerConfig() {
  if (playbackMode === 'saver') return { startLevel: 0, autoLevelCapping: 1, maxBufferLength: 3 };
  if (playbackMode === 'balanced') return { startLevel: 1, autoLevelCapping: 2, maxBufferLength: 8 };
  return { startLevel: -1, autoLevelCapping: -1 };
}

window.playChannelByObject = function(str) { playChannel(JSON.parse(decodeURIComponent(str))); };

function playChannel(ch) {
  if (!ch || !ch.url) { showToast('Invalid stream URL', true, 4000); return; }
  addToHistory(ch);
  currentChannel = ch;
  playingTitle.innerHTML = `${ch.name} <span class="text-xs bg-zinc-800 px-2 py-0.5 rounded-full">LIVE</span>`;
  if (document.pictureInPictureElement) { document.exitPictureInPicture().catch(e=>console.log); isPipActive = false; pipIndicator.classList.add('hidden'); }
  homeView.classList.add('hidden');
  playerView.classList.remove('hidden');
  playerView.style.display = 'flex';
  loadingOverlay.style.display = 'flex';
  if (hls) { hls.destroy(); hls = null; }
  hls = new Hls(getPlayerConfig());
  hls.loadSource(ch.url);
  hls.attachMedia(video);
  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    if (playbackMode === 'saver' && hls.levels.length) {
      let lowIdx = 0;
      for (let i = 0; i < hls.levels.length; i++) { if ((hls.levels[i].height || 999) <= 360) { lowIdx = i; break; } }
      hls.currentLevel = lowIdx;
      selectedQualityIdx = lowIdx;
    } else { selectedQualityIdx = -1; }
    buildQualityMenu();
    video.play().catch(e => console.warn);
    loadingOverlay.style.display = 'none';
    generateEPG(ch);
  });
  hls.on(Hls.Events.ERROR, (_, data) => {
    if (data.fatal) { showToast(`❌ Stream unavailable: ${ch.name}`, true, 6000); if (!isPipActive) fullExitPlayer(); }
  });
  window.hls = hls;
}

function generateEPG(ch) {
  const n = ch.name.toLowerCase();
  if (n.includes('sport')) { epgNow.innerHTML = '⚽ LIVE: Match in progress'; epgNext.innerHTML = '⏩ Next: Highlights'; }
  else if (n.includes('news')) { epgNow.innerHTML = '📡 NOW: Breaking news'; epgNext.innerHTML = '⏩ Next: Analysis'; }
  else if (n.includes('movie')) { epgNow.innerHTML = '🎬 NOW: Feature film'; epgNext.innerHTML = '⏩ Next: Behind scenes'; }
  else { epgNow.innerHTML = '📺 Live programming'; epgNext.innerHTML = '⏩ Stay tuned'; }
}

function buildQualityMenu() {
  if (!hls || !hls.levels || !hls.levels.length) { qualityOptions.innerHTML = '<div class="text-center p-4 text-zinc-400">Auto adaptive</div>'; return; }
  let html = `<button onclick='window.setQuality(-1)' class='w-full p-4 rounded-xl transition ${selectedQualityIdx === -1 ? 'bg-indigo-600' : 'bg-zinc-800'} font-medium'>🌀 Auto</button>`;
  hls.levels.forEach((lvl, idx) => {
    const height = lvl.height || (lvl.bitrate > 2000 ? 720 : 480);
    html += `<button onclick='window.setQuality(${idx})' class='w-full p-4 rounded-xl transition ${selectedQualityIdx === idx ? 'bg-indigo-600' : 'bg-zinc-800'}'>📺 ${height}p</button>`;
  });
  qualityOptions.innerHTML = html;
}

window.setQuality = function(idx) { if (hls) { hls.currentLevel = idx; selectedQualityIdx = idx; buildQualityMenu(); showToast(`Quality changed`, false, 1500); } };

window.cyclePlaybackMode = function() {
  if (playbackMode === 'saver') { playbackMode = 'balanced'; 
    if(modeBtnDesktop) modeBtnDesktop.innerHTML = '⚖️ Balanced'; 
    if(modeBtnMobile) modeBtnMobile.innerHTML = '⚖️ Balanced';
    if(playerModeBtn) playerModeBtn.innerHTML = '⚖️ Balanced';
    showToast('Balanced mode', false, 2000); }
  else if (playbackMode === 'balanced') { playbackMode = 'hd'; 
    if(modeBtnDesktop) modeBtnDesktop.innerHTML = '🔥 HD'; 
    if(modeBtnMobile) modeBtnMobile.innerHTML = '🔥 HD';
    if(playerModeBtn) playerModeBtn.innerHTML = '🔥 HD';
    showToast('HD mode', false, 2000); }
  else { playbackMode = 'saver'; 
    if(modeBtnDesktop) modeBtnDesktop.innerHTML = '💾 Saver'; 
    if(modeBtnMobile) modeBtnMobile.innerHTML = '💾 Saver';
    if(playerModeBtn) playerModeBtn.innerHTML = '💾 Saver';
    showToast('Saver mode', false, 2000); }
  if (currentChannel && playerView.classList.contains('hidden') === false) playChannel(currentChannel);
};

// ======================== PIP FUNCTIONS ========================
async function enterPictureInPictureAndBrowse() {
  if (!currentChannel) { showToast('No active stream', true, 3000); return; }
  if (!document.pictureInPictureEnabled) { showToast('PiP not supported', true, 4000); return; }
  try {
    await video.requestPictureInPicture();
    isPipActive = true;
    pipIndicator.classList.remove('hidden');
    playerView.classList.add('hidden');
    playerView.style.display = 'none';
    homeView.classList.remove('hidden');
    buildHome();
  } catch (err) { showToast('PiP failed', true, 3000); }
}

function fullExitPlayer() {
  if (document.pictureInPictureElement) { document.exitPictureInPicture().catch(e=>{}); }
  isPipActive = false;
  pipIndicator.classList.add('hidden');
  if (hls) { hls.destroy(); hls = null; }
  video.pause();
  video.src = '';
  currentChannel = null;
  playerView.classList.add('hidden');
  playerView.style.display = 'none';
  homeView.classList.remove('hidden');
  buildHome();
}

video.addEventListener('leavepictureinpicture', () => {
  if (!isPipActive) return;
  isPipActive = false;
  pipIndicator.classList.add('hidden');
  if (playerView.classList.contains('hidden') && currentChannel) {
    homeView.classList.add('hidden');
    playerView.classList.remove('hidden');
    playerView.style.display = 'flex';
    setTimeout(() => { video.play().catch(e => console.warn('Playback resume:', e)); }, 100);
  }
});

pipBackBtn.onclick = () => enterPictureInPictureAndBrowse();
exitPlayerBtn.onclick = () => fullExitPlayer();

window.goHomeTab = function(btn) {
  if (isPipActive) {
    document.querySelectorAll('.navtab').forEach(x => x.classList.remove('active'));
    if(btn) btn.classList.add('active');
    buildHome();
    channelsMaster = [];
    if(searchMobile) searchMobile.value = '';
    if(searchDesktop) searchDesktop.value = '';
    heroSection.style.display = 'flex';
    return;
  }
  fullExitPlayer();
  document.querySelectorAll('.navtab').forEach(x => x.classList.remove('active'));
  if(btn) btn.classList.add('active');
  buildHome();
  channelsMaster = [];
  if(searchMobile) searchMobile.value = '';
  if(searchDesktop) searchDesktop.value = '';
  heroSection.style.display = 'flex';
};

// ======================== FAVORITES ========================
window.toggleFav = async function(encodedUrl, btnElement) {
  const url = decodeURIComponent(encodedUrl);
  if (favorites.includes(url)) {
    favorites = favorites.filter(f => f !== url);
    if (btnElement) btnElement.innerHTML = '🤍';
  } else {
    favorites.push(url);
    if (btnElement) btnElement.innerHTML = '❤️';
  }
  localStorage.setItem('iptvFavs', JSON.stringify(favorites));
  const active = document.querySelector('.sidebar-item.active, .mobile-nav-item.active, .navtab.active');
  if (active && (active.innerText.includes('Fav') || active.innerText.includes('❤️') || active.getAttribute('data-nav') === 'favorites')) window.showFavorites();
};

window.showFavorites = async function(btn) {
  if (btn) { document.querySelectorAll('.navtab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); }
  document.querySelectorAll('.sidebar-item, .mobile-nav-item').forEach(t => t.classList.remove('active'));
  document.querySelectorAll(`[data-nav="favorites"]`).forEach(t => t.classList.add('active'));
  heroSection.style.display = 'none';
  scrollToTop();
  let favStreams = [];
  if (channelsMaster.length) { favStreams = channelsMaster.filter(c => favorites.includes(c.url)); }
  else { favStreams = watchHistory.filter(c => favorites.includes(c.url)).map(h => ({...h})); if (favStreams.length === 0) { const fallbackFeed = await loadFeed(window.REGISTRY.categories[1].url); favStreams = fallbackFeed.filter(c => favorites.includes(c.url)); } }
  if (favStreams.length === 0) { railsContainer.innerHTML = `<div class="p-10 text-center text-zinc-400 flex flex-col items-center gap-3"><span>💔</span><p>No favorites yet. Click ♡ on any channel to add.</p></div>`; return; }
  renderGrid(favStreams, '⭐ My Favorite Channels');
};

window.showHistory = function(btn) {
  if (btn) { document.querySelectorAll('.navtab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); }
  document.querySelectorAll('.sidebar-item, .mobile-nav-item').forEach(t => t.classList.remove('active'));
  document.querySelectorAll(`[data-nav="history"]`).forEach(t => t.classList.add('active'));
  heroSection.style.display = 'none';
  scrollToTop();
  if (watchHistory.length === 0) {
    railsContainer.innerHTML = `<div class="p-10 text-center text-zinc-400 flex flex-col items-center gap-3"><span>🕘</span><p>No watch history yet. Start watching channels!</p><button onclick="window.clearHistory()" class="mt-4 bg-zinc-800 px-4 py-2 rounded-full text-sm">Clear History</button></div>`;
    return;
  }
  renderGrid(watchHistory.map(h => ({ ...h })), '🕘 Recently Watched');
};

// ======================== BROWSING PANELS ========================
window.loadSection = async function(type, label, url) {
  closeAllPanels();
  heroSection.style.display = 'none';
  const channels = await loadFeed(url);
  channelsMaster = channels;
  if (type === 'categories') renderGrid(channels, label);
  else renderGrid(channels, label, true);
  buildDrawerList(channels);
  if(searchMobile) searchMobile.value = '';
  if(searchDesktop) searchDesktop.value = '';
  showToast(`Loaded: ${label} (${channels.length} channels)`, false, 2500);
};

function buildDrawerList(chList) {
  const container = document.getElementById('channelDrawer');
  if (!container) return;
  
  if (drawerScroller) drawerScroller.destroy();
  drawerScroller = new VirtualScroller(container, 80, 5);
  
  const renderItem = (ch) => {
    const escapedObj = encodeURIComponent(JSON.stringify(ch));
    return `<div onclick="window.playChannelByObject('${escapedObj}'); window.closeDrawer();" class="drawer-item cursor-pointer">
      <img src='${ch.logo || 'https://cdn-icons-png.flaticon.com/512/2333/2333216.png'}' class='w-12 h-12 rounded-xl bg-zinc-800 object-contain p-1'>
      <div>
        <div class='font-semibold'>${ch.name}</div>
        <div class='cat-pill text-[9px] inline-block mt-1'>${inferCategory(ch)}</div>
      </div>
    </div>`;
  };
  
  drawerScroller.setItems(chList, renderItem);
}

// ======================== NAVIGATION ========================
function setActiveNav(navId) {
  document.querySelectorAll('.sidebar-item, .mobile-nav-item, .navtab').forEach(el => el.classList.remove('active'));
  document.querySelectorAll(`[data-nav="${navId}"]`).forEach(el => el.classList.add('active'));
  if (navId === 'home') { buildHome(); heroSection.style.display = 'flex'; channelsMaster = []; if(searchMobile) searchMobile.value = ''; if(searchDesktop) searchDesktop.value = ''; }
  else if (navId === 'categories') window.openPanel('categories');
  else if (navId === 'countries') window.openPanel('countries');
  else if (navId === 'languages') window.openPanel('languages');
  else if (navId === 'favorites') window.showFavorites();
  else if (navId === 'history') window.showHistory();
  else if (navId === 'about') showToast('SOMBI IPTV v2.0 – Premium Streaming', false, 2000);
  else if (navId === 'privacy') showToast('Privacy: No data collected', false, 2000);
  else if (navId === 'terms') showToast('Terms: Personal use only', false, 2000);
  else if (navId === 'contact') showToast('Contact: support@sombi.tv', false, 2000);
  else if (navId === 'notifications') showToast('🔔 Notifications coming soon', false, 2000);
}

// ======================== DARK MODE ========================
function initDarkMode() {
  const isDark = localStorage.getItem('theme') !== 'light';
  if (!isDark) document.body.classList.add('light');
  document.getElementById('darkModeToggle')?.addEventListener('click', () => {
    document.body.classList.toggle('light');
    localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
    if (channelsMaster.length) {
      const currentView = document.querySelector('.sidebar-item.active, .mobile-nav-item.active, .navtab.active');
      if (currentView) {
        const navId = currentView.getAttribute('data-nav');
        if (navId === 'home') buildHome();
        else if (navId === 'favorites') window.showFavorites();
        else if (navId === 'history') window.showHistory();
        else if (channelsMaster.length && navId !== 'home') renderGrid(channelsMaster, 'Browse', true);
      }
    }
  });
}

// ======================== EVENT BINDING ========================
document.querySelectorAll('.sidebar-item[data-nav]').forEach(el => {
  el.addEventListener('click', () => { setActiveNav(el.getAttribute('data-nav')); if(window.innerWidth<1024) document.getElementById('sidebar')?.classList.remove('open'); });
});
document.querySelectorAll('.mobile-nav-item').forEach(el => {
  el.addEventListener('click', () => setActiveNav(el.getAttribute('data-nav')));
});
document.getElementById('menuToggleBtn')?.addEventListener('click', () => document.getElementById('sidebar')?.classList.add('open'));
document.getElementById('closeSidebarBtn')?.addEventListener('click', () => document.getElementById('sidebar')?.classList.remove('open'));
document.getElementById('sidebarOverlay')?.addEventListener('click', () => document.getElementById('sidebar')?.classList.remove('open'));

// ======================== INIT ========================
initDarkMode();
setActiveNav('home');

// Expose additional functions for inline handlers
window.fullExitPlayer = fullExitPlayer;
// [Virtual Scrolling] Implemented VirtualScroller class - renders ~15 channels at a time
