// client.js - Full feature client (YouTube mini, social embeds, weather, quote, game, chat)
async function loadConfig(){
  try {
    const r = await fetch('/api/config');
    const cfg = await r.json();
    document.getElementById('title').textContent = cfg.appName || 'KisahSuksesPro';
    const vid = cfg.youtubeVideoId;
    if (vid) initYouTubeMini(vid);

    const sw = document.getElementById('social-wrap');
    sw.innerHTML = '';
    if (cfg.social.instagram) {
      const ig = document.createElement('blockquote');
      ig.className = 'instagram-media';
      ig.setAttribute('data-instgrm-permalink', cfg.social.instagram);
      ig.style = "margin:8px 0";
      sw.appendChild(ig);
      // process embed if script already loaded
      if (window.instgrm && window.instgrm.Embeds) window.instgrm.Embeds.process();
    }
    if (cfg.social.twitter) {
      const a = document.createElement('a');
      a.href = cfg.social.twitter;
      a.textContent = 'Twitter';
      a.target = '_blank';
      sw.appendChild(a);
    }
    if (cfg.social.facebook) {
      const f = document.createElement('a');
      f.href = cfg.social.facebook;
      f.textContent = 'Facebook';
      f.target = '_blank';
      sw.appendChild(f);
    }
    if (cfg.social.youtubeChannel) {
      const y = document.createElement('a');
      y.href = cfg.social.youtubeChannel;
      y.textContent = 'YouTube Channel';
      y.target = '_blank';
      sw.appendChild(y);
    }
  } catch (e) {
    console.warn("config load err", e);
  }
}

// YouTube IFrame API
let ytPlayer = null;
function initYouTubeMini(videoId){
  if (!window.YT) {
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  }
  window.onYouTubeIframeAPIReady = () => {
    ytPlayer = new YT.Player('yt-mini', {
      height: '180',
      width: '320',
      videoId: videoId,
      playerVars: { modestbranding:1, playsinline:1, rel:0, controls:1 },
      events: { onReady: ()=>console.log('YT ready') }
    });
  };
  const btn = document.getElementById('yt-play');
  if (btn) btn.addEventListener('click', () => {
    if (!ytPlayer) return;
    const state = ytPlayer.getPlayerState();
    if (state === YT.PlayerState.PLAYING) ytPlayer.pauseVideo();
    else ytPlayer.playVideo();
  });
}

// Chat AI
document.addEventListener('DOMContentLoaded', ()=>{
  const sendBtn = document.getElementById('chat-send');
  if (sendBtn) {
    sendBtn.addEventListener('click', async ()=>{
      const input = document.getElementById('chat-input');
      const msg = input.value.trim();
      if (!msg) return;
      appendChat('You', msg);
      input.value = '';
      const placeholder = appendChat('AI', '...'); // returns element
      try {
        const r = await fetch('/api/chat', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({message:msg})});
        const j = await r.json();
        placeholder.textContent = 'AI: ' + (j.reply || j.error || 'no reply');
      } catch (e) {
        placeholder.textContent = 'AI: Error: ' + e;
      }
    });
  }

  const nextQ = document.getElementById('next-quote');
  if (nextQ) nextQ.addEventListener('click', loadQuote);

  const refreshBtn = document.getElementById('refresh-config');
  if (refreshBtn) refreshBtn.addEventListener('click', ()=>{
    loadConfig();
    loadWeather();
    loadQuote();
  });
});

function appendChat(who, text){
  const el = document.createElement('div');
  el.dataset.role = who.toLowerCase() === 'ai' ? 'ai' : 'user';
  el.textContent = who + ": " + text;
  document.getElementById('chat-log').appendChild(el);
  document.getElementById('chat-log').scrollTop = document.getElementById('chat-log').scrollHeight;
  return el;
}

// Weather
async function loadWeather(){
  try {
    const r = await fetch('/api/weather?city=Jakarta');
    if (r.ok){
      const j = await r.json();
      const t = `${j.name}: ${j.main.temp}°C, ${j.weather?.[0]?.description || ''}`;
      document.getElementById('weather').textContent = t;
    } else {
      document.getElementById('weather').textContent = 'Weather not available';
    }
  } catch(e){
    document.getElementById('weather').textContent = 'Weather error';
  }
}

// Quote
async function loadQuote(){
  try {
    const r = await fetch('/api/quote');
    const j = await r.json();
    document.getElementById('quote').textContent = j.quote || '';
  } catch(e){
    document.getElementById('quote').textContent = 'Quote error';
  }
}

// init
loadConfig();
loadWeather();
loadQuote();
