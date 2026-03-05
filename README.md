# MemeSnap — Random Meme Generator

Most meme apps require an account, an API key, or a backend proxy. MemeSnap fetches Reddit's public JSON API directly from the browser — the same feed Reddit serves its own web app, with no authentication required. Open `index.html` and it works.

**[→ Live Demo](https://johnlester-0369.github.io/meme-generator)**

---

## Features

- **Live from Reddit** — real-time posts from a curated list of meme subreddits, fetched on demand
- **Gallery support** — handles both direct image posts and multi-image Reddit galleries (extracts the first frame in gallery order)
- **Rich post metadata** — upvote score, comment count, author, flair badge, and upvote ratio progress bar
- **Lightbox viewer** — click any meme image for full-screen zoom; press `Escape` or click outside to close
- **Share & copy** — Web Share API on mobile with clipboard fallback; shares the Reddit permalink so recipients get full post context
- **Mobile Chrome compatible** — uses Reddit's `raw_json=1` parameter to bypass mobile User-Agent detection that would otherwise return an HTML redirect instead of JSON
- **Zero setup** — no API key, no login, no configuration required

---

## Getting Started

Clone and open directly in your browser — no install step:

```bash
git clone https://github.com/johnlester-0369/meme-generator.git
cd meme-generator
open index.html   # macOS — or double-click index.html in your file explorer
```

Click **Generate Meme**. That's it.

---

## Project Structure

```
meme-generator/
├── index.html        # App shell — HTML structure and markup only
├── css/
│   └── styles.css    # Design tokens (CSS custom properties), component styles, responsive breakpoints
└── js/
    └── app.js        # State, Reddit fetch logic, image extraction, DOM rendering, event handlers
```

Each layer is isolated so it can be read and edited independently — a designer adjusting color tokens never needs to scroll past JavaScript, and a developer debugging fetch logic never needs to wade through CSS selectors.

---

## Architecture

```
          ┌────────────┐
          │   Browser  │
          └──────┬─────┘
                 │
                 ▼
   ┌─────────────────────────────────┐
   │            MemeSnap             │
   │                                 │
   │  index.html     styles.css      │
   │  js/app.js   (state · render)   │
   └──────────────────┬──────────────┘
                      │ GET /r/{sub}.json
                      ▼
   ┌─────────────────────────────────┐
   │        Reddit JSON API          │
   └─────────────────────────────────┘
```

---

## How It Works

1. **Subreddit selection** — a subreddit is chosen at random from the curated list
2. **Fetch** — the app requests `https://www.reddit.com/r/{subreddit}.json?raw_json=1&limit=100` directly from the browser. The `raw_json=1` parameter bypasses Reddit's mobile User-Agent detection; `limit=100` increases the candidate pool to reduce retries on subreddits with low image-post density. No backend proxy is involved.
3. **Filter** — video posts, self-posts, and NSFW content are skipped
4. **Image extraction** — gallery posts use `media_metadata` keyed by the `gallery_data` declaration order; direct posts check `url_overridden_by_dest` for a `.jpg`, `.jpeg`, `.png`, or `.gif` extension
5. **Retry** — if no valid image is found in a response, the app retries up to 10 times across different subreddits
6. **Render** — the selected post is displayed with title, subreddit link, upvote score, comment count, author, flair badge, upvote ratio bar, and a direct link to the Reddit discussion thread

---

## Subreddits

```
dankmemes · memes · meme · dank_meme · shitpost · shitposting
Animemes · HistoryMemes · MemeTemplatesOfficial · Memes_Of_The_Dank
NANIKPosting · PampamilyangPaoLUL
```

To add or remove subreddits, edit the `SUBREDDITS` array at the top of `js/app.js` — it's the only configuration surface in the project.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Markup | Vanilla HTML5 | No build tooling required; the app is a single document |
| Styles | Vanilla CSS with custom properties | Full design token system without a preprocessor or runtime |
| Scripts | Vanilla JS (ES2020+) | No framework overhead for a single-screen, single-state app |
| Icons | [Lucide](https://lucide.dev/) via CDN | Consistent icon set, zero install, UMD build available as a browser global |
| Fonts | [Outfit](https://fonts.google.com/specimen/Outfit) (UI) + [Syne](https://fonts.google.com/specimen/Syne) (meme card titles) via Google Fonts | Outfit for readable interface text; Syne for editorial weight on meme card headings |
| Data | Reddit public JSON API | No auth required, CORS-allowed from the browser, always fresh |

---

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Requires:

- `fetch` API
- CSS custom properties
- `aspect-ratio` CSS property
- `navigator.clipboard` — for copy link; gracefully degrades if unavailable
- `navigator.share` — for native share on mobile; falls back to clipboard copy

> **Mobile Chrome note:** Reddit detects Chrome's mobile User-Agent and responds with an HTML redirect instead of the JSON feed. MemeSnap handles this transparently with the `raw_json=1` query parameter and an `Accept: application/json` header — no action required from the user. Brave on Android uses a modified Chromium fingerprint that Reddit does not flag, so it works without the parameter.

---

## License

MIT
