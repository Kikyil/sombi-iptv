import { showToast, debounce, VirtualScroller, scrollToTop } from './utils.js';
import { loadFeed, inferCategory } from './parser.js';
import { 
  initPlayer, playChannel, playChannelByObject, cyclePlaybackMode, 
  enterPictureInPictureAndBrowse, fullExitPlayer, setQuality 
} from './player.js';

// ======================== CONFIG & STATE ========================
export const REGISTRY = {
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
  {title:'🔥 Breaking News', url:REGISTRY.categories[1].url, keywords:['CNN','BBC','Fox','Al Jazeera','Sky News','ABC','CBS']},
  {title:'⚡ Live Sports', url:REGISTRY.categories[0].url, keywords:['ESPN','Fox Sports','beIN','Sky Sports','NFL','NBA']},
  {title:'🎬 Cinema & Movies', url:REGISTRY.categories[2].url, keywords:['Movie','HBO','Cinemax','Film','Starz']},
  {title:'🎶 Music & Events', url:REGISTRY.categories[4].url, keywords:['MTV','VH1','Music','Hits','BET']}
];

let channelsMaster = [];
let favorites = JSON.parse(localStorage.getItem('iptvFavs') || '[]');
let watchHistory = JSON.parse(localStorage.getItem('iptvHistory') || '[]');
let drawerScroller = null;

// DOM elements
let railsContainer, heroSection, heroLogo, heroTitle, heroPlay;
let searchMobile, searchDesktop, modeBtnMobile, modeBtnDesktop, playerModeBtn;
let homeView;

// ======================== CARD HTML ========================
function isFav(url) { return favorites.includes(url); }

function cardHTML(ch) {
  const favActive = isFav(ch.url);
  const escapedUrl = encodeURIComponent(ch.url);
  const escapedObj = encodeURIComponent(JSON.stringify(ch));
  return `<div class='channel-card relative'><button class='fav-btn absolute top-2 right-2 z-10' onclick="event.stopPropagation();window.toggleFav('${escapedUrl}', this)">${favActive ? '❤️' : '🤍'}</button><div onclick="window.playChannelByObject('${escapedObj}')" class="cursor-pointer"><div class='h-24 flex items-center justify-center mb-2 bg-black/40 rounded-xl p-1'><img src='${ch.logo || 'https://cdn-icons-png.flaticon.com/512/2333/2333216.png'}' class='max-h-16 object-contain' onerror="this.src='https://cdn-icons-png.flaticon.com/512/2333/2333216.png'"></div><div class='font-semibold text-sm truncate px-1'>${ch.name.substring(0, 32)}</div><div class='mt-2'><span class='cat-pill text-[10px]'>${inferCategory(ch)}</span></div></div></div>`;
}

// ======================== RENDERING ========================
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

// ======================== HISTORY ========================
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

export function clearHistory() {
  watchHistory = [];
  localStorage.setItem('iptvHistory', JSON.stringify(watchHistory));
  showToast('History cleared', false, 2500);
  showHistory();
}

// ======================== HOME BUILD ========================
async function buildHome() {
  heroSection.style.display = 'flex';
  railsContainer.innerHTML = '';
  scrollToTop();
  try {
    const featuredFeed = await loadFeed(REGISTRY.categories[0].url);
    if (featuredFeed.length) {
      heroLogo.src = featuredFeed[0].logo || 'https://cdn-icons-png.flaticon.com/512/2333/2333216.png';
      heroTitle.innerText = featuredFeed[0].name;
      heroPlay.onclick = () => playChannel(featuredFeed[0], addToHistory);
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

// ======================== PANEL MANAGEMENT ========================
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
  else openPanelAndCloseOthers('qualityPanel');
};

window.openPanel = function(type, btn) {
  document.querySelectorAll('.navtab').forEach(x => x.classList.remove('active'));
  if(btn) btn.classList.add('active');
  document.getElementById('panelTitle').innerText = type.toUpperCase();
  const contentDiv = document.getElementById('panelContent');
  contentDiv.innerHTML = REGISTRY[type].map(i => `<div onclick="loadSection('${type}','${i.label}','${i.url}'); closeAllPanels();" class='p-4 mb-3 rounded-2xl bg-zinc-800/70 hover:bg-zinc-700 cursor-pointer transition'>${i.label}</div>`).join('');
  openPanelAndCloseOthers('browserPanel');
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
  if (active && (active.innerText.includes('Fav') || active.innerText.includes('❤️') || active.getAttribute('data-nav') === 'favorites')) showFavorites();
};

async function showFavorites(btn) {
  if (btn) { document.querySelectorAll('.navtab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); }
  document.querySelectorAll('.sidebar-item, .mobile-nav-item').forEach(t => t.classList.remove('active'));
  document.querySelectorAll(`[data-nav="favorites"]`).forEach(t => t.classList.add('active'));
  heroSection.style.display = 'none';
  scrollToTop();
  let favStreams = [];
  if (channelsMaster.length) { favStreams = channelsMaster.filter(c => favorites.includes(c.url)); }
  else { favStreams = watchHistory.filter(c => favorites.includes(c.url)).map(h => ({...h})); if (favStreams.length === 0) { const fallbackFeed = await loadFeed(REGISTRY.categories[1].url); favStreams = fallbackFeed.filter(c => favorites.includes(c.url)); } }
  if (favStreams.length === 0) { railsContainer.innerHTML = `<div class="p-10 text-center text-zinc-400 flex flex-col items-center gap-3"><span>💔</span><p>No favorites yet. Click ♡ on any channel to add.</p></div>`; return; }
  renderGrid(favStreams, '⭐ My Favorite Channels');
}

function showHistory(btn) {
  if (btn) { document.querySelectorAll('.navtab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); }
  document.querySelectorAll('.sidebar-item, .mobile-nav-item').forEach(t => t.classList.remove('active'));
  document.querySelectorAll(`[data-nav="history"]`).forEach(t => t.classList.add('active'));
  heroSection.style.display = 'none';
  scrollToTop();
  if (watchHistory.length === 0) {
    railsContainer.innerHTML = `<div class="p-10 text-center text-zinc-400 flex flex-col items-center gap-3"><span>🕘</span><p>No watch history yet. Start watching channels!</p><button onclick="clearHistory()" class="mt-4 bg-zinc-800 px-4 py-2 rounded-full text-sm">Clear History</button></div>`;
    return;
  }
  renderGrid(watchHistory.map(h => ({ ...h })), '🕘 Recently Watched');
}

// ======================== BROWSING ========================
async function loadSection(type, label, url) {
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
}

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

// ======================== SEARCH ========================
const debouncedSearch = debounce((value) => {
  if (!channelsMaster.length) return;
  if (!value) { if (heroSection.style.display !== 'flex') renderGrid(channelsMaster, 'Browse', true); return; }
  const filtered = channelsMaster.filter(c => c.name.toLowerCase().includes(value.toLowerCase()));
  renderGrid(filtered, `🔍 Results: ${filtered.length}`);
}, 250);

function handleSearch(value) { debouncedSearch(value); }

// ======================== NAVIGATION ========================
function setActiveNav(navId) {
  document.querySelectorAll('.sidebar-item, .mobile-nav-item, .navtab').forEach(el => el.classList.remove('active'));
  document.querySelectorAll(`[data-nav="${navId}"]`).forEach(el => el.classList.add('active'));
  if (navId === 'home') { buildHome(); heroSection.style.display = 'flex'; channelsMaster = []; if(searchMobile) searchMobile.value = ''; if(searchDesktop) searchDesktop.value = ''; }
  else if (navId === 'categories') window.openPanel('categories');
  else if (navId === 'countries') window.openPanel('countries');
  else if (navId === 'languages') window.openPanel('languages');
  else if (navId === 'favorites') showFavorites();
  else if (navId === 'history') showHistory();
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
        else if (navId === 'favorites') showFavorites();
        else if (navId === 'history') showHistory();
        else if (channelsMaster.length && navId !== 'home') renderGrid(channelsMaster, 'Browse', true);
      }
    }
  });
}

// ======================== INITIALIZATION ========================
document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  railsContainer = document.getElementById('railsContainer');
  heroSection = document.getElementById('heroSection');
  heroLogo = document.getElementById('heroLogo');
  heroTitle = document.getElementById('heroTitle');
  heroPlay = document.getElementById('heroPlay');
  searchMobile = document.getElementById('searchMobile');
  searchDesktop = document.getElementById('searchDesktop');
  modeBtnMobile = document.getElementById('modeBtnMobile');
  modeBtnDesktop = document.getElementById('modeBtnDesktop');
  playerModeBtn = document.getElementById('playerModeBtn');
  homeView = document.getElementById('homeView');
  
  // Initialize player
  initPlayer({ onClose: () => buildHome() });
  
  // Setup search
  if (searchMobile) searchMobile.addEventListener('input', (e) => handleSearch(e.target.value));
  if (searchDesktop) searchDesktop.addEventListener('input', (e) => handleSearch(e.target.value));
  
  // Setup cyclePlaybackMode globally
  window.cyclePlaybackMode = () => cyclePlaybackMode(modeBtnDesktop, modeBtnMobile, playerModeBtn);
  
  // Setup playChannelByObject
  window.playChannelByObject = (str) => {
    const ch = JSON.parse(decodeURIComponent(str));
    playChannel(ch, addToHistory);
  };
  
  // Setup fullExitPlayer
  window.fullExitPlayer = fullExitPlayer;
  
  // Setup PiP button
  const pipBackBtn = document.getElementById('pipBackBtn');
  if (pipBackBtn) {
    pipBackBtn.onclick = () => enterPictureInPictureAndBrowse(() => buildHome());
  }
  
  // Setup exit button
  const exitPlayerBtn = document.getElementById('exitPlayerBtn');
  if (exitPlayerBtn) exitPlayerBtn.onclick = () => fullExitPlayer();
  
  // Setup goHomeTab
  window.goHomeTab = (btn) => {
    if (document.getElementById('playerView')?.classList.contains('hidden') === false) {
      fullExitPlayer();
    }
    document.querySelectorAll('.navtab').forEach(x => x.classList.remove('active'));
    if(btn) btn.classList.add('active');
    buildHome();
    channelsMaster = [];
    if(searchMobile) searchMobile.value = '';
    if(searchDesktop) searchDesktop.value = '';
    heroSection.style.display = 'flex';
  };
  
  // Setup clearHistory
  window.clearHistory = clearHistory;
  
  // Event binding for sidebar and mobile nav
  document.querySelectorAll('.sidebar-item[data-nav]').forEach(el => {
    el.addEventListener('click', () => { setActiveNav(el.getAttribute('data-nav')); if(window.innerWidth<1024) document.getElementById('sidebar')?.classList.remove('open'); });
  });
  document.querySelectorAll('.mobile-nav-item').forEach(el => {
    el.addEventListener('click', () => setActiveNav(el.getAttribute('data-nav')));
  });
  document.getElementById('menuToggleBtn')?.addEventListener('click', () => document.getElementById('sidebar')?.classList.add('open'));
  document.getElementById('closeSidebarBtn')?.addEventListener('click', () => document.getElementById('sidebar')?.classList.remove('open'));
  document.getElementById('sidebarOverlay')?.addEventListener('click', () => document.getElementById('sidebar')?.classList.remove('open'));
  
  // Initialize dark mode and home
  initDarkMode();
  setActiveNav('home');
});

// Expose necessary functions globally
window.showFavorites = showFavorites;
window.showHistory = showHistory;
window.loadSection = loadSection;