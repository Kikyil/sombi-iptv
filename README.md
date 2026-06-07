# 📺 SOMBI IPTV

A premium, browser-based IPTV player with HLS streaming, favorites, watch history, Picture-in-Picture support, and a responsive sidebar interface.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Web-lightgrey)

## ✨ Features

### Core Player
- **HLS.js streaming** – Play `.m3u8` playlists from any IPTV source
- **Quality selection** – Auto, 360p, 720p, 1080p (depending on stream)
- **Picture-in-Picture (PiP)** – Watch while browsing other content, with automatic resume
- **EPG guide** – Simple program information display

### Content Browsing
- **Categories** – Sports, News, Movies, Series, Music
- **Countries** – Nigeria, USA, UK, France, Germany
- **Languages** – English, Spanish, Hausa, French, Arabic
- **Search** – Debounced (250ms) real‑time filtering
- **Favorites** – Save channels with persistent localStorage
- **Watch History** – Last 50 watched channels with timestamps

### UI & Experience
- **Responsive design** – Desktop sidebar + mobile bottom navigation
- **Light / Dark mode** – System preference aware, manually toggleable
- **Virtual scrolling** – Channel drawer renders only ~15 items at a time (from 350+)
- **Document fragments** – Efficient DOM updates with minimal reflow
- **Single panel management** – Only one drawer open at a time, Escape key closes

### Performance Optimizations
| Optimization | Before | After |
|--------------|--------|-------|
| Channel drawer DOM nodes | 350+ | ~15 |
| Search responsiveness | Stutters on every keystroke | Smooth, 250ms debounce |
| Grid rendering | Multiple layout thrashing | Single fragment append |
| PiP restore | Video stops | Automatic resume |

## 🚀 Quick Start

### Local Usage
1. Download `index.html`, `style.css`, and `script.js`
2. Place them in the same folder
3. Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari)

### Hosting
Simply upload all three files to any static web server (GitHub Pages, Netlify, Vercel, etc.)

### Default IPTV Sources
The player uses free test playlists from [iptv-org](https://github.com/iptv-org/iptv):
- Sports: `https://iptv-org.github.io/iptv/categories/sports.m3u`
- News: `https://iptv-org.github.io/iptv/categories/news.m3u`
- Movies: `https://iptv-org.github.io/iptv/categories/movies.m3u`
- Countries & Languages – similarly structured

> 💡 **Note**: Some streams may be geo‑restricted or temporarily offline. You can modify the `REGISTRY` object in `script.js` to add your own `.m3u` URLs.

## 📁 File Structure
sombi-iptv/
- index.html # HTML structure
- style.css # All styles (light/dark, responsive, virtual scroller)
- script.js # Application logic (HLS, UI, virtual scroll, panels)

## Version 1.0.0 Release - May 5, 2026


## 🛠️ Technical Stack

- **HTML5 / CSS3 / TailwindCSS** – Utility‑first styling
- **JavaScript (ES6+)** – Core logic, virtual scroller, debounce
- **HLS.js** – HTTP Live Streaming player
- **LocalStorage** – Persist favorites, history, theme preference

## 🧪 Browser Support

| Browser | Version |
|---------|---------|
| Chrome  | 90+     |
| Firefox | 88+     |
| Edge    | 90+     |
| Safari  | 14+ (PiP requires Safari 13+) |


## 📝 Commit History (Initial Development)

> 💡 **Live commit history**: https://github.com/Kikyil/sombi-iptv/commits/main

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT License – free for personal and commercial use. – See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [iptv-org](https://github.com/iptv-org/iptv) for free test playlists
- [HLS.js](https://github.com/video-dev/hls.js) for HLS playback
- [TailwindCSS](https://tailwindcss.com) for rapid styling

---

**Made with 🧡 for IPTV enthusiasts**



