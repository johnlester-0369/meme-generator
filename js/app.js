// Subreddits chosen for consistently high image-post density and meme relevance;
// keeping this in one place makes curation easy without touching fetch logic
const SUBREDDITS = [
  "dankmemes", "PampamilyangPaoLUL", "NANIKPosting", "memes",
  "MemeTemplatesOfficial", "HistoryMemes", "Memes_Of_The_Dank",
  "meme", "dank_meme", "Animemes", "shitpost", "shitposting"
];

const state = {
  loading: false,
  currentMeme: null, // { title, url, subreddit, score, numComments, author, flair, permalink, upvoteRatio }
};

// DOM refs — captured once at init to avoid repeated querySelector overhead on each render cycle
const memeCard        = document.getElementById('meme-card');
const emptyState      = document.getElementById('empty-state');
const memeImg         = document.getElementById('meme-img');
const memeImageWrap   = document.getElementById('meme-image-wrap');
const imgState        = document.getElementById('img-state');
const memeTitle       = document.getElementById('meme-title');
const memeSubreddit   = document.getElementById('meme-subreddit');
const memeSubLabel    = document.getElementById('meme-subreddit-label');
const memeFlair       = document.getElementById('meme-flair');
const statScoreVal    = document.getElementById('stat-score-val');
const statCommentsVal = document.getElementById('stat-comments-val');
const statAuthorVal   = document.getElementById('stat-author-val');
const ratioFill       = document.getElementById('ratio-fill');
const btnGenerate     = document.getElementById('btn-generate');
const btnLabel        = document.getElementById('btn-label');
const btnCopyLink     = document.getElementById('btn-copy-link');
const btnOpen         = document.getElementById('btn-open');
const btnShare        = document.getElementById('btn-share');
const btnReddit       = document.getElementById('btn-reddit');
const lightbox        = document.getElementById('lightbox');
const lightboxImg     = document.getElementById('lightbox-img');
const lightboxClose   = document.getElementById('lightbox-close');
const toast           = document.getElementById('toast');
const toastMsg        = document.getElementById('toast-msg');

// ── Toast ──────────────────────────────────────────────────────────────────
let toastTimer = null;

function showToast(msg) {
  toastMsg.textContent = msg;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2500);
  lucide.createIcons({ attrs: {}, nameAttr: 'data-lucide', nodes: [toast] });
}

// ── Lightbox ───────────────────────────────────────────────────────────────
function openLightbox(src) {
  lightboxImg.src = src;
  lightbox.classList.add('open');
  // Prevent scroll-behind when lightbox is fullscreen
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

memeImageWrap.addEventListener('click', () => {
  if (state.currentMeme?.url) openLightbox(state.currentMeme.url);
});
lightboxClose.addEventListener('click', (e) => { e.stopPropagation(); closeLightbox(); });
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

// ── Number formatter — keeps big numbers readable (4701 → 4.7K) ──────────
function fmt(n) {
  if (n === undefined || n === null) return '—';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

// ── Render helpers ─────────────────────────────────────────────────────────
function renderLoadingState() {
  imgState.style.display = 'flex';
  imgState.className = 'state-overlay';
  imgState.innerHTML = '<div class="spinner"></div><p>Finding a fresh meme…</p>';
  memeImg.style.opacity = '0';
}

function renderErrorState(message) {
  imgState.style.display = 'flex';
  imgState.className = 'state-overlay error';
  imgState.innerHTML = `<i data-lucide="wifi-off"></i><p>${message}</p>`;
  memeImg.style.opacity = '0';
  lucide.createIcons({ attrs: {}, nameAttr: 'data-lucide', nodes: [imgState] });
}

function renderMeme(meme) {
  emptyState.style.display = 'none';
  memeCard.style.display = 'block';

  memeTitle.textContent = meme.title || 'Untitled Meme';

  // Subreddit link goes straight to the subreddit for discovery
  memeSubLabel.textContent = `r/${meme.subreddit}`;
  memeSubreddit.href = `https://www.reddit.com/r/${meme.subreddit}/`;

  // Flair — only show when present and non-empty
  if (meme.flair) {
    memeFlair.textContent = meme.flair;
    memeFlair.style.display = 'inline-flex';
  } else {
    memeFlair.style.display = 'none';
  }

  statScoreVal.textContent    = fmt(meme.score);
  statCommentsVal.textContent = fmt(meme.numComments);
  statAuthorVal.textContent   = meme.author ? `u/${meme.author}` : '—';

  // Upvote ratio bar gives a quick visual trust signal for post quality
  ratioFill.style.width = `${Math.round((meme.upvoteRatio ?? 0.5) * 100)}%`;

  // Permalink links to the original Reddit discussion thread
  btnReddit.href = meme.permalink ? `https://www.reddit.com${meme.permalink}` : '#';

  lucide.createIcons({ attrs: {}, nameAttr: 'data-lucide', nodes: [memeCard] });

  memeImg.onload  = () => { imgState.style.display = 'none'; memeImg.style.opacity = '1'; };
  memeImg.onerror = () => renderErrorState('Image failed to load');
  memeImg.src     = meme.url;
}

function setLoading(loading) {
  btnGenerate.disabled = loading;
  btnGenerate.classList.toggle('loading', loading);
  btnLabel.textContent = loading ? 'Fetching meme…' : 'Generate Meme';
}

// ── Image URL extraction ───────────────────────────────────────────────────
// Reddit posts come in three shapes:
//   1. Direct image: url_overridden_by_dest ends in .jpg/.jpeg/.png/.gif
//   2. Gallery: is_gallery === true, images in media_metadata ordered by gallery_data.items
//   3. Everything else: video, self-post, external link — skip

function extractImageUrl(post) {
  if (post.is_video || post.is_self || post.over_18) return null;

  // Gallery — use the first image in the declared gallery order, not arbitrary metadata order
  if (post.is_gallery && post.media_metadata && post.gallery_data?.items?.length) {
    const firstItem = post.gallery_data.items[0];
    const meta = post.media_metadata[firstItem.media_id];
    if (meta?.status === 'valid' && meta.s?.u) {
      // Reddit HTML-encodes ampersands in preview URLs
      return meta.s.u.replace(/&amp;/g, '&');
    }
  }

  // Direct image post — url_overridden_by_dest holds the canonical image URL
  const url = post.url_overridden_by_dest || post.url || '';
  if (url.match(/\.(jpg|jpeg|png|gif)(\?|$)/i)) return url;

  return null;
}

// ── Core fetch ─────────────────────────────────────────────────────────────
async function fetchMeme() {
  if (state.loading) return;
  state.loading = true;
  setLoading(true);

  emptyState.style.display = 'none';
  memeCard.style.display = 'block';
  renderLoadingState();

  // Cap at 10 attempts to match the original backend's retry guard, preventing
  // infinite loops when a subreddit returns only video/self posts
  const MAX_ATTEMPTS = 10;
  let attempts = 0;

  while (attempts < MAX_ATTEMPTS) {
    attempts++;
    try {
      const src = SUBREDDITS[Math.floor(Math.random() * SUBREDDITS.length)];
      // raw_json=1 bypasses Reddit's mobile User-Agent detection — without it,
      // Chrome on Android receives an HTML redirect instead of JSON, causing
      // res.json() to throw and silently exhaust all retry attempts.
      // Accept header reinforces to Reddit's CDN that this is a programmatic
      // API call, not browser navigation, preventing the mobile web redirect.
      const res = await fetch(`https://www.reddit.com/r/${src}.json?raw_json=1&limit=100`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const dat = await res.json();

      // Build a candidate pool from all posts that have extractable images
      const candidates = dat.data.children
        .map(({ data }) => ({ data, url: extractImageUrl(data) }))
        .filter(({ url }) => !!url);

      if (!candidates.length) continue;

      const { data: post, url } = candidates[Math.floor(Math.random() * candidates.length)];

      state.currentMeme = {
        title:       post.title,
        url,
        subreddit:   post.subreddit || src,
        score:       post.score,
        numComments: post.num_comments,
        author:      post.author,
        flair:       post.link_flair_text || null,
        permalink:   post.permalink || null,
        upvoteRatio: post.upvote_ratio ?? null,
      };
      renderMeme(state.currentMeme);
      break;

    } catch (err) {
      console.warn(`[MemeSnap] attempt ${attempts} failed:`, err);
      if (attempts >= MAX_ATTEMPTS) {
        renderErrorState('Could not load meme — try again');
      }
    }
  }

  state.loading = false;
  setLoading(false);
}

// ── Card actions ───────────────────────────────────────────────────────────
btnCopyLink.addEventListener('click', async () => {
  if (!state.currentMeme?.url) return;
  try {
    await navigator.clipboard.writeText(state.currentMeme.url);
    showToast('Image link copied');
  } catch {
    showToast('Could not copy — try manually');
  }
});

btnOpen.addEventListener('click', () => {
  if (!state.currentMeme?.url) return;
  window.open(state.currentMeme.url, '_blank', 'noopener,noreferrer');
});

btnShare.addEventListener('click', async () => {
  if (!state.currentMeme) return;
  // Share the Reddit post link so recipients get full context, not just a raw image
  const shareUrl = state.currentMeme.permalink
    ? `https://www.reddit.com${state.currentMeme.permalink}`
    : state.currentMeme.url;
  if (navigator.share) {
    try {
      await navigator.share({ title: state.currentMeme.title, url: shareUrl });
    } catch { /* dismissed by user — not an error */ }
  } else {
    await navigator.clipboard.writeText(shareUrl).catch(() => {});
    showToast('Link copied (share not supported here)');
  }
});

btnGenerate.addEventListener('click', fetchMeme);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});
