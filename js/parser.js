import { showToast } from './utils.js';

// ======================== M3U PARSER ========================

export function parseM3U(text) {
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
      current = {
        name: name.trim(),
        logo: logoMatch ? logoMatch[1] : '',
        group: groupMatch ? groupMatch[1] : 'General',
        url: ''
      };
    } else if (line.startsWith('http') && current) {
      current.url = line;
      items.push({ ...current });
      current = null;
    }
  }
  return items;
}

export async function loadFeed(url) {
  try {
    const resp = await fetch(url);
    const txt = await resp.text();
    return parseM3U(txt);
  } catch(e) {
    showToast(`⚠️ Network error`, true, 5000);
    return [];
  }
}

// Infer category from channel data
export function inferCategory(ch) {
  return ch.group && ch.group !== 'General' 
    ? ch.group 
    : (ch.name.includes('Sport') ? 'Sports' 
      : (ch.name.includes('News') ? 'News' : 'Entertainment'));
}